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

## Author-role resolution

Role resolution reads only the author actor stored on the narrative; it does
not search arbitrary users or make unrelated role lookups.

- A `user` actor resolves directly to that user's WordPress roles.
- A `square` actor resolves through that square's actual owner, then reads only
  that owner's WordPress roles.

The applicable multiplier is the single greatest value: normal `1.0`, Square
`1.25`, `meydan_speaker` `1.50`, or `meydan_official` `2.25`. It never stacks.
For example, a (legacy or manually assigned) owner with both official and
speaker roles receives `2.25`, never `2.25 * 1.50`.

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

The ranking formula is intentionally explicit and uses no interest-based
signal. `max_engagement_score` bounds even normalized viral engagement before
any boost is considered:

```text
calculated_engagement_score = log1p(likes) * likeWeight
                              + log1p(views) * viewWeight
                              + log1p(comments) * commentWeight
                              + log1p(shares + reposts) * shareWeight

engagement_score = min(calculated_engagement_score, max_engagement_score)

base_score = engagement_score

total_boost = min(
    product(all_applicable_positive_multipliers),
    max_total_boost
)

final_score = base_score * freshness_multiplier * total_boost
```

`freshness_multiplier` is selected from ordered, editable freshness buckets;
the default buckets are listed below. Narratives older than the configured
maximum age never become candidates, so they cannot receive a freshness score.
`max_engagement_score` and `max_total_boost` are editable Feed Settings;
`max_total_boost` defaults to `6.0`.

Location selects exactly one multiplier: same city, otherwise same province,
otherwise `1.0`; city and province never stack. Following is an independent
positive multiplier: when the viewer follows the narrative author it uses the
configured `following_multiplier` (default `1.60`), otherwise it is `1.0`.
It is included alongside role, editorial, location and Good Deed multipliers,
then the combined positive product is capped by `max_total_boost` before it is
applied. The response order is stable for a snapshot through existing
`TimelineSession` behaviour; ties are explicitly resolved by date then ID.

`FeedDiversity` runs after ranking and enforces the configured per-author cap
inside the configured top-N window, preferring the next eligible ranked item.
It does not destroy lower-ranked content outside that window.

## Admin Feed Configuration

### Storage

`FeedSettings` owns defaults, normalization, validation, persistence and cache
invalidation. It persists one namespaced WordPress option:
`meydan_feed_settings`. The option includes the feature flag, engagement and
role weights, `max_engagement_score`, all boost values, candidate limits, age
cap, diversity values, served policy, and freshness buckets. Persistence is
behind a settings store interface/service; `FeedScorer` consumes the resolved
settings object and never calls `get_option()` itself.

### API and permission

The existing `/admin/*` route permission policy is authoritative: only a
WordPress `administrator` may read, preview, reset or update these settings.

- `GET /admin/feed/settings` returns the effective settings and defaults.
- `PUT /admin/feed/settings` validates and saves a complete settings document.
  A reset submits the defaults through this same endpoint and validation path,
  rather than bypassing validation in a separate write route.
- `GET /admin/feed/preview?user_id={id}&limit={1..50}` returns an ephemeral V2
  ranking result for the selected user.

### Cache, audit and feature flag

All reads use `wp_cache_*` with a dedicated group and fall back to the option.
Every successful save or reset clears the group. Defaults are returned when the
option is absent, so disabling V2 or enabling it on an existing site needs no
migration. Backend validation is authoritative: finite numeric values only,
bounded non-negative weights and multipliers, positive limits, sorted
non-overlapping freshness intervals, and every bucket within the post-age cap.

The V1 branch is selected before constructing any V2 service. Consequently
switching the flag off is immediate and cannot mutate the V1 ranking data.

Every successful update or reset invalidates this cache and calls
`AuditLogger::log('feed_settings_updated', …)` with complete before/after
values. Backend validation is authoritative: finite numeric values only,
bounded non-negative weights and multipliers, positive limits, sorted
non-overlapping freshness intervals, and every bucket within the post-age cap.

