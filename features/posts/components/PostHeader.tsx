import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import type { PostAuthor } from "../types";

type PostHeaderProps = { author: PostAuthor; outlet: string; };

export function PostHeader({ author, outlet }: PostHeaderProps) {
  return <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-[#070a0f]/95"><div className="flex items-center gap-2"><Link href="/home" aria-label="بازگشت به خانه" className="text-slate-500 transition hover:text-brand-red"><ArrowRight className="h-5 w-5" /></Link><span className="text-sm font-bold text-slate-950 dark:text-white">روایت میدان</span></div><span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-500">{outlet}</span></header>;
}

export function PostAuthorInfo({ author }: { author: PostAuthor }) {
  return <div className="flex items-center gap-2.5"><div className="grid h-11 w-11 place-items-center rounded-full bg-brand-red text-xs font-black text-white">{author.initials}</div><div><div className="flex items-center gap-1"><strong className="text-sm text-slate-950 dark:text-white">{author.name}</strong>{author.verified ? <BadgeCheck className="h-4 w-4 fill-blue-500 text-white" /> : null}</div><span dir="ltr" className="text-[11px] text-slate-400">@{author.handle}</span></div></div>;
}