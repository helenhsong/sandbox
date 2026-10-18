/*
 * Presenting with notes uses two tabs: the audience view (the presentation itself) and the
 * presenter view (current and next slide, notes, a timer). They keep to the same slide by
 * talking over a BroadcastChannel, which reaches every tab of this site in the same browser.
 */

const CHANNEL = "deck-builder:present";

export type PresentMessage =
  /** A tab moved to this slide (0-based, among the slides shown). */
  | { type: "slide"; index: number; from: "audience" | "presenter" }
  /** The presenter view opened, or wants to know whether an audience view is open. */
  | { type: "hello" }
  /** An audience view answering "hello", with the slide it's on. */
  | { type: "here"; index: number }
  /** An audience view closed. */
  | { type: "bye" }
  /** The presenter ended the presentation: audience views close too. */
  | { type: "end" };

export function openPresentChannel(onMessage: (message: PresentMessage) => void) {
  if (typeof BroadcastChannel === "undefined") return null;
  const channel = new BroadcastChannel(CHANNEL);
  channel.onmessage = (event: MessageEvent<PresentMessage>) => onMessage(event.data);
  return channel;
}

/** This page's address for presenting from a slide: the audience view, or the presenter view. */
export function presentTabUrl(view: "audience" | "presenter", at: number) {
  const url = new URL(window.location.href);
  url.searchParams.delete("present");
  url.searchParams.delete("presenter");
  url.searchParams.set(view === "audience" ? "present" : "presenter", String(at + 1));
  url.hash = "";
  return url.href;
}

/** The slide (0-based) in the address's ?presenter= parameter, or null when this isn't the presenter view. */
export function readPresenterParam() {
  const value = Number.parseInt(new URLSearchParams(window.location.search).get("presenter") ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value - 1 : null;
}

/**
 * Closes this tab when it was opened for presenting. Browsers only let a page close a tab that
 * was opened by script; otherwise (an address typed or reloaded by hand) `otherwise` runs.
 */
export function closeTab(otherwise: () => void) {
  window.close();
  window.setTimeout(() => {
    if (!window.closed) otherwise();
  }, 150);
}
