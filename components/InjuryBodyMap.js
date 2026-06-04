import { useState, useEffect } from "react";
import { GREEN, RED, GOLD } from "../lib/constants";
import { supabase } from "../lib/supabase";

const SORE = "#C8941F";
const STATUS = {
  good:{ color:GREEN, label:"All Good",      emoji:"💚" },
  sore:{ color:SORE,  label:"A Little Sore", emoji:"🟡" },
  pain:{ color:RED,   label:"In Pain",       emoji:"🔴" },
};

// All zones are simple rectangles — SVG clipPath clips them to the body silhouette shape
const FRONT=[
  {id:"head",           name:"Head",           lbl:"Head",    s:"e",cx:100,cy:28,rx:20,ry:23},
  {id:"neck",           name:"Neck",           lbl:"Neck",    s:"p",d:"M 86,50 L114,50 L114,68 L86,68 Z",lx:100,ly:60},
  {id:"left_shoulder",  name:"Left Shoulder",  lbl:"L.Shldr", s:"p",d:"M 28,72 L62,72 L62,112 L28,112 Z",lx:45,ly:92},
  {id:"right_shoulder", name:"Right Shoulder", lbl:"R.Shldr", s:"p",d:"M 138,72 L172,72 L172,112 L138,112 Z",lx:155,ly:92},
  {id:"chest",          name:"Chest",          lbl:"Chest",   s:"p",d:"M 60,110 L140,110 L140,168 L60,168 Z",lx:100,ly:140},
  {id:"left_upper_arm", name:"Left Upper Arm", lbl:"L.Arm",   s:"p",d:"M 18,110 L62,110 L62,180 L18,180 Z",lx:38,ly:145},
  {id:"right_upper_arm",name:"Right Upper Arm",lbl:"R.Arm",   s:"p",d:"M 138,110 L182,110 L182,180 L138,180 Z",lx:162,ly:145},
  {id:"left_elbow",     name:"Left Elbow",     lbl:"L.Elbow", s:"p",d:"M 18,180 L62,180 L62,204 L18,204 Z",lx:38,ly:193},
  {id:"right_elbow",    name:"Right Elbow",    lbl:"R.Elbow", s:"p",d:"M 138,180 L182,180 L182,204 L138,204 Z",lx:162,ly:193},
  {id:"left_forearm",   name:"Left Forearm",   lbl:"L.Fore",  s:"p",d:"M 16,204 L60,204 L60,256 L16,256 Z",lx:36,ly:230},
  {id:"right_forearm",  name:"Right Forearm",  lbl:"R.Fore",  s:"p",d:"M 140,204 L184,204 L184,256 L140,256 Z",lx:164,ly:230},
  {id:"core",           name:"Core / Abs",     lbl:"Core",    s:"p",d:"M 60,168 L140,168 L140,222 L60,222 Z",lx:100,ly:196},
  {id:"left_wrist",     name:"Left Wrist",     lbl:"L.Wrist", s:"p",d:"M 16,256 L58,256 L58,284 L16,284 Z",lx:36,ly:270},
  {id:"right_wrist",    name:"Right Wrist",    lbl:"R.Wrist", s:"p",d:"M 142,256 L184,256 L184,284 L142,284 Z",lx:164,ly:270},
  {id:"left_hip",       name:"Left Hip",       lbl:"L.Hip",   s:"p",d:"M 58,220 L86,220 L86,250 L56,250 Z",lx:68,ly:236},
  {id:"right_hip",      name:"Right Hip",      lbl:"R.Hip",   s:"p",d:"M 114,220 L142,220 L144,250 L114,250 Z",lx:132,ly:236},
  {id:"left_quad",      name:"Left Quad",      lbl:"L.Quad",  s:"p",d:"M 54,250 L86,250 L86,318 L54,318 Z",lx:68,ly:284},
  {id:"right_quad",     name:"Right Quad",     lbl:"R.Quad",  s:"p",d:"M 114,250 L146,250 L146,318 L114,318 Z",lx:132,ly:284},
  {id:"left_knee",      name:"Left Knee",      lbl:"L.Knee",  s:"p",d:"M 54,318 L86,318 L86,342 L54,342 Z",lx:68,ly:330},
  {id:"right_knee",     name:"Right Knee",     lbl:"R.Knee",  s:"p",d:"M 114,318 L146,318 L146,342 L114,342 Z",lx:132,ly:330},
  {id:"left_shin",      name:"Left Shin",      lbl:"L.Shin",  s:"p",d:"M 54,342 L86,342 L86,392 L54,392 Z",lx:68,ly:367},
  {id:"right_shin",     name:"Right Shin",     lbl:"R.Shin",  s:"p",d:"M 114,342 L146,342 L146,392 L114,392 Z",lx:132,ly:367},
  {id:"left_ankle",     name:"Left Ankle",     lbl:"L.Ankle", s:"p",d:"M 52,392 L88,392 L88,422 L52,422 Z",lx:70,ly:408},
  {id:"right_ankle",    name:"Right Ankle",    lbl:"R.Ankle", s:"p",d:"M 112,392 L148,392 L148,422 L112,422 Z",lx:130,ly:408},
];

