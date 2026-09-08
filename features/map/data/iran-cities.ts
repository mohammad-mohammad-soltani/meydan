import rawIranCities from "../../../data/iran-cities.json";
import type { City, Province } from "../types";

type RawProvince = { id: number; name: string; };
type RawCity = { id: number; name: string; ostan: number; };
type RawIranCities = { ostan: RawProvince[]; shahr: RawCity[]; };

const raw = rawIranCities as RawIranCities;

export const provinces: Province[] = raw.ostan.map((province) => ({ id: province.id, name: province.name }));
export const cities: City[] = raw.shahr.map((city) => ({ id: city.id, name: city.name, provinceId: city.ostan }));

const provincialCapitals: Record<number, string> = {
  1: "تبریز", 2: "ارومیه", 3: "اردبیل", 4: "اصفهان", 5: "کرج", 6: "ایلام", 7: "بوشهر",
  8: "تهران", 9: "شهرکرد", 10: "بیرجند", 11: "مشهد", 12: "بجنورد", 13: "اهواز",
  14: "زنجان", 15: "سمنان", 16: "زاهدان", 17: "شیراز", 18: "قزوین", 19: "قم",
  20: "سنندج", 21: "کرمان", 22: "کرمانشاه", 23: "یاسوج", 24: "گرگان", 25: "رشت",
  26: "خرم آباد", 27: "ساری", 28: "اراک", 29: "بندرعباس", 30: "همدان", 31: "یزد"
};

export const defaultProvince = provinces.find((province) => province.id === 8) ?? provinces[0];

export function getProvinceById(provinceId: number): Province | undefined {
  return provinces.find((province) => province.id === provinceId);
}

export function getCitiesByProvinceId(provinceId: number): City[] {
  return cities.filter((city) => city.provinceId === provinceId);
}

export function getDefaultCityForProvince(provinceId: number): City | undefined {
  const provinceCities = getCitiesByProvinceId(provinceId);
  return provinceCities.find((city) => city.name === provincialCapitals[provinceId]) ?? provinceCities[0];
}