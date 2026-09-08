"use client";

import { CommentsList } from "./CommentsList";
import { CommentInput } from "./CommentInput";
import { PostActions } from "./PostActions";
import { PostContent } from "./PostContent";
import { PostHeader } from "./PostHeader";
import { usePost } from "../hooks/usePost";
import type { PostDetail } from "../types";

export function PostView({ post }: { post: PostDetail }) {
  const state = usePost(post);
  return <section id="view-full-post" className="flex min-h-full flex-1 flex-col bg-white dark:bg-[#070a0f]"><PostHeader author={state.post.author} outlet={state.post.outlet} /><main className="flex-1 space-y-5 p-4"><PostContent post={state.post} /><PostActions likes={state.counts.likes} reposts={state.counts.reposts} comments={state.counts.comments} liked={state.liked} reposted={state.reposted} isLiveJoined={state.isLiveJoined} onLike={state.toggleLike} onRepost={state.toggleRepost} onShare={() => void state.share()} onJoinLive={state.joinLive} />{state.post.reflections.length ? <section className="space-y-2"><div className="flex items-center justify-between"><h2 className="text-xs font-bold text-slate-950 dark:text-white">بازتاب در خبرگزاری‌ها و مطبوعات</h2><span className="text-[10px] text-slate-400">کلیک برای مطالعه</span></div><div className="grid grid-cols-2 gap-2">{state.post.reflections.map((reflection) => <article key={reflection.id} className="rounded-xl border border-slate-200 p-2.5 dark:border-slate-800"><strong className="block truncate text-[11px] text-slate-950 dark:text-white">{reflection.outlet}</strong><p className="mt-1 line-clamp-2 text-[9px] leading-5 text-slate-500">{reflection.summary}</p></article>)}</div></section> : null}<CommentsList comments={state.comments} composer={<CommentInput value={state.commentDraft} onChange={state.setCommentDraft} onSubmit={state.submitComment} />}>{/* no children */}</CommentsList>{state.isLoading ? <p className="text-xs text-slate-500">در حال دریافت روایت…</p> : null}</main></section>;
}
