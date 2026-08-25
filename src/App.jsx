import { useEffect, useMemo, useState } from "react";
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  BarChart3, 
  ChevronDown, 
  CircleDollarSign, 
  Filter, 
  LayoutDashboard, 
  MoreHorizontal, 
  Plus, 
  Receipt, 
  Target, 
  Trash2, 
  WalletCards, 
  X 
} from "lucide-react";

const STORAGE_KEY = "fraterne-finance-dashboard-v1";
const CATEGORIES = ["Food", "Transport", "Education", "Shopping", "Bills", "Health", "Other"];
const CATEGORY_HELP = {
  Food: "Meals, groceries and restaurants",
  Transport: "Bus, fuel, rides and travel",
  Education: "Courses, books and learning",
  Shopping: "Clothes, electronics and purchases",
  Bills: "Utilities and recurring payments",
  Health: "Health and wellness",
  Other: "Anything else"
};

const DEFAULT_DATA = {
  transactions: [
    { id: "seed-1", description: "Monthly allowance", amount: 100,000, type: "income", category: "Other", date: "2026-08-02" },
    { id: "seed-2", description: "Groceries", amount: 120000, type: "expense", category: "Food", date: "2026-08-04" },
    { id: "seed-3", description: "Transport", amount: 45000, type: "expense", category: "Transport", date: "2026-08-07" },
    { id: "seed-4", description: "JavaScript course", amount: 95000, type: "expense", category: "Education", date: "2026-08-10" }
  ],
  budgets: { Food: 250000, Transport: 120000, Education: 180000, Shopping: 150000, Bills: 100000, Health: 100000 }
};

function money(v) {
  return new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(v);
}
function dateLabel(v) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(v + "T00:00:00"));
}
function uid() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
}

