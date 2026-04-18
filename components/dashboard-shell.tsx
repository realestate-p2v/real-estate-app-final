"use client";

import {
  ReactNode,
  createContext,
  useContext,
  forwardRef,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  LabelHTMLAttributes,
} from "react";
import { Navigation } from "@/components/navigation";

/* ─────────────────────────────────────────────
   Accent colors — one of these per tool.
   Tools pass e.g. <DashboardShell accent="sky"> and their
   headers/buttons/icons use useAccent() to pick up the classes.
   ───────────────────────────────────────────── */
export type Accent =
  | "cyan"
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "emerald"
  | "teal"
  | "amber"
  | "orange"
  | "rose";

export interface AccentClasses {
  /** Solid text, e.g. headers, icon color */
  text: string;
  /** Dimmer text, e.g. muted label in tool chrome */
  textDim: string;
  /** Lighter text for hover/emphasis */
  textLight: string;
  /** Translucent background tint for chips/cards */
  bg: string;
  /** Slightly stronger bg, e.g. on button idle */
  bgSolid: string;
  /** Even stronger bg, e.g. hover */
  bgHover: string;
  /** Border at low opacity */
  border: string;
  /** Ring for icon circles */
  ring: string;
  /** Solid button bg */
  btnBg: string;
  /** Solid button bg on hover */
  btnBgHover: string;
  /** Drop-shadow for CTA button */
  btnShadow: string;
  /** Raw hex (rarely needed — use for inline styles) */
  hex: string;
}

/**
 * Every accent is a static Tailwind class map. We define them literally —
 * Tailwind can't process `${accent}-400` at build time, so dynamic strings
 * would be purged. These are all statically recognized.
 */
