import { getProfileNarrativePage } from "@/features/profile/services/profile.service";
import type { ProfileDetails } from "@/features/profile/types";

export async function POST(request: Request) {
  let input: {
    type?: "user" | "square";
    id?: number;
    identity?: ProfileDetails["identity"];
    cursor?: string;
    own?: boolean;
  };
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if ((input.type !== "user" && input.type !== "square") || !Number.isSafeInteger(input.id) || !input.id || input.id < 1 || !input.identity || typeof input.identity.name !== "string" || (input.cursor !== undefined && typeof input.cursor !== "string")) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    return Response.json(await getProfileNarrativePage(input.type, input.id, input.identity, input.cursor, input.own === true));
  } catch {
    return Response.json({ error: "Could not load narratives" }, { status: 502 });
  }
}
