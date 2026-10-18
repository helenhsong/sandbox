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
 *
 * The two pages can still drift apart (a scroll that lands differently, an image that loads
 * later), so the mouse is also anchored to the element under it, and each move carries the
 * scroll positions around it: the other page snaps back to them, and the mouse lands on the
 * same element even if something else moved.
 */

export interface MirrorOptions {
  /** Which page this is (the slide's id); only windows with the same id mirror each other. */
  id: string;
  /** Show where the other window's mouse is, as a cursor over this page (for the audience). */
  showCursor?: boolean;
}

export type WindowAction = "back" | "forward" | "restart" | "fill";

/** The element under the mouse, and where in it the mouse is. */
interface Anchor {
  path: number[];
  tag: string;
  dx: number;
  dy: number;
}

/** A scroll position: the page's own (path null) or a scrolling element's. */
interface ScrollState {
  path: number[] | null;
  top: number;
  left: number;
}

export type MirrorOp =
  | { k: "move"; x: number; y: number; at?: Anchor; scroll?: ScrollState[] }
  | { k: "leave" }
  | { k: "pointer"; type: string; x: number; y: number; button: number; buttons: number; detail: number; at?: Anchor }
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

/** The element at a point in the page, and the point's offset inside it. */
function anchorAt(doc: Document, x: number, y: number): Anchor | undefined {
  const element = doc.elementFromPoint(x, y);
  const path = pathOf(element);
  if (!element || !path) return undefined;
  const box = element.getBoundingClientRect();
  return { path, tag: element.tagName, dx: x - box.left, dy: y - box.top };
}

