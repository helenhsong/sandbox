import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@helenhsong/ui/style.css";
import "../scrollbars.css";
import "./home.css";
import { Home } from "./Home";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Home />
  </StrictMode>,
);
