export type RegistrationLocation = {
  latitude: number;
  longitude: number;
  address: string;
  provinceId: number | null;
  cityId: number | null;
  provinceName?: string | null;
  cityName?: string | null;
};

function requiredId(value: number | null, field: string): number {
  if (!Number.isInteger(value) || (value as number) <= 0) {
    throw new Error(`missing_${field}`);
  }
  return value as number;
}

export function buildUserRegistrationPayload({
  registrationToken,
  fullName,
  provinceId,
  cityId,
}: {
  registrationToken: string;
  fullName: string;
  provinceId: number | null;
  cityId: number | null;
}) {
  return {
    registration_token: registrationToken,
    full_name: fullName.trim(),
    province_id: requiredId(provinceId, "province"),
    city_id: requiredId(cityId, "city"),
  };
}

export function buildSquareRegistrationPayload({
  registrationToken,
  squareName,
  location,
}: {
  registrationToken: string;
  squareName: string;
  location: RegistrationLocation | null;
}) {
  if (
    !location ||
    !location.address.trim() ||
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude)
  ) {
    throw new Error("missing_location");
  }

  return {
    registration_token: registrationToken,
    square_name: squareName.trim(),
    province_id: requiredId(location.provinceId, "province"),
    city_id: requiredId(location.cityId, "city"),
    address: location.address.trim(),
    latitude: location.latitude,
    longitude: location.longitude,
  };
}
