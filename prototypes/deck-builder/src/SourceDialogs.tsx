import { useState, type FormEvent } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldGroup,
  FieldLabel,
  Input,
} from "@helenhsong/ui";
import { LoaderCircle } from "lucide-react";
import { FigmaError, loadFigmaSlides } from "./figma";
import { mergeFigmaSlides, type Draft } from "./draft";

interface ReloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: Draft;
  token: string;
  setToken: (token: string) => void;
  onReloaded: (draft: Draft) => void;
}

/** Pulls the latest slides from Figma while keeping every live page where it was placed. */
export function ReloadDialog({ open, onOpenChange, draft, token, setToken, onReloaded }: ReloadDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("Reloading…");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.fileKey) return setError("This deck isn't linked to a Figma file.");
    if (!token.trim()) return setError("Enter your Figma personal access token.");
    setLoading(true);
    setError(null);
    try {
      const { slides } = await loadFigmaSlides(draft.fileKey, token.trim(), setProgress);
      onReloaded({ ...draft, slides: mergeFigmaSlides(draft.slides, slides) });
    } catch (caught) {
      setError(caught instanceof FigmaError ? caught.message : "Something went wrong loading the file. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dialog-md">
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>Reload from Figma</DialogTitle>
            <DialogDescription>
              Gets the latest slides from Figma. Each live page stays after the same Figma slide, even if slides were
              added or reordered; if that slide was deleted, the live page moves to the end.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="dialog-fields">
            <Field>
              <FieldLabel htmlFor="reload-token">Personal access token</FieldLabel>
              <Input id="reload-token" type="password" value={token} onChange={(event) => setToken(event.target.value)} autoComplete="off" />
            </Field>
          </FieldGroup>
          {error ? (
            <p className="publish-error" role="alert">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <LoaderCircle className="deck-spin" size={16} strokeWidth={2} aria-hidden /> : null}
              {loading ? progress : "Reload slides"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface StartOverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function StartOverDialog({ open, onOpenChange, onConfirm }: StartOverDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dialog-md">
        <DialogHeader>
          <DialogTitle>Delete this deck?</DialogTitle>
          <DialogDescription>
            This deletes the deck you're editing, including its live pages, and you can't undo it. Your Figma file and any
            decks you've published to Sandbox aren't affected.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete deck
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
