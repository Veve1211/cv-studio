import { connection } from "next/server";
import { createHealthHandler } from "@/lib/health/handler";
import { renderCvPdf } from "@/lib/pdf/render";

const handler = createHealthHandler({ render: renderCvPdf });

export async function GET(request: Request) {
  await connection();
  return handler(request);
}
