import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  canonicalPublicProfileHref,
  publicProfileHref,
} from "../lib/profile-route.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");

test("all user roles share the short /{id} profile URL", () => {
  assert.equal(publicProfileHref("user", 42), "/42");
  assert.equal(publicProfileHref("user", "usr_54"), "/54");
});

test("squares use /square/{id}", () => {
  assert.equal(publicProfileHref("square", 136), "/square/136");
  assert.equal(publicProfileHref("square", "sq_54"), "/square/54");
});

test("old public profile URLs canonicalize without losing query/hash", () => {
  assert.equal(canonicalPublicProfileHref("/users/user/42"), "/42");
  assert.equal(canonicalPublicProfileHref("/profile/user/42?tab=resume"), "/42?tab=resume");
  assert.equal(canonicalPublicProfileHref("/users/square/136#latest"), "/square/136#latest");
  assert.equal(canonicalPublicProfileHref("/posts/17#comment-2"), "/posts/17#comment-2");
});

test("canonical pages are real pages and old schemes are redirects", () => {
  const userPage = source("app/(app)/[id]/page.tsx");
  const squarePage = source("app/(app)/square/[id]/page.tsx");
  const usersLegacy = source("app/(app)/users/[type]/[id]/page.tsx");
  const profileLegacy = source("app/(app)/profile/[type]/[id]/page.tsx");

  assert.match(userPage, /PublicProfileRoute type="user"/);
  assert.match(squarePage, /PublicProfileRoute type="square"/);
  assert.match(usersLegacy, /redirect\(publicProfileHref\(type, id\)\)/);
  assert.match(profileLegacy, /redirect\(publicProfileHref\(type, id\)\)/);
});
