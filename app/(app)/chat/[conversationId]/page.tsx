import type { Metadata } from "next";
import { LegacyRouteApp } from "@/components/prototype/LegacyRouteApp";

export const metadata: Metadata = { title: "گفتگو | میدانِ خیابان" };

export default function ConversationPage() { return <LegacyRouteApp initialView="view-direct-chat" />; }
