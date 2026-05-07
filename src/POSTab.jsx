import { useState, useRef, useEffect } from "react";
import { SvcBadge, Btn, Inp, Card, Modal, Receipt, DARK, SERVICES, SVC_COL, uid, peso } from "./core.jsx";

// Payment modal
function PaymentModal({ cart, discount, onConfirm, onClose, T }) {
  const subtotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const total    = Math.max(0, subtotal - discount);
  const [method, setMethod]   = useState("cash");
  const [tendered, setTendered] = useState("");
  const change = method==="cash" ? (parseFloat(tendered||0) - total) : 0;

  return (
    <Modal title="💳 Payment" onClose={onClose} T={T}>
      <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
        {/* Summary */}
        <div style={{ background:T.hover,borderRadius:10,padding:14 }}>
          {cart.map((it,i)=>(
            <div key={i} style={{ display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4 }}>
              <span style={{ color:T.text }}>{it.name} {it.qty>1?`x${it.qty}`:""}</span>
              <span style={{ color:T.sub }}>{peso(it.price*it.qty)}</span>
            </div>
          ))}
          {discount>0 && <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,color:"#4ade80" }}><span>Discount</span><span>-{peso(discount)}</span></div>}
          <div style={{ display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:18,marginTop:8,borderTop:`1px solid ${T.border}`,paddingTop:8 }}>
            <span style={{ color:T.text }}>TOTAL</span>
            <span style={{ color:T.accent }}>{peso(total)}</span>
          </div>
        </div>

        {/* Payment method */}
        <div>
          <div style={{ fontSize:11,fontWeight:700,color:T.sub,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8 }}>Payment Method</div>
          <div style={{ display:"flex",gap:8 }}>
            {["cash","gcash","transfer","other"].map(m=>(
              <button key={m} onClick={()=>setMethod(m)} style={{ flex:1,padding:"8px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:12,background:method===m?T.accent:"transparent",color:method===m?T.atext:T.sub,border:`2px solid ${method===m?T.accent:T.border}`,textTransform:"capitalize" }}>{m}</button>
            ))}
          </div>
        </div>

        {method==="cash" && (
          <div>
            <Inp T={T} label="Amount Tendered (₱)" value={tendered} onChange={setTendered} type="number" placeholder="0.00" autoFocus />
            <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginTop:8 }}>
              {[total, Math.ceil(total/100)*100, Math.ceil(total/500)*500, Math.ceil(total/1000)*1000].filter((v,i,a)=>a.indexOf(v)===i).map(v=>(
                <button key={v} onClick={()=>setTendered(String(v))} style={{ padding:"5px 12px",borderRadius:6,cursor:"pointer",background:T.hover,border:`1px solid ${T.border}`,color:T.sub,fontFamily:"inherit",fontWeight:600,fontSize:12 }}>{peso(v)}</button>
              ))}
            </div>
            {tendered && change >= 0 && (
              <div style={{ marginTop:12,background:"#14532d22",border:"1px solid #14532d55",borderRadius:8,padding:"10px 14px",display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:16 }}>
                <span style={{ color:"#4ade80" }}>CHANGE</span>
                <span style={{ color:"#4ade80" }}>{peso(change)}</span>
              </div>
            )}
          </div>
        )}

        <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
          <Btn T={T} v="ghost" onClick={onClose}>Cancel</Btn>
          <Btn T={T} onClick={()=>onConfirm({ method, tendered:parseFloat(tendered||total), change:Math.max(0,change), total, subtotal })}
            disabled={method==="cash" && (parseFloat(tendered||0)<total)}>
            ✓ Confirm Sale
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// Satellite load picker for POS
function SatLoadPicker({ customers, onAdd, onClose, T }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState("");
  const [monthYear, setMonthYear] = useState(() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; });

  const matched = search.length>=1 ? customers.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||(c.boxNumber||"").includes(search)).slice(0,6) : [];

  return (
    <Modal title="📡 Add Satellite Load" onClose={onClose} T={T}>
      <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
        <div style={{ position:"relative" }}>
          <Inp T={T} label="Search Customer" value={search} onChange={v=>{setSearch(v);setSelected(null);}} placeholder="Name or box number…" autoFocus />
          {search && !selected && matched.length>0 && (
            <div style={{ position:"absolute",top:"100%",left:0,right:0,zIndex:100,background:T.card,border:`1px solid ${T.border}`,borderRadius:8,overflow:"hidden",boxShadow:`0 8px 20px ${T.sh}` }}>
              {matched.map(c=>(
                <div key={c.id} onClick={()=>{setSelected(c);setSearch(c.name);}} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",cursor:"pointer",borderBottom:`1px solid ${T.border}` }}
                  onMouseEnter={e=>e.currentTarget.style.background=T.hover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div><div style={{ fontWeight:700,color:T.text,fontSize:13 }}>{c.name}</div><div style={{ fontSize:11,color:T.sub,fontFamily:"monospace" }}>{c.boxNumber}</div></div>
                  <SvcBadge service={c.service} T={T} />
                </div>
              ))}
            </div>
          )}
        </div>
        {selected && (
          <div style={{ background:T.hover,borderRadius:8,padding:12 }}>
            <div style={{ fontWeight:700,color:T.text }}>{selected.name}</div>
            <div style={{ fontFamily:"monospace",fontSize:12,color:T.accent }}>Box #{selected.boxNumber}</div>
            <SvcBadge service={selected.service} T={T} />
          </div>
        )}
        <div style={{ display:"flex",gap:10 }}>
          <div style={{ flex:1 }}>
            <Inp T={T} label="Amount (₱)" value={amount} onChange={setAmount} type="number" placeholder="0" />
            <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginTop:6 }}>
              {[15,17,20,22,24,25,26,27,28,29,30,31].map(a=>(
                <button key={a} onClick={()=>setAmount(String(a))} style={{ padding:"3px 10px",borderRadius:6,cursor:"pointer",background:amount===String(a)?T.accent:T.hover,color:amount===String(a)?T.atext:T.sub,border:`1px solid ${T.border}`,fontFamily:"inherit",fontWeight:600,fontSize:12 }}>₱{a}</button>
              ))}
            </div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11,fontWeight:700,color:T.sub,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4 }}>Month</div>
            <input type="month" value={monthYear} onChange={e=>setMonthYear(e.target.value)} style={{ background:T.input,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",color:T.text,fontSize:14,fontFamily:"inherit",outline:"none",width:"100%",boxSizing:"border-box" }} />
          </div>
        </div>
        <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
          <Btn T={T} v="ghost" onClick={onClose}>Cancel</Btn>
          <Btn T={T} disabled={!selected||!amount} onClick={()=>{
            onAdd({ id:uid(),type:"satellite",name:`${selected.service} Load – ${selected.name}`,price:parseFloat(amount),qty:1,service:selected.service,boxNumber:selected.boxNumber,monthYear,satCustomerId:selected.id,satCustomerName:selected.name });
            onClose();
          }}>Add to Cart</Btn>
        </div>
      </div>
    </Modal>
  );
}

