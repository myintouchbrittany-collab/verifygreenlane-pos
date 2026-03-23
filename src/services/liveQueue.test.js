import {
  buildPublicQueueView,
  buildQueueSummary,
  formatWaitTime,
  getPublicQueueIdentifier,
  getNextBestActionLabel,
  getNextQueueAction,
  getQueueStatus,
  getWaitTimeMinutes,
  getWaitUrgency,
  sortQueueOrders,
} from "./liveQueue";

test("maps persisted workflow statuses to live queue statuses", () => {
  expect(getQueueStatus({ orderStatus: "pending_review" })).toBe("pending");
  expect(getQueueStatus({ orderStatus: "approved" })).toBe("verified");
  expect(getQueueStatus({ orderStatus: "checked_in" })).toBe("arrived");
  expect(getQueueStatus({ orderStatus: "express_ready" })).toBe("preparing");
  expect(getQueueStatus({ orderStatus: "ready_for_pickup" })).toBe("ready");
  expect(getQueueStatus({ orderStatus: "completed" })).toBe("completed");
});

test("uses arrival time for on-site waiting orders", () => {
  const now = new Date("2026-03-18T12:30:00.000Z");
  const order = {
    orderStatus: "checked_in",
    createdAt: "2026-03-18T11:00:00.000Z",
    arrivedAt: "2026-03-18T12:00:00.000Z",
  };

  expect(getWaitTimeMinutes(order, now)).toBe(30);
});

test("returns no arrival-based wait time for customers who have not arrived", () => {
  const now = new Date("2026-03-18T12:30:00.000Z");
  const order = {
    orderStatus: "approved",
    createdAt: "2026-03-18T11:00:00.000Z",
  };

  expect(getWaitTimeMinutes(order, now)).toBeNull();
  expect(formatWaitTime(order, now)).toBe("--");
});

test("builds summary cards from active queue orders", () => {
  const now = new Date("2026-03-18T12:30:00.000Z");
  const summary = buildQueueSummary(
    [
      {
        orderStatus: "checked_in",
        verificationStatus: "verified",
        arrivedAt: "2026-03-18T12:10:00.000Z",
      },
      {
        orderStatus: "ready_for_pickup",
        verificationStatus: "verified",
        arrivedAt: "2026-03-18T12:00:00.000Z",
      },
      {
        orderStatus: "pending_review",
        verificationStatus: "pending",
        createdAt: "2026-03-18T11:45:00.000Z",
      },
    ],
    now
  );

  expect(summary.waitingNow).toBe(2);
  expect(summary.avgWaitTimeMinutes).toBe(25);
  expect(summary.readyForPickup).toBe(1);
  expect(summary.verificationIssues).toBe(1);
});

test("returns the next logical action and sorts overdue orders first", () => {
  const now = new Date("2026-03-18T13:00:00.000Z");
  const overdueOrder = {
    orderId: "overdue",
    orderStatus: "checked_in",
    verificationStatus: "verified",
    arrivedAt: "2026-03-18T12:00:00.000Z",
  };
  const pendingOrder = {
    orderId: "pending",
    orderStatus: "pending_review",
    verificationStatus: "pending",
    createdAt: "2026-03-18T12:50:00.000Z",
  };

  expect(getNextQueueAction(pendingOrder)?.label).toBe("Verify ID");
  expect(sortQueueOrders([pendingOrder, overdueOrder], now)[0].orderId).toBe("overdue");
});

test("uses green yellow red wait urgency thresholds at 5 and 10 minutes", () => {
  const now = new Date("2026-03-18T12:10:00.000Z");

  expect(
    getWaitUrgency(
      {
        orderStatus: "checked_in",
        arrivedAt: "2026-03-18T12:07:00.000Z",
      },
      now
    )
  ).toBe("fresh");

  expect(
    getWaitUrgency(
      {
        orderStatus: "checked_in",
        arrivedAt: "2026-03-18T12:04:00.000Z",
      },
      now
    )
  ).toBe("warning");

  expect(
    getWaitUrgency(
      {
        orderStatus: "checked_in",
        arrivedAt: "2026-03-18T11:59:00.000Z",
      },
      now
    )
  ).toBe("overdue");
});

test("maps queue states to next best action labels", () => {
  expect(
    getNextBestActionLabel({
      orderStatus: "approved",
      verificationStatus: "verified",
    })
  ).toBe("Waiting for customer");

  expect(
    getNextBestActionLabel({
      orderStatus: "checked_in",
      verificationStatus: "verified",
      arrivedAt: "2026-03-18T12:08:00.000Z",
    }, new Date("2026-03-18T12:10:00.000Z"))
  ).toBe("Start Prep");

  expect(
    getNextBestActionLabel({
      orderStatus: "express_ready",
      verificationStatus: "verified",
      arrivedAt: "2026-03-18T12:08:00.000Z",
    }, new Date("2026-03-18T12:10:00.000Z"))
  ).toBe("Continue Prep");

  expect(
    getNextBestActionLabel({
      orderStatus: "ready_for_pickup",
      verificationStatus: "verified",
      arrivedAt: "2026-03-18T12:08:00.000Z",
    }, new Date("2026-03-18T12:10:00.000Z"))
  ).toBe("Call Customer");

  expect(
    getNextBestActionLabel({
      orderStatus: "checked_in",
      verificationStatus: "verified",
      arrivedAt: "2026-03-18T11:55:00.000Z",
    }, new Date("2026-03-18T12:10:00.000Z"))
  ).toBe("Priority");
});

test("builds masked public queue identifiers from pickup payloads", () => {
  expect(
    getPublicQueueIdentifier({
      pickupCode: JSON.stringify({
        customerId: "cust-998",
        orderNumber: "GL-456789",
      }),
    })
  ).toBe("GL-6789");
});

test("prioritizes ready pickups for now serving on the public display", () => {
  const slots = buildPublicQueueView(
    [
      {
        orderId: "arrived-order",
        orderStatus: "checked_in",
        arrivedAt: "2026-03-18T12:05:00.000Z",
      },
      {
        orderId: "ready-order",
        orderStatus: "ready_for_pickup",
        arrivedAt: "2026-03-18T12:00:00.000Z",
      },
      {
        orderId: "prep-order",
        orderStatus: "express_ready",
        arrivedAt: "2026-03-18T12:01:00.000Z",
      },
    ],
    new Date("2026-03-18T12:10:00.000Z")
  );

  expect(slots[0].order.orderId).toBe("ready-order");
  expect(slots[1].order.orderId).toBe("arrived-order");
  expect(slots[2].order.orderId).toBe("prep-order");
});
