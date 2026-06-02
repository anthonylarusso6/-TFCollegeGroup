import { useState, useEffect } from "react";
import { GREEN, RED, GOLD } from "../lib/constants";
import { supabase } from "../lib/supabase";

const SORE = "#C8941F";
const STATUS = {
  good:{ color:GREEN, label:"All Good",      emoji:"💚" },
  sore:{ color:SORE,  label:"A Little Sore", emoji:"🟡" },
  pain:{ color:RED,   label:"In Pain",       emoji:"🔴" },
};

// All zones use s:"p" (path). Head uses s:"e" (ellipse).
// Arms hang at natural ~10° angle. Elbows/wrists are path slices — no protruding circles.
// Coordinates: center x=100, viewBox="12 4 176 420"
const FRONT=[
  {id:"head",           name:"Head",           lbl:"Head",    s:"e",cx:100,cy:28,rx:20,ry:23},
  {id:"neck",           name:"Neck",           lbl:"Neck",    s:"p",d:"M 88,50 Q100,54 112,50 L114,66 Q100,70 86,66 Z",lx:100,ly:59},
  {id:"left_shoulder",  name:"Left Shoulder",  lbl:"L.Shldr", s:"p",d:"M 86,66 Q 64,68 46,80 Q 36,88 34,106 L 60,110 Q 60,94 72,84 Q 82,74 88,66 Z",lx:52,ly:90},
  {id:"right_shoulder", name:"Right Shoulder", lbl:"R.Shldr", s:"p",d:"M 114,66 Q 136,68 154,80 Q 164,88 166,106 L 140,110 Q 140,94 128,84 Q 118,74 112,66 Z",lx:148,ly:90},
  {id:"chest",          name:"Chest",          lbl:"Chest",   s:"p",d:"M 60,110 L 58,166 L 142,166 L 140,110 Q 118,118 100,118 Q 82,118 60,110 Z",lx:100,ly:138},
  {id:"left_upper_arm", name:"Left Upper Arm", lbl:"L.Arm",   s:"p",d:"M 34,106 C 28,126 24,156 24,178 L 52,180 C 52,158 56,128 60,110 Z",lx:38,ly:142},
  {id:"right_upper_arm",name:"Right Upper Arm",lbl:"R.Arm",   s:"p",d:"M 166,106 C 172,126 176,156 176,178 L 148,180 C 148,158 144,128 140,110 Z",lx:162,ly:142},
  {id:"left_elbow",     name:"Left Elbow",     lbl:"Elbow",   s:"p",d:"M 24,178 L 22,200 L 52,200 L 52,180 Z",lx:38,ly:190},
  {id:"right_elbow",    name:"Right Elbow",    lbl:"Elbow",   s:"p",d:"M 176,178 L 178,200 L 148,200 L 148,180 Z",lx:162,ly:190},
  {id:"left_forearm",   name:"Left Forearm",   lbl:"L.Fore",  s:"p",d:"M 22,200 C 20,222 22,240 24,254 L 52,250 C 52,236 52,218 52,200 Z",lx:36,ly:226},
  {id:"right_forearm",  name:"Right Forearm",  lbl:"R.Fore",  s:"p",d:"M 178,200 C 180,222 178,240 176,254 L 148,250 C 148,236 148,218 148,200 Z",lx:164,ly:226},
  {id:"core",           name:"Core / Abs",     lbl:"Core",    s:"p",d:"M 58,166 L 56,212 Q 76,228 100,230 Q 124,228 144,212 L 142,166 Z",lx:100,ly:192},
  {id:"left_wrist",     name:"Left Wrist",     lbl:"L.Wrist", s:"p",d:"M 24,254 Q 22,272 34,278 Q 46,276 52,264 L 52,250 Z",lx:38,ly:264},
  {id:"right_wrist",    name:"Right Wrist",    lbl:"R.Wrist", s:"p",d:"M 176,254 Q 178,272 166,278 Q 154,276 148,264 L 148,250 Z",lx:162,ly:264},
  {id:"left_hip",       name:"Left Hip",       lbl:"L.Hip",   s:"p",d:"M 56,212 Q 54,230 58,246 L 82,248 L 84,232 Q 70,226 56,212 Z",lx:64,ly:232},
  {id:"right_hip",      name:"Right Hip",      lbl:"R.Hip",   s:"p",d:"M 144,212 Q 146,230 142,246 L 118,248 L 116,232 Q 130,226 144,212 Z",lx:136,ly:232},
  {id:"left_quad",      name:"Left Quad",      lbl:"L.Quad",  s:"p",d:"M 58,248 L 56,316 L 84,316 L 82,248 Z",lx:68,ly:282},
  {id:"right_quad",     name:"Right Quad",     lbl:"R.Quad",  s:"p",d:"M 142,248 L 144,316 L 116,316 L 118,248 Z",lx:132,ly:282},
  {id:"left_knee",      name:"Left Knee",      lbl:"L.Knee",  s:"p",d:"M 56,316 L 56,340 L 84,340 L 84,316 Z",lx:68,ly:328},
  {id:"right_knee",     name:"Right Knee",     lbl:"R.Knee",  s:"p",d:"M 144,316 L 144,340 L 116,340 L 116,316 Z",lx:132,ly:328},
  {id:"left_shin",      name:"Left Shin",      lbl:"L.Shin",  s:"p",d:"M 56,340 L 56,390 L 84,390 L 84,340 Z",lx:68,ly:366},
  {id:"right_shin",     name:"Right Shin",     lbl:"R.Shin",  s:"p",d:"M 144,340 L 144,390 L 116,390 L 116,340 Z",lx:132,ly:366},
  {id:"left_ankle",     name:"Left Ankle",     lbl:"L.Ankle", s:"p",d:"M 56,390 Q 54,408 66,414 L 82,414 Q 90,406 84,390 Z",lx:70,ly:404},
  {id:"right_ankle",    name:"Right Ankle",    lbl:"R.Ankle", s:"p",d:"M 144,390 Q 146,408 134,414 L 118,414 Q 110,406 116,390 Z",lx:130,ly:404},
];

