import { useState, useEffect } from "react";
import { BG, RED, GREEN, GOLD, STEEL, ORANGE, PUR } from "../lib/constants";
import { supabase } from "../lib/supabase";

const DAYS=["Mon","Tue","Thu","Fri"];
const DAY_LABELS={Mon:"Monday",Tue:"Tuesday",Thu:"Thursday",Fri:"Friday"};
const TIER_COLORS={
  1:{bg:"#EEEDFE",border:PUR,color:PUR,label:"Tier 1 — Primary"},
  2:{bg:"#E1F5EE",border:GREEN,color:GREEN,label:"Tier 2 — Secondary"},
  3:{bg:"#FFF4E0",border:ORANGE,color:ORANGE,label:"Tier 3 — Accessory"},
};

const DEFAULT_PROGRAM={
  Mon:[
    {name:"Power Clean",tier:1},{name:"Back Squat",tier:1},
    {name:"Bench Press",tier:2},{name:"Romanian Deadlift",tier:3},
  ],
  Tue:[
    {name:"Deadlift",tier:1},{name:"Military Press",tier:1},
    {name:"Pull-ups",tier:2},{name:"Bent Over Row",tier:3},
  ],
  Thu:[
    {name:"Front Squat",tier:1},{name:"Push Press",tier:1},
    {name:"Incline Bench",tier:2},{name:"Hang Clean",tier:3},
  ],
  Fri:[
    {name:"Power Clean",tier:1},{name:"Back Squat",tier:1},
    {name:"Bench Press",tier:2},{name:"Pull-ups",tier:3},
  ],
};

