import { useEffect, useState, type FormEvent } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from "@helenhsong/ui";
import { CircleCheck, ExternalLink, LoaderCircle, TriangleAlert } from "lucide-react";
import { isImageLoading, visibleSlides, type FigmaSlide, type Slide } from "../../../src/deck/types";
import { SLUG_PATTERN, isFigmaLive, isValidUrl, openLink, plural, slugify, type Draft } from "./draft";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: Draft;
  /** The draft's slides with images loaded, ready to read. */
  slides: Slide[];
  onChange: (change: Partial<Draft>) => void;
  onSelect: (slideId: string) => void;
  onExport: () => void;
}

type SlugUse = "deck" | "project" | "reserved" | null;

/** What a URL name is already used by in the local Sandbox, checked as it's typed. */
function useSlugUse(slug: string) {
  const [result, setResult] = useState<{ slug: string; usedBy: SlugUse }>({ slug: "", usedBy: null });
  useEffect(() => {
    if (!slug || !import.meta.env.DEV) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      fetch(`/__deck-builder/slug?slug=${encodeURIComponent(slug)}`)
        .then((response) => response.json() as Promise<{ usedBy: SlugUse }>)
        .then(({ usedBy }) => {
          if (!cancelled) setResult({ slug, usedBy });
        })
        .catch(() => undefined);
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug]);
  // Only trust an answer for the URL name as it is now.
  return result.slug === slug ? result.usedBy : null;
}

interface Published {
  path: string;
  slug: string;
  replaced: boolean;
}

type State =
  | { phase: "form"; error?: string }
  | { phase: "publishing"; step: string }
  | { phase: "done"; result: Published };

const PUBLIC_HOST = "helenhsong.com/sandbox/";

