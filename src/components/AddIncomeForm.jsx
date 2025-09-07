// frontend/src/components/AddIncomeForm.jsx
import React, { useState } from "react";
import { api } from "../api";

export default function AddIncomeForm({ onAdded }) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Salary");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => {
    // default to today in yyyy-mm-dd
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  const submit = async (e) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return;

    await api.post("/transactions", {
      type: "income",
      amount: amt,
      category,
      note,
      date, // send date field to backend
    });

    setAmount("");
    setNote("");
    setDate(new Date().toISOString().slice(0, 10)); // reset to today
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
