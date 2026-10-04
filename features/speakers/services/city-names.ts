import { loadCities, loadProvinces } from "@/features/auth/services/geo-options.service";

/** One shared lookup per session/server worker, not one request per speaker. */
let lookupPromise: Promise<Map<string, string>> | null = null;
export function loadSpeakerCityNames(): Promise<Map<string, string>> {
  lookupPromise ??= (async () => {
    const names = new Map<string, string>();
    const provinces = await loadProvinces();
    // Bound concurrency while the existing geo option cache shares every request.
    for (let offset = 0; offset < provinces.length; offset += 6) {
      const rows = await Promise.all(provinces.slice(offset, offset + 6).map((province) => loadCities(province.id)));
      for (const cities of rows) for (const city of cities) names.set(String(city.id), city.name);
    }
    return names;
  })().catch((error: unknown) => { lookupPromise = null; throw error; });
  return lookupPromise;
}
