import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  addOrder as addOrderRecord,
  completeOrder as completeOrderRecord,
  findOrder,
  subscribeToOrders,
  updateOrder as updateOrderRecord,
} from "../services/OrdersService";
import { normalizeCustomerRecord } from "../services/orderModel";
import {
  mergeOrdersWithCustomers,
  normalizeOrderRecord,
} from "../services/orderService";
import { DEFAULT_STORE_ID } from "../services/storeConfig";

const OrdersContext = createContext(null);

function buildOptimisticOrder(result) {
  if (!result?.orderId || !result?.customerId) {
    return null;
  }

  const normalizedOrder = normalizeOrderRecord(result.orderId, result.orderPayload || {});
  const normalizedCustomer = normalizeCustomerRecord(
    result.customerId,
    result.customerPayload || {}
  );

  return mergeOrdersWithCustomers([normalizedOrder], [normalizedCustomer])[0] || null;
}

export function OrdersProvider({ children, storeId = DEFAULT_STORE_ID }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const ordersRef = useRef([]);

  useEffect(() => {
    return subscribeToOrders((nextOrders) => {
      ordersRef.current = nextOrders;
      setOrders(nextOrders);
      setLoading(false);
    }, storeId);
  }, [storeId]);

  const addOrder = async (order) => {
    const result = await addOrderRecord(order, storeId);
    const optimisticOrder = buildOptimisticOrder(result);

    if (optimisticOrder) {
      setOrders((currentOrders) => {
        const nextOrders = [
          optimisticOrder,
          ...currentOrders.filter(
            (entry) => (entry.orderId || entry.id) !== optimisticOrder.orderId
          ),
        ];
        ordersRef.current = nextOrders;
        return nextOrders;
      });
    }

    return result;
  };

  const updateOrder = async (orderId, updates) => {
    setOrders((currentOrders) => {
      const nextOrders = currentOrders.map((order) =>
        (order.orderId || order.id) === orderId ? { ...order, ...updates } : order
      );
      ordersRef.current = nextOrders;
      return nextOrders;
    });

    await updateOrderRecord(orderId, updates);
  };

  const completeOrder = async (orderId) => {
    const checkoutTime = new Date().toLocaleTimeString();

    setOrders((currentOrders) => {
      const nextOrders = currentOrders.map((order) =>
        (order.orderId || order.id) === orderId
          ? {
              ...order,
              status: "completed",
              orderStatus: "completed",
              pickupStatus: "Completed",
              checkoutTime,
            }
          : order
      );
      ordersRef.current = nextOrders;
      return nextOrders;
    });

    await completeOrderRecord(orderId);
  };

  const findOrderByPickupCode = (code) => {
    const trimmedCode = code?.trim();
    if (!trimmedCode) {
      return null;
    }

    const localMatch =
      ordersRef.current.find((order) => order.pickupCode === trimmedCode) ||
      ordersRef.current.find((order) => order.orderNumber === trimmedCode) ||
      ordersRef.current.find((order) => order.orderId === trimmedCode) ||
      null;

    return localMatch || findOrder(trimmedCode, storeId);
  };

  return (
    <OrdersContext.Provider
      value={{
        loading,
        orders,
        addOrder,
        updateOrder,
        completeOrder,
        findOrderByPickupCode,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrdersContext);

  if (!context) {
    throw new Error("useOrders must be used within an OrdersProvider.");
  }

  return context;
}
