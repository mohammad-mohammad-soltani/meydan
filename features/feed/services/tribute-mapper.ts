import type { TributeTarget } from "../types";

/** The compact memorial card the API attaches to a «ادای احترام» post. */
export type ApiTribute = {
  id: number;
  unavailable?: boolean;
  name?: string;
  handle?: string;
  avatar_url?: string;
  position?: string;
  death_date?: string;
} | null;

/** `undefined` for a post that honours nobody. */
export function mapTribute(item: ApiTribute | undefined): TributeTarget | undefined {
  if (!item || !item.id) return undefined;
  return {
    memorialId: Number(item.id),
    unavailable: Boolean(item.unavailable),
    name: item.name || "",
    handle: item.handle || "",
    avatarUrl: item.avatar_url || undefined,
    position: item.position || undefined,
    deathDate: item.death_date || undefined,
  };
}
