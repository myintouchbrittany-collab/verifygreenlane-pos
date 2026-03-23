import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { DEFAULT_STORE_ID } from "./storeConfig";
import { prepareFirestorePayload } from "./firestoreUtils";
import { buildDefaultLoyaltyProfile } from "./loyalty";

export async function createCustomerRecord({
  customerId,
  storeId = DEFAULT_STORE_ID,
  customerName,
  phoneNumber,
  idUploadComplete,
  frontIdFileName,
  backIdFileName,
  orderId,
  orderNumber,
  pickupDate,
  pickupTime,
  pickupSlotKey,
  pickupSlotLabel,
  pickupWindow,
  pickupCode,
  verificationStatus,
  orderStatus,
  source,
}) {
  const loyaltyProfile = buildDefaultLoyaltyProfile();

  await setDoc(
    doc(db, "customers", customerId),
    prepareFirestorePayload({
      customerId,
      storeId,
      name: customerName,
      fullName: customerName,
      phoneNumber,
      orderId,
      lastOrderId: orderId,
      orderNumber,
      lastOrderNumber: orderNumber,
      pickupDate,
      pickupTime,
      pickupSlotKey,
      pickupSlotLabel,
      pickupWindow,
      pickupCode,
      verificationStatus,
      idVerificationStatus: verificationStatus,
      orderStatus,
      status: orderStatus,
      pickupStatus: "Pending Review",
      checkedIn: false,
      checkInStatus: "not_arrived",
      idUploadComplete: Boolean(idUploadComplete),
      idUploads: {
        frontFileName: frontIdFileName || "",
        backFileName: backIdFileName || "",
      },
      ...loyaltyProfile,
      source,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { defaultVerificationStatus: "pending" }),
    { merge: true }
  );
}

export async function getCustomerRecord(customerId) {
  if (!customerId) {
    return null;
  }

  const customerSnapshot = await getDoc(doc(db, "customers", customerId));

  if (!customerSnapshot.exists()) {
    return null;
  }

  return {
    id: customerSnapshot.id,
    ...customerSnapshot.data(),
  };
}

export async function updateCustomerRecord(customerId, updates) {
  if (!customerId) {
    return;
  }

  await updateDoc(
    doc(db, "customers", customerId),
    prepareFirestorePayload({
      ...updates,
      updatedAt: serverTimestamp(),
    })
  );
}

export async function syncCustomerOrderSummary(customerId, summary) {
  if (!customerId) {
    return;
  }

  await setDoc(
    doc(db, "customers", customerId),
    prepareFirestorePayload({
      ...summary,
      updatedAt: serverTimestamp(),
    }),
    { merge: true }
  );
}
