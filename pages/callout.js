import { useState, useEffect } from "react";
import Head from "next/head";
import { supabase } from "../lib/supabase";
import { ATHLETE_SAFE_COLS } from "../lib/constants";
import { nowEST } from "../lib/dates";
import Icon from "../components/Icon";
import { hTap, hSuccess } from "../lib/haptics";
import { useMood } from "../lib/ambient";
import { authApi, setSession, loadSavedSession, authErrorText } from "../lib/session";

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
  useMood("callouts");
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
  // This station sends push notifications, so a coach unlocks it once per
  // device (30 days) with Coach Ant's PIN, checked on the server.
  const[station,setStation]=useState(null);
  const[sPin,setSPin]=useState("");
  const[sErr,setSErr]=useState("");
  useEffect(()=>{setStation(!!loadSavedSession("station"));},[]);
  const stationKey=(k)=>{
    if(k==="⌫"){setSPin(p=>p.slice(0,-1));setSErr("");return;}
    if(sPin.length>=4)return;
    const next=sPin+String(k);setSPin(next);
    if(next.length===4){
      authApi({action:"login",kind:"coach",id:"ant",pin:next}).then(r=>{
        if(r.token){setSession("station",r.token);setStation(true);setSErr("");}
        else{setSErr(authErrorText(r));}
        setSPin("");
      });
    }
  };

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

  if(station===false) return(
    <div className="tfx lg">
      <Head><title>Call-Out Station · TF College Group</title></Head>
      <div className="lg-col">
        <div className="lg-brand"><img src="/icon.png" alt=""/><span>TF College Group</span></div>
        <div className="lg-who" style={{"--c":"#e5484d"}}>
          <h1>Unlock the call-out station</h1>
          <p>Coach Ant: enter your PIN. This iPad stays unlocked for 30 days.</p>
        </div>
        <div className={"lg-dots"+(sErr?" is-error":"")} style={{"--c":"#e5484d"}} aria-label={sPin.length+" of 4 digits entered"}>{[0,1,2,3].map(i=><i key={i} className={i<sPin.length?"is-on":""}/>)}</div>
        {sErr&&<div role="alert" className="lg-msg is-error">{sErr}</div>}
        <div className="lg-pad">
          {[1,2,3,4,5,6,7,8,9,null,0,"⌫"].map((k,i)=>k===null?<span key={i}/>:<button key={i} className={"tfx-press"+(k==="⌫"?" is-del":"")} onClick={()=>stationKey(k)} aria-label={k==="⌫"?"Delete":String(k)}>{k}</button>)}
        </div>
        <a href="/" className="lg-link">← Back to home</a>
      </div>
    </div>
  );

  if(loading) return(
    <div className="tfx af-cs-loading">
      <Icon name="anvil" size={40}/>
      <span>Loading…</span>
    </div>
  );

  const todayLog=log.filter(l=>logDate(l.logged_at)===estToday());
  const av=(a,cls="")=>(
    <span className={"af-av"+(a?.role==="forge"?" is-forge":"")+(cls?" "+cls:"")}>
      {a?.photo_url?<img src={a.photo_url} alt="" onError={e=>{e.target.style.display="none";}}/>:a?.name[0]}
    </span>
  );

  return(
    <>
      <Head><title>Call-Out Station — TF College Group</title></Head>
      <div className="tfx af-cs">

        {/* Header */}
        <header className="af-cs-bar tfx-glassbar">
          <div className="af-cs-brand">
            <span className="af-cs-mark"><Icon name="megaphone" size={19}/></span>
            <div>
              <b>Call-Out Station</b>
              <small>Weight room · TF College Group</small>
            </div>
          </div>
          <div className="af-cs-actions">
            <button className={"tfx-btn-ghost tfx-press af-cs-pillbtn"+(showLog?" is-on":"")} aria-expanded={showLog} onClick={()=>setShowLog(s=>!s)}>
              <Icon name="list" size={14}/>
              {showLog?"Hide log":"Today's log"}{todayLog.length>0&&<span className="af-cs-n">{todayLog.length}</span>}
            </button>
            <a href="/" className="tfx-btn-ghost tfx-press af-cs-pillbtn af-cs-home" aria-label="Home">
              <Icon name="home" size={14}/>
              <span>Home</span>
            </a>
          </div>
        </header>

        <main className="af-cs-main">

          {/* Step tracker */}
          <ol className="af-cs-steps" aria-label="Progress">
            {[{id:"athlete",label:"Athlete"},{id:"violation",label:"Violation"},{id:"confirm",label:"Confirm"}].map((s,i)=>{
              const done_=done&&i===2;
              const isActive=i===stepIdx&&!done_;
              const isPast=i<stepIdx||done_;
              return(
                <li key={s.id}>
                  <div className={"af-cs-step"+(isActive?" is-active":"")+(isPast?" is-past":"")} aria-current={isActive?"step":undefined}>
                    <i>{isPast?"✓":i+1}</i>
                    <span>{s.label}</span>
                  </div>
                  {i<2&&<div className={"af-cs-line"+(isPast?" is-past":"")}/>}
                </li>
              );
            })}
          </ol>

          {/* DONE screen */}
          {done&&(
            <section className="tfx-card af-cs-done">
              <span className="af-cs-check tf-pop"><Icon name="checkSquare" size={34}/></span>
              <h2>Logged</h2>
              <b>{selected?.name}</b>
              <small>{violation==="Other"?otherText:violation} · {count}× · {type==="selfreport"?"Self-report":"Called out"}</small>
              <div className="af-cs-total">
                <div className="af-cs-big"><b className="tfx-num">{type==="selfreport"?25*count:30*count}</b><span>crunches</span></div>
              </div>
              <button className="tfx-btn tfx-press af-cs-red af-cs-again" onClick={reset}>
                Log another →
              </button>
            </section>
          )}

          {/* STEP 1 — Athlete */}
          {!done&&step==="athlete"&&(
            <>
              <div className="af-cs-q">
                <h2>Who got called out?</h2>
                <p>Select the athlete · tap to continue</p>
              </div>
              <div className="af-cs-grid">
                {athletes.map(a=>{
                  const todayCount=log.filter(l=>l.athlete_id===a.id&&logDate(l.logged_at)===estToday()).reduce((n,l)=>n+(l.count||1),0);
                  return(
                    <button key={a.id} className="tfx-card tfx-press af-cs-ath" onClick={()=>{hTap();setSelected(a);setStep("violation");}}>
                      {av(a,"is-lg")}
                      <b>{(a.name||"").split(" ")[0]}</b>
                      <small>{a.sport||""}</small>
                      {todayCount>0&&(
                        <em aria-label={todayCount+" today"}>{todayCount}</em>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* STEP 2 — Violation */}
          {!done&&step==="violation"&&(
            <>
              <div className="af-cs-who">
                <button className="tfx-btn-ghost tfx-press af-cs-back" onClick={()=>setStep("athlete")}>
                  <Icon name="chevronRight" size={14} style={{transform:"rotate(180deg)"}}/> Back
                </button>
                {av(selected)}
                <div className="af-cs-who-txt">
                  <b>{selected?.name}</b>
                  <small>What was the violation?</small>
                </div>
              </div>
              <div className="af-cs-viols">
                {VIOLATIONS.map(v=>(
                  <button key={v.label} className={"tfx-card tfx-press af-cs-viol"+(violation===v.label?" is-on":"")} onClick={()=>{hTap();setViolation(v.label);if(v.label!=="Other")setStep("confirm");}}>
                    <span aria-hidden="true">{v.icon}</span>
                    <span>{v.label}</span>
                  </button>
                ))}
              </div>
              {violation==="Other"&&(
                <div className="tfx-card af-cs-other">
                  <input className="tfx-field" value={otherText} onChange={e=>setOtherText(e.target.value)} placeholder="Describe the violation…" aria-label="Describe the violation"/>
                  <button className="tfx-btn tfx-press af-cs-red" disabled={!otherText.trim()} onClick={()=>otherText.trim()&&setStep("confirm")}>
                    Continue →
                  </button>
                </div>
              )}
            </>
          )}

          {/* STEP 3 — Confirm */}
          {!done&&step==="confirm"&&(
            <>
              <div className="af-cs-who">
                <button className="tfx-btn-ghost tfx-press af-cs-back" onClick={()=>setStep("violation")}>
                  <Icon name="chevronRight" size={14} style={{transform:"rotate(180deg)"}}/> Back
                </button>
                <div className="af-cs-who-txt"><b>Confirm</b></div>
              </div>

              {/* Summary card */}
              <section className="tfx-card af-cs-sum">
                <div className="af-cs-sum-who">
                  {av(selected,"is-lg")}
                  <div>
                    <b>{selected?.name}</b>
                    <small>{violation==="Other"?otherText:violation}</small>
                  </div>
                </div>

                {/* Count */}
                <div>
                  <div className="tfx-eyebrow">How many times?</div>
                  <div className="af-cs-count" role="radiogroup" aria-label="How many times">
                    {[1,2,3,4,5].map(n=>(
                      <button key={n} role="radio" aria-checked={count===n} className={"tfx-press"+(count===n?" is-on":"")} onClick={()=>setCount(n)}>{n}</button>
                    ))}
                  </div>
                </div>

                {/* Type */}
                <div>
                  <div className="tfx-eyebrow">Called out or self-report?</div>
                  <div className="af-cs-type" role="radiogroup" aria-label="Called out or self-report">
                    <button role="radio" aria-checked={type==="calledout"} className={"tfx-press is-called"+(type==="calledout"?" is-on":"")} onClick={()=>setType("calledout")}>
                      <span>Called out</span>
                      <small>30 crunches</small>
                    </button>
                    <button role="radio" aria-checked={type==="selfreport"} className={"tfx-press is-self"+(type==="selfreport"?" is-on":"")} onClick={()=>setType("selfreport")}>
                      <span>Self-report</span>
                      <small>25 crunches</small>
                    </button>
                  </div>
                </div>

                {/* Consequence callout */}
                <div className="af-cs-total">
                  <div className="tfx-eyebrow">Total consequence</div>
                  <div className="af-cs-big"><b className="tfx-num">{type==="selfreport"?25*count:30*count}</b><span>crunches</span></div>
                </div>
              </section>

              <button className="tfx-btn tfx-press af-cs-red af-cs-go" onClick={submitLog}>
                Log it →
              </button>
            </>
          )}

          {/* Today's log */}
          {showLog&&(
            <section className="tfx-card af-cs-log">
              <div className="af-cs-log-head">
                <Icon name="list" size={14}/>
                <span className="tfx-eyebrow">Today's log</span>
                {todayLog.length>0&&<span className="af-cs-log-cnt">{todayLog.length} {todayLog.length===1?"entry":"entries"}</span>}
              </div>
              {todayLog.length===0?(
                <p className="af-cs-log-empty">Nothing logged today.</p>
              ):(
                <ul>
                  {todayLog.map((l,i)=>(
                    <li key={i}>
                      <div>
                        <b>{l.athletes?.name||"Unknown"}</b>
                        <small>{l.violation} · {l.count}× · {l.type==="selfreport"?"Self-report":"Called out"}</small>
                      </div>
                      <span className="af-cs-log-n"><b className="tfx-num">{l.crunches}</b>crunches</span>
                    </li>
                  ))}
                </ul>
              )}
              {todayLog.length>0&&(
                <div className="af-cs-log-total">
                  <span className="tfx-eyebrow">Total today</span>
                  <b>{todayLog.reduce((s,l)=>s+(l.crunches||0),0)} crunches</b>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </>
  );
}
