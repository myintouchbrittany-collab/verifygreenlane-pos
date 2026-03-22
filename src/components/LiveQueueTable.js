import React from "react";
import {
  formatWaitTime,
  getArrivalLabel,
  getNextQueueAction,
  getNextBestActionLabel,
  getQueueStatusLabel,
  getVerificationLabel,
  getWaitUrgency,
} from "../services/liveQueue";

function getBadgeStyle(variant) {
  const variants = {
    neutral: {
      backgroundColor: "#edf2ee",
      color: "#234333",
    },
    success: {
      backgroundColor: "#dff3e8",
      color: "#17633c",
    },
    warning: {
      backgroundColor: "#fff4d6",
      color: "#8a6500",
    },
    danger: {
      backgroundColor: "#fde2e2",
      color: "#a12626",
    },
    info: {
      backgroundColor: "#e5eefb",
      color: "#2057a6",
    },
  };

  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "7px 12px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "700",
    whiteSpace: "nowrap",
    ...(variants[variant] || variants.neutral),
  };
}

function getVerificationVariant(label) {
  if (label === "Verified") {
    return "success";
  }

  if (label === "Issue") {
    return "danger";
  }

  return "warning";
}

function getArrivalVariant(label) {
  return label === "Arrived" ? "info" : "neutral";
}

function getStatusVariant(label) {
  if (label === "Ready" || label === "Preparing") {
    return "success";
  }

  if (label === "Arrived") {
    return "info";
  }

  if (label === "Verified") {
    return "neutral";
  }

  return "warning";
}

function getNextBestActionVariant(label) {
  if (label === "Priority") {
    return "danger";
  }

  if (label === "Call Customer") {
    return "success";
  }

  if (label === "Start Prep" || label === "Continue Prep") {
    return "info";
  }

  if (label === "Waiting for customer") {
    return "neutral";
  }

  return "warning";
}

function getRowStyle(order, now) {
  const urgency = getWaitUrgency(order, now);

  if (urgency === "overdue") {
    return {
      ...rowStyle,
      background:
        "linear-gradient(90deg, rgba(193, 72, 55, 0.16) 0%, rgba(255, 255, 255, 0.96) 16%)",
    };
  }

  if (urgency === "warning") {
    return {
      ...rowStyle,
      background:
        "linear-gradient(90deg, rgba(224, 177, 35, 0.18) 0%, rgba(255, 255, 255, 0.96) 16%)",
    };
  }

  if (urgency === "fresh") {
    return {
      ...rowStyle,
      background:
        "linear-gradient(90deg, rgba(56, 148, 96, 0.14) 0%, rgba(255, 255, 255, 0.96) 16%)",
    };
  }

  return rowStyle;
}

