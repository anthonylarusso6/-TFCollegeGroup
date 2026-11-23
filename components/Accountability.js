import { useState, useEffect } from "react";
import { RED, GREEN, STEEL, ORANGE } from "../lib/constants";
import { supabase } from "../lib/supabase";
import { nowEST } from "../lib/dates";
import Icon from "./Icon";
import { hTap, hSuccess } from "../lib/haptics";

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

const HANDS=[
  {label:"Hand over hand",desc:"In front of body",icon:"pray"},
  {label:"Hands flat",desc:"Open on hips laying flat",icon:"barbell"},
  {label:"Behind back",desc:"Hands on hands",icon:"lock"},
];

const RULES=[
  {rule:"Cussing",consequence:"30 crunches",color:"#8E44AD"},
  {rule:"Talking 1min+",consequence:"30 crunches",color:RED},
  {rule:"Walking",consequence:"30 crunches",color:RED},
  {rule:"Called out",consequence:"30 crunches",color:RED},
  {rule:"Self-report",consequence:"25 crunches",color:GREEN},
  {rule:"Late arrival",consequence:"50 crunches",color:ORANGE},
  {rule:"No show",consequence:"Shred mill 100yd",color:"#1A4F8A"},
];

const STEPS=[{id:"athlete",label:"Athlete"},{id:"violation",label:"Violation"},{id:"confirm",label:"Confirm"}];

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
      // Notify the athlete: how many crunches and what earned them
      try{
        fetch("/api/send-notification",{method:"POST",headers:{"Content-Type":"application/json","x-app-secret":process.env.NEXT_PUBLIC_APP_ACTION_SECRET||""},body:JSON.stringify({athleteId:selectedAthlete.id,title:type==="selfreport"?"📝 Self-report logged":"📢 You got called out",body:crunches+" crunches"+(count>1?" (×"+count+")":"")+" — "+vLabel,url:"/athlete"})}).catch(()=>{});
      }catch(e){}
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

  const _estNow=nowEST();
  const _todayEST=_estNow.getFullYear()+"-"+String(_estNow.getMonth()+1).padStart(2,"0")+"-"+String(_estNow.getDate()).padStart(2,"0");
  const todayCallouts=callouts.filter(c=>{const d=new Date(new Date(c.logged_at).toLocaleString("en-US",{timeZone:"America/New_York"}));return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")===_todayEST;});
  const totalCrunchesToday=todayCallouts.reduce((sum,c)=>sum+(c.crunches||0),0);
  const patternMap={};
  callouts.forEach(c=>{const name=c.athletes?.name;if(name)patternMap[name]=(patternMap[name]||0)+(c.count||1);});
  const patterns=Object.entries(patternMap).sort((a,b)=>b[1]-a[1]);
  const crunchMap={};
  callouts.forEach(c=>{const name=c.athletes?.name;if(name)crunchMap[name]=(crunchMap[name]||0)+(c.crunches||0);});
  const crunchLb=Object.entries(crunchMap).sort((a,b)=>b[1]-a[1]);

  const athletesToday=[...new Set(todayCallouts.map(c=>c.athlete_id))].length;
  const avColor=(a)=>a?.role==="forge"?RED:STEEL;
  const face=(a,name)=>a?.photo_url?<img src={a.photo_url} alt=""/>:(name||"?")[0];
  const backIcon=<Icon name="chevronRight" size={15} style={{transform:"rotate(180deg)"}}/>;

  return(
    <div className="tfx cb cb-acc">

      {/* Header + daily crunch total */}
      <section className="tfx-card cb-head">
        <div>
          <div className="tfx-eyebrow">Accountability</div>
          <h2>Call-outs &amp; crunches</h2>
          <p>Standards, a quick call-out log and who owes crunches.</p>
        </div>
        {totalCrunchesToday>0&&(
          <div className="cb-owed">
            <b className="tfx-num">{totalCrunchesToday}</b>
            <div>
              <span>Total crunches owed today</span>
              <small>{todayCallouts.length} callout{todayCallouts.length!==1?"s":""} · {athletesToday} athlete{athletesToday!==1?"s":""}</small>
            </div>
          </div>
        )}
      </section>

      {/* Rules reference */}
      <section className="tfx-card cb-sec">
        <div className="cb-sec-head"><h3>Rules &amp; standards</h3></div>

        {/* Hand positions */}
        <div className="cb-sub">
          <div className="tfx-eyebrow">Hand positions</div>
          <div className="cb-hands">
            {HANDS.map(h=>(
              <div key={h.label} className="cb-hand">
                <Icon name={h.icon} size={22}/>
                <b>{h.label}</b>
                <small>{h.desc}</small>
              </div>
            ))}
          </div>
        </div>

        {/* Consequence table */}
        <div className="cb-sub">
          <div className="tfx-eyebrow">Consequences</div>
          <div className="cb-rules">
            {RULES.map(r=>(
              <div key={r.rule} className="cb-rule" style={{"--c":r.color}}>
                <i/>
                <div><b>{r.rule}</b><small>{r.consequence}</small></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick log */}
      <section className="tfx-card cb-sec">
        <div className="cb-sec-head"><h3>Quick call-out log</h3></div>

        {/* Step tracker */}
        <ol className="cb-steps" aria-label="Steps">
          {STEPS.map(s=>{
            const steps=["athlete","violation","confirm"];
            const cur=steps.indexOf(step);
            const idx=steps.indexOf(s.id);
            const done_=idx<cur;
            const active=idx===cur;
            return(
              <li key={s.id} className={active?"is-on":done_?"is-done":""} aria-current={active?"step":undefined}>
                {done_&&<Icon name="checkSquare" size={13}/>}
                {s.label}
              </li>
            );
          })}
        </ol>

        {/* Step 1 — Athlete */}
        {step==="athlete"&&(
          <div className="cb-step">
            <div className="tfx-eyebrow">Who got called out?</div>
            <div className="cb-agrid">
              {athletes.map(a=>{
                const todayCount=todayCallouts.filter(c=>c.athlete_id===a.id).reduce((n,c)=>n+(c.count||1),0);
                const todayCrunches=todayCallouts.filter(c=>c.athlete_id===a.id).reduce((n,c)=>n+(c.crunches||0),0);
                return(
                  <button key={a.id} className={"cb-ath tfx-press"+(todayCount>0?" is-hit":"")} onClick={()=>{hTap();setSelectedAthlete(a);setStep("violation");}}>
                    <span className="rk-av cb-av-m" style={{"--c":avColor(a)}}>{face(a,a.name)}</span>
                    <b>{(a.name||"").split(" ")[0]}</b>
                    {todayCrunches>0&&<small>{todayCrunches}</small>}
                    {todayCount>0&&<span className="cb-badge" aria-label={todayCount+" today"}>{todayCount}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2 — Violation */}
        {step==="violation"&&(
          <div className="cb-step">
            <div className="cb-back">
              <button className="tfx-press" onClick={()=>{hTap();setStep("athlete");}}>{backIcon} Back</button>
              <b>{selectedAthlete?.name}</b>
            </div>
            <div className="cb-vgrid">
              {VIOLATIONS.map(v=>(
                <button key={v.label} aria-pressed={violation?.label===v.label} className={"cb-viol tfx-press"+(violation?.label===v.label?" is-on":"")}
                  onClick={()=>{hTap();setViolation(v);if(v.label!=="Other")setStep("confirm");}}>
                  <Icon name={v.icon} size={16}/>
                  <span>{v.label}</span>
                </button>
              ))}
            </div>
            {violation?.label==="Other"&&(
              <div className="cb-other">
                <input className="tfx-field cb-field" value={otherText} onChange={e=>setOtherText(e.target.value)} placeholder="Describe violation..." aria-label="Describe violation"/>
                <button className={"tfx-btn cb-btn-red cb-btn-block"+(otherText.trim()?"":" is-off")} onClick={()=>{if(otherText.trim()){hTap();setStep("confirm");}}}>
                  Continue →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3 — Confirm */}
        {step==="confirm"&&(
          <div className="cb-step">
            <div className="cb-back">
              <button className="tfx-press" onClick={()=>{hTap();setStep("violation");}}>{backIcon} Back</button>
              <b>Confirm log</b>
            </div>
            <div className="cb-confirm-card">
              <div className="cb-confirm-who">
                <b>{selectedAthlete?.name}</b>
                <span>{violation?.label==="Other"?otherText:violation?.label}</span>
              </div>

              {/* Count */}
              <div>
                <div className="tfx-eyebrow cb-mini-lbl">How many times?</div>
                <div className="ir-seg cb-countseg" role="group" aria-label="How many times">
                  {[1,2,3,4,5].map(n=>(
                    <button key={n} className={count===n?"is-on":""} aria-pressed={count===n} onClick={()=>{hTap();setCount(n);}}>{n}</button>
                  ))}
                </div>
              </div>

              {/* Type */}
              <div>
                <div className="tfx-eyebrow cb-mini-lbl">Type</div>
                <div className="cb-types">
                  <button className={"cb-type is-red tfx-press"+(type==="calledout"?" is-on":"")} aria-pressed={type==="calledout"} onClick={()=>{hTap();setType("calledout");}}>
                    <b>Called out</b><small>30 crunches</small>
                  </button>
                  <button className={"cb-type is-green tfx-press"+(type==="selfreport"?" is-on":"")} aria-pressed={type==="selfreport"} onClick={()=>{hTap();setType("selfreport");}}>
                    <b>Self-report</b><small>25 crunches</small>
                  </button>
                </div>
              </div>

              {/* Total consequence */}
              <div className="cb-total">
                <span className="tfx-eyebrow">Total consequence</span>
                <b className="tfx-num">{type==="selfreport"?25*count:30*count}</b>
                <small>crunches</small>
              </div>
            </div>

            {saved?(
              <div className="cb-ok" role="status"><Icon name="checkSquare" size={15}/> Logged successfully</div>
            ):(
              <button className="tfx-btn cb-btn-red cb-btn-block tfx-press" onClick={submitLog} disabled={loading}>
                {loading?"Logging...":"Log it →"}
              </button>
            )}
          </div>
        )}
      </section>

      {/* Pattern summary */}
      {patterns.length>0&&(
        <section className="tfx-card cb-sec">
          <div className="cb-sec-head"><div><h3>Pattern summary</h3><p>All time · call-outs per athlete</p></div></div>
          <ul className="cb-lines">
            {patterns.map(([name,total])=>(
              <li key={name}>
                <span className={"cb-sev "+(total>=3?"is-hi":total>=2?"is-mid":"is-lo")}>{total}</span>
                <span className="cb-name">{name}</span>
                {total>=3&&<span className="cb-pill is-red">Pattern</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Crunch leaderboard */}
      {crunchLb.length>0&&(
        <section className="tfx-card cb-sec">
          <div className="cb-sec-head"><div><h3>Crunch leaderboard</h3><p>Total crunches owed all season</p></div></div>
          <ul className="cb-lines">
            {crunchLb.map(([name,total],i)=>{
              const ath=athletes.find(a=>a.name===name);
              const max=crunchLb[0][1];
              return(
                <li key={name} className={i===0?"is-first":""}>
                  <span className={"cb-rank"+(i<3?" is-"+(i+1):"")}>{i+1}</span>
                  <span className="rk-av" style={{"--c":avColor(ath)}}>{face(ath,name)}</span>
                  <span className="cb-lb-main">
                    <span className="cb-name">{name}</span>
                    <span className="cb-bar"><i style={{"--p":max?total/max:0}}/></span>
                  </span>
                  <b className="cb-lb-val">{total}</b>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Today's log */}
      <section className="tfx-card cb-sec">
        <div className="cb-sec-head"><h3>Today&apos;s log</h3>{todayCallouts.length>0&&<span className="cb-pill is-red">{totalCrunchesToday} crunches</span>}</div>
        {todayCallouts.length===0&&(
          <p className="cb-none">Nothing logged today.</p>
        )}
        {todayCallouts.length>0&&(
          <ul className="cb-list">
            {todayCallouts.map((c,i)=>(
              <li key={i} className="cb-row">
                <span className="cb-who">
                  <b>{c.athletes?.name}</b>
                  <small>{c.violation} · {c.count}× · {c.type==="selfreport"?"Self-report":"Called out"}</small>
                </span>
                <b className="cb-crunch">{c.crunches}</b>
                <button className="cb-x" aria-label={"Delete call-out for "+(c.athletes?.name||"athlete")} onClick={()=>deleteCallout(c.id)}>✕</button>
              </li>
            ))}
          </ul>
        )}
      </section>

    </div>
  );
}
