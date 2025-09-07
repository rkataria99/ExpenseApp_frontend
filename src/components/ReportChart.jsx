import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

export default function ReportChart({ period = "weekly" }) {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState(null);

  useEffect(() => {
    const url = `/reports/${period}`;
    api.get(url).then((res) => {
      const payload = res.data;
      // weekly => plain array; monthly/total => { period, data, [totals] }
      const nextRows = Array.isArray(payload) ? payload : (payload?.data || []);
      setRows(nextRows);
      setTotals(payload?.totals || null);
    });
  }, [period]);

  const { labels, series } = useMemo(() => {
    if (period === "weekly") {
      return {
        labels: rows.map((r) => (r?.day ? r.day.slice(5) : "")), // MM-DD
        series: {
          income: rows.map((r) => Number(r?.income ?? 0)),
          expense: rows.map((r) => Number(r?.expense ?? 0)),
          savings: rows.map((r) => Number(r?.savings ?? 0)),
        },
      };
    }
    // monthly or total: label YYYY-MM as MM/YY
    const toMMYY = (m = "") => (m.includes("-") ? `${m.slice(5, 7)}/${m.slice(2, 4)}` : m);
    return {
      labels: rows.map((r) => toMMYY(r?.month)),
      series: {
        income: rows.map((r) => Number(r?.income ?? 0)),
        expense: rows.map((r) => Number(r?.expense ?? 0)),
        savings: rows.map((r) => Number(r?.savings ?? 0)),
      },
    };
  }, [rows, period]);

  const chartData = {
    labels,
    datasets: [
      { label: "Income", data: series?.income || [] },
      { label: "Expense", data: series?.expense || [] },
      { label: "Savings", data: series?.savings || [] },
    ],
  };

  return (
    <div className="card">
      <div
        className="label"
        style={{ marginBottom: 8, display: "flex", justifyContent: "space-between" }}
      >
        <span>
          {period === "weekly"
            ? "Weekly (last 7 days)"
            : period === "monthly"
            ? "Monthly (last 12 months)"
            : "All-time (by month)"}
        </span>
        {period === "total" && totals && (
          <span className="small">
            All-time — Income: ₹{totals.income.toFixed(2)} • Expense: ₹{totals.expense.toFixed(2)} • Savings: ₹{totals.savings.toFixed(2)} • Balance: ₹{totals.balance.toFixed(2)}
          </span>
        )}
      </div>
      <Line
        data={chartData}
        options={{
          responsive: true,
          plugins: { legend: { position: "bottom" } },
          scales: { y: { beginAtZero: true } },
        }}
      />
    </div>
  );
}
