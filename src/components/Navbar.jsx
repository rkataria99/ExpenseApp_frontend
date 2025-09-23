// frontend/src/components/Navbar.jsx
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../App";

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

  // measure fixed navbar
  const navRef = useRef(null);
  const [navH, setNavH] = useState(64);
  useLayoutEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.getBoundingClientRect().height || 64;
      setNavH(h);
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

  const scrollToTargetById = (target) => {
    if (!target) return;
    const lookups = [
      `#${target}`,
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
    const offset = (navH || 0) + 8;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
    const focusable = el.querySelector("input, select, textarea, button");
    if (focusable) { try { focusable.focus({ preventScroll: true }); } catch {} }
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

  // --- dropdown state + close helpers
  const [open, setOpen] = useState(false);
  const ddRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!ddRef.current) return;
      if (!ddRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, []);

  // close dropdown on route change
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);

  // wrap all quick actions so the menu always closes
  const doAndClose = (fn) => () => {
    setOpen(false);
    fn?.();
  };
  const goOrNav = (target) => {
    // close immediately so it doesn't remain open on "/"
    setOpen(false);

    if (onHome) {
      if (target === "income") onGoIncome?.();
      if (target === "expense") onGoExpense?.();
      if (target === "savings") onGoSavings?.();
      if (target === "transactions") onGoTransactions?.();
      scrollToTargetById(target);
      const url = new URL(window.location.href);
      url.hash = `#${target}`;
      window.history.replaceState(null, "", url.toString());
    } else {
      navigate("/", { state: { target, from: "navbar", ts: Date.now() } });
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
                {/* inline buttons (hidden via CSS at breakpoints) */}
                <button className="nav-btn hide-at-tablet" onClick={() => goOrNav("income")}>+ Add Income</button>
                <button className="nav-btn hide-at-tablet" onClick={() => goOrNav("expense")}>+ Add Expense</button>
                <button className="nav-btn hide-at-tablet" onClick={() => goOrNav("savings")}>+ Add Savings</button>

                <Link className="nav-btn nav-link hide-at-425" to="/transactions">All Transactions</Link>
                <Link className="nav-btn nav-link hide-below-425" to="/reports">Reports</Link>

                {/* dropdown (tablet & smaller) */}
                <div className="qa-dropdown" ref={ddRef}>
                  <button
                    className="nav-btn qa-toggle"
                    aria-expanded={open ? "true" : "false"}
                    aria-haspopup="menu"
                    onClick={() => setOpen((v) => !v)}
                    onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
                  >
                    Quick actions ▾
                  </button>

                  {open && (
                    <div className="qa-menu" role="menu">
                      <button className="qa-item" role="menuitem" onClick={() => goOrNav("income")}>+ Add Income</button>
                      <button className="qa-item" role="menuitem" onClick={() => goOrNav("expense")}>+ Add Expense</button>
                      <button className="qa-item" role="menuitem" onClick={() => goOrNav("savings")}>+ Add Savings</button>

                      {/* Added at ≤425 via CSS */}
                      <Link className="qa-item dd-transactions" role="menuitem" to="/transactions" onClick={() => setOpen(false)}>
                        All Transactions
                      </Link>
                      {/* Added below 425 via CSS */}
                      <Link className="qa-item dd-reports" role="menuitem" to="/reports" onClick={() => setOpen(false)}>
                        Reports
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}

            {user ? (
              <>
                <span className="small" style={{ marginInline: 8 }}>Hi, {user.name || user.email}</span>
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

      <div className="nav-spacer" aria-hidden="true" style={{ height: navH }} />
    </>
  );
}
