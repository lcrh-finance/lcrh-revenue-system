import React, { useEffect, useState, useMemo } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useAuth } from "../firebase/AuthContext";

const STREAMS = ["OPD Fees","IPD Charges","Lab Services","Pharmacy","Maternity","Radiology","Other"];
const STREAM_COLORS = {
  "OPD Fees":"#1F3864","IPD Charges":"#1D9E75","Lab Services":"#C9A84C",
  "Pharmacy":"#D85A30","Maternity":"#993556","Radiology":"#534AB7","Other":"#5F5E5A"
};
const fmt = n => "KES " + Number(n).toLocaleString("en-KE");
const STATUS_STYLE = {
  "Pending":  { bg:"#fef9c3", color:"#854d0e" },
  "Posted":   { bg:"#dcfce7", color:"#166534" },
  "Verified": { bg:"#dbeafe", color:"#1e40af" },
};

export default function Records() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState("");
  const [fStream, setFStream]   = useState("All");
  const [fStatus, setFStatus]   = useState("All");
  const [fMonth,  setFMonth]    = useState("All");
  const [sort,    setSort]      = useState({ key: "date", dir: "desc" });
  const [page,    setPage]      = useState(1);
  const PER = 20;

  useEffect(() => {
    const q = query(collection(db, "revenue"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, snap => {
      setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const months = useMemo(() => {
    const s = new Set(records.map(r => r.date?.slice(0, 7)));
    return [...s].sort().reverse();
  }, [records]);

  const filtered = useMemo(() => {
    let r = records.filter(rec => {
      const q = search.toLowerCase();
      return (
        (fStream === "All" || rec.stream === fStream) &&
        (fStatus === "All" || rec.status === fStatus) &&
        (fMonth  === "All" || rec.date?.startsWith(fMonth)) &&
        (!q || [rec.description, rec.receipt, rec.collector, rec.notes]
                .some(f => f?.toLowerCase().includes(q)))
      );
    });
    r.sort((a, b) => {
      let va = a[sort.key], vb = b[sort.key];
      if (typeof va === "string") return sort.dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      return sort.dir === "asc" ? va - vb : vb - va;
    });
    return r;
  }, [records, search, fStream, fStatus, fMonth, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER));
  const slice = filtered.slice((page - 1) * PER, page * PER);
  const total = filtered.reduce((s, r) => s + (r.amount || 0), 0);

  const toggleSort = k => setSort(s => s.key === k ? { ...s, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "asc" });

  const setStatus = async (id, status) => {
    await updateDoc(doc(db, "revenue", id), { status });
  };

  const deleteRecord = async (id) => {
    if (window.confirm("Delete this record? This cannot be undone.")) {
      await deleteDoc(doc(db, "revenue", id));
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <p style={{ fontWeight: 600, fontSize: 20, margin: "0 0 1.25rem", color: "#1F3864" }}>Records</p>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search description, receipt, collector…" style={{ flex: "1 1 200px", minWidth: 0 }} />
        <select value={fStream} onChange={e => { setFStream(e.target.value); setPage(1); }} style={{ minWidth: 130 }}>
          <option>All</option>{STREAMS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={fStatus} onChange={e => { setFStatus(e.target.value); setPage(1); }} style={{ minWidth: 110 }}>
          {["All","Pending","Posted","Verified"].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={fMonth} onChange={e => { setFMonth(e.target.value); setPage(1); }} style={{ minWidth: 130 }}>
          <option value="All">All months</option>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {records.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb" }}>
          <i className="ti ti-table-off" style={{ fontSize: 48, color: "#d1d5db", display: "block", marginBottom: 12 }} />
          <p style={{ color: "#6b7280" }}>No records yet. Use Revenue Entry to add the first record.</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #e5e7eb" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {[["date","Date"],["receipt","Receipt"],["stream","Stream"],["description","Description"],["amount","Amount"],["paymentMode","Mode"],["collector","Collector"],["status","Status"]].map(([k, l]) => (
                    <th key={k} onClick={() => toggleSort(k)} style={{
                      padding: "10px 12px", textAlign: "left", fontWeight: 500,
                      color: "#6b7280", fontSize: 11, cursor: "pointer",
                      whiteSpace: "nowrap", userSelect: "none",
                      borderBottom: "1px solid #e5e7eb"
                    }}>
                      {l} {sort.key === k ? (sort.dir === "asc" ? "↑" : "↓") : ""}
                    </th>
                  ))}
                  {isAdmin && <th style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb" }} />}
                </tr>
              </thead>
              <tbody>
                {slice.map((r, i) => {
                  const ss = STATUS_STYLE[r.status] || STATUS_STYLE["Pending"];
                  return (
                    <tr key={r.id} style={{ borderBottom: "1px solid #f9fafb", background: i % 2 ? "#fafafa" : "#fff" }}>
                      <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>{r.date}</td>
                      <td style={{ padding: "9px 12px", fontFamily: "monospace", fontSize: 11, color: "#6b7280" }}>{r.receipt}</td>
                      <td style={{ padding: "9px 12px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <span style={{ width: 7, height: 7, borderRadius: 2, background: STREAM_COLORS[r.stream], display: "inline-block" }} />
                          {r.stream}
                        </span>
                      </td>
                      <td style={{ padding: "9px 12px", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description}</td>
                      <td style={{ padding: "9px 12px", fontWeight: 600, whiteSpace: "nowrap", color: "#1F3864" }}>{fmt(r.amount)}</td>
                      <td style={{ padding: "9px 12px", color: "#6b7280" }}>{r.paymentMode}</td>
                      <td style={{ padding: "9px 12px" }}>{r.collector}</td>
                      <td style={{ padding: "9px 12px" }}>
                        {isAdmin ? (
                          <select value={r.status} onChange={e => setStatus(r.id, e.target.value)}
                            style={{ fontSize: 11, padding: "3px 6px", borderRadius: 20, background: ss.bg, color: ss.color, border: "none", cursor: "pointer", fontWeight: 500 }}>
                            {["Pending","Posted","Verified"].map(s => <option key={s}>{s}</option>)}
                          </select>
                        ) : (
                          <span style={{ background: ss.bg, color: ss.color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 500 }}>{r.status}</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td style={{ padding: "9px 12px" }}>
                          <button onClick={() => deleteRecord(r.id)}
                            style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 16, padding: 2 }} title="Delete record">
                            <i className="ti ti-trash" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #e5e7eb", background: "#f9fafb" }}>
                  <td colSpan={4} style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>
                    {filtered.length} records shown
                  </td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, fontSize: 14, color: "#1F3864" }}>{fmt(total)}</td>
                  <td colSpan={isAdmin ? 4 : 3} />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>Page {page} of {pages}</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: "6px 14px", fontSize: 12, borderRadius: 6, cursor: "pointer", border: "1px solid #e5e7eb" }}>← Prev</button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                style={{ padding: "6px 14px", fontSize: 12, borderRadius: 6, cursor: "pointer", border: "1px solid #e5e7eb" }}>Next →</button>
            </div>
          </div>
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
