import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Spinner,
} from "@helenhsong/ui";
import {
  ArrowRight,
  Check,
  CircleCheck,
  HeartHandshake,
  Leaf,
  Recycle,
  ShieldCheck,
  Snowflake,
  Spline,
  Star,
  Users,
  X,
} from "lucide-react";
import {
  COMPARE_ROWS,
  LAYERS,
  COMPETITOR_PRICE,
  PRESS,
  PRODUCT,
  QUEEN_PRICE,
  RATING_BARS,
  REVIEWS,
  SIZES,
  SLEEPER_LABELS,
  money,
  type Sleeper,
} from "./data";

const SECTIONS = [
  { id: "features", label: "Features" },
  { id: "reviews", label: "Reviews" },
  { id: "fit", label: "Who it's for" },
  { id: "compare", label: "Compare" },
];

export function App() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const openSizes = () => setSheetOpen(true);

  return (
    <>
      <Header onShop={openSizes} />
      <main>
        <Hero onShop={openSizes} />
        <Features />
        <PressReviews />
        <CustomerReviews />
        <Fit />
        <Feel />
        <Values />
        <Compare />
        <Closing onShop={openSizes} />
      </main>
      <footer className="site-footer">
        <span>© 2026 {PRODUCT.brand}. Prototype with sample content.</span>
      </footer>
      <SizeSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}

function useActiveSection() {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return active;
}

function Header({ onShop }: { onShop: () => void }) {
  const active = useActiveSection();
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <a className="brand" href="#top">
          {PRODUCT.brand}
        </a>
        <nav aria-label="Sections" className="header-nav">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} aria-current={active === s.id ? "location" : undefined}>
              {s.label}
            </a>
          ))}
        </nav>
        <Button onClick={onShop}>Choose your size</Button>
      </div>
    </header>
  );
}

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="stars" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} aria-hidden className={i <= Math.round(value) ? "on" : "off"} />
      ))}
    </span>
  );
}

function Hero({ onShop }: { onShop: () => void }) {
  return (
    <section id="top" className="hero">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">{PRODUCT.name}</p>
          <h1>Sleep cool. Wake up without the backache.</h1>
          <p className="lede">
            Natural latex over zoned coils that hold your lower back and hips level, in a mattress that breathes instead of trapping heat.
          </p>
          <a className="rating-line" href="#reviews">
            <Stars value={PRODUCT.rating} />
            <span>
              <strong>{PRODUCT.rating}</strong> from {PRODUCT.reviewCount.toLocaleString("en-US")} reviews
            </span>
          </a>
          <div className="hero-buy">
            <div>
              <div className="price">{money(QUEEN_PRICE)}</div>
              <div className="meta">Queen · other sizes from {money(799)}</div>
            </div>
            <div className="hero-actions">
              <Button variant="outline" size="lg" nativeButton={false} render={<a href="#compare" />}>
                See how it compares
              </Button>
              <Button size="lg" onClick={onShop}>
                Choose your size
              </Button>
            </div>
          </div>
          <ul className="assurances">
            <li>
              <Check size={16} aria-hidden /> 100-night home trial
            </li>
            <li>
              <Check size={16} aria-hidden /> Free delivery
            </li>
            <li>
              <Check size={16} aria-hidden /> 10-year warranty
            </li>
          </ul>
        </div>
        <MattressArt />
      </div>
    </section>
  );
}

