"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { uploadNarrativeFile } from "@/lib/meydan-upload";

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
  mediaId?: number;
  error?: string;
};

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
    // React re-runs effects on mount in development (StrictMode), so this must
    // be reset here — otherwise the first cleanup would disable every upload
    // callback for the rest of the session.
    disposed.current = false;
    return () => {
      disposed.current = true;
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  const upload = useCallback(
    (id: string, file: File) => {
      void uploadNarrativeFile(file, "narrative", (fraction) => {
        if (disposed.current) return;
        update((current) => current.map((item) => (item.id === id ? { ...item, progress: fraction } : item)));
      })
        .then((mediaId) => {
          if (disposed.current) return;
          update((current) =>
            current.map((item) =>
              item.id === id ? { ...item, status: "ready", progress: 1, mediaId, error: undefined } : item,
            ),
          );
        })
        .catch((reason: unknown) => {
          if (disposed.current) return;
          const message = reason instanceof Error ? reason.message : "بارگذاری انجام نشد.";
          update((current) =>
            current.map((item) => (item.id === id ? { ...item, status: "error", error: message } : item)),
          );
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
        current.map((entry) => (entry.id === id ? { ...entry, status: "uploading", progress: 0, error: undefined } : entry)),
      );
      upload(id, item.file);
    },
    [update, upload],
  );

  const reset = useCallback(() => {
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
