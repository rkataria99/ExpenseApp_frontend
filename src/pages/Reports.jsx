import React, { useEffect, useState } from "react";
import { api } from "../api";
import ReportChart from "../components/ReportChart";

export default function ReportsPage() {
  const nowYear = new Date().getFullYear();
  const [period, setPeriod] = useState("monthly");
  const [view, setView] = useState("incomeStack");
  const [years, setYears] = useState([nowYear]);
  const [year, setYear] = useState(nowYear);

  useEffect(() => {
    api.get("/reports/years").then((res) => {
      const ys = res.data?.years?.length ? res.data.years : [nowYear];
      setYears(ys);
      if (!ys.includes(year)) setYear(ys[ys.length - 1]); // default to latest
    });
  }, []);

  // if user switches period to monthly and current year is not set, pick latest
  useEffect(() => {
    if (period === "monthly" && !years.includes(year)) {
      setYear(years[years.length - 1] || nowYear);
    }
  }, [period, years, year]);

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
            <option value="monthly">Monthly (select year)</option>
            <option value="total">All-time (by month)</option>
          </select>

          {period === "monthly" && (
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="theme-select"
              title="Choose year"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}

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
          <ReportChart period={period} year={year} view={view} />
        </div>
      </div>
    </div>
  );
}
