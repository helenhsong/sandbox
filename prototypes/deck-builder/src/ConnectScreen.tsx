import { useRef, useState, type FormEvent } from "react";
import { Button, buttonVariants, Field, FieldDescription, FieldError, FieldGroup, FieldLabel, Input } from "@helenhsong/ui";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import type { Deck, Slide } from "../../../src/deck/types";
import { IMAGE_PREFIX, putImages } from "./imageStore";
import { FigmaError, loadFigmaSlides, parseFigmaUrl } from "./figma";
import { slugify, type Draft } from "./draft";

interface ConnectScreenProps {
  token: string;
  setToken: (token: string) => void;
  onReady: (draft: Draft) => void;
}

export function ConnectScreen({ token, setToken, onReady }: ConnectScreenProps) {
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("Loading slides…");
  const fileInput = useRef<HTMLInputElement>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const fileKey = parseFigmaUrl(url);
    if (!fileKey) {
      setUrlError("Paste the link to a Figma Slides deck, like figma.com/slides/… or figma.com/deck/…");
      return;
    }
    setUrlError(null);
    if (!token.trim()) {
      setError("Enter a Figma personal access token so the deck can be read.");
      return;
    }
    setLoading(true);
    try {
      const { name, slides } = await loadFigmaSlides(fileKey, token.trim(), setProgress);
      onReady({ figmaUrl: url.trim(), fileKey, name, slug: slugify(name), slugEdited: false, slides });
    } catch (caught) {
      setError(caught instanceof FigmaError ? caught.message : "Something went wrong loading the file. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const importDeck = async (file: File) => {
    try {
      const deck = JSON.parse(await file.text()) as Deck;
      if (deck.version !== 1 || !Array.isArray(deck.slides) || deck.slides.length === 0) throw new Error();
      // Exported decks carry their slide images inline; move them into the image store.
      const stamp = Date.now().toString(36);
      const entries: Array<[string, Blob]> = [];
      const slides: Slide[] = [];
      for (const [i, slide] of deck.slides.entries()) {
        if (slide.kind === "figma" && slide.image.startsWith("data:")) {
          const key = `import/${stamp}/${i}`;
          entries.push([key, await (await fetch(slide.image)).blob()]);
          slides.push({ ...slide, image: `${IMAGE_PREFIX}${key}` });
        } else slides.push(slide);
      }
      await putImages(entries);
      onReady({
        figmaUrl: deck.source?.figmaUrl ?? "",
        fileKey: deck.source?.fileKey ?? "",
        name: deck.name,
        slug: deck.slug,
        slugEdited: true,
        slides,
      });
    } catch {
      setError("That isn't a deck file. Choose a .deck.json file exported from this tool.");
    }
  };

  return (
    <main className="connect">
      <a
        className={buttonVariants({ variant: "ghost", size: "icon", className: "builder-back" })}
        href={import.meta.env.BASE_URL}
        aria-label="Back to Sandbox"
        title="Back to Sandbox"
      >
        <ArrowLeft size={18} strokeWidth={2} />
      </a>
      <div className="connect-intro">
        <h1>Create a deck</h1>
        <p>
          Load your Figma Slides, add live pages between them that people can click through while you present, then
          publish the deck to Sandbox.
        </p>
      </div>

      <form className="connect-form" onSubmit={submit} noValidate>
        <FieldGroup>
          <Field data-invalid={urlError ? true : undefined}>
            <FieldLabel htmlFor="figma-url">Figma Slides link</FieldLabel>
            <Input
              id="figma-url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://www.figma.com/slides/…"
              autoComplete="off"
              aria-invalid={urlError ? true : undefined}
              autoFocus
            />
            {urlError ? <FieldError>{urlError}</FieldError> : null}
          </Field>
          <Field>
            <FieldLabel htmlFor="figma-token">Personal access token</FieldLabel>
            <Input
              id="figma-token"
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="figd_…"
              autoComplete="off"
            />
            <FieldDescription>
              In Figma, open Settings → Security → Personal access tokens and create one that can read file content.
              It's kept in this browser and only sent to Figma.
            </FieldDescription>
          </Field>
        </FieldGroup>

        {error ? (
          <p className="connect-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="connect-actions">
          <Button type="button" variant="outline" onClick={() => fileInput.current?.click()}>
            Import a deck file
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importDeck(file);
              event.target.value = "";
            }}
          />
          <Button type="submit" disabled={loading}>
            {loading ? <LoaderCircle className="deck-spin" size={16} strokeWidth={2} aria-hidden /> : null}
            {loading ? progress : "Load slides"}
          </Button>
        </div>
      </form>
    </main>
  );
}
