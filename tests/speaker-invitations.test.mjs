import test from "node:test";
import assert from "node:assert/strict";
import { getNotificationPresentation } from "../features/chat/chat-utils.ts";

/**
 * The API is the only thing allowed to release a contact number. These tests
 * pin the client-side half of that contract: a phone must never be rendered
 * unless the server both accepted the invitation and set `phone_visible`.
 */

function invocation(overrides = {}) {
  return {
    id: "1",
    kind: "system",
    rawType: "speaker_invitation",
    title: "",
    description: "",
    createdAt: "",
    unread: true,
    actor: {
      id: "9",
      name: "محمد محمد سلطانی",
      handle: "",
      avatarLabel: "مح",
      avatarTone: "slate",
      avatarUrl: "https://cdn.example/a.jpg",
    },
    ...overrides,
  };
}

test("renders a human sentence for speaker invitation notifications", () => {
  const invited = getNotificationPresentation(invocation());
  assert.equal(invited.title, "محمد محمد سلطانی شما را برای سخنرانی دعوت کرده است");
  assert.equal(invited.isSystem, false);

  const accepted = getNotificationPresentation(invocation({ rawType: "speaker_invitation_accepted" }));
  assert.equal(accepted.title, "محمد محمد سلطانی دعوت سخنرانی شما را پذیرفت");

  const rejected = getNotificationPresentation(invocation({ rawType: "speaker_invitation_rejected" }));
  assert.equal(rejected.title, "محمد محمد سلطانی دعوت سخنرانی شما را نپذیرفت");
});

test("keeps the speaker notification actor avatar", () => {
  const presentation = getNotificationPresentation(invocation());
  assert.equal(presentation.avatarUrl, "https://cdn.example/a.jpg");
});

test("does not leak a template token when the inviter actor is missing", () => {
  const presentation = getNotificationPresentation(invocation({ actor: undefined }));
  assert.ok(!presentation.title.includes("{actor}"));
  assert.equal(presentation.title, "اعلان میدان");
});
