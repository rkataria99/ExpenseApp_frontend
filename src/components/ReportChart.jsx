// frontend/src/components/ReportChart.jsx
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
  ArcElement,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { Pie } from "react-chartjs-2";

ChartJS.register(
  BarElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
);

const COLORS = {
  income: "#457b9d", // line only
  expense: "#e76f51",
  savings: "#2a9d8f",
  remain: "#a8dadc",
};

function formatINR(n) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `₹${Math.round(Number(n) || 0)}`;
  }
}

/**
 * Props:
 *  - period: "weekly" | "monthly" | "total"
 *  - year?: number (when period === "monthly")
 *  - view: "incomeStack" | "line"
 */
export default function ReportChart({ period = "weekly", year, view = "incomeStack" }) {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState(null);

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const url =
      period === "monthly" && year
        ? `/reports/monthly?year=${year}&tz=${encodeURIComponent(tz)}`
        : `/reports/${period}?tz=${encodeURIComponent(tz)}`;

    let mounted = true;
    api.get(url).then((res) => {
      if (!mounted) return;
      const payload = res.data;
      const nextRows = Array.isArray(payload) ? payload : payload?.data || [];
      setRows(nextRows);
      setTotals(payload?.totals || null);
    });
    return () => {
      mounted = false;
    };
  }, [period, year]);

  const {
    labels,
    income,
    expense,
    savings,
    remain,
    overspendAny,
    futureMask,
    weekIncome,
    weekExpense,
    weekSavings,
    weekRemain,
  } = useMemo(() => {
    const build = (arr, getLabel, getIncome, getExpense, getSavings) => {
      const labels = arr.map(getLabel);
      const inc = arr.map(getIncome).map((x) => Math.max(Number(x) || 0, 0));
      const expRaw = arr.map(getExpense).map((x) => Math.max(Number(x) || 0, 0));
      const savRaw = arr.map(getSavings).map((x) => Math.max(Number(x) || 0, 0));

      const exp = expRaw.map((v, i) => Math.min(v, inc[i]));
      const sav = savRaw.map((v, i) => Math.min(v, Math.max(inc[i] - exp[i], 0)));
      const rem = inc.map((v, i) => Math.max(v - exp[i] - sav[i], 0));

      const overspendAny = expRaw.some((v, i) => v + savRaw[i] > inc[i]);
      return { labels, income: inc, expense: exp, savings: sav, remain: rem, overspendAny };
    };

    if (period === "weekly") {
      const weekdayName = (d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
      const out = build(
        rows,
        (r) => {
          const d = r?.day ? new Date(r.day + "T00:00:00") : null;
          return d ? weekdayName(d) : "";
        },
        (r) => r?.income ?? 0,
        (r) => r?.expense ?? 0,
        (r) => r?.savings ?? 0
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const mask = rows.map((r) => {
        if (!r?.day) return false;
        const d = new Date(r.day + "T00:00:00");
        d.setHours(0, 0, 0, 0);
        return d > today;
      });

      const totalIncome = out.income.reduce((a, b) => a + b, 0);
      const totalExpenseRaw = out.expense.reduce((a, b) => a + b, 0);
      const totalSavingsRaw = out.savings.reduce((a, b) => a + b, 0);
      const totalExpense = Math.min(totalExpenseRaw, totalIncome);
      const totalSavings = Math.min(totalSavingsRaw, Math.max(totalIncome - totalExpense, 0));
      const totalRemain = Math.max(totalIncome - totalExpense - totalSavings, 0);

      return {
        ...out,
        futureMask: mask,
        weekIncome: totalIncome,
        weekExpense: totalExpense,
        weekSavings: totalSavings,
        weekRemain: totalRemain,
      };
    }

    // monthly/total label building
    const monthName = (mIdx) =>
      ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][mIdx - 1] || "";

    const out = build(
      rows,
      (r) => {
        const mStr = r?.month || "";
        const m = Number((mStr.split("-")[1] || "").trim());
        return Number.isFinite(m) ? monthName(m) : mStr;
      },
      (r) => r?.income ?? 0,
      (r) => r?.expense ?? 0,
      (r) => r?.savings ?? 0
    );

    const mask = [];
    if (period === "monthly" && year) {
      const now = new Date();
      const cy = now.getFullYear();
      const cm = now.getMonth() + 1;
      if (year === cy) {
        for (let i = 0; i < rows.length; i++) {
          const mStr = rows[i]?.month || "";
          const m = Number((mStr.split("-")[1] || "").trim());
          mask[i] = Number.isFinite(m) && m > cm;
        }
      }
    }

    return { ...out, futureMask: mask, weekIncome: 0, weekExpense: 0, weekSavings: 0, weekRemain: 0 };
  }, [rows, period, year]);

  // ----- LINE (gap future days/months) -----
  const toGapped = (arr) => arr.map((v, i) => (futureMask[i] ? null : v));
  const lineData = {
    labels,
    datasets: [
      { label: "Income", data: toGapped(income), borderColor: COLORS.income, backgroundColor: COLORS.income, tension: 0.35, spanGaps: false },
      { label: "Expense", data: toGapped(expense), borderColor: COLORS.expense, backgroundColor: COLORS.expense, tension: 0.35, spanGaps: false },
      { label: "Savings", data: toGapped(savings), borderColor: COLORS.savings, backgroundColor: COLORS.savings, tension: 0.35, spanGaps: false },
    ],
  };

  const lineOpts = {
    responsive: true,
    plugins: { legend: { position: "bottom" }, tooltip: { mode: "index", intersect: false } },
    scales: { y: { beginAtZero: true, ticks: { callback: (v) => formatINR(v) } } },
  };

  // ----- WEEKLY PIE (replaces bar for weekly only) -----
  const weeklyPieData = {
    labels: ["Expense", "Savings", "Remaining"],
    datasets: [
      {
        data: [weekExpense, weekSavings, weekRemain],
        backgroundColor: [COLORS.expense, COLORS.savings, COLORS.remain],
        borderWidth: 0,
      },
    ],
  };
  const weeklyPieOpts = {
    plugins: {
      legend: { position: "bottom" },
      tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${formatINR(ctx.parsed || 0)}` } },
    },
  };

  // ----- INCOME-CONTAINED STACKED BAR (monthly) -----
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
          title: (items) => labels[items?.[0]?.dataIndex ?? 0] || "",
          label: (ctx) => `${ctx.dataset.label}: ${formatINR(Number(ctx.raw || 0))}`,
          footer: (items) => {
            const i = items?.[0]?.dataIndex ?? 0;
            return `Income: ${formatINR(income[i] || 0)}`;
          },
        },
      },
    },
    scales: {
      x: { stacked: true, min: 0, suggestedMax: maxIncome || undefined, ticks: { callback: (v) => formatINR(v) } },
      y: { stacked: true },
    },
  };

  // ===== ALL-TIME: SINGLE PIE (always) =====
  const allIncome =
    (totals && Number(totals.income)) || income.reduce((a, b) => a + b, 0);
  const allExpenseRaw =
    (totals && Number(totals.expense)) || expense.reduce((a, b) => a + b, 0);
  const allSavingsRaw =
    (totals && Number(totals.savings)) || savings.reduce((a, b) => a + b, 0);

  const allExpense = Math.min(allExpenseRaw, allIncome);
  const allSavings = Math.min(allSavingsRaw, Math.max(allIncome - allExpense, 0));
  const allRemain = Math.max(allIncome - allExpense - allSavings, 0);

  const totalPieData = {
    labels: ["Expense", "Savings", "Remaining"],
    datasets: [
      {
        data: [allExpense, allSavings, allRemain],
        backgroundColor: [COLORS.expense, COLORS.savings, COLORS.remain],
        borderWidth: 0,
      },
    ],
  };

  const totalPieOpts = {
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.label}: ${formatINR(ctx.parsed || 0)}`,
          footer: () => `Income: ${formatINR(allIncome)}`,
        },
      },
    },
  };

  const headerText =
    period === "weekly"
      ? "This Week (Mon–Sun)"
      : period === "monthly"
        ? `Monthly (${year || new Date().getFullYear()})`
        : "All-time (since first entry)";

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
        <span>{headerText}</span>

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

      {period === "weekly" ? (
        view === "line" ? (
          <Line data={lineData} options={lineOpts} />
        ) : (
          <div style={{ maxWidth: 520, marginInline: "auto" }}>
            <Pie data={weeklyPieData} options={weeklyPieOpts} />
          </div>
        )
      ) : period === "monthly" ? (
        view === "line" ? <Line data={lineData} options={lineOpts} /> : <Bar data={stackData} options={stackOpts} />
      ) : (
        // ALL-TIME: single income-contained bar (ignore view)
        <div style={{ maxWidth: 520, marginInline: "auto" }}>
          <Pie data={totalPieData} options={totalPieOpts} />
        </div>
      )}

      {period === "total" && totals && (
        <div className="small" style={{ marginTop: 8 }}>
          All-time — Income: ₹{Number(totals.income || 0).toFixed(2)} • Expense: ₹{Number(totals.expense || 0).toFixed(2)} •
          Savings: ₹{Number(totals.savings || 0).toFixed(2)} • Balance: ₹{Number(totals.balance || 0).toFixed(2)}
        </div>
      )}

      {view !== "line" && overspendAny && period === "monthly" && (
        <div className="small" style={{ marginTop: 8, color: "var(--bad)" }}>
          Note: In some periods, expenses + savings exceeded income. Bars are clipped to the income
          span; see exact amounts in the tooltip.
        </div>
      )}
    </div>
  );
}
