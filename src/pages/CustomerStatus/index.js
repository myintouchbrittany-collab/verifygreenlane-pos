import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useOrders } from "../../context/OrdersContext";
import { formatCurrency, formatStatusLabel } from "../../services/orderUtils";
import {
  canGeneratePickupCode,
  getOrderWorkflowLabel,
  updateOrderWorkflow,
} from "../../services/orderService";

function CustomerStatus() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { loading: ordersLoading, orders } = useOrders();
  const [customer, setCustomer] = useState(null);
  const orderId = searchParams.get("orderId");

  const matchingOrder = useMemo(() => {
    if (!orderId) {
      return null;
    }

    return (
      orders.find((order) => (order.orderId || order.id) === orderId) || null
    );
  }, [orderId, orders]);

  useEffect(() => {
    if (!orderId) {
      setCustomer(null);
      return;
    }

    if (matchingOrder) {
      setCustomer(matchingOrder);
      return;
    }

    if (!ordersLoading) {
      setCustomer(null);
    }
  }, [matchingOrder, orderId, ordersLoading]);

  const handleCheckIn = async () => {
    if (!customer) {
      return;
    }

    try {
      await updateOrderWorkflow(customer.orderId || customer.id, customer.id, {
        checkedIn: true,
        arrivalTime: new Date().toLocaleTimeString(),
        status: "checked_in",
        orderStatus: "checked_in",
        pickupStatus: "Checked In",
      });
    } catch (error) {
      console.error("Error checking in:", error);
    }
  };

  if (ordersLoading && orderId) {
    return <div style={loadingStyle}>Loading customer...</div>;
  }

  if (!customer) {
    return (
      <div style={pageStyle}>
        <div style={emptyCardStyle}>
          <h2 style={titleStyle}>Order not found</h2>
          <p style={copyStyle}>
            Start a preorder to generate your pickup pass and live status page.
          </p>
          <Link to="/order" style={linkButtonStyle}>
            Start a preorder
          </Link>
        </div>
      </div>
    );
  }

  const pickupReady =
    canGeneratePickupCode(customer) && Boolean(customer.pickupCode);
  const workflowLabel = getOrderWorkflowLabel(customer);
  const verificationStatus =
    customer.idVerificationStatus ||
    customer.verificationStatus ||
    "pending_verification";
  const verificationLabel = formatStatusLabel(verificationStatus);
  const expressEligible = Boolean(customer.expressEligible);

  return (
    <div style={pageStyle}>
      <div style={layoutStyle}>
        <section style={cardStyle}>
          <h1 style={titleStyle}>Pickup Status</h1>
          {location.state?.successMessage ? (
            <div style={successBannerStyle}>{location.state.successMessage}</div>
          ) : null}
          <p style={copyStyle}>
            Track your preorder, confirm your approval status, and use your
            pickup pass once staff has approved your ID.
          </p>

          <div style={detailsGridStyle}>
            <div style={miniCardStyle}>
              <div style={miniLabelStyle}>Customer</div>
              <div style={miniValueStyle}>{customer.name}</div>
            </div>
            <div style={miniCardStyle}>
              <div style={miniLabelStyle}>Order</div>
              <div style={miniValueStyle}>{customer.order}</div>
            </div>
            <div style={miniCardStyle}>
              <div style={miniLabelStyle}>Pickup Window</div>
              <div style={miniValueStyle}>
                {customer.pickupWindow || "Walk-in preorder"}
              </div>
            </div>
            <div style={miniCardStyle}>
              <div style={miniLabelStyle}>Estimated Total</div>
              <div style={miniValueStyle}>
                {formatCurrency(customer.total || 0)}
              </div>
            </div>
            <div style={miniCardStyle}>
              <div style={miniLabelStyle}>Express Lane</div>
              <div style={miniValueStyle}>
                {expressEligible ? "Eligible" : "Not Eligible"}
              </div>
            </div>
          </div>

          <div style={statusRowStyle}>
            <span
              style={getBadgeStyle(
                customer.idVerificationStatus || customer.status || "pending_verification"
              )}
            >
              {verificationLabel}
            </span>
            <span style={getBadgeStyle(customer.orderStatus || customer.status || "draft")}>
              {workflowLabel}
            </span>
            <span style={getBadgeStyle(expressEligible ? "Express Eligible" : "Not Eligible")}>
              {expressEligible ? "Express Eligible" : "Not Eligible"}
            </span>
            <span style={getBadgeStyle(customer.checkedIn ? "Checked In" : "Not Checked In")}>
              {customer.checkedIn ? "Checked In" : "Not Checked In"}
            </span>
          </div>

          <div style={itemsCardStyle}>
            {(customer.orderItems || []).map((item) => (
              <div key={item.id} style={itemRowStyle}>
                <div>
                  <div style={itemNameStyle}>{item.name}</div>
                  <div style={itemMetaStyle}>
                    {item.quantity} x {formatCurrency(item.specialPrice || item.price)}
                  </div>
                </div>
                <strong>
                  {formatCurrency((item.specialPrice || item.price) * item.quantity)}
                </strong>
              </div>
            ))}
          </div>

          {verificationStatus === "rejected" ? (
            <div style={rejectedMessageStyle}>
              Your preorder was rejected during ID review. Contact the store for
              next steps.
            </div>
          ) : verificationStatus === "resubmission_requested" ? (
            <div style={pendingReviewMessageStyle}>
              Staff requested a new ID upload before this preorder can be
              approved.
            </div>
          ) : !pickupReady ? (
            <div style={pendingReviewMessageStyle}>
              Your preorder is still under staff review. We will generate your
              pickup code as soon as your ID is approved.
            </div>
          ) : customer.checkedIn ? (
            <div style={checkedInMessageStyle}>
              You are checked in. Head to express pickup when called.
            </div>
          ) : (
            <button onClick={handleCheckIn} style={checkInButtonStyle}>
              Check In for Pickup
            </button>
          )}
        </section>

        <aside style={qrSideCardStyle}>
          {pickupReady ? (
            <>
              <QRCodeSVG
                value={customer.pickupCode}
                size={190}
                bgColor="#ffffff"
                fgColor="#163126"
                level="H"
              />
              <div style={qrTitleStyle}>Express Pickup QR</div>
              <div style={qrCopyStyle}>
                Present this at the dispensary so staff can pull up and complete
                your preorder.
              </div>
            </>
          ) : (
            <>
              <div style={pendingQrBadgeStyle}>
                {verificationStatus === "resubmission_requested"
                  ? "Resubmission Needed"
                  : "Pending Approval"}
              </div>
              <div style={qrTitleStyle}>Pickup Pass Locked</div>
              <div style={qrCopyStyle}>
                {verificationStatus === "rejected"
                  ? "This preorder is not eligible for pickup."
                  : verificationStatus === "resubmission_requested"
                    ? "Staff requested a new ID upload before your pickup pass can be issued."
                    : "Staff needs to approve your uploaded ID before your QR pickup pass is available."}
              </div>
            </>
          )}
          <div style={uploadNoteStyle}>
            ID upload: {customer.idUploadComplete ? "Received" : "Missing"}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default CustomerStatus;

function getBadgeStyle(text) {
  let backgroundColor = "#edf2ee";
  let color = "#234333";

  if (
    text === "Checked In" ||
    text === "Verified" ||
    text === "verified" ||
    text === "Express Eligible" ||
    text === "Ready for Pickup" ||
    text === "Completed" ||
    text === "approved" ||
    text === "Approved" ||
    text === "Preparing" ||
    text === "ready_for_pickup" ||
    text === "Ready"
  ) {
    backgroundColor = "#dff3e8";
    color = "#17633c";
  }

  if (
    text === "Pending" ||
    text === "Pending Review" ||
    text === "Waiting" ||
    text === "Not Checked In" ||
    text === "pending" ||
    text === "pending_review" ||
    text === "pending_verification" ||
    text === "Pending Verification"
  ) {
    backgroundColor = "#fff4d6";
    color = "#8a6500";
  }

  if (text === "rejected" || text === "Rejected") {
    backgroundColor = "#fde2e2";
    color = "#a12626";
  }

  if (
    text === "resubmission_requested" ||
    text === "Resubmission Requested"
  ) {
    backgroundColor = "#fdebd1";
    color = "#9a5d00";
  }

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

const loadingStyle = {
  padding: "40px",
  fontFamily: "Arial, sans-serif",
};

const pageStyle = {
  minHeight: "100vh",
  padding: "32px",
  fontFamily: "Arial, sans-serif",
};

const layoutStyle = {
  display: "grid",
  gridTemplateColumns: "1.4fr 0.8fr",
  gap: "24px",
  alignItems: "start",
};

const cardStyle = {
  background: "#ffffff",
  padding: "30px",
  borderRadius: "18px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  border: "1px solid #e6ece8",
};

const qrSideCardStyle = {
  background: "#ffffff",
  padding: "30px",
  borderRadius: "18px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  border: "1px solid #e6ece8",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  gap: "16px",
};

const emptyCardStyle = {
  maxWidth: "540px",
  background: "#ffffff",
  padding: "30px",
  borderRadius: "18px",
  border: "1px solid #e6ece8",
};

const titleStyle = {
  fontSize: "32px",
  margin: 0,
  color: "#163126",
};

const copyStyle = {
  color: "#5c6b63",
  marginTop: "12px",
};

const detailsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: "12px",
  marginTop: "20px",
};

const miniCardStyle = {
  backgroundColor: "#f8faf8",
  border: "1px solid #e6ece8",
  borderRadius: "12px",
  padding: "14px",
};

const miniLabelStyle = {
  color: "#5c6b63",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: "8px",
};

const miniValueStyle = {
  color: "#163126",
  fontWeight: "700",
};

const statusRowStyle = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  marginTop: "18px",
};

