import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@helenhsong/ui";
import { Gift } from "lucide-react";
import { newBook, type Book, type Notice } from "./data";
import { Books, type Tab } from "./Books";
import { useHistoryState } from "./history";
import { PublishFlow } from "./PublishFlow";
import { Home, Landing } from "./Store";
import { Cover, StoreHeader, SubNav, Toast } from "./ui";

type View =
  | { name: "home" }
  | { name: "landing" }
  | { name: "flow"; book: Book; resubmit: boolean }
  | { name: "books" }
  | { name: "published"; id: string };

const CHANGES_REASON =
  "Some chapters include mature content, but the book is rated General audience. Change the audience to Adults only, or edit those chapters, then resubmit.";

export function App() {
  const [view, setView] = useHistoryState<View>("view", { name: "home" });
  const [books, setBooks] = useState<Book[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [tab, setTab] = useState<Tab>("review");
  const [banner, setBanner] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; bookId: string } | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view.name]);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 8000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const notify = (bookId: string, text: string) =>
    setNotices((n) => [{ id: crypto.randomUUID(), bookId, text, at: new Date(), read: false }, ...n]);

  const upsert = (b: Book) => setBooks((all) => (all.some((x) => x.id === b.id) ? all.map((x) => (x.id === b.id ? b : x)) : [b, ...all]));

  // Read the latest books from timers and handlers without re-creating them.
  const booksRef = useRef(books);
  useEffect(() => {
    booksRef.current = books;
  }, [books]);

  const decide = useCallback((book: Book, approve: boolean) => {
    const current = booksRef.current.find((x) => x.id === book.id);
    // Ignore a result for a book that was already decided, or resubmitted since.
    if (!current || current.status !== "review" || current.submittedAt?.getTime() !== book.submittedAt?.getTime()) return;
    setBooks((all) => all.map((x) => (x.id === book.id ? { ...x, status: approve ? "approved" : "changes", reason: approve ? null : CHANGES_REASON } : x)));
    const text = approve ? `“${book.title}” was approved. It's ready to publish.` : `“${book.title}” needs changes before it can be published.`;
    setNotices((n) => [{ id: crypto.randomUUID(), bookId: book.id, text, at: new Date(), read: false }, ...n]);
    setToast({ text, bookId: book.id });
    setTab(approve ? "approved" : "changes");
  }, []);

  const submit = (b: Book) => {
    const submitted: Book = { ...b, status: "review", submittedAt: new Date(), reason: null };
    upsert(submitted);
    notify(b.id, `“${b.title}” was submitted for review.`);
    setBanner(b.id);
    setTab("review");
    setOpenId(null);
    setView({ name: "books" });
    if (b.reviewType === "ai") timers.current.push(window.setTimeout(() => decide(submitted, true), 6000));
  };

  const publish = (b: Book) => {
    setToast(null);
    upsert({ ...b, status: "published", publishedAt: new Date() });
    notify(b.id, `“${b.title}” is live on Amazon.`);
    setOpenId(null);
    setBanner(null);
    setTab("published");
    setView({ name: "published", id: b.id });
  };

  const startNew = () => setView({ name: "flow", book: newBook(), resubmit: false });
  const edit = (b: Book) => {
    setOpenId(null);
    setView({ name: "flow", book: b, resubmit: b.status !== "draft" });
  };

  if (view.name === "flow") {
    return (
      <PublishFlow
        key={view.book.id}
        initial={view.book}
        resubmit={view.resubmit}
        onSubmit={submit}
        onExit={(draft) => {
          if (draft && !view.resubmit) {
            upsert({ ...draft, status: "draft" });
            setTab("draft");
            setView({ name: "books" });
          } else setView(books.length ? { name: "books" } : { name: "landing" });
        }}
      />
    );
  }

  const bannerBook = books.find((b) => b.id === banner) ?? null;
  const goBooks = () => setView({ name: "books" });
  const inPublishing = view.name !== "home";

  return (
    <div className="screen">
      <StoreHeader
        notices={notices}
        onHome={() => setView({ name: "home" })}
        onBooks={goBooks}
        hasBooks={books.length > 0}
        onReadNotices={() => setNotices((n) => n.map((x) => ({ ...x, read: true })))}
      />
      <SubNav active={inPublishing ? "publish" : undefined} onPublish={() => setView(books.length ? { name: "books" } : { name: "landing" })} />

      {view.name === "home" && <Home onStart={() => setView({ name: "landing" })} />}
      {view.name === "landing" && <Landing onStart={startNew} bookCount={books.length} onBooks={goBooks} />}
      {view.name === "books" && (
        <Books
          books={books}
          onLanding={() => setView({ name: "landing" })}
          tab={tab}
          setTab={setTab}
          banner={bannerBook?.status === "review" ? bannerBook : null}
          onDismissBanner={() => setBanner(null)}
          openId={openId}
          setOpenId={(id) => {
            if (id && id === toast?.bookId) setToast(null);
            setOpenId(id);
          }}
          onNewBook={startNew}
          onEdit={edit}
          onPublish={publish}
          onDecide={decide}
        />
      )}
      {view.name === "published" && <Published book={books.find((b) => b.id === view.id)!} firstBook={books.filter((b) => b.status === "published").length === 1} onBooks={goBooks} onHome={() => setView({ name: "home" })} />}

      {toast && view.name !== "published" && !openId && (
        <Toast onClose={() => setToast(null)}>
          <span>{toast.text}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setToast(null);
              setOpenId(toast.bookId);
              setView({ name: "books" });
            }}
          >
            Open
          </Button>
        </Toast>
      )}
    </div>
  );
}

const CONFETTI = ["oklch(0.7 0.15 30)", "oklch(0.75 0.14 85)", "oklch(0.65 0.12 150)", "oklch(0.6 0.13 255)", "oklch(0.65 0.15 320)"];

function Published({ book, firstBook, onBooks, onHome }: { book: Book; firstBook: boolean; onBooks: () => void; onHome: () => void }) {
  return (
    <div className="page published">
      <div className="confetti" aria-hidden="true">
        {Array.from({ length: 48 }, (_, i) => (
          <span
            key={i}
            style={{
              left: `${(i * 37) % 100}%`,
              background: CONFETTI[i % CONFETTI.length],
              animationDelay: `${(i % 12) * 0.08}s`,
              animationDuration: `${2.2 + (i % 5) * 0.3}s`,
              transform: `rotate(${i * 29}deg)`,
            }}
          />
        ))}
      </div>
      <div className="published-card">
        <Cover book={book} size="lg" />
        <div>
          <p className="eyebrow">Published</p>
          <h1>“{book.title}” is live on Amazon</h1>
          <p className="muted">Readers can find and buy it now. It can take a few hours to show up in search. We've emailed you a link to its page.</p>
          {firstBook && (
            <p className="offer">
              <Gift size={16} aria-hidden="true" /> Your first book is out. 2 months of Kindle Unlimited are on us, starting today.
            </p>
          )}
          <div className="published-actions">
            <Button variant="outline" onClick={onHome}>
              Back to Amazon home
            </Button>
            <Button onClick={onBooks}>Go to Your Books</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