const BACK=[
  {id:"head",            name:"Head",            lbl:"Head",    s:"e",cx:100,cy:28,rx:20,ry:23},
  {id:"neck",            name:"Neck",            lbl:"Neck",    s:"p",d:"M 88,50 Q100,54 112,50 L114,66 Q100,70 86,66 Z",lx:100,ly:59},
  {id:"left_shoulder",   name:"Left Shoulder",   lbl:"L.Shldr", s:"p",d:"M 86,66 Q 64,68 46,80 Q 36,88 34,106 L 60,110 Q 60,94 72,84 Q 82,74 88,66 Z",lx:52,ly:90},
  {id:"right_shoulder",  name:"Right Shoulder",  lbl:"R.Shldr", s:"p",d:"M 114,66 Q 136,68 154,80 Q 164,88 166,106 L 140,110 Q 140,94 128,84 Q 118,74 112,66 Z",lx:148,ly:90},
  {id:"upper_back",      name:"Upper Back",      lbl:"Up.Back", s:"p",d:"M 60,110 L 58,166 L 142,166 L 140,110 Q 118,118 100,118 Q 82,118 60,110 Z",lx:100,ly:138},
  {id:"left_upper_arm",  name:"Left Upper Arm",  lbl:"L.Arm",   s:"p",d:"M 34,106 C 28,126 24,156 24,178 L 52,180 C 52,158 56,128 60,110 Z",lx:38,ly:142},
  {id:"right_upper_arm", name:"Right Upper Arm", lbl:"R.Arm",   s:"p",d:"M 166,106 C 172,126 176,156 176,178 L 148,180 C 148,158 144,128 140,110 Z",lx:162,ly:142},
  {id:"left_elbow",      name:"Left Elbow",      lbl:"Elbow",   s:"p",d:"M 24,178 L 22,200 L 52,200 L 52,180 Z",lx:38,ly:190},
  {id:"right_elbow",     name:"Right Elbow",     lbl:"Elbow",   s:"p",d:"M 176,178 L 178,200 L 148,200 L 148,180 Z",lx:162,ly:190},
  {id:"left_forearm",    name:"Left Forearm",    lbl:"L.Fore",  s:"p",d:"M 22,200 C 20,222 22,240 24,254 L 52,250 C 52,236 52,218 52,200 Z",lx:36,ly:226},
  {id:"right_forearm",   name:"Right Forearm",   lbl:"R.Fore",  s:"p",d:"M 178,200 C 180,222 178,240 176,254 L 148,250 C 148,236 148,218 148,200 Z",lx:164,ly:226},
  {id:"lower_back",      name:"Lower Back",      lbl:"Lo.Back", s:"p",d:"M 58,166 L 56,212 Q 76,228 100,230 Q 124,228 144,212 L 142,166 Z",lx:100,ly:192},
  {id:"left_wrist",      name:"Left Wrist",      lbl:"L.Wrist", s:"p",d:"M 24,254 Q 22,272 34,278 Q 46,276 52,264 L 52,250 Z",lx:38,ly:264},
  {id:"right_wrist",     name:"Right Wrist",     lbl:"R.Wrist", s:"p",d:"M 176,254 Q 178,272 166,278 Q 154,276 148,264 L 148,250 Z",lx:162,ly:264},
  {id:"left_glute",      name:"Left Glute",      lbl:"L.Glute", s:"p",d:"M 56,212 Q 54,230 58,246 L 82,248 L 84,232 Q 70,226 56,212 Z",lx:64,ly:232},
  {id:"right_glute",     name:"Right Glute",     lbl:"R.Glute", s:"p",d:"M 144,212 Q 146,230 142,246 L 118,248 L 116,232 Q 130,226 144,212 Z",lx:136,ly:232},
  {id:"left_hamstring",  name:"Left Hamstring",  lbl:"L.Ham",   s:"p",d:"M 58,248 L 56,316 L 84,316 L 82,248 Z",lx:68,ly:282},
  {id:"right_hamstring", name:"Right Hamstring", lbl:"R.Ham",   s:"p",d:"M 142,248 L 144,316 L 116,316 L 118,248 Z",lx:132,ly:282},
  {id:"left_knee",       name:"Left Knee",       lbl:"L.Knee",  s:"p",d:"M 56,316 L 56,340 L 84,340 L 84,316 Z",lx:68,ly:328},
  {id:"right_knee",      name:"Right Knee",      lbl:"R.Knee",  s:"p",d:"M 144,316 L 144,340 L 116,340 L 116,316 Z",lx:132,ly:328},
  {id:"left_calf",       name:"Left Calf",       lbl:"L.Calf",  s:"p",d:"M 56,340 L 56,390 L 84,390 L 84,340 Z",lx:68,ly:366},
  {id:"right_calf",      name:"Right Calf",      lbl:"R.Calf",  s:"p",d:"M 144,340 L 144,390 L 116,390 L 116,340 Z",lx:132,ly:366},
  {id:"left_ankle",      name:"Left Ankle",      lbl:"L.Ankle", s:"p",d:"M 56,390 Q 54,408 66,414 L 82,414 Q 90,406 84,390 Z",lx:70,ly:404},
  {id:"right_ankle",     name:"Right Ankle",     lbl:"R.Ankle", s:"p",d:"M 144,390 Q 146,408 134,414 L 118,414 Q 110,406 116,390 Z",lx:130,ly:404},
];

