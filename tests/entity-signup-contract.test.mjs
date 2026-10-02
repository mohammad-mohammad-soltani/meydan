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

test("profile lists show reposts, labelled as reposted", () => {
  assert.match(read("features/profile/services/profile-narrative-mappers.ts"), /repostedAt: item\.reposted_at/);
  assert.match(read("features/profile/components/ProfileActivity.tsx"), /post\.repostedAt/);
});

test("media, collectives and organizations are separate public entities, not squares", () => {
  const route = read("lib/profile-route.ts");
  assert.match(route, /ACTOR_KINDS = \["user", "square", "media", "collective", "organization"\]/);
  assert.match(route, /entityApiPath/);
  assert.match(read("lib/meydan-follow.ts"), /export type ActorType = ActorKind;/);
  const service = read("features/profile/services/profile.service.ts");
  assert.match(service, /entityApiPath\(type as EntityKind, id\)/);
  assert.match(service, /me\.entity \?\? me\.square/);
  // Location, schedule and invitations stay square-only.
  assert.match(read("features/profile/components/ProfileView.tsx"), /isSquareAccount = profile\.profile\.accountType === "square" && entityKind === "square"/);
  assert.match(read("app/(app)/profile/schedule/page.tsx"), /\(profile\.kind \?\? "square"\) !== "square"/);
  assert.match(read("app/(app)/speakers/page.tsx"), /\(viewer\.kind \?\? "square"\) === "square"/);
});

test("search has a filter and a result kind for every entity kind", () => {
  const view = read("features/explore/components/ExploreView.tsx");
  for (const id of ["media", "collective", "organization"]) {
    assert.match(view, new RegExp(`id: "${id}", label`));
  }
  const service = read("features/explore/services/explore.service.ts");
  assert.match(service, /sections\.media/);
  assert.match(service, /sections\.collectives/);
  assert.match(service, /sections\.organizations/);
  assert.match(service, /publicProfileHref\(kind, item\.id, item\.handle\)/);
});

test("every surface that shows a name renders the shared account badges", () => {
  const badges = read("components/shared/AccountBadges.tsx");
  assert.match(badges, /fill-verified/); // media and organizations use the same blue tick
  assert.doesNotMatch(badges, /fill-foreground/);
  for (const file of [
    "features/feed/components/PostCard.tsx",
    "features/feed/components/QuotedPostCard.tsx",
    "features/feed/components/FollowSuggestions.tsx",
    "features/posts/components/PostHeader.tsx",
    "features/posts/components/CommentsList.tsx",
    "features/media/components/ImmersivePostSlide.tsx",
    "features/chat/components/ChatHeader.tsx",
    "features/chat/components/ConversationItem.tsx",
    "features/chat/components/DirectRow.tsx",
    "features/chat/components/ChatUserInfo.tsx",
    "features/initiatives/components/ParticipantsView.tsx",
    "features/explore/components/ExploreView.tsx",
    "features/profile/components/ProfileHeader.tsx",
    "features/speaker-invitations/components/InvitationCard.tsx",
  ]) {
    assert.match(read(file), /<AccountBadges\s/, `${file} must render AccountBadges`);
  }
});

test("every post surface shares through the one share sheet, with the story studio and saved narratives", () => {
  for (const file of ["features/feed/hooks/useFeed.ts", "features/profile/hooks/useProfile.ts", "features/posts/hooks/usePost.ts", "features/posts/components/QuotesView.tsx", "features/media/hooks/useViewerPost.ts"]) {
    const src = read(file);
    assert.match(src, /openShare\(/, file);
    assert.doesNotMatch(src, /navigator\.share\(/, `${file} must not bypass the sheet`);
  }
  const sheet = read("features/share/components/ShareSheet.tsx");
  for (const label of ["ارسال سریع به مخاطبین", "اشتراک در پیام‌رسان‌ها", "کپی پیوند", "عکس‌نوشت ساز", "ذخیره روایت"]) assert.ok(sheet.includes(label), label);
  assert.match(sheet, /\/narratives\/\$\{post\.id\}\/bookmark/);
  const canvas = read("features/share/story-canvas.ts");
  assert.match(canvas, /story: \{ width: 1080, height: 1920 \}/);
  assert.match(canvas, /square: \{ width: 1080, height: 1080 \}/);
  assert.match(read("app/(app)/layout.tsx"), /<ShareProvider>/);
  assert.match(read("app/(app)/bookmarks/page.tsx"), /\/me\/saved-narratives/);
});

test("the profile cover bell subscribes to an account's new posts from the follow-state read", () => {
  assert.match(read("lib/meydan-follow.ts"), /\/notify`, \{ method: notify \? "PUT" : "DELETE" \}/);
  assert.match(read("features/profile/hooks/useProfile.ts"), /getActorFollowState\(/);
  assert.match(read("features/profile/components/ProfileHeader.tsx"), /aria-label="اعلان‌های نمایه"/);
});
