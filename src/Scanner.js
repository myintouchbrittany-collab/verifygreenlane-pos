import { useState } from "react";
import { QrReader } from "react-qr-reader";
import { db } from "./firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

export default function Scanner() {
  const [result, setResult] = useState("");

  const handleScan = async (data) => {
    if (!data) return;

    const orderId = data.text;
    setResult(orderId);

    try {
      const orderRef = doc(db, "orders", orderId);

      await updateDoc(orderRef, {
        status: "CHECKED_IN",
        checkedIn: true,
        checkedInAt: serverTimestamp()
      });

      alert("Customer checked in!");
    } catch (err) {
      console.error(err);
      alert("Error checking in order");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>GreenLane Scanner</h2>

      <QrReader
        onResult={(result, error) => {
          if (!!result) {
            handleScan(result);
          }
        }}
        style={{ width: "300px" }}
      />

      {result && (
        <p>
          Scanned Order ID: <strong>{result}</strong>
        </p>
      )}
    </div>
  );
}