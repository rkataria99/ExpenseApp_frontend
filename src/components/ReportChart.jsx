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
import { Bar, Line, Pie } from "react-chartjs-2";

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
  // meta from backend monthlyReport: { carry:{income,expense,savings}, latestMonth }
  const [meta, setMeta] = useState({ carry: { income: 0, expense: 0, savings: 0 }, latestMonth: 12 });

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
      if (payload?.carry || payload?.latestMonth) {
        setMeta({
          carry: payload.carry || { income: 0, expense: 0, savings: 0 },
          latestMonth: payload.latestMonth || 12,
        });
      } else {
        setMeta({ carry: { income: 0, expense: 0, savings: 0 }, latestMonth: 12 });
      }
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

    // raw monthly series for cumulative logic
    incomeRaw,
    expenseRaw,
    savingsRaw,

    // cumulative (carry-forward) series for monthly
    cumIncome,
    cumExpense,
    cumSavings,
    cumRemain,
  } = useMemo(() => {
    const cumulative = (arr, base = 0) => {
      let sum = Number(base || 0);
      return arr.map((v) => (sum += Number(v || 0)));
    };

    const build = (arr, getLabel, getIncome, getExpense, getSavings) => {
      const labels = arr.map(getLabel);
      const incRaw = arr.map(getIncome).map((x) => Math.max(Number(x) || 0, 0));
      const expRaw = arr.map(getExpense).map((x) => Math.max(Number(x) || 0, 0));
      const savRaw = arr.map(getSavings).map((x) => Math.max(Number(x) || 0, 0));

      // Per-period (non-cumulative) contained view
      const exp = expRaw.map((v, i) => Math.min(v, incRaw[i]));
      const sav = savRaw.map((v, i) => Math.min(v, Math.max(incRaw[i] - exp[i], 0)));
      const rem = incRaw.map((v, i) => Math.max(v - exp[i] - sav[i], 0));

      const overspendAny = expRaw.some((v, i) => v + savRaw[i] > incRaw[i]);
      return {
        labels,
        income: incRaw,
        expense: exp,
        savings: sav,
        remain: rem,
        overspendAny,
        incomeRaw: incRaw,
        expenseRaw: expRaw,
        savingsRaw: savRaw,
      };
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

      const today = new Date(); today.setHours(0, 0, 0, 0);
      const mask = rows.map((r) => {
        if (!r?.day) return false;
        const d = new Date(r.day + "T00:00:00");
        d.setHours(0, 0, 0, 0);
        return d > today;
      });

      const totalIncome = out.income.reduce((a, b) => a + b, 0);
      const totalExpenseRaw = out.expenseRaw.reduce((a, b) => a + b, 0);
      const totalSavingsRaw = out.savingsRaw.reduce((a, b) => a + b, 0);
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
        cumIncome: null,
        cumExpense: null,
        cumSavings: null,
        cumRemain: null,
      };
    }

    // ---- MONTHLY / TOTAL ----
    const monthName = (mIdx) =>
      ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][mIdx - 1] || "";
    const getMonthIndex = (mStr) => Number((mStr.split("-")[1] || "").trim());

    const out = build(
      rows,
      (r) => {
        const mStr = r?.month || "";
        const m = getMonthIndex(mStr);
        return Number.isFinite(m) ? monthName(m) : mStr;
      },
      (r) => r?.income ?? 0,
      (r) => r?.expense ?? 0,
      (r) => r?.savings ?? 0
    );

    // mask future months for current year so line chart can gap them
    const mask = [];
    if (period === "monthly" && year) {
      const latest = Number(meta.latestMonth || 12);
      for (let i = 0; i < rows.length; i++) {
        const m = getMonthIndex(rows[i]?.month || "");
        mask[i] = Number.isFinite(m) && m > latest;
      }
    }

    // --- CUMULATIVE (carry-forward) for monthly ---
    let cumIncome = null, cumExpense = null, cumSavings = null, cumRemain = null;

    if (period === "monthly") {
      const base = meta?.carry || { income: 0, expense: 0, savings: 0 };

      const cInc = cumulative(out.incomeRaw, base.income);
      const cExpRaw = cumulative(out.expenseRaw, base.expense);
      const cSavRaw = cumulative(out.savingsRaw, base.savings);

      const cExp = cExpRaw.map((v, i) => Math.min(v, cInc[i]));
      const cSav = cSavRaw.map((v, i) => Math.min(v, Math.max(cInc[i] - cExp[i], 0)));
      const cRem = cInc.map((v, i) => Math.max(v - cExp[i] - cSav[i], 0));

      // zero out future months in stacks (line will be gapped below)
      const latest = Number(meta.latestMonth || 12);
      for (let i = 0; i < rows.length; i++) {
        const m = getMonthIndex(rows[i]?.month || "");
        if (Number.isFinite(m) && m > latest) {
          cExp[i] = 0; cSav[i] = 0; cRem[i] = 0;
        }
      }

      cumIncome = cInc;
      cumExpense = cExp;
      cumSavings = cSav;
      cumRemain = cRem;
    }

    return {
      ...out,
      futureMask: mask,
      weekIncome: 0,
      weekExpense: 0,
      weekSavings: 0,
      weekRemain: 0,
      incomeRaw: out.incomeRaw,
      expenseRaw: out.expenseRaw,
      savingsRaw: out.savingsRaw,
      cumIncome,
      cumExpense,
      cumSavings,
      cumRemain,
    };
  }, [rows, period, year, meta]);

  // ----- LINE (gap future days/months) -----
  const toGapped = (arr) => arr.map((v, i) => (futureMask?.[i] ? null : v));

  // For MONTHLY, use cumulative (carry-forward) lines; otherwise per-period
  const lineIncomeSeries = period === "monthly" && Array.isArray(cumIncome) ? cumIncome : income;
  const lineExpenseSeries = period === "monthly" && Array.isArray(cumExpense) ? cumExpense : expense;
  const lineSavingsSeries = period === "monthly" && Array.isArray(cumSavings) ? cumSavings : savings;

  const lineData = {
    labels,
    datasets: [
      { label: "Income", data: toGapped(lineIncomeSeries), borderColor: COLORS.income, backgroundColor: COLORS.income, tension: 0.35, spanGaps: false },
      { label: "Expense", data: toGapped(lineExpenseSeries), borderColor: COLORS.expense, backgroundColor: COLORS.expense, tension: 0.35, spanGaps: false },
      { label: "Savings", data: toGapped(lineSavingsSeries), borderColor: COLORS.savings, backgroundColor: COLORS.savings, tension: 0.35, spanGaps: false },
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

  // ----- INCOME-CONTAINED STACKED BAR -----
  // For MONTHLY we show CUMULATIVE stacks (carry-forward); others unchanged.
  const stackData =
    period === "monthly" && Array.isArray(cumRemain)
      ? {
          labels,
          datasets: [
            { label: "Expense", data: cumExpense, backgroundColor: COLORS.expense, stack: "stack" },
            { label: "Savings", data: cumSavings, backgroundColor: COLORS.savings, stack: "stack" },
            { label: "Remaining", data: cumRemain, backgroundColor: COLORS.remain, stack: "stack" },
          ],
        }
      : {
          labels,
          datasets: [
            { label: "Expense", data: expense, backgroundColor: COLORS.expense, stack: "stack" },
            { label: "Savings", data: savings, backgroundColor: COLORS.savings, stack: "stack" },
            { label: "Remaining", data: remain, backgroundColor: COLORS.remain, stack: "stack" },
          ],
        };

  const maxIncome =
    period === "monthly" && Array.isArray(cumIncome)
      ? Math.max(0, ...cumIncome)
      : Math.max(0, ...income);

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
            const base = period === "monthly" && Array.isArray(cumIncome) ? cumIncome : income;
            return `Income: ${formatINR(base[i] || 0)}`;
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
    (totals && Number(totals.income)) || (Array.isArray(income) ? income.reduce((a, b) => a + b, 0) : 0);
  const allExpenseRaw =
    (totals && Number(totals.expense)) || (Array.isArray(expense) ? expense.reduce((a, b) => a + b, 0) : 0);
  const allSavingsRaw =
    (totals && Number(totals.savings)) || (Array.isArray(savings) ? savings.reduce((a, b) => a + b, 0) : 0);

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
        view === "line" ? (
          <Line data={lineData} options={lineOpts} />
        ) : (
          <Bar data={stackData} options={stackOpts} />
        )
      ) : (
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
