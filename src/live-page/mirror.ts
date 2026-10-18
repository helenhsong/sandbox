/*
 * Mirroring a live page between two windows showing the same page: the presenter view and the
 * audience view of a deck, in separate tabs. What a person does in one (moving the mouse,
 * clicking, typing, scrolling, the window's back, forward, reload and fast-forward) is sent over a
 * BroadcastChannel and replayed in the other, so both stay on the same screen. Only real input is
 * sent (events the browser marks trusted), so replayed events never echo back.
 *
 * Both pages run the same code at the same size (a deck draws every live page in a window of
 * the same fixed size), so a click is replayed at the same point, and fields and scrolling
 * areas are found by their position in the page.
 */

export interface MirrorOptions {
  /** Which page this is (the slide's id); only windows with the same id mirror each other. */
  id: string;
  /** Show where the other window's mouse is, as a cursor over this page (for the audience). */
  showCursor?: boolean;
}

export type WindowAction = "back" | "forward" | "restart" | "fill";

export type MirrorOp =
  | { k: "move"; x: number; y: number }
  | { k: "leave" }
  | { k: "pointer"; type: string; x: number; y: number; button: number; buttons: number; detail: number }
  | { k: "key"; type: string; key: string; code: string; alt: boolean; ctrl: boolean; meta: boolean; shift: boolean; path: number[] | null }
  | { k: "input"; type: string; path: number[]; value: string }
  | { k: "scroll"; path: number[] | null; top: number; left: number }
  | { k: "window"; action: WindowAction }
  /** A window just loaded its page fresh: the others start over too, so all begin the same. */
  | { k: "fresh" };

interface MirrorMessage {
  id: string;
  from: string;
  op: MirrorOp;
}

const POINTER_TYPES = ["pointerdown", "mousedown", "pointerup", "mouseup", "click", "dblclick", "contextmenu"];
const KEY_TYPES = ["keydown", "keyup"];

/** The channel for this page's decks (the editor or one published deck). */
export function openMirrorChannel(onMessage: (message: MirrorMessage) => void) {
  if (typeof BroadcastChannel === "undefined") return null;
  const channel = new BroadcastChannel(`deck-live:${window.location.pathname}`);
  channel.onmessage = (event: MessageEvent<MirrorMessage>) => onMessage(event.data);
  return channel;
}

export type { MirrorMessage };

/** Where an element sits in its document, as child positions from the root. */
function pathOf(node: Element | null): number[] | null {
  if (!node) return null;
  const path: number[] = [];
  let current: Element | null = node;
  while (current && current.parentElement) {
    path.unshift(Array.prototype.indexOf.call(current.parentElement.children, current));
    current = current.parentElement;
  }
  return path;
}

function elementAt(doc: Document, path: number[] | null): Element | null {
  if (!path) return null;
  let current: Element | null = doc.documentElement;
  for (const index of path) {
    current = current?.children[index] ?? null;
    if (!current) return null;
  }
  return current;
}

/**
 * Sends what a person does in a page's document. Returns a function that stops listening. Set
 * up again each time the page loads, since a new document replaces the old one.
 */
export function captureInput(doc: Document, send: (op: MirrorOp) => void) {
  const win = doc.defaultView;
  if (!win) return () => undefined;
  let frame = 0;
  let lastMove: { x: number; y: number } | null = null;

  const onMove = (event: PointerEvent) => {
    if (!event.isTrusted) return;
    lastMove = { x: event.clientX, y: event.clientY };
    if (frame) return;
    frame = win.requestAnimationFrame(() => {
      frame = 0;
      if (lastMove) send({ k: "move", ...lastMove });
    });
  };
  const onLeave = (event: PointerEvent) => {
    if (event.isTrusted && !event.relatedTarget) send({ k: "leave" });
  };
  const onPointer = (event: MouseEvent) => {
    if (!event.isTrusted) return;
    send({ k: "pointer", type: event.type, x: event.clientX, y: event.clientY, button: event.button, buttons: event.buttons, detail: event.detail });
  };
  const onKey = (event: KeyboardEvent) => {
    if (!event.isTrusted) return;
    send({
      k: "key",
      type: event.type,
      key: event.key,
      code: event.code,
      alt: event.altKey,
      ctrl: event.ctrlKey,
      meta: event.metaKey,
      shift: event.shiftKey,
      path: pathOf(event.target as Element | null),
    });
  };
  const onInput = (event: Event) => {
    if (!event.isTrusted) return;
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    // Checkboxes and radios change with the replayed click.
    if (!("value" in target) || (target instanceof win.HTMLInputElement && (target.type === "checkbox" || target.type === "radio"))) return;
    const path = pathOf(target);
    if (path) send({ k: "input", type: event.type, path, value: target.value });
  };
  const scrollQueue = new Map<EventTarget, number>();
  const onScroll = (event: Event) => {
    if (!event.isTrusted || ignoringScroll.has(event.target as object)) return;
    const target = event.target;
    if (scrollQueue.has(target as EventTarget)) return;
    scrollQueue.set(
      target as EventTarget,
      win.requestAnimationFrame(() => {
        scrollQueue.delete(target as EventTarget);
        if (target === doc) {
          const root = doc.scrollingElement ?? doc.documentElement;
          send({ k: "scroll", path: null, top: root.scrollTop, left: root.scrollLeft });
        } else if (target instanceof win.Element) {
          send({ k: "scroll", path: pathOf(target), top: target.scrollTop, left: target.scrollLeft });
        }
      }),
    );
  };

  doc.addEventListener("pointermove", onMove, true);
  doc.documentElement.addEventListener("pointerout", onLeave, true);
  for (const type of POINTER_TYPES) doc.addEventListener(type, onPointer as EventListener, true);
  for (const type of KEY_TYPES) doc.addEventListener(type, onKey as EventListener, true);
  doc.addEventListener("input", onInput, true);
  doc.addEventListener("change", onInput, true);
  doc.addEventListener("scroll", onScroll, true);
  return () => {
    doc.removeEventListener("pointermove", onMove, true);
    doc.documentElement.removeEventListener("pointerout", onLeave, true);
    for (const type of POINTER_TYPES) doc.removeEventListener(type, onPointer as EventListener, true);
    for (const type of KEY_TYPES) doc.removeEventListener(type, onKey as EventListener, true);
    doc.removeEventListener("input", onInput, true);
    doc.removeEventListener("change", onInput, true);
    doc.removeEventListener("scroll", onScroll, true);
    if (frame) win.cancelAnimationFrame(frame);
  };
}

