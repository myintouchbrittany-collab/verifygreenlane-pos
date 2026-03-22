import {
  prepareFirestorePayload,
  removeUndefinedFields,
  withDefaultVerificationStatus,
} from "./firestoreUtils";

test("removes undefined fields deeply before Firestore writes", () => {
  expect(
    removeUndefinedFields({
      verificationStatus: undefined,
      nested: {
        parkingSpot: "A1",
        note: undefined,
      },
      items: [1, undefined, 2],
    })
  ).toEqual({
    nested: {
      parkingSpot: "A1",
    },
    items: [1, 2],
  });
});

test("fills missing verification status when requested", () => {
  expect(
    withDefaultVerificationStatus(
      {
        orderStatus: "pending_review",
      },
      "pending"
    )
  ).toEqual({
    orderStatus: "pending_review",
    verificationStatus: "pending",
    idVerificationStatus: "pending",
  });
});

test("keeps defined verification status and strips undefined values", () => {
  expect(
    prepareFirestorePayload({
      verificationStatus: "verified",
      pickupCode: undefined,
      parkingSpot: "12",
    }, { defaultVerificationStatus: "pending" })
  ).toEqual({
    verificationStatus: "verified",
    parkingSpot: "12",
  });
});
