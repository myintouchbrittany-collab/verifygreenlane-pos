import { buildPickupCode, parsePickupCode } from "./services/orderUtils";

test("builds and parses a pickup QR payload", () => {
  const code = buildPickupCode({
    customerId: "customer-123",
    orderNumber: "GL-456789",
  });

  expect(parsePickupCode(code)).toEqual({
    customerId: "customer-123",
    orderNumber: "GL-456789",
    type: "greenlane-express-pickup",
  });
});
