import React, { useState } from "react";
import { useAuth } from "../firebase/AuthContext";
import { auth } from "../firebase/config";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

export default function Settings() {
  const { user, profile } = useAuth();
  const [current, setCurrent] = useState("");
  const [newPw,   setNewPw]   = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg,     setMsg]     = useState({ text: "", type: "" });
  const [busy,    setBusy]    = useState(false);

  const changePassword = async (e) => {
    e.preventDefault();
    if (newPw !== confirm)  { setMsg({ text: "New passwords do not match.", type: "err" }); return; }
    if (newPw.length < 6)   { setMsg({ text: "Password must be at least 6 characters.", type: "err" }); return; }
    setBusy(true); setMsg({ text: "", type: "" });
    try {
      const cred = EmailAuthProvider.credential(user.email, current);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, newPw);
      setMsg({ text: "Password updated successfully.", type: "ok" });
      setCurrent(""); setNewPw(""); setConfirm("");
    } catch (ex) {
      const map = {
        "auth/wrong-password":     "Current password is incorrect.",
        "auth/too-many-requests":  "Too many attempts. Please wait and try again.",
        "auth/invalid-credential": "Current password is incorrect.",
      };
      setMsg({ text: map[ex.code] || "Failed to update password.", type: "err" });
    } finally { setBusy(false); }
  };

  const initials = (profile?.name||"U").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);

  return (
    <div style={{ maxWidth: 560 }}>
      <p style={{ fontWeight: 600, fontSize: 20, margin: "0 0 1.5rem", color: "#1F3864" }}>Settings</p>

      {/* Profile card */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "1.5rem", marginBottom: 20 }}>
        <p style={{ fontWeight: 500, fontSize: 14, margin: "0 0 1.25rem", color: "#1F3864" }}>Your profile</p>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#1F3864", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 600, color: "#C9A84C" }}>
            {initials}
          </div>
          <div>
            <p style={{ fontWeight: 500, fontSize: 15, margin: "0 0 3px", color: "#111827" }}>{profile?.name}</p>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 3px" }}>{user?.email}</p>
            <span style={{ background: "#dbeafe", color: "#1e40af", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 500, textTransform: "capitalize" }}>
              {profile?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "1.5rem" }}>
        <p style={{ fontWeight: 500, fontSize: 14, margin: "0 0 1.25rem", color: "#1F3864" }}>Change password</p>

        {msg.text && (
          <div style={{
            background: msg.type === "ok" ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${msg.type === "ok" ? "#86efac" : "#fecaca"}`,
            color: msg.type === "ok" ? "#166534" : "#dc2626",
            borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 14
          }}>{msg.text}</div>
        )}

        <form onSubmit={changePassword}>
          {[
            { label: "Current password", val: current, set: setCurrent, ph: "Your current password" },
            { label: "New password",     val: newPw,   set: setNewPw,   ph: "Min 6 characters" },
            { label: "Confirm new password", val: confirm, set: setConfirm, ph: "Repeat new password" },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 5 }}>{f.label}</label>
              <input type="password" value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} style={{ width: "100%", boxSizing: "border-box" }} />
            </div>
          ))}
          <button type="submit" disabled={busy} style={{
            background: busy ? "#93a3c0" : "#1F3864", color: "#fff",
            border: "none", borderRadius: 8, padding: "10px 24px",
            fontWeight: 600, fontSize: 14, cursor: busy ? "not-allowed" : "pointer", marginTop: 4
          }}>
            {busy ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
