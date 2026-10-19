import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "@helenhsong/ui/style.css";
import "../scrollbars.css";
import "./deck.css";
import { DeckPlayer } from "./DeckPlayer";
import { Presenter } from "./Presenter";
import { readPresenterParam } from "./presentSync";
import { withFigmaEmbeds, type Deck, type Slide } from "./types";

/**
 * Renders a published deck. `images` maps "../slides/<file>" to its bundled URL
 * (from `import.meta.glob` in the deck's own main.tsx).
 */
export function mountDeck(deck: Deck, images: Record<string, string>) {
  const withImages: Slide[] = deck.slides.map((slide) =>
    slide.kind === "figma" ? { ...slide, image: images[`../slides/${slide.image}`] ?? slide.image } : slide,
  );
  // Figma slides show live, as Figma's embed, including decks published before that was an option.
  const slides = deck.figmaLive === false ? withImages : withFigmaEmbeds(withImages, deck.source);
  document.body.style.margin = "0";
  document.body.style.background = "#0b0b0c";
  // ?presenter=3 is the presenter view (notes, slide list, timer), opened from the deck's controls.
  const presenterAt = readPresenterParam();
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      {presenterAt !== null ? (
        <PublishedPresenter name={deck.name} slides={slides} startIndex={presenterAt} />
      ) : (
        <DeckPlayer name={deck.name} slides={slides} exitHref={import.meta.env.BASE_URL} />
      )}
    </StrictMode>,
  );
}

/** Notes edited in a published deck's presenter view, kept in this browser (slide id → notes). */
const notesKey = () => `deck-notes:${window.location.pathname}`;

function readNotes(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(notesKey()) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

/**
 * A published deck's presenter view. Notes can be edited here too: the changes are kept in this
 * browser (a published deck can't save back to Sandbox), over the notes it was published with.
 */
function PublishedPresenter({ name, slides, startIndex }: { name: string; slides: Slide[]; startIndex: number }) {
  const [edited, setEdited] = useState(readNotes);
  const shown = slides.map((slide) => (slide.id in edited ? { ...slide, notes: edited[slide.id] } : slide));
  const onNotesChange = (id: string, notes: string) => {
    const next = { ...edited, [id]: notes };
    setEdited(next);
    try {
      localStorage.setItem(notesKey(), JSON.stringify(next));
    } catch {
      // Not saved for next time; the change still shows now.
    }
  };
  return <Presenter name={name} slides={shown} startIndex={startIndex} onNotesChange={onNotesChange} />;
}
