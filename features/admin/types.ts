/**
 * Domain types for the admin panel.
 *
 * Everything in the app speaks camelCase; the `snake_case` wire names live only
 * inside `features/admin/services/*`. Optional fields are marked `?` rather
 * than `| null` so a form can omit them, but the service layer still accepts the
 * backend's explicit `null`s when mapping responses.
 */

/* ------------------------------------------------------------------ squares */

/** `SquareAdminService::STATUSES`. */
export const SQUARE_STATUSES = [
  "pending_verification",
  "approved",
  "rejected",
  "suspended",
] as const;
export type SquareStatus = (typeof SQUARE_STATUSES)[number];

/** POST /admin/squares only accepts these two initial states. */
export const SQUARE_CREATE_STATUSES = ["pending_verification", "approved"] as const;
export type SquareCreateStatus = (typeof SQUARE_CREATE_STATUSES)[number];

export const SQUARE_STATUS_LABELS: Record<SquareStatus, string> = {
  pending_verification: "در انتظار تأیید",
  approved: "تأییدشده",
  rejected: "ردشده",
  suspended: "تعلیق‌شده",
};

export type SquareLocation = {
  provinceId: number;
  cityId: number;
  address: string;
  latitude: number;
  longitude: number;
};

export type Square = {
  id: number;
  name: string;
  description: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  approvalStatus: SquareStatus;
  verified: boolean;
  postStatus: string;
  ownerUserId: number | null;
  ownerName: string | null;
  adminNote: string;
  eitaaChannel: string;
  baleChannel: string;
  location: SquareLocation | null;
};

/** One row of `GET /admin/squares/map` — only squares with a geo row appear. */
export type SquareMapPoint = {
  id: number;
  name: string;
  postStatus: string;
  approvalStatus: SquareStatus;
  verified: boolean;
  location: SquareLocation;
};

export type SquareFilters = {
  q: string;
  status: SquareStatus | "";
  verified: "" | "true" | "false";
  provinceId: number | null;
  cityId: number | null;
};

export const EMPTY_SQUARE_FILTERS: SquareFilters = {
  q: "",
  status: "",
  verified: "",
  provinceId: null,
  cityId: null,
};

/** The exact body `POST /admin/squares` expects. */
export type SquareCreateInput = {
  phone: string;
  fullName: string;
  email: string;
  squareName: string;
  description: string;
  contactName: string;
  contactPhone: string;
  startDate: string;
  avatarMediaId: number | null;
  provinceId: number | null;
  cityId: number | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  eitaaChannel: string;
  baleChannel: string;
  status: SquareCreateStatus;
};

export type SquareUpdateInput = {
  squareName?: string;
  description?: string;
  contactName?: string;
  contactPhone?: string;
  startDate?: string;
  avatarMediaId?: number | null;
  /** The five geo fields travel together or not at all. */
  location?: SquareLocation;
  eitaaChannel?: string;
  baleChannel?: string;
};

/* ----------------------------------------------------------------- speakers */

export type GeoOption = { id: number; name: string };

/**
 * The only social-link shape the backend stores (see
 * `CreatorService::normalizeSocialLinks`): a platform slug, an absolute URL and
 * an optional free-text label. `platform` is what makes the two write paths
 * comparable, so it is always sent.
 */
export const SOCIAL_PLATFORMS = [
  "website",
  "instagram",
  "telegram",
  "x",
  "youtube",
  "aparat",
  "linkedin",
  "other",
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  website: "وب‌سایت",
  instagram: "اینستاگرام",
  telegram: "تلگرام",
  x: "ایکس (توییتر)",
  youtube: "یوتیوب",
  aparat: "آپارات",
  linkedin: "لینکدین",
  other: "سایر",
};

export type SocialLink = {
  platform: SocialPlatform;
  url: string;
  label?: string;
};

export type SpeakerCategory = {
  slug: string;
  name: string;
};

export type Speaker = {
  id: number;
  userId: number;
  name: string;
  bio: string;
  role: string;
  handle: string;
  expertise: string;
  initials: string;
  avatarUrl: string | null;
  verified: boolean;
  cities: number[];
  categories: string[];
  socialLinks: SocialLink[];
  eitaaChannel: string;
  baleChannel: string;
};

export type LinkableUser = {
  id: number;
  name: string;
};

