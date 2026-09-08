import { NextResponse } from "next/server";

type NominatimResult = { lat: string; lon: string; display_name?: string; };
type CachedLocation = { latitude: number; longitude: number; label: string; expiresAt: number; };

const cache = new Map<string, CachedLocation>();
const cacheDurationMs = 1000 * 60 * 60 * 12;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city")?.trim();
  const province = searchParams.get("province")?.trim();

  if (!city || !province) return NextResponse.json({ error: "شهر و استان الزامی هستند." }, { status: 400 });

  const key = city + "|" + province;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ location: { latitude: cached.latitude, longitude: cached.longitude, label: cached.label } });
  }

  try {
    const query = encodeURIComponent(city + ", " + province + ", Iran");
    const response = await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=fa&q=" + query, { headers: { "User-Agent": "MeydanMap/1.0" }, next: { revalidate: 43200 } });

    if (!response.ok) return NextResponse.json({ error: "سرویس موقعیت‌یابی در دسترس نیست." }, { status: 502 });

    const results = await response.json() as NominatimResult[];
    const result = results[0];
    const latitude = Number(result?.lat);
    const longitude = Number(result?.lon);

    if (!result || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return NextResponse.json({ error: "موقعیت این شهر پیدا نشد." }, { status: 404 });

    const location = { latitude, longitude, label: result.display_name ?? city };
    cache.set(key, { ...location, expiresAt: Date.now() + cacheDurationMs });
    return NextResponse.json({ location });
  } catch {
    return NextResponse.json({ error: "دریافت موقعیت با خطا مواجه شد." }, { status: 500 });
  }
}