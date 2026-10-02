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

test("approved media accounts can file a reflection from the post page", () => {
  const view = read("features/posts/components/PostView.tsx");
  assert.match(view, /AddReflectionButton/);
  const dialog = read("features/posts/components/AddReflectionButton.tsx");
  assert.match(dialog, /own_narrative_id/);
  assert.match(dialog, /یکی از پست‌های اکانت خودم را به‌عنوان بازتاب منتشر می‌کنم/);
  assert.match(read("features/posts/hooks/useMediaViewer.ts"), /media_outlet_id/);
});

test("quote compose lets media accounts opt out of filing a reflection (default on)", () => {
  const compose = read("features/compose/components/ComposeView.tsx");
  assert.match(compose, /useState\(true\)/);
  assert.match(compose, /media_reflection: fileAsReflection/);
  assert.match(compose, /این نقل‌قول به‌عنوان بازنشر رسانه‌ای ثبت شود/);
});

test("admin lists can approve or suspend each account directly", () => {
  const view = read("features/admin/components/AdminSquaresView.tsx");
  assert.match(view, /setSquareStatus\(String\(square\.id\), status, square\.adminNote\)/);
  assert.match(view, /تأیید و فعال‌سازی/);
});

test("own profile loads in one request with a fallback for older backends", () => {
  const service = read("features/profile/services/profile.service.ts");
  assert.match(service, /\/me\/profile-page\?limit=20/);
  assert.match(service, /if \(single !== undefined\) return single;/);
  assert.match(read("features/profile/services/square-profile-meta.service.ts"), /profile\.metaHydrated/);
});

test("own profile falls back to separate requests only when the endpoint is missing", () => {
  const service = read("features/profile/services/profile.service.ts");
  assert.match(service, /reason\.status === 404/);
  assert.match(service, /throw reason;/);
  assert.match(read("features/profile/services/profile-square-mapper.ts"), /kind: square\.kind/);
});
