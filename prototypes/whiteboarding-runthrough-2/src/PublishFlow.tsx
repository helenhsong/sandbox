import { useEffect, useRef, useState } from "react";
import { Button, Card, Checkbox, Input, InputGroup, InputGroupAddon, InputGroupInput, InputGroupText, RadioGroup, RadioGroupItem, Spinner, Textarea } from "@helenhsong/ui";
import { Check, FileText, Gift, Sparkles, Upload } from "lucide-react";
import {
  AUDIENCE,
  EMAIL,
  REVIEW,
  TEMPLATES,
  generateDescription,
  money,
  royalty,
  type Audience,
  type Book,
  type ReviewType,
  type TemplateId,
} from "./data";
import { BookCover, Field } from "./ui";

/** File names differ at the end (extension, version), so truncate the middle. */
function middleTruncate(name: string, max = 40) {
  if (name.length <= max) return name;
  const tail = 14;
  return `${name.slice(0, max - tail - 1)}…${name.slice(-tail)}`;
}

const STEP_NAMES = ["Book details", "Cover", "Audience and price", "Review and submit"];

type Props = {
  initial: Book;
  resubmit: boolean;
  onSaveExit: (b: Book) => void;
  onSubmit: (b: Book) => void;
};

type Errors = Partial<Record<"title" | "author" | "manuscript" | "description" | "audience" | "price" | "reviewType" | "terms", string>>;

function validate(b: Book, step: number, terms: boolean): Errors {
  const e: Errors = {};
  if (step === 1) {
    if (!b.title.trim()) e.title = "Enter a title.";
    if (!b.author.trim()) e.author = "Enter the author name readers will see.";
    if (!b.manuscript) e.manuscript = "Upload your manuscript to continue.";
    if (!b.description.trim()) e.description = "Add a description, or generate one with AI.";
  }
  if (step === 3) {
    if (!b.audience) e.audience = "Choose who this book is for.";
    const p = Number(b.price);
    if (!b.price || !Number.isFinite(p) || p < 0.99 || p > 200) e.price = "Enter a price between $0.99 and $200.";
  }
  if (step === 4) {
    if (!b.reviewType) e.reviewType = "Choose a review type.";
    if (!terms) e.terms = "Agree to the publishing terms to submit.";
  }
  return e;
}

