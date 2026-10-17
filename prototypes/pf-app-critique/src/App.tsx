import { Button } from "@helenhsong/ui";
// Screens and flow steps use useHistoryState, and screens a presenter needs to get through
// offer useDeckFill (the happy path), for the window the prototype runs in
// (see "The prototype window" in the README).
// import { useDeckFill, useHistoryState } from "../../../src/live-page";

export function App() {
  return (
    <main className="starter">
      <p className="starter-eyebrow">Prototype</p>
      <h1>PF App Critique</h1>
      <p className="starter-body">Product review in progress. The current experience and proposal will appear here.</p>
      <Button render={<a href={import.meta.env.BASE_URL} />} nativeButton={false} variant="outline">
        All prototypes
      </Button>
    </main>
  );
}