/** Reads an image in the browser when Figma's storage allows it; otherwise the dev server downloads it. */
async function toDataUrl(src: string) {
  try {
    const response = await fetch(src);
    if (!response.ok) return undefined;
    const blob = await response.blob();
    return await new Promise<string>((done, fail) => {
      const reader = new FileReader();
      reader.onload = () => done(reader.result as string);
      reader.onerror = fail;
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

export function PublishDialog({ open, onOpenChange, draft, slides, onChange, onSelect, onExport }: PublishDialogProps) {
  const [state, setState] = useState<State>({ phase: "form" });

  const shown = visibleSlides(slides);
  const figmaCount = shown.filter((slide) => slide.kind === "figma").length;
  const webCount = shown.length - figmaCount;
  const brokenLink = slides.find((slide) => slide.kind === "web" && !isValidUrl(slide.url));
  const missingImage = shown.find((slide) => slide.kind === "figma" && (!slide.image || isImageLoading(slide.image)));
  const slugUse = useSlugUse(open && state.phase === "form" ? draft.slug : "");
  const slugError =
    draft.slug && !SLUG_PATTERN.test(draft.slug)
      ? "Use lowercase letters, numbers and single hyphens."
      : slugUse === "project"
        ? "Another Sandbox project already uses this URL name. Choose another one."
        : slugUse === "reserved"
          ? "This URL name is reserved. Choose another one."
          : null;
  const replacing = !slugError && slugUse === "deck";

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) setState({ phase: "form" });
  };

  const publish = async () => {
    if (!draft.name.trim() || !draft.slug || slugError) {
      setState({ phase: "form", error: "Give the deck a name and a URL name." });
      return;
    }
    const figmaSlides = shown.filter((slide): slide is FigmaSlide => slide.kind === "figma");
    const images: Record<string, string> = {};
    for (const [i, slide] of figmaSlides.entries()) {
      setState({ phase: "publishing", step: `Preparing slide images (${i + 1} of ${figmaSlides.length})…` });
      const data = await toDataUrl(slide.image);
      if (data) images[slide.id] = data;
    }
    setState({ phase: "publishing", step: "Adding the deck to Sandbox…" });
    try {
      const response = await fetch("/__deck-builder/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deck: {
            name: draft.name.trim(),
            slug: draft.slug,
            source: draft.fileKey ? { figmaUrl: draft.figmaUrl, fileKey: draft.fileKey } : null,
            figmaLive: isFigmaLive(draft),
            slides,
          },
          images,
        }),
      });
      const body = (await response.json()) as Published & { error?: string };
      if (!response.ok) {
        setState({ phase: "form", error: body.error ?? "Publishing failed. Try again." });
        return;
      }
      setState({ phase: "done", result: body });
    } catch {
      setState({ phase: "form", error: "Couldn't reach the local Sandbox server. Check that npm run dev is still running." });
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void publish();
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="dialog-md">
        {state.phase === "done" ? (
          <>
            <DialogHeader>
              <DialogTitle className="publish-done-title">
                <CircleCheck size={20} strokeWidth={2} aria-hidden />
                {state.result.replaced ? "Deck updated in your local Sandbox" : "Deck published to your local Sandbox"}
              </DialogTitle>
              <DialogDescription>
                “{draft.name}” is listed on the Sandbox home page on this computer. To put it live at {PUBLIC_HOST}
                {state.result.slug}/, commit <code>prototypes/{state.result.slug}/</code> and <code>projects.json</code>, then push
                the sandbox repo.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => close(false)}>
                Keep editing
              </Button>
              <Button onClick={() => openLink(`${import.meta.env.BASE_URL}${state.result.slug}/`)}>
                <ExternalLink size={16} strokeWidth={2} aria-hidden />
                Open deck
              </Button>
            </DialogFooter>
          </>
        ) : !import.meta.env.DEV ? (
          <>
            <DialogHeader>
              <DialogTitle>Publish from your local Sandbox</DialogTitle>
              <DialogDescription>
                Publishing writes the deck into the sandbox repo, so it only works on your local dev server (npm run dev, then
                localhost:5173/deck-builder/). Download the deck file here, then choose Import deck file in the deck menu there to
                pick up where you left off.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => close(false)}>
                Close
              </Button>
              <Button onClick={onExport}>Download deck file</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={submit} noValidate>
            <DialogHeader>
              <DialogTitle>Publish to Sandbox</DialogTitle>
              <DialogDescription>
                {plural(figmaCount, "Figma slide", "Figma slides")} and {plural(webCount, "live page", "live pages")}
                {slides.length > shown.length ? `, leaving out ${plural(slides.length - shown.length, "hidden slide", "hidden slides")}` : ""}.
                The deck becomes its own Sandbox project.
              </DialogDescription>
            </DialogHeader>

            {brokenLink ? (
              <div className="publish-problem" role="alert">
                <span>A live page has a link that won't load.</span>
                <Button type="button" variant="outline" size="sm" onClick={() => onSelect(brokenLink.id)}>
                  Fix it
                </Button>
              </div>
            ) : missingImage ? (
              <div className="publish-problem" role="alert">
                <span>"{(missingImage as FigmaSlide).name}" has no preview from Figma. Import the Figma slides again from Add slide, or hide it.</span>
                <Button type="button" variant="outline" size="sm" onClick={() => onSelect(missingImage.id)}>
                  Show slide
                </Button>
              </div>
            ) : null}

            <FieldGroup className="dialog-fields">
              <Field>
                <FieldLabel htmlFor="publish-name">Deck name</FieldLabel>
                <Input
                  id="publish-name"
                  value={draft.name}
                  onChange={(event) =>
                    onChange({ name: event.target.value, slug: draft.slugEdited ? draft.slug : slugify(event.target.value) })
                  }
                  autoComplete="off"
                />
              </Field>
              <Field data-invalid={slugError ? true : undefined}>
                <FieldLabel htmlFor="publish-slug">URL name</FieldLabel>
                <div className="slug-input">
                  <span className="slug-prefix">{PUBLIC_HOST}</span>
                  <Input
                    id="publish-slug"
                    value={draft.slug}
                    onChange={(event) => {
                      onChange({ slug: event.target.value.toLowerCase().replace(/\s+/g, "-"), slugEdited: true });
                      setState({ phase: "form" });
                    }}
                    autoComplete="off"
                    spellCheck={false}
                    aria-invalid={slugError ? true : undefined}
                  />
                </div>
                {slugError ? (
                  <FieldError>{slugError}</FieldError>
                ) : replacing ? (
                  <p className="publish-replace" role="status">
                    <TriangleAlert size={16} strokeWidth={2} aria-hidden />
                    A deck already uses this URL name. Publishing replaces it.
                  </p>
                ) : (
                  <FieldDescription>Publishing to the same URL name again updates the deck.</FieldDescription>
                )}
              </Field>
            </FieldGroup>

            {state.phase === "form" && state.error ? (
              <p className="publish-error" role="alert">
                {state.error}
              </p>
            ) : null}

            <DialogFooter>
              {state.phase === "publishing" ? (
                <span className="publish-step" role="status">
                  <LoaderCircle className="deck-spin" size={16} strokeWidth={2} aria-hidden />
                  {state.step}
                </span>
              ) : null}
              <Button type="button" variant="outline" onClick={() => close(false)} disabled={state.phase === "publishing"}>
                Cancel
              </Button>
              <Button type="submit" disabled={state.phase === "publishing" || Boolean(slugError) || Boolean(brokenLink) || Boolean(missingImage)}>
                {replacing ? "Replace deck" : "Publish"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
