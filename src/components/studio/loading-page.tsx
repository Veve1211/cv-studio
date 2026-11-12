"use client";

import { useEffect, useState } from "react";

export const LOADING_STEPS = ["Čtu tvůj text", "Hledám praxi a vzdělání", "Skládám životopis"] as const;

/** Skeleton A4 with time-based steps (no fake percentages). */
export function LoadingPage() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 3000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="mx-auto w-full max-w-[560px]" role="status" aria-live="polite">
      <ol className="mb-6 space-y-3" aria-label="Postup">
        {LOADING_STEPS.map((label, i) => {
          const state = i < step ? "done" : i === step ? "active" : "todo";
          return (
            <li
              key={label}
              data-state={state}
              className={`loading-step flex items-center gap-3 text-[15px] transition-all duration-500 ${
                state === "todo" ? "translate-x-1 opacity-40" : "translate-x-0 opacity-100"
              }`}
            >
              <span
                aria-hidden
                className={`relative grid size-7 place-items-center rounded-full text-xs font-bold transition-colors duration-500 ${
                  state === "done"
                    ? "bg-brand-strong text-white"
                    : state === "active"
                      ? "bg-brand text-ink"
                      : "border-line border bg-white"
                }`}
              >
                {state === "done" ? "✓" : i + 1}
                {state === "active" && <span className="loading-ping absolute inset-0 rounded-full" />}
              </span>
              <span className={state === "active" ? "font-semibold" : ""}>
                {label}
                {state === "active" && <span className="loading-dots" aria-hidden />}
              </span>
              {state === "active" && <span className="sr-only">(probíhá)</span>}
              {state === "done" && <span className="sr-only">(hotovo)</span>}
            </li>
          );
        })}
      </ol>
      <div className="relative aspect-[210/297] w-full overflow-hidden rounded-sm bg-white shadow-[0_24px_60px_rgba(10,60,120,0.12)]">
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
    </div>
  );
}
