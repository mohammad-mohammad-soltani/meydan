import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  clamp,
  faDigits,
  fileItems,
  formatClock,
  formatFileSize,
  mediaAspectRatio,
  mediaItemFromNamedAttachment,
  mediaItemsFromAttachments,
  visualItems,
} from "../features/media/media-utils.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");

test("attachments normalise into one media item shape", () => {
  const items = mediaItemsFromAttachments([
    { id: "a", label: "عکس", icon: "image", previewSrc: "/a.jpg", width: 1200, height: 800 },
    { id: "b", label: "کلیپ", icon: "video", previewSrc: "/b.mp4", previewAlt: "ویدیو میدان" },
    { id: "c", label: "صوت", icon: "microphone", audioSrc: "/c.mp3" },
    { id: "d", label: "سند", icon: "article" },
  ]);

  assert.deepEqual(
    items.map((item) => item.kind),
    ["image", "video", "audio", "file"],
  );
  assert.equal(items[0].src, "/a.jpg");
  assert.equal(items[1].title, "ویدیو میدان");
  // A video is never its own poster: the old fallback made the browser fetch
  // the clip as an image, which wasted a request and left the card black.
  assert.equal(items[1].poster, undefined);
  assert.equal(items[2].src, "/c.mp3");
  // Only visual attachments reach the gallery/lightbox.
  assert.deepEqual(visualItems(items).map((item) => item.id), ["a", "b"]);
  assert.deepEqual(fileItems(items).map((item) => item.id), ["d"]);
});

test("a video poster is only accepted when it is a real still", () => {
  const [withStill] = mediaItemsFromAttachments([
    { id: "b", icon: "video", previewSrc: "/b.mp4", posterSrc: "/b.jpg" },
  ]);
  assert.equal(withStill.poster, "/b.jpg");

  // A backend that echoes the video URL back does not describe a poster.
  const [echoed] = mediaItemsFromAttachments([
    { id: "b", icon: "video", previewSrc: "/b.mp4", posterSrc: "/b.mp4" },
  ]);
  assert.equal(echoed.poster, undefined);

  // Chat sends the same URL as `url` and `previewUrl`, so neither is a still.
  const chatVideo = mediaItemFromNamedAttachment({
    id: "v",
    name: "v.mp4",
    mimeType: "video/mp4",
    url: "/v.mp4",
    previewUrl: "/v.mp4",
  });
  assert.equal(chatVideo.poster, undefined);

  const chatWithStill = mediaItemFromNamedAttachment({
    id: "v",
    name: "v.mp4",
    mimeType: "video/mp4",
    url: "/v.mp4",
    posterSrc: "/v.jpg",
  });
  assert.equal(chatWithStill.poster, "/v.jpg");
});

test("chat uploads classify by mime type", () => {
  assert.equal(mediaItemFromNamedAttachment({ id: "1", name: "p.jpg", mimeType: "image/jpeg" }).kind, "image");
  assert.equal(mediaItemFromNamedAttachment({ id: "2", name: "v.mov", mimeType: "video/quicktime" }).kind, "video");
  assert.equal(mediaItemFromNamedAttachment({ id: "3", name: "a.ogg", mimeType: "audio/ogg" }).kind, "audio");
  assert.equal(mediaItemFromNamedAttachment({ id: "4", name: "f.pdf", mimeType: "application/pdf" }).kind, "file");

  const audio = mediaItemFromNamedAttachment({
    id: "3",
    name: "a.ogg",
    mimeType: "audio/ogg",
    size: 48210,
    url: "/a.ogg",
  });
  assert.equal(audio.detail, "۴۷ کیلوبایت");
  assert.equal(audio.src, "/a.ogg");
});

test("time, size and ratio formatting stay Persian and bounded", () => {
  assert.equal(faDigits("0123456789"), "۰۱۲۳۴۵۶۷۸۹");
  assert.equal(formatClock(92), "۱:۳۲");
  assert.equal(formatClock(3725), "۱:۰۲:۰۵");
  assert.equal(formatClock(-4), "۰:۰۰");
  assert.equal(formatFileSize(48210), "۴۷ کیلوبایت");
  assert.equal(formatFileSize(3 * 1024 * 1024), "۳.۰ مگابایت");
  assert.equal(formatFileSize(0), "");

  assert.equal(mediaAspectRatio(1600, 900), 16 / 9);
  assert.equal(mediaAspectRatio(0, 0, 1), 1);
  // Ultra-tall uploads stay in a usable frame.
  assert.equal(mediaAspectRatio(300, 1200), 4 / 5);
  assert.equal(clamp(12, 0, 4), 4);
});

