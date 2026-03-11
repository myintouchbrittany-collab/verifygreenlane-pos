import React from "react";

function StaffDashboard({ customers = [], orders = [], onUpdateStatus, onPickup }) {
  const checkedInCustomers = customers.filter((customer) => customer.status === "checked-in");
  const pendingOrders = orders.filter((order) => order.status === "pending");
  const fulfillingOrders = orders.filter((order) => order.status === "fulfilling");
  const readyOrders = orders.filter((order) => order.status === "ready");

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Fulfillment Board</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
          marginTop: "20px"
        }}
      >
        <div style={columnStyle}>
          <h3>Checked In</h3>
          {checkedInCustomers.length === 0 ? (
            <p>No checked-in customers.</p>
          ) : (
            checkedInCustomers.map((customer) => (
              <div key={customer.id} style={cardStyle}>
                <strong>{customer.customerId}</strong>
                <div style={smallText}>Age: {customer.age}</div>
                {customer.residencyStatus && (
                  <div style={smallText}>Residency: {customer.residencyStatus}</div>
                )}
              </div>
            ))
          )}
        </div>

        <div style={columnStyle}>
          <h3>Pending</h3>
          {pendingOrders.length === 0 ? (
            <p>No pending purchases.</p>
          ) : (
            pendingOrders.map((order) => (
              <div key={order.id} style={cardStyle}>
                <strong>{order.item}</strong>
                <div style={smallText}>{order.customerId}</div>
                <div style={smallText}>Qty: {order.quantity}</div>
                <button
                  onClick={() => onUpdateStatus(order.id, "fulfilling")}
                  style={actionButton("#f59e0b")}
                >
                  Start Fulfilling
                </button>
              </div>
            ))
          )}
        </div>

        <div style={columnStyle}>
          <h3>Fulfilling</h3>
          {fulfillingOrders.length === 0 ? (
            <p>No orders in fulfillment.</p>
          ) : (
            fulfillingOrders.map((order) => (
              <div key={order.id} style={cardStyle}>
                <strong>{order.item}</strong>
                <div style={smallText}>{order.customerId}</div>
                <div style={smallText}>Qty: {order.quantity}</div>
                <button
                  onClick={() => onUpdateStatus(order.id, "ready")}
                  style={actionButton("#22c55e")}
                >
                  Mark Ready
                </button>
              </div>
            ))
          )}
        </div>

        <div style={columnStyle}>
          <h3>Ready for Pickup</h3>
          {readyOrders.length === 0 ? (
            <p>No ready orders.</p>
          ) : (
            readyOrders.map((order) => (
              <div key={order.id} style={cardStyle}>
                <strong>{order.item}</strong>
                <div style={smallText}>{order.customerId}</div>
                <div style={smallText}>Qty: {order.quantity}</div>
                <button
                  onClick={() => onPickup(order.id)}
                  style={actionButton("#7c3aed")}
                >
                  Complete Pickup
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const columnStyle = {
  backgroundColor: "#f8fafc",
  padding: "16px",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  minHeight: "320px"
};

const cardStyle = {
  backgroundColor: "white",
  padding: "12px",
  borderRadius: "8px",
  marginBottom: "10px",
  border: "1px solid #d1d5db",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
};

const smallText = {
  marginTop: "4px",
  fontSize: "14px",
  color: "#475569"
};

const actionButton = (backgroundColor) => ({
  marginTop: "10px",
  backgroundColor,
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: "600",
  width: "100%"
});

export default StaffDashboard;