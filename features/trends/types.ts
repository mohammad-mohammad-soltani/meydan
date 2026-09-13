/** One row of the desktop "hot trends" widget. */
export type HotTrend = {
  id: string;
  /** 1-based position, rendered as a Persian numeral in the context line. */
  rank: number;
  /** Muted lead line, e.g. "موضوع روز" or a square name. */
  context: string;
  /** Bold line: the hashtag, headline or narrative excerpt. */
  title: string;
  /** Muted trailing line, e.g. "۱۲۸ هزار روایت". */
  metric: string;
  /** In-app destination; `next` typed routes require an app path. */
  href: string;
};
