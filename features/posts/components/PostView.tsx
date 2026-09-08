"use client";

import { CommentsList } from "./CommentsList";
import { CommentInput } from "./CommentInput";
import { PostHeader } from "./PostHeader";
import { PostCard } from "@/features/feed/components/PostCard";
import { usePost } from "../hooks/usePost";
import type { FeedPost } from "@/features/feed/types";
import type { PostDetail } from "../types";

const mediaDetails = { image: "گزارش تصویری", video: "ویدیو", article: "سند و گزارش" } as const;
const noop = () => undefined;

function toFeedPost(post: PostDetail, commentCount: number): FeedPost {
  return {
    id: post.id,
    kind: "media",
    squareName: post.author.name,
    handle: post.author.handle,
    timeAgo: post.timeAgo,
    city: "تهران",
    badge: post.badge,
    title: post.author.name,
    body: post.body,
    attachments: post.media.map((media) => ({
      id: media.id,
      label: media.label,
      detail: media.detail ?? mediaDetails[media.kind],
      icon: media.kind,
      previewSrc: media.previewSrc,
      previewAlt: media.previewAlt
    })),
    stats: { likes: post.likes, reposts: post.reposts, comments: commentCount }
  };
}

export function PostView({ post }: { post: PostDetail }) {
  const state = usePost(post);
  const feedPost = toFeedPost(state.post, state.comments.length);

  return <section id="view-full-post" className="flex min-h-full flex-1 flex-col bg-white dark:bg-[#070a0f]"><PostHeader timeAgo={state.post.timeAgo} /><main className="flex-1 space-y-5"><PostCard variant="detail" post={feedPost} liked={state.liked} reposted={state.reposted} joined={false} onLike={state.toggleLike} onRepost={state.toggleRepost} onShare={() => void state.share()} onJoin={noop} onOpenMedia={noop} /><div className="space-y-5 px-4">{state.post.reflections.length ? <section className="space-y-2"><div className="flex items-center justify-between"><h2 className="text-xs font-bold text-slate-950 dark:text-white">بازتاب در خبرگزاری‌ها و مطبوعات</h2><span className="text-[10px] text-slate-400">کلیک برای مطالعه</span></div><div className="grid grid-cols-2 gap-2">{state.post.reflections.map((reflection) => <article key={reflection.id} className="min-h-28 rounded-xl border border-slate-200 p-3 dark:border-slate-800"><strong className="block text-[13px] font-extrabold leading-6 text-slate-950 dark:text-white">{reflection.outlet}</strong><p className="mt-2 line-clamp-3 text-[11px] leading-6 text-slate-500">{reflection.summary}</p></article>)}</div></section> : null}<CommentsList comments={state.comments} composer={<CommentInput value={state.commentDraft} onChange={state.setCommentDraft} onSubmit={state.submitComment} />}>{/* no children */}</CommentsList>{state.isLoading ? <p className="text-xs text-slate-500">در حال دریافت روایت…</p> : null}</div></main></section>;
}
