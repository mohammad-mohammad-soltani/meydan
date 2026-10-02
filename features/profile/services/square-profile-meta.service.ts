import { compactFa, meydanApi } from "@/lib/meydan-api";
import type { ProfileDetails, ProfileStat } from "../types";

type ApiSquareMeta = {
  start_date?: string | null;
  stats?: {
    narratives?: number;
  };
};

type ApiMediaReflectionCount = {
  square_id: number;
  count: number;
};

export async function hydrateSquareProfileMeta(
  profile: ProfileDetails,
): Promise<ProfileDetails> {
  if (profile.accountType !== "square" || profile.metaHydrated) return profile;
  // Only squares have reflection stats and a start date.
  if (profile.kind && profile.kind !== "square") return profile;

  try {
    const [square, reflections] = await Promise.all([
      meydanApi<ApiSquareMeta>(`/squares/${profile.actorId}`),
      meydanApi<ApiMediaReflectionCount>(
        `/squares/${profile.actorId}/media-reflections/count`,
      ),
    ]);

    const stats: ProfileStat[] = [
      {
        value: compactFa(square.stats?.narratives ?? 0),
        label: "روایت منتشرشده",
      },
      {
        value: `${compactFa(reflections.count ?? 0)} روایت`,
        label: "بازتاب رسانه‌ای",
        tone: "success",
      },
    ];

    return {
      ...profile,
      startDate: square.start_date ?? undefined,
      squareStats: stats,
    };
  } catch {
    // هیچ مقدار ساختگی نمایش نده؛ در صورت خطای API آمار مخفی می‌شود.
    return {
      ...profile,
      squareStats: [],
    };
  }
}