const BACK=[
  {id:"head",            name:"Head",            lbl:"Head",    s:"e",cx:100,cy:28,rx:20,ry:23},
  {id:"neck",            name:"Neck",            lbl:"Neck",    s:"p",d:"M 86,50 L114,50 L114,68 L86,68 Z",lx:100,ly:60},
  {id:"left_shoulder",   name:"Left Shoulder",   lbl:"L.Shldr", s:"p",d:"M 28,72 L62,72 L62,112 L28,112 Z",lx:45,ly:92},
  {id:"right_shoulder",  name:"Right Shoulder",  lbl:"R.Shldr", s:"p",d:"M 138,72 L172,72 L172,112 L138,112 Z",lx:155,ly:92},
  {id:"upper_back",      name:"Upper Back",      lbl:"Up.Back", s:"p",d:"M 60,110 L140,110 L140,168 L60,168 Z",lx:100,ly:140},
  {id:"left_upper_arm",  name:"Left Upper Arm",  lbl:"L.Arm",   s:"p",d:"M 18,110 L62,110 L62,180 L18,180 Z",lx:38,ly:145},
  {id:"right_upper_arm", name:"Right Upper Arm", lbl:"R.Arm",   s:"p",d:"M 138,110 L182,110 L182,180 L138,180 Z",lx:162,ly:145},
  {id:"left_elbow",      name:"Left Elbow",      lbl:"L.Elbow", s:"p",d:"M 18,180 L62,180 L62,204 L18,204 Z",lx:38,ly:193},
  {id:"right_elbow",     name:"Right Elbow",     lbl:"R.Elbow", s:"p",d:"M 138,180 L182,180 L182,204 L138,204 Z",lx:162,ly:193},
  {id:"left_forearm",    name:"Left Forearm",    lbl:"L.Fore",  s:"p",d:"M 16,204 L60,204 L60,256 L16,256 Z",lx:36,ly:230},
  {id:"right_forearm",   name:"Right Forearm",   lbl:"R.Fore",  s:"p",d:"M 140,204 L184,204 L184,256 L140,256 Z",lx:164,ly:230},
  {id:"lower_back",      name:"Lower Back",      lbl:"Lo.Back", s:"p",d:"M 60,168 L140,168 L140,222 L60,222 Z",lx:100,ly:196},
  {id:"left_wrist",      name:"Left Wrist",      lbl:"L.Wrist", s:"p",d:"M 16,256 L58,256 L58,284 L16,284 Z",lx:36,ly:270},
  {id:"right_wrist",     name:"Right Wrist",     lbl:"R.Wrist", s:"p",d:"M 142,256 L184,256 L184,284 L142,284 Z",lx:164,ly:270},
  {id:"left_glute",      name:"Left Glute",      lbl:"L.Glute", s:"p",d:"M 58,220 L86,220 L86,250 L56,250 Z",lx:68,ly:236},
  {id:"right_glute",     name:"Right Glute",     lbl:"R.Glute", s:"p",d:"M 114,220 L142,220 L144,250 L114,250 Z",lx:132,ly:236},
  {id:"left_hamstring",  name:"Left Hamstring",  lbl:"L.Ham",   s:"p",d:"M 54,250 L86,250 L86,318 L54,318 Z",lx:68,ly:284},
  {id:"right_hamstring", name:"Right Hamstring", lbl:"R.Ham",   s:"p",d:"M 114,250 L146,250 L146,318 L114,318 Z",lx:132,ly:284},
  {id:"left_knee",       name:"Left Knee",       lbl:"L.Knee",  s:"p",d:"M 54,318 L86,318 L86,342 L54,342 Z",lx:68,ly:330},
  {id:"right_knee",      name:"Right Knee",      lbl:"R.Knee",  s:"p",d:"M 114,318 L146,318 L146,342 L114,342 Z",lx:132,ly:330},
  {id:"left_calf",       name:"Left Calf",       lbl:"L.Calf",  s:"p",d:"M 54,342 L86,342 L86,392 L54,392 Z",lx:68,ly:367},
  {id:"right_calf",      name:"Right Calf",      lbl:"R.Calf",  s:"p",d:"M 114,342 L146,342 L146,392 L114,392 Z",lx:132,ly:367},
  {id:"left_ankle",      name:"Left Ankle",      lbl:"L.Ankle", s:"p",d:"M 52,392 L88,392 L88,422 L52,422 Z",lx:70,ly:408},
  {id:"right_ankle",     name:"Right Ankle",     lbl:"R.Ankle", s:"p",d:"M 112,392 L148,392 L148,422 L112,422 Z",lx:130,ly:408},
];

