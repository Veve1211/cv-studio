"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid flex-1 place-items-center px-4 py-20 text-center">
      <div>
        <h1 className="font-display text-3xl font-semibold">Něco se pokazilo</h1>
        <p className="text-muted mt-2">Omlouváme se. Zkus to prosím znovu.</p>
        <button
          type="button"
          onClick={reset}
          className="btn-primary mt-8 rounded-full px-6 py-3 font-semibold"
        >
          Zkusit znovu
        </button>
      </div>
    </main>
  );
}
