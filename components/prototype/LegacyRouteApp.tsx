"use client";

import MeydanApp, { type MeydanView } from "./meydan-app";

type LegacyRouteAppProps = {
  initialView: MeydanView;
};

/**
 * Temporary compatibility boundary used while feature routes migrate away from
 * the legacy single-app controller. It will be removed after feature migration.
 */
export function LegacyRouteApp({ initialView }: LegacyRouteAppProps) {
  return <MeydanApp initialView={initialView} />;
}
