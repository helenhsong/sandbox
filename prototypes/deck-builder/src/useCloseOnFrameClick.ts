import { useEffect } from "react";

/**
 * Clicks inside an embedded page (a live page's iframe) never reach this page, so popups
 * can't treat them as clicks outside. When focus moves into an iframe while `open`, close.
 */
export function useCloseOnFrameClick(open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const onBlur = () => {
      // The iframe takes focus a moment after the window loses it.
      setTimeout(() => {
        if (document.activeElement instanceof HTMLIFrameElement) close();
      }, 0);
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [open, close]);
}
