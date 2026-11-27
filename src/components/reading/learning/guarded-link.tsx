"use client";
// A link that leaves the chapter. While the open parsing form holds unchecked
// answers, a plain click is held back and LeaveConfirm asks first; a click that
// opens a new tab or window is left alone, since nothing is lost here.
import Link from "next/link";
import type { ComponentProps } from "react";
import { useSelectionStore } from "../../../lib/learning/selection";

export function GuardedLink({
  href,
  onClick,
  ...props
}: ComponentProps<typeof Link> & { href: string }) {
  return (
    <Link
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          (props.target && props.target !== "_self") ||
          !useSelectionStore.getState().dirty
        )
          return;
        event.preventDefault();
        useSelectionStore.getState().requestLeave(href, event.currentTarget);
      }}
    />
  );
}
