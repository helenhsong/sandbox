import type { FigmaSlide } from "../../../src/deck/types";
import { putImages } from "./imageStore";

/** Pulls the file key out of any Figma link: /slides/, /deck/, /design/, /file/ or /proto/. */
export function parseFigmaUrl(input: string) {
  const match = /figma\.com\/(?:slides|deck|design|file|proto)\/([A-Za-z0-9]{10,})/.exec(input.trim());
  return match ? match[1] : null;
}

export class FigmaError extends Error {}

async function figmaGet<T>(path: string, token: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`https://api.figma.com${path}`, { headers: { "X-Figma-Token": token } });
  } catch {
    // Blocked in this browser; the local dev server can make the request instead.
    if (!import.meta.env.DEV) throw new FigmaError("Couldn't reach Figma. Check your connection and try again.");
    try {
      response = await fetch(`/__deck-builder/figma?path=${encodeURIComponent(path)}`, { headers: { "X-Figma-Token": token } });
    } catch {
      throw new FigmaError("Couldn't reach Figma. Check your connection and try again.");
    }
  }
  if (response.status === 403) throw new FigmaError("Figma refused the token. Check that it's current and can read file content.");
  if (response.status === 404) throw new FigmaError("Figma couldn't find that file. Check the link, and that your account can open it.");
  if (response.status === 429) throw new FigmaError("Figma is rate-limiting requests. Wait a minute and try again.");
  if (!response.ok) throw new FigmaError(`Figma returned an error (${response.status}). Try again.`);
  return (await response.json()) as T;
}

/*
 * Figma's REST API can't read the contents of a Slides file (it answers "File type not
 * supported"), but it can render the file's slide grid. Slides are opaque and the gaps
 * between them transparent, so each slide can be found in the render and cut out.
 *
 * Primary path: the grid's SVG export carries each slide's node ID and name, so each slide
 * is then exported on its own at 2x (3840×2160), exactly as Figma draws it.
 *
 * Fallbacks, if the slides can't be listed: cut the slides out of an SVG render of the
 * whole grid, then out of a PNG render (capped at 32 megapixels, so blurrier for big decks).
 */

const PAGE_IDS = ["0:1", "0:0"];
/** Each slide comes out at this many times its size in Figma: 3840×2160 for a standard slide. */
const OUTPUT_SCALE = 2;
/** Widest render used to find where the slides are. */
const DETECT_WIDTH = 4000;
const PNG_PROBE_SCALE = 0.1;
/** Figma scales PNG renders above 32 megapixels down; stay under it so the math holds. */
const PNG_MAX_PIXELS = 30_000_000;

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

async function renderUrl(fileKey: string, token: string, format: "svg" | "png", scale = 1) {
  const options = format === "svg" ? "format=svg&svg_outline_text=true&svg_include_id=false" : `format=png&scale=${scale}`;
  for (const id of PAGE_IDS) {
    const result = await figmaGet<{ err: string | null; images: Record<string, string | null> }>(
      `/v1/images/${fileKey}?ids=${encodeURIComponent(id)}&${options}`,
      token,
    );
    if (result.err) throw new FigmaError(`Figma couldn't render the slides: ${result.err}`);
    const url = result.images[id];
    if (url) return url;
  }
  throw new FigmaError("Figma couldn't render that file. Check that the link is to a Figma Slides deck.");
}

function loadImage(url: string, crossOrigin = true) {
  return new Promise<HTMLImageElement>((done, fail) => {
    const image = new Image();
    if (crossOrigin) image.crossOrigin = "anonymous";
    image.onload = () => done(image);
    image.onerror = () => fail(new FigmaError("Couldn't draw the slides Figma rendered. Try again."));
    image.src = url;
  });
}

function alphaOf(image: CanvasImageSource, sx: number, sy: number, width: number, height: number, threshold = 8) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.drawImage(image, sx, sy, width, height, 0, 0, width, height);
  const data = context.getImageData(0, 0, width, height).data;
  return (x: number, y: number) => data[(y * width + x) * 4 + 3] > threshold;
}

/** Runs of `true` at least `min` long, as [start, end) pairs. */
function runs(flags: boolean[], min: number) {
  const found: Array<[number, number]> = [];
  let start = -1;
  flags.forEach((flag, i) => {
    if (flag && start < 0) start = i;
    if (!flag && start >= 0) {
      if (i - start >= min) found.push([start, i]);
      start = -1;
    }
  });
  if (start >= 0 && flags.length - start >= min) found.push([start, flags.length]);
  return found;
}

