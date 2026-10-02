"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Camera, Trash2 } from "lucide-react";
import { uploadChatAttachment } from "@/features/chat/services/chat.service";
import { ImageCropDialog } from "@/features/profile/components/ImageCropDialog";
import { workAction } from "../services/works.service";
import type { WorkGroup } from "../types";
import { fa } from "../utils";
import { Icon } from "./Icon";
import { WorkIcon } from "./WorkIcon";

/** About / edit sheet: name, description and avatar are editable by the work's owner and site admins only. */
export function WorkInfo({ work, close, refresh, onLeft }: { work: WorkGroup; close: () => void; refresh: () => Promise<unknown>; onLeft: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState(work.title);
  const [description, setDescription] = useState(work.description);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [crop, setCrop] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<"leave" | "delete" | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const picker = useRef<HTMLInputElement>(null);

  const preview = useMemo(() => (avatar ? URL.createObjectURL(avatar) : null), [avatar]);
  useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview]);

  useEffect(() => {
    if (crop) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [close, crop]);

  const canEdit = !!work.viewer.can_edit_info;
  const shown = preview ?? (removeAvatar ? null : work.avatar_url);
  const dirty = title.trim() !== work.title || description !== work.description || !!avatar || removeAvatar;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const update: Record<string, unknown> = { title, description };
      if (avatar) {
        const file = await uploadChatAttachment(avatar);
        const id = String(file.id).replace(/\D/g, "");
        if (!id) throw new Error("شناسه تصویر معتبر نیست");
        update.avatar_media_id = Number(id);
      } else if (removeAvatar) {
        update.avatar_media_id = 0;
      }
      await workAction(work.id, "PATCH", update);
      await refresh();
      window.dispatchEvent(new Event("works:changed"));
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ذخیره انجام نشد");
    } finally {
      setBusy(false);
    }
  }

  async function run(job: () => Promise<void>, fallback: string) {
    setBusy(true);
    setError("");
    try {
      await job();
    } catch (err) {
      setError(err instanceof Error ? err.message : fallback);
      setBusy(false);
    }
  }

  const leave = () =>
    run(async () => {
      await workAction(`${work.id}/join`, "DELETE");
      await refresh();
      window.dispatchEvent(new Event("works:changed"));
      onLeft();
      close();
    }, "خروج انجام نشد");

  const destroy = () =>
    run(async () => {
      await workAction(work.id, "DELETE");
      window.dispatchEvent(new Event("works:changed"));
      router.replace("/works");
    }, "حذف انجام نشد");

  const canLeave = work.viewer.joined && work.viewer.role !== "owner";

  return (
    <>
      {crop
        ? createPortal(
            <ImageCropDialog
              file={crop}
              purpose="avatar"
              onCancel={() => setCrop(null)}
              onApply={async (file) => {
                setAvatar(file);
                setRemoveAvatar(false);
                setCrop(null);
              }}
            />,
            document.body,
          )
        : null}
      <div className="wk-modal-bg" onMouseDown={(e) => e.target === e.currentTarget && close()}>
        <div className="wk-modal" role="dialog" aria-modal="true" aria-labelledby="work-info-title" ref={ref}>
          <div className="sheet-h">
            <b id="work-info-title">اطلاعات کار</b>
            <button type="button" className="icon-btn" onClick={close} aria-label="بستن">
              <Icon name="close" size={18} />
            </button>
          </div>
          <div className="sheet-b">
            <div className="wk-hero">
              <div className="wk-hero-av">
                <WorkIcon work={{ ...work, avatar_url: shown }} size={96} />
                {canEdit ? (
                  <button type="button" className="wk-cam" onClick={() => picker.current?.click()} aria-label="تغییر تصویر کار">
                    <Camera size={16} aria-hidden="true" />
                  </button>
                ) : null}
                <input
                  ref={picker}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) setCrop(file);
                  }}
                />
              </div>
              <b>{canEdit ? title || work.title : work.title}</b>
              <small>{fa(work.member_count)} عضو</small>
              {canEdit && shown ? (
                <button
                  type="button"
                  className="wk-link"
                  onClick={() => {
                    setAvatar(null);
                    setRemoveAvatar(true);
                  }}
                >
                  حذف تصویر
                </button>
              ) : null}
            </div>

            {canEdit ? (
              <form onSubmit={save} className="wk-form">
                <label className="field">
                  <span>نام کار</span>
                  <input required value={title} maxLength={190} onChange={(e) => setTitle(e.target.value)} />
                </label>
                <label className="field">
                  <span>
                    توضیحات <em>{fa(description.length)} / {fa(2000)}</em>
                  </span>
                  <textarea value={description} maxLength={2000} placeholder="این کار درباره چیست؟" onChange={(e) => setDescription(e.target.value)} />
                </label>
                <button className="btn primary" disabled={busy || !dirty || !title.trim()}>
                  {busy ? "در حال ذخیره…" : "ذخیره تغییرات"}
                </button>
              </form>
            ) : (
              <p className="wk-desc">{work.description || "توضیحی برای این کار ثبت نشده است."}</p>
            )}

            {error ? (
              <p className="hint err" role="alert">
                {error}
              </p>
            ) : null}

            {canLeave || canEdit ? (
              <div className="wk-danger">
                {canLeave ? (
                  confirm === "leave" ? (
                    <div className="more-confirm">
                      <b>از این کار خارج شوید؟</b>
                      <div className="edit-acts">
                        <button type="button" className="qa go" disabled={busy} onClick={() => void leave()}>
                          بله، خارج می‌شوم
                        </button>
                        <button type="button" className="qa" onClick={() => setConfirm(null)}>
                          انصراف
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" className="btn danger-btn" onClick={() => setConfirm("leave")}>
                      خروج از کار
                    </button>
                  )
                ) : null}
                {canEdit ? (
                  confirm === "delete" ? (
                    <div className="more-confirm">
                      <b>این کار برای همیشه حذف شود؟</b>
                      <small>همهٔ پیام‌ها، وظیفه‌ها و نظرسنجی‌های گروه پاک می‌شود و دکمهٔ «پیوستن» روی پست هم غیرفعال می‌شود. این کار قابل بازگشت نیست.</small>
                      <div className="edit-acts">
                        <button type="button" className="qa go danger" disabled={busy} onClick={() => void destroy()}>
                          {busy ? "در حال حذف…" : "بله، حذف شود"}
                        </button>
                        <button type="button" className="qa" disabled={busy} onClick={() => setConfirm(null)}>
                          انصراف
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" className="btn danger-btn" onClick={() => setConfirm("delete")}>
                      <Trash2 size={15} aria-hidden="true" /> حذف کار
                    </button>
                  )
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
