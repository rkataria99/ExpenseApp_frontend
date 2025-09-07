import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import {
  Chart as ChartJS,
  BarElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  BarElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

const COLORS = {
  income:  "#457b9d", // for line view
  expense: "#e76f51",
  savings: "#2a9d8f",
  remain:  "#a8dadc", // remaining balance (income - expense - savings)
};

function formatINR(n) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `₹${Math.round(n)}`;
  }
}

/**
 * view:
 *  - "line"        : same as before
 *  - "incomeStack" : each bar width == Income; inside: Expense, Savings, Remaining
 */
export default function ReportChart({ period = "weekly", view = "incomeStack" }) {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState(null);

  useEffect(() => {
    const url = `/reports/${period}`;
    api.get(url).then((res) => {
      const payload = res.data;
      const nextRows = Array.isArray(payload) ? payload : payload?.data || [];
      setRows(nextRows);
      setTotals(payload?.totals || null);
    });
  }, [period]);

  // Build common arrays
  const { labels, income, expense, savings, remain, overspendAny } = useMemo(() => {
    const build = (arr, getLabel, getIncome, getExpense, getSavings) => {
      const labels = arr.map(getLabel);
      const inc = arr.map(getIncome).map((x) => Math.max(Number(x) || 0, 0));
      const expRaw = arr.map(getExpense).map((x) => Math.max(Number(x) || 0, 0));
      const savRaw = arr.map(getSavings).map((x) => Math.max(Number(x) || 0, 0));

      // Clip expense & savings so they never exceed income; compute remaining
      const exp = expRaw.map((v, i) => Math.min(v, inc[i]));
      const sav = savRaw.map((v, i) => Math.min(v, Math.max(inc[i] - exp[i], 0)));
      const rem = inc.map((v, i) => Math.max(v - exp[i] - sav[i], 0));

      // overspend flag (when expense+savings > income)
      const overspendAny = expRaw.some((v, i) => v + savRaw[i] > inc[i]);

      return { labels, income: inc, expense: exp, savings: sav, remain: rem, overspendAny };
    };

    if (period === "weekly") {
      return build(
        rows,
        (r) => (r?.day ? r.day.slice(5) : ""), // MM-DD
        (r) => r?.income ?? 0,
        (r) => r?.expense ?? 0,
        (r) => r?.savings ?? 0
      );
    } else {
      const toMMYY = (m = "") => (m.includes("-") ? `${m.slice(5, 7)}/${m.slice(2, 4)}` : m);
      return build(
        rows,
        (r) => toMMYY(r?.month),
        (r) => r?.income ?? 0,
        (r) => r?.expense ?? 0,
        (r) => r?.savings ?? 0
      );
    }
  }, [rows, period]);

  // ----- LINE (unchanged, distinct colors) -----
  const lineData = {
    labels,
    datasets: [
      { label: "Income",  data: income,  borderColor: COLORS.income,  backgroundColor: COLORS.income,  tension: 0.35 },
      { label: "Expense", data: expense, borderColor: COLORS.expense, backgroundColor: COLORS.expense, tension: 0.35 },
      { label: "Savings", data: savings, borderColor: COLORS.savings, backgroundColor: COLORS.savings, tension: 0.35 },
    ],
  };
  const lineOpts = {
    responsive: true,
    plugins: { legend: { position: "bottom" }, tooltip: { mode: "index", intersect: false } },
    scales: { y: { beginAtZero: true, ticks: { callback: (v) => formatINR(v) } } },
  };

  // ----- INCOME-CONTAINED STACK -----
  // Each y-category’s total width equals Income for that period.
  const stackData = {
    labels,
    datasets: [
      { label: "Expense", data: expense, backgroundColor: COLORS.expense, stack: "stack" },
      { label: "Savings", data: savings, backgroundColor: COLORS.savings, stack: "stack" },
      { label: "Remaining", data: remain, backgroundColor: COLORS.remain, stack: "stack" },
    ],
  };
  const maxIncome = Math.max(0, ...income);
  const stackOpts = {
    indexAxis: "y",
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          title: (items) => labels[items[0].dataIndex] || "",
          label: (ctx) => `${ctx.dataset.label}: ${formatINR(ctx.raw ?? 0)}`,
          footer: (items) => {
            const i = items[0]?.dataIndex ?? 0;
            return `Income: ${formatINR(income[i])}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        min: 0,
        suggestedMax: maxIncome || undefined,
        ticks: { callback: (v) => formatINR(v) },
      },
      y: { stacked: true },
    },
  };

  return (
    <div className="card">
      <div
        className="label"
        style={{
          marginBottom: 8,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <span>
          {period === "weekly"
            ? "Weekly (last 7 days)"
            : period === "monthly"
            ? "Monthly (last 12 months)"
            : "All-time (by month)"}
        </span>

        <span className="small" style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS.expense }} />
            Expense
          </span>
          <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS.savings }} />
            Savings
          </span>
          <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS.remain }} />
            Remaining
          </span>
        </span>
      </div>

      {view === "line" ? (
        <Line data={lineData} options={lineOpts} />
      ) : (
        <Bar data={stackData} options={stackOpts} />
      )}

      {period === "total" && totals && (
        <div className="small" style={{ marginTop: 8 }}>
          All-time — Income: ₹{totals.income.toFixed(2)} • Expense: ₹{totals.expense.toFixed(2)} •
          Savings: ₹{totals.savings.toFixed(2)} • Balance: ₹{totals.balance.toFixed(2)}
        </div>
      )}

      {view !== "line" && overspendAny && (
        <div className="small" style={{ marginTop: 8, color: "var(--bad)" }}>
          Note: In some periods, expenses+savings exceeded income. Bars are clipped to income span
          for clarity; see exact amounts in the tooltip.
        </div>
      )}
    </div>
  );
}
