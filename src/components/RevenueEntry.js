import React, { useState } from "react";
import { db } from "../firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../firebase/AuthContext";

const STREAMS = ["OPD Fees","IPD Charges","Lab Services","Pharmacy","Maternity","Radiology","Other"];

const label  = { fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 5 };
const inp    = { width: "100%", boxSizing: "border-box" };

function today() {
  return new Date().toISOString().slice(0, 10);
}

function genReceipt() {
  const ts = Date.now().toString().slice(-6);
  return `RCP-${ts}`;
}

export default function RevenueEntry() {
  const { user, profile } = useAuth();
  const [form, setForm] = useState({
    date: today(), stream: "OPD Fees", description: "",
    amount: "", collector: profile?.name || "", receipt: genReceipt(),
    paymentMode: "Cash", notes: ""
  });
  const [busy,  setBusy]  = useState(false);
  const [saved, setSaved] = useState(false);
  const [err,   setErr]   = useState("");

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.date || !form.amount || !form.description || !form.collector) {
      setErr("Please fill in all required fields."); return;
    }
    setErr(""); setBusy(true);
    try {
      await addDoc(collection(db, "revenue"), {
        date:        form.date,
        stream:      form.stream,
        description: form.description.trim(),
        amount:      parseFloat(form.amount),
        collector:   form.collector.trim(),
        receipt:     form.receipt.trim() || genReceipt(),
        paymentMode: form.paymentMode,
        notes:       form.notes.trim(),
        status:      "Pending",
        createdBy:   user.uid,
        createdByEmail: user.email,
        createdAt:   serverTimestamp(),
      });
      setSaved(true);
      setForm(f => ({ ...f, description: "", amount: "", notes: "", receipt: genReceipt() }));
      setTimeout(() => setSaved(false), 4000);
    } catch (ex) {
      setErr("Failed to save. Check your connection and try again.");
      console.error(ex);
    } finally { setBusy(false); }
  };

  return (
    <div style={{ maxWidth: 620 }}>
      <p style={{ fontWeight: 600, fontSize: 20, margin: "0 0 1.5rem", color: "#1F3864" }}>Revenue entry</p>

      {saved && (
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "12px 16px", marginBottom: 18, fontSize: 13, color: "#166534", display: "flex", alignItems: "center", gap: 8 }}>
          <i className="ti ti-circle-check" style={{ fontSize: 18 }} /> Record saved to database successfully.
        </div>
      )}
      {err && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 18, fontSize: 13, color: "#dc2626" }}>{err}</div>
      )}

      <form onSubmit={submit} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "1.75rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          <div>
            <label style={label}>Date <span style={{ color: "#dc2626" }}>*</span></label>
            <input type="date" style={inp} value={form.date} onChange={set("date")} required />
          </div>

          <div>
            <label style={label}>Revenue stream <span style={{ color: "#dc2626" }}>*</span></label>
            <select style={inp} value={form.stream} onChange={set("stream")}>
              {STREAMS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ gridColumn: "1/-1" }}>
            <label style={label}>Description <span style={{ color: "#dc2626" }}>*</span></label>
            <input style={inp} value={form.description} onChange={set("description")}
              placeholder="e.g. OPD collection — morning shift, Ward 2" required />
          </div>

          <div>
            <label style={label}>Amount (KES) <span style={{ color: "#dc2626" }}>*</span></label>
            <input type="number" min="0" step="0.01" style={inp} value={form.amount}
              onChange={set("amount")} placeholder="0.00" required />
          </div>

          <div>
            <label style={label}>Payment mode</label>
            <select style={inp} value={form.paymentMode} onChange={set("paymentMode")}>
              {["Cash","M-PESA","Bank Transfer","Cheque","NHIF","Insurance","Other"].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label style={label}>Receipt / voucher no.</label>
            <input style={inp} value={form.receipt} onChange={set("receipt")} placeholder="RCP-000001" />
          </div>

          <div>
            <label style={label}>Collector / cashier <span style={{ color: "#dc2626" }}>*</span></label>
            <input style={inp} value={form.collector} onChange={set("collector")} placeholder="Full name" required />
          </div>

          <div style={{ gridColumn: "1/-1" }}>
            <label style={label}>Notes (optional)</label>
            <textarea style={{ ...inp, resize: "vertical", minHeight: 72, padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontFamily: "Inter,sans-serif", fontSize: 14 }}
              value={form.notes} onChange={set("notes")} placeholder="Any additional remarks…" />
          </div>
        </div>

        <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
          <button type="submit" disabled={busy} style={{
            background: busy ? "#93a3c0" : "#1F3864", color: "#fff", border: "none",
            borderRadius: 8, padding: "11px 28px", fontWeight: 600, fontSize: 14, cursor: busy ? "not-allowed" : "pointer"
          }}>
            {busy ? "Saving…" : "Save record"}
          </button>
          <button type="button" onClick={() => setForm(f => ({ ...f, description: "", amount: "", notes: "", receipt: genReceipt() }))}
            style={{ background: "transparent", border: "1px solid #d1d5db", borderRadius: 8, padding: "11px 20px", fontSize: 14, color: "#6b7280", cursor: "pointer" }}>
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
