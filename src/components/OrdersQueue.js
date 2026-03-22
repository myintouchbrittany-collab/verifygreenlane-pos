import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getActiveOrdersQueue,
  ORDERS_QUEUE_UPDATED_EVENT,
} from "../services/localOrders";
import { formatCurrency } from "../services/orderUtils";

export default function OrdersQueue() {
  const [queueOrders, setQueueOrders] = useState(() => getActiveOrdersQueue());

  useEffect(() => {
    const syncQueue = () => {
      setQueueOrders(getActiveOrdersQueue());
    };

    window.addEventListener("storage", syncQueue);
    window.addEventListener(ORDERS_QUEUE_UPDATED_EVENT, syncQueue);

    return () => {
      window.removeEventListener("storage", syncQueue);
      window.removeEventListener(ORDERS_QUEUE_UPDATED_EVENT, syncQueue);
    };
  }, []);

  const orders = useMemo(() => queueOrders, [queueOrders]);

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle}>Orders Queue</h2>
          <p style={copyStyle}>
            Live preorder queue backed by the shared `ordersQueue` local storage key.
          </p>
        </div>
        <div style={countBadgeStyle}>{orders.length} active</div>
      </div>

      {orders.length === 0 ? (
        <div style={emptyStateStyle}>No active preorders in the queue.</div>
      ) : (
        <div style={gridStyle}>
          {orders.map((order) => (
            <article key={order.id} style={queueCardStyle}>
              <div style={cardTopStyle}>
                <div>
                  <Link
                    to={`/order-confirmation?orderId=${order.id}`}
                    style={primaryLinkStyle}
                  >
                    {order.customerName}
                  </Link>
                  <div>
                    <Link
                      to={`/order-confirmation?orderId=${order.id}`}
                      style={secondaryLinkStyle}
                    >
                      {order.orderNumber}
                    </Link>
                  </div>
                </div>
                <span style={statusBadgeStyle}>{order.status}</span>
              </div>

              <div style={metaGridStyle}>
                <div style={metaCardStyle}>
                  <div style={metaLabelStyle}>Items</div>
                  <div style={metaValueStyle}>{order.itemCount}</div>
                </div>
                <div style={metaCardStyle}>
                  <div style={metaLabelStyle}>Total</div>
                  <div style={metaValueStyle}>{formatCurrency(order.total || 0)}</div>
                </div>
                <div style={metaCardStyle}>
                  <div style={metaLabelStyle}>Pickup Date</div>
                  <div style={metaValueStyle}>{order.pickupDate || "Not set"}</div>
                </div>
                <div style={metaCardStyle}>
                  <div style={metaLabelStyle}>Pickup Time</div>
                  <div style={metaValueStyle}>{order.pickupTime || "Not set"}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

const cardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "14px",
  padding: "22px",
  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
  border: "1px solid #e6ece8",
  marginBottom: "28px",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
};

const titleStyle = {
  marginTop: 0,
  marginBottom: "6px",
  color: "#163126",
};

const copyStyle = {
  margin: 0,
  color: "#5c6b63",
};

const countBadgeStyle = {
  borderRadius: "999px",
  backgroundColor: "#163126",
  color: "#ffffff",
  padding: "10px 14px",
  fontWeight: "700",
};

const emptyStateStyle = {
  marginTop: "12px",
  color: "#5c6b63",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "14px",
  marginTop: "12px",
};

const queueCardStyle = {
  borderRadius: "14px",
  border: "1px solid #e6ece8",
  backgroundColor: "#f8faf8",
  padding: "18px",
};

const cardTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "flex-start",
};

const primaryLinkStyle = {
  color: "#17633c",
  textDecoration: "none",
  fontWeight: "700",
  fontSize: "18px",
};

const secondaryLinkStyle = {
  color: "#5c6b63",
  textDecoration: "none",
  fontWeight: "700",
};

const statusBadgeStyle = {
  display: "inline-block",
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "700",
  backgroundColor: "#fff4d6",
  color: "#8a6500",
  whiteSpace: "nowrap",
};

const metaGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "10px",
  marginTop: "14px",
};

const metaCardStyle = {
  borderRadius: "12px",
  backgroundColor: "#ffffff",
  border: "1px solid #e6ece8",
  padding: "12px",
};

const metaLabelStyle = {
  color: "#5c6b63",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: "6px",
};

const metaValueStyle = {
  color: "#163126",
  fontWeight: "700",
};