const itemsCardStyle = {
  display: "grid",
  gap: "10px",
  marginTop: "20px",
};

const itemRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  borderRadius: "14px",
  padding: "14px",
  border: "1px solid #e6ece8",
  backgroundColor: "#fbfcfb",
};

const itemNameStyle = {
  color: "#163126",
  fontWeight: "700",
};

const itemMetaStyle = {
  color: "#5c6b63",
  fontSize: "13px",
  marginTop: "4px",
};

const checkInButtonStyle = {
  marginTop: "20px",
  width: "100%",
  padding: "12px",
  backgroundColor: "#2e8b57",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  fontSize: "16px",
  cursor: "pointer",
  fontWeight: "700",
};

const checkedInMessageStyle = {
  marginTop: "20px",
  backgroundColor: "#dff3e8",
  padding: "12px",
  borderRadius: "10px",
  textAlign: "center",
  fontWeight: "700",
  color: "#17633c",
};

const pendingReviewMessageStyle = {
  marginTop: "20px",
  backgroundColor: "#fff4d6",
  padding: "12px",
  borderRadius: "10px",
  textAlign: "center",
  fontWeight: "700",
  color: "#8a6500",
};

const rejectedMessageStyle = {
  marginTop: "20px",
  backgroundColor: "#fde2e2",
  padding: "12px",
  borderRadius: "10px",
  textAlign: "center",
  fontWeight: "700",
  color: "#a12626",
};

const qrTitleStyle = {
  color: "#163126",
  fontWeight: "700",
  fontSize: "20px",
};

const pendingQrBadgeStyle = {
  borderRadius: "999px",
  backgroundColor: "#fff4d6",
  color: "#8a6500",
  padding: "8px 12px",
  fontWeight: "700",
};

const qrCopyStyle = {
  color: "#5c6b63",
};

const uploadNoteStyle = {
  borderRadius: "999px",
  backgroundColor: "#f8faf8",
  border: "1px solid #e6ece8",
  color: "#163126",
  padding: "8px 12px",
  fontWeight: "700",
};

const linkButtonStyle = {
  display: "inline-block",
  marginTop: "16px",
  textDecoration: "none",
  backgroundColor: "#163126",
  color: "#ffffff",
  padding: "12px 16px",
  borderRadius: "999px",
  fontWeight: "700",
};

const successBannerStyle = {
  borderRadius: "12px",
  backgroundColor: "#dff3e8",
  color: "#17633c",
  padding: "12px 14px",
  marginTop: "16px",
  fontWeight: "700",
};
