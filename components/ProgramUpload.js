import { useState, useEffect } from "react";
import { RED, GREEN, GOLD, ORANGE, PUR } from "../lib/constants";
import { supabase } from "../lib/supabase";
import { SkeletonList } from "./Skeleton";
import { loadSeason, saveSeason, fmtSeasonDate } from "../lib/season";

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

const TIER_COLORS={
  1:{color:PUR,label:"T1"},
  2:{color:GREEN,label:"T2"},
  3:{color:ORANGE,label:"T3"},
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
      await supabase.from("announcements").update({active:false}).eq("type","program");
      const{error}=await supabase.from("announcements").insert({type:"program",message:JSON.stringify(program),active:true});
      if(error){setSaveErr("Save failed: "+error.message);setSaving(false);return;}
      setCurrentProgram(program);
      setSaved(true);setTimeout(()=>setSaved(false),3000);
    }catch(e){setSaveErr("Save failed: "+e.message);}
    setSaving(false);
  };

  if(loading)return<div style={{paddingTop:8}}><SkeletonList rows={4} avatar={false}/></div>;

  const activeDayLifts=days[activeDay]||[];

  return(
    <div>
      {/* Season dates */}
      <div style={{background:"rgba(255,255,255,0.045)",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"1px solid "+ORANGE+"33"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
          <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>🗓 Season dates</div>
          {season&&<div style={{fontSize:10,fontWeight:700,color:season.explicit?GREEN:"#888",textTransform:"uppercase",letterSpacing:"0.08em"}}>{season.explicit?"Live":"Auto (not set)"}</div>}
        </div>
        <div style={{fontSize:11,color:"#888",marginBottom:12,lineHeight:1.5}}>Drives the athletes' countdown, week-by-week progress, and season recap. Until you save dates here, the countdown stays hidden.</div>
        <input value={sLabel} onChange={e=>setSLabel(e.target.value)} placeholder="e.g. Winter 2026, Spring 2027" style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"0.5px solid rgba(255,255,255,0.1)",fontSize:13,fontFamily:"Georgia,serif",background:"rgba(255,255,255,0.05)",color:"#ddd",boxSizing:"border-box",marginBottom:8}}/>
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          <label style={{flex:1,fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:"0.06em"}}>Start
            <input type="date" value={sStart} onChange={e=>setSStart(e.target.value)} style={{display:"block",width:"100%",marginTop:4,padding:"9px 10px",borderRadius:8,border:"0.5px solid rgba(255,255,255,0.1)",fontSize:13,fontFamily:"Georgia,serif",background:"rgba(255,255,255,0.05)",color:"#ddd",boxSizing:"border-box"}}/>
          </label>
          <label style={{flex:1,fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:"0.06em"}}>End
            <input type="date" value={sEnd} onChange={e=>setSEnd(e.target.value)} style={{display:"block",width:"100%",marginTop:4,padding:"9px 10px",borderRadius:8,border:"0.5px solid rgba(255,255,255,0.1)",fontSize:13,fontFamily:"Georgia,serif",background:"rgba(255,255,255,0.05)",color:"#ddd",boxSizing:"border-box"}}/>
          </label>
        </div>
        {sMsg&&<div style={{fontSize:12,color:sMsg.startsWith("✓")?GREEN:RED,marginBottom:8}}>{sMsg}</div>}
        <button onClick={saveSeasonDates} disabled={sSaving} style={{width:"100%",padding:"11px",borderRadius:10,border:"none",background:sSaving?"rgba(255,255,255,0.1)":"linear-gradient(135deg,"+ORANGE+","+GOLD+")",color:"#fff",fontSize:13,fontWeight:700,cursor:sSaving?"not-allowed":"pointer",fontFamily:"Georgia,serif"}}>
          {sSaving?"Saving…":"Save season dates"}
        </button>
        {season&&season.explicit&&<div style={{fontSize:10.5,color:"#888",marginTop:8,textAlign:"center"}}>Current: {season.label} · {fmtSeasonDate(season.start)} – {fmtSeasonDate(season.end,true)}</div>}
      </div>

      {/* Current program */}
      {currentProgram&&(
        <div style={{background:"linear-gradient(135deg,#1a1400,#221b00)",borderRadius:12,padding:"12px 16px",marginBottom:12,border:"1px solid "+GOLD+"33",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,"+GOLD+",transparent)"}}/>
          <div style={{fontSize:10,color:GOLD,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>⚡ Active program</div>
          <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:8}}>{currentProgram.phase}</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {DAYS.map(d=>(
              <div key={d} style={{background:"#1a1500",borderRadius:8,padding:"4px 10px",border:"0.5px solid "+GOLD+"22"}}>
                <div style={{fontSize:9,color:GOLD,marginBottom:2}}>{d}</div>
                <div style={{fontSize:10,color:"#888"}}>{(currentProgram.days?.[d]||[]).length} lifts</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phase name */}
      <div style={{background:"rgba(255,255,255,0.045)",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"1px solid rgba(255,255,255,0.08)",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.05)"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#fff",marginBottom:8}}>📋 Phase name</div>
        <input value={phase} onChange={e=>setPhase(e.target.value)} placeholder="e.g. Strength Phase 1, Hypertrophy Block..." style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"0.5px solid rgba(255,255,255,0.1)",fontSize:13,fontFamily:"Georgia,serif",background:"rgba(255,255,255,0.05)",color:"#ddd",boxSizing:"border-box"}}/>
      </div>

      {/* One-tap preset loader */}
      <button onClick={()=>{setPhase(BASEBALL_FALL_P1.phase);setDays(BASEBALL_FALL_P1.days);setNotes(BASEBALL_FALL_P1.notes);setPresetLoaded(true);setTimeout(()=>setPresetLoaded(false),4000);}} style={{width:"100%",padding:"12px",borderRadius:10,border:"1px solid "+GOLD+"55",background:presetLoaded?GOLD+"22":GOLD+"11",color:GOLD,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif",marginBottom:12}}>
        {presetLoaded?"✓ Loaded — review days, then push below":"⚡ Load Baseball Fall Phase 1"}
      </button>

      {/* Day selector */}
      <div style={{display:"flex",gap:6,marginBottom:10}}>
        {DAYS.map(d=>{
          const isActive=activeDay===d;
          const liftCount=(days[d]||[]).length;
          return(
            <button key={d} onClick={()=>setActiveDay(d)} style={{flex:1,padding:"10px 4px",borderRadius:10,border:"1px solid "+(isActive?ORANGE:"rgba(255,255,255,0.1)"),background:isActive?ORANGE:"rgba(255,255,255,0.04)",color:isActive?"#fff":"#888",fontSize:11,fontWeight:isActive?700:400,cursor:"pointer",fontFamily:"Georgia,serif",position:"relative"}}>
              <div>{d}</div>
              {liftCount>0&&<div style={{fontSize:9,marginTop:2,color:isActive?"rgba(255,255,255,0.8)":GREEN}}>{liftCount} lifts</div>}
            </button>
          );
        })}
      </div>

      {/* Copy from another day */}
      <div style={{display:"flex",gap:6,marginBottom:10,alignItems:"center"}}>
        <div style={{fontSize:11,color:"#aaa",flexShrink:0}}>Copy from:</div>
        {DAYS.filter(d=>d!==activeDay).map(d=>(
          <button key={d} onClick={()=>copyDayTo(d,activeDay)} style={{fontSize:11,padding:"4px 10px",borderRadius:6,border:"0.5px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"#888",cursor:"pointer",fontFamily:"Georgia,serif"}}>{d}</button>
        ))}
      </div>

      {/* Lift editor */}
      <div style={{background:"rgba(255,255,255,0.045)",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"1px solid rgba(255,255,255,0.08)",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.05)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
          <div style={{fontSize:13,fontWeight:600,color:"#fff"}}>{DAY_LABELS[activeDay]} lifts</div>
          {activeDayLifts.length>0&&<button onClick={()=>{if(typeof window==="undefined"||window.confirm("Clear every lift on "+DAY_LABELS[activeDay]+"?"))setDays(p=>({...p,[activeDay]:[]}));}} style={{fontSize:10,padding:"4px 9px",borderRadius:6,border:"0.5px solid "+RED+"55",background:"transparent",color:RED,cursor:"pointer",fontFamily:"Georgia,serif"}}>Clear day</button>}
        </div>
        <div style={{fontSize:11,color:"#aaa",marginBottom:12}}>Order = how athletes see them. Tier sets the 1A/2B/3C grouping.</div>

        {activeDayLifts.length===0&&<div style={{fontSize:12,color:"#888",fontStyle:"italic",padding:"8px 0 12px"}}>No lifts yet — add one below.</div>}

        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {activeDayLifts.map((lift,i)=>{
            const tc=TIER_COLORS[lift.tier]||TIER_COLORS[1];
            return(
              <div key={i} style={{borderRadius:10,border:"1px solid "+tc.color+"44",borderLeft:"3px solid "+tc.color,background:"rgba(255,255,255,0.03)",padding:"10px"}}>
                <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:7}}>
                  <input value={lift.name} onChange={e=>updateLift(activeDay,i,{name:e.target.value})} placeholder="Exercise name" style={{flex:1,minWidth:0,padding:"8px 10px",borderRadius:7,border:"0.5px solid rgba(255,255,255,0.12)",fontSize:13,fontWeight:700,fontFamily:"Georgia,serif",background:"rgba(255,255,255,0.05)",color:"#ddd",boxSizing:"border-box"}}/>
                  <button onClick={()=>moveLift(activeDay,i,-1)} disabled={i===0} aria-label="Move up" style={{width:28,height:32,borderRadius:7,border:"0.5px solid rgba(255,255,255,0.12)",background:"transparent",color:i===0?"#555":"#bbb",cursor:i===0?"default":"pointer",flexShrink:0}}>↑</button>
                  <button onClick={()=>moveLift(activeDay,i,1)} disabled={i===activeDayLifts.length-1} aria-label="Move down" style={{width:28,height:32,borderRadius:7,border:"0.5px solid rgba(255,255,255,0.12)",background:"transparent",color:i===activeDayLifts.length-1?"#555":"#bbb",cursor:i===activeDayLifts.length-1?"default":"pointer",flexShrink:0}}>↓</button>
                  <button onClick={()=>removeLift(activeDay,i)} aria-label="Remove lift" style={{width:28,height:32,borderRadius:7,border:"0.5px solid "+RED+"55",background:"transparent",color:RED,cursor:"pointer",flexShrink:0}}>✕</button>
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                  <input value={lift.sets||""} onChange={e=>updateLift(activeDay,i,{sets:e.target.value})} placeholder="Sets × reps (e.g. 4 x 6ea)" style={{flex:"1 1 140px",minWidth:0,padding:"7px 9px",borderRadius:7,border:"0.5px solid rgba(255,255,255,0.12)",fontSize:12,fontFamily:"Georgia,serif",background:"rgba(255,255,255,0.05)",color:"#ddd",boxSizing:"border-box"}}/>
                  <div style={{display:"flex",borderRadius:7,overflow:"hidden",border:"0.5px solid rgba(255,255,255,0.12)",flexShrink:0}}>
                    {[1,2,3].map(t=>(
                      <button key={t} onClick={()=>updateLift(activeDay,i,{tier:t})} style={{padding:"6px 9px",background:lift.tier===t?TIER_COLORS[t].color:"transparent",border:"none",cursor:"pointer",fontSize:10,fontWeight:700,color:lift.tier===t?"#fff":TIER_COLORS[t].color,fontFamily:"Georgia,serif"}}>T{t}</button>
                    ))}
                  </div>
                  <select value={lift.inputType||"weight"} onChange={e=>updateLift(activeDay,i,{inputType:e.target.value==="weight"?undefined:e.target.value})} style={{flex:"1 1 130px",padding:"7px 8px",borderRadius:7,border:"0.5px solid rgba(255,255,255,0.12)",fontSize:12,fontFamily:"Georgia,serif",background:"rgba(255,255,255,0.05)",color:"#ddd"}}>
                    {INPUT_TYPES.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add a lift */}
        <div style={{display:"flex",gap:6,marginTop:12}}>
          <input value={newLift} onChange={e=>setNewLift(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){addLift(activeDay,newLift);setNewLift("");}}} placeholder="Add an exercise…" style={{flex:1,minWidth:0,padding:"10px 12px",borderRadius:8,border:"0.5px solid rgba(255,255,255,0.12)",fontSize:13,fontFamily:"Georgia,serif",background:"rgba(255,255,255,0.05)",color:"#ddd",boxSizing:"border-box"}}/>
          <button onClick={()=>{addLift(activeDay,newLift);setNewLift("");}} disabled={!newLift.trim()} style={{padding:"10px 16px",borderRadius:8,border:"none",background:newLift.trim()?ORANGE:"rgba(255,255,255,0.08)",color:newLift.trim()?"#fff":"#777",fontSize:13,fontWeight:700,cursor:newLift.trim()?"pointer":"not-allowed",fontFamily:"Georgia,serif",flexShrink:0}}>+ Add</button>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:10}}>
          {ALL_LIFTS.filter(l=>!activeDayLifts.some(x=>x.name===l)).map(l=>(
            <button key={l} onClick={()=>addLift(activeDay,l)} style={{fontSize:10.5,padding:"5px 9px",borderRadius:14,border:"0.5px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.03)",color:"#999",cursor:"pointer",fontFamily:"Georgia,serif"}}>+ {l}</button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div style={{background:"rgba(255,255,255,0.045)",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"1px solid rgba(255,255,255,0.08)",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.05)"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#fff",marginBottom:8}}>📝 Coaching notes</div>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Focus points, cues, expectations for this phase..." style={{width:"100%",minHeight:60,padding:"10px",borderRadius:8,border:"0.5px solid rgba(255,255,255,0.1)",fontSize:12,fontFamily:"Georgia,serif",background:"rgba(255,255,255,0.05)",color:"#ddd",resize:"vertical",boxSizing:"border-box"}}/>
      </div>

      {saveErr&&<div style={{fontSize:12,color:RED,marginBottom:8,padding:"8px 12px",background:"rgba(192,57,43,0.15)",border:"0.5px solid rgba(192,57,43,0.3)",borderRadius:8}}>{saveErr}</div>}

      <button onClick={saveProgram} disabled={saving} style={{width:"100%",padding:"14px",borderRadius:10,border:"none",background:saving?"rgba(255,255,255,0.1)":"linear-gradient(135deg,"+ORANGE+","+RED+")",color:saving?"#aaa":"#fff",fontSize:14,fontWeight:700,cursor:saving?"not-allowed":"pointer",fontFamily:"Georgia,serif"}}>
        {saved?"✓ Program pushed to athletes!":saving?"Saving...":"Push program to athletes →"}
      </button>
    </div>
  );
}
