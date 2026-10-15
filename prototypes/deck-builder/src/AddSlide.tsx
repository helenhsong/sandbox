import { useState, type FormEvent } from "react";
import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  NativeSelect,
  NativeSelectOption,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@helenhsong/ui";
import { LoaderCircle, Plus } from "lucide-react";
import type { FigmaSlide, Slide } from "../../../src/deck/types";
import { FigmaError, loadFigmaSlides, parseFigmaUrl } from "./figma";
import { LinkFields } from "./LinkFields";
import { isValidUrl, resolveLink } from "./draft";
import { useCloseOnFrameClick } from "./useCloseOnFrameClick";

export type Placement = "start" | "before" | "after" | "end";
export type AddKind = "live" | "figma";

export interface AddPreset {
  kind: AddKind;
  placement: Placement;
  /** The slide "before" and "after" are relative to. */
  slideId?: string;
}

export interface FigmaImport {
  figmaUrl: string;
  fileKey: string;
  name: string;
  slides: FigmaSlide[];
}

interface AddSlideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where the form starts; set by the button, or by the "Add live page" points in the slide list. */
  preset: AddPreset;
  slides: Slide[];
  selectedId: string | null;
  /** The deck's Figma file, if it has one. */
  figmaUrl: string;
  token: string;
  setToken: (token: string) => void;
  onAddLive: (at: number, url: string, title: string) => void;
  onImportFigma: (result: FigmaImport) => void;
}

