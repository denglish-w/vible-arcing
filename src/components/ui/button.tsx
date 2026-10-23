import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Button({
  className,
  type = "button",
  ...props
}: ComponentProps<"button">) {
  return <button type={type} className={cn("button", className)} {...props} />;
}
