import React, { useEffect, useState } from "react";
import { api } from "../api";
import DataTable from "../components/DataTable";
import SummaryCards from "../components/SummaryCards";

export default function TransactionsPage() {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({});

  const loadAll = async () => {
    const [txRes, tRes] = await Promise.all([
      api.get("/transactions"),
      api.get("/transactions/totals"),
    ]);
    setRows(txRes.data || []);
    setTotals(tRes.data || {});
  };

  useEffect(() => { loadAll(); }, []);

  const handleDelete = async (id) => {
    await api.delete(`/transactions/${id}`);
    loadAll();
  };

  const clearAll = async () => {
    if (!confirm("Delete ALL transactions?")) return;
    await api.delete("/transactions");
    loadAll();
  };

  return (
    <div className="container">
      <div className="header" style={{ marginTop: 12 }}>
        <div>
          <h1>All Transactions</h1>
          <div className="small">Full table view with totals</div>
        </div>
      </div>

      <SummaryCards totals={totals} onClear={clearAll} />

      <div className="grid" style={{ marginTop: 16, gridTemplateColumns: "repeat(12,1fr)" }}>
        <div style={{ gridColumn: "span 12" }}>
          <DataTable rows={rows} onDelete={handleDelete} />
        </div>
      </div>
    </div>
  );
}
