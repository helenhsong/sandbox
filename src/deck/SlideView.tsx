import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Globe, LoaderCircle, RotateCw } from "lucide-react";
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

/** Whether a page is on this site, so the window's back and forward can reach its history. */
function isSameSite(src: string) {
  try {
    return new URL(src, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
}

/**
 * A live page in a macOS-style window: back, forward and reload in the title bar to get unstuck,
 * and the page's name in the middle.
 */
function WebFrameInner({ slide, src }: { slide: WebSlide; src: string }) {
  const [loaded, setLoaded] = useState(false);
  // Changing this remounts the page at its starting address.
  const [visit, setVisit] = useState(0);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const label = slide.title || urlLabel(slide.url);
  // Other sites' pages keep their history to themselves, so only Sandbox pages get back and forward.
  const sameSite = isSameSite(src);

  if (!slide.url) {
    return (
      <div className="deck-web deck-web-empty">
        <Globe size={20} strokeWidth={2} aria-hidden />
        <p>Add a URL to show a live page here.</p>
      </div>
    );
  }

  const pageWindow = () => {
    try {
      return frameRef.current?.contentWindow ?? null;
    } catch {
      return null;
    }
  };
  const restart = () => {
    setLoaded(false);
    setVisit((value) => value + 1);
  };

  return (
    <div className="deck-web">
      <div className="deck-window">
        <div className="deck-window-bar">
          <span className="deck-window-lights" aria-hidden>
            <span />
            <span />
            <span />
          </span>
          <span className="deck-window-nav">
            <button type="button" onClick={() => pageWindow()?.history.back()} disabled={!sameSite} aria-label="Back" title="Back">
              <ChevronLeft size={16} strokeWidth={2} aria-hidden />
            </button>
            <button type="button" onClick={() => pageWindow()?.history.forward()} disabled={!sameSite} aria-label="Forward" title="Forward">
              <ChevronRight size={16} strokeWidth={2} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => {
                const page = pageWindow();
                if (sameSite && page) page.location.reload();
                else restart();
              }}
              aria-label="Reload"
              title="Reload"
            >
              <RotateCw size={14} strokeWidth={2} aria-hidden />
            </button>
          </span>
          <span className="deck-window-title">
            <Globe size={14} strokeWidth={2} aria-hidden />
            <span>{label}</span>
          </span>
          {/* Balances the controls on the left, so the title stays centered. */}
          <span className="deck-window-spacer" aria-hidden />
        </div>
        <div className="deck-web-body">
          {!loaded ? (
            <div className="deck-web-loading" aria-hidden>
              <LoaderCircle className="deck-spin" size={20} strokeWidth={2} />
            </div>
          ) : null}
          <iframe
            key={visit}
            ref={frameRef}
            title={label}
            src={src}
            onLoad={() => setLoaded(true)}
            allow="clipboard-read; clipboard-write; fullscreen"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}
