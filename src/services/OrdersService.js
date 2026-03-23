import { createCustomerAndOrder, subscribeCustomers } from "./orderModel";
import {
  completeOrderWithLoyalty,
  mergeOrdersWithCustomers,
  subscribeOrders,
  updateOrderWorkflow,
} from "./orderService";
import { parsePickupCode } from "./orderUtils";
import { DEFAULT_STORE_ID } from "./storeConfig";

let currentStoreId = DEFAULT_STORE_ID;
let customerRecords = [];
let orderRecords = [];
let mergedOrders = [];
let stopCustomers = null;
let stopOrders = null;
const listeners = new Set();

function emit() {
  mergedOrders = mergeOrdersWithCustomers(orderRecords, customerRecords);
  listeners.forEach((listener) => listener(mergedOrders));
}

function start(storeId = DEFAULT_STORE_ID) {
  if (stopCustomers && stopOrders && currentStoreId === storeId) {
    return;
  }

  if (stopCustomers) {
    stopCustomers();
  }

  if (stopOrders) {
    stopOrders();
  }

  currentStoreId = storeId;
  customerRecords = [];
  orderRecords = [];
  mergedOrders = [];

  stopCustomers = subscribeCustomers((records) => {
    customerRecords = records;
    emit();
  }, storeId);

  stopOrders = subscribeOrders((records) => {
    orderRecords = records;
    emit();
  }, storeId);
}

export function subscribeToOrders(listener, storeId = DEFAULT_STORE_ID) {
  start(storeId);
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getOrders(storeId = DEFAULT_STORE_ID) {
  start(storeId);
  return mergedOrders;
}

export async function addOrder(order, storeId = DEFAULT_STORE_ID) {
  start(storeId);
  return createCustomerAndOrder({
    storeId,
    ...order,
  });
}

export async function updateOrder(orderId, updates) {
  const order = mergedOrders.find(
    (entry) => (entry.orderId || entry.id) === orderId
  );

  if (!order) {
    throw new Error("Order not found.");
  }

  await updateOrderWorkflow(order.orderId || order.id, order.customerId, updates);
}

export async function completeOrder(orderId) {
  const order = mergedOrders.find((entry) => (entry.orderId || entry.id) === orderId);

  if (!order) {
    throw new Error("Order not found.");
  }

  await completeOrderWithLoyalty(order);
}

export function findOrder(rawValue, storeId = DEFAULT_STORE_ID) {
  start(storeId);

  const trimmedValue = rawValue?.trim();
  if (!trimmedValue) {
    return null;
  }

  const payload = parsePickupCode(trimmedValue);

  return (
    mergedOrders.find((order) => order.pickupCode === trimmedValue) ||
    mergedOrders.find(
      (order) =>
        (payload?.orderNumber && order.orderNumber === payload.orderNumber) ||
        (payload?.customerId &&
          (order.customerId === payload.customerId ||
            order.orderId === payload.customerId))
    ) ||
    null
  );
}
