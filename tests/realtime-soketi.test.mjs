import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

/**
 * The whole Meydan frontend runs on one Soketi (Pusher-compatible) transport.
 * These tests pin the unified endpoint and prove the old Socket.IO/socket-ticket
 * mechanism cannot creep back in.
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");
const exists = (relative) => existsSync(path.join(root, relative));

async function load(relative) {
  return import(pathToFileURL(path.join(root, relative)).href);
}

test("soketi config is the single public realtime endpoint", async () => {
  const { SOKETI_CONFIG, getSoketiUrl } = await load("lib/realtime/soketi.ts");

  assert.equal(SOKETI_CONFIG.host, "socket.naghshman.ir");
  assert.equal(SOKETI_CONFIG.port, 443);
  assert.equal(SOKETI_CONFIG.secure, true);
  assert.equal(SOKETI_CONFIG.path, "");

  const url = getSoketiUrl();
  assert.ok(
    url.startsWith(`wss://socket.naghshman.ir/app/${SOKETI_CONFIG.appKey}`),
    `unexpected realtime URL: ${url}`,
  );
  for (const forbidden of ["localhost", "127.0.0.1", ":6001", ":3001", "socket.io"]) {
    assert.ok(!url.includes(forbidden), `realtime URL must not contain ${forbidden}`);
  }
});

test("private channels use the backend's private-user-{id} format", async () => {
  const { USER_CHANNEL_PREFIX, USER_CHANNEL_EVENTS, userChannelName } = await load(
    "lib/realtime/channels.ts",
  );

  assert.equal(USER_CHANNEL_PREFIX, "private-user-");
  assert.equal(userChannelName(123), "private-user-123");
  assert.match(userChannelName("9"), /^private-user-\d+$/);

  for (const event of [
    "conversation:updated",
    "message:created",
    "message:updated",
    "message:deleted",
    "message:reaction",
    "receipt:read",
    "typing:changed",
    "notification:created",
    "notification:updated",
  ]) {
    assert.ok(USER_CHANNEL_EVENTS.includes(event), `${event} must stay subscribed`);
  }
});

test("one transport built from the central config, authorized through the API", () => {
  const client = source("lib/realtime/client.ts");
  assert.match(client, /from "\.\/soketi"/);
  assert.match(client, /SOKETI_CONFIG\.appKey/);
  assert.match(client, /wsHost: SOKETI_CONFIG\.host/);
  assert.match(client, /wsPath: SOKETI_CONFIG\.path/);
  assert.match(client, /forceTLS: SOKETI_CONFIG\.secure/);
  assert.match(client, /authorizeRealtimeChannel/);
  // Exactly one Pusher instance; features share it.
  assert.match(client, /let client: PusherInstance \| null = null/);

  const auth = source("lib/realtime/auth.ts");
  assert.match(auth, /\/chat\/realtime\/auth/);
  assert.match(auth, /socket_id/);
  assert.match(auth, /channel_name/);
  // The app secret itself must never be present in frontend code, and the
  // realtime host must never come from an environment variable.
  for (const file of ["lib/realtime/auth.ts", "lib/realtime/client.ts", "lib/realtime/config.ts", "lib/realtime/soketi.ts"]) {
    const text = source(file);
    assert.doesNotMatch(text, /naghsh-34e3ad5/, `${file} must not contain the app secret`);
    assert.doesNotMatch(text, /process\.env/, `${file} must not read realtime config from env`);
    assert.doesNotMatch(text, /APP_SECRET\s*=/, `${file} must not define an app secret`);
  }
});

test("socket.io and the socket-ticket endpoint are gone", () => {
  assert.ok(!exists("features/chat/realtime/socket.ts"), "the Socket.IO client must be deleted");

  const files = [
    "features/chat/services/chat.service.ts",
    "features/chat/hooks/useChat.ts",
    "features/chat/hooks/useConversation.ts",
    "features/chat/providers/UnreadProvider.tsx",
    "lib/realtime/client.ts",
    "lib/realtime/user-channel.ts",
    "lib/realtime/config.ts",
    "lib/realtime/auth.ts",
  ];
  for (const file of files) {
    const text = source(file);
    assert.doesNotMatch(text, /socket\.io-client/, `${file} must not import socket.io-client`);
    assert.doesNotMatch(text, /getSocketTicket|socket-ticket/, `${file} must not use socket tickets`);
    assert.doesNotMatch(text, /getChatSocket/, `${file} must not use the old chat socket`);
    assert.doesNotMatch(text, /NEXT_PUBLIC_MEYDAN_CHAT_SOCKET_URL/, `${file} must not read a socket URL env`);
  }

  const pkg = JSON.parse(source("package.json"));
  assert.equal(pkg.dependencies["socket.io-client"], undefined, "socket.io-client must be removed");
  assert.ok(pkg.dependencies["pusher-js"], "pusher-js must be installed");
});

test("chat commands go over REST, realtime only listens", () => {
  const service = source("features/chat/services/chat.service.ts");
  assert.match(service, /export async function setConversationTyping/);
  assert.match(service, /\/chat\/conversations\/\$\{conversationId\}\/typing/);
  assert.match(service, /method: "POST"/);
  assert.match(service, /export function mapRealtimeMessage/);

  const conversation = source("features/chat/hooks/useConversation.ts");
  assert.match(conversation, /subscribeToUserChannel/);
  assert.match(conversation, /setConversationTyping\(conversationId, typing\)/);
  assert.match(conversation, /await sendMessage\(/, "sending must use REST");
  assert.match(conversation, /await editMessage\(/, "editing must use REST");
  assert.match(conversation, /deleteMessage\(target\.id\)/, "deleting must use REST");
  assert.match(conversation, /setMessageReaction\(messageId, reaction, active\)/, "reactions must use REST");
  assert.match(conversation, /markConversationRead\(conversationId, lastIncoming\.id\)/, "read receipts must use REST");

  // No client -> server socket emits survive anywhere in the chat feature.
  for (const file of [
    "features/chat/hooks/useConversation.ts",
    "features/chat/hooks/useChat.ts",
    "features/chat/services/chat.service.ts",
  ]) {
    const text = source(file);
    for (const emit of [
      "message:send",
      "message:edit",
      "message:delete",
      "message:react",
      "typing:start",
      "typing:stop",
      "conversation:join",
      "conversation:leave",
    ]) {
      assert.doesNotMatch(text, new RegExp(`emit\\(["']${emit}`), `${file} must not emit ${emit}`);
    }
  }
});

test("realtime failure cannot break conversation loading", () => {
  const conversation = source("features/chat/hooks/useConversation.ts");
  // Realtime identity/config must not sit inside the Promise.all that gates the
  // "دریافت گفتگو انجام نشد" error.
  const loadBlock = conversation.slice(
    conversation.indexOf("Promise.all([getConversationById"),
    conversation.indexOf("// Viewer identity for private channels"),
  );
  assert.ok(loadBlock.length > 0, "the required-data load block must exist");
  assert.doesNotMatch(loadBlock, /getRealtimeUserId|getConversations|getChatSocket/);
  assert.match(conversation, /getRealtimeUserId\(\)/);
});
