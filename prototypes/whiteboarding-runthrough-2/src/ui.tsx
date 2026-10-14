import { Fragment, type ReactNode } from "react";
import {
  Badge,
  Breadcrumb,
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
          <MapPin size={16} aria-hidden /> Deliver to Maya · Seattle 98101
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
            <User size={20} aria-hidden />
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

export function Breadcrumbs({ items }: { items: { label: string; onClick?: () => void }[] }) {
  return (
    <Breadcrumb className="crumbs">
      <BreadcrumbList>
        {items.map((it, i) => (
          <Fragment key={it.label}>
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {it.onClick ? <BreadcrumbLink render={<button className="crumb-link" onClick={it.onClick} />}>{it.label}</BreadcrumbLink> : <BreadcrumbPage>{it.label}</BreadcrumbPage>}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: string; error?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="field">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="hint">{hint}</p>
      )}
    </div>
  );
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
