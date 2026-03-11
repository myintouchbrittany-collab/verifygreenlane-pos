export function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function buildOrderNumber() {
  const now = Date.now().toString().slice(-6);
  return `GL-${now}`;
}

export function buildPickupCode({ customerId, orderNumber }) {
  return JSON.stringify({
    customerId,
    orderNumber,
    type: "greenlane-express-pickup",
  });
}

export function formatStatusLabel(value) {
  if (!value) {
    return "Pending";
  }

  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function parsePickupCode(value) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();

  try {
    const parsed = JSON.parse(trimmedValue);

    if (parsed && parsed.customerId) {
      return parsed;
    }
  } catch (error) {
    if (/^GL-\w+/i.test(trimmedValue) || /^#?\d[\w-]*$/.test(trimmedValue)) {
      return {
        customerId: "",
        orderNumber: trimmedValue,
        type: "manual-order-number",
      };
    }

    return {
      customerId: trimmedValue,
      orderNumber: "",
      type: "manual",
    };
  }

  return null;
}
