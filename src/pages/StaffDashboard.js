import React, { useMemo } from "react";
import { useOrders } from "../context/OrdersContext";

function StaffDashboard() {
  const { orders, completeOrder, updateOrder } = useOrders();

  const pendingReview = useMemo(
    () => orders.filter((order) => order.orderStatus === "pending_review"),
    [orders]
  );
  const approved = useMemo(
    () => orders.filter((order) => order.orderStatus === "approved"),
    [orders]
  );
  const checkedIn = useMemo(
    () => orders.filter((order) => order.orderStatus === "checked_in"),
    [orders]
  );
  const ready = useMemo(
    () => orders.filter((order) => order.orderStatus === "ready_for_pickup"),
    [orders]
  );

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Fulfillment Board</h2>

      <div style={boardStyle}>
        <Column title="Pending Review" orders={pendingReview} />
        <Column
          title="Approved"
          orders={approved}
          actionLabel="Check In"
          onAction={(order) =>
            updateOrder(order.orderId || order.id, {
              checkedIn: true,
              arrivalTime: new Date().toLocaleTimeString(),
              status: "checked_in",
              orderStatus: "checked_in",
              pickupStatus: "Checked In",
            })
          }
        />
        <Column
          title="Checked In"
          orders={checkedIn}
          actionLabel="Mark Ready"
          onAction={(order) =>
            updateOrder(order.orderId || order.id, {
              status: "ready_for_pickup",
              orderStatus: "ready_for_pickup",
              pickupStatus: "Ready for Pickup",
            })
          }
        />
        <Column
          title="Ready for Pickup"
          orders={ready}
          actionLabel="Complete"
          onAction={(order) => completeOrder(order.orderId || order.id)}
        />
      </div>
    </div>
  );
}

function Column({ title, orders, actionLabel, onAction }) {
  return (
    <div style={columnStyle}>
      <h3>{title}</h3>
      {orders.length === 0 ? (
        <p>No orders.</p>
      ) : (
        orders.map((order) => (
          <div key={order.orderId || order.id} style={cardStyle}>
            <strong>{order.customerName || order.name}</strong>
            <div style={smallText}>{order.orderNumber || order.order}</div>
            <div style={smallText}>{order.pickupWindow || "No pickup window"}</div>
            {onAction ? (
              <button
                onClick={() => onAction(order)}
                style={actionButton(
                  title === "Ready for Pickup" ? "#7c3aed" : "#1f7a4d"
                )}
              >
                {actionLabel}
              </button>
            ) : null}
          </div>
        ))
      )}
    </div>
  );
}

const boardStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "20px",
  marginTop: "20px",
};

const columnStyle = {
  backgroundColor: "#f8fafc",
  padding: "16px",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  minHeight: "320px",
};

const cardStyle = {
  backgroundColor: "white",
  padding: "12px",
  borderRadius: "8px",
  marginBottom: "10px",
  border: "1px solid #d1d5db",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};

const smallText = {
  marginTop: "4px",
  fontSize: "14px",
  color: "#475569",
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
  width: "100%",
});

export default StaffDashboard;
