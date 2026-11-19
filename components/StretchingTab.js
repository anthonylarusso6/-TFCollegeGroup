import { useState, useEffect, useRef } from "react";
import { pulseMood } from "../lib/ambient";
import { hSuccess, hTap } from "../lib/haptics";
import { todayET } from "../lib/lifting";

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
// Calmer per-area tones (the category data above keeps its original colors unused)
const TONE={neck:"#7c74c9",shoulders:"#c96a5a",chest:"#4f9a6e",back:"#b89a4a",glutes:"#d08a4a",quads:"#9a6fc0",hips:"#3f9488",hamstrings:"#b07a48",calves:"#5a86b8",knees:"#4f9a8a",ankles:"#a8845a"};
const AREA_COLORS={Shoulders:TONE.shoulders,Hips:TONE.hips,Hamstrings:TONE.hamstrings};
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
  const[cat,setCat]=useState("hamstrings");
  const[open,setOpen]=useState(null);
  const[done,setDone]=useState(()=>new Set());
  const[timer,setTimer]=useState(null); // {key,name,total,secs,color}
  const[toast,setToast]=useState("");
  const[flowIdx,setFlowIdx]=useState(null); // null = not running, 0..N-1 = step, N = complete
  const[flowSecs,setFlowSecs]=useState(0);
  const[flowPaused,setFlowPaused]=useState(false);
  const wakeRef=useRef(null);
  const storeKey="tf_stretch_"+todayET();

  // Today's checkmarks survive leaving the tab (this phone only)
  useEffect(()=>{try{const raw=localStorage.getItem(storeKey);if(raw)setDone(new Set(JSON.parse(raw)));}catch(e){}},[]);
  const saveDone=(set)=>{try{localStorage.setItem(storeKey,JSON.stringify([...set]));}catch(e){}};
  const toggleDone=(key)=>{hTap();setDone(prev=>{const n=new Set(prev);n.has(key)?n.delete(key):n.add(key);saveDone(n);return n;});};
  const markDone=(key)=>setDone(prev=>{if(prev.has(key))return prev;const n=new Set(prev);n.add(key);saveDone(n);return n;});

  // Keep the screen awake while a guided flow or hold timer runs
  const wantAwake=(flowIdx!=null&&flowIdx<FLOW.length&&!flowPaused)||!!timer;
  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      try{
        if(wantAwake&&!wakeRef.current&&navigator.wakeLock){const l=await navigator.wakeLock.request("screen");if(cancelled){l.release();return;}wakeRef.current=l;}
        if(!wantAwake&&wakeRef.current){await wakeRef.current.release();wakeRef.current=null;}
      }catch(e){}
    })();
    return()=>{cancelled=true;};
  },[wantAwake]);
  useEffect(()=>()=>{try{wakeRef.current&&wakeRef.current.release();}catch(e){}},[]);

  // Guided flow clock
  const goStep=(i)=>{setFlowIdx(i);if(i!=null&&i<FLOW.length)setFlowSecs(FLOW[i].d);};
  useEffect(()=>{
    if(flowIdx==null||flowIdx>=FLOW.length||flowPaused)return;
    const id=setInterval(()=>{
      setFlowSecs(s=>{
        if(s<=1){
          clearInterval(id);try{if(navigator.vibrate)navigator.vibrate(35);}catch(e){}
          const nxt=flowIdx+1;setFlowIdx(nxt);
          return nxt<FLOW.length?FLOW[nxt].d:0;
        }
        return s-1;
      });
    },1000);
    return()=>clearInterval(id);
  },[flowIdx,flowPaused]);
  useEffect(()=>{ if(flowIdx===FLOW.length){hSuccess();pulseMood("celebrate",2600);} },[flowIdx]);

  // Single hold timer — finishing it checks the stretch off
  useEffect(()=>{
    if(!timer)return;
    const id=setInterval(()=>{
      setTimer(t=>{
        if(!t)return t;
        if(t.secs<=1){
          clearInterval(id);
          try{if(navigator.vibrate)navigator.vibrate([0,60,60,60]);}catch(e){}
          markDone(t.key);hSuccess();setToast(t.name+" ✓");setTimeout(()=>setToast(""),2400);
          return null;
        }
        return{...t,secs:t.secs-1};
      });
    },1000);
    return()=>clearInterval(id);
  },[timer&&timer.key]);
  const startTimer=(key,secs,name,color)=>{hTap();setTimer({key,name,total:secs,secs,color});};

  // ── GUIDED COOL-DOWN PLAYER ──
  if(flowIdx!=null){
    const exit=()=>{setFlowIdx(null);setFlowPaused(false);};
    if(flowIdx>=FLOW.length){
      return(
        <div className="tfx st">
          <section className="tfx-card st-complete">
            <div className="st-complete-ring" aria-hidden="true">✓</div>
            <div className="tfx-eyebrow">Cool-down complete</div>
            <h2>Recovery in the bank</h2>
            <p>{Math.round(FLOW_TOTAL/60)} min · hamstrings, hips and shoulders. That's how you stay durable.</p>
            <div className="st-complete-acts">
              <button className="tfx-btn-ghost tfx-press" onClick={()=>{goStep(0);setFlowPaused(false);}}>↺ Again</button>
              <button className="tfx-btn tfx-press" onClick={exit}>Done</button>
            </div>
          </section>
        </div>
      );
    }
    const step=FLOW[flowIdx];
    const col=AREA_COLORS[step.area]||"#d08a4a";
    const remaining=flowSecs+FLOW.slice(flowIdx+1).reduce((t,x)=>t+x.d,0);
    const overall=(FLOW_TOTAL-remaining)/FLOW_TOTAL;
    const mm=Math.floor(remaining/60),ss=remaining%60;
    const R=78,C=2*Math.PI*R;
    const next=FLOW[flowIdx+1];
    return(
      <div className="tfx st" style={{"--c":col}}>
        <section className="tfx-card st-player">
          <header className="st-player-head">
            <div>
              <div className="tfx-eyebrow">Cool-down · step {flowIdx+1} of {FLOW.length}</div>
              <span className="tfx-num">{mm}:{String(ss).padStart(2,"0")} left</span>
            </div>
            <button className="att-nav tfx-press" onClick={exit} aria-label="End cool-down">✕</button>
          </header>
          <div className="st-overall" aria-hidden="true"><i style={{"--p":overall}}/></div>
          <div className={"st-dial"+(flowSecs<=3?" is-ending":"")}>
            <svg viewBox="0 0 180 180" aria-hidden="true">
              <circle cx="90" cy="90" r={R} className="track"/>
              <circle cx="90" cy="90" r={R} className="arc" strokeDasharray={C} strokeDashoffset={C*(1-flowSecs/(step.d||1))} transform="rotate(-90 90 90)"/>
            </svg>
            <div className="st-dial-num"><b className="tfx-num">{flowSecs}</b><small>{flowPaused?"paused":"seconds"}</small></div>
          </div>
          <div className="st-step">
            <span className="st-area">{step.area}</span>
            <h2>{step.n}{step.side&&<em> · {step.side}</em>}</h2>
            <p>{step.c}</p>
          </div>
          <div className="st-controls">
            <button className="tfx-btn-ghost tfx-press" onClick={()=>goStep(Math.max(0,flowIdx-1))} disabled={flowIdx===0}>‹ Back</button>
            <button className="tfx-btn tfx-press st-pause" onClick={()=>setFlowPaused(p=>!p)}>{flowPaused?"▶ Resume":"❚❚ Pause"}</button>
            <button className="tfx-btn-ghost tfx-press" onClick={()=>goStep(flowIdx+1)}>Skip ›</button>
          </div>
        </section>
        {next&&(
          <div className="tfx-card st-next">
            <span className="tfx-eyebrow">Up next</span>
            <b>{next.n}{next.side?" · "+next.side:""}</b>
            <span className="tfx-num">{next.d}s</span>
          </div>
        )}
      </div>
    );
  }

  const c=CATS[cat];
  const tone=TONE[cat]||"#d08a4a";
  const centerChip=(row)=>{if(!row)return;const on=row.querySelector(".st-chip.is-on");if(on)row.scrollLeft=on.offsetLeft-(row.clientWidth-on.clientWidth)/2;};
  const totalDone=done.size;
  const catDone=c.s.filter((_,i)=>done.has(cat+"-"+i)).length;
  const flowAreas=["Hamstrings","Hips","Shoulders"];

  return(
    <div className="tfx st">
      <header className="tfx-hb-head">
        <div>
          <div className="tfx-eyebrow">Stretch</div>
          <h2>Recover right</h2>
        </div>
        {totalDone>0&&<span className="tfx-hb-streak"><b className="tfx-num">{totalDone}</b> done today</span>}
      </header>

      <button className="tfx-card st-hero tfx-press" onClick={()=>{setTimer(null);goStep(0);setFlowPaused(false);}}>
        <div className="st-hero-txt">
          <div className="tfx-eyebrow">Guided · {Math.round(FLOW_TOTAL/60)} min · {FLOW.length} holds</div>
          <b>Post-workout cool-down</b>
          <span className="st-hero-areas">{flowAreas.map(a=><i key={a} style={{"--c":AREA_COLORS[a]}}>{a}</i>)}</span>
        </div>
        <span className="st-hero-go" aria-hidden="true">▶</span>
      </button>

      <div className="st-sec-head"><div className="tfx-eyebrow">Target an area</div></div>
      <div className="st-areas" role="tablist" aria-label="Muscle group" ref={el=>{if(el&&el.dataset.cat!==cat){el.dataset.cat=cat;centerChip(el);}}}>
        {KEYS.map(k=>{
          const cc=CATS[k];
          const kd=cc.s.filter((_,i)=>done.has(k+"-"+i)).length;
          const on=cat===k;
          return(
            <button key={k} role="tab" aria-selected={on} className={"st-chip tfx-press"+(on?" is-on":"")+(kd===cc.s.length?" is-full":"")} style={{"--c":TONE[k]}} onClick={()=>{setCat(k);setOpen(null);}}>
              <i/>{cc.l}{kd>0&&<small className="tfx-num">{kd}/{cc.s.length}</small>}
            </button>
          );
        })}
      </div>

      <section className="tfx-card st-list" style={{"--c":tone}}>
        <header className="st-list-head">
          <div>
            <h3>{c.l}</h3>
            <span>{catDone===c.s.length?"All done 💪":`${catDone} of ${c.s.length} done`}</span>
          </div>
          <div className="st-mini" aria-hidden="true"><i style={{"--p":catDone/c.s.length}}/></div>
        </header>
        <ul>
          {c.s.map((st,i)=>{
            const key=cat+"-"+i;
            const isDone=done.has(key);
            const isOpen=open===i;
            const running=timer&&timer.key===key;
            return(
              <li key={key} className={"st-row"+(isDone?" is-done":"")+(isOpen?" is-open":"")+(running?" is-running":"")}>
                <div className="st-row-main" onClick={()=>setOpen(isOpen?null:i)}>
                  <button className="st-check tfx-press" onClick={e=>{e.stopPropagation();toggleDone(key);}} aria-pressed={isDone} aria-label={(isDone?"Undo ":"Mark done: ")+st.n}>{isDone?"✓":""}</button>
                  <span className="st-name"><b>{st.n}</b><small className="tfx-num">{running?`${timer.secs}s left`:`${st.d}s hold`}</small></span>
                  <button className="st-play tfx-press" onClick={e=>{e.stopPropagation();running?setTimer(null):startTimer(key,st.d,st.n,tone);}} aria-label={(running?"Stop timer for ":"Start timer for ")+st.n}>{running?"■":"▶"}</button>
                </div>
                {running&&<div className="st-run" aria-hidden="true"><i style={{"--p":timer.secs/timer.total}}/></div>}
                {isOpen&&(
                  <div className="st-more">
                    <p>{st.t}</p>
                    <div className="st-acts">
                      <a className="st-watch tfx-press" href={"https://www.youtube.com/results?search_query="+encodeURIComponent(st.n+" stretch tutorial")} target="_blank" rel="noreferrer">▶ Watch how</a>
                      <button className="tfx-btn-ghost tfx-press" onClick={()=>{toggleDone(key);setOpen(null);}}>{isDone?"Undo":"Mark done"}</button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {timer&&(
        <div className="st-float" role="timer" style={{"--c":timer.color}}>
          <svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" className="track"/><circle cx="18" cy="18" r="15" className="arc" strokeDasharray={2*Math.PI*15} strokeDashoffset={2*Math.PI*15*(1-timer.secs/timer.total)} transform="rotate(-90 18 18)"/></svg>
          <span className="st-float-txt"><b>{timer.name}</b><small className="tfx-num">{timer.secs}s left</small></span>
          <button onClick={()=>setTimer(null)} aria-label="Stop timer">✕</button>
        </div>
      )}
      {toast&&!timer&&<div className="st-float is-toast" role="status"><span className="st-float-txt"><b>{toast}</b></span></div>}
    </div>
  );
}
