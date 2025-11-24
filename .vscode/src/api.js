import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000";

const instance = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default {
  login: (payload) => instance.post("/api/auth/login", payload),
  createTicket: (payload) => instance.post("/api/tickets", payload),
  listTickets: (params) => instance.get("/api/tickets", { params }),
  verifyTicket: (payload) => instance.post("/api/tickets/verify", payload),
  recordScan: (payload) => instance.post("/api/tickets/scan", payload),
};