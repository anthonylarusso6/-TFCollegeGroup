import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const BG="#0f0f0f";
const PUR="#534AB7";
const RED="#C0392B";
const GREEN="#1E6B3A";
const GOLD="#D4AF37";
const STEEL="#708090";

const VIOLATIONS=[
  {label:"Hands on head",icon:"🙌"},
  {label:"Bending over",icon:"🫸"},
  {label:"Hands on hips",icon:"🤜"},
  {label:"Walking — stations",icon:"🚶"},
  {label:"Walking — run",icon:"🏃"},
  {label:"Talking back",icon:"💬"},
  {label:"Standing around",icon:"🧍"},
  {label:"Other",icon:"⚠️"},
];

export default function Accountability({athletes}){
  const[callouts,setCallouts]=useState([]);
  const[selectedAthlete,setSelectedAthlete]=useState(null);
  const[violation,setViolation]=useState(null);
  const[otherText,setOtherText]=useState("");
  const[count,setCount]=useState(1);
  const[type,setType]=useState("calledout");
  const[step,setStep]=useState("athlete");
  const[loading,setLoading]=useState(false);
  const[saved,setSaved]=useState(false);

  useEffect(()=>{loadCallouts();},[]);

  const loadCallouts=async()=>{
    const{data}=await supabase.from("callouts").select("*,athletes(name)").order("logged_at",{ascending:false}).limit(100);
    if(data)setCallouts(data);
  };

  const submitLog=async()=>{
    setLoading(true);
    const vLabel=violation==="Other"?otherText:violation;
    const crunches=type==="selfreport"?25*count:30*count;
    await supabase.from("callouts").insert({
      athlete_id:selectedAthlete.id,
      violation:vLabel,
      count,
      type,
      crunches,
    });
    const{data:lb}=await supabase.from("leaderboard").select("*").eq("athlete_id",selectedAthlete.id);
    if(lb&&lb.length>0){
      await supabase.from("leaderboard").update({callout_count:(lb[0].callout_count||0)+count}).eq("athlete_id",selectedAthlete.id);
    } else {
      await supabase.from("leaderboard").insert({athlete_id:selectedAthlete.id,callout_count:count});
    }
    await loadCallouts();
    setSaved(true);
    setLoading(false);
    setTimeout(()=>{
      setSaved(false);
      setStep("athlete");
      setSelectedAthlete(null);
      setViolation(null);
      setOtherText("");
      setCount(1);
      setType("calledout");
    },2000);
  };

  const deleteCallout=async(id)=>{
    await supabase.from("callouts").delete().eq("id",id);
    setCallouts(p=>p.filter(c=>c.id!==id));
  };

  const todayCallouts=callouts.filter(c=>new Date(c.logged_at).toDateString()===new Date().toDateString());
  const patternMap={};
  callouts.forEach(c=>{
    const name=c.athletes?.name;
    if(name)patternMap[name]=(patternMap[name]||0)+(c.count||1);
  });
  const patterns=Object.entries(patternMap).sort((a,b)=>b[1]-a[1]);

  return(
    <div>
      {/* Rules reference */}
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+RED}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:10}}>Rules & standards</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
          {[
            {label:"Hand over hand",desc:"In front of body",icon:"🤝"},
            {label:"Hands flat",desc:"Open on hips laying flat",icon:"🖐"},
            {label:"Behind back",desc:"Hands on hands",icon:"🔒"},
          ].map(h=>(
            <div key={h.label} style={{background:"#f9f9f9",borderRadius:10,padding:"10px",textAlign:"center",border:"0.5px solid #e0e0e0"}}>
              <div style={{fontSize:24,marginBottom:4}}>{h.icon}</div>
              <div style={{fontSize:12,fontWeight:500,color:"#1a1a1a"}}>{h.label}</div>
              <div style={{fontSize:11,color:"#888"}}>{h.desc}</div>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[
            {rule:"Called out",consequence:"30 crunches",color:RED,bg:"#FCEBEB"},
            {rule:"Self-report",consequence:"25 crunches",color:GREEN,bg:"#EAF3DE"},
            {rule:"Late arrival",consequence:"50 crunches",color:"#854F0B",bg:"#FAEEDA"},
            {rule:"No show",consequence:"2x shred mill 100yd gear 3",color:"#1A4F8A",bg:"#E6F1FB"},
          ].map(r=>(
            <div key={r.rule} style={{background:r.bg,borderRadius:8,padding:"8px 10px",border:"0.5px solid "+r.color+"44"}}>
              <div style={{fontSize:12,fontWeight:500,color:r.color}}>{r.rule}</div>
              <div style={{fontSize:11,color:"#555"}}>{r.consequence}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick log */}
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+PUR}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Quick call-out log</div>

        {/* Step indicators */}
        <div style={{display:"flex",gap:4,marginBottom:16}}>
          {[{id:"athlete",label:"1. Athlete"},{id:"violation",label:"2. Violation"},{id:"confirm",label:"3. Confirm"}].map(s=>{
            const steps=["athlete","violation","confirm"];
            const cur=steps.indexOf(step);
            const idx=steps.indexOf(s.id);
            return(
              <div key={s.id} style={{flex:1,padding:"5px",borderRadius:6,background:idx===cur?PUR:idx<cur?"#EAF3DE":"#f5f5f5",border:"0.5px solid "+(idx===cur?PUR:idx<cur?GREEN:"#e0e0e0"),textAlign:"center"}}>
                <div style={{fontSize:10,color:idx===cur?"#fff":idx<cur?GREEN:"#888"}}>{idx<cur?"✓ ":""}{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Step 1 — Athlete */}
        {step==="athlete"&&(
          <div>
            <div style={{fontSize:12,color:"#888",marginBottom:8}}>Who got called out?</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:8}}>
              {athletes.map(a=>{
                const todayCount=todayCallouts.filter(c=>c.athlete_id===a.id).reduce((n,c)=>n+(c.count||1),0);
                return(
                  <button key={a.id} onClick={()=>{setSelectedAthlete(a);setStep("violation");}} style={{padding:"10px 8px",borderRadius:10,border:"0.5px solid #e0e0e0",background:"#f9f9f9",cursor:"pointer",fontFamily:"Georgia,serif",textAlign:"center",position:"relative"}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:500,color:"#fff",margin:"0 auto 6px"}}>{a.name[0]}</div>
                    <div style={{fontSize:11,fontWeight:500,color:"#1a1a1a"}}>{a.name.split(" ")[0]}</div>
                    {todayCount>0&&<div style={{position:"absolute",top:6,right:6,width:18,height:18,borderRadius:"50%",background:RED,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",fontWeight:600}}>{todayCount}</div>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2 — Violation */}
        {step==="violation"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <button onClick={()=>setStep("athlete")} style={{background:"transparent",border:"none",color:"#888",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>← Back</button>
              <div style={{fontSize:12,fontWeight:500,color:"#1a1a1a"}}>{selectedAthlete?.name} — select violation</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {VIOLATIONS.map(v=>(
                <button key={v.label} onClick={()=>{setViolation(v.label);if(v.label!=="Other")setStep("confirm");}} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:10,border:"0.5px solid "+(violation===v.label?RED:"#e0e0e0"),background:violation===v.label?"#FCEBEB":"#f9f9f9",cursor:"pointer",fontFamily:"Georgia,serif",textAlign:"left"}}>
                  <span style={{fontSize:20}}>{v.icon}</span>
                  <span style={{fontSize:12,color:"#1a1a1a"}}>{v.label}</span>
                </button>
              ))}
            </div>
            {violation==="Other"&&(
              <div style={{marginTop:10}}>
                <input value={otherText} onChange={e=>setOtherText(e.target.value)} placeholder="Describe violation..." style={{width:"100%",padding:"8px",fontSize:13,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia,serif",boxSizing:"border-box",marginBottom:8}}/>
                <button onClick={()=>otherText.trim()&&setStep("confirm")} style={{width:"100%",padding:"8px",borderRadius:8,border:"none",background:otherText.trim()?RED:"#e0e0e0",color:"#fff",fontSize:13,cursor:otherText.trim()?"pointer":"not-allowed",fontFamily:"Georgia,serif"}}>Continue →</button>
              </div>
            )}
          </div>
        )}

        {/* Step 3 — Confirm */}
        {step==="confirm"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <button onClick={()=>setStep("violation")} style={{background:"transparent",border:"none",color:"#888",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>← Back</button>
              <div style={{fontSize:12,fontWeight:500,color:"#1a1a1a"}}>Confirm log</div>
            </div>
            <div style={{background:"#f9f9f9",borderRadius:10,padding:"12px",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
              <div style={{fontSize:14,fontWeight:500,color:"#1a1a1a",marginBottom:2}}>{selectedAthlete?.name}</div>
              <div style={{fontSize:12,color:"#888",marginBottom:10}}>{violation==="Other"?otherText:violation}</div>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:11,color:"#888",marginBottom:6}}>How many times?</div>
                <div style={{display:"flex",gap:6}}>
                  {[1,2,3,4,5].map(n=>(
                    <button key={n} onClick={()=>setCount(n)} style={{flex:1,padding:"8px",borderRadius:8,border:"0.5px solid "+(count===n?RED:"#e0e0e0"),background:count===n?"#FCEBEB":"transparent",color:count===n?RED:"#888",fontSize:14,fontWeight:500,cursor:"pointer",fontFamily:"Georgia,serif"}}>{n}</button>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontSize:11,color:"#888",marginBottom:6}}>Type</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <button onClick={()=>setType("calledout")} style={{padding:"10px",borderRadius:8,border:"0.5px solid "+(type==="calledout"?RED:"#e0e0e0"),background:type==="calledout"?"#FCEBEB":"transparent",color:type==="calledout"?RED:"#888",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                    Called out<div style={{fontSize:10,marginTop:2}}>30 crunches</div>
                  </button>
                  <button onClick={()=>setType("selfreport")} style={{padding:"10px",borderRadius:8,border:"0.5px solid "+(type==="selfreport"?GREEN:"#e0e0e0"),background:type==="selfreport"?"#EAF3DE":"transparent",color:type==="selfreport"?GREEN:"#888",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                    Self-report<div style={{fontSize:10,marginTop:2}}>25 crunches</div>
                  </button>
                </div>
              </div>
              <div style={{background:"#FCEBEB",borderRadius:8,padding:"10px",textAlign:"center",marginBottom:12}}>
                <div style={{fontSize:11,color:"#888",marginBottom:2}}>Total consequence</div>
                <div style={{fontSize:28,fontWeight:600,color:RED}}>{type==="selfreport"?25*count:30*count}</div>
                <div style={{fontSize:12,color:"#888"}}>crunches</div>
              </div>
            </div>
            {saved?(
              <div style={{padding:"12px",borderRadius:8,background:"#EAF3DE",textAlign:"center",fontSize:13,color:GREEN,fontWeight:500}}>✓ Logged successfully</div>
            ):(
              <button onClick={submitLog} disabled={loading} style={{width:"100%",padding:"12px",borderRadius:8,border:"none",background:RED,color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                {loading?"Logging...":"Log it →"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pattern summary */}
      {patterns.length>0&&(
        <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
          <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:10}}>Pattern summary — all time</div>
          {patterns.map(([name,total],i)=>(
            <div key={name} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"0.5px solid #f0f0f0"}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:total>=3?RED:total>=2?"#FAEEDA":"#EAF3DE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,color:total>=3?RED:total>=2?"#854F0B":GREEN,flexShrink:0}}>{total}</div>
              <div style={{flex:1,fontSize:13,color:"#1a1a1a"}}>{name}</div>
              {total>=3&&<span style={{fontSize:10,background:"#FCEBEB",color:RED,padding:"2px 7px",borderRadius:5}}>⚠ Conversation needed</span>}
            </div>
          ))}
        </div>
      )}

      {/* Today's log */}
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:10}}>Today's log</div>
        {todayCallouts.length===0&&<div style={{fontSize:13,color:"#aaa",textAlign:"center",padding:"10px 0"}}>Nothing logged today.</div>}
        {todayCallouts.map((c,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"0.5px solid #f0f0f0"}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:500,color:"#1a1a1a"}}>{c.athletes?.name}</div>
              <div style={{fontSize:11,color:"#888"}}>{c.violation} · {c.count}x · {c.type==="selfreport"?"Self-report":"Called out"}</div>
            </div>
            <div style={{fontSize:14,fontWeight:500,color:RED,marginRight:8}}>{c.crunches} 💪</div>
            <button onClick={()=>deleteCallout(c.id)} style={{background:"transparent",border:"none",color:"#aaa",cursor:"pointer",fontSize:12,fontFamily:"Georgia,serif"}}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
