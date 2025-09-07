import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function NavBar({
  theme,
  onToggleTheme,
  onGoIncome,
  onGoExpense,
  onGoSavings,
  onGoTransactions
}) {
  const { pathname } = useLocation();
  const onHome = pathname === "/";

  const themeLabel =
    theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System";

  return (
    <div className="navbar">
      <div className="nav-inner">
        <div className="brand">
          <div className="brand-badge" />
          <Link to="/" className="nav-link" style={{ fontSize: 18 }}>
            ExpenseApp
          </Link>
        </div>

        <div className="nav-actions">
          {/* Quick jump buttons only on Home route */}
          {onHome && (
            <>
              <button className="nav-btn" onClick={onGoIncome}>
                + Add Income
              </button>
              <button className="nav-btn" onClick={onGoExpense}>
                + Add Expense
              </button>
              <button className="nav-btn" onClick={onGoSavings}>
                + Add Savings
              </button>
              <button className="nav-btn" onClick={onGoTransactions}>
                All Transactions
              </button>
            </>
          )}

          {/* Reports route button */}
          {onHome ? (
            <Link className="nav-link" to="/reports">
              <button className="nav-btn">Reports</button>
            </Link>
          ) : (
            <Link className="nav-link" to="/">
              <button className="nav-btn">Home</button>
            </Link>
          )}

          {/* Theme toggle pill */}
          <button className="toggle-pill" onClick={onToggleTheme} title="Toggle theme">
            <span role="img" aria-label="theme">
              {theme === "dark" ? "🌙" : theme === "light" ? "🌞" : "🖥️"}
            </span>
            {themeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
