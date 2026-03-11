import React, { useState } from "react";

function Scanner({ selectedState, customers = [], onCheckIn }) {
  const [customerId, setCustomerId] = useState("");
  const [age, setAge] = useState("");
  const [residencyStatus, setResidencyStatus] = useState("resident");
  const [idVerified, setIdVerified] = useState(true);

  const handleCheckIn = () => {
    if (!customerId.trim() || !age) return;

    onCheckIn({
      customerId,
      age,
      residencyStatus: selectedState === "illinois" ? residencyStatus : "",
      idVerified
    });

    setCustomerId("");
    setAge("");
    setResidencyStatus("resident");
    setIdVerified(true);
  };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>ID Check-In</h2>
      <p>Scan or enter customer information for a faster pickup workflow.</p>

      <div
        style={{
          marginTop: "20px",
          marginBottom: "24px",
          padding: "16px",
          border: "1px solid #d1d5db",
          borderRadius: "12px",
          backgroundColor: "#f8fafc",
          maxWidth: "650px"
        }}
      >
        <input
          type="text"
          placeholder="Customer ID / reference"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          style={inputStyle}
        />

        <input
          type="number"
          placeholder="Customer age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          style={inputStyle}
        />

        {selectedState === "illinois" && (
          <select
            value={residencyStatus}
            onChange={(e) => setResidencyStatus(e.target.value)}
            style={inputStyle}
          >
            <option value="resident">Illinois Resident</option>
            <option value="nonResident">Non-Resident</option>
          </select>
        )}

        <label style={{ display: "block", marginBottom: "12px" }}>
          <input
            type="checkbox"
            checked={idVerified}
            onChange={(e) => setIdVerified(e.target.checked)}
            style={{ marginRight: "8px" }}
          />
          ID Verified
        </label>

        <button
          onClick={handleCheckIn}
          style={{
            padding: "12px 20px",
            fontSize: "16px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#22c55e",
            color: "white",
            cursor: "pointer"
          }}
        >
          Check In Customer
        </button>
      </div>

      <h3>Recent Check-Ins</h3>

      {customers.length === 0 ? (
        <p>No check-ins yet.</p>
      ) : (
        customers.map((entry) => (
          <div
            key={entry.id}
            style={{
              padding: "12px",
              background: "#f1f5f9",
              borderRadius: "8px",
              marginBottom: "10px",
              border: "1px solid #dbeafe",
              maxWidth: "700px"
            }}
          >
            <strong>{entry.customerId}</strong>
            <div style={smallText}>Age: {entry.age}</div>
            {entry.residencyStatus && (
              <div style={smallText}>Residency: {entry.residencyStatus}</div>
            )}
            <div style={smallText}>
              ID Verified: {entry.idVerified ? "Yes" : "No"}
            </div>
            <div style={smallText}>Checked in: {entry.checkedInAt}</div>
          </div>
        ))
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  maxWidth: "450px",
  padding: "12px",
  marginBottom: "12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  display: "block"
};

const smallText = {
  fontSize: "14px",
  marginTop: "4px",
  color: "#475569"
};

export default Scanner;