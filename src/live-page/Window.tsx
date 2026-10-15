import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, LoaderCircle, MousePointerClick, RotateCw } from "lucide-react";
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

/** The page's slug (the last part of its path, like "whiteboarding-runthrough-2"), or the site's name for a home page. */
function pageSlug(src: string) {
  try {
    const url = new URL(src, window.location.href);
    const parts = url.pathname.split("/").filter(Boolean);
    return decodeURIComponent(parts.at(-1) ?? url.hostname);
  } catch {
    return src;
  }
}

/** The page's full address, without a hash, for opening it in a new tab. */
function pageAddress(src: string) {
  try {
    const url = new URL(src, window.location.href);
    url.hash = "";
    return url.href;
  } catch {
    return src;
  }
}

interface PageWindowProps {
  /** The page to show. */
  src: string;
  /** The page's name, for screen readers (the address bar shows its slug). */
  label: string;
  /**
   * Whether hovering the address bar offers to open the page in a new tab. Off on the project's
   * own Sandbox page, which already is that page.
   */
  openLink?: boolean;
  /** Light everywhere (Sandbox pages and decks); dark is kept as an option. */
  theme?: "dark" | "light";
}

/**
 * A page in a macOS-style window: back, forward and reload in the title bar to get unstuck, and
 * the fast-forward button when a Sandbox prototype offers it.
 * Changing `src` should remount it (key it by src).
 */
export function PageWindow({ src, label, openLink = true, theme = "light" }: PageWindowProps) {
  const [loaded, setLoaded] = useState(false);
  // Changing this remounts the page at its starting address.
  const [visit, setVisit] = useState(0);
  const frameRef = useRef<HTMLIFrameElement>(null);
  // Other sites' pages can't be reached, so their back and forward stay off.
  const sameSite = isSameSite(src);
  const address = pageAddress(src);
  const slug = pageSlug(src);

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

  // N fast-forwards too, from the page around the window or from inside the prototype.
  const onShortcut = useRef<(event: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    onShortcut.current = (event) => {
      if (event.key !== "n" && event.key !== "N") return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat || !canFill) return;
      if (isTyping(event.target)) return;
      // In a deck, only the slide that's showing responds.
      if (frameRef.current && !frameRef.current.checkVisibility({ visibilityProperty: true })) return;
      event.preventDefault();
      fill();
    };
  });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => onShortcut.current(event);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
      page.addEventListener("keydown", (event) => onShortcut.current(event));
    } catch {
      // Can't reach this page; its back and forward stay off.
    }
  };

  return (
    <div className="page-window" data-theme={theme}>
      <div className="page-window-bar">
        <span className="page-window-nav">
          <button type="button" onClick={() => go("back")} disabled={!nav.back} aria-label="Back" title="Back">
            <ArrowLeft size={16} strokeWidth={2} aria-hidden />
          </button>
          <button type="button" onClick={() => go("forward")} disabled={!nav.forward} aria-label="Forward" title="Forward">
            <ArrowRight size={16} strokeWidth={2} aria-hidden />
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
        {/* The project's slug, centered where a browser shows the address. It's only a label
            (nothing to type in); in a deck, hovering it shows a button that opens the page in a new tab. */}
        <span className="page-window-url">
          <span className="page-window-url-text" title={slug}>
            {slug}
          </span>
          {openLink ? (
            <a
              className="page-window-url-open"
              href={address}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open in a new tab"
              title="Open in a new tab"
            >
              <ArrowUpRight size={14} strokeWidth={2} aria-hidden />
            </a>
          ) : null}
        </span>
        <span className="page-window-spacer" aria-hidden />
        <span className="page-window-actions">
          {canFill ? (
            <button type="button" onClick={fill} aria-label="Fast-forward this screen" title="Fast-forward this screen (N)" aria-keyshortcuts="N">
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

/** Whether a key press is someone typing (a field, a text area, editable text), not a shortcut. */
function isTyping(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  if (!element || typeof element.closest !== "function") return false;
  return Boolean(element.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])"));
}
