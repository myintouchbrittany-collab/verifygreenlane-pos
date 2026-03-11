import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useOrders } from "../../context/OrdersContext";
import {
  canGeneratePickupCode,
  getOrderWorkflowLabel,
  isActiveOrder,
  updateOrderWorkflow,
} from "../../services/orderService";
import { formatStatusLabel } from "../../services/orderUtils";

function Dashboard() {
  const { orders, completeOrder } = useOrders();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (!isActiveOrder(order)) {
        return false;
      }

      const name = (order.customerName || order.name || "").toLowerCase();
      const orderNumber = (order.orderNumber || order.order || "").toLowerCase();
      const search = searchTerm.toLowerCase();

      return name.includes(search) || orderNumber.includes(search);
    });
  }, [orders, searchTerm]);

  const incomingPreorders = useMemo(() => {
    return orders.filter(
      (order) => isActiveOrder(order) && order.source === "Customer Preorder"
    );
  }, [orders]);

  const expressQueue = useMemo(() => {
    return orders.filter(
      (order) =>
        ["approved", "express_ready"].includes(order.orderStatus) &&
        order.expressEligible &&
        !order.checkedIn &&
        canGeneratePickupCode(order)
    );
  }, [orders]);

  const checkedInCount = orders.filter(
    (order) => order.orderStatus === "checked_in"
  ).length;
  const waitingCount = orders.filter(
    (order) => (order.orderStatus || "draft") === "pending_review"
  ).length;
  const readyCount = orders.filter(
    (order) => order.orderStatus === "ready_for_pickup"
  ).length;
  const completedCount = orders.filter(
    (order) => order.orderStatus === "completed"
  ).length;

  const markReady = async (order) => {
    try {
      await updateOrderWorkflow(order.orderId || order.id, order.customerId, {
        status: "ready_for_pickup",
        orderStatus: "ready_for_pickup",
        pickupStatus: "Ready for Pickup",
      });
    } catch (error) {
      console.error("Error marking ready:", error);
    }
  };

  const markCompleted = async (order) => {
    try {
      await completeOrder(order.orderId || order.id);
    } catch (error) {
      console.error("Error marking completed:", error);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={headerRowStyle}>
        <div>
          <h1 style={headingStyle}>Staff Dashboard</h1>
          <p style={subheadingStyle}>
            Live pickup queue with incoming preorders, item counts, and ID state.
          </p>
        </div>
      </div>

      <div style={statsGridStyle}>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Checked In</div>
          <div style={statValueStyle}>{checkedInCount}</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Pending Review</div>
          <div style={statValueStyle}>{waitingCount}</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Ready</div>
          <div style={statValueStyle}>{readyCount}</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Completed</div>
          <div style={statValueStyle}>{completedCount}</div>
        </div>
      </div>

      <div style={preorderCardStyle}>
        <div style={tableHeaderRowStyle}>
          <div>
            <h2 style={sectionTitleStyle}>Incoming Preorders</h2>
            <p style={sectionSubtextStyle}>
              Customer name, item count, pickup window, and ID upload state.
            </p>
          </div>
        </div>

        {incomingPreorders.length === 0 ? (
          <p style={emptyTextStyle}>No incoming preorders.</p>
        ) : (
          <div style={preorderGridStyle}>
            {incomingPreorders.map((order) => (
              <div key={order.orderId || order.id} style={preorderQueueCardStyle}>
                <div style={preorderTopStyle}>
                  <div>
                    <h3 style={preorderNameStyle}>
                      <Link
                        to={`/orders/${order.orderId || order.id}`}
                        style={cardLinkStyle}
                      >
                        {order.customerName || order.name}
                      </Link>
                    </h3>
                    <div style={preorderMetaStyle}>
                      <Link
                        to={`/orders/${order.orderId || order.id}`}
                        style={cardMetaLinkStyle}
                      >
                        {order.orderNumber || order.order}
                      </Link>
                    </div>
                  </div>
                  <span style={getBadgeStyle(order.idVerificationStatus || "pending")}>
                    {formatStatusLabel(order.idVerificationStatus || "pending_verification")}
                  </span>
                </div>
                <p style={preorderBodyStyle}>
                  <strong>Items:</strong> {order.itemCount || 0}
                </p>
                <p style={preorderBodyStyle}>
                  <strong>Pickup Window:</strong> {order.pickupWindow || "Not set"}
                </p>
                <p style={preorderBodyStyle}>
                  <strong>ID Uploaded:</strong> {order.idUploadComplete ? "Yes" : "No"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={preorderCardStyle}>
        <div style={tableHeaderRowStyle}>
          <div>
            <h2 style={sectionTitleStyle}>Express Pickup Queue</h2>
            <p style={sectionSubtextStyle}>
              Approved express orders awaiting arrival at the pickup counter.
            </p>
          </div>
        </div>

        {expressQueue.length === 0 ? (
          <p style={emptyTextStyle}>No express pickup orders are waiting for arrival.</p>
        ) : (
          <div style={preorderGridStyle}>
            {expressQueue.map((order) => (
              <div key={order.orderId || order.id} style={preorderQueueCardStyle}>
                <div style={preorderTopStyle}>
                  <div>
                    <h3 style={preorderNameStyle}>
                      <Link
                        to={`/orders/${order.orderId || order.id}`}
                        style={cardLinkStyle}
                      >
                        {order.customerName || order.name}
                      </Link>
                    </h3>
                    <div style={preorderMetaStyle}>
                      <Link
                        to={`/orders/${order.orderId || order.id}`}
                        style={cardMetaLinkStyle}
                      >
                        {order.orderNumber || order.order}
                      </Link>
                    </div>
                  </div>
                  <span style={getBadgeStyle("Express Eligible")}>
                    Express Eligible
                  </span>
                </div>
                <p style={preorderBodyStyle}>
                  <strong>Pickup Window:</strong> {order.pickupWindow || "Not set"}
                </p>
                <p style={preorderBodyStyle}>
                  <strong>Verification:</strong>{" "}
                  {formatStatusLabel(order.idVerificationStatus || "pending_verification")}
                </p>
                <p style={preorderBodyStyle}>
                  <strong>QR Pass:</strong> {order.pickupCode ? "Ready" : "Pending"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={tableCardStyle}>
        <div style={tableHeaderRowStyle}>
          <div>
            <h2 style={sectionTitleStyle}>Pickup Workflow</h2>
            <p style={sectionSubtextStyle}>
              Search by customer name or order number.
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

        {filteredOrders.length === 0 ? (
          <p style={emptyTextStyle}>No orders found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Customer</th>
                  <th style={thStyle}>Order</th>
                  <th style={thStyle}>Items</th>
                  <th style={thStyle}>Pickup Window</th>
                  <th style={thStyle}>ID Status</th>
                  <th style={thStyle}>Express</th>
                  <th style={thStyle}>Order Status</th>
                  <th style={thStyle}>Check-In</th>
                  <th style={thStyle}>Arrival Time</th>
                  <th style={thStyle}>Checkout Time</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.orderId || order.id}>
                    <td style={tdStyle}>
                      <Link
                        to={`/orders/${order.orderId || order.id}`}
                        style={rowLinkStyle}
                      >
                        {order.customerName || order.name || "-"}
                      </Link>
                    </td>
                    <td style={tdStyle}>
                      <Link
                        to={`/orders/${order.orderId || order.id}`}
                        style={rowLinkStyle}
                      >
                        {order.orderNumber || order.order || "-"}
                      </Link>
                    </td>
                    <td style={tdStyle}>{order.itemCount || 0}</td>
                    <td style={tdStyle}>{order.pickupWindow || "-"}</td>
                    <td style={tdStyle}>
                      <span style={getBadgeStyle(order.idVerificationStatus || "pending")}>
                        {formatStatusLabel(
                          order.idVerificationStatus || "pending_verification"
                        )}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={getBadgeStyle(
                          order.expressEligible ? "Express Eligible" : "Not Eligible"
                        )}
                      >
                        {order.expressEligible ? "Express Eligible" : "Not Eligible"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={getBadgeStyle(order.orderStatus || order.status || "draft")}>
                        {getOrderWorkflowLabel(order)}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={getBadgeStyle(order.checkedIn ? "Checked In" : "Not Checked In")}>
                        {order.checkedIn ? "Checked In" : "Not Checked In"}
                      </span>
                    </td>
                    <td style={tdStyle}>{order.arrivalTime || "-"}</td>
                    <td style={tdStyle}>{order.checkoutTime || "-"}</td>
                    <td style={tdStyle}>
                      <div style={actionGroupStyle}>
                        <button
                          style={readyButtonStyle}
                          onClick={() => markReady(order)}
                          disabled={
                            !order.checkedIn ||
                            !["checked_in", "express_ready"].includes(order.orderStatus) ||
                            !order.idUploadComplete ||
                            !order.expressEligible ||
                            order.orderStatus === "ready_for_pickup" ||
                            order.orderStatus === "completed" ||
                            order.orderStatus === "rejected"
                          }
                        >
                          Ready
                        </button>
                        <button
                          style={completeButtonStyle}
                          onClick={() => markCompleted(order)}
                          disabled={order.orderStatus !== "ready_for_pickup"}
                        >
                          Complete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

function getBadgeStyle(text) {
  let backgroundColor = "#edf2ee";
  let color = "#234333";

  if (
    text === "Verified" ||
    text === "verified" ||
    text === "Express Eligible" ||
    text === "Approved" ||
    text === "approved" ||
    text === "Express Ready" ||
    text === "express_ready" ||
    text === "Checked In" ||
    text === "checked_in" ||
    text === "Ready for Pickup" ||
    text === "ready_for_pickup" ||
    text === "ready" ||
    text === "Preparing"
  ) {
    backgroundColor = "#dff3e8";
    color = "#17633c";
  }

  if (
    text === "Waiting" ||
    text === "Pending" ||
    text === "Pending Review" ||
    text === "pending_review" ||
    text === "Not Checked In" ||
    text === "pending" ||
    text === "Pending Verification" ||
    text === "pending_verification"
  ) {
    backgroundColor = "#fff4d6";
    color = "#8a6500";
  }

  if (
    text === "Not Eligible" ||
    text === "not_eligible" ||
    text === "Resubmission Requested" ||
    text === "resubmission_requested"
  ) {
    backgroundColor = "#fdebd1";
    color = "#9a5d00";
  }

  if (text === "Rejected" || text === "rejected") {
    backgroundColor = "#fde2e2";
    color = "#a12626";
  }

  if (text === "Completed" || text === "completed") {
    backgroundColor = "#e3eefc";
    color = "#2057a6";
  }

  return {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "bold",
    backgroundColor,
    color,
    whiteSpace: "nowrap",
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
  marginBottom: "24px",
  flexWrap: "wrap",
  gap: "12px",
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

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "18px",
  marginBottom: "28px",
};

const statCardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "14px",
  padding: "22px",
  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
  border: "1px solid #e6ece8",
};

const statLabelStyle = {
  color: "#5c6b63",
  fontSize: "14px",
  marginBottom: "10px",
};

const statValueStyle = {
  color: "#163126",
  fontSize: "32px",
  fontWeight: "bold",
};

const preorderCardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "14px",
  padding: "22px",
  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
  border: "1px solid #e6ece8",
  marginBottom: "28px",
};

const preorderGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "14px",
  marginTop: "12px",
};

const preorderQueueCardStyle = {
  borderRadius: "14px",
  border: "1px solid #e6ece8",
  backgroundColor: "#f8faf8",
  padding: "18px",
};

const preorderTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  alignItems: "flex-start",
};

const preorderNameStyle = {
  margin: 0,
  color: "#163126",
  fontSize: "18px",
};

const preorderMetaStyle = {
  marginTop: "6px",
  fontSize: "13px",
};

const preorderBodyStyle = {
  marginBottom: 0,
  color: "#1f2e27",
};

const tableCardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "14px",
  padding: "22px",
  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
  border: "1px solid #e6ece8",
};

const tableHeaderRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
  marginBottom: "12px",
};

const sectionTitleStyle = {
  marginTop: 0,
  marginBottom: "6px",
  color: "#163126",
};

const sectionSubtextStyle = {
  color: "#5c6b63",
  marginTop: 0,
};

const searchInputStyle = {
  padding: "12px",
  minWidth: "260px",
  borderRadius: "8px",
  border: "1px solid #cfd8d3",
  fontSize: "14px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "18px",
};

const thStyle = {
  textAlign: "left",
  padding: "14px 12px",
  borderBottom: "1px solid #dfe7e1",
  color: "#486056",
  fontSize: "14px",
  backgroundColor: "#f8faf8",
};

const tdStyle = {
  padding: "14px 12px",
  borderBottom: "1px solid #edf2ee",
  color: "#1f2e27",
  fontSize: "14px",
  verticalAlign: "middle",
};

const actionGroupStyle = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
};

const readyButtonStyle = {
  backgroundColor: "#1f7a4d",
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: "bold",
};

const completeButtonStyle = {
  backgroundColor: "#163126",
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: "bold",
};

const rowLinkStyle = {
  color: "#17633c",
  textDecoration: "none",
  fontWeight: "700",
};

const cardLinkStyle = {
  ...rowLinkStyle,
};

const cardMetaLinkStyle = {
  color: "#5c6b63",
  textDecoration: "none",
  fontWeight: "700",
};

const emptyTextStyle = {
  color: "#5c6b63",
  marginTop: "6px",
};
