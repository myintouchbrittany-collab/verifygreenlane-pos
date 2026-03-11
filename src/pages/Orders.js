import React, { useState } from "react";
import { useOrders } from "../context/OrdersContext";

function Orders() {
  const { orders, addOrder, completeOrder, updateOrder } = useOrders();
  const [customerName, setCustomerName] = useState("");
  const [orderNumber, setOrderNumber] = useState("");

  const handleAddOrder = async () => {
    if (!customerName.trim()) {
      return;
    }

    await addOrder({
      customerFields: {
        name: customerName.trim(),
        fullName: customerName.trim(),
        verificationStatus: "pending",
        idUploadComplete: false,
        expressEligible: false,
      },
      orderFields: {
        orderNumber: orderNumber.trim() || undefined,
        source: "Shared Orders",
        status: "pending_review",
        orderStatus: "pending_review",
        verificationStatus: "pending",
        idVerificationStatus: "pending",
        expressEligible: false,
        orderItems: [],
        subtotal: 0,
        total: 0,
      },
    });

    setCustomerName("");
    setOrderNumber("");
  };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Purchase Queue</h2>
      <p>Create and manage orders from the shared order store.</p>

      <div style={panelStyle}>
        <h3 style={{ marginTop: 0 }}>Add Shared Order</h3>
        <input
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          style={inputStyle}
          placeholder="Customer name"
        />
        <input
          value={orderNumber}
          onChange={(event) => setOrderNumber(event.target.value)}
          style={inputStyle}
          placeholder="Order number (optional)"
        />
        <button onClick={handleAddOrder} style={primaryButton}>
          Add Order
        </button>
      </div>

      {orders.length === 0 ? (
        <p>No purchase requests yet.</p>
      ) : (
        orders.map((order) => (
          <div key={order.orderId || order.id} style={cardStyle}>
            <h3 style={{ margin: "0 0 8px 0" }}>
              {order.orderNumber || order.order}
            </h3>
            <p style={{ margin: "0 0 8px 0" }}>
              Customer: <strong>{order.customerName || order.name}</strong>
            </p>
            <p style={{ margin: "0 0 8px 0" }}>
              Status: <strong>{order.orderStatus || order.status}</strong>
            </p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={() =>
                  updateOrder(order.orderId || order.id, {
                    status: "approved",
                    orderStatus: "approved",
                    verificationStatus: "verified",
                    idVerificationStatus: "verified",
                  })
                }
                style={btnStyle("#3b82f6")}
              >
                Approve
              </button>
              <button
                onClick={() =>
                  updateOrder(order.orderId || order.id, {
                    status: "ready_for_pickup",
                    orderStatus: "ready_for_pickup",
                  })
                }
                style={btnStyle("#22c55e")}
              >
                Ready
              </button>
              <button
                onClick={() => completeOrder(order.orderId || order.id)}
                style={btnStyle("#7c3aed")}
              >
                Picked Up
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const panelStyle = {
  marginTop: "20px",
  marginBottom: "30px",
  padding: "16px",
  border: "1px solid #d1d5db",
  borderRadius: "12px",
  backgroundColor: "#f8fafc",
};

const inputStyle = {
  width: "100%",
  maxWidth: "420px",
  padding: "12px",
  marginBottom: "12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  display: "block",
};

const primaryButton = {
  backgroundColor: "#22c55e",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: "600",
};

const btnStyle = (backgroundColor) => ({
  backgroundColor,
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: "600",
});

const cardStyle = {
  backgroundColor: "white",
  border: "1px solid #d1d5db",
  borderRadius: "12px",
  padding: "16px",
  marginBottom: "12px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
};

export default Orders;
