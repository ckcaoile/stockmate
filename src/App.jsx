import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";

const today = () => new Date().toISOString().split("T")[0];
const nowTime = () => new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
const pad = (n) => String(n).padStart(2, "0");

const SERVICES = ["GSAT HD", "CIGNAL", "SATLITE", "GPINOY"];
const SERVICE_COLOR = {
  "GSAT HD": { bg: "#7c3aed", light: "#ede9fe", text: "#5b21b6" },
  "CIGNAL":  { bg: "#dc2626", light: "#fee2e2", text: "#991b1b" },
  "SATLITE": { bg: "#0369a1", light: "#e0f2fe", text: "#0c4a6e" },
  "GPINOY":  { bg: "#059669", light: "#d1fae5", text: "#065f46" },
};

const DARK = {
  bg:"#0a0f1a",card:"#111827",border:"#1f2937",input:"#111827",
  text:"#f9fafb",sub:"#9ca3af",muted:"#4b5563",accent:"#f59e0b",
  accentText:"#1a1108",hover:"#1f2937",shadow:"#00000060",
};
const LIGHT = {
  bg:"#f3f4f6",card:"#ffffff",border:"#e5e7eb",input:"#ffffff",
  text:"#111827",sub:"#6b7280",muted:"#9ca3af",accent:"#d97706",
  accentText:"#ffffff",hover:"#f9fafb",shadow:"#00000018",
};

// ── DB hooks ────────────────────────────────────────────────────────────────
function useCustomers() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    const { data: rows } = await supabase.from("customers").select("*").order("name");
    if (rows) setData(rows.map(r => ({ id:r.id, name:r.name, boxNumber:r.box_number, service:r.service, notes:r.notes||"", dateAdded:r.date_added })));
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  const add = async (c) => {
    await supabase.from("customers").insert([{ id:c.id, name:c.name, box_number:c.boxNumber, service:c.service, notes:c.notes, date_added:today() }]);
    await load();
  };
  const update = async (id, patch) => {
    const row = {};
    if (patch.name!==undefined) row.name=patch.name;
    if (patch.boxNumber!==undefined) row.box_number=patch.boxNumber;
    if (patch.service!==undefined) row.service=patch.service;
    if (patch.notes!==undefined) row.notes=patch.notes;
    await supabase.from("customers").update(row).eq("id", id);
    setData(prev => prev.map(c => c.id===id ? {...c,...patch} : c));
  };
  const remove = async (id) => {
    await supabase.from("customers").delete().eq("id", id);
    setData(prev => prev.filter(c => c.id!==id));
  };
  return { data, loading, add, update, remove };
}

function useTransactions() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    const { data: rows } = await supabase.from("transactions").select("*").order("created_at", { ascending:false }).limit(500);
    if (rows) setData(rows.map(r => ({ id:r.id, customerId:r.customer_id, customerName:r.customer_name, boxNumber:r.box_number, service:r.service, amount:r.amount, monthYear:r.month_year, date:r.date, time:r.time })));
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  const add = async (t) => {
    await supabase.from("transactions").insert([{ id:t.id, customer_id:t.customerId, customer_name:t.customerName, box_number:t.boxNumber, service:t.service, amount:t.amount, month_year:t.monthYear, date:t.date, time:t.time }]);
    setData(prev => [t, ...prev]);
  };
  const remove = async (id) => {
    await supabase.from("transactions").delete().eq("id", id);
    setData(prev => prev.filter(t => t.id!==id));
  };
  return { data, loading, add, remove };
}

// ── Shared UI ────────────────────────────────────────────────────────────────
const ServiceBadge = ({ service, T }) => {
  const col = SERVICE_COLOR[service] || { bg:"#374151", light:"#f3f4f6", text:"#111827" };
  return (
    <span style={{ display:"inline-block", padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:800, letterSpacing:"0.06em", background:T===DARK?col.bg+"33":col.light, color:T===DARK?col.bg:col.text, border:`1px solid ${col.bg}44` }}>
      {service}
    </span>
  );
};

