import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  RESERVED_HANDLES,
  canonicalPublicProfileHref,
  cleanHandle,
  entityApiPath,
  isPublicProfilePath,
  publicProfileHref,
} from "../lib/profile-route.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");

test("every public profile lives at /{handle}, whatever its kind", () => {
  for (const kind of ["user", "square", "media", "collective", "organization"]) {
    assert.equal(publicProfileHref(kind, 7, "@Reza_S"), "/reza_s");
  }
});

test("without a handle the id-based address is used and redirected by the app", () => {
  assert.equal(publicProfileHref("user", 42), "/users/user/42");
  assert.equal(publicProfileHref("user", "usr_54"), "/users/user/54");
  assert.equal(publicProfileHref("media", "md_9"), "/users/media/9");
  assert.equal(publicProfileHref("square", 136, "square_136"), "/users/square/136");
  assert.equal(publicProfileHref("user", "", ""), "/");
});

test("handles are cleaned before they become a path", () => {
  assert.equal(cleanHandle("@saba"), "saba");
  assert.equal(cleanHandle("a b"), "");
  assert.equal(cleanHandle("ab"), "");
  assert.equal(cleanHandle("user_12"), "");
});

test("old public profile URLs canonicalize without losing query/hash", () => {
  assert.equal(canonicalPublicProfileHref("/users/user/42"), "/users/user/42");
  assert.equal(canonicalPublicProfileHref("/profile/user/42?tab=resume"), "/users/user/42?tab=resume");
  assert.equal(canonicalPublicProfileHref("/users/media/9#latest"), "/users/media/9#latest");
  assert.equal(canonicalPublicProfileHref("/square/136#latest"), "/users/square/136#latest");
  assert.equal(canonicalPublicProfileHref("/posts/17#comment-2"), "/posts/17#comment-2");
});

test("entities are served from their own API paths", () => {
  assert.equal(entityApiPath("square", 5), "/squares/5");
  assert.equal(entityApiPath("media", 9), "/entities/media/9");
});

test("a single path segment is a profile unless it is an app route", () => {
  assert.equal(isPublicProfilePath("/reza_s"), true);
  assert.equal(isPublicProfilePath("/explore"), false);
  assert.equal(isPublicProfilePath("/media"), false);
  assert.equal(isPublicProfilePath("/reza_s/edit"), false);
});

test("every top-level route folder is a reserved handle", () => {
  // Files such as /sw.js or /icon.svg contain a dot and can never match a handle.
  const names = new Set();
  for (const dir of ["app", "app/(app)", "public"]) {
    for (const entry of readdirSync(path.join(root, dir), { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (/^[A-Za-z0-9_]{3,30}$/.test(entry.name) && /[A-Za-z]/.test(entry.name)) names.add(entry.name.toLowerCase());
    }
  }
  const missing = [...names].filter((name) => !RESERVED_HANDLES.includes(name));
  assert.deepEqual(missing, [], `top-level folders missing from RESERVED_HANDLES (and Handles::RESERVED in the backend): ${missing.join(", ")}`);
});

test("one dynamic route serves every profile and legacy addresses redirect to it", () => {
  const profilePage = source("app/(app)/[handle]/page.tsx");
  assert.match(profilePage, /\/profiles\/\$\{clean\}/);
  assert.match(profilePage, /redirectToProfileById\("user", handle\)/);
  assert.match(profilePage, /PublicProfileRoute type=\{actorKindOf\(resolved\.actor_type\)\}/);

  assert.match(source("app/(app)/square/[id]/page.tsx"), /redirectToProfileById\("square", id\)/);
  assert.match(source("app/(app)/users/[type]/[id]/page.tsx"), /redirectToProfileById\(type, id\)/);
  assert.match(source("app/(app)/profile/[type]/[id]/page.tsx"), /redirectToProfileById\(type, id\)/);
  assert.match(source("lib/profile-redirect.ts"), /\/profiles\/by-id\/\$\{type\}\/\$\{id\}/);
});

test("no module builds its own /square/ profile link", () => {
  for (const file of [
    "features/chat/chat-utils.ts",
    "features/content/services/content-producer.ts",
    "features/map/components/marker-content.ts",
    "features/explore/services/explore.service.ts",
    "features/admin/components/AdminSquareDetailView.tsx",
  ]) {
    assert.doesNotMatch(source(file), /`\/square\/\$\{|`\/users\/(?:square|user)\/\$\{/, `${file} must use publicProfileHref`);
  }
});
