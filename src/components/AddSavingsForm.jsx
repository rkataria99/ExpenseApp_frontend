// frontend/src/components/AddSavingsForm.jsx
import React, { useEffect, useState } from "react";
import { api } from "../api";

/* ---- Date helpers ---- */
// Local YYYY-MM-DD (good for inputs)
const todayLocal = () => new Date().toLocaleDateString("en-CA");
// Server/UTC YYYY-MM-DD (what hosted API validates against)
const todayUTC = () => new Date().toISOString().slice(0, 10);
// Never allow a date beyond the server's "today"
const clampToServerToday = (d) => (d > todayUTC() ? todayUTC() : d);

/* ---- Number helper ---- */
const num = (v) => {
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[, ]/g, ""));
  return Number.isFinite(n) ? n : undefined;
};

export default function AddSavingsForm({ onAdded }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  // Initialize with a server-safe "today"
  const [date, setDate] = useState(() => clampToServerToday(todayLocal()));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Keep date synced if the tab crosses midnight; clamp to server day
  useEffect(() => {
    const id = setInterval(() => {
      setDate((prev) => clampToServerToday(todayLocal()));
    }, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const amt = num(amount);
    if (!amt || amt <= 0) return;

    // Final server-safe date
    const finalDate = clampToServerToday(date);

    try {
      setBusy(true);
      await api.post("/transactions", {
        type: "savings",
        amount: amt,
        category: "Transfer",
        note: note?.trim() || undefined,
        date: finalDate, // always <= UTC "today"
      });

      // notify charts/widgets to refresh
      window.dispatchEvent(new CustomEvent("tx:changed"));

      // reset
      setAmount("");
      setNote("");
      setDate(clampToServerToday(todayLocal()));
      onAdded?.();
    } catch (ex) {
      const msg =
        ex?.response?.data?.message ||
        ex?.response?.data?.error ||
        ex?.message ||
        "Failed to move to savings.";
      setError(msg);
      // eslint-disable-next-line no-console
      console.error("Add savings failed:", ex?.response || ex);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card" onSubmit={submit} style={{ minWidth: 320 }}>
      <div className="label">Move to Savings</div>
      <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
        <input
          type="number"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        {/* max is server "today"; value is clamped to server "today" */}
        <input
          type="date"
          value={date}
          max={todayUTC()}
          onChange={(e) => {
            const next = e.target.value || todayLocal();
            setDate(clampToServerToday(next));
            if (error) setError("");
          }}
        />

        <input
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Moving..." : "⇢ Move"}
        </button>
      </div>

      {error && (
        <div className="small" style={{ color: "var(--bad)", marginTop: 6 }}>
          {error}
        </div>
      )}
    </form>
  );
}
