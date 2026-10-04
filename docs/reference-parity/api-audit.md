# Backend/API audit for reference parity

Date: 2026-10-04. Scope: existing frontend and sibling `../meydan-backend`; read-only investigation, with this report as the only authored file. No production requests, account creation, messages, joins, or other mutations were performed. “Verified” below means the method, registered route, handler and relevant permissions were verified in repository source; it does not claim that a deployed installation was exercised.

The HTML reference `/home/mohammad/Downloads/naghsh-man-full - 2026-10-03T205508.732(2).html` is a design artifact, not instructions or an API contract. Its data and success flows must not become production behavior.

## Authority and scope

- Frontend: `lib/meydan-api.ts`; service and hook files in `features/{feed,content,media,profile,explore,map,chat,speakers,speaker-invitations,initiatives,works,compose,share,audio,coming-soon}`; interaction-bearing components; supporting `lib/meydan-follow.ts`, `lib/meydan-upload.ts`, realtime and proxy files.
- Backend: `wp-content/plugins/meydan-core/src/Rest/{Routes,ChatRoutes,WorkRoutes,PushRoutes}.php`, relevant controllers and Domain services; `Support/{GoodAction,Serializer,ChatRepository}.php` where they implement behavior delegated by controllers.
- `SPEC.md` sections 34, 41 and 42 describe initiatives and legacy speaker booking. They predate current speaker-account and invitation behavior. Code wins when they disagree.
- `postman/meydan-v1.postman_collection.json` contains 108 requests. It includes legacy speaker requests and initiative reads/joins, but omits current work routes, speaker invitations, speaker account creation and content hubs. Absence from that collection is not proof of a missing API.
- No backend `AGENTS.md` was found. Frontend `AGENTS.md` requires reading installed Next.js guides before product code changes. This audit makes no product code changes.

## Preserve the application boundary

`meydanApi` uses `/api/meydan` in browsers and configured upstream URLs on the server. It requires `{data, meta?}`, preserves `meta.next_cursor`, throws structured `MeydanApiError`, and distinguishes optional background requests with `suppressAuthRedirect`. The proxy in `app/api/meydan/[...path]/route.ts` forwards session Bearer auth, guest cookie and idempotency key, retries once after session refresh, preserves the request body for retry and writes rotated cookies. Server reads must continue forwarding session headers; a direct browser fetch to the WordPress origin would bypass this behavior.

Preserve auth return navigation, native session duration, `AuthGateProvider`, shell/me caches, native media bridge, app-level audio provider, PWA/push registrations, and existing realtime channels. Speaker accounts are **user actors**; entities use square/media/collective/organization actors. Do not add `speaker` to `/actors/{type}` or treat an entity id as a chat user id.

Permission legend: **public** means registered and implemented for guests; **auth** means signed-in viewer; **owner** means resource ownership checks; **admin** means administrator route gate plus controller capability; **manager** means work owner/admin or site administrator. `Routes::permission` applies before controllers; a permissive handler cannot override a restrictive route gate.

## Interaction-to-contract matrix

All WordPress routes below are relative to `/wp-json/meydan/v1`; retain the existing frontend service layer.

