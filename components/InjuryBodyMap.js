import { useState, useEffect } from "react";
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

// ── Anatomical SVG body map (real polygon paths from react-body-highlighter) ──
function BodySVG({view, partData, selected, onSelect}){
  const BODY="#282828";
  const BASE="#353535";
  const SEL ="#5e58b8";

  const mp=(id)=>{
    const d=partData[id];
    const isFlag=d?.status==="sore"||d?.status==="pain";
    const isSel=selected===id;
    const fill=isFlag
      ?(isSel?(d.status==="pain"?RED:SORE):(d.status==="pain"?"#631515":"#7a4e00"))
      :(isSel?SEL:BASE);
    const stroke=isSel?"#9990e8":isFlag?(d.status==="pain"?RED+"99":SORE+"99"):"none";
    const sw=isSel?1.5:0.7;
    const filter=isSel
      ?"drop-shadow(0 0 5px #5e58b899)"
      :isFlag?`drop-shadow(0 0 4px ${d.status==="pain"?RED:SORE}aa)`
      :"none";
    return{fill,stroke,strokeWidth:sw,style:{cursor:"pointer",filter,transition:"all 0.12s"},
      onClick:(e)=>{e.stopPropagation();onSelect(id);}};
  };

  const svgStyle={display:"block",width:"100%",maxWidth:200,margin:"0 auto"};

  if(view==="front") return(
    <svg viewBox="0 0 100 215" style={svgStyle}>
      <rect width="100" height="215" fill="#111"/>
      {/* silhouette */}
      <ellipse cx="50" cy="13" rx="12" ry="13" fill={BODY}/>
      <rect x="42" y="24" width="16" height="9" rx="3" fill={BODY}/>
      <rect x="28" y="30" width="44" height="42" rx="10" fill={BODY}/>
      <rect x="17" y="30" width="14" height="44" rx="7" fill={BODY}/>
      <rect x="69" y="30" width="14" height="44" rx="7" fill={BODY}/>
      <rect x="33" y="68" width="34" height="40" rx="5" fill={BODY}/>
      <rect x="15" y="68" width="12" height="36" rx="6" fill={BODY}/>
      <rect x="73" y="68" width="12" height="36" rx="6" fill={BODY}/>
      <rect x="2"  y="99" width="16" height="14" rx="6" fill={BODY}/>
      <rect x="82" y="99" width="16" height="14" rx="6" fill={BODY}/>
      <rect x="30" y="90" width="40" height="70" rx="8" fill={BODY}/>
      <rect x="32" y="153" width="15" height="57" rx="8" fill={BODY}/>
      <rect x="53" y="153" width="15" height="57" rx="8" fill={BODY}/>
      <rect x="29" y="200" width="21" height="14" rx="5" fill={BODY}/>
      <rect x="50" y="200" width="21" height="14" rx="5" fill={BODY}/>
      {/* HEAD */}
      <polygon points="42.4 2.9 40 11.8 42 19.6 46.1 23.3 49.8 25.3 54.7 22.4 57.6 19.2 59.2 10.2 57.1 2.4 49.8 0" {...mp("head")}/>
      {/* NECK */}
      <polygon points="55.5 23.7 50.6 33.5 50.6 39.2 61.6 40 70.6 44.9 69.4 36.7 63.3 35.1 58.4 30.6" {...mp("neck")}/>
      <polygon points="29 44.9 30.2 37.1 36.3 35.1 41.2 30.2 44.5 24.5 49 33.9 48.6 39.2 38 39.6" {...mp("neck")}/>
      {/* FRONT DELTOIDS */}
      <polygon points="78.4 53.1 79.6 47.8 79.2 41.2 75.9 38 71 36.3 72.2 42.9 71.4 47.3" {...mp("front-deltoids")}/>
      <polygon points="28.2 47.3 21.2 53.1 20 47.8 20.4 40.8 24.5 37.1 28.6 37.1 27 43.3" {...mp("front-deltoids")}/>
      {/* CHEST */}
      <polygon points="51.8 41.6 51 55.1 58 57.9 67.8 55.5 70.6 47.3 62 41.6" {...mp("chest")}/>
      <polygon points="29.8 46.5 31.4 55.5 40.8 57.9 48.2 55.1 47.8 42 37.6 42" {...mp("chest")}/>
      {/* BICEPS */}
      <polygon points="16.7 68.2 18 71.4 22.9 66.1 29 53.9 27.8 49.4 20.4 55.9" {...mp("biceps")}/>
      <polygon points="71.4 49.4 70.2 54.7 76.3 66.1 81.6 71.8 82.9 69 78.8 55.5" {...mp("biceps")}/>
      {/* TRICEPS (visible on sides) */}
      <polygon points="69.4 55.5 69.4 61.6 75.9 72.7 77.6 70.2 75.5 67.3" {...mp("triceps")}/>
      <polygon points="22.4 69.4 29.8 55.5 29.8 60.8 22.9 73.1" {...mp("triceps")}/>
      {/* FOREARM */}
      <polygon points="6.1 88.6 10.2 75.1 14.7 70.2 16.3 74.3 19.2 73.5 4.5 97.6 0 100" {...mp("forearm")}/>
      <polygon points="84.5 69.8 83.3 73.5 80 73.1 95.1 98.4 100 100.4 93.5 89.4 89.8 76.3" {...mp("forearm")}/>
      <polygon points="77.6 72.2 77.6 77.6 80.4 84.1 85.3 89.8 92.2 101.2 94.7 99.6" {...mp("forearm")}/>
      <polygon points="6.9 101.2 13.5 90.6 18.8 84.1 21.6 77.1 21.2 71.8 4.9 98.8" {...mp("forearm")}/>
      {/* ABS */}
      <polygon points="56.3 59.2 58 64.1 58.4 78 58.4 92.7 56.3 98.4 55.1 104.1 51.4 107.8 51 84.5 50.6 67.3 51 57.1" {...mp("abs")}/>
      <polygon points="43.7 58.8 48.6 57.1 49 67.3 48.6 84.5 48.2 107.3 44.5 103.7 40.8 91.4 40.8 78.4 41.2 64.5" {...mp("abs")}/>
      {/* OBLIQUES */}
      <polygon points="68.6 63.3 67.3 57.1 58.8 59.6 60 64.1 60.4 83.3 65.7 78.8 66.5 69.8" {...mp("obliques")}/>
      <polygon points="33.9 78.4 33.1 71.8 31 63.3 32.2 57.1 40.8 59.2 39.2 63.3 39.2 83.7" {...mp("obliques")}/>
      {/* ABDUCTORS (outer thigh / hip) */}
      <polygon points="52.7 110.2 54.3 124.9 60 110.2 62 100 64.9 94.3 60 92.7 56.7 104.5" {...mp("abductors")}/>
      <polygon points="47.8 110.6 44.9 125.3 42 115.9 40.4 113.1 39.6 107.3 38 102.4 34.7 93.9 39.6 92.2 41.6 99.2 43.7 105.3" {...mp("abductors")}/>
      {/* QUADRICEPS */}
      <polygon points="34.7 98.8 37.1 108.2 37.1 127.8 34.3 137.1 31 132.7 29.4 120 28.2 111.4 29.4 100.8 32.2 94.7" {...mp("quadriceps")}/>
      <polygon points="63.3 105.7 64.5 100 66.9 94.7 70.2 101.2 71 111.8 68.2 133.1 65.3 137.6 62.4 128.6 62 111.4" {...mp("quadriceps")}/>
      <polygon points="38.8 129.4 38.4 112.2 41.2 118.4 44.5 129.4 42.9 135.1 40 146.1 36.3 146.5 35.5 140" {...mp("quadriceps")}/>
      <polygon points="59.6 145.7 55.5 129 60.8 113.9 61.2 130.2 64.1 139.6 62.9 146.5" {...mp("quadriceps")}/>
      <polygon points="32.7 138.4 26.5 145.7 25.7 136.7 25.7 127.3 26.9 114.3 29.4 133.5" {...mp("quadriceps")}/>
      <polygon points="71.8 113.1 73.9 124.1 73.9 140.4 72.7 145.7 66.5 138.4 70.2 133.5" {...mp("quadriceps")}/>
      {/* KNEES */}
      <polygon points="33.9 140 34.7 143.3 35.5 147.3 36.3 151 35.1 156.7 29.8 156.7 27.3 152.7 27.3 147.3 30.2 144.1" {...mp("knees")}/>
      <polygon points="65.7 140 72.2 147.8 72.2 152.2 69.8 157.1 64.9 156.7 62.9 151" {...mp("knees")}/>
      {/* SHINS / ANTERIOR LOWER LEG (left-soleus=athlete left=SVG right, right-soleus=athlete right=SVG left) */}
      <polygon points="71.4 160.4 73.5 153.5 76.7 161.2 79.6 167.8 78.4 187.8 79.6 195.5 74.7 195.5" {...mp("left-soleus")}/>
      <polygon points="72.7 195.1 69.8 159.2 65.3 158.4 64.1 162.4 64.1 165.3 65.7 177.1" {...mp("left-soleus")}/>
      <polygon points="24.9 194.7 27.8 164.9 28.2 160.4 26.1 154.3 24.9 157.6 22.4 161.6 20.8 167.8 22 188.2 20.8 195.5" {...mp("right-soleus")}/>
      <polygon points="35.5 158.4 35.9 162.4 35.9 166.9 35.1 172.2 35.1 176.7 32.2 182 30.6 187.3 26.9 194.7 27.3 187.8 28.2 180.4 28.6 175.5 29 169.8 29.8 164.1 30.2 158.8" {...mp("right-soleus")}/>
      {/* HANDS */}
      <polygon points="0 100 1 107 3 113 8 115 14 113 17 107 15 100" {...mp("left-hand")}/>
      <polygon points="85 100 82 107 84 113 90 115 96 113 99 107 100 100" {...mp("right-hand")}/>
      {/* ANKLES / FEET */}
      <polygon points="21 196 19 204 22 211 28 214 34 212 36 205 35 197" {...mp("right-ankle")}/>
      <polygon points="64 197 63 205 65 212 71 214 77 211 79 204 78 197" {...mp("left-ankle")}/>
    </svg>
  );

  return(
    <svg viewBox="0 0 100 215" style={svgStyle}>
      <rect width="100" height="215" fill="#111"/>
      {/* silhouette */}
      <ellipse cx="50" cy="11" rx="11" ry="11" fill={BODY}/>
      <rect x="42" y="21" width="16" height="9" rx="3" fill={BODY}/>
      <rect x="28" y="28" width="44" height="48" rx="10" fill={BODY}/>
      <rect x="16" y="30" width="15" height="46" rx="7" fill={BODY}/>
      <rect x="69" y="30" width="15" height="46" rx="7" fill={BODY}/>
      <rect x="33" y="72" width="34" height="34" rx="5" fill={BODY}/>
      <rect x="15" y="72" width="12" height="34" rx="6" fill={BODY}/>
      <rect x="73" y="72" width="12" height="34" rx="6" fill={BODY}/>
      <rect x="3"  y="99" width="15" height="14" rx="6" fill={BODY}/>
      <rect x="82" y="99" width="15" height="14" rx="6" fill={BODY}/>
      <rect x="30" y="96" width="40" height="68" rx="8" fill={BODY}/>
      <rect x="32" y="156" width="15" height="58" rx="8" fill={BODY}/>
      <rect x="53" y="156" width="15" height="58" rx="8" fill={BODY}/>
      <rect x="29" y="203" width="20" height="11" rx="4" fill={BODY}/>
      <rect x="51" y="203" width="20" height="11" rx="4" fill={BODY}/>
      {/* HEAD */}
      <polygon points="50.6 0 46 0.9 40.9 5.5 40.4 12.8 45.1 20 55.7 20 59.1 13.6 59.6 4.7 55.7 1.3" {...mp("head")}/>
      {/* TRAPEZIUS */}
      <polygon points="44.7 21.7 47.7 21.7 47.2 38.3 47.7 64.7 38.3 53.2 35.3 40.9 31.1 36.6 39.1 33.2 43.8 27.2" {...mp("trapezius")}/>
      <polygon points="52.3 21.7 55.7 21.7 56.6 27.2 60.9 32.8 68.9 36.6 64.7 40.4 61.7 53.2 52.3 64.7 53.2 38.3" {...mp("trapezius")}/>
      {/* BACK DELTOIDS */}
      <polygon points="29.4 37 23 39.1 17.4 44.3 18.3 53.6 24.3 49.4 27.2 46.4" {...mp("back-deltoids")}/>
      <polygon points="71.1 37 78.3 39.6 82.6 44.7 81.7 53.6 74.9 49 72.3 45.1" {...mp("back-deltoids")}/>
      {/* UPPER BACK */}
      <polygon points="31.1 38.7 28.1 48.9 28.5 55.3 34 75.3 47.2 71.1 47.2 66.4 36.6 54 33.6 41.3" {...mp("upper-back")}/>
      <polygon points="68.9 38.7 71.9 49.4 71.5 56.2 66 75.3 52.8 71.1 52.8 66.4 63.4 54.5 66.4 41.7" {...mp("upper-back")}/>
      {/* TRICEPS */}
      <polygon points="26.8 49.8 17.9 55.7 14.5 72.3 16.6 81.7 21.7 63.8 26.8 55.7" {...mp("triceps")}/>
      <polygon points="73.6 50.2 82.1 55.7 86 73.2 83.4 82.1 77.9 63 73.2 55.7" {...mp("triceps")}/>
      <polygon points="26.8 58.3 26.8 68.5 23 75.3 19.1 77.4 22.6 65.5" {...mp("triceps")}/>
      <polygon points="72.8 58.3 77 64.7 80.4 77.4 76.6 75.3 72.8 68.9" {...mp("triceps")}/>
      {/* LOWER BACK */}
      <polygon points="47.7 72.8 34.5 77 35.3 83.4 49.4 102.1 46.8 82.9" {...mp("lower-back")}/>
      <polygon points="52.3 72.8 65.5 77 64.7 83.4 50.6 102.1 53.2 83.8" {...mp("lower-back")}/>
      {/* FOREARM */}
      <polygon points="86.4 75.7 91.1 83.4 93.2 94 100 106.4 96.2 104.3 88.1 89.4 84.3 83.8" {...mp("forearm")}/>
      <polygon points="13.6 75.7 8.9 83.8 6.8 93.6 0 106.4 3.8 104.3 12.3 88.5 15.7 83" {...mp("forearm")}/>
      <polygon points="81.3 79.6 77.4 77.9 79.1 84.7 91.1 103.8 93.2 108.9 94.5 104.7" {...mp("forearm")}/>
      <polygon points="18.7 79.6 22.1 77.9 20.9 84.2 9.4 103 6.8 108.5 5.1 104.7" {...mp("forearm")}/>
      {/* GLUTEAL */}
      <polygon points="44.7 99.6 30.2 108.5 29.8 118.7 31.5 126 47.2 121.3 49.4 114.9" {...mp("gluteal")}/>
      <polygon points="55.3 99.1 51.1 114.5 52.3 120.9 68.1 126 69.8 119.1 69.4 108.5" {...mp("gluteal")}/>
      {/* ABDUCTORS */}
      <polygon points="48.1 123 44.7 123 41.3 125.5 45.1 144.3 48.5 135.7 48.9 129.4" {...mp("abductors")}/>
      <polygon points="51.9 122.6 55.7 123.4 59.1 126 54.9 144.3 51.9 136.2 51.1 129.4" {...mp("abductors")}/>
      {/* HAMSTRING */}
      <polygon points="28.9 122.1 31.1 129.4 36.6 126 35.3 135.3 34.5 150.2 29.4 158.3 28.9 146.8 27.7 141.3 27.2 131.5" {...mp("hamstring")}/>
      <polygon points="71.5 121.7 69.4 128.9 63.8 126 65.5 136.6 66.4 150.2 71.1 158.3 71.5 147.7 72.8 142.1 73.6 131.9" {...mp("hamstring")}/>
      <polygon points="38.7 125.5 44.3 146 40.4 166.8 36.2 152.8 37 135.3" {...mp("hamstring")}/>
      <polygon points="61.7 125.5 63.4 136.2 64.3 153.2 60 166.8 56.2 146.4" {...mp("hamstring")}/>
      {/* KNEES */}
      <polygon points="34.5 153.2 31.1 159.1 33.6 166.4 37.4 162.6" {...mp("knees")}/>
      <polygon points="66.4 153.6 63 163 66.8 166.4 69.4 159.1" {...mp("knees")}/>
      {/* CALVES */}
      <polygon points="29.4 160.4 28.5 167.2 24.7 179.6 23.8 192.8 25.5 197 28.5 193.2 29.8 180 31.9 171.1 31.9 166.8" {...mp("calves")}/>
      <polygon points="37.4 165.1 35.3 167.7 33.2 171.9 31.1 180.4 30.2 191.9 34 200 38.7 190.6 39.1 168.9" {...mp("calves")}/>
      <polygon points="63 165.1 61.3 168.5 61.7 190.6 66.4 199.6 70.6 191.9 68.9 179.6 66.8 170.2" {...mp("calves")}/>
      <polygon points="70.6 160.4 72.3 168.5 75.7 179.1 76.6 192.8 74.5 196.6 72.3 193.6 70.6 179.6 68.1 168.1" {...mp("calves")}/>
      {/* SOLEUS (posterior lower leg) */}
      <polygon points="28.5 195.7 30.2 195.7 33.6 201.7 30.6 213 28.5 208 26.8 198.3" {...mp("left-soleus")}/>
      <polygon points="69.8 195.7 71.9 195.7 73.6 198.3 71.9 208 70.2 213 67.2 202.1" {...mp("right-soleus")}/>
      {/* HANDS */}
      <polygon points="0 100 1 107 3 113 8 115 14 113 17 107 15 100" {...mp("left-hand")}/>
      <polygon points="85 100 82 107 84 113 90 115 96 113 99 107 100 100" {...mp("right-hand")}/>
      {/* ANKLES / FEET */}
      <polygon points="21 196 19 204 22 211 28 214 34 212 36 205 35 197" {...mp("right-ankle")}/>
      <polygon points="64 197 63 205 65 212 71 214 77 211 79 204 78 197" {...mp("left-ankle")}/>
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────
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

  return(
    <div>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:12}}>
        <div>
          <div style={{fontSize:14,fontWeight:800,color:"#fff",letterSpacing:"-0.01em"}}>Body Check-In</div>
          <div style={{fontSize:11,color:"#444",marginTop:2}}>{readOnly?"Athlete's injury status":"Tap a muscle or chip to log it"}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {injCount>0&&!readOnly&&(
            <button onClick={clearAll} disabled={clearing} style={{fontSize:10,color:"#555",background:"#0e0e0e",border:"1px solid #2a2a2a",padding:"4px 12px",borderRadius:20,cursor:"pointer",fontFamily:"Georgia,serif"}}>
              {clearing?"…":"Clear all"}
            </button>
          )}
          {injCount>0&&(
            <div style={{fontSize:11,color:RED,fontWeight:800,background:RED+"18",padding:"4px 12px",borderRadius:20,border:"1px solid "+RED+"33",whiteSpace:"nowrap"}}>
              {injCount} flagged
            </div>
          )}
        </div>
      </div>

      {/* Front / Back toggle */}
      <div style={{display:"flex",gap:6,marginBottom:14,background:"#0a0a0a",borderRadius:14,padding:4,border:"1px solid #222"}}>
        {["front","back"].map(v=>(
          <button key={v} onClick={()=>{setView(v);setSelected(null);}} style={{flex:1,padding:"10px 0",borderRadius:10,border:"none",background:view===v?"#1e1e1e":"transparent",color:view===v?"#ddd":"#3a3a3a",fontSize:12,fontWeight:view===v?700:400,cursor:"pointer",fontFamily:"Georgia,serif",letterSpacing:"0.06em",textTransform:"uppercase",transition:"all 0.15s",boxShadow:view===v?"0 1px 6px rgba(0,0,0,0.5)":"none"}}>
            {v==="front"?"Front":"Back"}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:12,flexWrap:"wrap"}}>
        {Object.entries(STATUS).map(([k,v])=>(
          <div key={k} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:"#555"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:v.color}}/>
            {v.label}
          </div>
        ))}
      </div>

      {/* Body map */}
      <div style={{background:"#111",borderRadius:16,padding:"16px 8px 14px",marginBottom:14,border:"1px solid #222"}}>
        <BodySVG view={view} partData={partData} selected={selected} onSelect={selectPart}/>
        {selected?(
          <div style={{textAlign:"center",marginTop:10}}>
            <span style={{fontSize:12,fontWeight:700,color:STATUS[pStatus]?.color||"#fff",background:(STATUS[pStatus]?.color||"#fff")+"18",padding:"5px 16px",borderRadius:20,border:"1px solid "+(STATUS[pStatus]?.color||"#fff")+"33"}}>
              {selName} · {STATUS[pStatus]?.label}
            </span>
          </div>
        ):(
          !readOnly&&<div style={{textAlign:"center",fontSize:10,color:"#2e2e2e",marginTop:8,letterSpacing:"0.06em",textTransform:"uppercase"}}>tap a muscle or chip below</div>
        )}
      </div>

      {/* Muscle chips */}
      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:16,padding:"2px 0"}}>
        {chips.map(id=>{
          const c=chipColor(id);
          const isSel=selected===id;
          if(readOnly&&!c)return null;
          return(
            <button key={id} onClick={()=>selectPart(id)}
              style={{padding:"6px 11px",borderRadius:20,
                border:"1px solid "+(isSel?"#4a4a6a":c?c+"55":"#222"),
                background:isSel?"#2a2a40":c?c+"1a":"#0e0e0e",
                color:isSel?"#c0b8ff":c?c:"#444",
                fontSize:10,fontWeight:isSel?700:c?600:400,
                cursor:readOnly?"default":"pointer",
                fontFamily:"Georgia,serif",whiteSpace:"nowrap",transition:"all 0.1s"}}>
              {c&&<span style={{marginRight:3,fontSize:8}}>{partData[id]?.status==="pain"?"●":"●"}</span>}
              {MUSCLE_NAMES[id]}
            </button>
          );
        })}
        {readOnly&&Object.keys(partData).filter(id=>!chips.includes(id)&&(partData[id]?.status==="sore"||partData[id]?.status==="pain")).map(id=>{
          const c=chipColor(id);
          return(
            <span key={id} style={{padding:"6px 11px",borderRadius:20,
              border:"1px solid "+c+"55",background:c+"1a",color:c,
              fontSize:10,fontWeight:600,fontFamily:"Georgia,serif",whiteSpace:"nowrap"}}>
              {MUSCLE_NAMES[id]||id}
            </span>
          );
        })}
      </div>

      {/* Read-only detail panel (coach view) */}
      {selected&&selName&&readOnly&&(()=>{
        const d=partData[selected];
        if(!d||d.status==="good")return(
          <div style={{background:"#111",borderRadius:12,padding:"12px 16px",marginBottom:12,border:"1px solid #1e1e1e",fontSize:12,color:"#555",fontStyle:"italic"}}>
            No issues reported for {selName}.
          </div>
        );
        const st=STATUS[d.status]||STATUS.good;
        const sk=MUSCLE_STRETCH[selected]||"";
        const slist=STRETCHES[sk]||[];
        return(
          <div style={{background:"#111",borderRadius:14,padding:"16px",marginBottom:12,border:"1px solid #222",borderLeft:"3px solid "+st.color}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,gap:8,flexWrap:"wrap"}}>
              <div style={{fontSize:15,fontWeight:900,color:"#fff"}}>{selName}</div>
              <span style={{fontSize:11,background:st.color+"22",color:st.color,padding:"4px 12px",borderRadius:20,border:"1px solid "+st.color+"44",fontWeight:700,whiteSpace:"nowrap"}}>
                {st.emoji} {st.label}{d.pain>0?" · "+d.pain+"/10":""}
              </span>
            </div>
            {d.description?(
              <div style={{fontSize:13,color:"#aaa",lineHeight:1.65,fontStyle:"italic",marginBottom:8}}>"{d.description}"</div>
            ):(
              <div style={{fontSize:12,color:"#555",fontStyle:"italic",marginBottom:8}}>No description provided.</div>
            )}
            {d.updatedAt&&<div style={{fontSize:9,color:"#444",marginBottom:slist.length?12:0}}>{fmtDate(d.updatedAt)}</div>}
            {slist.length>0&&(
              <div>
                <div style={{fontSize:9,color:SORE,textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:800,marginBottom:8}}>Recommended Stretches</div>
                {slist.map((s,i)=>(
                  <div key={i} style={{marginBottom:7,padding:"10px 12px",borderRadius:8,background:"#0e0e0e",border:"1px solid #1e1e1e"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:4}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#ddd"}}>{s.name}</div>
                      <div style={{fontSize:9,color:SORE,background:SORE+"18",padding:"2px 8px",borderRadius:8,whiteSpace:"nowrap",flexShrink:0}}>{s.duration}</div>
                    </div>
                    <div style={{fontSize:11,color:"#666",lineHeight:1.55}}>{s.desc}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Editable detail panel (athlete view) */}
      {selected&&selName&&!readOnly&&(
        <div style={{background:"#111",borderRadius:14,padding:"16px",marginBottom:12,border:"1px solid #222"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,gap:8}}>
            <div style={{fontSize:15,fontWeight:800,color:"#fff",letterSpacing:"-0.01em"}}>{selName}</div>
            {selEx?.updatedAt&&(
              <div style={{fontSize:10,color:"#333",flexShrink:0}}>{fmtDate(selEx.updatedAt)}</div>
            )}
          </div>

          <div style={{marginBottom:14}}>
            <div style={{fontSize:9,color:"#3a3a3a",textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:700,marginBottom:8}}>How does it feel?</div>
            <div style={{display:"flex",gap:6}}>
              {Object.entries(STATUS).map(([k,v])=>(
                <button key={k} onClick={()=>{setPStatus(k);if(k==="good")setPPain(0);}} style={{flex:1,padding:"10px 4px",borderRadius:10,border:"1px solid "+(pStatus===k?v.color+"55":"#1e1e1e"),background:pStatus===k?v.color+"18":"#0a0a0a",color:pStatus===k?v.color:"#3a3a3a",fontSize:9,fontWeight:pStatus===k?700:400,cursor:"pointer",fontFamily:"Georgia,serif",textAlign:"center",lineHeight:1.5,transition:"all 0.1s"}}>
                  <div style={{fontSize:15,marginBottom:3}}>{v.emoji}</div>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {pStatus!=="good"&&(
            <div style={{marginBottom:14}}>
              <div style={{fontSize:9,color:"#3a3a3a",textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:700,marginBottom:8}}>Pain Level{pPain>0?" — "+pPain+"/10":""}</div>
              <div style={{display:"flex",gap:3}}>
                {[1,2,3,4,5,6,7,8,9,10].map(n=>{
                  const sel=pPain===n;
                  const c=n<=3?GREEN:n<=6?SORE:RED;
                  return(
                    <button key={n} onClick={()=>setPPain(n)} style={{flex:1,height:32,borderRadius:6,border:"1px solid "+(sel?c+"66":"#1e1e1e"),background:sel?c+"22":"#0a0a0a",color:sel?c:"#333",fontSize:10,fontWeight:sel?800:400,cursor:"pointer",padding:0,transition:"all 0.1s"}}>
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{marginBottom:14}}>
            <div style={{fontSize:9,color:"#3a3a3a",textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:700,marginBottom:8}}>
              Describe it
              {pStatus!=="good"&&!descEnough&&<span style={{color:SORE,marginLeft:6,textTransform:"none",letterSpacing:0,fontSize:9,fontWeight:400}}> · 10+ chars to unlock stretches</span>}
            </div>
            <textarea
              value={pDesc}
              onChange={e=>setPDesc(e.target.value)}
              placeholder="Where does it hurt, what it feels like, how it happened..."
              style={{width:"100%",minHeight:76,padding:"10px 12px",borderRadius:8,border:"1px solid "+(pDesc.length>5?"#2a2a2a":"#1a1a1a"),fontSize:13,fontFamily:"Georgia,serif",resize:"vertical",boxSizing:"border-box",background:"#0a0a0a",color:"#ccc",lineHeight:1.6,outline:"none"}}
            />
          </div>

          {pStatus!=="good"&&(
            <div style={{marginBottom:14,display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={()=>setNotifyCoach(v=>!v)}>
              <div style={{width:30,height:17,borderRadius:9,background:notifyCoach?"#5e4444":"#1e1e1e",border:"1px solid "+(notifyCoach?RED+"44":"#2a2a2a"),position:"relative",transition:"background 0.2s",flexShrink:0}}>
                <div style={{position:"absolute",top:2,left:notifyCoach?13:2,width:11,height:11,borderRadius:"50%",background:notifyCoach?RED:"#444",transition:"all 0.2s"}}/>
              </div>
              <div style={{fontSize:11,color:notifyCoach?"#aaa":"#3a3a3a"}}>Notify coach</div>
            </div>
          )}

          <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",gap:10}}>
            {saved&&<div style={{fontSize:11,color:GREEN,fontWeight:700}}>Saved{notifyCoach&&pStatus!=="good"?" · coach notified":""}</div>}
            {saveErr&&<div style={{fontSize:11,color:RED,fontWeight:700}}>Save failed</div>}
            <button onClick={savePart} disabled={saving} style={{padding:"9px 22px",borderRadius:8,border:"none",background:saving?"#1a1a1a":"#2a2a2a",color:saving?"#333":"#ccc",fontSize:12,fontWeight:700,cursor:saving?"default":"pointer",fontFamily:"Georgia,serif",letterSpacing:"0.02em"}}>
              {saving?"Saving…":"Save"}
            </button>
          </div>
        </div>
      )}

      {/* Stretches locked */}
      {showStretches&&!descEnough&&!readOnly&&(
        <div style={{background:"#111",borderRadius:12,padding:"14px 16px",marginBottom:12,border:"1px solid #222",display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:18,flexShrink:0}}>🔒</div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:"#888",marginBottom:2}}>Stretches locked</div>
            <div style={{fontSize:11,color:"#3a3a3a",lineHeight:1.5}}>Describe the injury (10+ chars) to unlock.</div>
          </div>
        </div>
      )}

      {/* Stretches */}
      {showStretches&&(descEnough||readOnly)&&(
        <div style={{background:"#111",borderRadius:14,padding:"16px",marginBottom:12,border:"1px solid #222"}}>
          <div style={{fontSize:13,fontWeight:800,color:"#ccc",marginBottom:3,letterSpacing:"-0.01em"}}>Stretches — {selName}</div>
          <div style={{fontSize:10,color:"#3a3a3a",marginBottom:14,lineHeight:1.6}}>
            Stop any stretch that increases pain. General mobility only — check with Coach Ant before training on an injury.
          </div>
          {stretches.map((s,i)=>(
            <div key={i} style={{marginBottom:8,padding:"12px",borderRadius:10,background:"#0a0a0a",border:"1px solid #1e1e1e"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4,gap:8}}>
                <div style={{fontSize:12,fontWeight:700,color:"#ccc"}}>{s.name}</div>
                <div style={{fontSize:9,color:"#555",background:"#1a1a1a",padding:"2px 8px",borderRadius:8,whiteSpace:"nowrap",flexShrink:0}}>{s.duration}</div>
              </div>
              <div style={{fontSize:11,color:"#555",lineHeight:1.6,marginBottom:8}}>{s.desc}</div>
              <a href={ytUrl(s.name)} target="_blank" rel="noopener noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,color:"#cc3333",textDecoration:"none",background:"#1a0808",padding:"4px 10px",borderRadius:6,border:"1px solid #2a1010"}}>
                ▶ Watch on YouTube
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
