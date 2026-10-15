import { useState } from "react";
import { Globe, LoaderCircle } from "lucide-react";
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

function WebFrame({ slide }: { slide: WebSlide }) {
  const src = resolveUrl(slide.url);
  // Keyed by src so a new URL shows the loading state again.
  return <WebFrameInner key={src} slide={slide} src={src} />;
}

function WebFrameInner({ slide, src }: { slide: WebSlide; src: string }) {
  const [loaded, setLoaded] = useState(false);

  if (!slide.url) {
    return (
      <div className="deck-web deck-web-empty">
        <Globe size={20} strokeWidth={2} aria-hidden />
        <p>Add a URL to show a live page here.</p>
      </div>
    );
  }

  return (
    <div className="deck-web">
      <div className="deck-web-body">
        {!loaded ? (
          <div className="deck-web-loading" aria-hidden>
            <LoaderCircle className="deck-spin" size={20} strokeWidth={2} />
          </div>
        ) : null}
        <iframe
          title={slide.title || urlLabel(slide.url)}
          src={src}
          onLoad={() => setLoaded(true)}
          allow="clipboard-read; clipboard-write; fullscreen"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