| UI interaction | Existing frontend path | Verified method / route and backend implementation | Permissions and behavior |
|---|---|---|---|
| For-you timeline, filters, pagination, refresh | `feed/services/feed.service.ts:getFeedPage`, `hooks/useFeed.ts` | `GET /timeline?mode=for_you&filter=...&limit=12&cursor=...`; `TimelineController::timeline` | Public; signed viewer state when auth forwarded; opaque snapshot cursor, expired cursor `410`. |
| Following timeline | Same service / hook | `GET /timeline?mode=following`; same handler | Auth enforced inside handler. Keep login state and following empty-state distinct. |
| Plain narratives / work / media-reflection chips | `FeedFilters`, `getFeedPage` | Filters `narratives`, `initiatives`, `reflected` in `TimelineController::matches` / `filteredIds` | Public reads. Current “روایت” chip sends `all`, which includes works; `narratives` already exists when the intended meaning is plain narratives. |
| Video feed and reel queue | `media/video-feed-queue.ts`, `VideoFeedViewer`, `ReelsView` | `GET /timeline?mode=for_you&filter=video&limit=12&cursor=...` | Public; existing bounded scan, deduplication and `410` recovery. Keep same post identity across viewers. |
| View narrative / quoted original / quote list | Feed mapper, compose quote loader, posts service | `GET /narratives/{id}`, `GET /narratives/{id}/quotes?limit=12&cursor=...`; `NarrativeController` | Public subject to visibility checks. Render unavailable quote state when backend says so. |
| Like / unlike narrative | `useFeed`, `useProfile`, `media/hooks/useViewerPost.ts` | `PUT` / `DELETE /narratives/{id}/like`; `NarrativeController::interaction` | Auth. Optimistic update exists with rollback; reconcile returned stats. |
| Repost / undo | Same hooks | `PUT` / `DELETE /narratives/{id}/repost`; same handler; `MediaReflectionSync::repost` | Auth; approved media accounts can create a media reflection through real repost behavior. |
| Quote narrative | `ComposeView`, `RepostMenu` | `POST /narratives` with `quoted_narrative_id`; `NarrativeController::create`, `Quotes::validateTarget` | Auth; approved media viewer may send `media_reflection`; not a separate media-campaign creation API. |
| Save narrative, read saved state, show saved list | `BookmarkButton`, `ShareSheet`, profile tab | `GET` / `PUT` / `DELETE /narratives/{id}/bookmark`; `GET /me/saved-narratives`; `ProfileExtras` | State GET returns false for guest; writes and personal list auth. Keep `bookmark-sync` event propagation. |
| Delete / edit own narrative | `DeletePostDialog`, `useFeed`, `useProfile`; existing post edit service | `DELETE` / `PATCH /narratives/{id}`; `NarrativeController::canManage` | Auth + author or moderation/manage-options capability. |
| Read root comments | `media/comments.service.ts:listComments`, post comments | `GET /narratives/{id}/comments?cursor=...`; `CommentController::list` | Public; 20-row cursor pages and visible parent narrative. |
| Read threaded replies | `comments.service.ts:listReplies` | `GET /comments/{id}/replies?cursor=...`; `CommentController::replies` | **Route requires auth**, despite read-only handler. Frontend `listReplies` discards `next_cursor`, so only first 20 descendants load. |
| Post comment / threaded reply | `postComment`, `useViewerPost.reply` | `POST /narratives/{id}/comments` with `{body,parent_id?}` | Auth; parent must belong to same narrative; publish rate limit. |
| Like comment; edit/delete comment | `setCommentLike`, post detail interactions | `PUT` / `DELETE /comments/{id}/like`; `PATCH` / `DELETE /comments/{id}` | Auth; edit/delete author or `moderate_meydan_narratives`. |
| Follow suggestions | `feed.service.ts:getFollowSuggestions` | `GET /squares?verified=1&limit=6`; `SquareController::list` | Public real squares, real counts. No demo users required. |
| Follow state batch, follow/unfollow, profile bell | `lib/meydan-follow.ts`, `useFollowSet`, `useProfile` | `POST /actors/follow-states` `{actors:[{type,id}]}`; `GET /actors/{type}/{id}/follow-state`; `PUT` / `DELETE .../follow`; `PUT` / `DELETE .../notify` | Auth for state/batch/write; batch maximum 100; self-follow rejected. Entity kinds supported; speakers use `user`. |
| Followers/following sheet and mutual followers | `FollowListSheet`, `ProfileHeader` | `GET /actors/{type}/{id}/followers`, `/following`, `/followed-by`; `ActorController` | Public lists, max 1000 configurable limit, no cursor; mutual list depends on viewer and is empty for guests. |
| Profile identity by handle/id | `public-profile-route.tsx`, profile service | `GET /profiles/{handle}`, `/profiles/by-id/{type}/{id}`, `/users/{id}`, `/entities/{kind}/{id}`, `/squares/{id}` | Public visible profiles. Preserve canonical handle resolution, id fallback and entity ownership mapping. |
| Own profile and next narratives page | `profile.service.ts`, `useProfile` | `GET /me/profile-page`, `/me/narratives`; public `/users/{id}/narratives`, `/entities/{kind}/{id}/narratives`, `/squares/{id}/narratives`; local `/api/profile/narratives` forwards session | Own auth; others public; preserve cursor/count/pinned envelope. |
| Profile replies / likes / highlights / media-reflection count | Profile service/hook; feed `getNarrativeList` | `GET /actors/{type}/{id}/replies`, `/likes`, `/highlights`; `/squares/{id}/media-reflections/count` | Public visible actor; likes paginated; replies capped 50. Backend extras exist, so no SoonBadge warranted for these tabs. |
| Edit name/headline/about/skills/images/handle | `ProfileEditView`, `useProfile` | `PATCH /me/profile`; `MeController::patchProfile` | Auth + own account; handle rules/lock and owned uploaded-image validation. Keep backend field errors. |
| Edit entity profile / location | Same component | `PATCH /me/square` (alias `/me/entity`); `PUT /me/square/location` | Own entity; location guarded for square. `{province_id,city_id,latitude,longitude,address}` and existing geo ids, not free-text ids. |
| Pin own narrative | `useProfile` | `PUT /me/pinned-narrative` with `{narrative_id}` | Auth; verifies own published narrative; nullable id unpins. |
| Read/create/reorder/remove square schedule | `profile/services/schedule.service.ts`, `ScheduleView` | `GET /squares/{id}/schedule` public; `GET` / `POST /me/square/schedule`, `PATCH` / `DELETE .../{id}`, `PUT .../order` | Own square writes. Existing service sends `{title,starts_at}` and `{schedule_ids}`. Time-only entry is expanded to today's ISO timestamp by service. |
| Content browse/detail/search | `content.service.ts`, hub services | `GET /content`, `/content/{id}`, `/content/hub/audio?q=...`, `/content/hub/notes?q=...&category=...` | Public; existing content envelope, primary attachment, producer, viewer state. No new content API needed. |
| Audio/speech/music-video archive pagination | `getAudioList`, `getSpeechContentPage`, `getMusicVideoContentPage` | `GET /content?...&cursor=...`; `ContentController::query` | Public; pass existing format/content-type filters, series, featured and producer ids. |
| Featured audio, series, producers | `hub.service.ts` | `GET /content/hub/audio`; `GET /content/hub/producers?kind=faces|squares&offset=...` | Public actual producer statistics; preserve offset paging, distinct from content cursor paging. |
| Reports and report-day details | `report-days.service.ts` | `GET /report-days`, `GET /report-days/{YYYY-MM-DD}`; `ReportDayController` | Public. Report narratives use real ids/stats; no sample reports. |
| Content banners / poster / quick actions | `banners.service.ts`, `content.service.ts` | `GET /content/banners`, `GET /config`; `ContentBannerController`, `MiscController` | Public managed data exists. Respect returned href/enabled/feature flags. |
| Campaign schedule/current campaign | `getScheduleItems`, content services | `GET /campaigns/current`, `/campaigns/{id}`, `/campaigns/{id}/schedule`, `/campaigns`; `MiscController` | Public campaign reads exist. They do not imply a campaign timeline filter or ordinary-user campaign creation. |
| Like/bookmark content / saved content | `NoteReader`, `NotesView`, `ContentDetailView`, `getBookmarkedContent` | `PUT` / `DELETE /content/{id}/like` and `/bookmark`; `GET /me/bookmarks` | Auth. Content bookmarks and narrative bookmarks are different collections. |
| Share/download content analytics | `ContentDetailView` | `POST /content/{id}/share`; `POST /content/{id}/files/{file_id}/download` | **Auth required by current route gate**, despite client public exemption. Download returns actual attachment, URL and total. See finding F2. |
| Explore search / trends / suggestions / home | `explore.service.ts`, `explore-home.service.ts`, `ExploreView` | `GET /explore/search?q=...&types=...`, `/explore/trends?window=24h`, `/explore/suggestions`, `/explore/home`; `ExploreController` | Public real results; follow behavior reuses actor API. No local mock result generation. |
| Map markers, region/viewport selection | `map.service.ts`, `useMap`, `MapFrame` | `GET /squares/map` optionally province/city/bounds; `SquareController::map` | Public GeoJSON, published/visible squares, SQL cap 1000. Country fallback fetches per city if first response reaches cap. |
| Province/city option selectors and reverse lookup | `getProvinces`, `getCities`, `reverseGeocode` | `GET /geo/provinces`, `/geo/cities?province_id=...`, `/geo/reverse?latitude=...&longitude=...` | Public actual ids. Static centers/islands are geographic presentation resources, not fake square records. |
| Map place search / GPS / basemap | `geocoding.service.ts`, local `/api/geocoding`, native browser geolocation | Local provider bridge; OpenFreeMap style + local province GeoJSON | Real provider/geolocation behavior; no hypothetical WordPress geocoding-search route. Preserve provider config. |
| Speaker directory search/category/page | `speakers.service.ts`, `useSpeakers` | `GET /speakers?page=...&per_page=50&q=...&speaker_category=...`; `GET /speaker-categories`; `SpeakerController` | Public; returns `meta.page,total,pages`; speakers are accounts. Current code reads city names but backend serializer returns city id list; verify mapping before rendering locations. |
| Invite existing speaker | `speaker-invitations.service.ts:createInvitation`, `SpeakerInviteButton` | `POST /speaker-invitations`; `SpeakerInvitationController::create` | Auth **square only**, real existing speaker, non-self, square address required; location derived server-side. |
| Invitation selector/search, sent/received/detail | Same service/view | `GET /speaker-invitations/speakers?q=...`, `/speaker-invitations?box=sent|received`, `/speaker-invitations/{id}` | Auth; detail only invited speaker/inviter or authorized manager. Lists cap 100. Categories use existing public category API. |
| Accept/reject/cancel invitation; reveal contact | `decideInvitation`, `cancelInvitation`, `InvitationCard` | `PATCH /speaker-invitations/{id}` `{status:"accepted"|"rejected"}`; `DELETE /speaker-invitations/{id}` | Only invited speaker decides; only inviter cancels; state transitions checked. Backend serialization owns phone visibility. Acceptance/contact must not be simulated locally. |
| Join/leave/view work participants | `ConnectedGoodActionCard`, `useFeed.join`, initiatives service | `GET /initiatives/{id}`, `/participants`; `PUT` / `DELETE .../join`; `InitiativeController` + `InitiativeMembership` | Auth unless initiative allows guests; joined users sync into work membership. Closed work rejects join `409`. Participants cap 100; count may exceed rendered rows. |
| Create work/initiative from composer | `ComposeView workMode`, existing `/compose` work tab | `POST /narratives` `{body,is_echo:true,attachments:[...]}`; `NarrativeController`, `GoodAction`, `WorkGroups` | Auth. Creates initiative and its work conversation via hooks; returns `initiative.work_id`. Already supported, not Soon. |
| Work sidebar/search/filter/paging/summary | `works.service.ts`, `useWorksFeed` | `GET /works?filter=...&q=...&cursor=...`, `/works/summary` | Auth; `WorkQueries` returns real counts and viewer joined/unread state. Preserve work realtime events. |
| Work room, board, kind/mine filters, catch-up | `useWorkRoom`, `messagePage`, `oneMessage` | `GET /works/{id}`, `/works/{id}/messages?kind=...&mine=1&before_id=...&after_id=...`; `/works/messages/{id}` | Auth; privacy/audience rules in `WorkMessages`. Board uses actual task messages. Id cursor direction differs from timeline snapshots. |
| Join/leave/read work | `WorkRoom`, `WorkInfo`, `useWorkRoom` | `PUT` / `DELETE /works/{id}/join`; `PUT .../read` `{message_id}` | Auth; owner cannot leave; read marker requires membership. Initiative membership kept in step. |
| Post work text/task/meeting/announcement/poll | `WorkComposer`, `useWorkRoom.send` | `POST /works/{id}/messages` `{client_id,kind,body,reply_to_id?,mention_ids?,task?|meeting?|announcement?|poll?}` | Auth + member. Managers originate rich items; members can reply to manager message; private audience enforced. Real persisted poll voting already supported. |
| Edit/delete/react/pin work message | Room menus + `workAction` | `PATCH` / `DELETE /works/messages/{id}`; `PUT` / `DELETE .../reaction` | Auth + author/manager for edit/delete; visible-member reaction; pin behavior through message PATCH (manager). |
| Task claim/withdraw/status/assignees/nudge/checklist | Task/board components + `workAction` | `POST` / `DELETE /works/tasks/{id}/claim`; `PUT .../status` `{action}`; `PUT .../people` `{assignee_ids}`; `POST .../nudge`; `POST .../items`; `PATCH` / `DELETE /works/task-items/{id}` | Member claim capacity checked transactionally; responsible/manager status actions; manager approve/reopen/assignee/nudge; checklist responsible/manager. |
| Meeting RSVP, announcement seen/list/remind, poll vote | Rich bubbles + `workAction`, `seenPage` | `PUT /works/meetings/{id}/rsvp` `{response}`; `PUT` / `GET /works/announcements/{id}/seen`; `POST .../remind`; `PUT /works/polls/{id}/vote` `{option}` | Visible member participation; manager reminders. Keep totals/votes/seen list from API. |
| Work info/photo/description, member label/admin promotion, deletion | `WorkInfo`, `WorkMembers` | `PATCH` / `DELETE /works/{id}`; `PUT .../members/{user_id}/label` / `/role` | Info/deletion/role appointment owner/site admin; labels manager; owner role cannot be changed. |
| Direct chat list/create/open | `chat.service.ts`, `useChat`, profile chat action | `GET` / `POST /chat/conversations` `{participant_user_id}`; `GET .../{id}` | Auth; repository enforces participant visibility; entity chat id comes from `chat_user_id`, not square id. Work conversations excluded here. |
| Chat messages/history/search/send/reply/attachment | Chat service, `useConversation`, `MessageInput` | `GET` / `POST /chat/conversations/{id}/messages`; `GET .../search?q=...` | Auth + conversation membership; before-id paging; `client_id` dedup; real uploaded attachments, reply ids. No timer-based success. |
| Chat edit/delete/react/mute/read/typing | Same service/hook | `PATCH` / `DELETE /chat/messages/{id}`; `PUT` / `DELETE .../reaction`; `PUT /chat/conversations/{id}/mute`; `PUT .../read`; `POST .../typing` | Auth + member/author checks delegated to repository; true read receipts and typing events. |
| Live chat/work/notification updates and unread badge | `lib/realtime/*`, `UnreadProvider`, hooks | `GET /chat/realtime/config`; `POST /chat/realtime/auth` `{socket_id,channel_name}`; `GET /me/shell`, `/me/unread` | Auth; Soketi private-channel authorization; preserve shared connection, event handlers, resubscribe catch-up and slow safety poll. |
| Notifications list/read/unread/read-all/archive/delete | notification service, `NotificationsList` | `GET /notifications`, `/notifications/unread-count`; `PUT` / `DELETE .../{id}/read`; `PUT /notifications/read-all`; `PUT` / `DELETE .../{id}/archive`; `DELETE .../{id}` | Auth + own notification; backend supports archive restoration/deletion even if current service only exposes archive. |
| Compose/chat/profile/work media upload/retry/cancel | `useComposeMedia`, `lib/meydan-upload.ts` and existing callers | `POST /uploads` `{filename,mime_type,size,purpose}`; `PUT /uploads/{upload_id}/chunks/{index}` binary; `POST .../complete`; `DELETE /uploads/{upload_id}` | Auth + upload ownership; chunk size/idempotency/progress/retry validation. Client progress reflects transferred bytes; final completion remains authoritative. |
| Narrative sharing to actual recent chats | `ShareSheet` | `GET /chat/conversations`; `POST .../{id}/messages` `{client_id,body}` | Auth; recent contacts come from real conversation list; no sample contacts. |
| Copy/external native share and share analytics | `ShareSheet`, `ShareProvider` | Clipboard, real share URLs / native Web Share; `POST /narratives/{id}/share` | Local external-share operation works for guests; analytics POST currently auth-gated server-side. Existing count is once per sheet; see F2/F8. |
| Story maker themes/size/font/export | `StoryStudio`, `story-canvas.ts` | Canvas PNG export / Web Share file; existing image optimization proxy | Local real artifact creation from actual post/name/badge. No missing backend API or SoonBadge justified. |
| Persistent audio player / queue / seek / resume / media session | `AudioProvider`, `audio-runtime`, `MiniPlayer`, `NowPlayingSheet` | Real attachment/media URLs + HTML audio/native bridge; local playback-position storage | Existing functioning local media runtime; not an API-backed “play” toggle. Preserve provider across route changes. |
| Draft list/resume/remove | `DraftsView`, `ComposeView` | Actual `localStorage` keys `meydan-compose-draft` and `:quote:{id}` | Device-local text drafts; no server persistence claim. No backend API is necessary for current promised behavior. |