/** Slide rectangles in reading order: row by row, then left to right. */
function findSlides(image: CanvasImageSource, width: number, height: number): Rect[] {
  const opaque = alphaOf(image, 0, 0, width, height);
  const rowFilled = Array.from({ length: height }, (_, y) => {
    for (let x = 0; x < width; x += 1) if (opaque(x, y)) return true;
    return false;
  });
  const slides: Rect[] = [];
  for (const [top, bottom] of runs(rowFilled, 4)) {
    const columnFilled = Array.from({ length: width }, (_, x) => {
      for (let y = top; y < bottom; y += 1) if (opaque(x, y)) return true;
      return false;
    });
    for (const [left, right] of runs(columnFilled, 4)) slides.push({ x: left, y: top, width: right - left, height: bottom - top });
  }
  return slides;
}

/**
 * Exact bounds of the slide inside an area of a render, read along its middle row and
 * column. Only near-solid pixels count: the SVG export draws a faint drop shadow around
 * each slide, which must not end up in the image.
 */
function tighten(image: CanvasImageSource, area: Rect): Rect {
  const opaque = alphaOf(image, area.x, area.y, area.width, area.height, 250);
  let left = area.width;
  let right = 0;
  let top = area.height;
  let bottom = 0;
  const midY = Math.floor(area.height / 2);
  const midX = Math.floor(area.width / 2);
  for (let x = 0; x < area.width; x += 1) {
    if (opaque(x, midY)) {
      left = Math.min(left, x);
      right = Math.max(right, x + 1);
    }
  }
  for (let y = 0; y < area.height; y += 1) {
    if (opaque(midX, y)) {
      top = Math.min(top, y);
      bottom = Math.max(bottom, y + 1);
    }
  }
  if (right <= left || bottom <= top) return area;
  return { x: area.x + left, y: area.y + top, width: right - left, height: bottom - top };
}

function cropToBlob(image: CanvasImageSource, rect: Rect) {
  const canvas = document.createElement("canvas");
  canvas.width = rect.width;
  canvas.height = rect.height;
  canvas.getContext("2d")!.drawImage(image, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
  return new Promise<Blob>((done, fail) =>
    canvas.toBlob((blob) => (blob ? done(blob) : fail(new FigmaError("Couldn't cut out a slide image."))), "image/webp", 0.92),
  );
}

/* SVG path */

/** The opening <svg> tag's size, from width/height or the viewBox. */
function svgSize(svg: string) {
  const tag = /<svg\b[^>]*>/.exec(svg)?.[0] ?? "";
  const number = (name: string) => Number.parseFloat(new RegExp(`\\s${name}="([\\d.]+)`).exec(tag)?.[1] ?? "");
  const viewBox = /viewBox="([^"]+)"/.exec(tag)?.[1].split(/[\s,]+/).map(Number);
  const width = number("width") || viewBox?.[2] || 0;
  const height = number("height") || viewBox?.[3] || 0;
  return { width, height };
}

/** The same SVG, showing only `view` (in Figma units), drawn at `outWidth`×`outHeight` pixels. */
function svgView(svg: string, view: Rect, outWidth: number, outHeight: number) {
  return svg.replace(/<svg\b[^>]*>/, (tag) => {
    const bare = tag.replace(/\s(width|height|viewBox|preserveAspectRatio)="[^"]*"/g, "");
    return bare.replace(
      /^<svg/,
      `<svg width="${outWidth}" height="${outHeight}" viewBox="${view.x} ${view.y} ${view.width} ${view.height}" preserveAspectRatio="none"`,
    );
  });
}

