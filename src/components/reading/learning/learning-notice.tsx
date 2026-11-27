// Says Learning mode is on and how to begin (spec 010 FR-002), and offers the
// practice history as a file (FR-028).
export function LearningNotice() {
  return (
    <div className="learning-notice">
      <p>Learning mode is on. Select a word to parse it.</p>
      <a href="/api/attempts/export" download>
        Download practice history
      </a>
    </div>
  );
}
