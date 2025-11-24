
import React, { useState } from "react";
import api, { client } from "../api";

function validateEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

function validatePassword(password) {
  // At least 8 chars, one number, one letter
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*]{8,}$/.test(password);
}

const ROLES = [
  { value: "passenger", label: "Passenger" },
  { value: "admin", label: "Admin" },
];

export default function Login({ onLogin }) {
  const [role, setRole] = useState("");
  const [step, setStep] = useState(0); // 0: select role, 1: login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serverResponse, setServerResponse] = useState(null);
  const [showServerResponse, setShowServerResponse] = useState(false);
  const [testerRunning, setTesterRunning] = useState(false);
  const [autoResults, setAutoResults] = useState([]);
  const [touched, setTouched] = useState({ email: false, password: false });

  const emailValid = validateEmail(email);
  const passwordValid = validatePassword(password);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep(1);
    setError(null);
    setEmail("");
    setPassword("");
    setTouched({ email: false, password: false });
  };

  // Auto-tester: try several endpoint & payload variants to find a working login shape
  const runAutoTester = async () => {
    if (testerRunning) return;
    setTesterRunning(true);
    setAutoResults([]);
    const endpoints = [
      "/api/auth/login",
      "/auth/login",
      "/api/login",
      "/login",
    ];
    const roleOptions = [undefined, "user", "passenger", "admin"];
    const emailFields = ["email", "username"];
    const passFields = ["password", "pass"];

    const results = [];

    for (const endpoint of endpoints) {
      for (const roleOpt of roleOptions) {
        for (const eField of emailFields) {
          for (const pField of passFields) {
            const payload = {};
            payload[eField] = email;
            payload[pField] = password;
            if (roleOpt) payload.role = roleOpt;
            // also include userRole for compatibility
            if (roleOpt) payload.userRole = roleOpt;

            try {
              const resp = await client.post(endpoint, payload, { timeout: 6000 });
              const data = resp?.data;
              const resObj = { endpoint, payload, status: resp.status, data };
              results.push(resObj);
              // emit an api debug event for visibility
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("api:debug", { detail: { type: "auto-test-success", ...resObj } }));
              }
              // stop early on first success
              setAutoResults(results);
              setTesterRunning(false);
              return;
            } catch (err) {
              const status = err.response?.status;
              const data = err.response?.data;
              const errObj = { endpoint, payload, status: status || "ERR", data: data || { message: err.message } };
              results.push(errObj);
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("api:debug", { detail: { type: "auto-test-fail", ...errObj } }));
              }
              // continue to next variant
              setAutoResults([...results]);
            }
          }
        }
      }
    }

    setTesterRunning(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!emailValid || !passwordValid) {
      setTouched({ email: true, password: true });
      setError("Please enter a valid email and password.");
      return;
    }
    setLoading(true);
    try {
      const sendRole = role === "passenger" ? "user" : role;
      // send both fields temporarily for debugging: `role` (what UI picked) and `userRole` (backend-typical)
      const res = await api.login({ email, password, role, userRole: sendRole });
      const data = res && res.data ? res.data : res;
      const token = data.token || data.accessToken || (data.data && data.data.token);
      const user = data.user || data.data?.user || data;
      if (!token) throw new Error("No token returned from server");
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setLoading(false);
      setServerResponse(null);
      if (onLogin) onLogin(user);
    } catch (err) {
      setLoading(false);
      // store helpful server info for debug display
      const normalized = err.normalized || { status: err.response?.status, data: err.response?.data };
      setServerResponse(normalized || { message: err.message });
      setError(err.response?.data?.message || err.message || "Login failed");

      // If auto-workarounds enabled, try a small set of fallback requests
      try {
        const AUTO = api.AUTO_WORKAROUNDS;
        if (AUTO) {
          // avoid repeating
          let fallbackRes = null;
          // 1) retry without any role fields
          try {
            fallbackRes = await client.post('/api/auth/login', { email, password });
          } catch (e1) {
            // 2) try without /api prefix
            try {
              fallbackRes = await client.post('/auth/login', { email, password });
            } catch (e2) {
              // 3) try alternate path /api/login
              try {
                fallbackRes = await client.post('/api/login', { email, password });
              } catch (e3) {
                fallbackRes = null;
              }
            }
          }

          if (fallbackRes && (fallbackRes.status >= 200 && fallbackRes.status < 300)) {
            const d = fallbackRes.data || fallbackRes;
            const token = d.token || d.accessToken || (d.data && d.data.token);
            const user = d.user || d.data?.user || d;
            if (token) {
              localStorage.setItem('token', token);
              localStorage.setItem('user', JSON.stringify(user));
              setServerResponse({ fallback: true, status: fallbackRes.status, data: d });
              if (onLogin) onLogin(user);
              return;
            }
          }
        }
      } catch (workErr) {
        // include fallback errors into serverResponse for debugging
        setServerResponse((prev) => ({ ...prev, fallbackError: workErr?.normalized || { message: workErr.message } }));
      }
    }
  };

  return (
    <div className="login-container">
      {step === 0 ? (
        <>
          <h2 style={{ textAlign: "center", marginBottom: 24 }}>Select your role</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {ROLES.map((r) => (
              <button
                key={r.value}
                className="login-btn"
                style={{ fontSize: "1.1em", padding: "14px 0" }}
                onClick={() => handleRoleSelect(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <h2 style={{ textAlign: "center", marginBottom: 24 }}>Sign in as {role === "admin" ? "Admin" : "Passenger"}</h2>
          <form className="login-form" onSubmit={submit}>
            <div className="form-group">
              <label>Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                type="email"
                required
                className={emailValid || !touched.email ? "" : "input-error"}
                placeholder="you@example.com"
                autoFocus
              />
              {!emailValid && touched.email && (
                <div className="error-text">Enter a valid email address.</div>
              )}
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                type="password"
                required
                className={passwordValid || !touched.password ? "" : "input-error"}
                placeholder="Password (min 8 chars, 1 number)"
              />
              {!passwordValid && touched.password && (
                <div className="error-text">Password must be at least 8 characters and contain a number.</div>
              )}
            </div>

            {error && <div className="error-text" style={{ marginBottom: 10 }}>{error}</div>}

            {serverResponse && (
              <div>
                <button
                  type="button"
                  className="login-btn"
                  style={{ marginTop: 8, background: "#e0e3e7", color: "#222" }}
                  onClick={() => setShowServerResponse((s) => !s)}
                >
                  {showServerResponse ? "Hide server response" : "Show server response"}
                </button>
                {showServerResponse && (
                  <pre className="debug-box" style={{ marginTop: 8, maxHeight: 300, overflow: "auto" }}>
                    {JSON.stringify(serverResponse, null, 2)}
                  </pre>
                )}
                <div style={{ marginTop: 10 }}>
                  <button
                    type="button"
                    className="login-btn"
                    style={{ marginTop: 8, background: "#1976d2", color: "#fff" }}
                    onClick={() => runAutoTester()}
                    disabled={testerRunning}
                  >
                    {testerRunning ? "Running auto-tester..." : "Run auto-tester"}
                  </button>
                  <div style={{ marginTop: 8 }}>
                    {autoResults.length > 0 && (
                      <div>
                        <strong>Auto-tester results ({autoResults.length}):</strong>
                        <pre className="debug-box" style={{ marginTop: 8, maxHeight: 300, overflow: "auto" }}>{JSON.stringify(autoResults, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !emailValid || !passwordValid}
              className="login-btn"
            >
              {loading ? (
                <span className="spinner" />
              ) : (
                "Sign in"
              )}
            </button>
          </form>
          {loading && (
            <div className="login-skeleton">
              <div className="skeleton-bar" style={{ width: "80%" }} />
              <div className="skeleton-bar" style={{ width: "60%" }} />
            </div>
          )}
          <button
            className="login-btn"
            style={{ marginTop: 18, background: "#b0b7c3", color: "#222" }}
            onClick={() => setStep(0)}
          >
            Back to role selection
          </button>
        </>
      )}
    </div>
  );
}
