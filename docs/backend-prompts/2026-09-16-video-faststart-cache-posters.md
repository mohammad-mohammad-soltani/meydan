# Backend task: make uploaded videos stream instantly (faststart + caching + posters)

Copy everything below into the backend agent.

---

## Context

`meydan` (WordPress REST namespace `meydan/v1`, `{ data, meta }` envelopes) serves
every upload from `/wp-content/uploads/**`. Videos in the timeline load very
badly, and the cause is in the files themselves plus their HTTP headers — not in
the client.

**Measured on production (`https://meydanbackend.naghshman.ir`), 2026-09-16**, by
reading the MP4 atom table of the four videos in the first `for_you` page:

| File | Size | Top-level atoms |
| --- | --- | --- |
| `video-15.mp4` | 13.5 MB | `ftyp`(32 B) → `mdat`(13.48 MB) → **`moov` ≈ 19.8 KB at EOF** |
| `video-12.mp4` | 20.7 MB | `ftyp` → `free` → `mdat`(20.59 MB) → **`moov` ≈ 61 KB at EOF** |
| `video-14.mp4` | 20.8 MB | same shape |
| `video-output-79596127-…-1.mp4` | 17.8 MB | same shape |

The metadata (`moov`) sits at the very end of every file. A browser must read the
head, discover there is no `moov`, and then issue a **second** range request to
the tail of the file before it can know the duration, the dimensions or paint any
frame. On iOS/Safari this shape is the classic "video never starts" case. Two
more findings from the same request:

- The upload responses carry **no `Cache-Control`** (only `ETag`/`Last-Modified`),
  so every visit re-fetches ranges.
- Attachments expose **no still frame and no duration** (`duration: null`), so a
  card has to touch the file to show anything at all. Ask #4 fixes that.

Range handling itself is fine (`Accept-Ranges: bytes`; `bytes=N-` and `bytes=-N`
both answer `206`), so nothing below asks you to change the server config —
except the cache header in #3.

The client has already stopped preloading video cards (`preload="none"`, nothing
is fetched until the reader taps play) and never uses the video file as its own
poster any more, so **no frontend change is needed for #1–#4**; `poster_url` and
`thumbnail_url` are mapped already.

## 1) Remux every accepted video as faststart

At `POST /uploads/{upload_id}/complete`, when the finished file is a video:

```bash
ffmpeg -y -i source.mp4 -c copy -movflags +faststart source.faststart.mp4
mv source.faststart.mp4 source.mp4
```

- `-c copy` means no re-encode: no quality loss, CPU cost is a few hundred ms even
  for a 100 MB file. Requires `ffmpeg` on the host.
- Keep the same filename/URL so existing narratives and clients keep working; if
  you must write a new name, return it in the payload.
- If `ffmpeg` fails, still accept the upload (log it) — a slower video beats a
  failed publish.

## 2) One-off remux of the videos already uploaded

Existing files stay broken until they are rewritten. A one-off WP-CLI/cron pass
over `/wp-content/uploads/**/*.mp4` that remuxes only files whose `moov` is not
inside the first 64 KB, writing to a temp file and renaming atomically.

- Expect `ETag`/`Last-Modified` to change for remuxed files (clients refetch once).
- Report how many files were remuxed and how many already had `moov` first.

## 3) Long-lived cache headers for uploads

Every uploaded file has a unique name, so it is safe to make it immutable:

```
Cache-Control: public, max-age=31536000, immutable
```

- Keep `Accept-Ranges: bytes`, and do not gzip/compress video or audio responses.
- Apply it to `/wp-content/uploads/**` (nginx/Apache or the PHP layer that serves
  them; the REST API itself does not need to change).

## 4) Still frame + duration in the attachment payload

Add to each attachment object returned by `/timeline`, `/narratives/{id}`,
`/content/{id}` and chat messages:

```json
{
  "id": 132,
  "type": "video",
  "url": "https://…/video-12.mp4",
  "poster_url": "https://…/video-12-poster.jpg",
  "thumbnail_url": "https://…/video-12-poster.jpg",
  "duration": 42.6,
  "width": 1920,
  "height": 1080
}
```

- `poster_url`: a frame around second 1, at most 720 px on the long edge, JPEG or
  WebP, a few tens of KB. Generate it with the same ffmpeg pass
  (`ffmpeg -ss 1 -i in.mp4 -frames:v 1 -vf "scale='min(720,iw)':-2" poster.jpg`).
- `duration`: seconds as a number (the client shows it as a length badge).
- Either key is acceptable for the still — the client reads
  `poster_url ?? thumbnail_url`.

## Acceptance checks

```bash
BASE=https://meydanbackend.naghshman.ir

# 1. moov is now inside the first 64 KB of every video
curl -s "$BASE/wp-json/meydan/v1/timeline?mode=for_you" \
  | jq -r '.data[].attachments[]? | select(.type=="video") | .url' \
  | while read -r u; do
      printf '%s -> ' "$(basename "$u")"
      curl -s -r 0-65535 "$u" | grep -c moov
    done        # every line must print 1, not 0

# 2. uploads are cacheable
curl -sI "$(curl -s "$BASE/wp-json/meydan/v1/timeline?mode=for_you" \
  | jq -r '.data[].attachments[]? | select(.type=="video") | .url' | head -1)" \
  | grep -i 'cache-control\|accept-ranges'

# 3. videos carry a still and a duration
curl -s "$BASE/wp-json/meydan/v1/timeline?mode=for_you" \
  | jq '[.data[].attachments[]? | select(.type=="video") | {poster_url, duration}]'
```

Please report back: whether ffmpeg is available on the upload host, how many
existing files were remuxed, the cache-header directive you shipped, and one real
sample attachment payload.
