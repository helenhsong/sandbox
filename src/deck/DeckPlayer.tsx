import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Globe, LayoutGrid, Maximize, Minimize, X } from "lucide-react";
import { SlideView } from "./SlideView";
import { isImageLoading, isPersistent, urlLabel, visibleSlides, type Slide } from "./types";

interface DeckPlayerProps {
  name: string;
  slides: Slide[];
  startIndex?: number;
  /** When set, the player is an overlay (the builder's preview) and Escape closes it. */
  onClose?: () => void;
  /** For a published deck: where its close button goes (the Sandbox home page). */
  exitHref?: string;
}

/** How long the controls show on opening, and how long the mouse can rest before the cursor hides. */
const IDLE_MS = 2500;
/** How close the mouse must be to the bottom edge to show the bar, and to the top-left corner to show close. */
const NEAR_BAR_PX = 120;
const NEAR_CLOSE_PX = 120;

function readHashIndex(count: number) {
  const value = Number.parseInt(window.location.hash.slice(1), 10);
  return Number.isFinite(value) ? Math.min(Math.max(value - 1, 0), Math.max(count - 1, 0)) : 0;
}

/** Ids of web slides around `index`, so their pages start loading before they are shown. */
function nearbyWebIds(slides: Slide[], index: number) {
  // Live pages and live Figma slides: they keep their state once loaded.
  return slides.slice(Math.max(index - 1, 0), index + 2).filter(isPersistent).map((slide) => slide.id);
}

