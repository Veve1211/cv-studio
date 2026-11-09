"use client";

export interface NextStep {
  id: string;
  icon: string;
  title: string;
  /** One sentence: what it does. */
  text: string;
  action: string;
  onClick: () => void;
  busy?: boolean;
}

/** Clear cards under the finished CV: one sentence each, one button each. */
export function NextSteps({ steps }: { steps: NextStep[] }) {
  if (steps.length === 0) return null;
  return (
    <section aria-labelledby="next-steps-title" className="mx-auto mt-8 w-full max-w-[794px] print:hidden">
      <h3 id="next-steps-title" className="font-display text-xl font-bold tracking-tight">
        Co dál?
      </h3>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step) => (
          <li
            key={step.id}
            data-testid={`next-${step.id}`}
            className="glass flex flex-col gap-2 rounded-3xl p-5"
          >
            <p className="font-display flex items-center gap-2 text-lg font-bold">
              <span aria-hidden>{step.icon}</span>
              {step.title}
            </p>
            <p className="text-muted flex-1 text-sm leading-relaxed">{step.text}</p>
            <button
              type="button"
              onClick={step.onClick}
              disabled={step.busy}
              className="border-line hover:border-brand-strong mt-1 min-h-11 rounded-full border bg-white px-4 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-60"
            >
              {step.action}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
