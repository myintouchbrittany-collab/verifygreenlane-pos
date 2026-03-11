import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";

function CustomerStatus() {
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "customers"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (data.length > 0) {
        setCustomer(data[0]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleCheckIn = async () => {
    if (!customer) return;

    try {
      const customerRef = doc(db, "customers", customer.id);

      await updateDoc(customerRef, {
        checkedIn: true,
        arrivalTime: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      console.error("Error checking in:", error);
    }
  };

  if (!customer) {
    return <div style={{ padding: "40px" }}>Loading customer...</div>;
  }

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Verification Status</h2>

      <div style={cardStyle}>
        <p><strong>Name:</strong> {customer.name}</p>
        <p><strong>Order:</strong> {customer.order}</p>

        <p>
          <strong>Status:</strong>{" "}
          <span style={verifiedBadge}>
            {customer.status || "Pending"}
          </span>
        </p>

        <p>
          <strong>Check-In:</strong>{" "}
          {customer.checkedIn ? (
            <span style={checkedBadge}>Checked In</span>
          ) : (
            <span style={waitingBadge}>Not Checked In</span>
          )}
        </p>

        <p>
          <strong>Arrival Time:</strong>{" "}
          {customer.arrivalTime || "--"}
        </p>

        <p>
          <strong>Pickup Status:</strong>{" "}
          <span style={pickupBadge}>
            {customer.pickupStatus || "Waiting"}
          </span>
        </p>

        {/* Button OR Success Message */}

        {customer.checkedIn ? (
          <div style={checkedInMessage}>
            ✔ You are already checked in for pickup
          </div>
        ) : (
          <button onClick={handleCheckIn} style={checkInButton}>
            Check In for Pickup
          </button>
        )}
      </div>
    </div>
  );
}

export default CustomerStatus;

const containerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "40px",
  fontFamily: "Arial",
};

const titleStyle = {
  fontSize: "28px",
  marginBottom: "20px",
};

const cardStyle = {
  background: "#ffffff",
  padding: "30px",
  borderRadius: "10px",
  width: "400px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
};

const checkInButton = {
  marginTop: "20px",
  width: "100%",
  padding: "12px",
  backgroundColor: "#2e8b57",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  fontSize: "16px",
  cursor: "pointer",
};

const checkedInMessage = {
  marginTop: "20px",
  backgroundColor: "#dff3e8",
  padding: "12px",
  borderRadius: "6px",
  textAlign: "center",
  fontWeight: "bold",
  color: "#17633c",
};

const verifiedBadge = {
  backgroundColor: "#dff3e8",
  padding: "4px 10px",
  borderRadius: "6px",
  color: "#17633c",
};

const checkedBadge = {
  backgroundColor: "#e1f5fe",
  padding: "4px 10px",
  borderRadius: "6px",
};

const waitingBadge = {
  backgroundColor: "#fff3cd",
  padding: "4px 10px",
  borderRadius: "6px",
};

const pickupBadge = {
  backgroundColor: "#f0f0f0",
  padding: "4px 10px",
  borderRadius: "6px",
};