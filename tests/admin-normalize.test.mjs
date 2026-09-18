import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * These run the admin form normalizers directly. They are pure — no React, no
 * fetch — so the whole payload-cleaning layer is testable without a server, and
 * the tests pin the behaviours the backend silently forgives (a 0,0 coordinate
 * that would place a square off the coast of Africa, an unknown social platform,
 * an empty audience that would broadcast to nobody).
 */
async function load(relative) {
  const file = path.join(root, relative);
  assert.ok(existsSync(file), `${relative} must exist`);
  return import(pathToFileURL(file).href);
}

test("Persian and Arabic digits fold to Latin before validation", async () => {
  const { foldDigits, parseCoordinate, optionalId } = await load(
    "features/admin/lib/normalize.ts",
  );

  assert.equal(foldDigits("۳۵٫۵"), "35٫5");
  assert.equal(foldDigits("۱۲۳۴"), "1234");
  assert.equal(foldDigits("٤٥٦"), "456");
  assert.equal(foldDigits("51.389"), "51.389");

  // The backend's `coordinate()` folds these too; a form that did not would
  // reject a perfectly valid number typed on a Persian keyboard.
  assert.equal(parseCoordinate("۳۵.۶۸۹۲"), 35.6892);
  assert.equal(parseCoordinate(""), null);
  assert.equal(parseCoordinate("abc"), null);
  assert.equal(optionalId("۰"), null, "0 is an absence, not an id");
  assert.equal(optionalId("۱۲"), 12);
});

test("a 0,0 coordinate is rejected because the API would treat it as absent", async () => {
  const { isValidCoordinate, parseCoordinate } = await load("features/admin/lib/normalize.ts");

  assert.equal(isValidCoordinate(35.6892, 51.389), true);
  assert.equal(isValidCoordinate(0, 0), false, "0,0 is the null island, not Tehran");
  assert.equal(isValidCoordinate(91, 51), false);
  assert.equal(isValidCoordinate(35, 181), false);
  assert.equal(parseCoordinate("0"), 0);
});

test("square edit omits an untouched avatar and includes a replacement", async () => {
  const { buildSquareUpdate } = await load("features/admin/lib/normalize.ts");
  const form = {
    squareName: "میدان",
    description: "",
    contactName: "",
    contactPhone: "",
    startDate: "",
    avatarMediaId: null,
    eitaaChannel: "",
    baleChannel: "",
    geoMoved: false,
    location: { provinceId: null, cityId: null, address: "", latitude: null, longitude: null },
  };
  assert.equal("avatarMediaId" in buildSquareUpdate(form), false);
  assert.equal(buildSquareUpdate({ ...form, avatarMediaId: 712 }).avatarMediaId, 712);
});

test("schedule rows are cleaned, ordered and stripped of blanks", async () => {
  const { normalizeSchedule } = await load("features/admin/lib/normalize.ts");

  const rows = normalizeSchedule([
    { title: "", startsAt: "2026-01-01T10:00" },
    { title: "  افتتاحیه  ", startsAt: "2026-01-01T10:00", endsAt: "2026-01-01T12:00" },
    { title: "پنل", startsAt: "2026-01-01T14:00" },
  ]);

  // A row with no title never becomes broken meta; the rest keep their order.
  assert.equal(rows.length, 2);
  assert.equal(rows[0].title, "افتتاحیه");
  assert.equal(rows[0].startsAt, "2026-01-01T10:00");
  assert.equal(rows[0].endsAt, "2026-01-01T12:00");
  assert.equal(rows[1].title, "پنل");
  // The normalizer only cleans rows; `position` is assigned by index.
  assert.equal(rows[1].position, 2);

  // A null list is a legal "not filled in yet" and yields no rows.
  assert.deepEqual(normalizeSchedule(null), []);
});

test("social links keep only known platforms with a usable url", async () => {
  const { normalizeSocialLinks } = await load("features/admin/lib/normalize.ts");

  const links = normalizeSocialLinks([
    { platform: "instagram", url: "https://instagram.com/x" },
    { platform: "myspace", url: "https://myspace.com/x" },
    { platform: "website", url: "   " },
    { platform: "telegram", url: "https://t.me/x", label: "کانال" },
  ]);

  // `myspace` is not in the vocabulary, so it becomes `other`; a url-less row
  // is dropped entirely.
  assert.deepEqual(
    links.map((link) => link.platform),
    ["instagram", "other", "telegram"],
  );
  assert.equal(links[2].label, "کانال");
});

test("linked content and tag lists lose duplicates and empties", async () => {
  const { normalizeLinkedContent, normalizeIds, normalizeTags, normalizeLabels } = await load(
    "features/admin/lib/normalize.ts",
  );

  assert.deepEqual(
    normalizeLinkedContent([{ contentId: 7 }, { contentId: 7 }, { contentId: 0 }, { contentId: 9 }]),
    [7, 9],
  );
  assert.deepEqual(normalizeIds(["۴", 4, "x", -1, 0, 12]), [4, 12]);
  assert.deepEqual(normalizeTags(["میدان", " ", "میدان", "روایت"]), ["میدان", "روایت"]);
  assert.deepEqual(normalizeLabels("الف، ب\nج"), ["الف", "ب", "ج"]);
});

