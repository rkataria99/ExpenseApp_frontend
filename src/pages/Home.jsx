// frontend/src/pages/Home.jsx
import React from "react";
import SummaryCards from "../components/SummaryCards";
import WeeklyReport from "../components/WeeklyReport"; // <-- add

export default function Home({ totals, onClear }) {
  // A stable “tick” that changes whenever totals change
  const refreshKey = JSON.stringify(totals || {});

  return (
    <div className="container">
      <div className="header">
        <h1>Manage Your Money Efficiently</h1>
        <div className="small">Welcome to ExpenseApp</div>
      </div>

      <SummaryCards totals={totals} onClear={onClear} />

      <div className="grid" style={{ marginTop: 16, gridTemplateColumns: "repeat(12,1fr)" }}>
        <div className="card" style={{ gridColumn: "span 7" }}>
          <div className="small">
            Use the navbar to add income/expenses/savings or view transactions & reports.
          </div>
        </div>

        {/* Weekly chart on the right; auto-refreshes when totals change */}
        <div style={{ gridColumn: "span 5" }}>
          <WeeklyReport refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
}
