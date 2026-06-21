import React, { useEffect, useState, useMemo } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

const STREAMS = ["OPD Fees","IPD Charges","Lab Services","Pharmacy","Maternity","Radiology","Other"];
const fmt = n => "KES " + Number(n).toLocaleString("en-KE");

export default function Reports() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selMonth, setSelMonth] = useState("");

  useEffect(() => {
    const q = query(collection(db, "revenue"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecords(data);
      setLoading(false);
      // default to most recent month
      if (data.length && !selMonth) {
        setSelMonth(data[0].date?.slice(0, 7) || "");
      }
    });
    return unsub;
  }, []);

  const months = useMemo(() => {
    const s = new Set(records.map(r => r.date?.slice(0, 7)).filter(Boolean));
    return [...s].sort().reverse();
  }, [records]);

  const monthRecs = useMemo(() =>
    records.filter(r => r.date?.startsWith(selMonth)),
  [records, selMonth]);

  const total   = monthRecs.reduce((s, r) => s + r.amount, 0);
  const byStream = STREAMS.map(s => ({
    stream: s,
    amount: monthRecs.filter(r => r.stream === s).reduce((a, r) => a + r.amount, 0),
    count:  monthRecs.filter(r => r.stream === s).length,
  }));
  const annualTotal = records.reduce((s, r) => s + r.amount, 0);

  const printReport = () => {
    const win = window.open("", "_blank");
    win.document.write(`
      <!DOCTYPE html><html><head>
      <title>Revenue Report — ${selMonth}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:2rem;font-size:13px;color:#111}
        h1{color:#1F3864;margin-bottom:4px}
        .sub{color:#6b7280;margin:0 0 2rem;font-size:12px}
        .kpi{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:2rem}
        .kpi-box{border:1px solid #e5e7eb;border-radius:8px;padding:1rem}
        .kpi-label{font-size:11px;color:#6b7280;margin:0 0 4px}
        .kpi-value{font-size:20px;font-weight:700;color:#1F3864;margin:0}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th{background:#1F3864;color:#fff;padding:8px 12px;text-align:left}
        td{padding:8px 12px;border-bottom:1px solid #f3f4f6}
        tfoot td{background:#f9fafb;font-weight:700;border-top:2px solid #e5e7eb}
        .footer{margin-top:3rem;font-size:11px;color:#9ca3af}
      </style></head><body>
      <h1>Revenue Collection Report</h1>
      <p class="sub">Lodwar County Referral Hospital — Period: ${selMonth} &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString("en-KE",{year:"numeric",month:"long",day:"numeric"})}</p>
      <div class="kpi">
        <div class="kpi-box"><p class="kpi-label">Period Revenue</p><p class="kpi-value">${fmt(total)}</p></div>
        <div class="kpi-box"><p class="kpi-label">Records</p><p class="kpi-value">${monthRecs.length}</p></div>
        <div class="kpi-box"><p class="kpi-label">YTD Total</p><p class="kpi-value">${fmt(annualTotal)}</p></div>
      </div>
      <table>
        <thead><tr><th>Revenue Stream</th><th>No. of Records</th><th>Amount (KES)</th><th>% Share</th></tr></thead>
        <tbody>
          ${byStream.filter(s=>s.count>0).map(s=>`<tr><td>${s.stream}</td><td>${s.count}</td><td>${s.amount.toLocaleString("en-KE")}</td><td>${((s.amount/total)*100).toFixed(1)}%</td></tr>`).join("")}
        </tbody>
        <tfoot><tr><td>TOTAL</td><td>${monthRecs.length}</td><td>${total.toLocaleString("en-KE")}</td><td>100%</td></tr></tfoot>
      </table>
      <p class="footer">Prepared by: LCRH Finance Department &nbsp;|&nbsp; This report is auto-generated from the LCRH Revenue Collection System</p>
      </body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <p style={{ fontWeight: 600, fontSize: 20, margin: "0 0 1.5rem", color: "#1F3864" }}>Reports</p>

      {records.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", color: "#9ca3af" }}>
          <i className="ti ti-file-off" style={{ fontSize: 48, display: "block", marginBottom: 12 }} />
          No records yet. Reports will appear once data has been entered.
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
            <select value={selMonth} onChange={e => setSelMonth(e.target.value)} style={{ minWidth: 160 }}>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button onClick={printReport} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "9px 18px",
              background: "#1F3864", color: "#fff", border: "none", borderRadius: 8,
              fontSize: 13, fontWeight: 500, cursor: "pointer"
            }}>
              <i className="ti ti-printer" style={{ fontSize: 16 }} /> Print / Save PDF
            </button>
          </div>

          {/* KPI row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Period revenue", value: fmt(total) },
              { label: "No. of records", value: monthRecs.length.toLocaleString() },
              { label: "YTD total revenue", value: fmt(annualTotal) },
            ].map(c => (
              <div key={c.label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "1rem 1.25rem" }}>
                <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>{c.label}</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: "#1F3864", margin: 0 }}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Report table */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f3f4f6" }}>
              <p style={{ fontWeight: 600, fontSize: 15, margin: "0 0 2px", color: "#1F3864" }}>Monthly Revenue Report — {selMonth}</p>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Lodwar County Referral Hospital · Finance Department</p>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#1F3864" }}>
                  {["Revenue Stream","Records","Amount (KES)","% Share"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: h==="Records"||h==="% Share"?"center":"left", color: "#fff", fontWeight: 500, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byStream.map((s, i) => (
                  <tr key={s.stream} style={{ borderBottom: "1px solid #f3f4f6", background: i%2 ? "#fafafa" : "#fff" }}>
                    <td style={{ padding: "11px 16px" }}>{s.stream}</td>
                    <td style={{ padding: "11px 16px", textAlign: "center", color: "#6b7280" }}>{s.count}</td>
                    <td style={{ padding: "11px 16px", fontWeight: s.amount > 0 ? 600 : 400, color: s.amount > 0 ? "#1F3864" : "#d1d5db" }}>
                      {s.count > 0 ? s.amount.toLocaleString("en-KE") : "—"}
                    </td>
                    <td style={{ padding: "11px 16px", textAlign: "center", color: "#6b7280" }}>
                      {total > 0 && s.count > 0 ? `${((s.amount/total)*100).toFixed(1)}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #e5e7eb", background: "#f0f4f9" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1F3864" }}>Total</td>
                  <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600 }}>{monthRecs.length}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, fontSize: 15, color: "#1F3864" }}>{total.toLocaleString("en-KE")}</td>
                  <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600 }}>100%</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Individual records for the month */}
          {monthRecs.length > 0 && (
            <div style={{ marginTop: 20, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #f3f4f6" }}>
                <p style={{ fontWeight: 500, fontSize: 14, margin: 0, color: "#1F3864" }}>Individual entries — {selMonth}</p>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#f9fafb" }}>
                      {["Date","Receipt","Stream","Description","Mode","Amount","Collector","Status"].map(h => (
                        <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 500, color: "#6b7280", fontSize: 11, borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {monthRecs.map((r, i) => (
                      <tr key={r.id} style={{ borderBottom: "1px solid #f9fafb", background: i%2?"#fafafa":"#fff" }}>
                        <td style={{ padding: "8px 12px" }}>{r.date}</td>
                        <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#6b7280" }}>{r.receipt}</td>
                        <td style={{ padding: "8px 12px" }}>{r.stream}</td>
                        <td style={{ padding: "8px 12px", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description}</td>
                        <td style={{ padding: "8px 12px", color: "#6b7280" }}>{r.paymentMode}</td>
                        <td style={{ padding: "8px 12px", fontWeight: 600 }}>{r.amount?.toLocaleString("en-KE")}</td>
                        <td style={{ padding: "8px 12px" }}>{r.collector}</td>
                        <td style={{ padding: "8px 12px" }}>{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
      <div style={{ width: 36, height: 36, border: "3px solid #e5e7eb", borderTopColor: "#1F3864", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