export default function LiveQueueTable({
  orders,
  now,
  busyOrderId,
  onRunAction,
  onSelectOrder,
}) {
  if (orders.length === 0) {
    return (
      <div style={emptyStateStyle}>
        No active pickup orders are in the live queue right now.
      </div>
    );
  }

  return (
    <div style={tableScrollStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Customer Name</th>
            <th style={thStyle}>Pickup Code</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Arrival Status</th>
            <th style={thStyle}>Wait Time</th>
            <th style={thStyle}>Next Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const orderId = order.orderId || order.id;
            const action = getNextQueueAction(order);
            const verificationLabel = getVerificationLabel(order);
            const arrivalLabel = getArrivalLabel(order);
            const statusLabel = getQueueStatusLabel(order);
            const nextBestActionLabel = getNextBestActionLabel(order, now);
            const waitUrgency = getWaitUrgency(order, now);
            const isBusy = busyOrderId === orderId;

            return (
              <tr
                key={orderId}
                style={{
                  ...getRowStyle(order, now),
                  cursor: onSelectOrder ? "pointer" : "default",
                }}
                onClick={() => onSelectOrder?.(order)}
              >
                <td style={tdStyle}>
                  <button
                    type="button"
                    style={rowButtonStyle}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectOrder?.(order);
                    }}
                  >
                    {order.customerName || order.name || "-"}
                  </button>
                  {order.vehicleColor ? (
                    <div style={detailHintStyle}>Vehicle: {order.vehicleColor}</div>
                  ) : null}
                </td>
                <td style={tdStyle}>
                  <span style={monoTextStyle}>{order.pickupCode || "-"}</span>
                  <div style={idHintStyle}>
                    {order.orderNumber || order.order || orderId}
                  </div>
                </td>
                <td style={tdStyle}>
                  <div style={statusStackStyle}>
                    <span style={getBadgeStyle(getStatusVariant(statusLabel))}>
                      {statusLabel}
                    </span>
                    <span style={getBadgeStyle(getVerificationVariant(verificationLabel))}>
                      {verificationLabel}
                    </span>
                  </div>
                </td>
                <td style={tdStyle}>
                  <span style={getBadgeStyle(getArrivalVariant(arrivalLabel))}>
                    {arrivalLabel}
                  </span>
                  {order.parkingSpot ? (
                    <div style={detailHintStyle}>Spot {order.parkingSpot}</div>
                  ) : null}
                  {order.customerCheckInNote ? (
                    <div style={noteHintStyle}>{order.customerCheckInNote}</div>
                  ) : null}
                </td>
                <td style={tdStyle}>
                  <span
                    style={{
                      ...waitTextStyle,
                      color:
                        waitUrgency === "overdue"
                          ? "#8b241f"
                          : waitUrgency === "warning"
                            ? "#8a6500"
                            : waitUrgency === "fresh"
                              ? "#17633c"
                              : "#234333",
                    }}
                  >
                    {formatWaitTime(order, now)}
                  </span>
                </td>
                <td style={tdStyle}>
                  <div style={bestActionCellStyle}>
                    <span style={getBadgeStyle(getNextBestActionVariant(nextBestActionLabel))}>
                      {nextBestActionLabel}
                    </span>
                  {action ? (
                    <button
                      type="button"
                      style={actionButtonStyle}
                      disabled={isBusy}
                      onClick={(event) => {
                        event.stopPropagation();
                        onRunAction(order, action);
                      }}
                    >
                      {isBusy ? "Updating..." : action.label}
                    </button>
                  ) : (
                    <span style={mutedTextStyle}>No action</span>
                  )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const tableScrollStyle = {
  overflowX: "auto",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
  minWidth: "1120px",
  fontSize: "15px",
};

const thStyle = {
  textAlign: "left",
  padding: "16px 18px",
  color: "#486056",
  fontSize: "13px",
  letterSpacing: "0.03em",
  backgroundColor: "#f8faf9",
  borderBottom: "1px solid #dfe7e1",
  position: "sticky",
  top: 0,
};

const rowStyle = {
  backgroundColor: "#ffffff",
};

const tdStyle = {
  padding: "18px",
  borderBottom: "1px solid #edf2ee",
  color: "#1f2e27",
  fontSize: "15px",
  verticalAlign: "middle",
};

const rowButtonStyle = {
  padding: 0,
  border: "none",
  background: "transparent",
  color: "#17633c",
  fontWeight: "700",
  cursor: "pointer",
  fontSize: "15px",
  textAlign: "left",
};

const idHintStyle = {
  marginTop: "6px",
  color: "#6c7c74",
  fontSize: "13px",
};

const statusStackStyle = {
  display: "grid",
  gap: "10px",
  justifyItems: "start",
};

const detailHintStyle = {
  marginTop: "8px",
  color: "#53665d",
  fontSize: "13px",
  fontWeight: "600",
};

const noteHintStyle = {
  marginTop: "8px",
  color: "#6c7c74",
  fontSize: "13px",
  maxWidth: "220px",
  lineHeight: 1.4,
};

const monoTextStyle = {
  display: "inline-block",
  maxWidth: "240px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontFamily: "\"Courier New\", monospace",
  fontSize: "13px",
  color: "#365346",
};

const waitTextStyle = {
  fontWeight: "800",
};

const actionButtonStyle = {
  backgroundColor: "#163126",
  color: "#ffffff",
  border: "none",
  borderRadius: "14px",
  padding: "12px 16px",
  cursor: "pointer",
  fontWeight: "700",
  minWidth: "112px",
  fontSize: "14px",
  boxShadow: "0 10px 20px rgba(10, 36, 24, 0.08)",
};

const bestActionCellStyle = {
  display: "grid",
  gap: "12px",
};

const mutedTextStyle = {
  color: "#71827a",
  fontSize: "14px",
};

const emptyStateStyle = {
  padding: "40px 22px",
  borderRadius: "18px",
  border: "1px dashed #cdd8d1",
  color: "#5c6b63",
  textAlign: "center",
  backgroundColor: "#f8faf8",
  fontSize: "15px",
};
