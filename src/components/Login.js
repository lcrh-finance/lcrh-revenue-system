import React, { useState } from "react";
import { useAuth } from "../firebase/AuthContext";

const S = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center",
    justifyContent: "center", background: "linear-gradient(135deg,#1F3864 0%,#16294d 100%)",
    padding: "1rem"
  },
  card: {
    background: "#fff", borderRadius: 16, padding: "2.5rem",
    width: 400, maxWidth: "100%",
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)"
  },
  logo: {
    width: 52, height: 52, borderRadius: 12, background: "#1F3864",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 1rem", fontSize: 26, color: "#C9A84C"
  },
  title: { textAlign: "center", marginBottom: "0.25rem", fontSize: 20, fontWeight: 600, color: "#1F3864" },
  sub:   { textAlign: "center", fontSize: 13, color: "#6b7280", marginBottom: "2rem" },
  label: { fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 },
  input: { width: "100%", marginBottom: 16 },
  btn: {
    width: "100%", background: "#1F3864", color: "#fff", border: "none",
    borderRadius: 8, padding: "11px 0", fontWeight: 600, fontSize: 15,
    cursor: "pointer", marginTop: 4, transition: "background 0.15s"
  },
  err: { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 14 },
  reset: { background: "none", border: "none", color: "#1F3864", fontSize: 12, cursor: "pointer", textDecoration: "underline", marginTop: 14, display: "block", width: "100%", textAlign: "center" }
};

export default function Login() {
  const { login, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [err,   setErr]   = useState("");
  const [info,  setInfo]  = useState("");
  const [busy,  setBusy]  = useState(false);
  const [mode,  setMode]  = useState("login"); // "login" | "reset"

  const handleLogin = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      await login(email.trim(), pass);
    } catch (ex) {
      setErr(friendlyError(ex.code));
    } finally { setBusy(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      await resetPassword(email.trim());
      setInfo("Password reset email sent. Check your inbox.");
      setMode("login");
    } catch (ex) {
      setErr(friendlyError(ex.code));
    } finally { setBusy(false); }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}><i className="ti ti-building-hospital" /></div>
        <p style={S.title}>LCRH Revenue System</p>
        <p style={S.sub}>Lodwar County Referral Hospital</p>

        {err  && <div style={S.err}>{err}</div>}
        {info && <div style={{...S.err, background:"#f0fdf4", borderColor:"#86efac", color:"#166534"}}>{info}</div>}

        {mode === "login" ? (
          <form onSubmit={handleLogin}>
            <label style={S.label}>Email address</label>
            <input style={S.input} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@lcrh.go.ke" required />
            <label style={S.label}>Password</label>
            <input style={S.input} type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" required />
            <button style={S.btn} type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
            <button style={S.reset} type="button" onClick={()=>{ setMode("reset"); setErr(""); }}>Forgot password?</button>
          </form>
        ) : (
          <form onSubmit={handleReset}>
            <p style={{fontSize:13,color:"#6b7280",marginBottom:16}}>Enter your email and we'll send a reset link.</p>
            <label style={S.label}>Email address</label>
            <input style={S.input} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@lcrh.go.ke" required />
            <button style={S.btn} type="submit" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
            <button style={S.reset} type="button" onClick={()=>{ setMode("login"); setErr(""); }}>← Back to sign in</button>
          </form>
        )}
      </div>
    </div>
  );
}

function friendlyError(code) {
  const map = {
    "auth/user-not-found":    "No account found with that email.",
    "auth/wrong-password":    "Incorrect password. Try again.",
    "auth/invalid-email":     "Please enter a valid email address.",
    "auth/too-many-requests": "Too many attempts. Try again later.",
    "auth/invalid-credential":"Incorrect email or password.",
  };
  return map[code] || "Sign-in failed. Please try again.";
}
