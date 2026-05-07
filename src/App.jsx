import { useState } from "react";
import { useAuth, useCustomers, useProducts, useSales, useUsers, AuthScreen, PendingScreen, DARK, LIGHT, SHOP_NAME } from "./core.jsx";
import POSTab from "./POSTab.jsx";
import { ProductsTab, LoadingTab, CustomersTab, ReportsTab, UsersTab } from "./tabs.jsx";

const TABS = [
  { key:"pos",       label:"POS",       icon:"🛒", admin:false },
  { key:"loading",   label:"Loading",   icon:"⚡", admin:false },
  { key:"products",  label:"Products",  icon:"📦", admin:false },
  { key:"customers", label:"Customers", icon:"👥", admin:false },
  { key:"reports",   label:"Reports",   icon:"📊", admin:false },
  { key:"users",     label:"Users",     icon:"🔐", admin:true  },
];

export default function App() {
  const [tab,  setTab]  = useState("pos");
  const [dark, setDark] = useState(true);
  const T = dark ? DARK : LIGHT;

  const auth      = useAuth();
  const customers = useCustomers();
  const products  = useProducts();
  const sales     = useSales();
  const users     = useUsers();

  // ── Auth gates ──────────────────────────────────────────────────
  if (auth.loading) return (
    <div style={{ minHeight:"100vh",background:"#0a0f1a",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"sans-serif",color:"#9ca3af",fontSize:14 }}>
      Loading…
    </div>
  );

  if (!auth.user) return <AuthScreen auth={auth} />;
  if (!auth.profile?.approved) return <PendingScreen auth={auth} />;

  const visibleTabs = TABS.filter(t => !t.admin || auth.profile?.role==="admin");
  const pendingCount = users.data.filter(u=>!u.approved).length;

  return (
    <div style={{ minHeight:"100vh",background:T.bg,fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif",color:T.text,transition:"background .2s" }}>

      {/* Header */}
      <div style={{ background:T.card,borderBottom:`1px solid ${T.border}`,padding:"0 16px",position:"sticky",top:0,zIndex:100 }}>
        <div style={{ maxWidth:1200,margin:"0 auto",display:"flex",alignItems:"center",gap:12,minHeight:56,flexWrap:"wrap" }}>
          {/* Logo */}
          <div style={{ display:"flex",alignItems:"center",gap:8,marginRight:4 }}>
            <span style={{ fontSize:22 }}>📡</span>
            <div>
              <div style={{ fontWeight:800,fontSize:15,color:T.text,lineHeight:1 }}>{SHOP_NAME}</div>
              <div style={{ fontSize:10,color:T.sub,lineHeight:1 }}>POS System</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex",gap:2,flex:1,flexWrap:"wrap" }}>
            {visibleTabs.map(t=>(
              <button key={t.key} onClick={()=>setTab(t.key)} style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:tab===t.key?T.accent+"22":"transparent",border:tab===t.key?`1px solid ${T.accent}55`:"1px solid transparent",color:tab===t.key?T.accent:T.sub,fontFamily:"inherit",fontWeight:600,fontSize:13,cursor:"pointer",position:"relative" }}>
                {t.icon} {t.label}
                {t.key==="users"&&pendingCount>0&&<span style={{ position:"absolute",top:2,right:2,background:"#ef4444",color:"#fff",borderRadius:10,fontSize:9,fontWeight:800,padding:"1px 5px",minWidth:14,textAlign:"center" }}>{pendingCount}</span>}
              </button>
            ))}
          </div>

          {/* Right controls */}
          <div style={{ display:"flex",alignItems:"center",gap:8,marginLeft:"auto" }}>
            <div style={{ fontSize:12,color:T.sub,textAlign:"right" }}>
              <div style={{ fontWeight:600,color:T.text }}>{auth.profile?.name}</div>
              <div style={{ textTransform:"capitalize",fontSize:11 }}>{auth.profile?.role}</div>
            </div>
            <button onClick={()=>setDark(!dark)} style={{ background:T.hover,border:`1px solid ${T.border}`,borderRadius:20,padding:"6px 12px",cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:12,color:T.sub }}>
              {dark?"☀️":"🌙"}
            </button>
            <button onClick={auth.signOut} style={{ background:"transparent",border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:12,color:T.sub }}>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth:1200,margin:"0 auto",padding:"20px 16px" }}>
        {tab==="pos"       && <POSTab       products={products} customers={customers} sales={sales} profile={auth.profile} T={T} />}
        {tab==="loading"   && <LoadingTab   customers={customers} sales={sales} profile={auth.profile} T={T} />}
        {tab==="products"  && <ProductsTab  products={products} T={T} />}
        {tab==="customers" && <CustomersTab customers={customers} sales={sales} T={T} />}
        {tab==="reports"   && <ReportsTab   sales={sales} products={products} T={T} />}
        {tab==="users"     && <UsersTab     users={users} profile={auth.profile} T={T} />}
      </div>
    </div>
  );
}
