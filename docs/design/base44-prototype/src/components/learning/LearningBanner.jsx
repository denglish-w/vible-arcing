// Soft pink banner shown above the Greek text in Learning mode.
export default function LearningBanner() {
  return (
    <div className="mb-5 flex items-center gap-2.5 rounded-lg bg-pinkhighlight px-4 py-2.5">
      <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
      <span className="font-body text-[13px]">
        <span className="font-semibold text-primary">Learning mode.</span>
        <span className="ml-1.5 text-foreground/80">Tap or click any word to parse it.</span>
      </span>
    </div>
  );
}