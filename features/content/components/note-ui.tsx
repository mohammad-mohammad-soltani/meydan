import type { CSSProperties } from "react";
import { Clock } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { AccountBadges } from "@/components/shared/AccountBadges";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";

const faNumber = new Intl.NumberFormat("fa-IR");

/** «۱۴ مهر» — the reference's short date. Falls back to the text as given when it is not a date. */
export function shortJalali(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric", month: "long" }).format(date);
}

/** Two initials joined by a half-space, as the reference's `ini()`. */
export function initials(name?: string): string {
  const words = (name ?? "").split(/\s+/).filter(Boolean);
  return (words[0]?.charAt(0) ?? "") + (words[1] ? "‌" + words[1].charAt(0) : "");
}

/** Cover as the reference paints it: the photo over a dark wash, or a pastel gradient when there is none. */
export function noteBackground(cover: string | undefined, index: number): CSSProperties {
  if (!cover) return { background: `linear-gradient(140deg,hsl(${index * 47 + 10} 65% 94%),hsl(${index * 47 + 60} 60% 90%))` };
  return { backgroundImage: `url(${JSON.stringify(cover).slice(1, -1)}),linear-gradient(140deg,hsl(${index * 47 + 10} 55% 36%),hsl(${index * 47 + 60} 50% 18%))` };
}

/** The quotation-mark glyph shown on covers that have no picture. */
export function NoteQuote() {
  return (
    <span className="nv-q" aria-hidden="true">
      <svg viewBox="0 0 48 36" fill="currentColor">
        <circle cx="13" cy="11" r="8.5" />
        <path d="M4.6 12.5C4.2 22 8.0 28 14.5 31.5L16.0 28.2C11.8 25.8 10.0 22 10.2 17.5z" />
        <circle cx="38" cy="11" r="8.5" />
        <path d="M29.6 12.5C29.2 22 33.0 28 39.5 31.5L41.0 28.2C36.8 25.8 35.0 22 35.2 17.5z" />
      </svg>
    </span>
  );
}

export function ReadingTime({ minutes }: { minutes?: number }) {
  if (!minutes) return null;
  return (
    <>
      <span className="d">·</span>
      <span className="mn">
        <Clock aria-hidden="true" width={12} height={12} strokeWidth={2} />
        {faNumber.format(minutes)} دقیقه
      </span>
    </>
  );
}

/** Byline: initials disc, author, date, reading time. */
export type NoteAuthor = { name?: string; avatar?: string; href?: string; verified?: boolean; speaker?: boolean; official?: boolean; kind?: string };

export function NoteMeta({ author, date, minutes, children }: { author: NoteAuthor; date?: string; minutes?: number; children?: React.ReactNode }) {
  const name = (
    <>
      <span>{author.name}</span>
      <AccountBadges verified={author.verified} speaker={author.speaker} official={author.official} kind={author.kind} size="sm" />
    </>
  );
  return (
    <div className="nv-meta">
      <i className="nv-av">{author.avatar ? <OptimizedAvatar src={author.avatar} kind={author.kind} alt="" width={44} height={44} /> : initials(author.name)}</i>
      {author.href ? (
        <Link href={author.href as Route} className="nv-au">
          {name}
        </Link>
      ) : (
        <span className="nv-au">{name}</span>
      )}
      {date ? (
        <>
          <span className="d">·</span>
          <span>{date}</span>
        </>
      ) : null}
      <ReadingTime minutes={minutes} />
      {children}
    </div>
  );
}
