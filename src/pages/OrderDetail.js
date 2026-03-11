import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { formatCurrency, formatStatusLabel } from "../services/orderUtils";
import {
  approvePreorder,
  canEnterExpressPickup,
  getOrderWorkflowLabel,
  rejectPreorder,
  subscribeOrderDetail,
  updateOrderWorkflow,
} from "../services/orderService";

export default function OrderDetail() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workingAction, setWorkingAction] = useState("");

  useEffect(() => {
    setLoading(true);
    return subscribeOrderDetail(orderId, (record) => {
      setOrder(record);
      setLoading(false);
    });
  }, [orderId]);

  const runAction = async (action, handler) => {
    if (!order) {
      return;
    }

    try {
      setWorkingAction(action);
      await handler();
    } catch (error) {
      console.error(`Order action failed: ${action}`, error);
      alert("There was a problem updating this order.");
    } finally {
      setWorkingAction("");
    }
  };

  if (loading) {
    return <div style={pageStyle}>Loading order...</div>;
  }

  if (!order) {
    return (
      <div style={pageStyle}>
        <div style={emptyCardStyle}>
          <h1 style={headingStyle}>Order not found</h1>
          <Link to="/dashboard" style={backLinkStyle}>
            Return to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={headerRowStyle}>
        <div>
          <Link to="/dashboard" style={backLinkStyle}>
            Back to dashboard
          </Link>
          <h1 style={headingStyle}>{order.customerName || order.name}</h1>
          <p style={subheadingStyle}>
            {order.orderNumber || order.order} | {getOrderWorkflowLabel(order)}
          </p>
        </div>
      </div>

      <div style={layoutStyle}>
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Order Details</h2>
          <div style={detailsGridStyle}>
            <Detail label="Customer" value={order.customerName || order.name} />
            <Detail label="Order Number" value={order.orderNumber || order.order} />
            <Detail label="Pickup Window" value={order.pickupWindow || "Not set"} />
            <Detail label="Order Notes" value={order.notes || "None"} />
            <Detail
              label="ID Upload Status"
              value={order.idUploadComplete ? "Uploaded" : "Missing"}
            />
            <Detail
              label="Verification Status"
              value={formatStatusLabel(
                order.verificationStatus || order.idVerificationStatus
              )}
            />
            <Detail
              label="Express Eligibility"
              value={order.expressEligible ? "Eligible" : "Not Eligible"}
            />
            <Detail
              label="Order Status"
              value={formatStatusLabel(order.orderStatus || order.status)}
            />
          </div>

          <div style={itemsPanelStyle}>
            <h3 style={subsectionTitleStyle}>Items</h3>
            {(order.orderItems || []).length === 0 ? (
              <div style={emptyCopyStyle}>No line items recorded.</div>
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
        </section>

        <aside style={cardStyle}>
          <h2 style={sectionTitleStyle}>Staff Actions</h2>
          <div style={actionListStyle}>
            <button
              type="button"
              style={approveButtonStyle}
              disabled={
                workingAction !== "" || (order.orderStatus || order.status) !== "pending_review"
              }
              onClick={() => runAction("approve", () => approvePreorder(order))}
            >
              {workingAction === "approve" ? "Approving..." : "Approve"}
            </button>
            <button
              type="button"
              style={rejectButtonStyle}
              disabled={
                workingAction !== "" || (order.orderStatus || order.status) === "completed"
              }
              onClick={() => runAction("reject", () => rejectPreorder(order))}
            >
              {workingAction === "reject" ? "Rejecting..." : "Reject"}
            </button>
            <button
              type="button"
              style={actionButtonStyle}
              disabled={workingAction !== "" || !canEnterExpressPickup(order)}
              onClick={() =>
                runAction("checkin", () =>
                  updateOrderWorkflow(order.orderId || order.id, order.customerId, {
                    checkedIn: true,
                    arrivalTime: new Date().toLocaleTimeString(),
                    status: "checked_in",
                    orderStatus: "checked_in",
                    pickupStatus: "Checked In",
                  })
                )
              }
            >
              {workingAction === "checkin" ? "Checking In..." : "Check In"}
            </button>
            <button
              type="button"
              style={actionButtonStyle}
              disabled={
                workingAction !== "" ||
                !["checked_in", "express_ready"].includes(order.orderStatus)
              }
              onClick={() =>
                runAction("ready", () =>
                  updateOrderWorkflow(order.orderId || order.id, order.customerId, {
                    status: "ready_for_pickup",
                    orderStatus: "ready_for_pickup",
                    pickupStatus: "Ready for Pickup",
                  })
                )
              }
            >
              {workingAction === "ready" ? "Marking Ready..." : "Mark Ready"}
            </button>
            <button
              type="button"
              style={completeButtonStyle}
              disabled={workingAction !== "" || order.orderStatus !== "ready_for_pickup"}
              onClick={() =>
                runAction("complete", () =>
                  updateOrderWorkflow(order.orderId || order.id, order.customerId, {
                    status: "completed",
                    orderStatus: "completed",
                    pickupStatus: "Completed",
                    checkoutTime: new Date().toLocaleTimeString(),
                  })
                )
              }
            >
              {workingAction === "complete" ? "Completing..." : "Complete"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div style={detailCardStyle}>
      <div style={detailLabelStyle}>{label}</div>
      <div style={detailValueStyle}>{value}</div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  backgroundColor: "#f4f7f5",
  padding: "32px",
  fontFamily: "Arial, sans-serif",
};

const headerRowStyle = {
  marginBottom: "24px",
};

const backLinkStyle = {
  color: "#17633c",
  textDecoration: "none",
  fontWeight: "700",
};

const headingStyle = {
  margin: "10px 0 4px",
  color: "#163126",
  fontSize: "32px",
};

const subheadingStyle = {
  margin: 0,
  color: "#5c6b63",
};

const layoutStyle = {
  display: "grid",
  gridTemplateColumns: "1.5fr 0.9fr",
  gap: "20px",
};

const cardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  padding: "22px",
  border: "1px solid #e6ece8",
  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
};

const sectionTitleStyle = {
  marginTop: 0,
  color: "#163126",
};

const detailsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "12px",
};

const detailCardStyle = {
  borderRadius: "12px",
  padding: "14px",
  border: "1px solid #e6ece8",
  backgroundColor: "#f8faf8",
};

const detailLabelStyle = {
  fontSize: "12px",
  textTransform: "uppercase",
  color: "#5c6b63",
  marginBottom: "6px",
};

const detailValueStyle = {
  color: "#163126",
  fontWeight: "700",
};

const itemsPanelStyle = {
  marginTop: "18px",
};

const subsectionTitleStyle = {
  color: "#163126",
};

const emptyCopyStyle = {
  color: "#5c6b63",
};

const itemRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  padding: "12px 0",
  borderBottom: "1px solid #edf2ee",
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

const actionListStyle = {
  display: "grid",
  gap: "10px",
};

const actionButtonStyle = {
  backgroundColor: "#163126",
  color: "#ffffff",
  border: "none",
  borderRadius: "10px",
  padding: "12px 14px",
  cursor: "pointer",
  fontWeight: "700",
};

const approveButtonStyle = {
  ...actionButtonStyle,
  backgroundColor: "#1f7a4d",
};

const rejectButtonStyle = {
  ...actionButtonStyle,
  backgroundColor: "#7d2d2d",
};

const completeButtonStyle = {
  ...actionButtonStyle,
  backgroundColor: "#2057a6",
};

const emptyCardStyle = {
  ...cardStyle,
  maxWidth: "560px",
};
