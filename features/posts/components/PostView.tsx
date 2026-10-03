"use client";

import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { ChevronLeft } from "lucide-react";

import { CommentsList } from "./CommentsList";
import { CommentInput } from "./CommentInput";
import { AddReflectionButton } from "./AddReflectionButton";
import { MediaReflections } from "./MediaReflections";
import { isEntityKind } from "@/lib/profile-route";
import { useMediaViewer } from "../hooks/useMediaViewer";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { PostAdminActions } from "./PostAdminActions";
import { PostHeader } from "./PostHeader";
import { DeletePostDialog } from "@/features/feed/components/DeletePostDialog";

import { PostCard } from "@/features/feed/components/PostCard";

import { usePost } from "../hooks/usePost";

import {
  isAuthApiError,
  meydanApi,
} from "@/lib/meydan-api";

import type { FeedPost } from "@/features/feed/types";
import type { PostDetail } from "../types";

const mediaDetails = {
  image: "گزارش تصویری",
  video: "ویدیو",
  microphone: "فایل صوتی",
  article: "سند و گزارش",
} as const;

const noop = () => undefined;

type InitiativeApi = {
  initiative?: {
    id?: number;
    cta_label?: string;
    viewer_state?: {
      joined?: boolean;
    };
  } | null;
};

type InitiativeState = {
  id: number;
  label: string;
  joined: boolean;
};

function redirectToLogin() {
  if (typeof window !== "undefined") {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- auth redirect must replace stale interaction state.
    window.location.assign("/auth");
  }
}

function toFeedPost(
  post: PostDetail,
  commentCount: number,
  initiative: InitiativeState | null,
): FeedPost {
  return {
    id: post.id,

    author: {
      id: post.author.id,
      type: post.author.type,
      avatarUrl:
        post.author.avatarUrl,
      verified:
        post.author.verified,
      verifiedSpeaker:
        post.author.verifiedSpeaker,
    },

    initiativeId:
      initiative?.id,

    viewerState: {
      liked: Boolean(
        post.viewerState?.liked,
      ),
      reposted: Boolean(
        post.viewerState?.reposted,
      ),
      joined: Boolean(
        initiative?.joined,
      ),
      canDelete: Boolean(post.viewerState?.canDelete),
    },

    kind: "media",

    squareName:
      post.author.name,

    handle:
      post.author.handle,

    timeAgo:
      post.timeAgo,

    city: "تهران",

    badge:
      post.badge,

    title:
      post.author.name,

    body:
      post.body,

    attachments: post.media.map(
      (media) => ({
        id: media.id,
        label: media.label,

        detail:
          media.detail ??
          mediaDetails[media.kind],

        icon: media.kind,

        previewSrc:
          media.previewSrc,

        audioSrc:
          media.audioSrc,

        previewAlt:
          media.previewAlt,

        width:
          media.width,

        height:
          media.height,
      }),
    ),

    stats: {
      likes: post.likes,
      reposts: post.reposts,
      quotes: post.quotes,
      comments: commentCount,
      views: post.views,
    },

    quote: post.quote,

    callToAction:
      initiative?.label,
  };
}

