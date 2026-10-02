"use client";

import { Check, LoaderCircle, Newspaper, X } from "lucide-react";
import { useEffect, useState } from "react";

import { meydanApi, plainText } from "@/lib/meydan-api";

type OwnPost = { id: number; body?: string | null };

/**
 * Lets an approved media account file a reflection (بازتاب رسانه‌ای) for a post,
 * either with a link or by publishing one of its own existing posts as the
 * reflection. Reposts and quotes by the same account are filed automatically.
 */
export function AddReflectionButton({
  postId,
  squareId,
  onAdded,
}: {
  postId: string;
  squareId: number | null;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [useOwnPost, setUseOwnPost] = useState(false);
  const [url, setUrl] = useState("");
  const [ownPosts, setOwnPosts] = useState<OwnPost[] | null>(null);
  const [ownPostId, setOwnPostId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open || !useOwnPost || ownPosts !== null || !squareId) return;
    let active = true;
    void meydanApi<OwnPost[]>(`/squares/${squareId}/narratives?per_page=20`)
      .then((items) => active && setOwnPosts(Array.isArray(items) ? items : []))
      .catch(() => active && setOwnPosts([]));
    return () => {
      active = false;
    };
  }, [open, useOwnPost, ownPosts, squareId]);

  const canSubmit = useOwnPost ? ownPostId !== null : /^https?:\/\//i.test(url.trim());

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError("");
    try {
      await meydanApi(`/narratives/${postId}/media-reflections`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(useOwnPost ? { own_narrative_id: ownPostId } : { url: url.trim() }),
      });
      setDone(true);
      onAdded();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ثبت بازتاب انجام نشد.");
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setOpen(false);
    setDone(false);
    setError("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] border border-border bg-surface text-sm font-black text-foreground transition-colors hover:bg-hover"
      >
        <Newspaper aria-hidden="true" className="h-4.5 w-4.5" />
        ثبت بازتاب رسانه‌ای
      </button>

      {open ? (
        <div role="dialog" aria-modal="true" aria-label="ثبت بازتاب رسانه‌ای" className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center">
          <div className="w-full max-w-md space-y-4 rounded-card border border-border bg-background p-5">
            <div className="flex items-center justify-between">
              <strong className="text-sm font-black text-foreground">ثبت بازتاب رسانه‌ای</strong>
              <button type="button" aria-label="بستن" onClick={close} className="grid h-8 w-8 place-items-center rounded-full hover:bg-hover">
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>

            {done ? (
              <p className="flex items-center gap-2 text-sm font-black text-success">
                <Check aria-hidden="true" className="h-4 w-4" />
                بازتاب شما برای این پست ثبت شد.
              </p>
            ) : (
              <>
                <p className="text-xs leading-6 text-muted-foreground">
                  اعلام کنید رسانه‌ی شما برای این پست بازتاب داشته است.
                </p>

                <label className="flex cursor-pointer items-center gap-3 rounded-card border border-border bg-surface p-3 text-xs font-black text-foreground">
                  <input type="checkbox" checked={useOwnPost} onChange={(event) => setUseOwnPost(event.target.checked)} />
                  یکی از پست‌های اکانت خودم را به‌عنوان بازتاب منتشر می‌کنم
                </label>

                {useOwnPost ? (
                  <div className="max-h-56 space-y-2 overflow-y-auto" role="radiogroup" aria-label="پست‌های اکانت شما">
                    {ownPosts === null ? (
                      <LoaderCircle aria-hidden="true" className="mx-auto h-5 w-5 animate-spin" />
                    ) : ownPosts.length === 0 ? (
                      <p className="text-xs text-muted-foreground">هنوز پستی در اکانت شما نیست.</p>
                    ) : (
                      ownPosts.map((item) => (
                        <label key={item.id} className={`flex cursor-pointer items-start gap-2 rounded-card border p-3 text-xs ${ownPostId === item.id ? "border-brand bg-brand-muted" : "border-border bg-surface"}`}>
                          <input type="radio" name="own-post" checked={ownPostId === item.id} onChange={() => setOwnPostId(item.id)} />
                          <span className="line-clamp-2">{plainText(item.body ?? "").slice(0, 140) || `پست #${item.id}`}</span>
                        </label>
                      ))
                    )}
                  </div>
                ) : (
                  <input
                    dir="ltr"
                    inputMode="url"
                    placeholder="https://"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    aria-label="لینک بازتاب"
                    className="min-h-11 w-full rounded-control border border-input-border bg-input px-3 text-sm"
                  />
                )}

                {error ? <p role="alert" className="text-xs font-black text-danger-foreground">{error}</p> : null}

                <button
                  type="button"
                  disabled={!canSubmit || busy}
                  onClick={() => void submit()}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-control bg-brand text-sm font-black text-brand-foreground disabled:opacity-50"
                >
                  {busy ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
                  ثبت بازتاب
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
