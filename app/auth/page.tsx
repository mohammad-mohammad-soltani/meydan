"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type AuthStep = "phone" | "code" | "register";

async function api<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`/api/auth/${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json() as { data?: T; error?: { message?: string } };
  if (!response.ok || !payload.data) throw new Error(payload.error?.message || "انجام درخواست ممکن نشد.");
  return payload.data;
}

export default function AuthPage() {
  const router = useRouter();
  const [step, setStep] = useState<AuthStep>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [registrationToken, setRegistrationToken] = useState("");
  const [accountType, setAccountType] = useState<"user" | "square">("user");
  const [name, setName] = useState("");
  const [provinceId, setProvinceId] = useState("");
  const [cityId, setCityId] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const submitPhone = async (event: FormEvent) => {
    event.preventDefault(); setPending(true); setError("");
    try { const result = await api<{ challenge_id: string }>("otp-request", { phone }); setChallengeId(result.challenge_id); setStep("code"); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "خطا در ورود"); }
    finally { setPending(false); }
  };
  const submitCode = async (event: FormEvent) => {
    event.preventDefault(); setPending(true); setError("");
    try {
      const result = await api<{ authenticated?: boolean; registration_required?: boolean; registration_token?: string }>("otp-verify", { challenge_id: challengeId, code });
      if (result.authenticated) router.replace("/profile");
      else if (result.registration_required && result.registration_token) { setRegistrationToken(result.registration_token); setStep("register"); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "کد معتبر نیست."); }
    finally { setPending(false); }
  };
  const submitRegistration = async (event: FormEvent) => {
    event.preventDefault(); setPending(true); setError("");
    try {
      const base = { registration_token: registrationToken, province_id: Number(provinceId), city_id: Number(cityId) };
      if (accountType === "user") await api("register-user", { ...base, full_name: name });
      else await api("register-square", { ...base, square_name: name, address, latitude: Number(latitude), longitude: Number(longitude) });
      router.replace("/profile");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "ثبت‌نام انجام نشد."); }
    finally { setPending(false); }
  };
  const inputClass = "mt-1 min-h-11 w-full rounded-control border border-input-border bg-input px-3 text-sm text-foreground outline-none focus:border-ring focus-visible:ring-2 focus-visible:ring-ring";
  return <main className="min-h-dvh bg-background p-4 text-foreground"><section className="mx-auto mt-10 w-full max-w-sm rounded-panel border border-border bg-card p-5 text-card-foreground shadow-dialog"><h1 className="text-lg font-black">ورود به میدان</h1><p className="mt-2 text-xs leading-6 text-muted-foreground">با شماره همراه خود وارد شوید.</p>{error ? <p role="alert" className="mt-3 text-xs text-danger">{error}</p> : null}
    {step === "phone" ? <form onSubmit={submitPhone} className="mt-5 space-y-3"><label className="block text-xs font-bold">شماره همراه<input className={inputClass} value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" required /></label><button disabled={pending} className="min-h-11 w-full rounded-control bg-brand px-4 text-xs font-black text-brand-foreground disabled:bg-disabled">{pending ? "در حال ارسال…" : "دریافت کد"}</button></form> : null}
    {step === "code" ? <form onSubmit={submitCode} className="mt-5 space-y-3"><label className="block text-xs font-bold">کد تأیید<input className={inputClass} value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" required /></label><button disabled={pending} className="min-h-11 w-full rounded-control bg-brand px-4 text-xs font-black text-brand-foreground disabled:bg-disabled">{pending ? "در حال بررسی…" : "ورود"}</button></form> : null}
    {step === "register" ? <form onSubmit={submitRegistration} className="mt-5 space-y-3"><label className="block text-xs font-bold">نوع حساب<select className={inputClass} value={accountType} onChange={(event) => setAccountType(event.target.value as "user" | "square")}><option value="user">کاربر</option><option value="square">میدان</option></select></label><label className="block text-xs font-bold">{accountType === "user" ? "نام و نام خانوادگی" : "نام میدان"}<input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} required /></label><label className="block text-xs font-bold">شناسه استان<input className={inputClass} value={provinceId} onChange={(event) => setProvinceId(event.target.value)} inputMode="numeric" required /></label><label className="block text-xs font-bold">شناسه شهر<input className={inputClass} value={cityId} onChange={(event) => setCityId(event.target.value)} inputMode="numeric" required /></label>{accountType === "square" ? <><label className="block text-xs font-bold">نشانی<input className={inputClass} value={address} onChange={(event) => setAddress(event.target.value)} required /></label><label className="block text-xs font-bold">عرض جغرافیایی<input className={inputClass} value={latitude} onChange={(event) => setLatitude(event.target.value)} inputMode="decimal" required /></label><label className="block text-xs font-bold">طول جغرافیایی<input className={inputClass} value={longitude} onChange={(event) => setLongitude(event.target.value)} inputMode="decimal" required /></label></> : null}<button disabled={pending} className="min-h-11 w-full rounded-control bg-brand px-4 text-xs font-black text-brand-foreground disabled:bg-disabled">{pending ? "در حال ثبت…" : "تکمیل ثبت‌نام"}</button></form> : null}
  </section></main>;
}
