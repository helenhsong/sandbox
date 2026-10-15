import { useEffect, useRef, useState, type PointerEvent } from "react";

const MIN_THUMB = 32;
const INSET = 2;

/**
 * The page's scrollbar, drawn over the content instead of beside it. The browser's own page
 * scrollbar is hidden (see page.css): where scrollbars take up space, it reserved a blank
 * column beside the page's header and content, and pushed the layout sideways whenever a page
 * became tall enough to scroll. This one takes no space, so nothing shifts or gaps.
 */
export function PageScrollbar() {
  const [thumb, setThumb] = useState({ top: 0, height: 0 });
  const [active, setActive] = useState(false);
  const drag = useRef<{ y: number; scrollTop: number } | null>(null);
  const idle = useRef<number | undefined>(undefined);

  useEffect(() => {
    const page = document.scrollingElement ?? document.documentElement;
    const update = () => {
      const { scrollHeight, clientHeight, scrollTop } = page;
      if (scrollHeight <= clientHeight + 1) return setThumb({ top: 0, height: 0 });
      const track = clientHeight - INSET * 2;
      const height = Math.max(MIN_THUMB, (clientHeight / scrollHeight) * track);
      const top = INSET + (scrollTop / (scrollHeight - clientHeight)) * (track - height);
      setThumb({ top, height });
    };
    const onScroll = () => {
      update();
      setActive(true);
      window.clearTimeout(idle.current);
      idle.current = window.setTimeout(() => !drag.current && setActive(false), 900);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    // Content changes (a new screen, an opened section) change how far the page scrolls.
    const observer = new ResizeObserver(update);
    observer.observe(document.body);
    const mutations = new MutationObserver(update);
    mutations.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      observer.disconnect();
      mutations.disconnect();
      window.clearTimeout(idle.current);
    };
  }, []);

  if (!thumb.height) return null;

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { y: event.clientY, scrollTop: (document.scrollingElement ?? document.documentElement).scrollTop };
    setActive(true);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const page = document.scrollingElement ?? document.documentElement;
    const track = page.clientHeight - INSET * 2 - thumb.height;
    const range = page.scrollHeight - page.clientHeight;
    page.scrollTop = drag.current.scrollTop + ((event.clientY - drag.current.y) * range) / Math.max(track, 1);
  };
  const onPointerUp = () => {
    drag.current = null;
    setActive(false);
  };

  return (
    <div
      className="page-scrollbar"
      data-active={active || undefined}
      style={{ top: thumb.top, height: thumb.height }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-hidden
    />
  );
}