// Silhouette shape — also used as clipPath for zone overlays
// Torso has proper hourglass: wide shoulder → narrow waist → flare at hip
const BODY_PATHS = [
  // Head
  {type:"e", cx:100, cy:28, rx:20, ry:23},
  // Neck
  {type:"p", d:"M 88,50 Q100,55 112,50 L113,68 Q100,72 87,68 Z"},
  // Torso: shoulder→waist→hip, both sides
  {type:"p", d:"M 87,68 Q 60,70 42,82 Q 28,92 28,112 L 60,112 C 57,138 67,162 70,180 C 65,198 62,212 64,220 Q 68,234 84,246 L100,248 L116,246 Q 132,234 136,220 C 138,212 135,198 130,180 C 133,162 143,138 140,112 L 172,112 Q 172,92 158,82 Q 140,70 113,68 Q 107,72 100,72 Q 93,72 87,68 Z"},
  // Left arm
  {type:"p", d:"M 28,112 C 22,132 18,162 18,184 C 16,208 18,240 20,260 Q 22,278 32,284 Q 44,282 52,268 L 52,256 C 52,232 52,206 52,184 C 52,160 58,130 60,112 Z"},
  // Right arm
  {type:"p", d:"M 172,112 C 178,132 182,162 182,184 C 184,208 182,240 180,260 Q 178,278 168,284 Q 156,282 148,268 L 148,256 C 148,232 148,206 148,184 C 148,160 142,130 140,112 Z"},
  // Left leg
  {type:"p", d:"M 84,246 Q 64,248 58,262 L 56,318 Q 54,332 56,344 L 56,392 Q 54,412 68,418 L 84,418 Q 92,410 86,396 L 86,344 Q 88,332 86,318 L 84,248 Z"},
  // Right leg
  {type:"p", d:"M 116,246 Q 136,248 142,262 L 144,318 Q 146,332 144,344 L 144,392 Q 146,412 132,418 L 116,418 Q 108,410 114,396 L 114,344 Q 112,332 114,318 L 116,248 Z"},
];

