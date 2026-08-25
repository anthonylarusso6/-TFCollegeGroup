import { useState, useEffect } from "react";
import Head from "next/head";
import { supabase } from "../lib/supabase";
import { ATHLETE_SAFE_COLS } from "../lib/constants";
import { nowEST } from "../lib/dates";
import Icon from "../components/Icon";
import { hTap, hSuccess } from "../lib/haptics";

const RED="#C0392B";
const GREEN="#2FA869";
const ORANGE="#E8720C";
const GOLD="#D4AF37";

const VIOLATIONS=[
  {label:"Cussing",icon:"🤬",crunches:30},
  {label:"Talking / Socializing 1min+",icon:"💬",crunches:30},
  {label:"Walking (jog everywhere)",icon:"🚶",crunches:30},
  {label:"Hands on head",icon:"🙌",crunches:30},
  {label:"Bending over",icon:"🫸",crunches:30},
  {label:"Hands on hips",icon:"🤜",crunches:30},
  {label:"Standing around",icon:"🧍",crunches:30},
  {label:"Not listening",icon:"🙉",crunches:30},
  {label:"Drill incorrectly",icon:"❌",crunches:30},
  {label:"Other",icon:"⚠️",crunches:30},
];

const estToday=()=>{const n=nowEST();return n.getFullYear()+"-"+String(n.getMonth()+1).padStart(2,"0")+"-"+String(n.getDate()).padStart(2,"0");};
const logDate=(ts)=>{if(!ts)return"";const d=new Date(ts);const e=new Date(d.toLocaleString("en-US",{timeZone:"America/New_York"}));return e.getFullYear()+"-"+String(e.getMonth()+1).padStart(2,"0")+"-"+String(e.getDate()).padStart(2,"0");};

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
    try{const{data}=await supabase.from("athletes").select(ATHLETE_SAFE_COLS).eq("status","active").order("name");if(data)setAthletes(data);}catch(e){}
    try{const{data:logs}=await supabase.from("callouts").select("*,athletes(name)").order("logged_at",{ascending:false}).limit(50);if(logs)setLog(logs);}catch(e){}
    setLoading(false);
  };

  const submitLog=async()=>{
    const vLabel=violation==="Other"?otherText:violation;
    const crunches=type==="selfreport"?25*count:30*count;
    try{
      const{error:insErr}=await supabase.from("callouts").insert({
        athlete_id:selected.id,
        violation:vLabel,
        count,
        type,
        crunches,
        logged_at:new Date().toISOString(),
      });
      if(insErr)throw insErr;
      // Notify the athlete: how many crunches and what earned them
      try{
        fetch("/api/send-notification",{method:"POST",headers:{"Content-Type":"application/json","x-app-secret":process.env.NEXT_PUBLIC_APP_ACTION_SECRET||""},body:JSON.stringify({athleteId:selected.id,title:type==="selfreport"?"📝 Self-report logged":"📢 You got called out",body:crunches+" crunches"+(count>1?" (×"+count+")":"")+" — "+vLabel,url:"/athlete"})}).catch(()=>{});
      }catch(e){}
      hSuccess();
      try{
        const{data:lb}=await supabase.from("leaderboard").select("*").eq("athlete_id",selected.id);
        if(lb&&lb.length>0){
          await supabase.from("leaderboard").update({callout_count:(lb[0].callout_count||0)+count}).eq("athlete_id",selected.id);
        }else{
          await supabase.from("leaderboard").insert({athlete_id:selected.id,callout_count:count});
        }
      }catch(e){}
      setDone(true);
      try{
        const{data:freshLog}=await supabase.from("callouts").select("*,athletes(name)").order("logged_at",{ascending:false}).limit(50);
        if(freshLog)setLog(freshLog);
      }catch(e){
        try{
          const{data:freshLog}=await supabase.from("callouts").select("*").order("logged_at",{ascending:false}).limit(50);
          if(freshLog)setLog(freshLog);
        }catch(e2){}
      }
    }catch(e){
      if(typeof window!=="undefined")alert("Couldn't save the callout — check your connection and try again.");
    }
  };

  const reset=()=>{
    setStep("athlete");setSelected(null);setViolation(null);
    setOtherText("");setCount(1);setType("calledout");setDone(false);
  };

  const STEPS=["athlete","violation","confirm"];
  const stepIdx=done?2:STEPS.indexOf(step);

  const glass=(extra={})=>({
    background:"rgba(255,255,255,0.045)",
    border:"1px solid rgba(255,255,255,0.08)",
    borderRadius:16,
    boxShadow:"inset 0 1px 0 rgba(255,255,255,0.05)",
    ...extra,
  });

  if(loading) return(
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#06060f 0%,#0a0608 50%,#080808 100%)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
        <Icon name="anvil" size={40} color={GOLD} style={{filter:"drop-shadow(0 0 14px "+GOLD+"66)"}}/>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",fontFamily:"Georgia,serif",letterSpacing:"0.08em"}}>Loading…</div>
      </div>
    </div>
  );

  const todayLog=log.filter(l=>logDate(l.logged_at)===estToday());

  return(
    <>
      <Head><title>Call-Out Station — TF College Group</title></Head>
      <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#06060f 0%,#0a0608 50%,#080808 100%)",fontFamily:"Georgia,serif",color:"#fff",position:"relative"}}>

        {/* Ambient glow */}
        <div style={{position:"fixed",top:-100,right:-100,width:300,height:300,borderRadius:"50%",background:RED,opacity:0.06,filter:"blur(100px)",pointerEvents:"none"}}/>

        {/* Header */}
        <div style={{padding:"16px 20px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,borderRadius:12,background:RED+"22",border:"1px solid "+RED+"44",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Icon name="megaphone" size={19} color={RED}/>
              </div>
              <div>
                <div style={{fontSize:15,fontWeight:800,color:"#fff",letterSpacing:"-0.01em"}}>Call-Out Station</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",letterSpacing:"0.06em"}}>Weight room · TF College Group</div>
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={()=>setShowLog(s=>!s)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:20,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.7)",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif",transition:"all 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.08)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.04)";}}>
              <Icon name="list" size={13} color="rgba(255,255,255,0.6)"/>
              {showLog?"Hide log":"Today's log"}{todayLog.length>0&&<span style={{background:RED,color:"#fff",fontSize:9,fontWeight:800,padding:"1px 6px",borderRadius:10,marginLeft:2}}>{todayLog.length}</span>}
            </button>
            <a href="/" style={{display:"flex",alignItems:"center",gap:5,padding:"8px 14px",borderRadius:20,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.6)",fontSize:11,textDecoration:"none",transition:"all 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.08)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.04)";}}>
              <Icon name="home" size={12} color="rgba(255,255,255,0.5)"/>
              Home
            </a>
          </div>
        </div>

        <div style={{maxWidth:720,margin:"0 auto",padding:"0 18px 3rem"}}>

          {/* Step tracker */}
          <div style={{display:"flex",gap:6,padding:"18px 0 16px",alignItems:"center"}}>
            {[{id:"athlete",label:"Athlete"},{id:"violation",label:"Violation"},{id:"confirm",label:"Confirm"}].map((s,i)=>{
              const done_=done&&i===2;
              const isActive=i===stepIdx&&!done_;
              const isPast=i<stepIdx||done_;
              return(
                <div key={s.id} style={{display:"flex",alignItems:"center",flex:i<2?1:"none",gap:6}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flex:i<2?1:undefined}}>
                    <div style={{width:26,height:26,borderRadius:"50%",background:isPast?GREEN+"22":isActive?RED+"22":"rgba(255,255,255,0.05)",border:"1px solid "+(isPast?GREEN+"55":isActive?RED+"55":"rgba(255,255,255,0.1)"),display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s"}}>
                      {isPast?<Icon name="checkSquare" size={12} color={GREEN}/>:<span style={{fontSize:11,fontWeight:700,color:isActive?"#fff":"rgba(255,255,255,0.35)"}}>{i+1}</span>}
                    </div>
                    <span style={{fontSize:11,color:isPast?"#5FD08A":isActive?"#fff":"rgba(255,255,255,0.35)",fontWeight:isActive?700:400,textTransform:"uppercase",letterSpacing:"0.08em",transition:"all 0.2s"}}>{s.label}</span>
                    {i<2&&<div style={{flex:1,height:1,background:isPast?GREEN+"44":"rgba(255,255,255,0.07)",transition:"background 0.3s",minWidth:20}}/>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* DONE screen */}
          {done&&(
            <div style={{textAlign:"center",padding:"2.5rem 1rem 3rem"}}>
              <div className="tf-pop" style={{width:80,height:80,borderRadius:"50%",background:GREEN+"22",border:"2px solid "+GREEN+"55",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",boxShadow:"0 0 32px "+GREEN+"44"}}>
                <Icon name="checkSquare" size={38} color={GREEN}/>
              </div>
              <div style={{fontSize:26,fontWeight:800,color:"#fff",marginBottom:6,letterSpacing:"-0.02em"}}>Logged</div>
              <div style={{fontSize:14,color:"rgba(255,255,255,0.6)",marginBottom:4}}>{selected?.name}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:14}}>{violation==="Other"?otherText:violation} · {count}× · {type==="selfreport"?"Self-report":"Called out"}</div>
              <div style={{display:"inline-flex",alignItems:"baseline",gap:6,background:RED+"22",border:"1px solid "+RED+"44",borderRadius:16,padding:"12px 28px",marginBottom:32}}>
                <span style={{fontSize:38,fontWeight:900,color:RED,lineHeight:1}}>{type==="selfreport"?25*count:30*count}</span>
                <span style={{fontSize:14,color:"rgba(255,255,255,0.6)"}}>crunches</span>
              </div>
              <div>
                <button onClick={reset} style={{padding:"15px 36px",borderRadius:14,border:"none",background:RED,color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"Georgia,serif",letterSpacing:"0.02em",boxShadow:"0 8px 28px "+RED+"44"}}>
                  Log another →
                </button>
              </div>
            </div>
          )}

          {/* STEP 1 — Athlete */}
          {!done&&step==="athlete"&&(
            <div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:20,fontWeight:800,color:"#fff",marginBottom:4,letterSpacing:"-0.02em"}}>Who got called out?</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>Select the athlete · tap to continue</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10}}>
                {athletes.map(a=>{
                  const todayCount=log.filter(l=>l.athlete_id===a.id&&logDate(l.logged_at)===estToday()).reduce((n,l)=>n+(l.count||1),0);
                  const isForge=a.role==="forge";
                  const avatarColor=isForge?RED:"#708090";
                  return(
                    <button key={a.id} onClick={()=>{hTap();setSelected(a);setStep("violation");}}
                      style={{...glass(),padding:"16px 10px 14px",textAlign:"center",cursor:"pointer",fontFamily:"Georgia,serif",position:"relative",transition:"border-color 0.18s,background 0.18s"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=avatarColor+"66";e.currentTarget.style.background="rgba(255,255,255,0.07)";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";e.currentTarget.style.background="rgba(255,255,255,0.045)";}}>
                      <div style={{width:50,height:50,borderRadius:"50%",background:avatarColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,color:"#fff",margin:"0 auto 10px",overflow:"hidden",boxShadow:"0 0 18px "+avatarColor+"44"}}>
                        {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";}} alt=""/>:a.name[0]}
                      </div>
                      <div style={{fontSize:13,fontWeight:700,color:"#fff",lineHeight:1.2}}>{(a.name||"").split(" ")[0]}</div>
                      <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginTop:3}}>{a.sport||""}</div>
                      {todayCount>0&&(
                        <div style={{position:"absolute",top:8,right:8,minWidth:20,height:20,borderRadius:10,background:RED,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",fontWeight:800,padding:"0 5px"}}>
                          {todayCount}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2 — Violation */}
          {!done&&step==="violation"&&(
            <div>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
                <button onClick={()=>setStep("athlete")} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:20,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.6)",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                  <Icon name="chevronRight" size={12} color="rgba(255,255,255,0.5)" style={{transform:"rotate(180deg)"}}/> Back
                </button>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:RED,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:"#fff",overflow:"hidden",flexShrink:0}}>
                    {selected?.photo_url?<img src={selected.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="" onError={e=>{e.target.style.display="none";}}/>:selected?.name[0]}
                  </div>
                  <div>
                    <div style={{fontSize:16,fontWeight:800,color:"#fff",letterSpacing:"-0.01em"}}>{selected?.name}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>What was the violation?</div>
                  </div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:9,marginBottom:14}}>
                {VIOLATIONS.map(v=>(
                  <button key={v.label} onClick={()=>{hTap();setViolation(v.label);if(v.label!=="Other")setStep("confirm");}}
                    style={{...glass({borderColor:violation===v.label?RED+"66":"rgba(255,255,255,0.08)",background:violation===v.label?"rgba(192,57,43,0.14)":"rgba(255,255,255,0.045)"}),padding:"15px 14px",cursor:"pointer",fontFamily:"Georgia,serif",display:"flex",alignItems:"center",gap:12,transition:"all 0.15s"}}
                    onMouseEnter={e=>{if(violation!==v.label){e.currentTarget.style.background="rgba(255,255,255,0.07)";e.currentTarget.style.borderColor="rgba(255,255,255,0.15)";}}}
                    onMouseLeave={e=>{if(violation!==v.label){e.currentTarget.style.background="rgba(255,255,255,0.045)";e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";}}}>
                    <span style={{fontSize:22,flexShrink:0,lineHeight:1}}>{v.icon}</span>
                    <span style={{fontSize:13,color:violation===v.label?"#fff":"rgba(255,255,255,0.8)",fontWeight:violation===v.label?700:400,textAlign:"left",lineHeight:1.35}}>{v.label}</span>
                  </button>
                ))}
              </div>
              {violation==="Other"&&(
                <div style={{...glass(),padding:"14px",marginTop:4}}>
                  <input value={otherText} onChange={e=>setOtherText(e.target.value)} placeholder="Describe the violation…" style={{width:"100%",padding:"11px 14px",fontSize:14,border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,background:"rgba(255,255,255,0.04)",color:"#fff",fontFamily:"Georgia,serif",boxSizing:"border-box",marginBottom:10,outline:"none"}}
                    onFocus={e=>e.target.style.borderColor="rgba(255,255,255,0.25)"}
                    onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.1)"}/>
                  <button onClick={()=>otherText.trim()&&setStep("confirm")} style={{width:"100%",padding:"12px",borderRadius:10,border:"none",background:otherText.trim()?RED:"rgba(255,255,255,0.07)",color:otherText.trim()?"#fff":"rgba(255,255,255,0.3)",fontSize:14,fontWeight:700,cursor:otherText.trim()?"pointer":"default",fontFamily:"Georgia,serif",transition:"all 0.15s"}}>
                    Continue →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 — Confirm */}
          {!done&&step==="confirm"&&(
            <div>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
                <button onClick={()=>setStep("violation")} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:20,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.6)",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                  <Icon name="chevronRight" size={12} color="rgba(255,255,255,0.5)" style={{transform:"rotate(180deg)"}}/> Back
                </button>
                <div style={{fontSize:16,fontWeight:800,color:"#fff",letterSpacing:"-0.01em"}}>Confirm</div>
              </div>

              {/* Summary card */}
              <div style={{...glass({borderColor:"rgba(255,255,255,0.1)"}),padding:"16px 18px",marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,paddingBottom:14,borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
                  <div style={{width:46,height:46,borderRadius:"50%",background:RED,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#fff",flexShrink:0,overflow:"hidden"}}>
                    {selected?.photo_url?<img src={selected.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="" onError={e=>{e.target.style.display="none";}}/>:selected?.name[0]}
                  </div>
                  <div>
                    <div style={{fontSize:17,fontWeight:800,color:"#fff",marginBottom:3}}>{selected?.name}</div>
                    <div style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>{violation==="Other"?otherText:violation}</div>
                  </div>
                </div>

                {/* Count */}
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.14em",fontWeight:700,marginBottom:9}}>How many times?</div>
                  <div style={{display:"flex",gap:8}}>
                    {[1,2,3,4,5].map(n=>(
                      <button key={n} onClick={()=>setCount(n)} style={{flex:1,padding:"13px 4px",borderRadius:11,border:"1px solid "+(count===n?RED+"66":"rgba(255,255,255,0.08)"),background:count===n?"rgba(192,57,43,0.2)":"rgba(255,255,255,0.04)",color:count===n?"#fff":"rgba(255,255,255,0.55)",fontSize:17,fontWeight:count===n?800:400,cursor:"pointer",fontFamily:"Georgia,serif",transition:"all 0.15s"}}>{n}</button>
                    ))}
                  </div>
                </div>

                {/* Type */}
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.14em",fontWeight:700,marginBottom:9}}>Called out or self-report?</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
                    <button onClick={()=>setType("calledout")} style={{padding:"14px",borderRadius:12,border:"1px solid "+(type==="calledout"?RED+"66":"rgba(255,255,255,0.08)"),background:type==="calledout"?"rgba(192,57,43,0.18)":"rgba(255,255,255,0.04)",color:type==="calledout"?"#fff":"rgba(255,255,255,0.5)",fontSize:13,fontWeight:type==="calledout"?700:400,cursor:"pointer",fontFamily:"Georgia,serif",transition:"all 0.15s"}}>
                      <div>Called out</div>
                      <div style={{fontSize:11,marginTop:3,color:type==="calledout"?RED+"cc":"rgba(255,255,255,0.35)"}}>30 crunches</div>
                    </button>
                    <button onClick={()=>setType("selfreport")} style={{padding:"14px",borderRadius:12,border:"1px solid "+(type==="selfreport"?GREEN+"66":"rgba(255,255,255,0.08)"),background:type==="selfreport"?"rgba(47,168,105,0.15)":"rgba(255,255,255,0.04)",color:type==="selfreport"?"#fff":"rgba(255,255,255,0.5)",fontSize:13,fontWeight:type==="selfreport"?700:400,cursor:"pointer",fontFamily:"Georgia,serif",transition:"all 0.15s"}}>
                      <div>Self-report</div>
                      <div style={{fontSize:11,marginTop:3,color:type==="selfreport"?GREEN+"cc":"rgba(255,255,255,0.35)"}}>25 crunches</div>
                    </button>
                  </div>
                </div>

                {/* Consequence callout */}
                <div style={{borderRadius:12,background:RED+"18",border:"1px solid "+RED+"44",padding:"16px",textAlign:"center"}}>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.45)",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:6}}>Total consequence</div>
                  <div style={{display:"flex",alignItems:"baseline",justifyContent:"center",gap:8}}>
                    <span style={{fontSize:44,fontWeight:900,color:"#fff",lineHeight:1,letterSpacing:"-0.03em"}}>{type==="selfreport"?25*count:30*count}</span>
                    <span style={{fontSize:16,color:"rgba(255,255,255,0.5)"}}>crunches</span>
                  </div>
                </div>
              </div>

              <button onClick={submitLog} style={{width:"100%",padding:"17px",borderRadius:14,border:"none",background:"linear-gradient(135deg,"+RED+",#8B1A1A)",color:"#fff",fontSize:16,fontWeight:800,cursor:"pointer",fontFamily:"Georgia,serif",letterSpacing:"0.02em",boxShadow:"0 8px 28px "+RED+"44"}}>
                Log it →
              </button>
            </div>
          )}

          {/* Today's log */}
          {showLog&&(
            <div style={{...glass({borderColor:"rgba(255,255,255,0.1)"}),padding:"16px",marginTop:24}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                <Icon name="list" size={14} color="rgba(255,255,255,0.6)"/>
                <span style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.7)",textTransform:"uppercase",letterSpacing:"0.12em"}}>Today's log</span>
                {todayLog.length>0&&<span style={{marginLeft:"auto",fontSize:12,color:"rgba(255,255,255,0.4)"}}>{todayLog.length} {todayLog.length===1?"entry":"entries"}</span>}
              </div>
              {todayLog.length===0?(
                <div style={{fontSize:13,color:"rgba(255,255,255,0.3)",textAlign:"center",padding:"20px 0",fontStyle:"italic"}}>Nothing logged today.</div>
              ):(
                todayLog.map((l,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<todayLog.length-1?"1px solid rgba(255,255,255,0.06)":"none",gap:12}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:"#fff",marginBottom:2}}>{l.athletes?.name||"Unknown"}</div>
                      <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.violation} · {l.count}× · {l.type==="selfreport"?"Self-report":"Called out"}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"baseline",gap:4,flexShrink:0}}>
                      <span style={{fontSize:17,fontWeight:800,color:RED}}>{l.crunches}</span>
                      <span style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>crunches</span>
                    </div>
                  </div>
                ))
              )}
              {todayLog.length>0&&(
                <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid rgba(255,255,255,0.07)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:11,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.1em"}}>Total today</span>
                  <span style={{fontSize:15,fontWeight:800,color:RED}}>{todayLog.reduce((s,l)=>s+(l.crunches||0),0)} crunches</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
