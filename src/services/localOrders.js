const LOCAL_ORDERS_KEY = "greenlane.localOrders";
export const ORDERS_QUEUE_UPDATED_EVENT = "ordersQueueUpdated";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeParse(rawValue, fallbackValue) {
  if (!rawValue) {
    return fallbackValue;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    console.error("Failed to parse local order data:", error);
    return fallbackValue;
  }
}

function normalizeValue(value, fallback) {
  const normalizedValue = `${value || fallback || ""}`
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (!normalizedValue) {
    return fallback;
  }

  if (normalizedValue === "ready_for_pickup") {
    return "ready";
  }

  if (normalizedValue === "pending_review") {
    return "pending_verification";
  }

  return normalizedValue;
}

export function normalizeStoredOrder(order) {
  if (!order || typeof order !== "object") {
    return null;
  }

  const items = Array.isArray(order.items)
    ? order.items
    : Array.isArray(order.orderItems)
      ? order.orderItems
      : [];
  const orderId = order.id || order.orderId || `GLV-${Date.now()}`;
  const orderStatus = normalizeValue(
    order.orderStatus || order.status,
    "pending_verification"
  );
  const verificationStatus = normalizeValue(
    order.verificationStatus || order.idVerificationStatus || (order.idVerified ? "verified" : "pending"),
    "pending"
  );
  const checkInStatus = normalizeValue(
    order.checkInStatus || (order.checkedIn ? "checked_in" : "not_arrived"),
    "not_arrived"
  );
  const pickupCode =
    order.pickupCode || `GLV-${String(orderId).replace(/\D/g, "").slice(-4).padStart(4, "0")}`;
  const createdAt = order.createdAt || new Date().toISOString();
  const total =
    typeof order.total === "number"
      ? order.total
      : items.reduce(
          (sum, item) =>
            sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
          0
        );

  return {
    ...order,
    id: orderId,
    orderId,
    orderNumber: order.orderNumber || order.order || orderId,
    order: order.orderNumber || order.order || orderId,
    customerName: order.customerName || order.name || "Unknown Customer",
    name: order.customerName || order.name || "Unknown Customer",
    items,
    orderItems: items,
    itemCount: items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0),
      0
    ),
    total,
    orderStatus,
    status: orderStatus,
    verificationStatus,
    idVerificationStatus: verificationStatus,
    checkInStatus,
    checkedIn: checkInStatus === "checked_in",
    pickupCode,
    pickupWindow:
      order.pickupWindow ||
      [order.pickupDate, order.pickupTime].filter(Boolean).join(" ") ||
      "",
    createdAt,
    completedAt: order.completedAt || "",
  };
}

export function getOrdersQueue() {
  if (!canUseStorage()) {
    return [];
  }

  const parsedOrders = safeParse(window.localStorage.getItem(LOCAL_ORDERS_KEY), []);
  if (!Array.isArray(parsedOrders)) {
    return [];
  }

  return parsedOrders
    .map(normalizeStoredOrder)
    .filter(Boolean)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
}

export function getActiveOrdersQueue() {
  return getOrdersQueue().filter((order) =>
    ["pending_verification", "approved", "preparing", "ready"].includes(
      order.orderStatus
    )
  );
}

export function getLatestOrder() {
  return getOrdersQueue()[0] || null;
}

export function getOrderById(orderId) {
  return getOrdersQueue().find((order) => order.id === orderId) || null;
}

export function saveOrderToQueue(order) {
  if (!canUseStorage()) {
    throw new Error("Local storage is not available.");
  }

  const normalizedOrder = normalizeStoredOrder(order);
  const nextOrders = [
    normalizedOrder,
    ...getOrdersQueue().filter((entry) => entry.id !== normalizedOrder.id),
  ];

  window.localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(nextOrders));
  window.dispatchEvent(new Event(ORDERS_QUEUE_UPDATED_EVENT));
  return normalizedOrder;
}

export function updateStoredOrder(orderId, updates) {
  if (!canUseStorage()) {
    throw new Error("Local storage is not available.");
  }

  const existingOrder = getOrderById(orderId);
  if (!existingOrder) {
    throw new Error("Order not found.");
  }

  return saveOrderToQueue({
    ...existingOrder,
    ...updates,
    id: existingOrder.id,
    orderId: existingOrder.orderId,
  });
}

export function subscribeLocalOrders(listener) {
  const notify = () => {
    listener(getOrdersQueue());
  };

  notify();

  if (!canUseStorage()) {
    return () => {};
  }

  window.addEventListener("storage", notify);
  window.addEventListener(ORDERS_QUEUE_UPDATED_EVENT, notify);

  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(ORDERS_QUEUE_UPDATED_EVENT, notify);
  };
}

export function findLocalOrder(rawValue) {
  const trimmedValue = rawValue?.trim();
  if (!trimmedValue) {
    return null;
  }

  return (
    getOrdersQueue().find((order) => order.pickupCode === trimmedValue) ||
    getOrdersQueue().find((order) => order.orderNumber === trimmedValue) ||
    getOrdersQueue().find((order) => order.orderId === trimmedValue) ||
    null
  );
}
