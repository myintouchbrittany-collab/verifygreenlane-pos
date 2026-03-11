import React, { useEffect, useMemo, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";

function Dashboard() {
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

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const name = (customer.name || "").toLowerCase();
      const order = (customer.order || "").toLowerCase();
      const search = searchTerm.toLowerCase();

      return name.includes(search) || order.includes(search);
    });
  }, [customers, searchTerm]);

  const checkedInCount = customers.filter((c) => c.checkedIn).length;
  const readyCount = customers.filter(
    (c) => c.pickupStatus === "Ready for Pickup"
  ).length;
  const completedCount = customers.filter(
    (c) => c.pickupStatus === "Completed"
  ).length;
  const waitingCount = customers.filter(
    (c) => c.pickupStatus === "Waiting"
  ).length;

  const markReady = async (id) => {
    try {
      const customerRef = doc(db, "customers", id);

      await updateDoc(customerRef, {
        pickupStatus: "Ready for Pickup",
      });
    } catch (error) {
      console.error("Error marking ready:", error);
    }
  };

  const markCompleted = async (id) => {
    try {
      const customerRef = doc(db, "customers", id);

      await updateDoc(customerRef, {
        pickupStatus: "Completed",
        checkoutTime: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      console.error("Error marking completed:", error);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={headerRowStyle}>
        <div>
          <h1 style={headingStyle}>Staff Dashboard</h1>
          <p style={subheadingStyle}>
            Live pickup queue for Greenlane Verified.
          </p>
        </div>
      </div>

      <div style={statsGridStyle}>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Checked In</div>
          <div style={statValueStyle}>{checkedInCount}</div>
        </div>

        <div style={statCardStyle}>
          <div style={statLabelStyle}>Waiting</div>
          <div style={statValueStyle}>{waitingCount}</div>
        </div>

        <div style={statCardStyle}>
          <div style={statLabelStyle}>Ready</div>
          <div style={statValueStyle}>{readyCount}</div>
        </div>

        <div style={statCardStyle}>
          <div style={statLabelStyle}>Completed</div>
          <div style={statValueStyle}>{completedCount}</div>
        </div>
      </div>

      <div style={tableCardStyle}>
        <div style={tableHeaderRowStyle}>
          <div>
            <h2 style={sectionTitleStyle}>Pickup Queue</h2>
            <p style={sectionSubtextStyle}>
              Search by customer name or order number.
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

        {filteredCustomers.length === 0 ? (
          <p style={{ color: "#5c6b63", marginTop: "20px" }}>
            No customers found.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Customer</th>
                  <th style={thStyle}>Order</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Check-In</th>
                  <th style={thStyle}>Arrival Time</th>
                  <th style={thStyle}>Pickup Status</th>
                  <th style={thStyle}>Checkout Time</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td style={tdStyle}>{customer.name || "—"}</td>
                    <td style={tdStyle}>{customer.order || "—"}</td>
                    <td style={tdStyle}>
                      <span style={getBadgeStyle(customer.status || "Pending")}>
                        {customer.status || "Pending"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={getBadgeStyle(
                          customer.checkedIn ? "Checked In" : "Not Checked In"
                        )}
                      >
                        {customer.checkedIn ? "Checked In" : "Not Checked In"}
                      </span>
                    </td>
                    <td style={tdStyle}>{customer.arrivalTime || "—"}</td>
                    <td style={tdStyle}>
                      <span
                        style={getBadgeStyle(
                          customer.pickupStatus || "Waiting"
                        )}
                      >
                        {customer.pickupStatus || "Waiting"}
                      </span>
                    </td>
                    <td style={tdStyle}>{customer.checkoutTime || "—"}</td>
                    <td style={tdStyle}>
                      <div style={actionGroupStyle}>
                        <button
                          style={readyButtonStyle}
                          onClick={() => markReady(customer.id)}
                          disabled={
                            !customer.checkedIn ||
                            customer.pickupStatus === "Ready for Pickup" ||
                            customer.pickupStatus === "Completed"
                          }
                        >
                          Ready
                        </button>

                        <button
                          style={completeButtonStyle}
                          onClick={() => markCompleted(customer.id)}
                          disabled={customer.pickupStatus !== "Ready for Pickup"}
                        >
                          Complete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

function getBadgeStyle(text) {
  let backgroundColor = "#edf2ee";
  let color = "#234333";

  if (text === "Verified" || text === "Checked In" || text === "Ready for Pickup") {
    backgroundColor = "#dff3e8";
    color = "#17633c";
  }

  if (text === "Waiting" || text === "Pending" || text === "Not Checked In") {
    backgroundColor = "#fff4d6";
    color = "#8a6500";
  }

  if (text === "Completed") {
    backgroundColor = "#e3eefc";
    color = "#2057a6";
  }

  return {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "bold",
    backgroundColor,
    color,
    whiteSpace: "nowrap",
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
  marginBottom: "24px",
  flexWrap: "wrap",
  gap: "12px",
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

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "18px",
  marginBottom: "28px",
};

const statCardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "14px",
  padding: "22px",
  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
  border: "1px solid #e6ece8",
};

const statLabelStyle = {
  color: "#5c6b63",
  fontSize: "14px",
  marginBottom: "10px",
};

const statValueStyle = {
  color: "#163126",
  fontSize: "32px",
  fontWeight: "bold",
};

const tableCardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "14px",
  padding: "22px",
  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
  border: "1px solid #e6ece8",
};

const tableHeaderRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
  marginBottom: "12px",
};

const sectionTitleStyle = {
  marginTop: 0,
  marginBottom: "6px",
  color: "#163126",
};

const sectionSubtextStyle = {
  color: "#5c6b63",
  marginTop: 0,
};

const searchInputStyle = {
  padding: "12px",
  minWidth: "260px",
  borderRadius: "8px",
  border: "1px solid #cfd8d3",
  fontSize: "14px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "18px",
};

const thStyle = {
  textAlign: "left",
  padding: "14px 12px",
  borderBottom: "1px solid #dfe7e1",
  color: "#486056",
  fontSize: "14px",
  backgroundColor: "#f8faf8",
};

const tdStyle = {
  padding: "14px 12px",
  borderBottom: "1px solid #edf2ee",
  color: "#1f2e27",
  fontSize: "14px",
  verticalAlign: "middle",
};

const actionGroupStyle = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
};

const readyButtonStyle = {
  backgroundColor: "#1f7a4d",
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: "bold",
};

const completeButtonStyle = {
  backgroundColor: "#163126",
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: "bold",
};