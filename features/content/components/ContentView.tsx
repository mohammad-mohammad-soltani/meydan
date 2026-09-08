"use client";

import Link from "next/link";
import type { Route } from "next";
import { CalendarDays, MessageCircle, Mic, Printer, ShieldAlert } from "lucide-react";
import { ContentCard } from "./ContentCard";
import { ContentFilters } from "./ContentFilters";
import { ContentTabs } from "./ContentTabs";
import { useContent } from "../hooks/useContent";
import type { ContentItem, ContentQuickAction, ScheduleItem } from "../types";

const actionIcons = { speakers: Mic, contact: MessageCircle, print: Printer, safety: ShieldAlert };

export function ContentView({ items, scheduleItems, quickActions }: { items: ContentItem[]; scheduleItems: ScheduleItem[]; quickActions: ContentQuickAction[] }) {
  const content = useContent(items, scheduleItems, quickActions);
  const showingSchedule = content.selectedCategory === "schedule";

  return <section id="view-content" className="min-h-full space-y-5 bg-white p-4 dark:bg-[#070a0f]">
    <ContentTabs activeCategory={content.selectedCategory} onChange={content.setSelectedCategory} />
    {showingSchedule ? <section className="space-y-3"><div className="flex items-center justify-between"><h1 className="flex items-center gap-1.5 text-sm font-black text-slate-950 dark:text-white"><CalendarDays className="h-4 w-4 text-brand-red" />روزشمار تجمعات شبانه</h1><span className="text-[11px] font-bold text-brand-red">تمام ۴۰ شب</span></div><div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">{content.scheduleItems.map((item) => <button key={item.id} type="button" onClick={() => content.openPreview({ id: item.id, category: "schedule", status: item.current ? "urgent" : "ready", title: item.title, subtitle: item.night, description: item.description, media: { kind: "document", description: "جزئیات روزشمار" } })} className={"relative flex h-28 w-36 shrink-0 flex-col justify-between overflow-hidden rounded-xl border p-3 text-right " + (item.current ? "border-red-500 bg-gradient-to-br from-red-700 to-red-950 text-white" : "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-white")}><span className="text-[10px] font-bold">{item.night}</span><span className="absolute -top-1 left-2 text-3xl font-black opacity-15">{item.number}</span><span><strong className="block text-xs">{item.title}</strong><small className="mt-1 block text-[10px] opacity-75">{item.description}</small></span></button>)}</div></section> : <><ContentFilters activeFilter={content.selectedFilter} onChange={content.setSelectedFilter} /><div className="grid grid-cols-2 gap-2">{content.quickActions.map((action) => { const Icon = actionIcons[action.icon]; const card = <span className="flex min-h-20 flex-col justify-center rounded-2xl border border-slate-200 bg-slate-50 p-3 text-right transition hover:border-brand-red/40 dark:border-slate-800 dark:bg-slate-900/55"><Icon className="h-5 w-5 text-brand-red" /><strong className="mt-2 text-xs text-slate-900 dark:text-white">{action.label}</strong><small className="mt-1 text-[10px] text-slate-500">{action.detail}</small></span>; return action.href ? <Link key={action.id} href={action.href as Route}>{card}</Link> : <button key={action.id} type="button" onClick={() => content.openPreview({ id: action.id, category: "featured", status: "ready", title: action.label, subtitle: action.detail, description: action.detail, media: { kind: "document", description: action.detail } })}>{card}</button>; })}</div><div className="space-y-3">{content.isLoading ? <p className="text-sm text-slate-500">در حال دریافت محتوا…</p> : content.items.map((item) => <ContentCard key={item.id} item={item} onOpenPreview={() => content.openPreview(item)} />)}</div></>}</section>;
}
