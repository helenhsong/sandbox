import { useRef, useState, type ReactNode } from "react";
import { Button } from "@helenhsong/ui";
import { AlertCircle, Check, FileText, LoaderCircle, Lock, ShieldCheck, Sparkles, Upload, X } from "lucide-react";
import { COVER_TEMPLATES, GENRES, RATING_HINT, RATING_LABEL, aiDescription, earnings, formatPrice, royaltyRate, type Book, type Rating } from "./data";
import { useDeckFill, useHistoryState } from "../../../src/live-page";
import { Cover, Wordmark, useScrollLock } from "./ui";

const STEP_NAMES = ["Book details", "Cover", "Audience & price", "Review & submit"];

type Props = {
  initial: Book;
  resubmit: boolean;
  onExit: (draft: Book | null) => void;
  onSubmit: (book: Book) => void;
};

type Errors = Partial<Record<"title" | "author" | "genre" | "manuscript" | "rating" | "price" | "terms", string>>;

function validate(step: number, b: Book, agreed: boolean): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (!b.title.trim()) e.title = "Add a title.";
    if (!b.author.trim()) e.author = "Add the author name readers will see.";
    if (!b.genre) e.genre = "Choose a category.";
    if (!b.manuscript) e.manuscript = "Upload your manuscript.";
  }
  if (step === 2) {
    if (!b.rating) e.rating = "Choose who the book is for.";
    if (!earnings(b.price)) e.price = "Enter a price above $0.";
  }
  if (step === 3 && !agreed) e.terms = "Confirm you hold the rights to publish this book.";
  return e;
}

export function PublishFlow({ initial, resubmit, onExit, onSubmit }: Props) {
  const [book, setBook] = useState(initial);
  const [step, setStep] = useHistoryState("step", 0, { nested: true });
  const [errors, setErrors] = useState<Errors>({});
  const [agreed, setAgreed] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const update = (patch: Partial<Book>) => {
    setBook((b) => ({ ...b, ...patch }));
    // Clear an error as soon as its field is fixed.
    setErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(patch)) delete next[k as keyof Errors];
      if ("price" in patch && earnings(patch.price ?? "") === null) next.price = e.price;
      return next;
    });
  };

  const go = (next: number) => {
    setErrors({});
    setStep(next);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const next = () => {
    const e = validate(step, book, agreed);
    setErrors(e);
    if (Object.keys(e).length) return;
    if (step === 3) onSubmit(book);
    else go(step + 1);
  };

  // In a deck, the window's fast-forward button fills in whatever this step still needs. It's
  // offered only while something is missing, so the button disappears once the step is complete.
  const needsFill =
    step === 0
      ? !book.title.trim() || !book.author.trim() || !book.genre || !book.manuscript
      : step === 2
        ? book.rating == null || !earnings(book.price)
        : step === 3 && !agreed;
  useDeckFill(needsFill ? () => {
    if (step === 0) {
      const title = book.title.trim() || "The Lantern Keeper";
      update({
        title,
        author: book.author.trim() || "Maya Chen",
        genre: book.genre || GENRES[0],
        manuscript: book.manuscript ?? `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.docx`,
      });
    }
    if (step === 2) update({ rating: book.rating ?? "general", price: earnings(book.price) ? book.price : "4.99" });
    if (step === 3) {
      setAgreed(true);
      setErrors((e) => ({ ...e, terms: undefined }));
    }
  } : null);

  const generate = () => {
    setGenerating(true);
    window.setTimeout(() => {
      update({ description: aiDescription(book) });
      setGenerating(false);
    }, 1400);
  };

  return (
    <div className="flow">
      <header className="flow-header">
        <Wordmark />
        <div className="flow-title">
          <span className="strong">{resubmit ? `Resubmit “${initial.title}”` : "Publish your book"}</span>
          <span className="muted meta">
            Step {step + 1} of 4: {STEP_NAMES[step]}
          </span>
        </div>
        <button className="icon-btn" aria-label="Close and exit publishing" onClick={() => setConfirmExit(true)}>
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      <ol className="stepper" aria-label="Progress">
        {STEP_NAMES.map((name, i) => (
          <li key={name} className={i < step ? "done" : i === step ? "current" : ""} aria-current={i === step ? "step" : undefined}>
            <span className="stepper-dot">{i < step ? <Check size={14} aria-hidden="true" /> : i + 1}</span>
            {i < step ? (
              <button className="link-reset stepper-label" onClick={() => go(i)}>
                {name}
              </button>
            ) : (
              <span className="stepper-label">{name}</span>
            )}
          </li>
        ))}
      </ol>

      <div className="flow-body">
        <main className="flow-main">
          <h1 ref={headingRef} tabIndex={-1} className="flow-heading">
            {STEP_NAMES[step]}
          </h1>
          {step === 0 && <DetailsStep book={book} update={update} errors={errors} generating={generating} onGenerate={generate} />}
          {step === 1 && <CoverStep book={book} update={update} />}
          {step === 2 && <AudienceStep book={book} update={update} errors={errors} />}
          {step === 3 && <ReviewStep book={book} update={update} agreed={agreed} setAgreed={(v) => { setAgreed(v); setErrors((e) => ({ ...e, terms: undefined })); }} errors={errors} onEdit={go} />}
        </main>
        <aside className="flow-aside" aria-label="Preview">
          <p className="meta muted">Preview on Amazon</p>
          <Cover book={book} size="lg" />
          <p className="strong preview-title">{book.title || "Your title"}</p>
          <p className="muted meta">by {book.author || "Author name"}</p>
          {earnings(book.price) && <p className="strong">{formatPrice(book.price)}</p>}
        </aside>
      </div>

      <footer className="flow-footer">
        <Button variant="outline" onClick={() => setConfirmExit(true)}>
          Save and exit
        </Button>
        <div className="footer-right">
          {step > 0 && (
            <Button variant="outline" onClick={() => go(step - 1)}>
              Back
            </Button>
          )}
          <Button onClick={next}>{step === 3 ? (resubmit ? "Resubmit for review" : "Submit for review") : "Continue"}</Button>
        </div>
      </footer>

      {confirmExit && <ExitDialog resubmit={resubmit} onCancel={() => setConfirmExit(false)} onDiscard={() => onExit(null)} onSave={() => onExit(book)} />}
    </div>
  );
}

