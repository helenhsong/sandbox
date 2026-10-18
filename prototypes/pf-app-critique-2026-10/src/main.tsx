import "@helenhsong/ui/style.css";
import "./styles.css";
import { mountPrototype } from "../../../src/live-page/mount";
import { App } from "./App";

// Opened on its own, the prototype shows in the light macOS-style window; in a deck, the deck's.
mountPrototype(App);
