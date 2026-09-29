import type { SquareMarker } from "../services/map.service";
import { mediaThumbnailSrc } from "@/features/media/media-utils";

type DisplaySquare = SquareMarker & {
  displayProvinceName?: string | null;
  displayCityName?: string | null;
};

export function squareAvatar(square: SquareMarker): HTMLElement {
  const avatar = document.createElement("span");
  avatar.className = "map-square-avatar";
  const initial = document.createElement("span");
  initial.textContent = square.name.trim().slice(0, 1) || "م";
  avatar.append(initial);
  if (square.avatarUrl) {
    const image = document.createElement("img");
    image.alt = "";
    image.src = mediaThumbnailSrc(square.avatarUrl, 84) ?? square.avatarUrl;
    image.addEventListener("error", () => image.remove(), { once: true });
    avatar.append(image);
  }
  return avatar;
}

export function squarePopup(square: DisplaySquare): HTMLElement {
  const card = document.createElement("article");
  card.className = "map-square-card";
  card.dir = "rtl";
  const eyebrow = document.createElement("div");
  eyebrow.className = "map-square-card-eyebrow";
  eyebrow.textContent = "نقش من";
  const heading = document.createElement("div");
  heading.className = "map-square-card-heading";
  const text = document.createElement("div");
  const title = document.createElement("strong");
  title.className = "map-square-card-title";
  title.textContent = square.name;
  const location = document.createElement("span");
  location.className = "map-square-card-location";
  location.textContent =
    [
      ...new Set(
        [
          square.displayProvinceName ?? square.provinceName,
          square.displayCityName ?? square.cityName,
        ].filter(Boolean),
      ),
    ].join(" · ") || "موقعیت ثبت‌شده روی نقشه";
  text.append(title, location);
  heading.append(squareAvatar(square), text);
  const coordinates = document.createElement("div");
  coordinates.className = "map-square-card-coordinates";
  const label = document.createElement("span");
  label.textContent = "مختصات میدان";
  const value = document.createElement("span");
  value.dir = "ltr";
  value.textContent = `${square.latitude.toFixed(4)}, ${square.longitude.toFixed(4)}`;
  coordinates.append(label, value);
  const link = document.createElement("a");
  link.href = `/square/${encodeURIComponent(square.id)}`;
  link.className = "map-square-card-link";
  const linkLabel = document.createElement("span");
  linkLabel.textContent = "مشاهده میدان";
  const arrow = document.createElement("span");
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "←";
  link.append(linkLabel, arrow);
  card.append(eyebrow, heading, coordinates, link);
  return card;
}
