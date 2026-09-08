import type { Metadata } from "next";
import { LegacyRouteApp } from "@/components/prototype/LegacyRouteApp";

export const metadata: Metadata = { title: "روایت | میدانِ خیابان" };

export default function PostPage() { return <LegacyRouteApp initialView="view-full-post" />; }
