import React, { useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../App"; // re-export useAuth from App.jsx (AuthCtx)

export default function NavBar({
  theme,
  onToggleTheme,
  onGoIncome,
  onGoExpense,
  onGoSavings,
  onGoTransactions,
  onLogout,
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const onHome = pathname === "/";

  // --- Fixed navbar: measure height so we can offset scroll precisely ---
  const navRef = useRef(null);
  const [navH, setNavH] = useState(64);
  useLayoutEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.getBoundingClientRect().height || 64;
      setNavH(h);
      // expose to CSS if you decide to use scroll-margin in CSS
      document.documentElement.style.setProperty("--nav-h", `${h}px`);
    };
    measure();

    let ro;
    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    } else {
      window.addEventListener("resize", measure);
    }
    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", measure);
    };
  }, []);

  // Robust on-page scroll that ignores hash quirks and offsets the fixed navbar
  const scrollToTargetById = (target) => {
    if (!target) return;
    const lookups = [
      `#${target}`,             // e.g. #income
      `#${target}-form`,
      `#${target}Form`,
      `#${target}-section`,
      `[data-form="${target}"]`,
      `[data-target="${target}"]`,
      `.${target}-form`,
    ];
    let el = null;
    for (const sel of lookups) {
      el = document.querySelector(sel);
      if (el) break;
    }
    if (!el) return;

    // Compute top – offset by current navbar height (+ a little breathing room)
    const offset = (navH || 0) + 8;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;

    // Scroll smoothly
    window.scrollTo({ top, behavior: "smooth" });

    // Optional: focus first input to make it obvious
    const focusable = el.querySelector("input, select, textarea, button");
    if (focusable) {
      try { focusable.focus({ preventScroll: true }); } catch {}
    }
  };

  const handleBrandClick = (e) => {
    e.preventDefault();
    if (!onHome) {
      navigate("/", { replace: true });
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goOrNav = (target) => {
    if (onHome) {
      // Keep your original callbacks (if they perform extra logic)
      if (target === "income") onGoIncome?.();
      if (target === "expense") onGoExpense?.();
      if (target === "savings") onGoSavings?.();
      if (target === "transactions") onGoTransactions?.();

      // Force a visible scroll right now (works even if hash didn't change)
      scrollToTargetById(target);

      // Refresh the hash so deep-links still look right
      const url = new URL(window.location.href);
      url.hash = `#${target}`;
      window.history.replaceState(null, "", url.toString());
    } else {
      // Navigate to Home and pass intent; Home will also handle it
      navigate("/", { state: { target, from: "navbar", ts: Date.now() } });
      // Set the hash after the route change so anchor links work too
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.hash = `#${target}`;
        window.history.replaceState(null, "", url.toString());
      }, 0);
    }
  };

  const themeLabel = theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System";
  const themeIcon = theme === "dark" ? "🌙" : theme === "light" ? "🌞" : "🖥️";

  return (
    <>
      {/* Fixed navbar */}
      <div className="navbar" ref={navRef}>
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
                <button className="nav-btn" onClick={() => goOrNav("income")}>+ Add Income</button>
                <button className="nav-btn" onClick={() => goOrNav("expense")}>+ Add Expense</button>
                <button className="nav-btn" onClick={() => goOrNav("savings")}>+ Add Savings</button>

                <Link className="nav-btn nav-link" to="/transactions">All Transactions</Link>
                <Link className="nav-btn nav-link" to="/reports">Reports</Link>
              </>
            )}

            {user ? (
              <>
                <span className="small" style={{ marginInline: 8 }}>
                  Hi, {user.name || user.email}
                </span>
                <button className="nav-btn" onClick={onLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link className="nav-btn nav-link" to="/login">Login</Link>
                <Link className="nav-btn nav-link" to="/register">Register</Link>
              </>
            )}

            <button className="toggle-pill" onClick={onToggleTheme} title="Toggle theme">
              <span role="img" aria-label="theme">{themeIcon}</span>
              {themeLabel}
            </button>
          </div>
        </div>
      </div>

      {/* Spacer exactly matching navbar height (prevents overlap) */}
      <div className="nav-spacer" aria-hidden="true" style={{ height: navH }} />
    </>
  );
}
