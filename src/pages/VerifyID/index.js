import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useOrders } from "../../context/OrdersContext";
import {
  approvePreorder,
  getNormalizedWorkflowState,
  isReviewQueueOrder,
  rejectPreorder,
} from "../../services/orderService";
import { formatCurrency, formatStatusLabel } from "../../services/orderUtils";

export default function VerifyID() {
  const { orders } = useOrders();
  const [workingOrderId, setWorkingOrderId] = useState("");

  const pendingOrders = useMemo(() => {
    return orders.filter((order) => isReviewQueueOrder(order));
  }, [orders]);

  const handleApprove = async (order) => {
    try {
      setWorkingOrderId(order.orderId || order.id);
      await approvePreorder(order);
    } catch (error) {
      console.error("Error approving preorder:", error);
      alert("There was a problem approving this preorder.");
    } finally {
      setWorkingOrderId("");
    }
  };

  const handleReject = async (order) => {
    try {
      setWorkingOrderId(order.orderId || order.id);
      await rejectPreorder(order);
    } catch (error) {
      console.error("Error rejecting preorder:", error);
      alert("There was a problem rejecting this preorder.");
    } finally {
      setWorkingOrderId("");
    }
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={headingStyle}>Preorder Verification Queue</h1>
          <p style={subheadingStyle}>
            Review orders waiting for ID verification and move them into the
            pickup workflow.
          </p>
        </div>
        <div style={queueCountStyle}>{pendingOrders.length} pending review</div>
      </div>

      {pendingOrders.length === 0 ? (
        <div style={emptyCardStyle}>No preorders are waiting for verification.</div>
      ) : (
        <div style={cardGridStyle}>
          {pendingOrders.map((order) => {
            const orderId = order.orderId || order.id;
            const isWorking = workingOrderId === orderId;
            const { verificationStatus, orderStatus } =
              getNormalizedWorkflowState(order);

            return (
              <article key={orderId} style={queueCardStyle}>
                <div style={cardTopStyle}>
                  <div>
                    <h2 style={cardTitleStyle}>
                      <Link to={`/orders/${orderId}`} style={linkStyle}>
                        {order.customerName || order.name}
                      </Link>
                    </h2>
                    <div style={cardMetaStyle}>
                      <Link to={`/orders/${orderId}`} style={linkStyle}>
                        {order.orderNumber || order.order}
                      </Link>
                    </div>
                  </div>
                  <span style={badgeStyle("#fff4d6", "#8a6500")}>
                    {formatStatusLabel(verificationStatus)}
                  </span>
                </div>

                <div style={detailsGridStyle}>
                  <div style={detailCardStyle}>
                    <div style={detailLabelStyle}>Pickup Code</div>
                    <div style={detailValueStyle}>{order.pickupCode || "Pending"}</div>
                  </div>
                  <div style={detailCardStyle}>
                    <div style={detailLabelStyle}>Order Status</div>
                    <div style={detailValueStyle}>{formatStatusLabel(orderStatus)}</div>
                  </div>
                  <div style={detailCardStyle}>
                    <div style={detailLabelStyle}>Items</div>
                    <div style={detailValueStyle}>{order.itemCount || 0}</div>
                  </div>
                  <div style={detailCardStyle}>
                    <div style={detailLabelStyle}>Total</div>
                    <div style={detailValueStyle}>
                      {formatCurrency(order.total || 0)}
                    </div>
                  </div>
                </div>

                {(order.orderItems || []).length ? (
                  <div style={itemsPanelStyle}>
                    <div style={panelHeadingStyle}>Preorder Summary</div>
                    {order.orderItems.map((item) => (
                      <div key={item.id} style={itemRowStyle}>
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

                <div style={actionRowStyle}>
                  <button
                    type="button"
                    style={approveButtonStyle}
                    onClick={() => handleApprove(order)}
                    disabled={isWorking}
                  >
                    {isWorking ? "Updating..." : "Approve"}
                  </button>
                  <button
                    type="button"
                    style={rejectButtonStyle}
                    onClick={() => handleReject(order)}
                    disabled={isWorking}
                  >
                    Reject
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function badgeStyle(backgroundColor, color) {
  return {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
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

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
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

const queueCountStyle = {
  borderRadius: "999px",
  backgroundColor: "#163126",
  color: "#ffffff",
  padding: "10px 14px",
  fontWeight: "700",
};

const emptyCardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  padding: "24px",
  border: "1px solid #e6ece8",
  color: "#5c6b63",
};

const cardGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
  gap: "18px",
};

const queueCardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "18px",
  padding: "22px",
  border: "1px solid #e6ece8",
  boxShadow: "0 6px 18px rgba(0, 0, 0, 0.06)",
};

const cardTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "flex-start",
};

const cardTitleStyle = {
  margin: 0,
  color: "#163126",
  fontSize: "22px",
};

const cardMetaStyle = {
  marginTop: "6px",
  color: "#5c6b63",
  fontSize: "13px",
};

const detailsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
  gap: "12px",
  marginTop: "18px",
};

const detailCardStyle = {
  borderRadius: "14px",
  backgroundColor: "#f8faf8",
  border: "1px solid #e6ece8",
  padding: "14px",
};

const detailLabelStyle = {
  color: "#5c6b63",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: "6px",
};

const detailValueStyle = {
  color: "#163126",
  fontWeight: "700",
};

const itemsPanelStyle = {
  marginTop: "16px",
  borderRadius: "14px",
  backgroundColor: "#fbfcfb",
  border: "1px solid #e6ece8",
  padding: "14px",
};

const panelHeadingStyle = {
  color: "#163126",
  fontWeight: "700",
  marginBottom: "10px",
};

const itemRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "8px",
  color: "#1f2e27",
};

const actionRowStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "18px",
};

const approveButtonStyle = {
  backgroundColor: "#1f7a4d",
  color: "#ffffff",
  border: "none",
  borderRadius: "10px",
  padding: "12px 16px",
  cursor: "pointer",
  fontWeight: "700",
};

const rejectButtonStyle = {
  backgroundColor: "#7d2d2d",
  color: "#ffffff",
  border: "none",
  borderRadius: "10px",
  padding: "12px 16px",
  cursor: "pointer",
  fontWeight: "700",
};

const linkStyle = {
  color: "#17633c",
  textDecoration: "none",
  fontWeight: "700",
};