## Verified request shapes: work creation and speaker flows

### Ordinary signed-in user creates a work

The existing composer sends `POST /narratives` with JSON and an `idempotency-key`. Minimum useful body:

```json
{"body":"عنوان کار\n\nتوضیح کار","is_echo":true,"attachments":[]}
```

`NarrativeController::create` validates text/attachment presence, rate limits publication, creates the narrative, then writes `meydan_is_echo`. `Support/GoodAction.php:syncEchoMeta` responds to that write and creates the initiative using the first body line (up to 120 characters) as title, with `cta_label=پیوستن`, `status=active`, `allow_guest_join=0`. `Domain/WorkGroups.php:onInitiativeSaved` creates its `type=work` conversation and owner membership. Serializer returns `initiative.id`, `initiative.work_id` and viewer state; the composer navigates to `/chat/work/{work_id}`. No `POST /initiatives` exists for ordinary users, and there is no need to invent it.

Optional narrative fields actually accepted include `initiative_id` (link an existing initiative), `quoted_narrative_id`, `media_reflection`, `scheduled_at`, `tags`, `location:{province_id,city_id}`, and `poll`. These are separate semantics; scheduling/poll input acceptance does not establish every possible UI action or a public narrative-poll voting API.

Admin program creation is a different flow: `POST /admin/initiatives` with `title` required and `description`, `post_status`, `cta_label`, `starts_at`, `ends_at`, `status`, `labels`, `linked_content`, `schedule`, `order`, `allow_guest_join` accepted. Route gate requires administrator plus `manage_meydan_initiatives`. Use the existing admin service if needed; do not send an ordinary user's work to this route.

