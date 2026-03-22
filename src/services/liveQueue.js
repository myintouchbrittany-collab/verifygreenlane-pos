import { buildPickupCode, formatStatusLabel } from "./orderUtils";
import { getNormalizedWorkflowState } from "./orderService";

export const WARNING_WAIT_MINUTES = 5;
export const OVERDUE_WAIT_MINUTES = 10;

const QUEUE_STATUS_LABELS = {
  pending: "Pending",
  verified: "Verified",
  arrived: "Arrived",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
};

function parseTimestamp(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export function getQueueStatus(order) {
  const { orderStatus } = getNormalizedWorkflowState(order);

  if (orderStatus === "pending_review") {
    return "pending";
  }

  if (orderStatus === "approved") {
    return "verified";
  }

  if (orderStatus === "checked_in") {
    return "arrived";
  }

  if (orderStatus === "express_ready") {
    return "preparing";
  }

  if (orderStatus === "ready_for_pickup") {
    return "ready";
  }

  if (orderStatus === "completed") {
    return "completed";
  }

  return "pending";
}

export function getQueueStatusLabel(order) {
  return QUEUE_STATUS_LABELS[getQueueStatus(order)] || "Pending";
}

export function getVerificationLabel(order) {
  const { verificationStatus } = getNormalizedWorkflowState(order);

  if (verificationStatus === "rejected") {
    return "Issue";
  }

  return formatStatusLabel(verificationStatus);
}

export function getArrivalLabel(order) {
  const queueStatus = getQueueStatus(order);

  if (queueStatus === "arrived" || queueStatus === "preparing" || queueStatus === "ready") {
    return "Arrived";
  }

  return "Not Arrived";
}

export function getWaitStartedAt(order) {
  const queueStatus = getQueueStatus(order);

  if (queueStatus === "arrived" || queueStatus === "preparing" || queueStatus === "ready") {
    return (
      parseTimestamp(order?.arrivedAt) ||
      parseTimestamp(order?.checkedInAt) ||
      null
    );
  }

  return null;
}

export function getWaitTimeMinutes(order, now = new Date()) {
  const startedAt = getWaitStartedAt(order);
  if (!startedAt) {
    return null;
  }

  const minutes = Math.max(
    0,
    Math.round((now.getTime() - startedAt.getTime()) / 60000)
  );

  return Number.isFinite(minutes) ? minutes : 0;
}

export function formatWaitTime(order, now = new Date()) {
  const totalMinutes = getWaitTimeMinutes(order, now);
  if (totalMinutes === null) {
    return "--";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

export function getWaitUrgency(order, now = new Date()) {
  const totalMinutes = getWaitTimeMinutes(order, now);
  if (totalMinutes === null) {
    return "idle";
  }

  if (totalMinutes >= OVERDUE_WAIT_MINUTES) {
    return "overdue";
  }

  if (totalMinutes >= WARNING_WAIT_MINUTES) {
    return "warning";
  }

  return "fresh";
}

export function getNextBestActionLabel(order, now = new Date()) {
  const queueStatus = getQueueStatus(order);
  const waitUrgency = getWaitUrgency(order, now);

  if (waitUrgency === "overdue") {
    return "Priority";
  }

  if (queueStatus === "verified") {
    return "Waiting for customer";
  }

  if (queueStatus === "arrived") {
    return "Start Prep";
  }

  if (queueStatus === "preparing") {
    return "Continue Prep";
  }

  if (queueStatus === "ready") {
    return "Call Customer";
  }

  if (queueStatus === "pending") {
    return "Verify ID";
  }

  return "Completed";
}

export function getNextQueueAction(order) {
  const queueStatus = getQueueStatus(order);

  if (queueStatus === "pending") {
    return {
      id: "verify",
      label: "Verify ID",
      updates: {
        verificationStatus: "verified",
        idVerificationStatus: "verified",
        orderStatus: "approved",
        status: "approved",
        expressEligible: true,
        pickupCode:
          order?.pickupCode ||
          buildPickupCode({
            customerId: order?.customerId || "",
            orderNumber: order?.orderNumber || order?.order || "",
          }),
        pickupStatus: "Approved",
      },
    };
  }

  if (queueStatus === "verified") {
    const now = new Date();

    return {
      id: "arrive",
      label: "Mark Arrived",
      updates: {
        orderStatus: "checked_in",
        status: "checked_in",
        checkInStatus: "checked_in",
        checkedIn: true,
        arrivedAt: now.toISOString(),
        checkedInAt: now.toISOString(),
        arrivalTime: now.toLocaleTimeString(),
        pickupStatus: "Checked In",
      },
    };
  }

  if (queueStatus === "arrived") {
    return {
      id: "prep",
      label: "Start Prep",
      updates: {
        orderStatus: "express_ready",
        status: "express_ready",
        pickupStatus: "Preparing",
      },
    };
  }

  if (queueStatus === "preparing") {
    return {
      id: "ready",
      label: "Mark Ready",
      updates: {
        orderStatus: "ready_for_pickup",
        status: "ready_for_pickup",
        readyAt: new Date().toISOString(),
        pickupStatus: "Ready for Pickup",
      },
    };
  }

  if (queueStatus === "ready") {
    const now = new Date();

    return {
      id: "checkout",
      label: "Checkout",
      updates: {
        orderStatus: "completed",
        status: "completed",
        pickupStatus: "Completed",
        checkoutTime: now.toLocaleTimeString(),
        completedAt: now.toISOString(),
      },
    };
  }

  return null;
}

export function buildQueueSummary(orders, now = new Date()) {
  const waitingOrders = orders.filter((order) => {
    const queueStatus = getQueueStatus(order);
    return queueStatus === "arrived" || queueStatus === "preparing" || queueStatus === "ready";
  });
  const totalWaitMinutes = waitingOrders.reduce(
    (sum, order) => sum + getWaitTimeMinutes(order, now),
    0
  );
  const verificationIssues = orders.filter((order) => {
    const { verificationStatus } = getNormalizedWorkflowState(order);
    return verificationStatus !== "verified";
  }).length;

  return {
    waitingNow: waitingOrders.length,
    avgWaitTimeMinutes:
      waitingOrders.length > 0
        ? Math.round(totalWaitMinutes / waitingOrders.length)
        : 0,
    readyForPickup: orders.filter((order) => getQueueStatus(order) === "ready").length,
    verificationIssues,
  };
}

export function sortQueueOrders(orders, now = new Date()) {
  const urgencyRank = {
    overdue: 0,
    warning: 1,
    fresh: 2,
    idle: 3,
  };
  const statusRank = {
    arrived: 0,
    ready: 1,
    preparing: 2,
    pending: 3,
    verified: 4,
    completed: 5,
  };

  return [...orders].sort((left, right) => {
    const urgencyDelta =
      urgencyRank[getWaitUrgency(left, now)] - urgencyRank[getWaitUrgency(right, now)];

    if (urgencyDelta !== 0) {
      return urgencyDelta;
    }

    const statusDelta =
      statusRank[getQueueStatus(left)] - statusRank[getQueueStatus(right)];

    if (statusDelta !== 0) {
      return statusDelta;
    }

    return getWaitTimeMinutes(right, now) - getWaitTimeMinutes(left, now);
  });
}
