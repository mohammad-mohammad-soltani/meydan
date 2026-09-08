import { Camera, Newspaper, Video } from "lucide-react";
import { PostAuthorInfo } from "./PostHeader";
import type { PostDetail, PostMediaKind } from "../types";

type PostContentProps = { post: PostDetail; };

const mediaIcons: Record<PostMediaKind, typeof Camera> = { image: Camera, video: Video, article: Newspaper };

export function PostContent({ post }: PostContentProps) {
  return <section className="space-y-4"><PostAuthorInfo author={post.author} /><span className="inline-flex rounded-md bg-brand-red/10 px-2 py-1 text-[10px] font-bold text-brand-red">{post.badge}</span><p className="text-sm leading-8 text-slate-800 dark:text-slate-200">{post.body}</p><div className="grid grid-cols-3 gap-2">{post.media.map((media) => { const Icon = mediaIcons[media.kind]; return <div key={media.id} className="flex h-24 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900"><Icon className={"mb-1 h-5 w-5 " + (media.kind === "video" ? "text-brand-red" : media.kind === "article" ? "text-blue-500" : "")} /><span>{media.label}</span></div>; })}</div></section>;
}