export function DeckPlayer({ name, slides: allSlides, startIndex, onClose, exitHref }: DeckPlayerProps) {
  const slides = visibleSlides(allSlides);
  const standalone = !onClose;
  const rootRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(() =>
    standalone ? readHashIndex(slides.length) : Math.min(startIndex ?? 0, Math.max(slides.length - 1, 0)),
  );
  // Web pages stay mounted once loaded, so what the audience did on them survives going back and forth.
  const [mounted, setMounted] = useState(() => new Set(nearbyWebIds(slides, index)));
  const [overview, setOverview] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  // Some embedded browsers (like an app's preview pane) refuse real full screen; the player then
  // fills the window instead, so the button always does something.
  const [expanded, setExpanded] = useState(false);
  const filling = fullscreen || expanded;

  // The controls show only while the mouse is near them: near the bottom bar or the close button
  // in the top-left corner, all of them show. They show briefly on opening,
  // and a tap on a touch screen shows them for a moment.
  const [near, setNear] = useState({ bar: true, close: true });
  // The cursor hides over the slide once the mouse has been still for a moment.
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const set = (bar: boolean, close: boolean) =>
      setNear((current) => (current.bar === bar && current.close === close ? current : { bar, close }));
    let hintTimer = setTimeout(() => set(false, false), IDLE_MS);
    let idleTimer = setTimeout(() => setIdle(true), IDLE_MS);
    const onMove = (event: PointerEvent) => {
      setIdle(false);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setIdle(true), IDLE_MS);
      if (event.pointerType !== "mouse") return;
      clearTimeout(hintTimer);
      const box = root.getBoundingClientRect();
      // Near either the bar or the close button, all the controls show together.
      const show =
        event.clientY > box.bottom - NEAR_BAR_PX ||
        (event.clientY < box.top + NEAR_CLOSE_PX && event.clientX < box.left + NEAR_CLOSE_PX * 2);
      set(show, show);
    };
    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return;
      set(true, true);
      clearTimeout(hintTimer);
      hintTimer = setTimeout(() => set(false, false), IDLE_MS);
    };
    const onLeave = () => set(false, false);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      clearTimeout(hintTimer);
      clearTimeout(idleTimer);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  // A button clicked with the mouse lets go of focus, so arrow keys and space keep moving through
  // slides instead of pressing that button again or showing its focus ring (and keeping the bar up).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onClick = (event: MouseEvent) => {
      if (event.detail === 0) return; // Pressed from the keyboard: keep focus where it is.
      const control = (event.target as Element | null)?.closest?.("button, a");
      if (control instanceof HTMLElement) control.blur();
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, []);

  // On a live page, the keyboard follows the mouse: with the mouse over the slide, keys go to the
  // page (its own arrow keys, scrolling, typing); move it off the slide and they change slides
  // again, with no click needed. Focus moves into or out of the page's frame to make that happen.
  const pointerInFrame = useRef(false);
  const onLivePage = useRef(false);
  useEffect(() => {
    onLivePage.current = slides[index]?.kind === "web";
  });
  const activeFrame = useCallback(
    () => rootRef.current?.querySelector<HTMLIFrameElement>(".deck-layer[data-active] iframe") ?? null,
    [],
  );
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const follow = (inside: boolean) => {
      pointerInFrame.current = inside;
      if (!onLivePage.current) return;
      const frame = activeFrame();
      if (inside && frame && document.activeElement !== frame) frame.focus({ preventScroll: true });
      if (!inside && document.activeElement instanceof HTMLIFrameElement) root.focus({ preventScroll: true });
    };
    const onMove = (event: PointerEvent) => {
      const box = root.querySelector(".deck-frame")?.getBoundingClientRect();
      follow(Boolean(box) && event.clientX >= box!.left && event.clientX <= box!.right && event.clientY >= box!.top && event.clientY <= box!.bottom);
    };
    // Entering the page's frame: this document gets no more moves until the mouse comes back out.
    const onOver = (event: PointerEvent) => {
      if (event.target instanceof HTMLIFrameElement) follow(true);
    };
    const onLeave = () => follow(false);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerover", onOver);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerover", onOver);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [activeFrame]);

  // Clicking a live Figma slide lets the click through but keeps the keyboard with the deck, so
  // arrow keys change the deck's slides rather than moving Figma's embed to other slides.
  useEffect(() => {
    const onBlur = () =>
      setTimeout(() => {
        const active = document.activeElement;
        if (active instanceof HTMLIFrameElement && active.closest(".deck-figma-live") && rootRef.current?.contains(active)) {
          rootRef.current.focus({ preventScroll: true });
        }
      }, 0);
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);

  // Arriving on a live page with the mouse already over the slide hands the keyboard to the page.
  useEffect(() => {
    if (slides[index]?.kind !== "web" || !pointerInFrame.current) return;
    const timer = setTimeout(() => activeFrame()?.focus({ preventScroll: true }), 0);
    return () => clearTimeout(timer);
  }, [index, slides, activeFrame]);

  const go = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(next, 0), slides.length - 1);
      setIndex(clamped);
      setMounted((current) => {
        const ids = nearbyWebIds(slides, clamped).filter((id) => !current.has(id));
        return ids.length ? new Set([...current, ...ids]) : current;
      });
    },
    [slides],
  );

  // R restarts even while a live page has the keyboard (unless you're typing in it). Pages from
  // Sandbox are on this site, so their key presses can be heard; other sites' can't.
  useEffect(() => {
    if (slides[index]?.kind !== "web") return;
    const frame = activeFrame();
    if (!frame) return;
    let win: Window | null = null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "r" && event.key !== "R") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as { closest?: (selector: string) => unknown } | null;
      if (target?.closest?.("input, textarea, select, [contenteditable]")) return;
      event.preventDefault();
      rootRef.current?.focus({ preventScroll: true });
      go(0);
    };
    const attach = () => {
      try {
        win?.removeEventListener("keydown", onKey, true);
        win = frame.contentWindow;
        win?.addEventListener("keydown", onKey, true);
      } catch {
        win = null; // Another site's page: its keys stay its own.
      }
    };
    attach();
    frame.addEventListener("load", attach);
    return () => {
      frame.removeEventListener("load", attach);
      try {
        win?.removeEventListener("keydown", onKey, true);
      } catch {
        // Already gone.
      }
    };
  }, [index, slides, activeFrame, go]);

  useEffect(() => {
    if (standalone) history.replaceState(null, "", `#${index + 1}`);
  }, [index, standalone]);

  // As an overlay, keep the page behind it from scrolling; restore it on close.
  useEffect(() => {
    if (standalone) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [standalone]);

  useEffect(() => {
    if (!standalone) return;
    const onHash = () => go(readHashIndex(slides.length));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [go, slides.length, standalone]);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    if (expanded) {
      setExpanded(false);
      return;
    }
    const request = rootRef.current?.requestFullscreen?.();
    if (!request) {
      setExpanded(true);
      return;
    }
    // Some hosts reject the request, others silently ignore it; either way, fill the window instead.
    const fallBack = () => {
      if (!document.fullscreenElement) setExpanded(true);
    };
    request.then(fallBack, fallBack);
    window.setTimeout(fallBack, 400);
  }, [expanded]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("input, textarea, select, [contenteditable]")) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      // With the mouse over a live page, its keys belong to the page, not the deck.
      const slideKeys = ["ArrowRight", "ArrowLeft", "PageDown", "PageUp", " ", "Home", "End", "r", "R"];
      const restart = event.key === "r" || event.key === "R";
      if (!overview && !restart && onLivePage.current && pointerInFrame.current && slideKeys.includes(event.key)) return;
      // Moving through slides from the keyboard means presenting: tuck the controls away again.
      if (!overview && slideKeys.includes(event.key)) {
        setNear({ bar: false, close: false });
        setIdle(true);
        if (document.activeElement instanceof HTMLElement && rootRef.current?.contains(document.activeElement)) {
          document.activeElement.blur();
        }
      }
      switch (event.key) {
        case "ArrowRight":
        case "PageDown":
        case " ":
          if (overview) return;
          event.preventDefault();
          go(index + 1);
          break;
        case "ArrowLeft":
        case "PageUp":
          if (overview) return;
          event.preventDefault();
          go(index - 1);
          break;
        case "Home":
        case "r":
        case "R":
          // R restarts the presentation from the first slide.
          if (overview && event.key !== "Home") return;
          event.preventDefault();
          go(0);
          break;
        case "End":
          event.preventDefault();
          go(slides.length - 1);
          break;
        case "f":
          toggleFullscreen();
          break;
        case "g":
          setOverview((open) => !open);
          break;
        case "Escape":
          if (overview) setOverview(false);
          else if (expanded) setExpanded(false);
          else if (!document.fullscreenElement) onClose?.();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, go, index, onClose, overview, slides.length, toggleFullscreen]);

  if (slides.length === 0) {
    return (
      <div className="deck-player" ref={rootRef}>
        <p className="deck-player-empty">This deck has no slides.</p>
      </div>
    );
  }

  const current = slides[index];

  return (
    <div
      className={`deck-player${onClose ? " deck-player-overlay" : ""}`}
      ref={rootRef}
      // Focusable so the keyboard can be taken back from a live page when the mouse leaves it.
      tabIndex={-1}
      role="region"
      aria-label={name}
      data-filling={filling || undefined}
      data-idle={(idle && !overview) || undefined}
      data-show-bar={near.bar || overview || undefined}
      data-show-close={(near.close && !overview) || undefined}
    >
      {onClose || exitHref ? (
        // An invisible area around close: it catches the mouse even over a live page, whose
        // own page would otherwise swallow the movement, so hovering here shows the controls.
        <div className="deck-close-zone">
          {onClose ? (
            <button type="button" className="deck-icon-button deck-close" onClick={onClose} aria-label="Close preview" title="Close (Esc)">
              <X size={18} strokeWidth={2} />
            </button>
          ) : (
            <a className="deck-icon-button deck-close" href={exitHref} aria-label="Back to Sandbox" title="Back to Sandbox">
              <X size={18} strokeWidth={2} />
            </a>
          )}
        </div>
      ) : null}
      <div className="deck-stage">
        <div className="deck-frame" aria-live="polite">
          {slides.map((slide, i) => {
            const active = i === index;
            if (!isPersistent(slide) && Math.abs(i - index) > 1) return null;
            if (isPersistent(slide) && !mounted.has(slide.id) && !active) return null;
            return (
              <div key={slide.id} className="deck-layer" data-active={active || undefined} aria-hidden={!active} inert={!active}>
                <SlideView slide={slide} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="deck-controls">
        <div className="deck-controls-info">
          <span className="deck-controls-name">{name}</span>
          {current.kind === "web" ? (
            <span className="deck-controls-live">
              <Globe size={14} strokeWidth={2} aria-hidden />
              Live
            </span>
          ) : null}
        </div>
        <div className="deck-controls-nav">
          <button
            type="button"
            className="deck-icon-button"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            aria-label="Previous slide"
            title="Previous (←)"
          >
            <ChevronLeft size={18} strokeWidth={2} />
          </button>
          <span className="deck-counter" aria-label={`Slide ${index + 1} of ${slides.length}`}>
            <span className="deck-counter-current">{index + 1}</span> / {slides.length}
          </span>
          <button
            type="button"
            className="deck-icon-button"
            onClick={() => go(index + 1)}
            disabled={index === slides.length - 1}
            aria-label="Next slide"
            title="Next (→)"
          >
            <ChevronRight size={18} strokeWidth={2} />
          </button>
        </div>
        <div className="deck-controls-actions">
          <button type="button" className="deck-icon-button" onClick={() => setOverview(true)} aria-label="All slides" title="All slides (G)">
            <LayoutGrid size={18} strokeWidth={2} />
          </button>
          <button
            type="button"
            className="deck-icon-button"
            onClick={toggleFullscreen}
            aria-label={filling ? "Exit full screen" : "Full screen"}
            title={filling ? "Exit full screen (F)" : "Full screen (F)"}
          >
            {filling ? <Minimize size={18} strokeWidth={2} /> : <Maximize size={18} strokeWidth={2} />}
          </button>
        </div>
      </div>

      {overview ? (
        <div className="deck-overview" role="dialog" aria-modal="true" aria-label="All slides">
          <div className="deck-overview-header">
            <span>All slides</span>
            <button type="button" className="deck-icon-button" onClick={() => setOverview(false)} aria-label="Close all slides" title="Close (Esc)" autoFocus>
              <X size={18} strokeWidth={2} />
            </button>
          </div>
          <ol className="deck-overview-grid">
            {slides.map((slide, i) => (
              <li key={slide.id}>
                <button
                  type="button"
                  className="deck-overview-item"
                  data-active={i === index || undefined}
                  onClick={() => {
                    go(i);
                    setOverview(false);
                  }}
                >
                  <span className="deck-overview-thumb">
                    {slide.kind === "figma" ? (
                      slide.image && !isImageLoading(slide.image) ? <img src={slide.image} alt="" loading="lazy" /> : null
                    ) : (
                      <span className="deck-thumb-web">
                        <span className="deck-live-tag">
                          <Globe size={14} strokeWidth={2} aria-hidden />
                          Live
                        </span>
                        <span className="deck-thumb-web-title">{slide.title || urlLabel(slide.url)}</span>
                      </span>
                    )}
                  </span>
                  <span className="deck-overview-label">
                    <span className="deck-overview-number">{i + 1}</span>
                    {slide.kind === "web" ? slide.title || urlLabel(slide.url) : null}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
