import { useState, useEffect } from "react";
import { BG, RED, GREEN, GOLD, STEEL, ORANGE, PUR } from "../lib/constants";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";
import { Skeleton, SkeletonList } from "./Skeleton";
import { hSuccess } from "../lib/haptics";
import EmptyState from "./EmptyState";

const DAYS=["Mon","Tue","Thu","Fri"];
const DAY_LABELS={Mon:"Monday",Tue:"Tuesday",Thu:"Thursday",Fri:"Friday"};
const TIER_COLORS={
  1:{bg:"#0d0b1c",border:PUR,color:PUR,label:"Tier 1 — Primary"},
  2:{bg:"#091510",border:GREEN,color:GREEN,label:"Tier 2 — Secondary"},
  3:{bg:"#1a0f00",border:ORANGE,color:ORANGE,label:"Tier 3 — Accessory"},
  circuit:{bg:"#1a0808",border:RED,color:RED,label:"Circuit · 3 Rounds · 30s on / 15s off"},
  guns_and_glory:{bg:"#1a1600",border:GOLD,color:GOLD,label:"Guns & Glory"},
};

// Band resistance colors — orange (lightest) → red → black → green → blue (max)
const BAND_COLORS=[
  {id:"orange",label:"Orange",hex:"#E8720C",resistance:"Lightest"},
  {id:"red",   label:"Red",   hex:"#C0392B",resistance:"Light"},
  {id:"black", label:"Black", hex:"#222",   resistance:"Medium"},
  {id:"green", label:"Green", hex:"#1E6B3A",resistance:"Heavy"},
  {id:"blue",  label:"Blue",  hex:"#1A4F8A",resistance:"Max"},
];

// Medicine ball preset weights (lbs)
const MB_WEIGHTS=[6,8,10,12,14,16,20];

// Kettlebell color → weight (lbs)
const KB_COLORS=[
  {id:"white",  label:"White",  hex:"#e8e8e8", textColor:"#222", weight:8.8},
  {id:"pink",   label:"Pink",   hex:"#e91e8c", textColor:"#fff", weight:17.6},
  {id:"blue",   label:"Blue",   hex:"#1A4F8A", textColor:"#fff", weight:26.4},
  {id:"yellow", label:"Yellow", hex:"#f5c518", textColor:"#222", weight:35.2},
  {id:"purple", label:"Purple", hex:"#7B2D8B", textColor:"#fff", weight:44.1},
  {id:"green",  label:"Green",  hex:"#1E6B3A", textColor:"#fff", weight:52.9},
  {id:"orange", label:"Orange", hex:"#E8720C", textColor:"#fff", weight:61.7},
  {id:"red",    label:"Red",    hex:"#C0392B", textColor:"#fff", weight:70.5},
  {id:"gray",   label:"Gray",   hex:"#708090", textColor:"#fff", weight:79.4},
];

const DEFAULT_PROGRAM={
  Mon:[
    {name:"BB Front Squat / Pitshark",    tier:1,sets:"8 (4x5)",                inputType:"weight"},
    {name:"Seated Cable Rows",             tier:1,sets:"12, 8, 8 (2:2:0)",       inputType:"weight"},
    {name:"DB Curl to Press",              tier:1,sets:"3x8",                    inputType:"weight"},
    {name:"DB Incline Bench Press",        tier:2,sets:"12, 10, 10, 8",          inputType:"weight"},
    {name:"ISOphit Copenhagen Holds",      tier:2,sets:"3x20s ea",               inputType:"bodyweight"},
    {name:"KB Swing Switches",             tier:2,sets:"3x7e",                   inputType:"kb"},
    {name:"KB SA Situp",                   tier:3,sets:"3x6e",                   inputType:"kb"},
    {name:"KB Banded Deadbug",             tier:3,sets:"3x9e",                   inputType:"band_kb"},
    {name:"DB Birddog Row on Bench",       tier:3,sets:"3x10e",                  inputType:"weight"},
  ],
  Tue:[
    {name:"BB Hang Cleans",                tier:1,sets:"4x6",                    inputType:"weight"},
    {name:"LM Banded Push Press",          tier:1,sets:"4x10",                   inputType:"band_weight"},
    {name:"TRX T,Y,I",                     tier:1,sets:"3x6e",                   inputType:"bodyweight"},
    {name:"SL/Pistol Squat",               tier:2,sets:"3x7e",                   inputType:"weight_kb"},
    {name:"DB/KB Kickstand Hinge",         tier:2,sets:"3x8e",                   inputType:"kb"},
    {name:"DB Chest Supported Row",        tier:2,sets:"3x10e",                  inputType:"weight"},
    {name:"Cable Rope Trunk Rotation",     tier:3,sets:"3x10e",                  inputType:"weight"},
    {name:"Dragon Flag",                   tier:3,sets:"3x9",                    inputType:"bodyweight"},
    {name:"KB Farmer & Waiter Carry",      tier:3,sets:"3x20 yards",               inputType:"kb2_yards"},
  ],
  Thu:[
    {name:"SA Banded Rot. Jammer Press",   tier:1,sets:"4x5e",                   inputType:"band_weight"},
    {name:"SA Lat Pull Down",              tier:1,sets:"4x14e",                  inputType:"weight"},
    {name:"DB Pronated Trap Raise",        tier:1,sets:"3x15",                   inputType:"weight"},
    {name:"Heavy Prowler Sprint",          tier:2,sets:"4x20 yards",               inputType:"weight"},
    {name:"Weighted Plank Holds",          tier:2,sets:"3x30s",                  inputType:"weight"},
    {name:"KB Shrugs",                     tier:2,sets:"3x15",                   inputType:"kb"},
    {name:"Battle Rope Waves",             tier:"circuit",sets:"30s",            inputType:"bodyweight"},
    {name:"Wall Sit w/ Band Pull Apart",   tier:"circuit",sets:"30s",            inputType:"bodyweight"},
    {name:"Dead Hangs",                    tier:"circuit",sets:"30s",            inputType:"bodyweight"},
    {name:"TRX Bicep Curl",                tier:"circuit",sets:"30s",            inputType:"bodyweight"},
    {name:"SL Box Jumps",                  tier:"circuit",sets:"30s",            inputType:"bodyweight"},
    {name:"DB Lat Box Step Ups",           tier:"circuit",sets:"30s",            inputType:"weight"},
  ],
  Fri:[
    {name:"BB Deadlifts",                  tier:1,sets:"8,4,4,3",               inputType:"weight"},
    {name:"DB RFESS (3:0:0)",              tier:1,sets:"4x6e",                   inputType:"weight"},
    {name:"MB Rot Wall Toss",              tier:1,sets:"3x8e",                   inputType:"mb"},
    {name:"BB Push Press",                 tier:2,sets:"4x7e",                   inputType:"weight"},
    {name:"SA DB Bent Over Row",           tier:2,sets:"15e,13e,11e,9e",         inputType:"weight"},
    {name:"Banded Cable Pallof Press",     tier:2,sets:"3x12e",                  inputType:"band_pallof"},
    {name:"DB ISO Hammer Curl",            tier:"guns_and_glory",sets:"3x12e",   inputType:"weight"},
    {name:"DB Bench Skull Crusher",        tier:"guns_and_glory",sets:"15,13,12",inputType:"weight"},
    {name:"DB Crazy 8's",                  tier:"guns_and_glory",sets:"3x8e",    inputType:"weight",note:"Front · Upright · Lat · Rear Delt"},
  ],
};

const epley=(w,r)=>r===1?w:Math.round(w*(1+r/30));

// Gender-specific T&F reference standards
const CATS_M=[
  {id:"lower", label:"Lower Body", ref:315, w:0.30},
  {id:"push",  label:"Push",       ref:225, w:0.20},
  {id:"pull",  label:"Pull",       ref:185, w:0.15},
  {id:"hinge", label:"Hinge",      ref:365, w:0.35},
];
const CATS_F=[
  {id:"lower", label:"Lower Body", ref:185, w:0.30},
  {id:"push",  label:"Push",       ref:115, w:0.20},
  {id:"pull",  label:"Pull",       ref:100, w:0.15},
  {id:"hinge", label:"Hinge",      ref:225, w:0.35},
];

const VERT_LIFTS=new Set(["pvc max vert"]);
const EXCLUDED_CATS=new Set(["weighted box dips","ab rollout","mb slam to shotput","mb oh sit up throw"]);
const isVert=(name)=>VERT_LIFTS.has((name||"").toLowerCase());

