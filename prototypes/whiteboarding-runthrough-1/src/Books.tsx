import { useEffect, useRef } from "react";
import { Button } from "@helenhsong/ui";
import { BookPlus, CircleCheck, Clock, Lock, Mail, Rocket, ShieldCheck, Sparkles, TriangleAlert, X } from "lucide-react";
import { COVER_TEMPLATES, RATING_LABEL, READER, STATUS_LABEL, dueBy, formatDate, type Book, type Status } from "./data";
import { Cover, StatusBadge } from "./ui";

export type Tab = Status | "all";
const TABS: Tab[] = ["approved", "review", "changes", "draft", "published", "all"];

type Props = {
  books: Book[];
  tab: Tab;
  setTab: (t: Tab) => void;
  banner: Book | null;
  onDismissBanner: () => void;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  onNewBook: () => void;
  onEdit: (b: Book) => void;
  onPublish: (b: Book) => void;
  onDecide: (b: Book, approve: boolean) => void;
};

export function Books({ books, tab, setTab, banner, onDismissBanner, openId, setOpenId, onNewBook, onEdit, onPublish, onDecide }: Props) {
  const counts = (t: Tab) => (t === "all" ? books.length : books.filter((b) => b.status === t).length);
  const rows = tab === "all" ? books : books.filter((b) => b.status === tab);
  const open = books.find((b) => b.id === openId) ?? null;

  return (
    <div className="page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <span>Self-publishing</span> / <span aria-current="page">Your books</span>
      </nav>
      <header className="page-header">
        <div>
          <h1>Your books</h1>
          <p className="muted">Track review, publish approved books, and see how they're doing.</p>
        </div>
        <Button onClick={onNewBook}>
          <BookPlus size={16} aria-hidden="true" /> Publish a book
        </Button>
      </header>

      {banner && (
        <div className="banner" role="status">
          <CircleCheck size={20} aria-hidden="true" />
          <div>
            <p className="strong">“{banner.title}” was submitted for review</p>
            <p className="muted">
              {banner.reviewType === "ai" ? "AI review usually takes a few minutes." : "A reviewer will finish within 24 hours."} We'll let you know here
              and by email at {READER.email}.
            </p>
            <p className="muted meta">
              <Mail size={14} aria-hidden="true" /> Email sent: “We received your book”
            </p>
          </div>
          <button className="icon-btn" aria-label="Dismiss" onClick={onDismissBanner}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {books.length === 0 ? (
        <div className="empty">
          <BookPlus size={32} strokeWidth={1.5} aria-hidden="true" />
          <h2>No books yet</h2>
          <p className="muted">When you start publishing, your books show up here with their review status and sales.</p>
          <Button onClick={onNewBook}>Publish a book</Button>
        </div>
      ) : (
        <>
          <div className="tabs" role="tablist" aria-label="Book status">
            {TABS.map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
                {t === "all" ? "All" : STATUS_LABEL[t]} <span className="count">{counts(t)}</span>
              </button>
            ))}
          </div>
          {rows.length === 0 ? (
            <div className="empty small">
              <p className="muted">No books {tab === "all" ? "" : `in ${STATUS_LABEL[tab as Status].toLowerCase()}`} right now.</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Book</th>
                  {tab === "all" && <th>Status</th>}
                  {tab !== "draft" && tab !== "all" && <th>Review</th>}
                  {(tab === "review" || tab === "approved" || tab === "changes") && <th>Submitted</th>}
                  {tab === "review" && <th>Result by</th>}
                  {tab === "changes" && <th>Reason</th>}
                  {tab === "published" && <th>Live since</th>}
                  {tab === "published" && <th className="num">Sales</th>}
                  {tab === "draft" && <th>Last step</th>}
                  <th className="num">Price</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id} className={openId === b.id ? "selected" : ""}>
                    <td>
                      <button className="link-reset book-cell" onClick={() => setOpenId(b.id)}>
                        <Cover book={b} size="sm" />
                        <span>
                          <span className="strong block">{b.title || "Untitled"}</span>
                          <span className="muted meta">{b.author}</span>
                        </span>
                      </button>
                    </td>
                    {tab === "all" && (
                      <td>
                        <StatusBadge status={b.status} />
                      </td>
                    )}
                    {tab !== "draft" && tab !== "all" && <td>{b.reviewType === "ai" ? "AI" : "Human"}</td>}
                    {(tab === "review" || tab === "approved" || tab === "changes") && <td>{formatDate(b.submittedAt)}</td>}
                    {tab === "review" && (
                      <td>
                        <span className="inline">
                          <Clock size={14} aria-hidden="true" /> {dueBy(b)}
                        </span>
                      </td>
                    )}
                    {tab === "changes" && <td>Audience rating</td>}
                    {tab === "published" && <td>{formatDate(b.publishedAt)}</td>}
                    {tab === "published" && <td className="num">{b.sales}</td>}
                    {tab === "draft" && <td>{b.manuscript ? "Cover" : "Book details"}</td>}
                    <td className="num">${Number.parseFloat(b.price || "0").toFixed(2)}</td>
                    <td className="row-actions">
                      <RowAction b={b} onOpen={() => setOpenId(b.id)} onEdit={() => onEdit(b)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {open && <BookSheet book={open} onClose={() => setOpenId(null)} onEdit={onEdit} onPublish={onPublish} onDecide={onDecide} />}
    </div>
  );
}

function RowAction({ b, onOpen, onEdit }: { b: Book; onOpen: () => void; onEdit: () => void }) {
  if (b.status === "approved") return <Button size="sm" onClick={onOpen}>Publish</Button>;
  if (b.status === "changes") return <Button size="sm" variant="outline" onClick={onOpen}>See changes</Button>;
  if (b.status === "draft") return <Button size="sm" variant="outline" onClick={onEdit}>Continue</Button>;
  return (
    <Button size="sm" variant="ghost" onClick={onOpen}>
      View
    </Button>
  );
}

function BookSheet({ book, onClose, onEdit, onPublish, onDecide }: { book: Book; onClose: () => void; onEdit: (b: Book) => void; onPublish: (b: Book) => void; onDecide: (b: Book, approve: boolean) => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="scrim" role="presentation" onClick={onClose}>
      <aside className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onClick={(e) => e.stopPropagation()}>
        <header className="sheet-header">
          <div>
            <h2 id="sheet-title">{book.title || "Untitled"}</h2>
            <StatusBadge status={book.status} />
          </div>
          <button ref={closeRef} className="icon-btn" aria-label="Close" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="sheet-body">
          <StatusPanel book={book} />
          <div className="sheet-book">
            <Cover book={book} size="md" />
            <dl className="facts">
              <div>
                <dt>Author</dt>
                <dd>{book.author}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{book.genre || "—"}</dd>
              </div>
              <div>
                <dt>Audience</dt>
                <dd>{book.rating ? RATING_LABEL[book.rating] : "—"}</dd>
              </div>
              <div>
                <dt>Price</dt>
                <dd>${Number.parseFloat(book.price || "0").toFixed(2)}</dd>
              </div>
              <div>
                <dt>Cover</dt>
                <dd>{book.cover.kind === "upload" ? book.cover.name : `${COVER_TEMPLATES[book.cover.template].name} template`}</dd>
              </div>
            </dl>
          </div>
          {book.description && <p className="muted">{book.description}</p>}

          {book.status === "review" && (
            <div className="proto-controls">
              <p className="meta strong">Prototype controls</p>
              <p className="muted meta">Skip the wait and simulate the review result.</p>
              <div className="footer-right">
                <Button size="sm" variant="outline" onClick={() => onDecide(book, false)}>
                  Request changes
                </Button>
                <Button size="sm" variant="outline" onClick={() => onDecide(book, true)}>
                  Approve now
                </Button>
              </div>
            </div>
          )}
        </div>

        <footer className="sheet-footer">
          {book.status === "approved" && (
            <>
              <Button variant="outline" onClick={() => onEdit(book)}>
                Make changes and resubmit
              </Button>
              <Button onClick={() => onPublish(book)}>
                <Rocket size={16} aria-hidden="true" /> Publish
              </Button>
            </>
          )}
          {book.status === "changes" && <Button onClick={() => onEdit(book)}>Fix and resubmit</Button>}
          {book.status === "draft" && <Button onClick={() => onEdit(book)}>Continue publishing</Button>}
          {(book.status === "review" || book.status === "published") && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </footer>
      </aside>
    </div>
  );
}

function StatusPanel({ book }: { book: Book }) {
  if (book.status === "review")
    return (
      <div className="status-panel tone-wait">
        {book.reviewType === "ai" ? <Sparkles size={20} aria-hidden="true" /> : <ShieldCheck size={20} aria-hidden="true" />}
        <div>
          <p className="strong">{book.reviewType === "ai" ? "AI review in progress" : "Waiting for a reviewer"}</p>
          <p className="muted meta">
            Submitted {formatDate(book.submittedAt)}. Result by: {dueBy(book)}. Your book is locked until review finishes.
          </p>
        </div>
      </div>
    );
  if (book.status === "approved")
    return (
      <div className="status-panel tone-progress">
        <CircleCheck size={20} aria-hidden="true" />
        <div>
          <p className="strong">Approved. Ready to publish.</p>
          <p className="muted meta">
            <Lock size={12} aria-hidden="true" /> What you submitted is what goes live. To change anything, resubmit for review.
          </p>
        </div>
      </div>
    );
  if (book.status === "changes")
    return (
      <div className="status-panel tone-blocked">
        <TriangleAlert size={20} aria-hidden="true" />
        <div>
          <p className="strong">Needs changes before it can be published</p>
          <p className="muted meta">{book.reason}</p>
        </div>
      </div>
    );
  if (book.status === "published")
    return (
      <div className="status-panel tone-done">
        <Rocket size={20} aria-hidden="true" />
        <div>
          <p className="strong">Live on Amazon since {formatDate(book.publishedAt)}</p>
          <p className="muted meta">{book.sales} sales so far. Sales update every few hours.</p>
        </div>
      </div>
    );
  return (
    <div className="status-panel tone-neutral">
      <Clock size={20} aria-hidden="true" />
      <div>
        <p className="strong">Draft</p>
        <p className="muted meta">Not submitted yet. Pick up where you left off.</p>
      </div>
    </div>
  );
}
