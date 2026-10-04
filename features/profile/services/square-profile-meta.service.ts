import { compactFa, meydanApi } from "@/lib/meydan-api";
import { availableProfileStats, narrativeTotal } from "../profile-stats";
import type { ProfileDetails, ProfileStat } from "../types";

type ApiSquareMeta = { start_date?: string | null; stats?: { narratives?: number } };
type ApiMediaReflectionCount = { square_id: number; count: number };

export async function hydrateSquareProfileMeta(profile: ProfileDetails): Promise<ProfileDetails> {
  if (profile.accountType !== "square" || profile.metaHydrated) return profile;
  if (profile.kind && profile.kind !== "square") return profile;
  const [square, reflections] = await Promise.allSettled([
    meydanApi<ApiSquareMeta>(`/squares/${profile.actorId}`),
    meydanApi<ApiMediaReflectionCount>(`/squares/${profile.actorId}/media-reflections/count`),
  ]);
  const count = square.status === "fulfilled" ? narrativeTotal(square.value.stats?.narratives) : null;
  const reflectionCount = reflections.status === "fulfilled" ? narrativeTotal(reflections.value.count) : null;
  const stats: ProfileStat[] = profile.squareStats.filter((stat) => stat.label !== "روایت منتشرشده" && stat.label !== "بازتاب رسانه‌ای");
  stats.push(...availableProfileStats(count, reflectionCount, compactFa));
  return {
    ...profile,
    ...(square.status === "fulfilled" ? { startDate: square.value.start_date ?? undefined } : {}),
    ...(count !== null ? { narrativeCount: count } : {}),
    squareStats: stats,
  };
}
