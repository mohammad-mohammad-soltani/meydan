import type {
  GeoOption,
  InitiativeMember,
  NotificationInput,
  Program,
  ProgramInput,
  ProgramPostStatus,
  ProgramScheduleRow,
  ProgramStatus,
} from "../types";
import {
  PROGRAM_POST_STATUSES,
  PROGRAM_STATUSES,
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

/** The two CPTs share one controller, so they share this service. */
export type ProgramKind = "initiatives" | "campaigns";

/* ------------------------------------------------------------------- wire */

type ApiProgram = {
  id: number;
  title?: string | null;
  description?: string | null;
  post_status?: string | null;
  cta_label?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  status?: string | null;
  allow_guest_join?: boolean | null;
  participant_count?: number | null;
  current?: boolean | null;
  labels?: unknown[] | null;
  linked_content?: unknown[] | null;
  schedule?: unknown[] | null;
  order?: number | null;
};

type ApiMember = {
  id: number;
  member_type?: string | null;
  user_id?: number | null;
  guest_id?: number | null;
  joined_at?: string | null;
  status?: string | null;
};

function mapSchedule(rows: ApiProgram["schedule"]): ProgramScheduleRow[] {
  return (rows ?? [])
    .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object")
    .map((row) => ({
      title: String(row.title ?? ""),
      description: String(row.description ?? ""),
      startsAt: String(row.starts_at ?? row.startsAt ?? ""),
      endsAt: String(row.ends_at ?? row.endsAt ?? ""),
      locationLabel: String(row.location_label ?? row.locationLabel ?? ""),
      status: String(row.status ?? "published"),
    }));
}

export function mapProgram(row: ApiProgram): Program {
  return {
    id: Number(row.id),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    postStatus: String(row.post_status ?? ""),
    ctaLabel: String(row.cta_label ?? ""),
    startsAt: String(row.starts_at ?? ""),
    endsAt: String(row.ends_at ?? ""),
    status: String(row.status ?? "active"),
    allowGuestJoin: Boolean(row.allow_guest_join),
    participantCount: Number(row.participant_count ?? 0),
    current: Boolean(row.current),
    labels: (row.labels ?? []).map(String).filter(Boolean),
    linkedContent: (row.linked_content ?? [])
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0),
    schedule: mapSchedule(row.schedule),
    order: Number(row.order ?? 0),
  };
}

export function mapMember(row: ApiMember): InitiativeMember {
  return {
    id: Number(row.id),
    memberType: String(row.member_type ?? ""),
    userId: row.user_id ? Number(row.user_id) : null,
    guestId: row.guest_id ? Number(row.guest_id) : null,
    joinedAt: String(row.joined_at ?? ""),
    status: String(row.status ?? ""),
  };
}

/* ------------------------------------------------------------------- reads */

export type ProgramPage = {
  items: Program[];
  page: number;
  perPage: number;
  total: number;
  /** Derived: the backend reports `total` but not always `pages`. */
  pages?: number;
};

/** The controller caps `per_page` at 50 for both CPTs. */
export const PROGRAM_LIST_PAGE_SIZE = 50;

export async function getPrograms(
  kind: ProgramKind,
  page = 1,
  perPage = 50,
  init?: RequestInit,
): Promise<ProgramPage> {
  const { data, meta } = await adminGetEnvelope<ApiProgram[]>(
    `/admin/${kind}${query({ page, per_page: perPage })}`,
    init,
  );
  const total = metaInt(meta, ["total"], (data ?? []).length);
  const perPageActual = metaInt(meta, ["per_page"], perPage);
  const pages = metaInt(meta, ["pages"], Math.max(1, Math.ceil(total / Math.max(1, perPageActual))));

  return {
    items: (data ?? []).map(mapProgram),
    page: metaInt(meta, ["page"], page),
    perPage: perPageActual,
    total,
    pages,
  };
}

export async function getProgram(
  kind: ProgramKind,
  id: string,
  init?: RequestInit,
): Promise<Program | null> {
  try {
    return mapProgram(await adminGetItem<ApiProgram>(`/admin/${kind}/${segment(id)}`, init));
  } catch (reason) {
    if (isNotFound(reason)) return null;
    throw reason;
  }
}

/** `LIMIT 100` in the controller — the view labels the ceiling. */
export const PARTICIPANT_LIST_CAP = 100;

