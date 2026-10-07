"use client";

import { Children, isValidElement, type AnchorHTMLAttributes, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { ArrowUpRight, Link2 } from "lucide-react";

// IRANSans intentionally has no color-emoji glyphs. Turn the Iran flag into a
// local SVG before Markdown is parsed so posts never fall back to the letters
// "IR" on platforms without a flag emoji font.
function withIranFlag(body: string): string {
  return body.replaceAll("🇮🇷", "![پرچم ایران](/images/iran-flag.svg)");
}

/** Characters of host + path an inline link keeps before it is cut with an ellipsis. */
const INLINE_LIMIT = 32;

type LinkParts = { host: string; path: string };

/** `https://www.site.ir/%D9%86…?a=1` → host `site.ir`, readable path `/ن…?a=1`. Null when it is not a web URL. */
function linkParts(href: string): LinkParts | null {
  try {
    const url = new URL(href);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    let path = `${url.pathname === "/" ? "" : url.pathname}${url.search}`;
    try {
      path = decodeURIComponent(path);
    } catch {
      // Malformed escapes stay as they were typed.
    }
    return { host: url.hostname.replace(/^www\./, ""), path: path.replace(/\/$/, "") };
  } catch {
    return null;
  }
}

function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => (typeof child === "string" || typeof child === "number" ? String(child) : ""))
    .join("");
}

/** A bare URL (GFM autolink) shows its own address as text; `[label](url)` links do not. */
function isBareLink(href: string | undefined, label: string): boolean {
  if (!href) return false;
  const strip = (value: string) => value.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  return strip(label) === strip(href);
}

function truncate(value: string, limit: number): string {
  const chars = Array.from(value);
  return chars.length > limit ? `${chars.slice(0, limit).join("")}…` : value;
}

type AnchorProps = Pick<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "title" | "children">;

function MarkdownLink({ href, title, children }: AnchorProps) {
  const label = textOf(children);
  const parts = href && isBareLink(href, label) ? linkParts(href) : null;
  // The timeline card is itself a link; a tap on an inner link must not also open the post.
  const stop = (event: { stopPropagation: () => void }) => event.stopPropagation();

  if (!parts) {
    return (
      <a href={href} title={title} onClick={stop} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  const short = truncate(`${parts.host}${parts.path}`, INLINE_LIMIT);
  return (
    <a href={href} title={href} onClick={stop} target="_blank" rel="noopener noreferrer" dir="ltr" className="latin-digits inline-block max-w-full truncate align-bottom">
      {short}
    </a>
  );
}

/** A paragraph that is nothing but one bare URL becomes a compact link card, like an unfurled link on a timeline. */
function MarkdownParagraph({ children }: { children?: ReactNode }) {
  const items = Children.toArray(children).filter((child) => !(typeof child === "string" && child.trim() === ""));
  const only = items.length === 1 ? items[0] : null;
  if (isValidElement<AnchorProps>(only) && only.type === MarkdownLink) {
    const { href, children: label } = only.props;
    const parts = href && isBareLink(href, textOf(label)) ? linkParts(href) : null;
    if (href && parts) {
      const path = truncate(parts.path.replace(/^\//, ""), 56);
      return (
        <div className="my-2">
          <a
            href={href}
            title={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface-muted px-3 py-2.5 no-underline transition-colors hover:bg-hover"
          >
            <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-background text-icon-muted">
              <Link2 className="h-[18px] w-[18px]" />
            </span>
            <span className="latin-digits block min-w-0 flex-1 text-right leading-snug" dir="ltr">
              <span className="block truncate text-[13px] font-bold text-foreground">{parts.host}</span>
              {path ? <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">{path}</span> : null}
            </span>
            <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-icon-muted" />
          </a>
        </div>
      );
    }
  }
  return <p>{children}</p>;
}

export function MarkdownText({ body, className = "" }: { body: string; className?: string }) {
  return (
    <div className={`markdown-content break-words ${className}`} dir="rtl">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{ a: MarkdownLink, p: MarkdownParagraph }}
      >
        {withIranFlag(body)}
      </ReactMarkdown>
    </div>
  );
}
