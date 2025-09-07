import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function NavBar({
  theme,
  onToggleTheme,
  onGoIncome,
  onGoExpense,
  onGoSavings,
  onGoTransactions
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const onHome = pathname === "/";

  // Click brand: go Home and scroll to top (no hard reload)
  const handleBrandClick = (e) => {
    e.preventDefault();
    if (!onHome) {
      navigate("/", { replace: true });
      // wait for route paint then scroll
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // If not on Home, the quick buttons will navigate to Home and then jump
  const goOrNav = (target) => {
    if (onHome) {
      if (target === "income") onGoIncome?.();
      if (target === "expense") onGoExpense?.();
      if (target === "savings") onGoSavings?.();
      if (target === "transactions") onGoTransactions?.();
    } else {
      navigate("/", { state: { target }, replace: false });
      // Scroll will be handled by Home after navigation
    }
  };

  const themeLabel = theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System";
  const themeIcon = theme === "dark" ? "🌙" : theme === "light" ? "🌞" : "🖥️";

  return (
    <div className="navbar">
      <div className="nav-inner">
        <div className="brand">
          <div className="brand-badge" />
          <a href="/" className="nav-link" style={{ fontSize: 18 }} onClick={handleBrandClick}>
            ExpenseApp
          </a>
        </div>

        <div className="nav-actions">
          {/* Quick actions */}
          <button className="nav-btn" onClick={() => goOrNav("income")}>+ Add Income</button>
          <button className="nav-btn" onClick={() => goOrNav("expense")}>+ Add Expense</button>
          <button className="nav-btn" onClick={() => goOrNav("savings")}>+ Add Savings</button>

          {/* All Transactions page */}
          <Link className="nav-link" to="/transactions">
            <button className="nav-btn">All Transactions</button>
          </Link>

          {/* Reports page */}
          <Link className="nav-link" to="/reports">
            <button className="nav-btn">Reports</button>
          </Link>

          {/* Theme toggle pill */}
          <button className="toggle-pill" onClick={onToggleTheme} title="Toggle theme">
            <span role="img" aria-label="theme">{themeIcon}</span>
            {themeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
