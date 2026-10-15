import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@helenhsong/ui";

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
