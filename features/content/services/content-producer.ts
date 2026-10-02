import { isActorKind, publicProfileHref, type ActorKind } from "../../../lib/profile-route.ts";
export type ContentProducerSource = {
  id?: string | number;
  type?: string;
  handle?: string;
  display_name?: string;
  name?: string;
  avatar_url?: string;
  role?: string;
  bio?: string;
};

export type LegacyContentCreator = {
  name?: string;
  role?: string;
  bio?: string;
  avatar_url?: string;
};

export type DisplayContentProducer = {
  name: string;
  role: string;
  avatar?: string;
  profileHref?: string;
  bio: string;
  publishedCount: string;
};

const ROLE_BY_ACTOR_TYPE: Record<string, string> = {
  user: "تولیدکننده محتوا",
  square: "میدان",
  media: "رسانه",
  collective: "مجموعه",
  organization: "سازمان",
};

function producerProfileHref(producer?: ContentProducerSource | null): string | undefined {
  if (!isActorKind(producer?.type)) return undefined;

  const actorId = String(producer?.id ?? "").replace(/^[a-z]{2,3}_/, "");
  if (!/^[1-9]\d*$/.test(actorId)) return undefined;

  return publicProfileHref(producer!.type as ActorKind, actorId, producer?.handle);
}

/**
 * The API's singular producer is the author of a converted narrative. The
 * creators relation predates it, so it is only a fallback for older content.
 */
export function contentProducer(
  producer?: ContentProducerSource | null,
  creators: LegacyContentCreator[] = [],
): DisplayContentProducer {
  const producerName = producer?.display_name || producer?.name;
  if (producerName) {
    return {
      name: producerName,
      role: ROLE_BY_ACTOR_TYPE[producer?.type || ""] || producer?.role || "تولیدکننده محتوا",
      avatar: producer?.avatar_url,
      profileHref: producerProfileHref(producer),
      bio: producer?.bio || "",
      publishedCount: "",
    };
  }

  const creator = creators[0];
  if (creator?.name) {
    return {
      name: creator.name,
      role: creator.role || "تولیدکننده محتوا",
      avatar: creator.avatar_url,
      profileHref: undefined,
      bio: creator.bio || "",
      publishedCount: "",
    };
  }

  return {
    name: "میدان خیابان",
    role: "تولیدکننده محتوا",
    avatar: undefined,
    profileHref: undefined,
    bio: "",
    publishedCount: "",
  };
}
