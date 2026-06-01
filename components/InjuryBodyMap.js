import { useState, useEffect } from "react";
import { GREEN, RED, GOLD } from "../lib/constants";
import { supabase } from "../lib/supabase";

const SORE = "#C8941F";
const UNSET = "#1c1c1c";
const USTROKE = "#2e2e2e";

const STATUS = {
  good:{ color:GREEN, label:"All Good",       emoji:"💚" },
  sore:{ color:SORE,  label:"A Little Sore",  emoji:"🟡" },
  pain:{ color:RED,   label:"In Pain",        emoji:"🔴" },
};

const FRONT=[
  {id:"head",          name:"Head",            svgLabel:"Head",    cx:100,cy:36, rx:20,ry:23},
  {id:"neck",          name:"Neck",            svgLabel:"Neck",    cx:100,cy:67, rx:10,ry:9},
  {id:"left_shoulder", name:"Left Shoulder",   svgLabel:"L.Shldr", cx:63, cy:83, rx:18,ry:12},
  {id:"right_shoulder",name:"Right Shoulder",  svgLabel:"R.Shldr", cx:137,cy:83, rx:18,ry:12},
  {id:"chest",         name:"Chest",           svgLabel:"Chest",   cx:100,cy:113,rx:26,ry:21},
  {id:"left_upper_arm",name:"Left Upper Arm",  svgLabel:"L.Arm",   cx:50, cy:115,rx:11,ry:27,rot:-12},
  {id:"right_upper_arm",name:"Right Upper Arm",svgLabel:"R.Arm",   cx:150,cy:115,rx:11,ry:27,rot:12},
  {id:"left_elbow",    name:"Left Elbow",      svgLabel:"L.Elbow", cx:38, cy:150,rx:12,ry:12},
  {id:"right_elbow",   name:"Right Elbow",     svgLabel:"R.Elbow", cx:162,cy:150,rx:12,ry:12},
  {id:"core",          name:"Core / Abs",      svgLabel:"Core",    cx:100,cy:156,rx:22,ry:19},
  {id:"left_forearm",  name:"Left Forearm",    svgLabel:"L.Fore",  cx:32, cy:178,rx:9, ry:22,rot:-5},
  {id:"right_forearm", name:"Right Forearm",   svgLabel:"R.Fore",  cx:168,cy:178,rx:9, ry:22,rot:5},
  {id:"left_wrist",    name:"Left Wrist",      svgLabel:"L.Wrist", cx:27, cy:207,rx:12,ry:11},
  {id:"right_wrist",   name:"Right Wrist",     svgLabel:"R.Wrist", cx:173,cy:207,rx:12,ry:11},
  {id:"left_hip",      name:"Left Hip",        svgLabel:"L.Hip",   cx:80, cy:200,rx:18,ry:13},
  {id:"right_hip",     name:"Right Hip",       svgLabel:"R.Hip",   cx:120,cy:200,rx:18,ry:13},
  {id:"left_quad",     name:"Left Quad",       svgLabel:"L.Quad",  cx:78, cy:250,rx:15,ry:36},
  {id:"right_quad",    name:"Right Quad",      svgLabel:"R.Quad",  cx:122,cy:250,rx:15,ry:36},
  {id:"left_knee",     name:"Left Knee",       svgLabel:"L.Knee",  cx:78, cy:294,rx:14,ry:13},
  {id:"right_knee",    name:"Right Knee",      svgLabel:"R.Knee",  cx:122,cy:294,rx:14,ry:13},
  {id:"left_shin",     name:"Left Shin",       svgLabel:"L.Shin",  cx:78, cy:330,rx:11,ry:25},
  {id:"right_shin",    name:"Right Shin",      svgLabel:"R.Shin",  cx:122,cy:330,rx:11,ry:25},
  {id:"left_ankle",    name:"Left Ankle",      svgLabel:"L.Ankle", cx:78, cy:363,rx:13,ry:10},
  {id:"right_ankle",   name:"Right Ankle",     svgLabel:"R.Ankle", cx:122,cy:363,rx:13,ry:10},
];

