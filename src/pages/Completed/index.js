import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function Completed() {
  const [customers, setCustomers] = useState([]);

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

  const completedOrders = customers.filter(
    (customer) => customer.pickupStatus === "Completed"
  );

  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>Completed Orders</h1>
      <p style={subheadingStyle}>
        History of finished customer pickups.
      </p>

      {completedOrders.length === 0 ? (
        <p style={{ color: "#5c6b63", marginTop: "20px" }}>
          No completed orders yet.
        </p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: "20px" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Customer</th>
                <th style={thStyle}>Order</th>
                <th style={thStyle}>Verification</th>
                <th style={thStyle}>Arrival Time</th>
                <th style={thStyle}>Checkout Time</th>
              </tr>
            </thead>
            <tbody>
              {completedOrders.map((customer) => (
                <tr key={customer.id}>
                  <td style={tdStyle}>{customer.name}</td>
                  <td style={tdStyle}>{customer.order}</td>
                  <td style={tdStyle}>{customer.status}</td>
                  <td style={tdStyle}>{customer.arrivalTime || "—"}</td>
                  <td style={tdStyle}>{customer.checkoutTime || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  backgroundColor: "#f4f7f5",
  padding: "32px",
  fontFamily: "Arial, sans-serif",
};

const headingStyle = {
  margin: 0,
  color: "#163126",
  fontSize: "32px",
};

const subheadingStyle = {
  marginTop: "8px",
  color: "#5c6b63",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  backgroundColor: "#ffffff",
  borderRadius: "14px",
  overflow: "hidden",
  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
};

const thStyle = {
  textAlign: "left",
  padding: "14px",
  borderBottom: "1px solid #dfe7e1",
  backgroundColor: "#f8faf8",
  color: "#486056",
};

const tdStyle = {
  padding: "14px",
  borderBottom: "1px solid #edf2ee",
  color: "#1f2e27",
};