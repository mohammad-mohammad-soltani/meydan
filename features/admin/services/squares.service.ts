import type {
  AdminPage,
  Square,
  SquareCreateInput,
  SquareFilters,
  SquareMapPoint,
  SquareStatus,
  SquareUpdateInput,
} from "../types";
import {
  adminDelete,
  adminErrorMessage,
  adminGetEnvelope,
  adminGetItem,
  adminPatch,
  adminPost,
  isNotFound,
  metaInt,
  query,
  segment,
} from "./admin-api";

export { adminErrorMessage, isNotFound };

/* ------------------------------------------------------------------- wire */

type ApiSquareLocation = {
  province_id?: number | null;
  city_id?: number | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type ApiSquare = {
  id: number;
  name?: string | null;
  description?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
  approval_status?: string | null;
  verified?: boolean | null;
  post_status?: string | null;
  owner_user_id?: number | null;
  owner?: { id?: number; name?: string | null } | null;
  admin_note?: string | null;
  eitaa_channel?: string | null;
  bale_channel?: string | null;
  location?: ApiSquareLocation | null;
};

type ApiMapRow = {
  id: number;
  name?: string | null;
  post_status?: string | null;
  approval_status?: string | null;
  verified?: boolean | null;
  location?: ApiSquareLocation | null;
};

/* ------------------------------------------------------------------ mappers */

export function mapSquare(row: ApiSquare): Square {
  return {
    id: Number(row.id),
    name: String(row.name ?? ""),
    description: String(row.description ?? ""),
    avatarUrl: row.avatar_url || null,
    coverUrl: row.cover_url || null,
    approvalStatus: (row.approval_status as SquareStatus) || "pending_verification",
    verified: Boolean(row.verified),
    postStatus: String(row.post_status ?? ""),
    ownerUserId: row.owner_user_id ? Number(row.owner_user_id) : null,
    ownerName: row.owner?.name ? String(row.owner.name) : null,
    adminNote: String(row.admin_note ?? ""),
    eitaaChannel: String(row.eitaa_channel ?? ""),
    baleChannel: String(row.bale_channel ?? ""),
    location: row.location
      ? {
          provinceId: Number(row.location.province_id ?? 0),
          cityId: Number(row.location.city_id ?? 0),
          address: String(row.location.address ?? ""),
          latitude: Number(row.location.latitude ?? 0),
          longitude: Number(row.location.longitude ?? 0),
        }
      : null,
  };
}

function mapMapPoint(row: ApiMapRow): SquareMapPoint | null {
  if (!row.location) return null;
  const latitude = Number(row.location.latitude ?? 0);
  const longitude = Number(row.location.longitude ?? 0);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return {
    id: Number(row.id),
    name: String(row.name ?? ""),
    postStatus: String(row.post_status ?? ""),
    approvalStatus: (row.approval_status as SquareStatus) || "pending_verification",
    verified: Boolean(row.verified),
    location: {
      provinceId: Number(row.location.province_id ?? 0),
      cityId: Number(row.location.city_id ?? 0),
      address: String(row.location.address ?? ""),
      latitude,
      longitude,
    },
  };
}

/* ------------------------------------------------------------------- reads */

export function squaresListPath(filters: SquareFilters, page = 1, perPage = 20): string {
  return `/admin/squares${query({
    q: filters.q.trim(),
    status: filters.status,
    // `verified` is only meaningful when explicitly set; the controller checks
    // `has_param`, so sending "false" is different from omitting it.
    verified: filters.verified === "" ? "" : filters.verified,
    province_id: filters.provinceId,
    city_id: filters.cityId,
    page,
    per_page: perPage,
  })}`;
}

export async function getSquares(
  filters: SquareFilters,
  page = 1,
  perPage = 20,
  init?: RequestInit,
): Promise<AdminPage<Square>> {
  const { data, meta } = await adminGetEnvelope<ApiSquare[]>(
    squaresListPath(filters, page, perPage),
    init);
  const items = (data ?? []).map(mapSquare);
  const total = metaInt(meta, ["total"], items.length);
  const perPageReported = metaInt(meta, ["per_page"], perPage);
  const pages = metaInt(
    meta,
    ["pages"],
    perPageReported > 0 ? Math.max(1, Math.ceil(total / perPageReported)) : 1,
  );

  return {
    items,
    page: metaInt(meta, ["page"], page),
    perPage: perPageReported,
    total,
    pages,
    paginated: "total" in meta,
  };
}

/** `null` (rather than a throw,) when the square is gone, so the route can 404. */
export async function getSquare(
  id: string,
  init?: RequestInit,
): Promise<Square | null> {
  try {
    return mapSquare(await adminGetItem<ApiSquare>(`/admin/squares/${segment(id)}`, init));
  } catch (reason) {
    if (isNotFound(reason)) return null;
    throw reason;
  }
}

export async function getSquareMap(init?: RequestInit): Promise<SquareMapPoint[]> {
  const rows = await adminGetItem<ApiMapRow[]>("/admin/squares/map", init);
  return (rows ?? [])
    .map(mapMapPoint)
    .filter((row): row is SquareMapPoint => row !== null);
}

/** Overview counters for `/admin`. */
export async function countSquares(
  status: SquareStatus,
  init?: RequestInit,
): Promise<number> {
  const { meta } = await adminGetEnvelope<ApiSquare[]>(
    `/admin/squares${query({ status, per_page: 1 })}`,
    init);
  return metaInt(meta, ["total"], 0);
}

/* ------------------------------------------------------------------ writes */

/**
 * `POST /admin/squares` deliberately has no `name` field: the square title is
 * `square_name`, and the owner account is created behind it.
 */
export function squareCreateBody(input: SquareCreateInput): Record<string, unknown> {
  return {
    phone: input.phone.trim(),
    full_name: input.fullName.trim(),
    email: input.email.trim(),
    square_name: input.squareName.trim(),
    description: input.description,
    contact_name: input.contactName.trim(),
    contact_phone: input.contactPhone.trim(),
    start_date: input.startDate.trim(),
    avatar_media_id: input.avatarMediaId ?? 0,
    province_id: input.provinceId ?? 0,
    city_id: input.cityId ?? 0,
    address: input.address.trim(),
    latitude: input.latitude,
    longitude: input.longitude,
    location_source: input.locationSource,
    eitaa_channel: input.eitaaChannel.trim(),
    bale_channel: input.baleChannel.trim(),
    status: input.status,
  };
}

export async function createSquare(input: SquareCreateInput, init?: RequestInit): Promise<Square> {
  const created = await adminPost<ApiSquare>("/admin/squares", squareCreateBody(input), init);
  // The controller answers 201 with the square itself, but a body-less 201
  // would break the redirect; the caller only needs the id.
  return mapSquare(created ?? ({ id: 0 } as ApiSquare));
}

/**
 * PATCH only carries the keys the caller actually changed. Location travels as
 * the full five-field set, because `SquareAdminService::update` requires all of
 * `province_id, city_id, address, latitude, longitude` to move a square.
 */
export function squareUpdateBody(input: SquareUpdateInput): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  if (input.squareName !== undefined) body.square_name = input.squareName.trim();
  if (input.description !== undefined) body.description = input.description;
  if (input.contactName !== undefined) body.contact_name = input.contactName.trim();
  if (input.contactPhone !== undefined) body.contact_phone = input.contactPhone.trim();
  if (input.startDate !== undefined) body.start_date = input.startDate.trim();
  if (input.avatarMediaId !== undefined) body.avatar_media_id = input.avatarMediaId ?? 0;
  if (input.eitaaChannel !== undefined) body.eitaa_channel = input.eitaaChannel.trim();
  if (input.baleChannel !== undefined) body.bale_channel = input.baleChannel.trim();

  if (input.location) {
    body.province_id = input.location.provinceId;
    body.city_id = input.location.cityId;
    body.address = input.location.address.trim();
    body.latitude = input.location.latitude;
    body.longitude = input.location.longitude;
    body.location_source = input.location.locationSource ?? "manual";
  }

  return body;
}

export async function updateSquare(id: string, input: SquareUpdateInput, init?: RequestInit): Promise<Square> {
  return mapSquare(
    await adminPatch<ApiSquare>(`/admin/squares/${segment(id)}`, squareUpdateBody(input), init),
  );
}

/**
 * Changes the approval status. `admin_note` is stored on the square and is
 * what the owner sees when the request is rejected.
 */
export async function setSquareStatus(
  id: string,
  status: SquareStatus,
  adminNote: string,
  init?: RequestInit,
): Promise<Square> {
  return mapSquare(
    await adminPost<ApiSquare>(`/admin/squares/${segment(id)}/status`, {
      status,
      admin_note: adminNote,
    },
    init,
  ),
  );
}

/** Soft delete: `wp_trash_post`, so the record stays recoverable in wp-admin. */
export async function deleteSquare(id: string, init?: RequestInit): Promise<void> {
  await adminDelete<{ deleted?: boolean }>(`/admin/squares/${segment(id)}`, init);
}