function ExitDialog({ resubmit, onCancel, onDiscard, onSave }: { resubmit: boolean; onCancel: () => void; onDiscard: () => void; onSave: () => void }) {
  useScrollLock();
  return (
    <div className="scrim" role="presentation" onClick={onCancel}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onCancel()}
      >
        <h2 id="exit-title">{resubmit ? "Leave without resubmitting?" : "Leave publishing?"}</h2>
        <p className="muted">
          {resubmit
            ? "Your changes won't be saved. The book stays as it was in Your Books."
            : "We'll save your progress as a draft in Your Books, so you can pick up where you left off."}
        </p>
        <div className="dialog-actions">
          {!resubmit && (
            <Button variant="outline" onClick={onDiscard}>
              Discard
            </Button>
          )}
          <Button variant="outline" autoFocus onClick={onCancel}>
            Keep going
          </Button>
          {resubmit ? <Button onClick={onDiscard}>Leave</Button> : <Button onClick={onSave}>Save draft</Button>}
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, error, children, id }: { label: string; hint?: string; error?: string; children: ReactNode; id: string }) {
  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      <label htmlFor={id} className="strong">
        {label}
      </label>
      {hint && <p className="muted meta">{hint}</p>}
      {children}
      {error && (
        <p className="error meta" id={`${id}-error`}>
          <AlertCircle size={14} aria-hidden="true" /> {error}
        </p>
      )}
    </div>
  );
}

type StepProps = { book: Book; update: (p: Partial<Book>) => void };

