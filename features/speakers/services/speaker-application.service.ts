import { meydanApi } from "@/lib/meydan-api";

export type SpeakerApplicationStatus = "pending" | "approved" | "rejected";

export type SpeakerApplication = {
  id: number;
  status: SpeakerApplicationStatus;
  adminNote: string | null;
};

export type SpeakerApplicationInput = {
  fullName: string;
  city: string;
  category: string;
  topics: string;
  phone: string;
  link: string;
  about: string;
};

type ApiApplication = { id: number; status?: string | null; admin_note?: string | null };

function map(row: ApiApplication): SpeakerApplication {
  const status = row.status === "approved" || row.status === "rejected" ? row.status : "pending";
  return { id: row.id, status, adminNote: row.admin_note ?? null };
}

/** The viewer's latest application, or null when they never applied. */
export async function getMySpeakerApplication(): Promise<SpeakerApplication | null> {
  const row = await meydanApi<ApiApplication | null>("/speaker-applications/me");
  return row ? map(row) : null;
}

export async function submitSpeakerApplication(input: SpeakerApplicationInput): Promise<SpeakerApplication> {
  const row = await meydanApi<ApiApplication>("/speaker-applications", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      full_name: input.fullName,
      city: input.city,
      category: input.category,
      topics: input.topics,
      phone: input.phone,
      link: input.link,
      about: input.about,
    }),
  });
  return map(row);
}
