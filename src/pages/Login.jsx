// frontend/src/pages/Login.jsx
import React, { useState } from "react";
import { api } from "../api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/"; // go home
    } catch (e) {
      setErr(e?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <h2>Sign in</h2>
      <form className="card" onSubmit={submit}>
        <input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        {err && <div className="small" style={{color:"var(--bad)"}}>{err}</div>}
        <button className="btn" type="submit">Login</button>
      </form>
      <div className="small">No account? <a href="/register">Create one</a></div>
    </div>
  );
}
