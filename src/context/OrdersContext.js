import React, { createContext, useContext, useMemo } from "react";
import { useOrdersData } from "../hooks/useOrdersData";
import {
  createPreorder,
  findOrderFromSharedSource,
  updateOrderWorkflow,
} from "../services/orderService";

const OrdersContext = createContext(null);

export function OrdersProvider({ children }) {
  const { orders, loading } = useOrdersData();

  const value = useMemo(
    () => ({
      loading,
      orders,
      addOrder: async (order) => createPreorder(order),
      updateOrder: async (orderId, updates, customerId) =>
        updateOrderWorkflow(orderId, customerId, updates),
      completeOrder: async (orderId) =>
        updateOrderWorkflow(
          orderId,
          orders.find((order) => (order.orderId || order.id) === orderId)?.customerId,
          {
            orderStatus: "completed",
            status: "completed",
            checkoutTime: new Date().toLocaleTimeString(),
            completedAt: new Date().toISOString(),
          }
        ),
      findOrderByPickupCode: (value) => findOrderFromSharedSource(value, orders),
    }),
    [loading, orders]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const context = useContext(OrdersContext);

  if (!context) {
    throw new Error("useOrders must be used within an OrdersProvider.");
  }

  return context;
}
