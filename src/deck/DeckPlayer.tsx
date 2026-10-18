import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Globe, LayoutGrid, Maximize, Minimize, NotebookText, X } from "lucide-react";
import { closeTab, openPresentChannel, openView, viewTabName, viewUrl, type PresentMessage } from "./presentSync";
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
  /** Called with the slide's position (0-based) whenever it changes, e.g. to keep a URL in step. */
  onSlideChange?: (index: number) => void;
}

/** How long the controls show on opening, and how long the mouse can rest before the cursor hides. */
const IDLE_MS = 2500;
/** How close the mouse must be to the bottom edge to show the bar, and to the top-left corner to show close. */
const NEAR_BAR_PX = 120;
const NEAR_CLOSE_PX = 120;

/**
 * The slide in a published deck's address, ?present=3 (the same format as presenting in the
 * editor). Older links used #3, which still works.
 */
function readUrlIndex(count: number) {
  const fromQuery = new URLSearchParams(window.location.search).get("present");
  const value = Number.parseInt(fromQuery ?? window.location.hash.slice(1), 10);
  return Number.isFinite(value) ? Math.min(Math.max(value - 1, 0), Math.max(count - 1, 0)) : 0;
}

/** This page's address set to a slide, as ?present=3, keeping any other parameters. */
function presentAddress(index: number) {
  const url = new URL(window.location.href);
  url.searchParams.set("present", String(index + 1));
  return `${url.pathname}${url.search}`;
}

/** Ids of web slides around `index`, so their pages start loading before they are shown. */
function nearbyWebIds(slides: Slide[], index: number) {
  // Live pages and live Figma slides: they keep their state once loaded.
  return slides.slice(Math.max(index - 1, 0), index + 2).filter(isPersistent).map((slide) => slide.id);
}

