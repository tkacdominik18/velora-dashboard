import { useState, useMemo } from "react";

const MONTHS = ["Leden","Unor","Brezen","Duben","Kveten","Cerven","Cervenec","Srpen","Zari","Rijen","Listopad","Prosinec"];
const today = new Date();
const todayStr = today.toISOString().split("T")[0];
const WINNING_ROAS = 1.8;

const fmt = (n) => Number(n).toLocaleString("cs-CZ", { maximumFractionDigits: 0 });
const fmtK = (n) => fmt(n) + " Kc";
const clr = { win:"#34d399", lose:"#f87171", eq:"#fbbf24", purple:"#818cf8", muted:"#6b6880", dim:"#2a2540" };

function roasStatus(roas) {
  if (roas === null || roas === undefined) return null;
  if (roas > WINNING_ROAS) return "win";
  if (roas >= 1.0) return "eq";
  return "lose";
}

const STATUS_CFG = {
  win:  { label:"+ WINNING",    color: "#34d399", bg:"#052e16" },
  eq:   { label:"= BREAK EVEN", color: "#fbbf24", bg:"#1c1205" },
  lose: { label:"- LOSING",     color: "#f87171", bg:"#1f0606" },
};

function Badge({ status }) {
  if (!status) return null;
  const c = STATUS_CFG[status];
  return (
    <span style={{ fontSize:"10px", fontWeight:"700", letterSpacing:"1.5px", color:c.color, background:c.bg, padding:"3px 8px", borderRadius:"4px", border:"1px solid " + c.color + "44" }}>
      {c.label}
    </span>
  );
}

