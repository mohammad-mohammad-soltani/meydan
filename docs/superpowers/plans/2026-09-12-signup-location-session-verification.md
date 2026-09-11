# Signup Location, Square Verification, and Session Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace raw location IDs/manual coordinates in signup, enforce square verification in timelines, and keep device sessions valid for 30 days.

**Architecture:** Reuse the existing geo service and `LocationPickerMap` on the frontend. Enforce square narrative eligibility in the backend before serialization and make backend/frontend session TTLs agree at 30 days.

**Tech Stack:** Next.js 16, React 19, TypeScript, Leaflet, WordPress/PHP REST API.

**Spec:** `docs/superpowers/specs/2026-09-12-signup-location-session-verification-design.md`

## Global Constraints
- Reuse the existing `/geo/provinces`, `/geo/cities`, and `/geo/reverse` endpoints.
- Do not show raw province/city IDs or manual latitude/longitude/address fields in signup.
- Unverified squares may create content, but their narratives must not appear in timelines.
- Access and refresh sessions both expire after 30 days; logout still revokes immediately.

---

### Task 1: Backend session and verification rules

**Files:**
- Modify: `wp-content/plugins/meydan-core/src/Auth/SessionService.php`
- Modify: `wp-content/plugins/meydan-core/src/Support/Serializer.php`
- Modify: `wp-content/plugins/meydan-core/src/Timeline/CandidateGenerator.php`
- Modify: `wp-content/plugins/meydan-core/src/Rest/TimelineController.php`
- Create: `tests/check-auth-timeline-contract.py`

**Interfaces:**
- Consumes: existing session table and narrative actor metadata.
- Produces: 30-day token TTLs and a server-side timeline eligibility rule for square narratives.

- [ ] **Step 1: Write the failing contract test**

Create a Python test that asserts: access/refresh TTLs are both 30 days; `Serializer::square()` reads `meydan_verified`; timeline code invokes a single helper that rejects square narratives unless `meydan_verified` is `1`.

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 tests/check-auth-timeline-contract.py`
Expected: non-zero exit because current access TTL is 900 seconds, square serializer hard-codes verified, and no global timeline eligibility filter exists.

- [ ] **Step 3: Implement minimal backend changes**

Set both TTL constants to `30 * DAY_IN_SECONDS`; change square serialization to `(bool) get_post_meta($id, 'meydan_verified', true)`; add a reusable narrative eligibility helper and apply it to normal and special timeline paths before view stats/serialization.

- [ ] **Step 4: Run contract and existing backend checks**

Run: `python3 tests/check-auth-timeline-contract.py && python3 tests/check-route-inventory.py`
Expected: exit 0.

### Task 2: Frontend registration model and custom location selectors

**Files:**
- Create: `features/auth/registration.ts`
- Create: `features/auth/components/SearchableSelect.tsx`
- Modify: `app/auth/page.tsx`
- Create: `tests/registration.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `getProvinces()`, `getCities(provinceId)`, and `SelectedLocation`.
- Produces: user payload `{registration_token, full_name, province_id, city_id}` and square payload `{registration_token, square_name, province_id, city_id, address, latitude, longitude}` derived from named selections/map selection.

- [ ] **Step 1: Write failing payload tests**

Use Node's built-in test runner to assert that user payloads require selected province/city and square payloads derive province/city/address/coordinates only from a resolved map location.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test tests/registration.test.mjs`
Expected: module/function missing.

- [ ] **Step 3: Implement registration helpers and UI**

Create pure payload helpers, add a reusable searchable custom dropdown, load provinces on registration step, load cities after province selection, and clear city when province changes. For square accounts, render `LocationPickerMap`; remove manual address/latitude/longitude fields and submit the resolved selected location.

- [ ] **Step 4: Run tests and build**

Run: `npm run test:registration && npm run build`
Expected: both exit 0.

### Task 3: Frontend session cookie lifetime

**Files:**
- Modify: `app/api/auth/[action]/route.ts`
- Modify: `app/api/meydan/[...path]/route.ts`
- Create: `tests/session-cookie.test.mjs`

**Interfaces:**
- Consumes: backend 30-day session policy.
- Produces: 30-day `meydan_access` and `meydan_refresh` browser cookies.

- [ ] **Step 1: Write failing cookie contract test**

Assert both auth proxy and generic Meydan proxy use a shared 30-day max age for access and refresh cookies and contain no 15-minute access max age.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/session-cookie.test.mjs`
Expected: non-zero exit because access cookie max age is currently 15 minutes.

- [ ] **Step 3: Implement 30-day cookie lifetime**

Introduce/use a single `SESSION_MAX_AGE = 30 * 24 * 60 * 60` value and apply it to both access and refresh cookies in both route handlers.

- [ ] **Step 4: Run full frontend verification**

Run: `npm run test:registration && npm run test:session && npm run test:map && npm run lint && npm run build`
Expected: exit 0.