test("the broadcast audience only carries the keys its type uses", async () => {
  const { normalizeAudience } = await load("features/admin/lib/normalize.ts");

  // `ids` must not survive a province-wide send — that would widen the fan-out.
  const province = normalizeAudience({ type: "province", id: 12, ids: [1, 2, 3] });
  assert.deepEqual(province, { type: "province", id: 12, ids: [] });

  const city = normalizeAudience({ type: "city", id: 0, ids: [5] });
  assert.deepEqual(city, { type: "city", id: null, ids: [] });

  const specific = normalizeAudience({ type: "specific_ids", id: 9, ids: [7, 7, "۸"] });
  assert.deepEqual(specific, { type: "specific_ids", id: null, ids: [7, 8] });

  const all = normalizeAudience({ type: "all", id: 3, ids: [1] });
  assert.deepEqual(all, { type: "all", id: null, ids: [] });

  // An unknown type falls back to the safest scope.
  assert.deepEqual(normalizeAudience({ type: "everyone" }).type, "all");
});

test("broadcast validation mirrors the backend's hard rules", async () => {
  const { validateBroadcast, normalizeAudience } = await load(
    "features/admin/lib/normalize.ts",
  );

  const empty = validateBroadcast({
    title: " ",
    body: "",
    audience: normalizeAudience({ type: "all" }),
    deepLink: "",
  });
  assert.equal(empty.title, "required");
  assert.equal(empty.body, "required");

  const missingTarget = validateBroadcast({
    title: "عنوان",
    body: "متن",
    audience: normalizeAudience({ type: "specific_ids", ids: [] }),
    deepLink: "",
  });
  assert.equal(missingTarget.ids, "required");

  const missingGeo = validateBroadcast({
    title: "عنوان",
    body: "متن",
    audience: normalizeAudience({ type: "province", id: null }),
    deepLink: "",
  });
  assert.equal(missingGeo.id, "required");

  // The deep link opens inside the app, so an external url is not a valid link.
  const external = validateBroadcast({
    title: "عنوان",
    body: "متن",
    audience: normalizeAudience({ type: "all" }),
    deepLink: "https://evil.example/steal",
  });
  assert.equal(external.deepLink, "invalid");

  const valid = validateBroadcast({
    title: "عنوان",
    body: "متن",
    audience: normalizeAudience({ type: "all" }),
    deepLink: "/explore",
  });
  assert.deepEqual(valid, {});
});

test("date helpers accept the Gregorian dates the API stores", async () => {
  const { isValidIsoDate, isValidDateRange } = await load("features/admin/lib/normalize.ts");

  assert.equal(isValidIsoDate("2026-09-17"), true);
  assert.equal(isValidIsoDate("2026-02-30"), false, "February has no 30th");
  assert.equal(isValidIsoDate("۱۷/۰۹/۲۰۲۶"), false);
  assert.equal(isValidIsoDate(""), false);

  assert.equal(isValidDateRange("2026-01-01", "2026-02-01"), true);
  assert.equal(isValidDateRange("2026-02-01", "2026-01-01"), false);
  // An open-ended range is legal: it says "still running".
  assert.equal(isValidDateRange("2026-01-01", ""), true);
});

test("the square create form validates the owner phone the API will check", async () => {
  const { isIranianMobile, normalizeMobile, isEmail } = await load("features/admin/lib/normalize.ts");

  assert.equal(isIranianMobile("09121234567"), true);
  assert.equal(isIranianMobile("۰۹۱۲۱۲۳۴۵۶۷"), true, "Persian digits are accepted");
  assert.equal(isIranianMobile("+989121234567"), true);
  assert.equal(isIranianMobile("0912123456"), false);
  assert.equal(isIranianMobile("08121234567"), false);

  assert.equal(normalizeMobile("+98 912 123 4567"), "09121234567");
  assert.equal(normalizeMobile("۰۹۱۲۱۲۳۴۵۶۷"), "09121234567");

  assert.equal(isEmail("a@b.co"), true);
  assert.equal(isEmail("not-an-email"), false);
});

test("the square create form reports the same field keys the API does", async () => {
  const { validateSquareCreate } = await load("features/admin/lib/normalize.ts");

  // The form always submits a fully-populated draft, so the "all blank" case is
  // every field present as an empty string rather than a missing key.
  const blank = {
    phone: "",
    fullName: "",
    email: "",
    squareName: "",
    description: "",
    contactName: "",
    contactPhone: "",
    startDate: "",
    avatarMediaId: null,
    provinceId: null,
    cityId: null,
    address: "",
    latitude: null,
    longitude: null,
    eitaaChannel: "",
    baleChannel: "",
    status: "pending_verification",
  };
  const empty = validateSquareCreate(blank);
  // Field names are the API's own (`square_name`, not `name`), so a local
  // failure and a server 422 land on the same form field.
  assert.ok("square_name" in empty, "the square name is reported as square_name");
  assert.ok("province_id" in empty);
  assert.ok("city_id" in empty);
  assert.ok("address" in empty);
  assert.ok("phone" in empty);

  const valid = {
    phone: "09121234567",
    fullName: "حساب میدان",
    email: "owner@example.com",
    squareName: "میدان آزادی",
    description: "",
    contactName: "مدیر میدان",
    contactPhone: "۰۹۱۲۱۲۳۴۵۶۷",
    startDate: "2024-01-01",
    avatarMediaId: null,
    provinceId: 1,
    cityId: 2,
    address: "تهران، میدان آزادی",
    latitude: 35.7,
    longitude: 51.4,
    eitaaChannel: "",
    baleChannel: "",
    status: "pending_verification",
  };
  assert.deepEqual(validateSquareCreate(valid), {});

  // An out-of-range coordinate pair is caught before the round-trip; a missing
  // pair is not, because the backend substitutes Tehran's centre.
  const halfPair = validateSquareCreate({
    ...valid,
    latitude: 0,
    longitude: 0,
  });
  assert.equal(halfPair.latitude, "invalid");
  assert.equal(halfPair.longitude, "invalid");

  // Only the two documented statuses are accepted, everything else is a 422.
  const badStatus = validateSquareCreate({ ...valid, status: "rejected" });
  assert.equal(badStatus.status, "invalid");
});