function MattressArt() {
  return (
    <div className="art" role="img" aria-label="Illustration of the Saltmoor Hybrid mattress on a bed frame">
      <div className="art-room">
        <div className="art-pillows">
          <span />
          <span />
        </div>
        <div className="art-mattress">
          <div className="art-top" />
          <div className="art-side">
            <span className="art-quilt" />
          </div>
        </div>
        <div className="art-frame" />
      </div>
      <div className="art-tag">
        <Snowflake size={16} aria-hidden /> Sleeps cooler than all-foam mattresses
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: Spline, title: "Zoned support", body: "Firmer coils under your lower back and hips keep your spine aligned, so you wake up without stiffness." },
  { icon: Snowflake, title: "Sleeps cool", body: "Latex and wrapped coils let air move through the bed instead of holding your body heat." },
  { icon: Users, title: "Quiet for two", body: "Every coil is wrapped on its own, so one partner's movement doesn't reach the other." },
  { icon: Leaf, title: "Clean materials", body: "Organic cotton, natural latex and wool. No fiberglass and no chemical flame retardants." },
];

function Features() {
  return (
    <section id="features" className="section">
      <div className="wrap">
        <SectionHead eyebrow="What makes it different" title="Built to fix the things other mattresses get wrong" />
        <div className="features-grid">
          <div className="layers" aria-label="Mattress layers, top to bottom">
            {LAYERS.map((l, i) => (
              <div key={l.name} className={`layer layer-${i}`}>
                <span className="layer-name">{l.name}</span>
                <span className="layer-detail">{l.detail}</span>
              </div>
            ))}
          </div>
          <div className="feature-list">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature">
                <span className="feature-icon">
                  <f.icon size={20} aria-hidden />
                </span>
                <div>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHead({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="section-head">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {body && <p className="section-body">{body}</p>}
    </div>
  );
}

function PressReviews() {
  return (
    <section className="section press" aria-labelledby="press-title">
      <div className="wrap">
        <p className="eyebrow" id="press-title">
          What the experts say
        </p>
        <div className="press-grid">
          {PRESS.map((p) => (
            <figure key={p.source} className="press-card">
              {p.award && <Badge variant="secondary">{p.award}</Badge>}
              <blockquote>“{p.quote}”</blockquote>
              <figcaption>{p.source}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

type Filter = "all" | Sleeper;

function CustomerReviews() {
  const [filter, setFilter] = useState<Filter>("all");
  const shown = filter === "all" ? REVIEWS : REVIEWS.filter((r) => r.tag === filter);
  const filters: Filter[] = ["all", "back-pain", "hot", "couple", "eco"];

  return (
    <section id="reviews" className="section">
      <div className="wrap">
        <SectionHead eyebrow="Customer reviews" title="People who sleep like you, in their own words" />
        <div className="reviews-grid">
          <div className="rating-summary">
            <div className="big-rating">{PRODUCT.rating}</div>
            <Stars value={PRODUCT.rating} size={20} />
            <p className="meta">{PRODUCT.reviewCount.toLocaleString("en-US")} verified reviews</p>
            <div className="bars">
              {RATING_BARS.map((b) => (
                <div key={b.stars} className="bar-row">
                  <span className="meta">{b.stars} {b.stars === 1 ? "star" : "stars"}</span>
                  <span className="bar">
                    <span style={{ width: `${b.pct}%` }} />
                  </span>
                  <span className="meta num">{b.pct}%</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="chips" role="group" aria-label="Filter reviews by sleeper">
              {filters.map((f) => (
                <button key={f} type="button" className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                  {f === "all" ? "All" : SLEEPER_LABELS[f]}
                </button>
              ))}
            </div>
            {shown.length === 0 ? (
              <div className="empty">
                <p>No reviews from {filter === "all" ? "customers" : SLEEPER_LABELS[filter].toLowerCase()} yet.</p>
                <Button variant="outline" onClick={() => setFilter("all")}>
                  Show all reviews
                </Button>
              </div>
            ) : (
              <div className="review-list">
                {shown.map((r) => (
                  <article key={r.name + r.title} className="review">
                    <div className="review-top">
                      <Stars value={r.rating} size={14} />
                      <span className="meta">{r.date}</span>
                    </div>
                    <h3>{r.title}</h3>
                    <p>{r.body}</p>
                    <div className="review-by">
                      <span className="reviewer">{r.name}</span>
                      <Badge variant="outline">{SLEEPER_LABELS[r.tag]}</Badge>
                      <span className="verified">
                        <CircleCheck size={14} aria-hidden /> Verified buyer
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Fit() {
  const great = [
    "Back and combination sleepers",
    "Anyone with lower back pain",
    "Hot sleepers",
    "Couples, or light sleepers who share a bed",
    "People who want certified natural materials",
  ];
  const notFor = ["Strict side sleepers who want a plush, sink-in feel", "Sleepers under about 130 lb, who may find it too firm"];
  return (
    <section id="fit" className="section tinted">
      <div className="wrap">
        <SectionHead
          eyebrow="Who it's for"
          title="Is it right for you?"
          body="We'd rather you know now than send it back. Here's who loves it, and who might not."
        />
        <div className="fit-grid">
          <div className="fit-card">
            <h3>Great for</h3>
            <ul>
              {great.map((g) => (
                <li key={g}>
                  <Check size={16} aria-hidden className="yes" /> {g}
                </li>
              ))}
            </ul>
          </div>
          <div className="fit-card">
            <h3>Not ideal for</h3>
            <ul>
              {notFor.map((g) => (
                <li key={g}>
                  <X size={16} aria-hidden className="no" /> {g}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Scale({ label, value, max, left, right, display }: { label: string; value: number; max: number; left: string; right: string; display: string }) {
  return (
    <div className="scale">
      <div className="scale-head">
        <h3>{label}</h3>
        <span className="scale-value">{display}</span>
      </div>
      <div className="scale-track" aria-hidden>
        <span className="scale-dot" style={{ left: `${(value / max) * 100}%` }} />
      </div>
      <div className="scale-ends meta">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  );
}

function Feel() {
  return (
    <section className="section" aria-labelledby="feel-title">
      <div className="wrap">
        <div className="section-head">
          <p className="eyebrow">How it feels</p>
          <h2 id="feel-title">Thickness, firmness and warmth</h2>
        </div>
        <div className="feel-grid">
          <div className="scale">
            <div className="scale-head">
              <h3>Thickness</h3>
              <span className="scale-value">12"</span>
            </div>
            <p className="meta">Standard sheets fit. Average all-foam mattresses are 10".</p>
          </div>
          <Scale label="Firmness" value={6} max={10} left="Soft" right="Firm" display="Medium-firm · 6/10" />
          <Scale label="Warmth" value={2.5} max={10} left="Cool" right="Warm" display="Sleeps cool" />
        </div>
      </div>
    </section>
  );
}

function Values() {
  const stats = [
    { icon: Leaf, value: "100%", label: "organic cotton cover" },
    { icon: ShieldCheck, value: "0", label: "chemical flame retardants or fiberglass" },
    { icon: Recycle, value: "80%", label: "recycled steel in every coil" },
    { icon: HeartHandshake, value: "Living wage", label: "for every maker in our North Carolina factory" },
  ];
  return (
    <section className="section tinted" aria-labelledby="values-title">
      <div className="wrap">
        <div className="section-head">
          <p className="eyebrow">Sustainability, health and values</p>
          <h2 id="values-title">What your mattress supports</h2>
          <p className="section-body">A bed you'll spend a third of your life on, made by people who are paid fairly.</p>
        </div>
        <div className="stats">
          {stats.map((s) => (
            <div key={s.label} className="stat">
              <s.icon size={20} aria-hidden />
              <div className="stat-value">{s.value}</div>
              <div className="meta">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="certs" aria-label="Certifications">
          <Badge variant="outline">GOTS organic cotton</Badge>
          <Badge variant="outline">GOLS organic latex</Badge>
          <Badge variant="outline">GREENGUARD Gold</Badge>
        </div>
      </div>
    </section>
  );
}

function Cell({ v }: { v: string | boolean }) {
  if (typeof v === "string") return <>{v}</>;
  return v ? (
    <span className="cell-yes">
      <Check size={16} aria-hidden /> Yes
    </span>
  ) : (
    <span className="cell-no">
      <X size={16} aria-hidden /> No
    </span>
  );
}

function Compare() {
  return (
    <section id="compare" className="section">
      <div className="wrap">
        <SectionHead
          eyebrow="Side by side"
          title={`Why it's worth ${money(QUEEN_PRICE - COMPETITOR_PRICE)} more than the best-selling foam mattress`}
          body="Compared with the best-selling foam mattress in its price range, Queen size."
        />
        <div className="compare">
          <table>
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">Feature</span>
                </th>
                <th scope="col" className="ours">
                  {PRODUCT.brand}
                </th>
                <th scope="col">Best-selling foam mattress</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((r) => (
                <tr key={r.label}>
                  <th scope="row">{r.label}</th>
                  <td className="ours">
                    <Cell v={r.ours} />
                  </td>
                  <td>
                    <Cell v={r.theirs} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="meta compare-note">Over 10 years, that's less than a dollar a month more, for a bed built to outlast the foam one.</p>
      </div>
    </section>
  );
}

function Closing({ onShop }: { onShop: () => void }) {
  return (
    <section className="closing">
      <div className="wrap closing-inner">
        <div>
          <h2>Try it for 100 nights</h2>
          <p>
            <Stars value={PRODUCT.rating} size={14} /> {PRODUCT.rating} from {PRODUCT.reviewCount.toLocaleString("en-US")} reviews · Free delivery
          </p>
        </div>
        <Button size="lg" onClick={onShop}>
          Choose your size <ArrowRight size={16} aria-hidden />
        </Button>
      </div>
    </section>
  );
}

function SizeSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [size, setSize] = useState("queen");
  const [state, setState] = useState<"choose" | "adding" | "added">("choose");
  const selected = SIZES.find((s) => s.id === size)!;

  useEffect(() => {
    if (!open) {
      const t = window.setTimeout(() => setState("choose"), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  const add = () => {
    setState("adding");
    window.setTimeout(() => setState("added"), 700);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="size-sheet">
        {state === "added" ? (
          <>
            <SheetHeader>
              <SheetTitle>Added to cart</SheetTitle>
              <SheetDescription>The {selected.label} is in your cart. Checkout isn't part of this prototype.</SheetDescription>
            </SheetHeader>
            <div className="sheet-body">
              <div className="added">
                <CircleCheck size={20} aria-hidden className="yes" />
                <div>
                  <div className="added-name">
                    {PRODUCT.name}, {selected.label}
                  </div>
                  <div className="meta">
                    {selected.dims} · {money(selected.price)}
                  </div>
                </div>
              </div>
              <p className="meta">Includes a 100-night home trial, free delivery and a 10-year warranty.</p>
            </div>
            <SheetFooter className="sheet-footer">
              <Button onClick={() => onOpenChange(false)}>Keep browsing</Button>
            </SheetFooter>
          </>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle>Choose your size</SheetTitle>
              <SheetDescription>{PRODUCT.name} · 12" medium-firm</SheetDescription>
            </SheetHeader>
            <div className="sheet-body">
              <fieldset className="sizes">
                <legend className="sr-only">Size</legend>
                {SIZES.map((s) => (
                  <label key={s.id} className="size-option" data-checked={size === s.id || undefined}>
                    <input type="radio" name="size" value={s.id} checked={size === s.id} onChange={() => setSize(s.id)} />
                    <span className="size-label">{s.label}</span>
                    <span className="meta">{s.dims}</span>
                    <span className="size-price">{money(s.price)}</span>
                  </label>
                ))}
              </fieldset>
            </div>
            <SheetFooter className="sheet-footer">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={add} disabled={state === "adding"} aria-busy={state === "adding"}>
                {state === "adding" && <Spinner aria-hidden />}
                Add to cart · {money(selected.price)}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