### Register a speaker account (administrator only)

There is no public endpoint that stores the signup page's application/name/phone/topics/resume pending review. Available speaker registration routes are administrative:

- `POST /admin/speakers` promotes an **existing** eligible user, required `{user_id}`. `SpeakerController::adminCreate` promotes via `SpeakerService::promote`, then saves accepted speaker profile fields: `name`, `bio`, `role`, `handle`, `expertise`, `initials`, `avatar_media_id`, `verified`, `cities:[numeric_city_id]`, `categories:[known_slug]`, `social_links`, `eitaa_channel`, `bale_channel`.
- `POST /admin/speakers/new-account` creates an OTP-login account and speaker role. Required `{phone,full_name}`; optional `email`, `province_id`, `city_id`, `handle`, `about`, `avatar_media_id`, `verified`, `cities`, `categories`, `social_links`, `eitaa_channel`, `bale_channel`. `SpeakerAdminService::create` validates normalized phone/uniqueness, name, optional email/uniqueness and province/city relationship; saves an account then promotes it, rolls back on failure, and returns serialized speaker with `201`. It does **not** forward arbitrary `expertise`/`role`/`initials` in this path; save those through the existing speaker PATCH if an admin workflow needs them.
- Both require administrator at `Routes::permission`, then `manage_meydan_speakers` at `SpeakerController`. An unprivileged application form cannot reuse them.

