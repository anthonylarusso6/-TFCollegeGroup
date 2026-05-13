import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

const BG="#0f0f0f";
const PUR="#534AB7";
const RED="#C0392B";
const GREEN="#1E6B3A";
const GOLD="#D4AF37";
const STEEL="#708090";
const ORANGE="#E8720C";

export default function StretchingTab(){
  const CATS={
    neck:{l:"Neck",i:"🔝",c:"#534AB7",s:[
      {n:"Neck Side Tilt",d:30,t:"Tilt ear toward shoulder. Breathe deeply. Feel the stretch on the opposite side."},
      {n:"Chin Tuck",d:10,t:"Pull chin straight back. Hold 2 seconds. Resets cervical posture."},
      {n:"Neck Rotation",d:30,t:"Slowly turn head to look over shoulder. Don't force past comfortable range."},
      {n:"Levator Scapulae",d:30,t:"Tilt head toward armpit. Place hand on back of head for gentle pressure."},
      {n:"Upper Trap Stretch",d:30,t:"Sit on hand to anchor shoulder. Tilt head away. Guide gently with other hand."},
      {n:"Neck Half Circles",d:10,t:"Slow half-circles ear to ear through the front. Never roll backward."},
    ]},
    shoulders:{l:"Shoulders",i:"💪",c:"#C0392B",s:[
      {n:"Cross-Body Shoulder",d:30,t:"Pull arm across chest with forearm. Targets rear delt and upper back."},
      {n:"Doorway Chest Stretch",d:30,t:"Forearms on doorframe at 90°. Lean chest through. Opens anterior shoulder."},
      {n:"Overhead Tricep",d:30,t:"Arm overhead, bend elbow. Push elbow back with other hand."},
      {n:"Sleeper Stretch",d:30,t:"Lie on side, elbow bent 90°. Push forearm toward floor. Posterior capsule."},
      {n:"Wall Shoulder Stretch",d:30,t:"Hand on wall, rotate body away. Stretches anterior shoulder and pec."},
      {n:"Pec Minor Stretch",d:30,t:"Clasp hands behind back. Squeeze shoulder blades, lift chest upward."},
    ]},
    chest:{l:"Chest",i:"🫁",c:"#1E6B3A",s:[
      {n:"Doorway Pec Stretch",d:30,t:"Elbow at 90°, 120°, 150° — hit all three pec sections."},
      {n:"Thoracic Foam Roll",d:60,t:"Upper back over roller, arms crossed. Breathe and extend over it."},
      {n:"Lying Chest Opener",d:60,t:"Face up, arms in T. Let gravity open the chest. Full exhale each breath."},
      {n:"Camel Pose",d:30,t:"Kneel, reach back for heels. Drive hips forward. Opens anterior chain."},
      {n:"Corner Stretch",d:30,t:"Face corner, forearms on walls. Lean in. Full bilateral pec stretch."},
      {n:"Thoracic Rotation",d:30,t:"Sit tall, rotate torso fully each direction. Improves T-spine mobility."},
    ]},
    back:{l:"Back",i:"🏋️",c:"#D4AF37",s:[
      {n:"Child's Pose",d:60,t:"Kneel, sit back on heels, reach arms forward. Full lumbar stretch."},
      {n:"Cat-Cow",d:30,t:"Arch fully on inhale, round fully on exhale. 10 slow controlled reps."},
      {n:"Thread the Needle",d:30,t:"On all fours, thread arm under body. Upper back rotational stretch."},
      {n:"Lat Hang Stretch",d:30,t:"Single arm hang, let hip drop same side. Full lat lengthening."},
      {n:"Seated Forward Fold",d:60,t:"Legs straight, hinge from hip crease. Lead with chest not forehead."},
      {n:"Back Extension",d:30,t:"Hands on lower back, extend backward slowly. Counteracts forward flexion."},
      {n:"Foam Roll Lats",d:30,t:"Side lying, roller at armpit. Roll from armpit to mid-back slowly."},
    ]},
    glutes:{l:"Glutes",i:"🍑",c:"#E8720C",s:[
      {n:"Pigeon Pose",d:60,t:"Front shin parallel to mat. Fold forward over front leg. Deep glute opener."},
      {n:"Figure-4 Stretch",d:45,t:"Cross ankle over opposite knee. Pull toward chest. Hits piriformis."},
      {n:"90/90 Hip Stretch",d:60,t:"Both legs at 90°. Sit tall. Internal and external rotation together."},
      {n:"Glute Bridge Hold",d:45,t:"Bridge up, squeeze glutes at top and hold. Posterior chain activation."},
      {n:"Foam Roll Glutes",d:30,t:"Sit on roller, cross one leg. Roll glute and piriformis slowly."},
      {n:"Standing Figure-4",d:30,t:"Cross ankle over knee while standing. Sit back into it."},
      {n:"Seated Glute Stretch",d:45,t:"Ankle over opposite knee. Lean forward from hips. Office-friendly."},
    ]},
    quads:{l:"Quads",i:"🦵",c:"#8E44AD",s:[
      {n:"Standing Quad Stretch",d:45,t:"Stand one leg, pull ankle to glute. Keep knees together."},
      {n:"Kneeling Quad Stretch",d:45,t:"One knee down, reach for same-side foot. Drive hip forward."},
      {n:"Couch Stretch",d:60,t:"Back foot elevated on couch, front foot forward. Most powerful quad stretch."},
      {n:"Lying Quad Stretch",d:45,t:"Lie on side, pull top foot to glute. Hips stacked."},
      {n:"Rectus Femoris",d:45,t:"Lunge forward, raise same-side arm overhead and lean back."},
      {n:"Dynamic Leg Swings",d:10,t:"Hold wall, swing leg forward and back. Dynamic warm-up."},
      {n:"Wall Quad Stretch",d:45,t:"Back to wall, step foot up behind you. Bend standing knee slightly."},
    ]},
    hips:{l:"Hips",i:"⚙️",c:"#708090",s:[
      {n:"Hip Flexor Lunge",d:45,t:"Low lunge, back knee down. Drive hips forward. Keep torso tall."},
      {n:"Frog Stretch",d:60,t:"Knees wide, feet aligned. Sink hips back. Inner groin and deep hip."},
      {n:"Cossack Squat",d:10,t:"Wide stance, shift to one side, sit as deep as possible."},
      {n:"World's Greatest",d:10,t:"Lunge forward, hand to floor, rotate top arm to sky. Full mobilizer."},
      {n:"Butterfly Stretch",d:60,t:"Feet together, knees out. Lean forward gently. Inner thigh and groin."},
      {n:"Hip Circle Drill",d:10,t:"Hands on hips, large slow circles. Lubricates joint and improves ROM."},
      {n:"90/90 Hip Rotation",d:60,t:"Both legs at 90°. Sit tall. Internal and external rotation."},
    ]},
    hamstrings:{l:"Hamstrings",i:"🦿",c:"#854F0B",s:[
      {n:"Standing Hamstring",d:45,t:"One foot elevated, lean from hips. Keep back flat not rounded."},
      {n:"Lying Single Leg",d:45,t:"On back, pull one leg toward chest. Other leg stays flat."},
      {n:"Seated Hamstring",d:60,t:"One leg extended, reach from hip crease. Lead with chest."},
      {n:"Wall Hamstring",d:60,t:"Lie near wall, leg up against it. Gravity-assisted passive stretch."},
      {n:"Good Morning",d:45,t:"Hip-width stance, slight knee bend. Hinge forward until you feel it."},
      {n:"Inchworm",d:10,t:"Walk hands to plank, walk feet to hands. Dynamic full-chain warm-up."},
      {n:"Nordic Stretch",d:30,t:"Kneel, partner holds ankles, lean forward slowly. Eccentric strengthening."},
    ]},
    calves:{l:"Calves",i:"🦶",c:"#0F6E56",s:[
      {n:"Wall Calf Stretch",d:45,t:"Back leg straight, heel flat on ground. Targets gastrocnemius."},
      {n:"Bent Knee Calf",d:45,t:"Same position, bend back knee. Shifts focus to the soleus."},
      {n:"Step Calf Stretch",d:45,t:"Heel off step edge. Lower slowly. Full range with gravity."},
      {n:"Downward Dog Press",d:10,t:"In down dog, alternate pressing heels to floor. Dynamic stretch."},
      {n:"Seated Towel Stretch",d:45,t:"Towel around foot, pull toward you. Calf and plantar fascia."},
      {n:"Ankle Circles",d:10,t:"Full range rotation both ways. Loosens calf, Achilles, and ankle."},
    ]},
  };
  const KEYS=Object.keys(CATS);
  const[cat,setCat]=useState("neck");
  const[open,setOpen]=useState(null);
  const[done,setDone]=useState(new Set());
  const[timerName,setTimerName]=useState("");
  const[timerSecs,setTimerSecs]=useState(0);
  const[timerTotal,setTimerTotal]=useState(0);
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

  const startTimer=(secs,name)=>{
    clearInterval(timerRef.current);
    setTimerTotal(secs);setTimerSecs(secs);setTimerName(name);
  };

  const toggleDone=(key)=>{
    setDone(prev=>{const n=new Set(prev);n.has(key)?n.delete(key):n.add(key);return n;});
  };

  const c=CATS[cat];
  const totalDone=done.size;
  const totalAll=KEYS.reduce((s,k)=>s+CATS[k].s.length,0);
  const catDone=c.s.filter((_,i)=>done.has(cat+"-"+i)).length;
  const catPct=Math.round((catDone/c.s.length)*100);

  return(
    <div style={{fontFamily:"Georgia,serif",background:"#f5f5f5",minHeight:"60vh"}}>
      {/* Timer banner */}
      {timerName&&(
        <div style={{background:timerSecs<=5?"#C0392B":"#111",padding:"10px 14px",display:"flex",alignItems:"center",gap:10,marginBottom:8,borderRadius:10}}>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:"#999",marginBottom:4}}>{timerName}</div>
            <div style={{height:4,background:"#333",borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",width:(timerSecs/timerTotal*100)+"%",background:timerSecs<=5?"#ff5555":"#1E6B3A",borderRadius:2,transition:"width 1s linear"}}/>
            </div>
          </div>
          <div style={{fontSize:28,fontWeight:900,color:"#fff",minWidth:52,textAlign:"center"}}>{timerSecs}s</div>
          <button onClick={()=>{clearInterval(timerRef.current);setTimerName("");}} style={{background:"transparent",border:"none",color:"#777",fontSize:18,cursor:"pointer",fontFamily:"Georgia,serif"}}>✕</button>
        </div>
      )}

      {/* Category tabs */}
      <div style={{background:"#0f0f0f",borderRadius:12,padding:"12px",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>🧘 Stretching</div>
          <div style={{background:"#1a1a1a",borderRadius:8,padding:"4px 10px",textAlign:"center"}}>
            <span style={{fontSize:16,fontWeight:900,color:totalDone>0?"#1E6B3A":"#444"}}>{totalDone}</span>
            <span style={{fontSize:9,color:"#555",marginLeft:4}}>done</span>
          </div>
        </div>
        <div style={{height:3,background:"#222",borderRadius:2,overflow:"hidden",marginBottom:10}}>
          <div style={{height:"100%",width:(totalDone/totalAll*100)+"%",background:"linear-gradient(90deg,#534AB7,#1E6B3A)",borderRadius:2,transition:"width 0.4s"}}/>
        </div>
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>
          {KEYS.map(k=>{
            const cc=CATS[k];const isA=cat===k;
            const kd=cc.s.filter((_,i)=>done.has(k+"-"+i)).length;
            const allD=kd===cc.s.length;
            return(
              <button key={k} onClick={()=>{setCat(k);setOpen(null);}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"7px 9px",borderRadius:8,border:"none",flexShrink:0,background:isA?cc.c:allD?"#0d1f0d":"#1a1a1a",cursor:"pointer",position:"relative",fontFamily:"Georgia,serif"}}>
                {allD&&<div style={{position:"absolute",top:2,right:2,width:6,height:6,borderRadius:"50%",background:"#1E6B3A"}}/>}
                <span style={{fontSize:16}}>{cc.i}</span>
                <span style={{fontSize:9,color:isA?"#fff":"#666",whiteSpace:"nowrap"}}>{cc.l}</span>
                {kd>0&&!allD&&<span style={{fontSize:8,color:isA?"rgba(255,255,255,0.5)":"#444"}}>{kd}/{cc.s.length}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category hero */}
      <div style={{background:c.c,borderRadius:12,padding:"14px",marginBottom:10,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-10,right:-10,fontSize:65,opacity:0.12}}>{c.i}</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Muscle Group</div>
            <div style={{fontSize:18,fontWeight:800,color:"#fff"}}>{c.l}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.6)",marginTop:2}}>{catDone}/{c.s.length} completed</div>
          </div>
          <div style={{position:"relative",width:52,height:52,flexShrink:0}}>
            <svg viewBox="0 0 52 52" style={{width:52,height:52,transform:"rotate(-90deg)"}}>
              <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5"/>
              <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="5" strokeDasharray={`${catPct*1.382} 138.2`} strokeLinecap="round"/>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff"}}>{catPct}%</div>
          </div>
        </div>
      </div>

      {/* Stretch cards */}
      {c.s.map((s,i)=>{
        const key=cat+"-"+i;
        const isDone=done.has(key);
        const isOpen=open===i;
        return(
          <div key={i} style={{background:"#fff",borderRadius:12,marginBottom:8,border:`1px solid ${isDone?c.c+"55":"#e8e8e8"}`,overflow:"hidden",borderTop:isDone?`2px solid ${c.c}`:"1px solid #e8e8e8"}}>
            <div onClick={()=>setOpen(isOpen?null:i)} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",cursor:"pointer"}}>
              <button onClick={e=>{e.stopPropagation();toggleDone(key);}} style={{width:28,height:28,borderRadius:"50%",border:`2px solid ${isDone?c.c:"#ccc"}`,background:isDone?c.c:"transparent",flexShrink:0,cursor:"pointer",fontSize:13,fontWeight:700,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif"}}>
                {isDone?"✓":""}
              </button>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:isDone?"#aaa":"#1a1a1a",textDecoration:isDone?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.n}</div>
                <div style={{fontSize:11,color:c.c,fontWeight:600,marginTop:1}}>{s.d}s</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                <button onClick={e=>{e.stopPropagation();startTimer(s.d,s.n);}} style={{width:28,height:28,borderRadius:8,border:`1px solid ${c.c}44`,background:c.c+"11",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif"}}>⏱</button>
                <span style={{fontSize:11,color:"#ccc",display:"inline-block",transform:isOpen?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▼</span>
              </div>
            </div>
            {isOpen&&(
              <div style={{borderTop:"0.5px solid #f0f0f0",padding:"12px 14px 14px"}}>
                <p style={{fontSize:13,color:"#555",lineHeight:1.7,margin:"0 0 12px"}}>{s.t}</p>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>startTimer(s.d,s.n)} style={{flex:1,borderRadius:8,border:"none",background:c.c+"15",padding:"10px 4px",cursor:"pointer",fontFamily:"Georgia,serif",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                    <span style={{fontSize:18}}>⏱</span>
                    <span style={{fontSize:10,fontWeight:700,color:c.c}}>{s.d}s timer</span>
                  </button>
                  <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(s.n+" stretch tutorial")}`} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{flex:1,borderRadius:8,border:"none",background:"#fff5f5",padding:"10px 4px",cursor:"pointer",textDecoration:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                    <span style={{fontSize:18}}>▶️</span>
                    <span style={{fontSize:10,fontWeight:700,color:"#C0392B"}}>Watch video</span>
                  </a>
                  <button onClick={()=>{toggleDone(key);setOpen(null);}} style={{flex:1,borderRadius:8,border:"none",background:isDone?"#EAF3DE":c.c,padding:"10px 4px",cursor:"pointer",fontFamily:"Georgia,serif",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                    <span style={{fontSize:18}}>{isDone?"✅":"🏁"}</span>
                    <span style={{fontSize:10,fontWeight:700,color:isDone?"#1E6B3A":"#fff"}}>{isDone?"Done!":"Mark done"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <div style={{textAlign:"center",padding:"1.5rem 0",color:"#aaa",fontSize:11,fontStyle:"italic"}}>"As iron sharpens iron" — Proverbs 27:17</div>
    </div>
  );
}


