import { Button, Card } from "@helenhsong/ui";
import { ArrowRight, Bot, Check, Clock, FileText, Gift, Image, PenLine, Tag, UserCheck } from "lucide-react";
import { BookCover, Breadcrumbs } from "./ui";

export function Home({ onStart }: { onStart: () => void }) {
  return (
    <main className="page home">
      <div className="ghost hero-ghost" aria-hidden />
      <div className="tile-row">
        <section className="promo" aria-labelledby="promo-title">
          <p className="eyebrow">Recommended for you</p>
          <h2 id="promo-title">Your book belongs on Amazon</h2>
          <p className="muted">Publish your finished book in four simple steps. It's free, and your first book comes with 3 months of Kindle Unlimited.</p>
          <div className="promo-covers" aria-hidden>
            <BookCover book={{ title: "Tide Lines", author: "You", cover: { kind: "template", id: "dusk" } }} size="md" />
            <BookCover book={{ title: "Field Notes", author: "You", cover: { kind: "template", id: "meadow" } }} size="md" />
            <BookCover book={{ title: "After Dark", author: "You", cover: { kind: "template", id: "night" } }} size="md" />
          </div>
          <div className="actions">
            <Button onClick={onStart}>
              Start your journey <ArrowRight size={16} aria-hidden />
            </Button>
          </div>
          <p className="meta">Shown because you shop for Kindle and writing books</p>
        </section>
        {[0, 1, 2].map((i) => (
          <div key={i} className="ghost tile-ghost" aria-hidden>
            <div className="ghost-line w60" />
            <div className="ghost-block" />
          </div>
        ))}
      </div>
      <div className="ghost-row" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="ghost product-ghost" />
        ))}
      </div>
    </main>
  );
}

const STEPS = [
  { icon: PenLine, title: "Add your book details", time: "About 10 min", text: "Title, author name, your manuscript, and a description. AI can draft the description for you." },
  { icon: Image, title: "Choose a cover", time: "About 5 min", text: "Pick a ready-made template or upload your own design." },
  { icon: Tag, title: "Set audience and price", time: "About 5 min", text: "Rate your book for general readers, adults, or children, and choose a price." },
  { icon: UserCheck, title: "Submit for review", time: "About 2 min", text: "Choose a fast AI review or a human review. Approved books publish with one click." },
];

export function Landing({ onStart, onBooks, onHome, hasBooks }: { onStart: () => void; onBooks: () => void; onHome: () => void; hasBooks: boolean }) {
  return (
    <main className="page landing">
      <Breadcrumbs items={[{ label: "Amazon", onClick: onHome }, { label: "Self-publishing" }]} />
      <section className="landing-hero">
        <div>
          <h1>Publish your book on Amazon</h1>
          <p className="lede">Four steps, about 20 minutes. Free to publish, and you keep up to 70% of every sale. No publisher, no agent.</p>
          <div className="actions start">
            {hasBooks && (
              <Button variant="outline" onClick={onBooks}>
                Your books
              </Button>
            )}
            <Button size="lg" onClick={onStart}>
              Start publishing <ArrowRight size={16} aria-hidden />
            </Button>
          </div>
        </div>
        <div className="offer">
          <Gift size={20} aria-hidden />
          <div>
            <p className="strong">First-book offer</p>
            <p className="muted">Publish your first book and get 3 months of Kindle Unlimited free.</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="steps-title">
        <h2 id="steps-title">How it works</h2>
        <ol className="steps-grid">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <Card className="step-card">
              <div className="step-top">
                <span className="step-num">{i + 1}</span>
                <span className="meta">
                  <Clock size={12} aria-hidden /> {s.time}
                </span>
              </div>
              <s.icon size={20} aria-hidden />
              <h3>{s.title}</h3>
              <p className="muted">{s.text}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <div className="two-col">
        <Card className="panel" role="region" aria-labelledby="need-title">
          <h2 id="need-title">What you'll need</h2>
          <ul className="checklist">
            <li>
              <Check size={16} aria-hidden /> Your finished manuscript (.docx, .epub, or .pdf)
            </li>
            <li>
              <Check size={16} aria-hidden /> A title and the author name readers will see
            </li>
            <li>
              <Check size={16} aria-hidden /> A price in mind (you can change it later)
            </li>
            <li>
              <Check size={16} aria-hidden /> A cover is optional. Templates are included
            </li>
          </ul>
        </Card>
        <Card className="panel" role="region" aria-labelledby="review-title">
          <h2 id="review-title">How review works</h2>
          <ul className="checklist plain">
            <li>
              <Bot size={16} aria-hidden /> AI review checks your content and rating, usually in under an hour.
            </li>
            <li>
              <UserCheck size={16} aria-hidden /> Prefer a person? Human review takes up to 24 hours.
            </li>
            <li>
              <FileText size={16} aria-hidden /> We email you and notify you here when it's done. Then you click Publish.
            </li>
          </ul>
        </Card>
      </div>

      <section className="landing-cta">
        <p className="strong">Ready when you are. You can save and come back anytime.</p>
        <Button size="lg" onClick={onStart}>
          Start publishing <ArrowRight size={16} aria-hidden />
        </Button>
      </section>
    </main>
  );
}
