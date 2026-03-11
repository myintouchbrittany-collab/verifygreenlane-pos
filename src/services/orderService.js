import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { buildPickupCode, formatStatusLabel } from "./orderUtils";
import { DEFAULT_STORE_ID, matchesActiveStore } from "./storeConfig";
import { normalizeCustomerRecord } from "./orderModel";

export const ACTIVE_ORDER_STATUSES = [
  "pending_review",
  "approved",
  "express_ready",
  "checked_in",
  "ready_for_pickup",
];

export const EXPRESS_SCAN_STATUSES = ["approved", "express_ready"];

export function normalizeOrderRecord(id, data) {
  const orderItems = data.orderItems || [];
  const itemCount = orderItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );

  return {
    id,
    orderId: id,
    customerId: data.customerId || "",
    storeId: data.storeId || DEFAULT_STORE_ID,
    customerName: data.customerName || data.name || "Unknown Customer",
    name: data.customerName || data.name || "Unknown Customer",
    orderNumber: data.orderNumber || data.order || "",
    order: data.orderNumber || data.order || "",
    orderStatus: data.orderStatus || data.status || "draft",
    status: data.status || data.orderStatus || "draft",
    pickupStatus: data.pickupStatus || "Pending Review",
    pickupWindow: data.pickupWindow || "",
    checkedIn: Boolean(data.checkedIn),
    arrivalTime: data.arrivalTime || "",
    checkoutTime: data.checkoutTime || "",
    subtotal: data.subtotal || 0,
    total: data.total || 0,
    itemCount,
    orderItems,
    idVerificationStatus:
      data.idVerificationStatus ||
      data.verificationStatus ||
      "pending_verification",
    verificationStatus:
      data.verificationStatus ||
      data.idVerificationStatus ||
      "pending_verification",
    idUploadComplete: Boolean(data.idUploadComplete),
    expressEligible: Boolean(data.expressEligible),
    source: data.source || "Unknown Source",
    notes: data.notes || "",
    ...data,
  };
}

export function subscribeOrders(callback, storeId = DEFAULT_STORE_ID) {
  return onSnapshot(collection(db, "orders"), (snapshot) => {
    const records = snapshot.docs
      .map((entry) => normalizeOrderRecord(entry.id, entry.data()))
      .filter((entry) => matchesActiveStore(entry, storeId));

    callback(records);
  });
}

export function subscribeOrderDetail(orderId, callback) {
  if (!orderId) {
    callback(null);
    return () => {};
  }

  let customerUnsubscribe = null;

  const orderUnsubscribe = onSnapshot(doc(db, "orders", orderId), (snapshot) => {
    if (!snapshot.exists()) {
      if (customerUnsubscribe) {
        customerUnsubscribe();
        customerUnsubscribe = null;
      }
      callback(null);
      return;
    }

    const order = normalizeOrderRecord(snapshot.id, snapshot.data());

    if (!order.customerId) {
      callback(order);
      return;
    }

    if (customerUnsubscribe) {
      customerUnsubscribe();
    }

    customerUnsubscribe = onSnapshot(
      doc(db, "customers", order.customerId),
      (customerSnapshot) => {
        if (!customerSnapshot.exists()) {
          callback(order);
          return;
        }

        const customer = normalizeCustomerRecord(
          customerSnapshot.id,
          customerSnapshot.data()
        );

        callback({
          ...customer,
          ...order,
          id: order.orderId,
          orderId: order.orderId,
          customerId: order.customerId,
          customerName: order.customerName || customer.name,
          name: order.customerName || customer.name,
          orderItems: order.orderItems?.length
            ? order.orderItems
            : customer.orderItems || [],
          idUploads: customer.idUploads || order.idUploads || {},
          phoneNumber: customer.phoneNumber || "",
        });
      }
    );
  });

  return () => {
    orderUnsubscribe();
    if (customerUnsubscribe) {
      customerUnsubscribe();
    }
  };
}

export function mergeOrdersWithCustomers(orders, customers) {
  const orderMap = new Map();

  orders.forEach((order) => {
    orderMap.set(order.orderId || order.id, order);
  });

  customers.forEach((customer) => {
    const orderId = customer.orderId || customer.id;
    if (orderMap.has(orderId)) {
      return;
    }

    orderMap.set(orderId, {
      ...normalizeCustomerRecord(customer.id, customer),
      id: orderId,
      orderId,
      customerId: customer.customerId || customer.id,
      customerName: customer.name,
      itemCount: (customer.orderItems || []).reduce(
        (sum, item) => sum + (Number(item.quantity) || 0),
        0
      ),
      orderStatus: customer.orderStatus || customer.status || "pending_review",
      idVerificationStatus:
        customer.idVerificationStatus ||
        customer.verificationStatus ||
        customer.status ||
        "pending_verification",
      verificationStatus:
        customer.verificationStatus ||
        customer.idVerificationStatus ||
        "pending_verification",
      expressEligible: Boolean(customer.expressEligible),
    });
  });

  return Array.from(orderMap.values()).sort((left, right) => {
    const leftName = `${left.customerName || left.name} ${left.orderNumber || left.order}`;
    const rightName = `${right.customerName || right.name} ${right.orderNumber || right.order}`;
    return leftName.localeCompare(rightName);
  });
}

