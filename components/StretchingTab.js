import { useState, useEffect, useRef } from "react";

const CATS={
  neck:{l:"Neck",i:"🔝",c:"#534AB7",s:[
    {n:"Neck Side Tilt",d:30,t:"Tilt ear toward shoulder. Breathe deeply. Feel the stretch on the opposite side of your neck."},
    {n:"Chin Tuck",d:10,t:"Pull chin straight back — not down. Hold 2 seconds. Resets cervical posture."},
    {n:"Neck Rotation",d:30,t:"Slowly turn head to look over shoulder. Don't force past comfortable range of motion."},
    {n:"Levator Scapulae",d:30,t:"Tilt head toward armpit. Place hand on back of head for gentle pressure."},
    {n:"Upper Trap Stretch",d:30,t:"Sit on your hand to anchor the shoulder. Tilt head away. Guide gently with the other hand."},
    {n:"Neck Half Circles",d:10,t:"Slow half-circles ear to ear through the front. Never roll the head backward."},
  ]},
  shoulders:{l:"Shoulders",i:"💪",c:"#C0392B",s:[
    {n:"Cross-Body Shoulder",d:30,t:"Pull arm across chest with forearm. Targets rear delt and upper back."},
    {n:"Doorway Chest Stretch",d:30,t:"Forearms on doorframe at 90°. Lean chest through. Opens anterior shoulder."},
    {n:"Overhead Tricep",d:30,t:"Arm overhead, bend elbow. Push elbow back with other hand. Long head of tricep."},
    {n:"Sleeper Stretch",d:30,t:"Lie on side, elbow bent 90°. Push forearm toward floor. Posterior capsule."},
    {n:"Wall Shoulder Stretch",d:30,t:"Hand on wall at shoulder height, rotate body away. Stretches anterior shoulder and pec."},
    {n:"Pec Minor Stretch",d:30,t:"Clasp hands behind back. Squeeze shoulder blades together, lift chest upward."},
  ]},
  chest:{l:"Chest",i:"🫁",c:"#1E6B3A",s:[
    {n:"Doorway Pec Stretch",d:30,t:"Elbow at 90°, 120°, and 150° — each hits a different section of the pec."},
    {n:"Thoracic Foam Roll",d:60,t:"Upper back over roller, arms crossed on chest. Breathe and extend over it slowly."},
    {n:"Lying Chest Opener",d:60,t:"Face up, arms out in a T. Let gravity open the chest. Full exhale each breath."},
    {n:"Camel Pose",d:30,t:"Kneel, reach back for your heels. Drive hips forward. Opens the entire anterior chain."},
    {n:"Corner Stretch",d:30,t:"Face a corner, forearms on both walls. Lean in. Full bilateral pec stretch."},
    {n:"Thoracic Rotation",d:30,t:"Sit tall, rotate torso fully each direction. Improves T-spine mobility and shoulder health."},
  ]},
  back:{l:"Back",i:"🏋️",c:"#D4AF37",s:[
    {n:"Child's Pose",d:60,t:"Kneel and sit back on heels, reach arms forward on the floor. Full lumbar stretch."},
    {n:"Cat-Cow",d:30,t:"Arch fully on inhale, round fully on exhale. 10 slow controlled reps. Spinal articulation."},
    {n:"Thread the Needle",d:30,t:"On all fours, thread one arm under your body. Upper back rotational stretch."},
    {n:"Lat Hang Stretch",d:30,t:"Single arm hang from a bar, let the hip drop on the same side. Full lat lengthening."},
    {n:"Seated Forward Fold",d:60,t:"Legs straight, hinge forward from the hip crease. Lead with your chest, not your forehead."},
    {n:"Back Extension",d:30,t:"Hands on lower back, extend backward slowly. Counteracts forward flexion throughout the day."},
    {n:"Foam Roll Lats",d:30,t:"Side lying, roller at armpit. Roll slowly from armpit to mid-back. Breathe through it."},
  ]},
  glutes:{l:"Glutes",i:"🍑",c:"#E8720C",s:[
    {n:"Pigeon Pose",d:60,t:"Front shin parallel to mat. Fold forward over front leg. Deep glute opener."},
    {n:"Figure-4 Stretch",d:45,t:"Cross ankle over opposite knee. Pull toward chest. Hits piriformis directly."},
    {n:"90/90 Hip Stretch",d:60,t:"Both legs bent at 90°. Sit tall. Works internal and external rotation simultaneously."},
    {n:"Glute Bridge Hold",d:45,t:"Bridge up and squeeze glutes hard at the top. Hold for time. Posterior chain activation."},
    {n:"Foam Roll Glutes",d:30,t:"Sit on roller, cross one leg over. Roll the glute and piriformis slowly."},
    {n:"Standing Figure-4",d:30,t:"Cross one ankle over bent standing knee. Sit back into it like a chair."},
    {n:"Seated Glute Stretch",d:45,t:"Ankle over opposite knee. Lean forward from the hips. Can be done anywhere."},
  ]},
  quads:{l:"Quads",i:"🦵",c:"#8E44AD",s:[
    {n:"Standing Quad Stretch",d:45,t:"Balance on one leg, pull ankle to glute. Keep your knees together, not splayed."},
    {n:"Kneeling Quad Stretch",d:45,t:"One knee down, reach for the same-side foot. Drive the hip forward into the floor."},
    {n:"Couch Stretch",d:60,t:"Back foot elevated on couch, front foot forward. Most powerful quad stretch available."},
    {n:"Lying Quad Stretch",d:45,t:"Lie on your side, pull the top foot to glute. Keep hips stacked and level."},
    {n:"Rectus Femoris",d:45,t:"Lunge forward, raise the same-side arm overhead and lean back. Gets the hip flexor too."},
    {n:"Dynamic Leg Swings",d:10,t:"Hold a wall for balance, swing leg forward and back with control. Dynamic warm-up prep."},
    {n:"Wall Quad Stretch",d:45,t:"Back to wall, step foot up behind you against it. Bend the standing knee slightly."},
  ]},
  hips:{l:"Hips",i:"⚙️",c:"#0F6E56",s:[
    {n:"Hip Flexor Lunge",d:45,t:"Low lunge, back knee on floor. Drive hips forward. Keep torso tall, don't lean."},
    {n:"Frog Stretch",d:60,t:"Knees wide, feet aligned with knees. Sink hips back. Inner groin and deep hip opener."},
    {n:"Cossack Squat",d:10,t:"Wide stance, shift to one side and sit as deep as possible. Alternating reps."},
    {n:"World's Greatest",d:10,t:"Lunge forward, hand to floor, rotate top arm to the sky. The full-body mobilizer."},
    {n:"Butterfly Stretch",d:60,t:"Feet together, knees out to the sides. Lean forward gently. Inner thigh and groin."},
    {n:"Hip Circle Drill",d:10,t:"Hands on hips, large slow circles. Lubricates the joint capsule and improves ROM."},
    {n:"90/90 Hip Rotation",d:60,t:"Both legs at 90°. Sit tall with a straight spine. Internal and external rotation together."},
  ]},
  hamstrings:{l:"Hamstrings",i:"🦿",c:"#854F0B",s:[
    {n:"Standing Hamstring",d:45,t:"One foot elevated, lean from the hips. Keep back flat — a rounded back means less stretch."},
    {n:"Lying Single Leg",d:45,t:"On your back, pull one leg toward chest. Other leg stays completely flat on the floor."},
    {n:"Seated Hamstring",d:60,t:"One leg extended, reach forward from the hip crease. Lead with your chest."},
    {n:"Wall Hamstring",d:60,t:"Lie near a wall, leg straight up against it. Gravity-assisted passive stretch."},
    {n:"Good Morning",d:45,t:"Hip-width stance, slight knee bend. Hinge forward until you feel it in the hamstring."},
    {n:"Inchworm",d:10,t:"Walk hands out to plank, then walk feet to meet hands. Dynamic full-chain warm-up."},
    {n:"Nordic Stretch",d:30,t:"Kneel, have a partner hold ankles, lean forward slowly. Eccentric hamstring strengthening."},
  ]},
  calves:{l:"Calves",i:"🦵",c:"#1A4F8A",s:[
    {n:"Wall Calf Stretch",d:45,t:"Back leg straight, heel flat on ground, toes up the wall. Targets the gastrocnemius."},
    {n:"Bent Knee Calf",d:45,t:"Same position, bend the back knee. This shifts focus to the soleus below."},
    {n:"Step Calf Stretch",d:45,t:"Heel off the edge of a step. Lower it slowly. Full range with gravity assist."},
    {n:"Downward Dog Press",d:10,t:"In down dog, alternate pressing each heel to the floor. Dynamic calf stretch."},
    {n:"Seated Towel Stretch",d:45,t:"Towel looped around foot, pull toward you with straight leg. Calf and plantar fascia."},
    {n:"Ankle Circles",d:10,t:"Full range rotation both directions. Loosens calf, Achilles tendon, and ankle joint."},
  ]},
  knees:{l:"Knees",i:"🦿",c:"#0F6E56",s:[
    {n:"Standing Quad Stretch",d:45,t:"Pull ankle to glute and hold. Relieves tension on the quad and patellar tendon. Keep knees together."},
    {n:"Seated Hamstring Stretch",d:45,t:"Extend leg, flex foot, hinge from the hips. Reduces the pull on the back of the knee from tight hamstrings."},
    {n:"IT Band Stretch",d:30,t:"Cross one leg behind the other, lean away from the back-foot side. Reduces lateral knee tension and runner's knee."},
    {n:"Seated Knee Circles",d:30,t:"Sit on seat edge, foot off the ground. Trace SLOW gentle circles in pain-free range only. Lubricates the joint."},
    {n:"Hip Flexor Lunge",d:45,t:"Back knee on floor, torso tall, push hips forward. Releasing tight hip flexors directly reduces load transferred through the knee."},
    {n:"Calf Stretch (Straight Leg)",d:30,t:"Press heel flat into floor, leg straight. Reduces posterior knee tension caused by tight calves and Achilles."},
    {n:"Terminal Knee Extension",d:30,t:"Loop band around a rack at knee height. Step back so band pulls knee into slight bend. Straighten knee slowly. Targets VMO for patellar tracking."},
  ]},
  ankles:{l:"Ankles",i:"🦶",c:"#854F0B",s:[
    {n:"Ankle Circles",d:30,t:"Foot off the floor, trace large slow circles in both directions through the full comfortable range. Do both directions — don't skip."},
    {n:"Alphabet Tracing",d:60,t:"Use your big toe to slowly trace every letter A–Z. Mobilises the ankle in all planes that circles alone miss."},
    {n:"Achilles Stretch (Bent Knee)",d:45,t:"Stand facing wall, back foot slightly bent at the knee. Press the heel firmly into the floor. This hits the soleus and Achilles attachment directly."},
    {n:"Banded Dorsiflexion",d:30,t:"Loop a band around a rack at ankle height. Step forward so the band pulls the ankle back. Bend the knee slightly — feel the front of the ankle open."},
    {n:"Towel Foot Pull",d:45,t:"Seated, legs extended, towel looped around the ball of one foot. Pull gently toward you with the knee straight. Stretches the calf and plantar fascia."},
    {n:"Single-Leg Balance",d:30,t:"Stand on one foot, keep ankle stable for the full hold. Progress to eyes closed or an unstable surface. Rebuilds proprioception lost after sprains."},
    {n:"Slow Calf Raises",d:30,t:"Rise fully onto toes, lower over 4–5 counts. Loads and strengthens the entire ankle-calf complex through full range."},
  ]},
};

