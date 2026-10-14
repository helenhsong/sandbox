export type Status = "draft" | "review" | "ready" | "changes" | "published";
export type Audience = "general" | "adults" | "children";
export type ReviewType = "ai" | "human";
export type Cover = { kind: "template"; id: TemplateId } | { kind: "upload"; url: string; name: string };

export type Book = {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  manuscript: string | null;
  description: string;
  cover: Cover;
  audience: Audience | null;
  price: string;
  reviewType: ReviewType | null;
  status: Status;
  /** Furthest flow step reached, 1–4, for drafts. */
  step: number;
  updatedAt: number;
  submittedAt?: number;
  reviewedAt?: number;
  publishedAt?: number;
  reason?: { label: string; detail: string };
  sales?: number;
};

export type Notice = { id: string; bookId: string; text: string; at: number; read: boolean };

export const AUTHOR = "Maya Chen";
export const EMAIL = "maya.chen@example.com";

export const STATUS_LABEL: Record<Status, string> = {
  draft: "Draft",
  review: "In review",
  ready: "Ready to publish",
  changes: "Needs changes",
  published: "Published",
};

/** Status views in workflow order. */
export const VIEW_ORDER: Status[] = ["draft", "review", "changes", "ready", "published"];

export const AUDIENCE: Record<Audience, { label: string; hint: string }> = {
  general: { label: "General audience", hint: "Suitable for readers of any age." },
  adults: { label: "Adults", hint: "Mature themes, language, or content for readers 18+." },
  children: { label: "Children", hint: "Written for readers under 13. Stricter content review." },
};

export const REVIEW: Record<ReviewType, { label: string; time: string; hint: string }> = {
  ai: { label: "AI review", time: "Usually under 1 hour", hint: "An automated check of your content and rating. Fastest way to publish." },
  human: { label: "Human review", time: "Within 24 hours", hint: "A person on our review team reads your submission." },
};

export type TemplateId = "dusk" | "meadow" | "ink" | "coral" | "sand" | "night";
export const TEMPLATES: Record<TemplateId, { name: string; bg: string; fg: string }> = {
  dusk: { name: "Dusk", bg: "linear-gradient(160deg, #3b2f63, #c0697b)", fg: "#fff7f2" },
  meadow: { name: "Meadow", bg: "linear-gradient(160deg, #2f5d50, #a7c4a0)", fg: "#f6fbf3" },
  ink: { name: "Ink", bg: "linear-gradient(160deg, #111827, #374151)", fg: "#f9fafb" },
  coral: { name: "Coral", bg: "linear-gradient(160deg, #f4a582, #e45d50)", fg: "#2b1210" },
  sand: { name: "Sand", bg: "linear-gradient(160deg, #efe3c8, #c9a66b)", fg: "#2d2414" },
  night: { name: "Night sky", bg: "radial-gradient(circle at 70% 20%, #4b5ba8, #10142b 70%)", fg: "#e9ecff" },
};

export function royalty(price: string) {
  const p = Number(price);
  if (!Number.isFinite(p) || p <= 0) return null;
  const rate = p >= 2.99 && p <= 9.99 ? 0.7 : 0.35;
  return { rate, amount: p * rate };
}

export function generateDescription(b: Pick<Book, "title" | "subtitle" | "audience">) {
  const title = b.title.trim() || "this book";
  const sub = b.subtitle.trim();
  return `${sub ? `${sub}. ` : ""}In ${title}, a quiet coastal town keeps a secret that one stubborn newcomer can't leave alone. Told with warmth and wit, it's a story about the families we're born into, the ones we choose, and the courage it takes to start over. Perfect for readers who love character-driven fiction with a hopeful heart.`;
}

const DAY = 86_400_000;
const now = () => Date.now();

export function emptyBook(): Book {
  return {
    id: `b${Math.random().toString(36).slice(2, 8)}`,
    title: "",
    subtitle: "",
    author: AUTHOR,
    manuscript: null,
    description: "",
    cover: { kind: "template", id: "dusk" },
    audience: null,
    price: "4.99",
    reviewType: null,
    status: "draft",
    step: 1,
    updatedAt: now(),
  };
}

export function sampleBooks(): Book[] {
  const t = now();
  const base = { subtitle: "", author: AUTHOR, manuscript: "manuscript.docx", description: "A warm, character-driven story about starting over, the families we choose, and finding the courage to stay. Perfect for readers who love hopeful fiction with heart and humor.", step: 4 };
  return [
    {
      ...base, id: "s1", title: "The Lighthouse Keeper's Daughter", cover: { kind: "template", id: "night" },
      audience: "general", price: "4.99", reviewType: "ai", status: "ready", updatedAt: t - 2 * 3_600_000,
      submittedAt: t - 3 * 3_600_000, reviewedAt: t - 2 * 3_600_000,
    },
    {
      ...base, id: "s2", title: "Small Kitchen, Big Flavor", subtitle: "100 weeknight recipes for tiny spaces", cover: { kind: "template", id: "coral" },
      audience: "general", price: "9.99", reviewType: "human", status: "review", updatedAt: t - 5 * 3_600_000, submittedAt: t - 5 * 3_600_000,
    },
    {
      ...base, id: "s3", title: "Wolves of Hollow Creek", cover: { kind: "template", id: "ink" },
      audience: "children", price: "2.99", reviewType: "ai", status: "changes", updatedAt: t - DAY, submittedAt: t - DAY - 3_600_000, reviewedAt: t - DAY,
      reason: {
        label: "Rating mismatch",
        detail: "Chapters 7 and 12 include violence that isn't suitable for a Children rating. Change the audience to General, or edit those chapters, then resubmit.",
      },
    },
    {
      ...base, id: "s4", title: "Letters to June", manuscript: null, description: "", cover: { kind: "template", id: "sand" },
      audience: null, price: "4.99", reviewType: null, status: "draft", step: 2, updatedAt: t - 3 * DAY,
    },
    {
      ...base, id: "s5", title: "Morning Pages for Night Owls", cover: { kind: "template", id: "meadow" },
      audience: "adults", price: "6.99", reviewType: "ai", status: "published", updatedAt: t - 12 * DAY,
      submittedAt: t - 13 * DAY, reviewedAt: t - 13 * DAY, publishedAt: t - 12 * DAY, sales: 38,
    },
  ];
}

export function formatWhen(at: number | undefined) {
  if (!at) return "—";
  const diff = Date.now() - at;
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)} min ago`;
  if (diff < DAY) return `${Math.round(diff / 3_600_000)} hr ago`;
  return new Date(at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDate(at: number | undefined) {
  if (!at) return "—";
  return new Date(at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const money = (n: number) => `$${n.toFixed(2)}`;