export default function App() {
  const [data, setData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || DEFAULT_DATA;
    } catch {
      return DEFAULT_DATA;
    }
  });

  const [tab, setTab] = useState("Overview");
  const [txOpen, setTxOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [filter, setFilter] = useState("All");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(data)), [data]);

  const summary = useMemo(() => {
    const income = data.transactions.filter(x => x.type === "income").reduce((a, x) => a + Number(x.amount), 0);
    const expenses = data.transactions.filter(x => x.type === "expense").reduce((a, x) => a + Number(x.amount), 0);
    return { income, expenses, balance: income - expenses };
  }, [data.transactions]);

  const filtered = useMemo(() => 
    [...data.transactions]
      .filter(x => filter === "All" || x.type === filter.toLowerCase())
      .filter(x => category === "All" || x.category === category)
      .filter(x => x.description.toLowerCase().includes(search.toLowerCase().trim()))
      .sort((a, b) => b.date.localeCompare(a.date)),
    [data.transactions, filter, category, search]
  );

  const spending = useMemo(() => 
    CATEGORIES.map(c => ({
      category: c,
      amount: data.transactions.filter(x => x.type === "expense" && x.category === c).reduce((a, x) => a + Number(x.amount), 0)
    }))
    .filter(x => x.amount > 0)
    .sort((a, b) => b.amount - a.amount),
    [data.transactions]
  );

  function addTx(tx) {
    setData(d => ({ ...d, transactions: [...d.transactions, { ...tx, id: uid(), amount: Number(tx.amount) }] }));
    setTxOpen(false);
  }
  function delTx(id) {
    setData(d => ({ ...d, transactions: d.transactions.filter(x => x.id !== id) }));
  }
  function saveBudget(cat, amount) {
    setData(d => ({ ...d, budgets: { ...d.budgets, [cat]: Number(amount) } }));
    setBudgetOpen(false);
  }

  const nav = [["Overview", LayoutDashboard], ["Transactions", Receipt], ["Budgets", Target]];

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <div className="brandIcon"><CircleDollarSign size={21} /></div>
          <div><b>MoneyWise</b><span>Personal finance</span></div>
        </div>
        <nav>
          {nav.map(([n, I]) => (
            <button key={n} className={tab === n ? "nav active" : "nav"} onClick={() => setTab(n)}>
              <I size={16} />{n}
            </button>
          ))}
        </nav>
        <button className="btn primary topAdd" onClick={() => setTxOpen(true)}>
          <Plus size={17} /> Add transaction
        </button>
      </header>

      <main className="page">
        <div className="mobileNav">
          {nav.map(([n, I]) => (
            <button key={n} className={tab === n ? "nav active" : "nav"} onClick={() => setTab(n)}>
              <I size={16} />{n}
            </button>
          ))}
        </div>

        {tab === "Overview" && (
          <>
            <section className="hero">
              <div>
                <p className="eyebrow">AUGUST 2026</p>
                <h1>Know where your money goes.</h1>
                <p className="heroText">Track income, expenses and budgets in one clean dashboard.</p>
              </div>
              <div className="actions">
                <button className="btn ghost" onClick={() => setBudgetOpen(true)}>
                  <Target size={17} /> Set budget
                </button>
              </div>
            </section>

            <section className="cards">
              <Card label="Current balance" value={money(summary.balance)} icon={<WalletCards />} tone="balance" />
              <Card label="Total income" value={money(summary.income)} icon={<ArrowDownLeft />} tone="income" />
              <Card label="Total expenses" value={money(summary.expenses)} icon={<ArrowUpRight />} tone="expense" />
              <Card label="Top spending" value={spending[0] ? money(spending[0].amount) : money(0)} sub={spending[0]?.category || "No expenses yet"} icon={<BarChart3 />} />
            </section>

            <section className="grid">
              <div className="panel">
                <Head eyebrow="SPENDING BREAKDOWN" title="Category Breakdown" note={`${spending.length} categories`} />
                {spending.length ? (
                  <div className="bars">
                    {spending.slice(0, 6).map(x => (
                      <div className="barItem" key={x.category}>
                        <div className="barTop">
                          <span>{x.category}</span>
                          <b>{money(x.amount)}</b>
                        </div>
                        <div className="track">
                          <div className="fill" style={{ width: `${Math.max(8, (x.amount / spending[0].amount) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty text="Add an expense to see your spending breakdown." />
                )}
              </div>

              <BudgetOverview budgets={data.budgets} transactions={data.transactions} edit={() => setBudgetOpen(true)} />
            </section>

            <Recent transactions={data.transactions} del={delTx} all={() => setTab("Transactions")} />
          </>
        )}

        {tab === "Transactions" && (
          <section className="content">
            <div className="sectionHead">
              <div>
                <p className="eyebrow">MONEY MOVEMENT</p>
                <h1>Transactions</h1>
                <p>Search, filter and manage your transactions.</p>
              </div>
              <button className="btn primary" onClick={() => setTxOpen(true)}>
                <Plus size={17} /> Add transaction
              </button>
            </div>
            <div className="panel">
              <div className="filters">
                <div className="search">
                  <Filter size={16} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions..." />
                  {search && <button className="icon" onClick={() => setSearch("")}><X size={15} /></button>}
                </div>
                <Select value={filter} set={setFilter} options={["All", "Income", "Expense"]} />
                <Select value={category} set={setCategory} options={["All", ...CATEGORIES]} />
              </div>
              <Table items={filtered} del={delTx} />
            </div>
          </section>
        )}

        {tab === "Budgets" && (
          <section className="content">
            <div className="sectionHead">
              <div>
                <p className="eyebrow">SPENDING LIMITS</p>
                <h1>Budgets</h1>
                <p>Set a target for each category and watch your progress.</p>
              </div>
              <button className="btn primary" onClick={() => setBudgetOpen(true)}>
                <Plus size={17} /> Add budget
              </button>
            </div>
            <div className="budgetGrid">
              {Object.entries(data.budgets).map(([c, b]) => (
                <BudgetCard key={c} category={c} budget={b} transactions={data.transactions} edit={() => setBudgetOpen(true)} />
              ))}
            </div>
          </section>
        )}
      </main>

      {txOpen && (
        <Modal title="Add transaction" close={() => setTxOpen(false)}>
          <TxForm submit={addTx} cancel={() => setTxOpen(false)} />
        </Modal>
      )}
      {budgetOpen && (
        <Modal title="Set a category budget" close={() => setBudgetOpen(false)}>
          <BudgetForm budgets={data.budgets} submit={saveBudget} cancel={() => setBudgetOpen(false)} />
        </Modal>
      )}
    </div>
  );
}

function Card({ label, value, icon, tone = "", sub }) {
  return (
    <article className={`card ${tone}`}>
      <div className="cardIcon">{icon}</div>
      <div>
        <p>{label}</p>
        <h2>{value}</h2>
        {sub && <span>{sub}</span>}
      </div>
    </article>
  );
}

function Head({ eyebrow, title, note }) {
  return (
    <div className="panelHead">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {note && <span className="note">{note}</span>}
    </div>
  );
}

function BudgetOverview({ budgets, transactions, edit }) {
  const items = Object.entries(budgets)
    .map(([c, b]) => {
      const spent = transactions
        .filter(x => x.type === "expense" && x.category === c)
        .reduce((a, x) => a + Number(x.amount), 0);
      return { c, b, spent };
    })
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 4);

  return (
    <div className="panel">
      <Head eyebrow="BUDGET CHECK" title="Stay on track" />
      <div className="budgetList">
        {items.map(x => {
          const pct = x.b > 0 ? Math.min((x.spent / x.b) * 100, 100) : 0;
          return (
            <div className="budgetItem" key={x.c}>
              <div className="budgetTop">
                <span>{x.c}</span>
                <b>{money(x.spent)} <small>/ {money(x.b)}</small></b>
              </div>
              <div className="track">
                <div className={`progress ${x.spent > x.b ? "over" : ""}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
        <button className="textBtn" onClick={edit}>Edit budgets</button>
      </div>
    </div>
  );
}

function BudgetCard({ category, budget, transactions, edit }) {
  const spent = transactions
    .filter(x => x.type === "expense" && x.category === category)
    .reduce((a, x) => a + Number(x.amount), 0);

  const rawPct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const pct = Math.min(rawPct, 100);
  const over = spent > budget;

  return (
    <article className="panel budgetCard">
      <div className="budgetCardTop">
        <div>
          <p className="eyebrow">{category}</p>
          <h2>{money(budget)}</h2>
        </div>
        <button className="icon" onClick={edit}><MoreHorizontal size={18} /></button>
      </div>
      <p>{CATEGORY_HELP[category]}</p>
      <strong className="bigSpend">{money(spent)}</strong>
      <div className="track">
        <div className={`progress ${over ? "over" : ""}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="budgetMeta">
        <span>{over ? "Over budget" : "Used"}</span>
        <b>{rawPct}%</b>
      </div>
    </article>
  );
}

function Recent({ transactions, del, all }) {
  return (
    <section className="panel recent">
      <div className="panelHead">
        <div>
          <p className="eyebrow">LATEST ACTIVITY</p>
          <h2>Recent transactions</h2>
        </div>
        <button className="textBtn" onClick={all}>View all</button>
      </div>
      <Table items={[...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)} del={del} />
    </section>
  );
}

function Table({ items, del }) {
  if (!items.length) return <Empty text="No transactions match your filters." />;
  return (
    <div className="table">
      {items.map(x => (
        <div className="row" key={x.id}>
          <div className={`txIcon ${x.type}`}>
            {x.type === "income" ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
          </div>
          <div className="txMain">
            <b>{x.description}</b>
            <span>{x.category} · {dateLabel(x.date)}</span>
          </div>
          <strong className={x.type === "income" ? "positive" : "negative"}>
            {x.type === "income" ? "+" : "-"}{money(x.amount)}
          </strong>
          <button className="icon delete" onClick={() => del(x.id)}>
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

function Empty({ text }) {
  return <div className="empty">{text}</div>;
}

function Select({ value, set, options }) {
  return (
    <label className="select">
      <select value={value} onChange={e => set(e.target.value)}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown size={15} />
    </label>
  );
}

function Modal({ title, close, children }) {
  return (
    <div className="backdrop" onMouseDown={e => e.target === e.currentTarget && close()}>
      <div className="modal">
        <div className="modalHead">
          <div>
            <p className="eyebrow">UPDATE YOUR FINANCES</p>
            <h2>{title}</h2>
          </div>
          <button className="icon" onClick={close}><X size={19} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function TxForm({ submit, cancel }) {
  const [f, setF] = useState({ description: "", amount: "", type: "expense", category: "Food", date: new Date().toISOString().slice(0, 10) });
  const [error, setError] = useState("");

  const up = (k, v) => setF(x => ({ ...x, [k]: v }));
  const send = e => {
    e.preventDefault();
    const amount = Number(f.amount);
    if (!f.description.trim()) return setError("Please enter a description.");
    if (!amount || amount <= 0) return setError("Please enter an amount greater than zero.");
    submit({ ...f, description: f.description.trim(), amount });
  };

  return (
    <form className="form" onSubmit={send}>
      {error && <div className="error">{error}</div>}
      <label>
        Description
        <input autoFocus value={f.description} onChange={e => up("description", e.target.value)} placeholder="e.g. Coffee with friends" />
      </label>
      <div className="formGrid">
        <label>
          Amount
          <input type="number" min="1" value={f.amount} onChange={e => up("amount", e.target.value)} placeholder="5000" />
        </label>
        <label>
          Date
          <input type="date" value={f.date} onChange={e => up("date", e.target.value)} />
        </label>
      </div>
      <div className="formGrid">
        <label>
          Type
          <select value={f.type} onChange={e => up("type", e.target.value)}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </label>
        <label>
          Category
          <select value={f.category} onChange={e => up("category", e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </label>
      </div>
      <div className="modalActions">
        <button type="button" className="btn ghost" onClick={cancel}>Cancel</button>
        <button className="btn primary">Save transaction</button>
      </div>
    </form>
  );
}

function BudgetForm({ budgets, submit, cancel }) {
  const first = Object.keys(budgets)[0] || "Food";
  const [c, setC] = useState(first);
  const [a, setA] = useState(budgets[first] || "");
  const [error, setError] = useState("");

  const send = e => {
    e.preventDefault();
    if (!Number(a) || Number(a) <= 0) return setError("Enter a budget greater than zero.");
    submit(c, a);
  };

  return (
    <form className="form" onSubmit={send}>
      {error && <div className="error">{error}</div>}
      <label>
        Category
        <select value={c} onChange={e => { const n = e.target.value; setC(n); setA(budgets[n] || ""); }}>
          {CATEGORIES.map(x => <option key={x}>{x}</option>)}
        </select>
      </label>
      <label>
        Monthly budget
        <input type="number" min="1" value={a} onChange={e => setA(e.target.value)} placeholder="100000" />
      </label>
      <div className="modalActions">
        <button type="button" className="btn ghost" onClick={cancel}>Cancel</button>
        <button className="btn primary">Save budget</button>
      </div>
    </form>
  );
}