const KEYS=Object.keys(CATS);

// ── Guided post-workout cool-down: hamstrings, hips, shoulders (~11 min) ──
const AREA_COLORS={Shoulders:"#C0392B",Hips:"#0F6E56",Hamstrings:"#854F0B"};
const FLOW=[
  {n:"Cross-Body Shoulder",area:"Shoulders",side:"Left",d:30,c:"Pull the arm across your chest with the opposite forearm. Feel it in the rear delt and upper back. Keep the shoulder down, away from your ear."},
  {n:"Cross-Body Shoulder",area:"Shoulders",side:"Right",d:30,c:"Switch sides. Same relaxed shoulder, steady breathing."},
  {n:"Doorway Chest Stretch",area:"Shoulders",d:45,c:"Forearms on the doorframe at 90°. Step one foot through and let the chest open. Breathe into it."},
  {n:"Sleeper Stretch",area:"Shoulders",side:"Left",d:30,c:"On your side, elbow bent 90°, gently press the forearm toward the floor. This is the posterior capsule — ease in, don't force."},
  {n:"Sleeper Stretch",area:"Shoulders",side:"Right",d:30,c:"Roll to the other side and repeat. Gentle pressure only."},
  {n:"Hip Flexor Lunge",area:"Hips",side:"Left",d:40,c:"Low lunge, back knee on the floor. Drive the hips forward and stay tall. Squeeze the back glute to deepen it."},
  {n:"Hip Flexor Lunge",area:"Hips",side:"Right",d:40,c:"Switch legs. Tall chest, hips driving forward."},
  {n:"Figure-4 Stretch",area:"Hips",side:"Left",d:40,c:"On your back, ankle over the opposite knee, pull the thigh toward your chest. Hits the glute and piriformis."},
  {n:"Figure-4 Stretch",area:"Hips",side:"Right",d:40,c:"Other side. Keep both feet flexed to protect the knees."},
  {n:"Butterfly Stretch",area:"Hips",d:60,c:"Soles of the feet together, knees wide. Sit tall, then hinge forward from the hips. Inner thigh and groin."},
  {n:"90/90 Hip Rotation",area:"Hips",side:"Left",d:40,c:"Both legs bent at 90°. Sit tall and lean gently over the front shin."},
  {n:"90/90 Hip Rotation",area:"Hips",side:"Right",d:40,c:"Rotate your legs to the other side and repeat. Slow and controlled."},
  {n:"Lying Single-Leg Hamstring",area:"Hamstrings",side:"Left",d:40,c:"On your back, pull one straight leg toward you. Keep the other leg flat. Flex the foot toward your face."},
  {n:"Lying Single-Leg Hamstring",area:"Hamstrings",side:"Right",d:40,c:"Switch legs. Straight knee, flat back."},
  {n:"Seated Hamstring Fold",area:"Hamstrings",d:60,c:"Legs out in front, hinge from the hip crease. Lead with your chest, keep the back flat — a rounded back means less stretch."},
  {n:"Standing Hamstring",area:"Hamstrings",side:"Left",d:35,c:"Heel on a low surface, hinge from the hips. Back flat, chest proud."},
  {n:"Standing Hamstring",area:"Hamstrings",side:"Right",d:35,c:"Other leg. Finish strong — long exhales."},
];
const FLOW_TOTAL=FLOW.reduce((s,x)=>s+x.d,0);

