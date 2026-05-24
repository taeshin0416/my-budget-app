import { useState } from "react";

const DEFAULT_CATEGORIES = {
  expense: ["Groceries", "Transport", "Dining", "Subscriptions", "Other"],
  income: ["Salary", "Side Income", "Allowance", "Refund", "Other"],
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const PIE_COLORS = ["#C17F4A", "#7A9E7E", "#C4856A", "#8FA8C8", "#B8956A", "#9B8EA0", "#7EA89B", "#C4A882"];

const S = {
  bg: "#FAF7F2", card: "#F3EDE3", border: "#E2D5C3",
  text: "#3D2E1E", muted: "#9A8470", accent: "#C17F4A",
  green: "#7A9E7E", red: "#C4856A",
  font: "'Fraunces', serif", sans: "'Georgia', serif",
};

const fmt = (n) => Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export default function App() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [allTransactions, setAllTransactions] = useState(() => {
    const saved = localStorage.getItem("transactions");
    return saved ? JSON.parse(saved) : {};
  });
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem("categories");
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today.toISOString().split("T")[0]);
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("Groceries");
  const [newCat, setNewCat] = useState("");
  const [managingCat, setManagingCat] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [editingTx, setEditingTx] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeTab, setActiveTab] = useState("calendar");

  function monthKeyFromDate(dateStr) {
    const [y, m] = dateStr.split("-");
    return `${parseInt(y)}-${parseInt(m) - 1}`;
  }

  const viewMonthKey = `${viewYear}-${viewMonth}`;
  const transactions = allTransactions[viewMonthKey] || [];

  localStorage.setItem("transactions", JSON.stringify(allTransactions));
  localStorage.setItem("categories", JSON.stringify(categories));

  function changeMonth(dir) {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m); setViewYear(y); setSelectedDate(null);
  }

  const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  function addTransaction() {
    if (!desc || !amount || !date) return alert("Please fill in all fields!");
    const key = monthKeyFromDate(date);
    const newTx = { id: Date.now(), desc, amount: parseFloat(amount), category, type, date };
    setAllTransactions(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), newTx].sort((a, b) => a.date.localeCompare(b.date))
    }));
    const [y, m] = date.split("-");
    setViewYear(parseInt(y));
    setViewMonth(parseInt(m) - 1);
    setDesc(""); setAmount("");
  }

  function deleteTransaction(id) {
    setAllTransactions(prev => {
      const updated = {};
      for (const key in prev) {
        updated[key] = prev[key].filter(t => t.id !== id);
      }
      return updated;
    });
    setEditingTx(null);
  }

  function startEdit(tx) {
    setEditingTx(tx.id);
    setDesc(tx.desc); setAmount(String(tx.amount));
    setDate(tx.date); setType(tx.type); setCategory(tx.category);
  }

  function saveEdit() {
    if (!desc || !amount || !date) return alert("Please fill in all fields!");
    const newKey = monthKeyFromDate(date);
    setAllTransactions(prev => {
      const updated = {};
      for (const key in prev) {
        updated[key] = prev[key].filter(t => t.id !== editingTx);
      }
      updated[newKey] = [...(updated[newKey] || []),
        { id: editingTx, desc, amount: parseFloat(amount), date, type, category }
      ].sort((a, b) => a.date.localeCompare(b.date));
      return updated;
    });
    const [y, m] = date.split("-");
    setViewYear(parseInt(y));
    setViewMonth(parseInt(m) - 1);
    setEditingTx(null);
    setDesc(""); setAmount(""); setDate(today.toISOString().split("T")[0]);
    setType("expense"); setCategory(categories["expense"][0]);
  }

  function cancelEdit() {
    setEditingTx(null);
    setDesc(""); setAmount(""); setDate(today.toISOString().split("T")[0]);
    setType("expense"); setCategory(categories["expense"][0]);
  }

  function addCategory() {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    if (categories[type].includes(trimmed)) return alert("Already exists!");
    setCategories(prev => ({ ...prev, [type]: [trimmed, ...prev[type]] }));
    setCategory(trimmed); setNewCat("");
  }

  function deleteCategory(cat) {
    if (categories[type].length <= 1) return alert("At least one category is required!");
    setCategories(prev => ({ ...prev, [type]: prev[type].filter(c => c !== cat) }));
    if (category === cat) setCategory(categories[type].filter(c => c !== cat)[0]);
  }

  function onDragStart(i) { setDragIndex(i); }
  function onDragOver(e, i) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === i) return;
    const updated = [...categories[type]];
    const dragged = updated.splice(dragIndex, 1)[0];
    updated.splice(i, 0, dragged);
    setCategories(prev => ({ ...prev, [type]: updated }));
    setDragIndex(i);
  }
  function onDragEnd() { setDragIndex(null); }

  function formatDate(d) {
    const [y, m, day] = d.split("-");
    return `${MONTHS[parseInt(m) - 1]} ${parseInt(day)}, ${y}`;
  }

  function getCalendarDays() {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }

  function txForDay(day) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return transactions.filter(t => t.date === dateStr);
  }

  function dayNet(day) {
    const txs = txForDay(day);
    return txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
         - txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  }

  function PieChart() {
    const [selectedCat, setSelectedCat] = useState(null);
    const [inlineEdit, setInlineEdit] = useState(null);

    const expenseTxs = transactions.filter(t => t.type === "expense");
    const total = expenseTxs.reduce((s, t) => s + t.amount, 0);
    if (total === 0) return <p style={{ textAlign: "center", color: S.muted, marginTop: 40, fontFamily: S.font }}>No expense data this month</p>;

    const catMap = {};
    expenseTxs.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
    const entries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    let cum = 0;
    const slices = entries.map(([cat, amt], i) => {
      const pct = amt / total; const start = cum; cum += pct;
      return { cat, amt, pct, start, color: PIE_COLORS[i % PIE_COLORS.length] };
    });

    function polar(cx, cy, r, angle) {
      const rad = (angle - 90) * Math.PI / 180;
      return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    }
    function path(cx, cy, r, s, e) {
      const sa = polar(cx, cy, r, s * 360); const ea = polar(cx, cy, r, e * 360);
      return `M ${cx} ${cy} L ${sa.x} ${sa.y} A ${r} ${r} 0 ${(e - s) > 0.5 ? 1 : 0} 1 ${ea.x} ${ea.y} Z`;
    }

    function startInlineEdit(t) {
      setInlineEdit({ id: t.id, desc: t.desc, amount: String(t.amount), date: t.date, type: t.type, category: t.category });
    }

    function saveInlineEdit() {
      const { id, desc, amount, date, type, category } = inlineEdit;
      if (!desc || !amount || !date) return alert("Please fill in all fields!");
      const newKey = `${parseInt(date.split("-")[0])}-${parseInt(date.split("-")[1]) - 1}`;
      setAllTransactions(prev => {
        const updated = {};
        for (const key in prev) {
          updated[key] = prev[key].filter(t => t.id !== id);
        }
        updated[newKey] = [...(updated[newKey] || []),
          { id, desc, amount: parseFloat(amount), date, type, category }
        ].sort((a, b) => a.date.localeCompare(b.date));
        return updated;
      });
      setInlineEdit(null);
    }

    const inlineInputStyle = {
      width: "100%", padding: "7px 10px", borderRadius: 7,
      border: `1px solid ${S.border}`, marginBottom: 6,
      boxSizing: "border-box", background: S.bg,
      color: S.text, fontFamily: S.sans, fontSize: 12,
    };

    const filteredTxs = selectedCat ? expenseTxs.filter(t => t.category === selectedCat) : [];

    return (
      <div>
        <svg viewBox="0 0 200 200" width="180" height="180" style={{ display: "block", margin: "0 auto 20px" }}>
          {slices.map((s, i) => (
            <path key={i} d={path(100, 100, 90, s.start, s.start + s.pct)}
              fill={s.color} stroke="#FAF7F2" strokeWidth="2" />
          ))}
        </svg>

        <div>
          {slices.map((s, i) => (
            <div key={i} onClick={() => { setSelectedCat(selectedCat === s.cat ? null : s.cat); setInlineEdit(null); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "9px 12px", borderBottom: `1px solid ${S.border}`,
                cursor: "pointer", borderRadius: 8,
                background: selectedCat === s.cat ? S.card : "transparent",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontFamily: S.font, color: S.text }}>{s.cat}</span>
              </div>
              <span style={{ fontSize: 13, color: S.muted, fontFamily: S.sans }}>
                ${fmt(s.amt)} ({(s.pct * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>

        {selectedCat && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: S.muted, fontFamily: S.sans, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 10 }}>
              {selectedCat} transactions
            </div>
            {filteredTxs.sort((a, b) => b.date.localeCompare(a.date)).map(t => (
              <div key={t.id} style={{ marginBottom: 6 }}>
                {inlineEdit?.id === t.id ? (
                  <div style={{ padding: "12px 16px", background: S.card, borderRadius: 10, border: `1px solid ${S.accent}` }}>
                    <div style={{ fontSize: 11, color: S.muted, marginBottom: 3, fontFamily: S.sans }}>Date</div>
                    <input type="date" value={inlineEdit.date}
                      onChange={e => setInlineEdit(p => ({ ...p, date: e.target.value }))}
                      style={inlineInputStyle} />
                    <div style={{ fontSize: 11, color: S.muted, marginBottom: 3, fontFamily: S.sans }}>Amount</div>
                    <input type="number" step="0.01" value={inlineEdit.amount}
                      onChange={e => setInlineEdit(p => ({ ...p, amount: e.target.value }))}
                      style={inlineInputStyle} />
                    <div style={{ fontSize: 11, color: S.muted, marginBottom: 3, fontFamily: S.sans }}>Category</div>
                    <select value={inlineEdit.category}
                      onChange={e => setInlineEdit(p => ({ ...p, category: e.target.value }))}
                      style={inlineInputStyle}>
                      {categories["expense"].map(c => <option key={c}>{c}</option>)}
                    </select>
                    <div style={{ fontSize: 11, color: S.muted, marginBottom: 3, fontFamily: S.sans }}>Description</div>
                    <input value={inlineEdit.desc}
                      onChange={e => setInlineEdit(p => ({ ...p, desc: e.target.value }))}
                      style={inlineInputStyle} />
                    <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                      <button onClick={() => setInlineEdit(null)}
                        style={{ flex: 1, padding: "7px 0", borderRadius: 7, border: `1px solid ${S.border}`, background: S.bg, color: S.muted, fontFamily: S.font, cursor: "pointer", fontSize: 13 }}>
                        취소
                      </button>
                      <button onClick={saveInlineEdit}
                        style={{ flex: 1, padding: "7px 0", borderRadius: 7, border: "none", background: S.accent, color: "white", fontFamily: S.font, cursor: "pointer", fontSize: 13 }}>
                        저장
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, maxWidth: 520 }}>
                    <div style={{
                      flex: 1, padding: "9px 13px", borderRadius: 10,
                      background: S.card, border: `1px solid ${S.border}`,
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <div>
                        <div style={{ fontSize: 11, color: S.muted, marginBottom: 2, fontFamily: S.sans }}>{formatDate(t.date)}</div>
                        <div style={{ fontSize: 12, color: S.muted, fontFamily: S.sans }}>{t.desc}</div>
                      </div>
                      <div style={{ fontSize: 17, fontFamily: S.font, fontWeight: 400, color: S.red }}>
                        −${fmt(t.amount)}
                      </div>
                    </div>
                    <button onClick={() => startInlineEdit(t)} style={{ background: "none", border: `1px solid ${S.border}`, borderRadius: 6, padding: "5px 8px", cursor: "pointer", fontSize: 12, color: S.muted, flexShrink: 0 }}>✎</button>
                    <button onClick={() => deleteTransaction(t.id)} style={{ background: "none", border: `1px solid ${S.border}`, borderRadius: 6, padding: "5px 8px", cursor: "pointer", fontSize: 12, color: S.red, flexShrink: 0 }}>✕</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const isEditing = editingTx !== null;
  const calendarDays = getCalendarDays();
  const selectedTxs = selectedDate ? txForDay(selectedDate) : [];

  const inputStyle = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: `1px solid ${S.border}`, marginBottom: 8,
    boxSizing: "border-box", background: S.bg,
    color: S.text, fontFamily: S.sans, fontSize: 13,
  };

  return (
    <div style={{ fontFamily: S.font, padding: 28, maxWidth: 1100, margin: "0 auto", background: S.bg, minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@300;400;500&display=swap" rel="stylesheet" />

      <h2 style={{ textAlign: "center", marginBottom: 4, fontFamily: S.font, fontSize: 32, fontWeight: 300, color: S.text, letterSpacing: "-0.5px" }}>
        My Budget
      </h2>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 24 }}>
        <button onClick={() => changeMonth(-1)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: S.muted }}>‹</button>
        <span style={{ fontFamily: S.font, fontWeight: 300, fontSize: 17, color: S.text }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={() => changeMonth(1)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: S.muted }}>›</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 28 }}>
        {[["Income", income, S.green], ["Expenses", expense, S.red], ["Balance", income - expense, S.accent]].map(([label, val, color]) => (
          <div key={label} style={{ background: S.card, borderRadius: 12, padding: "14px 16px", textAlign: "center", border: `1px solid ${S.border}` }}>
            <div style={{ fontSize: 11, color: S.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6, fontFamily: S.sans }}>{label}</div>
            <div style={{ fontSize: 20, fontFamily: S.font, fontWeight: 400, color }}>${fmt(val)}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24, alignItems: "start" }}>

        <div style={{ background: S.card, borderRadius: 14, padding: 18, border: `1px solid ${S.border}` }}>
          <div style={{ fontSize: 12, fontFamily: S.sans, color: S.muted, marginBottom: 14, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            {isEditing ? "Edit transaction" : "Add transaction"}
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {["expense", "income"].map(t => (
              <button key={t} onClick={() => { setType(t); setCategory(categories[t][0]); setManagingCat(false); }} style={{
                flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${S.border}`, cursor: "pointer",
                background: type === t ? (t === "expense" ? S.red : S.green) : S.bg,
                color: type === t ? "white" : S.muted,
                fontFamily: S.font, fontWeight: 300, fontSize: 14,
              }}>{t === "expense" ? "Expense" : "Income"}</button>
            ))}
          </div>

          <div style={{ fontSize: 11, color: S.muted, marginBottom: 3, fontFamily: S.sans, letterSpacing: "0.04em" }}>Date</div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />

          <div style={{ fontSize: 11, color: S.muted, marginBottom: 3, fontFamily: S.sans, letterSpacing: "0.04em" }}>Amount</div>
          <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" type="number" step="0.01" style={inputStyle} />

          <div style={{ fontSize: 11, color: S.muted, marginBottom: 3, fontFamily: S.sans, letterSpacing: "0.04em" }}>Category</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <select value={category} onChange={e => setCategory(e.target.value)}
              style={{ ...inputStyle, flex: 1, marginBottom: 0 }}>
              {categories[type].map(c => <option key={c}>{c}</option>)}
            </select>
            <button onClick={() => setManagingCat(!managingCat)} style={{
              padding: "9px 13px", borderRadius: 8, border: `1px solid ${S.border}`,
              background: managingCat ? S.text : S.bg, color: managingCat ? S.bg : S.muted,
              cursor: "pointer", fontFamily: S.sans, fontSize: 13,
            }}>✎</button>
          </div>

          {managingCat && (
            <div style={{ background: S.bg, borderRadius: 10, padding: 12, marginBottom: 8, border: `1px solid ${S.border}` }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <input value={newCat} onChange={e => setNewCat(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addCategory()}
                  placeholder="New category"
                  style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
                <button onClick={addCategory} style={{
                  padding: "9px 12px", borderRadius: 8, border: "none",
                  background: S.green, color: "white", cursor: "pointer", fontFamily: S.sans, fontSize: 13,
                }}>Add</button>
              </div>
              <div style={{ fontSize: 11, color: S.muted, marginBottom: 6, fontFamily: S.sans }}>Drag to reorder · tap ✕ to delete</div>
              {categories[type].map((c, i) => (
                <div key={c} draggable onDragStart={() => onDragStart(i)} onDragOver={e => onDragOver(e, i)} onDragEnd={onDragEnd}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "7px 10px", marginBottom: 4, borderRadius: 8,
                    background: dragIndex === i ? S.border : S.card,
                    border: `1px solid ${S.border}`, cursor: "grab" }}>
                  <span style={{ fontSize: 13, fontFamily: S.font, color: S.text }}>☰ {c}</span>
                  <button onClick={() => deleteCategory(c)} style={{ background: "none", border: "none", color: S.red, cursor: "pointer", fontSize: 13 }}>✕</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: 11, color: S.muted, marginBottom: 3, fontFamily: S.sans, letterSpacing: "0.04em" }}>Description</div>
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. T&T Supermarket" style={inputStyle} />

          {isEditing ? (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={cancelEdit} style={{ flex: 1, padding: 11, borderRadius: 8, border: `1px solid ${S.border}`, background: S.bg, color: S.muted, fontFamily: S.font, fontWeight: 300, cursor: "pointer" }}>Cancel</button>
              <button onClick={saveEdit} style={{ flex: 1, padding: 11, borderRadius: 8, border: "none", background: S.accent, color: "white", fontFamily: S.font, fontWeight: 300, cursor: "pointer" }}>Save</button>
            </div>
          ) : (
            <button onClick={addTransaction} style={{ width: "100%", padding: 11, borderRadius: 8, border: "none", background: S.text, color: S.bg, fontFamily: S.font, fontWeight: 300, fontSize: 14, cursor: "pointer" }}>
              Add
            </button>
          )}
        </div>

        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
            {[["calendar", "Calendar"], ["list", "Transactions"], ["chart", "Chart"]].map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "8px 18px", borderRadius: 20, border: `1px solid ${S.border}`, cursor: "pointer",
                background: activeTab === tab ? S.text : S.bg,
                color: activeTab === tab ? S.bg : S.muted,
                fontFamily: S.font, fontWeight: 300, fontSize: 13,
              }}>{label}</button>
            ))}
          </div>

          {activeTab === "list" && (
            <div>
              {transactions.length === 0
                ? <p style={{ textAlign: "center", color: S.muted, marginTop: 40, fontFamily: S.font, fontWeight: 300 }}>No transactions this month</p>
                : [...transactions].reverse().map(t => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, maxWidth: 520 }}>
                    <div style={{
                      flex: 1, padding: "9px 13px", borderRadius: 12,
                      background: editingTx === t.id ? "#F0E8DA" : S.card,
                      border: `1px solid ${editingTx === t.id ? S.accent : S.border}`,
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <div>
                        <div style={{ fontSize: 11, color: S.muted, marginBottom: 2, fontFamily: S.sans }}>{formatDate(t.date)}</div>
                        <div style={{ fontSize: 12, color: S.muted, fontFamily: S.sans }}>{t.category} · {t.desc}</div>
                      </div>
                      <div style={{ fontSize: 17, fontFamily: S.font, fontWeight: 400, color: t.type === "income" ? S.green : S.red }}>
                        {t.type === "income" ? "+" : "−"}${fmt(t.amount)}
                      </div>
                    </div>
                    <button onClick={() => startEdit(t)} style={{ background: "none", border: `1px solid ${S.border}`, borderRadius: 6, padding: "5px 8px", cursor: "pointer", fontSize: 12, color: S.muted, flexShrink: 0 }}>✎</button>
                    <button onClick={() => deleteTransaction(t.id)} style={{ background: "none", border: `1px solid ${S.border}`, borderRadius: 6, padding: "5px 8px", cursor: "pointer", fontSize: 12, color: S.red, flexShrink: 0 }}>✕</button>
                  </div>
                ))}
            </div>
          )}

          {activeTab === "calendar" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
                {DAYS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, color: S.muted, padding: "4px 0", fontFamily: S.sans, letterSpacing: "0.05em" }}>{d}</div>)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                {calendarDays.map((day, i) => {
                  if (!day) return <div key={i} />;
                  const txs = txForDay(day);
                  const net = dayNet(day);
                  const isSelected = selectedDate === day;
                  const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
                  return (
                    <div key={i} onClick={() => setSelectedDate(isSelected ? null : day)} style={{
                      minHeight: 54, padding: 6, borderRadius: 10, cursor: txs.length ? "pointer" : "default",
                      background: isSelected ? S.text : isToday ? S.card : S.bg,
                      border: `1px solid ${isSelected ? S.text : S.border}`,
                    }}>
                      <div style={{ fontSize: 12, fontFamily: S.font, fontWeight: isToday ? 400 : 300, color: isSelected ? S.bg : S.text, marginBottom: 2 }}>{day}</div>
                      {txs.length > 0 && (
                        <div style={{ fontSize: 12, fontWeight: "bold", color: isSelected ? "#FAC775" : net >= 0 ? "#4A8C5C" : "#B85C3A", fontFamily: S.sans }}>
                          {net >= 0 ? "+" : ""}${fmt(Math.abs(net))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedDate && (
                <div style={{ marginTop: 18 }}>
                  <div style={{ fontSize: 13, fontFamily: S.font, fontWeight: 300, color: S.muted, marginBottom: 10 }}>
                    {MONTHS[viewMonth]} {selectedDate}, {viewYear}
                  </div>
                  {selectedTxs.length === 0
                    ? <p style={{ color: S.muted, fontSize: 13, fontFamily: S.font, fontWeight: 300 }}>No transactions</p>
                    : selectedTxs.map(t => (
                      <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, maxWidth: 520 }}>
                        <div style={{
                          flex: 1, padding: "9px 13px", borderRadius: 10,
                          background: S.card, border: `1px solid ${S.border}`,
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                        }}>
                          <div>
                            <div style={{ fontSize: 12, color: S.muted, fontFamily: S.sans }}>{t.category} · {t.desc}</div>
                          </div>
                          <div style={{ fontSize: 17, fontFamily: S.font, fontWeight: 400, color: t.type === "income" ? S.green : S.red }}>
                            {t.type === "income" ? "+" : "−"}${fmt(t.amount)}
                          </div>
                        </div>
                        <button onClick={() => { startEdit(t); setActiveTab("list"); }} style={{ background: "none", border: `1px solid ${S.border}`, borderRadius: 6, padding: "5px 8px", cursor: "pointer", fontSize: 12, color: S.muted, flexShrink: 0 }}>✎</button>
                        <button onClick={() => deleteTransaction(t.id)} style={{ background: "none", border: `1px solid ${S.border}`, borderRadius: 6, padding: "5px 8px", cursor: "pointer", fontSize: 12, color: S.red, flexShrink: 0 }}>✕</button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "chart" && <PieChart />}
        </div>
      </div>
    </div>
  );
}