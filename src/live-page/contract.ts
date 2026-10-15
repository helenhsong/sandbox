/**
 * What a Sandbox prototype offers the macOS-style window that shows it in a deck. The window
 * reads these from the page's `window`; the page sets them with the hooks in `./index`.
 * This file has no side effects, so the deck can import it.
 */
export interface LivePageWindow {
  /** The page's screen history, for the window's back and forward. */
  deckHistory?: {
    back: () => void;
    forward: () => void;
    canBack: () => boolean;
    canForward: () => boolean;
  };
  /** Fills in what the current screen needs to move on, for the window's fill button. */
  deckFill?: () => void;
}

/** Fired on the page's window when its screen history moves. */
export const DECK_HISTORY_EVENT = "deckhistory";
/** Fired on the page's window when it starts or stops offering `deckFill`. */
export const DECK_FILL_EVENT = "deckfill";
