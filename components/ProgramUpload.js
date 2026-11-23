import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { SkeletonList } from "./Skeleton";
import { loadSeason, saveSeason, fmtSeasonDate } from "../lib/season";
import { TIERS } from "../lib/lifting";

// How athletes log each lift in the Iron Room (matches PRLog's inputType branches)
const INPUT_TYPES=[
  {id:"weight",label:"Weight × reps"},
  {id:"bodyweight",label:"Complete button"},
  {id:"weight_yards",label:"Weight × yards"},
  {id:"kb",label:"Kettlebell"},
  {id:"band",label:"Band + complete"},
  {id:"mb",label:"Med ball"},
  {id:"rsi",label:"RSI value"},
  {id:"vert_lr",label:"Vertical L / R (in)"},
];

const DAYS=["Mon","Tue","Thu","Fri"];
const DAY_LABELS={Mon:"Monday",Tue:"Tuesday",Thu:"Thursday",Fri:"Friday"};

const ALL_LIFTS=[
  "Power Clean","Hang Clean","Hang Snatch","Push Jerk",
  "Back Squat","Front Squat","Box Squat","Romanian Deadlift",
  "Deadlift","Bench Press","Incline Bench","Military Press",
  "Push Press","Pull-ups","Bent Over Row","Barbell Row",
  "Dumbbell Press","Lat Pulldown","Dips","Lunges",
];

// One-tap preset. Uses the `sets` field (what the athlete Iron Room renders as the
// rep scheme) so the reps show up immediately after pushing.
const BASEBALL_FALL_P1={
  phase:"Baseball Fall Phase 1",
  notes:"Baseball Fall Phase 1 - in-season (4 athletes). Overhead pressing retained with pull-bias; scap/cuff care via TRX T-Y-I, Waiter Carry, face pull, rear delt fly; rotation via MB with intent; run volume trimmed for skill-work load.",
  days:{
    Mon:[
      {name:"SSB Hatfield Squat",tier:1,sets:"8, 6, 5, 4"},
      {name:"Band Assisted Alt. SS Drop Jump",tier:1,sets:"3 x 5e",inputType:"bodyweight"},
      {name:"DB Arnold Press",tier:2,sets:"4 x 8 (3:0:0)"},
      {name:"Cable Face Pull",tier:2,sets:"3 x 12 (2:2:0)"},
      {name:"MB Slam to Rot Scoop Throw",tier:2,sets:"4 x 5e",inputType:"bodyweight"},
      {name:"Foam Roller SL Hip Bridge",tier:3,sets:"3 x 10ea",inputType:"bodyweight"},
      {name:"Foam Roller (X2) Plank Hold",tier:3,sets:"2 x 2:00s",inputType:"bodyweight"},
    ],
    Tue:[
      {name:"BB Forward Lunge",tier:1,sets:"4 x 6ea"},
      {name:"BB Strict Press",tier:1,sets:"8, (4, 3, 3 (3:0:0))"},
      {name:"Alt. DB Bench Press",tier:2,sets:"4 x 7e"},
      {name:"Banded KB Swing",tier:2,sets:"4 x 15"},
      {name:"Lat Pull Down",tier:3,sets:"3 x 7 (2:2:0)"},
      {name:"DB Rear Delt Flys",tier:3,sets:"3 x 10"},
      {name:"Cable SA Row",tier:3,sets:"3 x 15e"},
    ],
    Thu:[
      {name:"BB Hang Cleans",tier:1,sets:"6, 5, 4, 3"},
      {name:"10/5 RSI",tier:1,sets:"2 x 1",inputType:"rsi"},
      {name:"KB Side Lat Dips",tier:1,sets:"3 x 10e"},
      {name:"DB Alt. Incline NG Bench Press",tier:2,sets:"12, 10, 8, 6"},
      {name:"Seated Cable Row",tier:2,sets:"12, 8, 8, 4 (3:2:0)"},
      {name:"Hollow Body Holds",tier:2,sets:"3 x 30s",inputType:"bodyweight"},
      {name:"BWD Sled Drag Heavy",tier:3,sets:"3 x 20yds",inputType:"bodyweight"},
      {name:"KB Lateral Cont. Lunge",tier:3,sets:"3 x 6e"},
    ],
    Fri:[
      {name:"Front Squat",tier:1,sets:"9, 7, (5, 4 (0:2:0))"},
      {name:"Standing SL Vert",tier:1,sets:"4 x 3ea",inputType:"vert_lr"},
      {name:"TRX T,Y,I",tier:1,sets:"4 x 3ea (QUALITY REPS)",inputType:"bodyweight"},
      {name:"KB SA Sit Up",tier:2,sets:"3 x 10ea"},
      {name:"KB Waiter Carry",tier:2,sets:"3 x 20yds ea"},
      {name:"KB PUP Pull Through w/Push Up",tier:2,sets:"3 x 7ea"},
      {name:"Side Plank Cable Row",tier:3,sets:"3 x 12 (0:2:0)"},
      {name:"DB Zottman Curl",tier:3,sets:"3 x 12"},
      {name:"Cable SA Kickback",tier:3,sets:"3 x 9e"},
    ],
  },
};

