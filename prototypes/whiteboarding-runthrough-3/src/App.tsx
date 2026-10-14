import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Spinner,
} from "@helenhsong/ui";
import {
  Award,
  Check,
  ChevronLeft,
  ChevronRight,
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
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Features />
        <PressReviews />
        <CustomerReviews />
        <Fit />
        <Feel />
        <Values />
        <Compare />
        <ChooseSize />
      </main>
      <footer className="site-footer">
        <span>© 2026 {PRODUCT.brand}. Prototype with sample content.</span>
      </footer>
    </>
  );
}

function useActiveSection() {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    // Also watch the hero and the size section, which aren't in the nav, so nothing stays highlighted over them.
    const ids = ["top", ...SECTIONS.map((s) => s.id), "buy"];
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
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

function Header() {
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
        <Button nativeButton={false} render={<a href="#buy" />}>
          Choose your size
        </Button>
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

const HERO_REASONS = ["Sleeps cooler than all-foam mattresses", "Firmer support under your lower back", "100-night trial, free delivery"];

function Hero() {
  return (
    <section id="top" className="hero">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <h1 className="hero-title">Sleep cool. Wake up without the backache.</h1>
          <p className="lede">Natural latex over zoned coils.</p>
          <a className="rating-line" href="#reviews">
            <Stars value={PRODUCT.rating} />
            <span>
              {PRODUCT.rating} from {PRODUCT.reviewCount.toLocaleString("en-US")} reviews
            </span>
          </a>
          <ul className="hero-reasons">
            {HERO_REASONS.map((r) => (
              <li key={r}>
                <Check size={16} aria-hidden /> {r}
              </li>
            ))}
          </ul>
          <div className="hero-buy">
            <div>
              <div className="price">{money(QUEEN_PRICE)}</div>
              <div className="meta">Queen size</div>
            </div>
            <div className="hero-actions">
              <Button nativeButton={false} render={<a href="#buy" />}>
                Choose your size
              </Button>
              <Button variant="outline" nativeButton={false} render={<a href="#compare" />}>
                See how it compares
              </Button>
            </div>
          </div>
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
    <section id="features" className="section tinted">
      <div className="wrap">
        <SectionHead title="Built to fix what other mattresses get wrong." body="Five layers, each with one job." />
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

function SectionHead({ id, title, body, split }: { id?: string; title: string; body?: string; split?: boolean }) {
  if (split) {
    return (
      <div className="section-head section-head-split">
        <h2 id={id} className="section-title">
          {title}
        </h2>
        {body && <p className="section-split-body">{body}</p>}
      </div>
    );
  }
  return (
    <div className="section-head">
      <h2 id={id} className="section-title">
        {title}
        {body && <span className="section-title-sub"> {body}</span>}
      </h2>
    </div>
  );
}

function PressReviews() {
  return (
    <section className="section press" aria-labelledby="press-title">
      <div className="wrap">
        <SectionHead id="press-title" title="What the experts say." body="Independent testers on how it sleeps." />
        <div className="press-grid">
          {PRESS.map((p) => (
            <figure key={p.source} className="press-card">
              {p.award && (
                <p className="press-award">
                  <Award size={14} aria-hidden /> {p.award}
                </p>
              )}
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

const REVIEWS_PER_PAGE = 4;
const REVIEWS_BY_DATE = [...REVIEWS].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

function CustomerReviews() {
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(0);
  const matching = filter === "all" ? REVIEWS_BY_DATE : REVIEWS_BY_DATE.filter((r) => r.tag === filter);
  const pages = Math.max(1, Math.ceil(matching.length / REVIEWS_PER_PAGE));
  const shown = matching.slice(page * REVIEWS_PER_PAGE, (page + 1) * REVIEWS_PER_PAGE);
  const choose = (f: Filter) => {
    setFilter(f);
    setPage(0);
  };
  const filters: Filter[] = ["all", "back-pain", "hot", "couple", "eco"];

  return (
    <section id="reviews" className="section">
      <div className="wrap">
        <SectionHead title="People who sleep like you." body="In their own words." />
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
          <div className="reviews-col">
            <div className="chips" role="group" aria-label="Filter reviews by sleeper">
              {filters.map((f) => (
                <button key={f} type="button" className="chip" aria-pressed={filter === f} onClick={() => choose(f)}>
                  {f === "all" ? "All" : SLEEPER_LABELS[f]}
                </button>
              ))}
            </div>
            {shown.length === 0 ? (
              <div className="empty">
                <p>No reviews from {filter === "all" ? "customers" : SLEEPER_LABELS[filter].toLowerCase()} yet.</p>
                <Button variant="outline" onClick={() => choose("all")}>
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
            {/* The row's height is always reserved so the page doesn't shift; its controls only appear when there's more than one page. */}
            <div className="review-pager">
              {pages > 1 && (
                <>
                  <span className="meta">
                    {page * REVIEWS_PER_PAGE + 1}–{page * REVIEWS_PER_PAGE + shown.length} of {matching.length}
                  </span>
                  <div className="review-pager-actions">
                    <Button variant="outline" size="icon" aria-label="Previous reviews" disabled={page === 0} onClick={() => setPage(page - 1)}>
                      <ChevronLeft size={16} aria-hidden />
                    </Button>
                    <Button variant="outline" size="icon" aria-label="Next reviews" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>
                      <ChevronRight size={16} aria-hidden />
                    </Button>
                  </div>
                </>
              )}
            </div>
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
          title="Is it right for you?"
          body="Here's who loves it, and who might not."
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
        <SectionHead split id="feel-title" title="How it feels" body="Medium-firm, 12 inches thick, and it sleeps cool. Firm enough to keep your back aligned, with a latex top that gives where your shoulders and hips need it." />
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
        <SectionHead split id="values-title" title="What your mattress supports" body="Certified organic cotton and latex, no chemical flame retardants, and a North Carolina factory where every maker earns a living wage." />
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
          title={`Why it's worth ${money(QUEEN_PRICE - COMPETITOR_PRICE)} more.`}
          body="Side by side with the best-selling foam mattress, Queen size."
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

function ChooseSize() {
  const [size, setSize] = useState("queen");
  const [state, setState] = useState<"choose" | "adding" | "added">("choose");
  const selected = SIZES.find((s) => s.id === size)!;
  // Top-down footprint drawn to scale inside an 84" × 88" frame, so sizes compare honestly.
  const footprint = { width: `${(selected.w / 84) * 100}%`, height: `${(selected.l / 88) * 100}%` };

  const pick = (id: string) => {
    setSize(id);
    setState("choose");
  };
  const add = () => {
    setState("adding");
    window.setTimeout(() => setState("added"), 700);
  };

  return (
    <section id="buy" className="section buy" aria-labelledby="buy-title">
      <div className="wrap buy-grid">
        <div className="size-stage" aria-hidden>
          <div className="size-frame">
            <div className="size-footprint" style={footprint}>
              <div className="size-pillows">
                <span />
                {selected.w >= 54 && <span />}
              </div>
            </div>
          </div>
          <p className="meta">Top view, to scale</p>
        </div>
        <div className="buy-panel">
          <h2 id="buy-title" className="section-title">
            Choose your size.
          </h2>
          <div className="chips size-chips" role="group" aria-label="Size">
            {SIZES.map((s) => (
              <button key={s.id} type="button" className="chip" aria-pressed={size === s.id} onClick={() => pick(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
          <div>
            <div className="price">{money(selected.price)}</div>
            <div className="meta">
              {selected.label} · {selected.dims} · 12" thick
            </div>
          </div>
          {/* The button keeps its size in every state so nothing below it moves. */}
          <div className="buy-action">
            <Button className="buy-button" onClick={add} disabled={state !== "choose"} aria-busy={state === "adding"}>
              {state === "adding" && <Spinner aria-hidden />}
              {state === "added" && <CircleCheck size={16} aria-hidden />}
              {state === "added" ? "In your cart" : "Add to cart"}
            </Button>
            <span className="meta" role="status">
              {state === "added" ? `The ${selected.label} is in your cart. Checkout isn't part of this prototype.` : ""}
            </span>
          </div>
          <p className="meta buy-assurance">
            <Stars value={PRODUCT.rating} size={14} /> {PRODUCT.rating} from {PRODUCT.reviewCount.toLocaleString("en-US")} reviews · 100-night trial · Free delivery
          </p>
        </div>
      </div>
    </section>
  );
}
