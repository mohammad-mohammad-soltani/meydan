import Image from "next/image";

type AppLogoProps = {
  /** Size and corner radius of the brand tile, e.g. `h-10 w-10 rounded-2xl`. */
  className?: string;
  appearance?: "brand" | "orbital" | "ring";
  /** Size of the emblem inside the tile, relative to the tile. */
  markClassName?: string;
  /** Set on the first logo of a page so the mark is not lazy-loaded. */
  priority?: boolean;
};

/**
 * The app logo: the white "نقش من" emblem on a brand tile.
 *
 * The mark is a monochrome white SVG, so it must always sit on a colored
 * surface — on the page background it would disappear in the light theme.
 * `alt` stays empty on purpose: the name is always rendered next to it.
 */
export function AppLogo({
  className = "h-10 w-10 rounded-2xl",
  markClassName = "h-[74%] w-[74%]",
  priority = false,
  appearance = "brand",
}: AppLogoProps) {
  if (appearance === "ring" || appearance === "orbital") {
    // The brand mark itself, white on the brand-red tile.
    return (
      <span aria-hidden="true" className={`grid shrink-0 place-items-center bg-brand ${className}`}>
        <span
          className="block h-[64%] w-[64%] bg-white"
          style={{ maskImage: "url(/images/logo/meydan-mark.svg)", WebkitMaskImage: "url(/images/logo/meydan-mark.svg)", maskSize: "contain", WebkitMaskSize: "contain", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat", maskPosition: "center", WebkitMaskPosition: "center" }}
        />
      </span>
    );
  }
  return (
    <span className={`grid shrink-0 place-items-center bg-brand ${className}`}>
      <Image
        src="/images/logo/meydan-mark.svg"
        alt=""
        width={531}
        height={536}
        priority={priority}
        className={`object-contain ${markClassName}`}
      />
    </span>
  );
}
