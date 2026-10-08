import { redirect } from "next/navigation";
import { ComposeView } from "@/features/compose/components/ComposeView";
import { loginHref } from "@/lib/auth-navigation";
import { isAuthenticated } from "@/lib/meydan-session";

export default async function ComposePage({
  searchParams,
}: {
  searchParams: Promise<{ quote?: string | string[]; mode?: string; tag?: string | string[] }>;
}) {
  const query = await searchParams;
  const requested = query.quote;
  // Only a plain numeric narrative id is accepted; anything else opens a normal composer.
  const quoteId =
    typeof requested === "string" && /^\d{1,12}$/.test(requested)
      ? requested
      : undefined;

  // `/compose?tag=برچسب` opens the composer with «#برچسب» already typed.
  const requestedTag = typeof query.tag === "string" ? query.tag.replace(/^#/, "") : "";
  const tag = /^[\p{L}\p{N}_]{2,64}$/u.test(requestedTag) ? requestedTag : undefined;

  if (!(await isAuthenticated()))
    redirect(
      quoteId
        ? loginHref(`/compose?quote=${quoteId}`)
        : loginHref(tag ? `/compose?tag=${encodeURIComponent(tag)}` : "/compose"),
    );
  return (
    <ComposeView
      key={quoteId ?? `new:${tag ?? ""}`}
      quoteId={quoteId}
      initialTag={tag}
      workMode={query.mode === "work"}
    />
  );
}
