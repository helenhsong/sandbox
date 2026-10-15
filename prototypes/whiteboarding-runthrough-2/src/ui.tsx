import { Fragment, useEffect, useRef, type ReactNode } from "react";
import {
  Badge,
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Label,
} from "@helenhsong/ui";
import { Bell, BookOpen, ChevronDown, MapPin, Search, ShoppingCart, User } from "lucide-react";
import { STATUS_LABEL, TEMPLATES, formatWhen, type Book, type Notice, type Status } from "./data";

export function BookCover({ book, size = "md" }: { book: Pick<Book, "title" | "author" | "cover">; size?: "sm" | "md" | "lg" }) {
  const label = `Cover of ${book.title || "untitled book"}`;
  if (book.cover.kind === "upload") {
    return <img className={`cover cover-${size}`} src={book.cover.url} alt={label} />;
  }
  const t = TEMPLATES[book.cover.id];
  return (
    <div className={`cover cover-${size}`} style={{ background: t.bg, color: t.fg }} role="img" aria-label={label}>
      <span className="cover-title">{book.title || "Your title"}</span>
      <span className="cover-author">{book.author}</span>
    </div>
  );
}

const TONE: Record<Status, string> = { draft: "neutral", review: "wait", ready: "go", changes: "stop", published: "done" };

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant="secondary" className={`badge tone-${TONE[status]}`}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

type HeaderProps = {
  notices: Notice[];
  active: "home" | "publish";
  onHome: () => void;
  onLanding: () => void;
  onBooks: () => void;
  onNotice: (n: Notice) => void;
  onReadAll: () => void;
};

export function StoreHeader({ notices, active, onHome, onLanding, onBooks, onNotice, onReadAll }: HeaderProps) {
  const unread = notices.filter((n) => !n.read).length;

  return (
    <header className="store-header">
      <div className="store-bar">
        <button className="wordmark" onClick={onHome}>
          amazon <span className="proto-tag">Prototype</span>
        </button>
        <span className="deliver">
          <MapPin size={14} aria-hidden /> Deliver to Maya · Seattle 98101
        </span>
        <div className="search" role="search">
          <input aria-label="Search Amazon" placeholder="Search Amazon" />
          <button aria-label="Search">
            <Search size={20} />
          </button>
        </div>

        <DropdownMenu onOpenChange={(open) => open && onReadAll()}>
          <DropdownMenuTrigger className="bar-btn" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
            <Bell size={20} />
            {unread > 0 && <span className="dot">{unread}</span>}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="menu notices">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              {notices.length === 0 ? (
                <p className="muted pad">No notifications yet.</p>
              ) : (
                notices.map((n) => (
                  <DropdownMenuItem key={n.id} className="notice" onClick={() => onNotice(n)}>
                    <BookOpen size={16} aria-hidden />
                    <span>
                      {n.text}
                      <span className="meta">{formatWhen(n.at)}</span>
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className="bar-btn account">
            <User size={16} aria-hidden />
            <span>Hello, Maya</span>
            <ChevronDown size={16} aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="menu">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Your account</DropdownMenuLabel>
              <DropdownMenuItem disabled>Your orders</DropdownMenuItem>
              <DropdownMenuItem disabled>Your Kindle library</DropdownMenuItem>
              <DropdownMenuItem onClick={onBooks}>Your books</DropdownMenuItem>
              <DropdownMenuItem onClick={onLanding}>Self-publishing</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="bar-btn cart" aria-label="Cart, 0 items">
          <ShoppingCart size={20} />
        </span>
      </div>
      <nav className="store-nav" aria-label="Departments">
        <button className={active === "home" ? "is-active" : ""} onClick={onHome}>
          Home
        </button>
        <span>Today's deals</span>
        <span>Books</span>
        <span>Kindle</span>
        <span>Audible</span>
        <button className={active === "publish" ? "is-active" : ""} onClick={onLanding}>
          Self-publishing
        </button>
      </nav>
    </header>
  );
}

export type CrumbPage = "home" | "landing" | "books";

/** One hierarchy for every breadcrumb, so each trail starts at the same root and lists every ancestor. */
const CRUMBS: Record<CrumbPage, { label: string; parent?: CrumbPage }> = {
  home: { label: "Amazon.com" },
  landing: { label: "Self-publishing", parent: "home" },
  books: { label: "Your books", parent: "landing" },
};

function trailTo(page: CrumbPage) {
  const trail: CrumbPage[] = [];
  for (let p: CrumbPage | undefined = page; p; p = CRUMBS[p].parent) trail.unshift(p);
  return trail;
}

export function Breadcrumbs({ page, onNavigate }: { page: CrumbPage; onNavigate: (to: CrumbPage) => void }) {
  const trail = trailTo(page);
  return (
    <Breadcrumb className="crumbs">
      <BreadcrumbList>
        {trail.map((p, i) => {
          const isFirst = i === 0;
          const isLast = i === trail.length - 1;
          // On narrow screens the middle collapses to an ellipsis; the root and current page stay.
          const middle = !isFirst && !isLast;
          return (
            <Fragment key={p}>
              {i === 1 && trail.length > 2 && (
                <>
                  <BreadcrumbSeparator className="crumb-collapse" />
                  <BreadcrumbItem className="crumb-collapse">
                    <BreadcrumbEllipsis />
                  </BreadcrumbItem>
                </>
              )}
              {!isFirst && <BreadcrumbSeparator className={middle ? "crumb-middle" : undefined} />}
              <BreadcrumbItem className={middle ? "crumb-middle" : undefined}>
                {isLast ? (
                  <BreadcrumbPage>{CRUMBS[p].label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<button className="crumb-link" onClick={() => onNavigate(p)} />}>{CRUMBS[p].label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
  /** Control that acts on the field (e.g. "Write with AI"), placed on the label row. */
  action?: ReactNode;
  /** Status of the value (e.g. a character count), placed under the input beside the hint. */
  status?: ReactNode;
};

export function Field({ label, hint, error, children, htmlFor, action, status }: FieldProps) {
  return (
    <div className="field">
      <div className="field-head">
        <Label htmlFor={htmlFor}>{label}</Label>
        {action}
      </div>
      {children}
      {(error || hint || status) && (
        <div className="field-foot">
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : (
            hint && <p className="hint">{hint}</p>
          )}
          {status && <span className="field-status">{status}</span>}
        </div>
      )}
    </div>
  );
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Offers `fill` to a Create deck window showing this page: its fast-forward button calls it
 * to fill in the current screen. Does nothing outside a deck.
 */
export function useDeckFill(fill: () => void) {
  const latest = useRef(fill);
  useEffect(() => {
    latest.current = fill;
  });
  useEffect(() => {
    const page = window as Window & { deckFill?: () => void };
    page.deckFill = () => latest.current();
    window.dispatchEvent(new Event("deckfill"));
    return () => {
      delete page.deckFill;
      window.dispatchEvent(new Event("deckfill"));
    };
  }, []);
}
