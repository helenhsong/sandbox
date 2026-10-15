import { useState, type FormEvent } from "react";
import {
  Button,
  Field,
  FieldGroup,
  FieldLabel,
  NativeSelect,
  NativeSelectOption,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@helenhsong/ui";
import { Plus } from "lucide-react";
import type { Slide } from "../../../src/deck/types";
import { LinkFields } from "./LinkFields";
import { isValidUrl, resolveLink } from "./draft";
import { useCloseOnFrameClick } from "./useCloseOnFrameClick";

export type Placement = "start" | "before" | "after" | "end";

export interface AddPreset {
  placement: Placement;
  /** The slide "before" and "after" are relative to. */
  slideId?: string;
}

interface AddLivePageProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where the form starts; set by the "Add live page" points in the slide list. */
  preset: AddPreset;
  slides: Slide[];
  selectedId: string;
  onAdd: (at: number, url: string, title: string) => void;
}

/** "Add live page" in the header: a dropdown with the link and where the page goes. */
export function AddLivePage({ open, onOpenChange, preset, slides, selectedId, onAdd }: AddLivePageProps) {
  useCloseOnFrameClick(open, () => onOpenChange(false));
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger render={<Button variant="outline" className="add-trigger" />}>
        <Plus size={16} strokeWidth={2} aria-hidden />
        Add live page
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
          <AddForm
            key={`${preset.placement}-${preset.slideId ?? ""}`}
            preset={preset}
            slides={slides}
            selectedId={selectedId}
            onCancel={() => onOpenChange(false)}
            onAdd={onAdd}
          />
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

interface AddFormProps {
  preset: AddPreset;
  slides: Slide[];
  selectedId: string;
  onCancel: () => void;
  onAdd: (at: number, url: string, title: string) => void;
}

function AddForm({ preset, slides, selectedId, onCancel, onAdd }: AddFormProps) {
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [placement, setPlacement] = useState<Placement>(preset.placement);
  const [slideId, setSlideId] = useState(preset.slideId ?? selectedId);

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
    onAdd(at, url, projectName ?? "");
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
      </FieldGroup>
      <div className="add-actions">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!link.trim()}>
          Add live page
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
