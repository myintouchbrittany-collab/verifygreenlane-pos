import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useOrders } from "../../context/OrdersContext";
import {
  canCustomerCheckIn,
  getCustomerCheckInValidationMessage,
  getNormalizedWorkflowState,
} from "../../services/orderService";

const INITIAL_FORM = {
  pickupCode: "",
  parkingSpot: "",
  vehicleColor: "",
  note: "",
};

function getInitialForm(prefilledPickupCode) {
  return {
    ...INITIAL_FORM,
    pickupCode: prefilledPickupCode || "",
  };
}

export default function ParkingCheckIn() {
  const { findOrderByPickupCode, updateOrder } = useOrders();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(() =>
    getInitialForm(searchParams.get("pickupCode") || "")
  );
  const [matchedOrder, setMatchedOrder] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const normalizedPickupCode = form.pickupCode.trim();
  const previewOrder = useMemo(() => {
    if (!normalizedPickupCode) {
      return null;
    }

    return findOrderByPickupCode(normalizedPickupCode);
  }, [findOrderByPickupCode, normalizedPickupCode]);

  const handleChange = (field) => (event) => {
    const { value } = event.target;

    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (field === "pickupCode") {
      setMatchedOrder(null);
      setIsConfirmed(false);
    }

    setErrorMessage("");
  };

  const validateOrder = (order) => {
    const validationMessage = getCustomerCheckInValidationMessage(order);

    if (validationMessage) {
      throw new Error(validationMessage);
    }

    if (!canCustomerCheckIn(order)) {
      throw new Error("This preorder cannot be checked in right now.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!normalizedPickupCode || !form.parkingSpot.trim() || !form.vehicleColor.trim()) {
      setErrorMessage("Enter a pickup code, parking spot, and vehicle color.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const order = findOrderByPickupCode(normalizedPickupCode);

      validateOrder(order);

      const arrivalTimestamp = new Date();
      await updateOrder(order.orderId || order.id, {
        orderStatus: "checked_in",
        status: "checked_in",
        checkInStatus: "checked_in",
        checkedIn: true,
        arrivedAt: arrivalTimestamp.toISOString(),
        checkedInAt: arrivalTimestamp.toISOString(),
        arrivalTime: arrivalTimestamp.toLocaleTimeString(),
        parkingSpot: form.parkingSpot.trim(),
        vehicleColor: form.vehicleColor.trim(),
        customerCheckInNote: form.note.trim(),
        pickupStatus: "Checked In",
      }, order.customerId);

      setMatchedOrder({
        ...order,
        parkingSpot: form.parkingSpot.trim(),
        vehicleColor: form.vehicleColor.trim(),
        customerCheckInNote: form.note.trim(),
      });
      setIsConfirmed(true);
    } catch (error) {
      console.error("Customer parking lot check-in failed:", error);
      setMatchedOrder(null);
      setIsConfirmed(false);
      setErrorMessage(error.message || "Unable to complete check-in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewStatus = () => {
    const orderId = matchedOrder?.orderId || matchedOrder?.id;

    if (!orderId) {
      return;
    }

    navigate(`/customer-status?orderId=${orderId}`, {
      state: {
        successMessage: "You are checked in. Staff has your parking spot and vehicle details.",
      },
    });
  };

  const status = getNormalizedWorkflowState(previewOrder);

  return (
    <div style={pageStyle}>
      <div style={layoutStyle}>
        <section style={cardStyle}>
          <div style={eyebrowStyle}>Parking Lot Check-In</div>
          <h1 style={headingStyle}>Let staff know you’ve arrived.</h1>
          <p style={subheadingStyle}>
            Enter your pickup code and where you are parked so the dispensary team
            can bring your order out faster.
          </p>

          {isConfirmed && matchedOrder ? (
            <div style={confirmationCardStyle}>
              <div style={confirmationBadgeStyle}>Checked In</div>
              <h2 style={confirmationHeadingStyle}>You’re in the live pickup queue.</h2>
              <p style={confirmationCopyStyle}>
                Staff can now see your arrival, parking spot, vehicle color, and note.
              </p>

              <div style={confirmationGridStyle}>
                <div style={detailTileStyle}>
                  <div style={detailLabelStyle}>Order</div>
                  <div style={detailValueStyle}>
                    {matchedOrder.orderNumber || matchedOrder.order || matchedOrder.orderId}
                  </div>
                </div>
                <div style={detailTileStyle}>
                  <div style={detailLabelStyle}>Parking Spot</div>
                  <div style={detailValueStyle}>{matchedOrder.parkingSpot}</div>
                </div>
                <div style={detailTileStyle}>
                  <div style={detailLabelStyle}>Vehicle Color</div>
                  <div style={detailValueStyle}>{matchedOrder.vehicleColor}</div>
                </div>
              </div>

              <div style={actionRowStyle}>
                <button type="button" onClick={handleViewStatus} style={primaryButtonStyle}>
                  View Order Status
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm(getInitialForm(""));
                    setMatchedOrder(null);
                    setIsConfirmed(false);
                  }}
                  style={secondaryButtonStyle}
                >
                  Check In Another Order
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={formStyle}>
              <label style={labelStyle}>
                Pickup Code
                <textarea
                  value={form.pickupCode}
                  onChange={handleChange("pickupCode")}
                  placeholder="Paste your pickup code, QR payload, or order number"
                  style={textAreaStyle}
                />
              </label>

              <div style={fieldGridStyle}>
                <label style={labelStyle}>
                  Parking Spot
                  <input
                    type="text"
                    value={form.parkingSpot}
                    onChange={handleChange("parkingSpot")}
                    placeholder="Example: Spot 12"
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Vehicle Color
                  <input
                    type="text"
                    value={form.vehicleColor}
                    onChange={handleChange("vehicleColor")}
                    placeholder="Example: Black"
                    style={inputStyle}
                  />
                </label>
              </div>

              <label style={labelStyle}>
                Note (Optional)
                <textarea
                  value={form.note}
                  onChange={handleChange("note")}
                  placeholder="Anything helpful for staff to know"
                  style={noteAreaStyle}
                />
              </label>

              {previewOrder ? (
                <div style={previewCardStyle}>
                  <div style={previewTitleStyle}>
                    {previewOrder.customerName || previewOrder.name}
                  </div>
                  <div style={previewCopyStyle}>
                    Order {previewOrder.orderNumber || previewOrder.order || previewOrder.orderId}
                  </div>
                  <div style={statusRowStyle}>
                    <span style={statusChipStyle(status.orderStatus === "completed" ? "#fde2e2" : "#dff3e8", status.orderStatus === "completed" ? "#a12626" : "#17633c")}>
                      {status.orderStatus === "checked_in" ? "Already Arrived" : "Pickup Eligible"}
                    </span>
                  </div>
                </div>
              ) : null}

              {errorMessage ? <div style={errorBannerStyle}>{errorMessage}</div> : null}

              <button type="submit" disabled={isSubmitting} style={primaryButtonStyle}>
                {isSubmitting ? "Checking In..." : "Check In"}
              </button>

              <div style={supportCopyStyle}>
                Need your pickup code? View it from your{" "}
                <Link to="/customer-status" style={inlineLinkStyle}>
                  customer status page
                </Link>
                .
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  padding: "20px 16px 40px",
  fontFamily: "Arial, sans-serif",
};

const layoutStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 620px)",
  justifyContent: "center",
};

const cardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "24px",
  padding: "24px",
  border: "1px solid #e6ece8",
  boxShadow: "0 18px 40px rgba(22, 49, 38, 0.08)",
};

const eyebrowStyle = {
  display: "inline-block",
  padding: "6px 12px",
  borderRadius: "999px",
  backgroundColor: "#dff3e8",
  color: "#17633c",
  fontSize: "12px",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const headingStyle = {
  margin: "16px 0 10px",
  color: "#163126",
  fontSize: "32px",
  lineHeight: 1.1,
};

const subheadingStyle = {
  color: "#5c6b63",
  margin: 0,
  fontSize: "15px",
};

const formStyle = {
  display: "grid",
  gap: "16px",
  marginTop: "24px",
};

const fieldGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "14px",
};

const labelStyle = {
  display: "grid",
  gap: "8px",
  color: "#163126",
  fontWeight: "700",
  fontSize: "14px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: "12px",
  border: "1px solid #cfd8d3",
  padding: "14px",
  fontSize: "16px",
};

const textAreaStyle = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: "108px",
  borderRadius: "12px",
  border: "1px solid #cfd8d3",
  padding: "14px",
  fontSize: "15px",
  resize: "vertical",
};

const noteAreaStyle = {
  ...textAreaStyle,
  minHeight: "88px",
};

const previewCardStyle = {
  borderRadius: "16px",
  padding: "16px",
  border: "1px solid #e6ece8",
  backgroundColor: "#f8faf8",
};

const previewTitleStyle = {
  color: "#163126",
  fontWeight: "700",
};

const previewCopyStyle = {
  color: "#5c6b63",
  marginTop: "6px",
};

const statusRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginTop: "12px",
};

