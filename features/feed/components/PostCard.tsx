import Link from "next/link";
import { BadgeCheck, BellRing, Bolt, Camera, FileText, Image as ImageIcon, Mic, Video } from "lucide-react";
import { PostActions } from "./PostActions";
import type { FeedAttachment, FeedPost } from "../types";

type PostCardProps = {
  post: FeedPost;
  liked: boolean;
  reposted: boolean;
  joined: boolean;
  onLike: () => void;
  onRepost: () => void;
  onShare: () => void;
  onJoin: () => void;
  onOpenMedia: () => void;
};

const attachmentIcons = {
  image: ImageIcon,
  video: Video,
  article: FileText,
  microphone: Mic,
  bolt: Bolt
};

function AttachmentCard({ attachment }: { attachment: FeedAttachment }) {
  const Icon = attachmentIcons[attachment.icon];
  return <div className="flex min-h-28 flex-1 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-900/80"><Icon className="mb-2 h-7 w-7 text-brand-red" /><strong className="text-xs text-slate-800 dark:text-slate-100">{attachment.label}</strong><span className="mt-1 text-[10px] text-slate-500">{attachment.detail}</span></div>;
}

export function PostCard({ post, liked, reposted, joined, onLike, onRepost, onShare, onJoin, onOpenMedia }: PostCardProps) {
  return (
    <article className="feed-item px-3 py-4 sm:px-4 sm:py-5">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-red text-sm font-black text-white">{post.city.slice(0, 2)}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link href="/profile" className="text-sm font-black text-slate-950 transition hover:text-brand-red dark:text-white">{post.squareName}</Link>
            <BadgeCheck aria-label="حساب تأییدشده" className="h-4 w-4 fill-blue-500 text-white" />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500"><span dir="ltr">@{post.handle}</span><span>{post.timeAgo}</span></div>
          <span className="mt-2 inline-flex rounded-md bg-brand-red/10 px-2 py-1 text-[10px] font-bold text-brand-red">{post.badge}</span>
        </div>
      </div>

      <Link href={"/posts/" + post.id} className="mt-3 block"><h2 className="text-base font-black leading-7 text-slate-950 dark:text-white">{post.title}</h2><p className="mt-2 text-sm leading-8 text-slate-600 dark:text-slate-300">{post.body}</p></Link>

      <div className="mt-4 flex gap-3">{post.attachments.map((attachment) => <AttachmentCard key={attachment.id} attachment={attachment} />)}</div>

      {post.mediaReflection ? <button type="button" onClick={onOpenMedia} className="mt-3 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right transition hover:border-brand-red/50 dark:border-slate-800 dark:bg-slate-900/70"><span className="flex min-w-0 items-center gap-2"><Camera className="h-5 w-5 shrink-0 text-brand-red" /><span className="text-xs text-slate-600 dark:text-slate-300">{post.mediaReflection.headline}</span></span><span className="shrink-0 text-xs font-black text-blue-500">مشاهده خبر</span></button> : null}

      {post.callToAction ? <button type="button" onClick={onJoin} className={"mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black transition " + (joined ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" : "border-amber-400/30 bg-amber-400/10 text-amber-600")}><BellRing className="h-4 w-4" />{joined ? "به این ابتکار پیوستید" : post.callToAction}</button> : null}

      <PostActions postId={post.id} likes={post.stats.likes} comments={post.stats.comments} reposts={post.stats.reposts} liked={liked} reposted={reposted} onLike={onLike} onRepost={onRepost} onShare={onShare} />
    </article>
  );
}
