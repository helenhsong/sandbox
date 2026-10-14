export const PRODUCT = {
  brand: "Saltmoor",
  name: "The Saltmoor Hybrid",
  rating: 4.8,
  reviewCount: 6214,
};

export type Size = { id: string; label: string; dims: string; price: number };

export const SIZES: Size[] = [
  { id: "twin", label: "Twin", dims: '38" × 75"', price: 799 },
  { id: "full", label: "Full", dims: '54" × 75"', price: 1049 },
  { id: "queen", label: "Queen", dims: '60" × 80"', price: 1200 },
  { id: "king", label: "King", dims: '76" × 80"', price: 1499 },
  { id: "cal-king", label: "Cal King", dims: '72" × 84"', price: 1499 },
];

export const money = (n: number) => `$${n.toLocaleString("en-US")}`;

export const LAYERS = [
  { name: "Organic cotton cover", detail: "GOTS certified, breathable" },
  { name: "2\" natural latex", detail: "Responsive comfort that doesn't trap heat" },
  { name: "Wool fire barrier", detail: "No chemical flame retardants, no fiberglass" },
  { name: "8\" zoned pocket coils", detail: "Firmer under your lower back and hips" },
  { name: "Recycled steel base", detail: "Sturdy edge-to-edge support" },
];

export type Press = { source: string; quote: string; award?: string };

export const PRESS: Press[] = [
  { source: "Sleep Lab Monthly", award: "Best hybrid for back pain", quote: "The zoned coils kept our testers' hips level all night without feeling stiff." },
  { source: "The Rested Review", award: "Coolest mattress we tested", quote: "Ran noticeably cooler than every all-foam bed in our lineup." },
  { source: "Home & Habit", quote: "One of the few mattresses where the materials story actually holds up." },
];

export type Sleeper = "back-pain" | "hot" | "couple" | "eco";

export const SLEEPER_LABELS: Record<Sleeper, string> = {
  "back-pain": "Back pain",
  hot: "Hot sleepers",
  couple: "Couples",
  eco: "Clean materials",
};

export type Review = { name: string; tag: Sleeper; rating: number; date: string; title: string; body: string };

export const REVIEWS: Review[] = [
  { name: "Maya R.", tag: "back-pain", rating: 5, date: "Sep 28, 2026", title: "My lower back stopped aching in week two", body: "I was skeptical about spending this much. I wake up without the stiffness I've had for years." },
  { name: "Jordan T.", tag: "hot", rating: 5, date: "Sep 19, 2026", title: "Finally not kicking the covers off", body: "Came from a memory foam bed that felt like sleeping on a heater. This one stays cool." },
  { name: "Priya & Sam", tag: "couple", rating: 5, date: "Sep 12, 2026", title: "He gets up at 5am and I don't notice", body: "Zero bounce when one of us moves. Worth it for that alone." },
  { name: "Elena V.", tag: "eco", rating: 4, date: "Aug 30, 2026", title: "No smell out of the box", body: "I have a toddler and was careful about what we bring home. The certifications sold me." },
  { name: "Chris L.", tag: "back-pain", rating: 5, date: "Aug 22, 2026", title: "Supportive without being a brick", body: "Back sleeper with a herniated disc. Firm where it matters, soft enough on top." },
  { name: "Dana K.", tag: "hot", rating: 4, date: "Aug 15, 2026", title: "Cooler than my old hybrid", body: "Took a week to adjust to the firmness, but I sleep through the night now." },
];

export const RATING_BARS = [
  { stars: 5, pct: 86 },
  { stars: 4, pct: 9 },
  { stars: 3, pct: 3 },
  { stars: 2, pct: 1 },
  { stars: 1, pct: 1 },
];

export const COMPARE_ROWS: { label: string; ours: string | boolean; theirs: string | boolean }[] = [
  { label: "Price (Queen)", ours: "$1,200", theirs: "$1,095" },
  { label: "Construction", ours: "Latex + zoned coils", theirs: "Memory foam layers" },
  { label: "Sleeps cool", ours: true, theirs: false },
  { label: "Zoned lower-back support", ours: true, theirs: false },
  { label: "Low motion transfer", ours: true, theirs: true },
  { label: "Certified organic materials", ours: true, theirs: false },
  { label: "Fiberglass-free", ours: true, theirs: false },
  { label: "Expected lifespan", ours: "10+ years", theirs: "6–8 years" },
];
