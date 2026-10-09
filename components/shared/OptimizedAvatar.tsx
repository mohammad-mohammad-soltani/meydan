import Image, { type ImageProps } from "next/image";
import { MEDIA_THUMB_QUALITY } from "@/features/media/media-utils";
import { isMemorialKind } from "@/lib/profile-route";

type OptimizedAvatarProps = Omit<
  ImageProps,
  "src" | "alt" | "width" | "height" | "quality" | "unoptimized"
> & {
  src: string;
  alt?: string;
  width: number;
  height?: number;
  /** Actor kind. A `memorial` is drawn as a rounded square carrying the infinity mark, wherever it appears. */
  kind?: string | null;
};

/** Classes that decide where the avatar sits and how big it is; they move to the memorial frame. */
const FRAME_CLASS = /^(?:(?:[\w-]+:)*)(?:h|w|size|min-h|min-w|max-h|max-w|shrink|shrink-0|grow|flex-none|absolute|relative|inset|top|bottom|left|right|z|m[trblxy]?|-m[trblxy]?|ms|me)(?:-|$)/;
/** Classes that shape the picture; the memorial frame owns the shape. */
const SHAPE_CLASS = /^(?:[\w-]+:)*rounded(?:-|$)/;

function splitClasses(className = "") {
  const frame: string[] = [];
  const picture: string[] = [];
  for (const token of className.split(/\s+/).filter(Boolean)) {
    if (SHAPE_CLASS.test(token)) continue;
    if (FRAME_CLASS.test(token)) frame.push(token);
    else picture.push(token);
  }
  return { frame: frame.join(" "), picture: picture.join(" ") };
}

/** Persisted account imagery, sized by Next instead of sending the source upload. */
export function OptimizedAvatar({
  src,
  alt = "",
  width,
  height = width,
  kind,
  className,
  ...props
}: OptimizedAvatarProps) {
  if (isMemorialKind(kind)) {
    const { frame, picture } = splitClasses(className);
    return (
      <span className={`memorial-avatar ${frame}`} style={{ width: /(?:^|\s)(?:h|w|size)-/.test(frame) ? undefined : width, height: /(?:^|\s)(?:h|w|size)-/.test(frame) ? undefined : height }}>
        <Image {...props} src={src} alt={alt} width={width} height={height} quality={MEDIA_THUMB_QUALITY} className={`h-full w-full object-cover ${picture}`} />
        <i aria-hidden="true" className="memorial-avatar-mark" />
      </span>
    );
  }
  return (
    <Image
      {...props}
      className={className}
      src={src}
      alt={alt}
      width={width}
      height={height}
      quality={MEDIA_THUMB_QUALITY}
    />
  );
}
