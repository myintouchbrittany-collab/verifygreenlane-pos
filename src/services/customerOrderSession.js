const LATEST_ORDER_ID_KEY = "greenlane.latestOrderId";
const LATEST_ORDER_SUMMARY_KEY = "greenlane.latestOrderSummary";

export function saveLatestCustomerOrderId(orderId) {
  if (!orderId || typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LATEST_ORDER_ID_KEY, orderId);
}

export function getLatestCustomerOrderId() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(LATEST_ORDER_ID_KEY) || "";
}

export function saveLatestCustomerOrderSummary(order) {
  if (!order || typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LATEST_ORDER_SUMMARY_KEY, JSON.stringify(order));
}

export function getLatestCustomerOrderSummary() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(LATEST_ORDER_SUMMARY_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    return null;
  }
}

export function saveCustomerOrderSnapshot(order) {
  if (!order?.orderId || typeof window === "undefined") {
    return;
  }

  saveLatestCustomerOrderId(order.orderId);
  saveLatestCustomerOrderSummary(order);
}

export function getCustomerOrderSnapshot(orderId) {
  if (!orderId || typeof window === "undefined") {
    return null;
  }

  const latestOrder = getLatestCustomerOrderSummary();
  if ((latestOrder?.orderId || latestOrder?.id) === orderId) {
    return latestOrder;
  }

  return null;
}
