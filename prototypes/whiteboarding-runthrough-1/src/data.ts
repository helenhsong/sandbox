export type Status = "draft" | "review" | "approved" | "changes" | "published";
export type Rating = "general" | "children" | "adults";
export type ReviewType = "ai" | "human";

export type Book = {
  id: string;
  title: string;
  author: string;
  genre: string;
  manuscript: string | null;
  description: string;
  cover: { kind: "template"; template: number } | { kind: "upload"; url: string; name: string };
  rating: Rating | null;
  price: string;
  reviewType: ReviewType;
  status: Status;
  submittedAt: Date | null;
  publishedAt: Date | null;
  reason: string | null;
  sales: number;
};

export type Notice = { id: string; bookId: string; text: string; at: Date; read: boolean };

export const READER = { name: "Jordan", email: "j•••••@gmail.com" };

export const GENRES = ["Fiction", "Mystery & thriller", "Romance", "Science fiction & fantasy", "Children's", "Memoir", "Nonfiction"];

export const RATING_LABEL: Record<Rating, string> = {
  general: "General audience",
  children: "Children",
  adults: "Adults only",
};

export const RATING_HINT: Record<Rating, string> = {
  general: "Suitable for most readers, with no explicit content.",
  children: "Written for readers under 13. Listed in children's books.",
  adults: "Mature themes or explicit content. Hidden from children's searches.",
};

export const STATUS_LABEL: Record<Status, string> = {
  draft: "Draft",
  review: "In review",
  approved: "Ready to publish",
  changes: "Needs changes",
  published: "Published",
};

export const COVER_TEMPLATES = [
  { name: "Ink", bg: "linear-gradient(160deg, oklch(0.32 0.05 260), oklch(0.18 0.03 260))", fg: "oklch(0.97 0 0)" },
  { name: "Dawn", bg: "linear-gradient(170deg, oklch(0.86 0.08 60), oklch(0.68 0.13 30))", fg: "oklch(0.2 0.02 30)" },
  { name: "Fern", bg: "linear-gradient(165deg, oklch(0.6 0.08 150), oklch(0.36 0.06 160))", fg: "oklch(0.97 0 0)" },
  { name: "Paper", bg: "linear-gradient(180deg, oklch(0.97 0.01 90), oklch(0.9 0.02 85))", fg: "oklch(0.25 0 0)" },
];

const AI_DESCRIPTIONS: Record<string, (t: string) => string> = {
  Fiction: (t) => `${t} follows one ordinary life knocked off course by a single choice. Tender, funny, and quietly devastating, it's a story about the people we become when no one is watching.`,
  "Mystery & thriller": (t) => `A small town. A missing witness. A detective with one week to find the truth. ${t} is a tightly plotted mystery that keeps you guessing until the final page.`,
  Romance: (t) => `Two people who swore off love find themselves stuck together for one unforgettable summer. ${t} is a warm, witty romance about second chances.`,
  "Science fiction & fantasy": (t) => `When the last signal from Earth goes silent, a reluctant crew must decide what humanity is worth saving. ${t} is an epic of courage, wonder, and impossible choices.`,
  "Children's": (t) => `${t} is a cheerful adventure about friendship, curiosity, and being brave even when you feel small. Perfect for reading aloud.`,
  Memoir: (t) => `Honest and unforgettable, ${t} is a memoir about growing up, starting over, and learning which stories are worth telling.`,
  Nonfiction: (t) => `${t} turns big ideas into practical steps. Clear, well researched, and easy to read, it's the guide you'll keep coming back to.`,
};

export function aiDescription(book: Pick<Book, "title" | "genre">) {
  const make = AI_DESCRIPTIONS[book.genre] ?? AI_DESCRIPTIONS.Fiction;
  return make(book.title.trim() || "This book");
}

export function newBook(): Book {
  return {
    id: crypto.randomUUID(),
    title: "",
    author: "Jordan Lee",
    genre: "",
    manuscript: null,
    description: "",
    cover: { kind: "template", template: 0 },
    rating: null,
    price: "4.99",
    reviewType: "ai",
    status: "draft",
    submittedAt: null,
    publishedAt: null,
    reason: null,
    sales: 0,
  };
}

export function earnings(price: string) {
  const p = Number.parseFloat(price);
  if (!Number.isFinite(p) || p <= 0) return null;
  // Assumed royalty for the prototype: 70% between $2.99 and $9.99, 35% otherwise.
  const rate = p >= 2.99 && p <= 9.99 ? 0.7 : 0.35;
  return (p * rate).toFixed(2);
}

export function formatDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function dueBy(book: Book) {
  if (!book.submittedAt) return "—";
  if (book.reviewType === "ai") return "Minutes";
  const due = new Date(book.submittedAt.getTime() + 24 * 3600 * 1000);
  return `${formatDate(due)}, ${formatTime(due)}`;
}