// Silhouette — single smooth unified body with natural arm hang and feet
const Silhouette=()=>(
  <g fill="#202020" stroke="#303030" strokeWidth="1" strokeLinejoin="round" style={{pointerEvents:"none"}}>
    {/* Head */}
    <ellipse cx="100" cy="28" rx="20" ry="23"/>
    {/* Neck */}
    <path d="M 88,50 Q100,54 112,50 L114,66 Q100,70 86,66 Z"/>
    {/* Torso — tapers at waist, flares at hip */}
    <path d="M 86,66 Q 62,68 44,80 Q 32,90 32,110 L 60,110 Q 58,158 56,212 Q 64,230 82,240 L100,242 L118,240 Q 136,230 144,212 Q 142,158 140,110 L 168,110 Q 168,90 156,80 Q 138,68 114,66 Q 108,70 100,70 Q 92,70 86,66 Z"/>
    {/* Left arm — smooth taper, natural hang */}
    <path d="M 32,110 C 26,130 22,158 22,180 C 20,202 22,234 24,256 Q 26,274 34,280 Q 44,278 52,266 L 52,250 C 52,228 52,200 52,180 C 52,156 56,128 60,110 Z"/>
    {/* Right arm */}
    <path d="M 168,110 C 174,130 178,158 178,180 C 180,202 178,234 176,256 Q 174,274 166,280 Q 156,278 148,266 L 148,250 C 148,228 148,200 148,180 C 148,156 144,128 140,110 Z"/>
    {/* Left leg — tapered, with foot */}
    <path d="M 82,242 Q 62,244 58,258 L 56,316 Q 54,330 56,342 L 56,392 Q 54,410 66,416 L 82,416 Q 92,408 84,394 L 84,342 Q 86,330 84,316 L 84,244 Z"/>
    {/* Right leg */}
    <path d="M 118,242 Q 138,244 142,258 L 144,316 Q 146,330 144,342 L 144,392 Q 146,410 134,416 L 118,416 Q 108,408 116,394 L 116,342 Q 114,330 116,316 L 116,244 Z"/>
  </g>
);

