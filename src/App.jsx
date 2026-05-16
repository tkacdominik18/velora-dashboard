import { useState, useMemo, useEffect } from "react";

const MONTHS = ["Leden","Unor","Brezen","Duben","Kveten","Cerven","Cervenec","Srpen","Zari","Rijen","Listopad","Prosinec"];
const today = new Date();
const todayStr = today.toISOString().split("T")[0];
const WINNING_ROAS = 1.8;

const fmt = (n) => Number(n).toLocaleString("cs-CZ", { maximumFractionDigits: 0 });
const fmtK = (n) => fmt(n) + " Kc";
const clr = { win:"#34d399", lose:"#f87171", eq:"#fbbf24", yellow:"#fbbf24", purple:"#818cf8", muted:"#6b6880" };

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
  return <span style={{ fontSize:"10px", fontWeight:"700", color:c.color, background:c.bg, padding:"3px 8px", borderRadius:"4px", border:"1px solid "+c.color+"44" }}>{c.label}</span>;
}

function KpiCard({ label, value, sub, color, icon }) {
  return (
    <div style={{ background:"linear-gradient(135deg,#12111e,#1a1830)", border:"1px solid #2a2540", borderRadius:"12px", padding:"16px", position:"relative" }}>
      {icon && <div style={{ position:"absolute", top:"12px", right:"14px", fontSize:"20px", opacity:.35 }}>{icon}</div>}
      <div style={{ fontSize:"10px", color:clr.muted, letterSpacing:"2px", textTransform:"uppercase", marginBottom:"8px" }}>{label}</div>
      <div style={{ fontSize:"20px", fontWeight:"700", color, marginBottom:"4px" }}>{value}</div>
      <div style={{ fontSize:"11px", color:"#4b4860" }}>{sub}</div>
    </div>
  );
}

const SUB_CATEGORIES = ["E-commerce","Reklama","Design","Analytics","Logistika","Komunikace","Ostatni"];
const INIT_SUBS = [
  { id:1, name:"Shopify", category:"E-commerce", price:1800, currency:"CZK", cycle:"Mesicne", active:true, note:"Prostredni plan", color:"#34d399" },
  { id:2, name:"Meta Ads", category:"Reklama", price:0, currency:"CZK", cycle:"Mesicne", active:true, note:"Variabilni", color:"#818cf8" },
  { id:3, name:"Canva Pro", category:"Design", price:300, currency:"CZK", cycle:"Mesicne", active:true, note:"Grafika", color:"#f472b6" },
];

