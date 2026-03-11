import React, { useEffect, useMemo, useState } from "react";
import { db } from "../../firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";

export default function CheckIn() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "customers"), (snapshot) => {
      const data = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      setCustomers(data);
    });

    return () => unsubscribe();
  }, []);

  const checkInCustomer = async (id) => {
    try {
      const customerRef = doc(db, "customers", id);

      await updateDoc(customerRef, {
        checkedIn: true,
        arrivalTime: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      console.error("Check-in error:", error);
    }
  };

  const waitingCustomers = useMemo(() => {
    return customers
      .filter((customer) => !customer.checkedIn)
      .filter((customer) => {
        const name = (customer.name || "").toLowerCase();
        const order = (customer.order || "").toLowerCase();
        const search = searchTerm.toLowerCase();

        return name.includes(search) || order.includes(search);
      });
  }, [customers, searchTerm]);

  return (
    <div style={pageStyle}>
      <div style={headerRowStyle}>
        <div>
          <h1 style={headingStyle}>Customer Check-In</h1>
          <p style={subheadingStyle}>
            Check in verified customers for express pickup.
          </p>
        </div>

        <input
          type="text"
          placeholder="Search customer or order..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={searchInputStyle}
        />
      </div>

      {waitingCustomers.length === 0 ? (
        <div style={emptyCardStyle}>
          No customers waiting for check-in.
        </div>
      ) : (
        <div style={cardGridStyle}>
          {waitingCustomers.map((customer) => (
            <div key={customer.id} style={queueCardStyle}>
              <h3 style={cardTitleStyle}>{customer.name}</h3>

              <p><strong>Order:</strong> {customer.order}</p>

              <p>
                <strong>Status:</strong>{" "}
                <span style={badgeStyle("#dff3e8", "#17633c")}>
                  {customer.status || "Verified"}
                </span>
              </p>

              <p>
                <strong>Pickup Status:</strong>{" "}
                <span style={badgeStyle("#fff4d6", "#8a6500")}>
                  {customer.pickupStatus || "Waiting"}
                </span>
              </p>

              <button
                onClick={() => checkInCustomer(customer.id)}
                style={primaryButtonStyle}
              >
                Check In Customer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function badgeStyle(backgroundColor, color) {
  return {
    display: "inline-block",
    padding: "5px 10px",
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

const headerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "16px",
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
};

const searchInputStyle = {
  padding: "12px",
  minWidth: "260px",
  borderRadius: "8px",
  border: "1px solid #cfd8d3",
  fontSize: "14px",
};

const cardGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "18px",
};

const queueCardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "14px",
  padding: "22px",
  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
  border: "1px solid #e6ece8",
};

const cardTitleStyle = {
  marginTop: 0,
  color: "#163126",
};

const primaryButtonStyle = {
  backgroundColor: "#1f7a4d",
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  padding: "10px 16px",
  cursor: "pointer",
  fontWeight: "bold",
  marginTop: "12px",
};

const emptyCardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "14px",
  padding: "22px",
  border: "1px solid #e6ece8",
  color: "#5c6b63",
};