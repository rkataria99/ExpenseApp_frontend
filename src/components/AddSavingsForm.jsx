import React, { useState } from "react";
import { api } from "../api";

export default function AddSavingsForm({ onAdded }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    await api.post("/transactions", { type: "savings", amount: amt, category: "Transfer", note });
    setAmount(""); setNote("");
    onAdded?.();
  };

  return (
    <form className="card" onSubmit={submit} style={{minWidth: 320}}>
      <div className="label">Move to Savings</div>
      <div className="row">
        <input type="number" step="0.01" placeholder="Amount"
               value={amount} onChange={e=>setAmount(e.target.value)} />
        <input placeholder="Note (optional)" value={note} onChange={e=>setNote(e.target.value)} />
        <button className="btn" type="submit">⇢ Move</button>
      </div>
    </form>
  );
}
