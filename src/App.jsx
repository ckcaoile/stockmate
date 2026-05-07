import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

// ── Helpers ───────────────────────────────────────────────────────────────────
const pad = (n, len = 2) => String(n).padStart(len, "0");

function genSerial(category = "ITM") {
  const d = new Date();
  const datePart = `${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const seq = pad(Math.floor(Math.random() * 9000) + 1000, 4);
  return `${category.slice(0, 3).toUpperCase()}-${datePart}-${seq}`;
}

function today() {
  return new Date().toISOString().split("T")[0];
}

const STATUS_COLOR = {
  available: "#22c55e",
  assigned:  "#f59e0b",
  loaded:    "#3b82f6",
  returned:  "#a78bfa",
};
const STATUS_LABELS = ["available", "assigned", "loaded", "returned"];

// ── Supabase hooks ────────────────────────────────────────────────────────────
function useInventory() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data: rows } = await supabase
      .from("inventory")
      .select("*")
      .order("created_at", { ascending: false });
    if (rows) setData(rows.map(r => ({
      id: r.id, name: r.name, category: r.category, notes: r.notes,
      status: r.status, customerId: r.customer_id, customerName: r.customer_name,
      dateAdded: r.date_added,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addItems = async (items) => {
    const rows = items.map(i => ({
      id: i.id, name: i.name, category: i.category, notes: i.notes,
      status: "available", customer_id: null, customer_name: null, date_added: today(),
    }));
    await supabase.from("inventory").insert(rows);
    await fetch();
  };

  const updateItem = async (id, patch) => {
    const row = {};
    if (patch.status      !== undefined) row.status        = patch.status;
    if (patch.customerId  !== undefined) row.customer_id   = patch.customerId;
    if (patch.customerName!== undefined) row.customer_name = patch.customerName;
    await supabase.from("inventory").update(row).eq("id", id);
    setData(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  };

  const deleteItem = async (id) => {
    await supabase.from("inventory").delete().eq("id", id);
    setData(prev => prev.filter(i => i.id !== id));
  };

  return { data, loading, addItems, updateItem, deleteItem };
}

function useCustomers() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data: rows } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    if (rows) setData(rows.map(r => ({
      id: r.id, name: r.name, phone: r.phone, address: r.address,
      notes: r.notes, dateAdded: r.date_added,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addCustomer = async (c) => {
    const row = { id: c.id, name: c.name, phone: c.phone, address: c.address, notes: c.notes, date_added: today() };
    await supabase.from("customers").insert([row]);
    setData(prev => [c, ...prev]);
  };

  const deleteCustomer = async (id) => {
    await supabase.from("customers").delete().eq("id", id);
    setData(prev => prev.filter(c => c.id !== id));
  };

  return { data, loading, addCustomer, deleteCustomer };
}

function usePricing() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data: rows } = await supabase
      .from("pricing")
      .select("*")
      .order("created_at", { ascending: false });
    if (rows) setData(rows.map(r => ({
      id: r.id, itemName: r.item_name, category: r.category,
      price: r.price, unit: r.unit, notes: r.notes, dateAdded: r.date_added,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addPrice = async (p) => {
    const row = { id: p.id, item_name: p.itemName, category: p.category, price: p.price, unit: p.unit, notes: p.notes, date_added: today() };
    await supabase.from("pricing").insert([row]);
    setData(prev => [p, ...prev]);
  };

  const deletePrice = async (id) => {
    await supabase.from("pricing").delete().eq("id", id);
    setData(prev => prev.filter(p => p.id !== id));
  };

  return { data, loading, addPrice, deletePrice };
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d={d} />
  </svg>
);
const ICONS = {
  box:      "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z",
  users:    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  truck:    "M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3 M9 21H4 M15 21h-2 M17 21h4 M16 10h5l3 3v4h-8Z M10 17a1 1 0 1 0 2 0 1 1 0 0 0-2 0M19 17a1 1 0 1 0 2 0 1 1 0 0 0-2 0",
  tag:      "M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l8-8a1 1 0 0 0 0-1.41Z M7 7h.01",
  plus:     "M12 5v14M5 12h14",
  search:   "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  trash:    "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  check:    "M20 6L9 17l-5-5",
  x:        "M18 6L6 18M6 6l12 12",
  dollar:   "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  clipboard:"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2 M9 2h6v4H9z",
  loader:   "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",
};

// ── Shared UI ─────────────────────────────────────────────────────────────────
const Badge = ({ status }) => (
  <span style={{
    display:"inline-block", padding:"2px 10px", borderRadius:20, fontSize:11,
    fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase",
    background: STATUS_COLOR[status]+"22", color: STATUS_COLOR[status],
    border:`1px solid ${STATUS_COLOR[status]}44`,
  }}>{status}</span>
);

const Btn = ({ children, onClick, variant="primary", small, style, disabled }) => {
  const v = {
    primary:{ background:"#f59e0b", color:"#1a1108" },
    ghost:  { background:"transparent", color:"#9ca3af", border:"1px solid #374151" },
    danger: { background:"#7f1d1d33", color:"#f87171", border:"1px solid #7f1d1d" },
    success:{ background:"#14532d33", color:"#4ade80", border:"1px solid #14532d" },
  };
  return (
    <button onClick={disabled?undefined:onClick} style={{
      display:"inline-flex", alignItems:"center", gap:6,
      padding: small?"6px 14px":"9px 20px", borderRadius:8, border:"none",
      cursor: disabled?"not-allowed":"pointer", fontFamily:"inherit",
      fontWeight:600, fontSize: small?12:13, letterSpacing:"0.04em",
      transition:"all .15s", opacity: disabled?0.5:1, ...v[variant], ...style,
    }}>{children}</button>
  );
};

const Input = ({ label, value, onChange, placeholder, type="text" }) => (
  <div style={{display:"flex",flexDirection:"column",gap:5}}>
    {label && <label style={{fontSize:11,fontWeight:700,color:"#6b7280",letterSpacing:"0.1em",textTransform:"uppercase"}}>{label}</label>}
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{background:"#111827",border:"1px solid #374151",borderRadius:8,padding:"9px 12px",
        color:"#f9fafb",fontSize:14,fontFamily:"inherit",outline:"none",width:"100%",boxSizing:"border-box"}} />
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div style={{display:"flex",flexDirection:"column",gap:5}}>
    {label && <label style={{fontSize:11,fontWeight:700,color:"#6b7280",letterSpacing:"0.1em",textTransform:"uppercase"}}>{label}</label>}
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{background:"#111827",border:"1px solid #374151",borderRadius:8,padding:"9px 12px",
        color:"#f9fafb",fontSize:14,fontFamily:"inherit",outline:"none",width:"100%"}}>
      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Card = ({children, style}) => (
  <div style={{background:"#111827",border:"1px solid #1f2937",borderRadius:12,padding:20,...style}}>
    {children}
  </div>
);

const Modal = ({title, onClose, children}) => (
  <div style={{position:"fixed",inset:0,background:"#00000090",zIndex:1000,
    display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div style={{background:"#1f2937",borderRadius:16,border:"1px solid #374151",
      width:"100%",maxWidth:480,padding:24,boxShadow:"0 25px 50px #000a"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h3 style={{margin:0,color:"#f9fafb",fontSize:16,fontWeight:700}}>{title}</h3>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#6b7280",cursor:"pointer",padding:4}}>
          <Icon d={ICONS.x} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const Spinner = () => (
  <div style={{textAlign:"center",padding:60,color:"#4b5563"}}>
    <Icon d={ICONS.loader} size={32} color="#f59e0b"
      style={{animation:"spin 1s linear infinite"}} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <p style={{marginTop:12,fontSize:13}}>Loading from database…</p>
  </div>
);

// ── INVENTORY TAB ─────────────────────────────────────────────────────────────
function InventoryTab({ inv, pricing }) {
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("all");
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({ name:"", category:"", notes:"", qty:1 });

  const addItems = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const items = Array.from({ length: Number(form.qty)||1 }, () => ({
      id: genSerial(form.category||"ITM"),
      name: form.name.trim(),
      category: form.category.trim()||"General",
      notes: form.notes.trim(),
    }));
    await inv.addItems(items);
    setForm({ name:"", category:"", notes:"", qty:1 });
    setSaving(false);
    setShowAdd(false);
  };

  const getPriceForItem = (item) => {
    const p = pricing.data.find(p =>
      p.category.toLowerCase() === item.category.toLowerCase() ||
      p.itemName.toLowerCase() === item.name.toLowerCase()
    );
    return p ? `$${parseFloat(p.price).toFixed(2)}` : "—";
  };

  const filtered = inv.data.filter(i => {
    const s = search.toLowerCase();
    return (i.name.toLowerCase().includes(s) || i.id.toLowerCase().includes(s) || (i.customerName||"").toLowerCase().includes(s))
      && (filter==="all" || i.status===filter);
  });

  if (inv.loading) return <Spinner />;

  return (
    <div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
        <div style={{flex:1,minWidth:180,position:"relative"}}>
          <Icon d={ICONS.search} size={14} color="#6b7280" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, serial, customer…"
            style={{width:"100%",boxSizing:"border-box",background:"#111827",border:"1px solid #374151",borderRadius:8,
              padding:"9px 12px 9px 34px",color:"#f9fafb",fontSize:13,fontFamily:"inherit",outline:"none"}} />
        </div>
        <select value={filter} onChange={e=>setFilter(e.target.value)}
          style={{background:"#111827",border:"1px solid #374151",borderRadius:8,padding:"9px 12px",color:"#9ca3af",fontSize:13,fontFamily:"inherit"}}>
          <option value="all">All Status</option>
          {STATUS_LABELS.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <Btn onClick={()=>setShowAdd(true)}><Icon d={ICONS.plus} size={14} /> Add Items</Btn>
      </div>

      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        {STATUS_LABELS.map(s => {
          const count = inv.data.filter(i=>i.status===s).length;
          return (
            <div key={s} style={{background:STATUS_COLOR[s]+"11",border:`1px solid ${STATUS_COLOR[s]}33`,
              borderRadius:10,padding:"8px 16px",flex:1,minWidth:80,textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:800,color:STATUS_COLOR[s]}}>{count}</div>
              <div style={{fontSize:11,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.08em"}}>{s}</div>
            </div>
          );
        })}
      </div>

      <div style={{overflowX:"auto"}}>
        {filtered.length===0 ? (
          <div style={{textAlign:"center",padding:40,color:"#4b5563"}}>
            <Icon d={ICONS.box} size={40} color="#374151" />
            <p style={{marginTop:12}}>No inventory items found</p>
          </div>
        ) : (
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead>
              <tr style={{borderBottom:"1px solid #1f2937"}}>
                {["Serial No.","Item Name","Category","Price","Status","Customer","Date",""].map(h=>(
                  <th key={h} style={{padding:"8px 10px",textAlign:"left",color:"#6b7280",fontWeight:600,fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item=>(
                <tr key={item.id} style={{borderBottom:"1px solid #1f2937"}}>
                  <td style={{padding:"10px",fontFamily:"monospace",fontSize:12,color:"#f59e0b",whiteSpace:"nowrap"}}>{item.id}</td>
                  <td style={{padding:"10px",color:"#f9fafb",fontWeight:600}}>{item.name}</td>
                  <td style={{padding:"10px",color:"#9ca3af"}}>{item.category}</td>
                  <td style={{padding:"10px",color:"#4ade80",fontWeight:600}}>{getPriceForItem(item)}</td>
                  <td style={{padding:"10px"}}><Badge status={item.status} /></td>
                  <td style={{padding:"10px",color:"#9ca3af"}}>{item.customerName||<span style={{color:"#374151"}}>—</span>}</td>
                  <td style={{padding:"10px",color:"#6b7280",whiteSpace:"nowrap",fontSize:11}}>{item.dateAdded}</td>
                  <td style={{padding:"10px"}}>
                    {item.status==="available" && (
                      <Btn small variant="danger" onClick={()=>inv.deleteItem(item.id)}>
                        <Icon d={ICONS.trash} size={12} />
                      </Btn>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <Modal title="Add Inventory Items" onClose={()=>setShowAdd(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Input label="Item Name *" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} placeholder="e.g. Generator 3.5kVA" />
            <Input label="Category / Type" value={form.category} onChange={v=>setForm(f=>({...f,category:v}))} placeholder="e.g. GEN, CYL, EQP…" />
            <Input label="Notes" value={form.notes} onChange={v=>setForm(f=>({...f,notes:v}))} placeholder="Optional notes…" />
            <Input label="Quantity to Add" type="number" value={form.qty} onChange={v=>setForm(f=>({...f,qty:v}))} />
            <div style={{background:"#0f172a",borderRadius:8,padding:10,fontSize:12,color:"#6b7280"}}>
              Serial format: <span style={{color:"#f59e0b",fontFamily:"monospace"}}>
                {(form.category||"ITM").slice(0,3).toUpperCase()}-{String(new Date().getFullYear()).slice(2)}{pad(new Date().getMonth()+1)}{pad(new Date().getDate())}-XXXX
              </span>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <Btn variant="ghost" onClick={()=>setShowAdd(false)}>Cancel</Btn>
              <Btn onClick={addItems} disabled={saving}>
                {saving?"Saving…":<><Icon d={ICONS.plus} size={14} /> Add {form.qty>1?`${form.qty} Items`:"Item"}</>}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── CUSTOMERS TAB ─────────────────────────────────────────────────────────────
function CustomersTab({ cus, inv }) {
  const [showAdd, setShowAdd]       = useState(false);
  const [search, setSearch]         = useState("");
  const [assigning, setAssigning]   = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [form, setForm]             = useState({ name:"", phone:"", address:"", notes:"" });

  const addCustomer = async () => {
    if (!form.name.trim()) return;
    const c = { id:`CUS-${Date.now()}`, name:form.name.trim(), phone:form.phone.trim(), address:form.address.trim(), notes:form.notes.trim(), dateAdded:today() };
    await cus.addCustomer(c);
    setForm({ name:"", phone:"", address:"", notes:"" });
    setShowAdd(false);
  };

  const deleteCustomer = async (cid) => {
    const items = inv.data.filter(i=>i.customerId===cid);
    await Promise.all(items.map(i=>inv.updateItem(i.id,{status:"available",customerId:null,customerName:null})));
    await cus.deleteCustomer(cid);
  };

  const openAssign = (cid) => { setAssigning(cid); setSelectedItems([]); };

  const confirmAssign = async () => {
    const customer = cus.data.find(c=>c.id===assigning);
    await Promise.all(selectedItems.map(id=>inv.updateItem(id,{status:"assigned",customerId:assigning,customerName:customer.name})));
    setAssigning(null); setSelectedItems([]);
  };

  const unassignItem = async (itemId) => {
    await inv.updateItem(itemId,{status:"available",customerId:null,customerName:null});
  };

  const filtered = cus.data.filter(c=>
    c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone||"").includes(search)
  );

  const availableItems = inv.data.filter(i=>i.status==="available");
  const assigningCustomer = cus.data.find(c=>c.id===assigning);

  if (cus.loading || inv.loading) return <Spinner />;

  return (
    <div>
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:180,position:"relative"}}>
          <Icon d={ICONS.search} size={14} color="#6b7280" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search customers…"
            style={{width:"100%",boxSizing:"border-box",background:"#111827",border:"1px solid #374151",borderRadius:8,
              padding:"9px 12px 9px 34px",color:"#f9fafb",fontSize:13,fontFamily:"inherit",outline:"none"}} />
        </div>
        <Btn onClick={()=>setShowAdd(true)}><Icon d={ICONS.plus} size={14} /> Add Customer</Btn>
      </div>

      {filtered.length===0 ? (
        <div style={{textAlign:"center",padding:40,color:"#4b5563"}}>
          <Icon d={ICONS.users} size={40} color="#374151" />
          <p style={{marginTop:12}}>No customers yet</p>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {filtered.map(c=>{
            const items = inv.data.filter(i=>i.customerId===c.id);
            return (
              <Card key={c.id}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
                  <div>
                    <div style={{fontSize:16,fontWeight:700,color:"#f9fafb"}}>{c.name}</div>
                    <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>{c.phone}{c.address&&` · ${c.address}`}</div>
                    {c.notes&&<div style={{fontSize:12,color:"#4b5563",marginTop:4,fontStyle:"italic"}}>{c.notes}</div>}
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <Btn small onClick={()=>openAssign(c.id)}><Icon d={ICONS.tag} size={12} /> Assign Items</Btn>
                    <Btn small variant="danger" onClick={()=>deleteCustomer(c.id)}><Icon d={ICONS.trash} size={12} /></Btn>
                  </div>
                </div>
                {items.length>0&&(
                  <div style={{marginTop:14,paddingTop:14,borderTop:"1px solid #1f2937"}}>
                    <div style={{fontSize:11,color:"#6b7280",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>
                      Assigned Items ({items.length})
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {items.map(item=>(
                        <div key={item.id} style={{display:"inline-flex",alignItems:"center",gap:6,
                          background:"#1f2937",border:"1px solid #374151",borderRadius:8,padding:"4px 10px"}}>
                          <span style={{fontFamily:"monospace",fontSize:11,color:"#f59e0b"}}>{item.id}</span>
                          <span style={{fontSize:12,color:"#9ca3af"}}>{item.name}</span>
                          <Badge status={item.status} />
                          {item.status!=="loaded"&&(
                            <button onClick={()=>unassignItem(item.id)} style={{background:"none",border:"none",color:"#6b7280",cursor:"pointer",padding:0,marginLeft:2}}>
                              <Icon d={ICONS.x} size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {showAdd&&(
        <Modal title="New Customer" onClose={()=>setShowAdd(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Input label="Full Name *" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} placeholder="e.g. Juan Dela Cruz" />
            <Input label="Phone" value={form.phone} onChange={v=>setForm(f=>({...f,phone:v}))} placeholder="+63 912 000 0000" />
            <Input label="Address" value={form.address} onChange={v=>setForm(f=>({...f,address:v}))} placeholder="Delivery address" />
            <Input label="Notes" value={form.notes} onChange={v=>setForm(f=>({...f,notes:v}))} placeholder="Any notes…" />
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <Btn variant="ghost" onClick={()=>setShowAdd(false)}>Cancel</Btn>
              <Btn onClick={addCustomer}><Icon d={ICONS.plus} size={14} /> Add Customer</Btn>
            </div>
          </div>
        </Modal>
      )}

      {assigning&&(
        <Modal title={`Assign Items → ${assigningCustomer?.name}`} onClose={()=>setAssigning(null)}>
          <div style={{marginBottom:10,fontSize:12,color:"#6b7280"}}>Select available items:</div>
          {availableItems.length===0 ? (
            <div style={{textAlign:"center",padding:20,color:"#4b5563",fontSize:13}}>No available items</div>
          ) : (
            <div style={{maxHeight:260,overflowY:"auto",display:"flex",flexDirection:"column",gap:6,marginBottom:14}}>
              {availableItems.map(item=>{
                const checked=selectedItems.includes(item.id);
                return (
                  <div key={item.id} onClick={()=>setSelectedItems(prev=>checked?prev.filter(x=>x!==item.id):[...prev,item.id])}
                    style={{display:"flex",alignItems:"center",gap:10,
                      background:checked?"#f59e0b11":"#0f172a",
                      border:`1px solid ${checked?"#f59e0b44":"#1f2937"}`,
                      borderRadius:8,padding:"8px 12px",cursor:"pointer"}}>
                    <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${checked?"#f59e0b":"#374151"}`,
                      background:checked?"#f59e0b":"transparent",flexShrink:0,
                      display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {checked&&<Icon d={ICONS.check} size={10} color="#1a1108" />}
                    </div>
                    <span style={{fontFamily:"monospace",fontSize:11,color:"#f59e0b"}}>{item.id}</span>
                    <span style={{fontSize:13,color:"#f9fafb",flex:1}}>{item.name}</span>
                    <span style={{fontSize:11,color:"#6b7280"}}>{item.category}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <Btn variant="ghost" onClick={()=>setAssigning(null)}>Cancel</Btn>
            <Btn onClick={confirmAssign} disabled={selectedItems.length===0}>
              <Icon d={ICONS.check} size={14} /> Assign {selectedItems.length>0?`(${selectedItems.length})`:""}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── LOADING TAB ───────────────────────────────────────────────────────────────
function LoadingTab({ inv, cus }) {
  const [search, setSearch]             = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [confirmLoad, setConfirmLoad]   = useState(null);

  const matchedCustomers = cus.data.filter(c=>
    c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone||"").includes(search)
  );

  const customerItems = selectedCustomer
    ? inv.data.filter(i=>i.customerId===selectedCustomer.id)
    : [];

  const markLoaded = async (itemId) => {
    await inv.updateItem(itemId,{status:"loaded"});
    setConfirmLoad(null);
  };

  const markAllLoaded = async () => {
    const toLoad = customerItems.filter(i=>i.status==="assigned");
    await Promise.all(toLoad.map(i=>inv.updateItem(i.id,{status:"loaded"})));
  };

  const pendingCount = customerItems.filter(i=>i.status==="assigned").length;

  if (inv.loading||cus.loading) return <Spinner />;

  return (
    <div>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:13,color:"#6b7280",marginBottom:8}}>Search by name or phone — no serial number needed</div>
        <div style={{position:"relative"}}>
          <Icon d={ICONS.search} size={16} color="#6b7280" style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}} />
          <input value={search} onChange={e=>{setSearch(e.target.value);setSelectedCustomer(null);}}
            placeholder="Type customer name or phone…"
            style={{width:"100%",boxSizing:"border-box",background:"#111827",border:"1px solid #374151",
              borderRadius:10,padding:"12px 12px 12px 42px",color:"#f9fafb",fontSize:15,fontFamily:"inherit",outline:"none"}} />
        </div>

        {search&&!selectedCustomer&&matchedCustomers.length>0&&(
          <div style={{background:"#1f2937",border:"1px solid #374151",borderRadius:10,marginTop:6,overflow:"hidden"}}>
            {matchedCustomers.map(c=>{
              const count=inv.data.filter(i=>i.customerId===c.id).length;
              return (
                <div key={c.id} onClick={()=>{setSelectedCustomer(c);setSearch(c.name);}}
                  style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                    padding:"12px 16px",cursor:"pointer",borderBottom:"1px solid #374151"}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:600,color:"#f9fafb"}}>{c.name}</div>
                    <div style={{fontSize:12,color:"#6b7280"}}>{c.phone}</div>
                  </div>
                  <div style={{fontSize:12,color:"#f59e0b",fontWeight:600}}>{count} item{count!==1?"s":""}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedCustomer&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
            <div>
              <h3 style={{margin:0,color:"#f9fafb",fontSize:18,fontWeight:800}}>{selectedCustomer.name}</h3>
              <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>{selectedCustomer.phone}{selectedCustomer.address&&` · ${selectedCustomer.address}`}</div>
            </div>
            {pendingCount>0&&(
              <Btn onClick={markAllLoaded} variant="success">
                <Icon d={ICONS.truck} size={14} /> Mark All Loaded ({pendingCount})
              </Btn>
            )}
          </div>

          {customerItems.length===0 ? (
            <Card style={{textAlign:"center",padding:30,color:"#4b5563"}}>No items assigned to this customer</Card>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {customerItems.map(item=>(
                <Card key={item.id} style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",padding:14}}>
                  <div style={{flex:1,minWidth:160}}>
                    <div style={{fontSize:15,fontWeight:700,color:"#f9fafb"}}>{item.name}</div>
                    <div style={{fontFamily:"monospace",fontSize:11,color:"#f59e0b",marginTop:2}}>{item.id}</div>
                    {item.notes&&<div style={{fontSize:12,color:"#6b7280",marginTop:4}}>{item.notes}</div>}
                  </div>
                  <Badge status={item.status} />
                  {item.status==="assigned"&&(
                    <Btn small variant="success" onClick={()=>setConfirmLoad(item)}>
                      <Icon d={ICONS.truck} size={12} /> Mark Loaded
                    </Btn>
                  )}
                  {item.status==="loaded"&&(
                    <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#4ade80"}}>
                      <Icon d={ICONS.check} size={14} color="#4ade80" /> Loaded
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedCustomer&&!search&&(
        <div style={{textAlign:"center",padding:"50px 20px",color:"#4b5563"}}>
          <Icon d={ICONS.truck} size={48} color="#374151" />
          <p style={{marginTop:16,fontSize:14}}>Search for a customer to view and confirm their items for loading</p>
        </div>
      )}

      {confirmLoad&&(
        <Modal title="Confirm Loading" onClose={()=>setConfirmLoad(null)}>
          <div style={{marginBottom:16,fontSize:14,color:"#9ca3af"}}>
            Mark as loaded for <strong style={{color:"#f9fafb"}}>{selectedCustomer?.name}</strong>?
          </div>
          <Card style={{marginBottom:16,padding:12}}>
            <div style={{fontWeight:700,color:"#f9fafb"}}>{confirmLoad.name}</div>
            <div style={{fontFamily:"monospace",fontSize:11,color:"#f59e0b",marginTop:4}}>{confirmLoad.id}</div>
          </Card>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <Btn variant="ghost" onClick={()=>setConfirmLoad(null)}>Cancel</Btn>
            <Btn variant="success" onClick={()=>markLoaded(confirmLoad.id)}><Icon d={ICONS.check} size={14} /> Confirm</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── PRICING TAB ───────────────────────────────────────────────────────────────
function PricingTab({ pricing }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ itemName:"", category:"", price:"", unit:"unit", notes:"" });

  const addPrice = async () => {
    if (!form.itemName.trim()||!form.price) return;
    await pricing.addPrice({
      id:`PRC-${Date.now()}`, itemName:form.itemName.trim(), category:form.category.trim(),
      price:parseFloat(form.price), unit:form.unit, notes:form.notes.trim(), dateAdded:today(),
    });
    setForm({ itemName:"", category:"", price:"", unit:"unit", notes:"" });
    setShowAdd(false);
  };

  if (pricing.loading) return <Spinner />;

  return (
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
        <Btn onClick={()=>setShowAdd(true)}><Icon d={ICONS.plus} size={14} /> Add Price</Btn>
      </div>

      {pricing.data.length===0 ? (
        <div style={{textAlign:"center",padding:40,color:"#4b5563"}}>
          <Icon d={ICONS.dollar} size={40} color="#374151" />
          <p style={{marginTop:12}}>No pricing set up yet</p>
        </div>
      ) : (
        <div style={{display:"grid",gap:10,gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))"}}>
          {pricing.data.map(p=>(
            <Card key={p.id} style={{position:"relative"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:"#f9fafb"}}>{p.itemName}</div>
                  {p.category&&<div style={{fontSize:11,color:"#6b7280",marginTop:2,textTransform:"uppercase",letterSpacing:"0.08em"}}>{p.category}</div>}
                </div>
                <button onClick={()=>pricing.deletePrice(p.id)} style={{background:"none",border:"none",color:"#6b7280",cursor:"pointer"}}>
                  <Icon d={ICONS.trash} size={14} />
                </button>
              </div>
              <div style={{marginTop:14,display:"flex",alignItems:"baseline",gap:4}}>
                <span style={{fontSize:28,fontWeight:800,color:"#4ade80"}}>${parseFloat(p.price).toFixed(2)}</span>
                <span style={{fontSize:12,color:"#6b7280"}}>/ {p.unit}</span>
              </div>
              {p.notes&&<div style={{fontSize:12,color:"#4b5563",marginTop:8,fontStyle:"italic"}}>{p.notes}</div>}
            </Card>
          ))}
        </div>
      )}

      {showAdd&&(
        <Modal title="Add Pricing" onClose={()=>setShowAdd(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Input label="Item Name *" value={form.itemName} onChange={v=>setForm(f=>({...f,itemName:v}))} placeholder="e.g. Generator 3.5kVA" />
            <Input label="Category (matches inventory)" value={form.category} onChange={v=>setForm(f=>({...f,category:v}))} placeholder="e.g. GEN, CYL…" />
            <Input label="Price ($) *" type="number" value={form.price} onChange={v=>setForm(f=>({...f,price:v}))} placeholder="0.00" />
            <Select label="Unit" value={form.unit} onChange={v=>setForm(f=>({...f,unit:v}))}
              options={["unit","day","week","month","kg","litre"].map(u=>({value:u,label:u}))} />
            <Input label="Notes" value={form.notes} onChange={v=>setForm(f=>({...f,notes:v}))} placeholder="Optional…" />
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <Btn variant="ghost" onClick={()=>setShowAdd(false)}>Cancel</Btn>
              <Btn onClick={addPrice}><Icon d={ICONS.plus} size={14} /> Add Price</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key:"inventory", label:"Inventory", icon:ICONS.box },
  { key:"customers", label:"Customers", icon:ICONS.users },
  { key:"loading",   label:"Loading",   icon:ICONS.truck },
  { key:"pricing",   label:"Pricing",   icon:ICONS.dollar },
];

export default function App() {
  const [tab, setTab] = useState("inventory");
  const inv     = useInventory();
  const cus     = useCustomers();
  const pricing = usePricing();

  return (
    <div style={{minHeight:"100vh",background:"#0a0f1a",fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif",color:"#f9fafb"}}>
      <div style={{background:"#0d1117",borderBottom:"1px solid #1f2937",padding:"0 20px",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:900,margin:"0 auto",display:"flex",alignItems:"center",gap:16,minHeight:56}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{background:"#f59e0b",borderRadius:8,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Icon d={ICONS.clipboard} size={16} color="#1a1108" />
            </div>
            <span style={{fontWeight:800,fontSize:15,letterSpacing:"-0.02em",color:"#f9fafb"}}>StockMate</span>
          </div>
          <div style={{display:"flex",gap:2,marginLeft:"auto"}}>
            {TABS.map(t=>(
              <button key={t.key} onClick={()=>setTab(t.key)} style={{
                display:"flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:8,
                background:tab===t.key?"#f59e0b18":"transparent",
                border:tab===t.key?"1px solid #f59e0b44":"1px solid transparent",
                color:tab===t.key?"#f59e0b":"#6b7280",
                fontFamily:"inherit",fontWeight:600,fontSize:13,cursor:"pointer",letterSpacing:"0.02em",
              }}>
                <Icon d={t.icon} size={14} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:900,margin:"0 auto",padding:"24px 16px"}}>
        {tab==="inventory" && <InventoryTab inv={inv} pricing={pricing} />}
        {tab==="customers" && <CustomersTab cus={cus} inv={inv} />}
        {tab==="loading"   && <LoadingTab   inv={inv} cus={cus} />}
        {tab==="pricing"   && <PricingTab   pricing={pricing} />}
      </div>
    </div>
  );
}
