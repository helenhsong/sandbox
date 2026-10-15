import { useCallback, useEffect, useRef, useState } from "react";
import { DECK_FILL_EVENT, DECK_HISTORY_EVENT, type LivePageWindow } from "./contract";

/**
 * Hooks every Sandbox prototype uses, so it works in a deck's macOS-style window:
 *
 * - `useHistoryState` for screens and steps, so back and forward step through them.
 * - `useDeckFill` on screens with required input, so the window's fill button can complete
 *   them. Prototypes don't add their own sample or shortcut buttons for this.
 *
 * On its own, a prototype uses the browser's history, so Back and Forward work as usual. Inside
 * a deck's window it keeps its own list instead, because the browser's history is shared with
 * the deck and stepping back would also step the deck.
 */

type Entry = Record<string, unknown>;

const page = window as Window & LivePageWindow;
const embedded = window.parent !== window;
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

if (embedded) {
  page.deckHistory = {
    back: () => move(-1),
    forward: () => move(1),
    canBack: () => index > 0,
    canForward: () => index < entries.length - 1,
  };
} else {
  // Each page load starts from the first screen, so a reload never lands mid-flow without its data.
  window.history.replaceState(null, "");
  window.addEventListener("popstate", restoreAll);
}

const current = (): Entry => (embedded ? entries[index] : ((window.history.state as Entry | null) ?? {}));

function push(entry: Entry) {
  if (!embedded) return window.history.pushState(entry, "");
  entries.splice(index + 1, entries.length, entry);
  index = entries.length - 1;
  window.dispatchEvent(new Event(DECK_HISTORY_EVENT));
}

/**
 * State that is also a step in the screen history: setting it adds a step, and back and forward
 * bring earlier values back. Use it for the current screen and for steps in a flow; keep data
 * (lists, form values) in ordinary state. Changing a top-level screen clears nested steps;
 * pass `nested: true` for a step inside a screen so it keeps the screen it belongs to.
 * Values must be cloneable (no functions).
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
 * Offers the window's fill button for the current screen. `fill` sets realistic values for
 * whatever is still empty or invalid and required to move on (leaving what the user entered),
 * or loads sample data into an empty screen. It doesn't continue to the next step; the
 * presenter does. Pass `null` while the screen has nothing to fill.
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
