import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import CustomerUpload from "./pages/CustomerUpload";
import Checkout from "./pages/Checkout";
import Completed from "./pages/Completed";
import CustomerOrder from "./pages/CustomerOrder";
import CustomerStatus from "./pages/CustomerStatus";
import OrderConfirmation from "./pages/OrderConfirmation";
import ScanPickup from "./pages/ScanPickup";
import OrderDetail from "./pages/OrderDetail";
import ParkingCheckIn from "./pages/ParkingCheckIn";
import PublicDisplay from "./pages/PublicDisplay";
import ProtectedRoute from "./components/ProtectedRoute";
import { OrdersProvider } from "./context/OrdersContext";

function Navigation() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Logout failed.");
    }
  };

  return (
    <nav style={navStyle}>
      <div>
        <div style={brandStyle}>Greenlane Verified</div>
        <div style={brandSubtextStyle}>
          Dispensary preorder, pickup, and ID workflow
        </div>
      </div>

      <div style={navGroupStyle}>
        <Link style={publicLinkStyle} to="/order">
          Customer Order
        </Link>
        <Link style={publicLinkStyle} to="/customer-status">
          Customer Status
        </Link>
        <Link style={publicLinkStyle} to="/check-in">
          Check In
        </Link>
        <Link style={publicLinkStyle} to="/display">
          Public Display
        </Link>
        <Link style={publicLinkStyle} to="/staff-login">
          Staff Login
        </Link>

        {user ? (
          <>
            <Link style={staffLinkStyle} to="/dashboard">
              Dashboard
            </Link>
            <Link style={staffLinkStyle} to="/scan-pickup">
              Scan
            </Link>
            <Link style={staffLinkStyle} to="/customer-upload">
              Customer Lookup
            </Link>
            <Link style={staffLinkStyle} to="/checkout">
              Checkout
            </Link>
            <Link style={staffLinkStyle} to="/completed">
              Completed
            </Link>

            <button onClick={handleLogout} style={logoutButtonStyle}>
              Logout
            </button>
          </>
        ) : null}
      </div>
    </nav>
  );
}

function AppContent() {
  const location = useLocation();
  const isPublicDisplayRoute = location.pathname === "/display";

  return (
    <div style={isPublicDisplayRoute ? publicDisplayShellStyle : appShellStyle}>
      {isPublicDisplayRoute ? null : <Navigation />}

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/staff-login" element={<Login />} />
        <Route path="/order" element={<CustomerOrder />} />
        <Route path="/customer-status" element={<CustomerStatus />} />
        <Route path="/check-in" element={<ParkingCheckIn />} />
        <Route path="/order-confirmation" element={<OrderConfirmation />} />
        <Route path="/customer-upload" element={<CustomerUpload />} />
        <Route path="/display" element={<PublicDisplay />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scan-pickup"
          element={
            <ProtectedRoute>
              <ScanPickup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/completed"
          element={
            <ProtectedRoute>
              <Completed />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:orderId"
          element={
            <ProtectedRoute>
              <OrderDetail />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <OrdersProvider>
        <AppContent />
      </OrdersProvider>
    </Router>
  );
}

const appShellStyle = {
  fontFamily: "Arial, sans-serif",
  minHeight: "100vh",
  background:
    "linear-gradient(180deg, #eff5ef 0%, #f9fbf8 28%, #f4f7f5 100%)",
};

const publicDisplayShellStyle = {
  minHeight: "100vh",
  backgroundColor: "#0d1f19",
};

const navStyle = {
  padding: "18px 24px",
  background: "#163126",
  color: "#ffffff",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "12px",
  borderBottom: "1px solid #264d3e",
};

const brandStyle = {
  fontWeight: "bold",
  fontSize: "24px",
};

const brandSubtextStyle = {
  fontSize: "13px",
  color: "#cdebd8",
  marginTop: "4px",
};

const navGroupStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  alignItems: "center",
};

const sharedLinkStyle = {
  textDecoration: "none",
  fontWeight: "600",
  padding: "9px 14px",
  borderRadius: "999px",
  fontSize: "14px",
};

const publicLinkStyle = {
  ...sharedLinkStyle,
  color: "#163126",
  backgroundColor: "#d6eddc",
};

const staffLinkStyle = {
  ...sharedLinkStyle,
  color: "#f3fbf7",
  backgroundColor: "#214838",
};

const logoutButtonStyle = {
  backgroundColor: "#2e8b57",
  color: "#ffffff",
  border: "none",
  borderRadius: "999px",
  padding: "9px 14px",
  cursor: "pointer",
  fontWeight: "bold",
};

export default App;
