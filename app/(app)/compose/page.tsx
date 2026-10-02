import { redirect } from "next/navigation";
import { ComposeView } from "@/features/compose/components/ComposeView";
import { loginHref } from "@/lib/auth-navigation";
import { isAuthenticated } from "@/lib/meydan-session";

export default async function ComposePage({
  searchParams,
}: {
  searchParams: Promise<{ quote?: string | string[]; mode?: string }>;
}) {
  const query = await searchParams;
  const requested = query.quote;
  // Only a plain numeric narrative id is accepted; anything else opens a normal composer.
  const quoteId =
    typeof requested === "string" && /^\d{1,12}$/.test(requested)
      ? requested
      : undefined;

  if (!(await isAuthenticated()))
    redirect(
      quoteId ? loginHref(`/compose?quote=${quoteId}`) : loginHref("/compose"),
    );
  return (
    <ComposeView
      key={quoteId ?? "new"}
      quoteId={quoteId}
      workMode={query.mode === "work"}
    />
  );
}
