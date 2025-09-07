import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

export default function WeeklyReport() {
  const [data, setData] = useState([]);

  useEffect(() => {
    load();
    async function load() {
      const res = await api.get("/reports/weekly");
      setData(res.data || []);
    }
  }, []);

  const labels = data.map(d => d.day.slice(5)); // MM-DD
  const income = data.map(d => d.income);
  const expense = data.map(d => d.expense);
  const savings = data.map(d => d.savings);

  const chartData = {
    labels,
    datasets: [
      { label: "Income", data: income },
      { label: "Expense", data: expense },
      { label: "Savings", data: savings }
    ]
  };

  return (
    <div className="card">
      <div className="label">Weekly Report (Last 7 days)</div>
      <Line data={chartData} options={{
        responsive: true,
        plugins: { legend: { position: "bottom" } },
        scales: { y: { beginAtZero: true } }
      }}/>
    </div>
  );
}
