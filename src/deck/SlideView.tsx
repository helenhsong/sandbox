import { useState, type ReactNode } from "react";
import { Globe, LoaderCircle } from "lucide-react";
import { isImageLoading, resolveUrl, urlLabel, type FigmaSlide, type Slide, type WebSlide } from "./types";

/**
 * One slide at 16:9. Figma slides render as images, or as Figma's live embed drawn over the image
 * once it loads; web slides as a live, interactive page filling the slide.
 */
export function SlideView({ slide }: { slide: Slide }) {
  if (slide.kind === "figma") {
    const image = isImageLoading(slide.image) ? (
      <div className="deck-slide-placeholder deck-slide-loading" aria-label="Loading slide" />
    ) : !slide.image ? (
      slide.embedUrl ? null : <div className="deck-slide-placeholder">No preview. Get latest from Figma.</div>
    ) : (
      <img className="deck-slide-image" src={slide.image} alt={slide.name} draggable={false} />
    );
    if (!slide.embedUrl) return image;
    return <FigmaFrame key={slide.embedUrl} slide={slide} src={slide.embedUrl} poster={image} />;
  }
  return <WebFrame slide={slide} />;
}

/** How long Figma's embed takes to finish drawing after it loads. */
const FIGMA_SETTLE_MS = 1500;

/**
 * Figma's live embed, shown over the slide's image once loaded, so there's never a blank or loading screen.
 * It can't be clicked or focused, and it's cropped so Figma's own slide controls stay out of view.
 */
function FigmaFrame({ slide, src, poster }: { slide: FigmaSlide; src: string; poster: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="deck-figma-live">
      {poster}
      <iframe
        title={slide.name}
        src={src}
        data-loaded={loaded || undefined}
        // Figma finishes drawing (with its own fade) just after the page loads; wait that out
        // behind the image, then swap in one step.
        onLoad={() => window.setTimeout(() => setLoaded(true), FIGMA_SETTLE_MS)}
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
