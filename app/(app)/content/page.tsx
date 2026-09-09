import { ContentView } from "@/features/content/components/ContentView";
import { getContentItems, getContentQuickActions, getScheduleItems } from "@/features/content/services/content.service";

export default function ContentPage() {
  return <ContentView items={getContentItems()} scheduleItems={getScheduleItems()} quickActions={getContentQuickActions()} />;
}
