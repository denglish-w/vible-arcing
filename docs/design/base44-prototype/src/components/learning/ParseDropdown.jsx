import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// A custom dropdown for the Learning parsing form. Every field uses the same
// control so behavior is identical across Part of speech, Tense, Voice, Mood,
// Person, Case, Number, and Gender. Clicking anywhere on the field opens a
// menu listing every option, one per row; clicking a row chooses it and closes
// the menu. Each field starts on "Choose".
//
// The menu is a floating layer portaled to the document body, so it is never
// clipped by the bubble's scroll area or edges. It opens below the field when
// there is room and above otherwise, lines up with the field, is at least as
// wide as the field, and scrolls if it has many rows. Clicking inside it never
// closes the bubble (the menu carries `data-parse-menu`, which the bubble's
// outside-click handler ignores); scrolling inside it scrolls only the menu.
//
// Keyboard: Tab moves between fields; Enter, Space, or the Down arrow opens the
// menu; Up/Down move through options; Enter chooses; Esc closes just the menu;
// typing the first letter jumps to a matching option. Touch rows are 44px tall.
const ROW_H = 44;
const MENU_MAX_H = 264;

export default function ParseDropdown({ label, value, options, onChange, disabled, className, compact }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [menuPos, setMenuPos] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const chosen = options.find((o) => o.value === value);
  const display = chosen ? chosen.label : "Choose";

  function placeMenu() {
    const tr = triggerRef.current;
    if (!tr) return;
    const r = tr.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.max(r.width, 160);
    const estH = Math.min(options.length * ROW_H + 8, MENU_MAX_H);
    const roomBelow = vh - r.bottom - 12;
    const roomAbove = r.top - 12;
    const placeBelow = roomBelow >= estH || (roomAbove < estH && roomBelow >= roomAbove);
    const room = placeBelow ? roomBelow : roomAbove;
    const h = Math.min(estH, Math.max(120, room));
    const top = placeBelow ? r.bottom + 4 : Math.max(12, r.top - h - 4);
    let left = r.left;
    if (left + w > vw - 12) left = vw - 12 - w;
    if (left < 12) left = 12;
    const maxHeight = Math.min(MENU_MAX_H, h);
    setMenuPos((p) =>
      p && p.top === top && p.left === left && p.width === w && p.placeBelow === placeBelow && p.maxHeight === maxHeight
        ? p
        : { top, left, width: w, placeBelow, maxHeight }
    );
  }

  // Place the menu when it opens, and set the initial highlight on the chosen
  // option (or the first).
  useLayoutEffect(() => {
    if (!open) return;
    placeMenu();
    const idx = value ? options.findIndex((o) => o.value === value) : -1;
    setActive(idx >= 0 ? idx : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keep the menu aligned if anything scrolls or the viewport resizes while it
  // is open (the bubble is fixed, so this is mostly defensive).
  useEffect(() => {
    if (!open) return;
    function onScroll() {
      placeMenu();
    }
    function onResize() {
      placeMenu();
    }
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Click outside the trigger/menu closes just the menu.
  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      const t = e.target;
      if (menuRef.current && menuRef.current.contains(t)) return;
      if (triggerRef.current && triggerRef.current.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function choose(opt) {
    onChange(opt.value);
    setOpen(false);
  }

  function onKeyDown(e) {
    if (disabled) return;
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + options.length) % options.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && options[active]) choose(options[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    } else if (e.key === " ") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      const lk = e.key.toLowerCase();
      const from = active >= 0 ? active + 1 : 0;
      let idx = -1;
      for (let i = 0; i < options.length; i++) {
        const k = (from + i) % options.length;
        if (options[k].label.toLowerCase().startsWith(lk)) {
          idx = k;
          break;
        }
      }
      if (idx >= 0) setActive(idx);
    }
  }

  return (
    <div className={className} data-parse-field>
      <label className="small-caps mb-1 block">{label}</label>
      <button
        type="button"
        ref={triggerRef}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        data-parse-trigger
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between rounded-md border bg-transparent px-3 text-left font-body text-sm text-foreground shadow-sm",
          compact ? "h-8 px-2" : "h-10",
          "focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          open
            ? "border-primary ring-1 ring-primary"
            : "border-input focus:border-primary focus:ring-1 focus:ring-primary"
        )}
      >
        <span className={cn("truncate", !chosen && "text-muted-foreground")}>{display}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 opacity-50 transition-transform", open && "rotate-180")} />
      </button>
      {open &&
        menuPos &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            data-parse-menu
            tabIndex={-1}
            className="fixed z-[80] overflow-auto rounded-md border border-border bg-popover p-1 shadow-lg"
            style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width, maxHeight: menuPos.maxHeight }}
          >
            {options.map((o, i) => (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={value === o.value}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(o)}
                className={cn(
                  "flex min-h-[44px] w-full items-center justify-between gap-3 rounded-sm px-3 text-left font-body text-sm",
                  i === active ? "bg-accent/60 text-accent-foreground" : "text-foreground",
                  value === o.value && "font-semibold text-foreground"
                )}
              >
                <span>{o.label}</span>
                {value === o.value && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}