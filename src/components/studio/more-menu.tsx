"use client";

import { useEffect, useRef } from "react";

/**
 * "Další možnosti": rarely needed actions stay out of the way.
 * Native <details> (keyboard and screen reader friendly); closes on outside click / Esc.
 */
export function MoreMenu({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function onPointer(event: PointerEvent) {
      const el = ref.current;
      if (el?.open && !el.contains(event.target as Node)) el.open = false;
    }
    function onKey(event: KeyboardEvent) {
      const el = ref.current;
      if (event.key === "Escape" && el?.open) {
        el.open = false;
        el.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <details ref={ref} className="more-menu relative">
      <summary className="border-line hover:border-brand-strong flex min-h-10 cursor-pointer list-none items-center gap-1.5 rounded-full border bg-white px-4 text-sm font-medium transition [&::-webkit-details-marker]:hidden">
        Další možnosti <span aria-hidden className="more-caret text-xs transition">▾</span>
      </summary>
      <div
        className="border-line absolute right-0 z-30 mt-2 flex w-64 flex-col gap-1 rounded-2xl border bg-white p-2 shadow-[0_18px_40px_-12px_rgba(10,60,120,0.35)]"
        onClick={(e) => {
          // Close after picking an action.
          if ((e.target as HTMLElement).closest("button")) ref.current?.removeAttribute("open");
        }}
      >
        {children}
      </div>
    </details>
  );
}

export function MoreItem({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="hover:bg-brand-soft min-h-11 rounded-xl px-3 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
