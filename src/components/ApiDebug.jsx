import React, { useEffect, useState } from "react";

const isDebugOn = process.env.REACT_APP_DEBUG_API === "true" || localStorage.getItem("DEBUG_API") === "1";

export default function ApiDebug() {
  const [messages, setMessages] = useState([]);
  const [visible, setVisible] = useState(isDebugOn);

  useEffect(() => {
    function onMsg(e) {
      setMessages((m) => [{ ts: Date.now(), detail: e.detail }, ...m].slice(0, 50));
    }
    window.addEventListener("api:debug", onMsg);
    return () => window.removeEventListener("api:debug", onMsg);
  }, []);

  if (!visible) return (
    <div style={{ position: "fixed", right: 12, bottom: 12, zIndex: 9999 }}>
      <button className="login-btn" onClick={() => setVisible(true)}>Show API Debug</button>
    </div>
  );

  return (
    <div style={{ position: "fixed", right: 12, bottom: 12, zIndex: 9999, width: 480, maxHeight: "60vh", overflow: "auto" }}>
      <div style={{ background: "rgba(3,3,3,0.9)", color: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 6px 24px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <strong>API Debug</strong>
          <div>
            <button className="login-btn" style={{ marginRight: 8 }} onClick={() => { setMessages([]); }}>Clear</button>
            <button className="login-btn" onClick={() => setVisible(false)}>Hide</button>
          </div>
        </div>
        <div style={{ fontSize: 12 }}>
          {messages.map((m) => (
            <div key={m.ts} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ color: "#9fb6ff", fontSize: 11 }}>{new Date(m.ts).toLocaleTimeString()}</div>
              <pre style={{ color: "#dfeffd", whiteSpace: "pre-wrap", fontSize: 12 }}>{JSON.stringify(m.detail, null, 2)}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
