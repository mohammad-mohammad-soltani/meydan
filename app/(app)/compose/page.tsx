import { redirect } from "next/navigation";
import { ComposeView } from "@/features/compose/components/ComposeView";
import { loginHref } from "@/lib/auth-navigation";
import { isAuthenticated } from "@/lib/meydan-session";

export default async function ComposePage() {
  if (!(await isAuthenticated())) redirect(loginHref("/compose"));
  return <ComposeView />;
}
