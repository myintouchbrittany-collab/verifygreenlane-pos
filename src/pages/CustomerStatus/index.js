import React, { useEffect, useMemo } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useOrders } from "../../context/OrdersContext";
import {
  canGeneratePickupCode,
  canCustomerCheckIn,
  getCustomerProgressSteps,
  getCustomerStatusPresentation,
} from "../../services/orderService";
import {
  getCustomerOrderSnapshot,
  getLatestCustomerOrderId,
  saveCustomerOrderSnapshot,
} from "../../services/customerOrderSession";
import { useOrderRecord } from "../../hooks/useOrderRecord";
import { formatCurrency } from "../../services/orderUtils";

function formatSubmittedAt(value) {
  if (!value) {
    return "Not available";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsedDate);
}

function ProgressStep({ step, isLast }) {
  return (
    <div style={progressStepStyle}>
      <div style={progressRailStyle}>
        <div
          style={{
            ...progressDotStyle,
            ...(step.status === "complete"
              ? progressDotCompleteStyle
              : step.status === "current"
                ? progressDotCurrentStyle
                : progressDotUpcomingStyle),
          }}
        />
        {!isLast ? (
          <div
            style={{
              ...progressLineStyle,
              backgroundColor:
                step.status === "complete" ? "#1f7a4d" : "#d7e1db",
            }}
          />
        ) : null}
      </div>

      <div>
        <div style={progressLabelStyle}>{step.label}</div>
        <div style={progressCaptionStyle}>{step.caption}</div>
      </div>
    </div>
  );
}

