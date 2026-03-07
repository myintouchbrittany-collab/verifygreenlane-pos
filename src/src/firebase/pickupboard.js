import { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function PickupBoard() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(list);
    });

    return () => unsub();
  }, []);

  const checkedIn = orders.filter((o) => o.status === "CHECKED_IN");
  const prepping = orders.filter((o) => o.status === "PREPPING");
  const ready = orders.filter((o) => o.status === "READY");

  const Column = ({ title, items }) => (
    <div
      style={{
        flex: 1,
        background: "white",
        borderRadius: 10,
        padding: 16,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        minHeight: 250
      }}
    >
      <h3 style={{ marginTop: 0 }}>{title}</h3>

      {items.length === 0 ? (
        <p style={{ color: "#777" }}>No orders</p>
      ) : (
        items.map((o) => (
          <div
            key={o.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 10,
              marginBottom: 10
            }}
          >
            <div><strong>{o.customerName}</strong></div>
            <div style={{ fontSize: 13, color: "#666" }}>{o.dob}</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 6 }}>
              Order ID: {o.id}
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div>
      <h2>Live Pickup Board</h2>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Column title="Checked In" items={checkedIn} />
        <Column title="Prepping" items={prepping} />
        <Column title="Ready" items={ready} />
      </div>
    </div>
  );
}