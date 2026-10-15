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
  slides: Slide[];
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
