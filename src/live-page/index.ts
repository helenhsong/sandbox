import { useCallback, useEffect, useRef, useState } from "react";
import { DECK_FILL_EVENT, DECK_HISTORY_EVENT, type LivePageWindow } from "./contract";

/**
 * Hooks every Sandbox prototype uses, so it works with the macOS-style window it runs in:
 *
 * - `useHistoryState` for screens and steps, so back and forward step through them.
 * - `useDeckFill` on every screen a presenter would need to get through, so the window's cursor
 *   button can move the demo along the happy path. Prototypes don't add their own sample,
 *   shortcut or "prototype only" controls for this.
 *
 * A prototype always runs inside a macOS-style window (see `mountPrototype`), so its history is
 * one list kept here and offered to the window as `window.deckHistory`. The browser's history
 * isn't used: it's shared with the page around the window.
 */

type Entry = Record<string, unknown>;

const page = window as Window & LivePageWindow;
const entries: Entry[] = [{}];
let index = 0;
const listeners = new Set<() => void>();

const restoreAll = () => listeners.forEach((listener) => listener());
const move = (by: number) => {
  const next = index + by;
  if (next < 0 || next >= entries.length) return;
  index = next;
  restoreAll();
  window.dispatchEvent(new Event(DECK_HISTORY_EVENT));
};

page.deckHistory = {
  back: () => move(-1),
  forward: () => move(1),
  canBack: () => index > 0,
  canForward: () => index < entries.length - 1,
};

const current = (): Entry => entries[index];

function push(entry: Entry) {
  entries.splice(index + 1, entries.length, entry);
  index = entries.length - 1;
  window.dispatchEvent(new Event(DECK_HISTORY_EVENT));
}

/**
 * State that is also a step in the screen history: setting it adds a step, and back and forward
 * bring earlier values back. Use it for the current screen and for steps in a flow; keep data
 * (lists, form values) in ordinary state. Changing a top-level screen clears nested steps;
 * pass `nested: true` for a step inside a screen so it keeps the screen it belongs to.
 */
export function useHistoryState<T>(key: string, initial: T, { nested = false } = {}) {
  const [value, setValue] = useState<T>(() => (current()[key] as T | undefined) ?? initial);
  const initialRef = useRef(initial);
  useEffect(() => {
    initialRef.current = initial;
  });
  useEffect(() => {
    const restore = () => setValue((current()[key] as T | undefined) ?? initialRef.current);
    listeners.add(restore);
    return () => {
      listeners.delete(restore);
    };
  }, [key]);
  const set = useCallback(
    (next: T) => {
      setValue(next);
      push(nested ? { ...current(), [key]: next } : { [key]: next });
    },
    [key, nested],
  );
  return [value, set] as const;
}

// The fill handlers currently offered, newest last; the window's button runs the newest.
const fills: { current: () => void }[] = [];

function announceFill() {
  const latest = fills.at(-1);
  if (latest) page.deckFill = () => latest.current();
  else delete page.deckFill;
  window.dispatchEvent(new Event(DECK_FILL_EVENT));
}

/**
 * Offers the window's cursor button for the current screen, always taking the happy path.
 * `fill` sets realistic values for whatever is still empty or invalid and required to move on
 * (leaving what the user entered), loads sample data into an empty screen, or finishes a
 * simulated wait with its successful outcome (approving a review, say). Filling doesn't
 * continue to the next step; the presenter presses the screen's own action. Pass `null` while
 * the screen has nothing to do, including once everything the fill would set is in place: the
 * window hides its button whenever no fill is offered.
 */
export function useDeckFill(fill: (() => void) | null) {
  const handler = useRef<() => void>(() => {});
  useEffect(() => {
    if (fill) handler.current = fill;
  });
  const offered = fill !== null;
  useEffect(() => {
    if (!offered) return;
    const entry = { current: () => handler.current() };
    fills.push(entry);
    announceFill();
    return () => {
      fills.splice(fills.indexOf(entry), 1);
      announceFill();
    };
  }, [offered]);
}
