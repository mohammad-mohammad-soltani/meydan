import type {
  AdminListResult,
  AdminPage,
  ContentItem,
  Creator,
  InitiativeMember,
  LinkableUser,
  MediaOutlet,
  FeedPreview,
  Program,
  Speaker,
  SpeakerRequest,
  SpeakerStatusFilters,
  Square,
  SquareFilters,
  SquareMapPoint,
  SquareStatus,
} from "../types";
import { withAdminAuth } from "./admin-request";
import { getNoteCategories as getNoteCategoriesRaw } from "./note-categories.service";
import { getUsers as getUsersRaw, getUser as getUserRaw, getUserRoles as getUserRolesRaw, type UserFilters } from "./users.service";
import type { AdminUser, AdminUserRole } from "./users.service";
import {
  getContent as getContentRaw,
  getContentList as getContentListRaw,
  getContentPoster as getContentPosterRaw,
  type ContentFilters,
} from "./content.service";
import {
  EMPTY_CREATOR_FILTERS,
  getCreator as getCreatorRaw,
  getCreators as getCreatorsRaw,
  getMediaOutlets as getMediaOutletsRaw,
  type CreatorFilters,
} from "./creators.service";
import {
  getEditorialNarratives as getEditorialNarrativesRaw,
  type EditorialPage,
} from "./narratives.service";
import { getFeedSettings as getFeedSettingsRaw, previewFeed as previewFeedRaw } from "./feed.service";
import type { AdminFeedSettingsResponse } from "./feed.service";
import {
  getParticipants as getParticipantsRaw,
  getProgram as getProgramRaw,
  getPrograms as getProgramsRaw,
  type ProgramKind,
  type ProgramPage,
} from "./programs.service";
import {
  getAdminSpeakers as getAdminSpeakersRaw,
  getLinkableUsers as getLinkableUsersRaw,
  getSpeaker as getSpeakerRaw,
  getSpeakerInvitation as getSpeakerInvitationRaw,
  getSpeakerInvitations as getSpeakerInvitationsRaw,
  getSpeakerRequest as getSpeakerRequestRaw,
  getSpeakerRequests as getSpeakerRequestsRaw,
  type SpeakerRequestFilters,
} from "./speakers.service";
import {
  countSquares as countSquaresRaw,
  getSquare as getSquareRaw,
  getSquareMap as getSquareMapRaw,
  getSquares as getSquaresRaw,
} from "./squares.service";

/**
 * The read side of the admin services, bound to the current session.
 *
 * The service modules are isomorphic: `AdminSquaresView` and its siblings call
 * `getSquares` and friends straight from the browser, where the request goes
 * through `app/api/meydan/[...path]` and that proxy adds the token from the
 * httpOnly cookie. A server component has no proxy in front of it, so without
 * this binding its first paint is an anonymous request and every `/admin/*` read
 * answers 401.
 *
 * The token cannot be attached inside the service modules themselves: this
 * feature's client components import those modules, so pulling `next/headers`
 * into their graph fails the build with "You're importing a module that depends
 * on next/headers". Keeping the binding in this server-only module is what lets
 * both sides share one implementation.
 *
 * Parameters are spelled out rather than forwarded as `...args` so the strongly
 * typed reads stay typed at every call site.
 *
 * Only reads are wrapped. Writes are issued from client components, which reach
 * the API through the proxy and need no help.
 */

export async function countSquares(status: SquareStatus): Promise<number> {
  return countSquaresRaw(status, await withAdminAuth());
}

export async function getUsers(filters: UserFilters, page = 1, perPage = 20): Promise<AdminPage<AdminUser>> {
  return getUsersRaw(filters, page, perPage, await withAdminAuth());
}

export async function getUser(id: string): Promise<AdminUser> {
  return getUserRaw(id, await withAdminAuth());
}

export async function getUserRoles(): Promise<AdminUserRole[]> {
  return getUserRolesRaw(await withAdminAuth());
}

export async function getSquare(id: string): Promise<Square | null> {
  return getSquareRaw(id, await withAdminAuth());
}

export async function getSquareMap(): Promise<SquareMapPoint[]> {
  return getSquareMapRaw(await withAdminAuth());
}

export async function getSquares(
  filters: SquareFilters,
  page = 1,
  perPage = 20,
): Promise<AdminPage<Square>> {
  return getSquaresRaw(filters, page, perPage, await withAdminAuth());
}

export async function getSpeaker(id: string): Promise<Speaker | null> {
  return getSpeakerRaw(id, await withAdminAuth());
}

export async function getSpeakerInvitation(id: string): Promise<SpeakerRequest | null> {
  return getSpeakerInvitationRaw(id, await withAdminAuth());
}

export async function getSpeakerInvitations(
  filters: SpeakerRequestFilters = { status: "" },
): Promise<AdminListResult<SpeakerRequest>> {
  return getSpeakerInvitationsRaw(filters, await withAdminAuth());
}

export async function getAdminSpeakers(
  filters: SpeakerStatusFilters,
  page = 1,
  perPage = 20,
): Promise<AdminPage<Speaker>> {
  return getAdminSpeakersRaw(filters, page, perPage, await withAdminAuth());
}

export async function getLinkableUsers(): Promise<LinkableUser[]> {
  return getLinkableUsersRaw(await withAdminAuth());
}

export async function getSpeakerRequest(id: string): Promise<SpeakerRequest | null> {
  return getSpeakerRequestRaw(id, await withAdminAuth());
}

export async function getSpeakerRequests(
  filters: SpeakerRequestFilters = { status: "" },
): Promise<AdminListResult<SpeakerRequest>> {
  return getSpeakerRequestsRaw(filters, await withAdminAuth());
}

export async function getContent(id: string): Promise<ContentItem | null> {
  return getContentRaw(id, await withAdminAuth());
}

export async function getContentPoster() {
  return getContentPosterRaw(await withAdminAuth());
}

export async function getContentList(
  filters: ContentFilters,
  cursor?: string | null,
): Promise<{ items: ContentItem[]; nextCursor: string | null }> {
  return getContentListRaw(filters, cursor, await withAdminAuth());
}

export async function getCreator(id: string): Promise<Creator | null> {
  return getCreatorRaw(id, await withAdminAuth());
}

export async function getCreators(
  filters: CreatorFilters = EMPTY_CREATOR_FILTERS,
): Promise<Creator[]> {
  return getCreatorsRaw(filters, await withAdminAuth());
}

export async function getMediaOutlets(q = ""): Promise<MediaOutlet[]> {
  return getMediaOutletsRaw(q, await withAdminAuth());
}

export async function getParticipants(id: string): Promise<InitiativeMember[]> {
  return getParticipantsRaw(id, await withAdminAuth());
}

export async function getProgram(kind: ProgramKind, id: string): Promise<Program | null> {
  return getProgramRaw(kind, id, await withAdminAuth());
}

export async function getPrograms(
  kind: ProgramKind,
  page = 1,
  perPage = 50,
): Promise<ProgramPage> {
  return getProgramsRaw(kind, page, perPage, await withAdminAuth());
}

export async function getEditorialNarratives(page = 1, limit = 20): Promise<EditorialPage> {
  return getEditorialNarrativesRaw(page, limit, await withAdminAuth());
}

export async function getFeedSettings(): Promise<AdminFeedSettingsResponse> {
  return getFeedSettingsRaw(await withAdminAuth());
}

export async function previewFeed(userId: number, limit = 20): Promise<FeedPreview> {
  return previewFeedRaw(userId, limit, await withAdminAuth());
}

export async function getNoteCategoriesServer() {
  return getNoteCategoriesRaw(await withAdminAuth());
}