const ACCENTS: Record<Accent, AccentClasses> = {
  cyan: {
    text: "text-cyan-400", textDim: "text-cyan-400/60", textLight: "text-cyan-300",
    bg: "bg-cyan-400/10", bgSolid: "bg-cyan-400/15", bgHover: "hover:bg-cyan-400/25",
    border: "border-cyan-400/20", ring: "ring-cyan-400/30",
    btnBg: "bg-cyan-500", btnBgHover: "hover:bg-cyan-400", btnShadow: "shadow-cyan-500/30",
    hex: "#22d3ee",
  },
  sky: {
    text: "text-sky-400", textDim: "text-sky-400/60", textLight: "text-sky-300",
    bg: "bg-sky-400/10", bgSolid: "bg-sky-400/15", bgHover: "hover:bg-sky-400/25",
    border: "border-sky-400/20", ring: "ring-sky-400/30",
    btnBg: "bg-sky-500", btnBgHover: "hover:bg-sky-400", btnShadow: "shadow-sky-500/30",
    hex: "#38bdf8",
  },
  blue: {
    text: "text-blue-400", textDim: "text-blue-400/60", textLight: "text-blue-300",
    bg: "bg-blue-400/10", bgSolid: "bg-blue-400/15", bgHover: "hover:bg-blue-400/25",
    border: "border-blue-400/20", ring: "ring-blue-400/30",
    btnBg: "bg-blue-500", btnBgHover: "hover:bg-blue-400", btnShadow: "shadow-blue-500/30",
    hex: "#60a5fa",
  },
  indigo: {
    text: "text-indigo-400", textDim: "text-indigo-400/60", textLight: "text-indigo-300",
    bg: "bg-indigo-400/10", bgSolid: "bg-indigo-400/15", bgHover: "hover:bg-indigo-400/25",
    border: "border-indigo-400/20", ring: "ring-indigo-400/30",
    btnBg: "bg-indigo-500", btnBgHover: "hover:bg-indigo-400", btnShadow: "shadow-indigo-500/30",
    hex: "#818cf8",
  },
  violet: {
    text: "text-violet-400", textDim: "text-violet-400/60", textLight: "text-violet-300",
    bg: "bg-violet-400/10", bgSolid: "bg-violet-400/15", bgHover: "hover:bg-violet-400/25",
    border: "border-violet-400/20", ring: "ring-violet-400/30",
    btnBg: "bg-violet-500", btnBgHover: "hover:bg-violet-400", btnShadow: "shadow-violet-500/30",
    hex: "#a78bfa",
  },
  purple: {
    text: "text-purple-400", textDim: "text-purple-400/60", textLight: "text-purple-300",
    bg: "bg-purple-400/10", bgSolid: "bg-purple-400/15", bgHover: "hover:bg-purple-400/25",
    border: "border-purple-400/20", ring: "ring-purple-400/30",
    btnBg: "bg-purple-500", btnBgHover: "hover:bg-purple-400", btnShadow: "shadow-purple-500/30",
    hex: "#c084fc",
  },
  emerald: {
    text: "text-emerald-400", textDim: "text-emerald-400/60", textLight: "text-emerald-300",
    bg: "bg-emerald-400/10", bgSolid: "bg-emerald-400/15", bgHover: "hover:bg-emerald-400/25",
    border: "border-emerald-400/20", ring: "ring-emerald-400/30",
    btnBg: "bg-emerald-500", btnBgHover: "hover:bg-emerald-400", btnShadow: "shadow-emerald-500/30",
    hex: "#34d399",
  },
  teal: {
    text: "text-teal-400", textDim: "text-teal-400/60", textLight: "text-teal-300",
    bg: "bg-teal-400/10", bgSolid: "bg-teal-400/15", bgHover: "hover:bg-teal-400/25",
    border: "border-teal-400/20", ring: "ring-teal-400/30",
    btnBg: "bg-teal-500", btnBgHover: "hover:bg-teal-400", btnShadow: "shadow-teal-500/30",
    hex: "#2dd4bf",
  },
  amber: {
    text: "text-amber-400", textDim: "text-amber-400/60", textLight: "text-amber-300",
    bg: "bg-amber-400/10", bgSolid: "bg-amber-400/15", bgHover: "hover:bg-amber-400/25",
    border: "border-amber-400/20", ring: "ring-amber-400/30",
    btnBg: "bg-amber-500", btnBgHover: "hover:bg-amber-400", btnShadow: "shadow-amber-500/30",
    hex: "#fbbf24",
  },
  orange: {
    text: "text-orange-400", textDim: "text-orange-400/60", textLight: "text-orange-300",
    bg: "bg-orange-400/10", bgSolid: "bg-orange-400/15", bgHover: "hover:bg-orange-400/25",
    border: "border-orange-400/20", ring: "ring-orange-400/30",
    btnBg: "bg-orange-500", btnBgHover: "hover:bg-orange-400", btnShadow: "shadow-orange-500/30",
    hex: "#fb923c",
  },
  rose: {
    text: "text-rose-400", textDim: "text-rose-400/60", textLight: "text-rose-300",
    bg: "bg-rose-400/10", bgSolid: "bg-rose-400/15", bgHover: "hover:bg-rose-400/25",
    border: "border-rose-400/20", ring: "ring-rose-400/30",
    btnBg: "bg-rose-500", btnBgHover: "hover:bg-rose-400", btnShadow: "shadow-rose-500/30",
    hex: "#fb7185",
  },
};

/* Context so children can grab accent classes via useAccent() */
const AccentContext = createContext<AccentClasses>(ACCENTS.cyan);

/** Grab the current tool's accent classes. */
export function useAccent(): AccentClasses {
  return useContext(AccentContext);
}

/** Grab any accent by name (e.g. to render another tool's color locally). */
export function getAccent(name: Accent): AccentClasses {
  return ACCENTS[name];
}

/* ─────────────────────────────────────────────
   Shared dark-theme CSS — font bumps, fade-ups,
   chip animations, glow pulse, Start Here beacon.
   ───────────────────────────────────────────── */
