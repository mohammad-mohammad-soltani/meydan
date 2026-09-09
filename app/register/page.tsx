"use client";

import type { Route } from "next";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { meydanClientApi } from "@/lib/meydan-client-api";

type Region = { id: number; name: string };
type City = Region & { province_id: number };
type AccountType = "user" | "square";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = useMemo(() => {
    const value = searchParams.get("next");
    return value?.startsWith("/") ? value : "/home";
  }, [searchParams]);
  const [token, setToken] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("user");
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [provinceId, setProvinceId] = useState(0);
  const [cityId, setCityId] = useState(0);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setToken(sessionStorage.getItem("meydan_registration_token") || "");
    void meydanClientApi<Region[]>("/geo/provinces").then(setProvinces).catch(() => setError("دریافت استان‌ها ناموفق بود."));
  }, []);

  useEffect(() => {
    if (!provinceId) { setCities([]); setCityId(0); return; }
    void meydanClientApi<City[]>(`/geo/cities?province_id=${provinceId}`).then((items) => {
      setCities(items);
      setCityId(items[0]?.id || 0);
    }).catch(() => setError("دریافت شهرها ناموفق بود."));
  }, [provinceId]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) { router.replace(`/login?next=${encodeURIComponent(next)}` as Route); return; }
    setLoading(true);
    setError("");
    try {
      const common = { registration_token: token, province_id: provinceId, city_id: cityId };
      const payload = accountType === "user"
        ? { ...common, full_name: name }
        : { ...common, square_name: name, address, latitude: Number(latitude), longitude: Number(longitude) };
      await meydanClientApi(`/auth/register/${accountType}`, { method: "POST", body: JSON.stringify(payload) });
      sessionStorage.removeItem("meydan_registration_token");
      router.replace(next as Route);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ثبت حساب ناموفق بود.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh bg-background px-4 py-8 text-foreground">
      <form onSubmit={submit} className="mx-auto w-full max-w-md space-y-4 rounded-panel border border-border bg-card p-5 text-card-foreground shadow-dialog">
        <div><h1 className="text-xl font-black">ساخت حساب میدان</h1><p className="mt-2 text-xs leading-6 text-muted-foreground">نوع حساب را انتخاب کنید؛ همین نقش تعیین می‌کند صفحه هویت شخصی یا پایگاه نمایش داده شود.</p></div>
        <div className="grid grid-cols-2 gap-2 rounded-card border border-border bg-surface-muted p-1"><button type="button" onClick={() => setAccountType("user")} className={`rounded-control px-3 py-2 text-xs font-bold ${accountType === "user" ? "bg-surface text-brand shadow-xs" : "text-muted-foreground"}`}>کاربر عادی</button><button type="button" onClick={() => setAccountType("square")} className={`rounded-control px-3 py-2 text-xs font-bold ${accountType === "square" ? "bg-surface text-brand shadow-xs" : "text-muted-foreground"}`}>پایگاه میدان</button></div>
        <label className="block"><span className="mb-2 block text-xs font-bold">{accountType === "user" ? "نام و نام خانوادگی" : "نام پایگاه"}</span><input value={name} onChange={(e) => setName(e.target.value)} className="min-h-11 w-full rounded-control border border-input-border bg-input px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring" /></label>
        <div className="grid grid-cols-2 gap-2"><label className="block"><span className="mb-2 block text-xs font-bold">استان</span><select value={provinceId} onChange={(e) => setProvinceId(Number(e.target.value))} className="min-h-11 w-full rounded-control border border-input-border bg-input px-2 text-xs outline-none"><option value={0}>انتخاب</option>{provinces.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="block"><span className="mb-2 block text-xs font-bold">شهر</span><select value={cityId} onChange={(e) => setCityId(Number(e.target.value))} className="min-h-11 w-full rounded-control border border-input-border bg-input px-2 text-xs outline-none"><option value={0}>انتخاب</option>{cities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
        {accountType === "square" ? <><label className="block"><span className="mb-2 block text-xs font-bold">نشانی پایگاه</span><textarea value={address} onChange={(e) => setAddress(e.target.value)} className="min-h-20 w-full rounded-control border border-input-border bg-input px-3 py-2 text-sm outline-none" /></label><div className="grid grid-cols-2 gap-2"><label className="block"><span className="mb-2 block text-xs font-bold">عرض جغرافیایی</span><input value={latitude} onChange={(e) => setLatitude(e.target.value)} inputMode="decimal" className="min-h-11 w-full rounded-control border border-input-border bg-input px-3 text-xs outline-none" /></label><label className="block"><span className="mb-2 block text-xs font-bold">طول جغرافیایی</span><input value={longitude} onChange={(e) => setLongitude(e.target.value)} inputMode="decimal" className="min-h-11 w-full rounded-control border border-input-border bg-input px-3 text-xs outline-none" /></label></div></> : null}
        <button disabled={loading || !token || !name.trim() || !provinceId || !cityId} className="min-h-11 w-full rounded-control bg-brand px-4 text-sm font-black text-brand-foreground hover:bg-brand-hover disabled:bg-disabled disabled:text-disabled-foreground">{loading ? "در حال ساخت…" : "ساخت حساب"}</button>
        {error ? <p className="rounded-control border border-danger-border bg-danger-muted px-3 py-2 text-xs text-danger">{error}</p> : null}
      </form>
    </main>
  );
}
