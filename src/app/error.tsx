"use client";

// retry() re-fetches the segment from the server (Next 16), so a passing server error can recover;
// reset() would only re-render the same failed result.
export default function Error({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="grid flex-1 place-items-center px-4 py-20 text-center">
      <div>
        <h1 className="font-display text-3xl font-semibold">Něco se pokazilo</h1>
        <p className="text-muted mt-2">Omlouváme se. Zkus to prosím znovu.</p>
        <button
          type="button"
          onClick={() => retry()}
          className="btn-primary mt-8 rounded-full px-6 py-3 font-semibold"
        >
          Zkusit znovu
        </button>
      </div>
    </main>
  );
}
