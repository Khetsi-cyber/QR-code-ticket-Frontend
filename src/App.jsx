import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import Login from "./components/Login";
import UserDashboard from "./components/UserDashboard";
import AdminDashboard from "./components/AdminDashboard";
import Toast from "./components/Toast";
import ApiDebug from "./components/ApiDebug";
import api from "./api";

function PrivateRoute({ children, role }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!token) return <Navigate to="/login" replace />;
  if (role && (!user || user.role !== role)) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [me, setMe] = useState(JSON.parse(localStorage.getItem("user") || "null"));
  const [toast, setToast] = useState({ message: "", type: "info" });
  const navigate = useNavigate();

  useEffect(() => {
    // Optionally verify token on load
    const token = localStorage.getItem("token");
    if (token && !me) {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        setMe(user);
      } catch (e) {
        // ignore
      }
    }
  }, [me]);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const onLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setMe(null);
    showToast("Logged out successfully.", "success");
    navigate("/login");
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>QR Bus Ticketing System</h1>
        {me && (
          <div>
            <span>Signed in as: {me.username} ({me.role})</span>
            <button onClick={onLogout} style={{ marginLeft: 10 }}>Logout</button>
          </div>
        )}
      </header>

      <main>
        <Routes>
          <Route path="/login" element={<Login onLogin={(user) => { setMe(user); showToast("Login successful!", "success"); navigate(user.role === "admin" ? "/admin" : "/user"); }} />} />
          <Route path="/user/*" element={
            <PrivateRoute role="user">
              <UserDashboard showToast={showToast} />
            </PrivateRoute>
          } />
          <Route path="/admin/*" element={
            <PrivateRoute role="admin">
              <AdminDashboard showToast={showToast} />
            </PrivateRoute>
          } />
          <Route path="/" element={<Navigate to={me ? (me.role === "admin" ? "/admin" : "/user") : "/login"} />} />
        </Routes>
      </main>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
      <ApiDebug />
    </div>
  );
}
