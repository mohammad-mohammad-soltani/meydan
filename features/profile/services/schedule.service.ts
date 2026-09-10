import { meydanApi } from "@/lib/meydan-api";

export async function createScheduleItem(input: { title: string; time: string }): Promise<{ id?: number | string }> {
  // Users enter only HH:MM; prepend today's date so the backend
  // stores a valid datetime while the UI remains time-only.
  const today = new Date().toISOString().slice(0, 10);
  const starts_at = `${today}T${input.time}:00`;

  return meydanApi<{ id?: number | string }>("/me/square/schedule", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: input.title, starts_at }),
  });
}

export async function deleteScheduleItem(id: string): Promise<void> {
  await meydanApi(`/me/square/schedule/${id}`, { method: "DELETE" });
}

export async function reorderScheduleItems(ids: string[]): Promise<void> {
  await meydanApi("/me/square/schedule/order", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ schedule_ids: ids }),
  });
}