export default function App() {
  const [tab, setTab] = useState("overview");
  const [shopifyRecords, setShopifyRecords] = useState({});
  const [metaRecords, setMetaRecords] = useState({});
  const [metaCampaigns, setMetaCampaigns] = useState([]);
  const [shopifyErr, setShopifyErr] = useState(null);
  const [metaErr, setMetaErr] = useState(null);
  const [selMonth, setSelMonth] = useState(today.getMonth());
  const [selYear] = useState(today.getFullYear());
  const [allTime, setAllTime] = useState(false);
  const [editDate, setEditDate] = useState(todayStr);
  const [subs, setSubs] = useState(INIT_SUBS);
  const [showSubForm, setShowSubForm] = useState(false);
  const [editSub, setEditSub] = useState(null);
  const [subForm, setSubForm] = useState({ name:"", category:"E-commerce", price:"", currency:"CZK", cycle:"Mesicne", active:true, note:"", color:"#818cf8" });

  // Fetch Shopify data
  useEffect(() => {
    setShopifyErr(null);
    const params = allTime
      ? "?from=2026-01-01&to=" + todayStr
      : "?from=" + selYear + "-" + String(selMonth+1).padStart(2,"0") + "-01&to=" + selYear + "-" + String(selMonth+1).padStart(2,"0") + "-" + String(new Date(selYear, selMonth+1, 0).getDate()).padStart(2,"0");
    fetch("/api/shopify" + params)
      .then(r => r.json())
      .then(data => { if (data.error) throw new Error(data.error); setShopifyRecords(data); })
      .catch(e => setShopifyErr(e.message));
  }, [selMonth, selYear, allTime]);

  // Fetch Meta Ads daily data
  useEffect(() => {
    setMetaErr(null);
    const params = allTime
      ? "?from=2026-01-01&to=" + todayStr
      : "?from=" + selYear + "-" + String(selMonth+1).padStart(2,"0") + "-01&to=" + selYear + "-" + String(selMonth+1).padStart(2,"0") + "-" + String(new Date(selYear, selMonth+1, 0).getDate()).padStart(2,"0");
    fetch("/api/meta" + params)
      .then(r => r.json())
      .then(data => { if (data.error) throw new Error(data.error); setMetaRecords(data); })
      .catch(e => setMetaErr(e.message));
  }, [selMonth, selYear, allTime]);

 // Fetch Meta Campaigns
  useEffect(() => {
    const params = allTime
      ? "?from=2026-03-20&to=" + todayStr
      : "?from=" + selYear + "-" + String(selMonth+1).padStart(2,"0") + "-01&to=" + selYear + "-" + String(selMonth+1).padStart(2,"0") + "-" + String(new Date(selYear, selMonth+1, 0).getDate()).padStart(2,"0");
    fetch("/api/meta-campaigns" + params)
      .then(r => r.json())
      .then(data => { if (!data.error) setMetaCampaigns(data); })
      .catch(() => {});
  }, [selMonth, selYear, allTime]);

  const records = useMemo(() => {
    const merged = {};
    const allDates = new Set([...Object.keys(shopifyRecords), ...Object.keys(metaRecords)]);
    allDates.forEach(date => {
      merged[date] = {
        ads: metaRecords[date]?.spend || 0,
        sales: shopifyRecords[date]?.sales || 0,
        revenue: shopifyRecords[date]?.revenue || 0,
      };
    });
    return merged;
  }, [shopifyRecords, metaRecords]);

  const activeDays = useMemo(() => {
    if (allTime) {
      return Object.keys(records).sort();
    }
    const n = new Date(selYear, selMonth+1, 0).getDate();
    return Array.from({length:n}, (_,i) => {
      const d = i+1;
      return selYear + "-" + String(selMonth+1).padStart(2,"0") + "-" + String(d).padStart(2,"0");
    });
  }, [selMonth, selYear, allTime, records]);

  const stats = useMemo(() => {
    let ads=0, sales=0, revenue=0, days=0;
    activeDays.forEach(date => {
      const r = records[date];
      if (r && (r.sales>0 || r.ads>0)) { ads+=r.ads||0; sales+=r.sales||0; revenue+=r.revenue||0; days++; }
    });
    const profit = revenue-ads;
    const roas = ads>0 ? revenue/ads : 0;
    const roi = ads>0 ? (profit/ads)*100 : 0;
    return { ads, sales, revenue, profit, roas, roi, days };
  }, [records, activeDays]);

  const chartData = useMemo(() => {
    const days = allTime
      ? Object.keys(records).sort()
      : activeDays.filter(d => d <= todayStr);
    return days.map(date => {
      const r = records[date] || { ads:0, sales:0, revenue:0 };
      return { day: date.split("-")[2], date, ...r, profit:(r.revenue||0)-(r.ads||0) };
    });
  }, [records, activeDays, allTime]);

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

  const TABS = [["overview","Prehled"],["products","Produkty"],["subs","Naklady"],["table","Tabulka"]];

  const CAMPAIGN_COLORS = ["#818cf8","#34d399","#f87171","#fbbf24","#f472b6","#fb923c","#38bdf8","#a78bfa","#a3e635","#e879f9"];

  const S = {
    page: { minHeight:"100vh", background:"#0a0a0f", fontFamily:"monospace", color:"#e8e4d9" },
    header: { background:"linear-gradient(135deg,#0f0f1a,#1a1025)", borderBottom:"1px solid #2a2535", padding:"20px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"12px" },
    tabBar: { display:"flex", borderBottom:"1px solid #1e1b2e", padding:"0 24px", background:"#0d0d18", overflowX:"auto" },
    content: { padding:"24px", maxWidth:"960px", margin:"0 auto" },
    card: { background:"#12111e", border:"1px solid #2a2540", borderRadius:"12px", padding:"20px" },
    cardTitle: { fontSize:"10px", color:"#6b5fa0", letterSpacing:"3px", textTransform:"uppercase", marginBottom:"16px" },
    label: { display:"block", fontSize:"10px", color:"#6b5fa0", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"7px" },
    input: { width:"100%", background:"#0f0e1a", border:"1px solid #2a2540", borderRadius:"8px", padding:"11px 14px", color:"#e8e4d9", fontSize:"14px", fontFamily:"monospace", outline:"none", boxSizing:"border-box" },
    btnPrimary: { padding:"11px 18px", background:"linear-gradient(135deg,#3730a3,#4f46e5)", border:"none", borderRadius:"8px", color:"#fff", fontSize:"13px", fontWeight:"700", cursor:"pointer", fontFamily:"monospace" },
    btnSecondary: { padding:"11px 18px", background:"#1a1830", border:"1px solid #2a2540", borderRadius:"8px", color:"#c4b5fd", fontSize:"13px", cursor:"pointer", fontFamily:"monospace" },
    arrowBtn: { background:"#1a1830", border:"1px solid #2a2540", color:"#c4b5fd", width:"32px", height:"32px", borderRadius:"6px", cursor:"pointer", fontSize:"18px", display:"flex", alignItems:"center", justifyContent:"center" },
    iconBtn: { background:"none", border:"none", cursor:"pointer", fontSize:"14px", padding:"4px", color:clr.muted },
    allTimeBtn: (active) => ({ padding:"8px 14px", background: active ? "linear-gradient(135deg,#3730a3,#4f46e5)" : "#1a1830", border: active ? "none" : "1px solid #2a2540", borderRadius:"6px", color: active ? "#fff" : "#c4b5fd", fontSize:"11px", fontWeight: active ? "700" : "400", cursor:"pointer", fontFamily:"monospace", whiteSpace:"nowrap" }),
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <div style={{ fontSize:"10px", letterSpacing:"4px", color:"#6b5fa0", textTransform:"uppercase", marginBottom:"4px" }}>Dropshipping</div>
          <div style={{ fontSize:"22px", fontWeight:"700", background:"linear-gradient(90deg,#c4b5fd,#818cf8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Ekonomicky Dashboard</div>
        </div>
        <div style={{ display:"flex", gap:"8px", alignItems:"center", flexWrap:"wrap" }}>
          <button onClick={() => setAllTime(true)} style={S.allTimeBtn(allTime)}>Cela doba</button>
          {allTime ? (
            <button onClick={() => setAllTime(false)} style={S.allTimeBtn(false)}>Mesicne</button>
          ) : (
            <>
              <button onClick={() => setSelMonth(m => Math.max(0,m-1))} style={S.arrowBtn}>&lt;</button>
              <div style={{ fontSize:"14px", color:"#c4b5fd", minWidth:"130px", textAlign:"center", fontWeight:"600" }}>{MONTHS[selMonth]} {selYear}</div>
              <button onClick={() => setSelMonth(m => Math.min(11,m+1))} style={S.arrowBtn}>&gt;</button>
            </>
          )}
        </div>
      </div>

      {/* Chybove hlasky - zobrazit jen pri chybe */}
      {(shopifyErr || metaErr) && (
        <div style={{ display:"flex", gap:"0" }}>
          {shopifyErr && <div style={{ background:"#1f0606", padding:"6px 16px", fontSize:"11px", color:"#f87171", flex:1 }}>Shopify chyba: {shopifyErr}</div>}
          {metaErr && <div style={{ background:"#1f0606", padding:"6px 16px", fontSize:"11px", color:"#f87171", flex:1 }}>Meta chyba: {metaErr}</div>}
        </div>
      )}

      <div style={S.tabBar}>
        {TABS.map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding:"14px 16px", background:"none", border:"none", whiteSpace:"nowrap", borderBottom: tab===id ? "2px solid #818cf8" : "2px solid transparent", color: tab===id ? "#c4b5fd" : clr.muted, fontSize:"12px", cursor:"pointer", fontFamily:"monospace", letterSpacing:"1px" }}>{label}</button>
        ))}
      </div>

      <div style={S.content}>

        {tab==="overview" && (
          <div>
            <div style={{ marginBottom:"18px", display:"flex", alignItems:"center", gap:"12px", flexWrap:"wrap" }}>
              <Badge status={roasStatus(stats.roas)} />
              <span style={{ fontSize:"12px", color:clr.muted }}>ROAS: <strong style={{ color:"#fbbf24" }}>{stats.roas.toFixed(2)}x</strong> (winning &gt;= {WINNING_ROAS}x)</span>
              {allTime && <span style={{ fontSize:"11px", color:"#6b5fa0", background:"#1a1830", padding:"3px 8px", borderRadius:"4px" }}>od 1.1.2026</span>}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:"12px", marginBottom:"24px" }}>
              <KpiCard label="Reklamy" value={fmtK(stats.ads)} color={clr.yellow} sub={fmt(stats.sales) + " obj."} />
              <KpiCard label="Shopify" value={fmtK(stats.revenue)} color={clr.yellow} sub={fmt(stats.sales) + " obj."} />
              <KpiCard label="Cisty zisk" value={fmtK(stats.profit)} icon="=" color={stats.profit>=0?clr.win:clr.lose} sub={stats.profit>=0?"V zisku":"Ztrata"} />
              <KpiCard label="ROAS" value={stats.roas.toFixed(2)+"x"} icon="%" color={clr.eq} sub={"ROI " + stats.roi.toFixed(1) + "%"} />
            </div>
            <div style={S.card}>
              <div style={S.cardTitle}>Denni vyvoj - {allTime ? "Cela doba" : MONTHS[selMonth]}</div>
              <div style={{ display:"flex", alignItems:"flex-end", gap:"2px", height:"110px", overflowX: allTime ? "auto" : "visible" }}>
                {chartData.map((d,i) => (
                  <div key={i} style={{ flex: allTime ? "0 0 12px" : 1, minWidth: allTime ? "12px" : undefined, display:"flex", flexDirection:"column", height:"100%" }}>
                    <div style={{ width:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end", height:"100%", gap:"1px" }}>
                      <div style={{ width:"100%", background:clr.win, height:(d.revenue/maxVal*100)+"%", borderRadius:"2px 2px 0 0", opacity:.85 }} />
                      <div style={{ width:"100%", background:clr.lose, height:(d.ads/maxVal*100)+"%", borderRadius:"2px 2px 0 0", opacity:.7 }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:"16px", marginTop:"10px", fontSize:"10px", color:clr.muted }}>
                <span style={{ color:clr.win }}>* Trzby (Shopify)</span>
                <span style={{ color:clr.lose }}>* Reklama (Meta)</span>
              </div>
            </div>
          </div>
        )}

        {tab==="products" && (
          <div>
            {metaCampaigns.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 20px", color:clr.muted }}>
                <div style={{ fontSize:"32px", marginBottom:"12px" }}>📊</div>
                <div style={{ fontSize:"14px", marginBottom:"8px" }}>Nacitam kampane z Meta Ads...</div>
                <div style={{ fontSize:"11px" }}>Zobrazuji kampane ktere jsou aktivni nebo byly aktivni ve zvolenem obdobi</div>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))", gap:"16px" }}>
                {metaCampaigns.map((campaign, idx) => {
                  const color = CAMPAIGN_COLORS[idx % CAMPAIGN_COLORS.length];
                  const roas = campaign.spend > 0 ? campaign.revenue / campaign.spend : null;
                  const profit = campaign.revenue - campaign.spend;
                  const st = roasStatus(roas);
                  const bc = st ? STATUS_CFG[st] : null;
                  return (
                    <div key={campaign.id} style={{ background:"#12111e", border:"1px solid "+(bc?bc.color+"44":"#2a2540"), borderRadius:"14px", padding:"20px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"12px" }}>
                        <div style={{ width:"10px", height:"10px", borderRadius:"50%", background:color, flexShrink:0 }} />
                        <span style={{ fontWeight:"700", fontSize:"14px", lineHeight:"1.3" }}>{campaign.name}</span>
                      </div>
                      {st && <div style={{ marginBottom:"14px" }}><Badge status={st} /></div>}
                      {[
                        ["ROAS", roas !== null ? roas.toFixed(2)+"x" : "-", roas !== null ? (roas>=WINNING_ROAS?clr.win:roas>=1?clr.eq:clr.lose) : "#4b4860"],
                        ["Utraceno za reklamu", fmtK(campaign.spend), clr.yellow],
                        ["Trzby", fmtK(campaign.revenue), clr.yellow],
                        ["Zisk / Ztrata", fmtK(profit), profit>=0?clr.win:clr.lose],
                        ["Objednavky", String(campaign.purchases || 0), "#e8e4d9"],
                        ["Budget denne", campaign.daily_budget ? fmtK(campaign.daily_budget) : "-", clr.muted],
                      ].map(([label,val,color]) => (
                        <div key={label} style={{ display:"flex", justifyContent:"space-between", marginBottom:"7px", gap:"8px" }}>
                          <span style={{ fontSize:"11px", color:clr.muted, flexShrink:0 }}>{label}</span>
                          <span style={{ fontSize:"13px", fontWeight:"700", color, textAlign:"right" }}>{val}</span>
                        </div>
                      ))}
                      {roas !== null && (
                        <div style={{ marginTop:"14px" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:"10px", color:clr.muted, marginBottom:"5px" }}><span>ROAS progress</span><span>cil {WINNING_ROAS}x</span></div>
                          <div style={{ background:"#1a1830", borderRadius:"4px", height:"6px", overflow:"hidden" }}>
                            <div style={{ width:Math.min((roas/WINNING_ROAS)*100,100)+"%", height:"100%", background:roas>=WINNING_ROAS?clr.win:roas>=1?clr.eq:clr.lose, borderRadius:"4px" }} />
                          </div>
                        </div>
                      )}
                      <div style={{ marginTop:"12px", padding:"8px", background:"#0f0e1a", borderRadius:"6px", display:"flex", justifyContent:"space-between" }}>
                        <span style={{ fontSize:"9px", color:clr.muted, textTransform:"uppercase", letterSpacing:"1px" }}>Status kampane</span>
                        <span style={{ fontSize:"9px", color: campaign.status==="ACTIVE" ? clr.win : clr.muted, fontWeight:"700" }}>{campaign.status || "–"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab==="subs" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:"12px", marginBottom:"24px" }}>
              <KpiCard label="Mes. naklady" value={fmtK(subStats.monthlyTotal)} color={clr.lose} sub={subStats.active + " aktivnich"} />
              <KpiCard label="Rocni naklady" value={fmtK(subStats.yearlyTotal)} color={clr.lose} sub="odhad" />
              <KpiCard label="Celkem sluzeb" value={String(subs.length)} icon="#" color="#818cf8" sub={subs.filter(s=>!s.active).length + " neaktivnich"} />
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"16px" }}>
              <button onClick={openNewSub} style={S.btnPrimary}>+ Pridat naklad</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {subs.map(s => (
                <div key={s.id} style={{ background:"#12111e", border:"1px solid "+(s.active?"#2a2540":"#1a1828"), borderRadius:"12px", padding:"16px", display:"flex", alignItems:"center", gap:"12px", opacity:s.active?1:0.55 }}>
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
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:"18px", fontWeight:"700", color:clr.lose }}>{fmtK(s.price)}</div>
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
              <div style={{ position:"fixed", inset:0, background:"#000000bb", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
                <div style={{ background:"#12111e", border:"1px solid #2a2540", borderRadius:"14px", padding:"24px", width:"100%", maxWidth:"440px" }}>
                  <div style={{ fontSize:"11px", color:"#6b5fa0", letterSpacing:"2px", marginBottom:"20px", textTransform:"uppercase" }}>{editSub?"Upravit naklad":"Novy naklad"}</div>
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
                  {["Datum","Reklamy","Obj.","Shopify","Zisk","ROAS","Status"].map(h => (
                    <th key={h} style={{ padding:"12px", textAlign:"left", fontSize:"9px", color:"#6b5fa0", letterSpacing:"2px", textTransform:"uppercase", fontWeight:"600" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeDays.map((date,i) => {
                  const r = records[date];
                  const hasData = r && (r.sales>0 || r.ads>0);
                  const profit = hasData ? (r.revenue-r.ads) : null;
                  const roas = hasData && r.ads>0 ? r.revenue/r.ads : null;
                  const st = roasStatus(roas);
                  const isToday = date===todayStr;
                  return (
                    <tr key={date} style={{ borderBottom:"1px solid #1a1828", background:isToday?"#1a1535":i%2===0?"#12111e":"#111020" }}
                      onMouseEnter={e => e.currentTarget.style.background="#1e1c35"}
                      onMouseLeave={e => e.currentTarget.style.background=isToday?"#1a1535":i%2===0?"#12111e":"#111020"}>
                      <td style={{ padding:"9px 12px", color:isToday?"#c4b5fd":"#a09ab8" }}>{date.split("-")[2]}. {MONTHS[parseInt(date.split("-")[1])-1].substring(0,3)}.{isToday&&<span style={{ marginLeft:"6px", fontSize:"8px", background:"#3730a3", color:"#a5b4fc", padding:"1px 5px", borderRadius:"4px" }}>DNES</span>}</td>
                      <td style={{ padding:"9px 12px", color:hasData?clr.yellow:"#2a2540" }}>{hasData?fmt(r.ads):"-"}</td>
                      <td style={{ padding:"9px 12px", color:hasData?"#e8e4d9":"#2a2540" }}>{hasData?r.sales:"-"}</td>
                      <td style={{ padding:"9px 12px", color:hasData?clr.yellow:"#2a2540" }}>{hasData?fmt(r.revenue):"-"}</td>
                      <td style={{ padding:"9px 12px", color:profit!==null?(profit>=0?clr.win:clr.lose):"#2a2540", fontWeight:profit!==null?"700":"400" }}>{profit!==null?fmt(profit):"-"}</td>
                      <td style={{ padding:"9px 12px", color:roas!==null?(roas>=WINNING_ROAS?clr.win:roas>=1?clr.eq:clr.lose):"#2a2540", fontWeight:"600" }}>{roas!==null?roas.toFixed(2)+"x":"-"}</td>
                      <td style={{ padding:"9px 12px" }}>{st?<Badge status={st}/>:null}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background:"#1a1830", borderTop:"2px solid #2a2540" }}>
                  <td style={{ padding:"12px", fontSize:"9px", color:"#6b5fa0", textTransform:"uppercase" }}>SOUCET</td>
                  <td style={{ padding:"12px", color:clr.yellow, fontWeight:"700" }}>{fmt(stats.ads)}</td>
                  <td style={{ padding:"12px", color:"#e8e4d9", fontWeight:"700" }}>{fmt(stats.sales)}</td>
                  <td style={{ padding:"12px", color:clr.yellow, fontWeight:"700" }}>{fmt(stats.revenue)}</td>
                  <td style={{ padding:"12px", color:stats.profit>=0?clr.win:clr.lose, fontWeight:"700" }}>{fmt(stats.profit)}</td>
                  <td style={{ padding:"12px", color:clr.eq, fontWeight:"700" }}>{stats.roas.toFixed(2)}x</td>
                  <td style={{ padding:"12px" }}><Badge status={roasStatus(stats.roas)}/></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
