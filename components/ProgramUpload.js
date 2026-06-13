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
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:8}}>📋 Phase name</div>
        <input value={phase} onChange={e=>setPhase(e.target.value)} placeholder="e.g. Strength Phase 1, Hypertrophy Block..." style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"0.5px solid #e0e0e0",fontSize:13,fontFamily:"Georgia,serif",background:"#fafafa",color:"#1a1a1a",boxSizing:"border-box"}}/>
      </div>

      {/* Day selector */}
      <div style={{display:"flex",gap:6,marginBottom:10}}>
        {DAYS.map(d=>{
          const isActive=activeDay===d;
          const liftCount=(days[d]||[]).length;
          return(
            <button key={d} onClick={()=>setActiveDay(d)} style={{flex:1,padding:"10px 4px",borderRadius:10,border:"1px solid "+(isActive?ORANGE:"#e0e0e0"),background:isActive?ORANGE:"#fff",color:isActive?"#fff":"#888",fontSize:11,fontWeight:isActive?700:400,cursor:"pointer",fontFamily:"Georgia,serif",position:"relative"}}>
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
          <button key={d} onClick={()=>copyDayTo(d,activeDay)} style={{fontSize:11,padding:"4px 10px",borderRadius:6,border:"0.5px solid #e0e0e0",background:"#f5f5f5",color:"#888",cursor:"pointer",fontFamily:"Georgia,serif"}}>{d}</button>
        ))}
      </div>

      {/* Lift selection */}
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:4}}>{DAY_LABELS[activeDay]} lifts</div>
        <div style={{fontSize:11,color:"#aaa",marginBottom:12}}>Tap to add. Long-press to set tier.</div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {ALL_LIFTS.map((lift,i)=>{
            const selected=isSelected(activeDay,lift);
            const tier=getLiftTier(activeDay,lift);
            const tc=TIER_COLORS[tier];
            return(
              <div key={i} style={{borderRadius:8,border:"1px solid "+(selected?tc.color:"#e0e0e0"),background:selected?tc.color+"11":"#fafafa",overflow:"hidden"}}>
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
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:8}}>📝 Coaching notes</div>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Focus points, cues, expectations for this phase..." style={{width:"100%",minHeight:60,padding:"10px",borderRadius:8,border:"0.5px solid #e0e0e0",fontSize:12,fontFamily:"Georgia,serif",background:"#fafafa",color:"#1a1a1a",resize:"vertical",boxSizing:"border-box"}}/>
      </div>

      {saveErr&&<div style={{fontSize:12,color:RED,marginBottom:8,padding:"8px 12px",background:"#FFF0F0",borderRadius:8}}>{saveErr}</div>}

      <button onClick={saveProgram} disabled={saving} style={{width:"100%",padding:"14px",borderRadius:10,border:"none",background:saving?"#e0e0e0":"linear-gradient(135deg,"+ORANGE+","+RED+")",color:saving?"#aaa":"#fff",fontSize:14,fontWeight:700,cursor:saving?"not-allowed":"pointer",fontFamily:"Georgia,serif"}}>
        {saved?"✓ Program pushed to athletes!":saving?"Saving...":"Push program to athletes →"}
      </button>
    </div>
  );
}
