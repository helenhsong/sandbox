import { Globe } from "lucide-react";
import { PageWindow } from "../live-page/Window";
import { isImageLoading, resolveUrl, urlLabel, type FigmaSlide, type Slide, type WebSlide } from "./types";

/**
 * One slide at 16:9. Figma slides render as images, or (live) as Figma's own embed alone;
 * web slides as a live, interactive page filling the slide.
 */
export function SlideView({ slide }: { slide: Slide }) {
  if (slide.kind === "figma") {
    if (slide.embedUrl) return <FigmaFrame key={slide.embedUrl} slide={slide} src={slide.embedUrl} />;
    if (isImageLoading(slide.image)) return <div className="deck-slide-placeholder deck-slide-loading" aria-label="Loading slide" />;
    if (!slide.image) return <div className="deck-slide-placeholder">No preview from Figma.</div>;
    return <img className="deck-slide-image" src={slide.image} alt={slide.name} draggable={false} />;
  }
  return <WebFrame slide={slide} />;
}

/**
 * Figma's live embed of the slide, on its own. It can't be clicked or focused, and it's cropped
 * so Figma's own slide controls stay out of view.
 */
function FigmaFrame({ slide, src }: { slide: FigmaSlide; src: string }) {
  return (
    <div className="deck-figma-live">
      <iframe
        title={slide.name}
        src={src}
        // Look-only: moving between slides happens in the deck, never inside Figma's embed.
        tabIndex={-1}
        aria-hidden
      />
    </div>
  );
}

/** A live page: the dark macOS-style window, filling the slide. */
function WebFrame({ slide }: { slide: WebSlide }) {
  if (!slide.url) {
    return (
      <div className="deck-web deck-web-empty">
        <Globe size={20} strokeWidth={2} aria-hidden />
        <p>Add a URL to show a live page here.</p>
      </div>
    );
  }
  const src = resolveUrl(slide.url);
  return (
    <div className="deck-web">
      {/* Keyed by src so a new URL shows the loading state again. */}
      <PageWindow key={src} src={src} label={slide.title || urlLabel(slide.url)} theme="dark" />
    </div>
  );
}