async function svgImage(svg: string) {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    return await loadImage(url, false);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function slidesFromSvg(fileKey: string, token: string, onProgress?: (step: string) => void) {
  onProgress?.("Rendering slides…");
  const response = await fetch(await renderUrl(fileKey, token, "svg"));
  if (!response.ok) throw new FigmaError("Couldn't download the rendered slides from Figma. Try again.");
  const svg = await response.text();
  const { width, height } = svgSize(svg);
  if (!width || !height) throw new FigmaError("Figma's render had no size.");

  onProgress?.("Finding slides…");
  const detectScale = Math.min(1, DETECT_WIDTH / width);
  const detectWidth = Math.max(1, Math.round(width * detectScale));
  const detectHeight = Math.max(1, Math.round(height * detectScale));
  const overview = await svgImage(svgView(svg, { x: 0, y: 0, width, height }, detectWidth, detectHeight));
  const found = findSlides(overview, detectWidth, detectHeight);

  const blobs: Blob[] = [];
  for (const [i, rect] of found.entries()) {
    onProgress?.(`Cutting out slide ${i + 1} of ${found.length}…`);
    // A slightly larger view than detected, drawn at 2x, then trimmed to the slide's exact edges.
    // Whole Figma units, so the slide's edges (which sit on whole units) land exactly on pixel edges.
    const margin = Math.ceil(2 / detectScale) + 4;
    const view = {
      x: Math.floor(rect.x / detectScale) - margin,
      y: Math.floor(rect.y / detectScale) - margin,
      width: Math.ceil(rect.width / detectScale) + margin * 2,
      height: Math.ceil(rect.height / detectScale) + margin * 2,
    };
    const outWidth = Math.round(view.width * OUTPUT_SCALE);
    const outHeight = Math.round(view.height * OUTPUT_SCALE);
    const image = await svgImage(svgView(svg, view, outWidth, outHeight));
    blobs.push(await cropToBlob(image, tighten(image, { x: 0, y: 0, width: outWidth, height: outHeight })));
  }
  return blobs;
}

/* PNG fallback */

async function slidesFromPng(fileKey: string, token: string, onProgress?: (step: string) => void) {
  onProgress?.("Finding slides…");
  const probe = await loadImage(await renderUrl(fileKey, token, "png", PNG_PROBE_SCALE));
  const found = findSlides(probe, probe.naturalWidth, probe.naturalHeight);

  const fullWidth = probe.naturalWidth / PNG_PROBE_SCALE;
  const fullHeight = probe.naturalHeight / PNG_PROBE_SCALE;
  const scale = Math.min(OUTPUT_SCALE, Math.floor(Math.sqrt(PNG_MAX_PIXELS / (fullWidth * fullHeight)) * 100) / 100);

  onProgress?.(`Rendering ${found.length} slides…`);
  const large = await loadImage(await renderUrl(fileKey, token, "png", scale));
  const ratio = large.naturalWidth / probe.naturalWidth;
  const pad = Math.ceil(ratio * 2);

  const blobs: Blob[] = [];
  for (const [i, rect] of found.entries()) {
    onProgress?.(`Cutting out slide ${i + 1} of ${found.length}…`);
    const x = Math.max(Math.floor(rect.x * ratio) - pad, 0);
    const y = Math.max(Math.floor(rect.y * ratio) - pad, 0);
    const area = {
      x,
      y,
      width: Math.min(Math.ceil(rect.width * ratio) + pad * 2, large.naturalWidth - x),
      height: Math.min(Math.ceil(rect.height * ratio) + pad * 2, large.naturalHeight - y),
    };
    blobs.push(await cropToBlob(large, tighten(large, area)));
  }
  return blobs;
}

/* Per-slide export: the primary path */

interface SlideNode {
  nodeId: string;
  name: string;
}

/**
 * The deck's slides in order, with their Figma IDs and names. The REST API won't list a
 * Slides file's nodes, but its SVG export can carry each layer's node ID and name; the
 * slides are the layers holding a full slide-sized frame, in document order (section by
 * section, then left to right).
 */
export async function listSlides(fileKey: string, token: string): Promise<SlideNode[]> {
  for (const id of PAGE_IDS) {
    const result = await figmaGet<{ err: string | null; images: Record<string, string | null> }>(
      `/v1/images/${fileKey}?ids=${encodeURIComponent(id)}&format=svg&svg_include_node_id=true&svg_include_id=true&svg_outline_text=false`,
      token,
    );
    const url = result.images?.[id];
    if (result.err || !url) continue;
    const response = await fetch(url);
    if (!response.ok) continue;
    const doc = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
    const groups = [...doc.querySelectorAll("g[data-node-id]")];
    // A slide is a group whose own first shape is the slide-sized background (1920×1080 by default),
    // and which isn't inside another slide.
    const slides = groups.filter((group) => {
      const background = group.querySelector(":scope > rect");
      const width = Number(background?.getAttribute("width"));
      const height = Number(background?.getAttribute("height"));
      return width >= 640 && height >= 360 && Math.abs(width / height - 16 / 9) < 0.02;
    });
    const outer = slides.filter((group) => !slides.some((other) => other !== group && other.contains(group)));
    if (outer.length > 0) {
      return outer.map((group, i) => ({
        nodeId: group.getAttribute("data-node-id")!,
        name: group.getAttribute("id") || `Slide ${i + 1}`,
      }));
    }
  }
  return [];
}

/** Each slide exported on its own by Figma at 2x, trimmed of the drop shadow Figma draws around it. */
async function exportSlides(fileKey: string, token: string, nodes: SlideNode[], onProgress?: (step: string) => void) {
  const urls: Record<string, string | null> = {};
  for (let start = 0; start < nodes.length; start += 20) {
    onProgress?.(`Exporting ${nodes.length === 1 ? "the slide" : `${nodes.length} slides`}…`);
    const ids = nodes.slice(start, start + 20).map((node) => node.nodeId).join(",");
    const result = await figmaGet<{ err: string | null; images: Record<string, string | null> }>(
      `/v1/images/${fileKey}?ids=${encodeURIComponent(ids)}&format=png&scale=${OUTPUT_SCALE}`,
      token,
    );
    if (result.err) throw new FigmaError(`Figma couldn't export the slides: ${result.err}`);
    Object.assign(urls, result.images);
  }
  const blobs: Blob[] = [];
  for (const [i, node] of nodes.entries()) {
    onProgress?.(`Preparing slide ${i + 1} of ${nodes.length}…`);
    const url = urls[node.nodeId];
    if (!url) throw new FigmaError(`Figma didn't export slide ${i + 1}. Try again.`);
    const image = await loadImage(url);
    blobs.push(await cropToBlob(image, tighten(image, { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight })));
  }
  return blobs;
}

/** The Figma file's name, as shown in Figma. */
export async function figmaFileName(fileKey: string, token: string) {
  const meta = await figmaGet<{ file: { name: string } }>(`/v1/files/${fileKey}/meta`, token);
  return meta.file.name;
}

export async function loadFigmaSlides(fileKey: string, token: string, onProgress?: (step: string) => void) {
  onProgress?.("Reading the file…");
  const meta = await figmaGet<{ file: { name: string } }>(`/v1/files/${fileKey}/meta`, token);
  const stamp = Date.now().toString(36);
  const entries: Array<[string, Blob]> = [];

  onProgress?.("Finding slides…");
  const nodes = await listSlides(fileKey, token);
  if (nodes.length > 0) {
    const blobs = await exportSlides(fileKey, token, nodes, onProgress);
    const slides: FigmaSlide[] = nodes.map((node, i) => {
      const key = `${fileKey}/${stamp}/${node.nodeId}`;
      entries.push([key, blobs[i]]);
      return { id: `figma-${stamp}-${i + 1}`, kind: "figma", nodeId: node.nodeId, name: node.name, image: `idb:${key}` };
    });
    await putImages(entries);
    return { name: meta.file.name, slides };
  }

  // Fallback when the slides can't be listed: cut them out of a render of the whole grid.
  let blobs: Blob[];
  try {
    blobs = await slidesFromSvg(fileKey, token, onProgress);
    if (blobs.length === 0) throw new FigmaError("No slides found in the SVG render.");
  } catch (error) {
    // Token and access problems won't be fixed by the fallback; everything else gets a second try as PNG.
    if (error instanceof FigmaError && /token|couldn't find|rate-limiting/i.test(error.message)) throw error;
    blobs = await slidesFromPng(fileKey, token, onProgress);
  }
  if (blobs.length === 0) throw new FigmaError("No slides found in that file.");

  const slides: FigmaSlide[] = blobs.map((blob, i) => {
    const key = `${fileKey}/${stamp}/${i + 1}`;
    entries.push([key, blob]);
    return { id: `figma-${stamp}-${i + 1}`, kind: "figma", nodeId: `slide-${i + 1}`, name: `Slide ${i + 1}`, image: `idb:${key}` };
  });
  await putImages(entries);
  return { name: meta.file.name, slides };
}
