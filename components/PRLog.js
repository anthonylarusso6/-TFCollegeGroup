import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

const BG="#0f0f0f";
const PUR="#534AB7";
const RED="#C0392B";
const GREEN="#1E6B3A";
const GOLD="#D4AF37";
const STEEL="#708090";
const ORANGE="#E8720C";

export default function PRLog({athleteId}){
  const[prs,setPrs]=useState([]);
  const[lift,setLift]=useState("");
  const[weight,setPRWeight]=useState("");
  const[goal,setPRGoal]=useState({});
  const[showGoal,setShowGoal]=useState(null);
  const[goalInput,setGoalInput]=useState("");
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);
  const[selectedLift,setSelectedLift]=useState(null);
  const GREEN="#1E6B3A",GOLD="#D4AF37",RED="#C0392B",PUR="#534AB7",BG="#0f0f0f";
  const LIFT_CATEGORIES=[
    {label:"Upper Body",color:"#534AB7",lifts:["Bench Press","Military Press","Pull-ups"]},
    {label:"Lower Body",color:"#1E6B3A",lifts:["Back Squat","Front Squat","Deadlift"]},
    {label:"Full Body",color:"#C0392B",lifts:["Power Clean","Hang Clean","Push Press"]},
  ];
  const LIFTS=LIFT_CATEGORIES.flatMap(c=>c.lifts);
  const getLiftCategory=(liftName)=>LIFT_CATEGORIES.find(c=>c.lifts.includes(liftName));

  useEffect(()=>{
    supabase.from("pr_log").select("*").eq("athlete_id",athleteId).order("date",{ascending:true}).then(({data,error})=>{
      if(error){console.error("pr_log error:",error);return;}
      setPrs(data||[]);
    });
    // Load goals from localStorage
    const saved=localStorage.getItem("pr_goals_"+athleteId);
    if(saved)setPRGoal(JSON.parse(saved));
  },[]);

  const save=async()=>{
    if(!lift||!weight)return;
    setSaving(true);
    const today=new Date().toISOString().split("T")[0];
    const{data,error}=await supabase.from("pr_log").insert({athlete_id:athleteId,lift,weight:parseFloat(weight),date:today}).select();
    if(error){console.error("save error:",error);setSaving(false);return;}
    const{data:all}=await supabase.from("pr_log").select("*").eq("athlete_id",athleteId).order("date",{ascending:true});
    setPrs(all||[]);
    setLift("");setPRWeight("");setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),2000);
  };

  const saveGoal=(liftName,val)=>{
    const newGoals={...goal,[liftName]:parseFloat(val)};
    setPRGoal(newGoals);
    localStorage.setItem("pr_goals_"+athleteId,JSON.stringify(newGoals));
    setShowGoal(null);setGoalInput("");
  };

  // Group by lift
  const byLift={};
  prs.forEach(p=>{if(!byLift[p.lift])byLift[p.lift]=[];byLift[p.lift].push(p);});

  // Best per lift
  const bests={};
  Object.entries(byLift).forEach(([lft,entries])=>{
    bests[lft]=entries.reduce((best,e)=>e.weight>best.weight?e:best,entries[0]);
  });

  const activeLiftData=selectedLift?byLift[selectedLift]:null;

  return(
    <div>
      {/* Log input */}
      <div style={{background:BG,borderRadius:12,padding:"1.25rem",marginBottom:12,border:"1px solid #222",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,"+GOLD+","+RED+")"}}/>
        <div style={{fontSize:11,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>⚒ Iron Room</div>
        <select value={lift} onChange={e=>setLift(e.target.value)} style={{width:"100%",padding:"12px",borderRadius:8,border:"1px solid #333",background:"#1a1a1a",color:lift?"#fff":"#555",fontSize:13,fontFamily:"Georgia,serif",marginBottom:8,boxSizing:"border-box"}}>
          <option value="">Select lift...</option>
          {LIFT_CATEGORIES.map(cat=>(
            <optgroup key={cat.label} label={cat.label}>
              {cat.lifts.map(l=><option key={l} value={l}>{l}</option>)}
            </optgroup>
          ))}
        </select>
        <div style={{display:"flex",gap:8}}>
          <input type="text" inputMode="decimal" value={weight} onChange={e=>setPRWeight(e.target.value)} placeholder="Weight (lbs)" style={{flex:1,padding:"12px",borderRadius:8,border:"1px solid #333",background:"#1a1a1a",color:"#fff",fontSize:16,fontFamily:"Georgia,serif",textAlign:"center"}}/>
          <button onClick={save} disabled={!lift||!weight||saving} style={{padding:"12px 20px",borderRadius:8,border:"none",background:lift&&weight?"linear-gradient(135deg,"+GOLD+",#b8960e)":"#222",color:lift&&weight?"#1a1a1a":"#444",fontSize:14,fontWeight:700,cursor:lift&&weight?"pointer":"not-allowed",fontFamily:"Georgia,serif"}}>
            {saved?"✓":saving?"...":"Log"}
          </button>
        </div>
      </div>

      {/* PR cards by lift */}
      {LIFTS.filter(l=>byLift[l]).map((liftName,li)=>{
        const entries=byLift[liftName]||[];
        const best=bests[liftName];
        const liftGoal=goal[liftName]||null;
        const isSelected=selectedLift===liftName;
        const goalPct=liftGoal&&best?Math.min(100,Math.round((best.weight/liftGoal)*100)):0;

        // Sparkline
        const sparkW=100,sparkH=40;
        const weights=entries.map(e=>parseFloat(e.weight));
        const sMin=Math.min(...weights)-5;
        const sMax=Math.max(...weights)+5;
        const pts=weights.map((w,i)=>{
          const x=(i/(Math.max(weights.length-1,1)))*sparkW;
          const y=sparkH-((w-sMin)/(Math.max(sMax-sMin,1)))*sparkH;
          return`${x},${y}`;
        }).join(" ");

        return(
          <div key={li} style={{background:"#fff",borderRadius:12,marginBottom:10,border:"0.5px solid #e0e0e0",overflow:"hidden"}}>
            <div style={{height:3,background:(()=>{const cat=getLiftCategory(liftName);return cat?"linear-gradient(90deg,"+cat.color+","+cat.color+"99)":"linear-gradient(90deg,"+GOLD+","+RED+")";})()}}/>
            <div style={{padding:"1rem 1.25rem"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#1a1a1a",cursor:"pointer"}} onClick={()=>setSelectedLift(isSelected?null:liftName)}>{liftName}</div>
                    {(()=>{const cat=getLiftCategory(liftName);return cat?<span style={{fontSize:9,padding:"2px 7px",borderRadius:4,background:cat.color+"22",color:cat.color,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em"}}>{cat.label}</span>:null;})()}
                  </div>
                  <div style={{fontSize:11,color:"#888"}}>{entries.length} log{entries.length!==1?"s":""}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:22,fontWeight:800,color:GOLD}}>{best?.weight} <span style={{fontSize:12,fontWeight:400,color:"#aaa"}}>lbs</span></div>
                  <div style={{fontSize:10,color:"#aaa"}}>best · {best?.date}</div>
                </div>
              </div>

              {/* Sparkline */}
              {weights.length>1&&(
                <div style={{background:"#f9f9f9",borderRadius:8,padding:"8px 10px",marginBottom:10}}>
                  <svg viewBox={`0 0 ${sparkW} ${sparkH}`} style={{width:"100%",height:40,overflow:"visible"}}>
                    <defs>
                      <linearGradient id={"pg"+li} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={GOLD} stopOpacity="0.3"/>
                        <stop offset="100%" stopColor={GOLD} stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <polygon points={`0,${sparkH} ${pts} ${sparkW},${sparkH}`} fill={`url(#pg${li})`}/>
                    <polyline points={pts} fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    {weights.map((w,i)=>{
                      const x=(i/(Math.max(weights.length-1,1)))*sparkW;
                      const y=sparkH-((w-sMin)/(Math.max(sMax-sMin,1)))*sparkH;
                      return<circle key={i} cx={x} cy={y} r={i===weights.length-1?3.5:2} fill={i===weights.length-1?"#1a1a1a":GOLD}/>;
                    })}
                    {liftGoal&&sMax>=liftGoal&&(
                      <line x1="0" y1={sparkH-((liftGoal-sMin)/(Math.max(sMax-sMin,1)))*sparkH} x2={sparkW} y2={sparkH-((liftGoal-sMin)/(Math.max(sMax-sMin,1)))*sparkH} stroke={GREEN} strokeWidth="1.5" strokeDasharray="4,3"/>
                    )}
                  </svg>
                </div>
              )}

              {/* Goal progress — visual slider + ring */}
              <div style={{marginBottom:10}}>
                {liftGoal?(
                  <div style={{background:"#0f0f0f",borderRadius:12,padding:"14px",border:"1px solid #222"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                      <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.08em"}}>Goal progress</div>
                      <button onClick={()=>{setShowGoal(liftName);setGoalInput(String(liftGoal));}} style={{fontSize:10,color:"#444",background:"none",border:"none",cursor:"pointer",fontFamily:"Georgia,serif"}}>edit</button>
                    </div>
                    {/* Main stats row */}
                    <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:14}}>
                      {/* Circle */}
                      <div style={{position:"relative",width:72,height:72,flexShrink:0}}>
                        <svg viewBox="0 0 72 72" style={{width:72,height:72,transform:"rotate(-90deg)"}}>
                          <circle cx="36" cy="36" r="30" fill="none" stroke="#222" strokeWidth="7"/>
                          <circle cx="36" cy="36" r="30" fill="none"
                            stroke={goalPct>=100?GREEN:goalPct>=75?GOLD:PUR}
                            strokeWidth="7"
                            strokeDasharray={`${Math.min(goalPct,100)*1.885} 188.5`}
                            strokeLinecap="round"
                            style={{filter:`drop-shadow(0 0 6px ${goalPct>=100?GREEN:goalPct>=75?GOLD:PUR})`}}/>
                        </svg>
                        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                          <div style={{fontSize:16,fontWeight:900,color:goalPct>=100?GREEN:goalPct>=75?GOLD:PUR,lineHeight:1}}>{Math.min(goalPct,100)}</div>
                          <div style={{fontSize:9,color:"#555"}}>%</div>
                        </div>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:6}}>
                          <div>
                            <div style={{fontSize:24,fontWeight:800,color:"#fff",lineHeight:1}}>{best?.weight||0}</div>
                            <div style={{fontSize:9,color:"#555",marginTop:2}}>current</div>
                          </div>
                          <div style={{fontSize:13,color:"#333"}}>→</div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:24,fontWeight:800,color:goalPct>=100?GREEN:PUR,lineHeight:1}}>{liftGoal}</div>
                            <div style={{fontSize:9,color:"#555",marginTop:2}}>goal</div>
                          </div>
                        </div>
                        {/* Slider track */}
                        <div style={{position:"relative",height:8,background:"#222",borderRadius:4,overflow:"visible"}}>
                          <div style={{position:"absolute",left:0,top:0,height:"100%",width:Math.min(goalPct,100)+"%",background:goalPct>=100?"linear-gradient(90deg,"+GREEN+",#0d4a29)":goalPct>=75?"linear-gradient(90deg,"+GOLD+",#b8960e)":"linear-gradient(90deg,"+PUR+",#3d35a0)",borderRadius:4,transition:"width 0.5s",boxShadow:goalPct>=100?"0 0 8px "+GREEN:goalPct>=75?"0 0 8px "+GOLD:"0 0 8px "+PUR}}/>
                          {/* Thumb */}
                          <div style={{position:"absolute",top:"50%",left:Math.min(goalPct,100)+"%",transform:"translate(-50%,-50%)",width:16,height:16,borderRadius:"50%",background:goalPct>=100?GREEN:goalPct>=75?GOLD:PUR,border:"2px solid #0f0f0f",boxShadow:"0 0 8px "+(goalPct>=100?GREEN:goalPct>=75?GOLD:PUR),transition:"left 0.5s"}}/>
                        </div>
                      </div>
                    </div>
                    {goalPct>=100?(
                      <div style={{textAlign:"center",fontSize:13,fontWeight:700,color:GREEN}}>🎉 Goal crushed! Set a new one.</div>
                    ):(
                      <div style={{textAlign:"center",fontSize:12,color:"#444"}}>{(liftGoal-(best?.weight||0)).toFixed(1)} lbs away from your goal</div>
                    )}
                  </div>
                ):(
                  <button onClick={()=>{setShowGoal(liftName);setGoalInput("");}} style={{fontSize:12,color:PUR,background:"#EEEDFE",border:"0.5px solid "+PUR+"44",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:500,width:"100%",boxSizing:"border-box"}}>+ Set a goal for {liftName} →</button>
                )}
                {showGoal===liftName&&(
                  <div style={{display:"flex",gap:6,marginTop:8}}>
                    <input type="text" inputMode="decimal" value={goalInput} onChange={e=>setGoalInput(e.target.value)} placeholder="Goal (lbs)" style={{flex:1,padding:"8px 10px",borderRadius:8,border:"0.5px solid #e0e0e0",fontSize:13,fontFamily:"Georgia,serif",background:"#fafafa"}}/>
                    <button onClick={()=>saveGoal(liftName,goalInput)} style={{padding:"8px 14px",borderRadius:8,border:"none",background:PUR,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"Georgia,serif"}}>Save</button>
                    <button onClick={()=>setShowGoal(null)} style={{padding:"8px 10px",borderRadius:8,border:"0.5px solid #e0e0e0",background:"transparent",color:"#888",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>✕</button>
                  </div>
                )}
              </div>

              {/* History — tap to expand */}
              {isSelected&&(
                <div style={{borderTop:"0.5px solid #f0f0f0",paddingTop:8}}>
                  {[...entries].reverse().map((e,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:i<entries.length-1?"0.5px solid #f5f5f5":"none"}}>
                      <div style={{fontSize:12,color:"#888"}}>{e.date}</div>
                      <div style={{fontSize:13,fontWeight:600,color:e.weight===best?.weight?GOLD:"#1a1a1a"}}>{e.weight} lbs {e.weight===best?.weight?"⭐":""}</div>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={()=>setSelectedLift(isSelected?null:liftName)} style={{fontSize:11,color:"#aaa",background:"none",border:"none",cursor:"pointer",fontFamily:"Georgia,serif",padding:"4px 0 0"}}>
                {isSelected?"▲ Hide history":"▼ Show history"}
              </button>
            </div>
          </div>
        );
      })}

      {Object.keys(byLift).length===0&&(
        <div style={{background:"#fff",borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid #e0e0e0"}}>
          <div style={{fontSize:40,marginBottom:12}}>🏋️</div>
          <div style={{fontSize:14,fontWeight:500,color:"#1a1a1a",marginBottom:6}}>Start tracking your lifts</div>
          <div style={{fontSize:12,color:"#888"}}>Log your first set above and watch your strength grow week by week.</div>
        </div>
      )}
    </div>
  );
}
