import assert from "node:assert/strict";
import test from "node:test";
import { validateReservationPeriod } from "./reservation-rules";

const now = new Date("2026-10-20T12:00:00.000Z");

test("accepts a future reservation inside business hours in Bogota", () => {
  const error = validateReservationPeriod(
    new Date("2026-10-21T15:00:00.000Z"),
    new Date("2026-10-21T17:00:00.000Z"),
    now,
  );

  assert.equal(error, null);
});

test("rejects a reservation before 07:00 Bogota time", () => {
  const error = validateReservationPeriod(
    new Date("2026-10-21T11:00:00.000Z"),
    new Date("2026-10-21T12:00:00.000Z"),
    now,
  );

  assert.match(error ?? "", /07:00 a 21:00/);
});

test("rejects a reservation ending after 21:00 Bogota time", () => {
  const error = validateReservationPeriod(
    new Date("2026-10-22T00:00:00.000Z"),
    new Date("2026-10-22T03:00:00.000Z"),
    now,
  );

  assert.match(error ?? "", /07:00 a 21:00/);
});

test("rejects fractional-hour durations", () => {
  const error = validateReservationPeriod(
    new Date("2026-10-21T15:00:00.000Z"),
    new Date("2026-10-21T16:30:00.000Z"),
    now,
  );

  assert.match(error ?? "", /iniciar y finalizar en horas en punto/);
});

test("rejects reservations beyond the 30-day window", () => {
  const error = validateReservationPeriod(
    new Date("2026-11-20T15:00:00.000Z"),
    new Date("2026-11-20T16:00:00.000Z"),
    now,
  );

  assert.match(error ?? "", /no puede superar los 30 días/);
});

test("accepts a reservation with the minimum duration of one hour", () => {
  const error = validateReservationPeriod(
    new Date("2026-10-21T15:00:00.000Z"),
    new Date("2026-10-21T16:00:00.000Z"),
    now,
  );

  assert.equal(error, null);
});

test("accepts a reservation with the maximum duration of four hours", () => {
  const error = validateReservationPeriod(
    new Date("2026-10-21T13:00:00.000Z"),
    new Date("2026-10-21T17:00:00.000Z"),
    now,
  );

  assert.equal(error, null);
});

test("rejects a reservation starting in the past", () => {
  const error = validateReservationPeriod(
    new Date("2026-10-20T11:00:00.000Z"),
    new Date("2026-10-20T12:00:00.000Z"),
    now,
  );

  assert.match(error ?? "", /debe ser para el futuro/);
});

test("rejects a reservation longer than four hours", () => {
  const error = validateReservationPeriod(
    new Date("2026-10-21T13:00:00.000Z"),
    new Date("2026-10-21T18:00:00.000Z"),
    now,
  );

  assert.match(error ?? "", /duración.*entre 1 y 4 horas/);
});
