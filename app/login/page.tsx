"use client";

import type { Route } from "next";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { meydanClientApi } from "@/lib/meydan-client-api";

type OtpRequest = { challenge_id: string; expires_in: number; resend_after: number };
type OtpVerify = {
  authenticated?: boolean;
  registration_required?: boolean;
  registration_token?: string;
  account?: { id: number; account_type: "user" | "square" };
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = useMemo(() => {
    const value = searchParams.get("next");
    return value?.startsWith("/") ? value : "/home";
  }, [searchParams]);
  const [phone, setPhone] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requestOtp = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await meydanClientApi<OtpRequest>("/auth/otp/request", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      setChallengeId(result.challenge_id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ارسال کد ورود ناموفق بود.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await meydanClientApi<OtpVerify>("/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ challenge_id: challengeId, code }),
      });
      if (result.authenticated) {
        router.replace(next as Route);
        router.refresh();
        return;
      }
      if (result.registration_required && result.registration_token) {
        sessionStorage.setItem("meydan_registration_token", result.registration_token);
        router.replace(`/register?next=${encodeURIComponent(next)}` as Route);
        return;
      }
      setError("پاسخ ورود معتبر نبود.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "بررسی کد ورود ناموفق بود.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh bg-background px-4 py-10 text-foreground">
      <section className="mx-auto w-full max-w-sm rounded-panel border border-border bg-card p-5 text-card-foreground shadow-dialog">
        <h1 className="text-xl font-black">ورود به میدان</h1>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">با شماره موبایل وارد حساب کاربری یا حساب پایگاه خود شوید.</p>

        {!challengeId ? (
          <form onSubmit={requestOtp} className="mt-6 space-y-4">
            <label className="block"><span className="mb-2 block text-xs font-bold">شماره موبایل</span><input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" placeholder="09xxxxxxxxx" className="min-h-12 w-full rounded-control border border-input-border bg-input px-3 text-sm text-foreground outline-none placeholder:text-placeholder focus:border-ring focus:ring-2 focus:ring-ring" /></label>
            <button disabled={loading || !phone.trim()} className="min-h-11 w-full rounded-control bg-brand px-4 text-sm font-black text-brand-foreground transition-colors hover:bg-brand-hover disabled:bg-disabled disabled:text-disabled-foreground">{loading ? "در حال ارسال…" : "دریافت کد ورود"}</button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="mt-6 space-y-4">
            <label className="block"><span className="mb-2 block text-xs font-bold">کد شش‌رقمی</span><input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="min-h-12 w-full rounded-control border border-input-border bg-input px-3 text-center text-lg tracking-[0.3em] text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring" /></label>
            <button disabled={loading || code.trim().length < 6} className="min-h-11 w-full rounded-control bg-brand px-4 text-sm font-black text-brand-foreground transition-colors hover:bg-brand-hover disabled:bg-disabled disabled:text-disabled-foreground">{loading ? "در حال بررسی…" : "ورود"}</button>
            <button type="button" onClick={() => { setChallengeId(""); setCode(""); setError(""); }} className="min-h-10 w-full rounded-control text-xs font-bold text-muted-foreground hover:bg-hover hover:text-foreground">تغییر شماره موبایل</button>
          </form>
        )}

        {error ? <p className="mt-4 rounded-control border border-danger-border bg-danger-muted px-3 py-2 text-xs text-danger">{error}</p> : null}
      </section>
    </main>
  );
}