export function PublishFlow({ initial, resubmit, onSaveExit, onSubmit }: Props) {
  const [book, setBook] = useState<Book>(initial);
  const [step, setStep] = useState(resubmit ? 1 : Math.min(initial.step, 4));
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [generating, setGenerating] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const set = (patch: Partial<Book>) => {
    setBook((b) => ({ ...b, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(patch)) delete next[k as keyof Errors];
      return next;
    });
  };

  useEffect(() => {
    headingRef.current?.focus();
    window.scrollTo(0, 0);
  }, [step]);

  const go = (to: number) => {
    setErrors({});
    setStep(to);
    setBook((b) => ({ ...b, step: Math.max(b.step, to) }));
  };

  const next = () => {
    const e = validate(book, step, terms);
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    if (step < 4) return go(step + 1);
    // Drafts can skip ahead in the stepper, so check earlier steps before submitting.
    for (const s of [1, 3]) {
      const earlier = validate(book, s, terms);
      if (Object.keys(earlier).length) {
        setStep(s);
        setErrors(earlier);
        return;
      }
    }
    onSubmit(book);
  };

  const generate = () => {
    setGenerating(true);
    window.setTimeout(() => {
      set({ description: generateDescription(book) });
      setGenerating(false);
    }, 1200);
  };

  const r = royalty(book.price);

  return (
    <div className="flow">
      <header className="flow-header">
        <div className="flow-title">
          <span className="wordmark small">amazon</span>
          <span className="divider-v" aria-hidden />
          <span className="strong">{resubmit ? "Fix and resubmit" : "Publish your book"}</span>
        </div>
        <ol className="stepper" aria-label="Progress">
          {STEP_NAMES.map((name, i) => {
            const n = i + 1;
            const state = n < step ? "done" : n === step ? "current" : "upcoming";
            const reachable = n < step || n <= book.step;
            return (
              <li key={name} className={`stepper-item is-${state}`}>
                <button disabled={!reachable || n === step} onClick={() => go(n)} aria-current={n === step ? "step" : undefined}>
                  <span className="stepper-dot">{state === "done" ? <Check size={12} aria-hidden /> : n}</span>
                  <span className="stepper-label">{name}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </header>

      <div className="flow-body">
        <Card className="flow-main">
          <p className="meta">
            Step {step} of 4
          </p>
          <h1 ref={headingRef} tabIndex={-1}>
            {STEP_NAMES[step - 1]}
          </h1>

          {resubmit && initial.reason && (
            <div className="callout stop" role="note">
              <p className="strong">Requested change: {initial.reason.label}</p>
              <p>{initial.reason.detail}</p>
            </div>
          )}

          {step === 1 && (
            <div className="form">
              <Field label="Title" htmlFor="title" error={errors.title}>
                <Input id="title" value={book.title} onChange={(e) => set({ title: e.target.value })} aria-invalid={!!errors.title} />
              </Field>
              <Field label="Subtitle (optional)" htmlFor="subtitle">
                <Input id="subtitle" value={book.subtitle} onChange={(e) => set({ subtitle: e.target.value })} />
              </Field>
              <Field label="Author name" htmlFor="author" hint="As it should appear on the cover and listing." error={errors.author}>
                <Input id="author" value={book.author} onChange={(e) => set({ author: e.target.value })} aria-invalid={!!errors.author} />
              </Field>
              <Field
                label="Manuscript"
                htmlFor="manuscript"
                error={errors.manuscript}
                action={
                  !book.manuscript && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => set({ manuscript: `${(book.title || "manuscript").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.docx` })}
                    >
                      Use sample (prototype)
                    </Button>
                  )
                }
              >
                {book.manuscript ? (
                  <div className="file-row">
                    <FileText size={16} aria-hidden />
                    <span className="file-name" title={book.manuscript}>
                      {middleTruncate(book.manuscript)}
                    </span>
                    <span className="meta">Uploaded</span>
                    <Button variant="outline" size="sm" onClick={() => set({ manuscript: null })}>
                      Replace
                    </Button>
                  </div>
                ) : (
                  <label className={`dropzone${errors.manuscript ? " is-invalid" : ""}`}>
                    <Upload size={20} aria-hidden />
                    <span className="strong">Upload manuscript</span>
                    <span className="meta">Or drag a file here</span>
                    <span className="meta">.docx, .epub or .pdf, up to 650 MB</span>
                    <input
                      id="manuscript"
                      type="file"
                      accept=".docx,.epub,.pdf"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) set({ manuscript: f.name });
                      }}
                    />
                  </label>
                )}
              </Field>
              <Field
                label="Description"
                htmlFor="description"
                hint="Shown on your book's page."
                error={errors.description}
                status={`${book.description.length.toLocaleString()} / 4,000`}
                action={
                  <Button variant="outline" size="sm" onClick={generate} disabled={generating}>
                    {generating ? <Spinner /> : <Sparkles size={16} aria-hidden />}
                    {generating ? "Writing…" : book.description ? "Rewrite with AI" : "Write with AI"}
                  </Button>
                }
              >
                <Textarea
                  id="description"
                  rows={6}
                  maxLength={4000}
                  value={book.description}
                  onChange={(e) => set({ description: e.target.value })}
                  aria-invalid={!!errors.description}
                  aria-busy={generating}
                  placeholder="What's your book about? Or let AI draft it from your manuscript."
                />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="form">
              <p className="muted">Pick a template. We'll set your title and author name on it. You can upload your own design instead.</p>
              <div className="template-grid" role="radiogroup" aria-label="Cover templates">
                {(Object.keys(TEMPLATES) as TemplateId[]).map((id) => {
                  const selected = book.cover.kind === "template" && book.cover.id === id;
                  return (
                    <button key={id} role="radio" aria-checked={selected} className={`template${selected ? " is-selected" : ""}`} onClick={() => set({ cover: { kind: "template", id } })}>
                      <BookCover book={{ ...book, cover: { kind: "template", id } }} size="md" />
                      <span>{TEMPLATES[id].name}</span>
                    </button>
                  );
                })}
              </div>
              <div className="or-row">
                <span>or</span>
              </div>
              <label className={`dropzone${book.cover.kind === "upload" ? " is-selected" : ""}`}>
                <Upload size={20} aria-hidden />
                <span className="strong">{book.cover.kind === "upload" ? `Using ${book.cover.name}` : "Upload your own cover"}</span>
                <span className="meta">JPG or PNG, at least 1600 × 2560 px</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) set({ cover: { kind: "upload", url: URL.createObjectURL(f), name: f.name } });
                  }}
                />
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="form">
              <fieldset className="field">
                <legend>Audience rating</legend>
                <RadioGroup className="choice-list" value={book.audience} onValueChange={(v) => set({ audience: v as Audience })} aria-invalid={!!errors.audience} aria-label="Audience rating">
                  {(Object.keys(AUDIENCE) as Audience[]).map((a) => (
                    <label key={a} className={`choice${book.audience === a ? " is-selected" : ""}`}>
                      <RadioGroupItem value={a} />
                      <span>
                        <span className="strong">{AUDIENCE[a].label}</span>
                        <span className="muted">{AUDIENCE[a].hint}</span>
                      </span>
                    </label>
                  ))}
                </RadioGroup>
                {errors.audience && (
                  <p className="error" role="alert">
                    {errors.audience}
                  </p>
                )}
              </fieldset>
              <Field label="Price (USD)" htmlFor="price" error={errors.price} hint="Books priced $2.99–$9.99 earn a 70% royalty. Others earn 35%.">
                <div className="price-row">
                  <InputGroup className="money-input">
                    <InputGroupAddon>
                      <InputGroupText>$</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput id="price" inputMode="decimal" value={book.price} onChange={(e) => set({ price: e.target.value.replace(/[^0-9.]/g, "") })} aria-invalid={!!errors.price} />
                  </InputGroup>
                  {r && !errors.price && (
                    <span className="earn">
                      You earn <span className="strong">{money(r.amount)}</span> per sale ({Math.round(r.rate * 100)}% royalty)
                    </span>
                  )}
                </div>
              </Field>
            </div>
          )}

          {step === 4 && (
            <div className="form">
              <section className="summary" aria-label="Your book">
                {[
                  { label: "Title", value: book.title + (book.subtitle ? `: ${book.subtitle}` : ""), step: 1 },
                  { label: "Author", value: book.author, step: 1 },
                  { label: "Manuscript", value: book.manuscript ? middleTruncate(book.manuscript) : "—", step: 1 },
                  { label: "Cover", value: book.cover.kind === "upload" ? book.cover.name : `${TEMPLATES[book.cover.id].name} template`, step: 2 },
                  { label: "Audience", value: book.audience ? AUDIENCE[book.audience].label : "—", step: 3 },
                  { label: "Price", value: `$${book.price}`, step: 3 },
                ].map((row) => (
                  <div key={row.label} className="summary-row">
                    <span className="muted">{row.label}</span>
                    <span>{row.value}</span>
                    <Button variant="outline" size="sm" onClick={() => go(row.step)} aria-label={`Edit ${row.label.toLowerCase()}`}>
                      Edit
                    </Button>
                  </div>
                ))}
              </section>

              <fieldset className="field">
                <legend>Review type</legend>
                <RadioGroup className="choice-list" value={book.reviewType} onValueChange={(v) => set({ reviewType: v as ReviewType })} aria-label="Review type">
                  {(Object.keys(REVIEW) as ReviewType[]).map((t) => (
                    <label key={t} className={`choice${book.reviewType === t ? " is-selected" : ""}`}>
                      <RadioGroupItem value={t} />
                      <span>
                        <span className="strong">
                          {REVIEW[t].label} <span className="pill">{REVIEW[t].time}</span>
                        </span>
                        <span className="muted">{REVIEW[t].hint}</span>
                      </span>
                    </label>
                  ))}
                </RadioGroup>
                {errors.reviewType && (
                  <p className="error" role="alert">
                    {errors.reviewType}
                  </p>
                )}
              </fieldset>

              <p className="muted">After you submit, your book is locked while it's reviewed. To make changes later, you'll resubmit. We'll email {EMAIL} and notify you here when review is done.</p>

              <label className="check">
                <Checkbox
                  checked={terms}
                  aria-invalid={!!errors.terms}
                  onCheckedChange={(checked) => {
                    setTerms(checked);
                    setErrors((x) => ({ ...x, terms: undefined }));
                  }}
                />
                <span>I own the rights to this book and agree to the publishing terms and content guidelines.</span>
              </label>
              {errors.terms && (
                <p className="error" role="alert">
                  {errors.terms}
                </p>
              )}
            </div>
          )}
        </Card>

        <Card className="flow-aside" role="complementary" aria-label="Preview">
          <p className="meta">Listing preview</p>
          <BookCover book={book} size="lg" />
          <p className="strong">{book.title || "Your title"}</p>
          <p className="muted">by {book.author || "Author name"}</p>
          {book.price && <p className="strong">Kindle edition ${book.price}</p>}
          {!resubmit && (
            <div className="offer small">
              <Gift size={16} aria-hidden />
              <span>First book: 3 months of Kindle Unlimited free once it's published.</span>
            </div>
          )}
        </Card>
      </div>

      <footer className="flow-footer">
        <Button variant="outline" onClick={() => onSaveExit({ ...book, step: Math.max(book.step, step) })}>
          {resubmit ? "Cancel" : "Save and exit"}
        </Button>
        <div className="actions">
          {step > 1 && (
            <Button variant="outline" onClick={() => go(step - 1)}>
              Back
            </Button>
          )}
          <Button onClick={next}>{step < 4 ? "Continue" : resubmit ? "Resubmit for review" : "Submit for review"}</Button>
        </div>
      </footer>
    </div>
  );
}
