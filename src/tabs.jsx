import { useState, useRef } from "react";
import { supabase } from "./supabase.js";
import { SvcBadge, Btn, Inp, Sel, Card, Modal, Receipt, SERVICES, SVC_COL, uid, peso, todayStr, nowTime, useSerials } from "./core.jsx";

// ═══════════════════════════════════════════════════════════════════
// PRODUCTS TAB
// ═══════════════════════════════════════════════════════════════════
function SerialsPanel({ product, T, onClose }) {
  const serials = useSerials(product.id);
  const [scanValue, setScanValue] = useState("");
  const scanRef = useRef(null);

  const handleScan = async () => {
    if (!scanValue.trim()) return;
    await serials.add(scanValue.trim(), product.name, product.id);
    setScanValue("");
    scanRef.current?.focus();
  };

  return (
    <Modal title={`Serials — ${product.name}`} onClose={onClose} T={T} wide>
      <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
        <div style={{ display:"flex",gap:10,alignItems:"flex-end" }}>
          <div style={{ flex:1 }}>
            <Inp T={T} label="Scan or type serial number" value={scanValue} onChange={setScanValue} placeholder="Scan barcode or type serial…" autoFocus
              onKeyDown={e=>{if(e.key==="Enter"){handleScan();}}} />
          </div>
          <Btn T={T} onClick={handleScan} disabled={!scanValue.trim()}>Add Serial</Btn>
        </div>
        <div style={{ fontSize:13,color:T.sub }}>
          Available: <strong style={{ color:"#4ade80" }}>{serials.data.filter(s=>s.status==="available").length}</strong> · 
          Sold: <strong style={{ color:"#f87171" }}>{serials.data.filter(s=>s.status==="sold").length}</strong>
        </div>
        <div style={{ maxHeight:350,overflowY:"auto" }}>
          {serials.data.length===0
            ? <div style={{ textAlign:"center",padding:20,color:T.muted }}>No serials yet — scan to add</div>
            : <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
                <thead><tr style={{ borderBottom:`2px solid ${T.border}` }}>
                  {["Serial","Status","Customer","Date Added",""].map(h=><th key={h} style={{ padding:"6px 10px",textAlign:"left",color:T.sub,fontWeight:700,fontSize:11,textTransform:"uppercase",letterSpacing:"0.08em" }}>{h}</th>)}
                </tr></thead>
                <tbody>{serials.data.map(s=>(
                  <tr key={s.id} style={{ borderBottom:`1px solid ${T.border}` }}>
                    <td style={{ padding:"8px 10px",fontFamily:"monospace",fontSize:12,color:T.accent }}>{s.serial}</td>
                    <td style={{ padding:"8px 10px" }}>
                      <span style={{ display:"inline-block",padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:s.status==="available"?"#14532d33":"#7f1d1d33",color:s.status==="available"?"#4ade80":"#f87171",border:`1px solid ${s.status==="available"?"#14532d55":"#7f1d1d55"}` }}>{s.status}</span>
                    </td>
                    <td style={{ padding:"8px 10px",color:T.sub,fontSize:12 }}>{s.customerName||"—"}</td>
                    <td style={{ padding:"8px 10px",color:T.muted,fontSize:11 }}>{s.dateAdded}</td>
                    <td style={{ padding:"8px 10px" }}>
                      {s.status==="available" && <Btn T={T} sm v="red" onClick={()=>serials.remove(s.id)}>🗑</Btn>}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
          }
        </div>
      </div>
    </Modal>
  );
}

export function ProductsTab({ products, T }) {
  const [search, setSearch]   = useState("");
  const [catFilter, setCat]   = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewSerials, setViewSerials] = useState(null);
  const [form, setForm] = useState({ name:"",barcode:"",category:"General",price:"",cost:"",stock:"",hasSerial:false,notes:"" });

  const cats = ["All", ...new Set(products.data.map(p=>p.category))];
  const filtered = products.data.filter(p => {
    const s=search.toLowerCase();
    return (p.name.toLowerCase().includes(s)||(p.barcode||"").includes(s)) && (catFilter==="All"||p.category===catFilter);
  });

  const openAdd  = () => { setForm({ name:"",barcode:"",category:"General",price:"",cost:"",stock:"0",hasSerial:false,notes:"" }); setShowAdd(true); };
  const openEdit = (p) => { setEditing(p); setForm({ name:p.name,barcode:p.barcode,category:p.category,price:String(p.price),cost:String(p.cost),stock:String(p.stock),hasSerial:p.hasSerial,notes:p.notes }); };

  const save = async () => {
    if (!form.name.trim()||!form.price) return;
    const d = { name:form.name.trim(),barcode:form.barcode.trim(),category:form.category.trim()||"General",price:parseFloat(form.price),cost:parseFloat(form.cost||0),stock:form.hasSerial?0:parseInt(form.stock||0),hasSerial:form.hasSerial,notes:form.notes.trim() };
    if (editing) { await products.update(editing.id,d); setEditing(null); }
    else { await products.add({ id:`PRD-${uid()}`,...d }); setShowAdd(false); }
  };

  const totalValue = products.data.reduce((s,p)=>s+p.price*p.stock,0);

  return (
    <div>
      {/* Stats */}
      <div style={{ display:"flex",gap:12,marginBottom:16,flexWrap:"wrap" }}>
        <Card T={T} style={{ flex:1,minWidth:120,padding:14,textAlign:"center" }}>
          <div style={{ fontSize:22,fontWeight:800,color:T.accent }}>{products.data.length}</div>
          <div style={{ fontSize:11,color:T.sub }}>Products</div>
        </Card>
        <Card T={T} style={{ flex:1,minWidth:120,padding:14,textAlign:"center" }}>
          <div style={{ fontSize:22,fontWeight:800,color:T.text }}>{products.data.reduce((s,p)=>s+p.stock,0)}</div>
          <div style={{ fontSize:11,color:T.sub }}>Total Units</div>
        </Card>
        <Card T={T} style={{ flex:1,minWidth:140,padding:14,textAlign:"center" }}>
          <div style={{ fontSize:22,fontWeight:800,color:"#4ade80" }}>{peso(totalValue)}</div>
          <div style={{ fontSize:11,color:T.sub }}>Inventory Value</div>
        </Card>
      </div>

      {/* Filters */}
      <div style={{ display:"flex",gap:8,marginBottom:12,flexWrap:"wrap" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products or barcode…"
          style={{ flex:1,minWidth:180,background:T.input,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 14px",color:T.text,fontSize:13,fontFamily:"inherit",outline:"none" }} />
        <select value={catFilter} onChange={e=>setCat(e.target.value)} style={{ background:T.input,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",color:T.sub,fontSize:13,fontFamily:"inherit",outline:"none" }}>
          {cats.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <Btn T={T} onClick={openAdd}>+ Add Product</Btn>
      </div>

      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
          <thead><tr style={{ borderBottom:`2px solid ${T.border}` }}>
            {["Name","Barcode","Category","Price","Cost","Stock","Serials",""].map(h=><th key={h} style={{ padding:"8px 10px",textAlign:"left",color:T.sub,fontWeight:700,fontSize:11,textTransform:"uppercase",letterSpacing:"0.08em",whiteSpace:"nowrap" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map(p=>(
              <tr key={p.id} style={{ borderBottom:`1px solid ${T.border}` }} onMouseEnter={e=>e.currentTarget.style.background=T.hover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{ padding:"10px",color:T.text,fontWeight:600 }}>{p.name}</td>
                <td style={{ padding:"10px",fontFamily:"monospace",fontSize:11,color:T.sub }}>{p.barcode||"—"}</td>
                <td style={{ padding:"10px",color:T.sub,fontSize:12 }}>{p.category}</td>
                <td style={{ padding:"10px",fontWeight:700,color:T.accent }}>{peso(p.price)}</td>
                <td style={{ padding:"10px",color:T.muted,fontSize:12 }}>{peso(p.cost)}</td>
                <td style={{ padding:"10px" }}>
                  <span style={{ fontWeight:700,color:p.stock===0?"#f87171":p.stock<5?"#f59e0b":"#4ade80" }}>{p.stock}</span>
                </td>
                <td style={{ padding:"10px" }}>
                  {p.hasSerial ? <Btn T={T} sm v="dark" onClick={()=>setViewSerials(p)}>📋 Manage</Btn> : <span style={{ color:T.muted,fontSize:11 }}>—</span>}
                </td>
                <td style={{ padding:"10px" }}>
                  <div style={{ display:"flex",gap:6 }}>
                    <Btn T={T} sm v="dark" onClick={()=>openEdit(p)}>✏️</Btn>
                    <Btn T={T} sm v="red" onClick={()=>products.remove(p.id)}>🗑</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length===0 && <div style={{ textAlign:"center",padding:30,color:T.muted }}>No products found</div>}
      </div>

      {viewSerials && <SerialsPanel product={viewSerials} T={T} onClose={()=>setViewSerials(null)} />}

      {(showAdd||editing) && (
        <Modal title={editing?"Edit Product":"Add Product"} onClose={()=>{setShowAdd(false);setEditing(null);}} T={T}>
          <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
            <Inp T={T} label="Product Name *" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} placeholder="e.g. Remote Control" autoFocus />
            <Inp T={T} label="Barcode / SKU" value={form.barcode} onChange={v=>setForm(f=>({...f,barcode:v}))} placeholder="Scan barcode or type…" />
            <div style={{ display:"flex",gap:10 }}>
              <div style={{ flex:1 }}><Inp T={T} label="Category" value={form.category} onChange={v=>setForm(f=>({...f,category:v}))} placeholder="e.g. Accessories" /></div>
              <div style={{ flex:1 }}><Inp T={T} label="Selling Price ₱ *" value={form.price} onChange={v=>setForm(f=>({...f,price:v}))} type="number" /></div>
              <div style={{ flex:1 }}><Inp T={T} label="Cost ₱" value={form.cost} onChange={v=>setForm(f=>({...f,cost:v}))} type="number" /></div>
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:12,padding:"12px",background:T.hover,borderRadius:8 }}>
              <input type="checkbox" checked={form.hasSerial} onChange={e=>setForm(f=>({...f,hasSerial:e.target.checked}))} style={{ width:16,height:16,cursor:"pointer" }} />
              <div>
                <div style={{ fontWeight:600,color:T.text,fontSize:13 }}>Track by Serial Number</div>
                <div style={{ fontSize:11,color:T.sub }}>Enable for boxes, specific units that need individual tracking</div>
              </div>
            </div>
            {!form.hasSerial && <Inp T={T} label="Stock Quantity" value={form.stock} onChange={v=>setForm(f=>({...f,stock:v}))} type="number" placeholder="0" />}
            <Inp T={T} label="Notes" value={form.notes} onChange={v=>setForm(f=>({...f,notes:v}))} placeholder="Optional notes…" />
            <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
              <Btn T={T} v="ghost" onClick={()=>{setShowAdd(false);setEditing(null);}}>Cancel</Btn>
              <Btn T={T} onClick={save} disabled={!form.name.trim()||!form.price}>Save Product</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LOADING TAB (quick satellite reload)
// ═══════════════════════════════════════════════════════════════════
export function LoadingTab({ customers, sales, transactions, profile, T }) {
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState(null);
  const [amount, setAmount]     = useState("");
  const [monthYear, setMonthYear] = useState(() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; });
  const [saving, setSaving]     = useState(false);
  const [lastTxn, setLastTxn]   = useState(null);
  const [override, setOverride] = useState(false);
  const [manualName, setManualName]   = useState("");
  const [manualBox, setManualBox]     = useState("");
  const [manualSvc, setManualSvc]     = useState("GPINOY");

  const matched = search.length>=1 ? customers.data.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||(c.boxNumber||"").includes(search)).slice(0,8) : [];

  const selectCustomer = (c) => { setSelected(c); setSearch(c.name); setAmount(""); };

  const processLoad = async () => {
    const name = override ? manualName.trim() : selected?.name;
    const box  = override ? manualBox.trim()  : selected?.boxNumber;
    const svc  = override ? manualSvc         : selected?.service;
    let   cid  = override ? null              : selected?.id;
    if (!name||!amount) return;
    setSaving(true);

    // Auto-save new customer to DB in manual/override mode
    if (override && name) {
      const newId = `CUS-${Date.now()}`;
      const { data:existing } = await supabase.from("customers").select("id").eq("name", name).maybeSingle();
      if (!existing) {
        await supabase.from("customers").insert([{ id:newId, name, box_number:box||"", service:svc, date_added:new Date().toISOString().split("T")[0] }]);
        cid = newId;
        await customers.load(); // refresh list
      } else {
        cid = existing.id;
      }
    }
    const saleId = `SALE-${uid()}`;
    const saleData = { id:saleId,customerId:cid,customerName:name,cashierName:profile?.name||"Staff",subtotal:parseFloat(amount),discount:0,total:parseFloat(amount),paymentMethod:"cash",amountTendered:parseFloat(amount),changeAmount:0 };
    const cartItem = [{ id:uid(),type:"satellite",name:`${svc} Load – ${name}`,price:parseFloat(amount),qty:1,service:svc,boxNumber:box,monthYear,satCustomerId:cid,satCustomerName:name }];
    await sales.createSale(saleData, cartItem, []);
    await transactions.load(); // refresh satellite transactions
    setLastTxn({ customerName:name,service:svc,boxNumber:box,amount:parseFloat(amount) });
    setAmount(""); setSearch(""); setSelected(null); setManualName(""); setManualBox("");
    setSaving(false);
  };

  // Only show satellite transactions in this tab
  const todayTxns  = transactions.data.filter(t => t.date === todayStr());
  const todayTotal = todayTxns.reduce((s,x) => s + x.amount, 0);

  return (
    <div style={{ display:"grid",gridTemplateColumns:"1fr 320px",gap:20,alignItems:"start" }}>
      <div>
        <Card T={T} style={{ marginBottom:16 }}>

          {/* Toggle: registered vs override */}
          <div style={{ display:"flex",gap:0,marginBottom:16,background:T.hover,borderRadius:10,padding:3 }}>
            <button onClick={()=>{setOverride(false);setSearch("");setSelected(null);}} style={{ flex:1,padding:"8px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,background:!override?T.card:"transparent",color:!override?T.text:T.sub,boxShadow:!override?`0 1px 4px ${T.sh}`:"none" }}>
              👥 Registered Customer
            </button>
            <button onClick={()=>{setOverride(true);setSearch("");setSelected(null);}} style={{ flex:1,padding:"8px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,background:override?T.card:"transparent",color:override?T.text:T.sub,boxShadow:override?`0 1px 4px ${T.sh}`:"none" }}>
              ✏️ Manual / Walk-in
            </button>
          </div>

          {!override ? (
            <>
              <div style={{ fontSize:13,color:T.sub,marginBottom:12 }}>🔍 Search customer — no box number needed</div>
              <div style={{ position:"relative",marginBottom:12 }}>
                <input value={search} onChange={e=>{setSearch(e.target.value);setSelected(null);}} placeholder="Customer name or box number…" autoFocus
                  style={{ width:"100%",boxSizing:"border-box",background:T.input,border:`2px solid ${selected?T.accent:T.border}`,borderRadius:10,padding:"13px 16px",color:T.text,fontSize:16,fontFamily:"inherit",outline:"none" }} />
                {search&&!selected&&matched.length>0&&(
                  <div style={{ position:"absolute",top:"100%",left:0,right:0,zIndex:100,background:T.card,border:`1px solid ${T.border}`,borderRadius:10,marginTop:4,overflow:"hidden",boxShadow:`0 8px 24px ${T.sh}` }}>
                    {matched.map(c=>(
                      <div key={c.id} onClick={()=>selectCustomer(c)} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",cursor:"pointer",borderBottom:`1px solid ${T.border}` }}
                        onMouseEnter={e=>e.currentTarget.style.background=T.hover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <div><div style={{ fontWeight:700,color:T.text,fontSize:14 }}>{c.name}</div><div style={{ fontSize:12,color:T.sub,fontFamily:"monospace" }}>Box #{c.boxNumber}</div></div>
                        <SvcBadge service={c.service} T={T} />
                      </div>
                    ))}
                  </div>
                )}
                {search&&!selected&&matched.length===0&&search.length>=2&&(
                  <div style={{ marginTop:8,fontSize:12,color:T.muted,padding:"8px 12px",background:T.hover,borderRadius:8 }}>
                    No match found. Switch to <strong style={{ color:T.accent,cursor:"pointer" }} onClick={()=>setOverride(true)}>Manual / Walk-in</strong> to load without a registered account.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display:"flex",flexDirection:"column",gap:12,marginBottom:12 }}>
              <div style={{ fontSize:13,color:T.sub }}>✏️ Enter details manually — useful for walk-ins or transferring old records</div>
              <Inp T={T} label="Customer Name *" value={manualName} onChange={setManualName} placeholder="e.g. JUAN DELA CRUZ" autoFocus />
              <Inp T={T} label="Box / Smart Card Number" value={manualBox} onChange={setManualBox} placeholder="e.g. 7740537035689935" />
              <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
                <label style={{ fontSize:11,fontWeight:700,color:T.sub,letterSpacing:"0.1em",textTransform:"uppercase" }}>Service</label>
                <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                  {SERVICES.map(s=>{const col=SVC_COL[s];return(
                    <button key={s} onClick={()=>setManualSvc(s)} style={{ padding:"8px 14px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:"inherit",background:manualSvc===s?col.bg:"transparent",color:manualSvc===s?"#fff":T.sub,border:`2px solid ${manualSvc===s?col.bg:T.border}` }}>{s}</button>
                  );})}
                </div>
              </div>
            </div>
          )}

          {/* Amount + Month + Load button — shown when customer is ready */}
          {(selected || (override && manualName.trim())) && (
            <div style={{ border:`2px solid ${T.accent}55`,borderRadius:12,padding:16,marginBottom:16,background:T.accent+"0a" }}>
              {selected && (
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
                  <div><div style={{ fontSize:18,fontWeight:800,color:T.text }}>{selected.name}</div><div style={{ fontFamily:"monospace",fontSize:13,color:T.accent,marginTop:2 }}>Box #{selected.boxNumber}</div></div>
                  <SvcBadge service={selected.service} T={T} />
                </div>
              )}
              <div style={{ display:"flex",gap:10,alignItems:"flex-end",flexWrap:"wrap" }}>
                <div style={{ flex:1,minWidth:120 }}>
                  <Inp T={T} label="Amount (₱)" value={amount} onChange={setAmount} type="number" placeholder="0" onKeyDown={e=>e.key==="Enter"&&processLoad()} autoFocus={override} />
                </div>
                <div style={{ flex:1,minWidth:140 }}>
                  <div style={{ fontSize:11,fontWeight:700,color:T.sub,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4 }}>Month</div>
                  <input type="month" value={monthYear} onChange={e=>setMonthYear(e.target.value)} style={{ background:T.input,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",color:T.text,fontSize:14,fontFamily:"inherit",outline:"none",width:"100%",boxSizing:"border-box" }} />
                </div>
                <Btn T={T} onClick={processLoad} disabled={!amount||saving} style={{ padding:"11px 28px",fontSize:15,fontWeight:800 }}>{saving?"…":"✓ LOAD"}</Btn>
              </div>
              <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginTop:12 }}>
                {[99,100,175,200,300,450,500,600,800,1000].map(a=>(
                  <button key={a} onClick={()=>setAmount(String(a))} style={{ background:amount===String(a)?T.accent:T.hover,color:amount===String(a)?T.atext:T.sub,border:`1px solid ${T.border}`,borderRadius:6,padding:"4px 12px",cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:"inherit" }}>₱{a}</button>
                ))}
              </div>
            </div>
          )}

          {lastTxn&&(
            <div style={{ background:"#14532d22",border:"1px solid #14532d55",borderRadius:10,padding:14,display:"flex",alignItems:"center",gap:12 }}>
              <span style={{ fontSize:24 }}>✅</span>
              <div><div style={{ fontWeight:700,color:"#4ade80",fontSize:14 }}>₱{lastTxn.amount} loaded for {lastTxn.customerName}</div><div style={{ fontSize:12,color:T.sub,fontFamily:"monospace" }}>{lastTxn.service} · Box #{lastTxn.boxNumber}</div></div>
            </div>
          )}
        </Card>

        <Card T={T}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
            <div style={{ fontWeight:700,color:T.text,fontSize:14 }}>Today's Loads</div>
            <div style={{ fontWeight:800,color:T.accent,fontSize:20 }}>{peso(todayTotal)}</div>
          </div>
          {todayTxns.length===0
            ? <div style={{ textAlign:"center",padding:20,color:T.muted,fontSize:13 }}>No loads today</div>
            : <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {todayTxns.map(t=>(
                  <div key={t.id} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:T.hover,borderRadius:8,gap:10 }}>
                    <div>
                      <div style={{ fontWeight:600,color:T.text,fontSize:13 }}>{t.customerName}</div>
                      <div style={{ fontSize:11,color:T.sub,fontFamily:"monospace" }}>
                        {t.service} · {t.boxNumber && `Box #${t.boxNumber} · `}{t.time}
                      </div>
                    </div>
                    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                      {t.service && <SvcBadge service={t.service} T={T} />}
                      <div style={{ fontWeight:800,color:T.accent,fontSize:16 }}>{peso(t.amount)}</div>
                    </div>
                  </div>
                ))}
              </div>
          }
        </Card>
      </div>

      <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
        <Card T={T} style={{ textAlign:"center" }}><div style={{ fontSize:28,fontWeight:800,color:T.accent }}>{peso(todayTotal)}</div><div style={{ fontSize:12,color:T.sub }}>Total Today · {todayTxns.length} loads</div></Card>
        {SERVICES.map(svc=>{const col=SVC_COL[svc];const cnt=customers.data.filter(c=>c.service===svc).length;return(
          <div key={svc} style={{ background:T.card,border:`1px solid ${col.bg}44`,borderLeft:`4px solid ${col.bg}`,borderRadius:10,padding:14 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4 }}><SvcBadge service={svc} T={T} /><span style={{ fontSize:12,color:T.sub }}>{cnt} customers</span></div>
          </div>
        );})}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CUSTOMERS TAB
// ═══════════════════════════════════════════════════════════════════
export function CustomersTab({ customers, sales, T }) {
  const [search, setSearch]   = useState("");
  const [svcFilter, setSvc]   = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewHistory, setViewHistory] = useState(null);
  const [form, setForm] = useState({ name:"",boxNumber:"",service:"GPINOY",phone:"",address:"",notes:"" });

  const filtered = customers.data.filter(c=>{
    const s=search.toLowerCase();
    return (c.name.toLowerCase().includes(s)||(c.boxNumber||"").includes(s)||(c.phone||"").includes(s))&&(svcFilter==="All"||c.service===svcFilter);
  });

  const save = async () => {
    if (!form.name.trim()) return;
    const d = { name:form.name.trim(),boxNumber:form.boxNumber.trim(),service:form.service,phone:form.phone.trim(),address:form.address.trim(),notes:form.notes.trim() };
    if (editing) { await customers.update(editing.id,d); setEditing(null); }
    else { await customers.add({ id:`CUS-${uid()}`,...d }); setShowAdd(false); }
  };

  const openEdit = (c) => { setEditing(c); setForm({ name:c.name,boxNumber:c.boxNumber,service:c.service,phone:c.phone||"",address:c.address||"",notes:c.notes||"" }); };
  const openAdd  = () => { setForm({ name:"",boxNumber:"",service:"GPINOY",phone:"",address:"",notes:"" }); setShowAdd(true); };

  return (
    <div>
      <div style={{ display:"flex",gap:8,marginBottom:12,flexWrap:"wrap" }}>
        {["All",...SERVICES].map(s=>{const col=s==="All"?null:SVC_COL[s];const cnt=s==="All"?customers.data.length:customers.data.filter(c=>c.service===s).length;const active=svcFilter===s;return(
          <button key={s} onClick={()=>setSvc(s)} style={{ padding:"6px 14px",borderRadius:20,cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:"inherit",background:active?(col?col.bg:"#374151"):"transparent",color:active?"#fff":T.sub,border:`1px solid ${active?(col?col.bg:T.border):T.border}` }}>{s} <span style={{ opacity:.7 }}>{cnt}</span></button>
        );})}
      </div>
      <div style={{ display:"flex",gap:10,marginBottom:12,flexWrap:"wrap" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, box number, phone…"
          style={{ flex:1,minWidth:200,background:T.input,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 14px",color:T.text,fontSize:13,fontFamily:"inherit",outline:"none" }} />
        <Btn T={T} onClick={openAdd}>+ Add Customer</Btn>
      </div>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
          <thead><tr style={{ borderBottom:`2px solid ${T.border}` }}>
            {["Name","Box Number","Service","Phone","Notes",""].map(h=><th key={h} style={{ padding:"8px 10px",textAlign:"left",color:T.sub,fontWeight:700,fontSize:11,textTransform:"uppercase",letterSpacing:"0.08em" }}>{h}</th>)}
          </tr></thead>
          <tbody>{filtered.map(c=>(
            <tr key={c.id} style={{ borderBottom:`1px solid ${T.border}` }} onMouseEnter={e=>e.currentTarget.style.background=T.hover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <td style={{ padding:"10px",color:T.text,fontWeight:600 }}>{c.name}</td>
              <td style={{ padding:"10px",fontFamily:"monospace",fontSize:12,color:T.accent }}>{c.boxNumber||"—"}</td>
              <td style={{ padding:"10px" }}><SvcBadge service={c.service} T={T} /></td>
              <td style={{ padding:"10px",color:T.sub,fontSize:12 }}>{c.phone||"—"}</td>
              <td style={{ padding:"10px",color:T.muted,fontSize:12 }}>{c.notes}</td>
              <td style={{ padding:"10px" }}>
                <div style={{ display:"flex",gap:6 }}>
                  <Btn T={T} sm v="dark" onClick={()=>setViewHistory(c)}>📋</Btn>
                  <Btn T={T} sm v="dark" onClick={()=>openEdit(c)}>✏️</Btn>
                  <Btn T={T} sm v="red" onClick={()=>customers.remove(c.id)}>🗑</Btn>
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
        {filtered.length===0&&<div style={{ textAlign:"center",padding:30,color:T.muted }}>No customers found</div>}
      </div>

      {viewHistory&&(
        <Modal title={`History — ${viewHistory.name}`} onClose={()=>setViewHistory(null)} T={T} wide>
          <div style={{ marginBottom:12,display:"flex",gap:12 }}>
            <div style={{ fontFamily:"monospace",fontSize:12,color:T.accent }}>Box #{viewHistory.boxNumber}</div>
            <SvcBadge service={viewHistory.service} T={T} />
          </div>
          {(() => {
            const custSales = sales.data.filter(s=>s.customerName===viewHistory.name);
            const total = custSales.reduce((s,x)=>s+x.total,0);
            return <>
              <div style={{ marginBottom:12,fontSize:13,color:T.sub }}>{custSales.length} transactions · Total: <strong style={{ color:T.accent }}>{peso(total)}</strong></div>
              <div style={{ maxHeight:300,overflowY:"auto" }}>
                {custSales.map(s=>(
                  <div key={s.id} style={{ display:"flex",justifyContent:"space-between",padding:"8px 12px",background:T.hover,borderRadius:8,marginBottom:6 }}>
                    <div><div style={{ fontSize:13,fontWeight:600,color:T.text }}>{s.date} {s.time}</div></div>
                    <div style={{ fontWeight:700,color:T.accent }}>{peso(s.total)}</div>
                  </div>
                ))}
                {custSales.length===0&&<div style={{ textAlign:"center",padding:20,color:T.muted }}>No transactions found</div>}
              </div>
            </>;
          })()}
        </Modal>
      )}

      {(showAdd||editing)&&(
        <Modal title={editing?"Edit Customer":"Add Customer"} onClose={()=>{setShowAdd(false);setEditing(null);}} T={T}>
          <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
            <Inp T={T} label="Name *" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} placeholder="Customer name" autoFocus />
            <Inp T={T} label="Box / Smart Card Number" value={form.boxNumber} onChange={v=>setForm(f=>({...f,boxNumber:v}))} placeholder="e.g. 7740537035689935" />
            <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
              <label style={{ fontSize:11,fontWeight:700,color:T.sub,letterSpacing:"0.1em",textTransform:"uppercase" }}>Service</label>
              <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                {SERVICES.map(s=>{const col=SVC_COL[s];return(
                  <button key={s} onClick={()=>setForm(f=>({...f,service:s}))} style={{ padding:"8px 16px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:"inherit",background:form.service===s?col.bg:"transparent",color:form.service===s?"#fff":T.sub,border:`2px solid ${form.service===s?col.bg:T.border}` }}>{s}</button>
                );})}
              </div>
            </div>
            <div style={{ display:"flex",gap:10 }}>
              <div style={{ flex:1 }}><Inp T={T} label="Phone" value={form.phone} onChange={v=>setForm(f=>({...f,phone:v}))} placeholder="+63…" /></div>
            </div>
            <Inp T={T} label="Address" value={form.address} onChange={v=>setForm(f=>({...f,address:v}))} placeholder="Optional" />
            <Inp T={T} label="Notes" value={form.notes} onChange={v=>setForm(f=>({...f,notes:v}))} placeholder="Optional" />
            <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
              <Btn T={T} v="ghost" onClick={()=>{setShowAdd(false);setEditing(null);}}>Cancel</Btn>
              <Btn T={T} onClick={save} disabled={!form.name.trim()}>Save</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SALES TAB — all transactions (products + loads)
// ═══════════════════════════════════════════════════════════════════
export function SalesTab({ sales, transactions, T }) {
  const [view, setView]         = useState("all"); // all | loads | products
  const [search, setSearch]     = useState("");
  const [dateFilter, setDate]   = useState("");
  const [voidConfirm, setVoidConfirm] = useState(null);

  // Merge: product sales + satellite loads into one flat list
  const allItems = [
    ...sales.data.map(s => ({
      id:s.id, type:"sale", name:s.customerName, cashier:s.cashierName,
      amount:s.total, date:s.date, time:s.time, paymentMethod:s.paymentMethod,
    })),
    ...transactions.data.map(t => ({
      id:t.id, type:"load", name:t.customerName, cashier:t.cashierName,
      amount:t.amount, date:t.date, time:t.time, service:t.service,
      boxNumber:t.boxNumber, monthYear:t.monthYear,
    })),
  ].sort((a,b) => (b.date+b.time).localeCompare(a.date+a.time));

  const filtered = allItems.filter(item => {
    const s = search.toLowerCase();
    const matchSearch = !search || (item.name||"").toLowerCase().includes(s);
    const matchDate   = !dateFilter || item.date === dateFilter;
    const matchView   = view==="all" || (view==="loads" && item.type==="load") || (view==="products" && item.type==="sale");
    return matchSearch && matchDate && matchView;
  });

  const todayTotal    = filtered.filter(i=>i.date===todayStr()).reduce((s,i)=>s+i.amount,0);
  const filteredTotal = filtered.reduce((s,i)=>s+i.amount,0);

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
      {/* Filters */}
      <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center" }}>
        <div style={{ display:"flex",gap:0,background:T.hover,borderRadius:10,padding:3 }}>
          {[["all","All"],["loads","⚡ Loads"],["products","🛒 Products"]].map(([k,l])=>(
            <button key={k} onClick={()=>setView(k)} style={{ padding:"7px 14px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:12,background:view===k?T.card:"transparent",color:view===k?T.text:T.sub,boxShadow:view===k?`0 1px 4px ${T.sh}`:"none" }}>{l}</button>
          ))}
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by customer…"
          style={{ flex:1,minWidth:160,background:T.input,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 14px",color:T.text,fontSize:13,fontFamily:"inherit",outline:"none" }} />
        <input type="date" value={dateFilter} onChange={e=>setDate(e.target.value)}
          style={{ background:T.input,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px",color:T.text,fontSize:13,fontFamily:"inherit",outline:"none" }} />
        {dateFilter && <button onClick={()=>setDate("")} style={{ background:"none",border:"none",color:T.sub,cursor:"pointer",fontSize:13 }}>✕ Clear</button>}
      </div>

      {/* Summary */}
      <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
        <Card T={T} style={{ flex:1,minWidth:120,padding:14,textAlign:"center" }}>
          <div style={{ fontSize:22,fontWeight:800,color:T.accent }}>{peso(filteredTotal)}</div>
          <div style={{ fontSize:11,color:T.sub }}>{filtered.length} transactions shown</div>
        </Card>
        <Card T={T} style={{ flex:1,minWidth:120,padding:14,textAlign:"center" }}>
          <div style={{ fontSize:22,fontWeight:800,color:"#4ade80" }}>{peso(todayTotal)}</div>
          <div style={{ fontSize:11,color:T.sub }}>Today</div>
        </Card>
      </div>

      {/* Table */}
      <Card T={T} style={{ padding:0,overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
            <thead><tr style={{ borderBottom:`2px solid ${T.border}`,background:T.hover }}>
              {["Type","Date","Time","Customer","Details","Cashier","Amount",""].map(h=>(
                <th key={h} style={{ padding:"10px 12px",textAlign:"left",color:T.sub,fontWeight:700,fontSize:11,textTransform:"uppercase",letterSpacing:"0.08em",whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.slice(0,100).map(item=>(
                <tr key={item.type+item.id} style={{ borderBottom:`1px solid ${T.border}` }}
                  onMouseEnter={e=>e.currentTarget.style.background=T.hover}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{ padding:"10px 12px" }}>
                    {item.type==="load"
                      ? <SvcBadge service={item.service} T={T} />
                      : <span style={{ fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:10,background:"#374151",color:"#9ca3af" }}>🛒 Sale</span>
                    }
                  </td>
                  <td style={{ padding:"10px 12px",color:T.sub,fontSize:11,whiteSpace:"nowrap" }}>{item.date}</td>
                  <td style={{ padding:"10px 12px",color:T.muted,fontSize:11 }}>{item.time}</td>
                  <td style={{ padding:"10px 12px",color:T.text,fontWeight:600 }}>{item.name||"Walk-in"}</td>
                  <td style={{ padding:"10px 12px",color:T.sub,fontSize:11 }}>
                    {item.type==="load" ? `Box #${item.boxNumber||"—"} · ${item.monthYear||""}` : item.paymentMethod}
                  </td>
                  <td style={{ padding:"10px 12px",color:T.sub,fontSize:12 }}>{item.cashier}</td>
                  <td style={{ padding:"10px 12px",fontWeight:800,color:T.accent,fontSize:15 }}>{peso(item.amount)}</td>
                  <td style={{ padding:"10px 12px" }}>
                    <Btn T={T} sm v="red" onClick={()=>setVoidConfirm(item)}>🚫</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length===0 && <div style={{ textAlign:"center",padding:30,color:T.muted }}>No transactions found</div>}
          {filtered.length>100 && <div style={{ textAlign:"center",padding:12,color:T.sub,fontSize:12 }}>Showing first 100 — use search or date filter to narrow down</div>}
        </div>
      </Card>

      {/* Void confirm */}
      {voidConfirm && (
        <Modal title="🚫 Void Transaction" onClose={()=>setVoidConfirm(null)} T={T}>
          <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
            <div style={{ background:"#7f1d1d22",border:"1px solid #7f1d1d55",borderRadius:10,padding:16 }}>
              <div style={{ fontWeight:700,color:"#f87171",marginBottom:8 }}>Permanently void this transaction?</div>
              <div style={{ fontSize:13,color:T.text }}><strong>{voidConfirm.name||"Walk-in"}</strong> — {peso(voidConfirm.amount)}</div>
              <div style={{ fontSize:12,color:T.sub }}>{voidConfirm.date} {voidConfirm.time}</div>
              <div style={{ fontSize:12,color:T.sub,marginTop:6 }}>Stock will be restored if applicable. Cannot be undone.</div>
            </div>
            <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
              <Btn T={T} v="ghost" onClick={()=>setVoidConfirm(null)}>Cancel</Btn>
              <Btn T={T} v="red" onClick={async()=>{
                if (voidConfirm.type==="sale") await sales.voidSale(voidConfirm.id);
                else await transactions.remove(voidConfirm.id);
                setVoidConfirm(null);
              }}>🚫 Confirm Void</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// REPORTS TAB
// ═══════════════════════════════════════════════════════════════════
export function ReportsTab({ sales, products, T }) {
  const [period, setPeriod] = useState("today");
  const [voidConfirm, setVoidConfirm] = useState(null); // sale to void

  const filterSales = () => {
    const now = new Date();
    return sales.data.filter(s=>{
      const d = new Date(s.date);
      if (period==="today") return s.date===todayStr();
      if (period==="week") { const w=new Date(now); w.setDate(w.getDate()-7); return d>=w; }
      if (period==="month") return s.date?.slice(0,7)===`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
      return true;
    });
  };

  const filtered = filterSales();
  const totalRevenue = filtered.reduce((s,x)=>s+x.total,0);
  const avgSale = filtered.length ? totalRevenue/filtered.length : 0;

  // Top products (approximate from sales)
  const byDate = filtered.reduce((acc,s)=>{
    const k=s.date; if(!acc[k])acc[k]=0; acc[k]+=s.total; return acc;
  },{});

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
      <div style={{ display:"flex",gap:8 }}>
        {["today","week","month","all"].map(p=>(
          <button key={p} onClick={()=>setPeriod(p)} style={{ padding:"7px 16px",borderRadius:20,cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:"inherit",background:period===p?T.accent:"transparent",color:period===p?T.atext:T.sub,border:`1px solid ${period===p?T.accent:T.border}`,textTransform:"capitalize" }}>{p==="all"?"All Time":p.charAt(0).toUpperCase()+p.slice(1)}</button>
        ))}
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12 }}>
        {[
          { label:"Revenue",      value:peso(totalRevenue), color:T.accent },
          { label:"Transactions", value:filtered.length,    color:T.text },
          { label:"Avg. Sale",    value:peso(avgSale),      color:"#4ade80" },
          { label:"Products",     value:products.data.length, color:T.text },
        ].map(s=>(
          <Card T={T} key={s.label} style={{ textAlign:"center",padding:20 }}>
            <div style={{ fontSize:26,fontWeight:800,color:s.color }}>{s.value}</div>
            <div style={{ fontSize:12,color:T.sub,marginTop:4 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <Card T={T}>
        <div style={{ fontWeight:700,color:T.text,fontSize:14,marginBottom:14 }}>Sales by Day</div>
        {Object.entries(byDate).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,14).map(([date,total])=>(
          <div key={date} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${T.border}` }}>
            <span style={{ color:T.sub,fontSize:13 }}>{date}</span>
            <span style={{ fontWeight:700,color:T.accent,fontSize:14 }}>{peso(total)}</span>
          </div>
        ))}
        {Object.keys(byDate).length===0&&<div style={{ textAlign:"center",padding:20,color:T.muted }}>No sales data</div>}
      </Card>

      <Card T={T}>
        <div style={{ fontWeight:700,color:T.text,fontSize:14,marginBottom:14 }}>Recent Transactions</div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
            <thead><tr style={{ borderBottom:`2px solid ${T.border}` }}>
              {["Date","Time","Customer","Cashier","Total","Payment",""].map(h=><th key={h} style={{ padding:"8px 10px",textAlign:"left",color:T.sub,fontWeight:700,fontSize:11,textTransform:"uppercase",letterSpacing:"0.08em",whiteSpace:"nowrap" }}>{h}</th>)}
            </tr></thead>
            <tbody>{filtered.slice(0,30).map(s=>(
              <tr key={s.id} style={{ borderBottom:`1px solid ${T.border}` }}>
                <td style={{ padding:"8px 10px",color:T.sub,fontSize:11,whiteSpace:"nowrap" }}>{s.date}</td>
                <td style={{ padding:"8px 10px",color:T.muted,fontSize:11 }}>{s.time}</td>
                <td style={{ padding:"8px 10px",color:T.text,fontWeight:600 }}>{s.customerName}</td>
                <td style={{ padding:"8px 10px",color:T.sub,fontSize:12 }}>{s.cashierName}</td>
                <td style={{ padding:"8px 10px",fontWeight:700,color:T.accent }}>{peso(s.total)}</td>
                <td style={{ padding:"8px 10px",color:T.sub,fontSize:12,textTransform:"capitalize" }}>{s.paymentMethod}</td>
                <td style={{ padding:"8px 10px" }}>
                  <Btn T={T} sm v="red" onClick={()=>setVoidConfirm(s)}>🚫 Void</Btn>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>

      {/* Void confirm modal */}
      {voidConfirm && (
        <Modal title="🚫 Void Sale" onClose={()=>setVoidConfirm(null)} T={T}>
          <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
            <div style={{ background:"#7f1d1d22",border:"1px solid #7f1d1d55",borderRadius:10,padding:16 }}>
              <div style={{ fontWeight:700,color:"#f87171",marginBottom:8 }}>This will permanently void this sale:</div>
              <div style={{ fontSize:13,color:T.text }}><strong>{voidConfirm.customerName}</strong> — {peso(voidConfirm.total)}</div>
              <div style={{ fontSize:12,color:T.sub }}>{voidConfirm.date} {voidConfirm.time} · {voidConfirm.cashierName}</div>
              <div style={{ fontSize:12,color:T.sub,marginTop:8 }}>Stock will be restored automatically. This cannot be undone.</div>
            </div>
            <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
              <Btn T={T} v="ghost" onClick={()=>setVoidConfirm(null)}>Cancel</Btn>
              <Btn T={T} v="red" onClick={async()=>{ await sales.voidSale(voidConfirm.id); setVoidConfirm(null); }}>🚫 Confirm Void</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// USERS / ADMIN TAB
// ═══════════════════════════════════════════════════════════════════
export function UsersTab({ users, profile, T }) {
  const pending  = users.data.filter(u=>!u.approved);
  const approved = users.data.filter(u=>u.approved);

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
      {pending.length>0&&(
        <Card T={T} style={{ border:"1px solid #f59e0b55",background:"#f59e0b08" }}>
          <div style={{ fontWeight:700,color:T.accent,fontSize:14,marginBottom:12 }}>⏳ Pending Approval ({pending.length})</div>
          {pending.map(u=>(
            <div key={u.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:T.hover,borderRadius:8,marginBottom:8 }}>
              <div><div style={{ fontWeight:700,color:T.text }}>{u.name}</div><div style={{ fontSize:12,color:T.sub }}>{u.email} · Registered: {u.created_at?.slice(0,10)}</div></div>
              <div style={{ display:"flex",gap:8 }}>
                <Btn T={T} v="green" sm onClick={()=>users.approve(u.id)}>✓ Approve</Btn>
                <Btn T={T} v="red" sm onClick={()=>users.remove(u.id)}>✗ Reject</Btn>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Card T={T}>
        <div style={{ fontWeight:700,color:T.text,fontSize:14,marginBottom:12 }}>👥 All Staff ({approved.length})</div>
        {approved.map(u=>(
          <div key={u.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:T.hover,borderRadius:8,marginBottom:8 }}>
            <div>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <span style={{ fontWeight:700,color:T.text }}>{u.name}</span>
                <span style={{ fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:10,background:u.role==="admin"?"#7c3aed33":"#0369a133",color:u.role==="admin"?"#a78bfa":"#38bdf8",border:`1px solid ${u.role==="admin"?"#7c3aed55":"#0369a155"}` }}>{u.role}</span>
                {u.id===profile?.id&&<span style={{ fontSize:11,color:T.sub }}>(you)</span>}
              </div>
              <div style={{ fontSize:12,color:T.sub }}>{u.email}</div>
            </div>
            {u.id!==profile?.id&&profile?.role==="admin"&&(
              <div style={{ display:"flex",gap:8 }}>
                <Btn T={T} v="dark" sm onClick={()=>users.setRole(u.id,u.role==="admin"?"staff":"admin")}>{u.role==="admin"?"→ Staff":"→ Admin"}</Btn>
                <Btn T={T} v="red" sm onClick={()=>users.remove(u.id)}>🗑</Btn>
              </div>
            )}
          </div>
        ))}
        {approved.length===0&&<div style={{ textAlign:"center",padding:20,color:T.muted }}>No approved users</div>}
      </Card>
    </div>
  );
}