export default function StretchingTab(){
  const[cat,setCat]=useState("neck");
  const[open,setOpen]=useState(null);
  const[done,setDone]=useState(new Set());
  const[timerName,setTimerName]=useState("");
  const[timerSecs,setTimerSecs]=useState(0);
  const[timerTotal,setTimerTotal]=useState(0);
  const[timerColor,setTimerColor]=useState("#E8720C");
  const timerRef=useRef(null);
  // Guided cool-down flow: null = not running, 0..N-1 = current step, N = complete
  const[flowIdx,setFlowIdx]=useState(null);
  const[flowSecs,setFlowSecs]=useState(0);
  const[flowPaused,setFlowPaused]=useState(false);

  useEffect(()=>{ if(flowIdx!=null&&flowIdx<FLOW.length)setFlowSecs(FLOW[flowIdx].d); },[flowIdx]);
  useEffect(()=>{
    if(flowIdx==null||flowIdx>=FLOW.length||flowPaused)return;
    const id=setInterval(()=>{
      setFlowSecs(s=>{
        if(s<=1){clearInterval(id);try{if(navigator.vibrate)navigator.vibrate(35);}catch(e){}setFlowIdx(i=>i+1);return 0;}
        return s-1;
      });
    },1000);
    return()=>clearInterval(id);
  },[flowIdx,flowPaused]);

  useEffect(()=>{
    if(timerName){
      clearInterval(timerRef.current);
      timerRef.current=setInterval(()=>{
        setTimerSecs(s=>{
          if(s<=1){clearInterval(timerRef.current);setTimerName("");return 0;}
          return s-1;
        });
      },1000);
    }
    return()=>clearInterval(timerRef.current);
  },[timerName]);

  const startTimer=(secs,name,color)=>{
    clearInterval(timerRef.current);
    setTimerTotal(secs);setTimerSecs(secs);setTimerName(name);setTimerColor(color||"#E8720C");
  };

  const toggleDone=(key)=>{
    setDone(prev=>{const n=new Set(prev);n.has(key)?n.delete(key):n.add(key);return n;});
  };

  // ── GUIDED COOL-DOWN PLAYER ──
  if(flowIdx!=null){
    const exit=()=>{setFlowIdx(null);setFlowPaused(false);};
    // Completion screen
    if(flowIdx>=FLOW.length){
      return(
        <div style={{fontFamily:"Georgia,serif",minHeight:"70vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
          <div style={{width:"100%",maxWidth:420,textAlign:"center",background:"linear-gradient(160deg,#141414,#0b0b0b)",borderRadius:24,padding:"36px 24px 30px",border:"1px solid "+"#D4AF37"+"55",boxShadow:"0 0 40px "+"#D4AF37"+"22"}}>
            <div style={{fontSize:66,lineHeight:1,marginBottom:10}}>🧘</div>
            <div style={{fontSize:11,letterSpacing:"0.28em",textTransform:"uppercase",color:"#D4AF37",fontWeight:800}}>Cool-Down Complete</div>
            <div style={{fontSize:24,fontWeight:900,color:"#fdf6ec",marginTop:8,letterSpacing:"-0.02em"}}>Recovery in the bank 💪</div>
            <div style={{fontSize:13,color:"#a89a86",marginTop:8,lineHeight:1.5}}>{Math.round(FLOW_TOTAL/60)} min · hamstrings, hips &amp; shoulders. That's how you stay durable.</div>
            <div style={{display:"flex",gap:10,marginTop:24}}>
              <button onClick={()=>{setFlowIdx(0);setFlowPaused(false);}} style={{flex:1,padding:"14px",borderRadius:13,border:"1px solid rgba(255,255,255,0.16)",background:"transparent",color:"#fdf6ec",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif"}}>↺ Again</button>
              <button onClick={exit} style={{flex:1,padding:"14px",borderRadius:13,border:"none",background:"linear-gradient(135deg,#E8720C,#C0392B)",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"Georgia,serif"}}>Done →</button>
            </div>
          </div>
        </div>
      );
    }
    const step=FLOW[flowIdx];
    const col=AREA_COLORS[step.area]||"#E8720C";
    const remaining=flowSecs+FLOW.slice(flowIdx+1).reduce((s,x)=>s+x.d,0);
    const overallPct=Math.round(((FLOW_TOTAL-remaining)/FLOW_TOTAL)*100);
    const mm=Math.floor(remaining/60),ss=remaining%60;
    const R=52,CIRC=2*Math.PI*R;
    return(
      <div style={{fontFamily:"Georgia,serif",minHeight:"70vh"}}>
        <div style={{background:"linear-gradient(160deg,#141414,#0b0b0b)",borderRadius:22,padding:"18px 18px 22px",border:"1px solid "+col+"66",position:"relative",overflow:"hidden",boxShadow:"0 0 40px "+col+"22"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,transparent,"+col+",transparent)"}}/>
          {/* Header */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,position:"relative"}}>
            <div>
              <div style={{fontSize:9.5,letterSpacing:"0.2em",textTransform:"uppercase",color:col,fontWeight:800}}>Cool-Down Flow</div>
              <div style={{fontSize:12,color:"#a89a86",marginTop:2}}>Step {flowIdx+1} of {FLOW.length} · {mm}:{String(ss).padStart(2,"0")} left</div>
            </div>
            <button onClick={exit} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.14)",color:"#bbb",fontSize:15,cursor:"pointer",padding:"6px 11px",borderRadius:10,lineHeight:1}}>✕</button>
          </div>
          {/* Overall progress */}
          <div style={{height:4,background:"rgba(255,255,255,0.1)",borderRadius:3,overflow:"hidden",marginBottom:20}}>
            <div style={{height:"100%",width:overallPct+"%",background:"linear-gradient(90deg,"+col+","+col+"aa)",borderRadius:3,transition:"width 0.9s linear"}}/>
          </div>
          {/* Ring timer */}
          <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
            <div style={{position:"relative",width:150,height:150}}>
              <svg width="150" height="150" viewBox="0 0 120 120" style={{transform:"rotate(-90deg)"}}>
                <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="8"/>
                <circle cx="60" cy="60" r={R} fill="none" stroke={flowSecs<=3?"#ff5555":col} strokeWidth="8" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC*(1-flowSecs/(step.d||1))} style={{transition:"stroke-dashoffset 1s linear,stroke 0.3s"}}/>
              </svg>
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                <div style={{fontSize:44,fontWeight:900,color:flowSecs<=3?"#ff6b6b":"#fdf6ec",lineHeight:1}}>{flowSecs}</div>
                <div style={{fontSize:9,color:"#a89a86",textTransform:"uppercase",letterSpacing:"0.14em",marginTop:2}}>{flowPaused?"paused":"hold"}</div>
              </div>
            </div>
          </div>
          {/* Stretch name + area */}
          <div style={{textAlign:"center",marginBottom:14}}>
            <span style={{fontSize:9.5,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",color:col,background:col+"1f",padding:"3px 10px",borderRadius:6,border:"0.5px solid "+col+"55"}}>{step.area}</span>
            <div style={{fontSize:22,fontWeight:900,color:"#fdf6ec",letterSpacing:"-0.02em",marginTop:9,lineHeight:1.15}}>{step.n}{step.side?<span style={{color:col}}> · {step.side}</span>:null}</div>
          </div>
          {/* Cue */}
          <div style={{fontSize:13,color:"#c9c0b4",lineHeight:1.65,textAlign:"center",padding:"0 6px",marginBottom:20,minHeight:52}}>{step.c}</div>
          {/* Controls */}
          <div style={{display:"flex",gap:9,alignItems:"stretch"}}>
            <button onClick={()=>setFlowIdx(i=>Math.max(0,i-1))} disabled={flowIdx===0} style={{flex:1,padding:"14px",borderRadius:13,border:"1px solid rgba(255,255,255,0.14)",background:"transparent",color:flowIdx===0?"#555":"#fdf6ec",fontSize:14,fontWeight:700,cursor:flowIdx===0?"default":"pointer",fontFamily:"Georgia,serif"}}>‹ Prev</button>
            <button onClick={()=>setFlowPaused(p=>!p)} style={{flex:1.4,padding:"14px",borderRadius:13,border:"none",background:"linear-gradient(135deg,"+col+","+col+"bb)",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"Georgia,serif",boxShadow:"0 4px 16px "+col+"44"}}>{flowPaused?"▶ Resume":"⏸ Pause"}</button>
            <button onClick={()=>setFlowIdx(i=>i+1)} style={{flex:1,padding:"14px",borderRadius:13,border:"1px solid rgba(255,255,255,0.14)",background:"transparent",color:"#fdf6ec",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif"}}>Skip ›</button>
          </div>
        </div>
        {/* Up next */}
        {flowIdx+1<FLOW.length&&(
          <div style={{display:"flex",alignItems:"center",gap:10,marginTop:12,padding:"11px 14px",background:"#141414",borderRadius:12,border:"0.5px solid #262626"}}>
            <span style={{fontSize:9,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",color:"#777"}}>Up next</span>
            <span style={{fontSize:13,color:"#cfcfcf",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{FLOW[flowIdx+1].n}{FLOW[flowIdx+1].side?" · "+FLOW[flowIdx+1].side:""}</span>
            <span style={{marginLeft:"auto",fontSize:12,color:"#777"}}>{FLOW[flowIdx+1].d}s</span>
          </div>
        )}
      </div>
    );
  }

  const c=CATS[cat];
  const totalDone=done.size;
  const totalAll=KEYS.reduce((s,k)=>s+CATS[k].s.length,0);
  const catDone=c.s.filter((_,i)=>done.has(cat+"-"+i)).length;
  const catPct=Math.round((catDone/c.s.length)*100);
  const circumference=2*Math.PI*26;

  return(
    <div style={{fontFamily:"Georgia,serif",minHeight:"60vh"}}>

      {/* ── GUIDED COOL-DOWN FLOW ── */}
      <button onClick={()=>{setFlowIdx(0);setFlowPaused(false);}} style={{width:"100%",textAlign:"left",display:"flex",alignItems:"center",gap:14,padding:"16px 18px",marginBottom:16,borderRadius:18,border:"1px solid #E8720C55",background:"linear-gradient(135deg,#1c1206,#160d04)",cursor:"pointer",fontFamily:"Georgia,serif",boxShadow:"0 4px 20px #00000060"}}>
        <div style={{width:46,height:46,borderRadius:14,flexShrink:0,background:"linear-gradient(145deg,#E8720C,#C0392B)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,boxShadow:"0 0 18px #E8720C44"}}>🧘</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:15,fontWeight:900,color:"#fdf6ec",letterSpacing:"-0.01em"}}>Post-Workout Cool-Down</div>
          <div style={{fontSize:11.5,color:"#a89a86",marginTop:2}}>Hamstrings · Hips · Shoulders · ~{Math.round(FLOW_TOTAL/60)} min guided</div>
        </div>
        <div style={{flexShrink:0,padding:"9px 15px",borderRadius:11,background:"linear-gradient(135deg,#E8720C,#C0392B)",color:"#fff",fontSize:13,fontWeight:800,whiteSpace:"nowrap"}}>Start ▶</div>
      </button>

      {/* ── ACTIVE TIMER ── */}
      {timerName&&(
        <div style={{
          background:"linear-gradient(135deg,#1a1a1a,#111)",
          borderRadius:18,padding:"14px 16px",marginBottom:16,
          border:"1.5px solid "+timerColor+"66",
          boxShadow:"0 0 24px "+timerColor+"22,0 4px 16px #00000080",
          position:"relative",overflow:"hidden",
        }}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,"+timerColor+",transparent)"}}/>
          <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at top right,"+timerColor+"0a,transparent 70%)",pointerEvents:"none"}}/>
          <div style={{display:"flex",alignItems:"center",gap:16,position:"relative"}}>
            <div style={{position:"relative",flexShrink:0}}>
              <svg viewBox="0 0 60 60" style={{width:68,height:68,transform:"rotate(-90deg)",filter:"drop-shadow(0 0 6px "+timerColor+"55)"}}>
                <circle cx="30" cy="30" r="26" fill="none" stroke="#252525" strokeWidth="5"/>
                <circle cx="30" cy="30" r="26" fill="none" stroke={timerSecs<=5?"#ff4444":timerColor}
                  strokeWidth="5"
                  strokeDasharray={`${(timerSecs/timerTotal)*circumference} ${circumference}`}
                  strokeLinecap="round"
                  style={{transition:"stroke-dasharray 1s linear,stroke 0.3s"}}
                />
              </svg>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:19,fontWeight:900,color:timerSecs<=5?"#ff4444":"#fff",lineHeight:1,textShadow:timerSecs<=5?"0 0 8px #ff444488":"none"}}>{timerSecs}</span>
              </div>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:9,color:timerColor,textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:4,fontWeight:700}}>Holding Now</div>
              <div style={{fontSize:15,fontWeight:800,color:"#fff",marginBottom:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",letterSpacing:"-0.01em"}}>{timerName}</div>
              <div style={{height:4,background:"#252525",borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:(timerSecs/timerTotal*100)+"%",background:timerSecs<=5?"#ff4444":timerColor,borderRadius:3,transition:"width 1s linear",boxShadow:"0 0 8px "+(timerSecs<=5?"#ff444488":timerColor+"88")}}/>
              </div>
            </div>
            <button onClick={()=>{clearInterval(timerRef.current);setTimerName("");}}
              style={{background:"#222",border:"1px solid #333",color:"#888",fontSize:16,cursor:"pointer",padding:"6px 8px",borderRadius:8,lineHeight:1,flexShrink:0}}>✕</button>
          </div>
        </div>
      )}

      {/* ── OVERALL PROGRESS ── */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
        <div style={{flex:1,height:5,background:"#222",borderRadius:3,overflow:"hidden"}}>
          <div style={{height:"100%",width:(totalDone/totalAll*100)+"%",background:"linear-gradient(90deg,#534AB7,#E8720C)",borderRadius:3,transition:"width 0.4s",boxShadow:totalDone>0?"0 0 8px #E8720C44":undefined}}/>
        </div>
        <div style={{fontSize:11,color:totalDone>0?"#bbb":"#444",fontWeight:700,minWidth:52,textAlign:"right"}}>
          {totalDone}<span style={{color:"#444",fontWeight:400}}> / {totalAll}</span>
        </div>
      </div>

      {/* ── CATEGORY TABS ── */}
      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:6,marginBottom:14,scrollbarWidth:"none",WebkitOverflowScrolling:"touch"}}>
        {KEYS.map(k=>{
          const cc=CATS[k];
          const isA=cat===k;
          const kd=cc.s.filter((_,i)=>done.has(k+"-"+i)).length;
          const allD=kd===cc.s.length;
          return(
            <button key={k} onClick={()=>{setCat(k);setOpen(null);}}
              style={{
                display:"flex",flexDirection:"column",alignItems:"center",gap:3,
                padding:"10px 12px",borderRadius:12,
                border:"1.5px solid "+(isA?cc.c:allD?cc.c+"66":"#2d2d2d"),
                background:isA?"linear-gradient(160deg,"+cc.c+"ee,"+cc.c+"bb)":allD?cc.c+"18":"#181818",
                cursor:"pointer",flexShrink:0,fontFamily:"Georgia,serif",
                position:"relative",
                boxShadow:isA?"0 0 16px "+cc.c+"44,0 2px 8px #00000060":allD?"0 0 8px "+cc.c+"22":"none",
                transition:"all 0.15s",
              }}>
              {allD&&!isA&&<div style={{position:"absolute",top:4,right:4,width:6,height:6,borderRadius:"50%",background:cc.c,boxShadow:"0 0 6px "+cc.c}}/>}
              <span style={{fontSize:20}}>{cc.i}</span>
              <span style={{fontSize:9,color:isA?"#fff":allD?cc.c:"#aaa",whiteSpace:"nowrap",fontWeight:isA?900:500,textTransform:"uppercase",letterSpacing:"0.06em"}}>{cc.l}</span>
              {kd>0&&!allD&&<span style={{fontSize:8,color:cc.c,fontWeight:700}}>{kd}/{cc.s.length}</span>}
            </button>
          );
        })}
      </div>

      {/* ── CATEGORY HERO ── */}
      <div style={{
        background:"linear-gradient(135deg,"+c.c+"28,"+c.c+"0e,#0d0d0d)",
        borderRadius:16,padding:"20px",marginBottom:12,
        border:"1px solid "+c.c+"55",
        position:"relative",overflow:"hidden",
        boxShadow:"0 0 32px "+c.c+"18,0 4px 20px #00000060",
      }}>
        <div style={{position:"absolute",right:-16,top:-16,fontSize:100,opacity:0.1,lineHeight:1,userSelect:"none",filter:"saturate(0)"}}>{c.i}</div>
        <div style={{position:"absolute",top:0,left:0,width:"60%",height:2,background:"linear-gradient(90deg,"+c.c+",transparent)"}}/>
        <div style={{position:"absolute",bottom:0,right:0,width:"40%",height:1,background:"linear-gradient(270deg,"+c.c+"44,transparent)"}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative"}}>
          <div>
            <div style={{fontSize:9,color:c.c,textTransform:"uppercase",letterSpacing:"0.16em",fontWeight:800,marginBottom:6,textShadow:"0 0 12px "+c.c+"88"}}>{c.l} · Muscle Group</div>
            <div style={{fontSize:28,fontWeight:900,color:"#fff",letterSpacing:"-0.03em",lineHeight:1,marginBottom:6,textShadow:"0 2px 12px #00000080"}}>{c.l}</div>
            <div style={{fontSize:12,color:"#888",letterSpacing:"0.02em"}}>{catDone} of {c.s.length} complete</div>
            {catPct===100&&<div style={{fontSize:12,color:c.c,fontWeight:800,marginTop:5,textShadow:"0 0 8px "+c.c+"88"}}>✓ All done</div>}
          </div>
          <div style={{position:"relative",flexShrink:0}}>
            <svg viewBox="0 0 60 60" style={{width:64,height:64,transform:"rotate(-90deg)",filter:"drop-shadow(0 0 8px "+c.c+"44)"}}>
              <circle cx="30" cy="30" r="24" fill="none" stroke="#222" strokeWidth="5"/>
              <circle cx="30" cy="30" r="24" fill="none" stroke={c.c}
                strokeWidth="5"
                strokeDasharray={`${catPct*1.508} 150.8`}
                strokeLinecap="round"
                style={{transition:"stroke-dasharray 0.4s"}}
              />
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:13,fontWeight:900,color:catPct===100?c.c:"#fff",textShadow:catPct===100?"0 0 8px "+c.c:"none"}}>{catPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── STRETCH CARDS ── */}
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {c.s.map((s,i)=>{
          const key=cat+"-"+i;
          const isDone=done.has(key);
          const isOpen=open===i;
          const isTimerHere=timerName===s.n;
          return(
            <div key={i} style={{
              background:isDone?"#0f160f":isOpen?"#1c1c1c":"#181818",
              borderRadius:14,
              border:"1px solid "+(isDone?c.c+"44":isOpen?c.c+"66":"#2d2d2d"),
              overflow:"hidden",
              borderLeft:"3px solid "+(isDone?c.c:isOpen?c.c:"#404040"),
              boxShadow:isOpen?"0 0 16px "+c.c+"18,0 2px 12px #00000060":isDone?"0 0 8px "+c.c+"12":undefined,
              transition:"all 0.15s",
            }}>
              <div onClick={()=>setOpen(isOpen?null:i)}
                style={{display:"flex",alignItems:"center",gap:12,padding:"13px 14px 13px 12px",cursor:"pointer",userSelect:"none"}}>
                <button onClick={e=>{e.stopPropagation();toggleDone(key);}}
                  style={{
                    width:26,height:26,borderRadius:"50%",
                    border:"2px solid "+(isDone?c.c:"#3a3a3a"),
                    background:isDone?"linear-gradient(135deg,"+c.c+","+c.c+"cc)":"transparent",
                    flexShrink:0,cursor:"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    color:"#fff",fontSize:11,fontWeight:900,
                    boxShadow:isDone?"0 0 8px "+c.c+"66":undefined,
                    transition:"all 0.15s",
                  }}>
                  {isDone?"✓":""}
                </button>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:isDone?500:700,color:isDone?"#555":"#fff",textDecoration:isDone?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",letterSpacing:"-0.01em"}}>{s.n}</div>
                  <div style={{fontSize:11,color:isTimerHere?c.c:"#666",marginTop:2,fontWeight:isTimerHere?700:400}}>
                    {isTimerHere?"⏳ Timer running...":s.d+"s hold"}
                  </div>
                </div>
                <button onClick={e=>{e.stopPropagation();startTimer(s.d,s.n,c.c);}}
                  style={{
                    width:36,height:36,borderRadius:10,
                    border:"1.5px solid "+(isTimerHere?c.c:c.c+"44"),
                    background:isTimerHere?"linear-gradient(135deg,"+c.c+","+c.c+"bb)":c.c+"18",
                    flexShrink:0,cursor:"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:16,
                    boxShadow:isTimerHere?"0 0 10px "+c.c+"66":undefined,
                    transition:"all 0.15s",
                  }}>
                  ⏱
                </button>
                <span style={{fontSize:12,color:"#555",flexShrink:0,display:"inline-block",transform:isOpen?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</span>
              </div>

              {isOpen&&(
                <div style={{borderTop:"1px solid #252525",padding:"14px 14px 16px"}}>
                  <p style={{
                    fontSize:13,color:"#aaa",lineHeight:1.85,margin:"0 0 14px",
                    paddingLeft:12,
                    borderLeft:"3px solid "+c.c+"55",
                    fontStyle:"italic",
                    background:c.c+"08",
                    padding:"10px 12px",
                    borderRadius:"0 8px 8px 0",
                  }}>{s.t}</p>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                    <button onClick={()=>startTimer(s.d,s.n,c.c)}
                      style={{
                        borderRadius:12,border:"1.5px solid "+c.c+"44",
                        background:"linear-gradient(160deg,"+c.c+"18,"+c.c+"0a)",
                        padding:"12px 4px",cursor:"pointer",fontFamily:"Georgia,serif",
                        display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                        transition:"all 0.15s",
                      }}>
                      <span style={{fontSize:20}}>⏱</span>
                      <span style={{fontSize:11,fontWeight:800,color:c.c}}>{s.d}s</span>
                    </button>
                    <a href={"https://www.youtube.com/results?search_query="+encodeURIComponent(s.n+" stretch tutorial")} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
                      style={{
                        borderRadius:12,border:"1.5px solid #C0392B55",
                        background:"linear-gradient(160deg,#C0392B18,#C0392B0a)",
                        padding:"12px 4px",cursor:"pointer",textDecoration:"none",
                        display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                      }}>
                      <span style={{fontSize:20}}>▶️</span>
                      <span style={{fontSize:11,fontWeight:800,color:"#C0392B"}}>Video</span>
                    </a>
                    <button onClick={()=>{toggleDone(key);setOpen(null);}}
                      style={{
                        borderRadius:12,
                        border:"1.5px solid "+(isDone?"#1E6B3A55":c.c+"44"),
                        background:"linear-gradient(160deg,"+(isDone?"#1E6B3A18":""+c.c+"18")+","+(isDone?"#1E6B3A0a":""+c.c+"0a")+")",
                        padding:"12px 4px",cursor:"pointer",fontFamily:"Georgia,serif",
                        display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                        transition:"all 0.15s",
                      }}>
                      <span style={{fontSize:20}}>{isDone?"↩":"✓"}</span>
                      <span style={{fontSize:11,fontWeight:800,color:isDone?"#1E6B3A":c.c}}>{isDone?"Undo":"Done"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{textAlign:"center",padding:"2.5rem 0 0.5rem"}}>
        <div style={{fontSize:12,color:"#444",fontStyle:"italic",letterSpacing:"0.04em"}}>"As iron sharpens iron"</div>
        <div style={{fontSize:10,color:"#333",marginTop:3}}>Proverbs 27:17</div>
      </div>
    </div>
  );
}
