"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import type { ClipboardEvent, FormEvent, KeyboardEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  MessageCircleMore,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import { ProvinceCitySelect } from "@/features/auth/components/ProvinceCitySelect";
import { SquareLocationField } from "@/features/auth/components/SquareLocationField";
import { useLocationSelection } from "@/features/auth/hooks/useLocationSelection";
import { useProvinceCity } from "@/features/auth/hooks/useProvinceCity";
import { AppLogo } from "@/components/shared/AppLogo";

type AuthStep = "phone" | "code" | "register";
type AccountType = "user" | "square";

type FieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
};

async function api<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`/api/auth/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as {
    data?: T;
    error?: { message?: string };
  };
  if (!response.ok || !payload.data) {
    throw new Error(payload.error?.message || "انجام درخواست ممکن نشد.");
  }
  return payload.data;
}

function toLatinDigits(value: string): string {
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  return value
    .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)));
}

function normalizePhone(value: string): string {
  const latin = toLatinDigits(value);
  const startsWithPlus = latin.trim().startsWith("+");
  const digits = latin.replace(/\D/g, "").slice(0, 13);
  return startsWithPlus ? `+${digits}` : digits;
}

function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="block">
      <span className="flex items-center justify-between gap-3 text-xs font-black text-foreground-secondary">
        <span>{label}</span>
        {hint ? <span className="text-[10px] font-medium text-muted-foreground">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

function OtpInputs({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: 6 }, (_, index) => value[index] ?? "");

  const update = (index: number, nextValue: string) => {
    const next = digits.map((digit) => digit || "");
    next[index] = toLatinDigits(nextValue).replace(/\D/g, "").slice(-1);
    onChange(next.join(""));
    if (next[index] && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = toLatinDigits(event.clipboardData.getData("text")).replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < 5) inputRefs.current[index + 1]?.focus();
  };

  return (
    <div className="mt-2 grid grid-cols-6 gap-2" dir="ltr" role="group" aria-label="شش رقم کد تأیید">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => { inputRefs.current[index] = element; }}
          className="h-14 min-w-0 rounded-control border border-input-border bg-input text-center text-xl font-black text-foreground tabular-nums shadow-xs outline-none transition-[border-color,box-shadow,background-color] hover:border-border-strong focus:border-ring focus-visible:ring-2 focus-visible:ring-ring"
          value={digit}
          onChange={(event) => update(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          aria-label={`رقم ${index + 1} کد تأیید`}
          autoFocus={index === 0}
          required
        />
      ))}
    </div>
  );
}

function Stepper({ step }: { step: AuthStep }) {
  const current = step === "phone" ? 1 : step === "code" ? 2 : 3;
  const steps = [
    { number: 1, label: "شماره همراه" },
    { number: 2, label: "تأیید" },
    { number: 3, label: "ساخت حساب" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2" aria-label="مراحل ورود">
      {steps.map(({ number, label }) => {
        const complete = current > number;
        const active = current === number;
        return (
          <div key={number} className="min-w-0 text-center" aria-current={active ? "step" : undefined}>
            <div className="flex items-center">
              <span className={`h-px flex-1 ${number === 1 ? "opacity-0" : complete || active ? "bg-brand" : "bg-divider"}`} />
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[10px] font-black transition-colors ${
                  complete
                    ? "border-brand bg-brand text-brand-foreground"
                    : active
                      ? "border-brand bg-brand-muted text-brand"
                      : "border-border bg-surface-muted text-muted-foreground"
                }`}
              >
                {complete ? <Check aria-hidden="true" className="h-3.5 w-3.5" /> : number}
              </span>
              <span className={`h-px flex-1 ${number === 3 ? "opacity-0" : current > number ? "bg-brand" : "bg-divider"}`} />
            </div>
            <span className={`mt-1.5 block truncate text-[9px] font-bold ${active ? "text-brand" : "text-muted-foreground"}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const [step, setStep] = useState<AuthStep>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [registrationToken, setRegistrationToken] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("user");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const {
    provinces,
    cities,
    provinceId,
    cityId,
    provincesLoading,
    citiesLoading,
    error: geoError,
    selectProvince,
    selectCity,
  } = useProvinceCity();

  const selectedProvince = provinces.find((province) => province.id === provinceId) ?? null;

  const {
    location,
    setLocation,
    resolving,
    setResolving,
    focusRequest,
    focusProvince,
    focusCity,
  } = useLocationSelection();

  // Both handlers drop the previously chosen point, because its address
  // belongs to the old area.
  const changeProvince = (nextProvinceId: number | null) => {
    selectProvince(nextProvinceId);
    focusProvince(provinces.find((province) => province.id === nextProvinceId) ?? null);
  };

  const changeCity = (nextCityId: number | null) => {
    selectCity(nextCityId);
    const nextCity = cities.find((city) => city.id === nextCityId);
    if (nextCity) focusCity(nextCity, selectedProvince);
    else setLocation(null);
  };

  const inputClass =
    "mt-2 min-h-12 w-full rounded-control border border-input-border bg-input px-3.5 text-sm text-foreground shadow-xs outline-none transition-[border-color,box-shadow,background-color] placeholder:text-foreground-subtle hover:border-border-strong focus:border-ring focus-visible:ring-2 focus-visible:ring-ring";
  const primaryButtonClass =
    "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-brand px-5 text-sm font-black text-brand-foreground shadow-card outline-none transition-[transform,background-color,box-shadow] hover:bg-brand-hover hover:shadow-popover active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground disabled:shadow-none";

  const resetMessages = () => {
    setError("");
    setNotice("");
  };

  const submitPhone = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    resetMessages();
    try {
      const result = await api<{ challenge_id: string }>("otp-request", { phone });
      setChallengeId(result.challenge_id);
      setCode("");
      setStep("code");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "خطا در ورود");
    } finally {
      setPending(false);
    }
  };

  const submitCode = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    resetMessages();
    try {
      const result = await api<{
        authenticated?: boolean;
        registration_required?: boolean;
        registration_token?: string;
      }>("otp-verify", { challenge_id: challengeId, code });

      if (result.authenticated) {
        router.replace("/profile");
      } else if (result.registration_required && result.registration_token) {
        setRegistrationToken(result.registration_token);
        setStep("register");
      } else {
        setError("پاسخ ورود کامل نبود. دوباره تلاش کنید.");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "کد معتبر نیست.");
    } finally {
      setPending(false);
    }
  };

  const resendCode = async () => {
    setPending(true);
    resetMessages();
    try {
      const result = await api<{ challenge_id: string }>("otp-request", { phone });
      setChallengeId(result.challenge_id);
      setCode("");
      setNotice("کد تأیید تازه ارسال شد.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ارسال دوباره کد انجام نشد.");
    } finally {
      setPending(false);
    }
  };

  const hasLocation =
    location !== null &&
    location.address.trim() !== "" &&
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude);
  const locationReady = accountType === "user" || (hasLocation && !resolving);

  const submitRegistration = async (event: FormEvent) => {
    event.preventDefault();
    resetMessages();

    if (provinceId === null || cityId === null) {
      setError("استان و شهر را انتخاب کنید.");
      return;
    }
    if (accountType === "square" && !hasLocation) {
      setError("روی نقشه نقطه‌ای را برای موقعیت میدان انتخاب کنید.");
      return;
    }

    setPending(true);
    try {
      const base = {
        registration_token: registrationToken,
        province_id: provinceId,
        city_id: cityId,
      };

      if (accountType === "user") {
        await api("register-user", { ...base, full_name: name });
      } else if (location) {
        await api("register-square", {
          ...base,
          square_name: name,
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude,
        });
      }
      router.replace("/profile");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ثبت‌نام انجام نشد.");
    } finally {
      setPending(false);
    }
  };

  const editPhone = () => {
    resetMessages();
    setCode("");
    setChallengeId("");
    setStep("phone");
  };

  // Desktop has no bottom navigation, so the form gets its own way back. Only
  // step back in history when the page was reached from this same site;
  // otherwise a direct open would leave the app.
  const goBack = () => {
    router.push("/");
  };

  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-background text-foreground">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-muted opacity-70 blur-3xl" />
        <div className="absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-surface-muted opacity-90 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-[100dvh] w-full max-w-6xl items-stretch lg:grid-cols-[1.05fr_.95fr]">
        <section className="hidden border-l border-border bg-surface-glass p-10 backdrop-blur-sm lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div>
            <div className="inline-flex items-center gap-3">
              <AppLogo className="h-12 w-12 rounded-2xl shadow-card" priority />
              <div>
                <p className="text-lg font-black text-foreground">نقش من</p>
                <p className="mt-0.5 text-[11px] font-bold text-muted-foreground">شبکه سراسری میادین ایران</p>
              </div>
            </div>

            <div className="mt-16 max-w-md">
              <span className="inline-flex items-center gap-2 rounded-pill border border-brand-border bg-brand-muted px-3 py-1.5 text-[11px] font-black text-brand">
                <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
                ورود یکپارچه و امن
              </span>
              <h1 className="mt-5 text-4xl font-black leading-[1.45] tracking-tight text-foreground">
                روایت، ارتباط و حضور میدانی؛ در یک حساب.
              </h1>
              <p className="mt-5 text-sm leading-8 text-foreground-secondary">
                با شماره همراه وارد شوید. اگر اولین حضور شماست، بعد از تأیید شماره در چند قدم کوتاه حساب شخصی یا میدان خود را می‌سازید.
              </p>
            </div>

            <div className="mt-10 grid gap-3">
              {[
                { icon: MessageCircleMore, title: "دسترسی سریع", text: "ورود بدون رمز عبور با کد یک‌بارمصرف" },
                { icon: ShieldCheck, title: "هویت مطمئن", text: "شماره همراه شما مبنای تأیید و بازیابی حساب است" },
                { icon: MapPin, title: "متصل به میدان", text: "امکان ساخت حساب شخصی یا ثبت یک میدان محلی" },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex items-start gap-3 rounded-card border border-border bg-card p-3.5 shadow-xs">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-muted text-brand">
                    <Icon aria-hidden="true" className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="text-xs font-black text-foreground">{title}</p>
                    <p className="mt-1 text-[11px] leading-6 text-muted-foreground">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-10 text-[10px] leading-6 text-foreground-subtle">
            برای امنیت حساب، کد تأیید را در اختیار دیگران قرار ندهید.
          </p>
        </section>

        <section className="flex items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-7 flex items-center justify-center gap-2.5 lg:hidden">
              <AppLogo className="h-10 w-10 rounded-xl shadow-card" />
              <div>
                <p className="text-sm font-black text-foreground">نقش من</p>
                <p className="text-[9px] font-bold text-muted-foreground">شبکه سراسری میادین ایران</p>
              </div>
            </div>

            <div className="mb-3 hidden lg:flex">
              <button
                type="button"
                onClick={goBack}
                aria-label="بازگشت"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-pill border border-border bg-surface px-4 text-xs font-black text-foreground-secondary shadow-xs outline-none transition-colors hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
                بازگشت
              </button>
            </div>

            <div className="rounded-panel border border-border bg-card p-5 text-card-foreground shadow-dialog sm:p-7">
              <Stepper step={step} />

              <div className="mt-7">
                {step === "phone" ? (
                  <>
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-muted text-brand">
                      <Smartphone aria-hidden="true" className="h-6 w-6" />
                    </div>
                    <h2 className="mt-4 text-2xl font-black tracking-tight text-foreground">ورود به میدان</h2>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      شماره همراهی که می‌خواهید حساب شما با آن شناخته شود وارد کنید.
                    </p>

                    <form onSubmit={submitPhone} className="mt-6 space-y-4">
                      <Field label="شماره همراه" hint="مثلاً 09123456789">
                        <div className="relative">
                          <Smartphone aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 mt-1 h-4.5 w-4.5 -translate-y-1/2 text-icon-muted" />
                          <input
                            className={`${inputClass} pl-10 text-left tabular-nums`}
                            value={phone}
                            onChange={(event) => setPhone(normalizePhone(event.target.value))}
                            inputMode="tel"
                            autoComplete="tel"
                            dir="ltr"
                            placeholder="09123456789"
                            autoFocus
                            required
                          />
                        </div>
                      </Field>

                      <button disabled={!isHydrated || pending || phone.replace(/\D/g, "").length < 10} className={primaryButtonClass}>
                        {pending ? <LoaderCircle aria-hidden="true" className="h-4.5 w-4.5 animate-spin" /> : <ArrowLeft aria-hidden="true" className="h-4.5 w-4.5" />}
                        {pending ? "در حال ارسال کد…" : "ادامه و دریافت کد"}
                      </button>
                    </form>
                  </>
                ) : null}

                {step === "code" ? (
                  <>
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-muted text-brand">
                      <LockKeyhole aria-hidden="true" className="h-6 w-6" />
                    </div>
                    <h2 className="mt-4 text-2xl font-black tracking-tight text-foreground">کد تأیید را وارد کنید</h2>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      کد یک‌بارمصرف برای <span className="font-black text-foreground" dir="ltr">{phone}</span> ارسال شد.
                    </p>

                    <form onSubmit={submitCode} className="mt-6 space-y-4">
                      <Field label="کد تأیید" hint="کد پیامک‌شده">
                        <OtpInputs value={code} onChange={(nextCode) => setCode(nextCode.slice(0, 6))} />
                      </Field>

                      <button disabled={!isHydrated || pending || code.length < 4} className={primaryButtonClass}>
                        {pending ? <LoaderCircle aria-hidden="true" className="h-4.5 w-4.5 animate-spin" /> : <Check aria-hidden="true" className="h-4.5 w-4.5" />}
                        {pending ? "در حال بررسی…" : "تأیید و ورود"}
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={editPhone}
                          disabled={pending}
                          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-control border border-border bg-surface px-3 text-xs font-black text-foreground-secondary outline-none transition-colors hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                        >
                          <Smartphone aria-hidden="true" className="h-4 w-4" />
                          ویرایش شماره
                        </button>
                        <button
                          type="button"
                          onClick={() => void resendCode()}
                          disabled={pending}
                          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-control border border-border bg-surface px-3 text-xs font-black text-foreground-secondary outline-none transition-colors hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                        >
                          <RefreshCw aria-hidden="true" className="h-4 w-4" />
                          ارسال دوباره
                        </button>
                      </div>
                    </form>
                  </>
                ) : null}

                {step === "register" ? (
                  <>
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-muted text-brand">
                      <UserRound aria-hidden="true" className="h-6 w-6" />
                    </div>
                    <h2 className="mt-4 text-2xl font-black tracking-tight text-foreground">حساب خود را کامل کنید</h2>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      شماره شما تأیید شد. فقط اطلاعات اصلی را وارد کنید تا وارد میدان شوید.
                    </p>

                    <form onSubmit={submitRegistration} className="mt-6 space-y-5">
                      <fieldset>
                        <legend className="text-xs font-black text-foreground-secondary">نوع حساب</legend>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            aria-pressed={accountType === "user"}
                            onClick={() => setAccountType("user")}
                            className={`rounded-card border p-3.5 text-right outline-none transition-[border-color,background-color,box-shadow] focus-visible:ring-2 focus-visible:ring-ring ${
                              accountType === "user"
                                ? "border-brand bg-brand-muted shadow-xs"
                                : "border-border bg-surface hover:bg-hover"
                            }`}
                          >
                            <span className={`grid h-9 w-9 place-items-center rounded-xl ${accountType === "user" ? "bg-brand text-brand-foreground" : "bg-surface-muted text-icon-muted"}`}>
                              <UserRound aria-hidden="true" className="h-4.5 w-4.5" />
                            </span>
                            <strong className="mt-3 block text-xs font-black text-foreground">حساب شخصی</strong>
                            <span className="mt-1 block text-[10px] leading-5 text-muted-foreground">برای حضور و فعالیت فردی</span>
                          </button>

                          <button
                            type="button"
                            aria-pressed={accountType === "square"}
                            onClick={() => setAccountType("square")}
                            className={`rounded-card border p-3.5 text-right outline-none transition-[border-color,background-color,box-shadow] focus-visible:ring-2 focus-visible:ring-ring ${
                              accountType === "square"
                                ? "border-brand bg-brand-muted shadow-xs"
                                : "border-border bg-surface hover:bg-hover"
                            }`}
                          >
                            <span className={`grid h-9 w-9 place-items-center rounded-xl ${accountType === "square" ? "bg-brand text-brand-foreground" : "bg-surface-muted text-icon-muted"}`}>
                              <UsersRound aria-hidden="true" className="h-4.5 w-4.5" />
                            </span>
                            <strong className="mt-3 block text-xs font-black text-foreground">حساب میدان</strong>
                            <span className="mt-1 block text-[10px] leading-5 text-muted-foreground">برای یک پایگاه یا میدان محلی</span>
                          </button>
                        </div>
                      </fieldset>

                      <Field label={accountType === "user" ? "نام و نام خانوادگی" : "نام میدان"}>
                        <input
                          className={inputClass}
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          autoComplete={accountType === "user" ? "name" : "organization"}
                          placeholder={accountType === "user" ? "نام کامل شما" : "نام میدان یا پایگاه"}
                          required
                        />
                      </Field>

                      {accountType === "square" ? (
                        <SquareLocationField
                          provinces={provinces}
                          cities={cities}
                          provinceId={provinceId}
                          cityId={cityId}
                          provincesLoading={provincesLoading}
                          citiesLoading={citiesLoading}
                          onProvinceChange={changeProvince}
                          onCityChange={changeCity}
                          location={location}
                          resolving={resolving}
                          error={geoError}
                          focusRequest={focusRequest}
                          onSelect={setLocation}
                          onPendingChange={setResolving}
                        />
                      ) : (
                        <ProvinceCitySelect
                          provinces={provinces}
                          cities={cities}
                          provinceId={provinceId}
                          cityId={cityId}
                          provincesLoading={provincesLoading}
                          citiesLoading={citiesLoading}
                          onProvinceChange={changeProvince}
                          onCityChange={changeCity}
                        />
                      )}

                      <button disabled={pending || !name.trim() || provinceId === null || cityId === null || !locationReady} className={primaryButtonClass}>
                        {pending ? <LoaderCircle aria-hidden="true" className="h-4.5 w-4.5 animate-spin" /> : <ArrowLeft aria-hidden="true" className="h-4.5 w-4.5" />}
                        {pending ? "در حال ساخت حساب…" : "تکمیل ثبت‌نام و ورود"}
                      </button>
                    </form>
                  </>
                ) : null}
              </div>

              {error ? (
                <div role="alert" className="mt-5 flex items-start gap-2.5 rounded-card border border-danger-border bg-danger-surface p-3 text-danger">
                  <CircleAlert aria-hidden="true" className="mt-0.5 h-4.5 w-4.5 shrink-0" />
                  <p className="text-xs font-bold leading-6">{error}</p>
                </div>
              ) : null}

              {notice ? (
                <div role="status" className="mt-5 flex items-start gap-2.5 rounded-card border border-success-border bg-success-surface p-3 text-success-foreground">
                  <Check aria-hidden="true" className="mt-0.5 h-4.5 w-4.5 shrink-0" />
                  <p className="text-xs font-bold leading-6">{notice}</p>
                </div>
              ) : null}

              <div className="mt-6 flex items-start gap-2.5 border-t border-divider pt-4 text-[10px] leading-6 text-muted-foreground">
                <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-icon-muted" />
                <p>ورود با کد یک‌بارمصرف انجام می‌شود. کد تأیید فقط برای ورود شماست و نباید در اختیار فرد دیگری قرار بگیرد.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
