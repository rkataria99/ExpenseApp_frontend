import React, { useState } from "react";
import ReportChart from "../components/ReportChart";

export default function ReportsPage() {
  const [period, setPeriod] = useState("weekly"); // default weekly

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Reports</h1>
          <div className="small">Visualize Income, Expenses, and Savings</div>
        </div>
        <div className="row">
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
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(12, 1fr)" }}>
        <div style={{ gridColumn: "span 12" }}>
          <ReportChart period={period} />
        </div>
      </div>
    </div>
  );
}
