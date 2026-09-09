import { cookies } from "next/headers";
import { meydanApi } from "@/lib/meydan-api";

export class MeydanServerAuthError extends Error {
  constructor() {
    super("unauthenticated");
    this.name = "MeydanServerAuthError";
  }
}

export async function meydanAuthenticatedApi<T>(path: string, init?: RequestInit): Promise<T> {
  const token = (await cookies()).get("meydan_access")?.value;
  if (!token) throw new MeydanServerAuthError();

  return meydanApi<T>(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
}
