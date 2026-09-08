"use client";

import { useRouter } from "next/navigation";
import { generatedMedia } from "@/components/shared/generated-media";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import type { PostAuthor } from "../types";

type PostHeaderProps = { author: PostAuthor; outlet: string; };

export function PostHeader({ author, outlet }: PostHeaderProps) {
  const router = useRouter();
  const handleBack = () => {
    document.getElementById("view-full-post")?.classList.add("route-page-exit");
    window.setTimeout(() => {
      if (window.history.length > 1) router.back();
      else router.push("/home");
    }, 180);
  };
  return <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-[#070a0f]/95"><div className="flex min-w-0 items-center gap-2"><Link href="/home" onClick={(event) => { event.preventDefault(); handleBack(); }} aria-label="بازگشت به خانه" className="text-slate-500 transition hover:text-brand-red"><ArrowRight className="h-5 w-5" /></Link><span className="truncate text-sm font-bold text-slate-950 dark:text-white">{author.name}</span></div><span className="shrink-0 rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-500">{outlet}</span></header>;
}

export function PostAuthorInfo({ author, badge }: { author: PostAuthor; badge: string }) {
  return <div className="flex items-center gap-2.5"><Image src={generatedMedia.avatarCoordinator} alt="" width={44} height={44} className="h-11 w-11 rounded-full object-cover" /><div className="flex min-w-0 flex-1 items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-1"><strong className="truncate text-sm text-slate-950 dark:text-white">{author.name}</strong>{author.verified ? <BadgeCheck className="h-4 w-4 shrink-0 fill-blue-500 text-white" /> : null}</div><span className="shrink-0 rounded-md bg-brand-red/10 px-2 py-1 text-[10px] font-bold text-brand-red">{badge}</span></div></div>;
}
