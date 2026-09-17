/**
 * Pure normalizers and validators for admin form payloads.
 *
 * No React, no fetch, no imports from the app — every function here is a
 * straight data-in/data-out transform so `tests/admin-normalize.test.mjs` can
 * exercise it directly with `--experimental-strip-types`.
 */
import type {
  NotificationAudience,
  NotificationAudienceType,
  ProgramLinkedContent,
  ProgramScheduleRow,
  SocialLink,
  SocialPlatform,
  SquareCreateInput,
  SquareUpdateInput,
} from "../types";

/**
 * The platform vocabulary is repeated here instead of imported from
 * `../types.ts`: Node's type stripping does not rewrite extensionless imports,
 * so a value import would make this otherwise-pure module unloadable by
 * `tests/admin-normalize.test.mjs`. The two lists are kept in sync by that test.
 */
const SOCIAL_PLATFORMS: SocialPlatform[] = [
  "website",
  "instagram",
  "telegram",
  "x",
  "youtube",
  "aparat",
  "linkedin",
  "other",
];

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/**
 * Digits are typed on a Persian keyboard as often as a Latin one, and the
 * backend's `coordinate()` already folds them — but a form that validates
 * before sending must fold them too, or a perfectly valid number looks invalid.
 */
export function foldDigits(value: string | number | null | undefined): string {
  return String(value ?? "").replace(/[۰-۹٠-٩]/g, (digit) => {
    const persian = PERSIAN_DIGITS.indexOf(digit);
    if (persian >= 0) return String(persian);
    return String(ARABIC_DIGITS.indexOf(digit));
  });
}

