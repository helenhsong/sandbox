import { useState } from "react";
import { Button } from "@helenhsong/ui";
import { ArrowRight, BookText, Check, Clock, FileText, Gift, Image, ShieldCheck, Sparkles, Tag, X } from "lucide-react";

export function Home({ onStart }: { onStart: () => void }) {
  const [dismissed, setDismissed] = useState(false);
  return (
    <div className="page">
      <div className="ghost ghost-hero" aria-hidden="true" />
      {!dismissed && (
        <section className="promo" aria-labelledby="promo-title">
          <div className="promo-art" aria-hidden="true">
            <BookText size={40} strokeWidth={1.5} />
          </div>
          <div className="promo-copy">
            <p className="eyebrow">New · Picked for readers and writers</p>
            <h2 id="promo-title">You've read hundreds of books. Ready to publish yours?</h2>
            <p className="muted">
              Self-publish on Amazon in four simple steps. Your first book comes with 2 months of Kindle Unlimited, free.
            </p>
          </div>
          <div className="promo-actions">
            <Button size="lg" onClick={onStart}>
              Start your journey <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </div>
          <button className="icon-btn promo-close" aria-label="Dismiss" onClick={() => setDismissed(true)}>
            <X size={16} aria-hidden="true" />
          </button>
        </section>
      )}
      <section aria-hidden="true">
        <div className="ghost ghost-line" />
        <div className="ghost-row">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="ghost ghost-book" />
          ))}
        </div>
        <div className="ghost ghost-line" />
        <div className="ghost-row">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="ghost ghost-book" />
          ))}
        </div>
      </section>
    </div>
  );
}

const STEPS = [
  { icon: FileText, title: "Add your book", time: "About 5 minutes", text: "Upload your manuscript and add a title. We can write the description for you." },
  { icon: Image, title: "Choose a cover", time: "About 2 minutes", text: "Pick a ready-made template, or upload a cover you already have." },
  { icon: Tag, title: "Set audience and price", time: "About 1 minute", text: "Tell readers who it's for and choose what it costs. We show what you'll earn." },
  { icon: ShieldCheck, title: "Submit and publish", time: "Minutes to 24 hours", text: "We check the book follows our guidelines. Once approved, you publish with one click." },
];

export function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="page landing">
      <header className="landing-hero">
        <div>
          <p className="eyebrow">Self-publishing on Amazon</p>
          <h1>Your book, in front of millions of readers</h1>
          <p className="lede muted">No agent, no publisher, no upfront cost. If your manuscript is finished, you're about 10 minutes from submitting it.</p>
          <p className="offer">
            <Gift size={16} aria-hidden="true" /> Publish your first book and get 2 months of Kindle Unlimited, free.
          </p>
        </div>
        <div className="hero-actions">
          <Button size="lg" onClick={onStart}>
            Start publishing <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </header>

      <section aria-labelledby="steps-title">
        <h2 id="steps-title" className="section-title">
          Four steps from manuscript to bookstore
        </h2>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="step-card">
              <span className="step-num">{i + 1}</span>
              <s.icon size={20} aria-hidden="true" />
              <h3>{s.title}</h3>
              <p className="muted">{s.text}</p>
              <p className="meta step-time">
                <Clock size={14} aria-hidden="true" /> {s.time}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <div className="landing-grid">
        <section className="panel" aria-labelledby="need-title">
          <h2 id="need-title" className="section-title">
            What you'll need
          </h2>
          <ul className="checklist">
            <li>
              <Check size={16} aria-hidden="true" /> Your finished manuscript (.docx, .epub, or .pdf)
            </li>
            <li>
              <Check size={16} aria-hidden="true" /> A title and the author name to show
            </li>
            <li>
              <Check size={16} aria-hidden="true" /> A price in mind. You can change it later
            </li>
          </ul>
          <p className="muted meta">A cover and description are optional. We help you make both.</p>
        </section>
        <section className="panel" aria-labelledby="review-title">
          <h2 id="review-title" className="section-title">
            How review works
          </h2>
          <dl className="facts">
            <div>
              <dt>
                <Sparkles size={16} aria-hidden="true" /> AI review
              </dt>
              <dd className="muted">Usually done in minutes.</dd>
            </div>
            <div>
              <dt>
                <ShieldCheck size={16} aria-hidden="true" /> Human review
              </dt>
              <dd className="muted">If you'd rather a person reads it. Done within 24 hours.</dd>
            </div>
          </dl>
          <p className="muted meta">Your book is locked while it's reviewed. To change it after submitting, you resubmit.</p>
        </section>
      </div>

      <div className="landing-footer">
        <p className="muted">Ready when you are. You can save and come back any time.</p>
        <Button size="lg" onClick={onStart}>
          Start publishing <ArrowRight size={16} aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
