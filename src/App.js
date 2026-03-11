<<<<<<< HEAD
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";

import { auth } from "./firebase";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CheckIn from "./pages/CheckIn";
import VerifyID from "./pages/VerifyID";
import CustomerUpload from "./pages/CustomerUpload";
import CustomerStatus from "./pages/CustomerStatus";
import Checkout from "./pages/Checkout";
import Completed from "./pages/Completed";
import ProtectedRoute from "./components/ProtectedRoute";

function Navigation() {
  const navigate = useNavigate();

  const linkStyle = {
    color: "#cdebd8",
    textDecoration: "none",
    fontWeight: "500",
  };

  const logoutButtonStyle = {
    backgroundColor: "#2e8b57",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 14px",
    cursor: "pointer",
    fontWeight: "bold",
  };

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
    <nav
      style={{
        padding: "16px 24px",
        background: "#163126",
        color: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
      }}
    >
      <div style={{ fontWeight: "bold", fontSize: "24px" }}>
        Greenlane Verified
      </div>

      <div
        style={{
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Link style={linkStyle} to="/">Login</Link>
        <Link style={linkStyle} to="/dashboard">Dashboard</Link>
        <Link style={linkStyle} to="/checkin">Check-In</Link>
        <Link style={linkStyle} to="/verify-id">Verify ID</Link>
        <Link style={linkStyle} to="/customer-upload">Customer Upload</Link>
        <Link style={linkStyle} to="/customer-status">Customer Status</Link>
        <Link style={linkStyle} to="/checkout">Checkout</Link>
        <Link style={linkStyle} to="/completed">Completed</Link>

        <button onClick={handleLogout} style={logoutButtonStyle}>
          Logout
        </button>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div
        style={{
          fontFamily: "Arial, sans-serif",
          minHeight: "100vh",
          backgroundColor: "#f4f7f5",
        }}
      >
        <Navigation />

        <Routes>
          <Route path="/" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/checkin"
            element={
              <ProtectedRoute>
                <CheckIn />
              </ProtectedRoute>
            }
          />

          <Route
            path="/verify-id"
            element={
              <ProtectedRoute>
                <VerifyID />
              </ProtectedRoute>
            }
          />

          <Route path="/customer-upload" element={<CustomerUpload />} />
          <Route path="/customer-status" element={<CustomerStatus />} />

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
        </Routes>
      </div>
    </Router>
  );
}

export default App;
=======
function App() {
  return (
    <div style={{ padding: "40px", fontSize: "28px", color: "black", backgroundColor: "white" }}>
      Greenlane POS test screen
    </div>
  );
}

export default App;
>>>>>>> 8070e837610af96f45ad487e4de6ed05f7428e57
