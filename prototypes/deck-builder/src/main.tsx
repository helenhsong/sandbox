import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@helenhsong/ui/style.css";
import "../../../src/scrollbars.css";
import "../../../src/deck/deck.css";
import "./styles.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