test("every surface renders the shared players instead of its own", () => {
  const shared = [
    "features/media/components/MediaGallery.tsx",
    "features/media/components/MediaLightbox.tsx",
    "features/media/components/VideoPlayer.tsx",
    "features/media/components/MediaAudioCard.tsx",
    "features/media/components/MediaFileCard.tsx",
  ];
  for (const file of shared) assert.ok(existsSync(path.join(root, file)), `${file} must exist`);

  // The feed's private media folder was folded into the shared feature.
  assert.equal(existsSync(path.join(root, "features/feed/components/media")), false);

  assert.match(source("features/feed/components/PostCard.tsx"), /<MediaGallery/);
  assert.match(source("features/chat/components/MessageBubble.tsx"), /<MediaGallery/);
  assert.match(source("features/chat/components/ChatUserInfo.tsx"), /<MediaLightbox/);
  assert.match(source("features/content/components/ContentDetailView.tsx"), /<VideoPlayer/);
  assert.match(source("features/content/components/ContentDetailView.tsx"), /<MediaLightbox/);
  // The audio catalogue plays through the shared bottom player.
  assert.match(source("features/podcasts/components/PodcastsView.tsx"), /useAudio/);
  assert.match(source("features/podcasts/components/PodcastsView.tsx"), /playTrack/);
  // Composer attachments preview in the same viewer.
  assert.match(source("features/compose/components/ComposeMediaGrid.tsx"), /<MediaLightbox/);
});

test("no chrome renders a native-controls player any more", () => {
  // Chat used to open images in a new tab and use native <video controls>/<audio controls>.
  const bubble = source("features/chat/components/MessageBubble.tsx");
  assert.doesNotMatch(bubble, /<audio/);
  assert.doesNotMatch(bubble, /<video/);
  assert.doesNotMatch(bubble, /<img/);
  assert.doesNotMatch(bubble, /<a href=\{source\}/);
  assert.match(bubble, /mediaItemFromNamedAttachment/);

  const gallery = source("features/media/components/MediaGallery.tsx");
  assert.doesNotMatch(gallery, /<audio/);
  assert.match(gallery, /<VideoPlayer/);
  assert.match(gallery, /<MediaAudioCard/);
  assert.match(gallery, /<MediaLightbox/);
});

