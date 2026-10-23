import { cn } from "@/lib/utils";

// Floating dark Reed-Kellogg symbol palette. 3 columns × 6 rows of diagram
// icons plus a final row with a single "A" text tool. Only the tools that
// already exist are active (selectable); everything else is shown but
// disabled so the chart is visible while the tools arrive one by one.
//
// Each entry carries its own SVG glyph in a 44×30 local box. A hover tooltip
// shows the label to the right of the panel; the active tool gets a highlight.

const VB = "0 0 44 30";

const ENTRIES = [
  {
    key: "stand",
    label: "Clause stand",
    tool: null,
    paths: [
      "M4 24 L40 24",
      "M18 24 L22 18 L26 24",
      "M22 18 L22 6",
      "M22 6 L40 6",
    ],
  },
  {
    key: "modifier",
    label: "Modifier",
    tool: "modifier",
    paths: ["M4 24 L40 24", "M20 24 L34 10"],
  },
  {
    key: "mod-curve",
    label: "Modifier (curved)",
    tool: null,
    paths: ["M4 24 L40 24", "M20 24 Q34 6 40 10"],
  },
  {
    key: "mod-right",
    label: "Modifier (right angle)",
    tool: null,
    paths: ["M4 24 L40 24", "M20 24 L20 14 L34 14"],
  },
  {
    key: "mod-obtuse",
    label: "Modifier (obtuse)",
    tool: null,
    paths: ["M4 24 L40 24", "M14 24 L26 14 L38 14"],
  },
  {
    key: "mod-flat",
    label: "Modifier (flat)",
    tool: null,
    paths: ["M4 24 L40 24", "M12 24 L22 12 L34 24"],
  },
  {
    key: "mod-lbracket",
    label: "Modifier (L-bracket)",
    tool: null,
    paths: ["M4 24 L40 24", "M18 24 L18 10 L30 10"],
  },
  {
    key: "mod-angled",
    label: "Modifier (angled)",
    tool: null,
    paths: ["M4 24 L40 24", "M8 24 L24 16 L38 16"],
  },
  {
    key: "mod-compound",
    label: "Compound modifier",
    tool: null,
    paths: ["M4 24 L40 24", "M16 19 L16 29", "M28 19 L28 29"],
  },
  {
    key: "baseline-cross",
    label: "Baseline · subject | predicate",
    tool: "baseline:cross",
    paths: ["M6 16 L38 16", "M22 8 L22 24"],
  },
  {
    key: "baseline-object",
    label: "Baseline · object",
    tool: "baseline:object",
    paths: ["M6 16 L38 16", "M22 16 L22 26"],
  },
  {
    key: "baseline-plain",
    label: "Baseline · plain",
    tool: "baseline:plain",
    paths: ["M6 16 L38 16"],
  },
  {
    key: "equal",
    label: "Equal",
    tool: null,
    paths: ["M10 12 L34 12", "M10 20 L34 20"],
  },
  {
    key: "conj-c",
    label: "Conjunction (C)",
    tool: null,
    paths: ["M14 8 C6 8 6 24 14 24", "M30 8 C38 8 38 24 30 24", "M14 16 L30 16"],
  },
  {
    key: "conj-diamond",
    label: "Conjunction (diamond)",
    tool: null,
    paths: ["M14 16 L22 8 L30 16 L22 24 Z"],
  },
  {
    key: "bracket",
    label: "Bracket",
    tool: null,
    paths: ["M16 8 L16 24", "M16 8 L22 8", "M16 24 L22 24"],
  },
  {
    key: "sub-dotted",
    label: "Subordinate (dotted)",
    tool: null,
    paths: [{ d: "M8 24 L8 12 L26 12", dashed: true }],
  },
  {
    key: "sub-diag",
    label: "Subordinate (diagonal)",
    tool: null,
    paths: [{ d: "M8 24 L26 8", dashed: true }],
  },
];

function Glyph({ entry }) {
  return (
    <svg viewBox={VB} className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      {entry.paths.map((p, i) => {
        const d = typeof p === "string" ? p : p.d;
        const dashed = typeof p === "string" ? false : !!p.dashed;
        return <path key={i} d={d} strokeDasharray={dashed ? "3 3" : undefined} />;
      })}
    </svg>
  );
}

export default function DiagramPalette({ activeTool, onPick }) {
  return (
    <div className="absolute left-4 top-4 z-20 flex flex-col gap-2 rounded-xl border border-[#d1c2aa] bg-[#f6f0e4] p-2.5 shadow-[0_4px_14px_rgba(65,48,32,0.12)]">
      <div className="grid grid-cols-3 gap-1">
        {ENTRIES.map((entry) => {
          const enabled = entry.tool !== null;
          const selected = enabled && activeTool === entry.tool;
          return (
            <button
              key={entry.key}
              type="button"
              disabled={!enabled}
              onClick={() => enabled && onPick(entry.tool)}
              className={cn(
                "group relative flex h-9 w-11 items-center justify-center rounded-lg border border-[#d1c2aa] transition-colors",
                enabled
                  ? "bg-[#eee5d6] text-[#59483a] hover:bg-[#e5d7c3] focus-visible:outline-2 focus-visible:outline-[#8b2928]"
                  : "bg-[#eee5d6] text-[#9a8a76] opacity-40",
                selected && "bg-[#ead5cf] shadow-[inset_0_0_0_1px_#8b2928]"
              )}
            >
              <Glyph entry={entry} />
              <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-30 -translate-y-1/2 whitespace-nowrap rounded-md bg-[#f6f0e4] px-2 py-1 text-xs text-[#59483a] opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                {entry.label}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          disabled
          className="col-span-3 flex h-9 w-full items-center justify-center rounded-lg border border-[#d1c2aa] bg-[#eee5d6] text-[#9a8a76] opacity-40"
          title="Text"
        >
          <span className="text-lg font-medium">A</span>
        </button>
      </div>
    </div>
  );
}