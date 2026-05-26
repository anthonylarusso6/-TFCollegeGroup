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
    {name:"Chain Bench Press",tier:1,sets:"3 x 5",reps:"12, 8"},
    {name:"DB Front to Lat Raise",tier:1,sets:"4 x 8e"},
    {name:"KB Bent Over Rows",tier:1,sets:"4 x 12"},
    {name:"DB Reserve Lunge to Step Up",tier:2,sets:"7,7,6,5"},
    {name:"ISOphit Hamstring Holds",tier:2,sets:"3 x 20s ea"},
    {name:"Partner Leg Throws",tier:2,sets:"3 x 12"},
    {name:"Mini Band Walks",tier:3,sets:"3 x 20yds ea"},
    {name:"Banded KB Swings",tier:3,sets:"3 x 10"},
    {name:"DB Prone W Press",tier:3,sets:"3 x 10"},
  ],
  Tue:[
    {name:"BB Back Squat",tier:1,sets:"8,6,6,5,4"},
    {name:"PVC Max Vert",tier:1,sets:"4 x 4"},
    {name:"Standing SA DB Shoulder Press",tier:2,sets:"4 x 7e"},
    {name:"Cable Underhand Row",tier:2,sets:"4 x 10"},
    {name:"KB Lateral Lunge",tier:2,sets:"3 x 7e"},
    {name:"AB Rollout",tier:3,sets:"3 x 10"},
    {name:"KB Seated Twist",tier:3,sets:"3 x 15e"},
    {name:"DB Hinge",tier:3,sets:"3 x 9"},
  ],
  Thu:[
    {name:"Pull Ups",tier:1,sets:"8,7,6,5,4"},
    {name:"DB Lat High Step Ups",tier:1,sets:"3 x 6e"},
    {name:"MB OH Sit Up Throw",tier:1,sets:"3 x 12"},
    {name:"Trap Bar Deadlift",tier:2,sets:"9,8,7,6"},
    {name:"DB Squat Jump",tier:2,sets:"4 x 6"},
    {name:"Cable SS Rot Punch",tier:2,sets:"3 x 14e"},
    {name:"LM Grappler Twist",tier:3,sets:"30s on 15s off"},
    {name:"PUP KB Drag Through",tier:3,sets:"30s on 15s off"},
    {name:"Dead Hangs",tier:3,sets:"30s on 15s off"},
    {name:"Box Jumps",tier:3,sets:"30s on 15s off"},
  ],
  Fri:[
    {name:"SSB Split Squat",tier:1,sets:"5 x 6e"},
    {name:"DB Split Squat Jump",tier:1,sets:"3 x 7e"},
    {name:"MB Slam to Shotput",tier:1,sets:"3 x 8e"},
    {name:"LM SA Split Jerk",tier:2,sets:"4 x 7e"},
    {name:"Lateral Sled Drag",tier:2,sets:"3 x 20yds ea"},
    {name:"DB Floor Press",tier:2,sets:"4 x 12"},
    {name:"Plate Curl to Press",tier:3,sets:"16,14,12"},
    {name:"SA Cable Pushdown",tier:3,sets:"16,14,12"},
    {name:"DB Spider Curl w/Twist",tier:3,sets:"16,14,12"},
    {name:"Weighted Box Dips",tier:3,sets:"16,14,12"},
  ],
};

const epley=(w,r)=>r===1?w:Math.round(w*(1+r/30));

// T&F weighted: hinge/lower matter most for explosiveness
const CATS=[
  {id:"lower", label:"Lower Body", emoji:"🦵", ref:225, w:0.30},
  {id:"push",  label:"Push",       emoji:"💪", ref:175, w:0.20},
  {id:"pull",  label:"Pull",       emoji:"🤜", ref:155, w:0.15},
  {id:"hinge", label:"Hinge",      emoji:"⛓️", ref:255, w:0.35},
];

const getCat=(name)=>{
  const n=name.toLowerCase();
  if(n.includes("deadlift")||n.includes(" clean")||n.includes("snatch")||n.includes("swing")||n.includes("rdl")||n.includes("hinge"))return "hinge";
  if(n.includes("squat")||n.includes("lunge")||n.includes("step up"))return "lower";
  if(n.includes("bench")||n.includes("press")||n.includes("push")||n.includes("dip")||n.includes("jerk"))return "push";
  if(n.includes("pull")||n.includes("row")||n.includes("curl"))return "pull";
  return null;
};

const rankSuffix=(n)=>n===1?"st":n===2?"nd":n===3?"rd":"th";
const rankMedal=(n)=>n===1?"🥇":n===2?"🥈":n===3?"🥉":null;

