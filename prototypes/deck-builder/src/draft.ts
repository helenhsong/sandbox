import registry from "../../../projects.json";
import type { FigmaSlide, Slide, WebSlide } from "../../../src/deck/types";

export interface Draft {
  figmaUrl: string;
  fileKey: string;
  /** The Figma file's own name, shown with it under Add slide. */
  figmaName?: string;
  /** The Figma file's version when its slide images were last made, so edits since are noticed. */
  figmaStamp?: string;
  name: string;
  slug: string;
  /** Once the URL name is edited by hand, renaming the deck no longer changes it. */
  slugEdited: boolean;
  /** Figma slides show as Figma's live embed rather than images. Unset means yes. */
  figmaLive?: boolean;
  slides: Slide[];
}

/** Whether the deck shows its Figma slides live (the default) or as images. */
export const isFigmaLive = (draft: Pick<Draft, "figmaLive">) => draft.figmaLive !== false;

export const DRAFT_KEY = "deck-builder:draft";
const TOKEN_KEY = "deck-builder:figma-token";

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage is unavailable (private window); the draft just won't survive a reload.
  }
}

/** A new deck: no name yet, no slides. Slides come from Add slide (Figma or live pages). */
export const emptyDraft = (): Draft => ({ figmaUrl: "", fileKey: "", name: "", slug: "", slugEdited: false, slides: [] });

export function loadDraft(): Draft {
  const raw = read(DRAFT_KEY);
  if (!raw) return emptyDraft();
  try {
    const draft = JSON.parse(raw) as Draft;
    return Array.isArray(draft.slides) ? draft : emptyDraft();
  } catch {
    return emptyDraft();
  }
}

export const saveDraft = (draft: Draft) => write(DRAFT_KEY, JSON.stringify(draft));
export const loadToken = () => read(TOKEN_KEY) ?? "";
export const saveToken = (token: string) => write(TOKEN_KEY, token || null);

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

const pluralRules = new Intl.PluralRules("en-US");
const numberFormat = new Intl.NumberFormat("en-US");

