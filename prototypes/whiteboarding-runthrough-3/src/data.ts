export const PRODUCT = {
  brand: "Saltmoor",
  name: "The Saltmoor Hybrid",
  rating: 4.8,
  reviewCount: 6214,
};

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
export const money = (n: number) => usd.format(n);

export const QUEEN_PRICE = 1200;
export const COMPETITOR_PRICE = 1095;

export type Size = { id: string; label: string; dims: string; w: number; l: number; price: number };

export const SIZES: Size[] = [
  { id: "twin", label: "Twin", dims: '38" × 75"', w: 38, l: 75, price: 799 },
  { id: "full", label: "Full", dims: '54" × 75"', w: 54, l: 75, price: 1049 },
  { id: "queen", label: "Queen", dims: '60" × 80"', w: 60, l: 80, price: QUEEN_PRICE },
  { id: "king", label: "King", dims: '76" × 80"', w: 76, l: 80, price: 1499 },
  { id: "cal-king", label: "Cal King", dims: '72" × 84"', w: 72, l: 84, price: 1499 },
];

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
  eco: "Eco-conscious",
};

export type Review = { name: string; tag: Sleeper; rating: number; date: string; title: string; body: string };

export const REVIEWS: Review[] = [
  { name: "Maya R.", tag: "back-pain", rating: 5, date: "Sep 28, 2026", title: "My lower back stopped aching in week two", body: "I was skeptical about spending this much. I wake up without the stiffness I've had for years." },
  { name: "Jordan T.", tag: "hot", rating: 5, date: "Sep 19, 2026", title: "Finally not kicking the covers off", body: "Came from a memory foam bed that felt like sleeping on a heater. This one stays cool." },
  { name: "Priya & Sam", tag: "couple", rating: 5, date: "Sep 12, 2026", title: "He gets up at 5am and I don't notice", body: "Zero bounce when one of us moves. Worth it for that alone." },
  { name: "Elena V.", tag: "eco", rating: 4, date: "Aug 30, 2026", title: "No smell out of the box", body: "I have a toddler and was careful about what we bring home. The certifications sold me." },
  { name: "Chris L.", tag: "back-pain", rating: 5, date: "Aug 22, 2026", title: "Supportive without being a brick", body: "Back sleeper with a herniated disc. Firm where it matters, soft enough on top." },
  { name: "Dana K.", tag: "hot", rating: 4, date: "Aug 15, 2026", title: "Cooler than my old hybrid", body: "Took a week to adjust to the firmness, but I sleep through the night now." },
  { name: "Marcus O.", tag: "back-pain", rating: 5, date: "Aug 9, 2026", title: "Hips finally feel level", body: "Side and back sleeper. The firmer middle keeps me from sinking, and the ache is gone." },
  { name: "Renee W.", tag: "back-pain", rating: 4, date: "Jul 30, 2026", title: "Firm, in a good way", body: "Took a few nights to get used to. Now my back doesn't wake me at 4am." },
  { name: "Sofia M.", tag: "hot", rating: 5, date: "Jul 24, 2026", title: "No more night sweats", body: "I run hot and live without AC. This is the first bed that doesn't trap heat." },
  { name: "Ben A.", tag: "hot", rating: 5, date: "Jul 18, 2026", title: "Cool to the touch all night", body: "The latex top stays cool even in July. I stopped sleeping on top of the covers." },
  { name: "Lia & Tom", tag: "couple", rating: 5, date: "Aug 4, 2026", title: "Two light sleepers, zero complaints", body: "We both toss around. Neither of us feels the other move anymore." },
  { name: "Grace H.", tag: "couple", rating: 4, date: "Jul 27, 2026", title: "Edge support matters", body: "We can both sit on the edge without sliding off. Big upgrade from our foam bed." },
  { name: "Ahmed & Noor", tag: "couple", rating: 5, date: "Jul 12, 2026", title: "Different sleepers, both happy", body: "He likes firm, I like a little give. The latex top somehow works for both of us." },
  { name: "Jun P.", tag: "eco", rating: 5, date: "Aug 12, 2026", title: "Materials I can actually verify", body: "Looked up every certification before buying. They all check out." },
  { name: "Hannah B.", tag: "eco", rating: 5, date: "Jul 21, 2026", title: "No fiberglass was the dealbreaker", body: "Our last mattress leaked fiberglass when the cover tore. Never again." },
  { name: "Owen R.", tag: "eco", rating: 4, date: "Jul 9, 2026", title: "Worth paying more for clean materials", body: "Pricey, but I feel good about what my kids are sleeping next to." },
];

export const RATING_BARS = [
  { stars: 5, pct: 86 },
  { stars: 4, pct: 9 },
  { stars: 3, pct: 3 },
  { stars: 2, pct: 1 },
  { stars: 1, pct: 1 },
];

export const COMPARE_ROWS: { label: string; ours: string | boolean; theirs: string | boolean }[] = [
  { label: "Price (Queen)", ours: money(QUEEN_PRICE), theirs: money(COMPETITOR_PRICE) },
  { label: "Construction", ours: "Latex + zoned coils", theirs: "Memory foam layers" },
  { label: "Sleeps cool", ours: true, theirs: false },
  { label: "Zoned lower-back support", ours: true, theirs: false },
  { label: "Low motion transfer", ours: true, theirs: true },
  { label: "Certified organic materials", ours: true, theirs: false },
  { label: "Fiberglass-free", ours: true, theirs: false },
  { label: "Expected lifespan", ours: "10+ years", theirs: "6–8 years" },
];
