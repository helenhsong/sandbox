import type { MouseEvent } from "react";

/*
 * A deck can be shown in two tabs at once: the audience view (the presentation itself) and the
 * presenter view (the slides, the current one large, and its notes). They keep to the same slide
 * by talking over a BroadcastChannel, which reaches every tab of this site in the same browser.
 * Each deck page (the editor, or a published deck) has its own channel and tab names, so two
 * decks presented at once don't steer each other.
 */

export type PresentView = "audience" | "presenter";

export type PresentMessage =
  /** A view moved to this slide (0-based, among the slides shown). */
  | { type: "slide"; index: number; from: PresentView }
  /** The presenter view opened, or wants to know whether an audience view is open. */
  | { type: "hello" }
  /** An audience view saying it's open, with the slide it's on. */
  | { type: "here"; index: number }
  /** The presenter ended the presentation: audience views it opened close too. */
  | { type: "end" };

const deckPath = () => window.location.pathname;

export function openPresentChannel(onMessage: (message: PresentMessage) => void) {
  if (typeof BroadcastChannel === "undefined") return null;
  const channel = new BroadcastChannel(`deck-present:${deckPath()}`);
  channel.onmessage = (event: MessageEvent<PresentMessage>) => onMessage(event.data);
  return channel;
}

/** This page's address for a view, starting on a slide: ?present=3 (audience) or ?presenter=3. */
export function viewUrl(view: PresentView, at: number) {
  const url = new URL(window.location.href);
  url.searchParams.delete("present");
  url.searchParams.delete("presenter");
  url.searchParams.set(view === "audience" ? "present" : "presenter", String(at + 1));
  url.hash = "";
  return url.href;
}

/** The name of a view's tab, so opening it again finds the tab already open. */
export const viewTabName = (view: PresentView) => `deck-${view}:${deckPath()}`;

/**
 * Brings up a view's tab: the one already open if there is one (without reloading it), or a new
 * one on the slide given. Used as the click handler of a link to the view (href from viewUrl,
 * target from viewTabName, rel="opener"); when the browser won't open tabs from script, the link
 * opens it instead. Returns whether the tab was brought up here.
 */
export function openView(view: PresentView, at: number, event?: MouseEvent) {
  let tab: Window | null;
  try {
    tab = window.open("", viewTabName(view));
  } catch {
    tab = null;
  }
  if (!tab) return false;
  event?.preventDefault();
  try {
    // Opened just now (still blank): load the view. Already open: leave it where it is.
    if (tab.location.href === "about:blank") tab.location.replace(viewUrl(view, at));
  } catch {
    tab.location.replace(viewUrl(view, at));
  }
  tab.focus();
  return true;
}

/** The slide (0-based) in the address's ?presenter= parameter, or null when this isn't the presenter view. */
export function readPresenterParam() {
  const value = Number.parseInt(new URLSearchParams(window.location.search).get("presenter") ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value - 1 : null;
}

/**
 * Closes this tab when another view opened it. Browsers only let a page close a tab opened by
 * script or by a link from another page; otherwise `otherwise` runs.
 */
export function closeTab(otherwise: () => void) {
  if (!window.opener) return otherwise();
  window.close();
  window.setTimeout(() => {
    if (!window.closed) otherwise();
  }, 150);
}
