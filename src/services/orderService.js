import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { DEFAULT_STORE_ID, matchesActiveStore } from "./storeConfig";
import { buildOrderNumber, buildPickupCode, parsePickupCode } from "./orderUtils";
import { prepareFirestorePayload } from "./firestoreUtils";
import {
  buildActivityDetailsFromUpdates,
  buildActivityEntry,
  getActivityTypeFromUpdates,
} from "./orderActivity";
import {
  createCustomerRecord,
  syncCustomerOrderSummary,
  updateCustomerRecord,
} from "./customerService";

export const ACTIVE_ORDER_STATUSES = [
  "pending_review",
  "approved",
  "express_ready",
  "checked_in",
  "ready_for_pickup",
];

function normalizeText(value, fallback) {
  const normalizedValue = `${value || fallback || ""}`
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  return normalizedValue || fallback;
}

function normalizeOrderStatus(value, fallback = "pending_review") {
  const normalizedValue = normalizeText(value, fallback);

  if (normalizedValue === "pending") {
    return "pending_review";
  }

  if (normalizedValue === "pending_verification") {
    return "pending_review";
  }

  if (normalizedValue === "verified") {
    return "approved";
  }

  if (normalizedValue === "ready") {
    return "ready_for_pickup";
  }

  if (normalizedValue === "preparing") {
    return "express_ready";
  }

  return normalizedValue;
}

function normalizeVerificationStatus(value, fallback = "pending") {
  const normalizedValue = normalizeText(value, fallback);

  if (
    normalizedValue === "pending_review" ||
    normalizedValue === "pending_verification"
  ) {
    return "pending";
  }

  if (normalizedValue === "approved") {
    return "verified";
  }

  return normalizedValue;
}

function normalizeCheckInStatus(value, fallback = "not_arrived") {
  const normalizedValue = normalizeText(value, fallback);

  if (normalizedValue === "not_checked_in") {
    return "not_arrived";
  }

  return normalizedValue;
}

function toIsoString(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value?.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return "";
}

export function getNormalizedWorkflowState(order) {
  return {
    verificationStatus: normalizeVerificationStatus(
      order?.verificationStatus || order?.idVerificationStatus,
      "pending"
    ),
    orderStatus: normalizeOrderStatus(order?.orderStatus || order?.status, "pending_review"),
    checkInStatus: normalizeCheckInStatus(order?.checkInStatus, "not_arrived"),
  };
}

export function normalizeOrderRecord(id, data) {
  if (!data || typeof data !== "object") {
    return null;
  }

  const items = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.orderItems)
      ? data.orderItems
      : [];
  const orderId = id || data.orderId || data.id;
  const orderNumber = data.orderNumber || data.order || orderId || buildOrderNumber();
  const orderStatus = normalizeOrderStatus(data.orderStatus || data.status, "pending_review");
  const verificationStatus = normalizeVerificationStatus(
    data.verificationStatus ||
      data.idVerificationStatus ||
      (data.idVerified ? "verified" : "pending"),
    "pending"
  );
  const checkInStatus = normalizeCheckInStatus(
    data.checkInStatus || (data.checkedIn ? "checked_in" : "not_arrived"),
    "not_arrived"
  );
  const subtotal =
    typeof data.subtotal === "number"
      ? data.subtotal
      : items.reduce(
          (sum, item) =>
            sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
          0
        );
  const total = typeof data.total === "number" ? data.total : subtotal;
  const pickupCode =
    data.pickupCode ||
    buildPickupCode({
      customerId: data.customerId || "",
      orderNumber,
    });

  return {
    ...data,
    id: orderId,
    orderId,
    orderNumber,
    order: orderNumber,
    customerName: data.customerName || data.name || "Unknown Customer",
    name: data.customerName || data.name || "Unknown Customer",
    items,
    orderItems: items,
    subtotal,
    total,
    itemCount: items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    storeId: data.storeId || DEFAULT_STORE_ID,
    source: data.source || "Customer Preorder",
    orderStatus,
    status: orderStatus,
    verificationStatus,
    idVerificationStatus: verificationStatus,
    checkInStatus,
    checkedIn: checkInStatus === "checked_in",
    pickupCode,
    pickupWindow:
      data.pickupWindow ||
      [data.pickupDate, data.pickupTime].filter(Boolean).join(" ") ||
      "",
    createdAt: toIsoString(data.createdAt) || new Date().toISOString(),
    updatedAt: toIsoString(data.updatedAt),
    arrivedAt: toIsoString(data.arrivedAt),
    checkedInAt: toIsoString(data.checkedInAt),
    readyAt: toIsoString(data.readyAt),
    activityLog: Array.isArray(data.activityLog) ? data.activityLog : [],
    completedAt: toIsoString(data.completedAt),
  };
}