export async function getParticipants(
  id: string,
  init?: RequestInit,
): Promise<InitiativeMember[]> {
  const rows = await adminGetItem<ApiMember[]>(
    `/admin/initiatives/${segment(id)}/participants`,
    init,
  );
  return (rows ?? []).map(mapMember);
}

/* ------------------------------------------------------------------ writes */

/** Any post status outside the four allowed ones is coerced to `publish`. */
export function normalizePostStatus(value: string): ProgramPostStatus {
  return PROGRAM_POST_STATUSES.includes(value as ProgramPostStatus)
    ? (value as ProgramPostStatus)
    : "publish";
}

export function programBody(kind: ProgramKind, input: ProgramInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    title: input.title.trim(),
    description: input.description,
    cta_label: input.ctaLabel.trim(),
    starts_at: input.startsAt.trim(),
    ends_at: input.endsAt.trim(),
    status: PROGRAM_STATUSES.includes(input.status as ProgramStatus)
      ? input.status
      : "draft",
    labels: input.labels,
    linked_content: input.linkedContent,
    schedule: input.schedule,
    order: input.order,
    post_status: normalizePostStatus(input.postStatus),
  };

  // `allow_guest_join` is initiative-only: the campaign branch ignores it.
  if (kind === "initiatives") body.allow_guest_join = input.allowGuestJoin;
  return body;
}

export async function createProgram(
  kind: ProgramKind,
  input: ProgramInput,
  init?: RequestInit,
): Promise<Program> {
  return mapProgram(await adminPost<ApiProgram>(`/admin/${kind}`, programBody(kind, input), init));
}

export async function updateProgram(
  kind: ProgramKind,
  id: string,
  input: ProgramInput,
  init?: RequestInit,
): Promise<Program> {
  return mapProgram(
    await adminPatch<ApiProgram>(`/admin/${kind}/${segment(id)}`, programBody(kind, input), init),
  );
}

/** Soft delete (`wp_trash_post`). */
export async function deleteProgram(kind: ProgramKind, id: string, init?: RequestInit): Promise<void> {
  await adminDelete<{ deleted?: boolean }>(`/admin/${kind}/${segment(id)}`, init);
}

/**
 * Participant edits are a raw row update: only the two columns the controller
 * whitelists (`status`, `joined_at`) may travel.
 */
export async function updateParticipant(
  initiativeId: string,
  memberId: number,
  patch: { status?: string; joinedAt?: string },
  init?: RequestInit,
): Promise<InitiativeMember> {
  const body: Record<string, unknown> = {};
  if (patch.status !== undefined) body.status = patch.status;
  if (patch.joinedAt !== undefined) body.joined_at = patch.joinedAt;

  return mapMember(
    await adminPatch<ApiMember>(
      `/admin/initiatives/${segment(initiativeId)}/participants/${segment(memberId)}`,
      body,
      init,
    ),
  );
}

/* -------------------------------------------------------- notifications */

/**
 * `POST /admin/notifications/broadcast` takes the audience as a nested object
 * and answers `{ created }` — the number of rows written, which is the only
 * feedback the screen can show.
 */
export async function broadcastNotification(input: NotificationInput, init?: RequestInit): Promise<number> {
  const result = await adminPost<{ created?: number }>("/admin/notifications/broadcast", {
    title: input.title.trim(),
    body: input.body.trim(),
    audience: {
      type: input.audience.type,
      ...(input.audience.type === "province" || input.audience.type === "city"
        ? { id: input.audience.id }
        : {}),
      ...(input.audience.type === "specific_ids" ? { ids: input.audience.ids } : {}),
    },
    ...(input.deepLink.trim() ? { deep_link: input.deepLink.trim() } : {}),
  },
    init,
  );

  return Number(result?.created ?? 0);
}

/* --------------------------------------------------------------------- geo */

/** Provinces/cities are public reference data; the admin filters reuse them. */
export async function getProvinces(init?: RequestInit): Promise<GeoOption[]> {
  return adminGetItem<GeoOption[]>("/geo/provinces", init);
}

export async function getCities(provinceId: number, init?: RequestInit): Promise<GeoOption[]> {
  return adminGetItem<GeoOption[]>(`/geo/cities?province_id=${provinceId}`, init);
}
