import { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";

export default function StaffDashboard() {
  const [checkedIn, setCheckedIn] = useState([]);
  const [prepping, setPrepping] = useState([]);
  const [ready, setReady] = useState([]);

  useEffect(() => {
    const qCheckedIn = query(collection(db, "orders"), where("status", "==", "CHECKED_IN"));
    const qPrepping = query(collection(db, "orders"), where("status", "==", "PREPPING"));
    const qReady = query(collection(db, "orders"), where("status", "==", "READY"));

    const unsub1 = onSnapshot(qCheckedIn, (snap) =>
      setCheckedIn(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsub2 = onSnapshot(qPrepping, (snap) =>
      setPrepping(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsub3 = onSnapshot(qReady, (snap) =>
      setReady(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  const setStatus = async (orderId, status) => {
    try {
      const updates = { status };

      if (status === "PREPPING") updates.prepStartedAt = serverTimestamp();
      if (status === "READY") updates.readyAt = serverTimestamp();
      if (status === "COMPLETED") updates.completedAt = serverTimestamp();

      await updateDoc(doc(db, "orders", orderId), updates);
    } catch (err) {
      console.error(err);
      alert("Error updating status");
    }
  };

  const Card = ({ o, actions }) => (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 10, marginBottom: 10 }}>
      <div><strong>Name:</strong> {o.customerName}</div>
      <div><strong>DOB:</strong> {o.dob}</div>
      <div><strong>Status:</strong> {o.status}</div>
      <div style={{ marginTop: 10 }}>{actions}</div>
      <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
        Order ID: {o.id}
      </div>
    </div>
  );

  return (
    <div style={{ padding: 10 }}>
      <h2>Staff Prep Board</h2>

      <h3>Checked In</h3>
      {checkedIn.length === 0 ? (
        <p>No checked-in customers.</p>
      ) : (
        checkedIn.map((o) => (
          <Card
            key={o.id}
            o={o}
            actions={
              <button onClick={() => setStatus(o.id, "PREPPING")}>
                Start Prep
              </button>
            }
          />
        ))
      )}

      <h3>Prepping</h3>
      {prepping.length === 0 ? (
        <p>No orders prepping.</p>
      ) : (
        prepping.map((o) => (
          <Card
            key={o.id}
            o={o}
            actions={
              <button onClick={() => setStatus(o.id, "READY")}>
                Mark Ready
              </button>
            }
          />
        ))
      )}

      <h3>Ready</h3>
      {ready.length === 0 ? (
        <p>No ready orders.</p>
      ) : (
        ready.map((o) => (
          <Card
            key={o.id}
            o={o}
            actions={
              <button onClick={() => setStatus(o.id, "COMPLETED")}>
                Complete Pickup
              </button>
            }
          />
        ))
      )}
    </div>
  );
}