export type SpeakerProfileInput = {
  avatarMediaId: number | null;
  verified: boolean;
  cities: number[];
  categories: string[];
  socialLinks: SocialLink[];
  eitaaChannel: string;
  baleChannel: string;
};

export type SpeakerCreateInput = SpeakerProfileInput & { userId: number };

/** Creates an account and its speaker profile in one admin-only request. */
export type SpeakerAccountCreateInput = SpeakerProfileInput & {
  fullName: string;
  phone: string;
  email: string;
  provinceId: number | null;
  cityId: number | null;
  about: string;
};

export type SpeakerStatusFilters = {
  q: string;
  verified: "" | "true";
  speakerCategory: string;
  provinceId: number | null;
  cityId: number | null;
};

/* ------------------------------------- speaker requests and invitations */

export const SPEAKER_REQUEST_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "cancelled",
] as const;
export type SpeakerRequestStatus = (typeof SPEAKER_REQUEST_STATUSES)[number];

export const SPEAKER_REQUEST_STATUS_LABELS: Record<SpeakerRequestStatus, string> = {
  pending: "در انتظار",
  accepted: "پذیرفته‌شده",
  rejected: "ردشده",
  cancelled: "لغوشده",
};

/** The shared `meydan_speaker_requests` row, as the admin controller shapes it. */
export type SpeakerRequest = {
  id: number;
  status: SpeakerRequestStatus;
  direction: string;
  message: string;
  adminNote: string;
  requesterUserId: number | null;
  speakerUserId: number | null;
  requesterName: string;
  speakerName: string;
  requestedDate: string;
  requestedTime: string;
  createdAt: string;
  decidedAt: string | null;
};

/* ------------------------------------------------------------------ content */

export const CONTENT_FORMATS = [
  "video",
  "audio",
  "image",
  "text",
  "carousel",
  "mixed",
] as const;
export type ContentFormat = (typeof CONTENT_FORMATS)[number];

export const CONTENT_FORMAT_LABELS: Record<ContentFormat, string> = {
  video: "ویدیو",
  audio: "صوت",
  image: "تصویر",
  text: "متن",
  carousel: "چندرسانه‌ای",
  mixed: "ترکیبی",
};

/** `POST /admin/content` maps `status` straight onto `post_status`. */
export const CONTENT_STATUSES = ["publish", "draft", "pending", "private"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  publish: "منتشرشده",
  draft: "پیش‌نویس",
  pending: "در انتظار بازبینی",
  private: "خصوصی",
};

export type ContentAttachment = {
  mediaId: number;
  order: number;
  caption: string | null;
  label: string | null;
};

export type ContentCreatorRef = {
  id: number;
  position: number;
  roleLabel: string;
};

export type ContentItem = {
  id: number;
  title: string;
  slug: string;
  body: string;
  excerpt: string;
  format: string;
  featured: boolean;
  publishedAt: string | null;
  category: { id: number; name: string; slug: string } | null;
  tags: string[];
  subtitle: string;
  badge: string;
  locationLabel: string;
  mediaDuration: string;
  usageNote: string;
  attachments: ContentAttachment[];
  files: string[];
  creators: ContentCreatorRef[];
  producer: { type: string; id: string; name: string; avatarUrl: string | null } | null;
};

export type ContentInput = {
  title: string;
  body: string;
  excerpt: string;
  status: ContentStatus;
  format: ContentFormat;
  usageNote: string;
  subtitle: string;
  badge: string;
  locationLabel: string;
  mediaDuration: string;
  featured: boolean;
  attachments: Array<{ mediaId: number; caption?: string; label?: string }>;
  tags: string[];
  category: number | null;
  creators: ContentCreatorRef[];
};

/* ------------------------------------------------------- creators & outlets */

export type Creator = {
  id: number;
  name: string;
  types: string[];
  role: string;
  bio: string;
  handle: string;
  expertise: string;
  initials: string;
  avatarUrl: string | null;
  verified: boolean;
  cities: number[];
  socialLinks: SocialLink[];
};

export type CreatorInput = {
  name: string;
  bio: string;
  types: string[];
  role: string;
  handle: string;
  expertise: string;
  initials: string;
  avatarMediaId: number | null;
  verified: boolean;
  cities: number[];
  socialLinks: SocialLink[];
};

