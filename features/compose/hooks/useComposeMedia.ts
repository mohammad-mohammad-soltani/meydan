"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MeydanApiError } from "@/lib/meydan-api";
import { isUploadAbort, uploadFile, type UploadStats } from "@/lib/meydan-upload";

/** Up to five attachments; images, video and audio can be mixed freely. */
export const MAX_COMPOSE_MEDIA = 5;

export type ComposeMediaKind = "image" | "video" | "audio";
export type ComposeMediaStatus = "uploading" | "ready" | "error";

export type ComposeMedia = {
  id: string;
  file: File;
  /** Local `blob:` URL for the preview; revoked on remove/reset/unmount. */
  previewUrl: string;
  kind: ComposeMediaKind;
  status: ComposeMediaStatus;
  /** Upload fraction, 0‥1. */
  progress: number;
  /** After the last byte the server still finishes the file (video remux, storage copy). */
  processing?: boolean;
  live: UploadLive;
  mediaId?: number;
  error?: string;
};

/**
 * Live transfer numbers, written on every progress event and read by the ring's
 * animation loop. They live outside React state so a fast upload never causes
 * a render per event.
 */
export type UploadLive = UploadStats & { at: number };

export type ComposeAttachment = { media_id: number; label: string; order: number };

function kindOf(file: File): ComposeMediaKind | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return null;
}

/**
 * Owns the composer's media list: selection rules, eager uploads with progress,
 * removal and retry. Uploads start as soon as a file is picked (like X), so
 * publishing only has to wait for the ids to arrive.
 */
export function useComposeMedia() {
  const [media, setMedia] = useState<ComposeMedia[]>([]);
  const [notice, setNotice] = useState("");
  const mediaRef = useRef<ComposeMedia[]>([]);
  const previewUrls = useRef<Set<string>>(new Set());
  const noticeTimer = useRef<number | null>(null);
  const disposed = useRef(false);
  const controllers = useRef<Map<string, AbortController>>(new Map());

  // Single writer so the ref and the state can never drift apart.
  const update = useCallback((updater: (current: ComposeMedia[]) => ComposeMedia[]) => {
    mediaRef.current = updater(mediaRef.current);
    setMedia(mediaRef.current);
  }, []);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 4000);
  }, []);

  useEffect(() => {
    // `previewUrls` is created once and only ever mutated, so capturing it here
    // (instead of reading `.current` in the cleanup) keeps the lint rule happy.
    const urls = previewUrls.current;
    const running = controllers.current;
    // React re-runs effects on mount in development (StrictMode), so this must
    // be reset here — otherwise the first cleanup would disable every upload
    // callback for the rest of the session.
    disposed.current = false;
    return () => {
      disposed.current = true;
      for (const controller of running.values()) controller.abort();
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  const upload = useCallback(
    (id: string, file: File) => {
      const controller = new AbortController();
      controllers.current.set(id, controller);
      const live = () => mediaRef.current.find((item) => item.id === id)?.live;
      void uploadFile(file, {
        purpose: "narrative",
        signal: controller.signal,
        onStats: (stats) => {
          const target = live();
          if (target) Object.assign(target, stats, { at: performance.now() });
          if (disposed.current) return;
          if (stats.phase === "processing") {
            update((current) => current.map((item) => (item.id === id && !item.processing ? { ...item, processing: true } : item)));
          }
        },
      })
        .then(({ media_id: mediaId }) => {
          if (disposed.current) return;
          update((current) =>
            current.map((item) =>
              item.id === id ? { ...item, status: "ready", progress: 1, processing: false, mediaId, error: undefined } : item,
            ),
          );
        })
        .catch((reason: unknown) => {
          // Removing a tile cancels its upload on purpose; that is not an error.
          if (disposed.current || isUploadAbort(reason)) return;
          // Gateway errors and dropped connections carry developer text; show something a person can act on.
          const message =
            reason instanceof MeydanApiError && reason.status > 0 && reason.status < 500 && reason.code
              ? reason.message
              : "بارگذاری کامل نشد؛ اتصال را بررسی کنید و «تلاش دوباره» را بزنید.";
          update((current) =>
            current.map((item) => (item.id === id ? { ...item, status: "error", processing: false, error: message } : item)),
          );
        })
        .finally(() => {
          if (controllers.current.get(id) === controller) controllers.current.delete(id);
        });
    },
    [update],
  );

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const list = Array.from(incoming).filter((file) => file.size > 0);
      if (!list.length) return;

      const current = mediaRef.current;
      let total = current.length;
      let skipped = 0;
      let unsupported = 0;
      const added: ComposeMedia[] = [];

      for (const file of list) {
        const kind = kindOf(file);
        if (!kind) {
          unsupported += 1;
          continue;
        }

        // Images, video and audio may be mixed freely; only the total is capped.
        if (total >= MAX_COMPOSE_MEDIA) {
          skipped += 1;
          continue;
        }

        total += 1;
        const previewUrl = URL.createObjectURL(file);
        previewUrls.current.add(previewUrl);
        added.push({
          id: crypto.randomUUID(),
          file,
          previewUrl,
          kind,
          status: "uploading",
          progress: 0,
          live: { phase: "uploading", loaded: 0, total: file.size, speed: 0, at: performance.now() },
        });
      }

      if (added.length) {
        update((current) => [...current, ...added]);
        for (const item of added) upload(item.id, item.file);
      }

      if (unsupported) {
        showNotice("فقط عکس، ویدیو یا فایل صوتی قابل پیوست است.");
      } else if (skipped) {
        showNotice(`حداکثر ${MAX_COMPOSE_MEDIA} فایل می‌توانی پیوست کنی.`);
      }
    },
    [showNotice, update, upload],
  );

  const remove = useCallback(
    (id: string) => {
      controllers.current.get(id)?.abort();
      const item = mediaRef.current.find((entry) => entry.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
        previewUrls.current.delete(item.previewUrl);
      }
      update((current) => current.filter((entry) => entry.id !== id));
    },
    [update],
  );

  const retry = useCallback(
    (id: string) => {
      const item = mediaRef.current.find((entry) => entry.id === id);
      if (!item) return;
      update((current) =>
        current.map((entry) => (entry.id === id ? { ...entry, status: "uploading", progress: 0, processing: false, error: undefined, live: { phase: "uploading", loaded: 0, total: entry.file.size, speed: 0, at: performance.now() } } : entry)),
      );
      upload(id, item.file);
    },
    [update, upload],
  );

  const reset = useCallback(() => {
    for (const controller of controllers.current.values()) controller.abort();
    for (const url of previewUrls.current) URL.revokeObjectURL(url);
    previewUrls.current.clear();
    update(() => []);
    setNotice("");
  }, [update]);

  const isUploading = media.some((item) => item.status === "uploading");
  const hasUploadError = media.some((item) => item.status === "error");
  const readyAttachments: ComposeAttachment[] = media
    .map((item, index) => ({ media_id: item.mediaId ?? 0, label: item.file.name, order: index + 1 }))
    .filter((item) => item.media_id > 0);

  return {
    media,
    notice,
    addFiles,
    remove,
    retry,
    reset,
    isUploading,
    hasUploadError,
    readyAttachments,
    /** True when everything is uploaded and publishing can include every file. */
    isReady: media.every((item) => item.status === "ready"),
  };
}
