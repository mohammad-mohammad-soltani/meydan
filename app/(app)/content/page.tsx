import { ContentView } from "@/features/content/components/ContentView";
import { getContentItems, getContentQuickActions, getScheduleItems } from "@/features/content/services/content.service";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const [items, scheduleItems, quickActions] = await Promise.all([
    getContentItems(),
    getScheduleItems(),
    getContentQuickActions(),
  ]);
  return <ContentView items={items} scheduleItems={scheduleItems} quickActions={quickActions} />;
}
