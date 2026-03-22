import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { formatCurrency, formatStatusLabel } from "../services/orderUtils";
import {
  approvePreorder,
  getNormalizedWorkflowState,
  getOrderWorkflowLabel,
  rejectPreorder,
  subscribeOrderDetail,
  updateOrderWorkflow,
} from "../services/orderService";

function buildOptimisticOrder(currentOrder, updates) {
  if (!currentOrder) {
    return currentOrder;
  }

  return {
    ...currentOrder,
    ...updates,
    orderStatus: updates.orderStatus || currentOrder.orderStatus,
    status: updates.orderStatus || updates.status || currentOrder.status,
    verificationStatus:
      updates.verificationStatus || currentOrder.verificationStatus,
    idVerificationStatus:
      updates.idVerificationStatus ||
      updates.verificationStatus ||
      currentOrder.idVerificationStatus,
    checkedIn:
      updates.checkedIn !== undefined ? Boolean(updates.checkedIn) : currentOrder.checkedIn,
    checkInStatus:
      updates.checkInStatus !== undefined
        ? updates.checkInStatus
        : currentOrder.checkInStatus,
    expressEligible:
      updates.expressEligible !== undefined
        ? Boolean(updates.expressEligible)
        : currentOrder.expressEligible,
    pickupCode:
      updates.pickupCode !== undefined ? updates.pickupCode : currentOrder.pickupCode,
    arrivalTime:
      updates.arrivalTime !== undefined ? updates.arrivalTime : currentOrder.arrivalTime,
    checkoutTime:
      updates.checkoutTime !== undefined
        ? updates.checkoutTime
        : currentOrder.checkoutTime,
  };
}

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

  const { orderStatus: normalizedOrderStatus, verificationStatus: normalizedVerificationStatus, checkInStatus } =
    getNormalizedWorkflowState(order);
  const canApprove =
    Boolean(order) &&
    workingAction === "" &&
    normalizedOrderStatus !== "completed" &&
    normalizedVerificationStatus !== "verified";
  const canReject = Boolean(order) && workingAction === "" && normalizedOrderStatus !== "completed";
  const canMarkReady =
    Boolean(order) &&
    workingAction === "" &&
    (normalizedOrderStatus === "checked_in" ||
      normalizedOrderStatus === "express_ready");
  const canStartPrep =
    Boolean(order) && workingAction === "" && normalizedOrderStatus === "checked_in";
  const canCheckIn =
    Boolean(order) &&
    workingAction === "" &&
    normalizedOrderStatus === "approved" &&
    checkInStatus !== "checked_in";
  const canComplete =
    Boolean(order) &&
    workingAction === "" &&
    normalizedOrderStatus === "ready_for_pickup";

  const detailRows = useMemo(
    () => [
      { label: "Customer", value: order?.customerName || order?.name },
      { label: "Order Number", value: order?.orderNumber || order?.order },
      { label: "Pickup Window", value: order?.pickupWindow || "Not set" },
      { label: "Order Notes", value: order?.notes || "None" },
      {
        label: "ID Upload Status",
        value: order?.idUploadComplete ? "Uploaded" : "Missing",
      },
      {
        label: "Verification Status",
        value: formatStatusLabel(
          order?.verificationStatus || order?.idVerificationStatus
        ),
      },
      {
        label: "Express Eligibility",
        value: order?.expressEligible ? "Eligible" : "Not Eligible",
      },
      {
        label: "Order Status",
        value: formatStatusLabel(order?.orderStatus || order?.status),
      },
      {
        label: "Check-In Status",
        value: formatStatusLabel(order?.checkInStatus || "not_arrived"),
      },
    ],
    [order]
  );

  const runAction = async (action, handler) => {
    if (!order) {
      return;
    }

    try {
      setWorkingAction(action);
      const updates = await handler();
      if (updates) {
        setOrder((currentOrder) => buildOptimisticOrder(currentOrder, updates));
      }
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
            {detailRows.map((detail) => (
              <Detail key={detail.label} label={detail.label} value={detail.value} />
            ))}
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
              disabled={!canApprove}
              onClick={() => runAction("approve", () => approvePreorder(order))}
            >
              {workingAction === "approve" ? "Approving..." : "Approve"}
            </button>
            <button
              type="button"
              style={rejectButtonStyle}
              disabled={!canReject}
              onClick={() => runAction("reject", () => rejectPreorder(order))}
            >
              {workingAction === "reject" ? "Rejecting..." : "Reject"}
            </button>
            <button
              type="button"
              style={actionButtonStyle}
              disabled={!canCheckIn}
              onClick={() =>
                runAction("checkin", () =>
                  updateOrderWorkflow(order.orderId || order.id, order.customerId, {
                    orderStatus: "checked_in",
                    checkInStatus: "checked_in",
                    checkedIn: true,
                    arrivalTime: new Date().toLocaleTimeString(),
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
              disabled={!canStartPrep}
              onClick={() =>
                runAction("prep", () =>
                  updateOrderWorkflow(order.orderId || order.id, order.customerId, {
                    orderStatus: "express_ready",
                    pickupStatus: "Preparing",
                  })
                )
              }
            >
              {workingAction === "prep" ? "Starting Prep..." : "Start Prep"}
            </button>
            <button
              type="button"
              style={actionButtonStyle}
              disabled={!canMarkReady}
              onClick={() =>
                runAction("ready", () =>
                  updateOrderWorkflow(order.orderId || order.id, order.customerId, {
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
              disabled={!canComplete}
              onClick={() =>
                runAction("complete", () =>
                  updateOrderWorkflow(order.orderId || order.id, order.customerId, {
                    orderStatus: "completed",
                    pickupStatus: "Completed",
                    checkoutTime: new Date().toLocaleTimeString(),
                    completedAt: new Date().toISOString(),
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
