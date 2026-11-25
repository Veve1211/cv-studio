/** The A4 placeholder before the first CV is created. */
export function EmptyPreview() {
  return (
    <div className="mx-auto w-full max-w-[560px]">
      <div className="border-line grid aspect-[210/297] w-full place-items-center rounded-sm border-2 border-dashed bg-white/50 p-8 text-center">
        <div>
          <p className="font-display text-2xl">Tady se objeví tvůj životopis</p>
          <p className="text-muted mt-2 text-sm">Napiš o sobě pár vět, nebo klikni na „Ukázka“.</p>
        </div>
      </div>
    </div>
  );
}