export default function CustomerStatus() {
  const { loading, orders } = useOrders();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const requestedOrderId = searchParams.get("orderId") || getLatestCustomerOrderId();
  const { order: liveOrder, loading: liveOrderLoading } = useOrderRecord(requestedOrderId);

  const sharedOrder = useMemo(() => {
    return orders.find((entry) => (entry.orderId || entry.id) === requestedOrderId) || null;
  }, [orders, requestedOrderId]);

  const order = useMemo(() => {
    if (liveOrder) {
      return liveOrder;
    }

    if (sharedOrder) {
      return sharedOrder;
    }

    if (loading || liveOrderLoading) {
      return getCustomerOrderSnapshot(requestedOrderId);
    }

    return null;
  }, [liveOrder, sharedOrder, loading, liveOrderLoading, requestedOrderId]);

  useEffect(() => {
    if (order) {
      saveCustomerOrderSnapshot(order);
    }
  }, [order]);

  if (!requestedOrderId && !loading) {
    return (
      <div style={pageStyle}>
        <div style={emptyCardStyle}>
          <h1 style={titleStyle}>No recent preorder found</h1>
          <p style={copyStyle}>
            Place a preorder to see your live order status and pickup code here.
          </p>
          <Link to="/order" style={primaryButtonStyle}>
            Start a preorder
          </Link>
        </div>
      </div>
    );
  }

  if ((loading || liveOrderLoading) && !order) {
    return <div style={pageStyle}>Loading customer status...</div>;
  }

  if (!order) {
    return (
      <div style={pageStyle}>
        <div style={emptyCardStyle}>
          <h1 style={titleStyle}>Order not found</h1>
          <p style={copyStyle}>
            We could not load that preorder from the shared order data.
          </p>
          <Link to="/order" style={primaryButtonStyle}>
            Start a preorder
          </Link>
        </div>
      </div>
    );
  }

  const items = order.items || order.orderItems || [];
  const pickupCodeReady = canGeneratePickupCode(order);
  const statusPresentation = getCustomerStatusPresentation(order);
  const progressSteps = getCustomerProgressSteps(order);

  return (
    <div style={pageStyle}>
      <div style={layoutStyle}>
        <section style={heroCardStyle}>
          <div style={heroTopRowStyle}>
            <div>
              <div style={eyebrowStyle}>Live Order Tracking</div>
              <h1 style={titleStyle}>{statusPresentation.headline}</h1>
              <p style={copyStyle}>{statusPresentation.bodyMessage}</p>
            </div>

            <div style={statusPillStyle}>{statusPresentation.statusLabel}</div>
          </div>

          {location.state?.successMessage ? (
            <div style={successBannerStyle}>{location.state.successMessage}</div>
          ) : null}

          <div style={heroMessageCardStyle}>
            <div style={heroMessageLabelStyle}>What’s happening now</div>
            <div style={heroMessageValueStyle}>{statusPresentation.helperText}</div>
          </div>
        </section>

        <section style={progressCardStyle}>
          <div style={sectionTitleStyle}>Pickup Progress</div>
          <div style={progressGridStyle}>
            {progressSteps.map((step, index) => (
              <ProgressStep
                key={step.id}
                step={step}
                isLast={index === progressSteps.length - 1}
              />
            ))}
          </div>
        </section>

        <section style={infoGridStyle}>
          <div style={detailsCardStyle}>
            <div style={sectionTitleStyle}>Order Details</div>
            <div style={detailsGridStyle}>
              <div style={detailTileStyle}>
                <div style={detailLabelStyle}>Order ID</div>
                <div style={detailValueStyle}>{order.orderId || order.id}</div>
              </div>
              <div style={detailTileStyle}>
                <div style={detailLabelStyle}>Order Number</div>
                <div style={detailValueStyle}>{order.orderNumber || order.order}</div>
              </div>
              <div style={detailTileStyle}>
                <div style={detailLabelStyle}>Submitted</div>
                <div style={detailValueStyle}>{formatSubmittedAt(order.createdAt)}</div>
              </div>
              <div style={detailTileStyle}>
                <div style={detailLabelStyle}>Pickup Window</div>
                <div style={detailValueStyle}>{order.pickupWindow || "Not selected"}</div>
              </div>
              <div style={detailTileStyle}>
                <div style={detailLabelStyle}>Pickup Code</div>
                <div style={detailValueStyle}>
                  {pickupCodeReady ? order.pickupCode : "Available after approval"}
                </div>
              </div>
              <div style={detailTileStyle}>
                <div style={detailLabelStyle}>Total</div>
                <div style={detailValueStyle}>{formatCurrency(order.total || 0)}</div>
              </div>
            </div>
          </div>

          <div style={summaryCardStyle}>
            <div style={sectionTitleStyle}>Pickup Actions</div>
            <div style={actionListStyle}>
              {canCustomerCheckIn(order) ? (
                <Link
                  to={`/check-in?pickupCode=${encodeURIComponent(order.pickupCode || "")}`}
                  style={primaryButtonStyle}
                >
                  Parking Lot Check-In
                </Link>
              ) : null}
              <Link to="/order" style={secondaryButtonStyle}>
                Start Another Order
              </Link>
            </div>
          </div>
        </section>

        <section style={itemsCardStyle}>
          <div style={sectionTitleStyle}>Items Ordered</div>
          <div style={itemListStyle}>
            {items.length === 0 ? (
              <div style={emptyItemStyle}>No items recorded.</div>
            ) : (
              items.map((item) => (
                <div key={item.id} style={itemRowStyle}>
                  <div>
                    <div style={itemNameStyle}>{item.name}</div>
                    <div style={itemMetaStyle}>
                      {item.quantity} x {formatCurrency(item.price || 0)}
                    </div>
                  </div>
                  <strong style={itemTotalStyle}>
                    {formatCurrency(
                      (Number(item.price) || 0) * (Number(item.quantity) || 0)
                    )}
                  </strong>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  padding: "40px 20px 56px",
  fontFamily: "Arial, sans-serif",
  background: "linear-gradient(180deg, #f4f7f5 0%, #f8faf8 100%)",
};

const layoutStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 980px)",
  justifyContent: "center",
  gap: "22px",
};

const sharedCardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "24px",
  border: "1px solid #e6ece8",
  boxShadow: "0 18px 40px rgba(22, 49, 38, 0.08)",
};

const heroCardStyle = {
  ...sharedCardStyle,
  padding: "28px",
};

const progressCardStyle = {
  ...sharedCardStyle,
  padding: "24px 28px",
};

const detailsCardStyle = {
  ...sharedCardStyle,
  padding: "24px",
};

const summaryCardStyle = {
  ...sharedCardStyle,
  padding: "24px",
};

const itemsCardStyle = {
  ...sharedCardStyle,
  padding: "24px",
};

const emptyCardStyle = {
  ...sharedCardStyle,
  maxWidth: "560px",
  padding: "30px",
};

const heroTopRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "18px",
  flexWrap: "wrap",
};

const eyebrowStyle = {
  display: "inline-block",
  padding: "6px 12px",
  borderRadius: "999px",
  backgroundColor: "#eef5f1",
  color: "#17633c",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const titleStyle = {
  margin: "16px 0 10px",
  color: "#163126",
  fontSize: "36px",
  lineHeight: 1.1,
};

const copyStyle = {
  color: "#5c6b63",
  margin: 0,
  fontSize: "16px",
  lineHeight: 1.6,
  maxWidth: "680px",
};

const statusPillStyle = {
  borderRadius: "999px",
  padding: "10px 14px",
  backgroundColor: "#163126",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "700",
};

const heroMessageCardStyle = {
  marginTop: "24px",
  borderRadius: "20px",
  padding: "20px",
  backgroundColor: "#f6faf7",
  border: "1px solid #e2ece6",
};

const heroMessageLabelStyle = {
  color: "#5c6b63",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  fontWeight: "700",
};

const heroMessageValueStyle = {
  marginTop: "10px",
  color: "#163126",
  fontSize: "18px",
  fontWeight: "700",
  lineHeight: 1.45,
};

const sectionTitleStyle = {
  color: "#163126",
  fontSize: "22px",
  fontWeight: "800",
};

const progressGridStyle = {
  display: "grid",
  gap: "14px",
  marginTop: "18px",
};

const progressStepStyle = {
  display: "grid",
  gridTemplateColumns: "28px 1fr",
  gap: "14px",
  alignItems: "start",
};

const progressRailStyle = {
  display: "grid",
  justifyItems: "center",
};

const progressDotStyle = {
  width: "14px",
  height: "14px",
  borderRadius: "999px",
  border: "2px solid #d7e1db",
  boxSizing: "border-box",
};

const progressDotCompleteStyle = {
  backgroundColor: "#1f7a4d",
  borderColor: "#1f7a4d",
};

const progressDotCurrentStyle = {
  backgroundColor: "#ffffff",
  borderColor: "#163126",
  boxShadow: "0 0 0 4px rgba(22, 49, 38, 0.12)",
};

const progressDotUpcomingStyle = {
  backgroundColor: "#ffffff",
};

const progressLineStyle = {
  width: "2px",
  minHeight: "32px",
  marginTop: "6px",
  borderRadius: "999px",
};

const progressLabelStyle = {
  color: "#163126",
  fontWeight: "700",
  fontSize: "15px",
};

const progressCaptionStyle = {
  color: "#5c6b63",
  fontSize: "14px",
  marginTop: "4px",
};

const infoGridStyle = {
  display: "grid",
  gridTemplateColumns: "1.5fr 0.9fr",
  gap: "22px",
};

const detailsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "14px",
  marginTop: "18px",
};

const detailTileStyle = {
  borderRadius: "18px",
  backgroundColor: "#f8faf8",
  border: "1px solid #e6ece8",
  padding: "16px",
};

const detailLabelStyle = {
  fontSize: "12px",
  color: "#5c6b63",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "8px",
  fontWeight: "700",
};

const detailValueStyle = {
  color: "#163126",
  fontWeight: "700",
  fontSize: "15px",
  wordBreak: "break-word",
  lineHeight: 1.45,
};

const actionListStyle = {
  display: "grid",
  gap: "14px",
  marginTop: "18px",
};

const itemListStyle = {
  display: "grid",
  gap: "12px",
  marginTop: "18px",
};

const emptyItemStyle = {
  border: "1px dashed #cdd8d1",
  borderRadius: "18px",
  padding: "18px",
  color: "#5c6b63",
  backgroundColor: "#fafcfb",
};

const itemRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  alignItems: "center",
  border: "1px solid #e6ece8",
  borderRadius: "18px",
  padding: "16px",
  backgroundColor: "#fbfcfb",
};

const itemNameStyle = {
  color: "#163126",
  fontWeight: "700",
  fontSize: "15px",
};

const itemMetaStyle = {
  color: "#5c6b63",
  fontSize: "14px",
  marginTop: "6px",
};

const itemTotalStyle = {
  color: "#163126",
};

const primaryButtonStyle = {
  display: "inline-block",
  backgroundColor: "#163126",
  color: "#ffffff",
  textDecoration: "none",
  borderRadius: "16px",
  padding: "14px 18px",
  fontWeight: "700",
  textAlign: "center",
  boxShadow: "0 10px 18px rgba(10, 36, 24, 0.08)",
};

const secondaryButtonStyle = {
  display: "inline-block",
  backgroundColor: "#eef4f0",
  color: "#163126",
  textDecoration: "none",
  borderRadius: "16px",
  padding: "14px 18px",
  fontWeight: "700",
  textAlign: "center",
  border: "1px solid #d9e4dd",
};

const successBannerStyle = {
  marginTop: "18px",
  borderRadius: "16px",
  backgroundColor: "#e7f5ed",
  color: "#17633c",
  padding: "14px 16px",
  fontWeight: "700",
};
