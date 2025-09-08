import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import ReportChart from "../components/ReportChart";

export default function ReportsPage() {
  const nowYear = new Date().getFullYear();
  const [period, setPeriod] = useState("monthly");   // 'weekly' | 'monthly' | 'total'
  const [view, setView] = useState("incomeStack");   // UI choice for monthly/weekly
  const [years, setYears] = useState([nowYear]);
  const [year, setYear] = useState(nowYear);

  useEffect(() => {
    api.get("/reports/years").then((res) => {
      const ys = res.data?.years?.length ? res.data.years : [nowYear];
      setYears(ys);
      if (!ys.includes(year)) setYear(ys[ys.length - 1]);
    });
  }, []);

  // Ensure a valid year when switching to monthly
  useEffect(() => {
    if (period === "monthly" && !years.includes(year)) {
      setYear(years[years.length - 1] || nowYear);
    }
  }, [period, years, year]);

  // Coerce view if switching periods (e.g., from weekly->monthly keep Bar as default)
  useEffect(() => {
    if (period === "monthly" && view === "incomePie") setView("incomeStack");
    if (period === "weekly" && view === "incomeStack") setView("incomeStack"); // allowed; label will read Pie
  }, [period]); // runs only when period changes

  // What the chart should actually render
  const resolvedView = useMemo(() => {
    if (period === "weekly") {
      return view === "line" ? "line" : "incomePie";
    }
    if (period === "monthly") {
      return view === "line" ? "line" : "incomeStack";
    }
    // total/all-time – your ReportChart can ignore view or treat as pie
    return "incomePie";
  }, [period, view]);

  // Label first option per period
  const incomeContainedLabel =
    period === "monthly" ? "Bar (income-contained)" : "Pie (income-contained)";

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
            <option value="total">All-time (since first entry)</option>
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

          {/* Just 1 dropdown for All-time */}
          {period !== "total" && (
            <select
              value={view}
              onChange={(e) => setView(e.target.value)}
              className="theme-select"
              title="Choose chart style"
            >
              {/* Keep the same value key; label changes with period */}
              <option value="incomeStack">{incomeContainedLabel}</option>
              <option value="line">Line</option>
            </select>
          )}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(12, 1fr)" }}>
        <div style={{ gridColumn: "span 12" }}>
          <ReportChart period={period} year={year} view={resolvedView} />
        </div>
      </div>
    </div>
  );
}
