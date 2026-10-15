import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, LoaderCircle, MousePointerClick, RotateCw } from "lucide-react";
import { DECK_FILL_EVENT, DECK_HISTORY_EVENT, type LivePageWindow } from "./contract";
import "./window.css";

/** Whether a page is on this site, so the window can reach what it offers (screen history, filling in). */
function isSameSite(src: string) {
  try {
    return new URL(src, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
}

type Page = Window & LivePageWindow;

interface PageWindowProps {
  /** The page to show. */
  src: string;
  /** The page's name, in the middle of the title bar. */
  label: string;
  /** Light everywhere (Sandbox pages and decks); dark is kept as an option. */
  theme?: "dark" | "light";
}

/**
 * A page in a macOS-style window: back, forward and reload in the title bar to get unstuck, the
 * page's name in the middle, and the fast-forward button when a Sandbox prototype offers it.
 * Changing `src` should remount it (key it by src).
 */
export function PageWindow({ src, label, theme = "light" }: PageWindowProps) {
  const [loaded, setLoaded] = useState(false);
  // Changing this remounts the page at its starting address.
  const [visit, setVisit] = useState(0);
  const frameRef = useRef<HTMLIFrameElement>(null);
  // Other sites' pages can't be reached, so their back and forward stay off.
  const sameSite = isSameSite(src);

  // A Sandbox prototype offers its own screen history (window.deckHistory) for back and
  // forward. The browser's history isn't used: it's shared with the page around the window, so
  // stepping back in the prototype could step that page back too.
  const [nav, setNav] = useState({ back: false, forward: false });
  // A Sandbox prototype can offer to fast-forward the screen it's on (window.deckFill), for
  // moving through a demo quickly. The button only shows while the page offers it.
  const [canFill, setCanFill] = useState(false);

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
      (pageWindow() as Page | null)?.deckFill?.();
    } catch {
      // The page went away mid-click.
    }
  };
  const go = (direction: "back" | "forward") => {
    try {
      const history = (pageWindow() as Page | null)?.deckHistory;
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
      const page = frameRef.current?.contentWindow as Page | null;
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
    <div className="page-window" data-theme={theme}>
      <div className="page-window-bar">
        <span className="page-window-lights" aria-hidden>
          <span />
          <span />
          <span />
        </span>
        <span className="page-window-nav">
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
        <span className="page-window-title">
          <span>{label}</span>
        </span>
        {/* As wide as the controls on the left, so the title stays centered. */}
        <span className="page-window-actions">
          {canFill ? (
            <button type="button" onClick={fill} aria-label="Fast-forward this screen" title="Fast-forward this screen">
              <MousePointerClick size={16} strokeWidth={2} aria-hidden />
            </button>
          ) : null}
        </span>
      </div>
      <div className="page-window-body">
        {!loaded ? (
          <div className="page-window-loading" aria-hidden>
            <LoaderCircle className="page-window-spin" size={20} strokeWidth={2} />
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
  );
}
