import React from "react";
import AddExpenseForm from "../components/AddExpenseForm";

export default function AddExpensePage({ onAdded }) {
  return (
    <div className="container">
      <div className="header"><h1>Add Expense</h1></div>
      <AddExpenseForm onAdded={onAdded} />
    </div>
  );
}
