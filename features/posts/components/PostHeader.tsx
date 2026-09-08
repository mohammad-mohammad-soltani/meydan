"use client";

import { useRouter } from "next/navigation";
import { generatedMedia } from "@/components/shared/generated-media";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import type { PostAuthor } from "../types";

type PostHeaderProps = { timeAgo: string; };

export function PostHeader({ timeAgo }: PostHeaderProps) {
  const router = useRouter();
  const handleBack = () => {
    document.getElementById("view-full-post")?.classList.add("route-page-exit");
    window.setTimeout(() => {
      if (window.history.length > 1) router.back();
      else router.push("/home");
    }, 180);
  };
  return <header className="sticky top-0 z-40 flex min-h-12 items-center justify-between border-b border-slate-200 bg-white/65 px-4 py-2 shadow-sm shadow-slate-200/20 backdrop-blur-xl dark:border-slate-800 dark:bg-[#070a0f]/65"><div className="flex min-w-0 items-center gap-2"><Link href="/home" onClick={(event) => { event.preventDefault(); handleBack(); }} aria-label="بازگشت به خانه" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-red dark:hover:bg-slate-900"><ArrowRight className="h-5 w-5" /></Link><span className="truncate text-sm font-bold text-slate-950 dark:text-white">رویداد</span></div><span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{timeAgo}</span></header>;
}

export function PostAuthorInfo({ author, badge }: { author: PostAuthor; badge: string }) {
  return <div className="flex items-center gap-2.5"><Image src={generatedMedia.avatarCoordinator} alt="" width={44} height={44} className="h-11 w-11 rounded-full object-cover" /><div className="flex min-w-0 flex-1 items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-1"><strong className="truncate text-sm text-slate-950 dark:text-white">{author.name}</strong>{author.verified ? <BadgeCheck className="h-4 w-4 shrink-0 fill-blue-500 text-white" /> : null}</div><span className="shrink-0 rounded-md bg-brand-red/10 px-2 py-1 text-[10px] font-bold text-brand-red">{badge}</span></div></div>;
}