function ZoneEl({z,fill,stroke,sw}){
  const p={fill,stroke,strokeWidth:sw};
  if(z.s==="e") return <ellipse cx={z.cx} cy={z.cy} rx={z.rx} ry={z.ry} {...p}/>;
  return <path d={z.d} {...p}/>;
}

function sk(id){return id.replace(/^(left_|right_)/,"");}

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

export default function InjuryBodyMap({athleteId}){
  const[view,setView]=useState("front");
  const[partData,setPartData]=useState({});
  const[selected,setSelected]=useState(null);
  const[pStatus,setPStatus]=useState("good");
  const[pPain,setPPain]=useState(0);
  const[pDesc,setPDesc]=useState("");
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);
  const[saveErr,setSaveErr]=useState(false);

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
    setSelected(id);
    const ex=partData[id];
    setPStatus(ex?.status||"good");
    setPPain(ex?.pain||0);
    setPDesc(ex?.description||"");
    setSaved(false);setSaveErr(false);
  };

  const savePart=async()=>{
    if(!selected)return;
    setSaving(true);setSaved(false);setSaveErr(false);
    const msg=JSON.stringify({status:pStatus,pain:pPain,description:pDesc.trim(),updatedAt:new Date().toISOString()});
    try{
      const{error:de}=await supabase.from("announcements").delete()
        .eq("type","body_injury").eq("day",String(athleteId)).eq("week_label",selected);
      if(de)throw de;
      const{error:ie}=await supabase.from("announcements").insert({
        type:"body_injury",day:String(athleteId),week_label:selected,message:msg,active:true,
      });
      if(ie)throw ie;
      setPartData(prev=>({...prev,[selected]:{status:pStatus,pain:pPain,description:pDesc.trim()}}));
      setSaved(true);
      setTimeout(()=>setSaved(false),3000);
    }catch(e){
      console.error("Body map save error",e);
      setSaveErr(true);
      setTimeout(()=>setSaveErr(false),4000);
    }
    setSaving(false);
  };

  const zones=view==="front"?FRONT:BACK;
  const selZone=zones.find(z=>z.id===selected);
  const strKey=sk(selected||"");
  const stretches=STRETCHES[strKey]||[];
  const descEnough=pDesc.trim().length>=10;
  const showStretches=selected&&pStatus!=="good"&&stretches.length>0;
  const injCount=Object.values(partData).filter(d=>d.status==="sore"||d.status==="pain").length;

  const zoneFill=(id)=>{
    const d=partData[id];
    if(!d?.status||d.status==="good")return "rgba(255,255,255,0.04)";
    return (STATUS[d.status]?.color||"")+"55";
  };
  const zoneStroke=(id)=>{
    const d=partData[id];
    if(!d?.status||d.status==="good")return "rgba(255,255,255,0.08)";
    return (STATUS[d.status]?.color||"")+"99";
  };
  const labelColor=(id)=>{
    const d=partData[id];
    if(!d?.status||d.status==="good")return "#3a3a3a";
    return "#fff";
  };

  return(
    <div>
      {/* Header */}
      <div style={{background:"#111",borderRadius:12,padding:"14px 16px",marginBottom:12,border:"1px solid "+RED+"33",borderLeft:"3px solid "+RED}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:2}}>Body Check-In</div>
            <div style={{fontSize:11,color:"#555"}}>Tap any body part — coach can see your status</div>
          </div>
          {injCount>0&&(
            <div style={{fontSize:10,color:RED,fontWeight:800,background:RED+"18",padding:"4px 10px",borderRadius:20,border:"1px solid "+RED+"44",whiteSpace:"nowrap"}}>
              {injCount} area{injCount>1?"s":""} flagged
            </div>
          )}
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
        <div style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:"#888"}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)"}}/>
          Not set
        </div>
      </div>

      {/* SVG Body Map */}
      <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
        <svg viewBox="12 4 176 418" style={{width:"100%",maxWidth:220,height:"auto"}}>
          <Silhouette/>
          {/* Interactive zones */}
          {zones.map(z=>{
            const isSel=selected===z.id;
            const lc=labelColor(z.id);
            const lx=z.s==="e"?z.cx:z.lx;
            const ly=z.s==="e"?z.cy+2.5:z.ly+2.5;
            return(
              <g key={z.id} onClick={()=>selectPart(z.id)} style={{cursor:"pointer"}}>
                <ZoneEl z={z} fill={zoneFill(z.id)} stroke={isSel?"#fff":zoneStroke(z.id)} sw={isSel?2:0.8}/>
                {isSel&&<ZoneEl z={z} fill="none" stroke="rgba(255,255,255,0.25)" sw={3.5}/>}
                <text x={lx} y={ly} textAnchor="middle" fontSize={6} fill={lc} fontWeight="600"
                  style={{pointerEvents:"none",userSelect:"none",fontFamily:"sans-serif"}}>
                  {z.lbl}
                </text>
                {/* Status dot */}
                {partData[z.id]?.status&&partData[z.id].status!=="good"&&(
                  <circle cx={lx+7} cy={ly-8} r={4} fill={STATUS[partData[z.id].status]?.color} stroke="#111" strokeWidth="1" style={{pointerEvents:"none"}}/>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {!selected&&(
        <div style={{textAlign:"center",fontSize:11,color:"#444",marginBottom:16,fontStyle:"italic"}}>
          Tap any body part to check in
        </div>
      )}

      {/* Detail panel */}
      {selected&&selZone&&(
        <div style={{background:"#111",borderRadius:14,padding:"16px",marginBottom:12,border:"1px solid #222",borderLeft:"3px solid "+RED}}>
          <div style={{fontSize:16,fontWeight:900,color:"#fff",marginBottom:14}}>{selZone.name}</div>

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

          {/* Save row */}
          <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",gap:10}}>
            {saved&&<div style={{fontSize:11,color:GREEN,fontWeight:700}}>✓ Saved</div>}
            {saveErr&&<div style={{fontSize:11,color:RED,fontWeight:700}}>Save failed — try again</div>}
            <button onClick={savePart} disabled={saving} style={{padding:"10px 24px",borderRadius:8,border:"none",background:saving?"#1a1a1a":"linear-gradient(135deg,"+RED+","+RED+"cc)",color:saving?"#444":"#fff",fontSize:12,fontWeight:700,cursor:saving?"default":"pointer",fontFamily:"Georgia,serif"}}>
              {saving?"Saving...":"Save"}
            </button>
          </div>
        </div>
      )}

      {/* Stretches — locked until description */}
      {showStretches&&!descEnough&&(
        <div style={{background:"#111",borderRadius:14,padding:"16px",marginBottom:12,border:"1px solid "+SORE+"33",textAlign:"center"}}>
          <div style={{fontSize:20,marginBottom:8}}>🔒</div>
          <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:4}}>Describe your injury first</div>
          <div style={{fontSize:12,color:"#666",lineHeight:1.6}}>Stretches unlock once you've described the injury. This prevents recommending something that could make it worse.</div>
        </div>
      )}

      {showStretches&&descEnough&&(
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
              <div style={{fontSize:12,color:"#888",lineHeight:1.65}}>{s.desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
