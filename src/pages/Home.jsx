// frontend/src/pages/Home.jsx
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SummaryCards from "../components/SummaryCards";
import WeeklyReport from "../components/WeeklyReport";

export default function Home({ totals, onClear }) {
  const refreshKey = JSON.stringify(totals || {});
  const location = useLocation();
  const navigate = useNavigate();

  // Utility: find a form section by several likely selectors
  const findTargetElement = (target) => {
    if (!target) return null;
    const selectors = [
      `#${target}-form`,
      `#${target}Form`,
      `#${target}-section`,
      `#${target}`,
      `[data-form="${target}"]`,
      `[data-target="${target}"]`,
      `.${target}-form`
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  };

  const scrollFocus = (el) => {
    if (!el) return;
    try {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      // Try to focus first input to make UX obvious
      const focusable = el.querySelector("input, select, textarea, button");
      if (focusable) focusable.focus({ preventScroll: true });
    } catch {}
  };

  const handleOpenTarget = (target) => {
    // 1) try to find & scroll to a section
    const el = findTargetElement(target);
    if (el) {
      scrollFocus(el);
      return;
    }
    // 2) if nothing found, broadcast so specific forms can open modals, etc.
    try {
      window.dispatchEvent(new CustomEvent("open-form", { detail: { target } }));
    } catch {}
  };

  // A) When landed from navbar navigate("/", { state: { target } })
  useEffect(() => {
    const target = location.state && location.state.target;
    if (target) {
      // delay to allow the page/content to render
      setTimeout(() => handleOpenTarget(target), 0);
      // clear state so it doesn't re-trigger on future renders
      navigate(location.pathname, { replace: true, state: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // B) When hash is present (/#income, /#expense, /#savings)
  useEffect(() => {
    if (location.hash && location.hash.length > 1) {
      const target = location.hash.slice(1);
      setTimeout(() => handleOpenTarget(target), 0);
      // clear the hash so this only happens once
      const url = new URL(window.location.href);
      url.hash = "";
      window.history.replaceState(null, "", url.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.hash]);

  // C) Already on home: navbar fires a "open-form" event
  useEffect(() => {
    const listener = (e) => {
      const target = e?.detail?.target;
      if (target) handleOpenTarget(target);
    };
    window.addEventListener("open-form", listener);
    return () => window.removeEventListener("open-form", listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container">
      <div className="header">
        <h1>Manage Your Money Efficiently</h1>
        <div className="small">Welcome to ExpenseApp</div>
      </div>

      {/* TIP: if your actual form blocks exist, give them one of these ids:
          id="income-form", id="expense-form", id="savings-form"
          (this page will auto-scroll/focus them) */}
      <SummaryCards totals={totals} onClear={onClear} />

      <div className="grid" style={{ marginTop: 16, gridTemplateColumns: "repeat(12,1fr)" }}>
        <div className="card" style={{ gridColumn: "span 7" }}>
          <div className="small">
            Use the navbar to add income/expenses/savings or view transactions & reports.
          </div>
        </div>

        <div style={{ gridColumn: "span 5" }}>
          <WeeklyReport refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
}
