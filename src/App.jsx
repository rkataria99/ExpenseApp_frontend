// frontend/src/App.jsx
import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
  createContext,
  useContext,
} from "react";
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import {
  api,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  me as apiMe,
  getAuthToken,
} from "./api";

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

// Smooth scroll helper that works with our fixed navbar + spacer
function smoothScrollToEl(el) {
  if (!el) return;
  // Compute an explicit target Y using the measured nav height (if present)
  const nav = document.querySelector(".navbar");
  const spacer = document.querySelector(".nav-spacer");
  const navH = nav?.offsetHeight || 0;
  const spacerH = spacer?.offsetHeight || 0;
  const navbarOverlays = nav && (!spacer || Math.abs(spacerH - navH) > 2);
  const offset = (navbarOverlays ? navH : 0) + 8;

  const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset);
  window.scrollTo({ top, behavior: "smooth" });
}

// -------------------- AUTH CONTEXT --------------------
const AuthCtx = createContext({ user: null, setUser: () => {} });
const useAuth = () => useContext(AuthCtx);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    const verify = async () => {
      try {
        if (!getAuthToken()) {
          if (active) {
            setUser(null);
            setChecked(true);
          }
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
  if (!checked) return null;
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
      const to =
        (history.state && history.state.usr && history.state.usr.from?.pathname) || "/";
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
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {err && <div className="small" style={{ color: "var(--bad)" }}>{err}</div>}
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Signing in..." : "Login"}
          </button>
          <div className="small">
            New here? <a href="/register">Create an account</a>
          </div>
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
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {err && <div className="small" style={{ color: "var(--bad)" }}>{err}</div>}
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Creating..." : "Register"}
          </button>
          <div className="small">Already have an account? <a href="/login">Login</a></div>
        </div>
      </form>
    </div>
  );
}

// -------------------- HOME --------------------
function Home({ theme, toggleTheme }) {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({});

  // section refs
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

  // auto-refresh on tx change
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

  // Jump logic for deep links and navbar state
  const location = useLocation();
  const navigate = useNavigate();

  const mapTargetToRef = useCallback(
    (t) =>
      ({
        income: incomeRef,
        expense: expenseRef,
        savings: savingsRef,
        transactions: tableRef,
      }[t]),
    []
  );

  // From other routes (state: { target })
  useEffect(() => {
    if (location.state?.target) {
      const t = location.state.target;
      const ref = mapTargetToRef(t);
      setTimeout(() => {
        // Prefer anchor if exists, else scroll to ref
        const anchor = document.getElementById(`${t}-anchor`);
        if (anchor) anchor.scrollIntoView({ behavior: "smooth", block: "start" });
        else smoothScrollToEl(ref?.current);
      }, 0);
      navigate(location.pathname, { replace: true, state: undefined });
    }
  }, [location.state, mapTargetToRef, navigate, location.pathname]);

  // Hash navigation while already on Home (/#income etc.)
  useEffect(() => {
    if (location.hash && location.hash.length > 1) {
      const raw = location.hash.slice(1);
      const t = raw.replace("-anchor", "");
      const anchor = document.getElementById(`${t}-anchor`) || document.getElementById(raw);
      const ref = mapTargetToRef(t)?.current;
      setTimeout(() => {
        if (anchor) anchor.scrollIntoView({ behavior: "smooth", block: "start" });
        else smoothScrollToEl(ref || document.getElementById(t));
      }, 0);
      // keep hash to allow reloading with deep-link
    }
  }, [location.hash, mapTargetToRef]);

  return (
    <>
      {/* Navbar on top */}
      <NavBar
        theme={theme}
        onToggleTheme={toggleTheme}
        onGoIncome={() => {
          const a = document.getElementById("income-anchor");
          if (a) a.scrollIntoView({ behavior: "smooth", block: "start" });
          else smoothScrollToEl(incomeRef.current);
        }}
        onGoExpense={() => {
          const a = document.getElementById("expense-anchor");
          if (a) a.scrollIntoView({ behavior: "smooth", block: "start" });
          else smoothScrollToEl(expenseRef.current);
        }}
        onGoSavings={() => {
          const a = document.getElementById("savings-anchor");
          if (a) a.scrollIntoView({ behavior: "smooth", block: "start" });
          else smoothScrollToEl(savingsRef.current);
        }}
        onGoTransactions={() => {
          const a = document.getElementById("transactions-anchor");
          if (a) a.scrollIntoView({ behavior: "smooth", block: "start" });
          else smoothScrollToEl(tableRef.current);
        }}
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
            {/* ⬇⬇ anchor markers offset using --nav-h so the section sits below the fixed navbar */}
            <div id="income-anchor" className="scroll-target" aria-hidden="true" />
            <div className="row">
              <div id="income" ref={incomeRef}>
                <AddIncomeForm onAdded={loadAll} />
              </div>
              <div id="expense-anchor" className="scroll-target" aria-hidden="true" />
              <div id="expense" ref={expenseRef}>
                <AddExpenseForm onAdded={loadAll} />
              </div>
              <div id="savings-anchor" className="scroll-target" aria-hidden="true" />
              <div id="savings" ref={savingsRef}>
                <AddSavingsForm onAdded={loadAll} />
              </div>
            </div>
          </div>
        </div>

        {/* TABLE + INLINE REPORT */}
        <div className="grid" style={{ marginTop: 16, gridTemplateColumns: "repeat(12,1fr)" }}>
          <div id="transactions-anchor" className="scroll-target" aria-hidden="true" />
          <div id="transactions" style={{ gridColumn: "span 7" }} ref={tableRef}>
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
  return (
    <>
      <NavBar theme={theme} onToggleTheme={toggleTheme} onLogout={() => apiLogout()} />
      {children}
    </>
  );
}

export default function App() {
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
