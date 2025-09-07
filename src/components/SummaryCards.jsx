import React from "react";

export default function SummaryCards({ totals, onClear }) {
  const { income=0, expense=0, savings=0, balance=0 } = totals || {};
  return (
    <div className="grid" style={{gridTemplateColumns:'repeat(12,1fr)'}}>
      <div className="card" style={{gridColumn:'span 3'}}>
        <div className="kpi">
          <div>
            <div className="tag">Total Income</div>
            <div className="val good">₹ {income.toFixed(2)}</div>
          </div>
        </div>
      </div>
      <div className="card" style={{gridColumn:'span 3'}}>
        <div className="kpi">
          <div>
            <div className="tag">Total Expense</div>
            <div className="val bad">₹ {expense.toFixed(2)}</div>
          </div>
        </div>
      </div>
      <div className="card" style={{gridColumn:'span 3'}}>
        <div className="kpi">
          <div>
            <div className="tag">Savings (moved)</div>
            <div className="val">₹ {savings.toFixed(2)}</div>
          </div>
        </div>
      </div>
      <div className="card" style={{gridColumn:'span 3'}}>
        <div className="kpi">
          <div>
            <div className="tag">Balance (Income − Expense − Savings)</div>
            <div className="val">₹ {balance.toFixed(2)}</div>
          </div>
          <button className="btn danger" onClick={onClear} title="Delete all transactions">Clear</button>
        </div>
      </div>
    </div>
  );
}