export type MediaOutlet = {
  id: number;
  name: string;
  avatarUrl: string | null;
  website: string;
  bale: string;
  eitaa: string;
};

export type MediaOutletInput = {
  name: string;
  avatarMediaId: number | null;
  website: string;
  bale: string;
  eitaa: string;
};

/* ------------------------------------------------------- narratives & reflections */

export type Narrative = {
  id: number;
  body: string;
  title: string;
  authorName: string;
  authorType: string;
  authorId: string;
  editorial: boolean;
  contentId: number | null;
  createdAt: string | null;
  attachments: Array<{ mediaId: number; url: string; type: string }>;
};

export type MediaReflection = {
  id: number;
  narrativeId: number;
  outletId: number;
  outletName: string;
  title: string;
  summary: string;
  url: string;
  logoUrl: string | null;
  publishedAt: string | null;
  status: string;
  position: number;
};

export type MediaReflectionInput = {
  outletId: number | null;
  outlet: string;
  title: string;
  url: string;
  summary: string;
  logoMediaId: number | null;
  publishedAt: string;
  status: string;
  position: number;
};

/* ------------------------------------------- initiatives, campaigns, notices */

export const PROGRAM_STATUSES = ["draft", "active", "ended", "disabled"] as const;
export type ProgramStatus = (typeof PROGRAM_STATUSES)[number];

export const PROGRAM_STATUS_LABELS: Record<ProgramStatus, string> = {
  draft: "پیش‌نویس",
  active: "فعال",
  ended: "پایان‌یافته",
  disabled: "غیرفعال",
};

/** WordPress post statuses the program controller accepts, anything else → publish. */
export const PROGRAM_POST_STATUSES = ["publish", "draft", "pending", "future"] as const;
export type ProgramPostStatus = (typeof PROGRAM_POST_STATUSES)[number];

export type ProgramScheduleRow = {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  locationLabel: string;
  status: string;
};

export type ProgramLinkedContent = {
  contentId: number;
  title: string;
  note: string;
};

export type Program = {
  id: number;
  title: string;
  description: string;
  postStatus: string;
  ctaLabel: string;
  startsAt: string;
  endsAt: string;
  status: string;
  allowGuestJoin: boolean;
  participantCount: number;
  current: boolean;
  labels: string[];
  linkedContent: number[];
  schedule: ProgramScheduleRow[];
  order: number;
};

export type ProgramInput = {
  title: string;
  description: string;
  ctaLabel: string;
  startsAt: string;
  endsAt: string;
  status: ProgramStatus;
  allowGuestJoin: boolean;
  labels: string[];
  linkedContent: number[];
  schedule: ProgramScheduleRow[];
  order: number;
  postStatus: ProgramPostStatus;
};

export type InitiativeMember = {
  id: number;
  memberType: string;
  userId: number | null;
  guestId: number | null;
  joinedAt: string;
  status: string;
};

export const NOTIFICATION_AUDIENCES = [
  "all",
  "users",
  "squares",
  "province",
  "city",
  "specific_ids",
] as const;
export type NotificationAudienceType = (typeof NOTIFICATION_AUDIENCES)[number];

export const NOTIFICATION_AUDIENCE_LABELS: Record<NotificationAudienceType, string> = {
  all: "همه کاربران",
  users: "فقط کاربران عادی",
  squares: "فقط حساب‌های میدان",
  province: "کاربران یک استان",
  city: "کاربران یک شهر",
  specific_ids: "شناسه‌های مشخص",
};

export type NotificationAudience = {
  type: NotificationAudienceType;
  /** `province` / `city` target. */
  id: number | null;
  /** `specific_ids` target. */
  ids: number[];
};

export type NotificationInput = {
  title: string;
  body: string;
  audience: NotificationAudience;
  deepLink: string;
};

/* ------------------------------------------------------------- pagination */

export type AdminPage<T> = {
  items: T[];
  page: number;
  perPage: number;
  total: number;
  pages: number;
  /** `false` when the backend reported no pagination `meta` at all. */
  paginated: boolean;
};

export type AdminListResult<T> = {
  items: T[];
  /** `false` for the endpoints that hard-cap their list (speakers, requests). */
  paginated: boolean;
  /** The backend's own ceiling, when the endpoint documents one. */
  cap?: number;
};
