import React, { useMemo, useState } from "react";
import { api } from "../api";

const GROUPS = [
  { key: "home_share", label: "Direct home share" },
  { key: "self", label: "Self expense" },
  { key: "gifts_family", label: "Gifts & family dinners/outings" },
  { key: "trip_family", label: "Trips (family)" },
  { key: "trip_self", label: "Trips (self)" }
];

const CATEGORIES_BY_GROUP = {
  home_share: ["Direct home share", "Grocery"],
  self: ["Food", "Movies", "Party", "Transport", "Outings", "Other"],
  gifts_family: ["Gifts", "Family dinner", "Family outing"],
  trip_family: ["Travel", "Stay", "Food", "Shopping", "Entire Trip Cost", "Misc"],
  trip_self: ["Travel", "Stay", "Food", "Shopping", "Entire Trip Cost", "Misc"]
};

export default function AddExpenseForm({ onAdded }) {
  const [amount, setAmount] = useState("");
  const [categoryGroup, setCategoryGroup] = useState("home_share");
  const [category, setCategory] = useState(CATEGORIES_BY_GROUP["home_share"][0]);
  const [note, setNote] = useState("");

  const groupOptions = GROUPS;
  const categories = useMemo(() => CATEGORIES_BY_GROUP[categoryGroup] || [], [categoryGroup]);

  const submit = async (e) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return;

    await api.post("/transactions", {
      type: "expense",
      amount: amt,
      categoryGroup,
      category,
      note
    });
    setAmount("");
    setNote("");
    onAdded?.();
  };

  return (
    <form className="card" onSubmit={submit} style={{minWidth: 320}}>
      <div className="label">Add Expense</div>
      <div className="row">
        <input
          type="number"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={e=>setAmount(e.target.value)}
        />
        <select
          value={categoryGroup}
          onChange={e=>{
            const val = e.target.value;
            setCategoryGroup(val);
            const first = (CATEGORIES_BY_GROUP[val] || [])[0] || "";
            setCategory(first);
          }}
          title="Expense group"
        >
          {groupOptions.map(g => (
            <option key={g.key} value={g.key}>{g.label}</option>
          ))}
        </select>
        <select
          value={category}
          onChange={e=>setCategory(e.target.value)}
          title="Category"
        >
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <input
          placeholder="Note (optional)"
          value={note}
          onChange={e=>setNote(e.target.value)}
        />
        <button className="btn" type="submit">+ Add</button>
      </div>
    </form>
  );
}
