import { Button } from "@helenhsong/ui";

export function App() {
  return (
    <main className="starter">
      <p className="starter-eyebrow">Prototype</p>
      <h1>Permit Tester</h1>
      <p className="starter-body">The environment is ready. Replace this screen with the first scenario.</p>
      <Button render={<a href={import.meta.env.BASE_URL} />} nativeButton={false} variant="outline">
        All prototypes
      </Button>
    </main>
  );
}