export default function PRLog({athleteId}){
  const today=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date().getDay()];
  const defaultDay=DAYS.includes(today)?today:"Mon";
  const[activeDay,setActiveDay]=useState(defaultDay);
  const[program,setProgram]=useState(null);
  const[phase,setPhase]=useState("");
  const[logs,setLogs]=useState({});// {liftName: [{weight,reps,date,id}]}
  const[inputs,setInputs]=useState({});// {liftName: {weight:"",reps:""}}
  const[saving,setSaving]=useState(null);
  const[saved,setSaved]=useState(null);
  const[loadError,setLoadError]=useState("");
  const[expanded,setExpanded]=useState(null);

  // Load coach program
  useEffect(()=>{
    supabase.from("announcements").select("*").eq("type","program").eq("active",true)
      .order("created_at",{ascending:false}).limit(1)
      .then(({data})=>{
        if(data&&data[0]){
          const p=JSON.parse(data[0].message||"{}");
          if(p.days){setProgram(p.days);setPhase(p.phase||"");}
          else if(p.lifts){
            // Legacy format — spread across days
            const spread={Mon:p.lifts.map((l,i)=>({name:l,tier:i<2?1:i<4?2:3})),Tue:p.lifts.map((l,i)=>({name:l,tier:i<2?1:i<4?2:3})),Thu:p.lifts.map((l,i)=>({name:l,tier:i<2?1:i<4?2:3})),Fri:p.lifts.map((l,i)=>({name:l,tier:i<2?1:i<4?2:3}))};
            setProgram(spread);setPhase(p.phase||"");
          }else{setProgram(DEFAULT_PROGRAM);}
        }else{setProgram(DEFAULT_PROGRAM);}
      }).catch(()=>setProgram(DEFAULT_PROGRAM));
  },[]);

  // Load existing logs for this athlete
  useEffect(()=>{
    if(!athleteId)return;
    supabase.from("pr_log").select("*").eq("athlete_id",athleteId)
      .order("date",{ascending:false})
      .then(({data,error})=>{
        if(error){setLoadError(error.message);return;}
        // Group by lift name
        const grouped={};
        (data||[]).forEach(r=>{
          if(!grouped[r.lift])grouped[r.lift]=[];
          grouped[r.lift].push(r);
        });
        setLogs(grouped);
      }).catch(e=>setLoadError(e.message));
  },[athleteId]);

  const todayLifts=(program&&program[activeDay])||[];

  const setInput=(liftName,field,val)=>{
    setInputs(prev=>({...prev,[liftName]:{...prev[liftName],[field]:val}}));
  };

  const saveLog=async(liftName,tier)=>{
    const inp=inputs[liftName]||{};
    if(!inp.weight)return;
    setSaving(liftName);
    const today=new Date().toISOString().split("T")[0];
    const entry={
      athlete_id:athleteId,
      lift:liftName,
      weight:parseFloat(inp.weight),
      reps:parseInt(inp.reps)||1,
      date:today,
      day:activeDay,
      tier:tier||1,
    };
    const{data,error}=await supabase.from("pr_log").insert(entry).select().single();
    if(error){setLoadError(error.message);setSaving(null);return;}
    setLogs(prev=>{
      const existing=prev[liftName]||[];
      return{...prev,[liftName]:[data,...existing]};
    });
    setInputs(prev=>({...prev,[liftName]:{weight:"",reps:""}}));
    setSaving(null);setSaved(liftName);setTimeout(()=>setSaved(null),2000);
  };

  // Personal record for a lift
  const getPR=(liftName)=>{
    const liftLogs=logs[liftName]||[];
    if(!liftLogs.length)return null;
    return Math.max(...liftLogs.map(l=>parseFloat(l.weight)||0));
  };

  // Last logged weight
  const getLast=(liftName)=>{
    const liftLogs=logs[liftName]||[];
    return liftLogs[0]?.weight||null;
  };

  if(!program)return(
    <div style={{textAlign:"center",padding:"2rem",color:"#888",fontSize:13}}>Loading program...</div>
  );

  return(
    <div>
      {/* Phase banner */}
      {phase&&(
        <div style={{background:"linear-gradient(135deg,#1a1400,#221b00)",borderRadius:12,padding:"10px 14px",marginBottom:10,border:"1px solid "+GOLD+"33",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>⚡</span>
          <div>
            <div style={{fontSize:10,color:GOLD,textTransform:"uppercase",letterSpacing:"0.08em"}}>Current phase</div>
            <div style={{fontSize:13,fontWeight:600,color:"#fff"}}>{phase}</div>
          </div>
        </div>
      )}

      {loadError&&(
        <div style={{background:"#FCEBEB",borderRadius:8,padding:"8px 12px",marginBottom:8,fontSize:12,color:RED}}>
          Error: {loadError}
        </div>
      )}

      {/* Day selector */}
      <div style={{display:"flex",gap:6,marginBottom:12}}>
        {DAYS.map(d=>{
          const isActive=activeDay===d;
          const isToday=d===defaultDay;
          return(
            <button key={d} onClick={()=>setActiveDay(d)} style={{flex:1,padding:"10px 4px",borderRadius:10,border:"1px solid "+(isActive?ORANGE:"#e0e0e0"),background:isActive?ORANGE:"#fff",color:isActive?"#fff":"#888",fontSize:12,fontWeight:isActive?700:400,cursor:"pointer",fontFamily:"Georgia,serif",position:"relative"}}>
              {isToday&&!isActive&&<div style={{position:"absolute",top:3,right:3,width:6,height:6,borderRadius:"50%",background:GREEN}}/>}
              {d}
            </button>
          );
        })}
      </div>

      {/* Day header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{fontSize:14,fontWeight:700,color:"#1a1a1a"}}>{DAY_LABELS[activeDay]}'s Lifts</div>
        <div style={{fontSize:11,color:"#aaa"}}>{todayLifts.length} lifts</div>
      </div>

      {/* Lift cards */}
      {todayLifts.map((lift,i)=>{
        const tc=TIER_COLORS[lift.tier]||TIER_COLORS[1];
        const pr=getPR(lift.name);
        const last=getLast(lift.name);
        const inp=inputs[lift.name]||{weight:"",reps:""};
        const isSaving=saving===lift.name;
        const isSaved=saved===lift.name;
        const liftHistory=logs[lift.name]||[];
        const isExpanded=expanded===lift.name;

        return(
          <div key={i} style={{background:"#fff",borderRadius:12,marginBottom:8,border:"1px solid "+tc.border+"33",overflow:"hidden",borderTop:"3px solid "+tc.border}}>
            {/* Lift header */}
            <div style={{padding:"12px 14px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:"#1a1a1a"}}>{lift.name}</div>
                  <div style={{fontSize:10,fontWeight:600,color:tc.color,marginTop:2}}>{tc.label}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  {pr&&<div style={{fontSize:12,fontWeight:700,color:GOLD}}>PR: {pr} lbs</div>}
                  {last&&<div style={{fontSize:11,color:"#aaa"}}>Last: {last} lbs</div>}
                </div>
              </div>

              {/* Input row */}
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:"#aaa",marginBottom:3}}>Weight (lbs)</div>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={inp.weight}
                    onChange={e=>setInput(lift.name,"weight",e.target.value)}
                    placeholder={last?`Last: ${last}`:"0"}
                    style={{width:"100%",padding:"10px",borderRadius:8,border:"1px solid #e0e0e0",fontSize:15,fontFamily:"Georgia,serif",textAlign:"center",background:"#fafafa",boxSizing:"border-box",fontWeight:600}}
                  />
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:"#aaa",marginBottom:3}}>Reps</div>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={inp.reps}
                    onChange={e=>setInput(lift.name,"reps",e.target.value)}
                    placeholder="0"
                    style={{width:"100%",padding:"10px",borderRadius:8,border:"1px solid #e0e0e0",fontSize:15,fontFamily:"Georgia,serif",textAlign:"center",background:"#fafafa",boxSizing:"border-box",fontWeight:600}}
                  />
                </div>
                <div style={{paddingTop:18}}>
                  <button onClick={()=>saveLog(lift.name,lift.tier)} disabled={!inp.weight||isSaving} style={{padding:"10px 14px",borderRadius:8,border:"none",background:inp.weight?(isSaved?GREEN:tc.border):"#e0e0e0",color:inp.weight?"#fff":"#aaa",fontSize:13,fontWeight:700,cursor:inp.weight?"pointer":"not-allowed",fontFamily:"Georgia,serif",minWidth:52}}>
                    {isSaved?"✓":isSaving?"...":"Log"}
                  </button>
                </div>
              </div>
            </div>

            {/* History toggle */}
            {liftHistory.length>0&&(
              <div>
                <button onClick={()=>setExpanded(isExpanded?null:lift.name)} style={{width:"100%",padding:"8px 14px",background:"#fafafa",border:"none",borderTop:"0.5px solid #f0f0f0",fontSize:11,color:"#888",cursor:"pointer",fontFamily:"Georgia,serif",textAlign:"left",display:"flex",justifyContent:"space-between"}}>
                  <span>History ({liftHistory.length} sessions)</span>
                  <span>{isExpanded?"▲":"▼"}</span>
                </button>
                {isExpanded&&(
                  <div style={{padding:"8px 14px",background:"#fafafa",borderTop:"0.5px solid #f0f0f0"}}>
                    {liftHistory.slice(0,5).map((h,hi)=>(
                      <div key={hi} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:hi<Math.min(liftHistory.length,5)-1?"0.5px solid #f0f0f0":"none"}}>
                        <div style={{fontSize:11,color:"#888"}}>{new Date(h.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>
                        <div style={{fontSize:12,fontWeight:600,color:"#1a1a1a"}}>{h.weight} lbs × {h.reps||1} reps</div>
                        {h.weight===pr&&<div style={{fontSize:10,color:GOLD,fontWeight:700}}>PR 🏆</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {todayLifts.length===0&&(
        <div style={{background:"#fff",borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid #e0e0e0"}}>
          <div style={{fontSize:32,marginBottom:8}}>🏋️</div>
          <div style={{fontSize:13,color:"#888"}}>No lifts programmed for {DAY_LABELS[activeDay]} yet.</div>
          <div style={{fontSize:12,color:"#aaa",marginTop:4}}>Coach Ant will update the program soon.</div>
        </div>
      )}
    </div>
  );
}
