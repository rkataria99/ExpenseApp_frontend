import React from "react";
import SummaryCards from "../components/SummaryCards";

export default function Home({ totals, onClear }) {
  return (
    <div className="container">
      <div className="header">
        <h1>Manage Your Money Efficiently</h1>
        <div className="small">Welcome to ExpenseApp</div>
      </div>

      <SummaryCards totals={totals} onClear={onClear} />

      <div className="card" style={{ marginTop: 16 }}>
        <div className="small">
          Use the navbar to add income/expenses/savings or view transactions & reports.
        </div>
      </div>
    </div>
  );
}
