import React, { useEffect, useState } from "react";
import api from "../api";

export default function UserDashboard({ showToast }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.listTickets();
        setTickets(res.data || []);
        if (showToast) showToast("Tickets loaded successfully.", "success");
      } catch (err) {
        const errMsg = err.response?.data?.message || err.message || "Failed to load tickets";
        setError(errMsg);
        if (showToast) showToast(errMsg, "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showToast]);

  return (
    <div className="dashboard-container">
      <h2 style={{ textAlign: "center", marginBottom: 18 }}>User Dashboard</h2>
      <p style={{ textAlign: "center", marginBottom: 24 }}>Welcome — scan or view your tickets below.</p>

      {loading && (
        <div className="dashboard-skeleton">
          <div className="skeleton-bar" style={{ width: "80%" }} />
          <div className="skeleton-bar" style={{ width: "60%" }} />
        </div>
      )}
      {error && <div className="error-text" style={{ marginBottom: 10 }}>{error}</div>}

      {!loading && tickets.length === 0 && <div className="empty-text">No tickets found.</div>}

      {tickets.length > 0 && (
        <table className="tickets-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Issued</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id || t._id}>
                <td>{t.id || t._id}</td>
                <td>{t.status || t.state}</td>
                <td>{t.issuedAt || t.createdAt || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
