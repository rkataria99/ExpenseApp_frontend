// frontend/src/components/Navbar.jsx
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../App"; // re-export useAuth from App.jsx (AuthCtx)

export default function NavBar({
  theme,
  onToggleTheme,
  onGoIncome,
  onGoExpense,
  onGoSavings,
  onGoTransactions,
  onLogout, // optional callback passed from App/Home
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth(); // current logged-in user (or null)
  const onHome = pathname === "/";

  // Click brand: go Home and scroll to top (no hard reload)
  const handleBrandClick = (e) => {
    e.preventDefault();
    if (!onHome) {
      navigate("/", { replace: true });
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
          {user && (
            <>
              {/* Quick actions */}
              <button className="nav-btn" onClick={() => goOrNav("income")}>+ Add Income</button>
              <button className="nav-btn" onClick={() => goOrNav("expense")}>+ Add Expense</button>
              <button className="nav-btn" onClick={() => goOrNav("savings")}>+ Add Savings</button>

              {/* All Transactions & Reports */}
              <Link className="nav-link" to="/transactions">
                <button className="nav-btn">All Transactions</button>
              </Link>
              <Link className="nav-link" to="/reports">
                <button className="nav-btn">Reports</button>
              </Link>
            </>
          )}

          {/* Auth controls */}
          {user ? (
            <>
              <span className="small" style={{ marginInline: 8 }}>
                Hi, {user.name || user.email}
              </span>
              <button className="nav-btn" onClick={onLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link className="nav-link" to="/login">
                <button className="nav-btn">Login</button>
              </Link>
              <Link className="nav-link" to="/register">
                <button className="nav-btn">Register</button>
              </Link>
            </>
          )}

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
