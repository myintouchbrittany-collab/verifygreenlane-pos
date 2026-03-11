import React, { useEffect, useMemo, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { db } from "../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function VerifyID() {
  const scannerRef = useRef(null);

  const [fullName, setFullName] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idExpiration, setIdExpiration] = useState("");
  const [verificationMethod, setVerificationMethod] = useState("manual");
  const [scanResult, setScanResult] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: 250 },
      false
    );

    scannerRef.current = scanner;

    scanner.render(onScanSuccess, onScanError);

    async function onScanSuccess(decodedText) {
      setScanResult(decodedText);
      setVerificationMethod("scanner");

      const parsed = parseScannedText(decodedText);

      if (parsed.fullName) setFullName(parsed.fullName);
      if (parsed.dateOfBirth) setDateOfBirth(parsed.dateOfBirth);
      if (parsed.idNumber) setIdNumber(parsed.idNumber);
      if (parsed.idExpiration) setIdExpiration(parsed.idExpiration);
      if (!orderNumber) setOrderNumber(`#${Math.floor(1000 + Math.random() * 9000)}`);
    }

    function onScanError() {
      // Quiet on purpose
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const age = useMemo(() => calculateAge(dateOfBirth), [dateOfBirth]);
  const is21Plus = age >= 21;
  const isExpired = isDateExpired(idExpiration);

  const handleSaveCustomer = async (e) => {
    e.preventDefault();

    if (!fullName || !orderNumber || !dateOfBirth || !idExpiration) {
      alert("Please complete name, order number, date of birth, and ID expiration.");
      return;
    }

    if (!is21Plus) {
      alert("Customer is under 21 and cannot be verified.");
      return;
    }

    if (isExpired) {
      alert("ID is expired and cannot be verified.");
      return;
    }

    try {
      setSaving(true);

      await addDoc(collection(db, "customers"), {
        fullName: fullName.trim(),
        name: fullName.trim(),
        order: orderNumber.trim(),
        dateOfBirth,
        age,
        idNumber: idNumber.trim(),
        idExpiration,
        is21Plus,
        verificationMethod,
        status: "Verified",
        checkedIn: false,
        arrivalTime: "",
        pickupStatus: "Waiting",
        checkoutTime: "",
        createdAt: serverTimestamp(),
      });

      alert("Customer verified and added.");

      setFullName("");
      setOrderNumber("");
      setDateOfBirth("");
      setIdNumber("");
      setIdExpiration("");
      setScanResult("");
      setVerificationMethod("manual");
    } catch (error) {
      console.error("Error saving customer:", error);
      alert("There was a problem saving this customer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={topGridStyle}>
        <div style={cardStyle}>
          <h1 style={headingStyle}>ID Verification Scanner</h1>
          <p style={subheadingStyle}>
            Scan a driver&apos;s license or enter customer ID details manually.
          </p>

          <div id="reader" style={{ width: "100%" }} />

          {scanResult ? (
            <div style={scanResultStyle}>
              <strong>Scan captured.</strong> Form fields were auto-filled where possible.
            </div>
          ) : null}
        </div>

        <div style={cardStyle}>
          <h2 style={sectionHeadingStyle}>Verification Review</h2>

          <div style={statusGridStyle}>
            <div style={miniCardStyle}>
              <div style={miniLabelStyle}>Age</div>
              <div style={miniValueStyle}>{age || "—"}</div>
            </div>

            <div style={miniCardStyle}>
              <div style={miniLabelStyle}>21+ Status</div>
              <div style={miniValueStyle}>
                <span style={getBadgeStyle(is21Plus ? "Verified" : "Under 21")}>
                  {dateOfBirth ? (is21Plus ? "Verified" : "Under 21") : "Pending"}
                </span>
              </div>
            </div>

            <div style={miniCardStyle}>
              <div style={miniLabelStyle}>ID Expiration</div>
              <div style={miniValueStyle}>
                <span style={getBadgeStyle(!idExpiration ? "Pending" : isExpired ? "Expired" : "Valid")}>
                  {!idExpiration ? "Pending" : isExpired ? "Expired" : "Valid"}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveCustomer}>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jordan Parker"
              style={inputStyle}
            />

            <label style={labelStyle}>Order Number</label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="#1005"
              style={inputStyle}
            />

            <label style={labelStyle}>Date of Birth</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              style={inputStyle}
            />

            <label style={labelStyle}>ID Number</label>
            <input
              type="text"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="Driver license number"
              style={inputStyle}
            />

            <label style={labelStyle}>ID Expiration</label>
            <input
              type="date"
              value={idExpiration}
              onChange={(e) => setIdExpiration(e.target.value)}
              style={inputStyle}
            />

            <label style={labelStyle}>Verification Method</label>
            <input
              type="text"
              value={verificationMethod}
              readOnly
              style={{ ...inputStyle, backgroundColor: "#f8faf8" }}
            />

            <button type="submit" style={buttonStyle} disabled={saving}>
              {saving ? "Saving..." : "Verify and Save Customer"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function calculateAge(dobString) {
  if (!dobString) return 0;

  const dob = new Date(dobString);
  if (Number.isNaN(dob.getTime())) return 0;

  const today = new Date();
  let years = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dob.getDate())
  ) {
    years--;
  }

  return years;
}

function isDateExpired(dateString) {
  if (!dateString) return false;

  const exp = new Date(dateString);
  if (Number.isNaN(exp.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  exp.setHours(0, 0, 0, 0);

  return exp < today;
}

function parseScannedText(text) {
  const result = {
    fullName: "",
    dateOfBirth: "",
    idNumber: "",
    idExpiration: "",
  };

  const normalized = text.replace(/\r/g, "\n");

  const dobMatch =
    normalized.match(/\b(19\d{2}|20\d{2})[-/](\d{2})[-/](\d{2})\b/) ||
    normalized.match(/\b(\d{2})[-/](\d{2})[-/](19\d{2}|20\d{2})\b/);

  if (dobMatch) {
    if (dobMatch[1].length === 4) {
      result.dateOfBirth = `${dobMatch[1]}-${dobMatch[2]}-${dobMatch[3]}`;
    } else {
      result.dateOfBirth = `${dobMatch[3]}-${dobMatch[1]}-${dobMatch[2]}`;
    }
  }

  const expMatch =
    normalized.match(/EXP[:\s]*((19|20)\d{2}[-/]\d{2}[-/]\d{2})/i) ||
    normalized.match(/EXP[:\s]*(\d{2}[-/]\d{2}[-/](19|20)\d{2})/i);

  if (expMatch) {
    const raw = expMatch[1];
    const parts = raw.split(/[-/]/);
    if (parts[0].length === 4) {
      result.idExpiration = `${parts[0]}-${parts[1]}-${parts[2]}`;
    } else {
      result.idExpiration = `${parts[2]}-${parts[0]}-${parts[1]}`;
    }
  }

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const possibleName = lines.find(
    (line) =>
      /^[A-Za-z ,.'-]{5,}$/.test(line) &&
      !line.toLowerCase().includes("driver") &&
      !line.toLowerCase().includes("license")
  );

  if (possibleName) {
    result.fullName = toTitleCase(possibleName.replace(",", " "));
  }

  const idMatch = normalized.match(/\b[A-Z0-9]{6,20}\b/);
  if (idMatch) {
    result.idNumber = idMatch[0];
  }

  return result;
}

function toTitleCase(value) {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getBadgeStyle(text) {
  let backgroundColor = "#edf2ee";
  let color = "#234333";

  if (text === "Verified" || text === "Valid") {
    backgroundColor = "#dff3e8";
    color = "#17633c";
  }

  if (text === "Under 21" || text === "Expired") {
    backgroundColor = "#fde2e2";
    color = "#a12626";
  }

  if (text === "Pending") {
    backgroundColor = "#fff4d6";
    color = "#8a6500";
  }

  return {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "bold",
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

const topGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
  gap: "24px",
};

const cardStyle = {
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

const sectionHeadingStyle = {
  marginTop: 0,
  color: "#163126",
  fontSize: "24px",
};

const subheadingStyle = {
  color: "#5c6b63",
  marginBottom: "20px",
};

const scanResultStyle = {
  marginTop: "16px",
  backgroundColor: "#e3eefc",
  color: "#2057a6",
  padding: "12px 14px",
  borderRadius: "8px",
  fontSize: "14px",
};

const statusGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: "12px",
  marginBottom: "20px",
};

const miniCardStyle = {
  backgroundColor: "#f8faf8",
  border: "1px solid #e6ece8",
  borderRadius: "12px",
  padding: "14px",
};

const miniLabelStyle = {
  color: "#5c6b63",
  fontSize: "13px",
  marginBottom: "8px",
};

const miniValueStyle = {
  color: "#163126",
  fontSize: "18px",
  fontWeight: "bold",
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

const buttonStyle = {
  backgroundColor: "#1f7a4d",
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  padding: "12px 18px",
  cursor: "pointer",
  fontWeight: "bold",
  marginTop: "20px",
  width: "100%",
};