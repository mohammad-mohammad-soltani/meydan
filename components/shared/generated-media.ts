export const generatedMedia = {
  contentHero: "/images/generated/content-hero.svg",
  avatarCoordinator: "/images/generated/avatar-coordinator.svg",
  avatarJournalist: "/images/generated/avatar-journalist.svg",
  avatarSpeaker: "/images/generated/avatar-speaker.svg"
} as const;

export function chatAvatar(tone: "red" | "amber" | "blue" | "emerald" | "violet" | "slate") {
  if (tone === "amber" || tone === "violet") return generatedMedia.avatarSpeaker;
  if (tone === "blue" || tone === "emerald" || tone === "slate") return generatedMedia.avatarCoordinator;
  return generatedMedia.avatarJournalist;
}

export function speakerAvatar(accent: "slate" | "blue" | "amber" | "emerald") {
  return accent === "amber" || accent === "slate" ? generatedMedia.avatarSpeaker : generatedMedia.avatarCoordinator;
}
