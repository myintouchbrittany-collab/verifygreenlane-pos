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

export function matchesActiveStore(record, storeId = DEFAULT_STORE_ID) {
  if (!record) {
    return false;
  }

  return !record.storeId || record.storeId === storeId;
}
