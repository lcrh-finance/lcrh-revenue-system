import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase/config";
import { collection, onSnapshot, doc, setDoc, updateDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

const ROLES = ["admin", "finance", "viewer"];

export default function UserManagement() {
  const [users,  setUsers]  = useState([]);
  const [form,   setForm]   = useState({ name: "", email: "", role: "finance", password: "" });
  const [busy,   setBusy]   = useState(false);
  const [msg,    setMsg]    = useState({ text: "", type: "" });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), snap =>
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const addUser = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setMsg({ text: "Name, email and password are required.", type: "err" }); return;
    }
    setBusy(true); setMsg({ text: "", type: "" });
    try {
      // Create Firebase Auth account
      const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
      // Save profile to Firestore
      await setDoc(doc(db, "users", cred.user.uid), {
        name:      form.name.trim(),
        email:     form.email.trim(),
        role:      form.role,
        active:    true,
        createdAt: new Date().toISOString(),
      });
      setMsg({ text: `User ${form.name} created successfully.`, type: "ok" });
      setForm({ name: "", email: "", role: "finance", password: "" });
    } catch (ex) {
      const map = {
        "auth/email-already-in-use": "That email is already registered.",
        "auth/weak-password":        "Password must be at least 6 characters.",
        "auth/invalid-email":        "Invalid email address.",
      };
      setMsg({ text: map[ex.code] || ex.message, type: "err" });
    } finally { setBusy(false); }
  };

  const toggleActive = async (userId, current) => {
    await updateDoc(doc(db, "users", userId), { active: !current });
  };

  const changeRole = async (userId, role) => {
    await updateDoc(doc(db, "users", userId), { role });
  };

  const initials = name => name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);

  return (
    <div>
      <p style={{ fontWeight: 600, fontSize: 20, margin: "0 0 1.5rem", color: "#1F3864" }}>User management</p>

      {/* Add user */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "1.5rem", marginBottom: 24, maxWidth: 580 }}>
        <p style={{ fontWeight: 500, fontSize: 15, margin: "0 0 1.25rem", color: "#1F3864" }}>Add new user</p>

        {msg.text && (
          <div style={{
            background: msg.type === "ok" ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${msg.type === "ok" ? "#86efac" : "#fecaca"}`,
            color: msg.type === "ok" ? "#166534" : "#dc2626",
            borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 14
          }}>{msg.text}</div>
        )}

        <form onSubmit={addUser}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 5 }}>Full name *</label>
              <input value={form.name} onChange={set("name")} placeholder="e.g. Jane Auma" style={{ width: "100%", boxSizing: "border-box" }} required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 5 }}>Email address *</label>
              <input type="email" value={form.email} onChange={set("email")} placeholder="jane@lcrh.go.ke" style={{ width: "100%", boxSizing: "border-box" }} required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 5 }}>Role</label>
              <select value={form.role} onChange={set("role")} style={{ width: "100%", boxSizing: "border-box" }}>
                {ROLES.map(r => <option key={r} value={r} style={{ textTransform: "capitalize" }}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 5 }}>Temporary password *</label>
              <input type="password" value={form.password} onChange={set("password")} placeholder="Min 6 characters" style={{ width: "100%", boxSizing: "border-box" }} required />
            </div>
          </div>
          <button type="submit" disabled={busy} style={{
            marginTop: 16, background: busy ? "#93a3c0" : "#1F3864", color: "#fff",
            border: "none", borderRadius: 8, padding: "10px 24px",
            fontWeight: 600, fontSize: 14, cursor: busy ? "not-allowed" : "pointer"
          }}>
            {busy ? "Creating…" : "Create user"}
          </button>
        </form>
      </div>

      {/* Users list */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #f3f4f6" }}>
          <p style={{ fontWeight: 500, fontSize: 14, margin: 0, color: "#1F3864" }}>{users.length} system {users.length === 1 ? "user" : "users"}</p>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              {["User","Email","Role","Status","Actions"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 500, color: "#6b7280", fontSize: 11, borderBottom: "1px solid #e5e7eb" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>No users yet.</td></tr>
            ) : (
              users.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #f9fafb", background: i%2?"#fafafa":"#fff" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1F3864", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#C9A84C", flexShrink: 0 }}>
                        {initials(u.name || "?")}
                      </div>
                      <span style={{ fontWeight: 500 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#6b7280" }}>{u.email}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                      style={{ fontSize: 12, padding: "4px 8px", borderRadius: 6, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", textTransform: "capitalize" }}>
                      {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      background: u.active ? "#dcfce7" : "#f3f4f6",
                      color: u.active ? "#166534" : "#6b7280",
                      borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 500
                    }}>{u.active ? "Active" : "Inactive"}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button onClick={() => toggleActive(u.id, u.active)} style={{
                      fontSize: 12, padding: "5px 12px", borderRadius: 6,
                      border: "1px solid #d1d5db", background: "transparent",
                      cursor: "pointer", color: u.active ? "#dc2626" : "#166534"
                    }}>{u.active ? "Deactivate" : "Activate"}</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 16px", fontSize: 12, color: "#92400e" }}>
        <strong>Note:</strong> New users receive a temporary password. Ask them to change it after first login via the "Forgot password" link.
      </div>
    </div>
  );
}