/** "1 slide", "3 slides". */
export function plural(count: number, one: string, other: string) {
  return `${numberFormat.format(count)} ${pluralRules.select(count) === "one" ? one : other}`;
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

let counter = 0;
export function newWebSlide(url: string, title: string): WebSlide {
  counter += 1;
  return { id: `web-${Date.now().toString(36)}-${counter}`, kind: "web", url, title };
}

/**
 * Applies freshly loaded Figma slides to an existing playlist, matched by Figma node ID.
 * Figma slides always follow Figma's order. Each live page stays after the Figma slide it
 * followed; if that slide was deleted in Figma, the live page moves to the end. Hidden
 * slides stay hidden.
 */
export function mergeFigmaSlides(currentSlides: Slide[], incoming: FigmaSlide[]) {
  // Drafts loaded before slides had real Figma IDs used "slide-N"; match those by position once.
  let figmaIndex = 0;
  const current: Slide[] = currentSlides.map((slide) => {
    if (slide.kind !== "figma") return slide;
    const match = incoming[figmaIndex++];
    return slide.nodeId.startsWith("slide-") && match && !match.nodeId.startsWith("slide-") ? { ...slide, nodeId: match.nodeId } : slide;
  });
  const hidden = new Set(current.filter((s): s is FigmaSlide => s.kind === "figma" && Boolean(s.hidden)).map((s) => s.nodeId));
  // Presenter notes are written here, not in Figma, so they stay with their slide.
  const notes = new Map(current.flatMap((s) => (s.kind === "figma" && s.notes ? [[s.nodeId, s.notes] as const] : [])));
  // Slides already in the deck keep their IDs, so the selection and loaded previews stay put.
  const existingIds = new Map(current.filter((s): s is FigmaSlide => s.kind === "figma").map((s) => [s.nodeId, s.id]));
  const anchored = new Map<string | null, WebSlide[]>();
  let anchor: string | null = null;
  for (const slide of current) {
    if (slide.kind === "figma") anchor = slide.nodeId;
    else anchored.set(anchor, [...(anchored.get(anchor) ?? []), slide]);
  }

  const result: Slide[] = [...(anchored.get(null) ?? [])];
  const placed = new Set<string | null>([null]);
  for (const slide of incoming) {
    const id = existingIds.get(slide.nodeId) ?? slide.id;
    const kept = { ...slide, id, notes: notes.get(slide.nodeId) };
    result.push(hidden.has(slide.nodeId) ? { ...kept, hidden: true } : kept);
    result.push(...(anchored.get(slide.nodeId) ?? []));
    placed.add(slide.nodeId);
  }
  for (const [key, pages] of anchored) if (!placed.has(key)) result.push(...pages);
  return result;
}

/** Moves the slide at `from` so it ends up at index `to` of the resulting list. */
export function moveItem<T>(list: T[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(Math.min(Math.max(to, 0), next.length), 0, item);
  return next;
}

/**
 * Opens a link in a new tab. Where new tabs are blocked (like the Claude app's preview pane),
 * opens it here instead; the draft is saved, so coming back with Back loses nothing.
 */
export function openLink(href: string) {
  const url = new URL(href, window.location.href).href;
  const tab = window.open(url, "_blank");
  if (tab) tab.opener = null;
  else window.location.assign(url);
}

/** Where "Open in Figma" goes: the slide itself when its node is known, otherwise the deck. */
export function figmaSlideLink(draft: Pick<Draft, "fileKey" | "figmaUrl">, slide: FigmaSlide) {
  if (!draft.fileKey || slide.nodeId.startsWith("slide-")) return draft.figmaUrl || null;
  return `https://www.figma.com/slides/${draft.fileKey}/?node-id=${encodeURIComponent(slide.nodeId.replace(":", "-"))}`;
}

/** Normalizes what someone typed into a URL field. Sandbox links stay relative to the site. */
export function normalizeUrl(input: string) {
  const value = input.trim();
  if (!value) return "";
  if (value.startsWith("sandbox:")) return value;
  const sandboxMatch = /^(?:https?:\/\/)?(?:www\.)?helenhsong\.(?:com|github\.io)\/sandbox\/([a-z0-9-]+)\/?(.*)$/.exec(value);
  if (sandboxMatch && sandboxProjects.some((project) => project.slug === sandboxMatch[1])) {
    return `sandbox:/${sandboxMatch[1]}/${sandboxMatch[2]}`;
  }
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

/** How a stored URL reads in a text field: Sandbox links show their public address. */
export function displayUrl(url: string) {
  if (!url.startsWith("sandbox:")) return url;
  return `https://helenhsong.com/sandbox/${url.slice("sandbox:".length).replace(/^\/+/, "")}`;
}

export function isValidUrl(url: string) {
  if (url.startsWith("sandbox:")) return url.length > "sandbox:/".length;
  try {
    const parsed = new URL(url);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") && parsed.hostname.includes(".");
  } catch {
    return false;
  }
}

export interface SandboxProject {
  name: string;
  slug: string;
  path?: string;
  createdAt: string;
}

/**
 * Reads the link field: a Sandbox project's name becomes a link to that project,
 * anything else is treated as a web address.
 */
export function resolveLink(text: string): { url: string; projectName?: string } {
  const value = text.trim();
  const project = sandboxProjects.find((candidate) => candidate.name.toLowerCase() === value.toLowerCase());
  if (project) return { url: `sandbox:/${project.slug}/`, projectName: project.name };
  return { url: normalizeUrl(value) };
}

/** What the link field shows for a stored URL: the project's name for Sandbox pages. */
export function linkText(url: string) {
  if (url.startsWith("sandbox:")) {
    const slug = url.slice("sandbox:".length).split("/").filter(Boolean)[0];
    const project = sandboxProjects.find((candidate) => candidate.slug === slug);
    if (project && url.replace(/\/+$/, "") === `sandbox:/${slug}`) return project.name;
  }
  return displayUrl(url);
}

/** Sandbox prototypes that can go into a deck, newest first. */
export const sandboxProjects = (registry.projects as SandboxProject[])
  .filter((project) => project.path)
  .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