function statusChipStyle(backgroundColor, color) {
  return {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "6px 10px",
    backgroundColor,
    color,
    fontSize: "12px",
    fontWeight: "700",
  };
}

const errorBannerStyle = {
  borderRadius: "14px",
  padding: "12px 14px",
  backgroundColor: "#fde2e2",
  color: "#a12626",
  fontWeight: "700",
};

const primaryButtonStyle = {
  backgroundColor: "#1f7a4d",
  color: "#ffffff",
  border: "none",
  borderRadius: "999px",
  padding: "14px 18px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "16px",
};

const secondaryButtonStyle = {
  backgroundColor: "#163126",
  color: "#ffffff",
  border: "none",
  borderRadius: "999px",
  padding: "14px 18px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "16px",
};

const supportCopyStyle = {
  color: "#5c6b63",
  fontSize: "14px",
};

const inlineLinkStyle = {
  color: "#17633c",
  fontWeight: "700",
  textDecoration: "none",
};

const confirmationCardStyle = {
  marginTop: "24px",
  borderRadius: "20px",
  padding: "22px",
  background: "linear-gradient(180deg, #eff9f2 0%, #ffffff 100%)",
  border: "1px solid #d8eadf",
};

const confirmationBadgeStyle = {
  display: "inline-block",
  borderRadius: "999px",
  backgroundColor: "#dff3e8",
  color: "#17633c",
  padding: "6px 10px",
  fontSize: "12px",
  fontWeight: "700",
  textTransform: "uppercase",
};

const confirmationHeadingStyle = {
  margin: "14px 0 8px",
  color: "#163126",
  fontSize: "28px",
};

const confirmationCopyStyle = {
  color: "#5c6b63",
  margin: 0,
};

const confirmationGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "12px",
  marginTop: "18px",
};

const detailTileStyle = {
  borderRadius: "14px",
  border: "1px solid #dce8e0",
  backgroundColor: "#ffffff",
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
  wordBreak: "break-word",
};

const actionRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "12px",
  marginTop: "18px",
};