function BodyPaths({fill, stroke, strokeWidth, style}){
  return(
    <g fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" style={style}>
      {BODY_PATHS.map((p,i)=>
        p.type==="e"
          ? <ellipse key={i} cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry}/>
          : <path key={i} d={p.d}/>
      )}
    </g>
  );
}

function ZoneEl({z,fill,stroke,sw}){
  const p={fill,stroke,strokeWidth:sw};
  if(z.s==="e") return <ellipse cx={z.cx} cy={z.cy} rx={z.rx} ry={z.ry} {...p}/>;
  return <path d={z.d} {...p}/>;
}

function sk(id){return id.replace(/^(left_|right_)/,"");}

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
  elbow:[
    {name:"Wrist Flexor Stretch",desc:"Extend arm, palm up. Use other hand to pull fingers back toward you gently.",duration:"30 sec each"},
    {name:"Wrist Extensor Stretch",desc:"Extend arm, palm down. Use other hand to pull fingers downward toward you.",duration:"30 sec each"},
    {name:"Forearm Supination/Pronation",desc:"Elbow at 90°, slowly rotate palm up then down through full range.",duration:"15 slow reps each"},
    {name:"Elbow Flexion/Extension",desc:"Slowly bend then straighten elbow through pain-free range ONLY.",duration:"10 very slow reps"},
    {name:"Wall Bicep Stretch",desc:"Palm on wall behind you, rotate body away to stretch bicep and elbow flexors.",duration:"30 sec each"},
    {name:"Prayer Stretch",desc:"Press palms together at chest. Slowly lower hands while keeping palms pressed.",duration:"30 sec"},
  ],
  forearm:[
    {name:"Wrist Flexor Stretch",desc:"Arm extended, palm up — pull fingers back toward elbow. Feel stretch in forearm underside.",duration:"30 sec each"},
    {name:"Wrist Extensor Stretch",desc:"Arm extended, palm down — pull fingers toward you downward. Feel topside of forearm.",duration:"30 sec each"},
    {name:"Forearm Circles",desc:"Arms extended, make slow circles at the wrist.",duration:"10 each direction"},
    {name:"Prayer Stretch",desc:"Press palms together at chest, slowly lower while keeping pressure.",duration:"30 sec"},
    {name:"Reverse Prayer",desc:"Backs of hands together behind back and gently press.",duration:"20 sec"},
    {name:"Forearm Self-Massage",desc:"Use thumb to press and slide slowly along forearm muscle belly from wrist to elbow.",duration:"60 sec each arm"},
  ],
  wrist:[
    {name:"Wrist Circles",desc:"Lace fingers, make slow controlled circles in both directions.",duration:"10 each direction"},
    {name:"Wrist Flexor Stretch",desc:"Arm extended, pull fingers back toward you.",duration:"30 sec each"},
    {name:"Wrist Extensor Stretch",desc:"Arm extended, palm down, pull fingers downward.",duration:"30 sec each"},
    {name:"Prayer Stretch",desc:"Press palms flat together, slowly lower hands toward waist while maintaining contact.",duration:"30 sec"},
    {name:"Reverse Prayer",desc:"Backs of hands pressed together behind back.",duration:"20 sec"},
    {name:"Tendon Glides",desc:"Move fingers through 5 positions slowly: straight → hook → fist → tabletop → straight.",duration:"10 full cycles each"},
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
    {name:"Ankle Circles",desc:"Seated or balancing on one leg, trace large slow circles. Both directions.",duration:"10 each direction"},
    {name:"Straight-Leg Calf Stretch",desc:"Ball of foot against wall, heel down, leg straight.",duration:"30 sec each"},
    {name:"Achilles / Bent-Knee Stretch",desc:"Same as above but slightly bend the knee. Targets the Achilles and soleus.",duration:"30 sec each"},
    {name:"Alphabet Spelling",desc:"Spell A–Z with your big toe, keeping leg still. Full ankle mobility drill.",duration:"Once per foot"},
    {name:"Single-Leg Balance",desc:"Balance on one foot. Progress to eyes closed. Rebuilds proprioception after ankle issues.",duration:"30 sec each (3 rounds)"},
    {name:"Band Inversion/Eversion",desc:"Wrap resistance band around foot. Push inward (inversion) then outward (eversion).",duration:"15 reps each direction"},
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

  const selectPart=(id)=>{
    if(readOnly)return;
    setSelected(id);
    const ex=partData[id];
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
        const zoneName=([...FRONT,...BACK].find(z=>z.id===selected)||{}).name||selected;
        const inboxMsg=`Body Map — ${zoneName}: ${STATUS[pStatus].label}${pPain>0?" (pain "+pPain+"/10)":""}. ${pDesc.trim()}`;
        try{
          await supabase.from("inbox").insert({athlete_id:athleteId,type:"injury",message:inboxMsg});
        }catch(e2){}
      }

      setSaved(true);
      setTimeout(()=>setSaved(false),3000);
    }catch(e){
      console.error("Body map save error",e);
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
    }catch(e){console.error("Clear all error",e);}
    setClearing(false);
  };

  const zones=view==="front"?FRONT:BACK;
  const selZone=zones.find(z=>z.id===selected);
  const strKey=sk(selected||"");
  const stretches=STRETCHES[strKey]||[];
  const descEnough=pDesc.trim().length>=10;
  const showStretches=selected&&pStatus!=="good"&&stretches.length>0;
  const injCount=Object.values(partData).filter(d=>d.status==="sore"||d.status==="pain").length;
  const clipId=`bc-${athleteId}`;

  const zoneFill=(id)=>{
    const d=partData[id];
    if(!d?.status||d.status==="good")return "rgba(255,255,255,0.03)";
    return (STATUS[d.status]?.color||"")+"55";
  };
  const zoneStroke=(id)=>{
    const d=partData[id];
    if(!d?.status||d.status==="good")return "rgba(255,255,255,0.07)";
    return (STATUS[d.status]?.color||"")+"99";
  };

  const selEx=selected?partData[selected]:null;

  return(
    <div>
      {/* Header */}
      <div style={{background:"#111",borderRadius:12,padding:"14px 16px",marginBottom:12,border:"1px solid "+RED+"33",borderLeft:"3px solid "+RED}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:2}}>Body Check-In</div>
            <div style={{fontSize:11,color:"#555"}}>{readOnly?"Athlete's injury status":"Tap any body part — coach can see your status"}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {injCount>0&&!readOnly&&(
              <button onClick={clearAll} disabled={clearing} style={{fontSize:10,color:"#888",background:"transparent",border:"1px solid #333",padding:"3px 10px",borderRadius:10,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                {clearing?"...":"Clear All"}
              </button>
            )}
            {injCount>0&&(
              <div style={{fontSize:10,color:RED,fontWeight:800,background:RED+"18",padding:"4px 10px",borderRadius:20,border:"1px solid "+RED+"44",whiteSpace:"nowrap"}}>
                {injCount} area{injCount>1?"s":""} flagged
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Front/Back toggle */}
      <div style={{display:"flex",gap:8,marginBottom:10,background:"#111",borderRadius:12,padding:4}}>
        {["front","back"].map(v=>(
          <button key={v} onClick={()=>setView(v)} style={{flex:1,padding:"10px",borderRadius:10,border:"none",background:view===v?"linear-gradient(135deg,"+RED+"cc,"+RED+"88)":"transparent",color:view===v?"#fff":"#555",fontSize:12,fontWeight:view===v?700:400,cursor:"pointer",fontFamily:"Georgia,serif"}}>
            {v==="front"?"Front View":"Back View"}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:10,flexWrap:"wrap"}}>
        {Object.entries(STATUS).map(([k,v])=>(
          <div key={k} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:"#888"}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:v.color+"55",border:"1px solid "+v.color}}/>
            {v.label}
          </div>
        ))}
      </div>

      {/* SVG Body Map */}
      <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
        <svg viewBox="12 4 176 426" style={{width:"100%",maxWidth:220,height:"auto"}}>
          <defs>
            <clipPath id={clipId}>
              {BODY_PATHS.map((p,i)=>
                p.type==="e"
                  ? <ellipse key={i} cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry}/>
                  : <path key={i} d={p.d}/>
              )}
            </clipPath>
          </defs>

          {/* Silhouette base */}
          <BodyPaths fill="#202020" stroke="#2e2e2e" strokeWidth="1" style={{pointerEvents:"none"}}/>

          {/* Interactive zone overlays — clipped to body shape */}
          <g clipPath={`url(#${clipId})`}>
            {zones.map(z=>{
              const isSel=selected===z.id;
              const lx=z.s==="e"?z.cx:z.lx;
              const ly=z.s==="e"?z.cy+2.5:z.ly+2.5;
              const hasStatus=partData[z.id]?.status&&partData[z.id].status!=="good";
              return(
                <g key={z.id} onClick={()=>selectPart(z.id)} style={{cursor:readOnly?"default":"pointer"}}>
                  <ZoneEl z={z} fill={zoneFill(z.id)} stroke={isSel?"rgba(255,255,255,0.6)":zoneStroke(z.id)} sw={isSel?1.5:0.6}/>
                  {isSel&&<ZoneEl z={z} fill="rgba(255,255,255,0.06)" stroke="none" sw={0}/>}
                  <text x={lx} y={ly} textAnchor="middle" fontSize={5.5} fill={hasStatus?"#fff":"#3a3a3a"} fontWeight={hasStatus?"700":"400"}
                    style={{pointerEvents:"none",userSelect:"none",fontFamily:"sans-serif"}}>
                    {z.lbl}
                  </text>
                  {hasStatus&&(
                    <circle cx={lx+8} cy={ly-9} r={3.5} fill={STATUS[partData[z.id].status]?.color} stroke="#111" strokeWidth="0.8" style={{pointerEvents:"none"}}/>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {!selected&&(
        <div style={{textAlign:"center",fontSize:11,color:"#444",marginBottom:16,fontStyle:"italic"}}>
          Tap any body part to check in
        </div>
      )}

      {/* Detail panel */}
      {selected&&selZone&&!readOnly&&(
        <div style={{background:"#111",borderRadius:14,padding:"16px",marginBottom:12,border:"1px solid #222",borderLeft:"3px solid "+RED}}>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:14,gap:8}}>
            <div style={{fontSize:16,fontWeight:900,color:"#fff"}}>{selZone.name}</div>
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
              placeholder="Where exactly does it hurt, what does it feel like, how it happened, when it started..."
              style={{width:"100%",minHeight:80,padding:"10px",borderRadius:8,border:"1px solid "+(pDesc.length>5?"#333":"#1e1e1e"),fontSize:13,fontFamily:"Georgia,serif",resize:"vertical",boxSizing:"border-box",background:"#0e0e0e",color:"#ddd",lineHeight:1.6,transition:"border-color 0.2s"}}
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

      {/* Stretches — locked until description */}
      {showStretches&&!descEnough&&!readOnly&&(
        <div style={{background:"#111",borderRadius:14,padding:"16px",marginBottom:12,border:"1px solid "+SORE+"33",textAlign:"center"}}>
          <div style={{fontSize:20,marginBottom:8}}>🔒</div>
          <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:4}}>Describe your injury first</div>
          <div style={{fontSize:12,color:"#666",lineHeight:1.6}}>Stretches unlock once you've described the injury. This prevents recommending something that could make it worse.</div>
        </div>
      )}

      {showStretches&&(descEnough||readOnly)&&(
        <div style={{background:"#111",borderRadius:14,padding:"16px",marginBottom:12,border:"1px solid "+SORE+"33",borderLeft:"3px solid "+SORE}}>
          <div style={{fontSize:14,fontWeight:900,color:"#fff",marginBottom:4}}>Stretches — {selZone.name}</div>
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
