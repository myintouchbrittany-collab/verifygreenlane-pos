import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  buildOrderNumber,
  buildPickupCode,
  formatStatusLabel,
} from "./orderUtils";
import { DEFAULT_STORE_ID, matchesActiveStore } from "./storeConfig";
import { prepareFirestorePayload } from "./firestoreUtils";
import { buildActivityEntry } from "./orderActivity";

function buildDisplayStatus(value) {
  return formatStatusLabel(value || "pending_review");
}

export function normalizeCustomerRecord(id, data) {
  return {
    id,
    orderId: data.orderId || id,
    customerId: data.customerId || id,
    storeId: data.storeId || DEFAULT_STORE_ID,
    name: data.name || data.fullName || "Unknown Customer",
    fullName: data.fullName || data.name || "",
    order: data.order || data.orderNumber || "",
    orderNumber: data.order || data.orderNumber || "",
    status: buildDisplayStatus(
      data.orderStatus || data.status || data.verificationStatus
    ),
    verificationStatus:
      data.verificationStatus || data.idVerificationStatus || "pending_verification",
    checkedIn: Boolean(data.checkedIn),
    arrivalTime: data.arrivalTime || "",
    pickupStatus: data.pickupStatus || "Pending Review",
    checkoutTime: data.checkoutTime || "",
    pickupWindow: data.pickupWindow || "",
    pickupDate: data.pickupDate || "",
    pickupTime: data.pickupTime || "",
    pickupSlotKey: data.pickupSlotKey || "",
    pickupSlotLabel: data.pickupSlotLabel || "",
    total: data.total || 0,
    orderItems: data.orderItems || [],
    idUploadComplete: Boolean(data.idUploadComplete),
    expressEligible: Boolean(data.expressEligible),
    source: data.source || "Legacy Customer Flow",
    phoneNumber: data.phoneNumber || "",
    ...data,
  };
}

export function subscribeCustomers(callback, storeId = DEFAULT_STORE_ID) {
  return onSnapshot(collection(db, "customers"), (snapshot) => {
    const records = snapshot.docs
      .map((entry) => normalizeCustomerRecord(entry.id, entry.data()))
      .filter((entry) => matchesActiveStore(entry, storeId));

    callback(records);
  });
}

export async function updatePickupState(customerId, updates) {
  const customerRef = doc(db, "customers", customerId);
  await updateDoc(customerRef, prepareFirestorePayload(updates));

  const customerSnapshot = await getDoc(customerRef);
  if (!customerSnapshot.exists()) {
    return;
  }

  const customerData = customerSnapshot.data();
  const linkedOrderId = customerData.orderId;

  if (linkedOrderId) {
    await updateDoc(
      doc(db, "orders", linkedOrderId),
      prepareFirestorePayload({
        ...updates,
        updatedAt: serverTimestamp(),
      })
    );
  }
}

export async function findOrderByPickupCode(payload) {
  if (!payload?.customerId && !payload?.orderNumber) {
    return null;
  }

  if (payload.orderNumber) {
    const orderQuery = query(
      collection(db, "orders"),
      where("orderNumber", "==", payload.orderNumber),
      limit(1)
    );
    const orderSnapshot = await getDocs(orderQuery);
    if (orderSnapshot.docs[0]) {
      return {
        id: orderSnapshot.docs[0].id,
        ...orderSnapshot.docs[0].data(),
      };
    }
  }

  if (payload.customerId) {
    const customerSnapshot = await getDoc(doc(db, "customers", payload.customerId));
    if (!customerSnapshot.exists()) {
      return null;
    }

    const customerData = customerSnapshot.data();
    if (customerData.orderId) {
      const orderSnapshot = await getDoc(doc(db, "orders", customerData.orderId));
      if (orderSnapshot.exists()) {
        return {
          id: orderSnapshot.id,
          ...orderSnapshot.data(),
        };
      }
    }

    return normalizeCustomerRecord(customerSnapshot.id, customerData);
  }

  return null;
}

export async function createCustomerAndOrder({
  customerId,
  customerFields,
  orderFields,
  storeId = DEFAULT_STORE_ID,
}) {
  const customerRef = customerId
    ? doc(db, "customers", customerId)
    : doc(collection(db, "customers"));
  const orderRef = doc(collection(db, "orders"));
  const orderNumber = orderFields.orderNumber || buildOrderNumber();
  const verificationStatus =
    orderFields.verificationStatus ||
    orderFields.idVerificationStatus ||
    customerFields.verificationStatus ||
    "pending_verification";
  const preorderStatus =
    orderFields.orderStatus || orderFields.status || "pending_review";
  const pickupCode =
    orderFields.pickupCode ||
    (verificationStatus === "verified" && preorderStatus === "approved"
      ? buildPickupCode({
          customerId: customerRef.id,
          orderNumber,
        })
      : "");

  const customerPayload = {
    storeId,
    customerId: customerRef.id,
    orderId: orderRef.id,
    lastOrderId: orderRef.id,
    lastOrderNumber: orderNumber,
    name: customerFields.name || customerFields.fullName || "",
    fullName: customerFields.fullName || customerFields.name || "",
    status:
      customerFields.status || formatStatusLabel(preorderStatus),
    verificationStatus:
      customerFields.verificationStatus || verificationStatus,
    checkedIn: false,
    arrivalTime: "",
    pickupStatus: orderFields.pickupStatus || "Pending Review",
    checkoutTime: "",
    pickupWindow: orderFields.pickupWindow || "",
    pickupDate: orderFields.pickupDate || "",
    pickupTime: orderFields.pickupTime || "",
    pickupSlotKey: orderFields.pickupSlotKey || "",
    pickupSlotLabel: orderFields.pickupSlotLabel || "",
    orderStatus:
      orderFields.orderStatus || preorderStatus,
    idVerificationStatus:
      verificationStatus,
    order: orderNumber,
    orderNumber,
    pickupCode,
    expressEligible: Boolean(customerFields.expressEligible),
    ...customerFields,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const orderPayload = {
    storeId,
    customerId: customerRef.id,
    customerName:
      customerFields.fullName || customerFields.name || "Unknown Customer",
    orderNumber,
    order: orderNumber,
    channel: orderFields.channel || "preorder",
    status: preorderStatus,
    orderStatus: orderFields.orderStatus || preorderStatus,
    pickupStatus: orderFields.pickupStatus || "Pending Review",
    idVerificationStatus:
      verificationStatus,
    verificationStatus,
    idUploadComplete: Boolean(customerFields.idUploadComplete),
    expressEligible: Boolean(orderFields.expressEligible),
    checkedIn: false,
    arrivalTime: "",
    checkoutTime: "",
    pickupCode,
    pickupDate: orderFields.pickupDate || "",
    pickupTime: orderFields.pickupTime || "",
    pickupSlotKey: orderFields.pickupSlotKey || "",
    pickupSlotLabel: orderFields.pickupSlotLabel || "",
    source: orderFields.source || "Customer Preorder",
    activityLog: [
      buildActivityEntry("created", new Date().toISOString(), "", "Order submitted"),
    ],
    ...orderFields,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await Promise.all([
    setDoc(
      customerRef,
      prepareFirestorePayload(customerPayload, {
        defaultVerificationStatus: "pending",
      }),
      { merge: true }
    ),
    setDoc(
      orderRef,
      prepareFirestorePayload(orderPayload, {
        defaultVerificationStatus: "pending",
      }),
      { merge: true }
    ),
  ]);

  return {
    customerId: customerRef.id,
    orderId: orderRef.id,
    orderNumber,
    pickupCode,
    customerPayload,
    orderPayload,
  };
}
