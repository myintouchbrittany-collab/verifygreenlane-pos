import {
  buildCompletedOrderLoyaltyProfile,
  buildDefaultLoyaltyProfile,
  getAvailableRewards,
  getNextReward,
  getPointsForSpend,
  getTierForSpend,
} from "./loyalty";

test("awards one point per dollar spent", () => {
  expect(getPointsForSpend(42.9)).toBe(42);
});

test("resolves tier from configurable total spend thresholds", () => {
  expect(getTierForSpend(0).name).toBe("Seed");
  expect(getTierForSpend(250).name).toBe("Bloom");
  expect(getTierForSpend(1250).name).toBe("Canopy");
});

test("returns unlocked rewards at or below the customer's point balance", () => {
  expect(getAvailableRewards(260).map((reward) => reward.title)).toEqual([
    "$5 Off",
    "$10 Off",
  ]);
});

test("builds a default loyalty profile for new customers", () => {
  expect(buildDefaultLoyaltyProfile()).toEqual({
    totalSpend: 0,
    loyaltyPoints: 0,
    availableRewards: [],
    tier: "Seed",
    visitCount: 0,
    lastPurchaseAt: "",
  });
});

test("updates spend, visits, points, and tier on completed checkout", () => {
  expect(
    buildCompletedOrderLoyaltyProfile(
      {
        totalSpend: 240,
        loyaltyPoints: 240,
        visitCount: 3,
      },
      {
        orderId: "order-1",
        total: 25,
      },
      {
        purchaseDate: "2026-03-23T16:30:00.000Z",
      }
    )
  ).toMatchObject({
    totalSpend: 265,
    loyaltyPoints: 265,
    tier: "Bloom",
    visitCount: 4,
    lastPurchaseAt: "2026-03-23T16:30:00.000Z",
    lastRewardedOrderId: "order-1",
  });
});

test("shows the next reward that has not been unlocked yet", () => {
  expect(getNextReward(110)).toMatchObject({
    title: "$10 Off",
    pointsRemaining: 140,
  });
});
