// frontend/src/App.jsx
import React, { useEffect, useRef, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { api } from "./api";

import NavBar from "./components/NavBar";
import AddIncomeForm from "./components/AddIncomeForm";
import AddExpenseForm from "./components/AddExpenseForm";
import AddSavingsForm from "./components/AddSavingsForm";
import SummaryCards from "./components/SummaryCards";
import DataTable from "./components/DataTable";
import WeeklyReport from "./components/WeeklyReport";
import ReportsPage from "./pages/Reports";

const THEME_KEY = "theme"; // 'light' | 'dark' | 'system'

function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === "light") html.setAttribute("data-theme", "light");
  else if (theme === "dark") html.setAttribute("data-theme", "dark");
  else html.removeAttribute("data-theme"); // system (uses @media)
}

function Home({ theme, toggleTheme }) {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({});

  // section refs for smooth scroll
  const incomeRef = useRef(null);
  const expenseRef = useRef(null);
  const savingsRef = useRef(null);
  const tableRef = useRef(null);

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

  const scrollTo = (ref) =>
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      {/* ✅ Navbar at the very top */}
      <NavBar
        theme={theme}
        onToggleTheme={toggleTheme}
        onGoIncome={() => scrollTo(incomeRef)}
        onGoExpense={() => scrollTo(expenseRef)}
        onGoSavings={() => scrollTo(savingsRef)}
        onGoTransactions={() => scrollTo(tableRef)}
      />

      <div className="container">
        <div className="header" style={{ marginTop: 12 }}>
          <div>
            <h1>Expense • Income • Savings Tracker</h1>
            <div className="small">Quick actions in the navbar • Jump to sections</div>
          </div>
        </div>

        <SummaryCards totals={totals} onClear={clearAll} />

        {/* Forms */}
        <div className="grid" style={{ marginTop: 16, gridTemplateColumns: "repeat(12,1fr)" }}>
          <div className="card" style={{ gridColumn: "span 12" }}>
            <div className="row">
              <div ref={incomeRef}><AddIncomeForm onAdded={loadAll} /></div>
              <div ref={expenseRef}><AddExpenseForm onAdded={loadAll} /></div>
              <div ref={savingsRef}><AddSavingsForm onAdded={loadAll} /></div>
            </div>
          </div>
        </div>

        {/* Table + Inline Report */}
        <div className="grid" style={{ marginTop: 16, gridTemplateColumns: "repeat(12,1fr)" }}>
          <div style={{ gridColumn: "span 7" }} ref={tableRef}>
            <DataTable rows={rows} onDelete={handleDelete} />
          </div>
          <div style={{ gridColumn: "span 5" }}>
            <WeeklyReport />
          </div>
        </div>
      </div>
    </>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "system");
  useEffect(() => { applyTheme(theme); localStorage.setItem(THEME_KEY, theme); }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === "system" ? "light" : t === "light" ? "dark" : "system"));
  };

  return (
    <Routes>
      <Route path="/" element={<Home theme={theme} toggleTheme={toggleTheme} />} />
      <Route
        path="/reports"
        element={
          <>
            {/* Simple navbar on reports page */}
            <div className="navbar">
              <div className="nav-inner">
                <div className="brand">
                  <div className="brand-badge" />
                  <Link to="/" className="nav-link" style={{ fontSize: 18 }}>ExpenseApp</Link>
                </div>
                <div className="nav-actions">
                  <Link className="nav-link" to="/"><button className="nav-btn">Home</button></Link>
                  <button className="toggle-pill" onClick={toggleTheme} title="Toggle theme">
                    <span role="img" aria-label="theme">
                      {theme === "dark" ? "🌙" : theme === "light" ? "🌞" : "🖥️"}
                    </span>
                    {theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System"}
                  </button>
                </div>
              </div>
            </div>

            <ReportsPage />
          </>
        }
      />
    </Routes>
  );
}
