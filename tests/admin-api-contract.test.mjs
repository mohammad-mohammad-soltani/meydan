import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");

/**
 * The admin panel talks to a specific WordPress plugin build. These assertions
 * pin the parts of that contract that are easy to break silently — a wrong verb
 * (the editorial toggle is PUT/DELETE, not POST), a missing `idempotency-key`
 * (the backend replays a cached 4xx for 24h without one), a body key renamed to
 * the "nicer" name (`square_name`, not `name`) — because none of those would
 * fail a TypeScript build.
 */
const SERVICE = {
  squares: "features/admin/services/squares.service.ts",
  speakers: "features/admin/services/speakers.service.ts",
  content: "features/admin/services/content.service.ts",
  creators: "features/admin/services/creators.service.ts",
  programs: "features/admin/services/programs.service.ts",
  narratives: "features/admin/services/narratives.service.ts",
  api: "features/admin/services/admin-api.ts",
};

test("admin writes mint a fresh idempotency key per request", () => {
  const api = source(SERVICE.api);

  // The plugin caches the whole response (including a 4xx) for 24h under the
  // key, so reusing one would replay a stale rejection on a corrected retry.
  assert.match(api, /function newIdempotencyKey\(\): string/);
  assert.match(api, /["']idempotency-key["']/);
  assert.match(api, /crypto\.randomUUID\(\)/);
  
  // Every write helper must route through the keyed initializer.
  for (const verb of ["adminPost", "adminPatch", "adminPut"]) {
    const start = api.indexOf(`export async function ${verb}`);
    assert.ok(start >= 0, `${verb} must exist`);
    const body = api.slice(start, start + 700);
    assert.match(body, /jsonInit/, `${verb} must build its request through jsonInit`);
  }
});

test("bodyless admin deletes use DELETE rather than the fetch default GET", () => {
  const api = source(SERVICE.api);
  const start = api.indexOf("export async function adminDelete");
  assert.ok(start >= 0);
  const helper = api.slice(start, start + 550);
  assert.match(helper, /body === undefined\s*\?\s*\{ method: "DELETE"/);
  assert.match(helper, /jsonInit\("DELETE", body\)/);
});

test("speaker saves preserve the existing avatar when no replacement was selected", () => {
  const speakers = source(SERVICE.speakers);
  const start = speakers.indexOf("function speakerProfileBody");
  assert.ok(start >= 0);
  const body = speakers.slice(start, start + 450);
  assert.match(body, /input\.avatarMediaId !== null \? \{ avatar_media_id: input\.avatarMediaId \}/);
  assert.doesNotMatch(body, /avatar_media_id: input\.avatarMediaId \?\? 0/);
});

test("creator and media outlet edits preserve an untouched avatar", () => {
  const creators = source(SERVICE.creators);
  for (const name of ["creatorBody", "outletBody"]) {
    const start = creators.indexOf(`export function ${name}`);
    assert.ok(start >= 0);
    const body = creators.slice(start, start + 600);
    assert.match(body, /input\.avatarMediaId !== null \? \{ avatar_media_id: input\.avatarMediaId \}/);
    assert.doesNotMatch(body, /avatar_media_id: input\.avatarMediaId \?\? 0/);
  }
});

test("the square create body uses the API's own field names", () => {
  const squares = source(SERVICE.squares);

  // `square_name`/`full_name`/`contact_name`/`contact_phone` are what
  // `AdminSquareController` reads; `name` would be silently ignored.
  for (const key of [
    "square_name",
    "full_name",
    "contact_name",
    "contact_phone",
    "start_date",
    "avatar_media_id",
    "province_id",
    "city_id",
    "eitaa_channel",
    "bale_channel",
    "latitude",
    "longitude",
    "location_source",
  ]) {
    assert.match(squares, new RegExp(`${key}:`), `square body must send ${key}`);
  }

  // PATCH /admin/squares/{id} accepts no `name`, so the update body must not
  // invent one either.
  const updateStart = squares.indexOf("export function squareUpdateBody");
  assert.ok(updateStart >= 0);
  const updateBody = squares.slice(updateStart, updateStart + 1300);
  assert.match(updateBody, /square_name/);
  assert.match(updateBody, /location_source/);
});

test("square status changes and deletes hit the documented routes", () => {
  const squares = source(SERVICE.squares);

  assert.match(squares, /\/admin\/squares\/\$\{segment\(id\)\}\/status/);
  assert.match(squares, /\/admin\/squares\/\$\{segment\(id\)\}/);
  assert.match(squares, /wp_trash_post|adminDelete/);
});

test("the speaker surfaces use the promote/demote routes, not user edits", () => {
  const speakers = source(SERVICE.speakers);

  assert.match(speakers, /\/admin\/speakers/);
  assert.match(speakers, /promote/);
  // Promotion is a POST of `user_id`, never a role string.
  assert.match(speakers, /user_id/);
  assert.match(speakers, /eitaa_channel: input\.eitaaChannel\.trim\(\)/);
  assert.match(speakers, /bale_channel: input\.baleChannel\.trim\(\)/);
  assert.match(speakers, /\/admin\/speakers\/new-account/);
  for (const key of ["full_name", "phone", "email", "province_id", "city_id", "about"]) {
    assert.match(speakers, new RegExp(`${key}:`), `new speaker account body must send ${key}`);
  }
  // The request and invitation inboxes share one controller under two prefixes.
  assert.match(speakers, /\/admin\/speaker-requests/);
  assert.match(speakers, /\/admin\/speaker-invitations/);
  // The directory uses a real page/per_page envelope; only request inboxes
  // remain intentionally capped.
  assert.match(speakers, /adminGetEnvelope<ApiSpeaker\[\]>/);
  assert.match(speakers, /per_page: perPage/);
  assert.match(speakers, /page: metaInt\(meta, \["page"\], page\)/);
  assert.match(speakers, /SPEAKER_REQUEST_LIST_CAP\s*=\s*100/);
});

test("representative is an API category used by every admin speaker surface", (t) => {
  const backendRoot = path.resolve(root, "../meydan-backend");
  if (!existsSync(backendRoot)) {
    t.skip("backend sibling repository is not part of the frontend CI checkout");
    return;
  }

  const categories = readFileSync(
    path.resolve(backendRoot, "wp-content/plugins/meydan-core/src/Domain/SpeakerService.php"),
    "utf8",
  );
  const form = source("features/admin/components/AdminSpeakerForm.tsx");
  const directory = source("features/admin/components/AdminSpeakersView.tsx");

  assert.match(categories, /'namayande'\s*=>\s*'نماینده'/);
  assert.match(form, /getSpeakerCategories\(\)/);
  assert.match(form, /categoriesList\.map/);
  assert.match(directory, /categories\.map/);
});

test("invitation details read the shared request GET route", () => {
  const speakers = source(SERVICE.speakers);
  const start = speakers.indexOf("export async function getSpeakerInvitation(");
  assert.ok(start >= 0);
  const body = speakers.slice(start, start + 400);
  assert.match(body, /return getSpeakerRequest\(id, init\)/);
  assert.doesNotMatch(body, /adminGetItem.*speaker-invitations/);
});

test("direct speaker creation remains an admin-only atomic backend operation", (t) => {
  const backendRoot = path.resolve(root, "../meydan-backend");
  if (!existsSync(backendRoot)) {
    t.skip("backend sibling repository is not part of the frontend CI checkout");
    return;
  }

  const routes = readFileSync(
    path.resolve(root, "../meydan-backend/wp-content/plugins/meydan-core/src/Rest/Routes.php"),
    "utf8",
  );
  const controller = readFileSync(
    path.resolve(root, "../meydan-backend/wp-content/plugins/meydan-core/src/Rest/SpeakerController.php"),
    "utf8",
  );
  const service = readFileSync(
    path.resolve(root, "../meydan-backend/wp-content/plugins/meydan-core/src/Domain/SpeakerAdminService.php"),
    "utf8",
  );

  assert.match(routes, /admin\/speakers\/new-account/);
  assert.match(controller, /current_user_can\('manage_meydan_speakers'\)/);
  assert.match(controller, /adminCreateAccount/);
  assert.match(controller, /WP_User_Query/);
  assert.match(controller, /per_page/);
  assert.match(controller, /count_total/);
  assert.match(service, /OtpService::normalizePhone/);
  assert.match(service, /phoneOwner/);
  assert.match(service, /cityBelongsTo/);
  assert.match(service, /SpeakerService::promote/);
  assert.match(service, /SpeakerService::save/);
  assert.match(service, /wp_delete_user/);
});

test("content creation tolerates the null body a non-published save returns", () => {
  const content = source(SERVICE.content);

  // `Serializer::content` answers `data: null` for anything that is not
  // `publish`, so the return type is nullable and the caller may not assume id.
  assert.match(content, /\/admin\/content/);
  assert.match(content, /Promise<\s*ContentItem \| null>|Promise<ContentItem \| null>/);
  // The public cursor list is the only way to read content back.
  assert.match(content, /cursor/);
  assert.match(content, /CONTENT_LIST_LIMITATION/);
});

test("narrative editorial marking uses PUT to add and DELETE to remove", () => {
  const narratives = source(SERVICE.narratives);

  const fn = narratives.slice(narratives.indexOf("export async function setEditorial"));
  assert.match(fn, /adminPut</);
  assert.match(fn, /adminDelete</);
  // Converting requires a content type from the new content model.
  assert.match(narratives, /convertNarrativeToContent/);
  assert.match(narratives, /content_type:\s*contentType/);
  // Removing the content link is not idempotent (a second call 404s), so the
  // 404 is absorbed.
  assert.match(narratives, /removeNarrativeContent/);
});

test("media reflections write outlet_id for a real outlet and outlet as text", () => {
  const narratives = source(SERVICE.narratives);

  assert.match(narratives, /outlet_id/);
  assert.match(narratives, /logo_media_id/);
  // The reflection delete is a hard delete whose repeat is a 404.
  assert.match(narratives, /\/admin\/media-reflections/);
});

test("the broadcast body nests its audience and omits unused scope keys", () => {
  const programs = source(SERVICE.programs);

  assert.match(programs, /notifications\/broadcast/);
  assert.match(programs, /audience:\s*\{/);
  // A geo scope sends `id`; the explicit list sends `ids`. Sending both would
  // let a stray id widen a specific-target send.
  assert.match(programs, /type === "province" \|\| input\.audience\.type === "city"/);
  assert.match(programs, /ids: input\.audience\.ids/);
  assert.match(programs, /deep_link/);
});

test("program writes keep the two status concepts apart", () => {
  const programs = source(SERVICE.programs);

  // `status` is the plugin lifecycle, `post_status` the WordPress visibility,
  // and an unrecognised post status must fall back to publish.
  assert.match(programs, /post_status/);
  assert.match(programs, /normalizePostStatus/);
  // `allow_guest_join` exists on initiatives only.
  assert.match(programs, /if \(kind === "initiatives"\) body\.allow_guest_join/);
  // Participant edits are a whitelisted row update.
  assert.match(programs, /participants\/\$\{segment\(memberId\)\}/);
  assert.match(programs, /body\.joined_at/);
});

test("creators and media outlets use the dedicated listing routes", () => {
  const creators = source(SERVICE.creators);

  assert.match(creators, /\/admin\/creators/);
  assert.match(creators, /\/creators/);
  assert.match(creators, /\/admin\/media-outlets/);
  assert.match(creators, /\/media-outlets/);
  assert.match(creators, /CREATOR_LIST_CAP\s*=\s*50/);
  assert.match(creators, /OUTLET_LIST_CAP\s*=\s*100/);
});

test("admin error codes become Persian sentences, not raw slugs", () => {
  const api = source(SERVICE.api);

  // The UI must never print `forbidden` at a Persian-speaking admin.
  for (const code of ["401", "403", "404", "429"]) {
    assert.match(api, new RegExp(code), `status ${code} needs a message`);
  }
  assert.match(api, /500/);
  assert.match(api, /export function adminErrorMessage/);
});

test("the shared envelope is read once and never trusted blindly", () => {
  const lib = source("lib/meydan-api.ts");

  assert.match(lib, /export type ApiEnvelopeResult/);
  assert.match(lib, /export async function meydanApiEnvelope/);
  // 422 field reasons are translated, not echoed.
  assert.match(lib, /export function fieldErrorMessage/);
  for (const reason of ["required", "invalid", "taken", "not_eligible", "too_long"]) {
    // Object keys are unquoted in the map, so anchor on the key form.
    assert.match(lib, new RegExp(`\\b${reason}:`), `${reason} needs a Persian message`);
  }
});
