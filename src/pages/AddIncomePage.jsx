import React from "react";
import AddIncomeForm from "../components/AddIncomeForm";

export default function AddIncomePage({ onAdded }) {
  return (
    <div className="container">
      <div className="header"><h1>Add Income</h1></div>
      <AddIncomeForm onAdded={onAdded} />
    </div>
  );
}
