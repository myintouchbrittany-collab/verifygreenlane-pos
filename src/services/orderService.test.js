import {
  canCustomerCheckIn,
  getCustomerStatusPresentation,
  getCustomerCheckInValidationMessage,
} from "./orderService";

test("allows customer parking lot check-in for approved verified orders", () => {
  expect(
    canCustomerCheckIn({
      orderStatus: "approved",
      verificationStatus: "verified",
    })
  ).toBe(true);
});

test("rejects customer parking lot check-in for unapproved orders", () => {
  expect(
    getCustomerCheckInValidationMessage({
      orderStatus: "pending_review",
      verificationStatus: "pending",
    })
  ).toBe("This preorder is not approved for pickup yet.");
});

test("rejects completed orders during pickup-code validation", () => {
  expect(
    getCustomerCheckInValidationMessage({
      orderStatus: "completed",
      verificationStatus: "verified",
    })
  ).toBe("This preorder has already been completed.");
});

test("returns fully completed customer messaging for completed orders", () => {
  expect(
    getCustomerStatusPresentation({
      orderStatus: "completed",
      verificationStatus: "verified",
    })
  ).toEqual({
    state: "completed",
    headline: "Your order is completed.",
    statusLabel: "Completed",
    helperText: "This order has been picked up and closed.",
    bodyMessage: "This preorder has been completed.",
  });
});

test("maps approved verified orders to the verified customer state", () => {
  expect(
    getCustomerStatusPresentation({
      orderStatus: "approved",
      verificationStatus: "verified",
    })
  ).toMatchObject({
    state: "verified",
    headline: "Your order is approved for pickup.",
    statusLabel: "Verified",
  });
});
