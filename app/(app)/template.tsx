import type { ReactNode } from "react";

type AppTemplateProps = {
  children: ReactNode;
};

/**
 * Next.js templates remount for every route navigation while the shared app
 * layout stays mounted. This gives page content a consistent enter transition
 * without delaying links or interfering with feature-specific navigation.
 */
export default function AppTemplate({ children }: AppTemplateProps) {
  return <div className="route-transition-stage min-h-full flex-1">{children}</div>;
}
