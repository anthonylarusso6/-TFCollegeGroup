import { useState, useEffect } from "react";
import { RED, GREEN, GOLD, ORANGE, PUR } from "../lib/constants";
import { supabase } from "../lib/supabase";
import { SkeletonList } from "./Skeleton";

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
      {name:"Band Assisted Alt. SS Drop Jump",tier:1,sets:"3 x 5e"},
      {name:"DB Arnold Press",tier:2,sets:"4 x 8 (3:0:0)"},
      {name:"Cable Face Pull",tier:2,sets:"3 x 12 (2:2:0)"},
      {name:"MB Slam to Rot Scoop Throw",tier:2,sets:"4 x 5e"},
      {name:"Foam Roller SL Hip Bridge",tier:3,sets:"3 x 10ea"},
      {name:"Foam Roller (X2) Plank Hold",tier:3,sets:"2 x 2:00s"},
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
      {name:"10/5 RSI",tier:1,sets:"2 x 1"},
      {name:"KB Side Lat Dips",tier:1,sets:"3 x 10e"},
      {name:"DB Alt. Incline NG Bench Press",tier:2,sets:"12, 10, 8, 6"},
      {name:"Seated Cable Row",tier:2,sets:"12, 8, 8, 4 (3:2:0)"},
      {name:"Hollow Body Holds",tier:2,sets:"3 x 30s"},
      {name:"BWD Sled Drag Heavy",tier:3,sets:"3 x 20yds"},
      {name:"KB Lateral Cont. Lunge",tier:3,sets:"3 x 6e"},
    ],
    Fri:[
      {name:"Front Squat",tier:1,sets:"9, 7, (5, 4 (0:2:0))"},
      {name:"Standing SL Vert",tier:1,sets:"4 x 3ea"},
      {name:"TRX T,Y,I",tier:1,sets:"4 x 3ea (QUALITY REPS)"},
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
      setLoading(false);
    })();
  },[]);

  const toggleLift=(day,liftName,tier)=>{
    setDays(prev=>{
      const dayLifts=[...(prev[day]||[])];
      const exists=dayLifts.findIndex(l=>l.name===liftName);
      if(exists>=0){
        dayLifts.splice(exists,1);
      }else{
        dayLifts.push({name:liftName,tier:tier||1});
      }
      return{...prev,[day]:dayLifts};
    });
  };

  const setLiftTier=(day,liftName,tier)=>{
    setDays(prev=>{
      const dayLifts=(prev[day]||[]).map(l=>l.name===liftName?{...l,tier}:l);
      return{...prev,[day]:dayLifts};
    });
  };

  const isSelected=(day,liftName)=>(days[day]||[]).some(l=>l.name===liftName);
  const getLiftTier=(day,liftName)=>(days[day]||[]).find(l=>l.name===liftName)?.tier||1;

  const copyDayTo=(fromDay,toDay)=>{
    setDays(prev=>({...prev,[toDay]:[...(prev[fromDay]||[])]}));
  };

  const saveProgram=async()=>{
    if(!phase.trim()||!DAYS.some(d=>(days[d]||[]).length>0)){
      setSaveErr("Add a phase name and at least one lift.");return;
    }
    setSaving(true);setSaveErr("");
    const program={phase,days,notes,updatedAt:new Date().toISOString()};
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

      {/* Lift selection */}
      <div style={{background:"rgba(255,255,255,0.045)",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"1px solid rgba(255,255,255,0.08)",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.05)"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#fff",marginBottom:4}}>{DAY_LABELS[activeDay]} lifts</div>
        <div style={{fontSize:11,color:"#aaa",marginBottom:12}}>Tap to add. Long-press to set tier.</div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {ALL_LIFTS.map((lift,i)=>{
            const selected=isSelected(activeDay,lift);
            const tier=getLiftTier(activeDay,lift);
            const tc=TIER_COLORS[tier];
            return(
              <div key={i} style={{borderRadius:8,border:"1px solid "+(selected?tc.color:"rgba(255,255,255,0.08)"),background:selected?tc.color+"11":"rgba(255,255,255,0.03)",overflow:"hidden"}}>
                <button onClick={()=>toggleLift(activeDay,lift,1)} style={{width:"100%",padding:"8px 10px",background:"transparent",border:"none",cursor:"pointer",fontFamily:"Georgia,serif",textAlign:"left",display:"flex",alignItems:"center",gap:6}}>
                  {selected&&<div style={{width:8,height:8,borderRadius:"50%",background:tc.color,flexShrink:0}}/>}
                  <span style={{fontSize:11,fontWeight:selected?700:400,color:selected?tc.color:"#888"}}>{lift}</span>
                </button>
                {selected&&(
                  <div style={{display:"flex",borderTop:"0.5px solid "+tc.color+"22"}}>
                    {[1,2,3].map(t=>(
                      <button key={t} onClick={()=>setLiftTier(activeDay,lift,t)} style={{flex:1,padding:"4px 2px",background:tier===t?TIER_COLORS[t].color:"transparent",border:"none",cursor:"pointer",fontSize:9,fontWeight:700,color:tier===t?"#fff":TIER_COLORS[t].color,fontFamily:"Georgia,serif"}}>
                        T{t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
