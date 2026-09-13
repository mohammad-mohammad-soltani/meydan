import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");

async function loadAuthNavigation() {
  const file = path.join(root, "lib/auth-navigation.ts");
  assert.ok(existsSync(file), "lib/auth-navigation.ts must exist");
  return import(pathToFileURL(file).href);
}

test("login return paths stay inside the app", async () => {
  const { sanitizeReturnTo, loginHref } = await loadAuthNavigation();
  assert.equal(sanitizeReturnTo("/compose?draft=1#editor"), "/compose?draft=1#editor");
  assert.equal(sanitizeReturnTo("https://evil.example/steal"), "/profile");
  assert.equal(sanitizeReturnTo("//evil.example/steal"), "/profile");
  assert.equal(sanitizeReturnTo("javascript:alert(1)"), "/profile");
  assert.equal(loginHref("/compose"), "/auth?returnTo=%2Fcompose");
});

test("protected UI redirects before protected actions", () => {
  const providerPath = path.join(root, "components/providers/AuthGateProvider.tsx");
  assert.ok(existsSync(providerPath), "AuthGateProvider must exist");
  const provider = readFileSync(providerPath, "utf8");
  assert.match(provider, /requireAuth/);
  assert.match(source("components/layouts/FloatingComposeButton.tsx"), /requireAuth\("\/compose"\)/);
  assert.match(source("features/feed/components/FeedTabs.tsx"), /requireAuth\(/);
  assert.match(source("features/feed/components/PostActions.tsx"), /requireAuth\(/);
  assert.match(source("features/feed/components/FollowSuggestions.tsx"), /requireAuth\(/);
  assert.match(source("features/profile/components/ProfileHeader.tsx"), /requireAuth\(/);

  const api = source("lib/meydan-api.ts");
  assert.match(api, /requiresClientAuthentication/);
  assert.match(api, /loginHref/);
  assert.match(api, /window\.location\.assign/);
});

test("notification center API endpoints are treated as authenticated client requests", () => {
  const api = source("lib/meydan-api.ts");
  assert.match(api, /cleanPath\s*===\s*["']\/notifications["']/);
  assert.match(api, /cleanPath\.startsWith\(["']\/notifications\/["']\)/);
  const notificationGuard = api.indexOf('cleanPath === "/notifications"');
  const publicGetGuard = api.indexOf('method === "GET" || method === "HEAD"');
  assert.ok(notificationGuard >= 0 && notificationGuard < publicGetGuard, "notification auth guard must run before public GET handling");
});

test("compose and chat routes have server-side authentication guards", () => {
  assert.match(source("app/(app)/compose/page.tsx"), /isAuthenticated/);
  assert.match(source("app/(app)/compose/page.tsx"), /loginHref\("\/compose"\)/);
  const chatLayout = path.join(root, "app/(app)/chat/layout.tsx");
  assert.ok(existsSync(chatLayout), "chat subtree auth layout must exist");
  assert.match(readFileSync(chatLayout, "utf8"), /isAuthenticated/);
});

test("login flow preserves and consumes a sanitized return target", () => {
  const bridgePath = path.join(root, "components/providers/AuthReturnToBridge.tsx");
  assert.ok(existsSync(bridgePath), "AuthReturnToBridge must exist");
  const bridge = readFileSync(bridgePath, "utf8");
  assert.match(bridge, /sanitizeReturnTo/);
  assert.match(bridge, /sessionStorage/);
  assert.match(bridge, /returnTo/);
  assert.match(source("app/auth/layout.tsx"), /AuthReturnToCapture/);
  assert.match(source("components/layouts/AppShell.tsx"), /PostLoginReturn/);
});

test("speaker accounts are mapped instead of bounced back to login", () => {
  const service = source("features/profile/services/profile.service.ts");
  // `/me` answers `account_type: "speaker"` for the `meydan_speaker` role; an
  // unhandled type used to fall through to `null` and redirect to /auth.
  assert.match(service, /account_type:\s*"speaker"/);
  assert.match(service, /me\.account_type === "speaker"/);
  assert.match(service, /mapUser\(\s*me\.profile,\s*narratives,\s*replies,\s*me\.speaker/);
  // Replies are keyed on `user|square`: `/actors/{type}` has no `speaker` route.
  assert.doesNotMatch(service, /\/actors\/\$\{me\.account_type\}/);
  assert.match(service, /\/actors\/\$\{actorType\}/);
});

test("a speaker is a user actor for follows", () => {
  const follow = source("lib/meydan-follow.ts");
  assert.match(follow, /account_type:\s*"user"\s*\|\s*"speaker"/);
  assert.match(follow, /return \{ type: "user", id: me\.profile\?\.id \}/);
  assert.doesNotMatch(follow, /const type: ActorType = me\.account_type/);
});

test("profile pages redirect to login only when the session is missing", () => {
  for (const page of ["app/(app)/profile/page.tsx", "app/(app)/profile/edit/page.tsx"]) {
    const text = source(page);
    assert.match(text, /if \(!\(await isAuthenticated\(\)\)\) redirect\(loginHref\(/, `${page} must gate on the session`);
    assert.doesNotMatch(text, /getProfileDetails\(\)\.catch\(\(\) => null\)/, `${page} must not treat an API failure as a logout`);
  }
});

test("theme supports light, dark and pure-black modes", () => {
  const themePath = path.join(root, "lib/theme.ts");
  assert.ok(existsSync(themePath), "lib/theme.ts must exist");
  const theme = readFileSync(themePath, "utf8");
  assert.match(theme, /"light"\s*\|\s*"dark"\s*\|\s*"black"/);

  const menuPath = path.join(root, "components/layouts/ThemeMenu.tsx");
  assert.ok(existsSync(menuPath), "ThemeMenu must exist");
  const menu = readFileSync(menuPath, "utf8");
  assert.match(menu, /روز/);
  assert.match(menu, /شب/);
  assert.match(menu, /تیره/);

  const blackThemePath = path.join(root, "app/black-theme.css");
  assert.ok(existsSync(blackThemePath), "app/black-theme.css must exist");
  const blackBlock = readFileSync(blackThemePath, "utf8");
  assert.match(blackBlock, /html\.black/);
  for (const token of ["--background", "--surface", "--surface-muted", "--surface-elevated", "--surface-sunken", "--input"]) {
    assert.match(blackBlock, new RegExp(`${token}:\\s*#000000`, "i"), `${token} must be pure black`);
  }

  const layout = source("app/layout.tsx");
  assert.match(layout, /black-theme\.css/);
  assert.match(layout, /black/);
  assert.match(layout, /meydan-theme/);
});
