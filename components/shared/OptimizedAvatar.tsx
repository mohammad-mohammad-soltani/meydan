import Image, { type ImageProps } from "next/image";
import { MEDIA_THUMB_QUALITY } from "@/features/media/media-utils";

type OptimizedAvatarProps = Omit<
  ImageProps,
  "src" | "alt" | "width" | "height" | "quality" | "unoptimized"
> & {
  src: string;
  alt?: string;
  width: number;
  height?: number;
};

/** Persisted account imagery, sized by Next instead of sending the source upload. */
export function OptimizedAvatar({
  src,
  alt = "",
  width,
  height = width,
  ...props
}: OptimizedAvatarProps) {
  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      width={width}
      height={height}
      quality={MEDIA_THUMB_QUALITY}
    />
  );
}
