import { useLayoutEffect, useRef, useState } from "react";
import { Globe } from "lucide-react";
import { PageWindow } from "../live-page/Window";
import { isImageLoading, resolveUrl, urlLabel, type FigmaSlide, type Slide, type WebSlide } from "./types";

/**
 * One slide at 16:9. Figma slides render as images, or (live) as Figma's own embed alone;
 * web slides as a live, interactive page filling the slide.
 */
/**
 * `mirror`: a live page is mirrored between a deck's presenter and audience views (what's done in
 * one is done in the other). Left off for the editor's preview.
 */
export function SlideView({ slide, mirror = false }: { slide: Slide; mirror?: boolean }) {
  if (slide.kind === "figma") {
    if (slide.embedUrl) return <FigmaFrame key={slide.embedUrl} slide={slide} src={slide.embedUrl} />;
    if (isImageLoading(slide.image)) return <div className="deck-slide-placeholder deck-slide-loading" aria-label="Loading slide" />;
    if (!slide.image) return <div className="deck-slide-placeholder">No preview from Figma.</div>;
    return <img className="deck-slide-image" src={slide.image} alt={slide.name} draggable={false} />;
  }
  return <WebFrame slide={slide} mirror={mirror} />;
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

/**
 * A live page, laid out like a 16-inch MacBook Pro screen in 16:9 (1728 × 972) with the window at
 * the size it has on a Sandbox project page there (1440 × 828), then scaled to fit the slide. The
 * prototype inside lays out the same way in a deck as on its own page, at any slide size.
 */
const SCREEN = { width: 1728, height: 972 };

function WebFrame({ slide, mirror }: { slide: WebSlide; mirror: boolean }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const fit = () => setScale(Math.min(frame.clientWidth / SCREEN.width, frame.clientHeight / SCREEN.height));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

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
    <div className="deck-web" ref={frameRef}>
      <div className="deck-web-screen" style={{ width: SCREEN.width, height: SCREEN.height, transform: `scale(${scale || 1})`, visibility: scale ? undefined : "hidden" }}>
        {/* Keyed by src so a new URL shows the loading state again. */}
        <PageWindow
          key={src}
          src={src}
          label={slide.title || urlLabel(slide.url)}
          theme="light"
          mirror={mirror ? { id: slide.id } : undefined}
        />
      </div>
    </div>
  );
}
