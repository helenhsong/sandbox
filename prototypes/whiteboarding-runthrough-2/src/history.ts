import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Screen history. On its own, the prototype uses the browser's history, so Back and Forward
 * work as usual. Inside a deck's window it keeps its own list instead (the browser's would
 * also step the deck), and offers it to the window as `window.deckHistory`.
 */
type Entry = Record<string, unknown>;
type DeckHistory = { back: () => void; forward: () => void; canBack: () => boolean; canForward: () => boolean };

const embedded = window.parent !== window;
const entries: Entry[] = [{}];
let index = 0;
const listeners = new Set<() => void>();

const announce = () => {
  listeners.forEach((listener) => listener());
  window.dispatchEvent(new Event("deckhistory"));
};
const move = (by: number) => {
  const next = index + by;
  if (next < 0 || next >= entries.length) return;
  index = next;
  announce();
};

if (embedded) {
  (window as Window & { deckHistory?: DeckHistory }).deckHistory = {
    back: () => move(-1),
    forward: () => move(1),
    canBack: () => index > 0,
    canForward: () => index < entries.length - 1,
  };
} else {
  // Each page load starts from the first screen, so a reload never lands mid-flow without its data.
  window.history.replaceState(null, "");
  window.addEventListener("popstate", () => listeners.forEach((listener) => listener()));
}

const current = (): Entry => (embedded ? entries[index] : (window.history.state as Entry | null) ?? {});

function push(entry: Entry) {
  if (!embedded) return window.history.pushState(entry, "");
  entries.splice(index + 1, entries.length, entry);
  index = entries.length - 1;
  announce();
}

/**
 * State that is also a step in the screen history: setting it adds a step, and Back and
 * Forward bring earlier values back. Changing a top-level screen clears the nested steps;
 * a nested step keeps the screen it belongs to.
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
