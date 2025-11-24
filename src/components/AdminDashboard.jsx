import React, { useState } from "react";
import api from "../api";

export default function AdminDashboard({ showToast }) {
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);

  const createTicket = async (e) => {
    e.preventDefault();
    setMessage(null);
    setCreating(true);
    try {
      const payload = { email };
      const res = await api.createTicket(payload);
      const msg = "Ticket created: " + (res.data?.id || res.data?._id || "OK");
      setMessage(msg);
      setEmail("");
      if (showToast) showToast(msg, "success");
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to create ticket";
      setMessage(errMsg);
      if (showToast) showToast(errMsg, "error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="dashboard-container">
      <h2 style={{ textAlign: "center", marginBottom: 18 }}>Admin Dashboard</h2>
      <p style={{ textAlign: "center", marginBottom: 24 }}>Create a ticket for a user (email):</p>
      <form className="dashboard-form" onSubmit={createTicket}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="user@example.com"
          required
          className="dashboard-input"
        />
        <button type="submit" disabled={creating} className="dashboard-btn">
          {creating ? <span className="spinner" /> : "Create Ticket"}
        </button>
      </form>
      {creating && (
        <div className="dashboard-skeleton">
          <div className="skeleton-bar" style={{ width: "80%" }} />
        </div>
      )}
      {message && <div className="info-text" style={{ marginTop: 12 }}>{message}</div>}
    </div>
  );
}

