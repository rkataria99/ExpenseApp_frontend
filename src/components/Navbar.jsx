import React from "react";
import { Link, NavLink } from "react-router-dom";

export default function Navbar({ theme, onToggleTheme }) {
  const label = theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System";
  const icon = theme === "dark" ? "🌙" : "🌞";

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="brand">
          <div className="brand-badge" />
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            ExpenseApp
          </Link>
        </div>

        <div className="nav-links">
          <NavLink to="/add-income" className="nav-btn">+ Add Income</NavLink>
          <NavLink to="/add-expense" className="nav-btn">+ Add Expense</NavLink>
          <NavLink to="/add-savings" className="nav-btn">⇢ Add Savings</NavLink>
          <NavLink to="/transactions" className="nav-btn">All Transactions</NavLink>
          <NavLink to="/report" className="nav-btn purple">Report</NavLink>
        </div>

        <div className="nav-spacer" />

        <button className="theme-toggle" onClick={onToggleTheme} title="Toggle light/dark/system">
          <span>{icon}</span>
          <span>{label}</span>
        </button>
      </div>
    </nav>
  );
}