const piColor=(score)=>{
  if(score>=700)return GOLD;
  if(score>=500)return GREEN;
  if(score>=300)return ORANGE;
  return STEEL;
};

export default function PRLog({athleteId}){
  const today=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date().getDay()];
  const defaultDay=DAYS.includes(today)?today:"Mon";
  const[view,setView]=useState("log");
  const[activeDay,setActiveDay]=useState(defaultDay);
  const[program,setProgram]=useState(null);
  const[phase,setPhase]=useState("");
  const[logs,setLogs]=useState({});
  const[inputs,setInputs]=useState({});
  const[saving,setSaving]=useState(null);
  const[saved,setSaved]=useState(null);
  const[loadError,setLoadError]=useState("");
  const[expanded,setExpanded]=useState(null);
  const[deleting,setDeleting]=useState(null);
  const[confirmDelete,setConfirmDelete]=useState(null);
  const[selLift,setSelLift]=useState(null);
  const[teamPrLogs,setTeamPrLogs]=useState([]);
  const[latestBW,setLatestBW]=useState(null);
  const[teamLoaded,setTeamLoaded]=useState(false);

  useEffect(()=>{
    (async()=>{
      try{
        const{data}=await supabase.from("announcements").select("*").eq("type","program").eq("active",true)
          .order("created_at",{ascending:false}).limit(1);
        if(data&&data[0]){
          const p=JSON.parse(data[0].message||"{}");
          if(p.days){setProgram(p.days);setPhase(p.phase||"");}
          else if(p.lifts){
            const spread={Mon:p.lifts.map((l,i)=>({name:l,tier:i<2?1:i<4?2:3})),Tue:p.lifts.map((l,i)=>({name:l,tier:i<2?1:i<4?2:3})),Thu:p.lifts.map((l,i)=>({name:l,tier:i<2?1:i<4?2:3})),Fri:p.lifts.map((l,i)=>({name:l,tier:i<2?1:i<4?2:3}))};
            setProgram(spread);setPhase(p.phase||"");
          }else{setProgram(DEFAULT_PROGRAM);setPhase("College Group Summer");}
        }else{setProgram(DEFAULT_PROGRAM);setPhase("College Group Summer");}
      }catch(e){setProgram(DEFAULT_PROGRAM);}
    })();
  },[]);

  useEffect(()=>{
    if(!athleteId)return;
    (async()=>{
      try{
        const{data,error}=await supabase.from("pr_log").select("*").eq("athlete_id",athleteId)
          .order("date",{ascending:false});
        if(error){setLoadError(error.message);return;}
        const grouped={};
        (data||[]).forEach(r=>{
          if(!grouped[r.lift])grouped[r.lift]=[];
          grouped[r.lift].push(r);
        });
        setLogs(grouped);
      }catch(e){setLoadError(e.message);}
    })();
  },[athleteId]);

  // Load team data + bodyweight lazily when dashboard opens
  useEffect(()=>{
    if(view!=="dashboard"||teamLoaded||!athleteId)return;
    (async()=>{
      try{
        const{data}=await supabase.from("pr_log").select("athlete_id,lift,weight,reps");
        setTeamPrLogs(data||[]);
      }catch(e){}
      try{
        const{data}=await supabase.from("weight_log").select("weight").eq("athlete_id",athleteId)
          .order("date",{ascending:false}).limit(1).maybeSingle();
        if(data?.weight)setLatestBW(parseFloat(data.weight));
      }catch(e){}
      setTeamLoaded(true);
    })();
  },[view,athleteId]);

  const todayLifts=(program&&program[activeDay])||[];

  const setInput=(liftName,field,val)=>{
    setInputs(prev=>({...prev,[liftName]:{...prev[liftName],[field]:val}}));
  };

  const saveLog=async(liftName,tier)=>{
    const inp=inputs[liftName]||{};
    if(!inp.weight)return;
    setSaving(liftName);
    const estNow=new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
    const today=estNow.getFullYear()+"-"+String(estNow.getMonth()+1).padStart(2,"0")+"-"+String(estNow.getDate()).padStart(2,"0");
    const entry={
      athlete_id:athleteId,lift:liftName,weight:parseFloat(inp.weight),
      reps:parseInt(inp.reps)||1,date:today,day:activeDay,tier:tier||1,
    };
    try{
      const{data,error}=await supabase.from("pr_log").insert(entry).select().single();
      if(error){setLoadError(error.message);setSaving(null);return;}
      setLogs(prev=>{const existing=prev[liftName]||[];return{...prev,[liftName]:[data,...existing]};});
      setInputs(prev=>({...prev,[liftName]:{weight:"",reps:""}}));
      setSaving(null);setSaved(liftName);setTimeout(()=>setSaved(null),2000);
      // Nudge athlete to log weight if they haven't today
      try{
        const estNow=new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
        const todayStr=estNow.getFullYear()+"-"+String(estNow.getMonth()+1).padStart(2,"0")+"-"+String(estNow.getDate()).padStart(2,"0");
        const{data:wLog}=await supabase.from("weight_log").select("id").eq("athlete_id",athleteId).eq("date",todayStr).maybeSingle();
        if(!wLog){
          fetch("/api/send-notification",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({athleteId,title:"💪 Great session!",body:"Don't forget to log your weight today ⚖️",url:"/athlete"})}).catch(()=>{});
        }
      }catch(e){}
    }catch(e){setLoadError(e.message);setSaving(null);}
  };

  const deleteLog=async(logId,liftName)=>{
    setDeleting(logId);
    try{await supabase.from("pr_log").delete().eq("id",logId);}catch(e){}
    setLogs(prev=>({...prev,[liftName]:(prev[liftName]||[]).filter(l=>l.id!==logId)}));
    setDeleting(null);setConfirmDelete(null);
  };

  const getPR=(liftName)=>{
    const ll=logs[liftName]||[];
    if(!ll.length)return null;
    return Math.max(...ll.map(l=>parseFloat(l.weight)||0));
  };
  const getLast=(liftName)=>(logs[liftName]||[])[0]?.weight||null;

  // ── Dashboard computed ─────────────────────────────────────
  const allLiftNames=Object.keys(logs).filter(k=>logs[k].length>0);

  const liftPRs={};
  allLiftNames.forEach(name=>{
    const best=(logs[name]||[]).reduce((b,e)=>{
      const orm=epley(parseFloat(e.weight)||0,parseInt(e.reps)||1);
      return orm>b.orm?{...e,orm}:b;
    },{orm:0});
    liftPRs[name]=best;
  });

  const catPRs={};
  CATS.forEach(cat=>{
    const catLifts=allLiftNames.filter(l=>getCat(l)===cat.id);
    if(!catLifts.length)return;
    const best=Math.max(...catLifts.map(l=>liftPRs[l]?.orm||0));
    if(best>0)catPRs[cat.id]=best;
  });
  const activeCats=CATS.filter(c=>catPRs[c.id]);

  // Power Index (0–1000): weighted composite across categories
  const powerIndex=(()=>{
    let score=0,totalW=0;
    CATS.forEach(c=>{
      if(catPRs[c.id]!=null){
        score+=Math.min(1,catPRs[c.id]/c.ref)*c.w;
        totalW+=c.w;
      }
    });
    if(!totalW)return 0;
    return Math.round((score/totalW)*1000);
  })();
  const piCol=piColor(powerIndex);

  // Team ranks per category
  const catRanks={};
  if(teamLoaded&&teamPrLogs.length>0){
    const teamByAth={};
    teamPrLogs.forEach(r=>{
      const orm=epley(parseFloat(r.weight)||0,parseInt(r.reps)||1);
      if(!teamByAth[r.athlete_id])teamByAth[r.athlete_id]={};
      if(!teamByAth[r.athlete_id][r.lift]||orm>teamByAth[r.athlete_id][r.lift])
        teamByAth[r.athlete_id][r.lift]=orm;
    });
    CATS.forEach(cat=>{
      if(!catPRs[cat.id])return;
      const scores=[];
      Object.entries(teamByAth).forEach(([,lifts])=>{
        const best=Math.max(0,...Object.entries(lifts).filter(([n])=>getCat(n)===cat.id).map(([,o])=>o));
        if(best>0)scores.push(best);
      });
      scores.sort((a,b)=>b-a);
      const rank=scores.findIndex(s=>s===catPRs[cat.id])+1;
      catRanks[cat.id]={rank:rank||scores.length,total:scores.length};
    });
  }

  // Relative strength (est. 1RM / bodyweight)
  const relStrength={};
  if(latestBW&&latestBW>0){
    allLiftNames.forEach(name=>{
      if(liftPRs[name]?.orm)
        relStrength[name]=parseFloat((liftPRs[name].orm/latestBW).toFixed(2));
    });
  }

  // Trend sparkline
  const selEntries=selLift?(logs[selLift]||[]).slice().sort((a,b)=>new Date(a.date)-new Date(b.date)):[];
  const selOrms=selEntries.map(e=>epley(parseFloat(e.weight)||0,parseInt(e.reps)||1));
  const cW=100,cH=55;
  const oMin=selOrms.length?Math.min(...selOrms)-5:0;
  const oMax=selOrms.length?Math.max(...selOrms)+5:100;
  const tPts=selOrms.map((o,i)=>{
    const x=(i/(Math.max(selOrms.length-1,1)))*cW;
    const y=cH-((o-oMin)/(Math.max(oMax-oMin,1)))*cH;
    return`${x},${y}`;
  }).join(" ");

  // Radar
  const N=activeCats.length;
  const RCX=100,RCY=100,RR=70;
  const rAngle=(i)=>(2*Math.PI*i/Math.max(N,1))-Math.PI/2;
  const rPt=(i,r)=>[RCX+r*Math.cos(rAngle(i)),RCY+r*Math.sin(rAngle(i))];
  const rScores=activeCats.map(c=>Math.min(1,catPRs[c.id]/c.ref));
  const rFillPts=activeCats.map((_,i)=>{const[x,y]=rPt(i,rScores[i]*RR);return`${x},${y}`;}).join(" ");

  if(!program)return(
    <div style={{textAlign:"center",padding:"2rem",color:"#888",fontSize:13}}>Loading program...</div>
  );

  return(
    <div>
      {/* View toggle */}
      <div style={{display:"flex",gap:6,marginBottom:12}}>
        {[{id:"log",label:"🏋️ Log"},{id:"dashboard",label:"📊 Dashboard"}].map(v=>(
          <button key={v.id} onClick={()=>setView(v.id)}
            style={{flex:1,padding:"11px",borderRadius:10,
              border:"1px solid "+(view===v.id?GOLD:"#e0e0e0"),
              background:view===v.id?"linear-gradient(135deg,"+GOLD+"22,"+GOLD+"11)":"#f9f9f9",
              color:view===v.id?GOLD:"#888",fontSize:13,fontWeight:view===v.id?700:400,
              cursor:"pointer",fontFamily:"Georgia,serif"}}>
            {v.label}
          </button>
        ))}
      </div>

      {/* ── LOG VIEW ────────────────────────────────────────── */}
      {view==="log"&&(
        <div>
          {phase&&(
            <div style={{background:"linear-gradient(135deg,#1a1400,#221b00)",borderRadius:12,padding:"10px 14px",marginBottom:10,border:"1px solid "+GOLD+"33",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:18}}>⚡</span>
              <div>
                <div style={{fontSize:10,color:GOLD,textTransform:"uppercase",letterSpacing:"0.08em"}}>Current phase</div>
                <div style={{fontSize:13,fontWeight:600,color:"#fff"}}>{phase}</div>
              </div>
            </div>
          )}
          {loadError&&<div style={{background:"#FCEBEB",borderRadius:8,padding:"8px 12px",marginBottom:8,fontSize:12,color:RED}}>Error: {loadError}</div>}
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
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontSize:14,fontWeight:700,color:"#1a1a1a"}}>{DAY_LABELS[activeDay]}'s Lifts</div>
            <div style={{fontSize:11,color:"#aaa"}}>{todayLifts.length} lifts</div>
          </div>
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
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:10,color:"#aaa",marginBottom:3}}>Weight (lbs)</div>
                      <input type="number" inputMode="decimal" value={inp.weight}
                        onChange={e=>setInput(lift.name,"weight",e.target.value)}
                        placeholder={last?`Last: ${last}`:"0"}
                        style={{width:"100%",padding:"10px",borderRadius:8,border:"1px solid #e0e0e0",fontSize:15,fontFamily:"Georgia,serif",textAlign:"center",background:"#fafafa",boxSizing:"border-box",fontWeight:600}}/>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:10,color:"#aaa",marginBottom:3}}>Reps</div>
                      <input type="number" inputMode="numeric" value={inp.reps}
                        onChange={e=>setInput(lift.name,"reps",e.target.value)}
                        placeholder="0"
                        style={{width:"100%",padding:"10px",borderRadius:8,border:"1px solid #e0e0e0",fontSize:15,fontFamily:"Georgia,serif",textAlign:"center",background:"#fafafa",boxSizing:"border-box",fontWeight:600}}/>
                    </div>
                    <div style={{paddingTop:18}}>
                      <button onClick={()=>saveLog(lift.name,lift.tier)} disabled={!inp.weight||isSaving}
                        style={{padding:"10px 14px",borderRadius:8,border:"none",background:inp.weight?(isSaved?GREEN:tc.border):"#e0e0e0",color:inp.weight?"#fff":"#aaa",fontSize:13,fontWeight:700,cursor:inp.weight?"pointer":"not-allowed",fontFamily:"Georgia,serif",minWidth:52}}>
                        {isSaved?"✓":isSaving?"...":"Log"}
                      </button>
                    </div>
                  </div>
                  {inp.weight&&inp.reps&&(
                    <div style={{textAlign:"center",fontSize:11,color:"#aaa",marginTop:6}}>
                      est. 1RM: <span style={{color:GOLD,fontWeight:700}}>{epley(parseFloat(inp.weight)||0,parseInt(inp.reps)||1)} lbs</span>
                      {pr&&epley(parseFloat(inp.weight)||0,parseInt(inp.reps)||1)>pr&&
                        <span style={{marginLeft:8,background:GOLD,color:"#000",padding:"1px 6px",borderRadius:4,fontSize:10,fontWeight:700}}>NEW PR!</span>
                      }
                    </div>
                  )}
                </div>
                {liftHistory.length>0&&(
                  <div>
                    <button onClick={()=>setExpanded(isExpanded?null:lift.name)} style={{width:"100%",padding:"8px 14px",background:"#fafafa",border:"none",borderTop:"0.5px solid #f0f0f0",fontSize:11,color:"#888",cursor:"pointer",fontFamily:"Georgia,serif",textAlign:"left",display:"flex",justifyContent:"space-between"}}>
                      <span>History ({liftHistory.length} sessions)</span><span>{isExpanded?"▲":"▼"}</span>
                    </button>
                    {isExpanded&&(
                      <div style={{padding:"8px 14px",background:"#fafafa",borderTop:"0.5px solid #f0f0f0"}}>
                        {liftHistory.slice(0,5).map((h,hi)=>(
                          <div key={hi} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:hi<Math.min(liftHistory.length,5)-1?"0.5px solid #f0f0f0":"none"}}>
                            <div style={{fontSize:11,color:"#888"}}>{new Date(h.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>
                            <div style={{fontSize:12,fontWeight:600,color:"#1a1a1a"}}>{h.weight} lbs × {h.reps||1} reps</div>
                            {h.weight===pr&&<div style={{fontSize:10,color:GOLD,fontWeight:700}}>PR 🏆</div>}
                            {confirmDelete===h.id?(
                              <div style={{display:"flex",gap:4,marginLeft:4}}>
                                <button onClick={()=>deleteLog(h.id,lift.name)} style={{fontSize:11,padding:"4px 8px",borderRadius:6,border:"none",background:RED,color:"#fff",cursor:"pointer",fontFamily:"Georgia,serif"}}>Delete</button>
                                <button onClick={()=>setConfirmDelete(null)} style={{fontSize:11,padding:"4px 8px",borderRadius:6,border:"0.5px solid #ddd",background:"#fff",color:"#888",cursor:"pointer",fontFamily:"Georgia,serif"}}>Cancel</button>
                              </div>
                            ):(
                              <button onClick={()=>setConfirmDelete(h.id)} disabled={deleting===h.id} style={{fontSize:12,padding:"4px 10px",borderRadius:6,border:"0.5px solid #ffcccc",background:"#fff5f5",color:RED,cursor:"pointer",fontFamily:"Georgia,serif",marginLeft:4,minWidth:36}}>
                                {deleting===h.id?"...":"🗑"}
                              </button>
                            )}
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
      )}

      {/* ── DASHBOARD VIEW ──────────────────────────────────── */}
      {view==="dashboard"&&(
        <div>
          {allLiftNames.length===0?(
            <div style={{background:BG,borderRadius:12,padding:"2.5rem",textAlign:"center",border:"1px solid #222"}}>
              <div style={{fontSize:40,marginBottom:12}}>📊</div>
              <div style={{fontSize:14,fontWeight:500,color:"#fff",marginBottom:6}}>No lift data yet</div>
              <div style={{fontSize:12,color:"#555"}}>Log sessions in the Log tab to see your strength dashboard.</div>
            </div>
          ):(
            <>
              {/* ── Power Index hero ── */}
              <div style={{background:BG,borderRadius:16,padding:"1.5rem",marginBottom:14,border:"1px solid #222",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+piCol+","+piCol+"44)"}}/>
                <div style={{position:"absolute",bottom:-20,right:-10,fontSize:110,opacity:0.04,lineHeight:1,userSelect:"none"}}>⚡</div>
                <div style={{display:"flex",alignItems:"center",gap:20}}>
                  {/* Circular gauge */}
                  <div style={{position:"relative",width:88,height:88,flexShrink:0}}>
                    <svg viewBox="0 0 88 88" style={{width:88,height:88,transform:"rotate(-90deg)"}}>
                      <circle cx="44" cy="44" r="36" fill="none" stroke="#1e1e1e" strokeWidth="8"/>
                      <circle cx="44" cy="44" r="36" fill="none" stroke={piCol} strokeWidth="8"
                        strokeDasharray={`${(powerIndex/1000)*226.2} 226.2`}
                        strokeLinecap="round"
                        style={{filter:`drop-shadow(0 0 6px ${piCol}88)`,transition:"stroke-dasharray 0.6s ease"}}/>
                    </svg>
                    <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                      <div style={{fontSize:22,fontWeight:900,color:piCol,lineHeight:1}}>{powerIndex}</div>
                      <div style={{fontSize:8,color:"#555",marginTop:1}}>/ 1000</div>
                    </div>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:9,color:"#555",textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:4}}>TF Power Index</div>
                    <div style={{fontSize:20,fontWeight:900,color:"#fff",lineHeight:1.1,marginBottom:6}}>
                      {powerIndex>=700?"Elite strength":""}
                      {powerIndex>=500&&powerIndex<700?"Strong baseline":""}
                      {powerIndex>=300&&powerIndex<500?"Building force":""}
                      {powerIndex<300?"Just getting started":""}
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {CATS.map(c=>{
                        const has=catPRs[c.id]!=null;
                        const pct=has?Math.round(Math.min(1,catPRs[c.id]/c.ref)*100):0;
                        return(
                          <div key={c.id} style={{display:"flex",alignItems:"center",gap:3,padding:"3px 8px",borderRadius:6,background:has?"#1a1a1a":"#111",border:"0.5px solid "+(has?piCol+"44":"#1a1a1a")}}>
                            <span style={{fontSize:10}}>{c.emoji}</span>
                            <span style={{fontSize:10,color:has?piCol:"#333",fontWeight:has?600:400}}>{has?pct+"%":"—"}</span>
                          </div>
                        );
                      })}
                    </div>
                    {!latestBW&&(
                      <div style={{fontSize:9,color:"#444",marginTop:6}}>Log body weight in the Weight tab to enable relative strength</div>
                    )}
                  </div>
                </div>
                {/* Category count */}
                <div style={{marginTop:14,display:"flex",gap:6}}>
                  {CATS.map(c=>{
                    const has=catPRs[c.id]!=null;
                    const pct=has?Math.min(1,catPRs[c.id]/c.ref):0;
                    return(
                      <div key={c.id} style={{flex:1}}>
                        <div style={{height:3,background:"#1a1a1a",borderRadius:2,overflow:"hidden"}}>
                          <div style={{height:"100%",width:(pct*100)+"%",background:has?piCol:"#333",borderRadius:2,transition:"width 0.5s ease"}}/>
                        </div>
                        <div style={{fontSize:8,color:has?"#555":"#333",marginTop:3,textAlign:"center"}}>{c.emoji}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── PR Board ── */}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,color:"#888",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>🏆 Personal Records · Est. 1RM</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {allLiftNames.map(name=>{
                    const pr=liftPRs[name];
                    const catId=getCat(name);
                    const catObj=CATS.find(c=>c.id===catId);
                    const isSel=selLift===name;
                    const rel=relStrength[name];
                    const rank=catId&&catRanks[catId];
                    const allOrms=(logs[name]||[]).map(e=>epley(parseFloat(e.weight)||0,parseInt(e.reps)||1));
                    const delta=allOrms.length>1?pr.orm-allOrms[1]:null;
                    return(
                      <div key={name} onClick={()=>setSelLift(isSel?null:name)}
                        style={{padding:"12px",background:isSel?BG:"#fff",borderRadius:12,
                          border:"1px solid "+(isSel?GOLD+"66":"#e8e8e8"),cursor:"pointer",
                          boxShadow:isSel?"0 0 16px "+GOLD+"22":"none",position:"relative",overflow:"hidden"}}>
                        {isSel&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,"+GOLD+",transparent)"}}/>}
                        <div style={{fontSize:9,color:isSel?"#555":"#aaa",marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {catObj?.emoji||"🏋️"} {name}
                        </div>
                        <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:2}}>
                          <div style={{fontSize:24,fontWeight:900,color:isSel?"#fff":"#1a1a1a",lineHeight:1}}>{pr.orm}</div>
                          {rel&&<div style={{fontSize:10,color:isSel?piCol:GOLD,fontWeight:600}}>{rel}×BW</div>}
                        </div>
                        <div style={{fontSize:9,color:isSel?"#555":"#aaa"}}>{pr.weight}×{pr.reps||1} · est. 1RM</div>
                        {/* Delta badge */}
                        {delta!==null&&(
                          <div style={{position:"absolute",top:10,right:10,fontSize:10,fontWeight:700,
                            color:delta>0?GREEN:delta<0?RED:"#aaa"}}>
                            {delta>0?"↑+":delta<0?"↓":""}{delta!==0?Math.abs(delta):"—"}
                          </div>
                        )}
                        {/* Team rank */}
                        {rank&&teamLoaded&&(
                          <div style={{marginTop:5,fontSize:9,color:isSel?"#555":rank.rank<=3?GOLD:"#aaa",fontWeight:rank.rank<=3?700:400}}>
                            {rankMedal(rank.rank)&&rankMedal(rank.rank)+" "}#{rank.rank}{rankSuffix(rank.rank)} of {rank.total} · {catObj?.label}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── 1RM Trend ── */}
              {selLift&&(
                <div style={{background:BG,borderRadius:14,padding:"1rem 1.25rem",marginBottom:14,border:"1px solid #222",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,"+GOLD+","+ORANGE+")"}}/>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <div>
                      <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.08em"}}>{selLift}</div>
                      <div style={{fontSize:11,color:GOLD,marginTop:2}}>Est. 1RM over time</div>
                    </div>
                    {selOrms.length>0&&(
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:22,fontWeight:900,color:"#fff"}}>{selOrms[selOrms.length-1]}</div>
                        <div style={{fontSize:9,color:"#555"}}>current est. 1RM</div>
                      </div>
                    )}
                  </div>
                  {selOrms.length>1?(
                    <svg viewBox={`-4 -4 ${cW+8} ${cH+8}`} style={{width:"100%",height:75,overflow:"visible"}}>
                      <defs>
                        <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={GOLD} stopOpacity="0.3"/>
                          <stop offset="100%" stopColor={GOLD} stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      <polygon points={`0,${cH} ${tPts} ${cW},${cH}`} fill="url(#tg)"/>
                      <polyline points={tPts} fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      {selOrms.map((o,i)=>{
                        const x=(i/(Math.max(selOrms.length-1,1)))*cW;
                        const y=cH-((o-oMin)/(Math.max(oMax-oMin,1)))*cH;
                        const isLast=i===selOrms.length-1;
                        const isPR=o===Math.max(...selOrms);
                        return(
                          <g key={i}>
                            <circle cx={x} cy={y} r={isLast?4:isPR?3.5:2} fill={isLast?"#fff":isPR?GOLD:GOLD+"88"} stroke={isLast?GOLD:"none"} strokeWidth="2"/>
                            {isLast&&<text x={x} y={y-8} textAnchor="middle" fontSize="9" fill="#fff" fontFamily="Georgia">{o}</text>}
                            {isPR&&!isLast&&<text x={x} y={y-8} textAnchor="middle" fontSize="8" fill={GOLD} fontFamily="Georgia">PR</text>}
                          </g>
                        );
                      })}
                    </svg>
                  ):(
                    <div style={{textAlign:"center",fontSize:11,color:"#444",padding:"12px 0"}}>Log at least 2 sessions to see the trend.</div>
                  )}
                  {selEntries.length>0&&(
                    <div style={{display:"flex",gap:6,marginTop:8,overflowX:"auto",scrollbarWidth:"none"}}>
                      {selEntries.slice(-6).reverse().map((e,i)=>(
                        <div key={i} style={{flexShrink:0,textAlign:"center",padding:"6px 10px",background:"#111",borderRadius:8,border:"0.5px solid #222"}}>
                          <div style={{fontSize:12,fontWeight:700,color:"#fff"}}>{epley(parseFloat(e.weight)||0,parseInt(e.reps)||1)}</div>
                          <div style={{fontSize:9,color:"#555"}}>{e.weight}×{e.reps||1}</div>
                          <div style={{fontSize:9,color:"#444"}}>{new Date(e.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {!selLift&&(
                <div style={{textAlign:"center",fontSize:11,color:"#aaa",marginBottom:14,padding:"10px",background:"#f9f9f9",borderRadius:8,border:"0.5px solid #eee"}}>
                  Tap any lift card to see its trend chart
                </div>
              )}

              {/* ── Radar chart ── */}
              {activeCats.length>=3&&(
                <div style={{background:"#fff",borderRadius:14,padding:"1.25rem",border:"0.5px solid #e0e0e0"}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#1a1a1a",marginBottom:2}}>📡 Strength Profile</div>
                  <div style={{fontSize:11,color:"#aaa",marginBottom:14}}>Movement pattern balance across all logged lifts</div>
                  <svg viewBox="0 0 200 200" style={{width:"100%",maxWidth:260,display:"block",margin:"0 auto"}}>
                    {[0.25,0.5,0.75,1.0].map((r,ri)=>(
                      <polygon key={ri}
                        points={activeCats.map((_,i)=>{const[x,y]=rPt(i,r*RR);return`${x},${y}`;}).join(" ")}
                        fill="none" stroke={ri===3?"#e8e8e8":"#f0f0f0"} strokeWidth="1"/>
                    ))}
                    {activeCats.map((_,i)=>{
                      const[x,y]=rPt(i,RR);
                      return<line key={i} x1={RCX} y1={RCY} x2={x} y2={y} stroke="#ebebeb" strokeWidth="1"/>;
                    })}
                    <polygon points={rFillPts} fill={piCol+"28"} stroke={piCol} strokeWidth="2.5" strokeLinejoin="round"/>
                    {activeCats.map((_,i)=>{
                      const[x,y]=rPt(i,rScores[i]*RR);
                      return(
                        <g key={i}>
                          <circle cx={x} cy={y} r="5" fill={piCol} stroke="#fff" strokeWidth="2"/>
                          <circle cx={x} cy={y} r="9" fill={piCol} fillOpacity="0.12"/>
                        </g>
                      );
                    })}
                    {activeCats.map((c,i)=>{
                      const[x,y]=rPt(i,RR+18);
                      return(
                        <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="9.5" fill="#555" fontFamily="Georgia">
                          {c.emoji} {c.label}
                        </text>
                      );
                    })}
                    {activeCats.map((_,i)=>{
                      const[x,y]=rPt(i,rScores[i]*RR);
                      return(
                        <text key={i} x={x} y={y+(rScores[i]>0.5?-10:10)} textAnchor="middle" fontSize="8" fill={piCol} fontWeight="700" fontFamily="Georgia">
                          {Math.round(rScores[i]*100)}%
                        </text>
                      );
                    })}
                  </svg>
                  {/* Category breakdown with team ranks */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:14}}>
                    {activeCats.map((c,i)=>{
                      const pct=Math.round(rScores[i]*100);
                      const rank=catRanks[c.id];
                      const rel=latestBW?parseFloat((catPRs[c.id]/latestBW).toFixed(2)):null;
                      return(
                        <div key={i} style={{padding:"10px 12px",background:"#f9f9f9",borderRadius:10,border:"0.5px solid #f0f0f0"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                            <div style={{fontSize:11,fontWeight:600,color:"#1a1a1a"}}>{c.emoji} {c.label}</div>
                            <div style={{fontSize:14,fontWeight:700,color:piCol}}>{catPRs[c.id]}</div>
                          </div>
                          {rel&&<div style={{fontSize:9,color:GOLD,fontWeight:600,marginBottom:4}}>{rel}× bodyweight</div>}
                          <div style={{height:4,background:"#ebebeb",borderRadius:2,overflow:"hidden",marginBottom:5}}>
                            <div style={{width:pct+"%",height:"100%",background:"linear-gradient(90deg,"+piCol+","+ORANGE+")",borderRadius:2}}/>
                          </div>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div style={{fontSize:9,color:"#aaa"}}>{pct}% of target</div>
                            {rank&&teamLoaded&&(
                              <div style={{fontSize:9,fontWeight:700,color:rank.rank<=3?GOLD:"#aaa"}}>
                                {rankMedal(rank.rank)||""}#{rank.rank}{rankSuffix(rank.rank)}/{rank.total}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{fontSize:9,color:"#ccc",textAlign:"center",marginTop:10}}>Reference standards = strong college T&F baseline per movement</div>
                </div>
              )}
              {activeCats.length<3&&activeCats.length>0&&(
                <div style={{background:"#f9f9f9",borderRadius:10,padding:"12px 14px",border:"0.5px solid #eee",textAlign:"center"}}>
                  <div style={{fontSize:11,color:"#aaa"}}>Log lifts in at least 3 movement categories to unlock the strength profile chart.</div>
                  <div style={{fontSize:10,color:"#bbb",marginTop:4}}>Categories: Lower Body, Push, Pull, Hinge</div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
