import { NextRequest, NextResponse } from "next/server";
import { meydanApi } from "@/lib/meydan-api";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  try {
    if (q) {
      const results = await meydanApi<unknown>(`/explore/search?q=${encodeURIComponent(q)}`);
      return NextResponse.json({ data: results });
    }
    const [suggestions, trends] = await Promise.all([
      meydanApi<unknown>("/explore/suggestions"),
      meydanApi<unknown>("/explore/trends?window=24h"),
    ]);
    return NextResponse.json({ data: { suggestions, trends } });
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : "خطا در ارتباط با API میدان" } },
      { status: 502 },
    );
  }
}
