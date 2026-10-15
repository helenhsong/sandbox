import { useState } from "react";
import { Globe, LoaderCircle } from "lucide-react";
import { isImageLoading, resolveUrl, urlLabel, type Slide, type WebSlide } from "./types";

/** One slide at 16:9. Figma slides render as images; web slides as a live, interactive page filling the slide. */
export function SlideView({ slide }: { slide: Slide }) {
  if (slide.kind === "figma") {
    if (isImageLoading(slide.image)) return <div className="deck-slide-placeholder deck-slide-loading" aria-label="Loading slide" />;
    if (!slide.image) return <div className="deck-slide-placeholder">No preview. Update Figma slides.</div>;
    return <img className="deck-slide-image" src={slide.image} alt={slide.name} draggable={false} />;
  }
  return <WebFrame slide={slide} />;
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