Example shape using real selected ids/slugs, not copied fixture values:

```json
{"phone":"<entered-phone>","full_name":"<entered-name>","province_id":1,"city_id":10,"about":"<entered-bio>","cities":[10],"categories":["<selected-existing-slug>"],"verified":false}
```

The ids above illustrate number types only; option ids must come from actual geo/category responses.

### Invite/book an existing speaker (not self-registration)

Current square invitation is `POST /speaker-invitations`:

```json
{"speaker_user_id":123,"requested_date":"2026-10-10","requested_time":"20:30","message":"<invitation-note>","initiative_id":456}
```

Use selected real speaker/initiative ids; `initiative_id` optional. Backend derives location from square profile, checks speaker role/non-self, date/time, and creates a real notification plus best-effort direct-chat invitation message. Frontend already exposes this through `createInvitation` and real success/error UI.

Legacy `POST /speaker-requests` instead accepts `{speaker_user_id,venue,requested_at,note?}`, with `creator_id` legacy alias carrying the **speaker user id**. Handler contains a guest-request option/captcha/rate-limit branch, but the current route gate requires login, making that branch unreachable through registered REST for anonymous callers. This route never applies to joining the speaker directory. Do not connect `SpeakerSignupView` to either booking endpoint.

## SoonBadge and missing-capability decisions

