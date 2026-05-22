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
  calves:{l:"Calves",i:"🦶",c:"#1A4F8A",s:[
    {n:"Wall Calf Stretch",d:45,t:"Back leg straight, heel flat on ground, toes up the wall. Targets the gastrocnemius."},
    {n:"Bent Knee Calf",d:45,t:"Same position, bend the back knee. This shifts focus to the soleus below."},
    {n:"Step Calf Stretch",d:45,t:"Heel off the edge of a step. Lower it slowly. Full range with gravity assist."},
    {n:"Downward Dog Press",d:10,t:"In down dog, alternate pressing each heel to the floor. Dynamic calf stretch."},
    {n:"Seated Towel Stretch",d:45,t:"Towel looped around foot, pull toward you with straight leg. Calf and plantar fascia."},
    {n:"Ankle Circles",d:10,t:"Full range rotation both directions. Loosens calf, Achilles tendon, and ankle joint."},
  ]},
};

const KEYS=Object.keys(CATS);

export default function StretchingTab(){
  const[cat,setCat]=useState("neck");
  const[open,setOpen]=useState(null);
  const[done,setDone]=useState(new Set());
  const[timerName,setTimerName]=useState("");
  const[timerSecs,setTimerSecs]=useState(0);
  const[timerTotal,setTimerTotal]=useState(0);
  const[timerColor,setTimerColor]=useState("#E8720C");
  const timerRef=useRef(null);

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

  const c=CATS[cat];
  const totalDone=done.size;
  const totalAll=KEYS.reduce((s,k)=>s+CATS[k].s.length,0);
  const catDone=c.s.filter((_,i)=>done.has(cat+"-"+i)).length;
  const catPct=Math.round((catDone/c.s.length)*100);
  const circumference=2*Math.PI*26; // r=26

  return(
    <div style={{fontFamily:"Georgia,serif",minHeight:"60vh"}}>

      {/* ── ACTIVE TIMER CARD ── */}
      {timerName&&(
        <div style={{background:"#111",borderRadius:16,padding:"1rem 1.25rem",marginBottom:14,border:"1.5px solid "+timerColor+"44",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,"+timerColor+",transparent)"}}/>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            {/* Circular countdown */}
            <div style={{position:"relative",flexShrink:0}}>
              <svg viewBox="0 0 60 60" style={{width:64,height:64,transform:"rotate(-90deg)"}}>
                <circle cx="30" cy="30" r="26" fill="none" stroke="#1e1e1e" strokeWidth="5"/>
                <circle cx="30" cy="30" r="26" fill="none" stroke={timerSecs<=5?"#C0392B":timerColor}
                  strokeWidth="5"
                  strokeDasharray={`${(timerSecs/timerTotal)*circumference} ${circumference}`}
                  strokeLinecap="round"
                  style={{transition:"stroke-dasharray 1s linear,stroke 0.3s"}}
                />
              </svg>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:18,fontWeight:900,color:timerSecs<=5?"#ff5555":"#fff",lineHeight:1}}>{timerSecs}</span>
              </div>
            </div>
            {/* Name + bar */}
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:9,color:"#444",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:3}}>Holding now</div>
              <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{timerName}</div>
              <div style={{height:3,background:"#1a1a1a",borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",width:(timerSecs/timerTotal*100)+"%",background:timerSecs<=5?"#C0392B":timerColor,borderRadius:2,transition:"width 1s linear"}}/>
              </div>
            </div>
            <button onClick={()=>{clearInterval(timerRef.current);setTimerName("");}}
              style={{background:"transparent",border:"none",color:"#444",fontSize:20,cursor:"pointer",padding:"4px",flexShrink:0,lineHeight:1}}>✕</button>
          </div>
        </div>
      )}

      {/* ── OVERALL PROGRESS ── */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <div style={{flex:1,height:3,background:"#1a1a1a",borderRadius:2,overflow:"hidden"}}>
          <div style={{height:"100%",width:(totalDone/totalAll*100)+"%",background:"linear-gradient(90deg,#534AB7,#E8720C)",borderRadius:2,transition:"width 0.4s"}}/>
        </div>
        <div style={{fontSize:10,color:totalDone>0?"#888":"#333",whiteSpace:"nowrap",fontWeight:600,minWidth:55,textAlign:"right"}}>
          {totalDone} / {totalAll}
        </div>
      </div>

      {/* ── CATEGORY TABS ── */}
      <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:4,marginBottom:12,scrollbarWidth:"none",WebkitOverflowScrolling:"touch"}}>
        {KEYS.map(k=>{
          const cc=CATS[k];
          const isA=cat===k;
          const kd=cc.s.filter((_,i)=>done.has(k+"-"+i)).length;
          const allD=kd===cc.s.length;
          return(
            <button key={k} onClick={()=>{setCat(k);setOpen(null);}}
              style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"8px 10px",borderRadius:10,border:"1.5px solid "+(isA?cc.c:allD?cc.c+"55":"#1e1e1e"),background:isA?cc.c:allD?cc.c+"12":"#111",cursor:"pointer",flexShrink:0,fontFamily:"Georgia,serif",position:"relative",transition:"all 0.15s"}}>
              {allD&&!isA&&<div style={{position:"absolute",top:3,right:3,width:5,height:5,borderRadius:"50%",background:cc.c,boxShadow:"0 0 4px "+cc.c}}/>}
              <span style={{fontSize:17}}>{cc.i}</span>
              <span style={{fontSize:8,color:isA?"#fff":allD?cc.c:"#555",whiteSpace:"nowrap",fontWeight:isA?800:400,textTransform:"uppercase",letterSpacing:"0.04em"}}>{cc.l}</span>
              {kd>0&&!allD&&(
                <span style={{fontSize:7,color:isA?"rgba(255,255,255,0.5)":cc.c+"88"}}>{kd}/{cc.s.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── CATEGORY HERO ── */}
      <div style={{background:"linear-gradient(135deg,"+c.c+"1a,"+c.c+"06)",borderRadius:14,padding:"16px",marginBottom:10,border:"1px solid "+c.c+"33",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-12,top:-12,fontSize:80,opacity:0.07,lineHeight:1,userSelect:"none"}}>{c.i}</div>
        <div style={{position:"absolute",top:0,left:0,width:"40%",height:2,background:"linear-gradient(90deg,"+c.c+",transparent)"}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:9,color:c.c,textTransform:"uppercase",letterSpacing:"0.14em",fontWeight:800,marginBottom:5}}>Muscle Group</div>
            <div style={{fontSize:24,fontWeight:900,color:"#fff",letterSpacing:"-0.02em",marginBottom:3}}>{c.l}</div>
            <div style={{fontSize:11,color:"#555"}}>{catDone} of {c.s.length} complete</div>
            {catPct===100&&<div style={{fontSize:11,color:c.c,fontWeight:700,marginTop:4}}>✓ All done</div>}
          </div>
          {/* Progress ring */}
          <div style={{position:"relative",flexShrink:0}}>
            <svg viewBox="0 0 60 60" style={{width:60,height:60,transform:"rotate(-90deg)"}}>
              <circle cx="30" cy="30" r="24" fill="none" stroke="#1a1a1a" strokeWidth="5"/>
              <circle cx="30" cy="30" r="24" fill="none" stroke={c.c}
                strokeWidth="5"
                strokeDasharray={`${catPct*1.508} 150.8`}
                strokeLinecap="round"
                style={{transition:"stroke-dasharray 0.4s"}}
              />
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:12,fontWeight:900,color:catPct===100?c.c:"#fff"}}>{catPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── STRETCH CARDS ── */}
      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {c.s.map((s,i)=>{
          const key=cat+"-"+i;
          const isDone=done.has(key);
          const isOpen=open===i;
          const isTimerHere=timerName===s.n;
          return(
            <div key={i} style={{
              background:isDone?"#0a120a":"#141414",
              borderRadius:12,
              border:"1px solid "+(isDone?c.c+"33":isOpen?c.c+"55":"#1e1e1e"),
              overflow:"hidden",
              borderLeft:"3px solid "+(isDone?c.c:isOpen?c.c+"99":"#252525"),
              transition:"all 0.15s",
            }}>
              {/* Row */}
              <div onClick={()=>setOpen(isOpen?null:i)}
                style={{display:"flex",alignItems:"center",gap:10,padding:"11px 12px 11px 10px",cursor:"pointer",userSelect:"none"}}>
                {/* Checkbox */}
                <button onClick={e=>{e.stopPropagation();toggleDone(key);}}
                  style={{width:24,height:24,borderRadius:"50%",border:"2px solid "+(isDone?c.c:"#2a2a2a"),background:isDone?c.c:"transparent",flexShrink:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:900,transition:"all 0.15s"}}>
                  {isDone?"✓":""}
                </button>
                {/* Name + sub */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:isDone?400:600,color:isDone?"#3a3a3a":"#ddd",textDecoration:isDone?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.n}</div>
                  <div style={{fontSize:10,color:isTimerHere?c.c:"#444",marginTop:1,fontWeight:isTimerHere?700:400}}>
                    {isTimerHere?"⏳ Timer running...":s.d+"s hold"}
                  </div>
                </div>
                {/* Timer btn */}
                <button onClick={e=>{e.stopPropagation();startTimer(s.d,s.n,c.c);}}
                  style={{width:32,height:32,borderRadius:8,border:"1px solid "+(isTimerHere?c.c:c.c+"33"),background:isTimerHere?c.c:c.c+"15",flexShrink:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,transition:"all 0.15s"}}>
                  ⏱
                </button>
                {/* Chevron */}
                <span style={{fontSize:11,color:"#333",flexShrink:0,display:"inline-block",transform:isOpen?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</span>
              </div>

              {/* Expanded detail */}
              {isOpen&&(
                <div style={{borderTop:"1px solid #1e1e1e",padding:"12px 12px 14px 13px"}}>
                  <p style={{fontSize:13,color:"#777",lineHeight:1.8,margin:"0 0 12px",paddingLeft:10,borderLeft:"2px solid "+c.c+"44",fontStyle:"italic"}}>{s.t}</p>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                    <button onClick={()=>startTimer(s.d,s.n,c.c)}
                      style={{borderRadius:10,border:"1px solid "+c.c+"33",background:c.c+"12",padding:"10px 4px",cursor:"pointer",fontFamily:"Georgia,serif",display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all 0.15s"}}>
                      <span style={{fontSize:19}}>⏱</span>
                      <span style={{fontSize:10,fontWeight:700,color:c.c}}>{s.d}s</span>
                    </button>
                    <a href={"https://www.youtube.com/results?search_query="+encodeURIComponent(s.n+" stretch tutorial")} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
                      style={{borderRadius:10,border:"1px solid #C0392B33",background:"#C0392B0f",padding:"10px 4px",cursor:"pointer",textDecoration:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <span style={{fontSize:19}}>▶️</span>
                      <span style={{fontSize:10,fontWeight:700,color:"#C0392B"}}>Video</span>
                    </a>
                    <button onClick={()=>{toggleDone(key);setOpen(null);}}
                      style={{borderRadius:10,border:"1px solid "+(isDone?"#1E6B3A33":c.c+"33"),background:isDone?"#1E6B3A18":c.c+"18",padding:"10px 4px",cursor:"pointer",fontFamily:"Georgia,serif",display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all 0.15s"}}>
                      <span style={{fontSize:19}}>{isDone?"↩":"✓"}</span>
                      <span style={{fontSize:10,fontWeight:700,color:isDone?"#1E6B3A":c.c}}>{isDone?"Undo":"Done"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{textAlign:"center",padding:"2rem 0 0.5rem"}}>
        <div style={{fontSize:12,color:"#2a2a2a",fontStyle:"italic",letterSpacing:"0.04em"}}>"As iron sharpens iron"</div>
        <div style={{fontSize:10,color:"#222",marginTop:2}}>Proverbs 27:17</div>
      </div>
    </div>
  );
}
