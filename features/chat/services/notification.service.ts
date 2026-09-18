import { meydanApi } from "@/lib/meydan-api";
import { mapApiNotification, type ApiNotificationLike } from "../chat-utils";
import type { ChatNotification } from "../types";

const MESSAGE_NOTIFICATION_TYPES = new Set(["message", "chat_message", "direct_message"]);

export async function getNotifications(): Promise<ChatNotification[]> {
  const items = await meydanApi<ApiNotificationLike[]>("/notifications");
  return items
    .filter((item) => !MESSAGE_NOTIFICATION_TYPES.has(String(item.type || "").toLowerCase()))
    .map(mapApiNotification);
}

export async function getUnreadNotificationCount(background = false): Promise<number> {
  const result = await meydanApi<{ count: number }>("/notifications/unread-count", { suppressAuthRedirect: background });
  return Math.max(0, Number(result.count || 0));
}

export async function markNotificationRead(notificationId: string): Promise<ChatNotification> {
  const item = await meydanApi<ApiNotificationLike>(`/notifications/${notificationId}/read`, {
    method: "PUT",
  });
  return mapApiNotification(item);
}

export async function markNotificationUnread(notificationId: string): Promise<ChatNotification> {
  const item = await meydanApi<ApiNotificationLike>(`/notifications/${notificationId}/read`, {
    method: "DELETE",
  });
  return mapApiNotification(item);
}

export async function markAllNotificationsRead(): Promise<void> {
  await meydanApi("/notifications/read-all", { method: "PUT" });
}

export async function archiveNotification(notificationId: string): Promise<void> {
  await meydanApi(`/notifications/${notificationId}/archive`, { method: "PUT" });
}
