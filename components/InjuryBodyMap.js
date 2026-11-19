import { useState, useEffect } from "react";
import { GREEN, RED } from "../lib/constants";
import { supabase } from "../lib/supabase";
import BodyFigure from "./BodyFigure";

const SORE = "#C8941F";
const STATUS = {
  good:{ color:GREEN, label:"All Good",      emoji:"💚" },
  sore:{ color:SORE,  label:"A Little Sore", emoji:"🟡" },
  pain:{ color:RED,   label:"In Pain",       emoji:"🔴" },
};

const MUSCLE_NAMES = {
  head:"Head", neck:"Neck",
  "front-deltoids":"Shoulders", "back-deltoids":"Rear Delts",
  trapezius:"Traps", chest:"Chest",
  biceps:"Biceps", triceps:"Triceps", forearm:"Forearm",
  abs:"Abs", obliques:"Obliques",
  "upper-back":"Upper Back", "lower-back":"Lower Back",
  gluteal:"Glutes", hamstring:"Hamstrings", quadriceps:"Quads",
  adductor:"Inner Thigh", abductors:"Outer Thigh",
  calves:"Calves", knees:"Knees",
  "left-soleus":"Left Shin", "right-soleus":"Right Shin",
  "left-ankle":"Left Ankle/Foot", "right-ankle":"Right Ankle/Foot",
  "left-hand":"Left Hand", "right-hand":"Right Hand",
};

const FRONT_CHIPS = [
  "head","neck","chest","front-deltoids","biceps","forearm","left-hand","right-hand",
  "abs","obliques","adductor","quadriceps","knees","left-soleus","right-soleus",
  "left-ankle","right-ankle",
];
const BACK_CHIPS = [
  "head","neck","trapezius","upper-back","lower-back",
  "back-deltoids","triceps","forearm","left-hand","right-hand",
  "gluteal","hamstring","abductors","calves",
  "left-ankle","right-ankle",
];

const MUSCLE_STRETCH = {
  head:"head", neck:"neck",
  "front-deltoids":"shoulder", "back-deltoids":"shoulder",
  trapezius:"upper_back", chest:"chest",
  biceps:"upper_arm", triceps:"upper_arm", forearm:"forearm",
  abs:"core", obliques:"core",
  "upper-back":"upper_back", "lower-back":"lower_back",
  gluteal:"glute", hamstring:"hamstring", quadriceps:"quad",
  adductor:"hip", abductors:"hip",
  calves:"calf", knees:"knee",
  "left-soleus":"shin", "right-soleus":"shin",
  "left-ankle":"ankle", "right-ankle":"ankle",
  "left-hand":"hand", "right-hand":"hand",
};

function ytUrl(name){
  return "https://www.youtube.com/results?search_query="+encodeURIComponent(name+" how to stretch");
}

