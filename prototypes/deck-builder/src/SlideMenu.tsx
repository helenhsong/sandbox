import type { ComponentProps } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@helenhsong/ui";
import { ArrowDown, ArrowUp, ClipboardPaste, Copy, CopyPlus, ExternalLink, Eye, EyeOff, Trash2 } from "lucide-react";
import { openLink } from "./draft";
import { resolveUrl, type FigmaSlide, type Slide, type WebSlide } from "../../../src/deck/types";

/** What can be done to a slide, by id; shared by the slide list and the preview. */
export interface SlideActions {
  count: number;
  indexOf: (id: string) => number;
  move: (id: string, delta: number) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  copy: (id: string) => void;
  /** Pastes the copied live page after this slide; absent when nothing is copied. */
  paste?: (id: string) => void;
  toggleHidden: (id: string) => void;
  figmaLink: (slide: FigmaSlide) => string | null;
}

export const MOD = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl+";

type SlideMenuProps = ComponentProps<typeof ContextMenuTrigger> & {
  slide: Slide;
  actions: SlideActions;
  /** Runs on right-click, before the menu opens (to select the slide). */
  onOpen?: () => void;
};

/** Wraps a slide (thumbnail or preview) so right-clicking it opens the slide's actions. */
export function SlideMenu({ slide, actions, onOpen, children, ...props }: SlideMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger onContextMenu={onOpen} {...props}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="deck-menu">
        {slide.kind === "web" ? <WebItems slide={slide} actions={actions} /> : <FigmaItems slide={slide} actions={actions} />}
      </ContextMenuContent>
    </ContextMenu>
  );
}

function WebItems({ slide, actions }: { slide: WebSlide; actions: SlideActions }) {
  const { id } = slide;
  const index = actions.indexOf(id);
  return (
    <>
      <ContextMenuItem onClick={() => openLink(resolveUrl(slide.url))}>
        <ExternalLink size={16} strokeWidth={2} aria-hidden />
        Open source page
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => actions.duplicate(id)}>
        <CopyPlus size={16} strokeWidth={2} aria-hidden />
        Duplicate
        <ContextMenuShortcut>{MOD}D</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem onClick={() => actions.copy(id)}>
        <Copy size={16} strokeWidth={2} aria-hidden />
        Copy
        <ContextMenuShortcut>{MOD}C</ContextMenuShortcut>
      </ContextMenuItem>
      <PasteItem id={id} actions={actions} />
      <ContextMenuSeparator />
      <ContextMenuItem disabled={index <= 0} onClick={() => actions.move(id, -1)}>
        <ArrowUp size={16} strokeWidth={2} aria-hidden />
        Move up
      </ContextMenuItem>
      <ContextMenuItem disabled={index >= actions.count - 1} onClick={() => actions.move(id, 1)}>
        <ArrowDown size={16} strokeWidth={2} aria-hidden />
        Move down
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem variant="destructive" onClick={() => actions.remove(id)}>
        <Trash2 size={16} strokeWidth={2} aria-hidden />
        Delete
        <ContextMenuShortcut>⌫</ContextMenuShortcut>
      </ContextMenuItem>
    </>
  );
}

function FigmaItems({ slide, actions }: { slide: FigmaSlide; actions: SlideActions }) {
  const link = actions.figmaLink(slide);
  return (
    <>
      {link ? (
        <ContextMenuItem onClick={() => openLink(link)}>
          <ExternalLink size={16} strokeWidth={2} aria-hidden />
          Open in Figma
        </ContextMenuItem>
      ) : null}
      <ContextMenuItem onClick={() => actions.toggleHidden(slide.id)}>
        {slide.hidden ? <Eye size={16} strokeWidth={2} aria-hidden /> : <EyeOff size={16} strokeWidth={2} aria-hidden />}
        {slide.hidden ? "Show in deck" : "Hide from deck"}
        {slide.hidden ? null : <ContextMenuShortcut>⌫</ContextMenuShortcut>}
      </ContextMenuItem>
      {actions.paste ? (
        <>
          <ContextMenuSeparator />
          <PasteItem id={slide.id} actions={actions} />
        </>
      ) : null}
    </>
  );
}

function PasteItem({ id, actions }: { id: string; actions: SlideActions }) {
  return (
    <ContextMenuItem disabled={!actions.paste} onClick={() => actions.paste?.(id)}>
      <ClipboardPaste size={16} strokeWidth={2} aria-hidden />
      Paste after
      <ContextMenuShortcut>{MOD}V</ContextMenuShortcut>
    </ContextMenuItem>
  );
}