const getCat=(name)=>{
  const n=(name||"").toLowerCase();
  if(EXCLUDED_CATS.has(n)||VERT_LIFTS.has(n))return null;
  if(n.includes("deadlift")||n.includes(" clean")||n.includes("snatch")||n.includes("swing")||n.includes("rdl")||n.includes("hinge"))return "hinge";
  if(n.includes("squat")||n.includes("lunge")||n.includes("step up"))return "lower";
  if(n.includes("bench")||n.includes("press")||n.includes("push")||n.includes("dip")||n.includes("jerk"))return "push";
  if(n.includes("pull")||n.includes("row")||n.includes("curl"))return "pull";
  return null;
};

const rankSuffix=(n)=>n===1?"st":n===2?"nd":n===3?"rd":"th";
const rankMedal=(n)=>n===1?"🥇":n===2?"🥈":n===3?"🥉":null;

const strTier=(pct)=>{
  if(pct>=120)return{label:"Elite",color:GOLD,bg:GOLD+"28"};
  if(pct>=100)return{label:"Strong",color:GREEN,bg:GREEN+"28"};
  if(pct>=80) return{label:"Building",color:ORANGE,bg:ORANGE+"28"};
  return{label:"Starting",color:STEEL,bg:STEEL+"28"};
};

const piColor=(score)=>{
  if(score>=80)return GOLD;
  if(score>=60)return GREEN;
  if(score>=40)return ORANGE;
  return STEEL;
};

