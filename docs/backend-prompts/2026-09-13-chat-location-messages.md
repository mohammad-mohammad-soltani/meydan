# Backend task: chat attachments polish + first-class square-location messages

Copy everything below into the backend agent.

---

## Context

`meydan` (WordPress REST namespace `meydan/v1`, envelopes `{ data, meta }`) has a
1:1 chat. The client now ships a Telegram-style attachment menu with five
options: **عکس / ویدیو / صوت / فایل / موقعیت مکانی میدان**.

- The four file options already work through the existing pipeline
  (`POST /uploads` → `PUT /uploads/{id}/chunks/{n}` → `POST /uploads/{id}/complete`
  with `purpose: "chat"`, then `POST /chat/conversations/{id}/messages` with an
  `attachment` object). No frontend change is needed there.
- The **square location** option works today as a plain text message, because the
  API has no location message type. The client formats:

```
📍 موقعیت میدان
{name}
{address}
https://www.google.com/maps?q={latitude},{longitude}
```

  and renders a map card when a body starts with `📍 موقعیت میدان`.

That text convention works but is fragile: it cannot be searched or filtered as
a location, the preview is a long string, and coordinates are only a URL. Please
implement the structured version below; the frontend will switch to it and keep
the text fallback for old messages.

## 1) First-class location messages

**Send** — extend `POST /wp-json/meydan/v1/chat/conversations/{conversation_id}/messages`:

```json
{
  "client_id": "uuid",
  "type": "location",
  "reply_to_id": null,
  "location": {
    "square_id": 54,
    "name": "مسجد سید اصفهان",
    "address": "اصفهان، خیابان سپاه",
    "latitude": 32.6542,
    "longitude": 51.6679
  }
}
```

- `type` is optional and defaults to `"text"`; when `type: "location"` the
  `body` field may be omitted and `location` is required.
- Validate: `latitude ∈ [-90, 90]`, `longitude ∈ [-180, 180]`, `name` non-empty
  (≤ 120 chars), `address` ≤ 300 chars.
- Only conversation members may send. A square account may only share **its own**
  square; a user account may share the square of the conversation (if the peer is
  a square) or a square it belongs to. Persist `shared_by` = the sender's user id.
- Reject with the standard error envelope, e.g.
  `{"error":{"code":"meydan_invalid_location","message":"location.latitude must be between -90 and 90"}}` (status `400`).

**Read** — every message payload (`GET /chat/conversations/{id}/messages` and the
realtime `message:created` event) must include:

```json
{
  "id": 812,
  "type": "location",
  "body": "",
  "location": { "square_id": 54, "name": "…", "address": "…", "latitude": 32.6542, "longitude": 51.6679 },
  "attachment": null
}
```

- `type` must always be present (`"text"` for everything else) so the client can
  branch without guessing.
- Existing text messages keep `type: "text"` and no `location` key.
- Conversation list `preview` for a location message must be a stable short
  label: `📍 موقعیت میدان` (optionally `📍 موقعیت میدان · {name}`).
- Message search (`GET /chat/conversations/{id}/messages/search?q=`) should match
  the square `name` and `address` of location messages.

## 2) Give the client the square in one call

The composer resolves the shareable square before sending. Today it needs a
second request (`GET /squares/{id}`) and, for user accounts, the peer square id.

- `GET /me` should return the viewer's square identity **with its location**:

```json
{
  "account_type": "square",
  "square": {
    "id": 54,
    "name": "مسجد سید اصفهان",
    "address": "اصفهان، خیابان سپاه",
    "latitude": 32.6542,
    "longitude": 51.6679
  }
}
```

- `GET /chat/conversations` participants of type `square` should carry the same
  `location` object (or at least `latitude`/`longitude` + `address`).
- `GET /squares/{id}` must always expose `location.latitude` and
  `location.longitude` (the client already accepts `location.latitude`,
  `location.lat`, `latitude` and `lat`). Squares without coordinates should
  return `null` rather than `0`, so the client can disable the option.

## 3) Upload hygiene for the four file types

- Enforce a max size per type (suggested: image 15 MB, audio 30 MB, video
  100 MB, file 50 MB) and return a clear `413`/`400` error message.
- Return `mime_type` and `size` on `POST /uploads/{id}/complete` exactly as
  uploaded (the client displays them in the bubble).
- Generate a small preview for images (≤ 400 px) and a poster frame for videos,
  and return it as `preview_url` in the attachment payload. The client currently
  shows the original file as its own thumbnail.

## Acceptance checks

```bash
BASE=https://meydan-api.nabzjahan.ir/wp-json/meydan/v1
TOKEN=…   # a member of conversation 12

# 1. send a structured location
curl -s -X POST "$BASE/chat/conversations/12/messages" \
  -H "authorization: Bearer $TOKEN" -H "content-type: application/json" \
  -d '{"client_id":"loc-1","type":"location","location":{"square_id":54,"name":"مسجد سید اصفهان","latitude":32.6542,"longitude":51.6679}}' \
  | jq '.data | {type, location}'

# 2. it comes back typed, with the location object
curl -s "$BASE/chat/conversations/12/messages" -H "authorization: Bearer $TOKEN" \
  | jq '[.data[] | select(.type=="location")] | length > 0'

# 3. invalid coordinates are rejected
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE/chat/conversations/12/messages" \
  -H "authorization: Bearer $TOKEN" -H "content-type: application/json" \
  -d '{"type":"location","location":{"square_id":54,"name":"x","latitude":999,"longitude":0}}'   # 400

# 4. /me carries the square location
curl -s "$BASE/me" -H "authorization: Bearer $TOKEN" | jq '.data.square'
```

Please report back: the route/field names you shipped, validation limits, whether
old `📍` text messages were backfilled (optional), and one real sample payload.
