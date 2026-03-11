import React from "react";
import { Link } from "react-router-dom";

function Layout({ title, children }) {
  return (
    <div className="App">
      <div className="container">
        <h1>{title}</h1>

        <nav className="nav">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/verify">Verify ID</Link>
          <Link to="/checkin">Check-In</Link>
          <Link to="/pickup">Express Pickup</Link>
          <Link to="/incident">Incident Log</Link>
          <Link to="/admin">Admin</Link>
        </nav>

        {children}
      </div>
    </div>
  );
}

export default Layout;