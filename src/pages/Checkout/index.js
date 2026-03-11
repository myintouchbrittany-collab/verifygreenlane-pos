import React, { useMemo, useState } from "react";
import { useOrders } from "../../context/OrdersContext";
import {
  getOrderWorkflowLabel,
  updateOrderWorkflow,
} from "../../services/orderService";
import { formatCurrency, formatStatusLabel } from "../../services/orderUtils";

export default function Checkout() {
  const { orders } = useOrders();
  const [searchTerm, setSearchTerm] = useState("");

  const readyOrders = useMemo(() => {
    return orders
      .filter((order) => order.orderStatus === "ready_for_pickup")
      .filter((order) => {
        const name = (order.customerName || order.name || "").toLowerCase();
        const orderNumber = (order.orderNumber || order.order || "").toLowerCase();
        const search = searchTerm.toLowerCase();

        return name.includes(search) || orderNumber.includes(search);
      });
  }, [orders, searchTerm]);

  const completePickup = async (order) => {
    try {
      await updateOrderWorkflow(order.orderId || order.id, order.customerId, {
        status: "completed",
        orderStatus: "completed",
        pickupStatus: "Completed",
        checkoutTime: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      console.error("Checkout error:", error);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={headerRowStyle}>
        <div>
          <h1 style={headingStyle}>Checkout</h1>
          <p style={subheadingStyle}>
            Review preorder items, confirm completion, and close out pickup.
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

      {readyOrders.length === 0 ? (
        <div style={emptyCardStyle}>No customers are ready for checkout.</div>
      ) : (
        <div style={cardGridStyle}>
          {readyOrders.map((order) => (
            <div key={order.orderId || order.id} style={queueCardStyle}>
              <div style={cardHeaderStyle}>
                <h3 style={cardTitleStyle}>{order.customerName || order.name}</h3>
                <span style={badgeStyle("#dff3e8", "#17633c")}>
                  {getOrderWorkflowLabel(order)}
                </span>
              </div>

              <p><strong>Order:</strong> {order.orderNumber || order.order}</p>
              <p><strong>Pickup Window:</strong> {order.pickupWindow || "Not set"}</p>
              <p>
                <strong>ID Status:</strong>{" "}
                {formatStatusLabel(order.idVerificationStatus || "pending_verification")}
              </p>
              <p><strong>Arrival Time:</strong> {order.arrivalTime || "—"}</p>

              <div style={itemsCardStyle}>
                <div style={itemsHeadingStyle}>Preorder Items</div>
                {(order.orderItems || []).length === 0 ? (
                  <div style={emptyItemsStyle}>No line items recorded.</div>
                ) : (
                  order.orderItems.map((item) => (
                    <div key={item.id} style={itemRowStyle}>
                      <div>
                        <div style={itemNameStyle}>{item.name}</div>
                        <div style={itemMetaStyle}>
                          {item.quantity} x {formatCurrency(item.specialPrice || item.price)}
                        </div>
                      </div>
                      <strong>
                        {formatCurrency(
                          (item.specialPrice || item.price) * item.quantity
                        )}
                      </strong>
                    </div>
                  ))
                )}
              </div>

              <div style={totalsRowStyle}>
                <span>Subtotal</span>
                <strong>{formatCurrency(order.subtotal || 0)}</strong>
              </div>
              <div style={totalsRowStyle}>
                <span>Total</span>
                <strong>{formatCurrency(order.total || 0)}</strong>
              </div>

              <button
                style={completeButtonStyle}
                onClick={() => completePickup(order)}
              >
                Confirm Completion
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

const cardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
};

const cardTitleStyle = {
  marginTop: 0,
  color: "#163126",
};

const itemsCardStyle = {
  marginTop: "16px",
  borderRadius: "12px",
  border: "1px solid #e6ece8",
  backgroundColor: "#f8faf8",
  padding: "14px",
};

const itemsHeadingStyle = {
  color: "#163126",
  fontWeight: "700",
  marginBottom: "12px",
};

const emptyItemsStyle = {
  color: "#5c6b63",
  fontSize: "14px",
};

const itemRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginBottom: "10px",
};

const itemNameStyle = {
  color: "#163126",
  fontWeight: "700",
};

const itemMetaStyle = {
  marginTop: "4px",
  color: "#5c6b63",
  fontSize: "13px",
};

const totalsRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "12px",
};

const completeButtonStyle = {
  backgroundColor: "#163126",
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  padding: "10px 16px",
  cursor: "pointer",
  fontWeight: "bold",
  marginTop: "16px",
  width: "100%",
};

const emptyCardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "14px",
  padding: "22px",
  border: "1px solid #e6ece8",
  color: "#5c6b63",
};
