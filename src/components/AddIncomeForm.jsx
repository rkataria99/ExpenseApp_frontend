// frontend/src/components/AddIncomeForm.jsx
import React, { useEffect, useState } from "react";
import { api } from "../api";

const todayLocal = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local TZ

export default function AddIncomeForm({ onAdded }) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Salary");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => todayLocal());

  // Keep date in sync if the tab stays open across midnight
  useEffect(() => {
    const id = setInterval(() => {
      const t = todayLocal();
      setDate((d) => (d !== t ? t : d));
    }, 60 * 1000); // check once a minute
    return () => clearInterval(id);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return;

    await api.post("/transactions", {
      type: "income",
      amount: amt,
      category,
      note,
      date, // local YYYY-MM-DD sent to backend
    });

    // notify charts/widgets to refresh
    window.dispatchEvent(new CustomEvent("tx:changed"));

    setAmount("");
    setNote("");
    setDate(todayLocal()); // reset to today's local date
    onAdded?.();
  };

  return (
    <form className="card" onSubmit={submit} style={{ minWidth: 320 }}>
      <div className="label">Add Income</div>
      <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
        <input
          type="number"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>Salary</option>
          <option>Freelance</option>
          <option>Bonus</option>
          <option>Other</option>
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <input
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button className="btn" type="submit">
          + Add
        </button>
      </div>
    </form>
  );
}
