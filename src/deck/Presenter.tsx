import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { Button, Textarea } from "@helenhsong/ui";
import { ChevronLeft, ChevronRight, Globe, Minus, MonitorPlay, PanelBottom, PanelLeft, PanelRight, Pause, Pencil, Play, Plus, RotateCcw } from "lucide-react";
import { closeTab, openPresentChannel, openView, viewTabName, viewUrl, type PresentMessage } from "./presentSync";
import { SlideView } from "./SlideView";
import { visibleSlides, type Slide } from "./types";

interface PresenterProps {
  name: string;
  slides: Slide[];
  startIndex: number;
  /**
   * Saves a slide's notes, edited here with Edit: into the editor's deck, or, for a published
   * deck, in this browser. Without it, Edit is hidden.
   */
  onNotesChange?: (slideId: string, notes: string) => void;
}

const NOTES_SIZE_KEY = "deck-builder:notes-size";
const NOTES_PLACE_KEY = "deck-builder:notes-place";
type NotesPlace = "right" | "below";

/** The panels' sizes in pixels, as last dragged (remembered for next time). */
const SIZES_KEY = "deck-builder:presenter-sizes";
interface PanelSizes {
  list: number;
  notesWidth: number;
  notesHeight: number;
}
const DEFAULT_SIZES: PanelSizes = { list: 240, notesWidth: 360, notesHeight: 280 };

function readSizes(): PanelSizes {
  try {
    return { ...DEFAULT_SIZES, ...(JSON.parse(localStorage.getItem(SIZES_KEY) ?? "{}") as Partial<PanelSizes>) };
  } catch {
    return DEFAULT_SIZES;
  }
}

function readNotesPlace(): NotesPlace {
  try {
    return localStorage.getItem(NOTES_PLACE_KEY) === "below" ? "below" : "right";
  } catch {
    return "right";
  }
}
const NOTES_SIZES = [16, 20, 24, 28, 32, 40];

function readNotesSize() {
  try {
    const value = Number(localStorage.getItem(NOTES_SIZE_KEY));
    return NOTES_SIZES.includes(value) ? value : 24;
  } catch {
    return 24;
  }
}

/**
 * The presenter view, in its own tab beside the audience view, laid out like Figma's: the slides
 * down the left, the current slide in the middle with the controls under it, and this slide's
 * notes on the right, large enough to read at a glance. Moving here moves the audience view too,
 * and the other way round.
 */
