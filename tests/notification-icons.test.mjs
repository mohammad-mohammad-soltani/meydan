import test from "node:test";
import assert from "node:assert/strict";
import * as chatUtils from "../features/chat/chat-utils.ts";

test("maps the backend notification icon URL into the UI model", () => {
  const notification = chatUtils.mapApiNotification({
    id: 101,
    type: "system",
    title: "اعلان سیستم",
    body: "یک اعلان جدید",
    icon_url: "https://cdn.example/system-icon.png",
    created_at: "2026-09-15T10:30:00Z",
    read_at: null,
  });

  assert.equal(notification.iconUrl, "https://cdn.example/system-icon.png");
});

test("prefers the actor avatar and falls back to the uploaded template icon", () => {
  assert.equal(typeof chatUtils.notificationVisualUrl, "function");

  const iconOnly = chatUtils.mapApiNotification({
    id: 102,
    type: "speaker_request_created",
    title: "درخواست سخنران",
    body: "درخواست ثبت شد",
    icon_url: "https://cdn.example/speaker-request.png",
    actor: { id: "user_5", type: "user", numeric_id: 5, display_name: "کاربر بدون آواتار", avatar_url: "" },
  });
  assert.equal(chatUtils.notificationVisualUrl(iconOnly), "https://cdn.example/speaker-request.png");

  const withAvatar = chatUtils.mapApiNotification({
    id: 103,
    type: "like",
    title: "پسند جدید",
    body: "روایت شما پسندیده شد",
    icon_url: "https://cdn.example/like.png",
    actor: { id: "user_6", type: "user", numeric_id: 6, display_name: "کاربر", avatar_url: "https://cdn.example/avatar.jpg" },
  });
  assert.equal(chatUtils.notificationVisualUrl(withAvatar), "https://cdn.example/avatar.jpg");
});
