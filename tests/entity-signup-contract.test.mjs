import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("signup offers میدان/مجموعه/رسانه/سازمان and only a square needs a location", () => {
  const page = read("features/auth/components/AuthPage.tsx");
  assert.match(page, /میدان یا مجموعه هستم/);
  for (const kind of ["square", "collective", "media", "organization"]) assert.match(page, new RegExp(`value: "${kind}"`));
  assert.match(page, /needsLocation = accountType === "square" && entityKind === "square"/);
  assert.match(page, /"register-entity"/);
  // The legacy square payload and personal-account path stay.
  assert.match(page, /"register-square"/);
  assert.match(page, /"register-user"/);
});

test("student/seminarian choice is explicit and sent as student_kind", () => {
  const page = read("features/auth/components/AuthPage.tsx");
  assert.match(page, /student_kind: studentKind/);
  assert.match(page, /دانشجو هستم/);
  assert.match(page, /طلبه هستم/);
});

test("auth proxy forwards register-entity", () => {
  assert.match(read("app/api/auth/[action]/route.ts"), /"register-entity": "\/auth\/register\/entity"/);
});

test("admin has a list page per kind and media linking", () => {
  for (const slug of ["collectives", "organizations", "media-accounts"]) {
    assert.match(read(`app/(app)/admin/${slug}/page.tsx`), /isAdministrator/);
  }
  const nav = read("features/admin/components/AdminSectionNav.tsx");
  for (const href of ["/admin/collectives", "/admin/media-accounts", "/admin/organizations"]) assert.ok(nav.includes(href));
  assert.match(read("features/admin/services/squares.service.ts"), /media-link/);
  // The squares page keeps listing squares only.
  assert.match(read("app/(app)/admin/squares/page.tsx"), /kind: "square"/);
});
