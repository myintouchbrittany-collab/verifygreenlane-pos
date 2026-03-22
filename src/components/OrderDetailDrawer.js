import React from "react";
import { Link } from "react-router-dom";
import { useOrderRecord } from "../hooks/useOrderRecord";
import { formatCurrency, formatStatusLabel } from "../services/orderUtils";
import {
  formatActivityTime,
  getActivityEntryLabel,
  getOrderActivityTimeline,
} from "../services/orderActivity";
import { getNextQueueAction, getQueueStatusLabel } from "../services/liveQueue";

function formatDateTime(value) {
  if (!value) {
    return "Not available";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function Field({ label, value }) {
  return (
    <div style={fieldCardStyle}>
      <div style={fieldLabelStyle}>{label}</div>
      <div style={fieldValueStyle}>{value || "Not available"}</div>
    </div>
  );
}

export default function OrderDetailDrawer({
  orderId,
  busyOrderId,
  onClose,
  onRunAction,
}) {
  const { order, loading } = useOrderRecord(orderId);

  if (!orderId) {
    return null;
  }

  const timeline = getOrderActivityTimeline(order);
  const nextAction = order ? getNextQueueAction(order) : null;
  const isBusy = busyOrderId === (order?.orderId || order?.id);
  const items = order?.orderItems || order?.items || [];

  return (
    <div style={overlayStyle} onClick={onClose}>
      <aside
        style={drawerStyle}
        onClick={(event) => event.stopPropagation()}
        aria-label="Order detail panel"
      >
        <div style={drawerHeaderStyle}>
          <div>
            <div style={eyebrowStyle}>Order Detail</div>
            <h2 style={headingStyle}>
              {order?.customerName || order?.name || "Loading order"}
            </h2>
            {order ? (
              <div style={subheadingStyle}>
                {order.orderNumber || order.order || order.orderId} |{" "}
                {getQueueStatusLabel(order)}
              </div>
            ) : null}
          </div>

          <button type="button" onClick={onClose} style={closeButtonStyle}>
            Close
          </button>
        </div>

        {loading && !order ? (
          <div style={emptyStateStyle}>Loading order details...</div>
        ) : !order ? (
          <div style={emptyStateStyle}>Order details are unavailable.</div>
        ) : (
          <>
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>Snapshot</div>
              <div style={gridStyle}>
                <Field label="Customer Name" value={order.customerName || order.name} />
                <Field label="Order ID" value={order.orderId || order.id} />
                <Field label="Order Number" value={order.orderNumber || order.order} />
                <Field label="Pickup Code" value={order.pickupCode} />
                <Field
                  label="Verification Status"
                  value={formatStatusLabel(order.verificationStatus || order.idVerificationStatus)}
                />
                <Field
                  label="Current Order Status"
                  value={formatStatusLabel(order.orderStatus || order.status)}
                />
                <Field label="Submitted Time" value={formatDateTime(order.createdAt)} />
                <Field
                  label="Arrival Time"
                  value={order.arrivalTime || formatDateTime(order.arrivedAt || order.checkedInAt)}
                />
                <Field
                  label="Pickup Time"
                  value={order.checkoutTime || formatDateTime(order.completedAt)}
                />
                <Field label="Parking Spot" value={order.parkingSpot} />
                <Field label="Vehicle Color" value={order.vehicleColor} />
                <Field label="Customer Note" value={order.customerCheckInNote || order.notes} />
              </div>
            </div>

            <div style={sectionStyle}>
              <div style={sectionTitleRowStyle}>
                <div style={sectionTitleStyle}>Next Action</div>
                <Link to={`/orders/${order.orderId || order.id}`} style={fullPageLinkStyle}>
                  Full Order Page
                </Link>
              </div>

              {nextAction ? (
                <button
                  type="button"
                  style={actionButtonStyle}
                  disabled={isBusy}
                  onClick={() => onRunAction(order, nextAction)}
                >
                  {isBusy ? "Updating..." : nextAction.label}
                </button>
              ) : (
                <div style={mutedCopyStyle}>No further staff action is needed.</div>
              )}
            </div>

            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>Items</div>
              {items.length === 0 ? (
                <div style={mutedCopyStyle}>No line items recorded.</div>
              ) : (
                <div style={itemListStyle}>
                  {items.map((item) => (
                    <div key={item.id || `${item.name}-${item.quantity}`} style={itemRowStyle}>
                      <div>
                        <div style={itemNameStyle}>{item.name}</div>
                        <div style={itemMetaStyle}>
                          {item.quantity} x {formatCurrency(item.specialPrice || item.price || 0)}
                        </div>
                      </div>
                      <strong>
                        {formatCurrency(
                          (Number(item.specialPrice || item.price) || 0) *
                            (Number(item.quantity) || 0)
                        )}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>Activity Timeline</div>
              {timeline.length === 0 ? (
                <div style={mutedCopyStyle}>No activity logged yet.</div>
              ) : (
                <div style={timelineStyle}>
                  {timeline.map((entry) => (
                    <div key={entry.id} style={timelineEntryStyle}>
                      <div style={timelineDotStyle} />
                      <div>
                        <div style={timelineTitleStyle}>
                          {getActivityEntryLabel(entry.type)}
                        </div>
                        <div style={timelineMetaStyle}>
                          {formatActivityTime(entry.timestamp)}
                          {entry.performedBy ? ` | ${entry.performedBy}` : ""}
                        </div>
                        {entry.details ? (
                          <div style={timelineDetailsStyle}>{entry.details}</div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(14, 28, 22, 0.26)",
  display: "flex",
  justifyContent: "flex-end",
  zIndex: 50,
};

const drawerStyle = {
  width: "min(100%, 560px)",
  height: "100%",
  overflowY: "auto",
  backgroundColor: "#fcfcfb",
  boxShadow: "-20px 0 52px rgba(10, 36, 24, 0.16)",
  padding: "28px",
  boxSizing: "border-box",
};

const drawerHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
};

const eyebrowStyle = {
  color: "#2b6b4c",
  fontWeight: "800",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const headingStyle = {
  margin: "12px 0 8px",
  color: "#163126",
  fontSize: "32px",
  lineHeight: 1.1,
};

const subheadingStyle = {
  color: "#5c6b63",
  fontSize: "15px",
};

const closeButtonStyle = {
  backgroundColor: "#163126",
  color: "#ffffff",
  border: "none",
  borderRadius: "999px",
  padding: "12px 16px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "14px",
  boxShadow: "0 10px 18px rgba(10, 36, 24, 0.08)",
};

const sectionStyle = {
  marginTop: "32px",
};

const sectionTitleStyle = {
  color: "#163126",
  fontSize: "22px",
  fontWeight: "800",
};

const sectionTitleRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "14px",
  flexWrap: "wrap",
  marginBottom: "14px",
};

const fullPageLinkStyle = {
  color: "#17633c",
  textDecoration: "none",
  fontWeight: "700",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "14px",
  marginTop: "16px",
};

const fieldCardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "18px",
  border: "1px solid #e6ece8",
  padding: "16px",
  boxShadow: "0 8px 18px rgba(12, 34, 24, 0.05)",
};

const fieldLabelStyle = {
  color: "#5c6b63",
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: "10px",
};

const fieldValueStyle = {
  color: "#163126",
  fontWeight: "700",
  wordBreak: "break-word",
  fontSize: "15px",
  lineHeight: 1.45,
};

const actionButtonStyle = {
  backgroundColor: "#163126",
  color: "#ffffff",
  border: "none",
  borderRadius: "14px",
  padding: "14px 18px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "14px",
  boxShadow: "0 10px 18px rgba(10, 36, 24, 0.08)",
};

const mutedCopyStyle = {
  marginTop: "14px",
  color: "#5c6b63",
  fontSize: "15px",
  lineHeight: 1.5,
};

const itemListStyle = {
  marginTop: "16px",
  display: "grid",
  gap: "12px",
};

const itemRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "14px",
  borderRadius: "18px",
  border: "1px solid #e6ece8",
  backgroundColor: "#ffffff",
  padding: "16px",
  boxShadow: "0 8px 18px rgba(12, 34, 24, 0.05)",
};

const itemNameStyle = {
  color: "#163126",
  fontWeight: "700",
};

const itemMetaStyle = {
  color: "#5c6b63",
  fontSize: "14px",
  marginTop: "6px",
};

const timelineStyle = {
  marginTop: "16px",
  display: "grid",
  gap: "16px",
};

const timelineEntryStyle = {
  display: "grid",
  gridTemplateColumns: "18px 1fr",
  gap: "14px",
  alignItems: "flex-start",
  padding: "14px 16px",
  borderRadius: "18px",
  backgroundColor: "#ffffff",
  border: "1px solid #e6ece8",
  boxShadow: "0 8px 18px rgba(12, 34, 24, 0.04)",
};

const timelineDotStyle = {
  width: "10px",
  height: "10px",
  borderRadius: "999px",
  backgroundColor: "#1f7a4d",
  marginTop: "6px",
};

const timelineTitleStyle = {
  color: "#163126",
  fontWeight: "700",
  fontSize: "15px",
};

const timelineMetaStyle = {
  color: "#5c6b63",
  fontSize: "14px",
  marginTop: "6px",
};

const timelineDetailsStyle = {
  color: "#4c5f57",
  fontSize: "14px",
  marginTop: "8px",
  lineHeight: 1.45,
};

const emptyStateStyle = {
  marginTop: "20px",
  color: "#5c6b63",
  fontSize: "15px",
};