const Btn = ({ children, onClick, variant="primary", small, disabled, style, T }) => {
  const v = {
    primary:{ background:T.accent, color:T.accentText, border:"none" },
    ghost:  { background:"transparent", color:T.sub, border:`1px solid ${T.border}` },
    danger: { background:"#7f1d1d33", color:"#f87171", border:"1px solid #7f1d1d55" },
    success:{ background:"#14532d33", color:"#4ade80", border:"1px solid #14532d55" },
    dark:   { background:T.hover, color:T.text, border:`1px solid ${T.border}` },
  };
  return (
    <button onClick={disabled?undefined:onClick} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:small?"6px 12px":"9px 18px", borderRadius:8, cursor:disabled?"not-allowed":"pointer", fontFamily:"inherit", fontWeight:600, fontSize:small?12:13, transition:"all .15s", opacity:disabled?0.5:1, ...v[variant], ...style }}>{children}</button>
  );
};

const Input = ({ label, value, onChange, placeholder, type="text", T, autoFocus, onKeyDown }) => (
  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
    {label && <label style={{ fontSize:11, fontWeight:700, color:T.sub, letterSpacing:"0.1em", textTransform:"uppercase" }}>{label}</label>}
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} onKeyDown={onKeyDown}
      style={{ background:T.input, border:`1px solid ${T.border}`, borderRadius:8, padding:"9px 12px", color:T.text, fontSize:14, fontFamily:"inherit", outline:"none", width:"100%", boxSizing:"border-box" }} />
  </div>
);

const Card = ({ children, style, T }) => (
  <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:16, ...style }}>{children}</div>
);

