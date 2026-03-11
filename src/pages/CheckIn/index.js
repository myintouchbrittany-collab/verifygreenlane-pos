import React, { useMemo, useState } from "react";
import { useOrders } from "../../context/OrdersContext";
import {
  canEnterExpressPickup,
  getOrderWorkflowLabel,
  updateOrderWorkflow,
} from "../../services/orderService";
import { formatCurrency, formatStatusLabel } from "../../services/orderUtils";

export default function CheckIn() {
  const { orders } = useOrders();
  const [searchTerm, setSearchTerm] = useState("");

  const activeOrders = useMemo(() => {
    return orders
      .filter((order) => canEnterExpressPickup(order))
      .filter((order) => {
        const name = (order.customerName || order.name || "").toLowerCase();
        const orderNumber = (order.orderNumber || order.order || "").toLowerCase();
        const search = searchTerm.toLowerCase();

        return name.includes(search) || orderNumber.includes(search);
      });
  }, [orders, searchTerm]);

  const checkInCustomer = async (order) => {
    try {
      await updateOrderWorkflow(order.orderId || order.id, order.customerId, {
        checkedIn: true,
        arrivalTime: new Date().toLocaleTimeString(),
        status: "checked_in",
        orderStatus: "checked_in",
        pickupStatus: "Checked In",
      });
    } catch (error) {
      console.error("Check-in error:", error);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={headerRowStyle}>
        <div>
          <h1 style={headingStyle}>Customer Check-In</h1>
          <p style={subheadingStyle}>
            Check in verified customers and review preorder summaries before prep.
          </p>
        </div>

        <input
          type="text"
          placeholder="Search customer or order..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          style={searchInputStyle}
        />
      </div>

      {activeOrders.length === 0 ? (
        <div style={emptyCardStyle}>No customers waiting for check-in.</div>
      ) : (
        <div style={cardGridStyle}>
          {activeOrders.map((order) => (
            <div key={order.orderId || order.id} style={queueCardStyle}>
              <div style={cardTopStyle}>
                <h3 style={cardTitleStyle}>{order.customerName || order.name}</h3>
                <span
                  style={badgeStyle(
                    order.orderStatus === "ready_for_pickup"
                      ? "#dff3e8"
                      : "#fff4d6",
                    order.orderStatus === "ready_for_pickup"
                      ? "#17633c"
                      : "#8a6500"
                  )}
                >
                  {getOrderWorkflowLabel(order)}
                </span>
              </div>

              <p><strong>Order:</strong> {order.orderNumber || order.order}</p>
              <p><strong>Pickup Window:</strong> {order.pickupWindow || "Not set"}</p>
              <p>
                <strong>ID Status:</strong>{" "}
                {formatStatusLabel(order.idVerificationStatus || "pending_verification")}
              </p>
              <p><strong>Express Lane:</strong> Eligible</p>
              <p><strong>Item Count:</strong> {order.itemCount || 0}</p>

              {(order.orderItems || []).length > 0 ? (
                <div style={summaryCardStyle}>
                  <div style={summaryHeadingStyle}>Preorder Summary</div>
                  {(order.orderItems || []).map((item) => (
                    <div key={item.id} style={summaryRowStyle}>
                      <span>
                        {item.quantity} x {item.name}
                      </span>
                      <strong>
                        {formatCurrency(
                          (item.specialPrice || item.price) * item.quantity
                        )}
                      </strong>
                    </div>
                  ))}
                </div>
              ) : null}

              <button
                onClick={() => checkInCustomer(order)}
                style={primaryButtonStyle}
                disabled={order.checkedIn || !canEnterExpressPickup(order)}
              >
                {order.checkedIn ? "Customer Checked In" : "Check In Customer"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function badgeStyle(backgroundColor, color) {
  return {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "bold",
    backgroundColor,
    color,
  };
}

const pageStyle = {
  minHeight: "100vh",
  backgroundColor: "#f4f7f5",
  padding: "32px",
  fontFamily: "Arial, sans-serif",
};

const headerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "16px",
  marginBottom: "24px",
};

const headingStyle = {
  margin: 0,
  color: "#163126",
  fontSize: "32px",
};

const subheadingStyle = {
  marginTop: "8px",
  color: "#5c6b63",
  fontSize: "15px",
};

const searchInputStyle = {
  padding: "12px",
  minWidth: "260px",
  borderRadius: "8px",
  border: "1px solid #cfd8d3",
  fontSize: "14px",
};

const cardGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "18px",
};

const queueCardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "14px",
  padding: "22px",
  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
  border: "1px solid #e6ece8",
};

const cardTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
};

const cardTitleStyle = {
  marginTop: 0,
  color: "#163126",
  marginBottom: "8px",
};

const summaryCardStyle = {
  borderRadius: "12px",
  border: "1px solid #e6ece8",
  backgroundColor: "#f8faf8",
  padding: "14px",
  marginTop: "14px",
};

const summaryHeadingStyle = {
  fontWeight: "700",
  color: "#163126",
  marginBottom: "10px",
};

const summaryRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "8px",
  color: "#1f2e27",
  fontSize: "14px",
};

const primaryButtonStyle = {
  backgroundColor: "#1f7a4d",
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  padding: "10px 16px",
  cursor: "pointer",
  fontWeight: "bold",
  marginTop: "14px",
};

const emptyCardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "14px",
  padding: "22px",
  border: "1px solid #e6ece8",
  color: "#5c6b63",
};