## Feed Admin UI

The Next.js `/admin/feed` page follows the existing per-page administrator
gate, uses the existing authenticated proxy/service pattern, is titled «فید»,
and appears in administrator navigation. It groups Persian fields under:

- تعامل کاربران
- نقش کاربران
- محتوای ویژه
- موقعیت مکانی
- تازگی محتوا
- ایندکسینگ
- Diversity
- Candidate Generation

Every setting has a Persian label and explanation, its current and default
values, client validation, a reset for its section, and a whole-document reset.
Client validation gives immediate feedback but sends every write—including
resets—to the backend validator and cache-invalidation path.

## Preview and explainability

Preview constructs a `Viewer` context and calls the read-only V2 pipeline with
`recordSideEffects=false`. It must not increment views, add served-history
rows, emit analytics/events, or mutate cache for a real user. Its internal
items contain at least:

```json
{
  "narrative_id": 123,
  "rank": 1,
  "source_names": ["following", "same_city"],
  "score": 12.34,
  "base_score": 4.56,
  "freshness_multiplier": 1.35,
  "role_multiplier": 2.25,
  "location_multiplier": 1.5,
  "editorial_multiplier": 1.7,
  "good_deed_multiplier": 1.0,
  "following_multiplier": 1.6
}
```

`GET /timeline?debug_feed=1` exposes an equivalent breakdown only to a
confirmed administrator. Normal timeline responses remain exactly their
current shape: they contain neither score nor ranking metadata. Feed result
metadata stays internal outside authorised debug/preview output.

## Frontend compatibility

`features/feed/services/feed.service.ts`, the infinite-scroll hook and
`FeedView` keep calling `/timeline`; no public Feed API type gains mandatory
ranking fields. The only frontend behaviour change is that an enabled backend
flag makes the existing endpoint serve its V2 snapshot.

## Defaults

| Setting | Default |
|---|---:|
| like / view / comment / share | 1.00 / 0.08 / 2.00 / 1.50 |
| maximum engagement score | 25.0 |
| Square / speaker / official | 1.25 / 1.50 / 2.25 |
| editorial / Good Deed | 1.70 / 1.25 |
| same city / same province | 1.50 / 1.25 |
| following | 1.60 |
| maximum total boost | 6.0 |
| maximum post age | 72 hours |
| candidate pool | 300 |
| max author posts in top 20 | 3 |
| freshness buckets | 0–6: 1.45; 6–12: 1.35; 12–24: 1.20; 24–48: 0.85; 48–72: 0.60 |

## Testing requirements

### Ranking

- official ranks above speaker, Square and normal authors for equal base score;
- only the highest role multiplier applies, including official plus speaker;
- editorial, Good Deed and following boosts apply when their conditions hold;
- same city ranks above same province, and city/province do not stack;
- comments contribute more than likes, and likes more than views;
- each freshness bucket applies at its exact boundary and posts over 72 hours
  never become candidates at the default setting;
- the engagement cap and `max_total_boost` cap both apply.

### Feature flag

- an enabled flag selects V2 for the eligible existing `/timeline` path;
- a disabled flag selects V1 unchanged, with no migration.

### Administration

- an administrator can read and update settings; a non-administrator cannot;
- update and reset both validate, invalidate cache and record audit before/after
  values;
- frontend validation gives feedback but backend validation rejects malformed,
  out-of-range and invalid bucket documents.

### Preview and compatibility

- preview produces no views, served history, analytics event or real-user cache
  mutation;
- preview and authorised `debug_feed=1` output return the correct score
  breakdown, while normal `/timeline` never leaks it;
- frontend infinite scroll and the existing `/timeline` response contract remain
  unchanged.

The final verification runs the relevant backend checks, Next admin/feed tests,
lint, frontend build and backend build/smoke command available in this checkout.
