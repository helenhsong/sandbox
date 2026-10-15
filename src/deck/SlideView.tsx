import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Globe, LoaderCircle, MousePointerClick, RotateCw } from "lucide-react";
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

/** Whether a page is on this site, so the window can reach what it offers (screen history, filling in). */
function isSameSite(src: string) {
  try {
    return new URL(src, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
}

/** Fired by a Sandbox page when it starts or stops offering window.deckFill. */
const DECK_FILL_EVENT = "deckfill";
/** Fired by a Sandbox page when its screen history (window.deckHistory) moves. */
const DECK_HISTORY_EVENT = "deckhistory";
type DeckPage = Window & {
  deckFill?: () => void;
  deckHistory?: { back: () => void; forward: () => void; canBack: () => boolean; canForward: () => boolean };
};

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
  // Other sites' pages can't be reached, so their back and forward stay off.
  const sameSite = isSameSite(src);

  // A Sandbox prototype can offer its own screen history (window.deckHistory) for back and
  // forward. The browser's history isn't used: it's shared with the deck, so stepping back in
  // the page could step the deck back too.
  const [nav, setNav] = useState({ back: false, forward: false });
  // A Sandbox prototype can offer to fill in the screen it's on (window.deckFill), for moving
  // through a demo quickly. The button only shows while the page offers it.
  const [canFill, setCanFill] = useState(false);

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
    setNav({ back: false, forward: false });
    setCanFill(false);
    setVisit((value) => value + 1);
  };
  const fill = () => {
    try {
      (pageWindow() as DeckPage | null)?.deckFill?.();
    } catch {
      // The page went away mid-click.
    }
  };
  const go = (direction: "back" | "forward") => {
    try {
      const history = (pageWindow() as DeckPage | null)?.deckHistory;
      if (direction === "back") history?.back();
      else history?.forward();
    } catch {
      // The page went away mid-click.
    }
  };

  /** Picks up what a Sandbox prototype offers: its screen history and filling in a screen. */
  const onLoad = () => {
    setLoaded(true);
    setNav({ back: false, forward: false });
    setCanFill(false);
    if (!sameSite) return;
    try {
      const page = frameRef.current?.contentWindow as DeckPage | null;
      if (!page) return;
      const checkNav = () => setNav({ back: Boolean(page.deckHistory?.canBack()), forward: Boolean(page.deckHistory?.canForward()) });
      const checkFill = () => setCanFill(typeof page.deckFill === "function");
      checkNav();
      checkFill();
      page.addEventListener(DECK_HISTORY_EVENT, checkNav);
      page.addEventListener(DECK_FILL_EVENT, checkFill);
    } catch {
      // Can't reach this page; its back and forward stay off.
    }
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
            <button type="button" onClick={() => go("back")} disabled={!nav.back} aria-label="Back" title="Back">
              <ChevronLeft size={16} strokeWidth={2} aria-hidden />
            </button>
            <button type="button" onClick={() => go("forward")} disabled={!nav.forward} aria-label="Forward" title="Forward">
              <ChevronRight size={16} strokeWidth={2} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => {
                // Back to where the page started, with a fresh history.
                restart();
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
          {/* As wide as the controls on the left, so the title stays centered. */}
          <span className="deck-window-actions">
            {canFill ? (
              <button type="button" onClick={fill} aria-label="Fill in this screen" title="Fill in this screen">
                <MousePointerClick size={16} strokeWidth={2} aria-hidden />
              </button>
            ) : null}
          </span>
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
            onLoad={onLoad}
            allow="clipboard-read; clipboard-write; fullscreen"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}
