import { createPdfHandler, verifyPaid } from "@/lib/pdf/handler";
import { renderCvPdf } from "@/lib/pdf/render";

export const POST = createPdfHandler({ verify: verifyPaid, render: renderCvPdf });
