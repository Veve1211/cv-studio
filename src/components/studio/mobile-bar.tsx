"use client";

export type MobileView = "text" | "preview";

interface MobileBarProps {
  view: MobileView;
  onView: (view: MobileView) => void;
  hasCv: boolean;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
}

/** Bottom bar on phones: everything important within thumb reach. Hidden on desktop. */
export function MobileBar({ view, onView, hasCv, primaryLabel, onPrimary, primaryDisabled }: MobileBarProps) {
  return (
    <nav
      aria-label="Ovládání na mobilu"
      className="border-line fixed inset-x-0 bottom-0 z-40 border-t bg-white/90 px-3 pt-2.5 backdrop-blur-xl lg:hidden print:hidden"
      style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-xl items-center gap-2">
        <div role="group" aria-label="Zobrazit" className="bg-brand-soft flex shrink-0 rounded-full p-1">
          {(
            [
              ["text", "Text"],
              ["preview", "Náhled"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              onClick={() => onView(id)}
              disabled={id === "preview" && !hasCv && view !== "preview"}
              className={`min-h-11 rounded-full px-4 text-sm font-semibold transition disabled:opacity-40 ${
                view === id ? "text-ink bg-white shadow-sm" : "text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onPrimary}
          disabled={primaryDisabled}
          className="btn-primary min-h-11 flex-1 rounded-full px-4 text-[15px] font-semibold disabled:opacity-60"
        >
          {primaryLabel}
        </button>
      </div>
    </nav>
  );
}

export function ZoomControls({ zoom, onZoom }: { zoom: number; onZoom: (zoom: number) => void }) {
  const levels = [1, 1.5, 2];
  return (
    <div role="group" aria-label="Přiblížení náhledu" className="mb-3 flex items-center justify-end gap-1 lg:hidden print:hidden">
      <span className="text-muted mr-1 text-xs">Přiblížení</span>
      {levels.map((level) => (
        <button
          key={level}
          type="button"
          aria-pressed={zoom === level}
          onClick={() => onZoom(level)}
          className={`min-h-11 min-w-11 rounded-full px-3 text-sm font-semibold transition ${
            zoom === level ? "bg-ink text-white" : "border-line border bg-white"
          }`}
        >
          {level === 1 ? "Celá" : `${level}×`}
        </button>
      ))}
    </div>
  );
}
