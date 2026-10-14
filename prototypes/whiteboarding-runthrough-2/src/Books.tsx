import { useState, type ReactNode } from "react";
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@helenhsong/ui";
import { AlertCircle, BookPlus, CheckCircle2, ChevronRight, Clock, X } from "lucide-react";
import { AUDIENCE, REVIEW, STATUS_LABEL, VIEW_ORDER, formatDate, formatWhen, money, royalty, type Book, type Status } from "./data";
import { BookCover, Breadcrumbs, StatusBadge } from "./ui";

export type View = Status | "all";
export type Banner = { tone: "go" | "stop"; title: string; text: string };
const HOUR = 3_600_000;

type Col = { key: string; label: string; num?: boolean; cell: (b: Book) => ReactNode };

const expected = (b: Book) => (b.submittedAt ? b.submittedAt + (b.reviewType === "human" ? 24 : 1) * HOUR : undefined);

const COLS: Record<View, Col[]> = {
  ready: [
    { key: "approved", label: "Approved", cell: (b) => formatWhen(b.reviewedAt) },
    { key: "review", label: "Review", cell: (b) => (b.reviewType ? REVIEW[b.reviewType].label : "—") },
    { key: "price", label: "Price", num: true, cell: (b) => `$${b.price}` },
  ],
  review: [
    { key: "review", label: "Review", cell: (b) => (b.reviewType ? REVIEW[b.reviewType].label : "—") },
    { key: "submitted", label: "Submitted", cell: (b) => formatWhen(b.submittedAt) },
    { key: "expected", label: "Result by", cell: (b) => formatResultBy(expected(b)) },
  ],
  changes: [
    { key: "reason", label: "Reason", cell: (b) => (b.reason ? <span className="tag">{b.reason.label}</span> : "—") },
    { key: "reviewed", label: "Reviewed", cell: (b) => formatWhen(b.reviewedAt) },
  ],
  draft: [
    { key: "progress", label: "Progress", cell: (b) => `Step ${b.step} of 4` },
    { key: "edited", label: "Last edited", cell: (b) => formatWhen(b.updatedAt) },
  ],
  published: [
    { key: "published", label: "Published", cell: (b) => formatDate(b.publishedAt) },
    { key: "price", label: "Price", num: true, cell: (b) => `$${b.price}` },
    { key: "sales", label: "Sales", num: true, cell: (b) => (b.sales ?? 0).toLocaleString() },
    { key: "royalties", label: "Royalties", num: true, cell: (b) => money((b.sales ?? 0) * (royalty(b.price)?.amount ?? 0)) },
  ],
  all: [
    { key: "status", label: "Status", cell: (b) => <StatusBadge status={b.status} /> },
    { key: "updated", label: "Last updated", cell: (b) => formatWhen(b.updatedAt) },
  ],
};

