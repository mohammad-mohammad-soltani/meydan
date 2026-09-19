# Feed V2 Design

## Goal

Replace the enabled `for_you` ranking path with a deterministic, configurable
Feed V2 pipeline while preserving the public `GET /timeline` request and
response contract. Turning `feed_algorithm_v2_enabled` off must immediately
select the untouched V1 pipeline; it requires neither data migration nor a
frontend rollback.

## Scope and exclusions

Feed V2 is inspired by the staged candidate pipeline described by
[`xai-org/x-algorithm`](https://github.com/xai-org/x-algorithm), but it is a
native WordPress/PHP implementation. It intentionally does **not** use
affinity, interaction graphs, semantic similarity, embeddings, topics,
interest vectors, ML, or transformer ranking. Existing V1 affinity behaviour
is retained only when the feature flag is disabled.

The `following` timeline mode, TimelineSession cursor format, serialization,
view increments and existing frontend feed service remain compatible.

## Existing model reused

| Requirement | Existing source of truth |
|---|---|
| narratives | `meydan_narrative` posts, `publish` status |
| author | `meydan_author_actor_type` / `meydan_author_actor_id` |
| follows and likes | `meydan_interactions` |
| views, likes, comments, reposts, shares | `meydan_narrative_stats` |
| editorial | `meydan_editorial` post meta |
| Good Deed | narrative `meydan_initiative_id`; `GoodAction` creates this relation for echo narratives |
| narrative location | `meydan_city_id`, `meydan_province_id` post meta |
| viewer location | matching `meydan_*` user meta from `Viewer` |
| square location | `meydan_square_geo` |
| previously served | `meydan_served_history` |
| event foundation | `meydan_events`, via `EventLogger` |

The applicable author-role multiplier is the greatest of: normal `1.0`,
Square actor `1.25`, a `meydan_speaker` owner `1.50`, and a
`meydan_official` owner `2.25`. Multipliers never stack. A Square post is
resolved through its owner only when a role check is required; user posts are
resolved from their user actor.

## Request path

`TimelineController::timeline()` keeps all validation, cursor/session handling
and the public response envelope. For `mode=for_you`, `filter=all`, and an
enabled V2 flag, it delegates snapshot construction to `FeedService`:

```text
FeedRequest + Viewer
  -> FeedContext
  -> CandidateGenerator (following, recent, editorial, Good Deed,
                         same city, same province, general)
  -> CandidateHydrator (one batch per relation/data family)
  -> PreRankFilter
  -> FeedScorer
  -> FeedRanker (score DESC, date DESC, id DESC)
  -> FeedDiversity
  -> TopK selector
  -> TimelineSession snapshot
  -> existing Serializer and served/view side effects
```

Candidates are keyed by narrative ID and retain all source names in a set.
Every source query limits itself to published narratives not older than
`max_post_age_hours`; the general source fills only the configured candidate
pool. There is no random ordering. Batch hydration joins narrative stats,
author roles, follow relations, served history, editorial/initiative flags,
and locations without a per-candidate query.

Pre-rank filters exclude missing, non-published, deleted/unavailable content,
and blocked authors/posts when such relations exist. The initial policy for
already served content is a configurable penalty; the architecture leaves
space for hide/mute/block/report sources without inventing unsupported
relationships. Existing served history remains the source of served signals.

## Scoring

The base score is an intentionally simple score with normalized engagement:

```text
engagement = log1p(likes) * likeWeight
           + log1p(views) * viewWeight
           + log1p(comments) * commentWeight
           + log1p(shares + reposts) * shareWeight

final = baseScore * min(product(applicable multipliers), maxTotalBoost)
```

Freshness is selected from ordered, editable buckets and narratives older than
the configured maximum age never become candidates. Location selects exactly
one multiplier: same city, otherwise same province, otherwise 1.0. Following,
editorial and Good Deed are separate conditional multipliers. The response
order is stable for a snapshot through existing `TimelineSession` behaviour;
ties are explicitly resolved by date then ID.

`FeedDiversity` runs after ranking and enforces the configured per-author cap
inside the configured top-N window, preferring the next eligible ranked item.
It does not destroy lower-ranked content outside that window.

## Settings, cache and feature flag

`FeedSettings` owns defaults, normalization, validation, persistence and cache
invalidation. It persists one namespaced WordPress option:
`meydan_feed_settings`. The option includes the feature flag, engagement and
role weights, all boost values, candidate limits, age cap, diversity values,
served policy, and freshness buckets.

All reads use `wp_cache_*` with a dedicated group and fall back to the option.
Every successful save or reset clears the group. Defaults are returned when the
option is absent, so disabling V2 or enabling it on an existing site needs no
migration. Backend validation is authoritative: finite numeric values only,
bounded non-negative weights and multipliers, positive limits, sorted
non-overlapping freshness intervals, and every bucket within the post-age cap.

The V1 branch is selected before constructing any V2 service. Consequently
switching the flag off is immediate and cannot mutate the V1 ranking data.

## Administration and debug surface

New administrator-only routes under the existing `/admin/*` permission policy:

- `GET /admin/feed/settings` returns effective settings and defaults.
- `PUT /admin/feed/settings` validates and saves a complete settings document.
- `POST /admin/feed/settings/reset` validates the default document through the
  same path and invalidates the same cache.
- `GET /admin/feed/preview?user_id={id}&limit={1..50}` returns an ephemeral V2
  ranking result with sources, rank and score explanation.

Each settings save/reset calls `AuditLogger::log('feed_settings_updated', …)`
with complete before/after values. Preview constructs a `Viewer` context and
calls the read-only pipeline with `recordSideEffects=false`: it writes no
views, served rows, event rows, user-specific cache, or analytics.

`GET /timeline?debug_feed=1` only adds a debug breakdown for a confirmed
administrator. Normal timeline responses remain exactly their current shape;
they contain neither score nor ranking metadata. Feed result metadata stays
internal until the controller is operating in authorised debug/preview mode.

The Next.js `/admin/feed` page follows the existing per-page administrator
gate and uses the existing authenticated proxy/service pattern. It groups
Persian fields under engagement, roles, location, special content, freshness,
indexing, diversity and candidate generation. Client validation gives immediate
feedback but sends all writes to the backend validator. Each group can reset
to defaults, and the page includes a read-only preview user selector.

## Frontend compatibility

`features/feed/services/feed.service.ts`, the infinite-scroll hook and
`FeedView` keep calling `/timeline`; no public Feed API type gains mandatory
ranking fields. The only frontend behaviour change is that an enabled backend
flag makes the existing endpoint serve its V2 snapshot.

## Defaults

| Setting | Default |
|---|---:|
| like / view / comment / share | 1.00 / 0.08 / 2.00 / 1.50 |
| Square / speaker / official | 1.25 / 1.50 / 2.25 |
| editorial / Good Deed | 1.70 / 1.25 |
| same city / same province | 1.50 / 1.25 |
| following | 1.60 |
| maximum total boost | 6.0 |
| maximum post age | 72 hours |
| candidate pool | 300 |
| max author posts in top 20 | 3 |
| freshness buckets | 0–6: 1.45; 6–12: 1.35; 12–24: 1.20; 24–48: 0.85; 48–72: 0.60 |

## Verification

Unit tests will exercise scorer mathematics, bucket boundaries, cap behaviour,
role selection, locality selection, source aggregation and settings validation.
Backend contract checks will cover API routes, permissions, non-leaking debug
data, preview side-effect freedom, audit/cache behaviour and V1 fallback.
Frontend tests will pin the feed admin navigation, per-page guard, service
verbs, reset/validation, and the unchanged `/timeline` consumer contract.
The final verification runs the relevant backend checks, Next admin/feed tests,
lint, frontend build and backend build/smoke command available in this checkout.
