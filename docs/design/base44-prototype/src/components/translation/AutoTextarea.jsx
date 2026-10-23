import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// A textarea that grows to fit its content. Optionally forwards its DOM node
// via inputRef so a parent can focus it (e.g. Tab from the translation box).
export default function AutoTextarea({
  value,
  onChange,
  placeholder,
  disabled,
  onKeyDown,
  className,
  autoFocus,
  inputRef,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.max(el.scrollHeight, 36) + "px";
  }, [value]);

  return (
    <textarea
      ref={(el) => {
        ref.current = el;
        if (inputRef) inputRef.current = el;
      }}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => onChange?.(e.target.value)}
      onKeyDown={onKeyDown}
      autoFocus={autoFocus}
      rows={1}
      className={cn(
        "w-full resize-none overflow-hidden rounded-md border border-input bg-transparent px-3 py-2 font-body text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
        className
      )}
    />
  );
}