function formatResultBy(at: number | undefined) {
  if (!at) return "—";
  return new Date(at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

type Props = {
  books: Book[];
  view: View;
  onView: (v: View) => void;
  banner: Banner | null;
  onDismissBanner: () => void;
  openId: string | null;
  onOpen: (id: string | null) => void;
  onNew: () => void;
  onLanding: () => void;
  onHome: () => void;
  onPublish: (b: Book) => void;
  onEdit: (b: Book) => void;
  onCompleteReview: (b: Book, ok: boolean) => void;
  onLoadSamples: () => void;
};

export function Books(p: Props) {
  const counts = Object.fromEntries(VIEW_ORDER.map((s) => [s, p.books.filter((b) => b.status === s).length])) as Record<Status, number>;
  const rows = p.view === "all" ? p.books : p.books.filter((b) => b.status === p.view);
  const open = p.books.find((b) => b.id === p.openId) ?? null;
  // Keep the last book rendered while the sheet animates closed.
  const [shown, setShown] = useState<Book | null>(open);
  if (open && open !== shown) setShown(open);
  const cols = COLS[p.view];

  return (
    <main className="page books">
      <Breadcrumbs page="books" onNavigate={(to) => (to === "home" ? p.onHome() : p.onLanding())} />
      <div className="page-head">
        <div>
          <h1>Your books</h1>
          <p className="muted">Track review, publish approved books, and fix anything that needs changes.</p>
        </div>
        <div className="actions">
          <Button variant="outline" onClick={p.onLanding}>
            How publishing works
          </Button>
          {p.books.length > 0 && (
            <Button onClick={p.onNew}>
              <BookPlus size={16} aria-hidden /> Publish a book
            </Button>
          )}
        </div>
      </div>

      {p.banner && (
        <div className={`banner ${p.banner.tone}`} role="status">
          {p.banner.tone === "go" ? <CheckCircle2 size={20} aria-hidden /> : <AlertCircle size={20} aria-hidden />}
          <div>
            <p className="strong">{p.banner.title}</p>
            <p>{p.banner.text}</p>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Dismiss" onClick={p.onDismissBanner}>
            <X size={16} />
          </Button>
        </div>
      )}

      {p.books.length === 0 ? (
        <Empty className="empty">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookPlus />
            </EmptyMedia>
            <EmptyTitle>No books yet</EmptyTitle>
            <EmptyDescription>Books you start or submit show up here, with their review status and sales once they're live.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="actions center">
              <Button variant="outline" onClick={p.onLoadSamples}>
                Load sample books (prototype)
              </Button>
              <Button onClick={p.onNew}>Publish your first book</Button>
            </div>
          </EmptyContent>
        </Empty>
      ) : (
        <Tabs value={p.view} onValueChange={(v) => p.onView(v as View)} className="books-tabs">
          <TabsList variant="line" className="tabs" aria-label="Book status">
            {(["all", ...VIEW_ORDER] as View[]).map((v) => (
              <TabsTrigger key={v} value={v} className="tab">
                {v === "all" ? "All" : STATUS_LABEL[v]}
                <span className="count">{(v === "all" ? p.books.length : counts[v]).toLocaleString()}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="table-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  {p.view !== "all" && <TableHead>Status</TableHead>}
                  {cols.map((c) => (
                    <TableHead key={c.key} className={c.num ? "num" : ""}>
                      {c.label}
                    </TableHead>
                  ))}
                  <TableHead aria-label="Open" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={cols.length + 3} className="empty-row">
                      No books {p.view === "all" ? "yet" : `in ${STATUS_LABEL[p.view as Status]}`}.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((b) => (
                  <TableRow key={b.id} data-state={p.openId === b.id ? "selected" : undefined} className="row" onClick={() => p.onOpen(b.id)}>
                    <TableCell>
                      <button className="book-cell" onClick={(e) => (e.stopPropagation(), p.onOpen(b.id))}>
                        <BookCover book={b} size="sm" />
                        <span>
                          <span className="strong">{b.title || "Untitled book"}</span>
                          <span className="meta">{b.author}</span>
                        </span>
                      </button>
                    </TableCell>
                    {p.view !== "all" && (
                      <TableCell>
                        <StatusBadge status={b.status} />
                      </TableCell>
                    )}
                    {cols.map((c) => (
                      <TableCell key={c.key} className={c.num ? "num" : ""}>
                        {c.cell(b)}
                      </TableCell>
                    ))}
                    <TableCell className="chev">
                      <ChevronRight size={16} aria-hidden />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Tabs>
      )}

      <Sheet open={!!open} onOpenChange={(o) => !o && p.onOpen(null)}>
        <SheetContent side="right" className="sheet-panel">
          {shown && <BookSheet book={shown} onClose={() => p.onOpen(null)} onPublish={p.onPublish} onEdit={p.onEdit} onCompleteReview={p.onCompleteReview} />}
        </SheetContent>
      </Sheet>
    </main>
  );
}

function BookSheet({ book, onClose, onPublish, onEdit, onCompleteReview }: { book: Book; onClose: () => void; onPublish: (b: Book) => void; onEdit: (b: Book) => void; onCompleteReview: (b: Book, ok: boolean) => void }) {
  const r = royalty(book.price);
  const details: [string, ReactNode][] = [
    ["Status", <StatusBadge status={book.status} />],
    ["Audience", book.audience ? AUDIENCE[book.audience].label : "—"],
    ["Price", book.price ? `$${book.price}` : "—"],
    ["Royalty", r ? `${money(r.amount)} per sale` : "—"],
    ["Review", book.reviewType ? REVIEW[book.reviewType].label : "—"],
    ["Submitted", formatWhen(book.submittedAt)],
  ];

  return (
    <>
        <SheetHeader className="sheet-head">
          <p className="meta">Book</p>
          <SheetTitle>{book.title || "Untitled book"}</SheetTitle>
          <SheetDescription className="sr-only">Status, review details, and actions for this book.</SheetDescription>
        </SheetHeader>

        <div className="sheet-body">
          <div className="sheet-hero">
            <BookCover book={book} size="md" />
            <div>
              <p className="strong">{book.title || "Untitled book"}</p>
              {book.subtitle && <p className="muted">{book.subtitle}</p>}
              <p className="muted">by {book.author}</p>
            </div>
          </div>

          {book.status === "changes" && book.reason && (
            <div className="callout stop">
              <p className="strong">
                <AlertCircle size={16} aria-hidden /> {book.reason.label}
              </p>
              <p>{book.reason.detail}</p>
            </div>
          )}
          {book.status === "review" && (
            <div className="callout wait">
              <p className="strong">
                <Clock size={16} aria-hidden /> In {book.reviewType ? REVIEW[book.reviewType].label.toLowerCase() : "review"}
              </p>
              <p>Result by {formatResultBy(expected(book))}. We'll email you and notify you here. Your book is locked until review is done.</p>
            </div>
          )}
          {book.status === "ready" && (
            <div className="callout go">
              <p className="strong">
                <CheckCircle2 size={16} aria-hidden /> Approved
              </p>
              <p>Your book passed review. Publish it to make it available on Amazon within a few hours.</p>
            </div>
          )}
          {book.status === "draft" && (
            <div className="callout neutral">
              <p className="strong">Draft · Step {book.step} of 4</p>
              <p>Pick up where you left off. Nothing is shared until you submit.</p>
            </div>
          )}
          {book.status === "published" && (
            <div className="stats">
              <div>
                <span className="meta">Sales</span>
                <span className="stat">{(book.sales ?? 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="meta">Royalties</span>
                <span className="stat">{money((book.sales ?? 0) * (r?.amount ?? 0))}</span>
              </div>
              <div>
                <span className="meta">Published</span>
                <span className="stat">{formatDate(book.publishedAt)}</span>
              </div>
            </div>
          )}

          <dl className="details">
            {details.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>

          {book.status === "review" && (
            <div className="proto-box">
              <p className="meta">Prototype only: finish this review now</p>
              <div className="actions">
                <Button variant="outline" size="sm" onClick={() => onCompleteReview(book, false)}>
                  Request changes
                </Button>
                <Button variant="outline" size="sm" onClick={() => onCompleteReview(book, true)}>
                  Approve
                </Button>
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="sheet-foot">
          {book.status === "ready" && (
            <>
              <Button variant="outline" onClick={() => onEdit(book)}>
                Edit and resubmit
              </Button>
              <Button onClick={() => onPublish(book)}>Publish</Button>
            </>
          )}
          {book.status === "changes" && <Button onClick={() => onEdit(book)}>Fix and resubmit</Button>}
          {book.status === "draft" && <Button onClick={() => onEdit(book)}>Continue draft</Button>}
          {(book.status === "review" || book.status === "published") && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </SheetFooter>
    </>
  );
}
