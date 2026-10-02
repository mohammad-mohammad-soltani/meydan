/**
 * Compose saves «تیتر» as the body's first line followed by a blank line
 * (`[title, text].join("\n\n")`). The reference design shows that line as a
 * bold heading, so cards split it back out: only a single first line of at
 * most 120 characters (the compose title limit) that has text after it.
 */
export function splitPostTitle(body: string): { title: string | null; rest: string } {
  const match = body.match(/^([^\n]{1,120})\n\s*\n([\s\S]*\S[\s\S]*)$/);
  if (!match) return { title: null, rest: body };
  return { title: match[1].trim(), rest: match[2].replace(/^\s+/, "") };
}