/** Elements just scrolled by a replay, whose own scroll events shouldn't be sent back. */
const ignoringScroll = new WeakSet<object>();

/** The element under the replayed mouse, so hover effects follow it. */
const hovered = new WeakMap<Document, Element | null>();

/** Plays back something done in the other window, in this page's document. */
export function replayInput(doc: Document, op: MirrorOp) {
  const win = doc.defaultView as (Window & typeof globalThis) | null;
  if (!win) return;
  const at = (x: number, y: number) => doc.elementFromPoint(x, y) ?? doc.body;
  const mouse = (x: number, y: number, extra: MouseEventInit = {}): PointerEventInit => ({
    bubbles: true,
    cancelable: true,
    composed: true,
    view: win,
    clientX: x,
    clientY: y,
    pointerId: 1,
    pointerType: "mouse",
    isPrimary: true,
    ...extra,
  });
  const fire = (target: Element, type: string, init: PointerEventInit) => {
    const event = type.startsWith("pointer") ? new win.PointerEvent(type, init) : new win.MouseEvent(type, init);
    return target.dispatchEvent(event);
  };

  if (op.k === "move") {
    const target = at(op.x, op.y);
    const before = hovered.get(doc) ?? null;
    if (before !== target) {
      if (before?.isConnected) {
        fire(before, "pointerout", mouse(op.x, op.y, { relatedTarget: target }));
        fire(before, "mouseout", mouse(op.x, op.y, { relatedTarget: target }));
      }
      fire(target, "pointerover", mouse(op.x, op.y, { relatedTarget: before }));
      fire(target, "mouseover", mouse(op.x, op.y, { relatedTarget: before }));
      hovered.set(doc, target);
    }
    fire(target, "pointermove", mouse(op.x, op.y));
    fire(target, "mousemove", mouse(op.x, op.y));
  } else if (op.k === "leave") {
    const before = hovered.get(doc);
    if (before?.isConnected) {
      fire(before, "pointerout", mouse(-1, -1));
      fire(before, "mouseout", mouse(-1, -1));
    }
    hovered.set(doc, null);
  } else if (op.k === "pointer") {
    const target = at(op.x, op.y);
    if (op.type === "pointerdown" || op.type === "mousedown") {
      const focusable = target.closest<HTMLElement>("input, textarea, select, button, a[href], [tabindex], [contenteditable]");
      if (op.type === "mousedown") focusable?.focus({ preventScroll: true });
    }
    fire(target, op.type, mouse(op.x, op.y, { button: op.button, buttons: op.buttons, detail: op.detail }));
  } else if (op.k === "key") {
    const target = elementAt(doc, op.path) ?? doc.activeElement ?? doc.body;
    target.dispatchEvent(
      new win.KeyboardEvent(op.type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        key: op.key,
        code: op.code,
        altKey: op.alt,
        ctrlKey: op.ctrl,
        metaKey: op.meta,
        shiftKey: op.shift,
      }),
    );
  } else if (op.k === "input") {
    const target = elementAt(doc, op.path);
    if (!target) return;
    const tag = target.tagName;
    const proto = tag === "TEXTAREA" ? win.HTMLTextAreaElement.prototype : tag === "SELECT" ? win.HTMLSelectElement.prototype : win.HTMLInputElement.prototype;
    if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") return;
    // Through the element's own setter, so React sees the change as typing.
    Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(target, op.value);
    target.dispatchEvent(new win.Event(op.type, { bubbles: true }));
  } else if (op.k === "scroll") {
    const target = op.path ? elementAt(doc, op.path) : (doc.scrollingElement ?? doc.documentElement);
    if (!target) return;
    const source = op.path ? target : doc;
    ignoringScroll.add(source);
    target.scrollTop = op.top;
    target.scrollLeft = op.left;
    win.setTimeout(() => ignoringScroll.delete(source), 120);
  }
}