const BACK=[
  {id:"head",            name:"Head",              svgLabel:"Head",     cx:100,cy:36, rx:20,ry:23},
  {id:"neck",            name:"Neck",              svgLabel:"Neck",     cx:100,cy:67, rx:10,ry:9},
  {id:"left_shoulder",   name:"Left Shoulder",     svgLabel:"L.Shldr",  cx:63, cy:83, rx:18,ry:12},
  {id:"right_shoulder",  name:"Right Shoulder",    svgLabel:"R.Shldr",  cx:137,cy:83, rx:18,ry:12},
  {id:"upper_back",      name:"Upper Back",        svgLabel:"Up.Back",  cx:100,cy:113,rx:26,ry:21},
  {id:"left_upper_arm",  name:"Left Upper Arm",    svgLabel:"L.Arm",    cx:50, cy:115,rx:11,ry:27,rot:-12},
  {id:"right_upper_arm", name:"Right Upper Arm",   svgLabel:"R.Arm",    cx:150,cy:115,rx:11,ry:27,rot:12},
  {id:"left_elbow",      name:"Left Elbow",        svgLabel:"L.Elbow",  cx:38, cy:150,rx:12,ry:12},
  {id:"right_elbow",     name:"Right Elbow",       svgLabel:"R.Elbow",  cx:162,cy:150,rx:12,ry:12},
  {id:"lower_back",      name:"Lower Back",        svgLabel:"Lo.Back",  cx:100,cy:156,rx:22,ry:19},
  {id:"left_forearm",    name:"Left Forearm",      svgLabel:"L.Fore",   cx:32, cy:178,rx:9, ry:22,rot:-5},
  {id:"right_forearm",   name:"Right Forearm",     svgLabel:"R.Fore",   cx:168,cy:178,rx:9, ry:22,rot:5},
  {id:"left_wrist",      name:"Left Wrist",        svgLabel:"L.Wrist",  cx:27, cy:207,rx:12,ry:11},
  {id:"right_wrist",     name:"Right Wrist",       svgLabel:"R.Wrist",  cx:173,cy:207,rx:12,ry:11},
  {id:"left_glute",      name:"Left Glute",        svgLabel:"L.Glute",  cx:80, cy:200,rx:18,ry:14},
  {id:"right_glute",     name:"Right Glute",       svgLabel:"R.Glute",  cx:120,cy:200,rx:18,ry:14},
  {id:"left_hamstring",  name:"Left Hamstring",    svgLabel:"L.Ham",    cx:78, cy:252,rx:15,ry:37},
  {id:"right_hamstring", name:"Right Hamstring",   svgLabel:"R.Ham",    cx:122,cy:252,rx:15,ry:37},
  {id:"left_knee",       name:"Left Knee",         svgLabel:"L.Knee",   cx:78, cy:294,rx:14,ry:13},
  {id:"right_knee",      name:"Right Knee",        svgLabel:"R.Knee",   cx:122,cy:294,rx:14,ry:13},
  {id:"left_calf",       name:"Left Calf",         svgLabel:"L.Calf",   cx:78, cy:330,rx:11,ry:25},
  {id:"right_calf",      name:"Right Calf",        svgLabel:"R.Calf",   cx:122,cy:330,rx:11,ry:25},
  {id:"left_ankle",      name:"Left Ankle",        svgLabel:"L.Ankle",  cx:78, cy:363,rx:13,ry:10},
  {id:"right_ankle",     name:"Right Ankle",       svgLabel:"R.Ankle",  cx:122,cy:363,rx:13,ry:10},
];

