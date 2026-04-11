import { useState, useEffect } from "react";
import Head from "next/head";
import { supabase } from "../lib/supabase";

const BG="#0f0f0f";
const PUR="#534AB7";
const RED="#C0392B";
const GREEN="#1E6B3A";
const GOLD="#D4AF37";

const VIOLATIONS=[
  {label:"Hands on head",icon:"🙌"},
  {label:"Bending over",icon:"🫸"},
  {label:"Hands on hips",icon:"🤜"},
  {label:"Walking — stations",icon:"🚶"},
  {label:"Walking — run",icon:"🚶"},
  {label:"Talking back",icon:"💬"},
  {label:"Standing around",icon:"🧍"},
  {label:"Other",icon:"⚠️"},
];

export default function Callout(){
  const[athletes,setAthletes]=useState([]);
  const[step,setStep]=useState("athlete");
  const[selected,setSelected]=useState(null);
  const[violation,setViolation]=useState(null);
  const[otherText,setOtherText]=useState("");
  const[count,setCount]=useState(1);
  const[type,setType]=useState("calledout");
  const[log,setLog]=useState([]);
  const[showLog,setShowLog]=useState(false);
  const[done,setDone]=useState(false);
  const[loading,setLoading]=useState(true);

  useEffect(()=>{loadAthletes();},[]);

  const loadAthletes=async()=>{
    const{data}=await supabase.from("athletes").select("*").eq("status","active").order("name");
    if(data)setAthletes(data);
    const{data:logs}=await supabase.from("callouts").select("*,athletes(name)").order("logged_at",{ascending:false}).limit(50);
    if(logs)setLog(logs);
    setLoading(false);
  };

  const submitLog=async()=>{
    const vLabel=violation==="Other"?otherText:violation;
    const crunches=type==="selfreport"?25*count:30*count;
    await supabase.from("callouts").insert({
      athlete_id:selected.id,
      violation:vLabel,
      count,
      type,
      crunches,
    });
    // Update leaderboard
    const{data:lb}=await supabase.from("leaderboard").select("*").eq("athlete_id",selected.id);
    if(lb&&lb.length>0){
      await supabase.from("leaderboard").update({callout_count:(lb[0].callout_count||0)+count}).eq("athlete_id",selected.id);
    } else {
      await supabase.from("leaderboard").insert({athlete_id:selected.id,callout_count:count});
    }
    setDone(true);
    await loadAthletes();
  };

  const reset=()=>{
    setStep("athlete");setSelected(null);setViolation(null);
    setOtherText("");setCount(1);setType("calledout");setDone(false);
  };

  if(loading) return(
    <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{fontSize:32}}>⚒</div>
    </div>
  );

  return(
    <>
      <Head><title>Call-Out Station — TF College Group</title></Head>
      <div style={{minHeight:"100vh",background:BG,fontFamily:"Georgia, serif",padding:"1.5rem"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <div>
            <div style={{fontSize:16,fontWeight:500,color:"#fff"}}>TF College Group</div>
            <div style={{fontSize:12,color:"#555"}}>Call-Out Station · Weight room</div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setShowLog(s=>!s)} style={{padding:"8px 16px",borderRadius:8,border:"0.5px solid #333",background:"transparent",color:"#888",fontSize:12,cursor:"pointer",fontFamily:"Georgia, serif"}}>
              {showLog?"Hide log":"View log"}
            </button>
            <a href="/" style={{padding:"8px 16px",borderRadius:8,border:"0.5px solid #333",background:"transparent",color:"#888",fontSize:12,fontFamily:"Georgia, serif"}}>← Home</a>
          </div>
        </div>

        {/* Progress steps */}
        <div style={{display:"flex",gap:4,marginBottom:20}}>
          {[{id:"athlete",label:"1. Athlete"},{id:"violation",label:"2. Violation"},{id:"confirm",label:"3. Confirm"}].map((s,i)=>{
            const steps=["athlete","violation","confirm"];
            const cur=done?"confirm":steps.indexOf(step);
            const idx=steps.indexOf(s.id);
            return(
              <div key={s.id} style={{flex:1,padding:"8px",borderRadius:8,background:idx===cur?RED:idx<cur?"#1a2a1a":"#141414",border:"0.5px solid "+(idx===cur?RED:idx<cur?GREEN:"#333"),textAlign:"center"}}>
                <div style={{fontSize:11,color:idx===cur?"#fff":idx<cur?"#58B368":"#555"}}>{idx<cur?"✓ ":""}{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* DONE screen */}
        {done&&(
          <div style={{textAlign:"center",padding:"3rem 1rem"}}>
            <div style={{fontSize:60,marginBottom:16}}>✅</div>
            <div style={{fontSize:22,fontWeight:500,color:"#fff",marginBottom:8}}>Logged</div>
            <div style={{fontSize:14,color:"#888",marginBottom:8}}>{selected?.name}</div>
            <div style={{fontSize:13,color:"#aaa",marginBottom:8}}>{violation==="Other"?otherText:violation} · {count}x · {type==="selfreport"?"Self-report":"Called out"}</div>
            <div style={{fontSize:16,color:RED,fontWeight:500,marginBottom:32}}>{type==="selfreport"?25*count:30*count} crunches</div>
            <button onClick={reset} style={{padding:"14px 32px",borderRadius:12,border:"none",background:PUR,color:"#fff",fontSize:16,fontWeight:500,cursor:"pointer",fontFamily:"Georgia, serif"}}>Log another →</button>
          </div>
        )}

        {/* STEP 1 — Athlete */}
        {!done&&step==="athlete"&&(
          <div>
            <div style={{fontSize:14,fontWeight:500,color:"#fff",marginBottom:12}}>Who got called out?</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10}}>
              {athletes.map(a=>{
                const todayCount=log.filter(l=>l.athlete_id===a.id&&new Date(l.logged_at).toDateString()===new Date().toDateString()).reduce((n,l)=>n+(l.count||1),0);
                return(
                  <button key={a.id} onClick={()=>{setSelected(a);setStep("violation");}} style={{padding:"16px 12px",borderRadius:12,border:"0.5px solid #333",background:"#141414",cursor:"pointer",fontFamily:"Georgia, serif",textAlign:"center",position:"relative"}}>
                    <div style={{width:44,height:44,borderRadius:"50%",background:a.role==="forge"?RED:"#708090",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:500,color:"#fff",margin:"0 auto 8px"}}>{a.name[0]}</div>
                    <div style={{fontSize:13,fontWeight:500,color:"#fff"}}>{a.name.split(" ")[0]}</div>
                    <div style={{fontSize:11,color:"#555"}}>{a.sport}</div>
                    {todayCount>0&&<div style={{position:"absolute",top:8,right:8,width:20,height:20,borderRadius:"50%",background:RED,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",fontWeight:600}}>{todayCount}</div>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2 — Violation */}
        {!done&&step==="violation"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <button onClick={()=>setStep("athlete")} style={{background:"transparent",border:"none",color:"#666",fontSize:13,cursor:"pointer",fontFamily:"Georgia, serif"}}>← Back</button>
              <div style={{fontSize:14,fontWeight:500,color:"#fff"}}>{selected?.name} — What was the violation?</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:16}}>
              {VIOLATIONS.map(v=>(
                <button key={v.label} onClick={()=>{setViolation(v.label);if(v.label!=="Other")setStep("confirm");}} style={{padding:"16px",borderRadius:12,border:"0.5px solid "+(violation===v.label?RED:"#333"),background:violation===v.label?"#2a0a0a":"#141414",cursor:"pointer",fontFamily:"Georgia, serif",display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:24}}>{v.icon}</span>
                  <span style={{fontSize:13,color:"#fff",textAlign:"left"}}>{v.label}</span>
                </button>
              ))}
            </div>
            {violation==="Other"&&(
              <div>
                <input value={otherText} onChange={e=>setOtherText(e.target.value)} placeholder="Describe the violation..." style={{width:"100%",padding:"12px",fontSize:14,border:"0.5px solid #333",borderRadius:10,background:"#141414",color:"#fff",fontFamily:"Georgia, serif",boxSizing:"border-box",marginBottom:10}}/>
                <button onClick={()=>otherText.trim()&&setStep("confirm")} style={{width:"100%",padding:"12px",borderRadius:10,border:"none",background:otherText.trim()?RED:"#333",color:"#fff",fontSize:14,cursor:otherText.trim()?"pointer":"not-allowed",fontFamily:"Georgia, serif"}}>Continue →</button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3 — Confirm */}
        {!done&&step==="confirm"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <button onClick={()=>setStep("violation")} style={{background:"transparent",border:"none",color:"#666",fontSize:13,cursor:"pointer",fontFamily:"Georgia, serif"}}>← Back</button>
              <div style={{fontSize:14,fontWeight:500,color:"#fff"}}>Confirm</div>
            </div>

            <div style={{background:"#141414",borderRadius:12,padding:"1.25rem",marginBottom:16,border:"0.5px solid #333"}}>
              <div style={{fontSize:16,fontWeight:500,color:"#fff",marginBottom:4}}>{selected?.name}</div>
              <div style={{fontSize:13,color:"#888",marginBottom:12}}>{violation==="Other"?otherText:violation}</div>

              {/* Count */}
              <div style={{marginBottom:12}}>
                <div style={{fontSize:11,color:"#555",textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:8}}>How many times?</div>
                <div style={{display:"flex",gap:8}}>
                  {[1,2,3,4,5].map(n=>(
                    <button key={n} onClick={()=>setCount(n)} style={{flex:1,padding:"12px",borderRadius:10,border:"0.5px solid "+(count===n?RED:"#333"),background:count===n?"#2a0a0a":"transparent",color:count===n?RED:"#888",fontSize:16,fontWeight:500,cursor:"pointer",fontFamily:"Georgia, serif"}}>{n}</button>
                  ))}
                </div>
              </div>

              {/* Type */}
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,color:"#555",textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:8}}>Called out or self-report?</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <button onClick={()=>setType("calledout")} style={{padding:"14px",borderRadius:10,border:"0.5px solid "+(type==="calledout"?RED:"#333"),background:type==="calledout"?"#2a0a0a":"transparent",color:type==="calledout"?RED:"#888",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"Georgia, serif"}}>
                    Called out<div style={{fontSize:11,marginTop:2}}>30 crunches</div>
                  </button>
                  <button onClick={()=>setType("selfreport")} style={{padding:"14px",borderRadius:10,border:"0.5px solid "+(type==="selfreport"?GREEN:"#333"),background:type==="selfreport"?"#0a2a0a":"transparent",color:type==="selfreport"?GREEN:"#888",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"Georgia, serif"}}>
                    Self-report<div style={{fontSize:11,marginTop:2}}>25 crunches</div>
                  </button>
                </div>
              </div>

              <div style={{padding:"12px",borderRadius:10,background:"#1a1a1a",border:"0.5px solid "+RED,textAlign:"center",marginBottom:16}}>
                <div style={{fontSize:11,color:"#555",marginBottom:4}}>Total consequence</div>
                <div style={{fontSize:32,fontWeight:600,color:RED}}>{type==="selfreport"?25*count:30*count}</div>
                <div style={{fontSize:13,color:"#888"}}>crunches</div>
              </div>
            </div>

            <button onClick={submitLog} style={{width:"100%",padding:"16px",borderRadius:12,border:"none",background:RED,color:"#fff",fontSize:16,fontWeight:600,cursor:"pointer",fontFamily:"Georgia, serif"}}>
              Log it →
            </button>
          </div>
        )}

        {/* Log */}
        {showLog&&(
          <div style={{marginTop:20,background:"#141414",borderRadius:12,padding:"1rem",border:"0.5px solid #333"}}>
            <div style={{fontSize:13,fontWeight:500,color:"#fff",marginBottom:10}}>Today's log</div>
            {log.filter(l=>new Date(l.logged_at).toDateString()===new Date().toDateString()).length===0&&(
              <div style={{fontSize:13,color:"#555",textAlign:"center",padding:"10px 0"}}>Nothing logged today.</div>
            )}
            {log.filter(l=>new Date(l.logged_at).toDateString()===new Date().toDateString()).map((l,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"0.5px solid #222"}}>
                <div>
                  <div style={{fontSize:13,color:"#fff"}}>{l.athletes?.name}</div>
                  <div style={{fontSize:11,color:"#555"}}>{l.violation} · {l.count}x · {l.type==="selfreport"?"Self-report":"Called out"}</div>
                </div>
                <div style={{fontSize:14,fontWeight:500,color:RED}}>{l.crunches} 💪</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
