// frontend/src/pages/Register.jsx
import React, { useState } from "react";
import { api } from "../api";

export default function RegisterPage() {
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [err,setErr]=useState("");

  const submit = async (e)=>{
    e.preventDefault(); setErr("");
    try{
      const {data} = await api.post("/auth/register",{name,email,password});
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href="/";
    }catch(e){
      setErr(e?.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <h2>Create account</h2>
      <form className="card" onSubmit={submit}>
        <input placeholder="Name (optional)" value={name} onChange={(e)=>setName(e.target.value)} />
        <input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        {err && <div className="small" style={{color:"var(--bad)"}}>{err}</div>}
        <button className="btn" type="submit">Register</button>
      </form>
      <div className="small">Have an account? <a href="/login">Sign in</a></div>
    </div>
  );
}
