import { useState, useEffect } from "react";
import { BG, PUR, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";
import { hTap, hSuccess } from "../lib/haptics";

const glass=(extra={})=>({
  background:"rgba(255,255,255,0.045)",
  border:"1px solid rgba(255,255,255,0.08)",
  borderRadius:14,
  boxShadow:"inset 0 1px 0 rgba(255,255,255,0.05)",
  ...extra,
});

const VIOLATIONS=[
  {label:"Cussing",icon:"alertTriangle",crunches:30},
  {label:"Talking/Socializing 1min+",icon:"chat",crunches:30},
  {label:"Walking (jog everywhere)",icon:"activity",crunches:30},
  {label:"Hands on head",icon:"zap",crunches:30},
  {label:"Bending over",icon:"barbell",crunches:30},
  {label:"Hands on hips",icon:"barbell",crunches:30},
  {label:"Standing around",icon:"clock",crunches:30},
  {label:"Not listening",icon:"megaphone",crunches:30},
  {label:"Doing drill incorrectly",icon:"target",crunches:30},
  {label:"Other",icon:"list",crunches:30},
];

export default function Accountability({athletes=[]}){
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
    const vLabel=violation?.label==="Other"?otherText:violation?.label;
    const baseCrunches=violation?.crunches||30;
    const crunches=type==="selfreport"?25*count:baseCrunches*count;
    try{
      const{error:insErr}=await supabase.from("callouts").insert({athlete_id:selectedAthlete.id,violation:vLabel,count,type,crunches});
      if(insErr)throw insErr;
      try{
        const{data:lb}=await supabase.from("leaderboard").select("*").eq("athlete_id",selectedAthlete.id);
        if(lb&&lb.length>0){
          await supabase.from("leaderboard").update({callout_count:(lb[0].callout_count||0)+count}).eq("athlete_id",selectedAthlete.id);
        }else{
          await supabase.from("leaderboard").insert({athlete_id:selectedAthlete.id,callout_count:count});
        }
      }catch(e){}
      hSuccess();
      await loadCallouts();
      setSaved(true);setLoading(false);
      setTimeout(()=>{
        setSaved(false);setStep("athlete");setSelectedAthlete(null);
        setViolation(null);setOtherText("");setCount(1);setType("calledout");
      },2000);
    }catch(e){
      setLoading(false);
      if(typeof window!=="undefined")alert("Couldn't save the callout — check your connection and try again.");
    }
  };

  const deleteCallout=async(id)=>{
    const row=callouts.find(c=>c.id===id);
    try{
      const{error}=await supabase.from("callouts").delete().eq("id",id);
      if(error)throw error;
      // Keep leaderboard.callout_count in sync with the deleted row (never below 0)
      if(row?.athlete_id){
        try{
          const{data:lb}=await supabase.from("leaderboard").select("*").eq("athlete_id",row.athlete_id);
          if(lb&&lb.length>0){
            const next=Math.max(0,(lb[0].callout_count||0)-(row.count||0));
            await supabase.from("leaderboard").update({callout_count:next}).eq("athlete_id",row.athlete_id);
          }
        }catch(e){}
      }
      setCallouts(p=>p.filter(c=>c.id!==id));
    }catch(e){}
  };

  const _estNow=new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
  const _todayEST=_estNow.getFullYear()+"-"+String(_estNow.getMonth()+1).padStart(2,"0")+"-"+String(_estNow.getDate()).padStart(2,"0");
  const todayCallouts=callouts.filter(c=>{const d=new Date(new Date(c.logged_at).toLocaleString("en-US",{timeZone:"America/New_York"}));return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")===_todayEST;});
  const totalCrunchesToday=todayCallouts.reduce((sum,c)=>sum+(c.crunches||0),0);
  const patternMap={};
  callouts.forEach(c=>{const name=c.athletes?.name;if(name)patternMap[name]=(patternMap[name]||0)+(c.count||1);});
  const patterns=Object.entries(patternMap).sort((a,b)=>b[1]-a[1]);
  const crunchMap={};
  callouts.forEach(c=>{const name=c.athletes?.name;if(name)crunchMap[name]=(crunchMap[name]||0)+(c.crunches||0);});
  const crunchLb=Object.entries(crunchMap).sort((a,b)=>b[1]-a[1]);

  return(
    <div>

      {/* Daily crunch total */}
      {totalCrunchesToday>0&&(
        <div style={{...glass({borderRadius:16}),padding:"1.25rem",marginBottom:12,textAlign:"center",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+RED+","+ORANGE+",transparent)"}}/>
          <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>Total crunches owed today</div>
          <div style={{fontSize:56,fontWeight:900,color:RED,lineHeight:1,textShadow:"0 0 40px "+RED+"55"}}>{totalCrunchesToday}</div>
          <div style={{fontSize:12,color:"#555",marginTop:4}}>{todayCallouts.length} callout{todayCallouts.length!==1?"s":""} · {[...new Set(todayCallouts.map(c=>c.athlete_id))].length} athlete{[...new Set(todayCallouts.map(c=>c.athlete_id))].length!==1?"s":""}</div>
        </div>
      )}

      {/* Rules reference */}
      <div style={{...glass({borderRadius:16}),padding:"1.25rem",marginBottom:12,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+RED+",transparent)"}}/>
        <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:12}}>Rules &amp; Standards</div>

        {/* Hand positions */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
          {[
            {label:"Hand over hand",desc:"In front of body",icon:"pray"},
            {label:"Hands flat",desc:"Open on hips laying flat",icon:"barbell"},
            {label:"Behind back",desc:"Hands on hands",icon:"lock"},
          ].map(h=>(
            <div key={h.label} style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"10px",textAlign:"center",border:"1px solid rgba(255,255,255,0.07)"}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:6}}><Icon name={h.icon} size={22} color={ORANGE}/></div>
              <div style={{fontSize:11,fontWeight:600,color:"#ddd",lineHeight:1.3}}>{h.label}</div>
              <div style={{fontSize:10,color:"#555",marginTop:3}}>{h.desc}</div>
            </div>
          ))}
        </div>

        {/* Consequence table */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {[
            {rule:"Cussing",consequence:"30 crunches",color:"#8E44AD"},
            {rule:"Talking 1min+",consequence:"30 crunches",color:RED},
            {rule:"Walking",consequence:"30 crunches",color:RED},
            {rule:"Called out",consequence:"30 crunches",color:RED},
            {rule:"Self-report",consequence:"25 crunches",color:GREEN},
            {rule:"Late arrival",consequence:"50 crunches",color:ORANGE},
            {rule:"No show",consequence:"Shred mill 100yd",color:"#1A4F8A"},
          ].map(r=>(
            <div key={r.rule} style={{borderRadius:8,padding:"8px 10px",border:"1px solid "+r.color+"33",background:r.color+"0d"}}>
              <div style={{fontSize:11,fontWeight:600,color:r.color}}>{r.rule}</div>
              <div style={{fontSize:10,color:"#666",marginTop:2}}>{r.consequence}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick log */}
      <div style={{...glass({borderRadius:16}),padding:"1.25rem",marginBottom:12,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+PUR+",transparent)"}}/>
        <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:14}}>Quick Call-Out Log</div>

        {/* Step tracker */}
        <div style={{display:"flex",gap:4,marginBottom:18}}>
          {[{id:"athlete",label:"Athlete"},{id:"violation",label:"Violation"},{id:"confirm",label:"Confirm"}].map(s=>{
            const steps=["athlete","violation","confirm"];
            const cur=steps.indexOf(step);
            const idx=steps.indexOf(s.id);
            const done_=idx<cur;
            const active=idx===cur;
            return(
              <div key={s.id} style={{flex:1,padding:"7px 4px",borderRadius:8,background:active?PUR:done_?GREEN+"22":"rgba(255,255,255,0.04)",border:"1px solid "+(active?PUR:done_?GREEN+"44":"rgba(255,255,255,0.08)"),textAlign:"center",transition:"all 0.2s"}}>
                <div style={{fontSize:10,color:active?"#fff":done_?GREEN:"#555",fontWeight:active||done_?700:400}}>
                  {done_&&<Icon name="checkSquare" size={9} color={GREEN} style={{marginRight:3,verticalAlign:"baseline"}}/>}
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Step 1 — Athlete */}
        {step==="athlete"&&(
          <div>
            <div style={{fontSize:11,color:"#555",marginBottom:10,letterSpacing:"0.04em",textTransform:"uppercase"}}>Who got called out?</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(88px,1fr))",gap:8}}>
              {athletes.map(a=>{
                const todayCount=todayCallouts.filter(c=>c.athlete_id===a.id).reduce((n,c)=>n+(c.count||1),0);
                const todayCrunches=todayCallouts.filter(c=>c.athlete_id===a.id).reduce((n,c)=>n+(c.crunches||0),0);
                return(
                  <button key={a.id} onClick={()=>{hTap();setSelectedAthlete(a);setStep("violation");}}
                    style={{padding:"10px 8px",borderRadius:12,border:"1px solid "+(todayCount>0?RED+"66":"rgba(255,255,255,0.08)"),background:todayCount>0?"rgba(192,57,43,0.15)":"rgba(255,255,255,0.04)",cursor:"pointer",fontFamily:"Georgia,serif",textAlign:"center",position:"relative",transition:"all 0.15s"}}>
                    <div style={{width:38,height:38,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:500,color:"#fff",margin:"0 auto 6px",overflow:"hidden",flexShrink:0}}>
                      {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(a.name||"?")[0]}
                    </div>
                    <div style={{fontSize:11,fontWeight:600,color:"#ddd",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name.split(" ")[0]}</div>
                    {todayCrunches>0&&<div style={{fontSize:9,color:RED,marginTop:2,fontWeight:700}}>{todayCrunches}</div>}
                    {todayCount>0&&<div style={{position:"absolute",top:5,right:5,width:16,height:16,borderRadius:"50%",background:RED,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",fontWeight:700}}>{todayCount}</div>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2 — Violation */}
        {step==="violation"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
              <button onClick={()=>{hTap();setStep("athlete");}} style={{background:"none",border:"none",color:"rgba(255,255,255,0.45)",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif",display:"flex",alignItems:"center",gap:4}}>
                <Icon name="chevronRight" size={12} color="rgba(255,255,255,0.45)" style={{transform:"rotate(180deg)"}}/> Back
              </button>
              <div style={{fontSize:12,fontWeight:600,color:"#ddd"}}>{selectedAthlete?.name}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
              {VIOLATIONS.map(v=>(
                <button key={v.label} onClick={()=>{hTap();setViolation(v);if(v.label!=="Other")setStep("confirm");}}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:10,border:"1px solid "+(violation?.label===v.label?RED+"77":"rgba(255,255,255,0.08)"),background:violation?.label===v.label?"rgba(192,57,43,0.18)":"rgba(255,255,255,0.04)",cursor:"pointer",fontFamily:"Georgia,serif",textAlign:"left",transition:"all 0.15s"}}>
                  <Icon name={v.icon} size={15} color={violation?.label===v.label?RED:"rgba(255,255,255,0.4)"}/>
                  <span style={{fontSize:12,color:violation?.label===v.label?"#fff":"#aaa"}}>{v.label}</span>
                </button>
              ))}
            </div>
            {violation?.label==="Other"&&(
              <div style={{marginTop:12}}>
                <input value={otherText} onChange={e=>setOtherText(e.target.value)} placeholder="Describe violation..."
                  style={{width:"100%",padding:"10px 12px",fontSize:13,border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,background:"rgba(255,255,255,0.07)",color:"#fff",fontFamily:"Georgia,serif",boxSizing:"border-box",marginBottom:10,outline:"none"}}/>
                <button onClick={()=>{if(otherText.trim()){hTap();setStep("confirm");}}}
                  style={{width:"100%",padding:"11px",borderRadius:10,border:"none",background:otherText.trim()?"linear-gradient(135deg,"+RED+",#8B1A1A)":"rgba(255,255,255,0.07)",color:otherText.trim()?"#fff":"rgba(255,255,255,0.3)",fontSize:13,fontWeight:700,cursor:otherText.trim()?"pointer":"default",fontFamily:"Georgia,serif",transition:"all 0.15s"}}>
                  Continue →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3 — Confirm */}
        {step==="confirm"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
              <button onClick={()=>{hTap();setStep("violation");}} style={{background:"none",border:"none",color:"rgba(255,255,255,0.45)",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif",display:"flex",alignItems:"center",gap:4}}>
                <Icon name="chevronRight" size={12} color="rgba(255,255,255,0.45)" style={{transform:"rotate(180deg)"}}/> Back
              </button>
              <div style={{fontSize:12,fontWeight:600,color:"#ddd"}}>Confirm log</div>
            </div>
            <div style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"14px",marginBottom:14,border:"1px solid rgba(255,255,255,0.08)"}}>
              <div style={{fontSize:15,fontWeight:700,color:"#fff",marginBottom:2}}>{selectedAthlete?.name}</div>
              <div style={{fontSize:12,color:"#888",marginBottom:14}}>{violation?.label==="Other"?otherText:violation?.label}</div>

              {/* Count */}
              <div style={{marginBottom:12}}>
                <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>How many times?</div>
                <div style={{display:"flex",gap:6}}>
                  {[1,2,3,4,5].map(n=>(
                    <button key={n} onClick={()=>{hTap();setCount(n);}}
                      style={{flex:1,padding:"10px",borderRadius:9,border:"1px solid "+(count===n?RED+"66":"rgba(255,255,255,0.08)"),background:count===n?"rgba(192,57,43,0.22)":"rgba(255,255,255,0.04)",color:count===n?"#fff":"rgba(255,255,255,0.5)",fontSize:16,fontWeight:count===n?900:400,cursor:"pointer",fontFamily:"Georgia,serif",transition:"all 0.1s"}}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type */}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Type</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <button onClick={()=>{hTap();setType("calledout");}}
                    style={{padding:"11px",borderRadius:10,border:"1px solid "+(type==="calledout"?RED+"66":"rgba(255,255,255,0.08)"),background:type==="calledout"?"rgba(192,57,43,0.2)":"rgba(255,255,255,0.04)",color:type==="calledout"?"#fff":"rgba(255,255,255,0.5)",fontSize:12,fontWeight:type==="calledout"?700:400,cursor:"pointer",fontFamily:"Georgia,serif",transition:"all 0.15s"}}>
                    Called out<div style={{fontSize:10,marginTop:2,opacity:0.7}}>30 crunches</div>
                  </button>
                  <button onClick={()=>{hTap();setType("selfreport");}}
                    style={{padding:"11px",borderRadius:10,border:"1px solid "+(type==="selfreport"?GREEN+"66":"rgba(255,255,255,0.08)"),background:type==="selfreport"?"rgba(30,107,58,0.2)":"rgba(255,255,255,0.04)",color:type==="selfreport"?"#fff":"rgba(255,255,255,0.5)",fontSize:12,fontWeight:type==="selfreport"?700:400,cursor:"pointer",fontFamily:"Georgia,serif",transition:"all 0.15s"}}>
                    Self-report<div style={{fontSize:10,marginTop:2,opacity:0.7}}>25 crunches</div>
                  </button>
                </div>
              </div>

              {/* Total consequence */}
              <div style={{borderRadius:10,padding:"14px",textAlign:"center",background:"rgba(192,57,43,0.14)",border:"1px solid "+RED+"33"}}>
                <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Total consequence</div>
                <div style={{fontSize:36,fontWeight:900,color:RED,lineHeight:1,textShadow:"0 0 20px "+RED+"55"}}>{type==="selfreport"?25*count:30*count}</div>
                <div style={{fontSize:11,color:"#888",marginTop:2}}>crunches</div>
              </div>
            </div>

            {saved?(
              <div style={{padding:"14px",borderRadius:10,background:"rgba(30,107,58,0.18)",textAlign:"center",fontSize:13,color:GREEN,fontWeight:700,border:"1px solid "+GREEN+"44",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                <Icon name="checkSquare" size={14} color={GREEN}/> Logged successfully
              </div>
            ):(
              <button onClick={submitLog} disabled={loading}
                style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:"linear-gradient(135deg,"+RED+",#8B1A1A)",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"Georgia,serif",boxShadow:"0 6px 24px "+RED+"44",letterSpacing:"0.02em"}}>
                {loading?"Logging...":"Log it →"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pattern summary */}
      {patterns.length>0&&(
        <div style={{...glass({borderRadius:16}),padding:"1.25rem",marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:12}}>Pattern Summary — All Time</div>
          {patterns.map(([name,total],i)=>(
            <div key={name} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:i<patterns.length-1?"0.5px solid rgba(255,255,255,0.07)":"none"}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:total>=3?"rgba(192,57,43,0.25)":total>=2?"rgba(133,79,11,0.2)":"rgba(30,107,58,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:total>=3?RED:total>=2?ORANGE:GREEN,flexShrink:0,border:"1px solid "+(total>=3?RED+"44":total>=2?ORANGE+"44":GREEN+"44")}}>
                {total}
              </div>
              <div style={{flex:1,fontSize:13,color:"#ddd"}}>{name}</div>
              {total>=3&&<span style={{fontSize:9,background:"rgba(192,57,43,0.2)",color:RED,padding:"3px 8px",borderRadius:6,border:"1px solid "+RED+"33",fontWeight:700,letterSpacing:"0.04em"}}>Pattern</span>}
            </div>
          ))}
        </div>
      )}

      {/* Crunch leaderboard */}
      {crunchLb.length>0&&(
        <div style={{...glass({borderRadius:16}),padding:"1.25rem",marginBottom:12,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+RED+","+ORANGE+",transparent)"}}/>
          <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:2,display:"flex",alignItems:"center",gap:8}}>
            <Icon name="barbell" size={14} color={RED}/> Crunch Leaderboard
          </div>
          <div style={{fontSize:11,color:"#555",marginBottom:14}}>Total crunches owed all season</div>
          {crunchLb.map(([name,total],i)=>{
            const ath=athletes.find(a=>a.name===name);
            const max=crunchLb[0][1];
            return(
              <div key={name} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:i<crunchLb.length-1?"0.5px solid rgba(255,255,255,0.07)":"none"}}>
                <div style={{width:26,fontSize:12,fontWeight:700,color:i===0?GOLD:i===1?"#C0C0C0":i===2?"#CD7F32":"#555",textAlign:"center",flexShrink:0}}>
                  {i===0?"🥇":i===1?"🥈":i===2?"🥉":"#"+(i+1)}
                </div>
                <div style={{width:30,height:30,borderRadius:"50%",background:ath?.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:500,color:"#fff",flexShrink:0,overflow:"hidden"}}>
                  {ath?.photo_url?<img src={ath.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(name||"?")[0]}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:500,color:"#ddd"}}>{name}</div>
                  <div style={{marginTop:4,height:4,borderRadius:2,background:"rgba(255,255,255,0.07)",overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${(total/max)*100}%`,background:i===0?GOLD:RED,borderRadius:2,boxShadow:"0 0 6px "+(i===0?GOLD:RED)+"66"}}/>
                  </div>
                </div>
                <div style={{fontSize:14,fontWeight:800,color:i===0?GOLD:RED,flexShrink:0}}>{total}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Today's log */}
      <div style={{...glass({borderRadius:16}),padding:"1.25rem"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:12}}>Today's Log</div>
        {todayCallouts.length===0&&(
          <div style={{textAlign:"center",padding:"1rem 0",color:"#555",fontSize:12}}>Nothing logged today.</div>
        )}
        {todayCallouts.map((c,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<todayCallouts.length-1?"0.5px solid rgba(255,255,255,0.07)":"none"}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:"#ddd"}}>{c.athletes?.name}</div>
              <div style={{fontSize:11,color:"#555",marginTop:2}}>{c.violation} · {c.count}× · {c.type==="selfreport"?"Self-report":"Called out"}</div>
            </div>
            <div style={{fontSize:14,fontWeight:800,color:RED,marginRight:4}}>{c.crunches}</div>
            <button onClick={()=>deleteCallout(c.id)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.25)",cursor:"pointer",fontSize:14,padding:4}}>✕</button>
          </div>
        ))}
      </div>

    </div>
  );
}
