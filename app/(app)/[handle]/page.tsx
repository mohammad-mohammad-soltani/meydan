import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicProfileRoute } from "@/features/profile/public-profile-route";
import { getPublicProfileDetails } from "@/features/profile/services/profile.service";
import { meydanApi, MeydanApiError } from "@/lib/meydan-api";
import { redirectToProfileById } from "@/lib/profile-redirect";
import { actorKindOf, cleanHandle, isPublicProfilePath } from "@/lib/profile-route";
import { absoluteUrl, jsonLdScript, toDescription } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ handle: string }>;
};

type ResolvedProfile = { actor_type: string; kind: string; id: number; handle: string };

/** Cached per request: `generateMetadata` and the page both resolve the same handle. */
const resolveProfile = cache(async function resolveProfile(clean: string): Promise<ResolvedProfile | null> {
  try {
    return await meydanApi<ResolvedProfile>(`/profiles/${clean}`);
  } catch (reason) {
    if (reason instanceof MeydanApiError && reason.status === 404) return null;
    throw reason;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const clean = cleanHandle(handle);
  if (!clean || /^\d+$/.test(handle) || !isPublicProfilePath(`/${clean}`)) return {};

  const resolved = await resolveProfile(clean);
  if (!resolved) return {};

  const profile = await getPublicProfileDetails(actorKindOf(resolved.actor_type), resolved.id);
  if (!profile) return {};

  const { name, subtitle, avatar, location } = profile.identity;
  const title = `${name} (@${clean})`;
  const description = toDescription(profile.about || subtitle || location || undefined);
  const url = absoluteUrl(`/${clean}`);
  const image = avatar ? [{ url: avatar, alt: name }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
      url,
      title,
      description,
      images: image,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: image?.map((item) => item.url),
    },
  };
}

/**
 * Every public profile (user, speaker, official, square, media, collective,
 * organization) lives at `/{handle}`. The backend says which kind it is.
 */
export default async function ProfileByHandlePage({ params }: Props) {
  const { handle } = await params;

  // `/{number}` was the old user profile address.
  if (/^\d+$/.test(handle)) return redirectToProfileById("user", handle);

  const clean = cleanHandle(handle);
  if (!clean || !isPublicProfilePath(`/${clean}`)) notFound();

  const resolved = await resolveProfile(clean);
  if (!resolved) notFound();

  const profile = await getPublicProfileDetails(actorKindOf(resolved.actor_type), resolved.id);

  return (
    <>
      {profile ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript({
            "@context": "https://schema.org",
            "@type": resolved.actor_type === "user" ? "Person" : "Organization",
            name: profile.identity.name,
            url: absoluteUrl(`/${clean}`),
            image: profile.identity.avatar,
            description: profile.about || profile.identity.subtitle || undefined,
          })}
        />
      ) : null}
      <PublicProfileRoute type={actorKindOf(resolved.actor_type)} id={String(resolved.id)} />
    </>
  );
}