// Same hues the athlete Iron Room uses, so the editor matches what athletes see
const TIER_COLORS={
  1:{color:TIERS[1].c,label:"T1"},
  2:{color:TIERS[2].c,label:"T2"},
  3:{color:TIERS[3].c,label:"T3"},
};

export default function ProgramUpload(){
  const[phase,setPhase]=useState("");
  const[days,setDays]=useState({Mon:[],Tue:[],Thu:[],Fri:[]});
  const[activeDay,setActiveDay]=useState("Mon");
  const[notes,setNotes]=useState("");
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);
  const[saveErr,setSaveErr]=useState("");
  const[currentProgram,setCurrentProgram]=useState(null);
  const[loading,setLoading]=useState(true);
  const[presetLoaded,setPresetLoaded]=useState(false);
  const[newLift,setNewLift]=useState("");
  // Season dates (drive the athlete countdown, home-page progress, and season recap)
  const[season,setSeason]=useState(null);
  const[sLabel,setSLabel]=useState("");
  const[sStart,setSStart]=useState("");
  const[sEnd,setSEnd]=useState("");
  const[sSaving,setSSaving]=useState(false);
  const[sMsg,setSMsg]=useState("");

  useEffect(()=>{
    (async()=>{
      try{
        const{data}=await supabase.from("announcements").select("*").eq("type","program").eq("active",true)
          .order("created_at",{ascending:false}).limit(1);
        if(data&&data[0]){
          const p=JSON.parse(data[0].message||"{}");
          setCurrentProgram(p);
          if(p.phase)setPhase(p.phase);
          if(p.days)setDays(p.days);
          if(p.notes)setNotes(p.notes);
        }
      }catch(e){}
      try{
        const ssn=await loadSeason();
        setSeason(ssn);setSLabel(ssn.label);setSStart(ssn.start);setSEnd(ssn.end);
      }catch(e){}
      setLoading(false);
    })();
  },[]);

  const saveSeasonDates=async()=>{
    setSMsg("");
    if(!sLabel.trim()||!sStart||!sEnd){setSMsg("Add a name, start date, and end date.");return;}
    if(sEnd<sStart){setSMsg("End date must be after the start date.");return;}
    setSSaving(true);
    try{
      await saveSeason({label:sLabel.trim(),start:sStart,end:sEnd});
      setSeason({label:sLabel.trim(),start:sStart,end:sEnd,explicit:true});
      setSMsg("✓ Season saved — athletes see it now");
    }catch(e){setSMsg("Save failed: "+(e.message||e));}
    setSSaving(false);
  };

  // ── Lift editing ──
  const updateLift=(day,idx,patch)=>{
    setDays(prev=>{const list=[...(prev[day]||[])];list[idx]={...list[idx],...patch};return{...prev,[day]:list};});
  };
  const removeLift=(day,idx)=>{
    setDays(prev=>{const list=[...(prev[day]||[])];list.splice(idx,1);return{...prev,[day]:list};});
  };
  const moveLift=(day,idx,dir)=>{
    setDays(prev=>{
      const list=[...(prev[day]||[])];const j=idx+dir;
      if(j<0||j>=list.length)return prev;
      [list[idx],list[j]]=[list[j],list[idx]];
      return{...prev,[day]:list};
    });
  };
  const addLift=(day,name)=>{
    const n=(name||"").trim();if(!n)return;
    setDays(prev=>{
      const list=[...(prev[day]||[])];
      if(list.some(l=>l.name.toLowerCase()===n.toLowerCase()))return prev;
      return{...prev,[day]:[...list,{name:n,tier:1,sets:""}]};
    });
  };

  const copyDayTo=(fromDay,toDay)=>{
    setDays(prev=>({...prev,[toDay]:[...(prev[fromDay]||[])]}));
  };

  const saveProgram=async()=>{
    if(!phase.trim()||!DAYS.some(d=>(days[d]||[]).length>0)){
      setSaveErr("Add a phase name and at least one lift.");return;
    }
    setSaving(true);setSaveErr("");
    const cleanDays={};
    DAYS.forEach(d=>{cleanDays[d]=(days[d]||[]).filter(l=>(l.name||"").trim()).map(l=>({...l,name:l.name.trim()}));});
    const program={phase,days:cleanDays,notes,updatedAt:new Date().toISOString()};
    try{
      // Insert the new program first, then retire the old ones, so athletes are
      // never left without an active program if a step fails.
      const{data:ins,error}=await supabase.from("announcements").insert({type:"program",message:JSON.stringify(program),active:true}).select("id").single();
      if(error){setSaveErr("Save failed: "+error.message);setSaving(false);return;}
      await supabase.from("announcements").update({active:false}).eq("type","program").neq("id",ins.id);
      setCurrentProgram(program);
      setSaved(true);setTimeout(()=>setSaved(false),3000);
    }catch(e){setSaveErr("Save failed: "+e.message);}
    setSaving(false);
  };

  if(loading)return<div style={{paddingTop:8}}><SkeletonList rows={4} avatar={false}/></div>;

  const activeDayLifts=days[activeDay]||[];

  return(
    <div className="tfx cd cd-pu">
      {/* Active program */}
      <section className="tfx-card cd-head">
        <div className="cd-head-txt">
          <div className="tfx-eyebrow">{currentProgram?"Active program":"Lift program"}</div>
          <h2>{currentProgram?(currentProgram.phase||"Untitled phase"):"No active program"}</h2>
          {!currentProgram&&<p>Build the days below, then push it to athletes.</p>}
        </div>
        {currentProgram&&(
          <div className="cd-pu-sum">
            {DAYS.map(d=>(
              <div key={d}>
                <span>{d}</span>
                <b className="tfx-num">{(currentProgram.days?.[d]||[]).length}</b>
                <small>lifts</small>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Season dates */}
      <section className="tfx-card cd-card">
        <div className="cd-row">
          <div className="tfx-eyebrow">Season dates</div>
          {season&&<span className={"cd-pill "+(season.explicit?"is-good":"is-muted")}><i/>{season.explicit?"Live":"Auto (not set)"}</span>}
        </div>
        <p className="cd-sub">Drives the athletes' countdown, week-by-week progress, and season recap. Until you save dates here, the countdown stays hidden.</p>
        <label className="cd-lbl">Season name
          <input className="cd-in" value={sLabel} onChange={e=>setSLabel(e.target.value)} placeholder="e.g. Winter 2026, Spring 2027"/>
        </label>
        <div className="cd-pu-dates">
          <label className="cd-lbl">Start
            <input className="cd-in" type="date" value={sStart} onChange={e=>setSStart(e.target.value)}/>
          </label>
          <label className="cd-lbl">End
            <input className="cd-in" type="date" value={sEnd} onChange={e=>setSEnd(e.target.value)}/>
          </label>
        </div>
        {sMsg&&<div className={"cd-msg "+(sMsg.startsWith("✓")?"is-good":"is-bad")} role="status">{sMsg}</div>}
        <button className="tfx-btn-ghost tfx-press cd-wide" onClick={saveSeasonDates} disabled={sSaving}>
          {sSaving?"Saving…":"Save season dates"}
        </button>
        {season&&season.explicit&&<p className="cd-foot">Current: {season.label} · {fmtSeasonDate(season.start)} – {fmtSeasonDate(season.end,true)}</p>}
      </section>

      {/* Phase name + one-tap preset */}
      <section className="tfx-card cd-card">
        <label className="cd-lbl">Phase name
          <input className="cd-in" value={phase} onChange={e=>setPhase(e.target.value)} placeholder="e.g. Strength Phase 1, Hypertrophy Block..."/>
        </label>
        <button className={"cd-preset tfx-press"+(presetLoaded?" is-done":"")} onClick={()=>{setPhase(BASEBALL_FALL_P1.phase);setDays(BASEBALL_FALL_P1.days);setNotes(BASEBALL_FALL_P1.notes);setPresetLoaded(true);setTimeout(()=>setPresetLoaded(false),4000);}}>
          {presetLoaded?"✓ Loaded — review days, then push below":"Load Baseball Fall Phase 1"}
        </button>
      </section>

      {/* Day editor */}
      <section className="tfx-card cd-card cd-pu-ed">
        <div className="cd-pu-days" role="tablist" aria-label="Training day">
          {DAYS.map(d=>{
            const isActive=activeDay===d;
            const liftCount=(days[d]||[]).length;
            return(
              <button key={d} role="tab" aria-selected={isActive} className={"cd-pu-day tfx-press"+(isActive?" is-on":"")} onClick={()=>setActiveDay(d)}>
                <span>{d}</span>
                <small className={liftCount>0?"has":""}>{liftCount>0?liftCount+" lifts":"Empty"}</small>
              </button>
            );
          })}
        </div>

        <div className="cd-pu-copy">
          <span>Copy from</span>
          {DAYS.filter(d=>d!==activeDay).map(d=>(
            <button key={d} className="tfx-chipbtn tfx-press" onClick={()=>copyDayTo(d,activeDay)} aria-label={"Copy "+DAY_LABELS[d]+" into "+DAY_LABELS[activeDay]}>{d}</button>
          ))}
        </div>

        <div className="cd-pu-edhead">
          <div>
            <h3>{DAY_LABELS[activeDay]} lifts</h3>
            <p className="cd-sub">Order = how athletes see them. Tier sets the 1A/2B/3C grouping.</p>
          </div>
          {activeDayLifts.length>0&&<button className="cd-mini is-bad tfx-press" onClick={()=>{if(typeof window==="undefined"||window.confirm("Clear every lift on "+DAY_LABELS[activeDay]+"?"))setDays(p=>({...p,[activeDay]:[]}));}}>Clear day</button>}
        </div>

        {activeDayLifts.length===0&&<p className="cd-empty">No lifts yet — add one below.</p>}

        {activeDayLifts.length>0&&(
          <ol className="cd-lifts">
            {activeDayLifts.map((lift,i)=>{
              const tc=TIER_COLORS[lift.tier]||TIER_COLORS[1];
              return(
                <li key={i} className="cd-lift" style={{"--c":tc.color}}>
                  <div className="cd-lift-top">
                    <span className="cd-lift-n" aria-hidden="true">{i+1}</span>
                    <input className="cd-lift-name" value={lift.name} onChange={e=>updateLift(activeDay,i,{name:e.target.value})} placeholder="Exercise name" aria-label={"Lift "+(i+1)+" name"}/>
                    <button className="cd-ibtn is-bad tfx-press" onClick={()=>removeLift(activeDay,i)} aria-label="Remove lift">✕</button>
                  </div>
                  <div className="cd-lift-ctl">
                    <input className="cd-in" value={lift.sets||""} onChange={e=>updateLift(activeDay,i,{sets:e.target.value})} placeholder="Sets × reps (e.g. 4 x 6ea)" aria-label="Sets × reps"/>
                    <div className="cd-tiers" role="group" aria-label="Tier">
                      {[1,2,3].map(t=>(
                        <button key={t} className={lift.tier===t?"is-on":""} style={{"--c":TIER_COLORS[t].color}} aria-pressed={lift.tier===t} onClick={()=>updateLift(activeDay,i,{tier:t})}>T{t}</button>
                      ))}
                    </div>
                    <select className="cd-in" value={lift.inputType||"weight"} onChange={e=>updateLift(activeDay,i,{inputType:e.target.value==="weight"?undefined:e.target.value})} aria-label="How athletes log it">
                      {INPUT_TYPES.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                    <div className="cd-move">
                      <button className="cd-ibtn tfx-press" onClick={()=>moveLift(activeDay,i,-1)} disabled={i===0} aria-label="Move up">↑</button>
                      <button className="cd-ibtn tfx-press" onClick={()=>moveLift(activeDay,i,1)} disabled={i===activeDayLifts.length-1} aria-label="Move down">↓</button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {/* Add a lift */}
        <div className="cd-pu-add">
          <input className="cd-in" value={newLift} onChange={e=>setNewLift(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){addLift(activeDay,newLift);setNewLift("");}}} placeholder="Add an exercise…" aria-label="Add an exercise"/>
          <button className="cd-addbtn tfx-press" onClick={()=>{addLift(activeDay,newLift);setNewLift("");}} disabled={!newLift.trim()}>+ Add</button>
        </div>
        <div className="cd-pu-quick" aria-label="Quick add">
          {ALL_LIFTS.filter(l=>!activeDayLifts.some(x=>x.name===l)).map(l=>(
            <button key={l} className="tfx-chipbtn tfx-press" onClick={()=>addLift(activeDay,l)}>+ {l}</button>
          ))}
        </div>
      </section>

      {/* Notes */}
      <section className="tfx-card cd-card">
        <label className="cd-lbl">Coaching notes
          <textarea className="cd-in" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Focus points, cues, expectations for this phase..."/>
        </label>
      </section>

      {saveErr&&<div className="ir-err" role="alert">{saveErr}</div>}

      <button className={"tfx-btn tfx-press cd-push"+(saved?" is-saved":"")} onClick={saveProgram} disabled={saving}>
        {saved?"✓ Program pushed to athletes!":saving?"Saving...":"Push program to athletes →"}
      </button>
    </div>
  );
}
