import React, { useState } from "react";
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import { useOrders } from "../../context/OrdersContext";
import {
  getNormalizedWorkflowState,
  getOrderWorkflowLabel,
} from "../../services/orderService";
import {
  formatCurrency,
  formatStatusLabel,
} from "../../services/orderUtils";

export default function ScanPickup() {
  const { findOrderByPickupCode } = useOrders();
  const [cameraOn, setCameraOn] = useState(true);
  const [manualCode, setManualCode] = useState("");
  const [lastScan, setLastScan] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [order, setOrder] = useState(null);

  const handleLookup = async (rawValue) => {
    if (!rawValue || loading) {
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setLastScan(rawValue);

    try {
      const matchedOrder = findOrderByPickupCode(rawValue);

      if (!matchedOrder) {
        throw new Error(
          "No preorder matched this code. Use a pickup code, QR code, or order number."
        );
      }

      setOrder(matchedOrder);
    } catch (error) {
      console.error("Pickup scan failed:", error);
      setOrder(null);
      setErrorMessage(error.message || "Unable to load pickup order.");
    } finally {
      setLoading(false);
    }
  };

  const { orderStatus, verificationStatus, checkInStatus } =
    getNormalizedWorkflowState(order);

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={headingStyle}>Scan Pickup</h1>
          <p style={subheadingStyle}>
            Lookup preorders by pickup code, barcode, or order number using the
            shared orders source.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCameraOn((current) => !current)}
          style={cameraToggleStyle}
        >
          {cameraOn ? "Turn Camera Off" : "Turn Camera On"}
        </button>
      </div>

      <div style={topGridStyle}>
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Scanner</h2>

          {cameraOn ? (
            <div style={scannerFrameStyle}>
              <BarcodeScannerComponent
                width={520}
                height={320}
                onUpdate={(error, result) => {
                  if (result?.text && result.text !== lastScan) {
                    handleLookup(result.text);
                  }
                }}
              />
            </div>
          ) : (
            <div style={emptyScannerStyle}>Camera is off.</div>
          )}

          <label style={labelStyle}>Manual Pickup Code or Order Number</label>
          <textarea
            style={textAreaStyle}
            value={manualCode}
            onChange={(event) => setManualCode(event.target.value)}
            placeholder="Paste barcode value, pickup code, or order number"
          />

          <button
            type="button"
            onClick={() => handleLookup(manualCode)}
            style={primaryButtonStyle}
            disabled={loading}
          >
            {loading ? "Looking up order..." : "Lookup Order"}
          </button>

          <div style={scanMetaCardStyle}>
            <div style={scanMetaLabelStyle}>Last scan</div>
            <div style={scanMetaValueStyle}>
              {lastScan || "No scan captured yet."}
            </div>
            {errorMessage ? <div style={errorStyle}>{errorMessage}</div> : null}
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Order Details</h2>

          {order ? (
            <>
              <div style={detailGridStyle}>
                <div style={detailCardStyle}>
                  <div style={detailLabelStyle}>Customer</div>
                  <div style={detailValueStyle}>
                    {order.customerName || order.name}
                  </div>
                </div>
                <div style={detailCardStyle}>
                  <div style={detailLabelStyle}>Order</div>
                  <div style={detailValueStyle}>
                    {order.orderNumber || order.order}
                  </div>
                </div>
                <div style={detailCardStyle}>
                  <div style={detailLabelStyle}>Pickup Code</div>
                  <div style={detailValueStyle}>{order.pickupCode || "Pending"}</div>
                </div>
                <div style={detailCardStyle}>
                  <div style={detailLabelStyle}>Total</div>
                  <div style={detailValueStyle}>
                    {formatCurrency(order.total || 0)}
                  </div>
                </div>
              </div>

              <div style={statusRowStyle}>
                <span style={badgeStyle("#e3eefc", "#2057a6")}>
                  {formatStatusLabel(verificationStatus)}
                </span>
                <span style={badgeStyle("#fff4d6", "#8a6500")}>
                  {getOrderWorkflowLabel(order)}
                </span>
                <span style={badgeStyle("#dff3e8", "#17633c")}>
                  {formatStatusLabel(checkInStatus)}
                </span>
              </div>

              <div style={itemsCardStyle}>
                {(order.orderItems || []).map((item) => (
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
                ))}
              </div>
            </>
          ) : (
            <div style={emptyScannerStyle}>
              Scan a customer barcode to load the preorder.
            </div>
          )}
        </section>
      </div>
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
  maxWidth: "700px",
};

const cameraToggleStyle = {
  backgroundColor: "#163126",
  color: "#ffffff",
  border: "none",
  borderRadius: "10px",
  padding: "12px 16px",
  cursor: "pointer",
  fontWeight: "700",
};

const topGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
};

const cardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "18px",
  padding: "22px",
  boxShadow: "0 6px 18px rgba(0, 0, 0, 0.06)",
  border: "1px solid #e6ece8",
};

const sectionTitleStyle = {
  marginTop: 0,
  color: "#163126",
  fontSize: "24px",
};

const scannerFrameStyle = {
  overflow: "hidden",
  borderRadius: "16px",
  border: "1px solid #d1d9d4",
  marginBottom: "16px",
};

const emptyScannerStyle = {
  borderRadius: "14px",
  border: "1px dashed #cfd8d3",
  padding: "18px",
  color: "#5c6b63",
  backgroundColor: "#fbfcfb",
  marginBottom: "16px",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  color: "#163126",
  fontWeight: "700",
};

const textAreaStyle = {
  width: "100%",
  minHeight: "92px",
  boxSizing: "border-box",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #cfd8d3",
  resize: "vertical",
  fontSize: "14px",
};

const primaryButtonStyle = {
  backgroundColor: "#1f7a4d",
  color: "#ffffff",
  border: "none",
  borderRadius: "10px",
  padding: "12px 16px",
  cursor: "pointer",
  fontWeight: "700",
  marginTop: "14px",
};

const secondaryButtonStyle = {
  backgroundColor: "#163126",
  color: "#ffffff",
  border: "none",
  borderRadius: "10px",
  padding: "12px 16px",
  cursor: "pointer",
  fontWeight: "700",
};

const scanMetaCardStyle = {
  marginTop: "18px",
  borderRadius: "14px",
  padding: "16px",
  backgroundColor: "#f8faf8",
  border: "1px solid #e6ece8",
};

const scanMetaLabelStyle = {
  color: "#5c6b63",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: "8px",
};

const scanMetaValueStyle = {
  color: "#163126",
  fontSize: "14px",
  wordBreak: "break-word",
};

const errorStyle = {
  marginTop: "10px",
  color: "#a12626",
  backgroundColor: "#fde2e2",
  borderRadius: "10px",
  padding: "10px 12px",
};

const detailGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: "12px",
};

const detailCardStyle = {
  borderRadius: "14px",
  backgroundColor: "#f8faf8",
  padding: "14px",
  border: "1px solid #e6ece8",
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

const statusRowStyle = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  marginTop: "18px",
};

const itemsCardStyle = {
  display: "grid",
  gap: "10px",
  marginTop: "18px",
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
  marginTop: "4px",
  color: "#5c6b63",
  fontSize: "13px",
};
