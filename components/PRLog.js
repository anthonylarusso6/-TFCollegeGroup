import { useState, useEffect, useMemo } from "react";
import { GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { supabase } from "../lib/supabase";
import { isFemale as computeFemale } from "../lib/teams";
import { nowEST } from "../lib/dates";
import Icon from "./Icon";
import { Skeleton, SkeletonList } from "./Skeleton";
import { hSuccess } from "../lib/haptics";
import { pulseMood } from "../lib/ambient";
import { smoothPath } from "../lib/chart";

const DAYS=["Mon","Tue","Thu","Fri"];
const DAY_LABELS={Mon:"Monday",Tue:"Tuesday",Thu:"Thursday",Fri:"Friday"};
// Tier = how the coach ranks the lift. Shown as a colored stripe + chip.
const TIERS={
  1:{c:"#8e7cf0",chip:"T1 · Primary",short:"T1"},
  2:{c:"#3fa577",chip:"T2 · Secondary",short:"T2"},
  3:{c:"#d9822b",chip:"T3 · Accessory",short:"T3"},
  circuit:{c:"#d9534f",chip:"Circuit · 3 rounds · 30s on / 15s off",short:"Circuit"},
  guns_and_glory:{c:"#c9a640",chip:"Guns & Glory",short:"G&G"},
};

// "2026-11-16" → local date. new Date("2026-11-16") is UTC midnight, which
// shows as the previous day on phones in Eastern time.
const pd=(s)=>{const[y,m,d]=String(s).slice(0,10).split("-").map(Number);return new Date(y,m-1,d);};
const fmtD=(s,o={month:"short",day:"numeric"})=>pd(s).toLocaleDateString("en-US",o);

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
    {name:"Heavy Prowler Sprint",          tier:2,sets:"4x20 yards",               inputType:"weight_yards"},
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

export default function PRLog({athleteId,gender,onNavigate}){
  const _estNow=nowEST();
  const today=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][_estNow.getDay()];
  const defaultDay=DAYS.includes(today)?today:"Mon";
  const isClassDay=DAYS.includes(today);
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
  const[sessionDone,setSessionDone]=useState(()=>new Set()); // "day|lift" logged this session (fills the progress ring)
  const[celebrate,setCelebrate]=useState(null); // {lift,value,unit} → PR confetti overlay
  const[showSessionEnd,setShowSessionEnd]=useState(false); // end-of-workout → log weight/habits
  const[sessionEndAcked,setSessionEndAcked]=useState(false); // only prompt once per session

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
          }else{setProgram(DEFAULT_PROGRAM);setPhase("Current Program");}
        }else{setProgram(DEFAULT_PROGRAM);setPhase("Current Program");}
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
  const doneCount=todayLifts.filter(l=>sessionDone.has(activeDay+"|"+l.name)||bwDone[l.name]).length;

  const setInput=(liftName,field,val)=>{
    setInputs(prev=>({...prev,[liftName]:{...prev[liftName],[field]:val}}));
  };
  // Step a numeric input up/down (weight in 5s, reps in 1s), floored at 0.
  const bump=(liftName,field,dir,step)=>{
    const cur=parseFloat((inputs[liftName]||{})[field])||0;
    const next=Math.max(0,Math.round((cur+dir*step)*100)/100);
    setInput(liftName,field,String(next));
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
    // Snapshot the current best BEFORE inserting, so we can tell if this set is a PR.
    const prevOrmPR=getOrmPR(liftName);
    const prevWeightPR=getPR(liftName);
    const liftObj=todayLifts.find(l=>l.name===liftName);
    const it=liftObj?.inputType||"weight";
    const vertLift=isVert(liftName);
    // RSI and single-leg vertical track a raw value (higher = better), not an est-1RM.
    const higherIsBetter=vertLift||it==="rsi"||it==="vert_lr";
    const metricUnit=it==="rsi"?"RSI":(it==="vert_lr"||vertLift)?"in":"lbs";
    const newWeight=parseFloat(inp.weight)||0;
    const newReps=parseInt(inp.reps)||1;
    const newOrm=epley(newWeight,newReps);
    setSaving(liftName);
    const estNow=nowEST();
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
      setSessionDone(s=>{const n=new Set(s);n.add(activeDay+"|"+liftName);return n;});
      setSaving(null);setSaved(liftName);setTimeout(()=>setSaved(null),2000);hSuccess();
      // 🏆 New PR? Only celebrate when beating an existing best (avoids confetti on every first-ever log).
      let prHit=null;
      if(higherIsBetter){ if(prevWeightPR!=null&&newWeight>prevWeightPR)prHit={value:newWeight,unit:metricUnit}; }
      else if(prevOrmPR!=null&&newOrm>prevOrmPR)prHit={value:newOrm,unit:"lbs"};
      if(prHit){
        try{if(navigator.vibrate)navigator.vibrate([0,45,55,45,55,90]);}catch(e){}
        setCelebrate({lift:liftName,value:prHit.value,unit:prHit.unit,detail:higherIsBetter?null:("Est. 1RM from "+newWeight+" × "+newReps)});
        pulseMood("celebrate",3400); // the whole room flashes gold
        setTimeout(()=>setCelebrate(c=>(c&&c.lift===liftName?null:c)),3400);
      }
      // End of workout? If this set finished the last programmed lift, prompt weight + habits.
      const doneAfter=todayLifts.filter(l=>{const k=activeDay+"|"+l.name;return sessionDone.has(k)||bwDone[l.name]||l.name===liftName;}).length;
      if(todayLifts.length>0&&doneAfter>=todayLifts.length&&!sessionEndAcked){
        setSessionEndAcked(true);
        setTimeout(()=>setShowSessionEnd(true),prHit?2800:1000);
      }
      // Nudge athlete to log weight if they haven't today
      try{
        const estNow=nowEST();
        const todayStr=estNow.getFullYear()+"-"+String(estNow.getMonth()+1).padStart(2,"0")+"-"+String(estNow.getDate()).padStart(2,"0");
        const{data:wLog}=await supabase.from("weight_log").select("id").eq("athlete_id",athleteId).eq("date",todayStr).maybeSingle();
        if(!wLog){
          fetch("/api/send-notification",{method:"POST",headers:{"Content-Type":"application/json","x-app-secret":process.env.NEXT_PUBLIC_APP_ACTION_SECRET||""},body:JSON.stringify({athleteId,title:"💪 Great session!",body:"Don't forget to log your weight today ⚖️",url:"/athlete"})}).catch(()=>{});
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
  // Best estimated 1RM to date — used for the "NEW PR!" badge so it matches the
  // dashboard's e1RM-based PR definition (not the max raw weight).
  const getOrmPR=(liftName)=>{
    const ll=logs[liftName]||[];
    if(!ll.length)return null;
    return Math.max(...ll.map(l=>epley(parseFloat(l.weight)||0,parseInt(l.reps)||1)));
  };
  const getLast=(liftName)=>(logs[liftName]||[])[0]?.weight||null;

  // What a lift actually measures. RSI, jumps and carries aren't barbell lifts,
  // so they never get an estimated 1RM or a ×bodyweight ratio.
  const inputTypeByName={};
  Object.values(program||{}).flat().forEach(l=>{if(l&&l.name&&!inputTypeByName[l.name])inputTypeByName[l.name]=l.inputType||"weight";});
  const metricOf=(name)=>{
    const it=inputTypeByName[name];const n=(name||"").toLowerCase();
    if(it==="rsi"||(!it&&n.includes("rsi")))return"rsi";
    if(isVert(name))return"vert";
    if(it==="vert_lr"||(!it&&n.includes("vert")))return"vert_lr";
    if(it==="kb2_yards"||it==="weight_yards"||(!it&&/carry|sled|prowler|yard/.test(n)))return"yards";
    return"orm";
  };
  const valOf=(e,m)=>{const w=parseFloat(e.weight)||0,r=parseInt(e.reps)||1;
    if(m==="orm")return epley(w,r);
    if(m==="vert_lr")return Math.max(w,parseFloat(e.reps)||0);
    return w;};
  const fmtVal=(v,m)=>m==="rsi"?(Math.round(v*100)/100).toFixed(2):m==="orm"?String(Math.round(v)):String(Math.round(v*10)/10);
  const unitOf=(m)=>m==="rsi"?"RSI":(m==="vert"||m==="vert_lr")?"in":"lbs";

  // ── Dashboard computed ─────────────────────────────────────
  const isFemale=computeFemale(gender);
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
    const m=metricOf(name);
    const best=(logs[name]||[]).reduce((b,e)=>{
      const v=valOf(e,m);
      return v>b.val?{...e,val:v,orm:m==="orm"?v:0,metric:m}:b;
    },{val:0,orm:0,metric:m});
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
      if(liftPRs[name]?.metric==="orm"&&liftPRs[name].orm&&getCat(name))
        relStrength[name]=parseFloat((liftPRs[name].orm/latestBW).toFixed(2));
    });
  }

  // Trend for the selected lift (oldest → newest)
  const selMetric=selLift?metricOf(selLift):"orm";
  const selEntries=selLift?(logs[selLift]||[]).slice().reverse().sort((a,b)=>String(a.date)<String(b.date)?-1:String(a.date)>String(b.date)?1:0):[];
  const selVals=selEntries.map(e=>valOf(e,selMetric));

  // Radar — outer ring = ELITE (1.4× team avg), team avg ring shown at 71% of RR
  const RADAR_SCALE=1.4;
  const N=activeCats.length;
  const RCX=100,RCY=100,RR=70;
  const rAngle=(i)=>(2*Math.PI*i/Math.max(N,1))-Math.PI/2;
  const rPt=(i,r)=>[RCX+r*Math.cos(rAngle(i)),RCY+r*Math.sin(rAngle(i))];
  const rScores=activeCats.map(c=>Math.min(1,catPRs[c.id]/(getRef(c.id)*RADAR_SCALE)));
  const rFillPts=activeCats.map((_,i)=>{const[x,y]=rPt(i,rScores[i]*RR);return`${x},${y}`;}).join(" ");
  const rAvgPts=activeCats.map((_,i)=>{const[x,y]=rPt(i,(1/RADAR_SCALE)*RR);return`${x},${y}`;}).join(" ");

  // Confetti is generated once per PR, not on every re-render
  const confetti=useMemo(()=>{
    if(!celebrate)return[];
    const cols=["#d4af37","#e8720c","#3fa577","#ffffff","#f0d477"];
    return Array.from({length:56}).map((_,i)=>({x:Math.random()*100,d:Math.random()*0.55,t:1.7+Math.random()*1.5,s:6+Math.random()*8,r:Math.random()>0.5,c:cols[i%cols.length]}));
  },[celebrate&&celebrate.lift,celebrate&&celebrate.value]);

  if(!program)return(
    <div style={{paddingTop:8}}>
      <Skeleton height={70} radius={14} style={{marginBottom:12}}/>
      <SkeletonList rows={5} avatar={false}/>
    </div>
  );

  // ── Small building blocks (plain functions, not components, so inputs keep focus) ──
  const field=(liftName,key,{label,step,decimal,placeholder,readOnly,extra}={})=>{
    const v=(inputs[liftName]||{})[key]||"";
    return(
      <div className={"ir-field"+(readOnly?" is-ro":"")}>
        <div className="ir-flabel"><span>{label}</span>{extra}</div>
        <div className="ir-stepper">
          {step&&!readOnly&&<button type="button" className="ir-step tfx-press" onClick={()=>bump(liftName,key,-1,step)} aria-label={"Decrease "+label}>−</button>}
          <input type="number" inputMode={decimal?"decimal":"numeric"} step={decimal?"any":"1"} value={v} readOnly={readOnly}
            onChange={e=>!readOnly&&setInput(liftName,key,e.target.value)} placeholder={placeholder||"0"} aria-label={label}/>
          {step&&!readOnly&&<button type="button" className="ir-step tfx-press" onClick={()=>bump(liftName,key,1,step)} aria-label={"Increase "+label}>+</button>}
        </div>
      </div>
    );
  };
  const swatches=(items,selId,onPick,{label,kind})=>{
    const sel=items.find(x=>x.id===selId);
    return(
      <div className="ir-pick">
        <div className="ir-flabel"><span>{label}</span>{sel&&<em>{sel.label} · {kind==="kb"?sel.weight+" lbs":sel.resistance}</em>}</div>
        <div className={"ir-sw-grid is-"+kind}>
          {items.map(it=>{
            const on=selId===it.id;
            return(
              <button key={it.id} type="button" className={"ir-sw tfx-press"+(on?" is-on":"")+(it.id==="white"?" is-white":"")} style={{"--sw":it.hex}} aria-pressed={on} onClick={()=>onPick(it)}>
                <i/><b>{it.label}</b><small>{kind==="kb"?it.weight:it.resistance}</small>
              </button>
            );
          })}
        </div>
      </div>
    );
  };
  const bwChip=(liftName)=>{
    const on=!!(inputs[liftName]||{}).bw;
    return <button type="button" className={"ir-bw tfx-press"+(on?" is-on":"")} onClick={()=>toggleBW(liftName)} aria-pressed={on}>{on&&latestBW?"BW "+latestBW:"Use BW"}</button>;
  };
  const prChip=(isPR,word="New PR")=>isPR?<span className="ir-newpr">{word}</span>:null;

  const tierOf=(lift)=>TIERS[lift.tier]||TIERS[1];

  // ── Views ───────────────────────────────────────────────────────────
  const views=[{id:"log",label:"Log"},{id:"dashboard",label:"Dashboard"},{id:"week",label:"Week"}];

  return(
    <div className="tfx ir">
      {/* 🏆 PR CELEBRATION */}
      {celebrate&&(
        <div className="ir-pr" onClick={()=>setCelebrate(null)} role="dialog" aria-label="New personal record">
          {confetti.map((p,ci)=><i key={ci} className="ir-confetti" style={{left:p.x+"%",width:p.s,height:p.r?p.s:p.s*0.5,borderRadius:p.r?"50%":2,"--c":p.c,animation:"tfConfettiFall "+p.t+"s linear "+p.d+"s forwards"}}/>)}
          <div className="ir-pr-card">
            <div className="ir-pr-trophy" aria-hidden="true">🏆</div>
            <div className="ir-pr-eyebrow">New personal record</div>
            <div className="ir-pr-val tfx-num">{celebrate.value}<small>{celebrate.unit}</small></div>
            <div className="ir-pr-lift">{celebrate.lift}</div>
            {celebrate.detail&&<div className="ir-pr-detail">{celebrate.detail}</div>}
            <div className="ir-pr-tap">Tap to continue</div>
          </div>
        </div>
      )}

      {/* 💪 END OF WORKOUT */}
      {showSessionEnd&&(
        <div className="ir-scrim" onClick={()=>setShowSessionEnd(false)}>
          <div className="ir-sheet" onClick={e=>e.stopPropagation()} role="dialog" aria-label="Session complete">
            <div className="ir-grab"/>
            <div className="ir-sheet-head">
              <div className="ir-sheet-icon" aria-hidden="true">⚒</div>
              <div className="tfx-eyebrow">Session complete</div>
              <h3>Finish strong</h3>
              <p>{todayLifts.length} lift{todayLifts.length!==1?"s":""} done. Two quick things before you rack up.</p>
            </div>
            {[{t:"weight",c:"#3fa577",i:"⚖️",l:"Log your weight",s:"Takes 5 seconds"},
              {t:"habits",c:"#8e7cf0",i:"💧",l:"Log today's habits",s:"Water, food, sleep"},
              {t:"stretching",c:"#12a594",i:"🧘",l:"Cool-down stretch",s:"Loosen up before you leave"}].map(x=>(
              <button key={x.t} className="ir-next tfx-press" style={{"--c":x.c}} onClick={()=>{setShowSessionEnd(false);if(onNavigate)onNavigate(x.t);}}>
                <span className="ir-next-ico" aria-hidden="true">{x.i}</span>
                <span className="ir-next-txt"><b>{x.l}</b><small>{x.s}</small></span>
                <span className="ir-next-go" aria-hidden="true">›</span>
              </button>
            ))}
            <button className="ir-notnow" onClick={()=>setShowSessionEnd(false)}>Not now</button>
          </div>
        </div>
      )}

      <div className="ir-seg ir-views" role="tablist" aria-label="Iron Room views">
        {views.map(v=>(
          <button key={v.id} role="tab" aria-selected={view===v.id} className={"ir-view tfx-press"+(view===v.id?" is-on":"")} onClick={()=>setView(v.id)}>{v.label}</button>
        ))}
      </div>

      {/* ── LOG ─────────────────────────────────────────────── */}
      {view==="log"&&(
        <div className="ir-stack">
          {(()=>{
            const total=todayLifts.length||1;
            const pct=Math.min(1,doneCount/total);
            const R=30,C=2*Math.PI*R;
            const isToday=isClassDay&&activeDay===today;
            return(
              <section className="tfx-card ir-hero">
                <div className="ir-hero-top">
                  <div className="ir-hero-txt">
                    <div className="tfx-eyebrow">{isToday?"Today's session":"Session"}</div>
                    <h2>{DAY_LABELS[activeDay]}</h2>
                    {phase&&<div className="ir-phase">{phase}</div>}
                  </div>
                  <div className={"ir-ring"+(pct>=1?" is-full":"")}>
                    <svg viewBox="0 0 70 70" aria-hidden="true">
                      <defs><linearGradient id="irGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" className="ir-g1"/><stop offset="1" className="ir-g2"/></linearGradient></defs>
                      <circle cx="35" cy="35" r={R} className="track"/>
                      <circle cx="35" cy="35" r={R} className="arc" strokeDasharray={C} strokeDashoffset={C*(1-pct)} transform="rotate(-90 35 35)"/>
                    </svg>
                    <div className="ir-ring-num"><b className="tfx-num">{doneCount}<i>/{todayLifts.length}</i></b><small>done</small></div>
                  </div>
                </div>
                <div className="ir-seg ir-days" role="tablist" aria-label="Training day">
                  {DAYS.map(d=>(
                    <button key={d} role="tab" aria-selected={activeDay===d} className={"ir-day tfx-press"+(activeDay===d?" is-on":"")} onClick={()=>setActiveDay(d)}>
                      {d}{isClassDay&&d===today&&<i className="ir-todaydot" aria-label="today"/>}
                    </button>
                  ))}
                </div>
              </section>
            );
          })()}

          {loadError&&<div className="ir-err" role="alert">Couldn't reach the server. Check your connection and try again.</div>}

          {todayLifts.map((lift,i)=>{
            const tier=tierOf(lift);
            const pr=getPR(lift.name);
            const ormPR=getOrmPR(lift.name);
            const inp=inputs[lift.name]||{weight:"",reps:""};
            const isSaving=saving===lift.name;
            const isSaved=saved===lift.name;
            const liftHistory=logs[lift.name]||[];
            const isExpanded=expanded===lift.name;
            const itype=lift.inputType||"weight";
            const done=sessionDone.has(activeDay+"|"+lift.name)||!!bwDone[lift.name];
            const ormNow=inp.weight&&inp.reps?epley(parseFloat(inp.weight)||0,parseInt(inp.reps)||1):0;
            const hot=!done&&itype!=="bodyweight"&&itype!=="vert_lr"&&((pr&&parseFloat(inp.weight||0)>pr)||(ormPR&&ormNow>ormPR));
            const prUnit=itype==="rsi"?"RSI":(itype==="vert_lr"||isVert(lift.name))?"in":"lbs";
            const yardsType=itype==="kb2_yards"||itype==="weight_yards";
            const entryText=(h)=>itype==="rsi"?("RSI "+h.weight):itype==="vert_lr"?("L "+h.weight+"″ · R "+(h.reps||0)+"″"):isVert(lift.name)?(h.weight+" in"):(h.weight+" × "+(h.reps||1)+(yardsType?" yds":""));

            // ── Done: collapse to a slim row ──
            if(done){
              const le=liftHistory[0];
              const isBw=!!bwDone[lift.name];
              return(
                <div key={lift.name+i} className="tfx-card ir-done tfx-rise" style={{"--t":tier.c}}>
                  <span className="ir-done-check" aria-hidden="true">✓</span>
                  <div className="ir-done-txt">
                    <b>{lift.name}</b>
                    <small>{isBw?"Sets complete":!le?"Logged":entryText(le)+(itype==="weight"||itype==="kb"||itype==="band_kb"||itype==="band_weight"||itype==="band_pallof"||itype==="mb"||itype==="weight_kb"?" lbs":"")}</small>
                  </div>
                  <button className="ir-mini tfx-press" onClick={()=>{if(isBw){setBwDone(p=>({...p,[lift.name]:false}));}else{setSessionDone(s=>{const n=new Set(s);n.delete(activeDay+"|"+lift.name);return n;});}}}>Edit</button>
                </div>
              );
            }

            const logBtn=(disabled,label="Log set")=>(
              <button className={"tfx-btn tfx-press ir-log"+(isSaved?" is-saved":"")} disabled={disabled||isSaving} onClick={()=>saveLog(lift.name,lift.tier)}>
                {isSaved?"✓ Logged":isSaving?"Saving…":label}
              </button>
            );
            const ormReadout=()=>inp.weight&&inp.reps?(
              <div className="ir-readout">Est. 1RM <b className="tfx-num">{ormNow} lbs</b>{prChip(ormPR&&ormNow>ormPR)}</div>
            ):null;
            const markDone=(extra)=>(
              <button className="tfx-btn-ghost tfx-press ir-markdone" onClick={()=>setBwDone(p=>({...p,[lift.name]:!p[lift.name]}))}>✓ Mark done{extra?" · "+extra:""}</button>
            );
            const pickKB=(it)=>{setInput(lift.name,"kbColor",it.id);setInput(lift.name,"weight",String(it.weight));};
            const pickBand=(it)=>setInput(lift.name,"bandColor",it.id);
            const selBand=inp.bandColor?BAND_COLORS.find(b=>b.id===inp.bandColor):null;

            let body;
            if(itype==="bodyweight"){
              body=(<>{markDone()}<p className="ir-hint">Bodyweight · nothing to load</p></>);
            }else if(itype==="rsi"){
              body=(<>
                <div className="ir-fields is-1">{field(lift.name,"weight",{label:"Average RSI",decimal:true,placeholder:pr?String(pr):"2.35"})}</div>
                {logBtn(!inp.weight,"Log RSI")}
                {inp.weight&&<div className="ir-readout">RSI <b className="tfx-num">{inp.weight}</b>{pr&&<span className="ir-dim">best {pr}</span>}{prChip(pr&&parseFloat(inp.weight)>pr,"New best")}</div>}
              </>);
            }else if(itype==="vert_lr"){
              body=(<>
                <div className="ir-fields">{field(lift.name,"weight",{label:"Left leg (in)",decimal:true})}{field(lift.name,"reps",{label:"Right leg (in)",decimal:true})}</div>
                {logBtn(!inp.weight||!inp.reps,"Log jump")}
              </>);
            }else if(itype==="band"){
              body=(<>{swatches(BAND_COLORS,inp.bandColor,pickBand,{label:"Band",kind:"band"})}{markDone(selBand?selBand.label+" band":"")}</>);
            }else if(itype==="mb"){
              body=(<>
                <div className="ir-pick">
                  <div className="ir-flabel"><span>Med ball</span></div>
                  <div className="ir-chips">{MB_WEIGHTS.map(w=><button key={w} type="button" className={"tfx-chipbtn tfx-press"+(inp.weight===String(w)?" is-on":"")} style={{"--c":tier.c}} onClick={()=>setInput(lift.name,"weight",String(w))}>{w} lbs</button>)}</div>
                </div>
                <div className="ir-fields is-1">{field(lift.name,"reps",{label:"Reps",step:1})}</div>
                {logBtn(!inp.weight)}
              </>);
            }else if(itype==="band_weight"||itype==="band_pallof"){
              body=(<>
                {swatches(BAND_COLORS,inp.bandColor,pickBand,{label:"Band",kind:"band"})}
                <div className="ir-fields">{field(lift.name,"weight",{label:itype==="band_pallof"?"Cable lbs":"Weight (lbs)",step:5,decimal:true,placeholder:getLast(lift.name)||"0"})}{field(lift.name,"reps",{label:"Reps",step:1})}</div>
                {logBtn(!inp.weight)}
              </>);
            }else if(itype==="band_kb"){
              body=(<>
                {swatches(BAND_COLORS,inp.bandColor,pickBand,{label:"Band",kind:"band"})}
                {swatches(KB_COLORS,inp.kbColor,pickKB,{label:"Kettlebell",kind:"kb"})}
                <div className="ir-fields is-1">{field(lift.name,"reps",{label:"Reps",step:1})}</div>
                {logBtn(!inp.weight)}
                {ormReadout()}
              </>);
            }else if(itype==="kb2_yards"){
              const k1=inp.kbColor?KB_COLORS.find(k=>k.id===inp.kbColor):null;
              const k2=inp.kbColor2?KB_COLORS.find(k=>k.id===inp.kbColor2):null;
              const pickHand=(colorKey)=>(k)=>setInputs(prev=>{
                const cur=prev[lift.name]||{};
                const newW=colorKey==="kbColor"
                  ?{weight1:String(k.weight),weight:String(Math.round((k.weight+(parseFloat(cur.weight2)||0))*10)/10)}
                  :{weight2:String(k.weight),weight:String(Math.round(((parseFloat(cur.weight1)||0)+k.weight)*10)/10)};
                return{...prev,[lift.name]:{...cur,[colorKey]:k.id,...newW}};
              });
              body=(<>
                {swatches(KB_COLORS,inp.kbColor,pickHand("kbColor"),{label:"Farmer hand",kind:"kb"})}
                {swatches(KB_COLORS,inp.kbColor2,pickHand("kbColor2"),{label:"Waiter hand",kind:"kb"})}
                <div className="ir-fields is-1">{field(lift.name,"reps",{label:"Yards",step:5})}</div>
                {logBtn(!inp.weight||!inp.reps)}
                {k1&&k2&&inp.reps&&<div className="ir-readout">{k1.label} + {k2.label} <b className="tfx-num">{inp.weight} lbs</b><span className="ir-dim">× {inp.reps} yds</span></div>}
              </>);
            }else if(itype==="kb"){
              body=(<>
                {swatches(KB_COLORS,inp.kbColor,pickKB,{label:"Kettlebell",kind:"kb"})}
                <div className="ir-fields is-1">{field(lift.name,"reps",{label:"Reps",step:1})}</div>
                {logBtn(!inp.weight)}
                {ormReadout()}
              </>);
            }else if(isVert(lift.name)){
              const rsi=inp.weight&&inp.ctTime&&parseFloat(inp.ctTime)>0?parseFloat(((parseFloat(inp.weight)*0.0254)/(parseFloat(inp.ctTime)/1000)).toFixed(2)):null;
              body=(<>
                <div className="ir-fields">{field(lift.name,"weight",{label:"Height (in)",decimal:true,placeholder:getLast(lift.name)||"28"})}{field(lift.name,"ctTime",{label:"Contact ms (optional)",placeholder:"250"})}</div>
                {logBtn(!inp.weight,"Log jump")}
                {inp.weight&&<div className="ir-readout">Jump <b className="tfx-num">{inp.weight} in</b>{rsi&&<span className="ir-dim">RSI {rsi}</span>}{prChip(pr&&parseFloat(inp.weight)>pr)}</div>}
              </>);
            }else if(itype==="weight_kb"){
              const useKB=!!inp.useKB;
              body=(<>
                <div className="ir-seg ir-mode" role="radiogroup" aria-label="Load type">
                  <button type="button" role="radio" aria-checked={!useKB} className={"tfx-press"+(!useKB?" is-on":"")} onClick={()=>{setInput(lift.name,"useKB",false);setInput(lift.name,"kbColor","");}}>Weight</button>
                  <button type="button" role="radio" aria-checked={useKB} className={"tfx-press"+(useKB?" is-on":"")} onClick={()=>{setInput(lift.name,"useKB",true);setInput(lift.name,"weight","");setInput(lift.name,"bw",false);}}>Kettlebell</button>
                </div>
                {useKB?swatches(KB_COLORS,inp.kbColor,pickKB,{label:"Kettlebell",kind:"kb"}):null}
                <div className={"ir-fields"+(useKB?" is-1":"")}>
                  {!useKB&&field(lift.name,"weight",{label:"Weight",step:inp.bw?null:5,decimal:true,readOnly:!!inp.bw,placeholder:inp.bw&&!latestBW?"Log weight first":getLast(lift.name)||"0",extra:bwChip(lift.name)})}
                  {field(lift.name,"reps",{label:"Reps",step:1})}
                </div>
                {logBtn(!inp.weight)}
                {ormReadout()}
              </>);
            }else if(itype==="weight_yards"){
              body=(<>
                <div className="ir-fields">{field(lift.name,"weight",{label:"Weight (lbs)",step:10,decimal:true,placeholder:getLast(lift.name)||"0"})}{field(lift.name,"reps",{label:"Yards",step:5})}</div>
                {logBtn(!inp.weight||!inp.reps)}
              </>);
            }else{
              body=(<>
                <div className="ir-fields">
                  {field(lift.name,"weight",{label:"Weight",step:inp.bw?null:5,decimal:true,readOnly:!!inp.bw,placeholder:inp.bw&&!latestBW?"Log weight first":getLast(lift.name)||"0",extra:bwChip(lift.name)})}
                  {field(lift.name,"reps",{label:"Reps",step:1})}
                </div>
                {logBtn(!inp.weight)}
                {ormReadout()}
              </>);
            }

            const showBest=itype!=="bodyweight"&&itype!=="band"&&pr!=null;
            const vlr=itype==="vert_lr"?{l:Math.max(...liftHistory.map(h=>parseFloat(h.weight)||0)),r:Math.max(...liftHistory.map(h=>parseFloat(h.reps)||0))}:null;
            return(
              <section key={lift.name+i} className={"tfx-card ir-lift tfx-rise"+(hot?" is-hot":"")} style={{"--t":tier.c,animationDelay:(i*0.04)+"s"}}>
                {hot&&<span className="ir-hot">🔥 PR pace</span>}
                <header className="ir-lift-head">
                  <div className="ir-lift-id">
                    <h3>{lift.name}</h3>
                    <div className="ir-meta"><span className="ir-tier"><i/>{tier.chip}</span>{lift.sets&&<span className="ir-rx">{lift.sets}</span>}</div>
                    {lift.note&&<div className="ir-note">{lift.note}</div>}
                  </div>
                  {showBest&&(
                    <div className="ir-best">
                      <div className="tfx-eyebrow">{itype==="vert_lr"?"Best L / R":"PR"}</div>
                      <b className="tfx-num">{vlr?vlr.l+"/"+vlr.r:pr}<small>{prUnit}</small></b>
                      {liftHistory[0]&&<span>last {entryText(liftHistory[0])}</span>}
                    </div>
                  )}
                </header>
                <div className="ir-body">{body}</div>
                {liftHistory.length>0&&itype!=="bodyweight"&&(
                  <div className="ir-hist">
                    <button className="ir-hist-toggle" onClick={()=>setExpanded(isExpanded?null:lift.name)} aria-expanded={isExpanded}>
                      <span>History <em>{liftHistory.length} session{liftHistory.length!==1?"s":""}</em></span><i>{isExpanded?"Hide":"Show"}</i>
                    </button>
                    {isExpanded&&(
                      <div className="ir-hist-list">
                        {liftHistory.slice(0,5).map((h,hi)=>(
                          <div key={h.id||hi} className="ir-hrow">
                            <span className="ir-hdate">{fmtD(h.date)}</span>
                            <b className="tfx-num">{entryText(h)}</b>
                            {parseFloat(h.weight)===pr&&<span className="ir-hpr">PR</span>}
                            <span className="ir-hacts">
                              {confirmDelete===h.id?(
                                <>
                                  <button className="ir-mini is-danger tfx-press" onClick={()=>deleteLog(h.id,lift.name)} disabled={deleting===h.id}>{deleting===h.id?"…":"Delete"}</button>
                                  <button className="ir-mini tfx-press" onClick={()=>setConfirmDelete(null)}>Keep</button>
                                </>
                              ):(
                                <button className="ir-mini ir-x tfx-press" onClick={()=>setConfirmDelete(h.id)} aria-label={"Delete "+fmtD(h.date)+" entry"}>✕</button>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })}

          {todayLifts.length===0&&(
            <div className="tfx-card ir-empty">
              <Icon name="barbell" size={34}/>
              <b>No lifts programmed for {DAY_LABELS[activeDay]} yet</b>
              <p>Coach Ant will post the program soon.</p>
            </div>
          )}
        </div>
      )}

      {/* ── WEEK ────────────────────────────────────────────── */}
      {view==="week"&&(
        <div className="ir-stack">
          <section className="tfx-card ir-hero">
            <div className="tfx-eyebrow">The full week</div>
            <h2>Training split</h2>
            {phase&&<div className="ir-phase">{phase}</div>}
            <div className="ir-stats">
              <div><b className="tfx-num">{DAYS.length}</b><span>days</span></div>
              <div><b className="tfx-num">{DAYS.reduce((s,d)=>s+((program&&program[d])||[]).length,0)}</b><span>lifts</span></div>
            </div>
          </section>
          {DAYS.map(day=>{
            const dayLifts=(program&&program[day])||[];
            const isToday=isClassDay&&day===today;
            return(
              <section key={day} className={"tfx-card ir-wday"+(isToday?" is-today":"")}>
                <header className="ir-wday-head">
                  <h3>{DAY_LABELS[day]}</h3>
                  {isToday&&<span className="ir-pill">Today</span>}
                  <span className="ir-count">{dayLifts.length} lifts</span>
                  <button className={(isToday?"tfx-btn":"tfx-btn-ghost")+" tfx-press ir-wgo"} onClick={()=>{setActiveDay(day);setView("log");}}>Log →</button>
                </header>
                {dayLifts.length===0?<p className="ir-hint">No lifts programmed yet.</p>:(
                  <ul className="ir-wlist">
                    {dayLifts.map((lift,li)=>{
                      const t=tierOf(lift);
                      return(
                        <li key={li} style={{"--t":t.c}}>
                          <div><b>{lift.name}</b>{lift.sets&&<small>{lift.sets}</small>}</div>
                          <span className="ir-wtier">{t.short}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* ── DASHBOARD ───────────────────────────────────────── */}
      {view==="dashboard"&&(
        <div className="ir-stack">
          {allLiftNames.length===0?(
            <div className="tfx-card ir-empty">
              <Icon name="barChart" size={34}/>
              <b>No lift data yet</b>
              <p>Log a few sessions and your strength dashboard builds itself.</p>
            </div>
          ):(<>
            {/* Power Index */}
            <section className="tfx-card ir-pi" style={{"--c":piCol}}>
              <div className="ir-pi-top">
                <div className="ir-pi-dial">
                  <svg viewBox="0 0 88 88" aria-hidden="true">
                    <circle cx="44" cy="44" r="36" className="track"/>
                    <circle cx="44" cy="44" r="36" className="arc" strokeDasharray={`${(powerIndex/100)*226.2} 226.2`} transform="rotate(-90 44 44)"/>
                  </svg>
                  <div className="ir-pi-num"><b className="tfx-num">{powerIndex}</b><small>/ 100</small></div>
                </div>
                <div className="ir-pi-txt">
                  <div className="tfx-eyebrow">TF Power Index</div>
                  <h3>{powerIndex>=90?"Elite level":powerIndex>=70?"Above average":powerIndex>=50?"Building strength":"Getting started"}</h3>
                  <p>Your best lifts vs. the {genderLabel.toLowerCase()} team average</p>
                </div>
              </div>
              <div className="ir-pi-cats">
                {CATS.map(c=>{
                  const has=catPRs[c.id]!=null;
                  const pct=has?Math.round(Math.min(1,catPRs[c.id]/getRef(c.id))*100):0;
                  return(
                    <div key={c.id} className={"ir-pi-cat"+(has?" is-on":"")} style={{"--p":pct/100}}>
                      <span><Icon name={c.id} size={13}/>{c.label}</span>
                      <b className="tfx-num">{has?pct+"%":"—"}</b>
                      <i/>
                    </div>
                  );
                })}
              </div>
              {!latestBW&&<p className="ir-hint">Log your weight in the Weight tab to see strength vs. bodyweight.</p>}
            </section>

            {/* PR board */}
            <div className="ir-sec-head"><div className="tfx-eyebrow">Personal records</div><span className="ir-dim">Tap a lift for its trend</span></div>
            <div className="ir-prgrid">
              {(currentLiftNames.length>0?currentLiftNames:allLiftNames).map(name=>{
                const best=liftPRs[name];
                const m=best.metric;
                const catId=getCat(name);
                const isSel=selLift===name;
                const rel=relStrength[name];
                const rank=catId&&catRanks[catId];
                const vals=(logs[name]||[]).map(e=>valOf(e,m));
                const deltaRaw=vals.length>1?vals[0]-vals[1]:null;
                const delta=deltaRaw==null?null:(m==="rsi"?Math.round(deltaRaw*100)/100:Math.round(deltaRaw*10)/10);
                const excl=EXCLUDED_CATS.has(name.toLowerCase());
                const sub=m==="orm"?`${best.weight}×${best.reps||1} · est. 1RM`:m==="rsi"?"Best RSI":m==="vert"?"Best jump":m==="vert_lr"?`L ${best.weight}″ · R ${best.reps||0}″`:`${best.weight} lbs × ${best.reps||0} yds`;
                const t=m==="orm"&&catId&&catPRs[catId]?strTier(Math.round(catPRs[catId]/getRef(catId)*100)):null;
                return(
                  <button key={name} className={"tfx-card ir-prcard tfx-press"+(isSel?" is-sel":"")} onClick={()=>setSelLift(isSel?null:name)} aria-pressed={isSel}>
                    <span className="ir-prname">{name}</span>
                    {delta!==null&&delta!==0&&<span className={"ir-delta "+(delta>0?"is-up":"is-down")}>{delta>0?"▲":"▼"} {Math.abs(delta)}</span>}
                    <span className="ir-prval"><b className="tfx-num">{fmtVal(best.val,m)}</b><small>{unitOf(m)}</small>{rel&&<em>{rel}×BW</em>}</span>
                    <span className="ir-prsub">{sub}</span>
                    {t&&<span className="ir-badge" style={{"--c":t.color}}>{t.label}</span>}
                    {excl&&<span className="ir-badge is-flat">Core / power</span>}
                    {rank&&teamLoaded&&<span className="ir-rank">{rankMedal(rank.rank)?rankMedal(rank.rank)+" ":""}{rank.rank}{rankSuffix(rank.rank)} of {rank.total} on your team</span>}
                  </button>
                );
              })}
            </div>

            {/* Trend for the selected lift */}
            {selLift&&(()=>{
              const W=320,H=130,PT=18,PB=10,PL=8,PR=10;
              const vals=selVals;
              const lo=vals.length?Math.min(...vals):0, hi=vals.length?Math.max(...vals):1;
              const pad=Math.max(selMetric==="rsi"?0.05:2,(hi-lo)*0.15);
              const y0=lo-pad,y1=hi+pad;
              const X=(i)=>PL+(i/Math.max(1,vals.length-1))*(W-PL-PR);
              const Y=(v)=>PT+(1-(v-y0)/Math.max(1e-6,y1-y0))*(H-PT-PB);
              const pts=vals.map((v,i)=>({x:X(i),y:Y(v)}));
              const line=smoothPath(pts);
              const best=Math.max(...vals);
              return(
                <section className="tfx-card ir-trend">
                  <div className="ir-trend-head">
                    <div><div className="tfx-eyebrow">{selMetric==="orm"?"Est. 1RM over time":"Progress over time"}</div><h3>{selLift}</h3></div>
                    {vals.length>0&&<div className="ir-trend-now"><b className="tfx-num">{fmtVal(vals[vals.length-1],selMetric)}</b><small>{unitOf(selMetric)} · latest</small></div>}
                  </div>
                  {vals.length>1?(
                    <svg viewBox={`0 0 ${W} ${H}`} className="ir-trend-svg" aria-label={`${selLift} trend`}>
                      <defs><linearGradient id="irTrend" x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="ir-ta"/><stop offset="1" className="ir-tb"/></linearGradient></defs>
                      <path d={line+`L${pts[pts.length-1].x},${H}L${pts[0].x},${H}Z`} fill="url(#irTrend)"/>
                      <path d={line} className="ir-tline"/>
                      {pts.map((p,i)=>{
                        const isLast=i===pts.length-1,isPR=vals[i]===best;
                        return(<g key={i}>
                          <circle cx={p.x} cy={p.y} r={isLast?4.5:isPR?3.5:2.4} className={isLast?"ir-tlast":isPR?"ir-tpr":"ir-tdot"}/>
                          {isPR&&!isLast&&<text x={p.x} y={p.y-8} textAnchor="middle" className="ir-tlabel">PR</text>}
                        </g>);
                      })}
                    </svg>
                  ):<p className="ir-hint">Log at least 2 sessions to see the trend.</p>}
                  {selEntries.length>0&&(
                    <div className="ir-trend-chips">
                      {selEntries.slice(-6).reverse().map((e,i)=>(
                        <div key={i}><b className="tfx-num">{fmtVal(valOf(e,selMetric),selMetric)}</b><small>{selMetric==="orm"?e.weight+"×"+(e.reps||1):selMetric==="vert_lr"?"L "+e.weight+" · R "+(e.reps||0):""}</small><small>{fmtD(e.date)}</small></div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })()}

            {/* Prior phases */}
            {priorLiftNames.length>0&&(
              <section className="tfx-card ir-prior">
                <button className="ir-hist-toggle" onClick={()=>setShowPriorPhase(p=>!p)} aria-expanded={showPriorPhase}>
                  <span>Earlier phases <em>{priorLiftNames.length} lift{priorLiftNames.length!==1?"s":""}</em></span><i>{showPriorPhase?"Hide":"Show"}</i>
                </button>
                {showPriorPhase&&(
                  <div className="ir-prgrid is-prior">
                    {priorLiftNames.map(name=>{
                      const best=liftPRs[name];const m=best.metric;
                      return(
                        <div key={name} className="ir-prcard is-prior">
                          <span className="ir-prname">{name}</span>
                          <span className="ir-prval"><b className="tfx-num">{fmtVal(best.val,m)}</b><small>{unitOf(m)}</small></span>
                          <span className="ir-prsub">{m==="orm"?"est. 1RM":"best"} · earlier phase</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* Strength profile */}
            {activeCats.length>=3&&(
              <section className="tfx-card ir-radar" style={{"--c":piCol}}>
                <div className="tfx-eyebrow">Strength profile</div>
                <p className="ir-hint">Outer ring = elite (40% above team avg) · dashed = team avg</p>
                <svg viewBox="0 0 200 200" className="ir-radar-svg" aria-hidden="true">
                  {[0.25,0.5,0.75,1.0].map((r,ri)=>(
                    <polygon key={ri} points={activeCats.map((_,i)=>{const[x,y]=rPt(i,r*RR);return`${x},${y}`;}).join(" ")} className="ir-rgrid"/>
                  ))}
                  {activeCats.map((_,i)=>{const[x,y]=rPt(i,RR);return<line key={i} x1={RCX} y1={RCY} x2={x} y2={y} className="ir-rgrid"/>;})}
                  <polygon points={rAvgPts} className="ir-ravg"/>
                  <polygon points={rFillPts} className="ir-rfill"/>
                  {activeCats.map((_,i)=>{const[x,y]=rPt(i,rScores[i]*RR);return<circle key={i} cx={x} cy={y} r="4.5" className="ir-rdot"/>;})}
                  {activeCats.map((c,i)=>{const[x,y]=rPt(i,RR+18);return<text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="ir-rlabel">{c.label}</text>;})}
                </svg>
                <div className="ir-cats">
                  {activeCats.map((c,i)=>{
                    const pct=Math.round(catPRs[c.id]/getRef(c.id)*100);
                    const rank=catRanks[c.id];
                    const rel=latestBW?parseFloat((catPRs[c.id]/latestBW).toFixed(2)):null;
                    const t=strTier(pct);
                    return(
                      <div key={i} className="ir-cat" style={{"--c":t.color,"--p":Math.min(1,pct/100)}}>
                        <div className="ir-cat-top"><span><Icon name={c.id} size={12}/>{c.label}</span><span className="ir-badge">{t.label}</span></div>
                        <b className="tfx-num">{catPRs[c.id]}<small>lbs</small></b>
                        {rel&&<span className="ir-cat-rel">{rel}× bodyweight</span>}
                        <i className="ir-cat-bar"/>
                        <span className="ir-cat-sub">{pct}% of {teamAvgRefs[c.id]?`team avg (${teamAvgRefs[c.id]})`:`baseline (${getRef(c.id)})`}</span>
                        {rank&&teamLoaded&&<span className="ir-rank">{rankMedal(rank.rank)?rankMedal(rank.rank)+" ":""}{rank.rank}{rankSuffix(rank.rank)} of {rank.total}</span>}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
            {activeCats.length<3&&activeCats.length>0&&(
              <p className="ir-hint ir-center">Log lifts in 3 of the 4 movement groups (lower body, push, pull, hinge) to unlock your strength profile.</p>
            )}
          </>)}
        </div>
      )}
    </div>
  );
}
