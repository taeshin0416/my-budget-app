import { useState } from "react";

const CATEGORIES = {
  expense: ["Groceries", "Transport", "Dining", "Subscriptions", "Other"],
  income: ["Salary", "Side Income", "Allowance", "Refund", "Other"],
};
const CAT_COLORS = {
  Groceries: "#1D9E75", Transport: "#378ADD", Dining: "#D85A30",
  Subscriptions: "#7F77DD", Other: "#888780", Salary: "#1D9E75",
  "Side Income": "#378ADD", Allowance: "#D85A30", Refund: "#7F77DD",
};

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Groceries");
  const [type, setType] = useState("expense");

  const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  function addTransaction() {
    if (!desc || !amount) return alert("Please enter a description and amount!");
    setTransactions([...transactions, {
      id: Date.now(), desc, amount: parseFloat(amount), category, type
    }]);
    setDesc(""); setAmount("");
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: 24, fontFamily: "sans-serif" }}>
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>💰 My Budget</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 24 }}>
        {[["Income", income, "#1D9E75"], ["Expenses", expense, "#D85A30"], ["Balance", income - expense, "#333"]].map(([label, val, color]) => (
          <div key={label} style={{ background: "#f5f5f5", borderRadius: 10, padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#888" }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 500, color }}>${val.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#f5f5f5", borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {["expense", "income"].map(t => (
            <button key={t} onClick={() => { setType(t); setCategory(CATEGORIES[t][0]); }} style={{
              flex: 1, padding: 8, borderRadius: 8, border: "none", cursor: "pointer",
              background: type === t ? (t === "expense" ? "#D85A30" : "#1D9E75") : "#ddd",
              color: type === t ? "white" : "#666", fontWeight: 500
            }}>{t === "expense" ? "Expense" : "Income"}</button>
          ))}
        </div>
        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (e.g. Groceries, Salary)"
          style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd", marginBottom: 8, boxSizing: "border-box" }} />
        <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" type="number"
          style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd", marginBottom: 8, boxSizing: "border-box" }} />
        <select value={category} onChange={e => setCategory(e.target.value)}
          style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd", marginBottom: 12, boxSizing: "border-box" }}>
          {CATEGORIES[type].map(c => <option key={c}>{c}</option>)}
        </select>
        <button onClick={addTransaction} style={{
          width: "100%", padding: 12, borderRadius: 8, border: "none",
          background: "#333", color: "white", fontWeight: 500, cursor: "pointer"
        }}>Add</button>
      </div>

      {transactions.length === 0
        ? <p style={{ textAlign: "center", color: "#aaa" }}>No transactions yet</p>
        : [...transactions].reverse().map(t => (
          <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 16px", marginBottom: 8, background: "#f5f5f5", borderRadius: 10 }}>
            <div>
              <div style={{ fontWeight: 500 }}>{t.desc}</div>
              <div style={{ fontSize: 12, color: "#888" }}>{t.category}</div>
            </div>
            <div style={{ fontWeight: 500, color: t.type === "income" ? "#1D9E75" : "#D85A30" }}>
              {t.type === "income" ? "+" : "-"}${t.amount.toLocaleString()}
            </div>
          </div>
        ))}
    </div>
  );
}