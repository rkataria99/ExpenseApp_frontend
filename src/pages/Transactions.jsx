// frontend/src/pages/Transactions.jsx
import React, { useEffect, useState } from "react";
import { api } from "../api";
import DataTable from "../components/DataTable";

export default function TransactionsPage() {
  const [rows, setRows] = useState([]);

  const load = async () => {
    const res = await api.get("/transactions");
    setRows(res.data || []);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    await api.delete(`/transactions/${id}`);
    load();
  };

  const clearAll = async () => {
    if (!confirm("Delete ALL transactions?")) return;
    await api.delete("/transactions");
    load();
  };

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>All Transactions</h1>
          <div className="small">View, search (browser), and delete entries</div>
        </div>
        <button className="btn danger" onClick={clearAll}>Clear All</button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(12,1fr)" }}>
        <div style={{ gridColumn: "span 12" }}>
          <DataTable rows={rows} onDelete={handleDelete} />
        </div>
      </div>
    </div>
  );
}
