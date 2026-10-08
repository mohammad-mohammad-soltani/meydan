import type { AdminListResult } from "../types";
import { adminGetItem, adminPatch, adminErrorMessage, query, segment } from "./admin-api";

export { adminErrorMessage };

export type SpeakerApplicationStatus = "pending" | "approved" | "rejected";

export const SPEAKER_APPLICATION_STATUS_LABELS: Record<SpeakerApplicationStatus, string> = {
  pending: "در انتظار بررسی",
  approved: "تأییدشده",
  rejected: "ردشده",
};

export type SpeakerApplicationRow = {
  id: number;
  userId: number;
  handle: string;
  fullName: string;
  city: string;
  categoryName: string;
  topics: string;
  phone: string;
  link: string | null;
  about: string | null;
  status: SpeakerApplicationStatus;
  verified: boolean;
  adminNote: string | null;
  createdAt: string;
};

type ApiRow = {
  id: number;
  user_id: number;
  handle?: string | null;
  full_name: string;
  city: string;
  category?: { name?: string } | null;
  topics: string;
  phone: string;
  link?: string | null;
  about?: string | null;
  status: string;
  verified?: boolean;
  admin_note?: string | null;
  created_at: string;
};

const LIST_CAP = 200;

function map(row: ApiRow): SpeakerApplicationRow {
  return {
    id: row.id,
    userId: row.user_id,
    handle: row.handle ?? "",
    fullName: row.full_name,
    city: row.city,
    categoryName: row.category?.name ?? "",
    topics: row.topics,
    phone: row.phone,
    link: row.link ?? null,
    about: row.about ?? null,
    status: row.status === "approved" || row.status === "rejected" ? row.status : "pending",
    verified: Boolean(row.verified),
    adminNote: row.admin_note ?? null,
    createdAt: row.created_at,
  };
}

export async function getSpeakerApplications(
  status: SpeakerApplicationStatus | "" = "",
  init?: RequestInit,
): Promise<AdminListResult<SpeakerApplicationRow>> {
  const rows = await adminGetItem<ApiRow[]>(`/admin/speaker-applications${query({ status })}`, init);
  return { items: (rows ?? []).map(map), paginated: false, cap: LIST_CAP };
}

export async function decideSpeakerApplication(
  id: number,
  input: { status: "approved" | "rejected"; verified?: boolean; adminNote?: string },
): Promise<SpeakerApplicationRow> {
  return map(
    await adminPatch<ApiRow>(`/admin/speaker-applications/${segment(id)}`, {
      status: input.status,
      verified: input.verified ?? false,
      admin_note: input.adminNote ?? "",
    }),
  );
}
