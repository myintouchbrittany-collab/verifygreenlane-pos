import { doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { DEFAULT_STORE_ID } from "./storeConfig";
import { prepareFirestorePayload } from "./firestoreUtils";

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
      source,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { defaultVerificationStatus: "pending" }),
    { merge: true }
  );
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
