"use client";

/**
 * Textarea alignée sur les tokens de `Input` (@creezio/shell-ui).
 * Le kit n'exporte pas encore de primitive `textarea` — ce contrôle reprend
 * exactement la même langue visuelle (bordure, focus ring, typo) pour les
 * modules admin (support / prospects) en attendant le SoT shell-ui.
 */

import * as React from "react";
import { cn } from "@creezio/shell-ui";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[60px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
