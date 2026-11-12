"use client";

import type { TailorState } from "./use-tailor";

interface TailorPanelProps {
  state: TailorState;
  onRevert: () => void;
  onLetter: () => void;
}

/** "Inzerát chce / máš / chybí ti" – the missing part is only informative. */
export function TailorPanel({ state, onRevert, onLetter }: TailorPanelProps) {
  const { have, missing } = state.analysis;
  return (
    <section
      aria-labelledby="tailor-title"
      data-testid="tailor-panel"
      className="glass mx-auto mb-5 w-full max-w-[794px] rounded-3xl p-5 print:hidden"
    >
      <h3 id="tailor-title" className="font-display text-lg font-bold">
        <span aria-hidden>🎯 </span>Přizpůsobeno inzerátu
      </h3>
      <p className="text-muted mt-1 text-sm">
        Nahoru šly zkušenosti, odrážky a dovednosti, které inzerát chce. Nic nového jsme nepřidali.
      </p>
      {(have.length > 0 || missing.length > 0) && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold">Inzerát chce a máš</p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label="Máš">
              {have.length === 0 && <li className="text-muted text-sm">Nic z požadavků jsme v životopise nenašli.</li>}
              {have.map((item) => (
                <li key={item} className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-900">
                  <span aria-hidden>✓ </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {missing.length > 0 && (
            <div>
              <p className="text-sm font-semibold">Chybí ti (jen pro informaci)</p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label="Chybí ti">
                {missing.map((item) => (
                  <li key={item} className="rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-900">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRevert}
          className="border-line hover:border-brand-strong min-h-11 rounded-full border bg-white px-4 text-sm font-semibold transition"
        >
          ↩ Vrátit původní pořadí
        </button>
        <button
          type="button"
          onClick={onLetter}
          className="border-line hover:border-brand-strong min-h-11 rounded-full border bg-white px-4 text-sm font-semibold transition"
        >
          ✉️ Napsat dopis k tomuto inzerátu
        </button>
      </div>
    </section>
  );
}
