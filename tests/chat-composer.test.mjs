import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  formatSquareLocationMessage,
  parseSquareLocationMessage,
} from "../features/chat/chat-utils.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");

test("a square location survives the round trip as a readable message", () => {
  const body = formatSquareLocationMessage({
    name: "مسجد سید اصفهان",
    address: "اصفهان، خیابان سپاه",
    latitude: 32.65,
    longitude: 51.66,
  });

  assert.match(body, /^📍 موقعیت میدان\n/);
  assert.match(body, /مسجد سید اصفهان/);
  assert.match(body, /اصفهان، خیابان سپاه/);
  assert.match(body, /https:\/\/www\.google\.com\/maps\?q=32\.65,51\.66/);

  const parsed = parseSquareLocationMessage(body);
  assert.deepEqual(parsed, {
    name: "مسجد سید اصفهان",
    address: "اصفهان، خیابان سپاه",
    url: "https://www.google.com/maps?q=32.65,51.66",
  });
});

test("only real location messages become cards", () => {
  assert.equal(parseSquareLocationMessage("سلام"), null);
  assert.equal(parseSquareLocationMessage(""), null);
  assert.equal(parseSquareLocationMessage(undefined), null);
  // A location without coordinates still renders, just without a map link.
  assert.deepEqual(parseSquareLocationMessage(formatSquareLocationMessage({ name: "میدان آزادی" })), {
    name: "میدان آزادی",
    address: undefined,
    url: undefined,
  });
});

test("people without a photo never get a stock illustration", () => {
  assert.ok(existsSync(path.join(root, "features/chat/components/ChatAvatar.tsx")));
  const avatar = source("features/chat/components/ChatAvatar.tsx");
  assert.match(avatar, /participant\.avatarUrl/);
  assert.match(avatar, /avatarLabel\.trim\(\)\.slice\(0, 1\)/);
  assert.match(avatar, /rounded-full/);
  assert.doesNotMatch(avatar, /images\/generated/);

  for (const file of [
    "features/chat/components/ChatHeader.tsx",
    "features/chat/components/ConversationItem.tsx",
    "features/chat/components/ChatUserInfo.tsx",
  ]) {
    assert.match(source(file), /<ChatAvatar/, `${file} must use the shared avatar`);
  }

  // The old generated-portrait helper is gone for good.
  assert.doesNotMatch(source("components/shared/generated-media.ts"), /chatAvatar/);
  for (const file of [
    "features/chat/components/ChatHeader.tsx",
    "features/chat/components/ConversationItem.tsx",
    "features/chat/components/ChatUserInfo.tsx",
  ]) {
    assert.doesNotMatch(source(file), /chatAvatar/);
  }
});

test("the attachment menu offers every chat attachment type", () => {
  const sheet = source("features/chat/components/AttachmentSheet.tsx");
  for (const label of ["عکس", "ویدیو", "صوت", "فایل", "موقعیت مکانی میدان"]) {
    assert.match(sheet, new RegExp(label), `attachment sheet must offer ${label}`);
  }
  assert.match(sheet, /accept: "image\/\*"/);
  assert.match(sheet, /accept: "video\/\*"/);
  assert.match(sheet, /accept: "audio\/\*"/);
  assert.match(sheet, /type="file"/);
  assert.match(sheet, /role="dialog"/);
  assert.match(sheet, /event\.key === "Escape"/);

  const input = source("features/chat/components/MessageInput.tsx");
  assert.match(input, /<AttachmentSheet/);
  assert.match(input, /setIsAttachmentOpen\(true\)/);
  assert.match(input, /onSendSquareLocation/);
  // The send action is the reference's round, text-coloured primary control.
  assert.match(input, /bg-foreground/);
  assert.match(input, /var\(--m-bg\)/);
});

test("location sharing resolves a square and sends it through the message API", () => {
  const service = source("features/chat/services/chat.service.ts");
  assert.match(service, /export async function getShareableSquare/);
  assert.match(service, /meydanApi<ApiSquareCard>\(`\/squares\/\$\{squareId\}`\)/);

  const hook = source("features/chat/hooks/useConversation.ts");
  assert.match(hook, /const sendSquareLocation = useCallback/);
  assert.match(hook, /formatSquareLocationMessage\(square\)/);
  assert.match(hook, /sendMessage\(conversationId, body, undefined/);
  assert.match(hook, /sendSquareLocation,/);

  assert.match(source("features/chat/components/MessageBubble.tsx"), /MessageLocationCard/);
  assert.match(source("features/chat/components/ConversationView.tsx"), /onSendSquareLocation=\{\(\) => void chat\.sendSquareLocation\(\)\}/);
});

test("the chat shell owns its height so the page cannot rubber-band", () => {
  // 100vh is taller than the visible area while the mobile URL bar is shown.
  assert.match(source("app/layout.tsx"), /min-h-dvh/);
  assert.doesNotMatch(source("app/layout.tsx"), /min-h-screen/);

  const shell = source("components/layouts/AppShell.tsx");
  assert.match(shell, /const isChatRoute = pathname\.startsWith\("\/chat\/"\)/);
  assert.match(shell, /h-\[100dvh\] w-full justify-center overflow-hidden/);
  assert.match(shell, /isChatRoute \? "overflow-hidden" : "overflow-y-auto"/);

  // The route stage is a flex column with a definite height, so `h-full`
  // children (the conversation) resolve instead of growing the scroll area.
  const template = source("app/(app)/template.tsx");
  assert.match(template, /flex min-h-0 flex-1 flex-col/);
});
