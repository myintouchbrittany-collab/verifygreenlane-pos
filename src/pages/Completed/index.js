import React, { useMemo } from "react";
import { useOrders } from "../../context/OrdersContext";
import { isCompletedOrder } from "../../services/orderService";
import { formatStatusLabel } from "../../services/orderUtils";

export default function Completed() {
  const { orders } = useOrders();

  const completedOrders = useMemo(() => {
    return orders.filter((order) => isCompletedOrder(order));
  }, [orders]);

  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>Completed Orders</h1>
      <p style={subheadingStyle}>
        Orders that have been fully completed and handed off.
      </p>

      {completedOrders.length === 0 ? (
        <p style={{ color: "#5c6b63", marginTop: "20px" }}>
          No completed orders yet.
        </p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: "20px" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Order ID</th>
                <th style={thStyle}>Order Number</th>
                <th style={thStyle}>Pickup Code</th>
                <th style={thStyle}>Verification</th>
                <th style={thStyle}>Completed At</th>
              </tr>
            </thead>
            <tbody>
              {completedOrders.map((order) => (
                <tr key={order.orderId || order.id}>
                  <td style={tdStyle}>{order.orderId || order.id}</td>
                  <td style={tdStyle}>{order.orderNumber || order.order}</td>
                  <td style={tdStyle}>{order.pickupCode || "-"}</td>
                  <td style={tdStyle}>
                    {formatStatusLabel(order.verificationStatus || "pending")}
                  </td>
                  <td style={tdStyle}>
                    {order.completedAt
                      ? new Date(order.completedAt).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  backgroundColor: "#f4f7f5",
  padding: "32px",
  fontFamily: "Arial, sans-serif",
};

const headingStyle = {
  margin: 0,
  color: "#163126",
  fontSize: "32px",
};

const subheadingStyle = {
  marginTop: "8px",
  color: "#5c6b63",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  backgroundColor: "#ffffff",
  borderRadius: "14px",
  overflow: "hidden",
  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
};

const thStyle = {
  textAlign: "left",
  padding: "14px",
  borderBottom: "1px solid #dfe7e1",
  backgroundColor: "#f8faf8",
  color: "#486056",
};

const tdStyle = {
  padding: "14px",
  borderBottom: "1px solid #edf2ee",
  color: "#1f2e27",
};