export function PostView({
  post,
}: {
  post: PostDetail;
}) {
  const state =
    usePost(post);
  const router = useRouter();
  const { isAuthenticated } = useAuthGate();
  const mediaViewer = useMediaViewer(isAuthenticated);
  const isOwnPost =
    isEntityKind(state.post.author.type) && Number(state.post.author.id) === mediaViewer.squareId;
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [
    initiative,
    setInitiative,
  ] =
    useState<InitiativeState | null>(
      null,
    );

  /*
   * PostDetail فعلی initiative را map نمی‌کند.
   * بنابراین در صفحه‌ی تکی یک بار اطلاعات
   * narrative را می‌خوانیم.
   */
  useEffect(() => {
    let active = true;

    void meydanApi<InitiativeApi>(
      `/narratives/${state.post.id}`,
    )
      .then((result) => {
        if (!active) return;

        const item =
          result.initiative;

        if (!item?.id) {
          setInitiative(null);
          return;
        }

        setInitiative({
          id: item.id,

          label:
            item.cta_label?.trim() ||
            "پیوستن",

          joined: Boolean(
            item.viewer_state?.joined,
          ),
        });
      })
      .catch(() => {
        // نبود initiative نباید صفحه را خراب کند.
      });

    return () => {
      active = false;
    };
  }, [state.post.id]);

  const handleJoinInitiative =
    async () => {
      const current =
        initiative;

      if (
        !current ||
        current.joined
      ) {
        return;
      }

      /*
       * optimistic UI
       */
      setInitiative({
        ...current,
        joined: true,
      });

      try {
        await meydanApi(
          `/initiatives/${current.id}/join`,
          {
            method: "PUT",
          },
        );
      } catch (reason) {
        /*
         * rollback
         */
        setInitiative(current);

        if (
          isAuthApiError(reason)
        ) {
          redirectToLogin();
        }
      }
    };

  const feedPost =
    toFeedPost(
      {
        ...state.post,

        likes:
          state.counts.likes,

        reposts:
          state.counts.reposts,

        quotes:
          state.counts.quotes,

        commentsCount:
          state.counts.comments,

        viewerState: {
          liked:
            state.liked,

          reposted:
            state.reposted,
          canDelete: Boolean(state.post.viewerState?.canDelete),
        },
      },

      state.counts.comments,

      initiative,
    );

  return (
    <section
      id="view-full-post"
      data-post-column
      className="
        ui-enter
        flex
        min-h-full
        shrink-0
        flex-col
        bg-background
        text-foreground
      "
    >
      <PostHeader
        timeAgo={
          state.post.timeAgo
        }
      />

      <main
        className="
          flex-1
        "
      >
        <PostAdminActions
          postId={state.post.id}
          editorial={Boolean(
            state.post.editorial,
          )}
          isContent={Boolean(
            state.post.isContent,
          )}
          contentId={
            state.post.contentId ?? null
          }
          media={state.post.media}
          body={state.post.body}
        />

        <PostCard
          variant="detail"
          post={feedPost}

          liked={
            state.liked
          }

          reposted={
            state.reposted
          }

          joined={
            Boolean(
              initiative?.joined,
            )
          }

          onLike={
            state.toggleLike
          }

          onRepost={
            state.toggleRepost
          }

          onShare={() =>
            void state.share()
          }

          onJoin={() =>
            void handleJoinInitiative()
          }

          onOpenMedia={
            noop
          }

          onDelete={() => {
            setDeleteError(null);
            setDeleteOpen(true);
          }}
        />

        <div
          className="
            mt-5
            space-y-5
            px-4
          "
        >
          <MediaReflections
            reflections={
              state.post.reflections
            }
          />

          {mediaViewer.outletId && !isOwnPost ? (
            <AddReflectionButton
              postId={state.post.id}
              squareId={mediaViewer.squareId}
              onAdded={() => router.refresh()}
            />
          ) : null}

          {state.counts.quotes > 0 ? (
            <Link
              href={`/posts/${state.post.id}/quotes` as Route}
              className="flex items-center justify-between gap-3 rounded-[14px] bg-surface  transition-colors hover:bg-hover"
            >
              <span className="text-sm text-foreground">
                <strong className="font-black">{state.counts.quotes.toLocaleString("fa-IR")}</strong>{" "}
                <span className="text-foreground-secondary">نقل‌قول</span>
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-link">
                مشاهده نقل‌قول‌ها
                <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              </span>
            </Link>
          ) : null}

          <CommentsList
            postId={state.post.id}
            comments={
              state.comments
            }
            total={
              state.counts
                .comments
            }
            composer={
              <CommentInput
                value={
                  state.commentDraft
                }

                onChange={
                  state.setCommentDraft
                }

                onSubmit={
                  state.submitComment
                }

                avatarLabel={
                  state.post.author
                    .initials
                }
              />
            }
          >
            {/* no children */}
          </CommentsList>

          {state.isLoading ? (
            <p
              className="
                text-xs
                text-muted-foreground
              "
            >
              در حال دریافت روایت…
            </p>
          ) : null}
        </div>
      </main>
      {deleteOpen ? (
        <DeletePostDialog
          busy={deleteBusy}
          error={deleteError}
          onCancel={() => { if (!deleteBusy) setDeleteOpen(false); }}
          onConfirm={() => {
            setDeleteBusy(true);
            setDeleteError(null);
            void state.deletePost()
              .then((deleted) => {
                if (deleted) router.replace("/home");
              })
              .catch(() => setDeleteError("حذف روایت انجام نشد. دوباره تلاش کنید."))
              .finally(() => setDeleteBusy(false));
          }}
        />
      ) : null}
    </section>
  );
}
