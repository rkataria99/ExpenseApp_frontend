// frontend/src/components/AddExpenseForm.jsx
import React, { useMemo, useState, useEffect } from "react";
import { api } from "../api";

const GROUPS = [
  { key: "home_share", label: "Direct home share/family" },
  { key: "self", label: "Self expense" },
  { key: "gifts_family", label: "Gifts & family dinners/outings" },
  { key: "trip_family", label: "Trips (family)" },
  { key: "trip_self", label: "Trips (self)" }
];

const CATEGORIES_BY_GROUP = {
  home_share: ["Direct home share", "Grocery","Family Exp", "Misc"],
  self: ["Food", "Movies", "Party", "Transport", "Outings", "Other"],
  gifts_family: ["Gifts", "Family dinner", "Family outing"],
  trip_family: ["Travel", "Stay", "Food", "Shopping", "Entire Trip Cost", "Misc"],
  trip_self: ["Travel", "Stay", "Food", "Shopping", "Entire Trip Cost", "Misc"]
};

// Local YYYY-MM-DD
const todayLocal = () => new Date().toLocaleDateString("en-CA");
// UTC YYYY-MM-DD (what the hosted server cares about)
const todayUTC = () => new Date().toISOString().slice(0, 10);
// Clamp any picked date so it never exceeds server "today"
const clampToServerToday = (d) => (d > todayUTC() ? todayUTC() : d);

export default function AddExpenseForm({ onAdded }) {
  const [amount, setAmount] = useState("");
  const [categoryGroup, setCategoryGroup] = useState("home_share");
  const [category, setCategory] = useState(CATEGORIES_BY_GROUP["home_share"][0]);
  const [note, setNote] = useState("");

  // 👇 initialize with a server-safe "today"
  const [date, setDate] = useState(() => clampToServerToday(todayLocal()));
  const [error, setError] = useState("");

  // Keep "today" fresh; also keep it server-safe
  useEffect(() => {
    const id = setInterval(() => {
      setDate((prev) => clampToServerToday(todayLocal()));
    }, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const groupOptions = GROUPS;
  const categories = useMemo(
    () => CATEGORIES_BY_GROUP[categoryGroup] || [],
    [categoryGroup]
  );

  const submit = async (e) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return;

    // Final server-safe date (prevents 400 on hosted API)
    const finalDate = clampToServerToday(date);

    try {
      await api.post("/transactions", {
        type: "expense",
        amount: amt,
        categoryGroup,
        category,
        note: note || undefined,
        date: finalDate,
      });

      window.dispatchEvent(new CustomEvent("tx:changed"));

      setAmount("");
      setNote("");
      setError("");
      setDate(clampToServerToday(todayLocal()));
      onAdded?.();
    } catch (ex) {
      const msg =
        ex?.response?.data?.message ||
        ex?.response?.data?.error ||
        ex?.message ||
        "Failed to add expense.";
      setError(msg);
      console.error("Add expense failed:", ex?.response || ex);
    }
  };

  return (
    <form className="card" onSubmit={submit} style={{ minWidth: 320 }}>
      <div className="label">Add Expense</div>
      <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
        <input
          type="number"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <select
          value={categoryGroup}
          onChange={(e) => {
            const val = e.target.value;
            setCategoryGroup(val);
            setCategory((CATEGORIES_BY_GROUP[val] || [])[0] || "");
          }}
          title="Expense group"
        >
          {groupOptions.map((g) => (
            <option key={g.key} value={g.key}>{g.label}</option>
          ))}
        </select>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          title="Category"
        >
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>

        {/* 🔒 max is server "today"; value is always clamped to server "today" */}
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

        <button className="btn" type="submit">+ Add</button>
      </div>

      {error && (
        <div className="small" style={{ color: "var(--bad)", marginTop: 6 }}>
          {error}
        </div>
      )}
    </form>
  );
}