| Existing/reference surface | Verdict | Required implementation decision |
|---|---|---|
| Work creation, join, room, task board, RSVP, announcements, work polls | APIs exist and are already integrated | Keep working flows. A SoonBadge here would be false. |
| Speaker dispatch/invitation | APIs exist for square accounts | Keep working invitation form and role conditions. A blanket SoonBadge would be false. |
| Speaker **self-application** in `SpeakerSignupView` / signup banner | No public application API | Current Soon status is truthful for this meaning. Do not create fake request code or claim submission. Admin speaker registration remains available in its proper privileged context. |
| Composer “پویش” and “پویش رسانه‌ای” | Ordinary-user campaign creation APIs absent | Admin campaign CRUD and media reflection/quote behavior are not equivalent. Current disabled composer tabs are justified. |
| Feed/pinned “پویش” | No campaign timeline filter | Public campaign browse/detail/schedule exists. Enable a real campaign browse destination if design calls for it; do not invent `filter=campaign` or alias campaigns to initiatives. |
| Feed “پویش رسانه‌ای” using `reflected` | Real media-reflection browsing exists | Functional read; preserve real data while reviewing wording with reference semantics. |
| Content quick action “پویش” currently points `/home?filter=initiatives` | Wrong semantic destination | Backend campaigns and initiatives are distinct. Use real campaign read data or state the available initiative meaning. |
| Film/documentary screening application | No screening catalog/request API in registered controllers | Keep honest unsupported state; do not fabricate form success. |
| BistCall assignment/log/skip/cooldown | No phone allocation or call-result API | Keep honest unsupported state. Static province list is not a number provider; never port reference demo phones. |
| Chat voice/video call | No signaling/session/call endpoints | Disabled call buttons are truthful. Realtime text messaging does not supply calls. |
| Content contact action | No support-message API | `/config.quick_actions` may supply a real configured external contact href. Only enable such a real action when present; no local message-success substitute. |
| Hub promotional kit default slide | No dedicated kit endpoint; existing content can serve real files | Content attachments/download flow can show an actual published kit when data exists; do not hardcode an invented package. |
| Drafts, copy link, native share, story PNG creation, audio playback | Real device/browser behavior exists | These do not need a backend to be functional; no Soon state warranted. |

