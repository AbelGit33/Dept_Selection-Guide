import { NextResponse } from "next/server";
import { getAllMarketData } from "@/lib/market/provider";
import { DEPARTMENTS } from "@/lib/data/departments";
import { DEMAND_INDEX_NOTE } from "@/lib/market/reference";

export const revalidate = 43_200;

/**
 * Live department market intelligence.
 *
 * GET /api/market            -> every department
 * GET /api/market?ids=a,b    -> only the requested departments
 *
 * `source` is reported as "live" only when the BLS OEWS series for that
 * department's occupations actually returned usable values; otherwise the
 * response says so explicitly rather than implying freshness it does not have.
 *
 * PRIVACY: this endpoint receives no student data of any kind. The scoring that
 * depends on a transcript runs in the browser.
 */
export async function GET(request: Request) {
  const started = Date.now();

  try {
    const url = new URL(request.url);
    const idsParam = url.searchParams.get("ids");
    const requested = idsParam
      ? idsParam
          .split(",")
          .map((s) => s.trim())
          .filter((s) => DEPARTMENTS.some((d) => d.id === s))
      : null;

    const all = await getAllMarketData();
    const data = requested ? all.filter((d) => requested.includes(d.departmentId)) : all;

    const counts = data.reduce<Record<string, number>>((acc, d) => {
      acc[d.snapshot.source] = (acc[d.snapshot.source] ?? 0) + 1;
      return acc;
    }, {});

    return NextResponse.json(
      {
        ok: true,
        generatedAt: new Date().toISOString(),
        elapsedMs: Date.now() - started,
        scope: requested ? requested.length : data.length,
        sourceCounts: counts,
        note: DEMAND_INDEX_NOTE,
        departments: data.map((d) => ({ id: d.departmentId, ...d.snapshot, drivers: d.drivers })),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Market data unavailable",
        generatedAt: new Date().toISOString(),
      },
      { status: 502 },
    );
  }
}