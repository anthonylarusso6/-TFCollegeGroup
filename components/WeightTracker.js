import { useState, useEffect, useRef } from "react";
import { BG, PUR, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { supabase } from "../lib/supabase";

export default function WeightTracker({athleteId}){
  const[entries,setEntries]=useState([]);
  const[weight,setWeight]=useState("");
  const[goalWeight,setGoalWeight]=useState("");
  const[goalMode,setGoalMode]=useState("lose"); // "lose" or "gain"
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);
  const[error,setError]=useState("");
  const[showGoalInput,setShowGoalInput]=useState(false);

  const loadEntries=async()=>{
    try{
      const{data,error:err}=await supabase.from("weight_log").select("*").eq("athlete_id",athleteId).order("date",{ascending:true});
      if(err){setError("Could not load entries: "+err.message);return;}
      setEntries(data||[]);
    }catch(e){setError("Could not load entries.");}
  };

  const loadGoal=async()=>{
    try{
      const{data}=await supabase.from("announcements").select("message,week_label").eq("type","weight_goal").eq("day",String(athleteId)).order("created_at",{ascending:false}).limit(1).maybeSingle();
      if(data){
        if(data.message)setGoalWeight(data.message);
        if(data.week_label)setGoalMode(data.week_label);
      }else{
        const savedGoal=localStorage.getItem("goal_weight_"+athleteId);
        const savedMode=localStorage.getItem("goal_mode_"+athleteId);
        if(savedGoal)setGoalWeight(savedGoal);
        if(savedMode)setGoalMode(savedMode);
      }
    }catch(e){
      const savedGoal=localStorage.getItem("goal_weight_"+athleteId);
      const savedMode=localStorage.getItem("goal_mode_"+athleteId);
      if(savedGoal)setGoalWeight(savedGoal);
      if(savedMode)setGoalMode(savedMode);
    }
  };

  useEffect(()=>{loadEntries();loadGoal();},[]);

  const save=async()=>{
    if(!weight)return;
    setSaving(true);setError("");
    try{
      const estNow=new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
      const today=estNow.getFullYear()+"-"+String(estNow.getMonth()+1).padStart(2,"0")+"-"+String(estNow.getDate()).padStart(2,"0");
      const existing=entries.find(e=>e.date===today);
      if(existing){
        const{error:err}=await supabase.from("weight_log").update({weight:parseFloat(weight)}).eq("id",existing.id);
        if(err){setError("Save failed: "+err.message);return;}
      }else{
        const{error:err}=await supabase.from("weight_log").insert({athlete_id:athleteId,date:today,weight:parseFloat(weight)});
        if(err){setError("Save failed: "+err.message);return;}
      }
      await loadEntries();
      setWeight("");setSaved(true);setTimeout(()=>setSaved(false),3000);
    }catch(e){
      setError("Save failed. Please try again.");
    }finally{
      setSaving(false);
    }
  };

  const saveGoal=async(val,mode)=>{
    setGoalWeight(val);setGoalMode(mode);setShowGoalInput(false);
    try{localStorage.setItem("goal_weight_"+athleteId,val);localStorage.setItem("goal_mode_"+athleteId,mode);}catch(e){}
    try{
      await supabase.from("announcements").insert({type:"weight_goal",day:String(athleteId),message:String(val),week_label:mode,active:true});
    }catch(e){}
  };

  const first=entries[0]?.weight!=null?parseFloat(entries[0].weight):null;
  const latest=entries[entries.length-1]?.weight!=null?parseFloat(entries[entries.length-1].weight):null;
  const diff=first!=null&&latest!=null?parseFloat((latest-first).toFixed(1)):null;
  const goal=parseFloat(goalWeight)||null;

  // Smart progress calculation based on mode
  const getProgress=()=>{
    if(!goal||first==null||latest==null)return{pct:0,onTrack:false,lbsLeft:null,msg:""};
    if(goalMode==="lose"){
      // Going down: start higher, goal lower
      const totalToLose=first-goal;
      const lostSoFar=first-latest;
      const pct=totalToLose>0?Math.min(100,Math.round((lostSoFar/totalToLose)*100)):0;
      const lbsLeft=parseFloat((latest-goal).toFixed(1));
      const onTrack=diff<=0; // losing = on track
      const goalReached=latest<=goal;
      return{pct,onTrack,lbsLeft,goalReached,msg:goalReached?"🎉 Goal reached! You did it!":onTrack?"↓ On track — keep going!":"⚠ Weight went up — refocus!"};
    }else{
      // Going up: start lower, goal higher
      const totalToGain=goal-first;
      const gainedSoFar=latest-first;
      const pct=totalToGain>0?Math.min(100,Math.round((gainedSoFar/totalToGain)*100)):0;
      const lbsLeft=parseFloat((goal-latest).toFixed(1));
      const onTrack=diff>=0; // gaining = on track
      const goalReached=latest>=goal;
      return{pct,onTrack,lbsLeft,goalReached,msg:goalReached?"🎉 Goal reached! You bulked up!":onTrack?"↑ On track — keep eating!":"⚠ Weight dropped — refocus!"};
    }
  };

  const progress=getProgress();
  const progressColor=progress.goalReached?GREEN:progress.onTrack?ORANGE:RED;

  // Sparkline chart
  const chartData=entries.slice(-10);
  const chartH=80,chartW=100;
  const weights=chartData.map(e=>parseFloat(e.weight));
  const chartMin=weights.length?Math.min(...weights)-2:0;
  const chartMax=weights.length?Math.max(...weights)+2:100;
  const pts=weights.map((w,i)=>{
    const x=(i/(Math.max(weights.length-1,1)))*chartW;
    const y=chartH-((w-chartMin)/(Math.max(chartMax-chartMin,1)))*chartH;
    return`${x},${y}`;
  }).join(" ");

  // Weekly log
  const byWeek=[];
  entries.forEach(e=>{
    const d=new Date(e.date);
    const ws=new Date(d);ws.setDate(d.getDate()-d.getDay());
    const key=ws.getFullYear()+"-"+String(ws.getMonth()+1).padStart(2,"0")+"-"+String(ws.getDate()).padStart(2,"0");
    const ex=byWeek.find(w=>w.key===key);
    if(ex){ex.entries.push(e);ex.avg=parseFloat((ex.entries.reduce((s,x)=>s+x.weight,0)/ex.entries.length).toFixed(1));}
    else byWeek.push({key,label:"Week of "+ws.toLocaleDateString("en-US",{month:"short",day:"numeric"}),entries:[e],avg:e.weight});
  });

  return(
    <div>
      {/* Hero log card */}
      <div style={{background:BG,borderRadius:16,padding:"1.5rem",marginBottom:12,border:"1px solid #222",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GREEN+","+ORANGE+")"}}/>
        <div style={{fontSize:11,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>⚖️ Weight Tracker</div>

        {entries.length>0&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
            {[{label:"Start",val:first,color:"#555"},{label:"Now",val:latest,color:"#fff"},{label:"Change",val:diff===null?"—":(diff>0?"+":"")+diff,color:diff===null?"#555":diff<0?GREEN:diff>0?RED:"#fff"}].map(s=>(
              <div key={s.label} style={{textAlign:"center"}}>
                <div style={{fontSize:26,fontWeight:700,color:s.color,lineHeight:1}}>{s.val}</div>
                <div style={{fontSize:10,color:"#555",marginTop:3}}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        {weights.length>1&&(
          <div style={{marginBottom:16}}>
            <svg viewBox={`-4 -4 ${chartW+8} ${chartH+8}`} style={{width:"100%",height:90,overflow:"visible"}}>
              <defs>
                <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ORANGE} stopOpacity="0.3"/>
                  <stop offset="100%" stopColor={ORANGE} stopOpacity="0"/>
                </linearGradient>
              </defs>
              <polygon points={`0,${chartH} ${pts} ${chartW},${chartH}`} fill="url(#wg)"/>
              <polyline points={pts} fill="none" stroke={ORANGE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              {weights.map((w,i)=>{
                const x=(i/(Math.max(weights.length-1,1)))*chartW;
                const y=chartH-((w-chartMin)/(Math.max(chartMax-chartMin,1)))*chartH;
                const isLast=i===weights.length-1;
                return(
                  <g key={i}>
                    <circle cx={x} cy={y} r={isLast?4:2} fill={isLast?"#fff":ORANGE} stroke={isLast?ORANGE:"none"} strokeWidth="2"/>
                    {isLast&&<text x={x} y={y-8} textAnchor="middle" fontSize="9" fill="#fff" fontFamily="Georgia">{w}</text>}
                  </g>
                );
              })}
              {/* Goal line */}
              {goal&&goal>=chartMin&&goal<=chartMax&&(
                <>
                  <line x1="0" y1={chartH-((goal-chartMin)/(Math.max(chartMax-chartMin,1)))*chartH} x2={chartW} y2={chartH-((goal-chartMin)/(Math.max(chartMax-chartMin,1)))*chartH} stroke={GOLD} strokeWidth="1.5" strokeDasharray="5,4"/>
                  <text x={chartW+2} y={chartH-((goal-chartMin)/(Math.max(chartMax-chartMin,1)))*chartH+3} fontSize="8" fill={GOLD} fontFamily="Georgia">goal</text>
                </>
              )}
            </svg>
          </div>
        )}

        {/* Input */}
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:8}}>
          <input type="text" inputMode="decimal" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="Enter lbs..." style={{flex:1,padding:"14px",borderRadius:10,border:"1px solid #333",fontSize:18,fontFamily:"Georgia,serif",background:"#1a1a1a",color:"#fff",textAlign:"center"}}/>
          <button onClick={save} disabled={!weight||saving} style={{padding:"14px 20px",borderRadius:10,border:"none",background:weight?"linear-gradient(135deg,"+ORANGE+","+RED+")":"#222",color:weight?"#fff":"#444",fontSize:14,fontWeight:600,cursor:weight?"pointer":"not-allowed",fontFamily:"Georgia,serif",minWidth:80}}>
            {saved?"✓":saving?"...":"Save"}
          </button>
        </div>
        {error&&<div style={{fontSize:13,color:"#fff",background:RED,borderRadius:8,padding:"10px 14px",marginBottom:8,fontWeight:500}}>{error}</div>}
        <div style={{fontSize:10,color:"#444",textAlign:"center"}}>Private — only you can see this</div>
      </div>

      {/* Goal card */}
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:goal?12:0}}>
          <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a"}}>🎯 Goal weight</div>
          <button onClick={()=>setShowGoalInput(!showGoalInput)} style={{fontSize:12,color:ORANGE,background:"none",border:"none",cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:500}}>{goal?"Edit":"Set goal →"}</button>
        </div>

        {/* Goal mode toggle */}
        {(showGoalInput||goal)&&(
          <div style={{display:"flex",gap:6,marginBottom:12}}>
            {[{id:"lose",label:"🔻 Lose weight"},{id:"gain",label:"📈 Gain weight"}].map(m=>(
              <button key={m.id} onClick={()=>setGoalMode(m.id)} style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid "+(goalMode===m.id?ORANGE:"#e0e0e0"),background:goalMode===m.id?ORANGE+"15":"#fafafa",color:goalMode===m.id?ORANGE:"#888",fontSize:12,fontWeight:goalMode===m.id?700:400,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                {m.label}
              </button>
            ))}
          </div>
        )}

        {showGoalInput&&(
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            <input type="text" inputMode="decimal" value={goalWeight} onChange={e=>setGoalWeight(e.target.value)} placeholder={goalMode==="lose"?"Target low (lbs)":"Target high (lbs)"} style={{flex:1,padding:"10px",borderRadius:8,border:"0.5px solid #e0e0e0",fontSize:14,fontFamily:"Georgia,serif",background:"#fafafa",textAlign:"center"}}/>
            <button onClick={()=>saveGoal(goalWeight,goalMode)} style={{padding:"10px 16px",borderRadius:8,border:"none",background:ORANGE,color:"#fff",fontSize:13,cursor:"pointer",fontFamily:"Georgia,serif"}}>Save</button>
          </div>
        )}

        {goal&&!showGoalInput&&(
          <div>
            {/* Progress message */}
            {progress.msg&&(
              <div style={{fontSize:12,fontWeight:600,color:progressColor,marginBottom:10,padding:"8px 12px",background:progressColor+"11",borderRadius:8,border:"1px solid "+progressColor+"33"}}>
                {progress.msg}
              </div>
            )}
            {/* Circular progress + stats */}
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
              <div style={{position:"relative",width:72,height:72,flexShrink:0}}>
                <svg viewBox="0 0 72 72" style={{width:72,height:72,transform:"rotate(-90deg)"}}>
                  <circle cx="36" cy="36" r="30" fill="none" stroke="#f0f0f0" strokeWidth="7"/>
                  <circle cx="36" cy="36" r="30" fill="none" stroke={progressColor} strokeWidth="7"
                    strokeDasharray={`${Math.min(progress.pct,100)*1.885} 188.5`} strokeLinecap="round"
                    style={{filter:`drop-shadow(0 0 4px ${progressColor}88)`}}/>
                </svg>
                <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                  <div style={{fontSize:14,fontWeight:900,color:progressColor,lineHeight:1}}>{Math.min(progress.pct,100)}</div>
                  <div style={{fontSize:9,color:"#aaa"}}>%</div>
                </div>
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:8}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:20,fontWeight:800,color:"#1a1a1a"}}>{latest||0}</div>
                    <div style={{fontSize:9,color:"#aaa"}}>current</div>
                  </div>
                  <div style={{color:"#ccc"}}>→</div>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:20,fontWeight:800,color:progressColor}}>{goal}</div>
                    <div style={{fontSize:9,color:"#aaa"}}>{goalMode==="lose"?"goal (low)":"goal (high)"}</div>
                  </div>
                </div>
                {/* Glowing slider */}
                <div style={{height:8,background:"#f0f0f0",borderRadius:4,overflow:"visible",position:"relative"}}>
                  <div style={{position:"absolute",left:0,top:0,height:"100%",width:Math.min(progress.pct,100)+"%",background:`linear-gradient(90deg,${progressColor},${progressColor}99)`,borderRadius:4,boxShadow:`0 0 8px ${progressColor}66`}}/>
                  <div style={{position:"absolute",top:"50%",left:Math.min(progress.pct,100)+"%",transform:"translate(-50%,-50%)",width:16,height:16,borderRadius:"50%",background:progressColor,border:"2px solid #fff",boxShadow:`0 0 8px ${progressColor}`}}/>
                </div>
                {!progress.goalReached&&progress.lbsLeft!=null&&(
                  <div style={{fontSize:11,color:"#aaa",marginTop:6,textAlign:"center"}}>{Math.abs(progress.lbsLeft)} lbs to go</div>
                )}
              </div>
            </div>
          </div>
        )}
        {!goal&&!showGoalInput&&<div style={{fontSize:12,color:"#aaa",marginTop:4}}>Set a target and track your progress.</div>}
      </div>

      {/* Weekly log */}
      {byWeek.length>0&&(
        <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0"}}>
          <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Weekly log</div>
          {[...byWeek].reverse().map((week,wi)=>{
            const prevWeek=[...byWeek].reverse()[wi+1];
            const weekDiff=prevWeek?parseFloat((week.avg-prevWeek.avg).toFixed(1)):null;
            const isGoodDir=goalMode==="lose"?(weekDiff!==null&&weekDiff<0):(weekDiff!==null&&weekDiff>0);
            return(
              <div key={wi} style={{marginBottom:12,paddingBottom:12,borderBottom:wi<byWeek.length-1?"0.5px solid #f0f0f0":"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#1a1a1a"}}>{week.label}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>{week.avg} lbs</span>
                    {weekDiff!==null&&(
                      <span style={{fontSize:11,fontWeight:600,padding:"1px 7px",borderRadius:6,background:isGoodDir?"#EAF3DE":weekDiff===0?"#f5f5f5":"#FCEBEB",color:isGoodDir?GREEN:weekDiff===0?"#888":RED}}>
                        {weekDiff>0?"↑ +":weekDiff<0?"↓ ":"→ "}{Math.abs(weekDiff)}
                      </span>
                    )}
                  </div>
                </div>
                {week.entries.map((e,ei)=>(
                  <div key={ei} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",background:"#f9f9f9",borderRadius:8,marginBottom:4}}>
                    <div style={{fontSize:12,color:"#888"}}>{new Date(e.date).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</div>
                    <div style={{fontSize:14,fontWeight:600,color:"#1a1a1a"}}>{e.weight} lbs</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {entries.length===0&&!saving&&(
        <div style={{background:BG,borderRadius:12,padding:"2.5rem",textAlign:"center",border:"1px solid #222"}}>
          <div style={{fontSize:40,marginBottom:12}}>⚖️</div>
          <div style={{fontSize:14,fontWeight:500,color:"#fff",marginBottom:6}}>Start tracking your weight</div>
          <div style={{fontSize:12,color:"#555"}}>Log your first entry above and watch your progress build week by week.</div>
        </div>
      )}
    </div>
  );
}
