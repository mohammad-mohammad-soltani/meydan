# Signup Location, Square Verification, and Session Design

## Goal
Improve registration so users choose province/city by name, square accounts select their location on the existing map picker, unverified square narratives stay out of timelines, and a device session remains valid for 30 days.

## Registration UX
- Both user and square registration use the existing `/geo/provinces` and `/geo/cities?province_id=...` endpoints.
- Province and city are presented as custom searchable dropdowns; raw numeric IDs are never exposed to the user.
- Changing province clears the selected city and loads cities for the new province.
- Square registration reuses `features/profile/components/LocationPickerMap.tsx`.
- A square user selects a point on the map. `/geo/reverse` resolves address, province, city, latitude, and longitude. These resolved values are submitted; no manual address/latitude/longitude inputs are shown.
- Registration submission is disabled until required selections are resolved.

## Square Verification
- `meydan_verified` remains the source of truth.
- `Serializer::square()` must return the actual verified state, not a hard-coded `true`.
- Narratives authored by a square with `meydan_verified != 1` must be excluded from every timeline path, including for-you, following, special filtered timelines, trending, local, exploration, and initiative pools.
- An unverified square may still access its own profile and create narratives; the visibility restriction is on timeline distribution.

## Session Lifetime
- Access and refresh sessions are both valid for 30 days on the device.
- Frontend `meydan_access` and `meydan_refresh` cookies use the same 30-day lifetime.
- Logout and logout-all continue to revoke sessions immediately.

## Reuse and Boundaries
- Reuse `LocationPickerMap`, `getProvinces`, and `getCities`; do not create a second geocoding implementation.
- Keep timeline eligibility enforcement server-side so clients cannot bypass it.
