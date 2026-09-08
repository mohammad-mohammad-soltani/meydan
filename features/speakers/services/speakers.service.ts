import type { Speaker } from "../types";

const speakers: Speaker[] = [
  { id: "mahdi-mandegari", name: "حجت‌الاسلام مهدی ماندگاری", handle: "mandegari_live", cities: ["قم", "تهران"], category: "faith", expertise: "انگیزش ایمانی، سیره شهدا و امیدآفرینی در میدان.", initials: "ح.م", accent: "slate", verified: true },
  { id: "bashir-hosseini", name: "دکتر سید بشیر حسینی", handle: "dr_bashirhosseini", cities: ["تهران"], category: "media", expertise: "سواد رسانه‌ای، پدافند شناختی و گفتگوی چهره‌به‌چهره با جوانان.", initials: "د.س", accent: "blue", verified: true },
  { id: "alireza-panahian", name: "حجت‌الاسلام علیرضا پناهیان", handle: "panahian_ir", cities: ["تهران"], category: "resistance", expertise: "سازمان‌دهی اجتماعی، نبرد تمدنی و شرح مبانی مقاومت.", initials: "ع.پ", accent: "amber", verified: true },
  { id: "naser-rafiei", name: "استاد ناصر رفیعی", handle: "rafiei_ir", cities: ["قم"], category: "faith", expertise: "تاریخ اسلام، مواجهه اهل‌بیت با محاصره و خطبه‌های تبیین‌گر.", initials: "ن.ر", accent: "emerald", verified: true }
];

/** Speakers data boundary. Replace this fixture with a typed API client and reservation endpoint. */
export function getSpeakers(): Speaker[] { return speakers; }