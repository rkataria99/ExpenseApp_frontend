import React from "react";
import DataTable from "../components/DataTable";

export default function TransactionsPage({ rows, onDelete }) {
  return (
    <div className="container">
      <div className="header"><h1>All Transactions</h1></div>
      <DataTable rows={rows} onDelete={onDelete} />
    </div>
  );
}