/** "Add slide" at the top of the slide list: a live web page, or slides imported from Figma. */
export function AddSlide({ open, onOpenChange, preset, ...props }: AddSlideProps) {
  useCloseOnFrameClick(open, () => onOpenChange(false));
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger render={<Button variant="outline" className="add-trigger" />}>
        <Plus size={16} strokeWidth={2} aria-hidden />
        Add slide
      </PopoverTrigger>
      <PopoverContent
        className="add-popover"
        align="start"
        sideOffset={8}
        // Opened with a click, nothing is focused until you pick a field; from the keyboard, the first field is.
        initialFocus={(openType) => openType === "keyboard"}
      >
        {open ? (
          // Keyed by the preset so each opening starts from where it was asked for.
          <AddForms
            key={`${preset.kind}-${preset.placement}-${preset.slideId ?? ""}`}
            preset={preset}
            onClose={() => onOpenChange(false)}
            {...props}
          />
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

type AddFormsProps = Omit<AddSlideProps, "open" | "onOpenChange"> & { onClose: () => void };

function AddForms({ preset, ...props }: AddFormsProps) {
  const [kind, setKind] = useState<AddKind>(preset.kind);
  return (
    <>
      <Tabs value={kind} onValueChange={(value) => setKind(value as AddKind)} className="add-tabs">
        <TabsList className="add-tabs-list">
          <TabsTrigger value="live">Live page</TabsTrigger>
          <TabsTrigger value="figma">Figma slides</TabsTrigger>
        </TabsList>
      </Tabs>
      {kind === "live" ? <LiveForm preset={preset} {...props} /> : <FigmaForm preset={preset} {...props} />}
    </>
  );
}

function LiveForm({ preset, slides, selectedId, onClose, onAddLive }: AddFormsProps) {
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [placement, setPlacement] = useState<Placement>(slides.length ? preset.placement : "end");
  const [slideId, setSlideId] = useState(preset.slideId ?? selectedId ?? slides[0]?.id ?? "");

  // Numbers match the slide list: hidden Figma slides don't get one.
  let shown = 0;
  const numbered = slides.map((slide) => ({
    slide,
    number: slide.kind === "figma" && slide.hidden ? null : ++shown,
  }));
  const needsSlide = placement === "before" || placement === "after";

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const { url, projectName } = resolveLink(link);
    if (!url) return setError("Enter a web address or choose a Sandbox project.");
    if (!isValidUrl(url)) return setError("Enter a full web address, like example.com/page, or choose a Sandbox project.");
    const index = slides.findIndex((slide) => slide.id === slideId);
    const at =
      placement === "start" ? 0 : placement === "end" || index < 0 ? slides.length : placement === "before" ? index : index + 1;
    onAddLive(at, url, projectName ?? "");
  };

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup className="add-fields">
        <LinkFields
          idPrefix="add"
          link={link}
          error={error}
          onLinkChange={(value) => {
            setLink(value);
            setError(null);
          }}
        />
        {/* With no slides yet, the page simply becomes the first one. */}
        {slides.length ? (
          <Field>
            <FieldLabel htmlFor="add-placement">Position</FieldLabel>
            <div className="add-placement">
              <NativeSelect id="add-placement" value={placement} onChange={(event) => setPlacement(event.target.value as Placement)}>
                <NativeSelectOption value="start">At the beginning</NativeSelectOption>
                <NativeSelectOption value="before">Before</NativeSelectOption>
                <NativeSelectOption value="after">After</NativeSelectOption>
                <NativeSelectOption value="end">At the end</NativeSelectOption>
              </NativeSelect>
              {needsSlide ? (
                <NativeSelect value={slideId} onChange={(event) => setSlideId(event.target.value)} aria-label="Slide">
                  {numbered.map(({ slide, number }) => (
                    <NativeSelectOption key={slide.id} value={slide.id}>
                      {slideOptionLabel(number, slide.id === selectedId)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              ) : null}
            </div>
          </Field>
        ) : null}
      </FieldGroup>
      <div className="add-actions">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={!link.trim()}>
          Add live page
        </Button>
      </div>
    </form>
  );
}

function FigmaForm({ figmaUrl, token, setToken, onClose, onImportFigma }: AddFormsProps) {
  const [url, setUrl] = useState(figmaUrl);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("Importing…");
  // The token field shows until one is saved, and again if an import fails (to fix or replace it).
  const [askToken, setAskToken] = useState(!token);
  const fileKey = parseFigmaUrl(url);
  const replacing = Boolean(figmaUrl) && fileKey !== parseFigmaUrl(figmaUrl);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!fileKey) return setUrlError("Paste the link to a Figma Slides deck, like figma.com/slides/… or figma.com/deck/…");
    if (!token.trim()) return setError("Enter a Figma personal access token so the deck can be read.");
    setLoading(true);
    try {
      const { name, slides } = await loadFigmaSlides(fileKey, token.trim(), setProgress);
      onImportFigma({ figmaUrl: url.trim(), fileKey, name, slides });
    } catch (caught) {
      setError(caught instanceof FigmaError ? caught.message : "Something went wrong loading the file. Try again.");
      setAskToken(true);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup className="add-fields">
        <Field data-invalid={urlError ? true : undefined}>
          <FieldLabel htmlFor="add-figma-url">Figma Slides link</FieldLabel>
          <Input
            id="add-figma-url"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              setUrlError(null);
            }}
            placeholder="https://www.figma.com/slides/…"
            autoComplete="off"
            aria-invalid={urlError ? true : undefined}
          />
          {urlError ? (
            <FieldError>{urlError}</FieldError>
          ) : replacing ? (
            <FieldDescription>This replaces the deck's Figma slides. Live pages stay.</FieldDescription>
          ) : figmaUrl ? (
            <FieldDescription>Gets the latest slides. Live pages keep their places.</FieldDescription>
          ) : null}
        </Field>
        {askToken ? (
          <Field>
            <FieldLabel htmlFor="add-figma-token">Personal access token</FieldLabel>
            <Input
              id="add-figma-token"
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="figd_…"
              autoComplete="off"
            />
            <FieldDescription>
              In Figma, open Settings → Security → Personal access tokens. It's kept in this browser and only sent to Figma.
            </FieldDescription>
          </Field>
        ) : null}
      </FieldGroup>
      {error ? (
        <p className="add-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="add-actions">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !url.trim()}>
          {loading ? <LoaderCircle className="deck-spin" size={16} strokeWidth={2} aria-hidden /> : null}
          {loading ? progress : "Import slides"}
        </Button>
      </div>
    </form>
  );
}

/** "Slide 3", with "(selected)" on the slide that's open. */
function slideOptionLabel(number: number | null, current: boolean) {
  const name = number === null ? "Hidden slide" : `Slide ${number}`;
  return current ? `${name} (selected)` : name;
}
