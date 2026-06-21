import React, { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const STREAMS = ["OPD Fees","IPD Charges","Lab Services","Pharmacy","Maternity","Radiology","Other"];
const STREAM_COLORS = {
  "OPD Fees":"#1F3864","IPD Charges":"#1D9E75","Lab Services":"#C9A84C",
  "Pharmacy":"#D85A30","Maternity":"#993556","Radiology":"#534AB7","Other":"#5F5E5A"
};
const fmt = n => "KES " + Number(n).toLocaleString("en-KE");

export default function Analytics() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("monthly"); // monthly | quarterly | annual

  useEffect(() => {
    const q = query(collection(db, "revenue"), orderBy("date", "asc"));
    const unsub = onSnapshot(q, snap => {
      setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <Spinner />;
  if (records.length === 0) return <Empty />;

  const total = records.reduce((s, r) => s + r.amount, 0);

  // Build monthly grouped data
  const monthMap = {};
  records.forEach(r => {
    const key = r.date?.slice(0, 7);
    if (!key) return;
    if (!monthMap[key]) monthMap[key] = { month: key };
    monthMap[key][r.stream] = (monthMap[key][r.stream] || 0) + r.amount;
    monthMap[key]["Total"]  = (monthMap[key]["Total"]  || 0) + r.amount;
  });
  const monthlyData = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

  // Quarterly
  const qMap = {};
  records.forEach(r => {
    const d = new Date(r.date);
    const q = `${d.getFullYear()} Q${Math.floor(d.getMonth()/3)+1}`;
    if (!qMap[q]) qMap[q] = { quarter: q, Total: 0 };
    qMap[q].Total += r.amount;
    STREAMS.forEach(s => { if (r.stream === s) qMap[q][s] = (qMap[q][s]||0) + r.amount; });
  });
  const quarterlyData = Object.values(qMap).sort((a, b) => a.quarter.localeCompare(b.quarter));

  // By stream
  const byStream = STREAMS.map(s => ({
    name: s,
    value: records.filter(r => r.stream === s).reduce((a, r) => a + r.amount, 0),
    count: records.filter(r => r.stream === s).length,
  })).filter(s => s.value > 0).sort((a, b) => b.value - a.value);

  const chartData = view === "quarterly" ? quarterlyData : monthlyData;
  const xKey = view === "quarterly" ? "quarter" : "month";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <p style={{ fontWeight: 600, fontSize: 20, margin: 0, color: "#1F3864" }}>Analytics</p>
        <div style={{ display: "flex", gap: 6 }}>
          {["monthly","quarterly"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "6px 14px", fontSize: 12, borderRadius: 6, cursor: "pointer",
              background: view === v ? "#1F3864" : "#fff",
              color: view === v ? "#fff" : "#6b7280",
              border: `1px solid ${view === v ? "#1F3864" : "#d1d5db"}`,
              fontWeight: view === v ? 500 : 400, textTransform: "capitalize"
            }}>{v}</button>
          ))}
        </div>
      </div>

      {/* Stream share */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "1.25rem" }}>
          <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 1rem", color: "#1F3864" }}>Revenue share by stream</p>
          {byStream.map(s => (
            <div key={s.name} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: STREAM_COLORS[s.name], display: "inline-block" }} />
                  {s.name}
                </span>
                <span style={{ color: "#6b7280" }}>{((s.value/total)*100).toFixed(1)}% — {fmt(s.value)}</span>
              </div>
              <div style={{ height: 6, background: "#f3f4f6", borderRadius: 3 }}>
                <div style={{ height: 6, borderRadius: 3, background: STREAM_COLORS[s.name], width: `${(s.value/total*100).toFixed(1)}%`, transition: "width 0.4s" }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "1.25rem" }}>
          <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 0.75rem", color: "#1F3864" }}>Stream breakdown</p>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Stream","Amount","Records","% Share"].map(h => (
                  <th key={h} style={{ textAlign: h==="Amount"||h==="%Share"?"right":"left", padding: "6px 0", fontWeight: 500, color: "#9ca3af", borderBottom: "1px solid #f3f4f6" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byStream.map(s => (
                <tr key={s.name} style={{ borderBottom: "1px solid #f9fafb" }}>
                  <td style={{ padding: "8px 0" }}>{s.name}</td>
                  <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 500 }}>{fmt(s.value)}</td>
                  <td style={{ padding: "8px 0", textAlign: "right", color: "#6b7280" }}>{s.count}</td>
                  <td style={{ padding: "8px 0", textAlign: "right", color: "#6b7280" }}>{((s.value/total)*100).toFixed(1)}%</td>
                </tr>
              ))}
              <tr style={{ borderTop: "2px solid #e5e7eb", fontWeight: 600 }}>
                <td style={{ padding: "8px 0", color: "#1F3864" }}>Total</td>
                <td style={{ padding: "8px 0", textAlign: "right", color: "#1F3864" }}>{fmt(total)}</td>
                <td style={{ padding: "8px 0", textAlign: "right" }}>{records.length}</td>
                <td style={{ padding: "8px 0", textAlign: "right" }}>100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Stacked bar chart */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "1.25rem" }}>
        <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 1rem", color: "#1F3864" }}>Revenue trend — {view}</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={v => v>=1e6?`${(v/1e6).toFixed(1)}M`:`${(v/1e3).toFixed(0)}K`} tick={{ fontSize: 10 }} />
            <Tooltip formatter={v => fmt(v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {STREAMS.filter(s => byStream.find(b=>b.name===s)).map(s => (
              <Bar key={s} dataKey={s} stackId="a" fill={STREAM_COLORS[s]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div style={{ textAlign: "center", padding: "5rem", color: "#9ca3af" }}>
      <i className="ti ti-chart-bar" style={{ fontSize: 48, display: "block", marginBottom: 12 }} />
      <p>No data yet. Analytics will appear once revenue records are added.</p>
    </div>
  );
}
function Spinner() {
  return (
    <div style={{ display:"flex", justifyContent:"center", padding:"4rem" }}>
      <div style={{ width:36, height:36, border:"3px solid #e5e7eb", borderTopColor:"#1F3864", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