function DetailsStep({ book, update, errors, generating, onGenerate }: StepProps & { errors: Errors; generating: boolean; onGenerate: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const canGenerate = book.title.trim() && book.genre && !generating;
  return (
    <div className="form">
      <Field id="title" label="Title" error={errors.title}>
        <input id="title" value={book.title} onChange={(e) => update({ title: e.target.value })} aria-invalid={!!errors.title} placeholder="The Lighthouse Keeper's Daughter" />
      </Field>
      <div className="field-row">
        <Field id="author" label="Author name" hint="As it should appear on the cover." error={errors.author}>
          <input id="author" value={book.author} onChange={(e) => update({ author: e.target.value })} aria-invalid={!!errors.author} />
        </Field>
        <Field id="genre" label="Category" hint="Helps readers find your book." error={errors.genre}>
          <select id="genre" value={book.genre} onChange={(e) => update({ genre: e.target.value })} aria-invalid={!!errors.genre}>
            <option value="">Choose a category</option>
            {GENRES.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field id="manuscript" label="Manuscript" hint=".docx, .epub, or .pdf, up to 650 MB." error={errors.manuscript}>
        <input
          ref={fileRef}
          id="manuscript"
          type="file"
          accept=".docx,.epub,.pdf,.doc,.txt"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) update({ manuscript: f.name });
          }}
        />
        {book.manuscript ? (
          <div className="file-chip">
            <FileText size={16} aria-hidden="true" />
            <span className="strong">{book.manuscript}</span>
            <span className="badge tone-done">
              <Check size={12} aria-hidden="true" /> Uploaded
            </span>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              Replace
            </Button>
          </div>
        ) : (
          <div className="dropzone">
            <Upload size={20} aria-hidden="true" />
            <span>Drag your manuscript here, or</span>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              Choose file
            </Button>
          </div>
        )}
      </Field>
      <Field id="description" label="Description" hint="Shown on your book's page. Optional, and you can edit what we write.">
        <div className="desc-tools">
          <Button variant="outline" size="sm" onClick={onGenerate} disabled={!canGenerate}>
            {generating ? <LoaderCircle size={16} className="spin" aria-hidden="true" /> : <Sparkles size={16} aria-hidden="true" />}
            {generating ? "Writing…" : book.description ? "Rewrite with AI" : "Write it for me"}
          </Button>
          {!book.title.trim() || !book.genre ? <span className="muted meta">Add a title and category first.</span> : null}
        </div>
        <textarea
          id="description"
          rows={5}
          value={book.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="What's your book about?"
          aria-busy={generating}
        />
      </Field>
    </div>
  );
}

function CoverStep({ book, update }: StepProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="form">
      <p className="muted">Start from a template, or upload your own cover. You can preview it on the right.</p>
      <fieldset className="cover-grid">
        <legend className="sr-only">Cover templates</legend>
        {COVER_TEMPLATES.map((t, i) => {
          const selected = book.cover.kind === "template" && book.cover.template === i;
          return (
            <label key={t.name} className={`cover-option ${selected ? "selected" : ""}`}>
              <input type="radio" name="cover" className="sr-only" checked={selected} onChange={() => update({ cover: { kind: "template", template: i } })} />
              <Cover book={{ ...book, cover: { kind: "template", template: i } }} size="md" />
              <span className="meta">{t.name}</span>
            </label>
          );
        })}
        <label className={`cover-option upload ${book.cover.kind === "upload" ? "selected" : ""}`}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const reader = new FileReader();
              reader.onload = () => update({ cover: { kind: "upload", url: String(reader.result), name: f.name } });
              reader.readAsDataURL(f);
            }}
          />
          {book.cover.kind === "upload" ? (
            <Cover book={book} size="md" />
          ) : (
            <span className="cover cover-md upload-tile">
              <Upload size={20} aria-hidden="true" />
              Upload
            </span>
          )}
          <span className="meta">{book.cover.kind === "upload" ? book.cover.name : "Your own cover"}</span>
        </label>
      </fieldset>
      <p className="muted meta">Recommended size for your own cover: 1600 × 2560 px, JPG or PNG.</p>
    </div>
  );
}

