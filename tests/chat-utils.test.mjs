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
  assert.equal(participantProfileHref({ id: "42" }), "/users/user/42");
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

test("builds a real actor sentence for every user-generated notification type", () => {
  const { getNotificationPresentation } = chatUtils;
  assert.equal(typeof getNotificationPresentation, "function");

  const base = { id: "1", kind: "like", createdAt: "", unread: false, description: "", title: "عنوان ذخیره‌شده" };
  const actor = { id: "9", name: "محمد محمد سلطانی", handle: "", avatarLabel: "مح", avatarTone: "slate", avatarUrl: "https://cdn.example/m.jpg" };

  const cases = [
    ["like", "محمد محمد سلطانی روایت شما را پسندید"],
    ["repost", "محمد محمد سلطانی روایت شما را بازنشر کرد"],
    ["follow", "محمد محمد سلطانی شما را دنبال کرد"],
    ["comment", "محمد محمد سلطانی روی روایت شما نظر گذاشت"],
    ["comment_reply", "محمد محمد سلطانی به نظر شما پاسخ داد"],
    ["mention", "محمد محمد سلطانی شما را در یک روایت نام برد"],
    ["initiative_join", "محمد محمد سلطانی به کار خوب شما ملحق شد"],
  ];

  for (const [rawType, expected] of cases) {
    const presentation = getNotificationPresentation({ ...base, rawType, actor });
    assert.equal(presentation.title, expected, `${rawType} title`);
    assert.equal(presentation.isSystem, false, `${rawType} must not be system-styled`);
    assert.equal(presentation.avatarUrl, "https://cdn.example/m.jpg", `${rawType} avatar`);
  }
});

test("never renders generic stored copy for a typed user notification", () => {
  const { getNotificationPresentation } = chatUtils;
  // Legacy rows stored «اعلان میدان»; the type must win over that stale text.
  const presentation = getNotificationPresentation({
    id: "5",
    kind: "like",
    rawType: "like",
    title: "اعلان میدان",
    description: "رویداد جدیدی در میدان ثبت شد.",
    createdAt: "",
    unread: true,
    actor: { id: "9", name: "علی رضایی", handle: "", avatarLabel: "عل", avatarTone: "slate" },
  });
  assert.equal(presentation.title, "علی رضایی روایت شما را پسندید");
  assert.notEqual(presentation.title, "اعلان میدان");
  assert.equal(presentation.description, "");
});

test("keeps actor-less system notices in system style with their own body", () => {
  const { getNotificationPresentation } = chatUtils;
  const presentation = getNotificationPresentation({
    id: "7",
    kind: "system",
    rawType: "admin_notice",
    title: "پیام میدان",
    description: "برنامه جدید",
    createdAt: "",
    unread: false,
  });
  assert.equal(presentation.isSystem, true);
  assert.equal(presentation.title, "پیام میدان");
  assert.equal(presentation.description, "برنامه جدید");
  assert.equal(presentation.avatarUrl, undefined);
});

test("renders actor-less self-contained notices instead of falling back to «اعلان میدان»", () => {
  const { getNotificationPresentation } = chatUtils;
  // square_verified has no {actor} placeholder, so a missing actor is fine.
  const presentation = getNotificationPresentation({
    id: "11",
    kind: "system",
    rawType: "square_verified",
    title: "اعلان میدان",
    description: "رویداد جدیدی در میدان ثبت شد.",
    createdAt: "",
    unread: false,
  });
  assert.equal(presentation.title, "میدان شما تأیید شد");
  assert.notEqual(presentation.title, "اعلان میدان");
  // The legacy boilerplate body must be suppressed, not repeated under the title.
  assert.equal(presentation.description, "");
});

test("hides legacy generic body on social notifications", () => {
  const { getNotificationPresentation } = chatUtils;
  const presentation = getNotificationPresentation({
    id: "12",
    kind: "like",
    rawType: "like",
    title: "اعلان میدان",
    description: "رویداد جدیدی در میدان ثبت شد.",
    createdAt: "",
    unread: true,
    actor: { id: "9", name: "علی رضایی", handle: "", avatarLabel: "عل", avatarTone: "slate" },
  });
  assert.equal(presentation.title, "علی رضایی روایت شما را پسندید");
  assert.equal(presentation.description, "");
});

test("routes square-scoped notices to the square profile", () => {
  const { notificationHref } = chatUtils;
  assert.equal(
    notificationHref({
      id: "13", kind: "system", rawType: "square_verified", title: "", description: "",
      createdAt: "", targetUrl: "/profile", entityType: "square", entityId: "136",
    }),
    "/users/square/136",
  );
});

test("does not crash or emit a broken sentence when the actor is missing", () => {
  const { getNotificationPresentation } = chatUtils;
  for (const rawType of ["like", "comment", "follow", "initiative_join"]) {
    const presentation = getNotificationPresentation({
      id: "8", kind: "like", rawType, title: "", description: "", createdAt: "", unread: true,
    });
    assert.equal(typeof presentation.title, "string");
    assert.ok(presentation.title.length > 0, `${rawType} must still have a title`);
    assert.ok(!presentation.title.includes("{actor}"), `${rawType} must not leak the template token`);
    assert.equal(presentation.avatarUrl, undefined);
  }
});

test("routes legacy placeholder deep links to the real actor profile", () => {
  const { notificationHref } = chatUtils;
  const follow = {
    id: "9", kind: "follow", rawType: "follow", title: "", description: "", createdAt: "",
    targetUrl: "/profile", entityType: "actor", entityId: "54",
    actor: { id: "54", name: "رضا", handle: "", avatarLabel: "رض", avatarTone: "slate", profileType: "user", profileId: "54" },
  };
  assert.equal(notificationHref(follow), "/users/user/54");

  const squareFollow = { ...follow, actor: { ...follow.actor, profileType: "square", profileId: "136" } };
  assert.equal(notificationHref(squareFollow), "/profile/square/136");
});

test("prefers a specific stored deep link over derived routes", () => {
  const { notificationHref } = chatUtils;
  const like = {
    id: "10", kind: "like", rawType: "like", title: "", description: "", createdAt: "",
    targetUrl: "/posts/70", entityType: "narrative", entityId: "70",
  };
  assert.equal(notificationHref(like), "/posts/70");
  // A comment link with an anchor must survive untouched.
  assert.equal(notificationHref({ ...like, targetUrl: "/posts/17#comment-91" }), "/posts/17#comment-91");
});

test("carries raw type and entity so typed rows keep working after mapping", () => {
  const mapped = chatUtils.mapApiNotification({
    id: 42,
    type: "initiative_join",
    title: "عضو جدید در کار خوب",
    body: "غلامرضا به «تست» پیوست.",
    created_at: "2026-09-12T11:22:19Z",
    read_at: "2026-09-12T11:30:00Z",
    deep_link: "/posts/77",
    entity_type: "initiative",
    entity_id: 78,
    actor: { id: "usr_9", type: "user", display_name: "غلامرضا محمد سلطانی", avatar_url: "", verified: false },
  });
  assert.equal(mapped.rawType, "initiative_join");
  assert.equal(mapped.entityType, "initiative");
  assert.equal(mapped.entityId, "78");
  assert.equal(mapped.kind, "initiative");
  assert.equal(mapped.unread, false);

  const presentation = chatUtils.getNotificationPresentation(mapped);
  assert.equal(presentation.title, "غلامرضا محمد سلطانی به کار خوب شما ملحق شد");
  assert.equal(presentation.href, "/posts/77");
});
