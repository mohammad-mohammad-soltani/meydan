# Backend task: ranked "hot trends" endpoint for the app sidebar

Copy everything below into the backend agent.

---

## Context

`meydan` is a Persian (RTL) social app. Its WordPress REST namespace is
`meydan/v1`, exposed to the Next.js client through the `{ data, meta }` envelope
(`data` is the payload, `meta.request_id` / `meta.next_cursor` are optional).

The desktop left sidebar now renders a **ranked hot-trends board** ("ترندهای داغ
میادین"). The frontend already integrates with the endpoint specified here today;
while it is missing, the widget degrades to `GET /explore/trends?window=24h`
(which currently returns `items: []`), so **no frontend change is required once
you ship this route**.

## Deliverable

`GET /wp-json/meydan/v1/trends/hot`

Public (no auth required), read-only.

### Query parameters

| Param    | Type   | Default | Rules                                                        |
| -------- | ------ | ------- | ------------------------------------------------------------ |
| `window` | string | `24h`   | one of `1h`, `6h`, `24h`, `7d`, `30d`; anything else → `400`  |
| `limit`  | int    | `5`     | `1`–`10`; clamp or `400` on non-numeric                       |
| `kind`   | string | –       | optional filter: `topic` \| `square` \| `initiative` \| `narrative` |

### Response `200`

```json
{
  "data": {
    "window": "24h",
    "generated_at": "2026-09-13T09:30:00+03:30",
    "items": [
      {
        "id": "topic-184",
        "rank": 1,
        "kind": "topic",
        "context": "موضوع روز",
        "title": "#فرمانده_کل_قوا",
        "href": "/explore?q=%23%D9%81%D8%B1%D9%85%D8%A7%D9%86%D8%AF%D9%87_%DA%A9%D9%84_%D9%82%D9%88%D8%A7",
        "metric": { "value": 128000, "label": "روایت" }
      },
      {
        "id": "square-42",
        "rank": 2,
        "kind": "square",
        "context": "میدان انقلاب تهران",
        "title": "طومار ۵۰ متری تجدید بیعت",
        "href": "/profile/square/42",
        "metric": { "value": 45000, "label": "امضا" }
      },
      {
        "id": "initiative-77",
        "rank": 3,
        "kind": "initiative",
        "context": "ابتکار میدانی یزد",
        "title": "ایستگاه شارژ اضطراری موبایل",
        "href": "/initiatives/77",
        "metric": { "value": 21, "label": "میدان مجری" }
      }
    ]
  },
  "meta": { "request_id": "req_xxx", "next_cursor": null }
}
```

### Item contract (exact field names — the client reads these)

- `id` — stable string, unique inside the response (used as the React key).
- `rank` — 1-based integer. Must be ascending and gap-free after sorting.
- `kind` — `topic` | `square` | `initiative` | `narrative`.
- `context` — short **plain-text** lead line (≤ 40 chars): "موضوع روز", a square
  name, a province, etc. No HTML.
- `title` — the bold line: hashtag, headline or initiative name (≤ 80 chars),
  plain text, no HTML, no leading emoji.
- `href` — **app-relative path** that the Next.js client can pass to `next/link`:
  must start with `/` (never `//`, never an absolute URL, never `javascript:`).
  Suggested targets: `/explore?q=…`, `/profile/square/{id}`, `/initiatives/{id}`,
  `/posts/{id}`.
- `metric.value` — raw integer (the client formats it to Persian numerals with
  `Intl.NumberFormat("fa-IR", { notation: "compact" })`; **do not** pre-format,
  do not send Persian digits).
- `metric.label` — noun for the metric: `روایت`, `امضا`, `بازدید`, `میدان مجری`,
  `واکنش`. Keep it to 1–2 words.

### Rules

1. **Ranking** — score items inside the window, strongest first. Suggested
   weights: narratives ×3, unique authors ×2, likes ×1, comments ×2, reposts ×2,
   views ×0.01; squares/initiatives inherit the score of their members.
2. **Window** — only count activity with a timestamp inside `window`; ignore
   deleted/hidden/draft entities and blocked or spam-flagged actors.
3. **Dedupe** — one row per topic/square/initiative; merge hashtag spelling
   variants that normalize to the same slug.
4. **Ties** — break by most recent activity, then by `id` ascending, so `rank`
   is deterministic between two calls with the same data.
5. **Empty is valid** — if nothing qualifies, return `200` with `"items": []`.
   Never pad with stale or invented rows.
6. **Errors** — use the WordPress error envelope, e.g.
   `{"error":{"code":"meydan_invalid_window","message":"window must be one of 1h, 6h, 24h, 7d, 30d"}}`
   with status `400`.
7. **Performance** — cache the computed board per `(window, limit, kind)` for
   60 seconds (transient or object cache); no N+1 queries; the endpoint is
   called by every desktop page load of the app.
8. **Encoding** — UTF-8, `application/json`; keep Persian text unescaped
   (`JSON_UNESCAPED_UNICODE`) so the payload stays readable in logs.

## Acceptance checks

```bash
BASE=https://meydan-api.nabzjahan.ir/wp-json/meydan/v1

# default board, at most 5 rows, ranks 1..n
curl -s "$BASE/trends/hot" | jq '.data.items | length, [.[].rank]'

# window + limit are honoured
curl -s "$BASE/trends/hot?window=7d&limit=3" | jq '.data.window, (.data.items|length)'

# every href is app-relative and every metric is numeric
curl -s "$BASE/trends/hot" | jq '[.data.items[] | select((.href|startswith("/")|not) or (.metric.value|type != "number"))] | length == 0'

# bad window is rejected
curl -s -o /dev/null -w '%{http_code}\n' "$BASE/trends/hot?window=ever"   # 400
```

Please also report back: the route name, its cache TTL, the ranking weights you
shipped, and one real sample response from production data.
