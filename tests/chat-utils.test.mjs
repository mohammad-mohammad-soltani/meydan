import test from "node:test";
import assert from "node:assert/strict";
import * as chatUtils from "../features/chat/chat-utils.ts";
import {
  chatContactHref,
  classifyChatAttachment,
  collectConversationSharedItems,
  filterChatMessages,
  participantProfileHref,
} from "../features/chat/chat-utils.ts";

test("classifies persisted chat attachments by MIME type", () => {
  assert.equal(classifyChatAttachment({ mimeType: "image/jpeg" }), "image");
  assert.equal(classifyChatAttachment({ mimeType: "video/mp4" }), "video");
  assert.equal(classifyChatAttachment({ mimeType: "audio/ogg" }), "audio");
  assert.equal(classifyChatAttachment({ mimeType: "application/pdf" }), "file");
});

test("searches message text and attachment names case-insensitively", () => {
  const messages = [
    { id: "1", body: "سلام میدان", attachment: undefined },
    { id: "2", body: "", attachment: { name: "Report.PDF", mimeType: "application/pdf" } },
  ];
  assert.deepEqual(filterChatMessages(messages, "میدان").map((message) => message.id), ["1"]);
  assert.deepEqual(filterChatMessages(messages, "report").map((message) => message.id), ["2"]);
});

test("collects telegram-style Media, Files and Links without stories", () => {
  const messages = [
    { id: "1", body: "https://meydan.example/post", attachment: { id: "11", name: "photo.jpg", mimeType: "image/jpeg", url: "https://cdn.example/photo.jpg" } },
    { id: "2", body: "", attachment: { id: "12", name: "voice.ogg", mimeType: "audio/ogg", url: "https://cdn.example/voice.ogg" } },
    { id: "3", body: "", attachment: { id: "13", name: "doc.pdf", mimeType: "application/pdf", url: "https://cdn.example/doc.pdf" } },
  ];
  const shared = collectConversationSharedItems(messages);
  assert.deepEqual(shared.media.map((item) => item.id), ["1"]);
  assert.deepEqual(shared.files.map((item) => item.id), ["2", "3"]);
  assert.deepEqual(shared.links.map((item) => item.url), ["https://meydan.example/post"]);
  assert.equal("stories" in shared, false);
});

test("builds the real Meydan user profile route", () => {
  assert.equal(participantProfileHref({ id: "42" }), "/profile/user/42");
});

test("builds a dedicated full-screen contact page inside the conversation", () => {
  assert.equal(chatContactHref("123"), "/chat/123/info");
});

test("maps backend notifications into unread UI notifications with actor and deep link", () => {
  assert.equal(typeof chatUtils.mapApiNotification, "function");
  const notification = chatUtils.mapApiNotification({
    id: 91,
    type: "comment_reply",
    title: "پاسخ جدید",
    body: "علی به نظر شما پاسخ داد.",
    created_at: "2026-09-12T10:30:00Z",
    read_at: null,
    deep_link: "/posts/17#comment-91",
    actor: { id: "user_8", type: "user", numeric_id: 8, display_name: "علی", avatar_url: "https://cdn.example/avatar.jpg", verified: false },
  });
  assert.equal(notification.id, "91");
  assert.equal(notification.kind, "comment");
  assert.equal(notification.unread, true);
  assert.equal(notification.targetUrl, "/posts/17#comment-91");
  assert.equal(notification.actor?.name, "علی");
});

test("supports non-message social notification kinds including good-work joins and system notices", () => {
  assert.equal(typeof chatUtils.notificationKind, "function");
  assert.equal(chatUtils.notificationKind("like"), "like");
  assert.equal(chatUtils.notificationKind("repost"), "repost");
  assert.equal(chatUtils.notificationKind("comment"), "comment");
  assert.equal(chatUtils.notificationKind("comment_reply"), "comment");
  assert.equal(chatUtils.notificationKind("mention"), "mention");
  assert.equal(chatUtils.notificationKind("follow"), "follow");
  assert.equal(chatUtils.notificationKind("initiative_join"), "initiative");
  assert.equal(chatUtils.notificationKind("admin_notice"), "system");
});

test("merges realtime notifications without duplicates and preserves newest first", () => {
  assert.equal(typeof chatUtils.mergeNotification, "function");
  const current = [
    { id: "1", kind: "like", title: "قدیمی", description: "", createdAt: "۱۰:۰۰", unread: true },
  ];
  const next = { id: "2", kind: "follow", title: "جدید", description: "", createdAt: "۱۰:۰۱", unread: true };
  assert.deepEqual(chatUtils.mergeNotification(current, next).map((item) => item.id), ["2", "1"]);
  assert.equal(chatUtils.mergeNotification([next, ...current], next).length, 2);
});

test("realtime notification events request an API refresh so actor/read metadata is authoritative", () => {
  assert.equal(typeof chatUtils.shouldRefreshNotificationFromApi, "function");
  assert.equal(chatUtils.shouldRefreshNotificationFromApi({ id: "4", actor: undefined, unread: true }), true);
  assert.equal(chatUtils.shouldRefreshNotificationFromApi({ id: "4", actor: { id: "8" }, unread: true }), false);
});