export function DeckPlayer({ name, slides: allSlides, startIndex, onClose, exitHref, onSlideChange }: DeckPlayerProps) {
  const slides = visibleSlides(allSlides);
  const standalone = !onClose;
  const rootRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(() =>
    standalone ? readUrlIndex(slides.length) : Math.min(startIndex ?? 0, Math.max(slides.length - 1, 0)),
  );
  // Web pages stay mounted once loaded, so what the audience did on them survives going back and forth.
  // Every live Figma slide loads as soon as the presentation opens and stays loaded, so opening
  // one never reloads it. Live pages load as they come near, then stay too.
  const [mounted, setMounted] = useState(
    () => new Set([...nearbyWebIds(slides, index), ...slides.filter((slide) => slide.kind === "figma" && slide.embedUrl).map((slide) => slide.id)]),
  );
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

  // On a live page, the keyboard follows the mouse: with the mouse over the page in its window,
  // keys go to the page (its own arrow keys, scrolling, typing); move it off the page and they
  // change slides again, with no click needed. Focus moves into or out of the page's frame to make that happen.
  const pointerInFrame = useRef(false);
  const onLivePage = useRef(false);
  useEffect(() => {
    onLivePage.current = slides[index]?.kind === "web";
  });
  const activeFrame = useCallback(
    () => rootRef.current?.querySelector<HTMLIFrameElement>(".deck-layer[data-active] iframe") ?? null,
    [],
  );
  // Where the mouse was last seen over the deck, so a new slide can tell whether it's over the
  // page without waiting for the mouse to move.
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const followPointer = useRef<() => void>(() => {});
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const follow = (inside: boolean) => {
      pointerInFrame.current = inside;
      // Off the slide, the keyboard always comes back to the deck, whatever kind of slide it is.
      if (!inside && document.activeElement instanceof HTMLIFrameElement) root.focus({ preventScroll: true });
      if (!onLivePage.current) return;
      const frame = activeFrame();
      if (inside && frame && document.activeElement !== frame) frame.focus({ preventScroll: true });
    };
    // On a live page, only the page itself counts, not the gray around its window; elsewhere,
    // the whole slide does.
    const isInside = (x: number, y: number) => {
      const target = onLivePage.current ? activeFrame() : root.querySelector(".deck-frame");
      const box = target?.getBoundingClientRect();
      return Boolean(box) && x >= box!.left && x <= box!.right && y >= box!.top && y <= box!.bottom;
    };
    followPointer.current = () => {
      const point = lastPointer.current;
      follow(point ? isInside(point.x, point.y) : false);
    };
    const onMove = (event: PointerEvent) => {
      lastPointer.current = { x: event.clientX, y: event.clientY };
      follow(isInside(event.clientX, event.clientY));
    };
    // Entering the page's frame: this document gets no more moves until the mouse comes back out.
    const onOver = (event: PointerEvent) => {
      lastPointer.current = { x: event.clientX, y: event.clientY };
      if (event.target instanceof HTMLIFrameElement) follow(true);
    };
    const onLeave = () => {
      lastPointer.current = null;
      follow(false);
    };
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerover", onOver);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerover", onOver);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [activeFrame]);

  // An embedded page can take the keyboard on its own (Figma's embed, or a page that focuses
  // itself as it loads). Unless the mouse is over a live page, take it straight back, so the
  // arrow keys keep working without a click.
  useEffect(() => {
    const reclaim = () => {
      const root = rootRef.current;
      const active = document.activeElement;
      // Any frame on the page counts, the slide preview behind the presentation included.
      if (!root || !(active instanceof HTMLIFrameElement)) return;
      const pageHasMouse =
        onLivePage.current &&
        pointerInFrame.current &&
        active.closest(".deck-layer[data-active]") !== null &&
        !active.closest(".deck-figma-live");
      if (!pageHasMouse) root.focus({ preventScroll: true });
    };
    // Focus moving into another site's frame (Figma's) can reach this page a little late, so
    // check a few times rather than once.
    const timers: number[] = [];
    const onBlur = () => {
      for (const delay of [0, 50, 150, 400]) timers.push(window.setTimeout(reclaim, delay));
    };
    window.addEventListener("blur", onBlur);
    // The same when a live page loses the keyboard to another frame, which this page doesn't hear.
    const watch = (frame: EventTarget | null) => {
      if (!(frame instanceof HTMLIFrameElement)) return;
      try {
        frame.contentWindow?.addEventListener("blur", onBlur);
      } catch {
        // Another site's frame: the page's own blur covers it.
      }
    };
    const onFrameLoad = (event: Event) => watch(event.target);
    const root = rootRef.current;
    root?.addEventListener("load", onFrameLoad, true);
    root?.querySelectorAll("iframe").forEach(watch);
    return () => {
      window.removeEventListener("blur", onBlur);
      root?.removeEventListener("load", onFrameLoad, true);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  // On a new slide, check again where the mouse is, without waiting for it to move: resting on
  // the page in a live slide's window hands it the keyboard; anywhere else (the gray around the
  // window, say) keeps the keyboard on the deck, so the arrow keys still change slides.
  useEffect(() => {
    const timer = setTimeout(() => followPointer.current(), 0);
    return () => clearTimeout(timer);
  }, [index, slides]);

  // The slide being shown, updated the moment it changes, so key presses quicker than the screen
  // updates still each move exactly one slide from the right place.
  const indexRef = useRef(index);
  const go = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(next, 0), slides.length - 1);
      indexRef.current = clamped;
      setIndex(clamped);
      setMounted((current) => {
        const ids = nearbyWebIds(slides, clamped).filter((id) => !current.has(id));
        return ids.length ? new Set([...current, ...ids]) : current;
      });
    },
    [slides],
  );
  const step = useCallback((delta: number) => go(indexRef.current + delta), [go]);

  // Stays on the same slide as the presenter view, in its own tab: moving in either moves both.
  const presentChannel = useRef<BroadcastChannel | null>(null);
  const followPresenter = useRef<(message: PresentMessage) => void>(() => undefined);
  useEffect(() => {
    followPresenter.current = (message) => {
      if (message.type === "slide" && message.from === "presenter") {
        if (message.index !== indexRef.current) go(message.index);
      } else if (message.type === "hello") {
        presentChannel.current?.postMessage({ type: "here", index: indexRef.current } satisfies PresentMessage);
      } else if (message.type === "end" && window.opener) {
        // Ending in the presenter view closes an audience view it opened.
        if (onClose) onClose();
        else closeTab(() => (exitHref ? window.location.assign(exitHref) : undefined));
      }
    };
  });
  useEffect(() => {
    const channel = openPresentChannel((message) => followPresenter.current(message));
    presentChannel.current = channel;
    channel?.postMessage({ type: "here", index: indexRef.current } satisfies PresentMessage);
    return () => {
      channel?.close();
      presentChannel.current = null;
    };
  }, []);

  /** Leaves the presentation: closes it in the editor, or goes back to Sandbox from a published deck. */
  const exit = useCallback(() => {
    if (onClose) onClose();
    else if (exitHref) window.location.assign(exitHref);
  }, [onClose, exitHref]);

  // While the mouse is over a live page, the keyboard is the page's alone: the presentation's
  // shortcuts (arrows, R, F, X) only work with the mouse off the page. N is the page window's own
  // fast-forward, so it still works there.

  useEffect(() => {
    if (standalone) history.replaceState(null, "", presentAddress(index));
  }, [index, standalone]);

  const slideChange = useRef(onSlideChange);
  useEffect(() => {
    slideChange.current = onSlideChange;
  });
  useEffect(() => {
    slideChange.current?.(index);
    presentChannel.current?.postMessage({ type: "slide", index, from: "audience" } satisfies PresentMessage);
  }, [index]);

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
    // An old-style #3 typed into the address still jumps there (and becomes ?present=3).
    const onHash = () => {
      const value = Number.parseInt(window.location.hash.slice(1), 10);
      if (Number.isFinite(value)) go(value - 1);
    };
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
      // X leaves the presentation, like R restarts it, wherever the mouse is.
      if ((event.key === "x" || event.key === "X") && !overview) {
        event.preventDefault();
        exit();
        return;
      }
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
          step(1);
          break;
        case "ArrowLeft":
        case "PageUp":
          if (overview) return;
          event.preventDefault();
          step(-1);
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
        case "F":
          // F toggles full screen, wherever the mouse is.
          event.preventDefault();
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
  }, [expanded, exit, go, onClose, overview, slides.length, step, toggleFullscreen]);

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
            <button type="button" className="deck-icon-button deck-close" onClick={onClose} aria-label="Close preview" title="Close (X)">
              <X size={18} strokeWidth={2} />
            </button>
          ) : (
            <a className="deck-icon-button deck-close" href={exitHref} aria-label="Back to Sandbox" title="Back to Sandbox (X)">
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
                <SlideView slide={slide} mirror />
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
            onClick={() => step(-1)}
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
            onClick={() => step(1)}
            disabled={index === slides.length - 1}
            aria-label="Next slide"
            title="Next (→)"
          >
            <ChevronRight size={18} strokeWidth={2} />
          </button>
        </div>
        <div className="deck-controls-actions">
          {/* The presenter view's tab if it's open, or a new one on this slide. */}
          <a
            className="deck-icon-button"
            href={viewUrl("presenter", index)}
            target={viewTabName("presenter")}
            rel="opener"
            onClick={(event) => openView("presenter", indexRef.current, event)}
            aria-label="Presenter view"
            title="Presenter view, with notes"
          >
            <NotebookText size={18} strokeWidth={2} />
          </a>
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
