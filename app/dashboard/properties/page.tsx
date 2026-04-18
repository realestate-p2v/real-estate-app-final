/* ─────────────────────────────────────────────
   Dark form controls — drop-in replacements for
   shadcn <Input> / <Textarea> that fit the dark shell.
   Import from DashboardShell:
     import { DashboardShell, DarkInput, DarkTextarea } from "@/components/dashboard-shell";
   ───────────────────────────────────────────── */

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

const DARK_FIELD_BASE =
  "w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export const DarkInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function DarkInput({ className = "", ...props }, ref) {
    return <input ref={ref} className={`${DARK_FIELD_BASE} ${className}`} {...props} />;
  }
);

export const DarkTextarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function DarkTextarea({ className = "", ...props }, ref) {
    return <textarea ref={ref} className={`${DARK_FIELD_BASE} resize-y ${className}`} {...props} />;
  }
);

/* DarkSelect — same styling, uses native <select> */
export const DarkSelect = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function DarkSelect({ className = "", children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={`${DARK_FIELD_BASE} appearance-none cursor-pointer bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23ffffff66%22 stroke-width=%222%22><polyline points=%226 9 12 15 18 9%22/></svg>')] bg-[length:12px_12px] bg-[right_0.75rem_center] bg-no-repeat pr-9 ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);

/* DarkLabel — matches the muted label style used throughout */
export function DarkLabel({ children, className = "", ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`block text-xs font-semibold text-white/50 mb-1.5 ${className}`} {...props}>
      {children}
    </label>
  );
}
