import React from "react";
import { useAuth } from "../firebase/AuthContext";

const NAV = [
  { id: "dashboard",  label: "Dashboard",       icon: "ti-layout-dashboard", roles: ["admin","finance","viewer"] },
  { id: "entry",      label: "Revenue Entry",   icon: "ti-plus",             roles: ["admin","finance"] },
  { id: "records",    label: "Records",          icon: "ti-table",            roles: ["admin","finance","viewer"] },
  { id: "analytics",  label: "Analytics",        icon: "ti-chart-bar",        roles: ["admin","finance","viewer"] },
  { id: "reports",    label: "Reports",          icon: "ti-file-analytics",   roles: ["admin","finance","viewer"] },
  { id: "users",      label: "User Management", icon: "ti-users",            roles: ["admin"] },
  { id: "settings",   label: "Settings",         icon: "ti-settings",         roles: ["admin"] },
];

export default function Sidebar({ page, setPage }) {
  const { profile, logout } = useAuth();
  const role = profile?.role || "viewer";

  const initials = (profile?.name || "U")
    .split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2);

  return (
    <aside style={{
      width: 230, background: "#1F3864", display: "flex",
      flexDirection: "column", minHeight: "100vh", flexShrink: 0,
      position: "sticky", top: 0
    }}>
      {/* Logo */}
      <div style={{ padding: "1.25rem 1.25rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: "#C9A84C",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, color: "#1F3864", fontWeight: 700
          }}>₭</div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, color: "#fff", margin: 0 }}>LCRH Revenue</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", margin: 0 }}>Collection System</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0.75rem 0.5rem" }}>
        {NAV.filter(n => n.roles.includes(role)).map(n => {
          const active = page === n.id;
          return (
            <button key={n.id} onClick={() => setPage(n.id)} style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "10px 12px",
              background: active ? "rgba(201,168,76,0.18)" : "transparent",
              border: "none",
              borderLeft: `3px solid ${active ? "#C9A84C" : "transparent"}`,
              borderRadius: "0 8px 8px 0",
              color: active ? "#C9A84C" : "rgba(255,255,255,0.7)",
              cursor: "pointer", fontSize: 14, textAlign: "left",
              marginBottom: 2, transition: "all 0.15s"
            }}>
              <i className={`ti ${n.icon}`} style={{ fontSize: 18 }} />
              {n.label}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{ padding: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%", background: "#C9A84C",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 600, color: "#1F3864", flexShrink: 0
          }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.name || "User"}</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", margin: 0, textTransform: "capitalize" }}>{role}</p>
          </div>
        </div>
        <button onClick={logout} style={{
          width: "100%", background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6,
          color: "rgba(255,255,255,0.7)", padding: "7px 0", fontSize: 12,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
        }}>
          <i className="ti ti-logout" style={{ fontSize: 15 }} /> Sign out
        </button>
      </div>
    </aside>
  );
}
