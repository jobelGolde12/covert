import { NextRequest, NextResponse } from "next/server";
import { publicCatalog, FORMATS } from "@/lib/conversions";
import { apiJson } from "@/lib/api";

export const dynamic = "force-dynamic";

/** GET /api/v1/formats — the conversion catalog (cacheable, 24h). */
export async function GET(_request: NextRequest) {
  return apiJson(
    {
      conversions: publicCatalog(),
      formats: FORMATS.map((f) => ({
        format: f.format,
        label: f.label,
        extensions: f.extensions,
        group: f.group,
      })),
    },
    { headers: { "Cache-Control": "public, max-age=86400" } }
  );
}
