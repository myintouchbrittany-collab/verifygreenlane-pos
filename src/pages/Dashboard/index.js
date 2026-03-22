import React, { useEffect, useMemo, useState } from "react";
import { useOrders } from "../../context/OrdersContext";
import { isActiveOrder } from "../../services/orderService";
import { buildQueueSummary, sortQueueOrders } from "../../services/liveQueue";
import QueueSummaryCards from "../../components/QueueSummaryCards";
import LiveQueueTable from "../../components/LiveQueueTable";
import OrderDetailDrawer from "../../components/OrderDetailDrawer";

function matchesSearch(order, searchTerm) {
  const name = (order.customerName || order.name || "").toLowerCase();
  const orderNumber = (
    order.orderNumber ||
    order.order ||
    order.orderId ||
    order.id ||
    ""
  ).toLowerCase();
  const pickupCode = (order.pickupCode || "").toLowerCase();
  const search = searchTerm.toLowerCase();

  return (
    name.includes(search) ||
    orderNumber.includes(search) ||
    pickupCode.includes(search)
  );
}

export default function Dashboard() {
  const { loading, orders, updateOrder } = useOrders();
  const [searchTerm, setSearchTerm] = useState("");
  const [busyOrderId, setBusyOrderId] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [queueNow, setQueueNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setQueueNow(new Date());
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  const activeOrders = useMemo(() => {
    return orders.filter((order) => isActiveOrder(order));
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return sortQueueOrders(
      activeOrders.filter((order) => matchesSearch(order, searchTerm)),
      queueNow
    );
  }, [activeOrders, searchTerm, queueNow]);

  const summary = useMemo(() => {
    return buildQueueSummary(activeOrders, queueNow);
  }, [activeOrders, queueNow]);

  const handleRunAction = async (order, action) => {
    const orderId = order.orderId || order.id;

    try {
      setBusyOrderId(orderId);
      await updateOrder(orderId, action.updates, order.customerId);
    } catch (error) {
      console.error(`Error running live queue action: ${action.id}`, error);
      alert("There was a problem updating this order.");
    } finally {
      setBusyOrderId("");
    }
  };

  return (
    <div style={pageStyle}>
      <div style={headerRowStyle}>
        <div>
          <div style={eyebrowStyle}>Live Operations Queue</div>
          <h1 style={headingStyle}>Live Pickup Queue</h1>
          <p style={subheadingStyle}>
            Active dispensary pickup orders, ordered for fast scanning and the
            next action staff should take.
          </p>
        </div>
      </div>

      <QueueSummaryCards summary={summary} />

      <div style={tableCardStyle}>
        <div style={tableHeaderRowStyle}>
          <div>
            <h2 style={sectionTitleStyle}>Queue</h2>
            <p style={sectionSubtextStyle}>
              Search by customer, order number, order ID, or pickup code.
            </p>
          </div>

          <input
            type="text"
            placeholder="Search customer, order, or pickup code..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            style={searchInputStyle}
          />
        </div>

        {loading ? (
          <p style={emptyTextStyle}>Loading active orders...</p>
        ) : (
          <LiveQueueTable
            orders={filteredOrders}
            now={queueNow}
            busyOrderId={busyOrderId}
            onRunAction={handleRunAction}
            onSelectOrder={(order) => setSelectedOrderId(order.orderId || order.id)}
          />
        )}
      </div>

      <OrderDetailDrawer
        orderId={selectedOrderId}
        busyOrderId={busyOrderId}
        onClose={() => setSelectedOrderId("")}
        onRunAction={handleRunAction}
      />
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  backgroundColor: "#f5f7f6",
  padding: "40px 36px 56px",
  fontFamily: "Arial, sans-serif",
};

const eyebrowStyle = {
  color: "#2b6b4c",
  fontWeight: "800",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontSize: "12px",
  marginBottom: "10px",
};

const headerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "32px",
  flexWrap: "wrap",
  gap: "16px",
};

const headingStyle = {
  margin: 0,
  color: "#163126",
  fontSize: "34px",
  lineHeight: 1.1,
};

const subheadingStyle = {
  marginTop: "10px",
  color: "#5c6b63",
  fontSize: "16px",
  lineHeight: 1.5,
  maxWidth: "720px",
};

const tableCardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "24px",
  padding: "28px",
  boxShadow: "0 18px 42px rgba(10, 36, 24, 0.08)",
  border: "1px solid #e6ece8",
  marginTop: "36px",
};

const tableHeaderRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "18px",
  flexWrap: "wrap",
  marginBottom: "20px",
};

const sectionTitleStyle = {
  marginTop: 0,
  marginBottom: "8px",
  color: "#163126",
  fontSize: "24px",
};

const sectionSubtextStyle = {
  color: "#5c6b63",
  marginTop: 0,
  fontSize: "15px",
};

const searchInputStyle = {
  padding: "14px 16px",
  minWidth: "320px",
  borderRadius: "14px",
  border: "1px solid #cfd8d3",
  fontSize: "15px",
  color: "#163126",
  backgroundColor: "#fbfcfb",
};

const emptyTextStyle = {
  color: "#5c6b63",
  marginTop: "6px",
};
