import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@helenhsong/ui";
import { X } from "lucide-react";
import { plural } from "./draft";

/** Figma's logo, in its own colors. */
export function FigmaLogo() {
  return (
    <svg className="figma-logo" viewBox="0 0 38 57" width="11" height="16" aria-hidden>
      <path fill="#1abcfe" d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" />
      <path fill="#0acf83" d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" />
      <path fill="#ff7262" d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" />
      <path fill="#f24e1e" d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" />
      <path fill="#a259ff" d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" />
    </svg>
  );
}

interface FigmaSourceProps {
  name: string;
  /** Opens Add slide on its Figma tab, to swap in a different file. */
  onReplace: () => void;
  onRemove: () => void;
}

/**
 * The Figma file the deck's slides come from, just under Add slide: its name lets you
 * replace the file with another, and × removes its slides from the deck.
 */
export function FigmaSource({ name, onReplace, onRemove }: FigmaSourceProps) {
  return (
    <div className="figma-source">
      <button type="button" className="figma-source-open" onClick={onReplace} title="Replace Figma file">
        <FigmaLogo />
        <span className="figma-source-name">{name || "Figma file"}</span>
      </button>
      <button type="button" className="figma-source-remove" onClick={onRemove} aria-label="Remove Figma slides" title="Remove Figma slides">
        <X size={16} strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}

interface RemoveFigmaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  count: number;
  onConfirm: () => void;
}

export function RemoveFigmaDialog({ open, onOpenChange, name, count, onConfirm }: RemoveFigmaDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dialog-md">
        <DialogHeader>
          <DialogTitle>Remove Figma slides?</DialogTitle>
          <DialogDescription>
            This removes the {plural(count, "slide", "slides")} from “{name || "the Figma file"}”. Live pages stay. You can import the
            file again from Add slide.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Remove slides
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
