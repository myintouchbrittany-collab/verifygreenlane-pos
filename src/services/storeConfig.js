export const DEFAULT_STORE_ID = "greenlane-main";
export const DEFAULT_STORE_NAME = "Greenlane Main";
export const STORE_PICKUP_CONFIG = {
  daysAhead: 7,
  slotIntervalMinutes: 30,
  maxOrdersPerSlot: 4,
  weeklyHours: {
    0: { open: "10:00", close: "18:00" },
    1: { open: "09:00", close: "20:00" },
    2: { open: "09:00", close: "20:00" },
    3: { open: "09:00", close: "20:00" },
    4: { open: "09:00", close: "20:00" },
    5: { open: "09:00", close: "21:00" },
    6: { open: "09:00", close: "21:00" },
  },
};

export const STORE_LOYALTY_CONFIG = {
  pointsPerDollar: 1,
  rewardThresholds: [
    {
      id: "five-off",
      title: "$5 Off",
      pointsCost: 100,
      description: "Use on a future preorder or pickup.",
    },
    {
      id: "ten-off",
      title: "$10 Off",
      pointsCost: 250,
      description: "Best for larger express pickups.",
    },
    {
      id: "vip-pre-roll",
      title: "Free Pre-Roll",
      pointsCost: 400,
      description: "Ask staff about this member-only reward.",
    },
  ],
  tiers: [
    {
      id: "seed",
      name: "Seed",
      minTotalSpend: 0,
    },
    {
      id: "bloom",
      name: "Bloom",
      minTotalSpend: 250,
    },
    {
      id: "evergreen",
      name: "Evergreen",
      minTotalSpend: 600,
    },
    {
      id: "canopy",
      name: "Canopy",
      minTotalSpend: 1200,
    },
  ],
};

export function getStoreLoyaltyConfig() {
  return STORE_LOYALTY_CONFIG;
}

export function matchesActiveStore(record, storeId = DEFAULT_STORE_ID) {
  if (!record) {
    return false;
  }

  return !record.storeId || record.storeId === storeId;
}
