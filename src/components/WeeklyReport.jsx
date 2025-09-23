// frontend/src/components/WeeklyReport.jsx
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, LinearScale, CategoryScale, Tooltip, Legend);

const COLORS = {
  expense: "#e76f51",
  savings: "#2a9d8f",
  remain:  "#a8dadc",
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

export default function WeeklyReport() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const fetchData = () =>
      api.get(`/reports/weekly?tz=${encodeURIComponent(tz)}`).then((res) => {
        setRows(res.data || []);
      });

    fetchData(); // initial

    const onTxChanged = () => fetchData();
    window.addEventListener("tx:changed", onTxChanged);

    const onVisible = () => {
      if (document.visibilityState === "visible") fetchData();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("tx:changed", onTxChanged);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Collapse week into a single stacked bar (same containment rules as your weekly pie)
  const { weekIncome, weekExpense, weekSavings, weekRemain } = useMemo(() => {
    const incRaw = rows.map((r) => Math.max(Number(r?.income || 0), 0));
    const expRaw = rows.map((r) => Math.max(Number(r?.expense || 0), 0));
    const savRaw = rows.map((r) => Math.max(Number(r?.savings || 0), 0));

    const totalIncome = incRaw.reduce((a, b) => a + b, 0);
    const totalExpenseRaw = expRaw.reduce((a, b) => a + b, 0);
    const totalSavingsRaw = savRaw.reduce((a, b) => a + b, 0);

    const totalExpense = Math.min(totalExpenseRaw, totalIncome);
    const totalSavings = Math.min(totalSavingsRaw, Math.max(totalIncome - totalExpense, 0));
    const totalRemain  = Math.max(totalIncome - totalExpense - totalSavings, 0);

    return {
      weekIncome: totalIncome,
      weekExpense: totalExpense,
      weekSavings: totalSavings,
      weekRemain: totalRemain,
    };
  }, [rows]);

  const data = {
    labels: ["This Week"],
    datasets: [
      { label: "Expense",   data: [weekExpense], backgroundColor: COLORS.expense, stack: "stack" },
      { label: "Savings",   data: [weekSavings], backgroundColor: COLORS.savings, stack: "stack" },
      { label: "Remaining", data: [weekRemain],  backgroundColor: COLORS.remain,  stack: "stack" },
    ],
  };

  const options = {
    indexAxis: "y", // horizontal stacked bar (same vibe as monthly bar)
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          title: () => "This Week",
          label: (ctx) => `${ctx.dataset.label}: ${formatINR(Number(ctx.raw || 0))}`,
          footer: () => `Income: ${formatINR(weekIncome)}`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        min: 0,
        suggestedMax: weekIncome || undefined,
        ticks: { callback: (v) => formatINR(v) },
      },
      y: { stacked: true },
    },
  };

  return (
    <div className="card">
      <div className="label">Weekly Report (This Week, Mon–Sun)</div>
      <Bar data={data} options={options} />
    </div>
  );
}
