import { Camera, Mic, Newspaper, Video } from "lucide-react";
import { PostAuthorInfo } from "./PostHeader";
import type { PostDetail, PostMediaKind } from "../types";

type PostContentProps = { post: PostDetail };

const mediaIcons: Record<PostMediaKind, typeof Camera> = { image: Camera, video: Video, microphone: Mic, article: Newspaper };

export function PostContent({ post }: PostContentProps) {
  return (
    <section className="space-y-4">
      <PostAuthorInfo author={post.author} badge={post.badge} />
      <p className="text-sm leading-8 text-foreground-secondary">{post.body}</p>
      <div className="grid grid-cols-3 gap-2">
        {post.media.map((media) => {
          const Icon = mediaIcons[media.kind];
          const tone = media.kind === "video" ? "text-brand" : media.kind === "article" ? "text-info" : "text-icon-muted";
          return <div key={media.id} className="flex h-24 flex-col items-center justify-center rounded-card border border-border bg-surface-muted text-xs text-muted-foreground"><Icon className={`mb-1 h-5 w-5 ${tone}`} /><span>{media.label}</span></div>;
        })}
      </div>
    </section>
  );
}