export async function updateOrderWorkflow(orderId, customerId, updates) {
  const orderRef = doc(db, "orders", orderId);
  const nextVerificationStatus =
    updates.verificationStatus || updates.idVerificationStatus;
  const orderUpdates = {
    ...updates,
    updatedAt: serverTimestamp(),
  };

  if (nextVerificationStatus) {
    orderUpdates.verificationStatus = nextVerificationStatus;
    orderUpdates.idVerificationStatus = nextVerificationStatus;
  }

  await updateDoc(orderRef, {
    ...orderUpdates,
  });

  if (!customerId) {
    const orderSnapshot = await getDoc(orderRef);
    if (!orderSnapshot.exists()) {
      return;
    }
    customerId = orderSnapshot.data().customerId;
  }

  if (!customerId) {
    return;
  }

  const customerUpdates = {
    updatedAt: serverTimestamp(),
  };

  if (updates.pickupStatus !== undefined) {
    customerUpdates.pickupStatus = updates.pickupStatus;
  }

  if (updates.checkedIn !== undefined) {
    customerUpdates.checkedIn = Boolean(updates.checkedIn);
  }

  if (updates.arrivalTime !== undefined) {
    customerUpdates.arrivalTime = updates.arrivalTime;
  }

  if (updates.checkoutTime !== undefined) {
    customerUpdates.checkoutTime = updates.checkoutTime;
  }

  if (updates.orderStatus || updates.status) {
    const nextOrderStatus = updates.orderStatus || updates.status;
    customerUpdates.orderStatus = nextOrderStatus;
    customerUpdates.status = formatStatusLabel(nextOrderStatus);
  }

  if (nextVerificationStatus) {
    customerUpdates.idVerificationStatus = nextVerificationStatus;
    customerUpdates.verificationStatus = nextVerificationStatus;
  }

  if (updates.pickupCode !== undefined) {
    customerUpdates.pickupCode = updates.pickupCode;
  }

  if (updates.expressEligible !== undefined) {
    customerUpdates.expressEligible = Boolean(updates.expressEligible);
  }

  await updateDoc(doc(db, "customers", customerId), customerUpdates);
}

export function getOrderWorkflowLabel(order) {
  if (!order) {
    return "Pending";
  }

  const status = order.orderStatus || order.status || "draft";

  return formatStatusLabel(status);
}

export function canGeneratePickupCode(order) {
  if (!order) {
    return false;
  }

  const status = order.orderStatus || order.status;
  const verificationStatus =
    order.verificationStatus || order.idVerificationStatus;
  return (
    Boolean(order.expressEligible) &&
    verificationStatus === "verified" &&
    (status === "approved" ||
      status === "express_ready" ||
      status === "checked_in" ||
      status === "ready_for_pickup" ||
      status === "completed")
  );
}

export function isActiveOrder(order) {
  return ACTIVE_ORDER_STATUSES.includes(order?.orderStatus || order?.status);
}

export function canEnterExpressPickup(order) {
  if (!order) {
    return false;
  }

  const status = order.orderStatus || order.status;
  const verificationStatus =
    order.verificationStatus || order.idVerificationStatus;

  return (
    EXPRESS_SCAN_STATUSES.includes(status) &&
    verificationStatus === "verified" &&
    Boolean(order.expressEligible)
  );
}

export async function approvePreorder(order) {
  const pickupCode =
    order.pickupCode ||
    buildPickupCode({
      customerId: order.customerId,
      orderNumber: order.orderNumber || order.order,
    });

  await updateOrderWorkflow(order.orderId || order.id, order.customerId, {
    status: "approved",
    orderStatus: "approved",
    verificationStatus: "verified",
    idVerificationStatus: "verified",
    expressEligible: true,
    pickupStatus: "Approved",
    pickupCode,
  });
}

export async function rejectPreorder(order) {
  await updateOrderWorkflow(order.orderId || order.id, order.customerId, {
    status: "rejected",
    orderStatus: "rejected",
    verificationStatus: "rejected",
    idVerificationStatus: "rejected",
    expressEligible: false,
    pickupStatus: "Rejected",
    pickupCode: "",
    checkedIn: false,
  });
}

export async function requestPreorderResubmission(order) {
  await updateOrderWorkflow(order.orderId || order.id, order.customerId, {
    status: "pending_review",
    orderStatus: "pending_review",
    verificationStatus: "resubmission_requested",
    idVerificationStatus: "resubmission_requested",
    expressEligible: false,
    pickupStatus: "Resubmission Requested",
    pickupCode: "",
    checkedIn: false,
  });
}
