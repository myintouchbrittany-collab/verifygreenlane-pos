import { STORE_PICKUP_CONFIG } from "./storeConfig";

const SLOT_CONSUMING_STATUSES = new Set([
  "pending_review",
  "approved",
  "express_ready",
  "checked_in",
  "ready_for_pickup",
]);

function pad(value) {
  return value.toString().padStart(2, "0");
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function parseTimeParts(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return {
    hours: Number.isFinite(hours) ? hours : 0,
    minutes: Number.isFinite(minutes) ? minutes : 0,
  };
}

function setTimeForDate(date, value) {
  const nextDate = new Date(date);
  const { hours, minutes } = parseTimeParts(value);
  nextDate.setHours(hours, minutes, 0, 0);
  return nextDate;
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatTimeLabel(date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDateLabel(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function buildSlotKey(date, timeValue) {
  return `${formatDateKey(date)}|${timeValue}`;
}

function roundUpToInterval(date, intervalMinutes) {
  const nextDate = new Date(date);
  nextDate.setSeconds(0, 0);
  const minutes = nextDate.getMinutes();
  const remainder = minutes % intervalMinutes;

  if (remainder !== 0) {
    nextDate.setMinutes(minutes + (intervalMinutes - remainder));
  }

  return nextDate;
}

function getSlotUsageMap(orders) {
  return orders.reduce((usageMap, order) => {
    const status = order?.orderStatus || order?.status || "";
    const slotKey = order?.pickupSlotKey;

    if (!slotKey || !SLOT_CONSUMING_STATUSES.has(status)) {
      return usageMap;
    }

    usageMap.set(slotKey, (usageMap.get(slotKey) || 0) + 1);
    return usageMap;
  }, new Map());
}

export function buildPickupAvailability(
  orders = [],
  now = new Date(),
  config = STORE_PICKUP_CONFIG
) {
  const slotUsage = getSlotUsageMap(orders);
  const days = [];
  const currentDay = startOfDay(now);

  for (let dayOffset = 0; dayOffset < config.daysAhead; dayOffset += 1) {
    const date = new Date(currentDay);
    date.setDate(currentDay.getDate() + dayOffset);

    const dayHours = config.weeklyHours[date.getDay()];
    if (!dayHours?.open || !dayHours?.close) {
      continue;
    }

    const openDate = setTimeForDate(date, dayHours.open);
    const closeDate = setTimeForDate(date, dayHours.close);
    const firstEligible =
      dayOffset === 0
        ? new Date(Math.max(openDate.getTime(), roundUpToInterval(now, config.slotIntervalMinutes).getTime()))
        : openDate;

    const slots = [];

    for (
      let slotStart = new Date(firstEligible);
      slotStart < closeDate;
      slotStart = addMinutes(slotStart, config.slotIntervalMinutes)
    ) {
      const slotEnd = addMinutes(slotStart, config.slotIntervalMinutes);
      if (slotEnd > closeDate || slotStart < now) {
        continue;
      }

      const timeValue = `${pad(slotStart.getHours())}:${pad(slotStart.getMinutes())}`;
      const slotKey = buildSlotKey(date, timeValue);
      const used = slotUsage.get(slotKey) || 0;
      const remainingCapacity = Math.max(config.maxOrdersPerSlot - used, 0);

      if (remainingCapacity <= 0) {
        continue;
      }

      slots.push({
        slotKey,
        dateKey: formatDateKey(date),
        timeValue,
        label: `${formatTimeLabel(slotStart)} - ${formatTimeLabel(slotEnd)}`,
        pickupWindow: `${formatDateLabel(date)} ${formatTimeLabel(slotStart)} - ${formatTimeLabel(slotEnd)}`,
        startIso: slotStart.toISOString(),
        endIso: slotEnd.toISOString(),
        remainingCapacity,
      });
    }

    if (slots.length) {
      days.push({
        dateKey: formatDateKey(date),
        label: formatDateLabel(date),
        slots,
      });
    }
  }

  return days;
}

export function findPickupSlot(availability, slotKey) {
  for (const day of availability) {
    const matchingSlot = day.slots.find((slot) => slot.slotKey === slotKey);
    if (matchingSlot) {
      return matchingSlot;
    }
  }

  return null;
}
