import { useEffect, useState } from "react";
import { latinToGreek, greekToLatin } from "@/lib/greek";

// A controlled text input that converts Latin keys to Greek live as the user
// types. Maintains the Latin source internally so 's' becomes ς only at the
// word end and reverts to σ once more letters follow. Reports the Greek via
// onChange. A controlled `value` (Greek) can be set externally to restore a
// previously typed word without disturbing the live-typing behavior.
export default function GreekInput({ value, onChange, placeholder, disabled, compact }) {
  const [latin, setLatin] = useState(() => greekToLatin(value || ""));

  // Sync from an external value (e.g. a saved word being restored) only when it
  // differs from what our Latin source already produces, so user typing never
  // fights the prop.
  useEffect(() => {
    if ((value || "") !== latinToGreek(latin)) {
      setLatin(greekToLatin(value || ""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function update(next) {
    setLatin(next);
    onChange(latinToGreek(next));
  }

  function handleKeyDown(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Backspace") {
      e.preventDefault();
      update(latin.slice(0, -1));
      return;
    }
    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      e.preventDefault();
      update(latin + e.key.toLowerCase());
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const text = e.clipboardData?.getData("text") ?? "";
    update(latin + text);
  }

  return (
    <input
      type="text"
      value={latinToGreek(latin)}
      readOnly
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      placeholder={placeholder}
      disabled={disabled}
      className={`flex w-full rounded-md border border-input bg-transparent px-3 font-display text-lg leading-normal text-foreground placeholder:font-body placeholder:text-base placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${compact ? "h-9" : "h-10"}`}
    />
  );
}