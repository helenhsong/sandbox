import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bell, BookOpen, ChevronDown, Search, X } from "lucide-react";
import { COVER_TEMPLATES, READER, STATUS_LABEL, formatTime, type Book, type Notice, type Status } from "./data";

export function Cover({ book, size = "md" }: { book: Pick<Book, "title" | "author" | "cover">; size?: "sm" | "md" | "lg" }) {
  if (book.cover.kind === "upload") {
    return <img className={`cover cover-${size}`} src={book.cover.url} alt={`Cover of ${book.title || "untitled book"}`} />;
  }
  const t = COVER_TEMPLATES[book.cover.template];
  return (
    <div className={`cover cover-${size}`} style={{ background: t.bg, color: t.fg }} role="img" aria-label={`Cover of ${book.title || "untitled book"}`}>
      <span className="cover-title">{book.title || "Your title"}</span>
      <span className="cover-author">{book.author}</span>
    </div>
  );
}

const STATUS_TONE: Record<Status, string> = {
  draft: "neutral",
  review: "wait",
  approved: "progress",
  changes: "blocked",
  published: "done",
};

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`badge tone-${STATUS_TONE[status]}`}>{STATUS_LABEL[status]}</span>;
}

export function Wordmark() {
  return (
    <span className="wordmark">
      amazon <span className="proto-tag">Prototype</span>
    </span>
  );
}

type HeaderProps = {
  notices: Notice[];
  onHome: () => void;
  onBooks: () => void;
  onReadNotices: () => void;
};

export function StoreHeader({ notices, onHome, onBooks, onReadNotices }: HeaderProps) {
  const [open, setOpen] = useState<null | "account" | "notices">(null);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notices.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <header className="store-header" ref={ref}>
      <button className="link-reset" onClick={onHome} aria-label="Amazon home">
        <Wordmark />
      </button>
      <label className="search">
        <Search size={16} aria-hidden="true" />
        <span className="sr-only">Search Amazon</span>
        <input placeholder="Search Amazon" />
      </label>
      <div className="header-actions">
        <div className="menu-anchor">
          <button
            className="header-btn"
            aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
            aria-expanded={open === "notices"}
            onClick={() => {
              setOpen(open === "notices" ? null : "notices");
              if (unread) onReadNotices();
            }}
          >
            <Bell size={20} aria-hidden="true" />
            {unread > 0 && <span className="dot">{unread}</span>}
          </button>
          {open === "notices" && (
            <div className="menu menu-wide" role="menu">
              <p className="menu-title">Notifications</p>
              {notices.length === 0 ? (
                <p className="menu-empty muted">You're all caught up.</p>
              ) : (
                notices.map((n) => (
                  <button
                    key={n.id}
                    role="menuitem"
                    className="menu-item notice"
                    onClick={() => {
                      setOpen(null);
                      onBooks();
                    }}
                  >
                    <span>{n.text}</span>
                    <span className="muted meta">{formatTime(n.at)}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <div className="menu-anchor">
          <button className="header-btn account" aria-expanded={open === "account"} onClick={() => setOpen(open === "account" ? null : "account")}>
            <span className="account-text">
              <span className="muted meta">Hello, {READER.name}</span>
              <span className="strong">Account & Lists</span>
            </span>
            <ChevronDown size={16} aria-hidden="true" />
          </button>
          {open === "account" && (
            <div className="menu" role="menu">
              <span className="menu-item disabled">Your orders</span>
              <span className="menu-item disabled">Your Kindle library</span>
              <button
                role="menuitem"
                className="menu-item"
                onClick={() => {
                  setOpen(null);
                  onBooks();
                }}
              >
                <BookOpen size={16} aria-hidden="true" /> Your books
                <span className="new-pill">New</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function SubNav({ active, onPublish }: { active?: "publish"; onPublish: () => void }) {
  return (
    <nav className="subnav" aria-label="Departments">
      {["All", "Today's Deals", "Books", "Kindle", "Kindle Unlimited", "Audible"].map((d) => (
        <span key={d} className="subnav-item">
          {d}
        </span>
      ))}
      <button className={`subnav-item subnav-link ${active === "publish" ? "active" : ""}`} onClick={onPublish} aria-current={active === "publish" ? "page" : undefined}>
        Self-publishing
      </button>
    </nav>
  );
}

export function Toast({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="toast" role="status">
      <div className="toast-body">{children}</div>
      <button className="icon-btn" aria-label="Dismiss" onClick={onClose}>
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
