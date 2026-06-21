import React, { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const STREAMS = ["OPD Fees","IPD Charges","Lab Services","Pharmacy","Maternity","Radiology","Other"];
const STREAM_COLORS = {
  "OPD Fees":"#1F3864","IPD Charges":"#1D9E75","Lab Services":"#C9A84C",
  "Pharmacy":"#D85A30","Maternity":"#993556","Radiology":"#534AB7","Other":"#5F5E5A"
};
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const fmt    = n => "KES " + Number(n).toLocaleString("en-KE");
const fmtShort = n => n >= 1e6 ? `KES ${(n/1e6).toFixed(2)}M` : `KES ${(n/1000).toFixed(1)}K`;

function MetricCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "1.1rem 1.25rem" }}>
      <p style={{ fontSize: 11, fontWeight: 500, color: "#6b7280", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 600, margin: 0, color: accent || "#1F3864" }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 0" }}>{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "revenue"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, snap => {
      setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <Spinner />;

  const total = records.reduce((s, r) => s + (r.amount || 0), 0);
  const now   = new Date();
  const curMo = now.getMonth();
  const curYr = now.getFullYear();

  const thisMonth = records.filter(r => {
    const d = new Date(r.date);
    return d.getMonth() === curMo && d.getFullYear() === curYr;
  }).reduce((s, r) => s + r.amount, 0);

  const lastMonth = records.filter(r => {
    const d = new Date(r.date);
    const lm = curMo === 0 ? 11 : curMo - 1;
    const ly = curMo === 0 ? curYr - 1 : curYr;
    return d.getMonth() === lm && d.getFullYear() === ly;
  }).reduce((s, r) => s + r.amount, 0);

  const growth = lastMonth ? (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1) : null;

  // Monthly chart data (last 12 months)
  const monthlyData = MONTHS.map((mo, i) => ({
    month: mo,
    revenue: records.filter(r => new Date(r.date).getMonth() === i && new Date(r.date).getFullYear() === curYr)
                    .reduce((s, r) => s + r.amount, 0)
  }));

  // By stream
  const byStream = STREAMS.map(s => ({
    name: s,
    value: records.filter(r => r.stream === s).reduce((a, r) => a + r.amount, 0)
  })).filter(s => s.value > 0).sort((a, b) => b.value - a.value);

  // Recent 5
  const recent = records.slice(0, 5);

  return (
    <div>
      <p style={{ fontWeight: 600, fontSize: 20, margin: "0 0 1.5rem", color: "#1F3864" }}>Dashboard</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: "1.5rem" }}>
        <MetricCard label="Total Revenue (YTD)" value={total ? fmtShort(total) : "KES 0"} sub={`${records.length} records`} />
        <MetricCard label={`${MONTHS[curMo]} Revenue`} value={thisMonth ? fmtShort(thisMonth) : "KES 0"}
          sub={growth ? `${growth > 0 ? "+" : ""}${growth}% vs last month` : "No prior month data"}
          accent={growth > 0 ? "#1D9E75" : growth < 0 ? "#dc2626" : undefined} />
        <MetricCard label="Total Records" value={records.length.toLocaleString()} sub="All entries" />
        <MetricCard label="Top Stream" value={byStream[0]?.name || "—"} sub={byStream[0] ? fmtShort(byStream[0].value) : ""} />
      </div>

      {records.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb" }}>
          <i className="ti ti-chart-bar" style={{ fontSize: 48, color: "#d1d5db", display: "block", marginBottom: 16 }} />
          <p style={{ fontWeight: 500, fontSize: 16, color: "#6b7280", margin: "0 0 6px" }}>No revenue data yet</p>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>Go to Revenue Entry to add your first record.</p>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "1.25rem" }}>
              <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 1rem", color: "#1F3864" }}>Monthly revenue ({curYr})</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : `${(v/1e3).toFixed(0)}K`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => fmt(v)} />
                  <Line type="monotone" dataKey="revenue" stroke="#1F3864" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "1.25rem" }}>
              <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 1rem", color: "#1F3864" }}>Revenue by stream</p>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={byStream} cx="50%" cy="50%" outerRadius={70} dataKey="value" nameKey="name">
                    {byStream.map((e, i) => <Cell key={i} fill={STREAM_COLORS[e.name] || "#888"} />)}
                  </Pie>
                  <Tooltip formatter={v => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 8 }}>
                {byStream.map(s => (
                  <span key={s.name} style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 5, color: "#6b7280" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: STREAM_COLORS[s.name], display: "inline-block" }} />
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Recent records */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "1.25rem" }}>
            <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 1rem", color: "#1F3864" }}>Recent entries</p>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Date","Receipt","Stream","Description","Amount","Collector"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontSize: 11, fontWeight: 500, color: "#9ca3af", borderBottom: "1px solid #f3f4f6" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map(r => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f9fafb" }}>
                    <td style={{ padding: "9px 10px", whiteSpace: "nowrap" }}>{r.date}</td>
                    <td style={{ padding: "9px 10px", fontFamily: "monospace", fontSize: 11, color: "#6b7280" }}>{r.receipt}</td>
                    <td style={{ padding: "9px 10px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 7, height: 7, borderRadius: 2, background: STREAM_COLORS[r.stream], display: "inline-block" }} />
                        {r.stream}
                      </span>
                    </td>
                    <td style={{ padding: "9px 10px", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description}</td>
                    <td style={{ padding: "9px 10px", fontWeight: 500, whiteSpace: "nowrap" }}>{fmt(r.amount)}</td>
                    <td style={{ padding: "9px 10px", color: "#6b7280" }}>{r.collector}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
      <div style={{ width: 36, height: 36, border: "3px solid #e5e7eb", borderTopColor: "#1F3864", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
