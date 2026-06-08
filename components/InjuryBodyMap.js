import { useState, useEffect, useMemo } from "react";
import Model from "react-body-highlighter";
import { GREEN, RED } from "../lib/constants";
import { supabase } from "../lib/supabase";

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
};

// chips shown for each view — ordered head→toe
const FRONT_CHIPS = [
  "head","neck","chest","front-deltoids","biceps","forearm",
  "abs","obliques","adductor","quadriceps","knees","left-soleus","right-soleus",
  "left-ankle","right-ankle",
];
const BACK_CHIPS = [
  "head","neck","trapezius","upper-back","lower-back",
  "back-deltoids","triceps","forearm","gluteal","hamstring","abductors","calves",
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
};

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
    if(readOnly)return;
    setSelected(muscle);
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
      const{error:de}=await supabase.from("announcements").delete()
        .eq("type","body_injury").eq("day",String(athleteId)).eq("week_label",selected);
      if(de)throw de;
      const{error:ie}=await supabase.from("announcements").insert({
        type:"body_injury",day:String(athleteId),week_label:selected,message:msg,active:true,
      });
      if(ie)throw ie;
      setPartData(prev=>({...prev,[selected]:{status:pStatus,pain:pPain,description:pDesc.trim(),updatedAt:now}}));

      if(notifyCoach&&pStatus!=="good"){
        const zoneName=MUSCLE_NAMES[selected]||selected;
        const inboxMsg=`Body Map — ${zoneName}: ${STATUS[pStatus].label}${pPain>0?" (pain "+pPain+"/10)":""}. ${pDesc.trim()}`;
        try{
          await supabase.from("inbox").insert({athlete_id:athleteId,type:"injury",message:inboxMsg});
        }catch(e2){}
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
      setPartData({});
      setSelected(null);
    }catch(e){}
    setClearing(false);
  };

  const bodyData=useMemo(()=>
    Object.entries(partData)
      .filter(([,d])=>d.status==="sore"||d.status==="pain")
      .map(([id,d])=>({name:id,muscles:[id],frequency:d.status==="pain"?2:1}))
  ,[partData]);

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

  return(
    <div>
      {/* CSS for polygon hover glow */}
      <style>{`
        .rbh polygon{transition:opacity 0.12s,filter 0.12s;}
        .rbh polygon:hover{opacity:0.6!important;filter:brightness(1.8) saturate(1.4);cursor:pointer;}
      `}</style>

      {/* Header */}
      <div style={{background:"#111",borderRadius:12,padding:"14px 16px",marginBottom:12,border:"1px solid "+RED+"33",borderLeft:"3px solid "+RED}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:2}}>Body Check-In</div>
            <div style={{fontSize:11,color:"#555"}}>{readOnly?"Athlete's injury status":"Tap the body or a chip below to check in"}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {injCount>0&&!readOnly&&(
              <button onClick={clearAll} disabled={clearing} style={{fontSize:10,color:"#888",background:"transparent",border:"1px solid #333",padding:"3px 10px",borderRadius:10,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                {clearing?"...":"Clear All"}
              </button>
            )}
            {injCount>0&&(
              <div style={{fontSize:10,color:RED,fontWeight:800,background:RED+"18",padding:"4px 10px",borderRadius:20,border:"1px solid "+RED+"44",whiteSpace:"nowrap"}}>
                {injCount} flagged
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Front/Back toggle */}
      <div style={{display:"flex",gap:6,marginBottom:12,background:"#0e0e0e",borderRadius:12,padding:4,border:"1px solid #1e1e1e"}}>
        {["front","back"].map(v=>(
          <button key={v} onClick={()=>{setView(v);setSelected(null);}} style={{flex:1,padding:"11px",borderRadius:9,border:"none",background:view===v?"linear-gradient(135deg,"+RED+"dd,"+RED+"88)":"transparent",color:view===v?"#fff":"#555",fontSize:13,fontWeight:view===v?800:400,cursor:"pointer",fontFamily:"Georgia,serif",letterSpacing:view===v?"0.04em":"0"}}>
            {v==="front"?"▲ Front":"▽ Back"}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div style={{display:"flex",gap:14,justifyContent:"center",marginBottom:12}}>
        {Object.entries(STATUS).map(([k,v])=>(
          <div key={k} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:"#777"}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:v.color,boxShadow:"0 0 6px "+v.color+"88"}}/>
            {v.label}
          </div>
        ))}
      </div>

      {/* Body Map — large, high contrast */}
      <div style={{background:"#080f18",borderRadius:20,padding:"20px 8px 16px",marginBottom:14,border:"1px solid #1a2e44",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,"+RED+"55,transparent,"+RED+"55)"}}/>
        <div style={{maxWidth:340,margin:"0 auto",pointerEvents:readOnly?"none":"auto"}}>
          <Model
            type={view==="front"?"anterior":"posterior"}
            data={bodyData}
            bodyColor="#3a5068"
            highlightedColors={[SORE+"ff",RED+"ff"]}
            onClick={({muscle})=>selectPart(muscle)}
            svgStyle={{display:"block",stroke:"#1a2e44",strokeWidth:"0.6"}}
          />
        </div>
        {!selected&&!readOnly&&(
          <div style={{textAlign:"center",fontSize:11,color:"#3a5068",marginTop:4,letterSpacing:"0.04em"}}>
            ↑ tap a muscle above or a chip below
          </div>
        )}
        {selected&&(
          <div style={{textAlign:"center",marginTop:6}}>
            <span style={{fontSize:12,fontWeight:700,color:STATUS[pStatus]?.color||"#fff",background:(STATUS[pStatus]?.color||"#fff")+"18",padding:"4px 14px",borderRadius:20,border:"1px solid "+(STATUS[pStatus]?.color||"#fff")+"44"}}>
              {selName} · {STATUS[pStatus]?.label}
            </span>
          </div>
        )}
      </div>

      {/* Muscle chips — tappable for athletes, read-only indicators for coach */}
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16,padding:"2px 0"}}>
        {chips.map(id=>{
          const c=chipColor(id);
          const isSel=selected===id;
          if(readOnly&&!c)return null;
          return(
            <button key={id} onClick={()=>!readOnly&&selectPart(id)}
              style={{padding:"7px 12px",borderRadius:20,
                border:"1px solid "+(isSel?"#fff":c?c+"66":"#2a2a2a"),
                background:isSel?(c||"#3a5068")+"33":c?c+"22":"#111",
                color:isSel?"#fff":c?c:"#666",
                fontSize:11,fontWeight:isSel?800:c?700:400,
                cursor:readOnly?"default":"pointer",
                fontFamily:"Georgia,serif",whiteSpace:"nowrap",transition:"all 0.12s",
                boxShadow:isSel?"0 0 10px "+(c||"#3a5068")+"44":"none"}}>
              {c&&<span style={{marginRight:4,fontSize:9}}>{partData[id]?.status==="pain"?"🔴":"🟡"}</span>}
              {MUSCLE_NAMES[id]}
            </button>
          );
        })}
        {readOnly&&Object.keys(partData).filter(id=>!chips.includes(id)&&(partData[id]?.status==="sore"||partData[id]?.status==="pain")).map(id=>{
          const c=chipColor(id);
          return(
            <span key={id} style={{padding:"7px 12px",borderRadius:20,
              border:"1px solid "+c+"66",background:c+"22",color:c,
              fontSize:11,fontWeight:700,fontFamily:"Georgia,serif",whiteSpace:"nowrap"}}>
              {partData[id]?.status==="pain"?"🔴":"🟡"} {MUSCLE_NAMES[id]||id}
            </span>
          );
        })}
      </div>

      {/* Detail panel */}
      {selected&&selName&&!readOnly&&(
        <div style={{background:"#111",borderRadius:14,padding:"16px",marginBottom:12,border:"1px solid #222",borderLeft:"3px solid "+RED}}>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:14,gap:8}}>
            <div style={{fontSize:16,fontWeight:900,color:"#fff"}}>{selName}</div>
            {selEx?.updatedAt&&(
              <div style={{fontSize:10,color:"#555",flexShrink:0}}>Updated {fmtDate(selEx.updatedAt)}</div>
            )}
          </div>

          {/* Status buttons */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:9,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>How does it feel?</div>
            <div style={{display:"flex",gap:8}}>
              {Object.entries(STATUS).map(([k,v])=>(
                <button key={k} onClick={()=>{setPStatus(k);if(k==="good")setPPain(0);}} style={{flex:1,padding:"10px 4px",borderRadius:10,border:"1px solid "+(pStatus===k?v.color+"88":"#222"),background:pStatus===k?v.color+"1a":"#0e0e0e",color:pStatus===k?v.color:"#444",fontSize:9,fontWeight:pStatus===k?700:400,cursor:"pointer",fontFamily:"Georgia,serif",textAlign:"center",lineHeight:1.4}}>
                  <div style={{fontSize:16,marginBottom:3}}>{v.emoji}</div>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pain scale */}
          {pStatus!=="good"&&(
            <div style={{marginBottom:14}}>
              <div style={{fontSize:9,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Pain Level{pPain>0?": "+pPain+"/10":""}</div>
              <div style={{display:"flex",gap:4}}>
                {[1,2,3,4,5,6,7,8,9,10].map(n=>{
                  const sel=pPain===n;
                  const c=n<=3?GREEN:n<=6?SORE:RED;
                  return(
                    <button key={n} onClick={()=>setPPain(n)} style={{flex:1,height:34,borderRadius:8,border:"1px solid "+(sel?c+"88":"#222"),background:sel?c+"22":"#0e0e0e",color:sel?c:"#555",fontSize:11,fontWeight:sel?900:400,cursor:"pointer",padding:0}}>
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:9,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>
              Describe the injury
              {pStatus!=="good"&&!descEnough&&(
                <span style={{color:SORE,marginLeft:6,textTransform:"none",letterSpacing:0,fontSize:9}}> · describe it to unlock stretches</span>
              )}
            </div>
            <textarea
              value={pDesc}
              onChange={e=>setPDesc(e.target.value)}
              placeholder="Where exactly does it hurt, what does it feel like, how it happened..."
              style={{width:"100%",minHeight:80,padding:"10px",borderRadius:8,border:"1px solid "+(pDesc.length>5?"#333":"#1e1e1e"),fontSize:13,fontFamily:"Georgia,serif",resize:"vertical",boxSizing:"border-box",background:"#0e0e0e",color:"#ddd",lineHeight:1.6}}
            />
          </div>

          {/* Notify coach toggle */}
          {pStatus!=="good"&&(
            <div style={{marginBottom:14,display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={()=>setNotifyCoach(v=>!v)}>
              <div style={{width:32,height:18,borderRadius:9,background:notifyCoach?RED+"cc":"#2a2a2a",border:"1px solid "+(notifyCoach?RED+"66":"#333"),position:"relative",transition:"background 0.2s",flexShrink:0}}>
                <div style={{position:"absolute",top:2,left:notifyCoach?15:2,width:12,height:12,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
              </div>
              <div style={{fontSize:11,color:notifyCoach?"#ddd":"#555"}}>Notify coach when saved</div>
            </div>
          )}

          {/* Save row */}
          <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",gap:10}}>
            {saved&&<div style={{fontSize:11,color:GREEN,fontWeight:700}}>✓ Saved{notifyCoach&&pStatus!=="good"?" · Coach notified":""}</div>}
            {saveErr&&<div style={{fontSize:11,color:RED,fontWeight:700}}>Save failed — try again</div>}
            <button onClick={savePart} disabled={saving} style={{padding:"10px 24px",borderRadius:8,border:"none",background:saving?"#1a1a1a":"linear-gradient(135deg,"+RED+","+RED+"cc)",color:saving?"#444":"#fff",fontSize:12,fontWeight:700,cursor:saving?"default":"pointer",fontFamily:"Georgia,serif"}}>
              {saving?"Saving...":"Save"}
            </button>
          </div>
        </div>
      )}

      {/* Stretches locked */}
      {showStretches&&!descEnough&&!readOnly&&(
        <div style={{background:"#111",borderRadius:14,padding:"16px",marginBottom:12,border:"1px solid "+SORE+"33",textAlign:"center"}}>
          <div style={{fontSize:20,marginBottom:8}}>🔒</div>
          <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:4}}>Describe your injury first</div>
          <div style={{fontSize:12,color:"#666",lineHeight:1.6}}>Stretches unlock once you've described the injury.</div>
        </div>
      )}

      {/* Stretches */}
      {showStretches&&(descEnough||readOnly)&&(
        <div style={{background:"#111",borderRadius:14,padding:"16px",marginBottom:12,border:"1px solid "+SORE+"33",borderLeft:"3px solid "+SORE}}>
          <div style={{fontSize:14,fontWeight:900,color:"#fff",marginBottom:4}}>Stretches — {selName}</div>
          <div style={{fontSize:11,color:SORE,marginBottom:14,lineHeight:1.6,background:SORE+"11",padding:"10px 12px",borderRadius:8,border:"1px solid "+SORE+"22"}}>
            ⚠️ <strong>Stop any stretch that increases your pain.</strong> These are general mobility exercises — not medical treatment. Check with Coach Ant before training on an injury.
          </div>
          {stretches.map((s,i)=>(
            <div key={i} style={{marginBottom:10,padding:"12px",borderRadius:10,background:"#0e0e0e",border:"1px solid #1e1e1e"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5,gap:8}}>
                <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>{s.name}</div>
                <div style={{fontSize:9,color:SORE,fontWeight:700,background:SORE+"18",padding:"3px 8px",borderRadius:10,whiteSpace:"nowrap",flexShrink:0}}>{s.duration}</div>
              </div>
              <div style={{fontSize:12,color:"#888",lineHeight:1.65,marginBottom:8}}>{s.desc}</div>
              <a href={ytUrl(s.name)} target="_blank" rel="noopener noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,color:"#ff4444",textDecoration:"none",background:"#ff000014",padding:"4px 10px",borderRadius:8,border:"1px solid #ff333322"}}>
                ▶ Watch on YouTube
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