/** The page's scroll position and that of every scrolling element around a point. */
function scrollsAround(doc: Document, x: number, y: number): ScrollState[] {
  const win = doc.defaultView;
  const root = doc.scrollingElement ?? doc.documentElement;
  const states: ScrollState[] = [{ path: null, top: root.scrollTop, left: root.scrollLeft }];
  if (!win) return states;
  for (let node = doc.elementFromPoint(x, y); node && node !== root && node !== doc.body; node = node.parentElement) {
    if (node.scrollHeight <= node.clientHeight && node.scrollWidth <= node.clientWidth) continue;
    const style = win.getComputedStyle(node);
    if (!/(auto|scroll|overlay)/.test(style.overflowY + style.overflowX)) continue;
    const path = pathOf(node);
    if (path) states.push({ path, top: node.scrollTop, left: node.scrollLeft });
  }
  return states;
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
      if (lastMove) {
        const { x, y } = lastMove;
        send({ k: "move", x, y, at: anchorAt(doc, x, y), scroll: scrollsAround(doc, x, y) });
      }
    });
  };
  const onLeave = (event: PointerEvent) => {
    if (event.isTrusted && !event.relatedTarget) send({ k: "leave" });
  };
  const onPointer = (event: MouseEvent) => {
    if (!event.isTrusted) return;
    const x = event.clientX;
    const y = event.clientY;
    send({ k: "pointer", type: event.type, x, y, button: event.button, buttons: event.buttons, detail: event.detail, at: anchorAt(doc, x, y) });
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

/*
 * Hover and press styles. A replayed mouse can't trigger CSS :hover or :active (only a real
 * pointer does), so each of the page's :hover and :active rules gets a copy written against
 * attributes instead, and the replay sets those attributes on the element under the mouse and
 * its ancestors, the same elements a real pointer would match.
 *
 * Each copy goes right after its original, in the same stylesheet, @media block and layer, so
 * it wins and loses against the page's other rules exactly as the original does (a selected
 * row's style still beats its hover style, say).
 */
const HOVER = "data-mirror-hover";
const ACTIVE = "data-mirror-active";
const copiedSheets = new WeakSet<CSSStyleSheet>();

type RuleParent = CSSStyleSheet | CSSGroupingRule;

function copyStateRules(parent: RuleParent) {
  for (let i = 0; i < parent.cssRules.length; i++) {
    const rule = parent.cssRules[i];
    const text = rule.cssText;
    if (!text.includes(":hover") && !text.includes(":active")) continue;
    if (text.includes(HOVER) || text.includes(ACTIVE)) continue;
    // A block of rules (@media, @supports, @layer, @container): copy the rules inside it.
    // (Checked by shape: the page's rules come from its own window, not this one.)
    if (!("selectorText" in rule) && "cssRules" in rule && "insertRule" in rule) {
      copyStateRules(rule as CSSGroupingRule);
      continue;
    }
    try {
      parent.insertRule(text.replaceAll(":hover", `[${HOVER}]`).replaceAll(":active", `[${ACTIVE}]`), i + 1);
      i++;
    } catch {
      // A rule the browser won't take back in this form: that hover just isn't mirrored.
    }
  }
}

function ensureStateStyles(doc: Document) {
  for (const sheet of Array.from(doc.styleSheets)) {
    // A stylesheet replaced while the page runs (a reload of its styles) is a new sheet.
    if (copiedSheets.has(sheet)) continue;
    copiedSheets.add(sheet);
    try {
      copyStateRules(sheet);
    } catch {
      // Another site's stylesheet (fonts): can't be read, and has no hover rules anyway.
    }
  }
}

/** Puts a state attribute on an element and its ancestors, clearing it everywhere else. */
function markPath(doc: Document, attribute: string, target: Element | null) {
  const path = new Set<Element>();
  for (let node = target; node; node = node.parentElement) path.add(node);
  for (const element of Array.from(doc.querySelectorAll(`[${attribute}]`))) {
    if (!path.has(element)) element.removeAttribute(attribute);
  }
  for (const element of path) if (!element.hasAttribute(attribute)) element.setAttribute(attribute, "");
}

/**
 * Scrolls to a position from the other page, at once rather than smoothly (a page may ask for
 * smooth scrolling), so the scroll events it causes are over before they could be sent back.
 */
function applyScroll(doc: Document, state: ScrollState) {
  const win = doc.defaultView;
  const target = state.path ? elementAt(doc, state.path) : (doc.scrollingElement ?? doc.documentElement);
  if (!win || !target) return;
  if (Math.abs(target.scrollTop - state.top) < 1 && Math.abs(target.scrollLeft - state.left) < 1) return;
  const source = state.path ? target : doc;
  ignoringScroll.add(source);
  target.scrollTo({ top: state.top, left: state.left, behavior: "instant" });
  win.setTimeout(() => ignoringScroll.delete(source), 120);
}

/** Where the other page's mouse is in this page: on the same element, or failing that the same point. */
function pointFor(doc: Document, x: number, y: number, at?: Anchor) {
  const element = at ? elementAt(doc, at.path) : null;
  // Not the same kind of element here, so the pages differ around it: fall back to the point.
  if (!element || !at || element.tagName !== at.tag) return { x, y };
  const box = element.getBoundingClientRect();
  if (!box.width && !box.height) return { x, y };
  // Kept inside the element, in case it's a little smaller here.
  const px = box.left + Math.min(Math.max(at.dx, 0), Math.max(box.width - 1, 0));
  const py = box.top + Math.min(Math.max(at.dy, 0), Math.max(box.height - 1, 0));
  return { x: px, y: py };
}

/**
 * Plays back something done in the other window, in this page's document. For a mouse move,
 * returns where the mouse landed here, which is where to draw it.
 */
export function replayInput(doc: Document, op: MirrorOp): { x: number; y: number } | undefined {
  const win = doc.defaultView as (Window & typeof globalThis) | null;
  if (!win) return undefined;
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

  if (op.k === "move" || op.k === "pointer") ensureStateStyles(doc);

  if (op.k === "move") {
    for (const state of op.scroll ?? []) applyScroll(doc, state);
    const { x, y } = pointFor(doc, op.x, op.y, op.at);
    const target = at(x, y);
    markPath(doc, HOVER, target);
    const before = hovered.get(doc) ?? null;
    if (before !== target) {
      if (before?.isConnected) {
        fire(before, "pointerout", mouse(x, y, { relatedTarget: target }));
        fire(before, "mouseout", mouse(x, y, { relatedTarget: target }));
      }
      fire(target, "pointerover", mouse(x, y, { relatedTarget: before }));
      fire(target, "mouseover", mouse(x, y, { relatedTarget: before }));
      hovered.set(doc, target);
    }
    fire(target, "pointermove", mouse(x, y));
    fire(target, "mousemove", mouse(x, y));
    return { x, y };
  } else if (op.k === "leave") {
    const before = hovered.get(doc);
    if (before?.isConnected) {
      fire(before, "pointerout", mouse(-1, -1));
      fire(before, "mouseout", mouse(-1, -1));
    }
    hovered.set(doc, null);
    markPath(doc, HOVER, null);
    markPath(doc, ACTIVE, null);
  } else if (op.k === "pointer") {
    const { x, y } = pointFor(doc, op.x, op.y, op.at);
    const target = at(x, y);
    if (op.type === "pointerdown") markPath(doc, ACTIVE, target);
    if (op.type === "pointerup") markPath(doc, ACTIVE, null);
    if (op.type === "pointerdown" || op.type === "mousedown") {
      const focusable = target.closest<HTMLElement>("input, textarea, select, button, a[href], [tabindex], [contenteditable]");
      if (op.type === "mousedown") focusable?.focus({ preventScroll: true });
    }
    fire(target, op.type, mouse(x, y, { button: op.button, buttons: op.buttons, detail: op.detail }));
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
    applyScroll(doc, op);
  }
  return undefined;
}
