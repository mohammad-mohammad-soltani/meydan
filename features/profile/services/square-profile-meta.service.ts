import { compactFa, meydanApi } from "@/lib/meydan-api";
import type { ProfileDetails, ProfileStat } from "../types";

type ApiSquareMeta = {
  start_date?: string | null;
  stats?: {
    narratives?: number;
  };
};

export async function hydrateSquareProfileMeta(
  profile: ProfileDetails,
): Promise<ProfileDetails> {
  if (profile.accountType !== "square") return profile;

  try {
    // The reflection count was already read while building the profile, so it
    // is reused instead of running the same heavy query a second time.
    const square = await meydanApi<ApiSquareMeta>(`/squares/${profile.actorId}`);

    const stats: ProfileStat[] = [
      {
        value: compactFa(square.stats?.narratives ?? 0),
        label: "روایت منتشرشده",
      },
      profile.squareStats[1] ?? {
        value: `${compactFa(0)} روایت`,
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
