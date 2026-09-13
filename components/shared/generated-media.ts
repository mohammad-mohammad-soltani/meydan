export const generatedMedia = {
  contentHero: "/images/generated/content-hero.svg",
  avatarCoordinator: "/images/generated/avatar-coordinator.svg",
  avatarJournalist: "/images/generated/avatar-journalist.svg",
  avatarSpeaker: "/images/generated/avatar-speaker.svg"
} as const;

export function speakerAvatar(accent: "slate" | "blue" | "amber" | "emerald") {
  return accent === "amber" || accent === "slate" ? generatedMedia.avatarSpeaker : generatedMedia.avatarCoordinator;
}