const STRETCHES={
  head:[
    {name:"Chin Tuck",desc:"Stand tall, gently pull chin straight back (double-chin motion). Relieves pressure at base of skull.",duration:"10 reps × 5s hold"},
    {name:"Suboccipital Release",desc:"Cup back of skull in hands, let head rest heavy. Feel gentle traction at skull base.",duration:"30–60 sec"},
    {name:"Lateral Neck Tilt",desc:"Tilt one ear toward shoulder. Do NOT pull. Just let gravity add light stretch.",duration:"30 sec each side"},
    {name:"Forward Head Stretch",desc:"Interlace fingers behind head, let weight of hands gently bow head forward. Do NOT force.",duration:"30 sec"},
    {name:"Temple Massage",desc:"Gentle circular massage on temples with fingertip pressure.",duration:"60 sec"},
    {name:"Jaw Relaxation",desc:"Open mouth wide, hold 3 sec, close slowly. Helps relax tension that travels into head.",duration:"10 reps"},
  ],
  neck:[
    {name:"Chin Tuck",desc:"Stand tall, gently pull chin straight back. Hold at end range. Resets forward head posture.",duration:"10 reps × 5s hold"},
    {name:"Lateral Neck Stretch",desc:"Tilt ear to shoulder. Use opposite hand to add very light weight. Do NOT yank.",duration:"30 sec each side"},
    {name:"Levator Scapulae Stretch",desc:"Look down at 45° toward your armpit. Place hand on back of head — let gravity pull. No forcing.",duration:"30 sec each side"},
    {name:"Neck Rotation",desc:"Slowly turn head left, hold 3 sec, return to center, repeat right. Keep shoulders completely still.",duration:"10 reps each direction"},
    {name:"Upper Trap Stretch",desc:"Sit on one hand (anchors the shoulder), tilt head away and look slightly down until stretch in neck/shoulder.",duration:"30 sec each side"},
    {name:"Chest Opener",desc:"Clasp hands behind back, open chest, look gently upward. Relieves neck and trap tension.",duration:"3 × 20 sec"},
  ],
  shoulder:[
    {name:"Cross-Body Stretch",desc:"Pull arm across chest with opposite hand, keep shoulder pressed down — not shrugged.",duration:"30 sec each side"},
    {name:"Doorway Chest Stretch",desc:"Forearm on doorframe at 90°, lean forward until stretch in front of shoulder.",duration:"30 sec each side"},
    {name:"Overhead Tricep/Shoulder",desc:"Reach arm overhead, bend elbow, use other hand to gently press elbow back. Feel stretch in shoulder.",duration:"30 sec each side"},
    {name:"Thread the Needle",desc:"On all fours, slide one arm palm-up under your body until shoulder reaches ground. Hold.",duration:"30 sec each side"},
    {name:"Shoulder Circles",desc:"Relaxed arms at sides, make large slow circles forward then backward. Warms the joint capsule.",duration:"10 forward, 10 back"},
    {name:"Sleeper Stretch",desc:"Lie on affected side, elbow bent at 90°. Use other hand to gently rotate wrist toward floor. STOP if sharp pain.",duration:"30 sec each side"},
  ],
  upper_arm:[
    {name:"Cross-Body Stretch",desc:"Pull arm across chest with opposite hand to stretch the rear deltoid and upper arm.",duration:"30 sec each"},
    {name:"Wall Bicep Stretch",desc:"Place palm flat on wall behind you at shoulder height. Slowly rotate body away until you feel the bicep.",duration:"30 sec each"},
    {name:"Overhead Tricep Stretch",desc:"Reach arm overhead, bend elbow behind head. Use other hand to gently press elbow back.",duration:"30 sec each"},
    {name:"Doorway Chest Stretch",desc:"Forearm at 90° on doorframe, lean through to open the chest and front of upper arm.",duration:"30 sec each"},
    {name:"Overhead Bicep Reach",desc:"Raise arm overhead, keep elbow straight, flex wrist back slightly to feel a long stretch.",duration:"30 sec each"},
    {name:"Shoulder Circles",desc:"Relaxed arm, large slow circles. Promotes blood flow and mobility around the shoulder and upper arm.",duration:"10 each direction"},
  ],
  elbow:[
    {name:"Wrist Flexor Stretch",desc:"Extend arm out, palm facing up. Use other hand to pull fingers back toward you gently.",duration:"30 sec each"},
    {name:"Wrist Extensor Stretch",desc:"Extend arm out, palm facing down. Use other hand to pull fingers downward toward you.",duration:"30 sec each"},
    {name:"Forearm Supination/Pronation",desc:"Elbow bent at 90°, slowly rotate palm up (supination) then down (pronation) through full range.",duration:"15 slow reps each"},
    {name:"Elbow Flexion/Extension",desc:"Slowly bend then straighten elbow through full pain-free range ONLY. Never force end range.",duration:"10 very slow reps"},
    {name:"Wall Bicep Stretch",desc:"Palm on wall behind you, rotate body away slowly to stretch the bicep and elbow flexors.",duration:"30 sec each"},
    {name:"Prayer Stretch",desc:"Press palms together at chest. Slowly lower hands while keeping palms pressed together.",duration:"30 sec"},
  ],
  forearm:[
    {name:"Wrist Flexor Stretch",desc:"Arm extended, palm up — pull fingers back toward elbow. Feel the stretch in the forearm underside.",duration:"30 sec each"},
    {name:"Wrist Extensor Stretch",desc:"Arm extended, palm down — pull fingers toward you downward. Feel stretch in the forearm topside.",duration:"30 sec each"},
    {name:"Forearm Circles",desc:"Arms extended, make slow circles at the wrist to mobilize the forearm musculature.",duration:"10 each direction"},
    {name:"Prayer Stretch",desc:"Press palms together at chest, slowly lower while keeping palms pressed together.",duration:"30 sec"},
    {name:"Reverse Prayer",desc:"Place backs of hands together behind back and gently press. Stretches the wrist extensors and forearm.",duration:"20 sec"},
    {name:"Forearm Self-Massage",desc:"Use thumb of opposite hand to press and slide slowly along the forearm muscle belly from wrist to elbow.",duration:"60 sec each arm"},
  ],
  wrist:[
    {name:"Wrist Circles",desc:"Lace fingers together, make slow controlled circles in both directions.",duration:"10 each direction"},
    {name:"Wrist Flexor Stretch",desc:"Arm extended, pull fingers back toward you to stretch the wrist and palm.",duration:"30 sec each"},
    {name:"Wrist Extensor Stretch",desc:"Arm extended, palm down, pull fingers downward toward you.",duration:"30 sec each"},
    {name:"Prayer Stretch",desc:"Press palms flat together at chest level, slowly lower hands toward waist while maintaining contact.",duration:"30 sec"},
    {name:"Reverse Prayer",desc:"Back of hands pressed together behind back.",duration:"20 sec"},
    {name:"Tendon Glides",desc:"Move fingers through 5 positions slowly: straight → hook fist → full fist → tabletop → straight. Mobilizes all tendons.",duration:"10 full cycles each hand"},
  ],
  chest:[
    {name:"Doorway Stretch (Low)",desc:"Arm at 90° on doorframe (elbow at shoulder height). Lean forward until stretch across chest.",duration:"30 sec each side"},
    {name:"Doorway Stretch (High)",desc:"Same but arm at ~120° (hand above head). Targets upper chest differently.",duration:"30 sec each side"},
    {name:"Foam Roller Chest Opener",desc:"Lie lengthwise on foam roller along your spine. Let arms fall to sides. Breathe deeply, relax chest open.",duration:"60 sec"},
    {name:"Hands Clasped Chest Stretch",desc:"Clasp hands behind back, straighten arms, open chest and look slightly upward.",duration:"3 × 20 sec"},
    {name:"Eagle Arms",desc:"Cross arms at elbows in front of you, wrap forearms together, lift slightly. Reverse and repeat.",duration:"30 sec each side"},
    {name:"Wide Arm Circles",desc:"Arms extended to sides, make small then large circles. Warms and mobilizes the chest and front shoulder.",duration:"10 each direction"},
  ],
  core:[
    {name:"Cat-Cow",desc:"On all fours, arch the back (cow), then round it (cat) slowly. Sync breath — inhale to arch, exhale to round.",duration:"10 slow reps"},
    {name:"Child's Pose",desc:"Kneel and sit back on heels, arms stretched forward. Breathe into the lower back.",duration:"30–60 sec"},
    {name:"Lying Knee-to-Chest",desc:"On your back, pull one knee gently to chest. Hold, then switch sides. Lengthens lower core and hip.",duration:"30 sec each"},
    {name:"Supine Spinal Twist",desc:"On back, pull one knee across body to the opposite side while extending arm outward. Opposite shoulder stays down.",duration:"30 sec each side"},
    {name:"Cobra Stretch",desc:"Lie face down, press onto hands with hips on the ground. Open chest, feel stretch in abs.",duration:"3 × 20 sec"},
    {name:"Side Bend Stretch",desc:"Stand tall, reach one arm overhead and lean smoothly to the opposite side.",duration:"30 sec each side"},
  ],
  upper_back:[
    {name:"Cat-Cow",desc:"On all fours — focus on moving through the mid-back and thoracic spine as you arch and round.",duration:"10 slow reps"},
    {name:"Thoracic Foam Roll",desc:"Foam roller under mid-back. Support neck with hands. Extend gently over the roller, shifting up the spine.",duration:"30 sec per segment"},
    {name:"Thread the Needle",desc:"On all fours, slide one arm palm-up under your body, rotating through the thoracic spine.",duration:"30 sec each side"},
    {name:"Seated Trunk Rotation",desc:"Sit upright, arms crossed on chest. Rotate slowly left then right without moving hips.",duration:"10 each direction"},
    {name:"Wall Angels",desc:"Back flat against wall, press lower back down. Slide arms up and down (snow angel) keeping full contact with wall.",duration:"10 slow reps"},
    {name:"Child's Pose",desc:"Arms stretched forward, breathe into upper back. Gently walk hands further to increase thoracic stretch.",duration:"30 sec"},
  ],
  lower_back:[
    {name:"Cat-Cow",desc:"Focus on lumbar curve — arch the low back (cow), then draw navel to spine and round (cat).",duration:"10 slow reps"},
    {name:"Child's Pose",desc:"Kneel, sit back on heels, arms forward. Breathe deeply into the lower back.",duration:"30–60 sec"},
    {name:"Both Knees to Chest",desc:"On back, hug both knees to chest. Rock gently side to side like a rocking chair.",duration:"30 sec"},
    {name:"Supine Spinal Twist",desc:"On back, pull one bent knee across to the opposite floor while extending arm out. Hold.",duration:"30 sec each side"},
    {name:"Figure-4 Piriformis",desc:"On back, cross one ankle over opposite knee, pull both legs toward chest. Relieves SI joint and low back.",duration:"30 sec each"},
    {name:"Downward Dog",desc:"Hands and feet on floor, push hips up and back. Pedal heels slowly to decompress the lumbar spine.",duration:"30 sec"},
  ],
  hip:[
    {name:"Hip Flexor Lunge",desc:"Kneel on one knee, push hips forward until stretch appears at the front hip. Keep torso upright.",duration:"30 sec each side"},
    {name:"Figure-4 Stretch",desc:"On back, cross one ankle over opposite knee, pull both toward chest. Feel it in the outer hip.",duration:"30 sec each"},
    {name:"Butterfly Stretch",desc:"Seated, press soles of feet together, let knees fall outward. Sit tall, breathe into inner hips.",duration:"30 sec"},
    {name:"Hip Circles",desc:"Stand on one foot, slowly trace large circles with opposite knee. Mobilizes the hip joint.",duration:"10 each direction per hip"},
    {name:"Lateral Leg Swings",desc:"Hold a wall for balance, swing one leg side to side through comfortable range. Controlled, not momentum.",duration:"10 each direction"},
    {name:"Deep Squat Hold",desc:"Feet slightly wider than hips, toes out. Lower into deep squat, clasp hands for balance.",duration:"30 sec"},
  ],
  glute:[
    {name:"Figure-4 Stretch",desc:"On back, cross ankle over opposite knee, pull both toward chest. Feel it deep in the crossed-side glute.",duration:"30 sec each"},
    {name:"Pigeon Pose",desc:"From floor, bring one shin horizontal in front, extend opposite leg back. Sit tall or fold forward.",duration:"30 sec each"},
    {name:"Knee to Opposite Shoulder",desc:"On back, pull one bent knee across toward opposite shoulder until deep glute stretch is felt.",duration:"30 sec each"},
    {name:"Standing Figure-4",desc:"Cross one ankle over opposite knee, lower into single-leg squat, hold.",duration:"30 sec each"},
    {name:"Seated Figure-4",desc:"Sit upright on chair, cross ankle over knee, sit tall and lean slightly forward.",duration:"30 sec each"},
    {name:"Hip Flexor Lunge",desc:"Releases anterior pelvic tilt that overloads the glutes. Keep back knee down, torso tall.",duration:"30 sec each"},
  ],
  quad:[
    {name:"Standing Quad Stretch",desc:"Stand on one foot, pull opposite ankle toward glute. Keep knees together and torso upright.",duration:"30 sec each"},
    {name:"Kneeling Hip Flexor Stretch",desc:"Kneel on one knee, push hips forward until stretch appears in front of back leg quad.",duration:"30 sec each"},
    {name:"Couch Stretch",desc:"Place top of back foot on bench/couch, front knee forward at 90°. Keep torso upright.",duration:"30 sec each"},
    {name:"Lying Side Quad Stretch",desc:"Lie on side, pull top ankle toward glute with your hand. Keep hips stacked, no twisting.",duration:"30 sec each"},
    {name:"Slow Walking Lunges",desc:"Take long lunge steps, focus on sinking deep into a quad stretch. Control the descent.",duration:"10 reps each leg"},
    {name:"Foam Roll Quads",desc:"Face down on floor, roller under one quad. Slowly roll from just below hip crease to just above knee.",duration:"60 sec each"},
  ],
  hamstring:[
    {name:"Standing Hamstring Stretch",desc:"Place heel on a surface, keep leg straight, hinge forward from hips until hamstring stretch. DO NOT round back.",duration:"30 sec each"},
    {name:"Seated Single-Leg Stretch",desc:"Sit tall on floor, extend one leg, flex foot, hinge at hips reaching toward foot.",duration:"30 sec each"},
    {name:"Lying Hamstring with Band",desc:"On back, wrap band/towel around one foot, pull leg up with knee straight.",duration:"30 sec each"},
    {name:"Downward Dog",desc:"Hands and feet on floor, push hips up and back. Pedal heels slowly, alternating.",duration:"30 sec"},
    {name:"Pigeon Pose",desc:"Back leg extended hip-width gets a hamstring stretch. Front shin horizontal, sit tall.",duration:"30 sec each"},
    {name:"Slow RDL Stretch",desc:"Slight knee bend, hinge at hips slowly, reach hands toward floor, feel hamstring lengthen, return.",duration:"10 slow reps"},
  ],
  knee:[
    {name:"Standing Quad Stretch",desc:"Pull ankle toward glute — relieves tension on the quad and patellar tendon crossing the knee.",duration:"30 sec each"},
    {name:"Seated Hamstring Stretch",desc:"Extend leg, flex foot, hinge forward from hips. Reduces pull on back of knee.",duration:"30 sec each"},
    {name:"Straight-Leg Calf Stretch",desc:"Press heel into floor against wall, straight leg. Reduces tension on the posterior knee.",duration:"30 sec each"},
    {name:"IT Band Stretch",desc:"Cross one leg behind the other, lean away from the back foot side. Feel outer thigh and knee.",duration:"30 sec each"},
    {name:"Hip Flexor Lunge",desc:"Releasing tight hip flexors reduces the load and stress transferred through the knee.",duration:"30 sec each"},
    {name:"Seated Knee Circles",desc:"Sit on edge of seat, foot off ground. Trace SLOW gentle circles with the knee — pain-free range ONLY.",duration:"10 each direction"},
  ],
  shin:[
    {name:"Kneeling Shin Stretch",desc:"Kneel with tops of feet flat on floor, sit back gently on heels. Feel stretch along the shin.",duration:"30 sec"},
    {name:"Ankle Circles",desc:"Seated or single-leg balance, slowly trace large circles at the ankle in both directions.",duration:"10 each direction"},
    {name:"Toe Raises",desc:"Stand with heels on ground, lift all toes up toward ceiling. Strengthens and stretches tibialis anterior.",duration:"15 reps"},
    {name:"Heel Walking",desc:"Walk forward on your heels only, toes lifted off ground. Directly works the shin musculature.",duration:"30 sec"},
    {name:"Tibialis Raises",desc:"Stand with back against wall, feet 12 inches out. Raise toes/forefoot off ground, lower slowly.",duration:"3 × 15 slow reps"},
    {name:"Straight-Leg Calf Stretch",desc:"Stretching the calf restores shin/calf tension balance, reducing shin overload.",duration:"30 sec each"},
  ],
  calf:[
    {name:"Straight-Leg Calf Stretch",desc:"Press ball of foot on wall or curb, heel flat on ground, keep leg straight. Deep soleus and gastrocnemius stretch.",duration:"30 sec each"},
    {name:"Bent-Knee Calf Stretch",desc:"Same position but slightly bend the knee. Targets the deeper soleus and Achilles.",duration:"30 sec each"},
    {name:"Heel Drop (Step Edge)",desc:"Stand on edge of step on ball of foot. Lower heel below step level slowly, hold.",duration:"30 sec each"},
    {name:"Downward Dog",desc:"Hands and feet on floor, hips up and back. Alternate pressing one heel toward floor at a time.",duration:"30 sec"},
    {name:"Slow Eccentric Calf Raises",desc:"Rise on toes, then lower over 4–5 counts. Builds tendon tolerance. Use a step for full range.",duration:"3 × 15 reps"},
    {name:"Ankle Circles",desc:"Slow controlled circles — promotes blood flow and helps calf recovery.",duration:"10 each direction"},
  ],
  ankle:[
    {name:"Ankle Circles",desc:"Seated or balancing on one leg, trace large slow circles. Do both directions.",duration:"10 each direction"},
    {name:"Straight-Leg Calf Stretch",desc:"Ball of foot against wall, heel down, leg straight. Stretches the structures that load the ankle.",duration:"30 sec each"},
    {name:"Achilles / Bent-Knee Stretch",desc:"Same as above but slightly bend the knee. Targets the Achilles tendon and soleus.",duration:"30 sec each"},
    {name:"Alphabet Spelling",desc:"Spell A–Z with your big toe, keeping leg still. Full ankle mobility drill for all ranges.",duration:"Once per foot"},
    {name:"Single-Leg Balance",desc:"Balance on one foot. Progress to eyes closed once steady. Rebuilds proprioception after ankle issues.",duration:"30 sec each (3 rounds)"},
    {name:"Band Inversion/Eversion",desc:"Wrap resistance band around foot. Push inward against band (inversion), then outward (eversion).",duration:"15 reps each direction"},
  ],
};

