import React, { useState } from "react";
import ReportChart from "../components/ReportChart";

export default function ReportsPage() {
  const [period, setPeriod] = useState("monthly");
  const [view, setView]   = useState("incomeStack"); // default to contained stack

  return (
    <div className="container">
      <div className="header" style={{ alignItems: "center" }}>
        <div>
          <h1>Reports</h1>
          <div className="small">Visualize Income, Expenses, and Savings</div>
        </div>

        <div className="row" style={{ gap: 8 }}>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="theme-select"
            title="Choose report range"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly (last 12 months)</option>
            <option value="total">All-time (by month)</option>
          </select>

          <select
            value={view}
            onChange={(e) => setView(e.target.value)}
            className="theme-select"
            title="Choose chart style"
          >
            <option value="incomeStack">Bar (income-contained)</option>
            <option value="line">Line</option>
          </select>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(12, 1fr)" }}>
        <div style={{ gridColumn: "span 12" }}>
          <ReportChart period={period} view={view} />
        </div>
      </div>
    </div>
  );
}