## Actionable findings and data-integrity limits

**F1 — High: public speaker signup cannot be completed with the current contract.** `SpeakerSignupView.tsx` is disabled and prevents submit; reference `openForm` stores `sp_req` in localStorage, chooses a random six-digit code and toasts success. That reference behavior is fake. Keep unsupported state unless a separately authorized backend application workflow is implemented. Admin registration is not permission-compatible and legacy booking is not meaning-compatible.

**F2 — High: anonymous analytics and download contract mismatch.** `lib/meydan-api.ts:requiresClientAuthentication` explicitly exempts narrative share, content share and content download POST. `Routes.php:permission` allows nested narrative/content paths only on GET, so these POSTs return `401` for guests before public-looking handlers execute. `ShareSheet` silently swallows analytics failure. `ContentDetailView:handleDownload` can open the already-public attachment URL after that failure, but download count is then not recorded. It also announces “download started” when a successful API response supplies no URL. Keep actual file access separate from confirmed analytics; fix the backend route gate only within an authorized backend change, or handle unconfirmed analytics honestly. Do not represent a failed counter write as persisted success.

**F3 — Medium: comment-thread read and pagination gap.** `GET /comments/{id}/replies` is not included in public route whitelist. Anonymous root-comment browsing works but expanding a reply thread can fail `401`. `comments.service.ts:listReplies` ignores `next_cursor`, so the visible thread silently stops at 20 descendants. Reuse the registered endpoint and preserve guest/error distinction and real paging; do not seed remaining replies.

**F4 — Medium: speaker-city representation mismatch.** Speaker serializer returns stored `cities` numeric ids; `speakers.service.ts:cityNames` accepts strings or `{name}` objects and treats numeric entries as no name. `SpeakerController::enrich` supplies handle/expertise/initials, not city-name enrichment. Directory cities can therefore be blank even for registered cities. Resolve real ids with existing geo data or authorized backend enrichment; no fallback “تهران” for unknown records. `SPEC.md` city/category/verified filter list is stale; current public implementation actually consumes q and speaker_category with page/per_page.

**F5 — Medium: invented content banners are always appended.** `HubBanners.tsx:DEFAULTS` unconditionally adds screening/nights/kit marketing slides after API-managed banners, even when the backend returns none or disables a matching banner. `banners.service.ts` converts errors to `[]`, which causes these defaults to hide the fact that banners failed. Use API-owned real banners and explicit absence/error policy; decorative empty layout can remain without inventing published offers.

**F6 — Medium: profile statuses and counts need source fidelity.** `profile-user-mapper.ts` manufactures a fallback `وضعیت عضویت = فعال` without an account status field and uses `stats.narratives || loadedPage.length`, so a valid zero is not distinguished from missing data. Square fallback count also uses page length when global count is missing. Remove unsourced membership assertions; use actual count when present or a clearly scoped loaded count, not a fictional total. Generic “عضو میدان”/initial avatar are presentation fallbacks, not evidence of verification or activity.