export default function PRLog({athleteId,gender}){
  const _estNow=new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
  const today=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][_estNow.getDay()];
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
  const[teamAthletes,setTeamAthletes]=useState([]);
  const[latestBW,setLatestBW]=useState(null);
  const[teamLoaded,setTeamLoaded]=useState(false);
  const[bwDone,setBwDone]=useState({});
  const[showPriorPhase,setShowPriorPhase]=useState(false);

  useEffect(()=>{
    (async()=>{
      try{
        const{data}=await supabase.from("announcements").select("*").eq("type","program").eq("active",true)
          .order("created_at",{ascending:false}).limit(1);
        if(data&&data[0]){
          const p=JSON.parse(data[0].message||"{}");
          if(p.days){
            // Merge inputType from DEFAULT_PROGRAM by name so DB-loaded programs get the right input UI
            const merged={};
            Object.keys(p.days).forEach(day=>{
              merged[day]=(p.days[day]||[]).map(lift=>{
                const def=(DEFAULT_PROGRAM[day]||[]).find(d=>d.name===lift.name);
                return{...lift,inputType:lift.inputType||def?.inputType||"weight"};
              });
            });
            setProgram(merged);setPhase(p.phase||"");
          } else if(p.lifts){
            const spread={Mon:p.lifts.map((l,i)=>({name:l,tier:i<2?1:i<4?2:3})),Tue:p.lifts.map((l,i)=>({name:l,tier:i<2?1:i<4?2:3})),Thu:p.lifts.map((l,i)=>({name:l,tier:i<2?1:i<4?2:3})),Fri:p.lifts.map((l,i)=>({name:l,tier:i<2?1:i<4?2:3}))};
            setProgram(spread);setPhase(p.phase||"");
          }else{setProgram(DEFAULT_PROGRAM);setPhase("Summer Phase 2 Workouts");}
        }else{setProgram(DEFAULT_PROGRAM);setPhase("Summer Phase 2 Workouts");}
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

  // Load team data lazily when dashboard opens
  useEffect(()=>{
    if(view!=="dashboard"||teamLoaded||!athleteId)return;
    (async()=>{
      try{
        const{data}=await supabase.from("pr_log").select("athlete_id,lift,weight,reps");
        setTeamPrLogs(data||[]);
      }catch(e){}
      try{
        const{data}=await supabase.from("athletes").select("id,gender").eq("status","active");
        setTeamAthletes(data||[]);
      }catch(e){}
      setTeamLoaded(true);
    })();
  },[view,athleteId]);

  // Load latest bodyweight eagerly so BW toggle works in the log view
  useEffect(()=>{
    if(!athleteId)return;
    (async()=>{
      try{
        const{data}=await supabase.from("weight_log").select("weight").eq("athlete_id",athleteId)
          .order("date",{ascending:false}).limit(1).maybeSingle();
        if(data?.weight)setLatestBW(parseFloat(data.weight));
      }catch(e){}
    })();
  },[athleteId]);

  const todayLifts=(program&&program[activeDay])||[];

  const setInput=(liftName,field,val)=>{
    setInputs(prev=>({...prev,[liftName]:{...prev[liftName],[field]:val}}));
  };

  const toggleBW=(liftName)=>{
    setInputs(prev=>{
      const cur=prev[liftName]||{};
      const on=!cur.bw;
      return{...prev,[liftName]:{...cur,bw:on,weight:on&&latestBW?String(latestBW):on?"":cur.weight||""}};
    });
  };

  const saveLog=async(liftName,tier)=>{
    const inp=inputs[liftName]||{};
    if(!inp.weight)return;
    setSaving(liftName);
    const estNow=new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
    const today=estNow.getFullYear()+"-"+String(estNow.getMonth()+1).padStart(2,"0")+"-"+String(estNow.getDate()).padStart(2,"0");
    const tierNum=typeof tier==="number"?tier:3; // "circuit"/"guns_and_glory" → 3
    const entry={
      athlete_id:athleteId,lift:liftName,weight:parseFloat(inp.weight),
      reps:parseInt(inp.reps)||1,date:today,day:activeDay,tier:tierNum,
    };
    try{
      const{data,error}=await supabase.from("pr_log").insert(entry).select().single();
      if(error){setLoadError(error.message);setSaving(null);return;}
      setLogs(prev=>{const existing=prev[liftName]||[];return{...prev,[liftName]:[data,...existing]};});
      setInputs(prev=>({...prev,[liftName]:{weight:"",reps:""}}));
      setSaving(null);setSaved(liftName);setTimeout(()=>setSaved(null),2000);hSuccess();
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
  const isFemale=gender==="female"||gender==="Female"||gender==="F"||gender==="f"||gender==="woman"||gender==="Woman";
  const CATS=isFemale?CATS_F:CATS_M;
  const genderLabel=isFemale?"Women's":"Men's";

  const allLiftNames=Object.keys(logs).filter(k=>logs[k].length>0);

  // Split lifts into current phase vs prior phases
  const currentPhaseLiftSet=new Set(
    Object.values(program||{}).flat().map(l=>l.name)
  );
  const currentLiftNames=allLiftNames.filter(n=>currentPhaseLiftSet.has(n));
  const priorLiftNames=allLiftNames.filter(n=>!currentPhaseLiftSet.has(n));

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

  // Team average refs — actual group averages used as benchmark (computed before Power Index)
  const teamAvgRefs={};
  if(teamLoaded&&teamPrLogs.length>0){
    const gm={};
    teamAthletes.forEach(a=>{gm[String(a.id)]=a.gender;});
    CATS.forEach(cat=>{
      const athBests={};
      teamPrLogs.forEach(r=>{
        if(getCat(r.lift)!==cat.id)return;
        const g=gm[String(r.athlete_id)]||"";
        const oF=g==="female"||g==="Female"||g==="F"||g==="f"||g==="woman"||g==="Woman";
        if(isFemale!==oF)return;
        const orm=epley(parseFloat(r.weight)||0,parseInt(r.reps)||1);
        if(!athBests[r.athlete_id]||orm>athBests[r.athlete_id])athBests[r.athlete_id]=orm;
      });
      const bests=Object.values(athBests).filter(v=>v>0);
      if(bests.length>=2)teamAvgRefs[cat.id]=Math.round(bests.reduce((s,v)=>s+v,0)/bests.length);
    });
  }
  const getRef=(catId)=>teamAvgRefs[catId]||CATS.find(c=>c.id===catId)?.ref||1;

  // Power Index (0–100): weighted composite vs team averages
  const powerIndex=(()=>{
    let score=0,totalW=0;
    CATS.forEach(c=>{
      if(catPRs[c.id]!=null){score+=Math.min(1,catPRs[c.id]/getRef(c.id))*c.w;totalW+=c.w;}
    });
    if(!totalW)return 0;
    return Math.round((score/totalW)*100);
  })();
  const piCol=piColor(powerIndex);

  // Team ranks — same gender only, with percentile
  const catRanks={};
  if(teamLoaded&&teamPrLogs.length>0){
    const genderMap={};
    teamAthletes.forEach(a=>{genderMap[String(a.id)]=a.gender;});
    const myGender=gender||"";
    const sameGender=(aid)=>{
      const g=genderMap[String(aid)]||"";
      if(!myGender)return true;
      const mF=isFemale;
      const oF=g==="female"||g==="Female"||g==="F"||g==="f"||g==="woman"||g==="Woman";
      return mF===oF;
    };
    const teamByAth={};
    teamPrLogs.forEach(r=>{
      if(!sameGender(r.athlete_id))return;
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
      const total=scores.length;
      const pct=total>0?Math.round(((rank-1)/total)*100):null;
      catRanks[cat.id]={rank:rank||total,total,pct};
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

  // Radar — outer ring = ELITE (1.4× team avg), team avg ring shown at 71% of RR
  const RADAR_SCALE=1.4;
  const N=activeCats.length;
  const RCX=100,RCY=100,RR=70;
  const rAngle=(i)=>(2*Math.PI*i/Math.max(N,1))-Math.PI/2;
  const rPt=(i,r)=>[RCX+r*Math.cos(rAngle(i)),RCY+r*Math.sin(rAngle(i))];
  const rScores=activeCats.map(c=>Math.min(1,catPRs[c.id]/(getRef(c.id)*RADAR_SCALE)));
  const rFillPts=activeCats.map((_,i)=>{const[x,y]=rPt(i,rScores[i]*RR);return`${x},${y}`;}).join(" ");
  const rAvgPts=activeCats.map((_,i)=>{const[x,y]=rPt(i,(1/RADAR_SCALE)*RR);return`${x},${y}`;}).join(" ");

  if(!program)return(
    <div style={{paddingTop:8}}>
      <Skeleton height={70} radius={14} style={{marginBottom:12}}/>
      <SkeletonList rows={5} avatar={false}/>
    </div>
  );

  return(
    <div>
      {/* View toggle */}
      <div style={{display:"flex",gap:4,marginBottom:14,background:"#0a0a0a",borderRadius:12,padding:4}}>
        {[{id:"log",label:"Log"},{id:"dashboard",label:"Dashboard"},{id:"week",label:"Week"}].map(v=>(
          <button key={v.id} onClick={()=>setView(v.id)}
            style={{flex:1,padding:"11px",borderRadius:9,border:"none",
              background:view===v.id?"linear-gradient(135deg,"+GOLD+"cc,"+GOLD+"88)":"transparent",
              color:view===v.id?"#fff":"#444",fontSize:13,fontWeight:view===v.id?700:400,
              cursor:"pointer",fontFamily:"Georgia,serif",transition:"all 0.15s"}}>
            {v.label}
          </button>
        ))}
      </div>

      {/* ── LOG VIEW ────────────────────────────────────────── */}
      {view==="log"&&(
        <div>
          {phase&&(
            <div style={{background:"linear-gradient(135deg,#1a1200,#1c1500,#0e0e0e)",borderRadius:14,padding:"16px 18px",marginBottom:14,border:"1px solid "+GOLD+"33",borderLeft:"3px solid "+GOLD,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-18,right:-12,fontSize:80,opacity:0.05,lineHeight:1,userSelect:"none",pointerEvents:"none"}}>⚡</div>
              <div style={{fontSize:9,color:GOLD+"99",textTransform:"uppercase",letterSpacing:"0.14em",fontWeight:700,marginBottom:5}}>Current Phase</div>
              <div style={{fontSize:19,fontWeight:800,color:"#fff",letterSpacing:"-0.02em",lineHeight:1.2}}>{phase}</div>
            </div>
          )}
          {loadError&&<div style={{background:"#FCEBEB",borderRadius:8,padding:"8px 12px",marginBottom:8,fontSize:12,color:RED}}>Error: {loadError}</div>}
          <div style={{display:"flex",gap:4,marginBottom:14,background:"#0a0a0a",borderRadius:12,padding:4}}>
            {DAYS.map(d=>{
              const isActive=activeDay===d;
              const isToday=d===defaultDay;
              return(
                <button key={d} onClick={()=>setActiveDay(d)}
                  style={{flex:1,padding:"12px 4px",borderRadius:9,border:"none",
                    background:isActive?ORANGE:"transparent",
                    color:isActive?"#fff":isToday?"#777":"#444",
                    fontSize:13,fontWeight:isActive?700:400,
                    cursor:"pointer",fontFamily:"Georgia,serif",position:"relative",transition:"all 0.15s"}}>
                  {isToday&&!isActive&&<div style={{position:"absolute",top:5,right:8,width:5,height:5,borderRadius:"50%",background:GREEN}}/>}
                  {d}
                </button>
              );
            })}
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontSize:16,fontWeight:800,color:"#fff",letterSpacing:"-0.02em"}}>{DAY_LABELS[activeDay]}'s Lifts</div>
            <div style={{fontSize:11,color:"#444",background:"#111",padding:"3px 10px",borderRadius:20,border:"0.5px solid #222"}}>{todayLifts.length} lifts</div>
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
              <div key={i} style={{background:"#111",borderRadius:14,marginBottom:10,border:"0.5px solid #1e1e1e",overflow:"hidden",borderLeft:"3px solid "+tc.border}}>
                <div style={{padding:"14px 14px 12px"}}>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
                    <div style={{flex:1,minWidth:0,paddingRight:8}}>
                      <div style={{fontSize:15,fontWeight:700,color:"#fff",lineHeight:1.2,marginBottom:4}}>{lift.name}</div>
                      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                        <span style={{fontSize:9,fontWeight:700,color:tc.color,textTransform:"uppercase",letterSpacing:"0.08em",background:tc.bg,padding:"2px 7px",borderRadius:4,border:"0.5px solid "+tc.border+"55"}}>{tc.label}</span>
                        {lift.sets&&<span style={{fontSize:10,color:"#555"}}>· {lift.sets}</span>}
                      </div>
                      {lift.note&&<div style={{fontSize:10,color:"#444",marginTop:4,fontStyle:"italic"}}>{lift.note}</div>}
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      {lift.inputType!=="bodyweight"&&pr&&<div style={{fontSize:13,fontWeight:800,color:GOLD,lineHeight:1}}>{pr}<span style={{fontSize:9,fontWeight:500,marginLeft:2}}>{isVert(lift.name)?"in":"lbs"}</span></div>}
                      {lift.inputType!=="bodyweight"&&pr&&<div style={{fontSize:9,color:"#444",marginBottom:2}}>PR</div>}
                      {lift.inputType!=="bodyweight"&&last&&<div style={{fontSize:10,color:"#555"}}>last {last}</div>}
                    </div>
                  </div>
                  {(()=>{
                    const itype=lift.inputType||"weight";
                    const selBand=inp.bandColor?BAND_COLORS.find(b=>b.id===inp.bandColor):null;
                    const selKB=inp.kbColor?KB_COLORS.find(k=>k.id===inp.kbColor):null;
                    const logBtn=(disabled)=>(
                      <button onClick={()=>saveLog(lift.name,lift.tier)} disabled={disabled||isSaving}
                        style={{padding:"11px 16px",borderRadius:10,border:"none",
                          background:!disabled?(isSaved?"#1E6B3A":tc.border):"#1a1a1a",
                          color:!disabled?"#fff":"#333",fontSize:13,fontWeight:700,
                          cursor:!disabled?"pointer":"not-allowed",fontFamily:"Georgia,serif",minWidth:56,
                          boxShadow:!disabled&&!isSaved?"0 2px 8px "+tc.border+"44":"none",
                          transition:"all 0.15s"}}>
                        {isSaved?"✓":isSaving?"…":"Log"}
                      </button>
                    );
                    const repsInput=(
                      <div style={{flex:1}}>
                        <div style={{fontSize:9,color:"#555",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:600}}>Reps</div>
                        <input type="number" inputMode="numeric" value={inp.reps||""}
                          onChange={e=>setInput(lift.name,"reps",e.target.value)}
                          placeholder="0"
                          style={{width:"100%",padding:"11px",borderRadius:9,border:"1px solid #252525",fontSize:16,fontFamily:"Georgia,serif",textAlign:"center",background:"#0f0f0f",boxSizing:"border-box",fontWeight:700,color:"#fff"}}/>
                      </div>
                    );
                    const bandPicker=(label)=>(
                      <div style={{marginBottom:12}}>
                        <div style={{fontSize:9,color:"#555",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700}}>{label||"Band Resistance"}</div>
                        <div style={{display:"flex",flexDirection:"column",gap:4}}>
                          {BAND_COLORS.map(b=>{
                            const sel=inp.bandColor===b.id;
                            return(
                              <button key={b.id} onClick={()=>setInput(lift.name,"bandColor",b.id)}
                                style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:9,
                                  border:"1px solid "+(sel?b.hex+"66":"#1e1e1e"),
                                  borderLeft:"3px solid "+(sel?b.hex:"#1e1e1e"),
                                  background:sel?"#111":"#0a0a0a",
                                  cursor:"pointer",transition:"all 0.12s",textAlign:"left"}}>
                                <div style={{width:14,height:14,borderRadius:3,flexShrink:0,background:b.hex}}/>
                                <span style={{flex:1,fontSize:13,fontWeight:sel?700:500,color:sel?b.hex:"#888"}}>{b.label}</span>
                                <span style={{fontSize:11,color:sel?"#888":"#333"}}>{b.resistance}</span>
                                {sel&&<span style={{fontSize:12,color:b.hex,fontWeight:700}}>✓</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                    const kbPicker=()=>(
                      <div style={{marginBottom:8}}>
                        <div style={{fontSize:10,color:"#555",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700}}>Kettlebell</div>
                        <div style={{display:"flex",flexDirection:"column",gap:4}}>
                          {KB_COLORS.map(k=>{
                            const isSel=inp.kbColor===k.id;
                            return(
                              <button key={k.id}
                                onClick={()=>{setInput(lift.name,"kbColor",k.id);setInput(lift.name,"weight",String(k.weight));}}
                                style={{display:"flex",alignItems:"center",gap:12,
                                  padding:"10px 12px",borderRadius:9,
                                  border:"1px solid "+(isSel?k.hex+"66":"#1e1e1e"),
                                  borderLeft:"3px solid "+(isSel?k.hex:"#1e1e1e"),
                                  background:isSel?"#111":"#0a0a0a",
                                  cursor:"pointer",transition:"all 0.12s",textAlign:"left"}}>
                                <div style={{width:14,height:14,borderRadius:3,flexShrink:0,
                                  background:k.hex,
                                  border:k.id==="white"?"1px solid #555":"none"}}/>
                                <span style={{flex:1,fontSize:13,fontWeight:isSel?700:500,
                                  color:isSel?k.hex:"#888"}}>{k.label}</span>
                                <span style={{fontSize:12,color:isSel?"#aaa":"#333",fontWeight:isSel?600:400}}>{k.weight} lbs</span>
                                {isSel&&<span style={{fontSize:12,color:k.hex,fontWeight:700}}>✓</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );

                    // ── BODYWEIGHT ──────────────────────────────────
                    if(itype==="bodyweight"){
                      const done=bwDone[lift.name];
                      return(
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{flex:1,padding:"10px 14px",borderRadius:10,
                            background:done?"#091510":"#0a0a0a",
                            border:"1px solid "+(done?GREEN+"44":"#1e1e1e"),
                            fontSize:12,color:done?GREEN+"99":"#333",fontStyle:"italic",
                            transition:"all 0.2s"}}>
                            {done?"All sets complete":"Bodyweight · no load to track"}
                          </div>
                          <button onClick={()=>setBwDone(p=>({...p,[lift.name]:!p[lift.name]}))}
                            style={{padding:"11px 16px",borderRadius:10,border:"none",
                              background:done?"#1E6B3A":"#1a1a1a",
                              color:done?"#fff":"#444",
                              fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif",
                              whiteSpace:"nowrap",transition:"all 0.15s",
                              boxShadow:done?"0 2px 8px #1E6B3A44":"none"}}>
                            {done?"✓ Done":"Mark Done"}
                          </button>
                        </div>
                      );
                    }

                    // ── MEDICINE BALL ────────────────────────────────
                    if(itype==="mb"){
                      return(
                        <div>
                          <div style={{fontSize:9,color:"#555",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700}}>⚽ Medicine Ball Weight</div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                            {MB_WEIGHTS.map(w=>{
                              const sel=inp.weight===String(w);
                              return(
                                <button key={w} onClick={()=>setInput(lift.name,"weight",String(w))}
                                  style={{padding:"9px 13px",borderRadius:9,
                                    border:"1.5px solid "+(sel?tc.border:"#1e1e1e"),
                                    background:sel?tc.bg:"#0f0f0f",
                                    color:sel?tc.color:"#555",
                                    fontSize:12,fontWeight:sel?700:400,
                                    cursor:"pointer",fontFamily:"Georgia,serif",
                                    boxShadow:sel?"0 0 0 1px "+tc.border+"44":"none",transition:"all 0.12s"}}>
                                  {w}<span style={{fontSize:9,marginLeft:2,opacity:0.7}}>lbs</span>
                                </button>
                              );
                            })}
                          </div>
                          <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
                            {repsInput}
                            <div style={{paddingBottom:0}}>{logBtn(!inp.weight)}</div>
                          </div>
                          {inp.weight&&inp.reps&&<div style={{textAlign:"center",fontSize:11,color:"#444",marginTop:6,padding:"5px",background:"#0a0a0a",borderRadius:7,border:"0.5px solid #1a1a1a"}}>{inp.weight} lbs × {inp.reps} reps</div>}
                        </div>
                      );
                    }

                    // ── BAND + WEIGHT (incl. Pallof = two labeled slots) ──
                    if(itype==="band_weight"||itype==="band_pallof"){
                      return(
                        <div>
                          {bandPicker("Band Resistance")}
                          <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
                            <div style={{flex:1}}>
                              <div style={{fontSize:9,color:"#555",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:600}}>{itype==="band_pallof"?"Cable Weight (lbs)":"Weight (lbs)"}</div>
                              <input type="number" inputMode="decimal" value={inp.weight||""}
                                onChange={e=>setInput(lift.name,"weight",e.target.value)}
                                placeholder={last?`Last: ${last}`:"0"}
                                style={{width:"100%",padding:"11px",borderRadius:9,border:"1px solid #252525",fontSize:16,fontFamily:"Georgia,serif",textAlign:"center",background:"#0f0f0f",boxSizing:"border-box",fontWeight:700,color:"#fff"}}/>
                            </div>
                            {repsInput}
                            <div>{logBtn(!inp.weight)}</div>
                          </div>
                          {selBand&&<div style={{fontSize:10,color:selBand.hex,marginTop:6,fontWeight:600,display:"flex",alignItems:"center",gap:5}}><div style={{width:8,height:8,borderRadius:"50%",background:selBand.hex,flexShrink:0}}/>{selBand.label} Band · {selBand.resistance}</div>}
                        </div>
                      );
                    }

                    // ── BAND + KETTLEBELL ────────────────────────────
                    if(itype==="band_kb"){
                      return(
                        <div>
                          {bandPicker("Band Resistance")}
                          {kbPicker()}
                          <div style={{display:"flex",gap:8,alignItems:"flex-end",marginTop:4}}>
                            {repsInput}
                            <div>{logBtn(!inp.weight)}</div>
                          </div>
                          {selBand&&<div style={{fontSize:10,color:selBand.hex,marginTop:6,fontWeight:600}}>● {selBand.label} Band · {selBand.resistance}</div>}
                          {inp.weight&&inp.reps&&<div style={{textAlign:"center",fontSize:11,color:"#444",marginTop:6,padding:"5px",background:"#0a0a0a",borderRadius:7,border:"0.5px solid #1a1a1a"}}>est. 1RM: <span style={{color:GOLD,fontWeight:800}}>{epley(parseFloat(inp.weight)||0,parseInt(inp.reps)||1)} lbs</span></div>}
                        </div>
                      );
                    }

                    // ── DUAL KETTLEBELL + YARDS ─────────────────────
                    if(itype==="kb2_yards"){
                      const selKB1=inp.kbColor?KB_COLORS.find(k=>k.id===inp.kbColor):null;
                      const selKB2=inp.kbColor2?KB_COLORS.find(k=>k.id===inp.kbColor2):null;
                      const combined=(selKB1?selKB1.weight:0)+(selKB2?selKB2.weight:0);
                      const kbRow=(label,colorKey,w2Key)=>(
                        <div style={{marginBottom:12}}>
                          <div style={{fontSize:10,color:"#555",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700}}>{label}</div>
                          <div style={{display:"flex",flexDirection:"column",gap:4}}>
                            {KB_COLORS.map(k=>{
                              const isSel=inp[colorKey]===k.id;
                              return(
                                <button key={k.id}
                                  onClick={()=>{
                                    setInputs(prev=>{
                                      const cur=prev[lift.name]||{};
                                      const otherW=colorKey==="kbColor"?(parseFloat(cur.weight2)||0):(parseFloat(cur.weight1)||0);
                                      const newW=colorKey==="kbColor"
                                        ?{weight1:String(k.weight),weight:String(k.weight+otherW)}
                                        :{weight2:String(k.weight),weight:String((parseFloat(cur.weight1)||0)+k.weight)};
                                      return{...prev,[lift.name]:{...cur,[colorKey]:k.id,...newW}};
                                    });
                                  }}
                                  style={{display:"flex",alignItems:"center",gap:12,
                                    padding:"10px 12px",borderRadius:9,
                                    border:"1px solid "+(isSel?k.hex+"66":"#1e1e1e"),
                                    borderLeft:"3px solid "+(isSel?k.hex:"#1e1e1e"),
                                    background:isSel?"#111":"#0a0a0a",
                                    cursor:"pointer",transition:"all 0.12s",textAlign:"left"}}>
                                  <div style={{width:14,height:14,borderRadius:3,flexShrink:0,
                                    background:k.hex,border:k.id==="white"?"1px solid #555":"none"}}/>
                                  <span style={{flex:1,fontSize:13,fontWeight:isSel?700:500,
                                    color:isSel?k.hex:"#888"}}>{k.label}</span>
                                  <span style={{fontSize:12,color:isSel?"#aaa":"#333",fontWeight:isSel?600:400}}>{k.weight} lbs</span>
                                  {isSel&&<span style={{fontSize:12,color:k.hex,fontWeight:700}}>✓</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                      return(
                        <div>
                          {kbRow("Farmer Hand (KB 1)","kbColor","weight1")}
                          {kbRow("Waiter Hand (KB 2)","kbColor2","weight2")}
                          <div style={{display:"flex",gap:8,alignItems:"flex-end",marginTop:4}}>
                            <div style={{flex:1}}>
                              <div style={{fontSize:9,color:"#555",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:600}}>Yards</div>
                              <input type="number" inputMode="numeric" value={inp.reps||""}
                                onChange={e=>setInput(lift.name,"reps",e.target.value)}
                                placeholder="0"
                                style={{width:"100%",padding:"11px",borderRadius:9,border:"1px solid #252525",fontSize:16,fontFamily:"Georgia,serif",textAlign:"center",background:"#0f0f0f",boxSizing:"border-box",fontWeight:700,color:"#fff"}}/>
                            </div>
                            <div>{logBtn(!inp.weight||!inp.reps)}</div>
                          </div>
                          {selKB1&&selKB2&&inp.reps&&(
                            <div style={{textAlign:"center",fontSize:11,color:"#444",marginTop:6,padding:"6px",background:"#0a0a0a",borderRadius:8,border:"0.5px solid #1a1a1a"}}>
                              <span style={{color:"#888"}}>{selKB1.label} + {selKB2.label} · </span>
                              <span style={{color:GOLD,fontWeight:800}}>{combined} lbs total</span>
                              <span style={{color:"#555",marginLeft:6}}>× {inp.reps} yards</span>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // ── KETTLEBELL ───────────────────────────────────
                    if(itype==="kb"){
                      return(
                        <div>
                          {kbPicker()}
                          <div style={{display:"flex",gap:8,alignItems:"flex-end",marginTop:4}}>
                            {repsInput}
                            <div>{logBtn(!inp.weight)}</div>
                          </div>
                          {inp.weight&&inp.reps&&<div style={{textAlign:"center",fontSize:11,color:"#444",marginTop:6,padding:"5px",background:"#0a0a0a",borderRadius:7,border:"0.5px solid #1a1a1a"}}>est. 1RM: <span style={{color:GOLD,fontWeight:800}}>{epley(parseFloat(inp.weight)||0,parseInt(inp.reps)||1)} lbs</span>{pr&&epley(parseFloat(inp.weight)||0,parseInt(inp.reps)||1)>pr&&<span style={{marginLeft:8,background:GOLD,color:"#000",padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:700}}>NEW PR!</span>}</div>}
                        </div>
                      );
                    }

                    // ── VERTICAL JUMP ────────────────────────────────
                    if(isVert(lift.name)){
                      return(
                        <div>
                          <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
                            <div style={{flex:1}}>
                              <div style={{fontSize:10,color:PUR,fontWeight:600,marginBottom:3}}>⬆️ Height (inches)</div>
                              <input type="number" inputMode="decimal" value={inp.weight||""}
                                onChange={e=>setInput(lift.name,"weight",e.target.value)}
                                placeholder={last?`Last: ${last}`:"e.g. 28"}
                                style={{width:"100%",padding:"10px",borderRadius:8,border:"1px solid "+PUR+"44",fontSize:15,fontFamily:"Georgia,serif",textAlign:"center",background:"#faf8ff",boxSizing:"border-box",fontWeight:600}}/>
                            </div>
                            <div>{logBtn(!inp.weight)}</div>
                          </div>
                          <div style={{marginTop:8}}>
                            <div style={{fontSize:10,color:"#aaa",marginBottom:3}}>Contact time (ms) <span style={{color:"#555",fontSize:9}}>— optional · for RSI</span></div>
                            <input type="number" inputMode="numeric" value={inp.ctTime||""}
                              onChange={e=>setInput(lift.name,"ctTime",e.target.value)}
                              placeholder="e.g. 250"
                              style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e8e8e8",fontSize:13,fontFamily:"Georgia,serif",textAlign:"center",background:"#fafafa",boxSizing:"border-box",color:"#888"}}/>
                          </div>
                          {inp.weight&&(
                            <div style={{textAlign:"center",fontSize:11,color:"#aaa",marginTop:6,display:"flex",gap:12,justifyContent:"center",alignItems:"center",flexWrap:"wrap"}}>
                              <span>Jump: <span style={{color:PUR,fontWeight:700}}>{inp.weight} in</span></span>
                              {inp.ctTime&&parseFloat(inp.ctTime)>0&&<span>RSI: <span style={{color:GOLD,fontWeight:700}}>{parseFloat(((parseFloat(inp.weight)*0.0254)/(parseFloat(inp.ctTime)/1000)).toFixed(2))}</span></span>}
                              {pr&&parseFloat(inp.weight)>pr&&<span style={{background:PUR,color:"#fff",padding:"1px 6px",borderRadius:4,fontSize:10,fontWeight:700}}>NEW PR!</span>}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // ── WEIGHT OR KETTLEBELL ─────────────────────────
                    if(itype==="weight_kb"){
                      const useKB=!!inp.useKB;
                      return(
                        <div>
                          <div style={{display:"flex",gap:6,marginBottom:12}}>
                            <button onClick={()=>{setInput(lift.name,"useKB",false);setInput(lift.name,"kbColor","");}}
                              style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid "+((!useKB)?tc.border:"#252525"),
                                background:(!useKB)?tc.bg:"#0a0a0a",color:(!useKB)?tc.color:"#555",
                                fontSize:12,fontWeight:(!useKB)?700:400,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                              Weight (lbs)
                            </button>
                            <button onClick={()=>{setInput(lift.name,"useKB",true);setInput(lift.name,"weight","");}}
                              style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid "+(useKB?tc.border:"#252525"),
                                background:useKB?tc.bg:"#0a0a0a",color:useKB?tc.color:"#555",
                                fontSize:12,fontWeight:useKB?700:400,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                              Kettlebell
                            </button>
                          </div>
                          {useKB?(
                            <div>
                              {kbPicker()}
                              <div style={{display:"flex",gap:8,alignItems:"flex-end",marginTop:4}}>
                                {repsInput}
                                <div>{logBtn(!inp.weight)}</div>
                              </div>
                              {inp.weight&&inp.reps&&<div style={{textAlign:"center",fontSize:11,color:"#444",marginTop:6,padding:"5px",background:"#0a0a0a",borderRadius:7,border:"0.5px solid #1a1a1a"}}>est. 1RM: <span style={{color:GOLD,fontWeight:800}}>{epley(parseFloat(inp.weight)||0,parseInt(inp.reps)||1)} lbs</span>{pr&&epley(parseFloat(inp.weight)||0,parseInt(inp.reps)||1)>pr&&<span style={{marginLeft:8,background:GOLD,color:"#000",padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:700}}>NEW PR!</span>}</div>}
                            </div>
                          ):(
                            <div>
                              <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
                                <div style={{flex:1}}>
                                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                                    <div style={{fontSize:9,color:"#555",textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:600}}>Weight (lbs)</div>
                                    <button onClick={()=>toggleBW(lift.name)}
                                      style={{fontSize:9,padding:"3px 8px",borderRadius:6,
                                        border:"1px solid "+(inp.bw?GREEN+"55":"#252525"),
                                        background:inp.bw?GREEN+"22":"#0f0f0f",
                                        color:inp.bw?GREEN:"#444",cursor:"pointer",
                                        fontFamily:"Georgia,serif",fontWeight:inp.bw?700:400}}>
                                      ⚖️ BW{latestBW?" ("+latestBW+")":""}
                                    </button>
                                  </div>
                                  <input type="number" inputMode="decimal"
                                    value={inp.weight||""}
                                    readOnly={!!inp.bw}
                                    onChange={e=>!inp.bw&&setInput(lift.name,"weight",e.target.value)}
                                    placeholder={inp.bw&&!latestBW?"Log weight first":last?`Last: ${last}`:"0"}
                                    style={{width:"100%",padding:"11px",borderRadius:9,
                                      border:"1px solid "+(inp.bw?GREEN+"55":"#252525"),
                                      fontSize:16,fontFamily:"Georgia,serif",textAlign:"center",
                                      background:inp.bw?"#091510":"#0f0f0f",
                                      color:inp.bw?GREEN:"#fff",
                                      boxSizing:"border-box",fontWeight:700}}/>
                                </div>
                                {repsInput}
                                <div>
                                  <button onClick={()=>saveLog(lift.name,lift.tier)} disabled={!inp.weight||isSaving}
                                    style={{padding:"11px 16px",borderRadius:9,border:"none",
                                      background:inp.weight?(isSaved?"#1E6B3A":tc.border):"#1a1a1a",
                                      color:inp.weight?"#fff":"#333",fontSize:13,fontWeight:700,
                                      cursor:inp.weight?"pointer":"not-allowed",fontFamily:"Georgia,serif",minWidth:56,
                                      boxShadow:inp.weight&&!isSaved?"0 2px 8px "+tc.border+"44":"none",transition:"all 0.15s"}}>
                                    {isSaved?"✓":isSaving?"…":"Log"}
                                  </button>
                                </div>
                              </div>
                              {inp.weight&&inp.reps&&(
                                <div style={{textAlign:"center",fontSize:11,color:"#444",marginTop:8,padding:"6px",background:"#0a0a0a",borderRadius:8,border:"0.5px solid #1a1a1a"}}>
                                  est. 1RM: <span style={{color:GOLD,fontWeight:800}}>{epley(parseFloat(inp.weight)||0,parseInt(inp.reps)||1)} lbs</span>
                                  {pr&&epley(parseFloat(inp.weight)||0,parseInt(inp.reps)||1)>pr&&
                                    <span style={{marginLeft:8,background:GOLD,color:"#000",padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:700}}>NEW PR!</span>
                                  }
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // ── STANDARD WEIGHT + REPS (default) ────────────
                    return(
                      <div>
                        <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
                          <div style={{flex:1}}>
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                              <div style={{fontSize:9,color:"#555",textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:600}}>Weight (lbs)</div>
                              <button onClick={()=>toggleBW(lift.name)}
                                style={{fontSize:9,padding:"3px 8px",borderRadius:6,
                                  border:"1px solid "+(inp.bw?GREEN+"55":"#252525"),
                                  background:inp.bw?GREEN+"22":"#0f0f0f",
                                  color:inp.bw?GREEN:"#444",cursor:"pointer",
                                  fontFamily:"Georgia,serif",fontWeight:inp.bw?700:400}}>
                                ⚖️ BW{latestBW?" ("+latestBW+")":""}
                              </button>
                            </div>
                            <input type="number" inputMode="decimal"
                              value={inp.weight||""}
                              readOnly={!!inp.bw}
                              onChange={e=>!inp.bw&&setInput(lift.name,"weight",e.target.value)}
                              placeholder={inp.bw&&!latestBW?"Log weight first":last?`Last: ${last}`:"0"}
                              style={{width:"100%",padding:"11px",borderRadius:9,
                                border:"1px solid "+(inp.bw?GREEN+"55":"#252525"),
                                fontSize:16,fontFamily:"Georgia,serif",textAlign:"center",
                                background:inp.bw?"#091510":"#0f0f0f",
                                color:inp.bw?GREEN:"#fff",
                                boxSizing:"border-box",fontWeight:700}}/>
                          </div>
                          {repsInput}
                          <div>
                            <button onClick={()=>saveLog(lift.name,lift.tier)} disabled={!inp.weight||isSaving}
                              style={{padding:"11px 16px",borderRadius:9,border:"none",
                                background:inp.weight?(isSaved?"#1E6B3A":tc.border):"#1a1a1a",
                                color:inp.weight?"#fff":"#333",fontSize:13,fontWeight:700,
                                cursor:inp.weight?"pointer":"not-allowed",fontFamily:"Georgia,serif",minWidth:56,
                                boxShadow:inp.weight&&!isSaved?"0 2px 8px "+tc.border+"44":"none",transition:"all 0.15s"}}>
                              {isSaved?"✓":isSaving?"…":"Log"}
                            </button>
                          </div>
                        </div>
                        {inp.weight&&inp.reps&&(
                          <div style={{textAlign:"center",fontSize:11,color:"#444",marginTop:8,padding:"6px",background:"#0a0a0a",borderRadius:8,border:"0.5px solid #1a1a1a"}}>
                            est. 1RM: <span style={{color:GOLD,fontWeight:800}}>{epley(parseFloat(inp.weight)||0,parseInt(inp.reps)||1)} lbs</span>
                            {pr&&epley(parseFloat(inp.weight)||0,parseInt(inp.reps)||1)>pr&&
                              <span style={{marginLeft:8,background:GOLD,color:"#000",padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:700}}>NEW PR!</span>
                            }
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                {liftHistory.length>0&&lift.inputType!=="bodyweight"&&(
                  <div>
                    <button onClick={()=>setExpanded(isExpanded?null:lift.name)} style={{width:"100%",padding:"9px 14px",background:"#0d0d0d",border:"none",borderTop:"0.5px solid #1a1a1a",fontSize:11,color:"#444",cursor:"pointer",fontFamily:"Georgia,serif",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontWeight:500}}>History <span style={{color:"#333"}}>({liftHistory.length} sessions)</span></span><span style={{fontSize:9}}>{isExpanded?"▲":"▼"}</span>
                    </button>
                    {isExpanded&&(
                      <div style={{padding:"8px 14px",background:"#0d0d0d",borderTop:"0.5px solid #1a1a1a"}}>
                        {liftHistory.slice(0,5).map((h,hi)=>(
                          <div key={hi} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:hi<Math.min(liftHistory.length,5)-1?"0.5px solid #1a1a1a":"none"}}>
                            <div style={{fontSize:11,color:"#444"}}>{new Date(h.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>
                            <div style={{fontSize:12,fontWeight:700,color:"#ccc"}}>{h.weight} lbs × {h.reps||1} {itype==="kb2_yards"?"yards":"reps"}</div>
                            {h.weight===pr&&<div style={{fontSize:10,color:GOLD,fontWeight:700}}>PR 🏆</div>}
                            {confirmDelete===h.id?(
                              <div style={{display:"flex",gap:4,marginLeft:4}}>
                                <button onClick={()=>deleteLog(h.id,lift.name)} style={{fontSize:11,padding:"4px 8px",borderRadius:6,border:"none",background:RED,color:"#fff",cursor:"pointer",fontFamily:"Georgia,serif"}}>Delete</button>
                                <button onClick={()=>setConfirmDelete(null)} style={{fontSize:11,padding:"4px 8px",borderRadius:6,border:"0.5px solid #252525",background:"#1a1a1a",color:"#666",cursor:"pointer",fontFamily:"Georgia,serif"}}>Cancel</button>
                              </div>
                            ):(
                              <button onClick={()=>setConfirmDelete(h.id)} disabled={deleting===h.id} style={{fontSize:12,padding:"4px 10px",borderRadius:6,border:"0.5px solid "+RED+"44",background:"#1a0808",color:RED,cursor:"pointer",fontFamily:"Georgia,serif",marginLeft:4,minWidth:36}}>
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
            <div style={{background:"#111",borderRadius:14,padding:"2.5rem",textAlign:"center",border:"0.5px solid #1e1e1e"}}>
              <div style={{marginBottom:10,display:"flex",justifyContent:"center"}}><Icon name="barbell" size={36} color="#555"/></div>
              <div style={{fontSize:14,color:"#555",fontWeight:500}}>No lifts programmed for {DAY_LABELS[activeDay]} yet.</div>
              <div style={{fontSize:12,color:"#333",marginTop:4}}>Coach Ant will update the program soon.</div>
            </div>
          )}
        </div>
      )}

      {/* ── WEEK VIEW ───────────────────────────────────────── */}
      {view==="week"&&(
        <div>
          {phase&&(
            <div style={{background:"linear-gradient(135deg,#1a1200,#1c1500,#0e0e0e)",borderRadius:14,padding:"16px 18px",marginBottom:14,border:"1px solid "+GOLD+"33",borderLeft:"3px solid "+GOLD,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-18,right:-12,fontSize:80,opacity:0.05,lineHeight:1,userSelect:"none",pointerEvents:"none"}}>⚡</div>
              <div style={{fontSize:9,color:GOLD+"99",textTransform:"uppercase",letterSpacing:"0.14em",fontWeight:700,marginBottom:5}}>Current Phase</div>
              <div style={{fontSize:19,fontWeight:800,color:"#fff",letterSpacing:"-0.02em",lineHeight:1.2}}>{phase}</div>
            </div>
          )}
          {DAYS.map(day=>{
            const dayLifts=(program&&program[day])||[];
            const isToday=day===defaultDay;
            return(
              <div key={day} style={{background:"#111",borderRadius:14,marginBottom:12,border:"1px solid #1e1e1e",borderLeft:"3px solid "+(isToday?GOLD:"#333"),overflow:"hidden"}}>
                {/* Day header */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px 10px",borderBottom:"0.5px solid #1a1a1a"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{fontSize:15,fontWeight:800,color:"#fff"}}>{DAY_LABELS[day]||day}</div>
                    {isToday&&(
                      <div style={{fontSize:9,fontWeight:700,color:"#000",background:GOLD,padding:"2px 7px",borderRadius:10,letterSpacing:"0.06em"}}>Today</div>
                    )}
                  </div>
                  <button onClick={()=>{setActiveDay(day);setView("log");}}
                    style={{fontSize:12,fontWeight:700,color:GOLD,background:"transparent",border:"1px solid "+GOLD+"55",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontFamily:"Georgia,serif",letterSpacing:"0.04em"}}>
                    Log →
                  </button>
                </div>
                {/* Lift list */}
                <div style={{padding:"8px 0"}}>
                  {dayLifts.length===0?(
                    <div style={{padding:"10px 14px",fontSize:12,color:"#444",fontStyle:"italic"}}>No lifts programmed yet.</div>
                  ):dayLifts.map((lift,li)=>{
                    const tc=TIER_COLORS[lift.tier]||TIER_COLORS[1];
                    const tierKey=lift.tier;
                    const badgeLabel=
                      tierKey===1?"T1":
                      tierKey===2?"T2":
                      tierKey===3?"T3":
                      tierKey==="circuit"?"CIRC":
                      tierKey==="guns_and_glory"?"G&G":"—";
                    return(
                      <div key={li} style={{display:"flex",alignItems:"center",gap:0,borderBottom:li<dayLifts.length-1?"0.5px solid #161616":"none"}}>
                        {/* Left tier color bar */}
                        <div style={{width:3,alignSelf:"stretch",background:tc.border,flexShrink:0,minHeight:38}}/>
                        {/* Lift info */}
                        <div style={{flex:1,padding:"9px 10px"}}>
                          <div style={{fontSize:12,color:"#ccc",fontWeight:600,lineHeight:1.2}}>{lift.name}</div>
                          {lift.sets&&<div style={{fontSize:10,color:"#444",marginTop:2}}>{lift.sets}</div>}
                        </div>
                        {/* Right tier badge */}
                        <div style={{padding:"0 12px",flexShrink:0}}>
                          <div style={{fontSize:9,fontWeight:700,color:tc.color,background:tc.bg,padding:"3px 7px",borderRadius:5,border:"0.5px solid "+tc.border+"55",letterSpacing:"0.05em"}}>
                            {badgeLabel}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── DASHBOARD VIEW ──────────────────────────────────── */}
      {view==="dashboard"&&(
        <div>
          {allLiftNames.length===0?(
            <EmptyState icon="barChart" color={ORANGE} title="No lift data yet" hint="Log sessions in the Log tab to see your strength dashboard." />
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
                        strokeDasharray={`${(powerIndex/100)*226.2} 226.2`}
                        strokeLinecap="round"
                        style={{filter:`drop-shadow(0 0 6px ${piCol}88)`,transition:"stroke-dasharray 0.6s ease"}}/>
                    </svg>
                    <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                      <div style={{fontSize:22,fontWeight:900,color:piCol,lineHeight:1}}>{powerIndex}</div>
                      <div style={{fontSize:8,color:"#555",marginTop:1}}>/ 100</div>
                    </div>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:9,color:"#555",textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:4}}>TF Power Index</div>
                    <div style={{fontSize:20,fontWeight:900,color:"#fff",lineHeight:1.1,marginBottom:6}}>
                      {powerIndex>=90?"Elite level":powerIndex>=70?"Above average":powerIndex>=50?"Building strength":"Getting started"}
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {CATS.map(c=>{
                        const has=catPRs[c.id]!=null;
                        const pct=has?Math.round(Math.min(1,catPRs[c.id]/getRef(c.id))*100):0;
                        return(
                          <div key={c.id} style={{display:"flex",alignItems:"center",gap:3,padding:"3px 8px",borderRadius:6,background:has?"#1a1a1a":"#111",border:"0.5px solid "+(has?piCol+"44":"#1a1a1a")}}>
                            <Icon name={c.id} size={10} color={has?piCol:"#444"}/>
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
                    const pct=has?Math.min(1,catPRs[c.id]/getRef(c.id)):0;
                    return(
                      <div key={c.id} style={{flex:1}}>
                        <div style={{height:3,background:"#1a1a1a",borderRadius:2,overflow:"hidden"}}>
                          <div style={{height:"100%",width:(pct*100)+"%",background:has?piCol:"#333",borderRadius:2,transition:"width 0.5s ease"}}/>
                        </div>
                        <div style={{marginTop:3,display:"flex",justifyContent:"center"}}><Icon name={c.id} size={8} color={has?"#555":"#333"}/></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── PR Board ── */}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,color:"#888",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>🏆 Personal Records · Est. 1RM</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {(currentLiftNames.length>0?currentLiftNames:allLiftNames).map(name=>{
                    const pr=liftPRs[name];
                    const catId=getCat(name);
                    const catObj=CATS.find(c=>c.id===catId);
                    const vert=isVert(name);
                    const excl=EXCLUDED_CATS.has(name.toLowerCase());
                    const isSel=selLift===name;
                    const rel=!vert&&!excl?relStrength[name]:null;
                    const rank=catId&&catRanks[catId];
                    const allOrms=(logs[name]||[]).map(e=>epley(parseFloat(e.weight)||0,parseInt(e.reps)||1));
                    const delta=allOrms.length>1?pr.orm-allOrms[1]:null;
                    return(
                      <div key={name} onClick={()=>setSelLift(isSel?null:name)}
                        style={{padding:"12px",background:isSel?"#1a1914":"#111",borderRadius:12,
                          border:"1px solid "+(isSel?(vert?PUR+"55":GOLD+"44"):"#1e1e1e"),cursor:"pointer",
                          boxShadow:isSel?"0 0 16px "+(vert?PUR:GOLD)+"22":"none",position:"relative",overflow:"hidden"}}>
                        {isSel&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,"+(vert?PUR:GOLD)+",transparent)"}}/>}
                        <div style={{fontSize:9,color:"#444",marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {name}
                        </div>
                        <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:2}}>
                          <div style={{fontSize:24,fontWeight:900,color:isSel?GOLD:"#ddd",lineHeight:1}}>{vert?pr.weight:pr.orm}</div>
                          {rel&&<div style={{fontSize:10,color:GOLD,fontWeight:600}}>{rel}×BW</div>}
                        </div>
                        <div style={{fontSize:9,color:"#555"}}>
                          {vert?`${pr.weight} in · personal best`:excl?"logged · not in Power Index":`${pr.weight}×${pr.reps||1} · est. 1RM`}
                        </div>
                        {/* Tier / vert / excl badge */}
                        {vert?(
                          <div style={{display:"inline-block",marginTop:5,padding:"2px 8px",borderRadius:6,background:PUR+"22",color:isSel?"#cbb6ff":PUR,fontSize:9,fontWeight:700}}>⬆️ Vertical</div>
                        ):excl?(
                          <div style={{display:"inline-block",marginTop:5,padding:"2px 8px",borderRadius:6,background:"#1a1a1a",color:"#555",fontSize:9,fontWeight:500}}>Core / Power</div>
                        ):catObj&&catPRs[catId]&&(()=>{
                          const catPct=Math.round(catPRs[catId]/getRef(catId)*100);
                          const t=strTier(catPct);
                          return(
                            <div style={{display:"inline-block",marginTop:5,padding:"2px 8px",borderRadius:6,background:isSel?t.bg+"88":t.bg,color:t.color,fontSize:9,fontWeight:700,letterSpacing:"0.04em"}}>
                              {t.label}
                            </div>
                          );
                        })()}
                        {/* Delta badge */}
                        {delta!==null&&(
                          <div style={{position:"absolute",top:10,right:10,fontSize:10,fontWeight:700,
                            color:delta>0?GREEN:delta<0?RED:"#aaa"}}>
                            {delta>0?"↑+":delta<0?"↓":""}{delta!==0?Math.abs(delta):"—"}
                          </div>
                        )}
                        {/* Plain-language team rank */}
                        {rank&&teamLoaded&&(
                          <div style={{marginTop:4,fontSize:9,color:isSel?"#555":rank.rank<=3?GOLD:"#aaa",fontWeight:rank.rank<=3?700:400,lineHeight:1.4}}>
                            {rankMedal(rank.rank)&&rankMedal(rank.rank)+" "}{rank.rank}{rankSuffix(rank.rank)} on your team{rank.pct!=null?" · top "+(rank.pct<5?5:rank.pct<10?10:Math.round(rank.pct/10)*10+1)+"% of "+genderLabel.toLowerCase():""}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Prior phase collapsible ── */}
              {priorLiftNames.length>0&&(
                <div style={{marginBottom:14}}>
                  <button onClick={()=>setShowPriorPhase(p=>!p)}
                    style={{width:"100%",padding:"10px 14px",borderRadius:10,
                      border:"1px solid #1e1e1e",background:"#111",
                      color:"#555",fontSize:12,fontWeight:600,cursor:"pointer",
                      fontFamily:"Georgia,serif",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                    <span>📦 Phase History <span style={{fontWeight:400,color:"#444"}}>· {priorLiftNames.length} lift{priorLiftNames.length!==1?"s":""} from prior programs</span></span>
                    <span style={{color:"#444",fontSize:10}}>{showPriorPhase?"▲ hide":"▼ show"}</span>
                  </button>
                  {showPriorPhase&&(
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
                      {priorLiftNames.map(name=>{
                        const pr=liftPRs[name];
                        const catId=getCat(name);
                        const catObj=CATS.find(c=>c.id===catId);
                        const excl=EXCLUDED_CATS.has(name.toLowerCase());
                        return(
                          <div key={name} style={{padding:"10px 12px",background:"#111",borderRadius:10,
                            border:"0.5px solid #1e1e1e"}}>
                            <div style={{fontSize:9,color:"#444",marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                              {name}
                            </div>
                            <div style={{fontSize:20,fontWeight:900,color:"#666",lineHeight:1}}>
                              {excl?pr?.weight:pr?.orm}
                            </div>
                            <div style={{fontSize:9,color:"#333",marginTop:2}}>
                              {excl?"logged · prior phase":"est. 1RM · prior phase"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

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
                <div style={{textAlign:"center",fontSize:11,color:"#444",marginBottom:14,padding:"10px",background:"#0a0a0a",borderRadius:8,border:"0.5px solid #1a1a1a"}}>
                  Tap any lift card to see its trend chart
                </div>
              )}

              {/* ── Radar chart ── */}
              {activeCats.length>=3&&(
                <div style={{background:"#111",borderRadius:14,padding:"1.25rem",border:"0.5px solid #1e1e1e"}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:2}}>📡 Strength Profile</div>
                  <div style={{fontSize:11,color:"#555",marginBottom:14}}>
                    Outer ring = elite (40% above avg) · <span style={{color:piCol+"99"}}>dashed = team avg</span>
                  </div>
                  <svg viewBox="0 0 200 200" style={{width:"100%",maxWidth:260,display:"block",margin:"0 auto"}}>
                    {[0.25,0.5,0.75,1.0].map((r,ri)=>(
                      <polygon key={ri}
                        points={activeCats.map((_,i)=>{const[x,y]=rPt(i,r*RR);return`${x},${y}`;}).join(" ")}
                        fill="none" stroke={ri===3?"#252525":"#1e1e1e"} strokeWidth="1"/>
                    ))}
                    {/* Team average ring */}
                    <polygon points={rAvgPts} fill={piCol+"08"} stroke={piCol+"55"} strokeWidth="1.5" strokeDasharray="4,3"/>
                    {activeCats.map((_,i)=>{
                      const[x,y]=rPt(i,RR);
                      return<line key={i} x1={RCX} y1={RCY} x2={x} y2={y} stroke="#1e1e1e" strokeWidth="1"/>;
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
                        <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="9.5" fill="#888" fontFamily="Georgia">
                          {c.label}
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
                      const pct=Math.round(catPRs[c.id]/getRef(c.id)*100);
                      const rank=catRanks[c.id];
                      const rel=latestBW?parseFloat((catPRs[c.id]/latestBW).toFixed(2)):null;
                      const t=strTier(pct);
                      return(
                        <div key={i} style={{padding:"10px 12px",background:"#0f0f0f",borderRadius:10,border:"1px solid "+t.color+"22",borderLeft:"3px solid "+t.color}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                            <div style={{fontSize:11,fontWeight:600,color:"#ccc",display:"flex",alignItems:"center",gap:5}}><Icon name={c.id} size={11} color="#888"/>{c.label}</div>
                            <div style={{padding:"2px 8px",borderRadius:6,background:t.bg,color:t.color,fontSize:9,fontWeight:700}}>{t.label}</div>
                          </div>
                          <div style={{fontSize:20,fontWeight:900,color:"#fff",lineHeight:1,marginBottom:2}}>{catPRs[c.id]} <span style={{fontSize:10,color:"#555",fontWeight:400}}>lbs</span></div>
                          {rel&&<div style={{fontSize:9,color:GOLD,fontWeight:600,marginBottom:4}}>{rel}× bodyweight</div>}
                          <div style={{height:3,background:"#1a1a1a",borderRadius:2,overflow:"hidden",marginBottom:6}}>
                            <div style={{width:pct+"%",height:"100%",background:"linear-gradient(90deg,"+t.color+","+t.color+"88)",borderRadius:2}}/>
                          </div>
                          <div style={{fontSize:9,color:"#444",marginBottom:rank&&teamLoaded?4:0}}>
                            {pct}% of {teamAvgRefs[c.id]?`team avg (${teamAvgRefs[c.id]} lbs)`:`baseline (${getRef(c.id)} lbs — team data pending)`}
                          </div>
                          {rank&&teamLoaded&&(
                            <div style={{fontSize:9,fontWeight:rank.rank<=3?700:400,color:rank.rank<=3?GOLD:"#555"}}>
                              {rankMedal(rank.rank)&&rankMedal(rank.rank)+" "}{rank.rank}{rankSuffix(rank.rank)} on your team{rank.pct!=null?" · top "+(rank.pct<5?5:rank.pct<10?10:Math.round(rank.pct/10)*10+1)+"% of "+genderLabel.toLowerCase():""}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{fontSize:9,color:"#444",textAlign:"center",marginTop:10}}>{genderLabel} team averages · {teamLoaded?`${Object.keys(teamAvgRefs).length} categories computed from group data`:"loading team data..."}</div>
                </div>
              )}
              {activeCats.length<3&&activeCats.length>0&&(
                <div style={{background:"#0a0a0a",borderRadius:10,padding:"14px 16px",border:"0.5px solid #1a1a1a",textAlign:"center"}}>
                  <div style={{fontSize:11,color:"#555"}}>Log lifts in at least 3 movement categories to unlock the strength profile chart.</div>
                  <div style={{fontSize:10,color:"#333",marginTop:4}}>Categories: Lower Body, Push, Pull, Hinge</div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
