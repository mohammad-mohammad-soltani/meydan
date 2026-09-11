import test from "node:test";
import assert from "node:assert/strict";
import {
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
