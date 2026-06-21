import React, { useState } from "react";
import { AuthProvider, useAuth } from "./firebase/AuthContext";
import Login         from "./components/Login";
import Sidebar       from "./components/Sidebar";
import Dashboard     from "./components/Dashboard";
import RevenueEntry  from "./components/RevenueEntry";
import Records       from "./components/Records";
import Analytics     from "./components/Analytics";
import Reports       from "./components/Reports";
import UserManagement from "./components/UserManagement";
import Settings      from "./components/Settings";

function AppShell() {
  const { user, profile, loading } = useAuth();
  const [page, setPage] = useState("dashboard");

  if (loading) {
    return (
      <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#f5f6fa" }}>
        <div>
          <div style={{ width:40,height:40,border:"3px solid #e5e7eb",borderTopColor:"#1F3864",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 12px" }} />
          <p style={{ color:"#9ca3af",fontSize:13,textAlign:"center" }}>Loading…</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  const role = profile?.role || "viewer";

  // Guard page access by role
  const allowed = {
    dashboard: true,
    entry:     ["admin","finance"].includes(role),
    records:   true,
    analytics: true,
    reports:   true,
    users:     role === "admin",
    settings:  true,
  };

  const activePage = allowed[page] ? page : "dashboard";

  const PAGE = {
    dashboard: <Dashboard />,
    entry:     <RevenueEntry />,
    records:   <Records />,
    analytics: <Analytics />,
    reports:   <Reports />,
    users:     <UserManagement />,
    settings:  <Settings />,
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh" }}>
      <Sidebar page={activePage} setPage={setPage} />
      <main style={{
        flex:1, padding:"1.75rem 2rem",
        overflowY:"auto", minWidth:0,
        background:"#f5f6fa"
      }}>
        {PAGE[activePage]}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
