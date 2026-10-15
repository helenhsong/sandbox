import { StrictMode, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { PageWindow } from "./Window";

/**
 * Starts a Sandbox prototype. Opened on its own, it shows inside the light macOS-style window
 * on a light gray page, which loads the prototype itself in a frame. Inside a window (this one,
 * or a deck's), it renders the app. Either way the window gives it back, forward, reload and
 * fast-forward, with one kind of history.
 */
export function mountPrototype(App: ComponentType) {
  const root = createRoot(document.getElementById("root")!);
  if (window.parent === window) {
    document.documentElement.style.overflow = "hidden";
    root.render(
      <StrictMode>
        <div className="prototype-shell">
          <PageWindow src={window.location.href} label={document.title} theme="light" />
        </div>
      </StrictMode>,
    );
    return;
  }
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