function KpiCard({ label, value, sub, color, icon }) {
  return (
    <div style={{ background:"linear-gradient(135deg,#12111e,#1a1830)", border:"1px solid #2a2540", borderRadius:"12px", padding:"16px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:"12px", right:"14px", fontSize:"20px", opacity:.35 }}>{icon}</div>
      <div style={{ fontSize:"10px", color:clr.muted, letterSpacing:"2px", textTransform:"uppercase", marginBottom:"8px" }}>{label}</div>
      <div style={{ fontSize:"20px", fontWeight:"700", color, marginBottom:"4px" }}>{value}</div>
      <div style={{ fontSize:"11px", color:"#4b4860" }}>{sub}</div>
    </div>
  );
}

function makeSampleDays() {
  const out = {};
  const m = today.getMonth(), y = today.getFullYear();
  for (let d = 1; d <= today.getDate(); d++) {
    const date = y + "-" + String(m+1).padStart(2,"0") + "-" + String(d).padStart(2,"0");
    out[date] = {
      ads: Math.round((600+Math.random()*1000)*10)/10,
      sales: Math.floor(5+Math.random()*20),
      revenue: Math.round((1200+Math.random()*2400)*10)/10,
    };
  }
  return out;
}

function makeProductDays(mult) {
  const out = {};
  const m = today.getMonth(), y = today.getFullYear();
  for (let d = 1; d <= today.getDate(); d++) {
    const date = y + "-" + String(m+1).padStart(2,"0") + "-" + String(d).padStart(2,"0");
    const ads = Math.round((300+Math.random()*600)*mult*10)/10;
    const roas = (1.2+Math.random()*1.2)*mult;
    out[date] = { ads, sales: Math.floor((3+Math.random()*12)*mult), revenue: Math.round(ads*roas*10)/10 };
  }
  return out;
}

const INIT_PRODUCTS = [
  { id:1, name:"Produkt A", color:"#818cf8" },
  { id:2, name:"Produkt B", color:"#34d399" },
  { id:3, name:"Produkt C", color:"#f87171" },
];
const INIT_PDATA = { 1: makeProductDays(1.2), 2: makeProductDays(0.8), 3: makeProductDays(0.5) };

const BILLING_CYCLES = ["Mesicne","Rocne","Ctvrtletne","Jednorzove"].map(s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
const SUB_CATEGORIES = ["E-commerce","Reklama","Design","Analytics","Logistika","Komunikace","Ostatni"];
const INIT_SUBS = [
  { id:1, name:"Shopify", category:"E-commerce", price:1800, currency:"CZK", cycle:"Mesicne", active:true, note:"Prostredni plan", color:"#34d399" },
  { id:2, name:"Meta Ads", category:"Reklama", price:0, currency:"CZK", cycle:"Mesicne", active:true, note:"Variabilni", color:"#818cf8" },
  { id:3, name:"Canva Pro", category:"Design", price:300, currency:"CZK", cycle:"Mesicne", active:true, note:"Grafika", color:"#f472b6" },
];

export default function App() {
  const [tab, setTab] = useState("overview");
  const [records, setRecords] = useState(makeSampleDays);
  const [products, setProducts] = useState(INIT_PRODUCTS);
  const [pData, setPData] = useState(INIT_PDATA);
  const [selMonth, setSelMonth] = useState(today.getMonth());
  const [selYear] = useState(today.getFullYear());
  const [editDate, setEditDate] = useState(todayStr);
  const [form, setForm] = useState({ ads:"", sales:"", revenue:"" });
  const [saved, setSaved] = useState(false);
  const [newProd, setNewProd] = useState("");
  const [editProd, setEditProd] = useState(null);
  const [subs, setSubs] = useState(INIT_SUBS);
  const [showSubForm, setShowSubForm] = useState(false);
  const [editSub, setEditSub] = useState(null);
  const [subForm, setSubForm] = useState({ name:"", category:"E-commerce", price:"", currency:"CZK", cycle:"Mesicne", active:true, note:"", color:"#818cf8" });

  const monthDays = useMemo(() => {
    const n = new Date(selYear, selMonth+1, 0).getDate();
    return Array.from({length:n}, (_,i) => {
      const d = i+1;
      return selYear + "-" + String(selMonth+1).padStart(2,"0") + "-" + String(d).padStart(2,"0");
    });
  }, [selMonth, selYear]);

  const stats = useMemo(() => {
    let ads=0, sales=0, revenue=0, days=0;
    monthDays.forEach(date => {
      const r = records[date];
      if (r) { ads+=r.ads||0; sales+=r.sales||0; revenue+=r.revenue||0; days++; }
    });
    const profit = revenue-ads;
    const roas = ads>0 ? revenue/ads : 0;
    const roi = ads>0 ? (profit/ads)*100 : 0;
    return { ads, sales, revenue, profit, roas, roi, days };
  }, [records, monthDays]);

  const prodStats = useMemo(() => products.map(p => {
    let ads=0, sales=0, revenue=0;
    const pd = pData[p.id] || {};
    monthDays.forEach(date => {
      const r = pd[date];
      if (r) { ads+=r.ads||0; sales+=r.sales||0; revenue+=r.revenue||0; }
    });
    const profit = revenue-ads;
    const roas = ads>0 ? revenue/ads : null;
    return { ...p, ads, sales, revenue, profit, roas, status: roasStatus(roas) };
  }), [products, pData, monthDays]);

  const chartData = useMemo(() => monthDays.slice(0, today.getDate()).map(date => {
    const r = records[date] || { ads:0, sales:0, revenue:0 };
    return { day: parseInt(date.split("-")[2]), ...r, profit:(r.revenue||0)-(r.ads||0) };
  }), [records, monthDays]);

  const maxVal = useMemo(() => Math.max(...chartData.map(d => Math.max(d.revenue||0, d.ads||0)), 1), [chartData]);

  const subStats = useMemo(() => {
    const active = subs.filter(s => s.active);
    const monthlyTotal = active.reduce((acc,s) => {
      const p = parseFloat(s.price)||0;
      if (s.cycle === "Mesicne") return acc+p;
      if (s.cycle === "Rocne") return acc+p/12;
      if (s.cycle === "Ctvrtletne") return acc+p/3;
      return acc+p;
    }, 0);
    return { monthlyTotal, yearlyTotal: monthlyTotal*12, active: active.length };
  }, [subs]);

  function handleSave() {
    setRecords(prev => ({ ...prev, [editDate]: { ads: parseFloat(form.ads)||0, sales: parseInt(form.sales)||0, revenue: parseFloat(form.revenue)||0 }}));
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    setForm({ ads:"", sales:"", revenue:"" });
  }

  function loadDay(date) {
    setEditDate(date);
    const r = records[date];
    setForm(r ? { ads:String(r.ads), sales:String(r.sales), revenue:String(r.revenue) } : { ads:"", sales:"", revenue:"" });
    setTab("entry");
  }

  function addProduct() {
    if (!newProd.trim()) return;
    const colors = ["#a78bfa","#fb923c","#38bdf8","#f472b6","#a3e635"];
    const id = Date.now();
    setProducts(p => [...p, { id, name:newProd.trim(), color: colors[products.length % colors.length] }]);
    setPData(d => ({ ...d, [id]:{} }));
    setNewProd("");
  }

  function removeProduct(id) {
    setProducts(p => p.filter(x => x.id !== id));
    setPData(d => { const nd={...d}; delete nd[id]; return nd; });
  }

  function saveProductEntry() {
    if (!editProd) return;
    const { id, date, ads, sales, revenue } = editProd;
    setPData(prev => ({ ...prev, [id]: { ...prev[id], [date]: { ads: parseFloat(ads)||0, sales: parseInt(sales)||0, revenue: parseFloat(revenue)||0 }}}));
    setEditProd(null);
  }

  function openNewSub() { setSubForm({ name:"", category:"E-commerce", price:"", currency:"CZK", cycle:"Mesicne", active:true, note:"", color:"#818cf8" }); setEditSub(null); setShowSubForm(true); }
  function openEditSub(s) { setSubForm({...s, price:String(s.price)}); setEditSub(s.id); setShowSubForm(true); }
  function saveSub() {
    const entry = {...subForm, price: parseFloat(subForm.price)||0};
    if (editSub) { setSubs(prev => prev.map(s => s.id===editSub ? {...entry, id:editSub} : s)); }
    else { setSubs(prev => [...prev, {...entry, id:Date.now()}]); }
    setShowSubForm(false);
  }
  function deleteSub(id) { setSubs(prev => prev.filter(s => s.id !== id)); }
  function toggleSub(id) { setSubs(prev => prev.map(s => s.id===id ? {...s, active:!s.active} : s)); }

  const TABS = [["overview","Prehled"],["products","Produkty"],["subs","Predplatne"],["table","Tabulka"],["entry","Zapis"]];

  const S = {
    page: { minHeight:"100vh", background:"#0a0a0f", fontFamily:"monospace", color:"#e8e4d9" },
    header: { background:"linear-gradient(135deg,#0f0f1a,#1a1025)", borderBottom:"1px solid #2a2535", padding:"20px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"12px" },
    tabBar: { display:"flex", borderBottom:"1px solid #1e1b2e", padding:"0 24px", background:"#0d0d18", overflowX:"auto" },
    content: { padding:"24px", maxWidth:"960px", margin:"0 auto" },
    card: { background:"#12111e", border:"1px solid #2a2540", borderRadius:"12px", padding:"20px" },
    cardTitle: { fontSize:"10px", color:"#6b5fa0", letterSpacing:"3px", textTransform:"uppercase", marginBottom:"16px" },
    label: { display:"block", fontSize:"10px", color:"#6b5fa0", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"7px" },
    input: { width:"100%", background:"#0f0e1a", border:"1px solid #2a2540", borderRadius:"8px", padding:"11px 14px", color:"#e8e4d9", fontSize:"14px", fontFamily:"monospace", outline:"none", boxSizing:"border-box" },
    btnPrimary: { padding:"11px 18px", background:"linear-gradient(135deg,#3730a3,#4f46e5)", border:"none", borderRadius:"8px", color:"#fff", fontSize:"13px", fontWeight:"700", cursor:"pointer", fontFamily:"monospace", letterSpacing:"1px" },
    btnSecondary: { padding:"11px 18px", background:"#1a1830", border:"1px solid #2a2540", borderRadius:"8px", color:"#c4b5fd", fontSize:"13px", cursor:"pointer", fontFamily:"monospace" },
    arrowBtn: { background:"#1a1830", border:"1px solid #2a2540", color:"#c4b5fd", width:"32px", height:"32px", borderRadius:"6px", cursor:"pointer", fontSize:"18px", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"monospace" },
    iconBtn: { background:"none", border:"none", cursor:"pointer", fontSize:"14px", padding:"4px", fontFamily:"monospace", color:clr.muted },
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <div style={{ fontSize:"10px", letterSpacing:"4px", color:"#6b5fa0", textTransform:"uppercase", marginBottom:"4px" }}>Dropshipping</div>
          <div style={{ fontSize:"22px", fontWeight:"700", background:"linear-gradient(90deg,#c4b5fd,#818cf8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Ekonomicky Dashboard</div>
        </div>
        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
          <button onClick={() => setSelMonth(m => Math.max(0,m-1))} style={S.arrowBtn}>&lt;</button>
          <div style={{ fontSize:"14px", color:"#c4b5fd", minWidth:"130px", textAlign:"center", fontWeight:"600" }}>{MONTHS[selMonth]} {selYear}</div>
          <button onClick={() => setSelMonth(m => Math.min(11,m+1))} style={S.arrowBtn}>&gt;</button>
        </div>
      </div>

      <div style={S.tabBar}>
        {TABS.map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding:"14px 16px", background:"none", border:"none", whiteSpace:"nowrap", borderBottom: tab===id ? "2px solid #818cf8" : "2px solid transparent", color: tab===id ? "#c4b5fd" : clr.muted, fontSize:"12px", cursor:"pointer", fontFamily:"monospace", letterSpacing:"1px", transition:"all .2s" }}>{label}</button>
        ))}
      </div>

      <div style={S.content}>

        {tab==="overview" && (
          <div>
            <div style={{ marginBottom:"18px", display:"flex", alignItems:"center", gap:"12px", flexWrap:"wrap" }}>
              <Badge status={roasStatus(stats.roas)} />
              <span style={{ fontSize:"12px", color:clr.muted }}>Celkovy ROAS: <strong style={{ color:"#fbbf24" }}>{stats.roas.toFixed(2)}x</strong> (winning &gt;= {WINNING_ROAS}x)</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:"12px", marginBottom:"24px" }}>
              <KpiCard label="Utrata reklama" value={fmtK(stats.ads)} icon="$" color={clr.lose} sub={stats.days + " dni"} />
              <KpiCard label="Celkove trzby" value={fmtK(stats.revenue)} icon="+" color={clr.win} sub={fmt(stats.sales) + " obj."} />
              <KpiCard label="Cisty zisk" value={fmtK(stats.profit)} icon="=" color={stats.profit>=0?clr.purple:clr.lose} sub={stats.profit>=0?"V zisku":"Ztrata"} />
              <KpiCard label="ROAS" value={stats.roas.toFixed(2)+"x"} icon="%" color={clr.eq} sub={"ROI " + stats.roi.toFixed(1) + "%"} />
            </div>
            <div style={S.card}>
              <div style={S.cardTitle}>Denni vyvoj - {MONTHS[selMonth]}</div>
              <div style={{ display:"flex", alignItems:"flex-end", gap:"3px", height:"110px" }}>
                {chartData.map((d,i) => (
                  <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", height:"100%" }}>
                    <div style={{ width:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end", height:"100%", gap:"1px" }}>
                      <div style={{ width:"100%", background:clr.win, height:(d.revenue/maxVal*100)+"%", borderRadius:"2px 2px 0 0", opacity:.85 }} />
                      <div style={{ width:"100%", background:clr.lose, height:(d.ads/maxVal*100)+"%", borderRadius:"2px 2px 0 0", opacity:.7 }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:"16px", marginTop:"10px", fontSize:"10px", color:clr.muted }}>
                <span style={{ color:clr.win }}>* Trzby</span>
                <span style={{ color:clr.lose }}>* Reklama</span>
              </div>
            </div>
          </div>
        )}

        {tab==="products" && (
          <div>
            <div style={{ display:"flex", gap:"10px", marginBottom:"24px" }}>
              <input value={newProd} onChange={e => setNewProd(e.target.value)} onKeyDown={e => e.key==="Enter" && addProduct()} placeholder="Nazev noveho produktu..." style={{...S.input, flex:1}} />
              <button onClick={addProduct} style={S.btnPrimary}>+ Pridat</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))", gap:"16px" }}>
              {prodStats.map(p => {
                const bc = p.status ? STATUS_CFG[p.status] : null;
                return (
                  <div key={p.id} style={{ background:"#12111e", border:"1px solid " + (bc ? bc.color+"44" : "#2a2540"), borderRadius:"14px", padding:"20px" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                        <div style={{ width:"10px", height:"10px", borderRadius:"50%", background:p.color }} />
                        <span style={{ fontWeight:"700", fontSize:"15px" }}>{p.name}</span>
                      </div>
                      <button onClick={() => removeProduct(p.id)} style={{ background:"none", border:"none", color:"#4b4860", cursor:"pointer", fontSize:"18px" }}>x</button>
                    </div>
                    {p.status && <div style={{ marginBottom:"14px" }}><Badge status={p.status} /></div>}
                    {[
                      ["ROAS", p.roas!==null ? p.roas.toFixed(2)+"x" : "-", p.roas!==null?(p.roas>=WINNING_ROAS?clr.win:p.roas>=1?clr.eq:clr.lose):"#4b4860"],
                      ["Trzby", fmtK(p.revenue), clr.win],
                      ["Reklama", fmtK(p.ads), clr.lose],
                      ["Zisk", fmtK(p.profit), p.profit>=0?clr.purple:clr.lose],
                      ["Objednavky", String(p.sales), "#e8e4d9"],
                    ].map(([label,val,color]) => (
                      <div key={label} style={{ display:"flex", justifyContent:"space-between", marginBottom:"7px" }}>
                        <span style={{ fontSize:"11px", color:clr.muted }}>{label}</span>
                        <span style={{ fontSize:"13px", fontWeight:"700", color }}>{val}</span>
                      </div>
                    ))}
                    {p.roas !== null && (
                      <div style={{ marginTop:"14px" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:"10px", color:clr.muted, marginBottom:"5px" }}>
                          <span>ROAS progress</span><span>cil {WINNING_ROAS}x</span>
                        </div>
                        <div style={{ background:"#1a1830", borderRadius:"4px", height:"6px", overflow:"hidden" }}>
                          <div style={{ width: Math.min((p.roas/WINNING_ROAS)*100,100)+"%", height:"100%", background: p.roas>=WINNING_ROAS?clr.win:p.roas>=1?clr.eq:clr.lose, borderRadius:"4px" }} />
                        </div>
                      </div>
                    )}
                    <button onClick={() => setEditProd({id:p.id,date:todayStr,ads:"",sales:"",revenue:""})} style={{...S.btnSecondary, width:"100%", marginTop:"14px", fontSize:"11px"}}>Zapsat dnesni den</button>
                  </div>
                );
              })}
            </div>
            {editProd && (
              <div style={{ position:"fixed", inset:0, background:"#000000bb", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
                <div style={{ background:"#12111e", border:"1px solid #2a2540", borderRadius:"14px", padding:"24px", width:"100%", maxWidth:"400px" }}>
                  <div style={{ fontSize:"11px", color:"#6b5fa0", letterSpacing:"2px", marginBottom:"16px", textTransform:"uppercase" }}>Zapis - {products.find(p => p.id===editProd.id)?.name}</div>
                  <div style={{ marginBottom:"12px" }}><label style={S.label}>Datum</label><input type="date" value={editProd.date} onChange={e => setEditProd(p => ({...p,date:e.target.value}))} style={S.input} /></div>
                  {[["ads","Reklama (Kc)","1200"],["sales","Objednavky","10"],["revenue","Trzby (Kc)","3600"]].map(([k,lbl,ph]) => (
                    <div key={k} style={{ marginBottom:"12px" }}><label style={S.label}>{lbl}</label><input type="number" placeholder={ph} value={editProd[k]} onChange={e => setEditProd(p => ({...p,[k]:e.target.value}))} style={S.input} /></div>
                  ))}
                  <div style={{ display:"flex", gap:"10px" }}>
                    <button onClick={() => setEditProd(null)} style={{...S.btnSecondary, flex:1}}>Zrusit</button>
                    <button onClick={saveProductEntry} style={{...S.btnPrimary, flex:1}}>Ulozit</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab==="subs" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:"12px", marginBottom:"24px" }}>
              <KpiCard label="Mes. naklady" value={fmtK(subStats.monthlyTotal)} icon="$" color="#fb923c" sub={subStats.active + " aktivnich"} />
              <KpiCard label="Rocni naklady" value={fmtK(subStats.yearlyTotal)} icon="$" color="#f87171" sub="odhad" />
              <KpiCard label="Celkem sluzeb" value={String(subs.length)} icon="#" color="#818cf8" sub={subs.filter(s=>!s.active).length + " neaktivnich"} />
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"16px" }}>
              <button onClick={openNewSub} style={S.btnPrimary}>+ Pridat predplatne</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {subs.map(s => (
                <div key={s.id} style={{ background:"#12111e", border:"1px solid " + (s.active?"#2a2540":"#1a1828"), borderRadius:"12px", padding:"16px", display:"flex", alignItems:"center", gap:"12px", opacity:s.active?1:0.55 }}>
                  <div style={{ width:"10px", height:"10px", borderRadius:"50%", background:s.color, flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px", flexWrap:"wrap" }}>
                      <span style={{ fontWeight:"700", fontSize:"14px" }}>{s.name}</span>
                      <span style={{ fontSize:"9px", color:"#6b5fa0", background:"#1a1830", padding:"2px 7px", borderRadius:"4px" }}>{s.category}</span>
                      <span style={{ fontSize:"9px", color:s.active?clr.win:clr.muted }}>{s.active?"Aktivni":"Neaktivni"}</span>
                    </div>
                    {s.note && <div style={{ fontSize:"11px", color:"#4b4860" }}>{s.note}</div>}
                    <div style={{ fontSize:"11px", color:clr.muted }}>{s.cycle}</div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontSize:"18px", fontWeight:"700", color:"#fb923c" }}>{fmtK(s.price)}</div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                    <button onClick={() => toggleSub(s.id)} style={{...S.iconBtn, color:s.active?clr.win:clr.muted}}>{s.active?"*":"o"}</button>
                    <button onClick={() => openEditSub(s)} style={S.iconBtn}>E</button>
                    <button onClick={() => deleteSub(s.id)} style={{...S.iconBtn, color:clr.lose}}>x</button>
                  </div>
                </div>
              ))}
            </div>
            {showSubForm && (
              <div style={{ position:"fixed", inset:0, background:"#000000bb", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px", overflowY:"auto" }}>
                <div style={{ background:"#12111e", border:"1px solid #2a2540", borderRadius:"14px", padding:"24px", width:"100%", maxWidth:"440px", margin:"auto" }}>
                  <div style={{ fontSize:"11px", color:"#6b5fa0", letterSpacing:"2px", marginBottom:"20px", textTransform:"uppercase" }}>{editSub ? "Upravit" : "Nove predplatne"}</div>
                  {[["name","Nazev","Shopify..."],["note","Poznamka",""]].map(([k,lbl,ph]) => (
                    <div key={k} style={{ marginBottom:"14px" }}><label style={S.label}>{lbl}</label><input placeholder={ph} value={subForm[k]} onChange={e => setSubForm(f => ({...f,[k]:e.target.value}))} style={S.input} /></div>
                  ))}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"14px" }}>
                    <div><label style={S.label}>Cena</label><input type="number" placeholder="299" value={subForm.price} onChange={e => setSubForm(f => ({...f,price:e.target.value}))} style={S.input} /></div>
                    <div><label style={S.label}>Mena</label>
                      <select value={subForm.currency} onChange={e => setSubForm(f => ({...f,currency:e.target.value}))} style={{...S.input, cursor:"pointer"}}>
                        {["CZK","EUR","USD","GBP"].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"14px" }}>
                    <div><label style={S.label}>Frekvence</label>
                      <select value={subForm.cycle} onChange={e => setSubForm(f => ({...f,cycle:e.target.value}))} style={{...S.input, cursor:"pointer"}}>
                        {BILLING_CYCLES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div><label style={S.label}>Kategorie</label>
                      <select value={subForm.category} onChange={e => setSubForm(f => ({...f,category:e.target.value}))} style={{...S.input, cursor:"pointer"}}>
                        {SUB_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom:"20px", display:"flex", alignItems:"center", gap:"10px" }}>
                    <div onClick={() => setSubForm(f => ({...f,active:!f.active}))} style={{ width:"36px", height:"20px", borderRadius:"10px", background:subForm.active?"#3730a3":"#1a1830", cursor:"pointer", position:"relative", border:"1px solid #2a2540" }}>
                      <div style={{ position:"absolute", top:"2px", left:subForm.active?"16px":"2px", width:"14px", height:"14px", borderRadius:"50%", background:subForm.active?"#818cf8":"#4b4860", transition:"left .2s" }} />
                    </div>
                    <span style={{ fontSize:"12px", color:subForm.active?clr.win:clr.muted }}>{subForm.active?"Aktivni":"Neaktivni"}</span>
                  </div>
                  <div style={{ display:"flex", gap:"10px" }}>
                    <button onClick={() => setShowSubForm(false)} style={{...S.btnSecondary, flex:1}}>Zrusit</button>
                    <button onClick={saveSub} style={{...S.btnPrimary, flex:1}}>Ulozit</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab==="table" && (
          <div style={{ background:"#12111e", border:"1px solid #2a2540", borderRadius:"12px", overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"13px", minWidth:"580px" }}>
              <thead>
                <tr style={{ background:"#1a1830", borderBottom:"1px solid #2a2540" }}>
                  {["Datum","Reklama","Obj.","Trzby","Zisk","ROAS","Status"].map(h => (
                    <th key={h} style={{ padding:"12px", textAlign:"left", fontSize:"9px", color:"#6b5fa0", letterSpacing:"2px", textTransform:"uppercase", fontWeight:"600" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthDays.map((date,i) => {
                  const r = records[date];
                  const profit = r ? (r.revenue-r.ads) : null;
                  const roas = r && r.ads>0 ? r.revenue/r.ads : null;
                  const st = roasStatus(roas);
                  const isToday = date===todayStr;
                  return (
                    <tr key={date} onClick={() => loadDay(date)} style={{ borderBottom:"1px solid #1a1828", background:isToday?"#1a1535":i%2===0?"#12111e":"#111020", cursor:"pointer" }}
                      onMouseEnter={e => e.currentTarget.style.background="#1e1c35"}
                      onMouseLeave={e => e.currentTarget.style.background=isToday?"#1a1535":i%2===0?"#12111e":"#111020"}>
                      <td style={{ padding:"9px 12px", color:isToday?"#c4b5fd":"#a09ab8" }}>{date.split("-")[2]}. {MONTHS[parseInt(date.split("-")[1])-1].substring(0,3)}.{isToday&&<span style={{ marginLeft:"6px", fontSize:"8px", background:"#3730a3", color:"#a5b4fc", padding:"1px 5px", borderRadius:"4px" }}>DNES</span>}</td>
                      <td style={{ padding:"9px 12px", color:r?clr.lose:"#2a2540" }}>{r?fmt(r.ads):"-"}</td>
                      <td style={{ padding:"9px 12px", color:r?"#e8e4d9":"#2a2540" }}>{r?r.sales:"-"}</td>
                      <td style={{ padding:"9px 12px", color:r?clr.win:"#2a2540" }}>{r?fmt(r.revenue):"-"}</td>
                      <td style={{ padding:"9px 12px", color:profit!==null?(profit>=0?clr.purple:clr.lose):"#2a2540", fontWeight:profit!==null?"700":"400" }}>{profit!==null?fmt(profit):"-"}</td>
                      <td style={{ padding:"9px 12px", color:roas!==null?(roas>=WINNING_ROAS?clr.win:roas>=1?clr.eq:clr.lose):"#2a2540", fontWeight:"600" }}>{roas!==null?roas.toFixed(2)+"x":"-"}</td>
                      <td style={{ padding:"9px 12px" }}>{st ? <Badge status={st} /> : null}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background:"#1a1830", borderTop:"2px solid #2a2540" }}>
                  <td style={{ padding:"12px", fontSize:"9px", color:"#6b5fa0", letterSpacing:"2px", textTransform:"uppercase" }}>SOUCET</td>
                  <td style={{ padding:"12px", color:clr.lose, fontWeight:"700" }}>{fmt(stats.ads)}</td>
                  <td style={{ padding:"12px", color:"#e8e4d9", fontWeight:"700" }}>{fmt(stats.sales)}</td>
                  <td style={{ padding:"12px", color:clr.win, fontWeight:"700" }}>{fmt(stats.revenue)}</td>
                  <td style={{ padding:"12px", color:stats.profit>=0?clr.purple:clr.lose, fontWeight:"700" }}>{fmt(stats.profit)}</td>
                  <td style={{ padding:"12px", color:clr.eq, fontWeight:"700" }}>{stats.roas.toFixed(2)}x</td>
                  <td style={{ padding:"12px" }}><Badge status={roasStatus(stats.roas)} /></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {tab==="entry" && (
          <div style={{ maxWidth:"460px" }}>
            <div style={{ background:"#12111e", border:"1px solid #2a2540", borderRadius:"12px", padding:"24px" }}>
              <div style={{ fontSize:"11px", color:"#6b5fa0", letterSpacing:"3px", textTransform:"uppercase", marginBottom:"20px" }}>Zapis dne</div>
              <div style={{ marginBottom:"14px" }}><label style={S.label}>Datum</label><input type="date" value={editDate} onChange={e => { setEditDate(e.target.value); const r=records[e.target.value]; setForm(r?{ads:String(r.ads),sales:String(r.sales),revenue:String(r.revenue)}:{ads:"",sales:"",revenue:""}); }} style={S.input} /></div>
              {[["ads","Utrata za reklamu (Kc)","1200"],["sales","Pocet objednavek","12"],["revenue","Celkove trzby (Kc)","3600"]].map(([k,lbl,ph]) => (
                <div key={k} style={{ marginBottom:"14px" }}><label style={S.label}>{lbl}</label><input type="number" placeholder={"napr. "+ph} value={form[k]} onChange={e => setForm(f => ({...f,[k]:e.target.value}))} style={S.input} /></div>
              ))}
              {(form.ads||form.revenue) && (() => {
                const a=parseFloat(form.ads)||0, r=parseFloat(form.revenue)||0, s=parseInt(form.sales)||0;
                const roas=a>0?r/a:null; const profit=r-a; const st=roasStatus(roas);
                return (
                  <div style={{ background:"#0f0e1a", border:"1px solid #2a2540", borderRadius:"8px", padding:"14px", marginBottom:"18px" }}>
                    <div style={{ fontSize:"10px", color:"#6b5fa0", letterSpacing:"2px", marginBottom:"10px" }}>AUTOMATICKY VYPOCET</div>
                    {[
                      ["Zisk", fmtK(profit), profit>=0?clr.purple:clr.lose],
                      ["ROAS", roas?roas.toFixed(2)+"x":"-", roas>=WINNING_ROAS?clr.win:roas>=1?clr.eq:clr.lose],
                      ["ROI", a>0?((profit/a)*100).toFixed(1)+"%":"-", "#fbbf24"],
                      ["Cena/obj.", s>0&&a>0?fmtK(a/s):"-", "#a5b4fc"],
                    ].map(([label,val,color]) => (
                      <div key={label} style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                        <span style={{ fontSize:"11px", color:clr.muted }}>{label}</span>
                        <span style={{ fontSize:"13px", fontWeight:"700", color }}>{val}</span>
                      </div>
                    ))}
                    {st && <div style={{ marginTop:"10px" }}><Badge status={st} /></div>}
                  </div>
                );
              })()}
              <button onClick={handleSave} style={{ width:"100%", padding:"14px", background:saved?"linear-gradient(135deg,#065f46,#047857)":"linear-gradient(135deg,#3730a3,#4f46e5)", border:"none", borderRadius:"8px", color:"#fff", fontSize:"14px", fontWeight:"700", cursor:"pointer", fontFamily:"monospace", letterSpacing:"1px", transition:"all .3s" }}>
                {saved ? "Ulozeno!" : "Ulozit zaznam"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
