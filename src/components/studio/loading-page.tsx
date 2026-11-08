"use client";

import { useEffect, useState } from "react";

const STEPS = ["Čtu tvůj text", "Hledám praxi a vzdělání", "Ladím formulace", "Sázím do šablony"];

/** Skeleton A4 with time-based steps (no fake percentages). */
export function LoadingPage() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 2600);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="mx-auto w-full max-w-[560px]" role="status" aria-live="polite">
      <div className="relative aspect-[210/297] w-full overflow-hidden rounded-sm bg-white shadow-[0_24px_60px_rgba(0,0,0,0.10)]">
        <div className="absolute inset-0 p-[9%]">
          <div className="skeleton h-[5%] w-[55%] rounded" />
          <div className="skeleton mt-[2%] h-[2%] w-[30%] rounded" />
          <div className="mt-[8%] space-y-[2.2%]">
            {[92, 84, 88, 60].map((w, i) => (
              <div key={i} className="skeleton h-[1.6%] rounded" style={{ width: `${w}%` }} />
            ))}
          </div>
          <div className="mt-[9%] grid grid-cols-[22%_1fr] gap-[5%]">
            <div className="skeleton h-[1.6%] w-[70%] rounded" />
            <div className="space-y-[6%]">
              {[0, 1, 2].map((b) => (
                <div key={b} className="space-y-[3%]">
                  <div className="skeleton h-[12px] w-[60%] rounded" />
                  <div className="skeleton h-[8px] w-[90%] rounded" />
                  <div className="skeleton h-[8px] w-[80%] rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <ol className="mt-5 space-y-2 text-sm">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`flex items-center gap-3 transition-opacity ${i > step ? "opacity-35" : "opacity-100"}`}
          >
            <span
              aria-hidden
              className={`grid size-5 place-items-center rounded-full text-[11px] ${
                i < step ? "bg-ink text-white" : i === step ? "border-2 border-ink" : "border border-ink/30"
              }`}
            >
              {i < step ? "✓" : ""}
            </span>
            <span className={i === step ? "font-medium" : ""}>
              {label}
              {i === step && "…"}
            </span>
          </li>
        ))}
      </ol>
      <span className="sr-only">Vytvářím životopis, chvilku strpení.</span>
    </div>
  );
}
