import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@helenhsong/ui";
import { ArrowLeft, ArrowRight, Globe, MonitorPlay, Pause, Play, RotateCcw } from "lucide-react";
import { SlideView } from "../../../src/deck/SlideView";
import { visibleSlides, type Slide } from "../../../src/deck/types";
import { closeTab, openPresentChannel, presentTabUrl, type PresentMessage } from "./presentSync";

interface PresenterProps {
  name: string;
  slides: Slide[];
  startIndex: number;
}

/**
 * The presenter view, in its own tab beside the audience view: the current slide and the next
 * one, this slide's notes, and a timer. Moving here moves the audience view too, and the other
 * way round.
 */
export function Presenter({ name, slides: allSlides, startIndex }: PresenterProps) {
  const slides = visibleSlides(allSlides);
  const last = Math.max(slides.length - 1, 0);
  const [index, setIndex] = useState(() => Math.min(Math.max(startIndex, 0), last));
  const [audienceOpen, setAudienceOpen] = useState(false);
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
        setAudienceOpen(true);
      } else if (message.type === "here") {
        // An audience view is open: bring it to the slide shown here.
        setAudienceOpen(true);
        if (message.index !== indexRef.current) {
          channel.current?.postMessage({ type: "slide", index: indexRef.current, from: "presenter" } satisfies PresentMessage);
        }
      } else if (message.type === "bye") {
        setAudienceOpen(false);
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
      if (["ArrowRight", "PageDown", " "].includes(event.key)) go(indexRef.current + 1);
      else if (["ArrowLeft", "PageUp"].includes(event.key)) go(indexRef.current - 1);
      else if (event.key === "Home") go(0);
      else if (event.key === "End") go(last);
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, last]);

  const end = () => {
    channel.current?.postMessage({ type: "end" } satisfies PresentMessage);
    const backToEditor = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete("presenter");
      window.location.assign(url.href);
    };
    // Only a tab the editor opened closes itself; one opened any other way goes back to the editor.
    if (window.opener) closeTab(backToEditor);
    else backToEditor();
  };

  const current = slides[index] as Slide | undefined;
  const next = slides[index + 1] as Slide | undefined;
  const notes = current?.notes?.trim();

  return (
    <div className="presenter">
      <header className="presenter-header">
        <div className="presenter-title">
          <span className="presenter-name">{name}</span>
          <span className="presenter-count">
            Slide {slides.length ? index + 1 : 0} of {slides.length}
          </span>
        </div>
        <Timer />
        <div className="presenter-actions">
          {!audienceOpen ? (
            <Button
              variant="outline"
              nativeButton={false}
              render={<a href={presentTabUrl("audience", index)} target="_blank" rel="opener" />}
            >
              <MonitorPlay size={16} strokeWidth={2} aria-hidden />
              Open audience view
            </Button>
          ) : null}
          <Button onClick={end}>End presentation</Button>
        </div>
      </header>

      <main className="presenter-body">
        <section className="presenter-current" aria-label="Current slide">
          <div className="presenter-slide">{current ? <PresenterSlide slide={current} /> : null}</div>
          <div className="presenter-nav">
            <Button variant="outline" onClick={() => go(index - 1)} disabled={index <= 0}>
              <ArrowLeft size={16} strokeWidth={2} aria-hidden />
              Previous
            </Button>
            <Button variant="outline" onClick={() => go(index + 1)} disabled={index >= last}>
              Next
              <ArrowRight size={16} strokeWidth={2} aria-hidden />
            </Button>
          </div>
        </section>
        <aside className="presenter-side">
          <section className="presenter-next" aria-label="Next slide">
            <h2>Next</h2>
            <div className="presenter-slide">
              {next ? <PresenterSlide slide={next} /> : <div className="presenter-slide-end">End of deck</div>}
            </div>
          </section>
          <section className="presenter-notes" aria-label="Notes">
            <h2>Notes</h2>
            {notes ? <p>{notes}</p> : <p className="presenter-notes-empty">No notes for this slide.</p>}
          </section>
        </aside>
      </main>
    </div>
  );
}

/**
 * A slide as the presenter sees it: Figma slides as their image, and live pages as a card (the
 * page itself runs in the audience view, where people use it).
 */
function PresenterSlide({ slide }: { slide: Slide }) {
  if (slide.kind === "figma") return <SlideView slide={{ ...slide, embedUrl: undefined }} />;
  return (
    <div className="presenter-live">
      <Globe size={20} strokeWidth={2} aria-hidden />
      <p className="presenter-live-title">{slide.title || "Live page"}</p>
      <p className="presenter-live-hint">Live page. Use it in the audience view.</p>
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
