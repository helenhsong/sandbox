import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { EyeOff, Globe, GripVertical, Plus } from "lucide-react";
import { isImageLoading, urlLabel, type Slide } from "../../../src/deck/types";
import { SlideMenu, type SlideActions } from "./SlideMenu";
import { moveItem } from "./draft";

interface SlideListProps {
  slides: Slide[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** Opens Add live page set to this index. */
  onInsert: (at: number) => void;
  onChange: (slides: Slide[]) => void;
  /** The right-click menu's actions. */
  actions: SlideActions;
}

/**
 * The deck as a column of thumbnails, like Figma Slides' sidebar. Figma slides keep
 * Figma's order; live pages can be dragged (or moved with Alt+↑/↓) between them.
 */
export function SlideList({ slides, selectedId, onSelect, onInsert, onChange, actions }: SlideListProps) {
  const [dragId, setDragId] = useState<string | null>(null);
  /** Index in `slides` the dragged slide would be inserted before. */
  const [dropAt, setDropAt] = useState<number | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  /** Set right after a drag so the release doesn't also count as a click. */
  const justDragged = useRef(false);

  let shownNumber = 0;
  const numbers = slides.map((slide) => (slide.kind === "figma" && slide.hidden ? null : ++shownNumber));

  /**
   * Index the pointer is pointing between. In the column, that's from the slides' vertical
   * middles; in the two-column grid (small screens), it's in reading order: before a slide when
   * the pointer is above its row, or on its row and left of its middle.
   */
  const dropIndexAt = (clientX: number, clientY: number) => {
    const boxes = [...(listRef.current?.querySelectorAll<HTMLElement>(".playlist-row") ?? [])].map((row) =>
      row.getBoundingClientRect(),
    );
    const grid = boxes.length > 1 && Math.abs(boxes[0].top - boxes[1].top) < 1;
    for (const [i, box] of boxes.entries()) {
      if (!grid && clientY < box.top + box.height / 2) return i;
      if (grid && (clientY < box.top || (clientY <= box.bottom && clientX < box.left + box.width / 2))) return i;
    }
    return boxes.length;
  };

  const startDrag = (event: PointerEvent<HTMLDivElement>, slide: Slide) => {
    if (slide.kind !== "web" || event.button !== 0) return;
    const startY = event.clientY;
    const row = event.currentTarget;
    let dragging = false;
    let target: number | null = null;

    const onMove = (move: globalThis.PointerEvent) => {
      if (!dragging && Math.abs(move.clientY - startY) < 4) return;
      if (!dragging) {
        dragging = true;
        row.setPointerCapture(event.pointerId);
        setDragId(slide.id);
      }
      move.preventDefault();
      target = dropIndexAt(move.clientX, move.clientY);
      setDropAt(target);
      // Keep the dragged slide reachable in a long deck.
      const list = listRef.current?.parentElement;
      if (list) {
        const box = list.getBoundingClientRect();
        if (move.clientY < box.top + 40) list.scrollTop -= 12;
        else if (move.clientY > box.bottom - 40) list.scrollTop += 12;
      }
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (!dragging) return;
      justDragged.current = true;
      setTimeout(() => (justDragged.current = false), 0);
      setDragId(null);
      setDropAt(null);
      if (target === null) return;
      const from = slides.findIndex((item) => item.id === slide.id);
      // Removing the slide first shifts everything after it up by one.
      const to = target > from ? target - 1 : target;
      if (from !== to) onChange(moveItem(slides, from, to));
      onSelect(slide.id);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const onRowKey = (event: KeyboardEvent, index: number) => {
    const slide = slides[index];
    if (event.altKey && slide.kind === "web" && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      event.preventDefault();
      const to = index + (event.key === "ArrowUp" ? -1 : 1);
      if (to >= 0 && to < slides.length) onChange(moveItem(slides, index, to));
      return;
    }
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const next = slides[index + (event.key === "ArrowUp" ? -1 : 1)];
      if (next) {
        onSelect(next.id);
        document.getElementById(`row-${next.id}`)?.focus();
      }
    }
  };

  return (
    <>
      <ol className="playlist" ref={listRef} data-dragging={dragId ? true : undefined}>
        {slides.map((slide, index) => {
          const selected = slide.id === selectedId;
          const movable = slide.kind === "web";
          const hidden = slide.kind === "figma" && slide.hidden;
          return (
            <li key={slide.id} className="playlist-item" data-drop={dropAt === index || undefined}>
              {index > 0 ? <InsertPoint onClick={() => onInsert(index)} /> : null}
              <SlideMenu
                slide={slide}
                actions={actions}
                render={<div />}
                onOpen={() => onSelect(slide.id)}
                id={`row-${slide.id}`}
                className="playlist-row"
                role="button"
                tabIndex={selected ? 0 : -1}
                aria-current={selected || undefined}
                aria-label={
                  slide.kind === "figma"
                    ? `${slide.name}${hidden ? ", hidden from the deck" : ""}`
                    : `Live page: ${slide.title || urlLabel(slide.url)}. Alt plus arrow keys to move`
                }
                data-selected={selected || undefined}
                data-kind={slide.kind}
                data-hidden={hidden || undefined}
                data-dragging={dragId === slide.id || undefined}
                onPointerDown={(event) => startDrag(event, slide)}
                onClick={() => {
                  if (!justDragged.current) onSelect(slide.id);
                }}
                onKeyDown={(event) => onRowKey(event, index)}
              >
                <span className="playlist-gutter" aria-hidden>
                  <span className="playlist-number">{numbers[index] ?? "–"}</span>
                  {movable ? <GripVertical className="playlist-grip" size={16} strokeWidth={2} /> : null}
                </span>
                <span className="playlist-thumb">
                  {slide.kind === "figma" ? (
                    <>
                      {isImageLoading(slide.image) ? null : slide.image ? (
                        <img src={slide.image} alt="" draggable={false} />
                      ) : (
                        <span className="playlist-thumb-missing">No preview</span>
                      )}
                      {hidden ? (
                        <span className="playlist-thumb-hidden" title="Hidden from the deck">
                          <EyeOff size={20} strokeWidth={2} />
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span className="playlist-thumb-web">
                      <span className="live-tag">
                        <Globe size={14} strokeWidth={2} aria-hidden />
                        Live
                      </span>
                      <span className="playlist-web-title">{slide.title || urlLabel(slide.url)}</span>
                    </span>
                  )}
                </span>
              </SlideMenu>
            </li>
          );
        })}
        <li className="playlist-item playlist-end" data-drop={dropAt === slides.length || undefined}>
          <InsertPoint onClick={() => onInsert(slides.length)} label="Add live page at the end" />
        </li>
      </ol>
    </>
  );
}

function InsertPoint({ onClick, label = "Add live page here" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" className="playlist-insert" onClick={onClick} aria-label={label}>
      <span className="playlist-insert-line" aria-hidden />
      <span className="playlist-insert-pill" aria-hidden>
        <Plus size={16} strokeWidth={2} />
        Add live page
      </span>
    </button>
  );
}
