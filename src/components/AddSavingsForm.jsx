// frontend/src/components/AddSavingsForm.jsx
import React, { useEffect, useState } from "react";
import { api } from "../api";

const todayLocal = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD (local)

export default function AddSavingsForm({ onAdded }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => todayLocal());
  const [error, setError] = useState("");

  // Keep date synced if the tab crosses midnight
  useEffect(() => {
    const id = setInterval(() => {
      const t = todayLocal();
      setDate((d) => (d !== t ? t : d));
    }, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return;

    // Disallow future-dated savings
    const today = todayLocal();
    if (date > today) {
      setError("Future dates are not allowed.");
      return;
    }

    await api.post("/transactions", {
      type: "savings",
      amount: amt,
      category: "Transfer",
      note,
      date, // <-- associate savings with a specific date
    });

    // notify charts/widgets to refresh
    window.dispatchEvent(new CustomEvent("tx:changed"));

    setAmount("");
    setNote("");
    setDate(todayLocal());
    setError("");
    onAdded?.();
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
        <input
          type="date"
          value={date}
          max={todayLocal()} // block picking a future date
          onChange={(e) => {
            const next = e.target.value || todayLocal();
            const safe = next > todayLocal() ? todayLocal() : next;
            setDate(safe);
            if (error) setError("");
          }}
        />
        <input
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button className="btn" type="submit">⇢ Move</button>
      </div>

      {error && (
        <div className="small" style={{ color: "var(--bad)", marginTop: 6 }}>
          {error}
        </div>
      )}
    </form>
  );
}
