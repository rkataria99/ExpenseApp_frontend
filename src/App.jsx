// frontend/src/App.jsx
import React, { useEffect, useRef, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { api } from "./api";

import NavBar from "./components/NavBar";
import AddIncomeForm from "./components/AddIncomeForm";
import AddExpenseForm from "./components/AddExpenseForm";
import AddSavingsForm from "./components/AddSavingsForm";
import SummaryCards from "./components/SummaryCards";
import DataTable from "./components/DataTable";
import WeeklyReport from "./components/WeeklyReport";
import ReportsPage from "./pages/Reports";
import TransactionsPage from "./pages/Transactions";

const THEME_KEY = "theme"; // 'light' | 'dark' | 'system'

function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === "light") html.setAttribute("data-theme", "light");
  else if (theme === "dark") html.setAttribute("data-theme", "dark");
  else html.removeAttribute("data-theme"); // system (uses @media)
}

// Smooth scroll that compensates for sticky navbar height
function smoothScrollToEl(el) {
  if (!el) return;
  const nav = document.querySelector(".navbar");
  const offset = (nav?.offsetHeight || 0) + 8; // 8px breathing space
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: "smooth" });
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
      api.get("/transactions/totals"),
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

  // Handle jump from other routes (we pass state: {target})
  const location = useLocation();
  useEffect(() => {
    if (location.state?.target) {
      const t = location.state.target;
      const map = {
        income: incomeRef,
        expense: expenseRef,
        savings: savingsRef,
        transactions: tableRef,
      };
      const ref = map[t];
      // wait a tick for layout to be ready
      setTimeout(() => smoothScrollToEl(ref?.current), 0);
      // clear history state so back button doesn't re-scroll
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <>
      {/* Navbar on top */}
      <NavBar
        theme={theme}
        onToggleTheme={toggleTheme}
        onGoIncome={() => smoothScrollToEl(incomeRef.current)}
        onGoExpense={() => smoothScrollToEl(expenseRef.current)}
        onGoSavings={() => smoothScrollToEl(savingsRef.current)}
        onGoTransactions={() => smoothScrollToEl(tableRef.current)}
      />

      <div className="container">
        <div className="header" style={{ marginTop: 12 }}>
          <div>
            <h1>Expense • Income • Savings Tracker</h1>
            <div className="small">Quick actions in the navbar • Jump to sections</div>
          </div>
        </div>

        <SummaryCards totals={totals} onClear={clearAll} />

        {/* FORMS */}
        <div className="grid" style={{ marginTop: 16, gridTemplateColumns: "repeat(12,1fr)" }}>
          <div className="card" style={{ gridColumn: "span 12" }}>
            <div className="row">
              <div ref={incomeRef}>
                <AddIncomeForm onAdded={loadAll} />
              </div>
              <div ref={expenseRef}>
                <AddExpenseForm onAdded={loadAll} />
              </div>
              <div ref={savingsRef}>
                <AddSavingsForm onAdded={loadAll} />
              </div>
            </div>
          </div>
        </div>

        {/* TABLE + INLINE REPORT */}
        <div className="grid" style={{ marginTop: 16, gridTemplateColumns: "repeat(12,1fr)" }}>
          <div style={{ gridColumn: "span 7" }} ref={tableRef}>
            <DataTable rows={rows} onDelete={handleDelete} />
          </div>
          {/* 👇 FIX: remove stray brace here */}
          <div style={{ gridColumn: "span 5" }}>
            <WeeklyReport />
          </div>
        </div>
      </div>
    </>
  );
}

export default function App() {
  // Default theme = LIGHT; toggle order: Light -> Dark -> System -> Light
  const [theme, setTheme] = useState(() => "light");
  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === "light" ? "dark" : t === "dark" ? "system" : "light"));
  };

  return (
    <Routes>
      <Route path="/" element={<Home theme={theme} toggleTheme={toggleTheme} />} />
      <Route
        path="/reports"
        element={
          <>
            <NavBar theme={theme} onToggleTheme={toggleTheme} />
            <ReportsPage />
          </>
        }
      />
      <Route
        path="/transactions"
        element={
          <>
            <NavBar theme={theme} onToggleTheme={toggleTheme} />
            <TransactionsPage />
          </>
        }
      />
    </Routes>
  );
}