export function Presenter({ name, slides: allSlides, startIndex, onNotesChange }: PresenterProps) {
  const slides = visibleSlides(allSlides);
  const last = Math.max(slides.length - 1, 0);
  const [index, setIndex] = useState(() => Math.min(Math.max(startIndex, 0), last));
  const [listOpen, setListOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [notesSize, setNotesSize] = useState(readNotesSize);
  // Panel sizes, changed by dragging the edges between panels; double-click an edge to reset it.
  const [sizes, setSizes] = useState(readSizes);
  const [resizing, setResizing] = useState<"x" | "y" | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const saveSizes = (next: PanelSizes) => {
    try {
      localStorage.setItem(SIZES_KEY, JSON.stringify(next));
    } catch {
      // Not remembered; it still applies now.
    }
  };
  // The drag in progress, so a new one (or leaving the view) always ends the last one cleanly.
  const endDrag = useRef<() => void>(() => undefined);
  useEffect(() => () => endDrag.current(), []);
  const startResize = (edge: "list" | "notes-w" | "notes-h", event: ReactPointerEvent<HTMLDivElement>) => {
    const body = bodyRef.current;
    if (!body || event.button !== 0) return;
    event.preventDefault();
    endDrag.current();
    const handle = event.currentTarget;
    handle.dataset.dragging = "";
    setResizing(edge === "notes-h" ? "y" : "x");
    const onMove = (move: PointerEvent) => {
      const box = body.getBoundingClientRect();
      // Keep room for the slide: at least 360px wide and 240px tall.
      setSizes((now) => {
        if (edge === "list") {
          const max = box.width - (notesPlace === "right" ? now.notesWidth : 0) - 360;
          return { ...now, list: Math.round(Math.min(Math.max(move.clientX - box.left, 160), Math.max(max, 160))) };
        }
        if (edge === "notes-w") {
          const max = box.width - (listOpen ? now.list : 0) - 360;
          return { ...now, notesWidth: Math.round(Math.min(Math.max(box.right - move.clientX, 240), Math.max(max, 240))) };
        }
        return { ...now, notesHeight: Math.round(Math.min(Math.max(box.bottom - move.clientY, 120), Math.max(box.height - 240, 120))) };
      });
    };
    const onUp = () => endDrag.current();
    endDrag.current = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("blur", onUp);
      delete handle.dataset.dragging;
      setResizing(null);
      setSizes((now) => {
        saveSizes(now);
        return now;
      });
      endDrag.current = () => undefined;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("blur", onUp);
  };
  const resetSize = (key: keyof PanelSizes) => {
    const next = { ...sizes, [key]: DEFAULT_SIZES[key] };
    setSizes(next);
    saveSizes(next);
  };

  // Notes beside the slide, or under it (remembered for next time).
  const [notesPlace, setNotesPlace] = useState(readNotesPlace);
  const placeNotes = (place: NotesPlace) => {
    setNotesPlace(place);
    try {
      localStorage.setItem(NOTES_PLACE_KEY, place);
    } catch {
      // Not remembered; it still applies now.
    }
  };
  const channel = useRef<BroadcastChannel | null>(null);
  const indexRef = useRef(index);

  const go = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(next, 0), last);
      indexRef.current = clamped;
      setIndex(clamped);
      channel.current?.postMessage({ type: "slide", index: clamped, from: "presenter" } satisfies PresentMessage);
    },
    [last],
  );

  useEffect(() => {
    channel.current = openPresentChannel((message) => {
      if (message.type === "slide" && message.from === "audience") {
        indexRef.current = message.index;
        setIndex(message.index);
      } else if (message.type === "here" && message.index !== indexRef.current) {
        // An audience view is open: bring it to the slide shown here.
        channel.current?.postMessage({ type: "slide", index: indexRef.current, from: "presenter" } satisfies PresentMessage);
      }
    });
    channel.current?.postMessage({ type: "hello" } satisfies PresentMessage);
    return () => channel.current?.close();
  }, []);

  useEffect(() => {
    document.title = `Presenter view · ${name}`;
  }, [name]);

  // The keyboard moves through the slides here, as it does in the audience view.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable]")) return;
      if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(event.key)) go(indexRef.current + 1);
      else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) go(indexRef.current - 1);
      else if (event.key === "Home") go(0);
      else if (event.key === "End") go(last);
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, last]);

  // The current slide stays in view in the list.
  const listRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    listRef.current?.querySelector("[aria-current='true']")?.scrollIntoView({ block: "nearest" });
  }, [index, listOpen]);

  const resize = (delta: number) => {
    const at = NOTES_SIZES.indexOf(notesSize);
    const next = NOTES_SIZES[Math.min(Math.max(at + delta, 0), NOTES_SIZES.length - 1)];
    setNotesSize(next);
    try {
      localStorage.setItem(NOTES_SIZE_KEY, String(next));
    } catch {
      // Not saved; it still applies now.
    }
  };

  const end = () => {
    channel.current?.postMessage({ type: "end" } satisfies PresentMessage);
    // A tab opened from another view closes; one opened any other way goes back to the deck's page.
    closeTab(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("presenter");
      window.location.assign(url.href);
    });
  };

  const current = slides[index] as Slide | undefined;
  const notes = current?.notes ?? "";

  // Live pages run here too, mirrored with the audience view: what you do on one here happens
  // there, with your mouse shown. Each stays loaded once opened, like in the audience view.
  const [liveIds, setLiveIds] = useState<string[]>([]);
  if (current?.kind === "web" && !liveIds.includes(current.id)) setLiveIds([...liveIds, current.id]);
  const livePages = slides.filter((slide) => slide.kind === "web" && liveIds.includes(slide.id));

  return (
    <div
      className="presenter dark"
      data-list={listOpen || undefined}
      data-notes={notesPlace}
      data-resizing={resizing ?? undefined}
      style={
        {
          "--list-w": `${sizes.list}px`,
          "--notes-w": `${sizes.notesWidth}px`,
          "--notes-h": `${sizes.notesHeight}px`,
        } as CSSProperties
      }
    >
      <header className="presenter-header">
        <div className="presenter-title">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setListOpen((open) => !open)}
            aria-pressed={listOpen}
            aria-label={listOpen ? "Hide slides" : "Show slides"}
            title={listOpen ? "Hide slides" : "Show slides"}
          >
            <PanelLeft size={16} strokeWidth={2} aria-hidden />
          </Button>
          <span className="presenter-name">{name}</span>
        </div>
        <Timer />
        <div className="presenter-actions">
          <div className="presenter-place" role="group" aria-label="Notes position">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => placeNotes("right")}
              aria-pressed={notesPlace === "right"}
              aria-label="Notes on the right"
              title="Notes on the right"
            >
              <PanelRight size={16} strokeWidth={2} aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => placeNotes("below")}
              aria-pressed={notesPlace === "below"}
              aria-label="Notes below the slide"
              title="Notes below the slide"
            >
              <PanelBottom size={16} strokeWidth={2} aria-hidden />
            </Button>
          </div>
          <Button onClick={end}>End presentation</Button>
        </div>
      </header>

      <div className="presenter-body" ref={bodyRef}>
        {listOpen ? (
          <div
            key="list"
            className="presenter-resize"
            data-axis="x"
            data-edge="list"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize the slide list"
            title="Drag to resize, double-click to reset"
            onPointerDown={(event) => startResize("list", event)}
            onDoubleClick={() => resetSize("list")}
          />
        ) : null}
        {notesPlace === "right" ? (
          <div
            key="notes-w"
            className="presenter-resize"
            data-axis="x"
            data-edge="notes-w"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize the notes"
            title="Drag to resize, double-click to reset"
            onPointerDown={(event) => startResize("notes-w", event)}
            onDoubleClick={() => resetSize("notesWidth")}
          />
        ) : (
          <div
            key="notes-h"
            className="presenter-resize"
            data-axis="y"
            data-edge="notes-h"
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize the notes"
            title="Drag to resize, double-click to reset"
            onPointerDown={(event) => startResize("notes-h", event)}
            onDoubleClick={() => resetSize("notesHeight")}
          />
        )}
        {listOpen ? (
          <nav className="presenter-list" aria-label="Slides">
            <ol ref={listRef}>
              {slides.map((slide, i) => (
                <li key={slide.id}>
                  <button type="button" onClick={() => go(i)} aria-current={i === index} aria-label={`Slide ${i + 1}: ${slideName(slide)}`}>
                    <span className="presenter-list-number">{i + 1}</span>
                    <span className="presenter-slide presenter-thumb">
                      <PresenterSlide slide={slide} />
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <main className="presenter-stage">
          <div className="presenter-current">
            <div className="presenter-slide">
              {current?.kind === "figma" ? <PresenterSlide slide={current} /> : null}
              {livePages.map((slide) => {
                const active = slide.id === current?.id;
                return (
                  <div key={slide.id} className="presenter-live-layer" data-active={active || undefined} aria-hidden={!active} inert={!active}>
                    <SlideView slide={slide} mirror="presenter" />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="presenter-controls">
            <div className="presenter-nav">
              <Button variant="secondary" size="icon" onClick={() => go(0)} aria-label="Back to the first slide" title="Back to the first slide">
                <RotateCcw size={16} strokeWidth={2} aria-hidden />
              </Button>
              <div className="presenter-stepper">
                <Button variant="ghost" size="icon" onClick={() => go(index - 1)} disabled={index <= 0} aria-label="Previous slide" title="Previous slide">
                  <ChevronLeft size={16} strokeWidth={2} aria-hidden />
                </Button>
                <span className="presenter-count" aria-live="polite">
                  {slides.length ? index + 1 : 0} / {slides.length}
                </span>
                <Button variant="ghost" size="icon" onClick={() => go(index + 1)} disabled={index >= last} aria-label="Next slide" title="Next slide">
                  <ChevronRight size={16} strokeWidth={2} aria-hidden />
                </Button>
              </div>
            </div>
            {/* Goes to the audience view's tab if it's open, or opens one on this slide. */}
            <Button
              variant="outline"
              size="default"
              nativeButton={false}
              render={<a href={viewUrl("audience", index)} target={viewTabName("audience")} rel="opener" />}
              onClick={(event: MouseEvent) => openView("audience", indexRef.current, event)}
            >
              <MonitorPlay size={16} strokeWidth={2} aria-hidden />
              Audience view
            </Button>
          </div>
        </main>

        <aside className="presenter-notes" aria-label="Notes">
          <p className="presenter-notes-slide">{current ? slideName(current) : ""}</p>
          <div className="presenter-notes-body">
            {editing && current && onNotesChange ? (
              <Textarea
                key={current.id}
                aria-label="Presenter notes"
                value={notes}
                onChange={(event) => onNotesChange(current.id, event.target.value)}
                placeholder="Add presenter notes…"
                style={{ fontSize: notesSize }}
                autoFocus
              />
            ) : notes.trim() ? (
              <p className="presenter-notes-text" style={{ fontSize: notesSize }}>
                {notes}
              </p>
            ) : (
              <p className="presenter-notes-empty">No notes for this slide.</p>
            )}
          </div>
          <div className="presenter-notes-tools">
            {onNotesChange ? (
              <Button variant="outline" size="default" onClick={() => setEditing((on) => !on)} aria-pressed={editing}>
                {editing ? null : <Pencil size={16} strokeWidth={2} aria-hidden />}
                {editing ? "Done" : "Edit"}
              </Button>
            ) : (
              <span />
            )}
            <div className="presenter-notes-size">
              <Button variant="outline" size="icon" onClick={() => resize(-1)} disabled={notesSize <= NOTES_SIZES[0]} aria-label="Smaller notes" title="Smaller notes">
                <Minus size={16} strokeWidth={2} aria-hidden />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => resize(1)}
                disabled={notesSize >= NOTES_SIZES[NOTES_SIZES.length - 1]}
                aria-label="Larger notes"
                title="Larger notes"
              >
                <Plus size={16} strokeWidth={2} aria-hidden />
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function slideName(slide: Slide) {
  return slide.kind === "figma" ? slide.name : slide.title || "Live page";
}

/** A slide as a still: Figma slides as their image, and live pages (in the list) as a card. */
function PresenterSlide({ slide }: { slide: Slide }) {
  if (slide.kind === "figma") return <SlideView slide={{ ...slide, embedUrl: undefined }} />;
  return (
    <div className="presenter-live">
      <Globe size={16} strokeWidth={2} aria-hidden />
      <p className="presenter-live-title">{slide.title || "Live page"}</p>
    </div>
  );
}

/** Time since the presentation started, with pause and reset. */
function Timer() {
  // Seconds counted before the last pause, and when it last started (null while paused).
  const [carried, setCarried] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (startedAt === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  const running = startedAt !== null;
  const elapsed = Math.floor(carried + (running ? Math.max(now - startedAt, 0) / 1000 : 0));
  const toggle = () => {
    const at = Date.now();
    if (running) {
      setCarried(carried + Math.max(at - startedAt, 0) / 1000);
      setStartedAt(null);
    } else {
      setStartedAt(at);
    }
    setNow(at);
  };
  const reset = () => {
    const at = Date.now();
    setCarried(0);
    setStartedAt(running ? at : null);
    setNow(at);
  };

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  const time = `${hours ? `${hours}:${String(minutes).padStart(2, "0")}` : minutes}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="presenter-timer">
      <span className="presenter-time" aria-label={`Time presenting: ${time}`}>
        {time}
      </span>
      <Button variant="ghost" size="icon-sm" onClick={toggle} aria-label={running ? "Pause timer" : "Resume timer"} title={running ? "Pause timer" : "Resume timer"}>
        {running ? <Pause size={16} strokeWidth={2} aria-hidden /> : <Play size={16} strokeWidth={2} aria-hidden />}
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={reset} aria-label="Reset timer" title="Reset timer">
        <RotateCcw size={16} strokeWidth={2} aria-hidden />
      </Button>
    </div>
  );
}
