"use client";
import * as Primitive from "@radix-ui/react-switch";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Switch({
  className,
  ...props
}: ComponentProps<typeof Primitive.Root>) {
  return (
    <Primitive.Root className={cn("switch", className)} {...props}>
      <Primitive.Thumb className="switch-thumb" />
    </Primitive.Root>
  );
}
