import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../../firebase";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      console.log("LOGIN SUCCESS:", userCredential.user);
      navigate("/dashboard");
    } catch (error) {
      console.error("FULL LOGIN ERROR:", error);
      alert(`Login failed: ${error.code}\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("Logged out.");
    } catch (error) {
      console.error("Logout error:", error);
      alert(`Logout failed: ${error.code}\n${error.message}`);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={headingStyle}>Staff Login</h1>
        <p style={subheadingStyle}>
          Sign in to access Greenlane Verified staff tools.
        </p>

        <form onSubmit={handleLogin}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@email.com"
            style={inputStyle}
          />

          <label style={labelStyle}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            style={inputStyle}
          />

          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? "Signing In..." : "Login"}
          </button>
        </form>

        <button onClick={handleLogout} style={secondaryButtonStyle}>
          Logout
        </button>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  backgroundColor: "#f4f7f5",
  padding: "32px",
  fontFamily: "Arial, sans-serif",
};

const cardStyle = {
  maxWidth: "500px",
  backgroundColor: "#ffffff",
  borderRadius: "14px",
  padding: "24px",
  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
  border: "1px solid #e6ece8",
};

const headingStyle = {
  marginTop: 0,
  color: "#163126",
  fontSize: "32px",
};

const subheadingStyle = {
  color: "#5c6b63",
  marginBottom: "24px",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  marginTop: "16px",
  color: "#163126",
  fontWeight: "bold",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #cfd8d3",
  fontSize: "14px",
  boxSizing: "border-box",
};

const buttonStyle = {
  backgroundColor: "#1f7a4d",
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  padding: "12px 18px",
  cursor: "pointer",
  fontWeight: "bold",
  marginTop: "20px",
  width: "100%",
};

const secondaryButtonStyle = {
  backgroundColor: "#163126",
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  padding: "12px 18px",
  cursor: "pointer",
  fontWeight: "bold",
  marginTop: "12px",
  width: "100%",
};