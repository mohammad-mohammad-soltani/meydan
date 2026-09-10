"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, ChevronLeft, LoaderCircle, MapPin, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { meydanApi } from "@/lib/meydan-api";
import { getCityMap } from "@/features/map/services/map.service";
import { uploadNarrativeFile } from "@/lib/meydan-upload";
import { ImageCropDialog } from "./ImageCropDialog";
import { LocationPickerMap, type SelectedLocation } from "./LocationPickerMap";
import { PersianDatePicker } from "./PersianDatePicker";
import { ScheduleEditor } from "./ScheduleEditor";
import type { ProfileDetails } from "../types";

export function ProfileEditView({ profile }: { profile: ProfileDetails }) {
  const router = useRouter();
  const isSquare = profile.accountType === "square";

  const [name, setName] = useState(profile.identity.name);
  const [bio, setBio] = useState(profile.about);
  const [headline, setHeadline] = useState(profile.identity.subtitle);
  const [skills, setSkills] = useState(profile.skills.join("، "));
  const [startDate, setStartDate] = useState(profile.startDate ?? "");
  const initialLocation = useMemo<SelectedLocation | null>(() => {
    if (
      !isSquare ||
      !Number.isFinite(profile.latitude) ||
      !Number.isFinite(profile.longitude)
    ) {
      return null;
    }
    return {
      latitude: profile.latitude as number,
      longitude: profile.longitude as number,
      address: profile.identity.location,
      provinceId: profile.provinceId ?? null,
      cityId: profile.cityId ?? null,
      provinceName: null,
      cityName: null,
    };
  }, [
    isSquare,
    profile.latitude,
    profile.longitude,
    profile.identity.location,
    profile.provinceId,
    profile.cityId,
  ]);
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocation | null>(initialLocation);
  const [fallbackCenter, setFallbackCenter] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    if (initialLocation || !isSquare || !profile.cityId) return;
    let cancelled = false;
    void getCityMap(profile.cityId)
      .then(({ squares: items }) => {
        const first = items[0];
        if (!cancelled && first) {
          setFallbackCenter({ latitude: first.latitude, longitude: first.longitude });
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [initialLocation, isSquare, profile.cityId]);
  const [avatar, setAvatar] = useState(profile.identity.avatar);
  const [cover, setCover] = useState(profile.identity.cover);
  const [avatarId, setAvatarId] = useState<number>();
  const [coverId, setCoverId] = useState<number>();
  const [crop, setCrop] = useState<{
    file: File;
    purpose: "avatar" | "cover";
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  const select = (file: File | undefined, purpose: "avatar" | "cover") => {
    if (!file?.type.startsWith("image/")) {
      setError("برای آواتار و کاور فقط تصویر انتخاب کنید.");
      return;
    }
    setCrop({ file, purpose });
  };

  const applyCrop = async (file: File) => {
    if (!crop) return;
    try {
      const id = await uploadNarrativeFile(file, crop.purpose);
      const preview = URL.createObjectURL(file);
      if (crop.purpose === "avatar") {
        setAvatar(preview);
        setAvatarId(id);
      } else {
        setCover(preview);
        setCoverId(id);
      }
      setCrop(null);
    } catch {
      setError("آپلود تصویر ناموفق بود.");
    }
  };

  const save = async () => {
    setSaving(true);
    setError("");
    const skillList = skills
      .split(/[،,]/)
      .map((x) => x.trim())
      .filter(Boolean);
    try {
      if (isSquare) {
        if (selectedLocation && (!selectedLocation.provinceId || !selectedLocation.cityId)) {
          throw new Error("unresolved_location");
        }

        await meydanApi("/me/square", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name,
            subtitle: headline,
            profile_about: bio,
            profile_skills: skillList,
            start_date: startDate,
            ...(avatarId !== undefined ? { avatar_media_id: avatarId } : {}),
            ...(coverId !== undefined ? { cover_media_id: coverId } : {}),
          }),
        });

        if (selectedLocation) {
          await meydanApi("/me/square/location", {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              province_id: selectedLocation.provinceId,
              city_id: selectedLocation.cityId,
              address: selectedLocation.address,
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
            }),
          });
        }
      } else {
        await meydanApi("/me/profile", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            full_name: name,
            headline,
            about: bio,
            skills: skillList,
            ...(avatarId !== undefined ? { avatar_media_id: avatarId } : {}),
            ...(coverId !== undefined ? { cover_media_id: coverId } : {}),
          }),
        });
      }
      router.push("/profile");
      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error && reason.message === "unresolved_location"
          ? "برای این نقطه شهر یا استان معتبر پیدا نشد؛ نقطه‌ی دیگری را انتخاب کنید."
          : "ذخیره‌سازی انجام نشد.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {crop ? (
        <ImageCropDialog
          file={crop.file}
          purpose={crop.purpose}
          onCancel={() => setCrop(null)}
          onApply={applyCrop}
        />
      ) : null}
      <section className="mx-auto min-h-dvh w-full max-w-2xl bg-surface text-foreground">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-divider bg-surface/95 px-3 backdrop-blur">
          <Link
            href="/profile"
            aria-label="بازگشت"
            className="grid h-11 w-11 place-items-center rounded-full hover:bg-hover rotate-[180deg]"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-sm font-black">ویرایش پروفایل</h1>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="min-h-9 rounded-pill bg-foreground px-4 text-xs font-black text-background"
          >
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "ذخیره"}
          </button>
        </header>
        <div className="relative h-40 bg-gradient-to-l from-brand via-brand-hover to-solid-dark">
          {cover ? <Image src={cover} alt="" fill unoptimized className="object-cover" /> : null}
          <button
            type="button"
            onClick={() => coverInput.current?.click()}
            className="absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-scrim/70 text-on-solid"
          >
            <Camera className="h-5 w-5" />
          </button>
          {cover ? (
            <button
              type="button"
              onClick={() => {
                setCover(undefined);
                setCoverId(0);
              }}
              className="absolute left-16 top-4 grid h-11 w-11 place-items-center rounded-full bg-scrim/70 text-on-solid"
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
          <input
            ref={coverInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => select(e.target.files?.[0], "cover")}
          />
        </div>
        <div className="relative px-4">
          <div className="-mt-12 relative grid h-24 w-24 overflow-hidden rounded-full border-4 border-surface bg-surface-muted">
            {avatar ? (
              <Image src={avatar} alt="" fill unoptimized className="object-cover" />
            ) : (
              name.slice(0, 1)
            )}
            <button
              type="button"
              onClick={() => avatarInput.current?.click()}
              className="absolute inset-0 grid place-items-center bg-scrim/45 text-on-solid"
            >
              <Camera className="h-5 w-5" />
            </button>
          </div>
          <input
            ref={avatarInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => select(e.target.files?.[0], "avatar")}
          />
        </div>
        <main className="space-y-4 px-4 pb-24 pt-6">
          <Field label="نام">
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="معرفی کوتاه">
            <input value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </Field>
          <Field label="بیو">
            <textarea rows={5} value={bio} onChange={(e) => setBio(e.target.value)} />
          </Field>
          {isSquare ? (
            <Field label="تاریخ شروع فعالیت میدان">
              <PersianDatePicker value={startDate} onChange={setStartDate} />
            </Field>
          ) : null}
          {isSquare ? (
            <div>
              <span className="mb-1.5 block px-1 text-xs text-foreground-subtle">
                موقعیت میدان
              </span>
              {profile.identity.location ? (
                <p className="mb-2 flex items-center gap-1.5 px-1 text-xs text-foreground-secondary">
                  <MapPin className="h-4 w-4 text-brand" />
                  موقعیت فعلی: {profile.identity.location}
                </p>
              ) : null}
              <LocationPickerMap
                initialLocation={initialLocation}
                fallbackCenter={fallbackCenter}
                onSelect={setSelectedLocation}
              />
              {selectedLocation ? (
                <p className="mt-2 flex items-center gap-1.5 px-1 text-xs text-foreground-secondary">
                  <MapPin className="h-4 w-4 text-brand" />
                  {selectedLocation.address ||
                    [selectedLocation.cityName, selectedLocation.provinceName]
                      .filter(Boolean)
                      .join("، ")}
                </p>
              ) : null}
            </div>
          ) : null}
          {isSquare ? <ScheduleEditor initialItems={profile.schedule} /> : null}
          <Field label="مهارت‌ها">
            <input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="با ، جدا کنید"
            />
          </Field>
          {error ? <p className="text-xs text-danger">{error}</p> : null}
        </main>
      </section>
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs text-foreground-subtle">
      <span className="mb-1.5 block px-1">{label}</span>
      <span className="block [&_input]:min-h-12 [&_input]:w-full [&_input]:rounded-control [&_input]:border [&_input]:border-input-border [&_input]:bg-input [&_input]:px-3 [&_select]:min-h-12 [&_select]:w-full [&_select]:rounded-control [&_select]:border [&_select]:border-input-border [&_select]:bg-input [&_select]:px-3 [&_textarea]:w-full [&_textarea]:resize-none [&_textarea]:rounded-control [&_textarea]:border [&_textarea]:border-input-border [&_textarea]:bg-input [&_textarea]:p-3">
        {children}
      </span>
    </label>
  );
}
