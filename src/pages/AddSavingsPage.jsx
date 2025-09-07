import React from "react";
import AddSavingsForm from "../components/AddSavingsForm";

export default function AddSavingsPage({ onAdded }) {
  return (
    <div className="container">
      <div className="header"><h1>Move to Savings</h1></div>
      <AddSavingsForm onAdded={onAdded} />
    </div>
  );
}
