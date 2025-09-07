import React from "react";

const GROUP_LABEL = {
  home_share: "Direct home share",
  self: "Self expense",
  gifts_family: "Gifts & family",
  trip_family: "Trips (family)",
  trip_self: "Trips (self)"
};

export default function DataTable({ rows = [], onDelete }) {
  return (
    <div className="card">
      <div className="label">All Transactions</div>
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Group</th>
            <th>Category</th>
            <th>Note</th>
            <th>Amount (₹)</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={7} className="small">No data yet. Add income/expense/savings above.</td></tr>
          ) : rows.map(r => (
            <tr key={r._id}>
              <td>{new Date(r.date).toLocaleDateString()}</td>
              <td style={{textTransform:'capitalize'}}>{r.type}</td>
              <td>{GROUP_LABEL[r.categoryGroup] || "-"}</td>
              <td>{r.category || "-"}</td>
              <td>{r.note || "-"}</td>
              <td>{Number(r.amount).toFixed(2)}</td>
              <td><button className="btn secondary" onClick={()=>onDelete(r._id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
