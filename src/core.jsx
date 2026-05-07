import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS & HELPERS
// ═══════════════════════════════════════════════════════════════════
const SHOP_NAME = "CK's Store";
const SHOP_ADDRESS = "Kabacan, North Cotabato";
const SHOP_CONTACT = "";

const todayStr = () => new Date().toISOString().split("T")[0];
const nowTime  = () => new Date().toLocaleTimeString("en-PH", { hour:"2-digit", minute:"2-digit" });
const uid      = () => `${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
const peso     = (n) => `₱${parseFloat(n||0).toLocaleString("en-PH", { minimumFractionDigits:2, maximumFractionDigits:2 })}`;

const SERVICES = ["GSAT HD","CIGNAL","SATLITE","GPINOY"];
const SVC_COL  = {
  "GSAT HD":{ bg:"#7c3aed", lt:"#ede9fe", tx:"#5b21b6" },
  "CIGNAL": { bg:"#dc2626", lt:"#fee2e2", tx:"#991b1b" },
  "SATLITE":{ bg:"#0369a1", lt:"#e0f2fe", tx:"#0c4a6e" },
  "GPINOY": { bg:"#059669", lt:"#d1fae5", tx:"#065f46" },
};

const DARK = { bg:"#0a0f1a",card:"#111827",border:"#1f2937",input:"#0d1117",text:"#f9fafb",sub:"#9ca3af",muted:"#374151",accent:"#f59e0b",atext:"#1a1108",hover:"#1f2937",sh:"#00000070",pos:"#0d1117" };
const LIGHT= { bg:"#f1f5f9",card:"#ffffff",border:"#e2e8f0",input:"#ffffff",text:"#0f172a",sub:"#64748b",muted:"#cbd5e1",accent:"#d97706",atext:"#ffffff",hover:"#f8fafc",sh:"#00000015",pos:"#f8fafc" };

// ═══════════════════════════════════════════════════════════════════
// AUTH HOOK
// ═══════════════════════════════════════════════════════════════════
function useAuth() {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (authUser) => {
    if (!authUser) { setProfile(null); setLoading(false); return; }
    const { data } = await supabase.from("user_profiles").select("*").eq("id", authUser.id).single();
    setProfile(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data:{ session } }) => {
      setUser(session?.user || null);
      loadProfile(session?.user || null);
    });
    const { data:{ subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
      loadProfile(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signUp = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      const { count } = await supabase.from("user_profiles").select("*", { count:"exact", head:true });
      await supabase.from("user_profiles").insert([{
        id: data.user.id, name, email,
        role: count === 0 ? "admin" : "staff",
        approved: count === 0,
      }]);
    }
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null);
  };

  return { user, profile, loading, signUp, signIn, signOut, refetchProfile: () => loadProfile(user) };
}

// ═══════════════════════════════════════════════════════════════════
// DB HOOKS
// ═══════════════════════════════════════════════════════════════════
function useCustomers() {
  const [data, setData] = useState([]);
  const load = useCallback(async () => {
    const { data:rows } = await supabase.from("customers").select("*").order("name");
    if (rows) setData(rows.map(r => ({ id:r.id,name:r.name,boxNumber:r.box_number,service:r.service,phone:r.phone||"",address:r.address||"",notes:r.notes||"",dateAdded:r.date_added })));
  }, []);
  useEffect(() => { load(); }, [load]);
  const add    = async (c) => { await supabase.from("customers").insert([{ id:c.id,name:c.name,box_number:c.boxNumber,service:c.service,phone:c.phone||"",address:c.address||"",notes:c.notes||"",date_added:todayStr() }]); await load(); };
  const update = async (id, p) => {
    const r={}; if(p.name!==undefined)r.name=p.name; if(p.boxNumber!==undefined)r.box_number=p.boxNumber; if(p.service!==undefined)r.service=p.service; if(p.phone!==undefined)r.phone=p.phone; if(p.address!==undefined)r.address=p.address; if(p.notes!==undefined)r.notes=p.notes;
    await supabase.from("customers").update(r).eq("id",id); setData(prev=>prev.map(c=>c.id===id?{...c,...p}:c));
  };
  const remove = async (id) => { await supabase.from("customers").delete().eq("id",id); setData(prev=>prev.filter(c=>c.id!==id)); };
  return { data, load, add, update, remove };
}

function useProducts() {
  const [data, setData] = useState([]);
  const load = useCallback(async () => {
    const { data:rows } = await supabase.from("products").select("*").order("name");
    if (rows) setData(rows.map(r => ({ id:r.id,name:r.name,barcode:r.barcode||"",category:r.category||"General",price:parseFloat(r.price),cost:parseFloat(r.cost||0),stock:r.stock||0,hasSerial:r.has_serial,notes:r.notes||"" })));
  }, []);
  useEffect(() => { load(); }, [load]);
  const add    = async (p) => { await supabase.from("products").insert([{ id:p.id,name:p.name,barcode:p.barcode,category:p.category,price:p.price,cost:p.cost,stock:p.hasSerial?0:p.stock,has_serial:p.hasSerial,notes:p.notes }]); await load(); };
  const update = async (id, p) => {
    const r={}; ["name","barcode","category","price","cost","stock","notes"].forEach(k=>{ if(p[k]!==undefined)r[k]=p[k]; }); if(p.hasSerial!==undefined)r.has_serial=p.hasSerial;
    await supabase.from("products").update(r).eq("id",id); setData(prev=>prev.map(x=>x.id===id?{...x,...p}:x));
  };
  const remove = async (id) => { await supabase.from("products").delete().eq("id",id); setData(prev=>prev.filter(x=>x.id!==id)); };
  const adjustStock = async (id, delta) => {
    const prod = data.find(p=>p.id===id);
    if (!prod) return;
    const newStock = Math.max(0, prod.stock + delta);
    await supabase.from("products").update({ stock:newStock }).eq("id",id);
    setData(prev=>prev.map(x=>x.id===id?{...x,stock:newStock}:x));
  };
  return { data, load, add, update, remove, adjustStock };
}

function useSerials(productId) {
  const [data, setData] = useState([]);
  const load = useCallback(async () => {
    if (!productId) return;
    const { data:rows } = await supabase.from("product_serials").select("*").eq("product_id",productId).order("created_at",{ascending:false});
    if (rows) setData(rows.map(r=>({ id:r.id,productId:r.product_id,productName:r.product_name,serial:r.serial_number,status:r.status,saleId:r.sale_id,customerName:r.customer_name,dateAdded:r.date_added,dateSold:r.date_sold })));
  }, [productId]);
  useEffect(() => { load(); }, [load]);
  const add = async (serial, productName, prodId) => {
    const id = `SN-${uid()}`;
    await supabase.from("product_serials").insert([{ id,product_id:prodId||productId,product_name:productName,serial_number:serial,status:"available",date_added:todayStr() }]);
    // update stock count
    const { count } = await supabase.from("product_serials").select("*",{count:"exact",head:true}).eq("product_id",prodId||productId).eq("status","available");
    await supabase.from("products").update({ stock:count }).eq("id",prodId||productId);
    await load();
  };
  const remove = async (id) => {
    const serial = data.find(s=>s.id===id);
    await supabase.from("product_serials").delete().eq("id",id);
    if (serial) {
      const { count } = await supabase.from("product_serials").select("*",{count:"exact",head:true}).eq("product_id",serial.productId).eq("status","available");
      await supabase.from("products").update({ stock:count }).eq("id",serial.productId);
    }
    await load();
  };
  return { data, load, add, remove };
}

function useSales() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    const { data:rows } = await supabase.from("sales").select("*, sale_items(*)").order("created_at",{ascending:false}).limit(200);
    if (rows) setData(rows.map(r=>({ id:r.id,customerName:r.customer_name,cashierName:r.cashier_name,subtotal:parseFloat(r.subtotal),discount:parseFloat(r.discount||0),total:parseFloat(r.total),paymentMethod:r.payment_method,amountTendered:parseFloat(r.amount_tendered||0),changeAmount:parseFloat(r.change_amount||0),date:r.date,time:r.time,items:r.sale_items||[] })));
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const createSale = async (sale, items, products) => {
    // Insert sale
    const { data:saleRow, error } = await supabase.from("sales").insert([{
      id:sale.id, customer_id:sale.customerId, customer_name:sale.customerName,
      cashier_name:sale.cashierName, subtotal:sale.subtotal, discount:sale.discount,
      total:sale.total, payment_method:sale.paymentMethod,
      amount_tendered:sale.amountTendered, change_amount:sale.changeAmount,
      date:todayStr(), time:nowTime(),
    }]).select().single();
    if (error) throw error;

    // Insert sale items
    const saleItems = items.map(it=>({
      id:`SI-${uid()}`, sale_id:sale.id,
      item_type:it.type, product_id:it.productId||null,
      product_name:it.name, serial_number:it.serial||null,
      quantity:it.qty, price:it.price, subtotal:it.qty*it.price,
      service:it.service||null, box_number:it.boxNumber||null,
      month_year:it.monthYear||null, sat_customer_id:it.satCustomerId||null,
    }));
    await supabase.from("sale_items").insert(saleItems);

    // Update serials to sold
    for (const it of items) {
      if (it.serial && it.type==="product") {
        await supabase.from("product_serials").update({ status:"sold", sale_id:sale.id, customer_name:sale.customerName, date_sold:todayStr() }).eq("serial_number",it.serial);
      }
    }

    // Update product stock for non-serial items
    for (const it of items) {
      if (it.type==="product" && !it.serial && it.productId) {
        const prod = products.find(p=>p.id===it.productId);
        if (prod) {
          const newStock = Math.max(0, prod.stock - it.qty);
          await supabase.from("products").update({ stock:newStock }).eq("id",it.productId);
        }
      }
    }

    // Insert satellite transactions
    for (const it of items) {
      if (it.type==="satellite" && it.satCustomerId) {
        await supabase.from("transactions").insert([{
          id:`TXN-${uid()}`, customer_id:it.satCustomerId, customer_name:it.satCustomerName||it.name,
          box_number:it.boxNumber||"", service:it.service||"", amount:it.price,
          month_year:it.monthYear||"", cashier_name:sale.cashierName, sale_id:sale.id,
          date:todayStr(), time:nowTime(),
        }]);
      }
    }

    await load();
    return saleRow;
  };

  return { data, loading, load, createSale };
}

function useUsers() {
  const [data, setData] = useState([]);
  const load = useCallback(async () => {
    const { data:rows } = await supabase.from("user_profiles").select("*").order("created_at");
    if (rows) setData(rows);
  }, []);
  useEffect(() => { load(); }, [load]);
  const approve = async (id) => { await supabase.from("user_profiles").update({ approved:true }).eq("id",id); setData(prev=>prev.map(u=>u.id===id?{...u,approved:true}:u)); };
  const setRole = async (id, role) => { await supabase.from("user_profiles").update({ role }).eq("id",id); setData(prev=>prev.map(u=>u.id===id?{...u,role}:u)); };
  const remove  = async (id) => { await supabase.from("user_profiles").delete().eq("id",id); setData(prev=>prev.filter(u=>u.id!==id)); };
  return { data, load, approve, setRole, remove };
}

// ═══════════════════════════════════════════════════════════════════
// SHARED UI
// ═══════════════════════════════════════════════════════════════════
const SvcBadge = ({ service, T }) => {
  const col = SVC_COL[service]||{ bg:"#374151",lt:"#f3f4f6",tx:"#111" };
  return <span style={{ display:"inline-block",padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:800,letterSpacing:"0.06em",background:T===DARK?col.bg+"33":col.lt,color:T===DARK?col.bg:col.tx,border:`1px solid ${col.bg}44` }}>{service}</span>;
};

const Btn = ({ children, onClick, v="pri", sm, disabled, style, T }) => {
  const vs = {
    pri:  { background:T.accent,color:T.atext,border:"none" },
    ghost:{ background:"transparent",color:T.sub,border:`1px solid ${T.border}` },
    red:  { background:"#7f1d1d33",color:"#f87171",border:"1px solid #7f1d1d55" },
    green:{ background:"#14532d33",color:"#4ade80",border:"1px solid #14532d55" },
    dark: { background:T.hover,color:T.text,border:`1px solid ${T.border}` },
  };
  return <button onClick={disabled?undefined:onClick} style={{ display:"inline-flex",alignItems:"center",gap:6,padding:sm?"5px 11px":"9px 18px",borderRadius:8,border:"none",cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",fontWeight:600,fontSize:sm?12:13,opacity:disabled?0.5:1,...vs[v],...style }}>{children}</button>;
};

const Inp = ({ label, value, onChange, placeholder, type="text", T, autoFocus, onKeyDown, right }) => (
  <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
    {label && <label style={{ fontSize:11,fontWeight:700,color:T.sub,letterSpacing:"0.1em",textTransform:"uppercase" }}>{label}</label>}
    <div style={{ position:"relative" }}>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} onKeyDown={onKeyDown}
        style={{ background:T.input,border:`1px solid ${T.border}`,borderRadius:8,padding:right?"9px 36px 9px 12px":"9px 12px",color:T.text,fontSize:14,fontFamily:"inherit",outline:"none",width:"100%",boxSizing:"border-box" }} />
      {right && <span style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",color:T.sub,fontSize:13 }}>{right}</span>}
    </div>
  </div>
);

const Sel = ({ label, value, onChange, options, T }) => (
  <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
    {label && <label style={{ fontSize:11,fontWeight:700,color:T.sub,letterSpacing:"0.1em",textTransform:"uppercase" }}>{label}</label>}
    <select value={value} onChange={e=>onChange(e.target.value)} style={{ background:T.input,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",color:T.text,fontSize:14,fontFamily:"inherit",outline:"none",width:"100%" }}>
      {options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
    </select>
  </div>
);

const Card = ({ children, style, T }) => <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:16,...style }}>{children}</div>;

const Modal = ({ title, onClose, children, T, wide }) => (
  <div style={{ position:"fixed",inset:0,background:"#00000088",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto" }}>
    <div style={{ background:T.card,borderRadius:16,border:`1px solid ${T.border}`,width:"100%",maxWidth:wide?700:480,padding:24,boxShadow:`0 25px 50px ${T.sh}`,margin:"auto" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
        <h3 style={{ margin:0,color:T.text,fontSize:16,fontWeight:700 }}>{title}</h3>
        <button onClick={onClose} style={{ background:"none",border:"none",color:T.sub,cursor:"pointer",fontSize:22,lineHeight:1 }}>×</button>
      </div>
      {children}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// RECEIPT (printable)
// ═══════════════════════════════════════════════════════════════════
function Receipt({ sale, onClose, T }) {
  const print = () => window.print();
  const change = sale.amountTendered - sale.total;

  return (
    <div style={{ position:"fixed",inset:0,background:"#000000cc",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
      <div style={{ background:"#fff",borderRadius:8,width:280,maxHeight:"90vh",overflowY:"auto",padding:16,color:"#000",fontFamily:"'Courier New',monospace",fontSize:12 }} id="receipt-print">
        {/* Receipt Content */}
        <div style={{ textAlign:"center",borderBottom:"1px dashed #000",paddingBottom:8,marginBottom:8 }}>
          <div style={{ fontWeight:700,fontSize:15,letterSpacing:1 }}>{SHOP_NAME.toUpperCase()}</div>
          {SHOP_ADDRESS && <div>{SHOP_ADDRESS}</div>}
          {SHOP_CONTACT && <div>{SHOP_CONTACT}</div>}
        </div>
        <div style={{ textAlign:"center",fontWeight:700,fontSize:11,background:"#000",color:"#fff",padding:"4px",marginBottom:8,letterSpacing:1 }}>
          *** NOT AN OFFICIAL RECEIPT ***
        </div>
        <div style={{ borderBottom:"1px dashed #000",paddingBottom:8,marginBottom:8,fontSize:11 }}>
          <div>Date: {sale.date} {sale.time}</div>
          <div>Cashier: {sale.cashierName}</div>
          {sale.customerName && <div>Customer: {sale.customerName}</div>}
          <div>Sale #: {sale.id?.slice(-8)}</div>
        </div>
        <div style={{ borderBottom:"1px dashed #000",paddingBottom:8,marginBottom:8 }}>
          {sale.items?.map((it,i) => (
            <div key={i}>
              <div style={{ fontWeight:700,wordBreak:"break-word" }}>{it.product_name||it.name}</div>
              <div style={{ display:"flex",justifyContent:"space-between",paddingLeft:8,fontSize:11,color:"#333" }}>
                {it.item_type==="satellite"
                  ? <span>{it.service} · Box #{it.box_number} · {it.month_year}</span>
                  : <span>x{it.quantity} @ ₱{parseFloat(it.price).toFixed(2)}</span>}
                <span>₱{parseFloat(it.subtotal).toFixed(2)}</span>
              </div>
              {it.serial_number && <div style={{ paddingLeft:8,fontSize:10,color:"#555" }}>SN: {it.serial_number}</div>}
            </div>
          ))}
        </div>
        <div style={{ borderBottom:"1px dashed #000",paddingBottom:8,marginBottom:8 }}>
          <div style={{ display:"flex",justifyContent:"space-between" }}><span>Subtotal</span><span>₱{sale.subtotal?.toFixed(2)}</span></div>
          {sale.discount > 0 && <div style={{ display:"flex",justifyContent:"space-between" }}><span>Discount</span><span>-₱{sale.discount?.toFixed(2)}</span></div>}
          <div style={{ display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:14 }}><span>TOTAL</span><span>₱{sale.total?.toFixed(2)}</span></div>
        </div>
        <div style={{ marginBottom:8,fontSize:11 }}>
          <div style={{ display:"flex",justifyContent:"space-between" }}><span>Payment ({sale.paymentMethod?.toUpperCase()})</span><span>₱{sale.amountTendered?.toFixed(2)}</span></div>
          {sale.paymentMethod==="cash" && <div style={{ display:"flex",justifyContent:"space-between" }}><span>Change</span><span>₱{change.toFixed(2)}</span></div>}
        </div>
        <div style={{ textAlign:"center",fontSize:11,borderTop:"1px dashed #000",paddingTop:8 }}>
          <div>Thank you for shopping!</div>
          <div style={{ fontSize:10,color:"#666",marginTop:4 }}>This is not a BIR-registered receipt.</div>
          <div style={{ fontSize:10,color:"#666" }}>For official receipt, please request from staff.</div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #receipt-print, #receipt-print * { visibility: visible !important; }
          #receipt-print { position: fixed; top:0; left:0; width:58mm; padding:4mm; background:#fff; color:#000; }
          @page { size: 58mm auto; margin: 0; }
        }
      `}</style>

      <div style={{ position:"absolute",bottom:24,display:"flex",gap:12,justifyContent:"center",width:"100%" }}>
        <button onClick={print} style={{ background:T.accent,color:T.atext,border:"none",borderRadius:8,padding:"10px 24px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:14 }}>🖨️ Print</button>
        <button onClick={onClose} style={{ background:T.card,color:T.text,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 24px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:14 }}>Close</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// AUTH SCREENS
// ═══════════════════════════════════════════════════════════════════
function AuthScreen({ auth }) {
  const [mode, setMode]     = useState("login"); // login | signup
  const [email, setEmail]   = useState("");
  const [pass, setPass]     = useState("");
  const [name, setName]     = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const T = DARK;

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      if (mode==="signup") await auth.signUp(email, pass, name);
      else await auth.signIn(email, pass);
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif" }}>
      <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:40,width:"100%",maxWidth:400,boxShadow:`0 25px 50px ${T.sh}` }}>
        <div style={{ textAlign:"center",marginBottom:32 }}>
          <div style={{ fontSize:40,marginBottom:8 }}>📡</div>
          <div style={{ fontSize:24,fontWeight:800,color:T.text }}>{SHOP_NAME}</div>
          <div style={{ fontSize:13,color:T.sub,marginTop:4 }}>POS & Reload Manager</div>
        </div>

        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          {mode==="signup" && <Inp T={T} label="Full Name" value={name} onChange={setName} placeholder="Your name" autoFocus />}
          <Inp T={T} label="Email" value={email} onChange={setEmail} placeholder="you@email.com" type="email" autoFocus={mode==="login"} />
          <Inp T={T} label="Password" value={pass} onChange={setPass} placeholder="••••••••" type="password" onKeyDown={e=>e.key==="Enter"&&submit()} />
          {error && <div style={{ background:"#7f1d1d33",border:"1px solid #7f1d1d55",borderRadius:8,padding:"10px 14px",color:"#f87171",fontSize:13 }}>{error}</div>}
          <button onClick={submit} disabled={loading} style={{ background:T.accent,color:T.atext,border:"none",borderRadius:8,padding:"12px",fontWeight:700,cursor:loading?"not-allowed":"pointer",fontSize:15,fontFamily:"inherit",opacity:loading?0.7:1 }}>
            {loading?"Please wait…":mode==="login"?"Sign In":"Create Account"}
          </button>
          <div style={{ textAlign:"center",fontSize:13,color:T.sub }}>
            {mode==="login"?<>No account? <span onClick={()=>{setMode("signup");setError("");}} style={{ color:T.accent,cursor:"pointer",fontWeight:600 }}>Sign up</span></>
              :<>Have an account? <span onClick={()=>{setMode("login");setError("");}} style={{ color:T.accent,cursor:"pointer",fontWeight:600 }}>Sign in</span></>}
          </div>
        </div>
      </div>
    </div>
  );
}

function PendingScreen({ auth }) {
  const T = DARK;
  return (
    <div style={{ minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif" }}>
      <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:40,width:"100%",maxWidth:400,textAlign:"center" }}>
        <div style={{ fontSize:48,marginBottom:16 }}>⏳</div>
        <div style={{ fontSize:20,fontWeight:700,color:T.text,marginBottom:8 }}>Account Pending Approval</div>
        <div style={{ fontSize:14,color:T.sub,marginBottom:24 }}>Your account is waiting for admin approval. Please check back later or contact the admin.</div>
        <button onClick={auth.signOut} style={{ background:"transparent",border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 20px",color:T.sub,cursor:"pointer",fontFamily:"inherit",fontWeight:600 }}>Sign Out</button>
      </div>
    </div>
  );
}

export { useAuth, useCustomers, useProducts, useSerials, useSales, useUsers, SvcBadge, Btn, Inp, Sel, Card, Modal, Receipt, AuthScreen, PendingScreen, DARK, LIGHT, SERVICES, SVC_COL, todayStr, nowTime, uid, peso, SHOP_NAME };