function fmtDate(iso){
  if(!iso)return null;
  try{
    const d=new Date(iso);
    return d.toLocaleDateString("en-US",{timeZone:"America/New_York",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
  }catch(e){return null;}
}

const STRETCHES={
  head:[
    {name:"Chin Tuck",desc:"Stand tall, pull chin straight back (double-chin motion). Relieves pressure at skull base.",duration:"10 reps × 5s hold"},
    {name:"Suboccipital Release",desc:"Cup back of skull in both hands, let head rest heavy. Feel gentle traction at skull base.",duration:"30–60 sec"},
    {name:"Lateral Neck Tilt",desc:"Tilt one ear toward shoulder. Do NOT pull — just let gravity add a light stretch.",duration:"30 sec each side"},
    {name:"Forward Head Stretch",desc:"Interlace fingers behind head, let the weight gently bow head forward. Do NOT force.",duration:"30 sec"},
    {name:"Temple Massage",desc:"Gentle circular pressure with fingertips on the temples.",duration:"60 sec"},
    {name:"Jaw Relaxation",desc:"Open mouth wide, hold 3 sec, close slowly. Releases tension that travels into the skull.",duration:"10 reps"},
  ],
  neck:[
    {name:"Chin Tuck",desc:"Stand tall, pull chin straight back. Hold at end range. Resets forward head posture.",duration:"10 reps × 5s hold"},
    {name:"Lateral Neck Stretch",desc:"Tilt ear to shoulder. Use opposite hand for very light weight only — DO NOT yank.",duration:"30 sec each side"},
    {name:"Levator Scapulae Stretch",desc:"Look 45° toward your armpit. Place hand on back of head — let gravity pull. No forcing.",duration:"30 sec each side"},
    {name:"Neck Rotation",desc:"Slowly turn head left, hold 3 sec, return, repeat right. Keep shoulders completely still.",duration:"10 reps each direction"},
    {name:"Upper Trap Stretch",desc:"Sit on one hand to anchor shoulder, tilt head away and look slightly down.",duration:"30 sec each side"},
    {name:"Chest Opener",desc:"Clasp hands behind back, open chest, look gently up. Relieves neck and trap tension.",duration:"3 × 20 sec"},
  ],
  shoulder:[
    {name:"Cross-Body Stretch",desc:"Pull arm across chest with opposite hand. Keep shoulder pressed down — not shrugged.",duration:"30 sec each"},
    {name:"Doorway Chest Stretch",desc:"Forearm on doorframe at 90°, lean forward until stretch in front of shoulder.",duration:"30 sec each"},
    {name:"Overhead Tricep/Shoulder",desc:"Reach arm overhead, bend elbow behind head, use other hand to gently press elbow back.",duration:"30 sec each"},
    {name:"Thread the Needle",desc:"On all fours, slide one arm palm-up under body until shoulder touches ground.",duration:"30 sec each"},
    {name:"Shoulder Circles",desc:"Relaxed arms at sides, make large slow circles forward then backward.",duration:"10 forward, 10 back"},
    {name:"Sleeper Stretch",desc:"Lie on affected side, elbow at 90°. Use other hand to gently rotate wrist toward floor. STOP if sharp pain.",duration:"30 sec each"},
  ],
  upper_arm:[
    {name:"Cross-Body Stretch",desc:"Pull arm across chest with opposite hand to stretch the rear deltoid and upper arm.",duration:"30 sec each"},
    {name:"Wall Bicep Stretch",desc:"Place palm flat on wall behind you at shoulder height. Slowly rotate body away.",duration:"30 sec each"},
    {name:"Overhead Tricep Stretch",desc:"Reach arm overhead, bend elbow, use other hand to gently press elbow back.",duration:"30 sec each"},
    {name:"Doorway Chest Stretch",desc:"Forearm at 90° on doorframe, lean through to open the chest and front of upper arm.",duration:"30 sec each"},
    {name:"Overhead Bicep Reach",desc:"Raise arm overhead, keep elbow straight, flex wrist back slightly.",duration:"30 sec each"},
    {name:"Shoulder Circles",desc:"Relaxed arm, large slow circles. Promotes blood flow and mobility.",duration:"10 each direction"},
  ],
  forearm:[
    {name:"Wrist Flexor Stretch",desc:"Arm extended, palm up — pull fingers back toward elbow. Feel stretch in forearm underside.",duration:"30 sec each"},
    {name:"Wrist Extensor Stretch",desc:"Arm extended, palm down — pull fingers toward you downward. Feel topside of forearm.",duration:"30 sec each"},
    {name:"Forearm Circles",desc:"Arms extended, make slow circles at the wrist.",duration:"10 each direction"},
    {name:"Prayer Stretch",desc:"Press palms together at chest, slowly lower while keeping pressure.",duration:"30 sec"},
    {name:"Reverse Prayer",desc:"Backs of hands together behind back and gently press.",duration:"20 sec"},
    {name:"Forearm Self-Massage",desc:"Use thumb to press and slide slowly along forearm muscle belly from wrist to elbow.",duration:"60 sec each arm"},
  ],
  chest:[
    {name:"Doorway Stretch (Low)",desc:"Arm at 90° on doorframe, elbow at shoulder height. Lean forward until chest stretch.",duration:"30 sec each"},
    {name:"Doorway Stretch (High)",desc:"Arm at 120° (hand above head). Targets upper chest.",duration:"30 sec each"},
    {name:"Foam Roller Chest Opener",desc:"Lie lengthwise on foam roller along spine. Arms fall to sides, breathe deeply.",duration:"60 sec"},
    {name:"Hands Clasped Behind Back",desc:"Clasp hands behind back, straighten arms, open chest and look slightly up.",duration:"3 × 20 sec"},
    {name:"Eagle Arms",desc:"Cross arms at elbows in front, wrap forearms together, lift slightly. Reverse and repeat.",duration:"30 sec each side"},
    {name:"Wide Arm Circles",desc:"Arms extended to sides, small then large circles. Warms and opens the chest.",duration:"10 each direction"},
  ],
  core:[
    {name:"Cat-Cow",desc:"On all fours, arch the back (cow) then round it (cat). Sync breath — inhale to arch, exhale to round.",duration:"10 slow reps"},
    {name:"Child's Pose",desc:"Kneel, sit back on heels, arms forward. Breathe into the lower back.",duration:"30–60 sec"},
    {name:"Lying Knee-to-Chest",desc:"On your back, pull one knee to chest. Hold then switch sides.",duration:"30 sec each"},
    {name:"Supine Spinal Twist",desc:"On back, pull one knee across body while extending arm outward. Opposite shoulder stays down.",duration:"30 sec each"},
    {name:"Cobra Stretch",desc:"Lie face down, press onto hands with hips on ground. Feel stretch in abs.",duration:"3 × 20 sec"},
    {name:"Side Bend Stretch",desc:"Stand tall, reach one arm overhead and lean to opposite side.",duration:"30 sec each"},
  ],
  upper_back:[
    {name:"Cat-Cow",desc:"On all fours — focus on moving through the mid-back and thoracic spine.",duration:"10 slow reps"},
    {name:"Thoracic Foam Roll",desc:"Foam roller under mid-back. Support neck with hands. Extend over roller, shifting up the spine.",duration:"30 sec per segment"},
    {name:"Thread the Needle",desc:"On all fours, slide one arm palm-up under body, rotating through the thoracic spine.",duration:"30 sec each"},
    {name:"Seated Trunk Rotation",desc:"Sit upright, arms crossed on chest. Rotate slowly left then right without moving hips.",duration:"10 each direction"},
    {name:"Wall Angels",desc:"Back flat against wall, press lower back down. Slide arms up and down while keeping full contact.",duration:"10 slow reps"},
    {name:"Child's Pose",desc:"Arms stretched forward, breathe into upper back. Walk hands further to increase stretch.",duration:"30 sec"},
  ],
  lower_back:[
    {name:"Cat-Cow",desc:"Focus on lumbar curve — arch low back (cow), then draw navel to spine and round (cat).",duration:"10 slow reps"},
    {name:"Child's Pose",desc:"Kneel, sit back on heels, arms forward. Breathe deeply into the lower back.",duration:"30–60 sec"},
    {name:"Both Knees to Chest",desc:"On back, hug both knees to chest. Rock gently side to side.",duration:"30 sec"},
    {name:"Supine Spinal Twist",desc:"On back, pull bent knee across to opposite floor while extending arm out.",duration:"30 sec each"},
    {name:"Figure-4 Piriformis",desc:"On back, cross ankle over opposite knee, pull both toward chest. Relieves SI joint.",duration:"30 sec each"},
    {name:"Downward Dog",desc:"Hands and feet on floor, push hips up and back. Pedal heels to decompress the lumbar spine.",duration:"30 sec"},
  ],
  hip:[
    {name:"Hip Flexor Lunge",desc:"Kneel on one knee, push hips forward until stretch at front hip. Keep torso upright.",duration:"30 sec each"},
    {name:"Figure-4 Stretch",desc:"On back, cross ankle over opposite knee, pull both toward chest.",duration:"30 sec each"},
    {name:"Butterfly Stretch",desc:"Seated, press soles together, let knees fall outward. Sit tall.",duration:"30 sec"},
    {name:"Hip Circles",desc:"Stand on one foot, slowly trace large circles with opposite knee.",duration:"10 each direction per hip"},
    {name:"Lateral Leg Swings",desc:"Hold a wall, swing one leg side to side through comfortable range. Controlled.",duration:"10 each direction"},
    {name:"Deep Squat Hold",desc:"Feet slightly wider than hips, toes out. Lower into deep squat, clasp hands for balance.",duration:"30 sec"},
  ],
  glute:[
    {name:"Figure-4 Stretch",desc:"On back, cross ankle over opposite knee, pull both toward chest. Feel it deep in the glute.",duration:"30 sec each"},
    {name:"Pigeon Pose",desc:"From floor, one shin horizontal in front, opposite leg back. Sit tall or fold forward.",duration:"30 sec each"},
    {name:"Knee to Opposite Shoulder",desc:"On back, pull bent knee across toward opposite shoulder until deep glute stretch.",duration:"30 sec each"},
    {name:"Standing Figure-4",desc:"Cross ankle over opposite knee, lower into single-leg squat, hold.",duration:"30 sec each"},
    {name:"Seated Figure-4",desc:"Sit upright on chair, cross ankle over knee, sit tall and lean slightly forward.",duration:"30 sec each"},
    {name:"Hip Flexor Lunge",desc:"Releases anterior tilt that overloads the glutes. Back knee down, torso tall.",duration:"30 sec each"},
  ],
  quad:[
    {name:"Standing Quad Stretch",desc:"Stand on one foot, pull opposite ankle toward glute. Keep knees together.",duration:"30 sec each"},
    {name:"Kneeling Hip Flexor Stretch",desc:"Kneel on one knee, push hips forward until stretch in front of back quad.",duration:"30 sec each"},
    {name:"Couch Stretch",desc:"Top of back foot on bench/couch, front knee forward at 90°. Torso upright.",duration:"30 sec each"},
    {name:"Lying Side Quad Stretch",desc:"Lie on side, pull top ankle toward glute with hand. Keep hips stacked.",duration:"30 sec each"},
    {name:"Slow Walking Lunges",desc:"Long lunge steps, sink deep into quad stretch. Control the descent.",duration:"10 reps each leg"},
    {name:"Foam Roll Quads",desc:"Face down, roller under one quad. Slowly roll from below hip crease to above knee.",duration:"60 sec each"},
  ],
  hamstring:[
    {name:"Standing Hamstring Stretch",desc:"Heel on surface, keep leg straight, hinge forward from hips. DO NOT round back.",duration:"30 sec each"},
    {name:"Seated Single-Leg Stretch",desc:"Sit tall, extend one leg, flex foot, hinge at hips reaching toward foot.",duration:"30 sec each"},
    {name:"Lying Hamstring with Band",desc:"On back, wrap band/towel around one foot, pull leg up with knee straight.",duration:"30 sec each"},
    {name:"Downward Dog",desc:"Hands and feet on floor, push hips up and back. Pedal heels slowly.",duration:"30 sec"},
    {name:"Pigeon Pose",desc:"Back leg extended gets a hamstring stretch. Front shin horizontal, sit tall.",duration:"30 sec each"},
    {name:"Slow RDL Stretch",desc:"Slight knee bend, hinge at hips slowly, reach toward floor, feel hamstring lengthen.",duration:"10 slow reps"},
  ],
  knee:[
    {name:"Standing Quad Stretch",desc:"Pull ankle toward glute — relieves tension on the quad and patellar tendon.",duration:"30 sec each"},
    {name:"Seated Hamstring Stretch",desc:"Extend leg, flex foot, hinge forward from hips. Reduces pull on back of knee.",duration:"30 sec each"},
    {name:"Straight-Leg Calf Stretch",desc:"Press heel into floor against wall, straight leg. Reduces posterior knee tension.",duration:"30 sec each"},
    {name:"IT Band Stretch",desc:"Cross one leg behind the other, lean away from back foot side.",duration:"30 sec each"},
    {name:"Hip Flexor Lunge",desc:"Releasing tight hip flexors reduces load transferred through the knee.",duration:"30 sec each"},
    {name:"Seated Knee Circles",desc:"Sit on seat edge, foot off ground. Trace SLOW gentle circles — pain-free range ONLY.",duration:"10 each direction"},
  ],
  shin:[
    {name:"Kneeling Shin Stretch",desc:"Kneel with tops of feet flat on floor, sit back gently on heels. Feel stretch along shin.",duration:"30 sec"},
    {name:"Ankle Circles",desc:"Seated or single-leg balance, slowly trace large circles at the ankle.",duration:"10 each direction"},
    {name:"Toe Raises",desc:"Stand with heels down, lift all toes toward ceiling. Works and stretches tibialis anterior.",duration:"15 reps"},
    {name:"Heel Walking",desc:"Walk forward on your heels only, toes lifted. Directly works the shin musculature.",duration:"30 sec"},
    {name:"Tibialis Raises",desc:"Stand with back against wall, feet 12 inches out. Raise toes off ground, lower slowly.",duration:"3 × 15 slow reps"},
    {name:"Straight-Leg Calf Stretch",desc:"Stretching the calf restores shin/calf tension balance.",duration:"30 sec each"},
  ],
  calf:[
    {name:"Straight-Leg Calf Stretch",desc:"Press ball of foot on wall or curb, heel flat on ground, leg straight.",duration:"30 sec each"},
    {name:"Bent-Knee Calf Stretch",desc:"Same position but slightly bend the knee. Targets the deeper soleus and Achilles.",duration:"30 sec each"},
    {name:"Heel Drop (Step Edge)",desc:"Stand on edge of step on ball of foot. Lower heel below step level slowly.",duration:"30 sec each"},
    {name:"Downward Dog",desc:"Hips up and back. Alternate pressing one heel toward floor.",duration:"30 sec"},
    {name:"Slow Eccentric Calf Raises",desc:"Rise on toes, then lower over 4–5 counts. Builds tendon tolerance.",duration:"3 × 15 reps"},
    {name:"Ankle Circles",desc:"Slow controlled circles — promotes blood flow and calf recovery.",duration:"10 each direction"},
  ],
  ankle:[
    {name:"Ankle Circles",desc:"Seated, foot off the floor. Trace large slow circles in both directions through full comfortable range.",duration:"10 each direction × 2 sets"},
    {name:"Alphabet Tracing",desc:"Foot off the floor, use your big toe to slowly trace every letter A–Z. Mobilises the ankle in all planes.",duration:"Full alphabet × 2"},
    {name:"Achilles/Calf Stretch (Bent Knee)",desc:"Stand facing wall, one foot back with knee slightly bent. Press heel down. Targets soleus and Achilles attachment.",duration:"30 sec each"},
    {name:"Banded Dorsiflexion Stretch",desc:"Loop band around rack at ankle height. Step forward so band pulls the ankle back. Squat slightly — feel front of ankle open.",duration:"30 sec each"},
    {name:"Towel Foot Stretch",desc:"Sit with legs extended, loop towel around ball of foot, pull gently toward you keeping knee straight.",duration:"30 sec each"},
    {name:"Single-Leg Balance",desc:"Stand on one foot, keep ankle stable. Progress to eyes closed or unstable surface. Rebuilds proprioception after sprains.",duration:"30 sec each × 3"},
  ],
  hand:[
    {name:"Wrist Flexor Stretch",desc:"Arm extended, palm up. Use other hand to gently pull fingers back toward elbow. Feel the stretch along the forearm and wrist.",duration:"30 sec each"},
    {name:"Wrist Extensor Stretch",desc:"Arm extended, palm down. Gently pull fingers downward toward you. Targets top of wrist and forearm.",duration:"30 sec each"},
    {name:"Finger Extension Stretch",desc:"Press all four fingers back gently with opposite hand. Hold, then spread fingers wide and hold again.",duration:"10 reps each hand"},
    {name:"Fist-to-Fan",desc:"Make a tight fist, hold 3 sec. Release and spread fingers as wide as possible, hold 3 sec. Repeat.",duration:"10 reps each hand"},
    {name:"Wrist Circles",desc:"Extend arm, make large slow circles at the wrist in both directions. Full pain-free range only.",duration:"10 each direction"},
    {name:"Prayer Stretch",desc:"Press palms flat together at chest. Slowly lower both hands while keeping palms pressed together until wrist stretch is felt.",duration:"30 sec"},
  ],
};

// Figure lives in BodyFigure.js (smooth silhouette split into regions)
function BodySVG({view, partData, selected, onSelect}){
  return <BodyFigure view={view} partData={partData} selected={selected} onSelect={onSelect} names={MUSCLE_NAMES}/>;
}

export default function InjuryBodyMap({athleteId, readOnly=false}){
  const[view,setView]=useState("front");
  const[partData,setPartData]=useState({});
  const[selected,setSelected]=useState(null);
  const[pStatus,setPStatus]=useState("good");
  const[pPain,setPPain]=useState(0);
  const[pDesc,setPDesc]=useState("");
  const[notifyCoach,setNotifyCoach]=useState(true);
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);
  const[saveErr,setSaveErr]=useState(false);
  const[clearing,setClearing]=useState(false);

  useEffect(()=>{
    if(!athleteId)return;
    (async()=>{
      try{
        const{data}=await supabase.from("announcements")
          .select("week_label,message").eq("type","body_injury").eq("day",String(athleteId)).eq("active",true);
        const loaded={};
        (data||[]).forEach(r=>{try{loaded[r.week_label]=JSON.parse(r.message);}catch(e){}});
        setPartData(loaded);
      }catch(e){}
    })();
  },[athleteId]);

  const selectPart=(muscle)=>{
    setSelected(prev=>prev===muscle?null:muscle);
    if(readOnly)return;
    const ex=partData[muscle];
    setPStatus(ex?.status||"good");
    setPPain(ex?.pain||0);
    setPDesc(ex?.description||"");
    setNotifyCoach(true);
    setSaved(false);setSaveErr(false);
  };

  const savePart=async()=>{
    if(!selected)return;
    setSaving(true);setSaved(false);setSaveErr(false);
    const now=new Date().toISOString();
    const msg=JSON.stringify({status:pStatus,pain:pPain,description:pDesc.trim(),updatedAt:now});
    try{
      // Insert the new record FIRST, then remove older ones — so a failed write never
      // wipes the athlete's existing entry for this muscle.
      const{data:ins,error:ie}=await supabase.from("announcements").insert({
        type:"body_injury",day:String(athleteId),week_label:selected,message:msg,active:true,
      }).select("id");
      if(ie)throw ie;
      const newId=ins&&ins[0]?ins[0].id:null;
      try{
        let del=supabase.from("announcements").delete()
          .eq("type","body_injury").eq("day",String(athleteId)).eq("week_label",selected);
        if(newId)del=del.neq("id",newId);
        await del;
      }catch(e2){}
      setPartData(prev=>({...prev,[selected]:{status:pStatus,pain:pPain,description:pDesc.trim(),updatedAt:now}}));
      if(notifyCoach&&pStatus!=="good"){
        const zoneName=MUSCLE_NAMES[selected]||selected;
        const inboxMsg=`Body Map — ${zoneName}: ${STATUS[pStatus].label}${pPain>0?" (pain "+pPain+"/10)":""}. ${pDesc.trim()}`;
        try{await supabase.from("inbox").insert({athlete_id:athleteId,type:"injury",message:inboxMsg});}catch(e2){}
      }
      setSaved(true);
      setTimeout(()=>setSaved(false),3000);
    }catch(e){
      setSaveErr(true);
      setTimeout(()=>setSaveErr(false),4000);
    }
    setSaving(false);
  };

  const clearAll=async()=>{
    setClearing(true);
    try{
      const{error}=await supabase.from("announcements").delete()
        .eq("type","body_injury").eq("day",String(athleteId));
      if(error)throw error;
      setPartData({});setSelected(null);
    }catch(e){}
    setClearing(false);
  };

  const chips=view==="front"?FRONT_CHIPS:BACK_CHIPS;
  const selName=selected?MUSCLE_NAMES[selected]||selected:null;
  const strKey=selected?MUSCLE_STRETCH[selected]||"":null;
  const stretches=strKey?STRETCHES[strKey]||[]:[];
  const descEnough=pDesc.trim().length>=10;
  const showStretches=selected&&pStatus!=="good"&&stretches.length>0;
  const injCount=Object.values(partData).filter(d=>d.status==="sore"||d.status==="pain").length;
  const selEx=selected?partData[selected]:null;

  const chipColor=(id)=>{
    const d=partData[id];
    if(!d?.status||d.status==="good")return null;
    return STATUS[d.status]?.color||null;
  };

  // Brighter UI tones (the STATUS colors above are kept for inbox/coach text)
  const UI={good:"#30A46C",sore:"#E8A33C",pain:"#E5484D"};
  const flagged=Object.entries(partData).filter(([,d])=>d&&(d.status==="sore"||d.status==="pain"));
  const openZone=(id)=>{
    if(!chips.includes(id))setView(FRONT_CHIPS.includes(id)?"front":"back");
    selectPart(id);
  };
  const painTone=(n)=>n<=3?UI.good:n<=6?UI.sore:UI.pain;

  return(
    <div className="tfx bm">
      {/* Header */}
      <header className="bm-head">
        <div>
          <div className="tfx-eyebrow">{readOnly?"Athlete status":"Body check-in"}</div>
          <h2>{readOnly?"Body map":"How's your body?"}</h2>
        </div>
        <div className="bm-head-right">
          {injCount>0&&!readOnly&&(
            <button className="bm-clear tfx-press" onClick={clearAll} disabled={clearing}>{clearing?"…":"Clear all"}</button>
          )}
          <span className={"bm-pill "+(injCount>0?"is-flag":"is-clear")}>
            <span className="tfx-livedot" style={{"--c":injCount>0?UI.pain:UI.good}}/>
            {injCount>0?injCount+" flagged":"All clear"}
          </span>
        </div>
      </header>

      {/* Flagged zones — quick access */}
      {flagged.length>0&&(
        <div className="bm-flagged">
          {flagged.map(([id,d])=>(
            <button key={id} className={"bm-flag tfx-press is-"+d.status} onClick={()=>openZone(id)}>
              <b>{MUSCLE_NAMES[id]||id}</b>
              <span>{d.status==="pain"?"Pain":"Sore"}{d.pain>0?" · "+d.pain+"/10":""}</span>
            </button>
          ))}
        </div>
      )}

      {/* Scanner */}
      <div className="tfx-card bm-scan">
        <div className="bm-seg" role="tablist" aria-label="Body side">
          {["front","back"].map(v=>(
            <button key={v} role="tab" aria-selected={view===v} className={"tfx-press"+(view===v?" is-on":"")} onClick={()=>{setView(v);setSelected(null);}}>
              {v==="front"?"Front":"Back"}
            </button>
          ))}
        </div>
        <div className="bm-figure" key={view}>
          <BodySVG view={view} partData={partData} selected={selected} onSelect={selectPart}/>
        </div>
        <div className="bm-legend">
          <span style={{"--c":UI.good}}><i/>All good</span>
          <span style={{"--c":UI.sore}}><i/>Sore</span>
          <span style={{"--c":UI.pain}}><i/>Pain</span>
        </div>
        {!readOnly&&!selected&&<div className="bm-hint">Tap a muscle on the body, or pick one below</div>}
      </div>

      {/* Muscle chips */}
      <div className="bm-chips">
        {chips.map(id=>{
          const c=chipColor(id);
          const st=partData[id]?.status;
          if(readOnly&&!c)return null;
          return(
            <button key={id} onClick={()=>selectPart(id)}
              className={"bm-chip tfx-press"+(selected===id?" is-sel":"")+(c?" is-"+st:"")}>
              {c&&<i/>}{MUSCLE_NAMES[id]}
            </button>
          );
        })}
        {readOnly&&Object.keys(partData).filter(id=>!chips.includes(id)&&(partData[id]?.status==="sore"||partData[id]?.status==="pain")).map(id=>(
          <span key={id} className={"bm-chip is-"+partData[id].status}><i/>{MUSCLE_NAMES[id]||id}</span>
        ))}
      </div>

      {/* Read-only detail panel (coach view) */}
      {selected&&selName&&readOnly&&(()=>{
        const d=partData[selected];
        if(!d||d.status==="good")return(
          <div className="tfx-card bm-panel"><p className="bm-muted">No issues reported for {selName}.</p></div>
        );
        const st=STATUS[d.status]||STATUS.good;
        const sk=MUSCLE_STRETCH[selected]||"";
        const slist=STRETCHES[sk]||[];
        return(
          <div className="tfx-card bm-panel" style={{"--c":UI[d.status]}}>
            <div className="bm-panel-head">
              <h3>{selName}</h3>
              <span className="bm-status">{st.label}{d.pain>0?" · "+d.pain+"/10":""}</span>
            </div>
            {d.description?<blockquote className="bm-quote">{d.description}</blockquote>:<p className="bm-muted">No description provided.</p>}
            {d.updatedAt&&<div className="bm-when">{fmtDate(d.updatedAt)}</div>}
            {slist.length>0&&(
              <div className="bm-stretches">
                <div className="tfx-eyebrow">Recommended stretches</div>
                {slist.map((s,i)=>(
                  <div key={i} className="bm-stretch">
                    <div><b>{s.name}</b><span>{s.duration}</span></div>
                    <p>{s.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Editable detail panel (athlete view) */}
      {selected&&selName&&!readOnly&&(
        <div className="tfx-card bm-panel tfx-rise" style={{"--c":UI[pStatus]}}>
          <div className="bm-panel-head">
            <h3>{selName}</h3>
            {selEx?.updatedAt&&<span className="bm-when">Updated {fmtDate(selEx.updatedAt)}</span>}
          </div>

          <div className="tfx-eyebrow bm-label">How does it feel?</div>
          <div className="bm-status-row">
            {Object.entries(STATUS).map(([k,v])=>(
              <button key={k} className={"bm-statusbtn tfx-press"+(pStatus===k?" is-on":"")} style={{"--c":UI[k]}}
                onClick={()=>{setPStatus(k);if(k==="good")setPPain(0);}} aria-pressed={pStatus===k}>
                <i/>{{good:"All good",sore:"Sore",pain:"In pain"}[k]||v.label}
              </button>
            ))}
          </div>

          {pStatus!=="good"&&(
            <>
              <div className="tfx-eyebrow bm-label">Pain level{pPain>0?<b className="tfx-num" style={{color:painTone(pPain)}}> · {pPain}/10</b>:""}</div>
              <div className="bm-pain">
                {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                  <button key={n} className={"tfx-press"+(pPain===n?" is-on":"")+(pPain>=n&&pPain>0?" is-fill":"")} style={{"--c":painTone(n)}} onClick={()=>setPPain(n)} aria-label={"Pain "+n+" of 10"}>{n}</button>
                ))}
              </div>
            </>
          )}

          <div className="tfx-eyebrow bm-label">
            Describe it{pStatus!=="good"&&!descEnough&&<span className="bm-unlock"> · a few words unlocks stretches</span>}
          </div>
          <textarea className="tfx-field bm-desc" value={pDesc} onChange={e=>setPDesc(e.target.value)} rows={3}
            placeholder="Where it hurts, what it feels like, how it happened…"/>

          {pStatus!=="good"&&(
            <button className={"bm-switch"+(notifyCoach?" is-on":"")} onClick={()=>setNotifyCoach(v=>!v)} role="switch" aria-checked={notifyCoach}>
              <span className="bm-switch-track"><span className="bm-switch-knob"/></span>
              Let Coach Ant know
            </button>
          )}

          <div className="bm-save-row">
            {saved&&<span className="bm-ok">Saved{notifyCoach&&pStatus!=="good"?" · coach notified":""}</span>}
            {saveErr&&<span className="bm-bad">Didn't save — try again</span>}
            <button className="tfx-btn tfx-press bm-save" onClick={savePart} disabled={saving}>{saving?"Saving…":"Save"}</button>
          </div>
        </div>
      )}

      {/* Stretches locked */}
      {showStretches&&!descEnough&&!readOnly&&(
        <div className="tfx-card bm-locked">
          <span aria-hidden="true">🔒</span>
          <div><b>Stretches for {selName}</b><p>Describe what you're feeling (10+ characters) to unlock them.</p></div>
        </div>
      )}

      {/* Stretches */}
      {showStretches&&(descEnough||readOnly)&&(
        <div className="tfx-card bm-panel bm-stretches tfx-rise" style={{"--c":UI[pStatus]}}>
          <div className="bm-panel-head"><h3>Stretches · {selName}</h3></div>
          <p className="bm-muted">Stop any stretch that increases pain. General mobility only — check with Coach Ant before training on an injury.</p>
          {stretches.map((s,i)=>(
            <div key={i} className="bm-stretch">
              <div><b>{s.name}</b><span>{s.duration}</span></div>
              <p>{s.desc}</p>
              <a href={ytUrl(s.name)} target="_blank" rel="noopener noreferrer" className="bm-yt">▶ Watch how</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