function getStretchKey(id){ return id.replace(/^(left_|right_)/, ""); }

export default function InjuryBodyMap({ athleteId }){
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
          .select("week_label,message")
          .eq("type","body_injury")
          .eq("day",String(athleteId))
          .eq("active",true);
        const loaded={};
        (data||[]).forEach(r=>{
          try{loaded[r.week_label]=JSON.parse(r.message);}catch(e){}
        });
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
    const msg=JSON.stringify({
      status:pStatus,
      pain:pPain,
      description:pDesc.trim(),
      updatedAt:new Date().toISOString(),
    });
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

  const parts=view==="front"?FRONT:BACK;
  const selDef=parts.find(p=>p.id===selected);

  const partFill=(id)=>{
    const d=partData[id];
    if(!d?.status||d.status==="good")return UNSET;
    return (STATUS[d.status]?.color||UNSET)+"44";
  };
  const partStroke=(id)=>{
    const d=partData[id];
    if(!d?.status||d.status==="good")return USTROKE;
    return (STATUS[d.status]?.color||UNSET)+"99";
  };

  const strKey=getStretchKey(selected||"");
  const stretches=STRETCHES[strKey]||[];
  const descEnough=pDesc.trim().length>=10;
  const showStretches=selected&&pStatus!=="good"&&stretches.length>0;

  const injuredCount=Object.values(partData).filter(d=>d.status==="sore"||d.status==="pain").length;

  return(
    <div>
      {/* Header */}
      <div style={{background:"#111",borderRadius:12,padding:"1rem 1.25rem",marginBottom:12,border:"1px solid "+RED+"33",borderLeft:"3px solid "+RED}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:2}}>Body Check-In</div>
            <div style={{fontSize:11,color:"#555"}}>Tap a zone to report how it feels. Coach Ant can see your status.</div>
          </div>
          {injuredCount>0&&(
            <div style={{fontSize:10,color:RED,fontWeight:800,background:RED+"18",padding:"4px 10px",borderRadius:20,border:"1px solid "+RED+"44",whiteSpace:"nowrap"}}>
              {injuredCount} area{injuredCount>1?"s":""} flagged
            </div>
          )}
        </div>
      </div>

      {/* Front / Back toggle */}
      <div style={{display:"flex",gap:8,marginBottom:10,background:"#111",borderRadius:12,padding:4}}>
        {[{v:"front",label:"Front View"},{v:"back",label:"Back View"}].map(({v,label})=>(
          <button key={v} onClick={()=>setView(v)} style={{flex:1,padding:"10px",borderRadius:10,border:"none",background:view===v?"linear-gradient(135deg,"+RED+"cc,"+RED+"88)":"transparent",color:view===v?"#fff":"#555",fontSize:12,fontWeight:view===v?700:400,cursor:"pointer",fontFamily:"Georgia,serif"}}>
            {label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:12,flexWrap:"wrap"}}>
        {Object.entries(STATUS).map(([k,v])=>(
          <div key={k} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:"#888"}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:v.color+"55",border:"1px solid "+v.color}}/>
            {v.label}
          </div>
        ))}
        <div style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:"#888"}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:UNSET,border:"1px solid "+USTROKE}}/>
          Not set
        </div>
      </div>

      {/* SVG Body */}
      <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
        <svg viewBox="0 0 200 385" style={{width:"100%",maxWidth:260,height:"auto"}}>
          {parts.map(p=>{
            const fill=partFill(p.id);
            const stroke=partStroke(p.id);
            const isSel=selected===p.id;
            const tr=p.rot?`rotate(${p.rot},${p.cx},${p.cy})`:undefined;
            const hasStat=partData[p.id]?.status&&partData[p.id].status!=="good";
            return(
              <g key={p.id} onClick={()=>selectPart(p.id)} style={{cursor:"pointer"}}>
                <ellipse
                  cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry}
                  fill={fill}
                  stroke={isSel?"#fff":stroke}
                  strokeWidth={isSel?2:1}
                  transform={tr}
                />
                {isSel&&(
                  <ellipse cx={p.cx} cy={p.cy} rx={p.rx+2} ry={p.ry+2} fill="none" stroke="#ffffff33" strokeWidth={1.5} transform={tr}/>
                )}
                {p.rx>10&&(
                  <text x={p.cx} y={p.cy+2.5} textAnchor="middle" fontSize={p.rx>18?7:6} fill={hasStat?"#fff":"#484848"} fontWeight="600" transform={tr} style={{pointerEvents:"none",fontFamily:"sans-serif",userSelect:"none"}}>
                    {p.svgLabel}
                  </text>
                )}
                {hasStat&&(
                  <circle cx={p.cx+(p.rx*0.55)} cy={p.cy-(p.ry*0.55)} r={4} fill={STATUS[partData[p.id].status]?.color} stroke="#111" strokeWidth={1} transform={tr} style={{pointerEvents:"none"}}/>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {!selected&&(
        <div style={{textAlign:"center",fontSize:11,color:"#444",marginBottom:16,fontStyle:"italic"}}>
          Tap any body part above to check in
        </div>
      )}

      {/* Selected part panel */}
      {selected&&selDef&&(
        <div style={{background:"#111",borderRadius:14,padding:"16px",marginBottom:12,border:"1px solid #222",borderLeft:"3px solid "+RED}}>
          <div style={{fontSize:15,fontWeight:900,color:"#fff",marginBottom:14}}>{selDef.name}</div>

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
              <div style={{fontSize:9,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>
                Pain Level{pPain>0?": "+pPain+"/10":""}
              </div>
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
                <span style={{color:SORE,marginLeft:6,textTransform:"none",letterSpacing:0,fontSize:9}}> · required to unlock stretches</span>
              )}
            </div>
            <textarea
              value={pDesc}
              onChange={e=>setPDesc(e.target.value)}
              placeholder="Where exactly does it hurt, what it feels like, how it happened, when it started..."
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

      {/* Stretches — locked until description entered */}
      {showStretches&&!descEnough&&(
        <div style={{background:"#111",borderRadius:14,padding:"16px",marginBottom:12,border:"1px solid "+SORE+"33",borderLeft:"3px solid "+SORE,textAlign:"center"}}>
          <div style={{fontSize:20,marginBottom:8}}>🔒</div>
          <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:4}}>Stretches locked</div>
          <div style={{fontSize:12,color:"#666",lineHeight:1.6}}>Describe your injury above before stretches are shown. This helps make sure you don't stretch something you shouldn't.</div>
        </div>
      )}

      {showStretches&&descEnough&&(
        <div style={{background:"#111",borderRadius:14,padding:"16px",marginBottom:12,border:"1px solid "+SORE+"33",borderLeft:"3px solid "+SORE}}>
          <div style={{fontSize:14,fontWeight:900,color:"#fff",marginBottom:4}}>
            Stretches — {selDef.name}
          </div>
          <div style={{fontSize:11,color:SORE,marginBottom:14,lineHeight:1.6,background:SORE+"11",padding:"10px 12px",borderRadius:8,border:"1px solid "+SORE+"22"}}>
            ⚠️ <strong>Stop any stretch that increases your pain.</strong> These are general mobility exercises — not medical treatment. Always check with Coach Ant before training on an injury. If it's swollen, numb, or gives way, see a doctor first.
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