test("the lightbox keeps the X-style viewing controls", () => {
  const lightbox = source("features/media/components/MediaLightbox.tsx");
  for (const capability of [
    /addEventListener\("wheel"/,
    /onPointerDown/,
    /setPointerCapture/,
    /MIN_ZOOM/,
    /MAX_ZOOM/,
    /DOUBLE_TAP_ZOOM/,
    /SWIPE_THRESHOLD/,
    /ArrowLeft/,
    /ArrowRight/,
    /role="dialog"/,
    /aria-modal="true"/,
    /document\.body\.style\.overflow = "hidden"/,
    /onIndexChange/,
    /onBackdropClick/,
    /event\.key === "0"/,
    /event\.key === "Tab"/,
    /DISMISS_THRESHOLD/,
    /imageState === "error"/,
    /setImageState\("loading"\)/,
    /role="group"/,
  ]) {
    assert.match(lightbox, capability, `lightbox must implement ${capability}`);
  }
});

test("view counts use the same chart icon across feed and content", () => {
  const feedActions = source("features/feed/components/PostActions.tsx");
  const contentDetail = source("features/content/components/ContentDetailView.tsx");
  const immersive = source("features/media/components/ImmersivePostSlide.tsx");

  for (const surface of [feedActions, contentDetail, immersive]) {
    assert.match(surface, /ChartNoAxesColumn/);
  }
  assert.doesNotMatch(feedActions, /\bEye\b/);
  assert.doesNotMatch(contentDetail, /\bEye\b/);
});

test("immersive images always keep the landscape chrome while swiping mixed aspect ratios", () => {
  const slide = source("features/media/components/ImmersivePostSlide.tsx");
  const css = source("app/globals.css");

  assert.match(slide, /const portrait = item\.kind === "video" && ratio < 1;/);
  assert.match(slide, /const imageViewer = item\.kind === "image";/);
  assert.match(slide, /is-image-viewer/);
  assert.doesNotMatch(slide, /const portrait = ratio < 1;/);
  assert.match(
    css,
    /\.is-image-viewer \.viewer-bottom\s*\{[\s\S]*?bottom:\s*0;[\s\S]*?justify-content:\s*flex-end;/,
  );
});

test("immersive viewer author identity links to the public profile in both layouts", () => {
  const slide = source("features/media/components/ImmersivePostSlide.tsx");

  assert.match(slide, /const authorIdentity = \(/);
  assert.match(slide, /publicProfileHref\(\s*entry\.post\.author\.type,\s*entry\.post\.author\.id/);
  assert.match(slide, /className="viewer-author-link flex min-w-0 flex-1 items-center gap-3 rounded-lg"/);
  assert.match(slide, /\{authorIdentity\}/);
  assert.match(slide, /\{portrait && \([\s\S]*?\{author\}/);
  assert.match(slide, /\{!portrait && author\}/);
});

test("immersive viewer actions stay balanced and comments open the post detail", () => {
  const slide = source("features/media/components/ImmersivePostSlide.tsx");
  const css = source("app/globals.css");

  assert.match(slide, /href=\{\(`\/posts\/\$\{entry\.post\.id\}#comment-composer`\) as Route\}/);
  assert.match(slide, /aria-label="مشاهده نظرها"/);
  assert.match(slide, /onClick=\{onClose\}/);
  assert.doesNotMatch(slide, /setReplying/);
  assert.match(css, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(
    css,
    /\.is-landscape \.viewer-actions > button, \.is-landscape \.viewer-actions > a, \.is-landscape \.viewer-views\s*\{\s*background:\s*#202d35;/,
  );
});

test("mobile inline video play opens the immersive viewer and viewer omits repost", () => {
  const gallery = source("features/media/components/MediaGallery.tsx");
  const player = source("features/media/components/VideoPlayer.tsx");
  const slide = source("features/media/components/ImmersivePostSlide.tsx");

  assert.match(player, /onRequestPlay\?: \(video: HTMLVideoElement\) => boolean/);
  assert.match(player, /if \(onRequestPlay\?\.\(video\)\) return;/);
  assert.match(gallery, /onRequestPlay=\{canOpenFeed/);
  assert.match(gallery, /matchMedia\("\(max-width: 767px\)"\)\.matches/);
  assert.match(gallery, /openFeed\(single, video\)/);
  assert.doesNotMatch(slide, /aria-label="بازنشر"/);
  assert.doesNotMatch(slide, /<Repeat2/);
});

test("the video player keeps the shared playback controls", () => {
  const player = source("features/media/components/VideoPlayer.tsx");
  for (const capability of [
    /SKIP_SECONDS/,
    /RATES/,
    /requestPictureInPicture/,
    /requestFullscreen/,
    /resolveBufferedEnd/,
    /role="slider"/,
    /aria-valuenow/,
    /"ArrowLeft"/,
    /"ArrowRight"/,
    /tabIndex=\{0\}/,
    /ratio <= 0\.34/,
    /ratio >= 0\.66/,
  ]) {
    assert.match(player, capability, `player must implement ${capability}`);
  }
});

test("timeline video cards fetch nothing until the reader presses play", () => {
  const gallery = source("features/media/components/MediaGallery.tsx");
  // Comments may talk about a video element; only real JSX must not mount one.
  const galleryCode = gallery.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  // Uploads are not web-optimized, so even a metadata preload costs extra
  // range requests per card; a timeline must stay silent until play.
  assert.match(gallery, /<VideoPlayer\s+item=\{single\}[\s\S]*?variant="inline"[\s\S]*?preload="none"/);
  assert.doesNotMatch(galleryCode, /<video[\s>]/, "gallery tiles must not mount a video element");

  const player = source("features/media/components/VideoPlayer.tsx");
  assert.match(player, /preload\?: "none" \| "metadata" \| "auto"/);
  assert.match(player, /preload=\{preload\}/);
});

test("content video flows through the media proxy", () => {
  const service = source("features/content/services/content.service.ts");
  assert.match(service, /contentVideo\(item\.id, item\.primary_attachment_id, item\.attachments\)/);
  assert.match(service, /videoSrc/);

  const route = source("app/api/content/[contentId]/media/[attachmentId]/route.ts");
  assert.match(route, /item\.type === "video"/);
  assert.match(route, /copyMediaResponseHeaders/);
});
