import { meydanApi } from "@/lib/meydan-api";
import { normalizeMentionQuery } from "./mentions";

export type MentionSuggestion = {
  id: number;
  handle: string;
  display_name: string;
  avatar_url?: string | null;
  verified: boolean;
  account_type: string;
  /** The viewer follows this account. */
  followed: boolean;
  followers: number;
};

/**
 * The composer's `@` autocomplete: with no prefix the accounts the viewer
 * follows (most followed first); with one, followed accounts that match
 * first, then everyone else whose handle starts with it. Five at most.
 */
export async function getMentionSuggestions(
  prefix: string,
  signal?: AbortSignal,
): Promise<MentionSuggestion[]> {
  const q = normalizeMentionQuery(prefix.replace(/^@/, "").trim());
  const data = await meydanApi<{ items?: MentionSuggestion[] }>(
    `/mentions/suggest?q=${encodeURIComponent(q)}`,
    { signal, suppressAuthRedirect: true },
  );
  return data?.items ?? [];
}
