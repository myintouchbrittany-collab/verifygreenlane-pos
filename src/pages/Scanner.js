import React, { useState } from "react";
import { useOrders } from "../context/OrdersContext";

function Scanner() {
  const { orders, findOrderByPickupCode, updateOrder } = useOrders();
  const [lookupValue, setLookupValue] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [message, setMessage] = useState("");

  const handleLookup = () => {
    const order = findOrderByPickupCode(lookupValue);

    if (!order) {
      setSelectedOrder(null);
      setMessage("No shared preorder matched that pickup code or order number.");
      return;
    }

    setSelectedOrder(order);
    setMessage("");
  };

  const handleCheckIn = async () => {
    if (!selectedOrder) {
      return;
    }

    await updateOrder(selectedOrder.orderId || selectedOrder.id, {
      checkedIn: true,
      arrivalTime: new Date().toLocaleTimeString(),
      status: "checked_in",
      orderStatus: "checked_in",
      pickupStatus: "Checked In",
    });
    setMessage("Order checked in.");
  };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Pickup Scanner</h2>
      <p>Search the shared order list by pickup code or order number.</p>

      <div style={panelStyle}>
        <input
          type="text"
          placeholder="Pickup code or order number"
          value={lookupValue}
          onChange={(event) => setLookupValue(event.target.value)}
          style={inputStyle}
        />

        <button onClick={handleLookup} style={buttonStyle}>
          Find Order
        </button>

        {message ? <div style={messageStyle}>{message}</div> : null}
      </div>

      {selectedOrder ? (
        <div style={cardStyle}>
          <strong>{selectedOrder.customerName || selectedOrder.name}</strong>
          <div style={smallText}>{selectedOrder.orderNumber || selectedOrder.order}</div>
          <div style={smallText}>
            Status: {selectedOrder.orderStatus || selectedOrder.status}
          </div>
          <button onClick={handleCheckIn} style={buttonStyle}>
            Check In Order
          </button>
        </div>
      ) : null}

      <h3>Shared Orders</h3>
      {orders.length === 0 ? (
        <p>No shared orders loaded.</p>
      ) : (
        orders.map((order) => (
          <div key={order.orderId || order.id} style={listRowStyle}>
            <strong>{order.customerName || order.name}</strong>
            <div style={smallText}>{order.orderNumber || order.order}</div>
          </div>
        ))
      )}
    </div>
  );
}

const panelStyle = {
  marginTop: "20px",
  marginBottom: "24px",
  padding: "16px",
  border: "1px solid #d1d5db",
  borderRadius: "12px",
  backgroundColor: "#f8fafc",
  maxWidth: "650px",
};

const inputStyle = {
  width: "100%",
  maxWidth: "450px",
  padding: "12px",
  marginBottom: "12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  display: "block",
};

const buttonStyle = {
  padding: "12px 20px",
  fontSize: "16px",
  borderRadius: "10px",
  border: "none",
  backgroundColor: "#22c55e",
  color: "white",
  cursor: "pointer",
};

const messageStyle = {
  marginTop: "12px",
  color: "#475569",
};

const cardStyle = {
  padding: "12px",
  background: "#f1f5f9",
  borderRadius: "8px",
  marginBottom: "10px",
  border: "1px solid #dbeafe",
  maxWidth: "700px",
};

const listRowStyle = {
  padding: "12px",
  background: "#f8fafc",
  borderRadius: "8px",
  marginBottom: "10px",
  border: "1px solid #e2e8f0",
  maxWidth: "700px",
};

const smallText = {
  fontSize: "14px",
  marginTop: "4px",
  color: "#475569",
};

export default Scanner;
