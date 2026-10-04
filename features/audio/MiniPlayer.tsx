"use client";

import Link from "next/link";
import type { Route } from "next";
import { ChevronUp, LoaderCircle, Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AudioProgressBar, formatAudioTime } from "./AudioProgressBar";
import { useAudio } from "./AudioProvider";
import { NowPlayingSheet } from "./NowPlayingSheet";
import styles from "./audio.module.css";

export function MiniPlayer() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const { currentTrack, currentTime, duration, isPlaying, isReady, error, hasNext, hasPrevious, toggle, next, previous, clear } = useAudio();
  if (!currentTrack) return null;
  if (currentTrack.sourceHref && pathname.startsWith("/content/") && pathname === currentTrack.sourceHref) return null;

  const title = <strong className={styles.title}>{currentTrack.title}</strong>;
  return (
    <section aria-label="پخش‌کننده صوت" className={styles.mini} dir="rtl">
      <div className={styles.track}>
        {currentTrack.sourceHref ? <Link href={currentTrack.sourceHref as Route}>{title}</Link> : title}
        <span className={styles.subtitle}>
          {currentTrack.artist ? <span className={styles.artist}>{currentTrack.artist}</span> : null}
          <span className={styles.time} dir="ltr">{formatAudioTime(currentTime)} / {duration > 0 ? formatAudioTime(duration) : "--:--"}</span>
        </span>
        <AudioProgressBar compact showTimes={false} className={styles.progress} />
        {error ? <p role="alert" className={styles.error}>{error}</p> : null}
      </div>
      <div className={styles.controls} dir="ltr">
        <button type="button" onClick={() => void previous()} disabled={!hasPrevious && currentTime < 1} aria-label="قطعه قبلی" className={`${styles.extra} ${styles.queueControl}`}><SkipBack aria-hidden="true" className="h-4 w-4 fill-current" /></button>
        <button type="button" onClick={() => void toggle()} aria-label={isPlaying ? "توقف پخش" : "ادامه پخش"} className={styles.play}>
          {isPlaying && !isReady ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : isPlaying ? <Pause aria-hidden="true" className="h-4 w-4 fill-current" /> : <Play aria-hidden="true" className="ml-0.5 h-4 w-4 fill-current" />}
        </button>
        <button type="button" onClick={() => void next()} disabled={!hasNext} aria-label="قطعه بعدی" className={`${styles.extra} ${styles.queueControl}`}><SkipForward aria-hidden="true" className="h-4 w-4 fill-current" /></button>
        <button type="button" onClick={() => setExpanded(true)} aria-label="باز کردن پخش‌کنندهٔ تمام‌صفحه" className={styles.extra}><ChevronUp aria-hidden="true" className="h-4 w-4" /></button>
        <button type="button" onClick={clear} aria-label="بستن پخش‌کننده" className={styles.close}><X aria-hidden="true" className="h-4 w-4" /></button>
      </div>
      {expanded ? <NowPlayingSheet onClose={() => setExpanded(false)} /> : null}
    </section>
  );
}
