import { Button } from "@helenhsong/ui";
// Screens and flow steps use useHistoryState, and screens with required input offer
// useDeckFill, so the prototype works in a deck's window (see "Prototypes in decks" in the README).
// import { useDeckFill, useHistoryState } from "../../../src/live-page";

export function App() {
  return (
    <main className="starter">
      <p className="starter-eyebrow">Prototype</p>
      <h1>Prototype Name</h1>
      <p className="starter-body">The environment is ready. Replace this screen with the first scenario.</p>
      <Button render={<a href={import.meta.env.BASE_URL} />} nativeButton={false} variant="outline">
        All prototypes
      </Button>
    </main>
  );
}
