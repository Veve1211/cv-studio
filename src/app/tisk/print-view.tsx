"use client";

import { useEffect, useState } from "react";
import { getTemplate } from "@/components/templates";
import pageStyles from "@/components/templates/page.module.css";
import { pageStyle } from "@/components/templates/page-style";
import { getAccent } from "@/components/templates/palette";
import { PRINT_GLOBAL, PrintDataSchema, type PrintData } from "@/lib/pdf/print-data";

export function PrintView() {
  const [data, setData] = useState<PrintData | null>(null);

  useEffect(() => {
    // Set by the headless browser before any script runs; never comes from a URL.
    const raw = (window as unknown as Record<string, unknown>)[PRINT_GLOBAL];
    const parsed = PrintDataSchema.safeParse(raw);
    if (!parsed.success) return;
    // Defer so the state update is not synchronous inside the effect.
    queueMicrotask(() => setData(parsed.data));
  }, []);

  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) document.documentElement.dataset.ready = "1";
    });
    return () => {
      cancelled = true;
    };
  }, [data]);

  if (!data) return null;
  const template = getTemplate(data.templateId);
  const accent = getAccent(data.accentId);
  return (
    <>
      {/^#[0-9a-f]{6}$/i.test(template.paper) && <style>{`@page { background: ${template.paper}; }`}</style>}
      <article
        id="cv-page"
        data-template={template.id}
        className={pageStyles.page}
        style={pageStyle(accent, template.paper)}
      >
        <template.Component cv={data.cv} />
      </article>
    </>
  );
}
