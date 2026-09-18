import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");

test("speaker browsing uses public data and skips the viewer lookup for guests", () => {
  const page = source("app/(app)/speakers/page.tsx");
  const service = source("features/speakers/services/speakers.service.ts");

  assert.match(service, /meydanApi<ApiSpeaker\[\]>\("\/speakers"\)/);
  assert.match(service, /meydanApi<ApiCategory\[\]>\("\/speaker-categories"\)/);
  assert.match(page, /isAuthenticated\(\)/);
  assert.match(page, /authenticated \? getProfileDetails\(\)\.catch\(\(\) => null\) : null/);
});

test("guests only reach login after pressing an available invite button", () => {
  const button = source("features/speaker-invitations/components/SpeakerInviteButton.tsx");
  const view = source("features/speakers/components/SpeakersView.tsx");

  assert.match(button, /if \(!requireAuth\(\)\) return;/);
  assert.match(view, /isAuthenticated\s*\?\s*\(\s*<Link[\s\S]*?href=\{["']\/speaker-invitations["']/);
});