const Modal = ({ title, onClose, children, T }) => (
  <div style={{ position:"fixed", inset:0, background:"#00000088", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
    <div style={{ background:T.card, borderRadius:16, border:`1px solid ${T.border}`, width:"100%", maxWidth:480, padding:24, boxShadow:`0 25px 50px ${T.shadow}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h3 style={{ margin:0, color:T.text, fontSize:16, fontWeight:700 }}>{title}</h3>
        <button onClick={onClose} style={{ background:"none", border:"none", color:T.muted, cursor:"pointer", fontSize:22 }}>×</button>
      </div>
      {children}
    </div>
  </div>
);

// ── LOADING / POS ────────────────────────────────────────────────────────────
function LoadingTab({ customers, transactions, T }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState("");
  const [monthYear, setMonthYear] = useState(() => { const d=new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}`; });
  const [saving, setSaving] = useState(false);
  const [lastTxn, setLastTxn] = useState(null);
  const amountRef = useRef(null);

  const matched = search.length >= 1
    ? customers.data.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.boxNumber||"").includes(search)).slice(0, 8)
    : [];

  const selectCustomer = (c) => { setSelected(c); setSearch(c.name); setAmount(""); setTimeout(()=>amountRef.current?.focus(), 80); };

  const processLoad = async () => {
    if (!selected || !amount || isNaN(parseFloat(amount))) return;
    setSaving(true);
    const txn = { id:`TXN-${Date.now()}`, customerId:selected.id, customerName:selected.name, boxNumber:selected.boxNumber, service:selected.service, amount:parseFloat(amount), monthYear, date:today(), time:nowTime() };
    await transactions.add(txn);
    setLastTxn(txn);
    setAmount(""); setSearch(""); setSelected(null);
    setSaving(false);
  };

  const todayTxns = transactions.data.filter(t => t.date === today());
  const todayTotal = todayTxns.reduce((s,t) => s+parseFloat(t.amount||0), 0);

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:20, alignItems:"start" }}>
      <div>
        <Card T={T} style={{ marginBottom:16 }}>
          <div style={{ fontSize:13, color:T.sub, marginBottom:12 }}>🔍 Search by customer name — no box number needed</div>
          <div style={{ position:"relative", marginBottom:12 }}>
            <input value={search} onChange={e=>{setSearch(e.target.value);setSelected(null);}} placeholder="Type customer name…" autoFocus
              style={{ width:"100%", boxSizing:"border-box", background:T.input, border:`2px solid ${selected?T.accent:T.border}`, borderRadius:10, padding:"13px 16px", color:T.text, fontSize:16, fontFamily:"inherit", outline:"none" }} />
            {search && !selected && matched.length > 0 && (
              <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:200, background:T.card, border:`1px solid ${T.border}`, borderRadius:10, marginTop:4, overflow:"hidden", boxShadow:`0 8px 24px ${T.shadow}` }}>
                {matched.map(c => (
                  <div key={c.id} onClick={()=>selectCustomer(c)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", cursor:"pointer", borderBottom:`1px solid ${T.border}` }}
                    onMouseEnter={e=>e.currentTarget.style.background=T.hover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div>
                      <div style={{ fontWeight:700, color:T.text, fontSize:14 }}>{c.name}</div>
                      <div style={{ fontSize:12, color:T.sub, fontFamily:"monospace", marginTop:2 }}>Box #{c.boxNumber}</div>
                    </div>
                    <ServiceBadge service={c.service} T={T} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {selected && (
            <div style={{ border:`2px solid ${T.accent}55`, borderRadius:12, padding:16, marginBottom:16, background:T.accent+"0a" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:20, fontWeight:800, color:T.text }}>{selected.name}</div>
                  <div style={{ fontFamily:"monospace", fontSize:14, color:T.accent, marginTop:4 }}>Box #{selected.boxNumber}</div>
                </div>
                <ServiceBadge service={selected.service} T={T} />
              </div>
              <div style={{ display:"flex", gap:10, alignItems:"flex-end", flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:120 }}>
                  <label style={{ fontSize:11, fontWeight:700, color:T.sub, letterSpacing:"0.1em", textTransform:"uppercase", display:"block", marginBottom:5 }}>Amount (₱)</label>
                  <input ref={amountRef} type="number" value={amount} onChange={e=>setAmount(e.target.value)} onKeyDown={e=>e.key==="Enter"&&processLoad()} placeholder="0.00"
                    style={{ background:T.input, border:`1px solid ${T.border}`, borderRadius:8, padding:"10px 12px", color:T.text, fontSize:22, fontWeight:800, fontFamily:"inherit", outline:"none", width:"100%", boxSizing:"border-box" }} />
                </div>
                <div style={{ flex:1, minWidth:140 }}>
                  <label style={{ fontSize:11, fontWeight:700, color:T.sub, letterSpacing:"0.1em", textTransform:"uppercase", display:"block", marginBottom:5 }}>Month</label>
                  <input type="month" value={monthYear} onChange={e=>setMonthYear(e.target.value)}
                    style={{ background:T.input, border:`1px solid ${T.border}`, borderRadius:8, padding:"10px 12px", color:T.text, fontSize:14, fontFamily:"inherit", outline:"none", width:"100%", boxSizing:"border-box" }} />
                </div>
                <Btn T={T} onClick={processLoad} disabled={!amount||saving} style={{ padding:"11px 28px", fontSize:15, fontWeight:800 }}>
                  {saving ? "Processing…" : "✓ LOAD"}
                </Btn>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:12 }}>
                {[15,17,20,22,24,25,26,27,28,29,30,31].map(a => (
                  <button key={a} onClick={()=>setAmount(String(a))} style={{ background:amount===String(a)?T.accent:T.hover, color:amount===String(a)?T.accentText:T.sub, border:`1px solid ${T.border}`, borderRadius:6, padding:"4px 12px", cursor:"pointer", fontWeight:600, fontSize:13, fontFamily:"inherit" }}>₱{a}</button>
                ))}
              </div>
            </div>
          )}

          {lastTxn && (
            <div style={{ background:"#14532d22", border:"1px solid #14532d55", borderRadius:10, padding:14, display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:24 }}>✅</span>
              <div>
                <div style={{ fontWeight:700, color:"#4ade80", fontSize:14 }}>₱{lastTxn.amount} loaded for {lastTxn.customerName}</div>
                <div style={{ fontSize:12, color:T.sub, fontFamily:"monospace" }}>{lastTxn.service} · Box #{lastTxn.boxNumber}</div>
              </div>
            </div>
          )}
        </Card>

        <Card T={T}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontWeight:700, color:T.text, fontSize:14 }}>Today's Transactions</div>
            <div style={{ fontWeight:800, color:T.accent, fontSize:20 }}>₱{todayTotal.toFixed(2)}</div>
          </div>
          {todayTxns.length === 0
            ? <div style={{ textAlign:"center", padding:20, color:T.muted, fontSize:13 }}>No transactions today</div>
            : <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {todayTxns.map(t => (
                  <div key={t.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", background:T.hover, borderRadius:8, gap:10 }}>
                    <div>
                      <div style={{ fontWeight:600, color:T.text, fontSize:13 }}>{t.customerName}</div>
                      <div style={{ fontSize:11, color:T.sub, fontFamily:"monospace" }}>{t.boxNumber} · {t.time}</div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <ServiceBadge service={t.service} T={T} />
                      <span style={{ fontWeight:800, color:T.accent, fontSize:16 }}>₱{t.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
          }
        </Card>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <Card T={T} style={{ textAlign:"center" }}>
          <div style={{ fontSize:28, fontWeight:800, color:T.accent }}>₱{todayTotal.toFixed(2)}</div>
          <div style={{ fontSize:12, color:T.sub }}>Total Today · {todayTxns.length} loads</div>
        </Card>
        {SERVICES.map(svc => {
          const col = SERVICE_COLOR[svc];
          const svcTxns = todayTxns.filter(t=>t.service===svc);
          const total = svcTxns.reduce((s,t)=>s+parseFloat(t.amount||0),0);
          const cusCount = customers.data.filter(c=>c.service===svc).length;
          return (
            <div key={svc} style={{ background:T.card, border:`1px solid ${col.bg}44`, borderLeft:`4px solid ${col.bg}`, borderRadius:10, padding:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                <ServiceBadge service={svc} T={T} />
                <span style={{ fontSize:18, fontWeight:800, color:col.bg }}>₱{total}</span>
              </div>
              <div style={{ fontSize:12, color:T.sub }}>{svcTxns.length} loads · {cusCount} customers</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── CUSTOMERS ──────────────────────────────────────────────────────────────
function CustomersTab({ customers, T }) {
  const [search, setSearch] = useState("");
  const [svcFilter, setSvcFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name:"", boxNumber:"", service:"GPINOY", notes:"" });

  const filtered = customers.data.filter(c => {
    const s = search.toLowerCase();
    return (c.name.toLowerCase().includes(s)||(c.boxNumber||"").includes(s)) && (svcFilter==="All"||c.service===svcFilter);
  });

  const openAdd = () => { setForm({ name:"", boxNumber:"", service:"GPINOY", notes:"" }); setShowAdd(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name:c.name, boxNumber:c.boxNumber, service:c.service, notes:c.notes||"" }); };

  const save = async () => {
    if (!form.name.trim()||!form.boxNumber.trim()) return;
    if (editing) { await customers.update(editing.id, { name:form.name.trim(), boxNumber:form.boxNumber.trim(), service:form.service, notes:form.notes.trim() }); setEditing(null); }
    else { await customers.add({ id:`CUS-${Date.now()}`, ...form, name:form.name.trim(), boxNumber:form.boxNumber.trim(), notes:form.notes.trim() }); setShowAdd(false); }
  };

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
        {["All",...SERVICES].map(s => {
          const col = s==="All"?null:SERVICE_COLOR[s];
          const active = svcFilter===s;
          const count = s==="All" ? customers.data.length : customers.data.filter(c=>c.service===s).length;
          return <button key={s} onClick={()=>setSvcFilter(s)} style={{ padding:"6px 14px", borderRadius:20, cursor:"pointer", fontWeight:700, fontSize:12, fontFamily:"inherit", background:active?(col?col.bg:T.accent):"transparent", color:active?"#fff":T.sub, border:`1px solid ${active?(col?col.bg:T.accent):T.border}` }}>{s} <span style={{ opacity:.7 }}>{count}</span></button>;
        })}
      </div>
      <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or box number…"
          style={{ flex:1, minWidth:200, background:T.input, border:`1px solid ${T.border}`, borderRadius:8, padding:"9px 14px", color:T.text, fontSize:13, fontFamily:"inherit", outline:"none" }} />
        <Btn T={T} onClick={openAdd}>+ Add Customer</Btn>
      </div>
      <div style={{ fontSize:12, color:T.sub, marginBottom:10 }}>{filtered.length} customers</div>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead><tr style={{ borderBottom:`2px solid ${T.border}` }}>
            {["Name","Box Number","Service","Notes",""].map(h=><th key={h} style={{ padding:"8px 10px", textAlign:"left", color:T.sub, fontWeight:700, fontSize:11, letterSpacing:"0.08em", textTransform:"uppercase" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} style={{ borderBottom:`1px solid ${T.border}` }} onMouseEnter={e=>e.currentTarget.style.background=T.hover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{ padding:"10px", color:T.text, fontWeight:600 }}>{c.name}</td>
                <td style={{ padding:"10px", fontFamily:"monospace", fontSize:12, color:T.accent }}>{c.boxNumber}</td>
                <td style={{ padding:"10px" }}><ServiceBadge service={c.service} T={T} /></td>
                <td style={{ padding:"10px", color:T.sub, fontSize:12 }}>{c.notes}</td>
                <td style={{ padding:"10px" }}>
                  <div style={{ display:"flex", gap:6 }}>
                    <Btn small T={T} variant="dark" onClick={()=>openEdit(c)}>✏️</Btn>
                    <Btn small T={T} variant="danger" onClick={()=>customers.remove(c.id)}>🗑</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length===0 && <div style={{ textAlign:"center", padding:30, color:T.muted }}>No customers found</div>}
      </div>

      {(showAdd||editing) && (
        <Modal title={editing?"Edit Customer":"Add Customer"} onClose={()=>{setShowAdd(false);setEditing(null);}} T={T}>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <Input T={T} label="Name *" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} placeholder="e.g. JUAN DELA CRUZ" autoFocus />
            <Input T={T} label="Box / Smart Card Number *" value={form.boxNumber} onChange={v=>setForm(f=>({...f,boxNumber:v}))} placeholder="e.g. 7740537035689935" />
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              <label style={{ fontSize:11, fontWeight:700, color:T.sub, letterSpacing:"0.1em", textTransform:"uppercase" }}>Service</label>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {SERVICES.map(s => {
                  const col = SERVICE_COLOR[s];
                  return <button key={s} onClick={()=>setForm(f=>({...f,service:s}))} style={{ padding:"8px 16px", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12, fontFamily:"inherit", background:form.service===s?col.bg:"transparent", color:form.service===s?"#fff":T.sub, border:`2px solid ${form.service===s?col.bg:T.border}` }}>{s}</button>;
                })}
              </div>
            </div>
            <Input T={T} label="Notes" value={form.notes} onChange={v=>setForm(f=>({...f,notes:v}))} placeholder="Optional…" />
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <Btn T={T} variant="ghost" onClick={()=>{setShowAdd(false);setEditing(null);}}>Cancel</Btn>
              <Btn T={T} onClick={save} disabled={!form.name.trim()||!form.boxNumber.trim()}>Save</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── HISTORY ────────────────────────────────────────────────────────────────
function HistoryTab({ transactions, T }) {
  const [search, setSearch] = useState("");
  const [svcFilter, setSvcFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  const filtered = transactions.data.filter(t => {
    const s = search.toLowerCase();
    return (t.customerName.toLowerCase().includes(s)||(t.boxNumber||"").includes(s))
      && (svcFilter==="All"||t.service===svcFilter)
      && (!dateFilter||t.date===dateFilter);
  });
  const total = filtered.reduce((s,t)=>s+parseFloat(t.amount||0),0);

  const byMonth = transactions.data.reduce((acc,t)=>{ const k=t.monthYear||t.date?.slice(0,7); if(k){acc[k]=(acc[k]||0)+parseFloat(t.amount||0);} return acc; },{});
  const monthEntries = Object.entries(byMonth).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,4);

  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or box number…"
          style={{ flex:1, minWidth:180, background:T.input, border:`1px solid ${T.border}`, borderRadius:8, padding:"9px 14px", color:T.text, fontSize:13, fontFamily:"inherit", outline:"none" }} />
        <select value={svcFilter} onChange={e=>setSvcFilter(e.target.value)}
          style={{ background:T.input, border:`1px solid ${T.border}`, borderRadius:8, padding:"9px 12px", color:T.sub, fontSize:13, fontFamily:"inherit", outline:"none" }}>
          <option value="All">All Services</option>
          {SERVICES.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <input type="date" value={dateFilter} onChange={e=>setDateFilter(e.target.value)}
          style={{ background:T.input, border:`1px solid ${T.border}`, borderRadius:8, padding:"9px 12px", color:T.text, fontSize:13, fontFamily:"inherit", outline:"none" }} />
      </div>

      <div style={{ display:"flex", gap:12, marginBottom:16, flexWrap:"wrap" }}>
        <Card T={T} style={{ flex:1, minWidth:120, textAlign:"center", padding:14 }}>
          <div style={{ fontSize:22, fontWeight:800, color:T.accent }}>₱{total.toFixed(2)}</div>
          <div style={{ fontSize:11, color:T.sub }}>{filtered.length} transactions</div>
        </Card>
        {monthEntries.map(([m,amt])=>(
          <Card T={T} key={m} style={{ flex:1, minWidth:100, textAlign:"center", padding:14 }}>
            <div style={{ fontSize:18, fontWeight:800, color:T.text }}>₱{amt.toFixed(0)}</div>
            <div style={{ fontSize:11, color:T.sub }}>{m}</div>
          </Card>
        ))}
      </div>

      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead><tr style={{ borderBottom:`2px solid ${T.border}` }}>
            {["Date","Time","Customer","Box Number","Service","Month","Amount",""].map(h=><th key={h} style={{ padding:"8px 10px", textAlign:"left", color:T.sub, fontWeight:700, fontSize:11, letterSpacing:"0.08em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map(t=>(
              <tr key={t.id} style={{ borderBottom:`1px solid ${T.border}` }}>
                <td style={{ padding:"10px", color:T.sub, fontSize:11, whiteSpace:"nowrap" }}>{t.date}</td>
                <td style={{ padding:"10px", color:T.muted, fontSize:11 }}>{t.time}</td>
                <td style={{ padding:"10px", color:T.text, fontWeight:600 }}>{t.customerName}</td>
                <td style={{ padding:"10px", fontFamily:"monospace", fontSize:12, color:T.accent }}>{t.boxNumber}</td>
                <td style={{ padding:"10px" }}><ServiceBadge service={t.service} T={T} /></td>
                <td style={{ padding:"10px", color:T.sub, fontSize:12 }}>{t.monthYear}</td>
                <td style={{ padding:"10px", fontWeight:800, color:T.text, fontSize:15 }}>₱{t.amount}</td>
                <td style={{ padding:"10px" }}><Btn small T={T} variant="danger" onClick={()=>transactions.remove(t.id)}>🗑</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length===0 && <div style={{ textAlign:"center", padding:30, color:T.muted }}>No transactions found</div>}
      </div>
    </div>
  );
}

// ── ROOT ────────────────────────────────────────────────────────────────────
const TABS = [
  { key:"loading",   label:"Loading / POS", icon:"⚡" },
  { key:"customers", label:"Customers",     icon:"👥" },
  { key:"history",   label:"History",       icon:"📋" },
];

export default function App() {
  const [tab, setTab] = useState("loading");
  const [dark, setDark] = useState(true);
  const T = dark ? DARK : LIGHT;
  const customers    = useCustomers();
  const transactions = useTransactions();

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif", color:T.text, transition:"background .2s" }}>
      <div style={{ background:T.card, borderBottom:`1px solid ${T.border}`, padding:"0 20px", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", gap:16, minHeight:56, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:22 }}>📡</span>
            <span style={{ fontWeight:800, fontSize:16, color:T.text }}>SatLoad</span>
            <span style={{ fontSize:11, color:T.sub, background:T.hover, padding:"2px 8px", borderRadius:10, border:`1px solid ${T.border}` }}>Reload Manager</span>
          </div>
          <div style={{ display:"flex", gap:2, marginLeft:"auto" }}>
            {TABS.map(t=>(
              <button key={t.key} onClick={()=>setTab(t.key)} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:8, background:tab===t.key?T.accent+"22":"transparent", border:tab===t.key?`1px solid ${T.accent}55`:"1px solid transparent", color:tab===t.key?T.accent:T.sub, fontFamily:"inherit", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          <button onClick={()=>setDark(!dark)} style={{ background:T.hover, border:`1px solid ${T.border}`, borderRadius:20, padding:"6px 14px", cursor:"pointer", fontFamily:"inherit", fontWeight:600, fontSize:13, color:T.sub }}>
            {dark ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </div>
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"24px 16px" }}>
        {tab==="loading"   && <LoadingTab   customers={customers} transactions={transactions} T={T} />}
        {tab==="customers" && <CustomersTab customers={customers} T={T} />}
        {tab==="history"   && <HistoryTab   transactions={transactions} T={T} />}
      </div>
    </div>
  );
}
