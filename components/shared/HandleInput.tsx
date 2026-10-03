"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CircleAlert, LoaderCircle, Wand2 } from "lucide-react";
import { meydanApi } from "@/lib/meydan-api";

type HandleCheck = {
  available: boolean;
  handle?: string;
  reason?: string;
  message?: string;
  suggestion?: string | null;
};

export const HANDLE_PATTERN = /^[a-z0-9_]{3,30}$/;

/** Lower-cases, drops a leading @ and anything a handle cannot contain. */
export function sanitizeHandle(value: string): string {
  return value
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 30);
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** Display name the Finglish suggestion is derived from. */
  nameHint?: string;
  /** Fills the field with the suggestion once, while it is still empty. */
  autoSuggest?: boolean;
  /** Reports whether the current value is acceptable to submit. */
  onValidityChange?: (valid: boolean) => void;
  id?: string;
  inputClassName: string;
  required?: boolean;
  /** A server-side rejection to show when the local check passes. */
  serverError?: string | null;
  /** Admin forms: the account being edited, so its own handle counts as free. */
  exceptUserId?: number | null;
  /** The handle cannot be changed right now (the 30-day lock). */
  disabled?: boolean;
};

/**
 * «شناسه کاربری» input: LTR, `@`-prefixed, validated live against
 * `/handles/check` (which also knows the account's own current handle when the
 * viewer is signed in) with a one-tap Finglish suggestion from the name.
 */
export function HandleInput({
  value,
  onChange,
  nameHint = "",
  autoSuggest = false,
  onValidityChange,
  id = "handle",
  inputClassName,
  required = true,
  serverError,
  exceptUserId,
  disabled = false,
}: Props) {
  const [remote, setRemote] = useState<{ value: string; available: boolean | null; message: string } | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const touched = useRef(value !== "");
  const lastName = useRef("");

  // Suggest from the name until the person starts typing their own.
  useEffect(() => {
    const name = nameHint.trim();
    if (!name || name === lastName.current) return;
    const timer = window.setTimeout(() => {
      lastName.current = name;
      meydanApi<HandleCheck>(`/handles/check?name=${encodeURIComponent(name)}`)
        .then((result) => {
          setSuggestion(result.suggestion ?? null);
          if (autoSuggest && !touched.current && result.suggestion) onChange(result.suggestion);
        })
        .catch(() => undefined);
    }, 450);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameHint, autoSuggest]);

  const localError = !value
    ? null
    : !HANDLE_PATTERN.test(value)
      ? "شناسه کاربری باید حداقل ۳ نویسه باشد."
      : !/[a-z]/.test(value)
        ? "شناسه کاربری باید حداقل یک حرف انگلیسی داشته باشد."
        : null;
  const needsRemote = value !== "" && localError === null;
  const answer = remote && remote.value === value ? remote : null;
  const state: "idle" | "checking" | "ok" | "bad" = !value
    ? "idle"
    : localError
      ? "bad"
      : answer
        ? answer.available === null
          ? "idle"
          : answer.available
            ? "ok"
            : "bad"
        : "checking";
  const message = localError ?? answer?.message ?? "";

  useEffect(() => {
    onValidityChange?.(!value ? !required : state === "ok" || (state === "idle" && needsRemote));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, state, required]);

  useEffect(() => {
    if (!needsRemote) return;
    let active = true;
    const timer = window.setTimeout(() => {
      meydanApi<HandleCheck>(`/handles/check?handle=${encodeURIComponent(value)}${exceptUserId ? `&except_user=${exceptUserId}` : ""}`)
        .then((result) => {
          if (active) setRemote({ value, available: result.available, message: result.available ? "این شناسه آزاد است." : (result.message ?? "این شناسه قابل استفاده نیست.") });
        })
        .catch(() => {
          // The server re-validates on submit; do not block on a failed probe.
          if (active) setRemote({ value, available: null, message: "" });
        });
    }, 350);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [value, needsRemote, exceptUserId]);

  const shownError = state === "bad" ? message : serverError || "";
  const describedBy = `${id}-status`;

  return (
    <div>
      <div className="relative">
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm font-black text-muted-foreground" dir="ltr">
          @
        </span>
        <input
          id={id}
          dir="ltr"
          inputMode="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={30}
          required={required}
          disabled={disabled}
          placeholder="reza_salehi"
          value={value}
          aria-invalid={shownError ? true : undefined}
          aria-describedby={describedBy}
          onChange={(event) => {
            touched.current = true;
            onChange(sanitizeHandle(event.target.value));
          }}
          className={`${inputClassName} pl-8 text-left`}
        />
      </div>
      <div id={describedBy} className="mt-1.5 flex min-h-5 flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold leading-5">
        {state === "checking" ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground"><LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />در حال بررسی…</span>
        ) : shownError ? (
          <span role="alert" className="inline-flex items-center gap-1 text-danger"><CircleAlert aria-hidden="true" className="h-3.5 w-3.5" />{shownError}</span>
        ) : state === "ok" ? (
          <span className="inline-flex items-center gap-1 text-success-foreground"><Check aria-hidden="true" className="h-3.5 w-3.5" />{message}</span>
        ) : (
          <span className="text-muted-foreground">فقط حروف انگلیسی، عدد و _ (۳ تا ۳۰ نویسه)؛ بعداً هم قابل تغییر است.</span>
        )}
        {suggestion && suggestion !== value ? (
          <button
            type="button"
            onClick={() => { touched.current = true; onChange(suggestion); }}
            className="inline-flex items-center gap-1 rounded-pill border border-brand-border bg-brand-muted px-2 py-0.5 text-[11px] font-black text-brand outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Wand2 aria-hidden="true" className="h-3 w-3" />
            <span dir="ltr">@{suggestion}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
