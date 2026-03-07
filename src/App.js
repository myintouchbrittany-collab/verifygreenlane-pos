```javascript
import { useState, useEffect } from "react";
import "./App.css";

import { db } from "./firebase";
import { QRCodeCanvas } from "qrcode.react";

import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";

import StaffDashboard from "./StaffDashboard";
import Scanner from "./Scanner";

function parseDOB(dobStr) {
  const parts = dobStr.split("/");
  if (parts.length !== 3) return null;

  const mm = parseInt(parts[0], 10);
  const dd = parseInt(parts[1], 10);
  const yyyy = parseInt(parts[2], 10);

  if (!mm || !dd || !yyyy) return null;

  const d = new Date(yyyy, mm - 1, dd);

  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) {
    return null;
  }

  return d;
}

function is21OrOlder(dobDate) {
  const today = new Date();
  const cutoff = new Date(
    today.getFullYear() - 21,
    today.getMonth(),
    today.getDate()
  );
  return dobDate <= cutoff;
}

function App() {

  const [mode, setMode] = useState("customer");

  const [name, setName] = useState("");
  const [dob, setDob] = useState("");

  const [lastOrderId, setLastOrderId] = useState("");

  const [orderStatus, setOrderStatus] = useState("");

  const [orderCustomer, setOrderCustomer] = useState({
    customerName: "",
    dob: ""
  });

  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {

    if (!lastOrderId) return;

    const orderRef = doc(db, "orders", lastOrderId);

    const unsubscribe = onSnapshot(orderRef, (snap) => {

      if (!snap.exists()) return;

      const data = snap.data();

      setOrderStatus(data.status || "");

      setOrderCustomer({
        customerName: data.customerName || "",
        dob: data.dob || ""
      });

    });

    return () => unsubscribe();

  }, [lastOrderId]);

  const createPreorder = async () => {

    setStatusMsg("");

    if (!name.trim()) {
      alert("Enter your name");
      return;
    }

    const dobDate = parseDOB(dob);

    if (!dobDate) {
      alert("DOB must be MM/DD/YYYY");
      return;
    }

    if (!is21OrOlder(dobDate)) {
      alert("Must be 21+");
      return;
    }

    try {

      const newOrder = {
        customerName: name,
        dob: dob,
        status: "PREORDERED",
        checkedIn: false,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "orders"), newOrder);

      setLastOrderId(docRef.id);

      alert("Preorder Created");

    } catch (err) {

      console.error(err);
      alert("Error creating preorder");

    }
  };

  const checkIn = async () => {

    if (!lastOrderId) {
      alert("Create preorder first");
      return;
    }

    try {

      const orderRef = doc(db, "orders", lastOrderId);

      await updateDoc(orderRef, {
        status: "CHECKED_IN",
        checkedIn: true,
        checkedInAt: serverTimestamp()
      });

      setStatusMsg("Checked In");

    } catch (err) {

      console.error(err);
      alert("Error checking in");

    }
  };

  return (

    <div className="container">

      <div className="header">
        <h1 className="title">GreenLane</h1>

        <div className="nav">
          <button onClick={() => setMode("customer")}>Customer</button>
          <button onClick={() => setMode("staff")}>Staff Dashboard</button>
          <button onClick={() => setMode("scanner")}>Scanner</button>
        </div>
      </div>

      {mode === "customer" && (

        <div className="card">

          <label>Name</label>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Smith"
          />

          <label>DOB (MM/DD/YYYY)</label>

          <input
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            placeholder="01/01/1995"
          />

          <button onClick={createPreorder}>
            Create Preorder
          </button>

          <button
            onClick={checkIn}
            disabled={!lastOrderId}
            style={{ marginLeft: 10 }}
          >
            I'm Here (Check In)
          </button>

          {statusMsg && (
            <p style={{ marginTop: 15 }}>
              {statusMsg}
            </p>
          )}

          {lastOrderId && (

            <div className="qrBox">

              <p>
                Order ID: <strong>{lastOrderId}</strong>
              </p>

              <p>Show this QR when you arrive</p>

              <QRCodeCanvas
                value={lastOrderId}
                size={200}
              />

            </div>

          )}

          {lastOrderId && (

            <div className="statusBox">

              <h3>Live Order Status</h3>

              <p>
                Status: <strong>{orderStatus || "Loading..."}</strong>
              </p>

              <p>
                {orderCustomer.customerName} {orderCustomer.dob}
              </p>

              {orderStatus === "READY" && (
                <p>✅ Your order is READY</p>
              )}

              {orderStatus === "COMPLETED" && (
                <p>✅ Pickup Complete</p>
              )}

            </div>

          )}

        </div>

      )}

      {mode === "staff" && <StaffDashboard />}

      {mode === "scanner" && <Scanner />}

    </div>

  );

}

export default App;
```
