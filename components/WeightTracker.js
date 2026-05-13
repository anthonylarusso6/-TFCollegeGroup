import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

const BG="#0f0f0f";
const PUR="#534AB7";
const RED="#C0392B";
const GREEN="#1E6B3A";
const GOLD="#D4AF37";
const STEEL="#708090";
const ORANGE="#E8720C";

export default function WeightTracker({athleteId}){
  const[entries,setEntries]=useState([]);
  const[weight,setWeight]=useState("");
  const[goalWeight,setGoalWeight]=useState("");
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);
  const[error,setError]=useState("");
  const[showGoalInput,setShowGoalInput]=useState(false);
  const GREEN="#1E6B3A",RED="#C0392B",PUR="#534AB7",GOLD="#D4AF37";

  const loadEntries=async()=>{
    const{data,error:err}=await supabase.from("weight_log").select("*").eq("athlete_id",athleteId).order("date",{ascending:true});
    if(err){setError("Could not load: "+err.message);return;}
    setEntries(data||[]);
    // Load goal weight from localStorage
    const saved=localStorage.getItem("goal_weight_"+athleteId);
    if(saved)setGoalWeight(saved);
  };

  useEffect(()=>{loadEntries();},[]);

  const save=async()=>{
    if(!weight)return;
    setSaving(true);setError("");
    const today=new Date().toISOString().split("T")[0];
    const existing=entries.find(e=>e.date===today);
    if(existing){
      const{error:err}=await supabase.from("weight_log").update({weight:parseFloat(weight)}).eq("id",existing.id);
      if(err){setError("Save failed: "+err.message);setSaving(false);return;}
    }else{
      const{error:err}=await supabase.from("weight_log").insert({athlete_id:athleteId,date:today,weight:parseFloat(weight)});
      if(err){setError("Save failed: "+err.message);setSaving(false);return;}
    }
    await loadEntries();
    setWeight("");setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),3000);
  };

  const first=entries[0]?.weight;
  const latest=entries[entries.length-1]?.weight;
  const diff=first&&latest?parseFloat((latest-first).toFixed(1)):null;
  const goal=parseFloat(goalWeight)||null;
  const goalDiff=goal&&latest?parseFloat((goal-latest).toFixed(1)):null;
  const goalPct=goal&&first?Math.min(100,Math.max(0,Math.round(Math.abs((latest-first)/(goal-first))*100))):0;

  // Weekly averages
  const byWeek=[];
  entries.forEach(e=>{
    const d=new Date(e.date);
    const weekStart=new Date(d);
    weekStart.setDate(d.getDate()-d.getDay());
    const key=weekStart.toISOString().split("T")[0];
    const ex=byWeek.find(w=>w.key===key);
    if(ex){ex.entries.push(e);ex.avg=parseFloat((ex.entries.reduce((s,x)=>s+x.weight,0)/ex.entries.length).toFixed(1));}
    else byWeek.push({key,label:"Week of "+weekStart.toLocaleDateString("en-US",{month:"short",day:"numeric"}),entries:[e],avg:e.weight});
  });

  // Mini trend chart data
  const chartData=entries.slice(-10);
  const chartMin=chartData.length?Math.min(...chartData.map(e=>e.weight))-2:0;
  const chartMax=chartData.length?Math.max(...chartData.map(e=>e.weight))+2:100;
  const chartH=80;
  const chartW=100;
  const pts=chartData.map((e,i)=>{
    const x=(i/(Math.max(chartData.length-1,1)))*chartW;
    const y=chartH-((e.weight-chartMin)/(chartMax-chartMin))*chartH;
    return`${x},${y}`;
  }).join(" ");

  return(
    <div>
      {/* Hero log card — dark */}
      <div style={{background:"#0f0f0f",borderRadius:16,padding:"1.5rem",marginBottom:12,border:"1px solid #222",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GREEN+","+PUR+")"}}/>
        <div style={{fontSize:11,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>⚖️ Weight Tracker</div>

        {/* Big stats */}
        {entries.length>0&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
            {[{label:"Start",val:first,sub:"lbs"},{label:"Now",val:latest,sub:"lbs"},{label:"Change",val:diff===null?"—":(diff>0?"+":"")+diff,sub:"lbs",color:diff===null?"#555":diff<0?GREEN:diff>0?RED:"#fff"}].map(s=>(
              <div key={s.label} style={{textAlign:"center"}}>
                <div style={{fontSize:26,fontWeight:700,color:s.color||"#fff",lineHeight:1}}>{s.val}</div>
                <div style={{fontSize:10,color:"#555",marginTop:3}}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Trend chart — dark */}
        {chartData.length>1&&(
          <div style={{marginBottom:20}}>
            <svg viewBox={`-4 -4 ${chartW+8} ${chartH+8}`} style={{width:"100%",height:100,overflow:"visible"}}>
              <defs>
                <linearGradient id="wGradDark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GREEN} stopOpacity="0.4"/>
                  <stop offset="100%" stopColor={GREEN} stopOpacity="0"/>
                </linearGradient>
              </defs>
              <polygon points={`0,${chartH} ${pts} ${chartW},${chartH}`} fill="url(#wGradDark)"/>
              <polyline points={pts} fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              {chartData.map((e,i)=>{
                const x=(i/(Math.max(chartData.length-1,1)))*chartW;
                const y=chartH-((e.weight-chartMin)/(chartMax-chartMin))*chartH;
                const isLast=i===chartData.length-1;
                return(
                  <g key={i}>
                    <circle cx={x} cy={y} r={isLast?4:2.5} fill={isLast?"#fff":GREEN} stroke={isLast?GREEN:"none"} strokeWidth="2"/>
                    {isLast&&<text x={x} y={y-8} textAnchor="middle" fontSize="9" fill="#fff" fontFamily="Georgia">{e.weight}</text>}
                  </g>
                );
              })}
              {goal&&<line x1="0" y1={chartH-((goal-chartMin)/(chartMax-chartMin))*chartH} x2={chartW} y2={chartH-((goal-chartMin)/(chartMax-chartMin))*chartH} stroke={GOLD} strokeWidth="1.5" strokeDasharray="5,4"/>}
              {goal&&<text x={chartW+2} y={chartH-((goal-chartMin)/(chartMax-chartMin))*chartH+3} fontSize="8" fill={GOLD} fontFamily="Georgia">goal</text>}
            </svg>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
              <div style={{fontSize:9,color:"#444"}}>{chartData[0]?.date}</div>
              <div style={{fontSize:9,color:"#444"}}>{chartData[chartData.length-1]?.date}</div>
            </div>
          </div>
        )}

        {/* Log input */}
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:8}}>
          <input type="text" inputMode="decimal" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="Enter lbs..." style={{flex:1,padding:"14px",borderRadius:10,border:"1px solid #333",fontSize:18,fontFamily:"Georgia,serif",background:"#1a1a1a",color:"#fff",textAlign:"center"}}/>
          <button onClick={save} disabled={!weight||saving} style={{padding:"14px 20px",borderRadius:10,border:"none",background:weight?"linear-gradient(135deg,"+GREEN+",#0d4a29)":"#222",color:weight?"#fff":"#444",fontSize:14,fontWeight:600,cursor:weight?"pointer":"not-allowed",fontFamily:"Georgia,serif",minWidth:80}}>
            {saved?"✓":saving?"...":"Save"}
          </button>
        </div>
        {error&&<div style={{fontSize:12,color:RED}}>{error}</div>}
        <div style={{fontSize:10,color:"#444",textAlign:"center"}}>Private — only you can see this</div>
      </div>

      {/* Goal weight card */}
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:goal?10:0}}>
          <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a"}}>🎯 Goal weight</div>
          <button onClick={()=>setShowGoalInput(!showGoalInput)} style={{fontSize:12,color:PUR,background:"none",border:"none",cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:500}}>{goal?"Edit":"Set goal →"}</button>
        </div>
        {showGoalInput&&(
          <div style={{display:"flex",gap:8,marginBottom:10,marginTop:8}}>
            <input type="number" value={goalWeight} onChange={e=>setGoalWeight(e.target.value)} placeholder="Target lbs" style={{flex:1,padding:"10px",borderRadius:8,border:"0.5px solid #e0e0e0",fontSize:14,fontFamily:"Georgia,serif",background:"#fafafa",textAlign:"center"}}/>
            <button onClick={()=>{localStorage.setItem("goal_weight_"+athleteId,goalWeight);setShowGoalInput(false);}} style={{padding:"10px 16px",borderRadius:8,border:"none",background:PUR,color:"#fff",fontSize:13,cursor:"pointer",fontFamily:"Georgia,serif"}}>Save</button>
          </div>
        )}
        {goal&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{fontSize:13,color:"#888"}}>{latest} → {goal} lbs</div>
              <div style={{fontSize:13,fontWeight:700,color:goalDiff!==null&&goalDiff<=0?GREEN:PUR}}>{goalDiff!==null?(goalDiff<=0?"✓ Goal reached!":(goalDiff>0?"+":"")+goalDiff+" lbs to go"):"—"}</div>
            </div>
            <div style={{height:8,background:"#f0f0f0",borderRadius:4,overflow:"hidden",marginBottom:4}}>
              <div style={{height:"100%",width:goalPct+"%",background:goalPct>=100?"linear-gradient(90deg,"+GREEN+",#0d4a29)":"linear-gradient(90deg,"+PUR+",#3d35a0)",borderRadius:4,transition:"width 0.5s"}}/>
            </div>
            <div style={{fontSize:11,color:"#aaa"}}>{goalPct}% of the way there</div>
          </div>
        )}
        {!goal&&!showGoalInput&&<div style={{fontSize:12,color:"#aaa",marginTop:4}}>Set a target weight to track your progress.</div>}
      </div>

      {/* Weekly log */}
      {byWeek.length>0&&(
        <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0"}}>
          <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Weekly log</div>
          {[...byWeek].reverse().map((week,wi)=>{
            const prevWeek=[...byWeek].reverse()[wi+1];
            const weekDiff=prevWeek?parseFloat((week.avg-prevWeek.avg).toFixed(1)):null;
            return(
              <div key={wi} style={{marginBottom:12,paddingBottom:12,borderBottom:wi<byWeek.length-1?"0.5px solid #f0f0f0":"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#1a1a1a"}}>{week.label}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>{week.avg} lbs avg</span>
                    {weekDiff!==null&&(
                      <span style={{fontSize:11,fontWeight:600,padding:"1px 7px",borderRadius:6,background:weekDiff<0?"#EAF3DE":weekDiff>0?"#FCEBEB":"#f5f5f5",color:weekDiff<0?GREEN:weekDiff>0?RED:"#888"}}>
                        {weekDiff>0?"↑ +":weekDiff<0?"↓ ":"→ "}{Math.abs(weekDiff)}
                      </span>
                    )}
                  </div>
                </div>
                {week.entries.map((e,ei)=>(
                  <div key={ei} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",background:"#f9f9f9",borderRadius:8,marginBottom:4}}>
                    <div style={{fontSize:12,color:"#888"}}>{new Date(e.date).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</div>
                    <div style={{fontSize:14,fontWeight:600,color:"#1a1a1a"}}>{e.weight} lbs</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {entries.length===0&&!saving&&(
        <div style={{background:"#0f0f0f",borderRadius:12,padding:"2.5rem",textAlign:"center",border:"1px solid #222"}}>
          <div style={{fontSize:40,marginBottom:12}}>⚖️</div>
          <div style={{fontSize:14,fontWeight:500,color:"#fff",marginBottom:6}}>Start tracking your weight</div>
          <div style={{fontSize:12,color:"#555"}}>Log your first entry above and watch your progress build week by week.</div>
        </div>
      )}
    </div>
  );
}

// ── Goals Countdown ─────────────────────────────────────────────
