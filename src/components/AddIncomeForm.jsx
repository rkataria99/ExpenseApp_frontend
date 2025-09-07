import React, { useState } from "react";
import { api } from "../api";

export default function AddIncomeForm({ onAdded }) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Salary");
  const [note, setNote] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    await api.post("/transactions", { type: "income", amount: amt, category, note });
    setAmount(""); setNote("");
    onAdded?.();
  };

  return (
    <form className="card" onSubmit={submit} style={{minWidth: 320}}>
      <div className="label">Add Income</div>
      <div className="row">
        <input type="number" step="0.01" placeholder="Amount"
               value={amount} onChange={e=>setAmount(e.target.value)} />
        <select value={category} onChange={e=>setCategory(e.target.value)}>
          <option>Salary</option><option>Freelance</option><option>Bonus</option>
          <option>Other</option>
        </select>
        <input placeholder="Note (optional)" value={note} onChange={e=>setNote(e.target.value)} />
        <button className="btn" type="submit">+ Add</button>
      </div>
    </form>
  );
}
