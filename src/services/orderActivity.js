import { formatStatusLabel } from "./orderUtils";

function parseTimestamp(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value?.toDate === "function") {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  return null;
}

function toIso(value) {
  const parsed = parseTimestamp(value);
  return parsed ? parsed.toISOString() : "";
}

export function formatActivityTime(value) {
  const parsed = parseTimestamp(value);

  if (!parsed) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

export function buildActivityEntry(type, timestamp, performedBy, details = "") {
  return {
    id: `${type}-${timestamp || Date.now()}`,
    type,
    timestamp: timestamp || new Date().toISOString(),
    performedBy: performedBy || "",
    details,
  };
}

export function getActivityEntryLabel(type) {
  const labels = {
    created: "Order created",
    verification_updated: "Verification updated",
    customer_arrived: "Customer arrived",
    prep_started: "Prep started",
    marked_ready: "Marked ready",
    checkout_completed: "Checkout completed",
    status_updated: "Status updated",
  };

  return labels[type] || formatStatusLabel(type || "status_updated");
}

export function getActivityTypeFromUpdates(updates) {
  const orderStatus = updates?.orderStatus || updates?.status || "";
  const verificationStatus =
    updates?.verificationStatus || updates?.idVerificationStatus || "";

  if (verificationStatus) {
    return "verification_updated";
  }

  if (orderStatus === "checked_in") {
    return "customer_arrived";
  }

  if (orderStatus === "express_ready") {
    return "prep_started";
  }

  if (orderStatus === "ready_for_pickup") {
    return "marked_ready";
  }

  if (orderStatus === "completed") {
    return "checkout_completed";
  }

  if (orderStatus) {
    return "status_updated";
  }

  return "";
}

export function buildActivityDetailsFromUpdates(updates) {
  const parts = [];

  if (updates?.verificationStatus || updates?.idVerificationStatus) {
    parts.push(
      `Verification ${formatStatusLabel(
        updates.verificationStatus || updates.idVerificationStatus
      )}`
    );
  }

  if (updates?.orderStatus || updates?.status) {
    parts.push(`Status ${formatStatusLabel(updates.orderStatus || updates.status)}`);
  }

  if (updates?.parkingSpot) {
    parts.push(`Spot ${updates.parkingSpot}`);
  }

  if (updates?.vehicleColor) {
    parts.push(`Vehicle ${updates.vehicleColor}`);
  }

  return parts.join(" | ");
}

export function getOrderActivityTimeline(order) {
  const storedEntries = Array.isArray(order?.activityLog)
    ? order.activityLog
        .map((entry) => ({
          id: entry.id || `${entry.type}-${entry.timestamp}`,
          type: entry.type || "status_updated",
          timestamp: toIso(entry.timestamp),
          performedBy: entry.performedBy || "",
          details: entry.details || "",
        }))
        .filter((entry) => entry.timestamp)
    : [];

  const fallbackEntries = [
    order?.createdAt
      ? buildActivityEntry("created", toIso(order.createdAt), order?.createdBy, "")
      : null,
    order?.arrivedAt || order?.checkedInAt
      ? buildActivityEntry(
          "customer_arrived",
          toIso(order.arrivedAt || order.checkedInAt),
          order?.arrivedBy,
          [order?.parkingSpot ? `Spot ${order.parkingSpot}` : "", order?.vehicleColor ? `Vehicle ${order.vehicleColor}` : ""]
            .filter(Boolean)
            .join(" | ")
        )
      : null,
    order?.readyAt
      ? buildActivityEntry("marked_ready", toIso(order.readyAt), order?.readyBy, "")
      : null,
    order?.completedAt
      ? buildActivityEntry(
          "checkout_completed",
          toIso(order.completedAt),
          order?.completedBy,
          ""
        )
      : null,
  ].filter(Boolean);

  const mergedEntries = [...storedEntries];

  fallbackEntries.forEach((entry) => {
    const exists = mergedEntries.some(
      (current) => current.type === entry.type && current.timestamp === entry.timestamp
    );

    if (!exists) {
      mergedEntries.push(entry);
    }
  });

  return mergedEntries.sort(
    (left, right) => new Date(left.timestamp || 0) - new Date(right.timestamp || 0)
  );
}
