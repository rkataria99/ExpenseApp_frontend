// frontend/src/App.jsx
import React, { useEffect, useRef, useState, useMemo, useCallback, createContext, useContext } from "react";
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { api, login as apiLogin, register as apiRegister, logout as apiLogout, me as apiMe, getAuthToken } from "./api";

import NavBar from "./components/Navbar";
import AddIncomeForm from "./components/AddIncomeForm";
import AddExpenseForm from "./components/AddExpenseForm";
import AddSavingsForm from "./components/AddSavingsForm";
import SummaryCards from "./components/SummaryCards";
import DataTable from "./components/DataTable";
import WeeklyReport from "./components/WeeklyReport";
import ReportsPage from "./pages/Reports";
import TransactionsPage from "./pages/Transactions";

const THEME_KEY = "theme"; // 'light' | 'dark' | 'system'

// -------------------- THEME --------------------
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

// -------------------- AUTH CONTEXT --------------------
const AuthCtx = createContext({ user: null, setUser: () => {} });
const useAuth = () => useContext(AuthCtx);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);

  // On mount (or when token changes), verify session
  useEffect(() => {
    let active = true;
    const verify = async () => {
      try {
        if (!getAuthToken()) {
          if (active) { setUser(null); setChecked(true); }
          return;
        }
        const u = await apiMe();
        if (active) setUser(u || null);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setChecked(true);
      }
    };
    verify();

    // react to global auth events from api.js
    const onLogin = (e) => setUser(e.detail || (user ?? {}));
    const onLogout = () => setUser(null);
    window.addEventListener("auth:login", onLogin);
    window.addEventListener("auth:logout", onLogout);
    return () => {
      active = false;
      window.removeEventListener("auth:login", onLogin);
      window.removeEventListener("auth:logout", onLogout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({ user, setUser, checked }), [user, checked]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

// Route guard
function RequireAuth({ children }) {
  const { user, checked } = useAuth();
  const location = useLocation();
  if (!checked) return null; // or a small spinner if you prefer
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

// -------------------- PAGES: LOGIN & REGISTER --------------------
function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await apiLogin(email.trim(), password);
      const to = (history.state && history.state.usr && history.state.usr.from?.pathname) || "/";
      navigate(to, { replace: true });
    } catch (ex) {
      setErr(ex?.response?.data?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 520, marginTop: 32 }}>
      <h1>Login</h1>
      <form className="card" onSubmit={submit}>
        <div className="row" style={{ flexDirection: "column", gap: 8 }}>
          <input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
          {err && <div className="small" style={{ color: "var(--bad)" }}>{err}</div>}
          <button className="btn" type="submit" disabled={busy}>{busy ? "Signing in..." : "Login"}</button>
          <div className="small">New here? <a href="/register">Create an account</a></div>
        </div>
      </form>
    </div>
  );
}

function RegisterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await apiRegister(name.trim(), email.trim(), password);
      navigate("/", { replace: true });
    } catch (ex) {
      setErr(ex?.response?.data?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 520, marginTop: 32 }}>
      <h1>Register</h1>
      <form className="card" onSubmit={submit}>
        <div className="row" style={{ flexDirection: "column", gap: 8 }}>
          <input placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} required />
          <input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
          {err && <div className="small" style={{ color: "var(--bad)" }}>{err}</div>}
          <button className="btn" type="submit" disabled={busy}>{busy ? "Creating..." : "Register"}</button>
          <div className="small">Already have an account? <a href="/login">Login</a></div>
        </div>
      </form>
    </div>
  );
}

// -------------------- HOME (unchanged UI, just as-is) --------------------
function Home({ theme, toggleTheme }) {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({});

  // section refs for smooth scroll
  const incomeRef = useRef(null);
  const expenseRef = useRef(null);
  const savingsRef = useRef(null);
  const tableRef = useRef(null);

  const loadAll = useCallback(async () => {
    const [txRes, tRes] = await Promise.all([
      api.get("/transactions"),
      api.get("/transactions/totals"),
    ]);
    setRows(txRes.data || []);
    setTotals(tRes.data || {});
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // auto-refresh on tx change (you already dispatch 'tx:changed')
  useEffect(() => {
    const h = () => loadAll();
    window.addEventListener("tx:changed", h);
    return () => window.removeEventListener("tx:changed", h);
  }, [loadAll]);

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
      setTimeout(() => smoothScrollToEl(ref?.current), 0);
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
        onLogout={() => apiLogout()}
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
          <div style={{ gridColumn: "span 5" }}>
            <WeeklyReport />
          </div>
        </div>
      </div>
    </>
  );
}

// -------------------- APP --------------------
function Shell({ children, theme, toggleTheme }) {
  // optional: a top navbar on secondary pages too
  return (
    <>
      <NavBar theme={theme} onToggleTheme={toggleTheme} onLogout={() => apiLogout()} />
      {children}
    </>
  );
}

export default function App() {
  // Default theme = LIGHT; toggle order: Light -> Dark -> System -> Light
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "light");
  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === "light" ? "dark" : t === "dark" ? "system" : "light"));
  };

  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <RequireAuth>
              <Home theme={theme} toggleTheme={toggleTheme} />
            </RequireAuth>
          }
        />
        <Route
          path="/reports"
          element={
            <RequireAuth>
              <Shell theme={theme} toggleTheme={toggleTheme}>
                <ReportsPage />
              </Shell>
            </RequireAuth>
          }
        />
        <Route
          path="/transactions"
          element={
            <RequireAuth>
              <Shell theme={theme} toggleTheme={toggleTheme}>
                <TransactionsPage />
              </Shell>
            </RequireAuth>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export { useAuth };