"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { meydanApi } from "@/lib/meydan-api";

type Participant = {
  id: string;
  type: "user" | "square";
  display_name: string;
  avatar_url?: string;
  verified?: boolean;
};

type Response = {
  items: Participant[];
  participant_count: number;
};

function actorId(value: string) {
  return Number(value.match(/(\d+)$/)?.[1] || 0);
}

export default function ParticipantsPage({ params }: { params: { initiativeId: string } }) {
  const [items, setItems] = useState<Participant[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void meydanApi<Response>(`/initiatives/${params.initiativeId}/participants`)
      .then((result) => {
        setItems(result.items || []);
        setCount(result.participant_count ?? result.items?.length ?? 0);
      })
      .finally(() => setLoading(false));
  }, [params.initiativeId]);

  return (
    <main dir="rtl" className="min-h-dvh bg-background px-4 py-5">
      <header className="mb-5 flex items-center gap-3 border-b border-divider pb-4">
        <Link href="/" className="grid h-10 w-10 place-items-center rounded-full hover:bg-hover">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-base font-black">افراد پیوسته به این کار خوب</h1>
          <p className="text-xs text-muted-foreground">{count.toLocaleString("fa-IR")} نفر</p>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground"><LoaderCircle className="animate-spin" /></div>
      ) : items.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">هنوز کسی نپیوسته است.</p>
      ) : (
        <div className="divide-y divide-divider rounded-2xl border border-border bg-card px-3">
          {items.map((item) => (
            <Link key={`${item.type}-${item.id}`} href={`/profile/${item.type}/${actorId(item.id)}`} className="flex items-center gap-3 py-3">
              {item.avatar_url ? <Image src={item.avatar_url} alt="" width={44} height={44} className="h-11 w-11 rounded-full object-cover" unoptimized /> : <span className="grid h-11 w-11 place-items-center rounded-full bg-muted font-black">{item.display_name[0]}</span>}
              <span className="flex-1 truncate text-sm font-bold">{item.display_name}</span>
              {item.verified ? <BadgeCheck className="h-5 w-5" /> : null}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