function sortOrders(orders) {
  return [...orders].sort(
    (left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0)
  );
}

export function subscribeOrders(callback, storeId = DEFAULT_STORE_ID) {
  return onSnapshot(collection(db, "orders"), (snapshot) => {
    const records = sortOrders(
      snapshot.docs
        .map((entry) => normalizeOrderRecord(entry.id, entry.data()))
        .filter(Boolean)
        .filter((entry) => matchesActiveStore(entry, storeId))
    );

    callback(records);
  });
}

export function subscribeOrderDetail(orderId, callback) {
  if (!orderId) {
    callback(null);
    return () => {};
  }

  return onSnapshot(doc(db, "orders", orderId), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    callback(normalizeOrderRecord(snapshot.id, snapshot.data()));
  });
}

export function mergeOrdersWithCustomers(orders) {
  return sortOrders(
    orders
      .map((order) => normalizeOrderRecord(order.orderId || order.id, order))
      .filter(Boolean)
  );
}

export async function createPreorder({
  customerName,
  phoneNumber,
  items,
  total,
  subtotal,
  discount,
  pickupDate,
  pickupTime,
  pickupSlotKey,
  pickupSlotLabel,
  pickupWindow,
  notes,
  frontIdFileName,
  backIdFileName,
  idUploadComplete,
  source = "Customer Preorder",
  storeId = DEFAULT_STORE_ID,
}) {
  const customerRef = doc(collection(db, "customers"));
  const orderRef = doc(collection(db, "orders"));
  const orderNumber = buildOrderNumber();
  const pickupCode = buildPickupCode({
    customerId: customerRef.id,
    orderNumber,
  });
  const orderPayload = normalizeOrderRecord(orderRef.id, {
    customerId: customerRef.id,
    customerName,
    phoneNumber,
    items,
    orderItems: items,
    subtotal,
    discount,
    total,
    pickupDate,
    pickupTime,
    pickupSlotKey,
    pickupSlotLabel,
    pickupWindow,
    notes,
    frontIdFileName,
    backIdFileName,
    idUploadComplete,
    orderNumber,
    orderStatus: "pending_review",
    verificationStatus: "pending",
    checkInStatus: "not_arrived",
    pickupStatus: "Pending Review",
    source,
    storeId,
    pickupCode,
  });

  await createCustomerRecord({
    customerId: customerRef.id,
    storeId,
    customerName,
    phoneNumber,
    idUploadComplete,
    frontIdFileName,
    backIdFileName,
    orderId: orderRef.id,
    orderNumber,
    pickupDate,
    pickupTime,
    pickupSlotKey,
    pickupSlotLabel,
    pickupWindow,
    pickupCode,
    verificationStatus: "pending",
    orderStatus: "pending_review",
    source,
  });

  await setDoc(
    orderRef,
    prepareFirestorePayload({
      ...orderPayload,
      activityLog: [
        buildActivityEntry("created", new Date().toISOString(), "", "Order submitted"),
      ],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      completedAt: null,
    }, { defaultVerificationStatus: "pending" }),
    { merge: true }
  );

  return {
    ...orderPayload,
    createdAt: new Date().toISOString(),
  };
}

export async function updateOrderWorkflow(orderId, customerId, updates) {
  const { performedBy, ...restUpdates } = updates || {};
  const normalizedUpdates = {
    ...restUpdates,
    updatedAt: serverTimestamp(),
  };

  if (
    restUpdates.verificationStatus !== undefined ||
    restUpdates.idVerificationStatus !== undefined
  ) {
    const verificationStatus = normalizeVerificationStatus(
      restUpdates.verificationStatus || restUpdates.idVerificationStatus,
      "pending"
    );
    normalizedUpdates.verificationStatus = verificationStatus;
    normalizedUpdates.idVerificationStatus = verificationStatus;
  }

  if (restUpdates.orderStatus !== undefined || restUpdates.status !== undefined) {
    const orderStatus = normalizeOrderStatus(
      restUpdates.orderStatus || restUpdates.status,
      "pending_review"
    );
    normalizedUpdates.orderStatus = orderStatus;
    normalizedUpdates.status = orderStatus;
  }

  if (restUpdates.checkInStatus !== undefined || restUpdates.checkedIn !== undefined) {
    const checkInStatus = normalizeCheckInStatus(
      restUpdates.checkInStatus || (restUpdates.checkedIn ? "checked_in" : "not_arrived"),
      "not_arrived"
    );
    normalizedUpdates.checkInStatus = checkInStatus;
    normalizedUpdates.checkedIn = checkInStatus === "checked_in";
  }

  if (
    normalizedUpdates.orderStatus === "completed" &&
    restUpdates.completedAt === undefined
  ) {
    normalizedUpdates.completedAt = serverTimestamp();
  }

  const activityType = getActivityTypeFromUpdates(restUpdates);

  if (activityType) {
    normalizedUpdates.activityLog = arrayUnion(
      buildActivityEntry(
        activityType,
        new Date().toISOString(),
        performedBy,
        buildActivityDetailsFromUpdates(restUpdates)
      )
    );
  }

  const orderWritePayload = prepareFirestorePayload(normalizedUpdates);

  await updateDoc(doc(db, "orders", orderId), orderWritePayload);

  if (customerId) {
    const { activityLog, ...customerUpdates } = normalizedUpdates;

    await updateCustomerRecord(customerId, customerUpdates);
    await syncCustomerOrderSummary(customerId, prepareFirestorePayload({
      orderId,
      orderStatus: normalizedUpdates.orderStatus,
      verificationStatus: normalizedUpdates.verificationStatus,
      checkInStatus: normalizedUpdates.checkInStatus,
      pickupCode: normalizedUpdates.pickupCode,
      completedAt: normalizedUpdates.completedAt,
      arrivalTime: normalizedUpdates.arrivalTime,
      checkoutTime: normalizedUpdates.checkoutTime,
      pickupStatus: normalizedUpdates.pickupStatus,
    }));
  }

  return normalizedUpdates;
}

