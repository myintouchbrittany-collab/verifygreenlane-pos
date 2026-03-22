import {
  buildActivityDetailsFromUpdates,
  getActivityTypeFromUpdates,
  getOrderActivityTimeline,
} from "./orderActivity";

test("maps workflow updates to timeline event types", () => {
  expect(getActivityTypeFromUpdates({ verificationStatus: "verified" })).toBe(
    "verification_updated"
  );
  expect(getActivityTypeFromUpdates({ orderStatus: "checked_in" })).toBe(
    "customer_arrived"
  );
  expect(getActivityTypeFromUpdates({ orderStatus: "express_ready" })).toBe(
    "prep_started"
  );
  expect(getActivityTypeFromUpdates({ orderStatus: "ready_for_pickup" })).toBe(
    "marked_ready"
  );
  expect(getActivityTypeFromUpdates({ orderStatus: "completed" })).toBe(
    "checkout_completed"
  );
});

test("builds readable activity details from order updates", () => {
  expect(
    buildActivityDetailsFromUpdates({
      verificationStatus: "verified",
      parkingSpot: "12",
      vehicleColor: "Black",
    })
  ).toBe("Verification Verified | Spot 12 | Vehicle Black");
});

test("merges stored and fallback activity timeline entries chronologically", () => {
  const timeline = getOrderActivityTimeline({
    createdAt: "2026-03-19T12:00:00.000Z",
    arrivedAt: "2026-03-19T12:20:00.000Z",
    activityLog: [
      {
        id: "prep",
        type: "prep_started",
        timestamp: "2026-03-19T12:30:00.000Z",
        performedBy: "Staff",
      },
    ],
  });

  expect(timeline.map((entry) => entry.type)).toEqual([
    "created",
    "customer_arrived",
    "prep_started",
  ]);
});
