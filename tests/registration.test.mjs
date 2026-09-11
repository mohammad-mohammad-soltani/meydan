import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSquareRegistrationPayload,
  buildUserRegistrationPayload,
} from "../features/auth/registration.ts";

test("user registration submits selected province and city ids", () => {
  assert.deepEqual(
    buildUserRegistrationPayload({
      registrationToken: "reg_test",
      fullName: "محمد رضایی",
      provinceId: 4,
      cityId: 47,
    }),
    {
      registration_token: "reg_test",
      full_name: "محمد رضایی",
      province_id: 4,
      city_id: 47,
    },
  );
});

test("user registration rejects a missing province or city selection", () => {
  assert.throws(() =>
    buildUserRegistrationPayload({
      registrationToken: "reg_test",
      fullName: "محمد رضایی",
      provinceId: null,
      cityId: 47,
    }),
  );
  assert.throws(() =>
    buildUserRegistrationPayload({
      registrationToken: "reg_test",
      fullName: "محمد رضایی",
      provinceId: 4,
      cityId: null,
    }),
  );
});

test("square registration derives address and coordinates from the resolved map location", () => {
  assert.deepEqual(
    buildSquareRegistrationPayload({
      registrationToken: "reg_square",
      squareName: "میدان مسجد سید",
      location: {
        latitude: 32.657,
        longitude: 51.677,
        address: "اصفهان، خیابان مسجد سید",
        provinceId: 4,
        cityId: 47,
        provinceName: "اصفهان",
        cityName: "اصفهان",
      },
    }),
    {
      registration_token: "reg_square",
      square_name: "میدان مسجد سید",
      province_id: 4,
      city_id: 47,
      address: "اصفهان، خیابان مسجد سید",
      latitude: 32.657,
      longitude: 51.677,
    },
  );
});

test("square registration rejects unresolved map selections", () => {
  assert.throws(() =>
    buildSquareRegistrationPayload({
      registrationToken: "reg_square",
      squareName: "میدان مسجد سید",
      location: null,
    }),
  );
  assert.throws(() =>
    buildSquareRegistrationPayload({
      registrationToken: "reg_square",
      squareName: "میدان مسجد سید",
      location: {
        latitude: 32.657,
        longitude: 51.677,
        address: "",
        provinceId: null,
        cityId: 47,
        provinceName: null,
        cityName: "اصفهان",
      },
    }),
  );
});
