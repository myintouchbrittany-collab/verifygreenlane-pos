import React, { useEffect, useMemo, useState } from "react";
import { db } from "../../firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";

export default function Checkout() {
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

  const completePickup = async (id) => {
    try {
      const customerRef = doc(db, "customers", id);

      await updateDoc(customerRef, {
        pickupStatus: "Completed",
        checkoutTime: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      console.error("Checkout error:", error);
    }
  };

  const readyCustomers = useMemo(() => {
    return customers
      .filter((customer) => customer.pickupStatus === "Ready for Pickup")
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
          <h1 style={headingStyle}>Checkout</h1>
          <p style={subheadingStyle}>
            Complete ready orders and close out pickups.
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

      {readyCustomers.length === 0 ? (
        <div style={emptyCardStyle}>
          No customers are ready for checkout.
        </div>
      ) : (
        <div style={cardGridStyle}>
          {readyCustomers.map((customer) => (
            <div key={customer.id} style={queueCardStyle}>
              <h3 style={cardTitleStyle}>{customer.name}</h3>

              <p><strong>Order:</strong> {customer.order}</p>
              <p><strong>Status:</strong> {customer.status || "Verified"}</p>
              <p><strong>Arrival Time:</strong> {customer.arrivalTime || "—"}</p>

              <p>
                <strong>Pickup Status:</strong>{" "}
                <span style={badgeStyle("#dff3e8", "#17633c")}>
                  {customer.pickupStatus}
                </span>
              </p>

              <button
                style={completeButtonStyle}
                onClick={() => completePickup(customer.id)}
              >
                Complete Pickup
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

const completeButtonStyle = {
  backgroundColor: "#163126",
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