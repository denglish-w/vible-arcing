import { Button } from "@/components/ui/button";

// Placeholder for the Diagramming view: a titled, empty screen with a
// "New Diagram" action that opens the passage-picker dialog. No diagram
// canvas yet — the feature only selects a passage and shows its title.
export default function DiagrammingPlaceholder({ onNewDiagram }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="font-heading text-3xl text-foreground">Diagramming</h1>
      <p className="mt-3 font-body text-sm text-muted-foreground">
        Sentence diagrams will appear here.
      </p>
      <Button
        type="button"
        onClick={onNewDiagram}
        className="mt-6 bg-primary text-primary-foreground"
      >
        New Diagram
      </Button>
    </div>
  );
}