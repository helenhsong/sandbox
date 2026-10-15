import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@helenhsong/ui/style.css";
import "./deck.css";
import { DeckPlayer } from "./DeckPlayer";
import type { Deck, Slide } from "./types";

/**
 * Renders a published deck. `images` maps "../slides/<file>" to its bundled URL
 * (from `import.meta.glob` in the deck's own main.tsx).
 */
export function mountDeck(deck: Deck, images: Record<string, string>) {
  const slides: Slide[] = deck.slides.map((slide) =>
    slide.kind === "figma" ? { ...slide, image: images[`../slides/${slide.image}`] ?? slide.image } : slide,
  );
  document.body.style.margin = "0";
  document.body.style.background = "#0b0b0c";
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <DeckPlayer name={deck.name} slides={slides} exitHref={import.meta.env.BASE_URL} />
    </StrictMode>,
  );
}