function AudienceStep({ book, update, errors }: StepProps & { errors: Errors }) {
  const earn = earnings(book.price);
  return (
    <div className="form">
      <fieldset className={`field ${errors.rating ? "has-error" : ""}`}>
        <legend className="strong">Who is this book for?</legend>
        <p className="muted meta">Reviewers check that the content matches what you choose.</p>
        <div className="choice-grid">
          {(Object.keys(RATING_LABEL) as Rating[]).map((r) => (
            <label key={r} className={`choice ${book.rating === r ? "selected" : ""}`}>
              <input type="radio" name="rating" checked={book.rating === r} onChange={() => update({ rating: r })} />
              <span>
                <span className="strong">{RATING_LABEL[r]}</span>
                <span className="muted meta block">{RATING_HINT[r]}</span>
              </span>
            </label>
          ))}
        </div>
        {errors.rating && (
          <p className="error meta">
            <AlertCircle size={14} aria-hidden="true" /> {errors.rating}
          </p>
        )}
      </fieldset>
      <Field id="price" label="Kindle price" hint="Most first-time authors choose $2.99 to $4.99. Prices from $2.99 to $9.99 earn a 70% royalty; others earn 35%." error={errors.price}>
        <div className="price-row">
          <span className="prefix">$</span>
          <input
            id="price"
            inputMode="decimal"
            value={book.price}
            onChange={(e) => update({ price: e.target.value.replace(/[^0-9.]/g, "") })}
            onBlur={() => earn && update({ price: Number.parseFloat(book.price).toFixed(2) })}
            aria-invalid={!!errors.price}
          />
          {earn && (
            <span className="muted">
              You earn about <span className="strong fg">{earn}</span> per sale ({Math.round((royaltyRate(book.price) ?? 0) * 100)}% royalty)
            </span>
          )}
        </div>
      </Field>
    </div>
  );
}

function ReviewStep({ book, update, agreed, setAgreed, errors, onEdit }: StepProps & { agreed: boolean; setAgreed: (v: boolean) => void; errors: Errors; onEdit: (s: number) => void }) {
  return (
    <div className="form">
      <section className="summary" aria-label="Summary">
        <SummaryRow label="Book" onEdit={() => onEdit(0)}>
          <span className="strong">{book.title}</span> by {book.author} · {book.genre}
          <span className="muted meta block">{book.manuscript}</span>
        </SummaryRow>
        <SummaryRow label="Description" onEdit={() => onEdit(0)}>
          {book.description ? <span className="clamp">{book.description}</span> : <span className="muted">None. You can add one later.</span>}
        </SummaryRow>
        <SummaryRow label="Cover" onEdit={() => onEdit(1)}>
          {book.cover.kind === "upload" ? book.cover.name : `${COVER_TEMPLATES[book.cover.template].name} template`}
        </SummaryRow>
        <SummaryRow label="Audience & price" onEdit={() => onEdit(2)}>
          {book.rating ? RATING_LABEL[book.rating] : "—"} · {formatPrice(book.price)}
        </SummaryRow>
      </section>

      <fieldset className="field">
        <legend className="strong">How should we review it?</legend>
        <p className="muted meta">We check that the content follows our guidelines and matches the audience you chose.</p>
        <div className="choice-grid two">
          <label className={`choice ${book.reviewType === "ai" ? "selected" : ""}`}>
            <input type="radio" name="review" checked={book.reviewType === "ai"} onChange={() => update({ reviewType: "ai" })} />
            <span>
              <span className="strong">
                <Sparkles size={16} aria-hidden="true" /> AI review
              </span>
              <span className="muted meta block">Usually done in minutes.</span>
            </span>
          </label>
          <label className={`choice ${book.reviewType === "human" ? "selected" : ""}`}>
            <input type="radio" name="review" checked={book.reviewType === "human"} onChange={() => update({ reviewType: "human" })} />
            <span>
              <span className="strong">
                <ShieldCheck size={16} aria-hidden="true" /> Human review
              </span>
              <span className="muted meta block">A person reads it. Done within 24 hours.</span>
            </span>
          </label>
        </div>
      </fieldset>

      <p className="note">
        <Lock size={16} aria-hidden="true" /> Your book is locked once you submit. To change anything later, you'll resubmit it for review.
      </p>

      <label className={`check ${errors.terms ? "has-error" : ""}`}>
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} aria-invalid={!!errors.terms} />
        <span>I hold the rights to publish this book, and it follows the content guidelines.</span>
      </label>
      {errors.terms && (
        <p className="error meta">
          <AlertCircle size={14} aria-hidden="true" /> {errors.terms}
        </p>
      )}
    </div>
  );
}

function SummaryRow({ label, children, onEdit }: { label: string; children: ReactNode; onEdit: () => void }) {
  return (
    <div className="summary-row">
      <span className="muted summary-label">{label}</span>
      <span className="summary-value">{children}</span>
      <Button variant="outline" size="sm" onClick={onEdit} aria-label={`Edit ${label}`}>
        Edit
      </Button>
    </div>
  );
}
