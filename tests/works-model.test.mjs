import test from "node:test";
import assert from "node:assert/strict";
import { mergeMessages } from "../features/works/merge.ts";
import { splitMentions } from "../features/works/mention.ts";
import { avatarColor, bareHandle, dayLabel, listTime, nameColor, previewText, sameDay, workColor, workIcon } from "../features/works/utils.ts";
import { messageTitle } from "../features/works/types.ts";

const msg = (id, extra = {}) => ({ id: String(id), client_id: "c" + id, kind: "text", body: "b" + id, created_at: "2026-10-02T10:00:00Z", ...extra });

test("merging keeps confirmed messages in id order and replaces by id", () => {
  const merged = mergeMessages([msg(10), msg(12)], [msg(11), msg(12, { body: "fresh" })]);
  assert.deepEqual(merged.map((m) => m.id), ["10", "11", "12"]);
  assert.equal(merged.find((m) => m.id === "12").body, "fresh");
});

test("merging sorts ids numerically, not lexically", () => {
  assert.deepEqual(mergeMessages([msg(9)], [msg(100), msg(20)]).map((m) => m.id), ["9", "20", "100"]);
});

test("an optimistic message is swapped for its confirmed twin and unsent ones stay last", () => {
  const pending = msg("pending-x", { client_id: "x", delivery: "sending" });
  const other = msg("pending-y", { client_id: "y", delivery: "sending" });
  const merged = mergeMessages([msg(1), pending, other], [msg(2, { client_id: "x" })]);
  assert.deepEqual(merged.map((m) => m.id), ["1", "2", "pending-y"]);
});

test("@handles are split out so they can be highlighted without eating punctuation", () => {
  assert.deepEqual(splitMentions("سلام @reza_k. خوبی؟ @a.b"), [
    { text: "سلام ", mention: false },
    { text: "@reza_k", mention: true },
    { text: ". خوبی؟ ", mention: false },
    { text: "@a.b", mention: true },
  ]);
  assert.deepEqual(splitMentions("mail me@x.com"), [{ text: "mail me", mention: false }, { text: "@x.com", mention: true }]);
  assert.deepEqual(splitMentions("بدون اشاره"), [{ text: "بدون اشاره", mention: false }]);
});

test("colours and icons are stable per id", () => {
  assert.equal(avatarColor("42"), avatarColor("42"));
  assert.equal(nameColor("abc"), nameColor("abc"));
  assert.equal(workColor("7"), workColor("7"));
  assert.equal(workIcon("7"), workIcon("7"));
  assert.match(avatarColor("1"), /^#[0-9a-f]{6}$/);
});

test("day labels say today / yesterday and fall back to a Persian date", () => {
  const now = new Date();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12).toISOString();
  const old = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 40, 12).toISOString();
  assert.equal(dayLabel(now.toISOString()), "امروز");
  assert.equal(dayLabel(yesterday), "دیروز");
  assert.notEqual(dayLabel(old), "امروز");
  assert.ok(dayLabel(old).length > 2);
  assert.equal(dayLabel(null), "");
  assert.equal(listTime(yesterday), "دیروز");
  assert.match(listTime(now.toISOString()), /[۰-۹]{2}:[۰-۹]{2}/);
  assert.equal(sameDay("2026-10-02T01:00:00", "2026-10-02T23:00:00"), true);
});

test("titles and previews come from the message kind", () => {
  assert.equal(messageTitle({ task: { title: "T" }, body: "x" }), "T");
  assert.equal(messageTitle({ poll: { question: "Q" }, body: "x" }), "Q");
  assert.equal(messageTitle({ body: "plain" }), "plain");
  assert.equal(previewText({ kind: "text", body: "a\n  b" }), "a b");
  assert.equal(previewText({ kind: "text", body: "x".repeat(100) }, 10), "x".repeat(10) + "…");
  assert.equal(bareHandle({ handle: "@reza" }), "reza");
  assert.equal(bareHandle({ handle: "reza" }), "reza");
});

import * as chatUtils from "../features/chat/chat-utils.ts";

test("every work notification type has presentation copy, a work icon kind and deep link", () => {
  const types = ["work_message_updated", "work_task_created", "work_task_assigned", "work_task_status", "work_task_reminder", "work_meeting_created", "work_announcement", "work_announcement_seen", "work_announcement_reminder", "work_poll_created", "work_mention", "work_member_joined", "work_role_changed"];
  for (const type of types) {
    assert.equal(chatUtils.notificationKind(type), "work", type);
    const mapped = chatUtils.mapApiNotification({ id: 1, type, title: "کار", body: "x", created_at: "2026-10-02T10:00:00Z", deep_link: "/works/5?m=9", actor: { id: "usr_3", display_name: "مهدی کریمی", type: "user" } });
    const p = chatUtils.getNotificationPresentation(mapped);
    assert.notEqual(p.title, "اعلان میدان", type + " must not fall back to the generic copy");
    assert.equal(p.href, "/works/5?m=9", type);
  }
});

test("a role-change notice renders even without an actor", () => {
  const mapped = chatUtils.mapApiNotification({ id: 2, type: "work_role_changed", title: "", body: "", created_at: "2026-10-02T10:00:00Z", deep_link: "/works/5" });
  assert.match(chatUtils.getNotificationPresentation(mapped).title, /نقش شما/);
});
