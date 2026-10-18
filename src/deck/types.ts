/** A slide exported from Figma Slides, shown as an image. */
export interface FigmaSlide {
  id: string;
  kind: "figma";
  /** Figma node id, e.g. "12:34". */
  nodeId: string;
  name: string;
  /** Image URL: a temporary Figma export URL in the builder, a bundled asset in a published deck. */
  image: string;
  /** Left out of the published deck. */
  hidden?: boolean;
  /**
   * Set while showing the deck with live Figma slides: Figma's own embed of this slide, drawn
   * over the image. Not stored; it's worked out from the deck's Figma file.
   */
  embedUrl?: string;
}

/** A live web page shown in an iframe so the audience can use it. */
export interface WebSlide {
  id: string;
  kind: "web";
  /** An absolute URL, or `sandbox:/<slug>/` for a page in this Sandbox. */
  url: string;
  title: string;
}

export type Slide = FigmaSlide | WebSlide;

export interface Deck {
  version: 1;
  name: string;
  slug: string;
  createdAt: string;
  source: { figmaUrl: string; fileKey: string } | null;
  /** Figma slides show as Figma's live embed (over their image) instead of the image alone. */
  figmaLive?: boolean;
  slides: Slide[];
}

const EMBED_HOST = "helenhsong-sandbox";

/**
 * Figma's embed of one slide: no Figma toolbar or page list, and no moving to other slides
 * inside it (the deck does that). Older drafts without real node IDs can't link to a slide.
 */
export function figmaEmbedUrl(figmaUrl: string, fileKey: string, nodeId: string) {
  if (!fileKey || !nodeId || nodeId.startsWith("slide-")) return undefined;
  const type = /figma\.com\/deck\//.test(figmaUrl) ? "deck" : "slides";
  const params = new URLSearchParams({
    "embed-host": EMBED_HOST,
    "node-id": nodeId.replace(":", "-"),
    footer: "false",
    "viewport-controls": "false",
    "page-selector": "false",
  });
  return `https://embed.figma.com/${type}/${fileKey}?${params}`;
}

/** Adds Figma's live embed to each Figma slide, for decks set to live Figma slides. */
export function withFigmaEmbeds(slides: Slide[], source: Deck["source"]) {
  if (!source) return slides;
  return slides.map((slide) =>
    slide.kind === "figma" ? { ...slide, embedUrl: figmaEmbedUrl(source.figmaUrl, source.fileKey, slide.nodeId) } : slide,
  );
}

/** Slides that stay loaded once shown (live pages and live Figma slides), so nothing restarts going back. */
export function isPersistent(slide: Slide) {
  return slide.kind === "web" || Boolean(slide.embedUrl);
}

export const SANDBOX_PREFIX = "sandbox:";

/** Turns a stored slide URL into one an iframe can load. Sandbox pages resolve against the current site. */
export function resolveUrl(url: string) {
  if (url.startsWith(SANDBOX_PREFIX)) {
    return `${import.meta.env.BASE_URL}${url.slice(SANDBOX_PREFIX.length).replace(/^\/+/, "")}`;
  }
  return url;
}

/** Short label for where a web slide points, e.g. "example.com" or "Sandbox · tester-2". */
export function urlLabel(url: string) {
  if (url.startsWith(SANDBOX_PREFIX)) {
    return `Sandbox · ${url.slice(SANDBOX_PREFIX.length).replace(/^\/+|\/+$/g, "")}`;
  }
  try {
    const parsed = new URL(url);
    const path = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "");
    return `${parsed.host}${path}`;
  } catch {
    return url;
  }
}

/** Deck Builder keeps slide images in browser storage; until one is read, its reference starts with "idb:". */
export function isImageLoading(image: string) {
  return image.startsWith("idb:");
}

/** Slides that appear when presenting. */
export function visibleSlides(slides: Slide[]) {
  return slides.filter((slide) => !(slide.kind === "figma" && slide.hidden));
}
