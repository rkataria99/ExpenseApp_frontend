import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { api } from "./api";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import AddIncomePage from "./pages/AddIncomePage";
import AddExpensePage from "./pages/AddExpensePage";
import AddSavingsPage from "./pages/AddSavingsPage";
import TransactionsPage from "./pages/TransactionsPage";
import ReportPage from "./pages/ReportPage";

const THEME_KEY = "theme"; // 'light' | 'dark' | 'system'

function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === "light") html.setAttribute("data-theme", "light");
  else if (theme === "dark") html.setAttribute("data-theme", "dark");
  else html.removeAttribute("data-theme"); // system (media query)
}

export default function App() {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({});
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "system");

  useEffect(() => { applyTheme(theme); localStorage.setItem(THEME_KEY, theme); }, [theme]);

  const nextTheme = (t) => (t === "system" ? "light" : t === "light" ? "dark" : "system");
  const handleToggleTheme = () => setTheme((t) => nextTheme(t));

  const loadAll = async () => {
    const [txRes, tRes] = await Promise.all([
      api.get("/transactions"),
      api.get("/transactions/totals")
    ]);
    setRows(txRes.data || []);
    setTotals(tRes.data || {});
  };

  useEffect(() => { loadAll(); }, []);

  const handleDelete = async (id) => {
    await api.delete(`/transactions/${id}`);
    loadAll();
  };

  const clearAll = async () => {
    if (!confirm("Delete ALL transactions?")) return;
    await api.delete("/transactions");
    loadAll();
  };

  const onAdded = () => loadAll();

  return (
    <BrowserRouter>
      <Navbar theme={theme} onToggleTheme={handleToggleTheme} />

      <Routes>
        <Route path="/" element={<Home totals={totals} onClear={clearAll} />} />
        <Route path="/add-income" element={<AddIncomePage onAdded={onAdded} />} />
        <Route path="/add-expense" element={<AddExpensePage onAdded={onAdded} />} />
        <Route path="/add-savings" element={<AddSavingsPage onAdded={onAdded} />} />
        <Route path="/transactions" element={<TransactionsPage rows={rows} onDelete={handleDelete} />} />
        <Route path="/report" element={<ReportPage />} />
      </Routes>
    </BrowserRouter>
  );
}