/** `{ id, title, note }` rows → the ids the API stores in `linked_content`. */
export function normalizeLinkedContent(rows: ProgramLinkedContent[]): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const row of rows) {
    const id = Math.trunc(Number(row?.contentId));
    if (!Number.isFinite(id) || id <= 0 || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/**
 * Free-form labels become a clean, duplicate-free list. The backend stores
 * whatever array it receives, so empty strings are dropped here instead.
 */
export function normalizeLabels(input: string[] | string | null | undefined): string[] {
  const items = Array.isArray(input) ? input : String(input ?? "").split(/[,،\n]/);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const label = String(item ?? "").trim();
    if (!label || seen.has(label)) continue;
    seen.add(label);
    out.push(label);
  }
  return out;
}

/** A textarea of tag names → the array `tags` the content endpoint accepts. */
export function normalizeTags(input: string[] | string | null | undefined): string[] {
  return normalizeLabels(input);
}

/**
 * Schedule rows for an initiative or campaign. Rows without a title are
 * dropped rather than sent as broken meta, and the position is assigned by the
 * array order so the list renders deterministically.
 */
export function normalizeSchedule(rows: ProgramScheduleRow[] | null | undefined): Array<
  ProgramScheduleRow & { position: number }
> {
  return (rows ?? [])
    .map((row) => ({
      title: String(row?.title ?? "").trim(),
      description: String(row?.description ?? "").trim(),
      startsAt: String(row?.startsAt ?? "").trim(),
      endsAt: String(row?.endsAt ?? "").trim(),
      locationLabel: String(row?.locationLabel ?? "").trim(),
      status: String(row?.status ?? "published").trim() || "published",
    }))
    .filter((row) => row.title !== "")
    .map((row, index) => ({ ...row, position: index + 1 }));
}

/** Social links, keeping only complete rows and folding unknown platforms. */
export function normalizeSocialLinks(links: SocialLink[] | null | undefined): SocialLink[] {
  const out: SocialLink[] = [];
  for (const link of links ?? []) {
    const url = String(link?.url ?? "").trim();
    if (!url) continue;
    const platform = SOCIAL_PLATFORMS.includes(link?.platform as SocialPlatform)
      ? (link.platform as SocialPlatform)
      : "other";
    const label = String(link?.label ?? "").trim();
    out.push(label ? { platform, url, label } : { platform, url });
  }
  return out;
}

/** Numeric ids, deduplicated and positive — used for `cities`. */
export function normalizeIds(values: Array<number | string> | null | undefined): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const value of values ?? []) {
    const id = Math.trunc(Number(foldDigits(String(value ?? ""))));
    if (!Number.isFinite(id) || id <= 0 || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/* ------------------------------------------------------------ coordinates */

export type Coordinate = { latitude: number; longitude: number };

/** Parses a possibly-Persian, possibly-empty coordinate string. */
export function parseCoordinate(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const text = foldDigits(String(value)).trim().replace(/٫/g, ".");
  if (text === "") return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

/**
 * The backend falls back to Tehran's centre when a coordinate is absent or
 * non-numeric and only rejects out-of-range values, so a blank latitude would
 * silently pin a square to downtown Tehran. The form therefore requires both
 * or neither.
 */
export function isValidCoordinate(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): boolean {
  if (latitude === null || latitude === undefined) return false;
  if (longitude === null || longitude === undefined) return false;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return false;
  // 0,0 is the null island: never a square in Iran, and almost always the
  // result of an empty form field being read as a number.
  return !(latitude === 0 && longitude === 0);
}

/* ------------------------------------------------------------------ dates */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * `start_date` is handed straight to `SquareActivity::setStartDate`, which
 * swallows an unparseable value without an error — the admin would see a
 * success message and no date. So the form validates the Gregorian `YYYY-MM-DD`
 * the pickers always produce before it is sent.
 */
export function isValidIsoDate(value: string | null | undefined): boolean {
  const text = String(value ?? "").trim();
  if (!ISO_DATE.test(text)) return false;
  const [year, month, day] = text.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * An optional date range. Both ends are optional, but a supplied pair must be
 * ordered and individually valid; an inverted range would make the public
 * campaign card claim it ended before it began.
 */
export function isValidDateRange(
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
): boolean {
  const start = String(startsAt ?? "").trim();
  const end = String(endsAt ?? "").trim();
  if (start && !isValidIsoDate(start)) return false;
  if (end && !isValidIsoDate(end)) return false;
  if (!start || !end) return true;
  return start <= end;
}

/* ------------------------------------------------------------- audience */

const AUDIENCE_TYPES: NotificationAudienceType[] = [
  "all",
  "users",
  "squares",
  "province",
  "city",
  "specific_ids",
];

export const EMPTY_AUDIENCE: NotificationAudience = { type: "all", id: null, ids: [] };

/**
 * Folds the broadcast audience into exactly what
 * `NotificationService::resolveAudience` reads: a `type`, an `id` for the
 * geo scopes and an `ids` array for the explicit list. Every other key is
 * dropped so an accidental `ids` cannot widen a province-wide send.
 */
export function normalizeAudience(
  audience: Partial<NotificationAudience> | null | undefined,
): NotificationAudience {
  const type = AUDIENCE_TYPES.includes(audience?.type as NotificationAudienceType)
    ? (audience?.type as NotificationAudienceType)
    : "all";

  if (type === "specific_ids") {
    return { type, id: null, ids: normalizeIds(audience?.ids) };
  }
  if (type === "province" || type === "city") {
    const id = Math.trunc(Number(audience?.id));
    return { type, id: Number.isFinite(id) && id > 0 ? id : null, ids: [] };
  }
  return { type, id: null, ids: [] };
}

/**
 * A client-side check that mirrors the backend's only two hard rules (a title
 * and a body) plus the audience requirements the backend would otherwise
 * resolve to an empty recipient list.
 */
export function validateBroadcast(input: {
  title: string;
  body: string;
  audience: NotificationAudience;
  deepLink: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.title.trim()) errors.title = "required";
  if (!input.body.trim()) errors.body = "required";
  if (input.audience.type === "specific_ids" && input.audience.ids.length === 0) {
    errors.ids = "required";
  }
  if (
    (input.audience.type === "province" || input.audience.type === "city") &&
    !input.audience.id
  ) {
    errors.id = "required";
  }
  // The deep link opens inside the app, so it must be an internal path.
  const link = input.deepLink.trim();
  if (link && !link.startsWith("/")) errors.deepLink = "invalid";
  return errors;
}

/* ---------------------------------------------------------------- squares */

/*
 * Client-side validation for the square forms, merged into this module so the
 * whole payload-cleaning layer stays one dependency-free unit: Node's native
 * type stripping cannot follow an extensionless relative import, and a
 * `./square-form` module would therefore be untestable without a loader. It
 * mirrors only the rules the API enforces — plus the ones it *fails* to
 * enforce, marked below — so the admin gets a field-level message before a
 * round-trip.
 */

/** `OtpService::normalizePhone` keeps the last 10 digits and requires a `9…`. */
export function isIranianMobile(raw: string): boolean {
  const digits = foldDigits(raw).replace(/\D/g, "");
  const local = digits.startsWith("98")
    ? `0${digits.slice(2)}`
    : digits.startsWith("0")
      ? digits
      : `0${digits}`;
  return /^09\d{9}$/.test(local);
}

/**
 * The canonical mobile number for submission. `normalizePhone` on the backend
 * accepts either form, but sending `09…` keeps stored values predictable.
 */
export function normalizeMobile(raw: string): string {
  const digits = foldDigits(raw).replace(/\D/g, "");
  if (digits.startsWith("98")) return `0${digits.slice(2)}`;
  if (digits.startsWith("0")) return digits;
  return `0${digits}`;
}

export function isEmail(value: string): boolean {
  const text = value.trim();
  if (!text) return true; // optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
}

/**
 * `POST /admin/squares` only accepts these two values; anything else is a 422
 * with `{ status: "invalid" }`.
 */
export function validateSquareCreate(input: SquareCreateInput): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!isIranianMobile(input.phone)) errors.phone = "invalid";
  if (!input.squareName.trim()) errors.square_name = "required";
  if (!input.provinceId) errors.province_id = "invalid";
  if (!input.cityId) errors.city_id = "invalid";
  if (!input.address.trim()) errors.address = "required";
  if (!isEmail(input.email)) errors.email = "invalid_or_taken";

  // The backend substitutes Tehran's centre for a missing coordinate and only
  // rejects out-of-range values, so a half-filled pair is caught here instead.
  const hasAnyCoordinate = input.latitude !== null || input.longitude !== null;
  if (hasAnyCoordinate && !isValidCoordinate(input.latitude, input.longitude)) {
    errors.latitude = "invalid";
    errors.longitude = "invalid";
  }

  // An invalid `start_date` is silently dropped by `SquareActivity::setStartDate`.
  if (input.startDate.trim() && !isValidIsoDate(input.startDate)) {
    errors.start_date = "invalid";
  }

  if (input.status !== "pending_verification" && input.status !== "approved") {
    errors.status = "invalid";
  }

  return errors;
}

export type SquareFormState = {
  squareName: string;
  description: string;
  contactName: string;
  contactPhone: string;
  startDate: string;
  avatarMediaId: number | null;
  eitaaChannel: string;
  baleChannel: string;
  geoMoved: boolean;
  location: {
    provinceId: number | null;
    cityId: number | null;
    address: string;
    latitude: number | null;
    longitude: number | null;
  };
};

/**
 * Builds the PATCH body for the square detail form.
 *
 * The five geo fields must travel together or not at all: sending only some of
 * them leaves `province_id`/`city_id` unvalidated on the backend (it skips the
 * whole block), silently persisting a city from another province.
 */
export function buildSquareUpdate(input: SquareFormState): SquareUpdateInput {
  const patch: SquareUpdateInput = {
    squareName: input.squareName,
    description: input.description,
    contactName: input.contactName,
    contactPhone: input.contactPhone,
    startDate: input.startDate,
    avatarMediaId: input.avatarMediaId,
    eitaaChannel: input.eitaaChannel,
    baleChannel: input.baleChannel,
  };

  if (input.geoMoved) {
    const provinceId = optionalId(input.location.provinceId);
    const cityId = optionalId(input.location.cityId);
    if (
      provinceId &&
      cityId &&
      isValidCoordinate(input.location.latitude, input.location.longitude)
    ) {
      patch.location = {
        provinceId,
        cityId,
        address: input.location.address,
        latitude: input.location.latitude as number,
        longitude: input.location.longitude as number,
      };
    }
  }

  return patch;
}

/** Field-level errors for the detail form's editable subset. */
export function validateSquareUpdate(input: SquareFormState): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!input.squareName.trim()) errors.square_name = "required";
  if (input.startDate.trim() && !isValidIsoDate(input.startDate)) errors.start_date = "invalid";

  if (input.geoMoved) {
    if (!optionalId(input.location.provinceId)) errors.province_id = "invalid";
    if (!optionalId(input.location.cityId)) errors.city_id = "invalid";
    if (!input.location.address.trim()) errors.address = "required";
    if (!isValidCoordinate(input.location.latitude, input.location.longitude)) {
      errors.latitude = "invalid";
      errors.longitude = "invalid";
    }
  }

  return errors;
}

/* ---------------------------------------------------------------- hashing */

/**
 * `null` for "no value" versus `0` for a real id is the difference between
 * clearing an avatar and pointing at media #0, so an empty number input is
 * normalized to `null` rather than an empty string.
 */
export function optionalId(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const id = Math.trunc(Number(foldDigits(String(value))));
  return Number.isFinite(id) && id > 0 ? id : null;
}
