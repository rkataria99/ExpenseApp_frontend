import React from "react";
import WeeklyReport from "../components/WeeklyReport";

export default function ReportsPage() {
  return (
    <div className="container">
      <div className="header">
        <h1>Reports</h1>
        <div className="small">Weekly trends for Income, Expenses, and Savings</div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(12, 1fr)" }}>
        <div style={{ gridColumn: "span 12" }}>
          <WeeklyReport />
        </div>
      </div>
    </div>
  );
}
