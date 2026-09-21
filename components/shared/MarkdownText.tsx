"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

// IRANSans intentionally has no color-emoji glyphs. Turn the Iran flag into a
// local SVG before Markdown is parsed so posts never fall back to the letters
// "IR" on platforms without a flag emoji font.
function withIranFlag(body: string): string {
  return body.replaceAll("🇮🇷", "![پرچم ایران](/images/iran-flag.svg)");
}

export function MarkdownText({ body, className = "" }: { body: string; className?: string }) {
  return (
    <div className={`markdown-content break-words ${className}`} dir="rtl">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          a: ({ ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
        }}
      >
        {withIranFlag(body)}
      </ReactMarkdown>
    </div>
  );
}
