import { useState, useEffect } from "react";
import { BG, RED, GREEN, GOLD, STEEL, ORANGE, PUR } from "../lib/constants";
import { supabase } from "../lib/supabase";

const DAYS=["Mon","Tue","Thu","Fri"];
const DAY_LABELS={Mon:"Monday",Tue:"Tuesday",Thu:"Thursday",Fri:"Friday"};
const TIER_COLORS={
  1:{bg:"#EEEDFE",border:PUR,color:PUR,label:"Tier 1 — Primary"},
  2:{bg:"#E1F5EE",border:GREEN,color:GREEN,label:"Tier 2 — Secondary"},
  3:{bg:"#FFF4E0",border:ORANGE,color:ORANGE,label:"Tier 3 — Accessory"},
  circuit:{bg:"#FFF0F0",border:RED,color:RED,label:"Circuit · 3 Rounds · 30s on / 15s off"},
  guns_and_glory:{bg:"#FFFBE0",border:GOLD,color:GOLD,label:"Guns & Glory"},
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
    {name:"SL/Pistol Squat",               tier:2,sets:"3x7e",                   inputType:"weight"},
    {name:"DB/KB Kickstand Hinge",         tier:2,sets:"3x8e",                   inputType:"kb"},
    {name:"DB Chest Supported Row",        tier:2,sets:"3x10e",                  inputType:"weight"},
    {name:"Cable Rope Trunk Rotation",     tier:3,sets:"3x10e",                  inputType:"weight"},
    {name:"Dragon Flag",                   tier:3,sets:"3x9",                    inputType:"bodyweight"},
    {name:"KB Farmer & Waiter Carry",      tier:3,sets:"3x20yds",               inputType:"kb"},
  ],
  Thu:[
    {name:"SA Banded Rot. Jammer Press",   tier:1,sets:"4x5e",                   inputType:"band_weight"},
    {name:"SA Lat Pull Down",              tier:1,sets:"4x14e",                  inputType:"weight"},
    {name:"DB Pronated Trap Raise",        tier:1,sets:"3x15",                   inputType:"weight"},
    {name:"Heavy Prowler Sprint",          tier:2,sets:"4x20yds",               inputType:"weight"},
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
  {id:"lower", label:"Lower Body", emoji:"🦵", ref:225, w:0.30},
  {id:"push",  label:"Push",       emoji:"💪", ref:175, w:0.20},
  {id:"pull",  label:"Pull",       emoji:"🤜", ref:155, w:0.15},
  {id:"hinge", label:"Hinge",      emoji:"⛓️", ref:255, w:0.35},
];
const CATS_F=[
  {id:"lower", label:"Lower Body", emoji:"🦵", ref:145, w:0.30},
  {id:"push",  label:"Push",       emoji:"💪", ref:95,  w:0.20},
  {id:"pull",  label:"Pull",       emoji:"🤜", ref:85,  w:0.15},
  {id:"hinge", label:"Hinge",      emoji:"⛓️", ref:165, w:0.35},
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
  const[teamAthletes,setTeamAthletes]=useState([]);
  const[latestBW,setLatestBW]=useState(null);
  const[teamLoaded,setTeamLoaded]=useState(false);
  const[bwDone,setBwDone]=useState({});

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
  const isFemale=gender==="female"||gender==="Female"||gender==="F"||gender==="f"||gender==="woman"||gender==="Woman";
  const CATS=isFemale?CATS_F:CATS_M;
  const genderLabel=isFemale?"Women's":"Men's";

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

  // Radar
  const N=activeCats.length;
  const RCX=100,RCY=100,RR=70;
  const rAngle=(i)=>(2*Math.PI*i/Math.max(N,1))-Math.PI/2;
  const rPt=(i,r)=>[RCX+r*Math.cos(rAngle(i)),RCY+r*Math.sin(rAngle(i))];
  const rScores=activeCats.map(c=>Math.min(1,catPRs[c.id]/getRef(c.id)));
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
                      {lift.sets&&<div style={{fontSize:11,color:"#888",marginTop:2}}>📋 {lift.sets}</div>}
                      {lift.note&&<div style={{fontSize:10,color:"#aaa",marginTop:1,fontStyle:"italic"}}>{lift.note}</div>}
                    </div>
                    <div style={{textAlign:"right"}}>
                      {lift.inputType!=="bodyweight"&&pr&&<div style={{fontSize:12,fontWeight:700,color:GOLD}}>PR: {pr} {isVert(lift.name)?"in":"lbs"}</div>}
                      {lift.inputType!=="bodyweight"&&last&&<div style={{fontSize:11,color:"#aaa"}}>Last: {last} {isVert(lift.name)?"in":"lbs"}</div>}
                    </div>
                  </div>
                  {(()=>{
                    const itype=lift.inputType||"weight";
                    const selBand=inp.bandColor?BAND_COLORS.find(b=>b.id===inp.bandColor):null;
                    const logBtn=(disabled)=>(
                      <button onClick={()=>saveLog(lift.name,lift.tier)} disabled={disabled||isSaving}
                        style={{padding:"10px 14px",borderRadius:8,border:"none",
                          background:!disabled?(isSaved?GREEN:tc.border):"#e0e0e0",
                          color:!disabled?"#fff":"#aaa",fontSize:13,fontWeight:700,
                          cursor:!disabled?"pointer":"not-allowed",fontFamily:"Georgia,serif",minWidth:52}}>
                        {isSaved?"✓":isSaving?"...":"Log"}
                      </button>
                    );
                    const repsInput=(
                      <div style={{flex:1}}>
                        <div style={{fontSize:10,color:"#aaa",marginBottom:3}}>Reps</div>
                        <input type="number" inputMode="numeric" value={inp.reps||""}
                          onChange={e=>setInput(lift.name,"reps",e.target.value)}
                          placeholder="0"
                          style={{width:"100%",padding:"10px",borderRadius:8,border:"1px solid #e0e0e0",fontSize:15,fontFamily:"Georgia,serif",textAlign:"center",background:"#fafafa",boxSizing:"border-box",fontWeight:600}}/>
                      </div>
                    );
                    const bandPicker=(label)=>(
                      <div style={{marginBottom:10}}>
                        <div style={{fontSize:10,color:"#aaa",marginBottom:6}}>{label||"Band Resistance"}</div>
                        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                          {BAND_COLORS.map(b=>{
                            const sel=inp.bandColor===b.id;
                            return(
                              <button key={b.id} onClick={()=>setInput(lift.name,"bandColor",b.id)}
                                style={{display:"flex",alignItems:"center",gap:5,padding:"6px 10px",borderRadius:8,
                                  border:"1.5px solid "+(sel?b.hex:"#e0e0e0"),
                                  background:sel?b.hex+"18":"#fafafa",
                                  color:sel?b.hex:"#888",fontSize:11,fontWeight:sel?700:400,
                                  cursor:"pointer",fontFamily:"Georgia,serif",whiteSpace:"nowrap"}}>
                                <div style={{width:9,height:9,borderRadius:"50%",background:b.hex,flexShrink:0,border:"1px solid "+b.hex+"88"}}/>
                                {b.label}
                                <span style={{fontSize:9,color:sel?b.hex+"aa":"#ccc"}}>{b.resistance}</span>
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
                          <div style={{flex:1,padding:"10px 14px",borderRadius:8,background:"#f5f5f5",border:"0.5px solid #e8e8e8",fontSize:12,color:"#aaa",fontStyle:"italic"}}>
                            Body Weight — isometrics / endurance
                          </div>
                          <button onClick={()=>setBwDone(p=>({...p,[lift.name]:!p[lift.name]}))}
                            style={{padding:"10px 16px",borderRadius:8,border:"none",
                              background:done?GREEN:"#e0e0e0",color:done?"#fff":"#888",
                              fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif",whiteSpace:"nowrap"}}>
                            {done?"✓ Done":"Mark Done"}
                          </button>
                        </div>
                      );
                    }

                    // ── MEDICINE BALL ────────────────────────────────
                    if(itype==="mb"){
                      return(
                        <div>
                          <div style={{fontSize:10,color:"#aaa",marginBottom:6}}>Medicine Ball Weight</div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
                            {MB_WEIGHTS.map(w=>{
                              const sel=inp.weight===String(w);
                              return(
                                <button key={w} onClick={()=>setInput(lift.name,"weight",String(w))}
                                  style={{padding:"8px 12px",borderRadius:8,
                                    border:"1.5px solid "+(sel?tc.border:"#e0e0e0"),
                                    background:sel?tc.bg:"#fafafa",
                                    color:sel?tc.color:"#888",
                                    fontSize:12,fontWeight:sel?700:400,
                                    cursor:"pointer",fontFamily:"Georgia,serif"}}>
                                  {w} lbs
                                </button>
                              );
                            })}
                          </div>
                          <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
                            {repsInput}
                            <div style={{paddingBottom:0}}>{logBtn(!inp.weight)}</div>
                          </div>
                          {inp.weight&&inp.reps&&<div style={{textAlign:"center",fontSize:11,color:"#aaa",marginTop:6}}>{inp.weight} lbs × {inp.reps} reps</div>}
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
                              <div style={{fontSize:10,color:"#aaa",marginBottom:3}}>{itype==="band_pallof"?"Cable Weight (lbs)":"Weight (lbs)"}</div>
                              <input type="number" inputMode="decimal" value={inp.weight||""}
                                onChange={e=>setInput(lift.name,"weight",e.target.value)}
                                placeholder={last?`Last: ${last}`:"0"}
                                style={{width:"100%",padding:"10px",borderRadius:8,border:"1px solid #e0e0e0",fontSize:15,fontFamily:"Georgia,serif",textAlign:"center",background:"#fafafa",boxSizing:"border-box",fontWeight:600}}/>
                            </div>
                            {repsInput}
                            <div>{logBtn(!inp.weight)}</div>
                          </div>
                          {selBand&&<div style={{fontSize:10,color:selBand.hex,marginTop:6,fontWeight:600}}>● {selBand.label} · {selBand.resistance}</div>}
                        </div>
                      );
                    }

                    // ── BAND + KETTLEBELL ────────────────────────────
                    if(itype==="band_kb"){
                      return(
                        <div>
                          {bandPicker("Band Resistance")}
                          <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
                            <div style={{flex:1}}>
                              <div style={{fontSize:10,color:"#aaa",marginBottom:3}}>KB Weight (lbs)</div>
                              <input type="number" inputMode="decimal" value={inp.weight||""}
                                onChange={e=>setInput(lift.name,"weight",e.target.value)}
                                placeholder={last?`Last: ${last}`:"0"}
                                style={{width:"100%",padding:"10px",borderRadius:8,border:"1px solid #e0e0e0",fontSize:15,fontFamily:"Georgia,serif",textAlign:"center",background:"#fafafa",boxSizing:"border-box",fontWeight:600}}/>
                            </div>
                            {repsInput}
                            <div>{logBtn(!inp.weight)}</div>
                          </div>
                          {selBand&&<div style={{fontSize:10,color:selBand.hex,marginTop:6,fontWeight:600}}>● {selBand.label} · {selBand.resistance}</div>}
                          {inp.weight&&inp.reps&&<div style={{textAlign:"center",fontSize:11,color:"#aaa",marginTop:4}}>est. 1RM: <span style={{color:GOLD,fontWeight:700}}>{epley(parseFloat(inp.weight)||0,parseInt(inp.reps)||1)} lbs</span></div>}
                        </div>
                      );
                    }

                    // ── KETTLEBELL ───────────────────────────────────
                    if(itype==="kb"){
                      return(
                        <div>
                          <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
                            <div style={{flex:1}}>
                              <div style={{fontSize:10,color:"#aaa",marginBottom:3}}>KB Weight (lbs)</div>
                              <input type="number" inputMode="decimal" value={inp.weight||""}
                                onChange={e=>setInput(lift.name,"weight",e.target.value)}
                                placeholder={last?`Last: ${last}`:"0"}
                                style={{width:"100%",padding:"10px",borderRadius:8,border:"1px solid #e0e0e0",fontSize:15,fontFamily:"Georgia,serif",textAlign:"center",background:"#fafafa",boxSizing:"border-box",fontWeight:600}}/>
                            </div>
                            {repsInput}
                            <div>{logBtn(!inp.weight)}</div>
                          </div>
                          {inp.weight&&inp.reps&&<div style={{textAlign:"center",fontSize:11,color:"#aaa",marginTop:6}}>est. 1RM: <span style={{color:GOLD,fontWeight:700}}>{epley(parseFloat(inp.weight)||0,parseInt(inp.reps)||1)} lbs</span>{pr&&epley(parseFloat(inp.weight)||0,parseInt(inp.reps)||1)>pr&&<span style={{marginLeft:8,background:GOLD,color:"#000",padding:"1px 6px",borderRadius:4,fontSize:10,fontWeight:700}}>NEW PR!</span>}</div>}
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

                    // ── STANDARD WEIGHT + REPS (default) ────────────
                    return(
                      <div>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          <div style={{flex:1}}>
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                              <div style={{fontSize:10,color:"#aaa"}}>Weight (lbs)</div>
                              <button onClick={()=>toggleBW(lift.name)}
                                style={{fontSize:9,padding:"2px 7px",borderRadius:5,
                                  border:"1px solid "+(inp.bw?GREEN:"#ddd"),
                                  background:inp.bw?GREEN+"22":"#f5f5f5",
                                  color:inp.bw?GREEN:"#999",cursor:"pointer",
                                  fontFamily:"Georgia,serif",fontWeight:inp.bw?700:400}}>
                                ⚖️ BW{latestBW?" ("+latestBW+")":""}
                              </button>
                            </div>
                            <input type="number" inputMode="decimal"
                              value={inp.weight||""}
                              readOnly={!!inp.bw}
                              onChange={e=>!inp.bw&&setInput(lift.name,"weight",e.target.value)}
                              placeholder={inp.bw&&!latestBW?"Log weight first":last?`Last: ${last}`:"0"}
                              style={{width:"100%",padding:"10px",borderRadius:8,
                                border:"1px solid "+(inp.bw?GREEN+"55":"#e0e0e0"),
                                fontSize:15,fontFamily:"Georgia,serif",textAlign:"center",
                                background:inp.bw?"#f0fff4":"#fafafa",
                                color:inp.bw?GREEN:"#1a1a1a",
                                boxSizing:"border-box",fontWeight:600}}/>
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:10,color:"#aaa",marginBottom:3}}>Reps</div>
                            <input type="number" inputMode="numeric" value={inp.reps||""}
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
                    );
                  })()}
                </div>
                {liftHistory.length>0&&lift.inputType!=="bodyweight"&&(
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
                      {powerIndex>=90?"Above team average":""}
                      {powerIndex>=70&&powerIndex<90?"Near team average":""}
                      {powerIndex>=50&&powerIndex<70?"Building strength":""}
                      {powerIndex<50?"Just getting started":""}
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {CATS.map(c=>{
                        const has=catPRs[c.id]!=null;
                        const pct=has?Math.round(Math.min(1,catPRs[c.id]/getRef(c.id))*100):0;
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
                    const pct=has?Math.min(1,catPRs[c.id]/getRef(c.id)):0;
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
                    const vert=isVert(name);
                    const excl=EXCLUDED_CATS.has(name.toLowerCase());
                    const isSel=selLift===name;
                    const rel=!vert&&!excl?relStrength[name]:null;
                    const rank=catId&&catRanks[catId];
                    const allOrms=(logs[name]||[]).map(e=>epley(parseFloat(e.weight)||0,parseInt(e.reps)||1));
                    const delta=allOrms.length>1?pr.orm-allOrms[1]:null;
                    return(
                      <div key={name} onClick={()=>setSelLift(isSel?null:name)}
                        style={{padding:"12px",background:isSel?BG:"#fff",borderRadius:12,
                          border:"1px solid "+(isSel?(vert?PUR+"66":GOLD+"66"):"#e8e8e8"),cursor:"pointer",
                          boxShadow:isSel?"0 0 16px "+(vert?PUR:GOLD)+"22":"none",position:"relative",overflow:"hidden"}}>
                        {isSel&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,"+(vert?PUR:GOLD)+",transparent)"}}/>}
                        <div style={{fontSize:9,color:isSel?"#555":"#aaa",marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {vert?"⬆️":catObj?.emoji||"🏋️"} {name}
                        </div>
                        <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:2}}>
                          <div style={{fontSize:24,fontWeight:900,color:isSel?"#fff":"#1a1a1a",lineHeight:1}}>{vert?pr.weight:pr.orm}</div>
                          {rel&&<div style={{fontSize:10,color:isSel?piCol:GOLD,fontWeight:600}}>{rel}×BW</div>}
                        </div>
                        <div style={{fontSize:9,color:isSel?"#555":"#aaa"}}>
                          {vert?`${pr.weight} in · personal best`:excl?"logged · not in Power Index":`${pr.weight}×${pr.reps||1} · est. 1RM`}
                        </div>
                        {/* Tier / vert / excl badge */}
                        {vert?(
                          <div style={{display:"inline-block",marginTop:5,padding:"2px 8px",borderRadius:6,background:isSel?PUR+"44":PUR+"22",color:isSel?"#cbb6ff":PUR,fontSize:9,fontWeight:700}}>⬆️ Vertical</div>
                        ):excl?(
                          <div style={{display:"inline-block",marginTop:5,padding:"2px 8px",borderRadius:6,background:"#f5f5f5",color:"#999",fontSize:9,fontWeight:500}}>Core / Power</div>
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
                      const t=strTier(pct);
                      return(
                        <div key={i} style={{padding:"10px 12px",background:"#f9f9f9",borderRadius:10,border:"1px solid "+t.color+"33"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                            <div style={{fontSize:11,fontWeight:600,color:"#1a1a1a"}}>{c.emoji} {c.label}</div>
                            <div style={{padding:"2px 8px",borderRadius:6,background:t.bg,color:t.color,fontSize:9,fontWeight:700}}>{t.label}</div>
                          </div>
                          <div style={{fontSize:18,fontWeight:900,color:"#1a1a1a",lineHeight:1,marginBottom:2}}>{catPRs[c.id]} <span style={{fontSize:10,color:"#aaa",fontWeight:400}}>lbs</span></div>
                          {rel&&<div style={{fontSize:9,color:GOLD,fontWeight:600,marginBottom:4}}>{rel}× bodyweight</div>}
                          <div style={{height:4,background:"#ebebeb",borderRadius:2,overflow:"hidden",marginBottom:6}}>
                            <div style={{width:pct+"%",height:"100%",background:"linear-gradient(90deg,"+t.color+","+t.color+"88)",borderRadius:2}}/>
                          </div>
                          <div style={{fontSize:9,color:"#aaa",marginBottom:rank&&teamLoaded?4:0}}>{pct}% of {genderLabel.toLowerCase()} team avg{teamAvgRefs[c.id]?` (${teamAvgRefs[c.id]} lbs)`:""}</div>
                          {rank&&teamLoaded&&(
                            <div style={{fontSize:9,fontWeight:rank.rank<=3?700:400,color:rank.rank<=3?GOLD:"#888"}}>
                              {rankMedal(rank.rank)&&rankMedal(rank.rank)+" "}{rank.rank}{rankSuffix(rank.rank)} on your team{rank.pct!=null?" · top "+(rank.pct<5?5:rank.pct<10?10:Math.round(rank.pct/10)*10+1)+"% of "+genderLabel.toLowerCase():""}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{fontSize:9,color:"#ccc",textAlign:"center",marginTop:10}}>{genderLabel} team averages · {teamLoaded?`${Object.keys(teamAvgRefs).length} categories computed from group data`:"loading team data..."}</div>
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
