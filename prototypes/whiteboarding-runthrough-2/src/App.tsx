import { useEffect, useRef, useState } from "react";
import { Button } from "@helenhsong/ui";
import { Gift } from "lucide-react";
import { Books, type Banner, type View } from "./Books";
import { useDeckFill, useHistoryState } from "../../../src/live-page";
import { PublishFlow } from "./PublishFlow";
import { Home, Landing } from "./Store";
import { EMAIL, emptyBook, sampleBooks, type Book, type Notice } from "./data";
import { BookCover, StoreHeader, prefersReducedMotion } from "./ui";

type Screen = "home" | "landing" | "flow" | "books" | "published";
const AI_REVIEW_MS = 5000;

export function App() {
  const [screen, setScreen] = useHistoryState<Screen>("screen", "home");
  const [books, setBooks] = useState<Book[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  // Kept after leaving the flow, so Back can return to it.
  const [draft, setDraft] = useState<{ book: Book; resubmit: boolean } | null>(null);
  const [view, setView] = useState<View>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [published, setPublished] = useState<Book | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const notify = (bookId: string, text: string) =>
    setNotices((n) => [{ id: `n${Date.now()}${Math.random()}`, bookId, text, at: Date.now(), read: false }, ...n]);

  const upsert = (b: Book) => setBooks((list) => (list.some((x) => x.id === b.id) ? list.map((x) => (x.id === b.id ? b : x)) : [b, ...list]));

  // In a deck, the window's fill button loads sample books into the empty Your books page.
  useDeckFill(
    screen === "books" && books.length === 0
      ? () => {
          setBooks(sampleBooks());
          setView("all");
        }
      : null,
  );

  const goBooks = (v?: View) => {
    setView(v ?? "all");
    setScreen("books");
  };

  const startNew = () => {
    setDraft({ book: emptyBook(), resubmit: false });
    setOpenId(null);
    setBanner(null);
    setScreen("flow");
  };

  const completeReview = (book: Book, ok: boolean, byUser = false) => {
    const at = Date.now();
    setBooks((list) =>
      list.map((b) =>
        b.id !== book.id || b.status !== "review"
          ? b
          : ok
            ? { ...b, status: "ready", reviewedAt: at, updatedAt: at, reason: undefined }
            : {
                ...b,
                status: "changes",
                reviewedAt: at,
                updatedAt: at,
                reason: {
                  label: "Description doesn't match content",
                  detail: "Your description mentions a mystery plot that we couldn't find in the manuscript. Update the description so readers know what to expect, then resubmit.",
                },
              },
      ),
    );
    notify(book.id, ok ? `"${book.title}" was approved and is ready to publish.` : `"${book.title}" needs changes before it can be published.`);
    setBanner(
      ok
        ? { tone: "go", title: `"${book.title}" is approved`, text: "Open it and click Publish to make it available on Amazon." }
        : { tone: "stop", title: `"${book.title}" needs changes`, text: "Open it to see what to fix, then resubmit." },
    );
    // A background review never switches the tab out from under the user; counts and the banner show the change.
    if (byUser) setView(ok ? "ready" : "changes");
  };

  const submit = (b: Book) => {
    const at = Date.now();
    const sub: Book = { ...b, status: "review", step: 4, submittedAt: at, updatedAt: at, reviewedAt: undefined, reason: undefined };
    upsert(sub);
    notify(sub.id, `"${sub.title}" was submitted for review.`);
    setBanner({
      tone: "go",
      title: `"${sub.title}" is submitted for review`,
      text:
        sub.reviewType === "ai"
          ? `AI review usually takes under an hour (about 5 seconds in this prototype). We'll email ${EMAIL} and notify you here.`
          : `Human review takes up to 24 hours. We'll email ${EMAIL} and notify you here.`,
    });
    setOpenId(null);
    setView("review");
    setScreen("books");
    if (sub.reviewType === "ai") timers.current.push(window.setTimeout(() => completeReview(sub, true), AI_REVIEW_MS));
  };

  const saveExit = (b: Book) => {
    const wasResubmit = draft?.resubmit;
    if (!wasResubmit) {
      upsert({ ...b, status: "draft", updatedAt: Date.now(), title: b.title });
      setView("draft");
      setToast("Draft saved. Continue anytime from Your books.");
    } else {
      setView("all");
      setToast("Changes discarded. Your book wasn't resubmitted.");
    }
    setScreen("books");
  };

  const edit = (b: Book) => {
    setDraft({ book: b, resubmit: b.status !== "draft" });
    setOpenId(null);
    setBanner(null);
    setScreen("flow");
  };

  const publish = (b: Book) => {
    const at = Date.now();
    const p: Book = { ...b, status: "published", publishedAt: at, updatedAt: at, sales: 0 };
    upsert(p);
    notify(p.id, `"${p.title}" is live on Amazon.`);
    setOpenId(null);
    setBanner(null);
    setPublished(p);
    setScreen("published");
  };

  if (screen === "flow" && draft) {
    return <PublishFlow key={draft.book.id} initial={draft.book} resubmit={draft.resubmit} onSaveExit={saveExit} onSubmit={submit} />;
  }

  return (
    <div className="screen">
      <StoreHeader
        notices={notices}
        active={screen === "home" ? "home" : "publish"}
        onHome={() => setScreen("home")}
        onLanding={() => setScreen("landing")}
        onBooks={() => goBooks()}
        onReadAll={() => setNotices((n) => n.map((x) => ({ ...x, read: true })))}
        onNotice={(n) => {
          const b = books.find((x) => x.id === n.bookId);
          goBooks(b?.status);
          setOpenId(n.bookId);
        }}
      />
      {screen === "home" && <Home onStart={() => setScreen("landing")} />}
      {screen === "landing" && <Landing onStart={startNew} onBooks={() => goBooks()} onHome={() => setScreen("home")} hasBooks={books.length > 0} />}
      {screen === "books" && (
        <Books
          books={books}
          view={view}
          onView={setView}
          banner={banner}
          onDismissBanner={() => setBanner(null)}
          openId={openId}
          onOpen={setOpenId}
          onNew={startNew}
          onLanding={() => setScreen("landing")}
          onHome={() => setScreen("home")}
          onPublish={publish}
          onEdit={edit}
          onCompleteReview={(b, ok) => completeReview(b, ok, true)}
        />
      )}
      {screen === "published" && published && <Published book={published} onBooks={() => goBooks("published")} onHome={() => setScreen("home")} />}
      <div className="toast-region" aria-live="polite">
        {toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  );
}

const CONFETTI_COLORS = ["#f59e0b", "#ef4444", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899"];

function Published({ book, onBooks, onHome }: { book: Book; onBooks: () => void; onHome: () => void }) {
  const [pieces] = useState(() =>
    prefersReducedMotion()
      ? []
      : Array.from({ length: 90 }, (_, i) => ({
          left: Math.random() * 100,
          delay: Math.random() * 0.8,
          dur: 2.2 + Math.random() * 1.6,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          rot: Math.random() * 360,
        })),
  );
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);

  return (
    <main className="page published">
      <div className="confetti" aria-hidden>
        {pieces.map((c, i) => (
          <span key={i} style={{ left: `${c.left}%`, background: c.color, animationDelay: `${c.delay}s`, animationDuration: `${c.dur}s`, rotate: `${c.rot}deg` }} />
        ))}
      </div>
      <section className="published-card">
        <BookCover book={book} size="lg" />
        <h1 ref={heading} tabIndex={-1}>
          Your book is published
        </h1>
        <p className="muted">
          "{book.title}" by {book.author} is live in the Kindle Store. It can take a few hours to appear in search.
        </p>
        <div className="offer">
          <Gift size={20} aria-hidden />
          <div>
            <p className="strong">First-book offer unlocked</p>
            <p className="muted">3 months of Kindle Unlimited are on us. We've added them to your account.</p>
          </div>
        </div>
        <div className="actions center">
          <Button variant="outline" onClick={onHome}>
            Back to Amazon
          </Button>
          <Button onClick={onBooks}>Go to Your books</Button>
        </div>
      </section>
    </main>
  );
}
