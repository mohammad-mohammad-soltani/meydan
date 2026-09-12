/**
 * Approximate centers (provincial capitals) used to focus the picker map when a
 * province is chosen. Keyed by the Persian province name the geo API returns,
 * which is more stable than the numeric ids. This is the only hardcoded
 * geographic data: it makes province focus instant and offline, instead of
 * spending a geocoding request per selection.
 */
export const IRAN_CENTER = { latitude: 32.4279, longitude: 53.688 };

export const PROVINCE_CENTERS: Record<string, { latitude: number; longitude: number }> = {
  "آذربایجان شرقی": { latitude: 38.0800, longitude: 46.2900 },
  "آذربایجان غربی": { latitude: 37.5500, longitude: 45.0759 },
  "اردبیل": { latitude: 38.2498, longitude: 48.2933 },
  "اصفهان": { latitude: 32.6546, longitude: 51.6680 },
  "البرز": { latitude: 35.8327, longitude: 50.9915 },
  "ایلام": { latitude: 33.6374, longitude: 46.4227 },
  "بوشهر": { latitude: 28.9234, longitude: 50.8200 },
  "تهران": { latitude: 35.6892, longitude: 51.3890 },
  "چهارمحال و بختیاری": { latitude: 32.3256, longitude: 50.8644 },
  "خراسان جنوبی": { latitude: 32.8663, longitude: 59.2211 },
  "خراسان رضوی": { latitude: 36.2970, longitude: 59.6062 },
  "خراسان شمالی": { latitude: 37.4747, longitude: 57.3290 },
  "خوزستان": { latitude: 31.3183, longitude: 48.6706 },
  "زنجان": { latitude: 36.6736, longitude: 48.4787 },
  "سمنان": { latitude: 35.5729, longitude: 53.3971 },
  "سیستان و بلوچستان": { latitude: 29.4963, longitude: 60.8629 },
  "فارس": { latitude: 29.5918, longitude: 52.5837 },
  "قزوین": { latitude: 36.2688, longitude: 50.0041 },
  "قم": { latitude: 34.6399, longitude: 50.8759 },
  "کردستان": { latitude: 35.3219, longitude: 46.9862 },
  "کرمان": { latitude: 30.2839, longitude: 57.0834 },
  "کرمانشاه": { latitude: 34.3142, longitude: 47.0650 },
  "کهگیلویه و بویراحمد": { latitude: 30.6682, longitude: 51.5880 },
  "گلستان": { latitude: 36.8427, longitude: 54.4437 },
  "گیلان": { latitude: 37.2808, longitude: 49.5832 },
  "لرستان": { latitude: 33.4878, longitude: 48.3558 },
  "مازندران": { latitude: 36.5659, longitude: 53.0596 },
  "مرکزی": { latitude: 34.0917, longitude: 49.6892 },
  "هرمزگان": { latitude: 27.1865, longitude: 56.2808 },
  "همدان": { latitude: 34.7983, longitude: 48.5148 },
  "یزد": { latitude: 31.8974, longitude: 54.3569 },
};