// Main POS Tab
export default function POSTab({ products, customers, sales, profile, T }) {
  const [cart, setCart]         = useState([]);
  const [search, setSearch]     = useState("");
  const [discount, setDiscount] = useState(0);
  const [selCustomer, setSelCustomer] = useState(null);
  const [custSearch, setCustSearch]   = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [showSatPicker, setShowSatPicker] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [processing, setProcessing] = useState(false);
  const scanRef = useRef(null);

  const subtotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const total    = Math.max(0, subtotal - discount);

  // Barcode/name search
  const searchResults = search.length>=1 ? products.data.filter(p=>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode&&p.barcode.toLowerCase()===search.toLowerCase())
  ).slice(0,8) : [];

  // Exact barcode match → auto-add
  useEffect(() => {
    if (search.length>3) {
      const exact = products.data.find(p=>p.barcode&&p.barcode===search);
      if (exact) { addToCart(exact); setSearch(""); }
    }
  }, [search]);

  const addToCart = (prod) => {
    if (prod.stock<=0 && prod.hasSerial) { alert(`${prod.name} has no available stock!`); return; }
    setCart(prev => {
      const exists = prev.find(i=>i.productId===prod.id&&i.type==="product"&&!i.serial);
      if (exists && !prod.hasSerial) return prev.map(i=>i.productId===prod.id?{...i,qty:i.qty+1}:i);
      return [...prev, { id:uid(),type:"product",productId:prod.id,name:prod.name,price:prod.price,qty:1,hasSerial:prod.hasSerial,serial:null,stock:prod.stock }];
    });
    setSearch("");
    scanRef.current?.focus();
  };

  const assignSerial = async (cartId, serial) => {
    // Verify serial exists and is available
    const { data:sn } = await (window.supabase||supabase).from("product_serials").select("*").eq("serial_number",serial).eq("status","available").single().catch(()=>({data:null}));
    if (!sn) { alert("Serial not found or already sold!"); return; }
    setCart(prev=>prev.map(i=>i.id===cartId?{...i,serial,name:`${i.name} (SN: ${serial})`}:i));
  };

  const removeFromCart = (id) => setCart(prev=>prev.filter(i=>i.id!==id));
  const updateQty = (id, qty) => { if(qty<1){removeFromCart(id);return;} setCart(prev=>prev.map(i=>i.id===id?{...i,qty}:i)); };

  const confirmSale = async ({ method, tendered, change, total: finalTotal, subtotal: finalSub }) => {
    setProcessing(true);
    try {
      const saleId = `SALE-${uid()}`;
      const saleData = {
        id:saleId, customerId:selCustomer?.id||null, customerName:selCustomer?.name||"Walk-in",
        cashierName:profile?.name||"Staff", subtotal:finalSub, discount, total:finalTotal,
        paymentMethod:method, amountTendered:tendered, changeAmount:change,
      };
      const result = await sales.createSale(saleData, cart, products.data);
      // Fetch full sale with items for receipt
      const { data:fullSale } = await (window._supabase||window.supabase||supabase).from("sales").select("*, sale_items(*)").eq("id",saleId).single().catch(()=>({data:null}));
      setLastSale({ ...saleData, date:new Date().toISOString().split("T")[0], time:new Date().toLocaleTimeString(), items: cart.map(it=>({ product_name:it.name.split(" (SN:")[0], item_type:it.type, quantity:it.qty, price:it.price, subtotal:it.price*it.qty, serial_number:it.serial, service:it.service, box_number:it.boxNumber, month_year:it.monthYear })) });
      setCart([]); setDiscount(0); setSelCustomer(null); setCustSearch(""); setShowPayment(false);
      await products.load();
    } catch(e) { alert("Error: "+e.message); }
    setProcessing(false);
  };

  const custMatches = custSearch.length>=1 ? customers.data.filter(c=>c.name.toLowerCase().includes(custSearch.toLowerCase())).slice(0,5) : [];

  return (
    <div style={{ display:"grid",gridTemplateColumns:"1fr 380px",gap:20,alignItems:"start",minHeight:"80vh" }}>
      {/* Left: product search */}
      <div style={{ display:"flex",flexDirection:"column",gap:16 }}>

        {/* Barcode/search bar */}
        <Card T={T} style={{ padding:14 }}>
          <div style={{ fontSize:11,color:T.sub,marginBottom:8,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase" }}>
            🔍 Search product or scan barcode
          </div>
          <div style={{ position:"relative" }}>
            <input ref={scanRef} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Product name or barcode…" autoFocus
              onKeyDown={e=>{if(e.key==="Enter"&&searchResults.length===1){addToCart(searchResults[0]);setSearch("");}}}
              style={{ width:"100%",boxSizing:"border-box",background:T.input,border:`2px solid ${T.accent}55`,borderRadius:10,padding:"13px 16px",color:T.text,fontSize:16,fontFamily:"inherit",outline:"none" }} />
            {search && searchResults.length>0 && (
              <div style={{ position:"absolute",top:"100%",left:0,right:0,zIndex:200,background:T.card,border:`1px solid ${T.border}`,borderRadius:10,marginTop:4,overflow:"hidden",boxShadow:`0 8px 24px ${T.sh}` }}>
                {searchResults.map(p=>(
                  <div key={p.id} onClick={()=>{addToCart(p);setSearch("");}} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",cursor:"pointer",borderBottom:`1px solid ${T.border}` }}
                    onMouseEnter={e=>e.currentTarget.style.background=T.hover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div>
                      <div style={{ fontWeight:700,color:T.text }}>{p.name}</div>
                      <div style={{ fontSize:12,color:T.sub }}>{p.category} · Stock: {p.stock}{p.hasSerial?" (serialized)":""}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontWeight:700,color:T.accent,fontSize:15 }}>{peso(p.price)}</div>
                      {p.stock===0 && <div style={{ fontSize:11,color:"#f87171" }}>Out of stock</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display:"flex",gap:8,marginTop:10 }}>
            <Btn T={T} v="dark" onClick={()=>setShowSatPicker(true)} style={{ fontSize:12 }}>📡 Add Satellite Load</Btn>
          </div>
        </Card>

        {/* Quick product grid */}
        {products.data.length>0 && (
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8 }}>
            {products.data.filter(p=>p.stock>0||!p.hasSerial).slice(0,12).map(p=>(
              <div key={p.id} onClick={()=>addToCart(p)} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:12,cursor:"pointer",transition:"all .15s" }}
                onMouseEnter={e=>e.currentTarget.style.background=T.hover} onMouseLeave={e=>e.currentTarget.style.background=T.card}>
                <div style={{ fontSize:13,fontWeight:700,color:T.text,marginBottom:4 }}>{p.name}</div>
                <div style={{ fontSize:12,color:T.sub,marginBottom:6 }}>{p.category}</div>
                <div style={{ fontWeight:800,color:T.accent,fontSize:15 }}>{peso(p.price)}</div>
                <div style={{ fontSize:11,color:p.stock>0?"#4ade80":"#f87171",marginTop:2 }}>Stock: {p.stock}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Cart */}
      <div style={{ display:"flex",flexDirection:"column",gap:12,position:"sticky",top:80 }}>
        <Card T={T}>
          <div style={{ fontWeight:700,color:T.text,fontSize:15,marginBottom:12,display:"flex",justifyContent:"space-between" }}>
            🛒 Cart
            {cart.length>0 && <button onClick={()=>setCart([])} style={{ background:"none",border:"none",color:T.sub,cursor:"pointer",fontSize:12 }}>Clear all</button>}
          </div>

          {cart.length===0
            ? <div style={{ textAlign:"center",padding:"30px 0",color:T.muted,fontSize:13 }}>Cart is empty</div>
            : <div style={{ display:"flex",flexDirection:"column",gap:8,maxHeight:340,overflowY:"auto" }}>
                {cart.map(item=>(
                  <div key={item.id} style={{ background:T.hover,borderRadius:8,padding:"10px 12px" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8 }}>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:13,fontWeight:600,color:T.text,wordBreak:"break-word" }}>{item.name}</div>
                        {item.type==="satellite" && <div style={{ fontSize:11,color:T.sub }}>{item.service} · {item.monthYear}</div>}
                      </div>
                      <button onClick={()=>removeFromCart(item.id)} style={{ background:"none",border:"none",color:T.muted,cursor:"pointer",flexShrink:0 }}>×</button>
                    </div>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                        {item.type==="product" && !item.hasSerial && (
                          <>
                            <button onClick={()=>updateQty(item.id,item.qty-1)} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:4,width:24,height:24,cursor:"pointer",color:T.text,fontFamily:"inherit",fontWeight:700 }}>-</button>
                            <span style={{ color:T.text,fontWeight:600,minWidth:20,textAlign:"center" }}>{item.qty}</span>
                            <button onClick={()=>updateQty(item.id,item.qty+1)} style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:4,width:24,height:24,cursor:"pointer",color:T.text,fontFamily:"inherit",fontWeight:700 }}>+</button>
                          </>
                        )}
                        {item.hasSerial && !item.serial && (
                          <input placeholder="Scan serial…" style={{ background:T.input,border:`1px solid ${T.border}`,borderRadius:6,padding:"3px 8px",color:T.text,fontSize:12,fontFamily:"inherit",outline:"none",width:140 }}
                            onKeyDown={e=>{if(e.key==="Enter"&&e.target.value){assignSerial(item.id,e.target.value);e.target.value="";}}} />
                        )}
                      </div>
                      <div style={{ fontWeight:700,color:T.accent }}>{peso(item.price*item.qty)}</div>
                    </div>
                  </div>
                ))}
              </div>
          }

          {/* Customer + Discount */}
          <div style={{ borderTop:`1px solid ${T.border}`,marginTop:12,paddingTop:12,display:"flex",flexDirection:"column",gap:10 }}>
            <div style={{ position:"relative" }}>
              <input value={custSearch} onChange={e=>{setCustSearch(e.target.value);setSelCustomer(null);}} placeholder="Customer (optional)…"
                style={{ width:"100%",boxSizing:"border-box",background:T.input,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px",color:T.text,fontSize:13,fontFamily:"inherit",outline:"none" }} />
              {selCustomer && <div style={{ fontSize:12,color:T.accent,marginTop:2 }}>✓ {selCustomer.name}</div>}
              {custSearch && !selCustomer && custMatches.length>0 && (
                <div style={{ position:"absolute",top:"100%",left:0,right:0,zIndex:100,background:T.card,border:`1px solid ${T.border}`,borderRadius:8,overflow:"hidden" }}>
                  {custMatches.map(c=>(
                    <div key={c.id} onClick={()=>{setSelCustomer(c);setCustSearch(c.name);}} style={{ padding:"8px 12px",cursor:"pointer",fontSize:13,color:T.text,borderBottom:`1px solid ${T.border}` }}
                      onMouseEnter={e=>e.currentTarget.style.background=T.hover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      {c.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display:"flex",gap:8,alignItems:"center" }}>
              <span style={{ fontSize:13,color:T.sub,whiteSpace:"nowrap" }}>Discount:</span>
              <input type="number" value={discount||""} onChange={e=>setDiscount(parseFloat(e.target.value)||0)} placeholder="0"
                style={{ flex:1,background:T.input,border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 10px",color:T.text,fontSize:13,fontFamily:"inherit",outline:"none" }} />
              <span style={{ fontSize:13,color:T.sub }}>₱</span>
            </div>
          </div>

          {/* Totals */}
          <div style={{ borderTop:`1px solid ${T.border}`,marginTop:12,paddingTop:12 }}>
            <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,color:T.sub,marginBottom:4 }}><span>Subtotal</span><span>{peso(subtotal)}</span></div>
            {discount>0 && <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,color:"#4ade80",marginBottom:4 }}><span>Discount</span><span>-{peso(discount)}</span></div>}
            <div style={{ display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:22,color:T.accent,marginBottom:14 }}><span>TOTAL</span><span>{peso(total)}</span></div>
            <Btn T={T} onClick={()=>setShowPayment(true)} disabled={cart.length===0||processing} style={{ width:"100%",justifyContent:"center",padding:"13px",fontSize:15,fontWeight:800 }}>
              {processing?"Processing…":"💳 Charge / Pay"}
            </Btn>
          </div>
        </Card>

        {/* Today's summary */}
        <Card T={T} style={{ padding:14 }}>
          <div style={{ fontSize:12,color:T.sub,marginBottom:8,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em" }}>Today's Sales</div>
          {(() => {
            const todaySales = sales.data.filter(s=>s.date===new Date().toISOString().split("T")[0]);
            const todayTotal = todaySales.reduce((s,x)=>s+x.total,0);
            return <>
              <div style={{ fontSize:22,fontWeight:800,color:T.accent }}>{peso(todayTotal)}</div>
              <div style={{ fontSize:12,color:T.sub }}>{todaySales.length} transactions</div>
            </>;
          })()}
        </Card>
      </div>

      {showPayment && <PaymentModal cart={cart} discount={discount} onConfirm={confirmSale} onClose={()=>setShowPayment(false)} T={T} />}
      {showSatPicker && <SatLoadPicker customers={customers.data} onAdd={it=>setCart(p=>[...p,it])} onClose={()=>setShowSatPicker(false)} T={T} />}
      {lastSale && <Receipt sale={lastSale} onClose={()=>setLastSale(null)} T={T} />}
    </div>
  );
}