**F7 — Medium: report-night count is elapsed time, not published reports.** `report-days.service.ts:currentReportNight` computes days since 2026-03-01 in Tehran. `ContentView` presents “تمام N شب” while report data can contain fewer entries. This is a hardcoded campaign epoch, not backend total/actual attendance. Bind published-night counts to real report data when that is the label's meaning; a calendar day counter should be explicitly represented as such.

**F8 — Medium: share counter timing does not prove delivery.** `ShareSheet:openMessenger` counts before external/native share succeeds, so cancelled native share can still increment; `countedRef` also prevents retrying failed counter submission within a sheet. Native/browser share returns user-handled completion, not remote messenger delivery. Keep copy/export/share success tied to its actual API, and never claim a recipient received it until the chat send API confirms.

**F9 — Low/presentation: audio visualizer is synthetic.** `AudioProvider.tsx:startLevels` generates sine-wave levels explicitly instead of measuring audio; real audio playback itself uses HTML/native events. If the user's “no fake behavior” constraint includes meters, show an honest decorative playing animation or measured levels from a supported same-origin source. Do not replace the media runtime or disturb native background playback merely to match decorative reference bars.

**F10 — Low: unused content hook only toggles React playing state.** `features/content/hooks/useContent.ts:togglePlayback` toggles an `isPlaying` boolean without controlling audio. Current dedicated audio views use the real app `AudioProvider`; do not reuse this boolean toggle to implement a visual-only new player. Remove/replace only if that hook becomes part of the redesigned active flow.

**F11 — Limits must not become fabricated completeness.** Map route returns at most 1000 points per query; map client performs city fallback but each city remains capped. Map `activeCount=squares.length` is a count of returned published visible markers, not evidence each square is currently active. Initiative participant lists cap 100 while participant_count includes all active members (including guests). Invitation lists cap 100; followers default 100; profile replies cap 50; unread fallback sums loaded lists and can undercount vs `/me/unread`. Keep authoritative shell/unread endpoints and label/scope list-derived counts accurately.

**F12 — Model distinctions already implemented must survive visual refactoring.** Work groups are not direct chats; archive/read/private audience rules and task-manager rights are backend-enforced. Speaker account is not creator post. Entity profile id is not owner user id. Content bookmarks are not narrative bookmarks. Campaign is not initiative. Feed stats are not local demo counters. Preserve all these in mappings and navigation.

**F13 — Optional profile/media failures should remain visible where material.** Existing hooks sometimes swallow auxiliary follow/realtime/banners/contacts failures, and profile service intentionally falls back to older compatible real endpoints. Compatible endpoint fallback is legitimate; fallback invented identities, stats or persisted success is not. Distinguish a true empty result from request failure where user decisions depend on it.

## Reference artifact fake behaviors that must not be ported

Confirmed examples in the supplied HTML: BistCall `DEMO` phone pool randomly chooses a number, updates local `seen`/skip/cooldown/success state; speaker list builds names from hardcoded `FN`/other arrays and local invitation state (`sp_inv`); signup generates random code and saves `sp_req` instead of making a request; media fixtures include MDN `flower.mp4`/`friday.mp4`, W3Schools sources and hardcoded Persian comments/statistics. Local reference pin/draft/theme settings are layout behavior examples, not production account history.

Production equivalent must use backend ids, real media/attachment URLs, API counters, real profile/category/geo options, and confirmed submit results. Keep real loading/error/empty states. Mock mentions in existing `features/works` component comments describe the source HTML markup; runtime `WorkQueries`/`WorkMessages` data remains real and those comments alone are not evidence of fake records.

## Implementation and verification handoff

1. Visual work can proceed by restyling existing components and retaining hooks/services/providers. Do not rewrite the auth/API bridge or duplicate independent media/realtime runtimes.
2. Work creation/invitation/sharing/story/drafts/profile edits are already concrete supported flows. Connect reference controls only to their matching existing semantics and permissions.
3. Public speaker application, screening, BistCall, ordinary-user campaign creation and calls are genuinely unsupported. Document them, keep honest disabled/unsupported state, and do not invent endpoints or fake success.
4. Verify signed-in and anonymous read paths, unauthorized role attempts, successful writes with real API responses, failure rollback with preserved drafts, pagination exhaustion, expired cursors, reconnect refresh, upload cancellation, native audio and story export. Use disposable/local accounts for mutations, not production users or arbitrary contacts.
5. This report is source audit evidence, not live deployment coverage. Any “everything works” claim requires runtime checks of the implementation against the actual deployed/local WordPress instance, including matching plugins/routes and authenticated session state.
