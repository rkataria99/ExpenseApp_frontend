// frontend/src/components/AddExpenseForm.jsx
import React, { useMemo, useState, useEffect } from "react";
import { api } from "../api";

const GROUPS = [
  { key: "home_share", label: "Direct home share" },
  { key: "self", label: "Self expense" },
  { key: "gifts_family", label: "Gifts & family dinners/outings" },
  { key: "trip_family", label: "Trips (family)" },
  { key: "trip_self", label: "Trips (self)" },
];

const CATEGORIES_BY_GROUP = {
  home_share: ["Direct home share", "Grocery"],
  self: ["Food", "Movies", "Party", "Transport", "Outings", "Other"],
  gifts_family: ["Gifts", "Family dinner", "Family outing"],
  trip_family: ["Travel", "Stay", "Food", "Shopping", "Entire Trip Cost", "Misc"],
  trip_self: ["Travel", "Stay", "Food", "Shopping", "Entire Trip Cost", "Misc"],
};

// Local YYYY-MM-DD (avoids UTC previous-day issues)
const todayLocal = () => new Date().toLocaleDateString("en-CA");

// helpers to keep API happy on hosted env
const num = (v) => {
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[, ]/g, ""));
  return Number.isFinite(n) ? n : undefined;
};
const iso = (val) => {
  if (!val) return undefined;
  // Accept "YYYY-MM-DD" or "DD - MM - YYYY" / "DD-MM-YYYY"
  const s = String(val).trim();
  const m = s.replace(/\s+/g, "").match(/^(\d{2})-?(\d{2})-?(\d{4})$/);
  const ymd = m ? `${m[3]}-${m[2]}-${m[1]}` : s;
  const d = new Date(ymd);
  return Number.isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : undefined;
};
const stripUndef = (obj) => {
  const o = { ...obj };
  Object.keys(o).forEach((k) => o[k] === undefined && delete o[k]);
  return o;
};

export default function AddExpenseForm({ onAdded }) {
  const [amount, setAmount] = useState("");
  const [categoryGroup, setCategoryGroup] = useState("home_share");
  const [category, setCategory] = useState(CATEGORIES_BY_GROUP["home_share"][0]);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => todayLocal());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // keep date in sync if page is open overnight
  useEffect(() => {
    const id = setInterval(() => {
      const t = todayLocal();
      setDate((d) => (d !== t ? t : d));
    }, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const categories = useMemo(
    () => CATEGORIES_BY_GROUP[categoryGroup] || [],
    [categoryGroup]
  );

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const amt = num(amount);
    if (!amt || amt <= 0) return;

    // Block future dates client-side
    const today = todayLocal();
    const safeDate = iso(date);
    if (safeDate && safeDate > today) {
      setError("Future dates are not allowed.");
      return;
    }

    const groupLabel = GROUPS.find((g) => g.key === categoryGroup)?.label || categoryGroup;
    const base = {
      type: "expense",
      amount: amt,
      category,
      note: note?.trim() || undefined,
      date: safeDate || todayLocal(),
    };

    // Try hosted/local compatible shapes:
    const attempts = [
      stripUndef({ ...base, categoryGroup }),      // your current local API
      stripUndef({ ...base, group: categoryGroup }), // hosted API (older field name)
      stripUndef({ ...base, group: groupLabel }),    // hosted API expecting human label
    ];

    setBusy(true);
    let lastErr;
    for (const payload of attempts) {
      try {
        await api.post("/transactions", payload, {
          headers: { "Content-Type": "application/json" },
        });
        // notify charts/widgets to refresh
        window.dispatchEvent(new CustomEvent("tx:changed"));

        setAmount("");
        setNote("");
        setDate(todayLocal());
        setBusy(false);
        onAdded?.();
        return;
      } catch (ex) {
        lastErr = ex;
        // If not a 400, no point retrying shapes (auth/network/etc.)
        const status = ex?.response?.status;
        if (status && status !== 400) break;
      }
    }
    setBusy(false);

    const msg =
      lastErr?.response?.data?.message ||
      lastErr?.response?.data?.error ||
      lastErr?.message ||
      "Failed to add expense.";
    setError(msg);

    // Helpful console for hosted debugging
    // eslint-disable-next-line no-console
    console.error("Add expense failed:", {
      message: msg,
      status: lastErr?.response?.status,
      data: lastErr?.response?.data,
      attempts,
    });
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
            const first = (CATEGORIES_BY_GROUP[val] || [])[0] || "";
            setCategory(first);
          }}
          title="Expense group"
        >
          {GROUPS.map((g) => (
            <option key={g.key} value={g.key}>
              {g.label}
            </option>
          ))}
        </select>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          title="Category"
        >
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <input
          type="date"
          value={date}
          max={todayLocal()}
          onChange={(e) => {
            const next = e.target.value || todayLocal();
            const safe = (iso(next) || todayLocal()) > todayLocal() ? todayLocal() : next;
            setDate(safe);
            if (error) setError("");
          }}
        />

        <input
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Adding..." : "+ Add"}
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
