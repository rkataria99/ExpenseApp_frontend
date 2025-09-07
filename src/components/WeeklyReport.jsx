// frontend/src/components/WeeklyReport.jsx
import React, { useEffect, useState, useMemo } from "react";
import { api } from "../api";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

const COLORS = {
  income: "#457b9d",
  expense: "#e76f51",
  savings: "#2a9d8f",
};

export default function WeeklyReport() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; // get local timezone
    api.get(`/reports/weekly?tz=${encodeURIComponent(tz)}`).then((res) => {
      setRows(res.data || []);
    });
  }, []);

  const { labels, income, expense, savings } = useMemo(() => {
    const weekday = (iso) => {
      const d = new Date(iso + "T00:00:00");
      return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const labels = rows.map((r) => (r?.day ? weekday(r.day) : ""));
    const maskFuture = (val, iso) => {
      const d = new Date((iso || "") + "T00:00:00");
      d.setHours(0, 0, 0, 0);
      return d > today ? null : Number(val || 0);
    };

    return {
      labels,
      income: rows.map((r) => maskFuture(r?.income, r?.day)),
      expense: rows.map((r) => maskFuture(r?.expense, r?.day)),
      savings: rows.map((r) => maskFuture(r?.savings, r?.day)),
    };
  }, [rows]);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Income",
        data: income,
        borderColor: COLORS.income,
        backgroundColor: COLORS.income,
        tension: 0.35,
        spanGaps: false,
      },
      {
        label: "Expense",
        data: expense,
        borderColor: COLORS.expense,
        backgroundColor: COLORS.expense,
        tension: 0.35,
        spanGaps: false,
      },
      {
        label: "Savings",
        data: savings,
        borderColor: COLORS.savings,
        backgroundColor: COLORS.savings,
        tension: 0.35,
        spanGaps: false,
      },
    ],
  };

  return (
    <div className="card">
      <div className="label">Weekly Report (This Week, Mon–Sun)</div>
      <Line
        data={chartData}
        options={{
          responsive: true,
          plugins: {
            legend: { position: "bottom" },
            tooltip: { mode: "index", intersect: false },
          },
          scales: {
            y: { beginAtZero: true },
          },
        }}
      />
    </div>
  );
}