export function getOrderWorkflowLabel(order) {
  const { orderStatus } = getNormalizedWorkflowState(order);

  if (orderStatus === "pending_review") {
    return "Pending Review";
  }

  if (orderStatus === "express_ready") {
    return "Preparing";
  }

  return orderStatus
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getCustomerVerificationLabel(order) {
  return getCustomerStatusPresentation(order).helperText;
}

export function getCustomerQueueStatus(order) {
  if (!order) {
    return "pending";
  }

  const { orderStatus, verificationStatus } = getNormalizedWorkflowState(order);

  if (orderStatus === "completed") {
    return "completed";
  }

  if (orderStatus === "ready_for_pickup") {
    return "ready";
  }

  if (orderStatus === "express_ready") {
    return "preparing";
  }

  if (orderStatus === "checked_in") {
    return "arrived";
  }

  if (verificationStatus === "verified") {
    return "verified";
  }

  return "pending";
}

export function getCustomerStatusPresentation(order) {
  const queueStatus = getCustomerQueueStatus(order);

  if (queueStatus === "completed") {
    return {
      state: "completed",
      headline: "Your order is completed.",
      statusLabel: "Completed",
      helperText: "This order has been picked up and closed.",
      bodyMessage: "This preorder has been completed.",
    };
  }

  if (queueStatus === "ready") {
    return {
      state: "ready",
      headline: "Your order is ready for pickup.",
      statusLabel: "Ready",
      helperText: "Head to the dispensary when you are ready to pick up.",
      bodyMessage: "Your order is ready for pickup.",
    };
  }

  if (queueStatus === "preparing") {
    return {
      state: "preparing",
      headline: "Your order is being prepared.",
      statusLabel: "Preparing",
      helperText: "Staff is actively getting your pickup ready.",
      bodyMessage: "Staff is preparing your order now.",
    };
  }

  if (queueStatus === "arrived") {
    return {
      state: "arrived",
      headline: "You are checked in.",
      statusLabel: "Arrived",
      helperText: "Staff can see that you are on site and will call your order next.",
      bodyMessage: "You are checked in. Staff is preparing your order.",
    };
  }

  if (queueStatus === "verified") {
    return {
      state: "verified",
      headline: "Your order is approved for pickup.",
      statusLabel: "Verified",
      helperText: "Your ID has been approved and your pickup code is active.",
      bodyMessage: "Your ID has been approved. Your pickup code is ready.",
    };
  }

  return {
    state: "pending",
    headline: "Your preorder is pending review.",
    statusLabel: "Pending",
    helperText: "We are still reviewing your order and ID information.",
    bodyMessage: "Your preorder is waiting for verification.",
  };
}

export function getCustomerProgressSteps(order) {
  const currentState = getCustomerStatusPresentation(order).state;
  const stepOrder = ["pending", "verified", "arrived", "preparing", "ready", "completed"];
  const currentIndex = stepOrder.indexOf(currentState);

  return [
    {
      id: "pending",
      label: "Order Placed",
      caption: "Submitted for review",
    },
    {
      id: "verified",
      label: "Verified",
      caption: "Approved for pickup",
    },
    {
      id: "arrived",
      label: "Arrived",
      caption: "Checked in on site",
    },
    {
      id: "preparing",
      label: "Preparing",
      caption: "Team is packing it up",
    },
    {
      id: "ready",
      label: "Ready",
      caption: "Waiting for handoff",
    },
    {
      id: "completed",
      label: "Completed",
      caption: "Pickup finished",
    },
  ].map((step, index) => ({
    ...step,
    status:
      index < currentIndex
        ? "complete"
        : index === currentIndex
          ? "current"
          : "upcoming",
  }));
}

export function getCustomerOrderStatusLabel(order) {
  return getCustomerStatusPresentation(order).statusLabel;
}

export function getCustomerStatusMessage(order) {
  return getCustomerStatusPresentation(order).bodyMessage;
}

export function canGeneratePickupCode(order) {
  const { verificationStatus } = getNormalizedWorkflowState(order);
  return verificationStatus === "verified" && Boolean(order?.pickupCode);
}

export function canCustomerCheckIn(order) {
  if (!order) {
    return false;
  }

  const { orderStatus, verificationStatus } = getNormalizedWorkflowState(order);

  if (verificationStatus !== "verified") {
    return false;
  }

  return (
    orderStatus === "approved" ||
    orderStatus === "checked_in" ||
    orderStatus === "express_ready" ||
    orderStatus === "ready_for_pickup"
  );
}

export function getCustomerCheckInValidationMessage(order) {
  if (!order) {
    return "No preorder matched this pickup code. Use a pickup code, QR code, or order number.";
  }

  const { orderStatus, verificationStatus } = getNormalizedWorkflowState(order);

  if (orderStatus === "completed") {
    return "This preorder has already been completed.";
  }

  if (verificationStatus !== "verified") {
    return "This preorder is not approved for pickup yet.";
  }

  return "";
}

export function isActiveOrder(order) {
  const { orderStatus } = getNormalizedWorkflowState(order);
  return ACTIVE_ORDER_STATUSES.includes(orderStatus);
}

export function isReviewQueueOrder(order) {
  const { verificationStatus, orderStatus } = getNormalizedWorkflowState(order);
  return verificationStatus === "pending" || orderStatus === "pending_review";
}

export function isCheckInQueueOrder(order) {
  const { verificationStatus, checkInStatus } = getNormalizedWorkflowState(order);
  return verificationStatus === "verified" && checkInStatus === "not_arrived";
}

export function isCheckoutQueueOrder(order) {
  const { orderStatus } = getNormalizedWorkflowState(order);
  return orderStatus === "ready_for_pickup";
}

export function isCompletedOrder(order) {
  const { orderStatus } = getNormalizedWorkflowState(order);
  return orderStatus === "completed";
}

export function canEnterExpressPickup(order) {
  const { verificationStatus } = getNormalizedWorkflowState(order);
  return verificationStatus === "verified";
}

export async function approvePreorder(order) {
  const pickupCode =
    order.pickupCode ||
    buildPickupCode({
      customerId: order.customerId,
      orderNumber: order.orderNumber || order.order,
    });

  return updateOrderWorkflow(order.orderId || order.id, order.customerId, {
    verificationStatus: "verified",
    orderStatus: "approved",
    expressEligible: true,
    checkInStatus: order.checkInStatus || "not_arrived",
    pickupCode,
    pickupStatus: "Approved",
  });
}

export async function rejectPreorder(order) {
  return updateOrderWorkflow(order.orderId || order.id, order.customerId, {
    verificationStatus: "rejected",
    orderStatus: "rejected",
    expressEligible: false,
    pickupStatus: "Rejected",
  });
}

export async function requestPreorderResubmission(order) {
  return updateOrderWorkflow(order.orderId || order.id, order.customerId, {
    verificationStatus: "pending",
    orderStatus: "pending_review",
    expressEligible: false,
    pickupStatus: "Pending Review",
  });
}

export function findOrderFromSharedSource(rawValue, orders = []) {
  const trimmedValue = rawValue?.trim();
  if (!trimmedValue) {
    return null;
  }

  const payload = parsePickupCode(trimmedValue);

  return (
    orders.find((order) => order.pickupCode === trimmedValue) ||
    orders.find((order) => (order.orderNumber || order.order) === trimmedValue) ||
    orders.find((order) => (order.orderId || order.id) === trimmedValue) ||
    orders.find(
      (order) =>
        (payload?.orderNumber &&
          (order.orderNumber === payload.orderNumber ||
            order.order === payload.orderNumber)) ||
        (payload?.customerId && order.customerId === payload.customerId)
    ) ||
    null
  );
}

export function getSharedOrders() {
  return [];
}

export function getSharedOrderById(orderId, orders = []) {
  return orders.find((order) => (order.orderId || order.id) === orderId) || null;
}