export const mcStyles = `
  @keyframes mc-fade-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes mc-chip-in {
    from { opacity: 0; transform: translateY(10px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes mc-glow-pulse {
    0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.25), 0 0 60px rgba(34, 197, 94, 0.1); }
    50%      { box-shadow: 0 0 28px rgba(34, 197, 94, 0.4),  0 0 80px rgba(34, 197, 94, 0.18); }
  }
  @keyframes mc-start-pulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.35), 0 0 0 0 rgba(34, 211, 238, 0);
      border-color: rgba(34, 211, 238, 0.4);
    }
    50% {
      box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.15), 0 0 28px 4px rgba(34, 211, 238, 0.25);
      border-color: rgba(34, 211, 238, 0.6);
    }
  }
  @keyframes mc-start-badge {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-2px); }
  }
  .mc-animate {
    opacity: 0;
    animation: mc-fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  .mc-chip-animate {
    opacity: 0;
    animation: mc-chip-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  .mc-glow-btn {
    animation: mc-glow-pulse 3s ease-in-out infinite;
  }
  .mc-start-here {
    animation: mc-start-pulse 2.4s ease-in-out infinite;
    border-color: rgba(34, 211, 238, 0.4) !important;
  }
  .mc-start-badge {
    animation: mc-start-badge 2.4s ease-in-out infinite;
  }

  /* ── Font size bump — everything one step larger ── */
  .dash-root .text-\\[9px\\]  { font-size: 11px !important; }
  .dash-root .text-\\[10px\\] { font-size: 12px !important; }
  .dash-root .text-\\[11px\\] { font-size: 13px !important; }
  .dash-root .text-xs  { font-size: 14px !important; line-height: 1.55 !important; }
  .dash-root .text-sm  { font-size: 16px !important; line-height: 1.55 !important; }
  .dash-root .text-base { font-size: 18px !important; }
  .dash-root .text-lg  { font-size: 20px !important; }
  .dash-root .text-xl  { font-size: 23px !important; }
  .dash-root .text-2xl { font-size: 28px !important; }
  .dash-root .text-3xl { font-size: 34px !important; }
`;

type MaxWidth = "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full";

const maxWidthClass: Record<MaxWidth, string> = {
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  "full": "max-w-full",
};

export interface DashboardShellProps {
  children: ReactNode;
  /** Inner content width — defaults to 6xl (matches /dashboard) */
  maxWidth?: MaxWidth;
  /** Accent color for this tool — drives useAccent() */
  accent?: Accent;
  /** Hide <Navigation /> if the page renders its own */
  hideNav?: boolean;
  /** Extra class on the outermost wrapper (rare) */
  className?: string;
}

/**
 * DashboardShell — canonical dark dashboard chrome.
 *
 * Wrap any dashboard tool in this to get:
 *   - bg-gray-900 base with cyan/indigo atmosphere gradient + grid overlay
 *   - Shared CSS (fade-ups, chip-ins, glow pulse, Start Here pulse)
 *   - dash-root class so font bumps apply
 *   - <Navigation /> rendered automatically
 *   - An accent color context so children can grab useAccent()
 *
 * Example:
 *   export default function MyTool() {
 *     return (
 *       <DashboardShell accent="sky" maxWidth="4xl">
 *         <ToolBody />
 *       </DashboardShell>
 *     );
 *   }
 *
 *   function ToolBody() {
 *     const a = useAccent();
 *     return <h1 className={a.text}>Hello</h1>;
 *   }
 */
export function DashboardShell({
  children,
  maxWidth = "6xl",
  accent = "cyan",
  hideNav = false,
  className = "",
}: DashboardShellProps) {
  const widthCls = maxWidthClass[maxWidth];
  const accentClasses = ACCENTS[accent];

  return (
    <AccentContext.Provider value={accentClasses}>
      <div className={`dash-root min-h-screen bg-gray-900 text-white transition-colors duration-300 ${className}`}>
        {!hideNav && <Navigation />}
        <style dangerouslySetInnerHTML={{ __html: mcStyles }} />

        {/* Background atmosphere — matches /dashboard exactly */}
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 15% 20%, rgba(56,189,248,0.05) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 85% 80%, rgba(99,102,241,0.04) 0%, transparent 60%)",
          }}
        />
        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(56,189,248,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,.15) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Content wrapper */}
        <div className={`relative z-10 mx-auto ${widthCls} px-4 py-8 sm:px-6 sm:py-10 lg:px-8`}>
          {children}
        </div>
      </div>
    </AccentContext.Provider>
  );
}

/* ─────────────────────────────────────────────
   Dark form controls — drop-in replacements for
   shadcn <Input> / <Textarea> that fit the dark shell.
   ───────────────────────────────────────────── */

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

export const DarkSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
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

export function DarkLabel({ children, className = "", ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`block text-xs font-semibold text-white/50 mb-1.5 ${className}`} {...props}>
      {children}
    </label>
  );
}
