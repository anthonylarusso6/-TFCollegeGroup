import { useState } from "react";
import { BG, PUR, RED, GREEN, STEEL } from "../lib/constants";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";

const Eye=()=>(
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

export default function GoalsTab({ athletes, goalReviews, setGoalReviews, genLoading, generateTask }){
  const[goalsSearch,setGoalsSearch]=useState("");
  const[goalsFilter,setGoalsFilter]=useState("all");
  const active=athletes.filter(a=>a.status==="active");
  const missingCount=active.filter(a=>!a.athletic_goal&&!a.character_goal).length;
  const shown=athletes.filter(a=>{
    if(a.status!=="active")return false;
    if(goalsSearch&&!a.name?.toLowerCase().includes(goalsSearch.toLowerCase()))return false;
    if(goalsFilter==="missing")return!a.athletic_goal&&!a.character_goal;
    if(goalsFilter==="set")return!!(a.athletic_goal||a.character_goal);
    return true;
  });
  return(
    <div className="tfx cc">
      <section className="tfx-card cc-head">
        <div className="cc-top">
          <div>
            <div className="tfx-eyebrow">Goals</div>
            <h2>Athlete goals</h2>
            <p>Assign an athletic and a character task to each athlete</p>
          </div>
          {missingCount>0&&<span className="cc-pill is-amber"><i/>{missingCount} without goals</span>}
        </div>
        {/* Search + filter */}
        <div className="cc-search">
          <Icon name="search" size={16}/>
          <input className="cc-in" value={goalsSearch} onChange={e=>setGoalsSearch(e.target.value)} placeholder="Search athlete..." aria-label="Search athlete"/>
          {goalsSearch&&<button className="cc-search-x" onClick={()=>setGoalsSearch("")} aria-label="Clear search">✕</button>}
        </div>
        <div className="ir-seg" role="tablist" aria-label="Filter">
          {[
            {id:"all",label:"All"},
            {id:"missing",label:"No goals"},
            {id:"set",label:"Has goals"},
          ].map(f=>(
            <button key={f.id} role="tab" aria-selected={goalsFilter===f.id} className={"tfx-press"+(goalsFilter===f.id?" is-on":"")} onClick={()=>setGoalsFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {shown.length===0&&<section className="tfx-card"><p className="cc-none">{goalsSearch?"No athletes match that search.":goalsFilter==="missing"?"Everyone has goals set.":"No athletes here yet."}</p></section>}
      {shown.map(a=>{
        const hasGoal=!!(a.athletic_goal||a.character_goal);
        const review=goalReviews[a.id]||"";
        return(
        <section key={a.id} className="tfx-card cc-goal">
          {/* Header with photo */}
          <div className="cc-goal-head">
            <span className="rk-av cc-av" style={{"--c":a.role==="forge"?RED:STEEL}}>
              {a.photo_url?<img src={a.photo_url} alt=""/>:(a.name||"?")[0]}
            </span>
            <div className="cc-who">
              <b>{a.name}</b>
              <small>{a.sport}</small>
            </div>
            {/* Review status */}
            <div className="cc-review" role="group" aria-label={"Review status for "+a.name}>
              {[{id:"on_track",label:"✓",color:GREEN,bg:"#0d1a10",tone:"is-green"},{id:"needs_work",label:"!",color:"#854F0B",bg:"#1a1200",tone:"is-amber"},{id:"reviewed",label:<Eye/>,color:PUR,bg:"#13122a",tone:"is-violet"}].map(r=>(
                <button key={r.id} className={r.tone+(review===r.id?" is-on":"")} aria-pressed={review===r.id} aria-label={r.id.replace("_"," ")} onClick={async()=>{
                  const newVal=review===r.id?"":r.id;
                  setGoalReviews(p=>({...p,[a.id]:newVal}));
                  try{await supabase.from("athletes").update({goal_review_status:newVal||null}).eq("id",a.id);}catch(e){}
                }} title={r.id.replace("_"," ")}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {!hasGoal&&(
            <div className="cc-warn">
              <Icon name="alertTriangle" size={15}/>
              <span>No goals set yet — follow up with {(a.name||"").split(" ")[0]}</span>
            </div>
          )}

          <div className="cc-gcols">
            {[{label:"Athletic goal",goalKey:"athletic_goal",taskKey:"coach_athletic_task",type:"athletic",color:GREEN},{label:"Character goal",goalKey:"character_goal",taskKey:"coach_character_task",type:"character",color:PUR}].map(({label,goalKey,taskKey,type,color})=>(
              <div key={goalKey} className={"cc-gcol is-"+type}>
                <div className="cc-glbl"><i/>{label}</div>
                <div className={"cc-gtext"+(a[goalKey]?"":" is-empty")}>{a[goalKey]||"Not set"}</div>
                <textarea className="cc-in" id={a.id+"-"+type} defaultValue={a[taskKey]||""} placeholder="Write or generate a task..." aria-label={label+" task for "+a.name}/>
                <div className="cc-gbtns">
                  <button className={"cc-mini is-tint tfx-press"+(genLoading===a.id+"-"+type?" is-busy":"")} onClick={()=>generateTask(a,type)} disabled={!a[goalKey]||genLoading===a.id+"-"+type}>
                    {genLoading===a.id+"-"+type?"Generating...":"AI task"}
                  </button>
                  <button className="cc-mini is-solid tfx-press" onClick={async()=>{const val=document.getElementById(a.id+"-"+type)?.value;if(val){await supabase.from("athletes").update({[taskKey]:val}).eq("id",a.id);alert("Sent to "+a.name+"!");}}}>
                    Send →
                  </button>
                </div>
                {a[taskKey]&&(
                  <div className="cc-gtask">
                    <span>Current task</span>
                    <p>{a[taskKey]}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
        );
      })}
    </div>
  );
}
