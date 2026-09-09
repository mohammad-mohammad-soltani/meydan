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

  return (
    <section id="view-content" className="min-h-full space-y-5 bg-background p-4 text-foreground">
      <ContentTabs activeCategory={content.selectedCategory} onChange={content.setSelectedCategory} />
      {showingSchedule ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between"><h1 className="flex items-center gap-1.5 text-sm font-black text-foreground"><CalendarDays className="h-4 w-4 text-brand" />روزشمار تجمعات شبانه</h1><span className="text-[11px] font-bold text-brand">تمام ۴۰ شب</span></div>
          <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
            {content.scheduleItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => content.openPreview({ id: item.id, category: "schedule", status: item.current ? "urgent" : "ready", title: item.title, subtitle: item.night, description: item.description, media: { kind: "document", description: "جزئیات روزشمار" } })}
                className={`relative flex h-28 w-36 shrink-0 flex-col justify-between overflow-hidden rounded-card border p-3 text-right transition-colors ${item.current ? "border-brand-border bg-brand text-brand-foreground" : "border-border bg-surface-muted text-foreground-secondary hover:bg-hover"}`}
              >
                <span className="text-[10px] font-bold">{item.night}</span><span className="absolute -top-1 left-2 text-3xl font-black opacity-15">{item.number}</span><span><strong className="block text-xs">{item.title}</strong><small className="mt-1 block text-[10px] opacity-75">{item.description}</small></span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <>
          <ContentFilters activeFilter={content.selectedFilter} onChange={content.setSelectedFilter} />
          <div className="grid grid-cols-2 gap-2">
            {content.quickActions.map((action) => {
              const Icon = actionIcons[action.icon];
              const card = <span className="flex min-h-20 flex-col justify-center rounded-card border border-border bg-surface-muted p-3 text-right transition-colors hover:border-brand-border hover:bg-hover"><Icon className="h-5 w-5 text-brand" /><strong className="mt-2 text-xs text-foreground">{action.label}</strong><small className="mt-1 text-[10px] text-muted-foreground">{action.detail}</small></span>;
              return action.href ? <Link key={action.id} href={action.href as Route}>{card}</Link> : <button key={action.id} type="button" onClick={() => content.openPreview({ id: action.id, category: "featured", status: "ready", title: action.label, subtitle: action.detail, description: action.detail, media: { kind: "document", description: action.detail } })}>{card}</button>;
            })}
          </div>
          <div className="space-y-3">{content.isLoading ? <p className="text-sm text-muted-foreground">در حال دریافت محتوا…</p> : content.items.map((item) => <ContentCard key={item.id} item={item} onOpenPreview={() => content.openPreview(item)} />)}</div>
        </>
      )}
    </section>
  );
}
