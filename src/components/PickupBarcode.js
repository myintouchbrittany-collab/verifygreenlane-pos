import React from "react";
import Barcode from "react-barcode";

export default function PickupBarcode({
  value,
  label = "Pickup Barcode",
  helperText = "Present this barcode at check-in or use the pickup code below.",
  containerStyle = {},
}) {
  if (!value) {
    return null;
  }

  return (
    <div style={{ ...wrapperStyle, ...containerStyle }}>
      <div style={labelStyle}>{label}</div>
      <div style={barcodeFrameStyle}>
        <Barcode
          value={value}
          format="CODE128"
          width={1.7}
          height={70}
          margin={0}
          displayValue={false}
          background="#ffffff"
          lineColor="#163126"
        />
      </div>
      <div style={codeStyle}>{value}</div>
      <div style={helperStyle}>{helperText}</div>
    </div>
  );
}

const wrapperStyle = {
  borderRadius: "20px",
  backgroundColor: "#f8faf8",
  border: "1px solid #e6ece8",
  padding: "18px",
};

const labelStyle = {
  fontSize: "12px",
  color: "#5c6b63",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  fontWeight: "700",
};

const barcodeFrameStyle = {
  marginTop: "14px",
  backgroundColor: "#ffffff",
  borderRadius: "14px",
  border: "1px solid #dfe8e2",
  padding: "16px 14px",
  display: "flex",
  justifyContent: "center",
  overflowX: "auto",
};

const codeStyle = {
  marginTop: "14px",
  color: "#163126",
  fontWeight: "700",
  fontSize: "13px",
  lineHeight: 1.5,
  wordBreak: "break-all",
  fontFamily: "Consolas, 'Courier New', monospace",
};

const helperStyle = {
  marginTop: "10px",
  color: "#5c6b63",
  fontSize: "13px",
  lineHeight: 1.5,
};
