import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCustomerAndOrder } from "../../services/orderModel";
import { DEFAULT_STORE_ID } from "../../services/storeConfig";

export default function CustomerUpload() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !orderNumber || !frontFile || !backFile) {
      alert("Please fill out all fields and upload front and back of ID.");
      return;
    }

    try {
      setLoading(true);

      await createCustomerAndOrder({
        storeId: DEFAULT_STORE_ID,
        customerFields: {
          name: name.trim(),
          fullName: name.trim(),
          status: "Approved",
          verificationStatus: "verified",
          idUploadComplete: true,
          idUploads: {
            frontFileName: frontFile.name,
            backFileName: backFile.name,
          },
        },
        orderFields: {
          orderNumber: orderNumber.trim(),
          status: "approved",
          orderStatus: "approved",
          verificationStatus: "verified",
          idVerificationStatus: "verified",
          pickupStatus: "Approved",
          source: "Staff Customer Upload",
          channel: "staff_created",
          orderItems: [],
          subtotal: 0,
          discount: 0,
          total: 0,
        },
      });

      alert("Customer added successfully.");
      navigate("/checkin");
    } catch (error) {
      console.error("Error adding customer:", error);
      alert("There was a problem saving the customer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={headingStyle}>Customer Upload</h1>
        <p style={subheadingStyle}>
          Add a verified customer for express pickup.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Customer Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jordan P"
            style={inputStyle}
          />

          <label style={labelStyle}>Order Number</label>
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="#1001"
            style={inputStyle}
          />

          <label style={labelStyle}>Front of ID</label>
          <input
            type="file"
            onChange={(e) => setFrontFile(e.target.files[0])}
            style={fileInputStyle}
          />

          <label style={labelStyle}>Back of ID</label>
          <input
            type="file"
            onChange={(e) => setBackFile(e.target.files[0])}
            style={fileInputStyle}
          />

          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? "Saving..." : "Submit for Verification"}
          </button>
        </form>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  backgroundColor: "#f4f7f5",
  padding: "32px",
  fontFamily: "Arial, sans-serif",
};

const cardStyle = {
  maxWidth: "600px",
  backgroundColor: "#ffffff",
  borderRadius: "14px",
  padding: "24px",
  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
  border: "1px solid #e6ece8",
};

const headingStyle = {
  marginTop: 0,
  color: "#163126",
  fontSize: "32px",
};

const subheadingStyle = {
  color: "#5c6b63",
  marginBottom: "24px",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  marginTop: "16px",
  color: "#163126",
  fontWeight: "bold",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #cfd8d3",
  fontSize: "14px",
  boxSizing: "border-box",
};

const fileInputStyle = {
  display: "block",
  marginBottom: "8px",
};

const buttonStyle = {
  backgroundColor: "#1f7a4d",
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  padding: "12px 18px",
  cursor: "pointer",
  fontWeight: "bold",
  marginTop: "20px",
};
