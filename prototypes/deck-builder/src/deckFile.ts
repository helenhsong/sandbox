import type { Deck, Slide } from "../../../src/deck/types";
import type { Draft } from "./draft";
import { IMAGE_PREFIX, putImages } from "./imageStore";

/** Reads a .deck.json file exported from this tool back into a draft, moving its images into the image store. */
export async function readDeckFile(file: File): Promise<Draft> {
  const deck = JSON.parse(await file.text()) as Deck;
  if (deck.version !== 1 || !Array.isArray(deck.slides)) throw new Error("Not a deck file");
  const stamp = Date.now().toString(36);
  const entries: Array<[string, Blob]> = [];
  const slides: Slide[] = [];
  for (const [i, slide] of deck.slides.entries()) {
    if (slide.kind === "figma" && slide.image.startsWith("data:")) {
      const key = `import/${stamp}/${i}`;
      entries.push([key, await (await fetch(slide.image)).blob()]);
      slides.push({ ...slide, image: `${IMAGE_PREFIX}${key}` });
    } else slides.push(slide);
  }
  await putImages(entries);
  return {
    figmaUrl: deck.source?.figmaUrl ?? "",
    fileKey: deck.source?.fileKey ?? "",
    name: deck.name,
    slug: deck.slug,
    slugEdited: true,
    figmaLive: deck.figmaLive ?? false,
    slides,
  };
}
