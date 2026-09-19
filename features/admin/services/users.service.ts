import { adminDelete, adminGetEnvelope, adminGetItem, adminPatch, adminPost, query, segment } from "./admin-api";
import type { AdminPage } from "../types";

export type AdminUser = {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  role: string;
  roles: string[];
  disabled: boolean;
  headline: string;
  about: string;
  location_label: string;
  province_id: number | null;
  city_id: number | null;
  avatar_media_id: number | null;
  avatar_url: string | null;
  cover_media_id: number | null;
  cover_url: string | null;
  eitaa_channel: string;
  bale_channel: string;
  square_id: number | null;
  registered_at: string;
};

export type AdminUserRole = { value: string; label: string };
export type UserFilters = { q: string; role: string; status: string };
export const EMPTY_USER_FILTERS: UserFilters = { q: "", role: "", status: "" };

export async function getUsers(filters: UserFilters = EMPTY_USER_FILTERS, page = 1, perPage = 20, init?: RequestInit): Promise<AdminPage<AdminUser>> {
  const envelope = await adminGetEnvelope<AdminUser[]>(`/admin/users${query({ ...filters, page, per_page: perPage })}`, init);
  const meta = envelope.meta;
  return { items: envelope.data ?? [], page: Number(meta.page ?? page), perPage: Number(meta.per_page ?? perPage), total: Number(meta.total ?? 0), pages: Number(meta.pages ?? 1), paginated: true };
}

export function getUser(id: string | number, init?: RequestInit) {
  return adminGetItem<AdminUser>(`/admin/users/${segment(id)}`, init);
}

export function getUserRoles(init?: RequestInit) {
  return adminGetItem<AdminUserRole[]>("/admin/users/roles", init);
}

export type UserInput = Partial<Pick<AdminUser, "full_name" | "phone" | "email" | "role" | "headline" | "about" | "location_label" | "province_id" | "city_id" | "avatar_media_id" | "cover_media_id" | "eitaa_channel" | "bale_channel">> & {
  square?: { name: string; address: string; province_id: number; city_id: number; latitude: number; longitude: number };
};

export function createUser(input: UserInput) { return adminPost<AdminUser>("/admin/users", input); }
export function updateUser(id: number, input: UserInput) { return adminPatch<AdminUser>(`/admin/users/${segment(id)}`, input); }
export function setUserDisabled(id: number, disabled: boolean) { return adminPatch<AdminUser>(`/admin/users/${segment(id)}/status`, { disabled }); }
export type DeleteUserResult = {
  deleted: boolean;
  permanent: boolean;
  id: number;
  purged?: Record<string, number>;
};

export function deleteUser(id: number) {
  return adminDelete<DeleteUserResult>(`/admin/users/${segment(id)}`);
}
