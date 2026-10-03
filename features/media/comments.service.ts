import { meydanApi, meydanApiPage } from "@/lib/meydan-api";
import { actorKindOf, publicProfileHref } from "@/lib/profile-route";

type ApiActor = { id?: string; type?: string; display_name?: string; handle?: string; avatar_url?: string | null; verified?: boolean };
type ApiComment = {
  id: number;
  author?: ApiActor | null;
  body: string;
  parent_id?: number | null;
  reply_count?: number;
  likes?: number;
  viewer_state?: { liked?: boolean } | null;
  created_at?: string | null;
};

export type ReelComment = {
  id: number;
  parentId: number | null;
  name: string;
  profileHref: string;
  avatarUrl?: string;
  verified: boolean;
  body: string;
  createdAt?: string;
  likes: number;
  liked: boolean;
  replyCount: number;
  /** Written by the viewer in this session; shown with «· شما». */
  mine?: boolean;
};

function toComment(row: ApiComment, mine = false): ReelComment {
  const actorId = String(row.author?.id ?? "").match(/(\d+)$/)?.[1] ?? "";
  return {
    id: row.id,
    parentId: row.parent_id ?? null,
    name: row.author?.display_name || "کاربر میدان",
    profileHref: actorId ? publicProfileHref(actorKindOf(row.author?.type), actorId, row.author?.handle) : "/",
    avatarUrl: row.author?.avatar_url || undefined,
    verified: Boolean(row.author?.verified),
    body: row.body,
    createdAt: row.created_at ?? undefined,
    likes: row.likes ?? 0,
    liked: Boolean(row.viewer_state?.liked),
    replyCount: row.reply_count ?? 0,
    mine,
  };
}

export async function listComments(postId: string, cursor?: string | null): Promise<{ items: ReelComment[]; nextCursor: string | null }> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const page = await meydanApiPage<ApiComment[]>(`/narratives/${postId}/comments${query}`);
  return { items: (page.data ?? []).map((row) => toComment(row)), nextCursor: page.nextCursor };
}

export async function listReplies(commentId: number): Promise<ReelComment[]> {
  const page = await meydanApiPage<ApiComment[]>(`/comments/${commentId}/replies`);
  return (page.data ?? []).map((row) => toComment(row));
}

export async function postComment(postId: string, body: string, parentId?: number | null): Promise<ReelComment> {
  const row = await meydanApi<ApiComment>(`/narratives/${postId}/comments`, {
    method: "POST",
    headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
    body: JSON.stringify({ body, ...(parentId ? { parent_id: parentId } : {}) }),
  });
  return toComment(row, true);
}

export async function setCommentLike(commentId: number, liked: boolean): Promise<{ liked: boolean; likes: number }> {
  return meydanApi<{ liked: boolean; likes: number }>(`/comments/${commentId}/like`, { method: liked ? "PUT" : "DELETE" });
}
