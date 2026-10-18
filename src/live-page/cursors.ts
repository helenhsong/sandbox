/*
 * The presenter's cursor as drawn over a mirrored live page (see mirror.ts): macOS-style
 * cursors in cursors/, one per CSS cursor value. Each is 28 × 28 (a few are taller), and its hot
 * spot (the arrow's tip, the fingertip, the middle of the rest) is where the mouse is.
 */
const files = import.meta.glob("./cursors/*.svg", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

export type CursorName =
  | "default"
  | "pointer"
  | "text"
  | "crosshair"
  | "move"
  | "grab"
  | "grabbing"
  | "wait"
  | "context-menu"
  | "col-resize"
  | "row-resize"
  | "n-resize"
  | "s-resize"
  | "e-resize"
  | "w-resize"
  | "ns-resize"
  | "ew-resize"
  | "nesw-resize"
  | "nwse-resize"
  | "zoom-in"
  | "zoom-out";

/** Where the mouse sits on each cursor image, in its own pixels. */
const HOT_SPOTS: Partial<Record<CursorName, [number, number]>> = {
  default: [14, 13],
  "context-menu": [14, 13],
  pointer: [15, 13],
};

export function cursorImage(name: CursorName) {
  return { src: files[`./cursors/${name}.svg`] ?? files["./cursors/default.svg"], hotSpot: HOT_SPOTS[name] ?? [14, 14] };
}

/** CSS cursor values, as the image that stands for each. */
const ALIASES: Record<string, CursorName> = {
  "vertical-text": "text",
  "all-scroll": "move",
  progress: "wait",
  "ne-resize": "nesw-resize",
  "sw-resize": "nesw-resize",
  "nw-resize": "nwse-resize",
  "se-resize": "nwse-resize",
  cell: "crosshair",
};

const NAMES = new Set<string>(Object.keys(files).map((path) => path.slice("./cursors/".length, -".svg".length)));

/** The cursor a page shows at a point, from the CSS of the element there. */
export function cursorAt(doc: Document, x: number, y: number): CursorName {
  const element = doc.elementFromPoint(x, y);
  if (!element) return "default";
  const value = (doc.defaultView?.getComputedStyle(element).cursor ?? "auto").split(",").pop()!.trim();
  if (value === "auto") {
    // The browser's own choice: a text cursor over fields and editable text, an arrow elsewhere.
    const typing = element.closest(
      "input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=range]):not([type=color]), textarea, [contenteditable=true], [contenteditable='']",
    );
    return typing ? "text" : "default";
  }
  if (ALIASES[value]) return ALIASES[value];
  return NAMES.has(value) ? (value as CursorName) : "default";
}
