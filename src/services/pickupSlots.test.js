import { buildPickupAvailability, findPickupSlot } from "./pickupSlots";

const TEST_CONFIG = {
  daysAhead: 2,
  slotIntervalMinutes: 30,
  maxOrdersPerSlot: 2,
  weeklyHours: {
    0: null,
    1: { open: "09:00", close: "11:00" },
    2: { open: "09:00", close: "11:00" },
    3: { open: "09:00", close: "11:00" },
    4: { open: "09:00", close: "11:00" },
    5: { open: "09:00", close: "11:00" },
    6: { open: "09:00", close: "11:00" },
  },
};

test("filters past pickup times for same-day scheduling", () => {
  const now = new Date("2026-03-11T09:10:00");
  const availability = buildPickupAvailability([], now, TEST_CONFIG);

  expect(availability[0].dateKey).toBe("2026-03-11");
  expect(availability[0].slots.map((slot) => slot.timeValue)).toEqual([
    "09:30",
    "10:00",
    "10:30",
  ]);
});

test("removes slots that reach configured capacity", () => {
  const now = new Date("2026-03-11T08:00:00");
  const availability = buildPickupAvailability(
    [
      { orderStatus: "pending_review", pickupSlotKey: "2026-03-11|09:00" },
      { orderStatus: "approved", pickupSlotKey: "2026-03-11|09:00" },
      { orderStatus: "completed", pickupSlotKey: "2026-03-11|09:30" },
    ],
    now,
    TEST_CONFIG
  );

  const fullSlot = findPickupSlot(availability, "2026-03-11|09:00");
  const availableSlot = findPickupSlot(availability, "2026-03-11|09:30");

  expect(fullSlot).toBeNull();
  expect(availableSlot).not.toBeNull();
  expect(availableSlot.remainingCapacity).toBe(2);
});
