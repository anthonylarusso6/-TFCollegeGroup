import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { supabase } from "../lib/supabase";

const BG="#0f0f0f";
const PUR="#534AB7";
const GOLD="#D4AF37";
const RED="#C0392B";
const STEEL="#708090";
const GREEN="#1E6B3A";
const LC=["#534AB7","#0F6E56","#854F0B","#993556"];
const LB=["#EEEDFE","#E1F5EE","#FAEEDA","#FBEAF0"];

const CUTOFFS={Mon:{h:9,m:0},Tue:{h:9,m:30},Thu:{h:9,m:30},Fri:{h:9,m:0}};
const CLASS_DAYS=["Mon","Tue","Thu","Fri"];
const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const BRACELETS=[
  {color:"Light orange",ref:"Proverbs 3:5",text:"Trust in the Lord with all your heart.",hex:"#F5A623"},
  {color:"Dark orange",ref:"Psalm 46:10",text:"Be still, and know that I am God.",hex:"#D4581A"},
  {color:"Yellow",ref:"Genesis 1:3",text:"And God said, let there be light.",hex:"#E8C84A"},
  {color:"Light blue",ref:"1 Peter 5:7",text:"Cast all your anxiety on him.",hex:"#5BBFEA"},
  {color:"Dark blue",ref:"1 John 3:1",text:"See what great love the Father has lavished on us.",hex:"#1A4F8A"},
  {color:"Red",ref:"Philippians 4:13",text:"I can do all things through Christ who strengthens me.",hex:"#C0392B"},
  {color:"Pink",ref:"1 Corinthians 13:13",text:"The greatest of these is love.",hex:"#E87AAC"},
  {color:"Dark purple",ref:"Matthew 11:28",text:"Come to me, all who are weary, and I will give you rest.",hex:"#5B2D8E"},
  {color:"Light purple",ref:"John 14:6",text:"I am the way and the truth and the life.",hex:"#9B59B6"},
  {color:"Dark green",ref:"Joshua 1:9",text:"Be strong and courageous.",hex:"#1E6B3A"},
  {color:"Light green",ref:"Psalm 27:1",text:"The Lord is my light and my salvation.",hex:"#58B368"},
  {color:"Teal",ref:"Jeremiah 29:11",text:"Plans to prosper you and not to harm you.",hex:"#1A9E8F"},
];

const TIER_COLORS={
  1:{bg:"#EEEDFE",border:"#534AB7",color:"#3C3489",label:"Tier 1"},
  2:{bg:"#E1F5EE",border:"#0F6E56",color:"#085041",label:"Tier 2"},
  3:{bg:"#FAEEDA",border:"#854F0B",color:"#633806",label:"Tier 3"},
};

const snakeSeq=(total)=>{
  const order=[];let i=0,dir=1;
  while(order.length<total){
    order.push(i);
    if(i===3)dir=-1;
    if(i===0&&order.length>1)dir=1;
    i+=dir;
  }
  return order;
};
function VitruveData({athleteId,athleteName,vitruveId}){
  const[data,setData]=useState(null);
  const[filter,setFilter]=useState("all");
  const[openSet,setOpenSet]=useState(null);
  const[openSession,setOpenSession]=useState(null);
  const[openSessionSet,setOpenSessionSet]=useState(null);

  const zc=v=>v>=1.0?"#3C3489":v>=0.75?"#27500A":v>=0.5?"#633806":"#A32D2D";
  const zb=v=>v>=1.0?"#EEEDFE":v>=0.75?"#EAF3DE":v>=0.5?"#FAEEDA":"#FCEBEB";
  const zl=v=>v>=1.0?"Power":v>=0.75?"Speed-Str":v>=0.5?"Str-Speed":"Strength";
  const zbd=v=>v>=1.0?"#534AB7":v>=0.75?"#1E6B3A":v>=0.5?"#854F0B":"#A32D2D";

  const zones=[
    {label:"Strength",range:"under 0.5 m/s",desc:"Heavy load, slow bar speed. Building max force and raw strength.",bg:"#FCEBEB",color:"#A32D2D",dark:"#791F1F",min:0,max:0.5},
    {label:"Str-Speed",range:"0.5 to 0.75 m/s",desc:"Moderate load, controlled speed. Bridge between strength and power.",bg:"#FAEEDA",color:"#633806",dark:"#412402",min:0.5,max:0.75},
    {label:"Spd-Str",range:"0.75 to 1.0 m/s",desc:"Lighter load, fast bar speed. Converting strength into sport speed.",bg:"#EAF3DE",color:"#27500A",dark:"#173404",min:0.75,max:1.0},
    {label:"Power",range:"above 1.0 m/s",desc:"Explosive bar speed. Maximum rate of force development. Athletic power.",bg:"#EEEDFE",color:"#3C3489",dark:"#26215C",min:1.0,max:99},
  ];

  useEffect(()=>{
    setData(null);
    fetch("/api/vitruve?athleteId="+athleteId+"&athleteName="+encodeURIComponent(athleteName)+"&date="+filter+(vitruveId?"&vitruveId="+vitruveId:""))
      .then(r=>r.json()).then(setData);
  },[athleteId,filter]);

  const latest=data?.latest;
  const history=data?.history||[];
  const prev=data?.prevSame;
  const wk=data?.weekVolume;

  const repRow=(r,si)=>(
    <div key={r.rep} style={{display:"grid",gridTemplateColumns:"40px 1fr 1fr 20px",gap:5,alignItems:"center",padding:"5px 10px",background:r.isBest?"#FAEEDA":"#fff",borderRadius:6,marginBottom:3,borderLeft:"2px solid "+zbd(r.peak)}}>
      <div style={{fontSize:10,color:"#888"}}>Rep {r.rep}</div>
      <div style={{textAlign:"center"}}><div style={{fontSize:11,fontWeight:500,color:"#534AB7"}}>{r.peak?.toFixed(2)||"—"}</div><div style={{fontSize:9,color:"#888"}}>peak</div></div>
      <div style={{textAlign:"center"}}><div style={{fontSize:11,fontWeight:500,color:"#0F6E56"}}>{r.mean?.toFixed(2)||"—"}</div><div style={{fontSize:9,color:"#888"}}>mean</div></div>
      <div style={{fontSize:12,textAlign:"center"}}>{r.isBest?"★":""}</div>
    </div>
  );

  const trendLine=(sets)=>{
    if(!sets||sets.length<2)return null;
    const peaks=sets.map(s=>s.peakVelocity||0);
    const max=Math.max(...peaks);const min=Math.min(...peaks);
    const range=max-min||0.1;
    const pts=peaks.map((p,i)=>`${Math.round(i/(peaks.length-1)*400)},${Math.round((1-(p-min)/range)*28+2)}`).join(" ");
    return(
      <div style={{background:"#f9f9f9",borderRadius:8,padding:"8px 12px",border:"0.5px solid #e0e0e0",marginBottom:12}}>
        <div style={{fontSize:10,color:"#888",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.04em"}}>Velocity trend across sets</div>
        <svg viewBox="0 0 400 32" style={{width:"100%",height:32}}>
          <polyline points={pts} fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          {peaks.map((p,i)=><circle key={i} cx={Math.round(i/(peaks.length-1)*400)} cy={Math.round((1-(p-min)/range)*28+2)} r="4" fill={zbd(p)}/>)}
        </svg>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          {peaks.map((p,i)=><span key={i} style={{fontSize:9,color:"#888"}}>S{i+1}·{p.toFixed(2)}</span>)}
        </div>
      </div>
    );
  };

  const setRow=(s,i,sessionIdx,isLatest)=>{
    const key=isLatest?"l-"+i:sessionIdx+"-"+i;
    const isOpen=isLatest?openSet===i:openSessionSet===key;
    const toggle=()=>{
      if(isLatest)setOpenSet(o=>o===i?null:i);
      else setOpenSessionSet(o=>o===key?null:key);
    };
    return(
      <div key={i} style={{marginBottom:5}}>
        <button onClick={toggle} style={{width:"100%",display:"grid",gridTemplateColumns:"40px 55px 1fr 1fr 1fr "+(s.isPR?"32px":"20px"),gap:5,alignItems:"center",padding:"8px 10px",background:isOpen?zb(s.peakVelocity||0):"#f9f9f9",borderRadius:8,border:"none",borderLeft:"3px solid "+zbd(s.peakVelocity||0),cursor:"pointer",fontFamily:"Georgia,serif"}}>
          <div style={{fontSize:11,color:"#888",textAlign:"left"}}>Set {i+1}</div>
          <div style={{fontSize:11,fontWeight:500,color:"#1a1a1a",textAlign:"left"}}>{s.load||"—"} lbs</div>
          <div style={{textAlign:"center"}}><div style={{fontSize:12,fontWeight:500,color:"#534AB7"}}>{s.peakVelocity?.toFixed(2)||"—"}</div><div style={{fontSize:9,color:"#888"}}>peak</div></div>
          <div style={{textAlign:"center"}}><div style={{fontSize:12,fontWeight:500,color:"#0F6E56"}}>{s.meanVelocity?.toFixed(2)||"—"}</div><div style={{fontSize:9,color:"#888"}}>mean</div></div>
          <div style={{textAlign:"center"}}><div style={{fontSize:12,fontWeight:500,color:"#1a1a1a"}}>{s.reps||"—"}</div><div style={{fontSize:9,color:"#888"}}>reps</div></div>
          {s.isPR?<div style={{fontSize:10,fontWeight:500,color:"#D4AF37",background:"#1f1700",borderRadius:4,padding:"2px 4px",textAlign:"center"}}>PR</div>:<div style={{fontSize:11,color:"#888"}}>{isOpen?"▲":"▼"}</div>}
        </button>
        {isOpen&&s.repData&&s.repData.length>0&&(
          <div style={{padding:"8px 10px",background:zb(s.peakVelocity||0),borderRadius:"0 0 8px 8px",borderLeft:"3px solid "+zbd(s.peakVelocity||0)}}>
            <div style={{fontSize:10,color:"#888",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.04em"}}>Rep by rep — ★ best rep</div>
            {s.repData.map((r,ri)=>repRow(r,ri))}
          </div>
        )}
      </div>
    );
  };

  if(!data)return<div style={{background:"#fff",borderRadius:12,padding:"1rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}><div style={{fontSize:12,color:"#aaa",textAlign:"center",padding:"10px 0"}}>Loading training data...</div></div>;
  if(data.noData)return<div style={{background:"#fff",borderRadius:12,padding:"1rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}><div style={{fontSize:12,color:"#aaa",textAlign:"center",padding:"10px 0"}}>No sessions yet — sync after your next lift</div></div>;
  if(data.error)return<div style={{background:"#fff",borderRadius:12,padding:"1rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}><div style={{fontSize:12,color:"#aaa",textAlign:"center",padding:"10px 0"}}>Vitruve connecting...</div></div>;

  return(
    <div>
      {/* Weekly volume */}
      {wk&&(
        <div style={{background:"#0f0f0f",borderRadius:12,padding:"1rem",marginBottom:12,border:"0.5px solid #222"}}>
          <div style={{fontSize:11,fontWeight:500,color:"#555",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:10}}>This week — velocity training</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
            {[
              {label:"Sessions",val:wk.sessions,color:"#fff"},
              {label:"Sets",val:wk.sets,color:"#534AB7"},
              {label:"Reps",val:wk.reps,color:"#0F6E56"},
              {label:"lbs moved",val:wk.lbs>999?(Math.round(wk.lbs/100)/10)+"k":wk.lbs,color:"#D4AF37"},
            ].map(s=>(
              <div key={s.label} style={{textAlign:"center"}}>
                <div style={{fontSize:20,fontWeight:500,color:s.color}}>{s.val}</div>
                <div style={{fontSize:10,color:"#555",marginTop:2}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latest session */}
      {latest&&(
        <div style={{background:"#fff",borderRadius:12,padding:"1rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
          <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>Latest session</div>
          <div style={{fontSize:11,color:"#1E6B3A",marginBottom:12}}>✓ {latest.date} · {latest.exercise}</div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
            <div style={{background:"#f5f5f5",borderRadius:8,padding:"10px",textAlign:"center"}}>
              <div style={{fontSize:18,fontWeight:500,color:"#1a1a1a"}}>{latest.oneRM||"—"}</div>
              <div style={{fontSize:10,color:"#888",marginTop:2}}>Est. 1RM (lbs)</div>
              {prev&&prev.oneRM>0&&<div style={{fontSize:10,color:latest.oneRM>prev.oneRM?"#1E6B3A":"#E24B4A",marginTop:2}}>{latest.oneRM>prev.oneRM?"↑":"↓"} {Math.abs(latest.oneRM-prev.oneRM)} vs last</div>}
            </div>
            <div style={{background:"#f5f5f5",borderRadius:8,padding:"10px",textAlign:"center"}}>
              <div style={{fontSize:18,fontWeight:500,color:"#534AB7"}}>{latest.bestPeak?.toFixed(2)||"—"}</div>
              <div style={{fontSize:10,color:"#888",marginTop:2}}>Peak m/s</div>
              {prev&&prev.peak>0&&<div style={{fontSize:10,color:latest.bestPeak>prev.peak?"#1E6B3A":"#E24B4A",marginTop:2}}>{latest.bestPeak>prev.peak?"↑":"↓"} {Math.abs(Math.round((latest.bestPeak-prev.peak)*100)/100)} vs last</div>}
            </div>
            <div style={{background:"#f5f5f5",borderRadius:8,padding:"10px",textAlign:"center"}}>
              <div style={{fontSize:18,fontWeight:500,color:"#0F6E56"}}>{latest.score||"—"}</div>
              <div style={{fontSize:10,color:"#888",marginTop:2}}>Session score</div>
              <div style={{fontSize:10,color:latest.score>=8?"#1E6B3A":latest.score>=6?"#854F0B":"#E24B4A",marginTop:2}}>{latest.score>=8?"Great":latest.score>=6?"Good":"Tough session"}</div>
            </div>
          </div>

          {trendLine(latest.sets)}

          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:"#888",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.04em"}}>Velocity zones</div>
            {zones.map(z=>{
              const isHere=latest.bestPeak>=z.min&&latest.bestPeak<z.max;
              return(
                <div key={z.label} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:z.bg,borderRadius:8,marginBottom:5,border:isHere?"2px solid "+z.color:"0.5px solid transparent"}}>
                  <div style={{width:30,height:30,borderRadius:6,background:z.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:500,color:"#fff",flexShrink:0}}>{z.label.slice(0,3).toUpperCase()}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:500,color:z.color}}>{z.label} — {z.range}{isHere?" ← You are here":""}</div>
                    <div style={{fontSize:11,color:z.dark}}>{z.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:"#888",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.04em"}}>Sets & reps — tap a set to see each rep</div>
            {latest.sets.map((s,i)=>setRow(s,i,0,true))}
          </div>

          {latest.fatigue!=null&&(
            <div style={{background:"#f9f9f9",borderRadius:8,padding:"10px",border:"0.5px solid #e0e0e0"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:11,color:"#888"}}>Fatigue</span>
                <span style={{fontSize:11,fontWeight:500,color:latest.fatigue>15?"#E24B4A":"#1E6B3A"}}>{latest.fatigue?.toFixed(1)}% drop</span>
              </div>
              <div style={{background:"#e0e0e0",borderRadius:4,height:8,overflow:"hidden"}}>
                <div style={{width:Math.min(latest.fatigue||0,100)+"%",height:"100%",background:latest.fatigue>15?"#E24B4A":"#1E6B3A",borderRadius:4}}/>
              </div>
              <div style={{fontSize:10,color:"#888",marginTop:4}}>{latest.fatigue>15?"High fatigue — consider lighter next session":"Within normal range — good session"}</div>
            </div>
          )}
        </div>
      )}

      {/* Previous workouts */}
      {history.length>0&&(
        <div style={{background:"#fff",borderRadius:12,padding:"1rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
          <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:12}}>Previous workouts</div>
          <div style={{display:"flex",gap:6,marginBottom:12}}>
            {[{id:"this-week",label:"This week"},{id:"last-30days",label:"30 days"},{id:"all",label:"All time"}].map(f=>(
              <button key={f.id} onClick={()=>setFilter(f.id)} style={{flex:1,padding:"7px",borderRadius:8,border:"0.5px solid "+(filter===f.id?"#534AB7":"#e0e0e0"),background:filter===f.id?"#534AB7":"transparent",color:filter===f.id?"#fff":"#888",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>{f.label}</button>
            ))}
          </div>
          {history.map((s,i)=>{
            const isOpen=openSession===i;
            const color=zc(s.bestPeak||0);
            const bg=zb(s.bestPeak||0);
            const label=zl(s.bestPeak||0);
            return(
              <div key={i} style={{marginBottom:8,border:"0.5px solid #e0e0e0",borderRadius:10,overflow:"hidden"}}>
                <button onClick={()=>setOpenSession(o=>o===i?null:i)} style={{width:"100%",padding:"12px 14px",background:isOpen?bg:"#fff",border:"none",cursor:"pointer",fontFamily:"Georgia,serif",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{textAlign:"left"}}>
                    <div style={{fontSize:13,fontWeight:500,color:isOpen?color:"#1a1a1a"}}>{s.exercise}</div>
                    <div style={{fontSize:11,color:"#888"}}>{s.date} · {s.sets?.length||0} sets · {s.totalReps} reps · {s.maxLoad} lbs top</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{fontSize:11,padding:"3px 6px",borderRadius:6,background:"#f5f5f5",color:"#888"}}>{s.score}/10</div>
                    <div style={{fontSize:11,padding:"3px 8px",borderRadius:6,background:bg,color:color,fontWeight:500}}>{label}</div>
                    <div style={{fontSize:12,color:"#888"}}>{isOpen?"▲":"▼"}</div>
                  </div>
                </button>
                {isOpen&&(
                  <div style={{padding:"10px 12px"}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:12}}>
                      <div style={{background:"#f5f5f5",borderRadius:8,padding:"8px",textAlign:"center"}}><div style={{fontSize:15,fontWeight:500,color:"#1a1a1a"}}>{s.oneRM>0?s.oneRM+" lbs":"—"}</div><div style={{fontSize:9,color:"#888"}}>est. 1RM</div></div>
                      <div style={{background:"#f5f5f5",borderRadius:8,padding:"8px",textAlign:"center"}}><div style={{fontSize:15,fontWeight:500,color:"#534AB7"}}>{(s.bestPeak||0).toFixed(2)}</div><div style={{fontSize:9,color:"#888"}}>best peak</div></div>
                      <div style={{background:"#f5f5f5",borderRadius:8,padding:"8px",textAlign:"center"}}><div style={{fontSize:15,fontWeight:500,color:"#D4AF37"}}>{s.score}/10</div><div style={{fontSize:9,color:"#888"}}>session score</div></div>
                    </div>
                    {trendLine(s.sets)}
                    <div style={{fontSize:11,color:"#888",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.04em"}}>Velocity zones</div>
                    <div style={{marginBottom:12}}>
                      {zones.map(z=>{
                        const isHere=(s.bestPeak||0)>=z.min&&(s.bestPeak||0)<z.max;
                        return(
                          <div key={z.label} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:z.bg,borderRadius:8,marginBottom:4,border:isHere?"2px solid "+z.color:"0.5px solid transparent"}}>
                            <div style={{width:26,height:26,borderRadius:5,background:z.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:500,color:"#fff",flexShrink:0}}>{z.label.slice(0,3).toUpperCase()}</div>
                            <div><div style={{fontSize:11,fontWeight:500,color:z.color}}>{z.label} — {z.range}{isHere?" ← You were here":""}</div><div style={{fontSize:10,color:z.dark}}>{z.desc}</div></div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{fontSize:11,color:"#888",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.04em"}}>Sets & reps — tap a set to see each rep</div>
                    {(s.sets||[]).map((set,si)=>setRow(set,si,i,false))}
                    {s.fatigue!=null&&(
                      <div style={{marginTop:8,background:"#f9f9f9",borderRadius:8,padding:"8px",border:"0.5px solid #e0e0e0"}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:11,color:"#888"}}>Fatigue</span><span style={{fontSize:11,fontWeight:500,color:s.fatigue>15?"#E24B4A":"#1E6B3A"}}>{s.fatigue?.toFixed(1)}% drop</span></div>
                        <div style={{background:"#e0e0e0",borderRadius:4,height:6,overflow:"hidden"}}><div style={{width:Math.min(s.fatigue||0,100)+"%",height:"100%",background:s.fatigue>15?"#E24B4A":"#1E6B3A",borderRadius:4}}/></div>
                        <div style={{fontSize:10,color:"#888",marginTop:3}}>{s.fatigue>15?"High fatigue — consider lighter next session":"Within normal range — good session"}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>
      )}

      {data?.connected&&history.length>0&&(
        <div style={{background:"#fff",borderRadius:12,padding:"1rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
          <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:12}}>Exercise library</div>
          <div style={{fontSize:12,color:"#888",marginBottom:12}}>Tap any exercise to see your full history</div>
          {[...new Set(history.map(s=>s.exercise))].map(exName=>{
            const exSessions=history.filter(s=>s.exercise===exName);
            const bestPeak=Math.max(...exSessions.map(s=>s.bestPeak||0));
            const bestOneRM=Math.max(...exSessions.map(s=>s.oneRM||0));
            const isOpen=openSession===("ex-"+exName);
            const color=zc(bestPeak);
            const bg=zb(bestPeak);
            const label=zl(bestPeak);
            const maxLoad=Math.max(...exSessions.flatMap(s=>s.sets||[]).map(x=>x.load||0));
            return(
              <div key={exName} style={{marginBottom:8,border:"0.5px solid #e0e0e0",borderRadius:10,overflow:"hidden"}}>
                <button onClick={()=>setOpenSession(o=>o===("ex-"+exName)?null:("ex-"+exName))} style={{width:"100%",padding:"12px 14px",background:isOpen?bg:"#fff",border:"none",cursor:"pointer",fontFamily:"Georgia,serif",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{textAlign:"left"}}>
                    <div style={{fontSize:13,fontWeight:500,color:isOpen?color:"#1a1a1a"}}>{exName}</div>
                    <div style={{fontSize:11,color:"#888"}}>{exSessions.length} sessions · Best 1RM: {bestOneRM>0?bestOneRM+" lbs":"—"}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{fontSize:11,padding:"3px 8px",borderRadius:6,background:bg,color:color,fontWeight:500}}>{label}</div>
                    <div style={{fontSize:12,color:"#888"}}>{isOpen?"▲":"▼"}</div>
                  </div>
                </button>
                {isOpen&&(
                  <div style={{padding:"12px"}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:12}}>
                      <div style={{background:"#f5f5f5",borderRadius:8,padding:"8px",textAlign:"center"}}>
                        <div style={{fontSize:16,fontWeight:500,color:"#1a1a1a"}}>{bestOneRM>0?bestOneRM+" lbs":"—"}</div>
                        <div style={{fontSize:9,color:"#888"}}>best 1RM</div>
                      </div>
                      <div style={{background:"#f5f5f5",borderRadius:8,padding:"8px",textAlign:"center"}}>
                        <div style={{fontSize:16,fontWeight:500,color:"#534AB7"}}>{bestPeak.toFixed(2)}</div>
                        <div style={{fontSize:9,color:"#888"}}>best peak m/s</div>
                      </div>
                      <div style={{background:"#f5f5f5",borderRadius:8,padding:"8px",textAlign:"center"}}>
                        <div style={{fontSize:16,fontWeight:500,color:"#0F6E56"}}>{exSessions.length}</div>
                        <div style={{fontSize:9,color:"#888"}}>sessions</div>
                      </div>
                    </div>
                    <div style={{fontSize:11,color:"#888",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.04em"}}>Load progression</div>
                    <div style={{display:"flex",alignItems:"flex-end",gap:4,height:50,marginBottom:12}}>
                      {exSessions.slice().reverse().map((s,i)=>{
                        const topLoad=Math.max(...(s.sets||[]).map(x=>x.load||0));
                        const h=maxLoad>0?Math.round((topLoad/maxLoad)*46):4;
                        const bp=s.bestPeak||0;
                        return(
                          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",gap:2}}>
                            <div style={{width:"100%",background:zb(bp),borderRadius:"3px 3px 0 0",height:h+"px",border:"0.5px solid "+zbd(bp)}}/>
                            <div style={{fontSize:9,color:"#888"}}>{s.date?.slice(5)}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{fontSize:11,color:"#888",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.04em"}}>Session history</div>
                    {exSessions.map((s,i)=>(
                      <div key={i} style={{display:"grid",gridTemplateColumns:"55px 60px 1fr 1fr 1fr",gap:5,alignItems:"center",padding:"7px 10px",background:"#f9f9f9",borderRadius:8,marginBottom:4,borderLeft:"3px solid "+zbd(s.bestPeak||0)}}>
                        <div style={{fontSize:11,color:"#888"}}>{s.date?.slice(5)}</div>
                        <div style={{fontSize:11,fontWeight:500,color:"#1a1a1a"}}>{Math.max(...(s.sets||[]).map(x=>x.load||0))} lbs</div>
                        <div style={{textAlign:"center"}}><div style={{fontSize:12,fontWeight:500,color:"#534AB7"}}>{(s.bestPeak||0).toFixed(2)}</div><div style={{fontSize:9,color:"#888"}}>peak</div></div>
                        <div style={{textAlign:"center"}}><div style={{fontSize:12,fontWeight:500,color:"#1a1a1a"}}>{s.totalReps}</div><div style={{fontSize:9,color:"#888"}}>reps</div></div>
                        <div style={{textAlign:"center"}}><div style={{fontSize:12,fontWeight:500,color:"#1a1a1a"}}>{s.oneRM>0?s.oneRM:"—"}</div><div style={{fontSize:9,color:"#888"}}>1RM</div></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
function PolarData({token, refreshToken, athleteId}){
  const[data,setData]=useState(null);
  useEffect(()=>{
    const params=new URLSearchParams({token});
    if(refreshToken)params.append("refreshToken",refreshToken);
    if(athleteId)params.append("athleteId",athleteId);
    fetch("/api/polar?"+params.toString()).then(r=>r.json()).then(setData);
  },[token]);
  if(!data)return<div style={{fontSize:12,color:"#aaa",textAlign:"center",padding:"8px 0"}}>Loading Polar data...</div>;
  if(data.tokenExpired)return(
    <div style={{textAlign:"center",padding:"1rem 0"}}>
      <div style={{fontSize:28,marginBottom:8}}>🔄</div>
      <div style={{fontSize:14,fontWeight:500,color:"#E8001E",marginBottom:4}}>Polar session expired</div>
      <div style={{fontSize:12,color:"#888",marginBottom:12}}>Your Polar token expired. Reconnect to restore your data.</div>
      <button onClick={()=>{
        const url="https://flow.polar.com/oauth2/authorization?response_type=code&client_id=d2759b37-57d2-4f8b-8d4a-b12a13288f4b&redirect_uri=https://tfcollegegroup.com/callback&scope=accesslink.read_all&state="+athleteId;
        window.location.href=url;
      }} style={{width:"100%",padding:"12px",borderRadius:8,border:"none",background:"#E8001E",color:"#fff",fontSize:14,fontWeight:500,cursor:"pointer",fontFamily:"Georgia,serif"}}>
        Reconnect Polar →
      </button>
      <div style={{fontSize:11,color:"#666",marginTop:8}}>Use Safari (not home screen) if the login page doesn't appear.</div>
    </div>
  );
  if(data.noData)return(
    <div style={{textAlign:"center",padding:"1rem 0"}}>
      <div style={{fontSize:28,marginBottom:8}}>✓</div>
      <div style={{fontSize:14,fontWeight:500,color:"#58B368",marginBottom:4}}>Polar Connected</div>
      <div style={{fontSize:12,color:"#888"}}>No recent workout data found. Wear your Polar during class and sync it after — data will appear here.</div>
    </div>
  );
  if(data.error)return(
    <div style={{textAlign:"center",padding:"1rem 0"}}>
      <div style={{fontSize:28,marginBottom:8}}>⚡</div>
      <div style={{fontSize:14,fontWeight:500,color:"#58B368",marginBottom:4}}>Polar Connected</div>
      <div style={{fontSize:12,color:"#888"}}>Couldn't load latest data. Make sure you synced your Polar after your last session.</div>
    </div>
  );
  return(
    <div>
      <div style={{fontSize:11,color:"#58B368",marginBottom:8}}>✓ Connected · Last session: {data.date||"—"}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {[
          {label:"Avg HR",val:data.avgHr?data.avgHr+" bpm":"—"},
          {label:"Max HR",val:data.maxHr?data.maxHr+" bpm":"—"},
          {label:"Calories",val:data.calories?data.calories+" kcal":"—"},
          {label:"Duration",val:data.duration||"—"},
        ].map(s=>(
          <div key={s.label} style={{background:"#f5f5f5",borderRadius:8,padding:"10px",textAlign:"center"}}>
            <div style={{fontSize:16,fontWeight:500,color:"#1a1a1a"}}>{s.val}</div>
            <div style={{fontSize:11,color:"#888",marginTop:2}}>{s.label}</div>
          </div>
               ))}
      </div>
      {(data.zone1||data.zone2||data.zone3||data.zone4||data.zone5)&&(
        <div style={{background:"#f9f9f9",borderRadius:8,padding:"10px",border:"0.5px solid #e0e0e0",marginTop:10}}>
          <div style={{fontSize:11,color:"#888",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.04em"}}>Heart rate zones</div>
          {[
            {z:"Z1",val:data.zone1,color:"#5BBFEA"},
            {z:"Z2",val:data.zone2,color:"#1E6B3A"},
            {z:"Z3",val:data.zone3,color:"#D4AF37"},
            {z:"Z4",val:data.zone4,color:"#C0392B"},
            {z:"Z5",val:data.zone5,color:"#5B2D8E"},
          ].map(z=>{
            const total=(data.zone1||0)+(data.zone2||0)+(data.zone3||0)+(data.zone4||0)+(data.zone5||0);
            const pct=total>0?Math.round((z.val||0)/total*100):0;
            const mins=z.val?Math.round(z.val/60)+"m":"—";
            return(
              <div key={z.z} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <div style={{fontSize:11,color:"#888",width:24}}>{z.z}</div>
                <div style={{flex:1,background:"#e0e0e0",borderRadius:4,height:8,overflow:"hidden"}}>
                  <div style={{width:pct+"%",height:"100%",background:z.color,borderRadius:4}}/>
                </div>
                <div style={{fontSize:11,color:"#888",width:28,textAlign:"right"}}>{mins}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
function CountdownPicker({onTimeout}){
  const[timeLeft,setTimeLeft]=useState(10);
  useEffect(()=>{
    if(timeLeft<=0){onTimeout();return;}
    const t=setTimeout(()=>setTimeLeft(p=>p-1),1000);
    return()=>clearTimeout(t);
  },[timeLeft,onTimeout]);
  return(
    <div style={{background:"#C0392B",borderRadius:12,padding:"1rem",marginBottom:12,textAlign:"center"}}>
      <div style={{fontSize:11,color:"#fff",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Your turn to pick!</div>
      <div style={{fontSize:48,fontWeight:700,color:timeLeft<=3?"#ffcccc":"#fff",lineHeight:1}}>{timeLeft}</div>
      <div style={{fontSize:12,color:"rgba(255,255,255,0.7)",marginTop:4}}>{timeLeft<=3?"Picking automatically...":"seconds to pick"}</div>
    </div>
  );
}

function PrayerWall({athleteId, athleteName}){
  const[prayers,setPrayers]=useState([]);
  const[text,setText]=useState("");
  const[anon,setAnon]=useState(false);
  const[submitting,setSubmitting]=useState(false);
  const[submitted,setSubmitted]=useState(false);
  useEffect(()=>{
    supabase.from("inbox").select("*").eq("type","prayer").order("created_at",{ascending:false}).then(({data})=>setPrayers(data||[])).catch(()=>setPrayers([]));
  },[]);
  const submit=async()=>{
    if(!text.trim())return;
    setSubmitting(true);
    try{
      await supabase.from("inbox").insert({athlete_id:athleteId,type:"prayer",message:text,anonymous:anon});
      const{data}=await supabase.from("inbox").select("*").eq("type","prayer").order("created_at",{ascending:false});
      setPrayers(data||[]);
    }catch(e){}
    setText("");setSubmitting(false);setSubmitted(true);setTimeout(()=>setSubmitted(false),3000);
  };
  const PUR="#534AB7",GREEN="#1E6B3A",BG="#0f0f0f";
  return(
    <div>
      <div style={{background:BG,borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #333"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#fff",marginBottom:4}}>🙏 Prayer Wall</div>
        <div style={{fontSize:12,color:"#888",marginBottom:12}}>Submit a prayer request. Coach Ant and the group are praying for you.</div>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="What can the group pray for you about?" style={{width:"100%",minHeight:80,padding:"10px",borderRadius:8,border:"0.5px solid #333",background:"#141414",color:"#fff",fontSize:13,fontFamily:"Georgia,serif",resize:"none",boxSizing:"border-box",marginBottom:10}}/>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <button onClick={()=>setAnon(!anon)} style={{display:"flex",alignItems:"center",gap:6,background:"transparent",border:"none",cursor:"pointer",padding:0}}>
            <div style={{width:18,height:18,borderRadius:4,border:"1.5px solid "+(anon?PUR:"#555"),background:anon?PUR:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {anon&&<span style={{color:"#fff",fontSize:11}}>✓</span>}
            </div>
            <span style={{fontSize:12,color:"#888"}}>Submit anonymously</span>
          </button>
        </div>
        <button onClick={submit} disabled={submitting||!text.trim()} style={{width:"100%",padding:"12px",borderRadius:8,border:"none",background:text.trim()?PUR:"#333",color:text.trim()?"#fff":"#666",fontSize:14,fontWeight:500,cursor:"pointer",fontFamily:"Georgia,serif"}}>
          {submitted?"✓ Submitted — we're praying for you":submitting?"Submitting...":"Submit prayer request →"}
        </button>
      </div>
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Group prayer requests</div>
        {prayers.length===0&&<div style={{fontSize:12,color:"#888",textAlign:"center",padding:"1rem 0"}}>No prayer requests yet. Be the first to share.</div>}
        {prayers.map((p,i)=>(
          <div key={i} style={{padding:"10px 0",borderBottom:i<prayers.length-1?"0.5px solid #f0f0f0":"none"}}>
            <div style={{fontSize:11,color:PUR,fontWeight:500,marginBottom:3}}>{p.anonymous?"Anonymous":athleteName||"Athlete"}</div>
            <div style={{fontSize:13,color:"#1a1a1a",lineHeight:1.6}}>{p.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AthleteLeaderboard({athleteId}){
  const[lb,setLb]=useState([]);
  useEffect(()=>{
    supabase.from("leaderboard").select("*,athletes(name,photo_url,role)").order("early_count",{ascending:false}).then(({data})=>setLb(data||[]));
  },[]);
  const myRank=lb.findIndex(r=>r.athlete_id===athleteId)+1;
  const myRow=lb.find(r=>r.athlete_id===athleteId);
  const GOLD="#D4AF37",GREEN="#1E6B3A",RED="#C0392B",STEEL="#708090",BG="#0f0f0f";
  return(
    <div>
      {myRow&&(
        <div style={{background:BG,borderRadius:12,padding:"1.25rem",marginBottom:12,border:"2px solid "+GOLD}}>
          <div style={{fontSize:11,color:GOLD,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>Your rank</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:28,fontWeight:600,color:GOLD}}>#{myRank}</div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:13,color:"#fff"}}>{myRow.early_count||0} early · {myRow.late_count||0} late</div>
              <div style={{fontSize:12,color:"#888"}}>🔥 {myRow.current_streak||0} streak · best {myRow.best_streak||0}</div>
            </div>
          </div>
        </div>
      )}
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Early arrival leaderboard</div>
        {lb.map((r,i)=>{
          const isMe=r.athlete_id===athleteId;
          return(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:isMe?"10px 8px":"10px 0",borderBottom:i<lb.length-1?"0.5px solid #f0f0f0":"none",background:isMe?"#fffbe6":"transparent",borderRadius:isMe?8:0}}>
              <div style={{width:28,fontSize:14,fontWeight:600,color:i===0?GOLD:i===1?"#999":i===2?"#CD7F32":"#888",textAlign:"center"}}>
                {i===0?"🥇":i===1?"🥈":i===2?"🥉":"#"+(i+1)}
              </div>
              <div style={{width:32,height:32,borderRadius:"50%",background:r.athletes?.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:500,color:"#fff",flexShrink:0,overflow:"hidden"}}>
                {r.athletes?.photo_url?<img src={r.athletes.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(r.athletes?.name||"?")[0]}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:isMe?600:500,color:"#1a1a1a"}}>{r.athletes?.name||"—"}{isMe?" (you)":""}</div>
                <div style={{fontSize:11,color:"#888"}}>🔥 {r.current_streak||0} streak</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:14,fontWeight:600,color:GREEN}}>{r.early_count||0}</div>
                <div style={{fontSize:11,color:"#888"}}>early</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BraceletWall({athleteBracelet}){
  const BRACELETS_LIST=[
    {ref:"Prov 3:5-6",color:"Cobalt Blue",hex:"#1A4F8A",text:"Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight."},
    {ref:"Phil 4:13",color:"Forest Green",hex:"#0F6E56",text:"I can do all this through him who gives me strength."},
    {ref:"Josh 1:9",color:"Crimson Red",hex:"#C0392B",text:"Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go."},
    {ref:"Isa 40:31",color:"Royal Purple",hex:"#534AB7",text:"Those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint."},
    {ref:"Rom 8:28",color:"Burnt Orange",hex:"#D4530B",text:"And we know that in all things God works for the good of those who love him, who have been called according to his purpose."},
    {ref:"Jer 29:11",color:"Antique Gold",hex:"#D4AF37",text:"For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future."},
    {ref:"2 Tim 1:7",color:"Steel Blue",hex:"#708090",text:"For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline."},
    {ref:"Matt 6:33",color:"Olive Green",hex:"#6B7A2A",text:"But seek first his kingdom and his righteousness, and all these things will be given to you as well."},
    {ref:"Ps 46:10",color:"Midnight Navy",hex:"#1B2A4A",text:"He says, Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth."},
    {ref:"Gal 6:9",color:"Copper Brown",hex:"#7B4F2E",text:"Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up."},
    {ref:"Prov 27:17",color:"Charcoal",hex:"#3D3D3D",text:"As iron sharpens iron, so one person sharpens another."},
    {ref:"Mic 6:8",color:"Ivory White",hex:"#C8C0A8",text:"He has shown you, O mortal, what is good. And what does the Lord require of you? To act justly and to love mercy and to walk humbly with your God."},
  ];
  return(
    <div>
      <div style={{background:"#0f0f0f",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #333"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#fff",marginBottom:4}}>📿 Bracelet Wall</div>
        <div style={{fontSize:12,color:"#888"}}>All 12 bracelets — one scripture for the group.</div>
      </div>
      {BRACELETS_LIST.map((b,i)=>{
        const isMe=athleteBracelet===b.ref;
        return(
          <div key={i} style={{background:"#fff",borderRadius:12,padding:"1rem",marginBottom:8,border:"0.5px solid "+(isMe?b.hex+"88":"#e0e0e0"),borderLeft:"4px solid "+b.hex}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:b.hex}}/>
                <span style={{fontSize:12,fontWeight:600,color:b.hex}}>{b.color}</span>
                {isMe&&<span style={{fontSize:10,background:b.hex,color:"#fff",padding:"1px 6px",borderRadius:4}}>yours</span>}
              </div>
              <span style={{fontSize:11,color:"#888"}}>{b.ref}</span>
            </div>
            <div style={{fontSize:13,color:"#1a1a1a",fontStyle:"italic",lineHeight:1.6}}>"{b.text}"</div>
          </div>
        );
      })}
    </div>
  );
}

function MindsetNotes({athleteId, athlete}){
  const WEEKS=[
    {week:1,title:"Who Are You Now?",scripture:"2 Cor 5:17",takeaway:"Your past is not your ceiling.",color:"#D4AF37"},
    {week:2,title:"Testimony Monday",scripture:"Rev 12:11",takeaway:"Your story has power.",color:"#D4AF37"},
    {week:3,title:"Process Over Outcome",scripture:"Gal 6:9",takeaway:"Fall in love with the work.",color:"#534AB7"},
    {week:4,title:"Testimony Monday",scripture:"Psalm 34:18",takeaway:"God doesn't waste pain.",color:"#D4AF37"},
    {week:5,title:"Confidence vs Belief",scripture:"Phil 4:13",takeaway:"Confidence runs out. Belief doesn't.",color:"#534AB7"},
    {week:6,title:"Testimony Monday",scripture:"Isaiah 43:2",takeaway:"You will not be swept away.",color:"#534AB7"},
    {week:7,title:"Fear vs Faith",scripture:"Joshua 1:9",takeaway:"Courage is a decision before a feeling.",color:"#534AB7"},
    {week:8,title:"Testimony Monday",scripture:"Rom 8:28",takeaway:"Nothing you've been through is wasted.",color:"#534AB7"},
    {week:9,title:"Mental Side of Adversity",scripture:"James 1:2-4",takeaway:"Adversity is training. Treat it like it.",color:"#1E6B3A"},
    {week:10,title:"Testimony Monday",scripture:"2 Tim 1:7",takeaway:"God did not give you a spirit of fear.",color:"#1E6B3A"},
    {week:11,title:"Who Are You When Nobody's Watching?",scripture:"Prov 11:3",takeaway:"Private character is real character.",color:"#1E6B3A"},
    {week:12,title:"Who Did You Become?",scripture:"Micah 6:8",takeaway:"Act justly. Love mercy. Walk humbly.",color:"#D4AF37"},
  ];
  const[saving,setSaving]=useState(null);
  const saveNote=async(week,val)=>{
    setSaving(week);
    await supabase.from("athletes").update({[`mindset_note_${week}`]:val}).eq("id",athleteId);
    setSaving(null);
  };
  return(
    <div>
      <div style={{background:"#0f0f0f",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #333"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#fff",marginBottom:4}}>Mindset Monday — Your Notes</div>
        <div style={{fontSize:12,color:"#888"}}>Write your takeaway from each week. Only you can see these.</div>
      </div>
      {WEEKS.map((w,i)=>(
        <div key={i} style={{background:"#fff",borderRadius:12,padding:"1rem",marginBottom:8,border:"0.5px solid #e0e0e0",borderLeft:"4px solid "+w.color}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
            <div style={{fontSize:11,color:w.color,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em"}}>Week {w.week}</div>
            <div style={{fontSize:11,color:"#888"}}>{w.scripture}</div>
          </div>
          <div style={{fontSize:13,fontWeight:500,color:"#1a1a1a",marginBottom:2}}>{w.title}</div>
          <div style={{fontSize:12,color:"#888",fontStyle:"italic",marginBottom:8}}>"{w.takeaway}"</div>
          <textarea defaultValue={athlete?.[`mindset_note_${w.week}`]||""} onBlur={e=>saveNote(w.week,e.target.value)} placeholder="Your personal takeaway..." style={{width:"100%",minHeight:55,padding:"8px",borderRadius:8,border:"0.5px solid #e0e0e0",fontSize:12,fontFamily:"Georgia,serif",resize:"none",boxSizing:"border-box",background:"#fafafa",color:"#1a1a1a"}}/>
          {saving===w.week&&<div style={{fontSize:11,color:"#1E6B3A",marginTop:3}}>Saving...</div>}
        </div>
      ))}
    </div>
  );
}


// ── Accountability Partner ──────────────────────────────────────
function AccountabilityPartner({athleteId, athletes}){
  const myPartner=athletes.find(a=>a.accountability_partner===athleteId||athleteId===a.accountability_partner);
  const partner=athletes.find(a=>a.id===myPartner?.accountability_partner||a.accountability_partner===athleteId);
  const[lb,setLb]=useState(null);
  useEffect(()=>{
    if(partner){
      supabase.from("leaderboard").select("*").eq("athlete_id",partner.id).single().then(({data})=>setLb(data));
    }
  },[partner]);
  const GOLD="#D4AF37",GREEN="#1E6B3A",RED="#C0392B",STEEL="#708090",BG="#0f0f0f";
  if(!partner) return(
    <div style={{background:"#fff",borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid #e0e0e0"}}>
      <div style={{fontSize:32,marginBottom:12}}>🤝</div>
      <div style={{fontSize:15,fontWeight:500,color:"#1a1a1a",marginBottom:8}}>No partner yet</div>
      <div style={{fontSize:13,color:"#888"}}>Coach Ant will assign your accountability partner. Check back soon!</div>
    </div>
  );
  return(
    <div>
      <div style={{background:BG,borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #333"}}>
        <div style={{fontSize:11,color:GREEN,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Your accountability partner</div>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:56,height:56,borderRadius:"50%",background:partner.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:500,color:"#fff",flexShrink:0,overflow:"hidden"}}>
            {partner.photo_url?<img src={partner.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:partner.name[0]}
          </div>
          <div>
            <div style={{fontSize:18,fontWeight:500,color:"#fff"}}>{partner.name}</div>
            <div style={{fontSize:12,color:"#888"}}>{partner.sport} · {partner.role==="forge"?"The Forge":"The Iron"}</div>
          </div>
        </div>
      </div>
      {lb&&(
        <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0"}}>
          <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Their stats</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {[{label:"Early",val:lb.early_count||0,color:GREEN},{label:"Streak 🔥",val:lb.current_streak||0,color:GOLD},{label:"Anvils",val:lb.anvil_count||0,color:GOLD}].map(s=>(
              <div key={s.label} style={{background:"#f9f9f9",borderRadius:10,padding:"12px",textAlign:"center",border:"0.5px solid #e0e0e0"}}>
                <div style={{fontSize:20,fontWeight:600,color:s.color}}>{s.val}</div>
                <div style={{fontSize:11,color:"#888",marginTop:2}}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:12,padding:"10px 14px",background:"#f9f9f9",borderRadius:10,border:"0.5px solid #e0e0e0"}}>
            <div style={{fontSize:12,color:"#888",fontStyle:"italic"}}>"Iron sharpens iron. Hold each other to the standard."</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Body Weight Tracker ─────────────────────────────────────────
function WeightTracker({athleteId}){
  const[entries,setEntries]=useState([]);
  const[weight,setWeight]=useState("");
  const[goalWeight,setGoalWeight]=useState("");
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);
  const[error,setError]=useState("");
  const[showGoalInput,setShowGoalInput]=useState(false);
  const GREEN="#1E6B3A",RED="#C0392B",PUR="#534AB7",GOLD="#D4AF37";

  const loadEntries=async()=>{
    const{data,error:err}=await supabase.from("weight_log").select("*").eq("athlete_id",athleteId).order("date",{ascending:true});
    if(err){setError("Could not load: "+err.message);return;}
    setEntries(data||[]);
    // Load goal weight from localStorage
    const saved=localStorage.getItem("goal_weight_"+athleteId);
    if(saved)setGoalWeight(saved);
  };

  useEffect(()=>{loadEntries();},[]);

  const save=async()=>{
    if(!weight)return;
    setSaving(true);setError("");
    const today=new Date().toISOString().split("T")[0];
    const existing=entries.find(e=>e.date===today);
    if(existing){
      const{error:err}=await supabase.from("weight_log").update({weight:parseFloat(weight)}).eq("id",existing.id);
      if(err){setError("Save failed: "+err.message);setSaving(false);return;}
    }else{
      const{error:err}=await supabase.from("weight_log").insert({athlete_id:athleteId,date:today,weight:parseFloat(weight)});
      if(err){setError("Save failed: "+err.message);setSaving(false);return;}
    }
    await loadEntries();
    setWeight("");setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),3000);
  };

  const first=entries[0]?.weight;
  const latest=entries[entries.length-1]?.weight;
  const diff=first&&latest?parseFloat((latest-first).toFixed(1)):null;
  const goal=parseFloat(goalWeight)||null;
  const goalDiff=goal&&latest?parseFloat((goal-latest).toFixed(1)):null;
  const goalPct=goal&&first?Math.min(100,Math.max(0,Math.round(Math.abs((latest-first)/(goal-first))*100))):0;

  // Weekly averages
  const byWeek=[];
  entries.forEach(e=>{
    const d=new Date(e.date);
    const weekStart=new Date(d);
    weekStart.setDate(d.getDate()-d.getDay());
    const key=weekStart.toISOString().split("T")[0];
    const ex=byWeek.find(w=>w.key===key);
    if(ex){ex.entries.push(e);ex.avg=parseFloat((ex.entries.reduce((s,x)=>s+x.weight,0)/ex.entries.length).toFixed(1));}
    else byWeek.push({key,label:"Week of "+weekStart.toLocaleDateString("en-US",{month:"short",day:"numeric"}),entries:[e],avg:e.weight});
  });

  // Mini trend chart data
  const chartData=entries.slice(-10);
  const chartMin=chartData.length?Math.min(...chartData.map(e=>e.weight))-2:0;
  const chartMax=chartData.length?Math.max(...chartData.map(e=>e.weight))+2:100;
  const chartH=80;
  const chartW=100;
  const pts=chartData.map((e,i)=>{
    const x=(i/(Math.max(chartData.length-1,1)))*chartW;
    const y=chartH-((e.weight-chartMin)/(chartMax-chartMin))*chartH;
    return`${x},${y}`;
  }).join(" ");

  return(
    <div>
      {/* Hero log card — dark */}
      <div style={{background:"#0f0f0f",borderRadius:16,padding:"1.5rem",marginBottom:12,border:"1px solid #222",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GREEN+","+PUR+")"}}/>
        <div style={{fontSize:11,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>⚖️ Weight Tracker</div>

        {/* Big stats */}
        {entries.length>0&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
            {[{label:"Start",val:first,sub:"lbs"},{label:"Now",val:latest,sub:"lbs"},{label:"Change",val:diff===null?"—":(diff>0?"+":"")+diff,sub:"lbs",color:diff===null?"#555":diff<0?GREEN:diff>0?RED:"#fff"}].map(s=>(
              <div key={s.label} style={{textAlign:"center"}}>
                <div style={{fontSize:26,fontWeight:700,color:s.color||"#fff",lineHeight:1}}>{s.val}</div>
                <div style={{fontSize:10,color:"#555",marginTop:3}}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Trend chart — dark */}
        {chartData.length>1&&(
          <div style={{marginBottom:20}}>
            <svg viewBox={`-4 -4 ${chartW+8} ${chartH+8}`} style={{width:"100%",height:100,overflow:"visible"}}>
              <defs>
                <linearGradient id="wGradDark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GREEN} stopOpacity="0.4"/>
                  <stop offset="100%" stopColor={GREEN} stopOpacity="0"/>
                </linearGradient>
              </defs>
              <polygon points={`0,${chartH} ${pts} ${chartW},${chartH}`} fill="url(#wGradDark)"/>
              <polyline points={pts} fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              {chartData.map((e,i)=>{
                const x=(i/(Math.max(chartData.length-1,1)))*chartW;
                const y=chartH-((e.weight-chartMin)/(chartMax-chartMin))*chartH;
                const isLast=i===chartData.length-1;
                return(
                  <g key={i}>
                    <circle cx={x} cy={y} r={isLast?4:2.5} fill={isLast?"#fff":GREEN} stroke={isLast?GREEN:"none"} strokeWidth="2"/>
                    {isLast&&<text x={x} y={y-8} textAnchor="middle" fontSize="9" fill="#fff" fontFamily="Georgia">{e.weight}</text>}
                  </g>
                );
              })}
              {goal&&<line x1="0" y1={chartH-((goal-chartMin)/(chartMax-chartMin))*chartH} x2={chartW} y2={chartH-((goal-chartMin)/(chartMax-chartMin))*chartH} stroke={GOLD} strokeWidth="1.5" strokeDasharray="5,4"/>}
              {goal&&<text x={chartW+2} y={chartH-((goal-chartMin)/(chartMax-chartMin))*chartH+3} fontSize="8" fill={GOLD} fontFamily="Georgia">goal</text>}
            </svg>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
              <div style={{fontSize:9,color:"#444"}}>{chartData[0]?.date}</div>
              <div style={{fontSize:9,color:"#444"}}>{chartData[chartData.length-1]?.date}</div>
            </div>
          </div>
        )}

        {/* Log input */}
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:8}}>
          <input type="text" inputMode="decimal" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="Enter lbs..." style={{flex:1,padding:"14px",borderRadius:10,border:"1px solid #333",fontSize:18,fontFamily:"Georgia,serif",background:"#1a1a1a",color:"#fff",textAlign:"center"}}/>
          <button onClick={save} disabled={!weight||saving} style={{padding:"14px 20px",borderRadius:10,border:"none",background:weight?"linear-gradient(135deg,"+GREEN+",#0d4a29)":"#222",color:weight?"#fff":"#444",fontSize:14,fontWeight:600,cursor:weight?"pointer":"not-allowed",fontFamily:"Georgia,serif",minWidth:80}}>
            {saved?"✓":saving?"...":"Save"}
          </button>
        </div>
        {error&&<div style={{fontSize:12,color:RED}}>{error}</div>}
        <div style={{fontSize:10,color:"#444",textAlign:"center"}}>Private — only you can see this</div>
      </div>

      {/* Goal weight card */}
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:goal?10:0}}>
          <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a"}}>🎯 Goal weight</div>
          <button onClick={()=>setShowGoalInput(!showGoalInput)} style={{fontSize:12,color:PUR,background:"none",border:"none",cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:500}}>{goal?"Edit":"Set goal →"}</button>
        </div>
        {showGoalInput&&(
          <div style={{display:"flex",gap:8,marginBottom:10,marginTop:8}}>
            <input type="number" value={goalWeight} onChange={e=>setGoalWeight(e.target.value)} placeholder="Target lbs" style={{flex:1,padding:"10px",borderRadius:8,border:"0.5px solid #e0e0e0",fontSize:14,fontFamily:"Georgia,serif",background:"#fafafa",textAlign:"center"}}/>
            <button onClick={()=>{localStorage.setItem("goal_weight_"+athleteId,goalWeight);setShowGoalInput(false);}} style={{padding:"10px 16px",borderRadius:8,border:"none",background:PUR,color:"#fff",fontSize:13,cursor:"pointer",fontFamily:"Georgia,serif"}}>Save</button>
          </div>
        )}
        {goal&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{fontSize:13,color:"#888"}}>{latest} → {goal} lbs</div>
              <div style={{fontSize:13,fontWeight:700,color:goalDiff!==null&&goalDiff<=0?GREEN:PUR}}>{goalDiff!==null?(goalDiff<=0?"✓ Goal reached!":(goalDiff>0?"+":"")+goalDiff+" lbs to go"):"—"}</div>
            </div>
            <div style={{height:8,background:"#f0f0f0",borderRadius:4,overflow:"hidden",marginBottom:4}}>
              <div style={{height:"100%",width:goalPct+"%",background:goalPct>=100?"linear-gradient(90deg,"+GREEN+",#0d4a29)":"linear-gradient(90deg,"+PUR+",#3d35a0)",borderRadius:4,transition:"width 0.5s"}}/>
            </div>
            <div style={{fontSize:11,color:"#aaa"}}>{goalPct}% of the way there</div>
          </div>
        )}
        {!goal&&!showGoalInput&&<div style={{fontSize:12,color:"#aaa",marginTop:4}}>Set a target weight to track your progress.</div>}
      </div>

      {/* Weekly log */}
      {byWeek.length>0&&(
        <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0"}}>
          <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Weekly log</div>
          {[...byWeek].reverse().map((week,wi)=>{
            const prevWeek=[...byWeek].reverse()[wi+1];
            const weekDiff=prevWeek?parseFloat((week.avg-prevWeek.avg).toFixed(1)):null;
            return(
              <div key={wi} style={{marginBottom:12,paddingBottom:12,borderBottom:wi<byWeek.length-1?"0.5px solid #f0f0f0":"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#1a1a1a"}}>{week.label}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>{week.avg} lbs avg</span>
                    {weekDiff!==null&&(
                      <span style={{fontSize:11,fontWeight:600,padding:"1px 7px",borderRadius:6,background:weekDiff<0?"#EAF3DE":weekDiff>0?"#FCEBEB":"#f5f5f5",color:weekDiff<0?GREEN:weekDiff>0?RED:"#888"}}>
                        {weekDiff>0?"↑ +":weekDiff<0?"↓ ":"→ "}{Math.abs(weekDiff)}
                      </span>
                    )}
                  </div>
                </div>
                {week.entries.map((e,ei)=>(
                  <div key={ei} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",background:"#f9f9f9",borderRadius:8,marginBottom:4}}>
                    <div style={{fontSize:12,color:"#888"}}>{new Date(e.date).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</div>
                    <div style={{fontSize:14,fontWeight:600,color:"#1a1a1a"}}>{e.weight} lbs</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {entries.length===0&&!saving&&(
        <div style={{background:"#0f0f0f",borderRadius:12,padding:"2.5rem",textAlign:"center",border:"1px solid #222"}}>
          <div style={{fontSize:40,marginBottom:12}}>⚖️</div>
          <div style={{fontSize:14,fontWeight:500,color:"#fff",marginBottom:6}}>Start tracking your weight</div>
          <div style={{fontSize:12,color:"#555"}}>Log your first entry above and watch your progress build week by week.</div>
        </div>
      )}
    </div>
  );
}

// ── Goals Countdown ─────────────────────────────────────────────
function GoalsCountdown({athlete}){
  const GREEN="#1E6B3A",PUR="#534AB7",GOLD="#D4AF37",BG="#0f0f0f";
  const[deadline,setDeadline]=useState(athlete?.goal_deadline||"");
  const[saving,setSaving]=useState(false);
  const daysLeft=deadline?Math.max(0,Math.ceil((new Date(deadline)-new Date())/(1000*60*60*24))):null;
  const save=async()=>{
    setSaving(true);
    await supabase.from("athletes").update({goal_deadline:deadline}).eq("id",athlete.id).catch(()=>{});
    setSaving(false);
  };
  return(
    <div>
      {daysLeft!==null&&(
        <div style={{background:BG,borderRadius:12,padding:"2rem",textAlign:"center",marginBottom:12,border:"2px solid "+GOLD}}>
          <div style={{fontSize:64,fontWeight:700,color:GOLD,lineHeight:1}}>{daysLeft}</div>
          <div style={{fontSize:14,color:"#fff",marginTop:4}}>days until your goal deadline</div>
          <div style={{fontSize:11,color:"#555",marginTop:4}}>{deadline}</div>
        </div>
      )}
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Athletic goal</div>
        <div style={{fontSize:13,color:"#555",fontStyle:"italic",lineHeight:1.6,marginBottom:12}}>{athlete?.athletic_goal||"No goal set yet — go to My Profile to set one."}</div>
        <div style={{fontSize:11,color:"#888",marginBottom:6}}>Goal deadline</div>
        <input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} style={{width:"100%",padding:"10px",borderRadius:8,border:"0.5px solid #e0e0e0",fontSize:13,fontFamily:"Georgia,serif",background:"#fafafa",boxSizing:"border-box",marginBottom:10}}/>
        <button onClick={save} disabled={!deadline||saving} style={{width:"100%",padding:"10px",borderRadius:8,border:"none",background:GOLD,color:"#1a1a1a",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"Georgia,serif"}}>
          {saving?"Saving...":"Set deadline →"}
        </button>
      </div>
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:8}}>Character goal</div>
        <div style={{fontSize:13,color:"#555",fontStyle:"italic",lineHeight:1.6}}>{athlete?.character_goal||"No goal set yet."}</div>
      </div>
    </div>
  );
}

// ── Verse of the Day ────────────────────────────────────────────
function VerseOfDay(){
  const VERSES=[
    {ref:"Proverbs 27:17",text:"As iron sharpens iron, so one person sharpens another."},
    {ref:"Philippians 4:13",text:"I can do all this through him who gives me strength."},
    {ref:"Joshua 1:9",text:"Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go."},
    {ref:"Isaiah 40:31",text:"Those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary."},
    {ref:"Romans 8:28",text:"And we know that in all things God works for the good of those who love him, who have been called according to his purpose."},
    {ref:"Jeremiah 29:11",text:"For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future."},
    {ref:"2 Timothy 1:7",text:"For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline."},
    {ref:"Galatians 6:9",text:"Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up."},
    {ref:"Psalm 46:10",text:"He says, Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth."},
    {ref:"Matthew 6:33",text:"But seek first his kingdom and his righteousness, and all these things will be given to you as well."},
    {ref:"Micah 6:8",text:"Act justly, love mercy, and walk humbly with your God."},
    {ref:"2 Corinthians 5:17",text:"If anyone is in Christ, the new creation has come: The old has gone, the new is here."},
    {ref:"Psalm 34:18",text:"The Lord is close to the brokenhearted and saves those who are crushed in spirit."},
    {ref:"James 1:2-4",text:"Consider it pure joy whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance."},
  ];
  const dayIdx=new Date().getDay()+Math.floor(new Date().getDate()/7);
  const verse=VERSES[dayIdx%VERSES.length];
  const PUR="#534AB7",BG="#0f0f0f";
  return(
    <div>
      <div style={{background:BG,borderRadius:12,padding:"2rem",marginBottom:12,border:"0.5px solid "+PUR+"44",textAlign:"center"}}>
        <div style={{fontSize:11,color:PUR,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:16}}>Verse of the Day</div>
        <div style={{fontSize:16,color:"#fff",fontStyle:"italic",lineHeight:1.8,marginBottom:16}}>"{verse.text}"</div>
        <div style={{fontSize:13,fontWeight:500,color:PUR}}>{verse.ref}</div>
      </div>
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>More scriptures</div>
        {VERSES.filter((_,i)=>i!==dayIdx%VERSES.length).slice(0,6).map((v,i)=>(
          <div key={i} style={{padding:"10px 0",borderBottom:i<5?"0.5px solid #f0f0f0":"none"}}>
            <div style={{fontSize:11,fontWeight:500,color:PUR,marginBottom:3}}>{v.ref}</div>
            <div style={{fontSize:12,color:"#555",fontStyle:"italic",lineHeight:1.6}}>"{v.text}"</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Anvil History ───────────────────────────────────────────────
function AnvilHistory(){
  const[anvils,setAnvils]=useState([]);
  const GOLD="#D4AF37",BG="#0f0f0f";
  useEffect(()=>{
    supabase.from("anvil").select("*").order("created_at",{ascending:false}).then(({data})=>setAnvils(data||[])).catch(()=>setAnvils([]));
  },[]);
  return(
    <div>
      <div style={{background:BG,borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid "+GOLD+"44",textAlign:"center"}}>
        <div style={{fontSize:32,marginBottom:8}}>⚒</div>
        <div style={{fontSize:15,fontWeight:500,color:GOLD,marginBottom:4}}>The Anvil</div>
        <div style={{fontSize:12,color:"#888"}}>Awarded each week to the athlete who did what nobody else did.</div>
      </div>
      {anvils.length===0&&<div style={{background:"#fff",borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid #e0e0e0"}}><div style={{fontSize:13,color:"#888"}}>No anvil winners yet.</div></div>}
      {anvils.map((a,i)=>(
        <div key={i} style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:8,border:"0.5px solid #e0e0e0",borderLeft:"4px solid "+GOLD}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:a.note?8:0}}>
            <div>
              <div style={{fontSize:15,fontWeight:600,color:"#1a1a1a"}}>{a.athlete_name}</div>
              <div style={{fontSize:11,color:"#888"}}>{a.date_awarded}</div>
            </div>
            <div style={{fontSize:24}}>⚒</div>
          </div>
          {a.note&&<div style={{fontSize:13,color:"#555",fontStyle:"italic",lineHeight:1.6}}>"{a.note}"</div>}
        </div>
      ))}
    </div>
  );
}

// ── Attendance Calendar ─────────────────────────────────────────
function AttendanceCalendar({athleteId}){
  const[records,setRecords]=useState([]);
  const[monthIdx,setMonthIdx]=useState(0);
  const GREEN="#1E6B3A",RED="#C0392B",GOLD="#D4AF37";

  useEffect(()=>{
    supabase.from("attendance").select("*").eq("athlete_id",athleteId).order("date",{ascending:true}).then(({data})=>setRecords(data||[])).catch(()=>setRecords([]));
  },[]);

  const totalEarly=records.filter(r=>r.status==="early").length;
  const totalLate=records.filter(r=>r.status==="late").length;
  const byDate={};
  records.forEach(r=>{byDate[r.date]=r.status;});

  // Build months from June 2025 to August 2026
  const START=new Date(2025,5,1); // June 2025
  const END=new Date(2026,7,1);   // August 2026
  const allMonths=[];
  let cur=new Date(START);
  while(cur<=END){
    const year=cur.getFullYear();
    const month=cur.getMonth();
    const monthName=cur.toLocaleString("default",{month:"long"});
    const monthKey=`${year}-${String(month+1).padStart(2,"0")}`;
    const daysInMonth=new Date(year,month+1,0).getDate();
    const today=new Date();
    const days=[];
    for(let d=1;d<=daysInMonth;d++){
      const dateStr=`${monthKey}-${String(d).padStart(2,"0")}`;
      const dow=new Date(year,month,d).getDay();
      const isClassDay=[1,2,4,5].includes(dow);
      const isFuture=new Date(dateStr)>today;
      days.push({dateStr,day:d,isClassDay,isFuture,status:byDate[dateStr]||null});
    }
    const mEarly=days.filter(d=>d.status==="early").length;
    const mLate=days.filter(d=>d.status==="late").length;
    allMonths.push({monthName,year,days,mEarly,mLate});
    cur=new Date(year,month+1,1);
  }

  // Default to current month
  const today=new Date();
  const defaultIdx=allMonths.findIndex(m=>m.monthName===today.toLocaleString("default",{month:"long"})&&m.year===today.getFullYear());
  const[initialized,setInitialized]=useState(false);
  useEffect(()=>{if(!initialized&&defaultIdx>=0){setMonthIdx(defaultIdx);setInitialized(true);}},[defaultIdx]);

  const month=allMonths[monthIdx]||allMonths[0];
  const DAYS_SHORT=["S","M","T","W","T","F","S"];

  const firstDay=month?new Date(month.days[0].dateStr).getDay():0;
  const cells=[];
  for(let i=0;i<firstDay;i++) cells.push(null);
  if(month) month.days.forEach(d=>cells.push(d));
  const rows=[];
  for(let i=0;i<cells.length;i+=7) rows.push(cells.slice(i,i+7));

  return(
    <div>
      {/* Overall stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
        {[{label:"Early",val:totalEarly,color:GREEN,bg:"#EAF3DE"},{label:"Late",val:totalLate,color:RED,bg:"#FCEBEB"},{label:"Total",val:records.length,color:"#1a1a1a",bg:"#f5f5f5"}].map(s=>(
          <div key={s.label} style={{background:s.bg,borderRadius:10,padding:"12px",textAlign:"center",border:"0.5px solid #e0e0e0"}}>
            <div style={{fontSize:20,fontWeight:600,color:s.color}}>{s.val}</div>
            <div style={{fontSize:11,color:"#888",marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Month slider card */}
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0"}}>
        {/* Navigation */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <button onClick={()=>setMonthIdx(i=>Math.max(0,i-1))} disabled={monthIdx===0} style={{width:32,height:32,borderRadius:8,border:"0.5px solid #e0e0e0",background:monthIdx===0?"#f9f9f9":"#fff",fontSize:16,cursor:monthIdx===0?"default":"pointer",color:monthIdx===0?"#ccc":"#1a1a1a"}}>‹</button>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:14,fontWeight:600,color:"#1a1a1a"}}>{month?.monthName} {month?.year}</div>
            <div style={{fontSize:11,color:"#888",marginTop:2}}>
              <span style={{color:GREEN,fontWeight:500}}>{month?.mEarly||0} early</span>
              {(month?.mLate||0)>0&&<span style={{color:GOLD,fontWeight:500}}> · {month.mLate} late</span>}
              {(month?.mEarly||0)===0&&(month?.mLate||0)===0&&<span> · no check-ins</span>}
            </div>
          </div>
          <button onClick={()=>setMonthIdx(i=>Math.min(allMonths.length-1,i+1))} disabled={monthIdx===allMonths.length-1} style={{width:32,height:32,borderRadius:8,border:"0.5px solid #e0e0e0",background:monthIdx===allMonths.length-1?"#f9f9f9":"#fff",fontSize:16,cursor:monthIdx===allMonths.length-1?"default":"pointer",color:monthIdx===allMonths.length-1?"#ccc":"#1a1a1a"}}>›</button>
        </div>

        {/* Day headers */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:4}}>
          {DAYS_SHORT.map((d,i)=>(
            <div key={i} style={{fontSize:10,color:"#aaa",textAlign:"center",fontWeight:500}}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        {rows.map((row,ri)=>(
          <div key={ri} style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:4}}>
            {row.map((cell,ci)=>(
              <div key={ci} style={{
                height:34,borderRadius:8,
                background:!cell?"transparent":cell.isFuture?"#fafafa":!cell.isClassDay?"#f5f5f5":cell.status==="early"?GREEN:cell.status==="late"?GOLD:"#ebebeb",
                display:"flex",alignItems:"center",justifyContent:"center",
                border:cell&&cell.isClassDay&&!cell.isFuture&&!cell.status?"0.5px solid #ddd":"none",
              }}>
                {cell&&<span style={{fontSize:11,color:!cell.isClassDay||cell.isFuture?"#ccc":cell.status?"#fff":"#999",fontWeight:cell.status?600:400}}>{cell.day}</span>}
              </div>
            ))}
          </div>
        ))}

        {/* Legend */}
        <div style={{display:"flex",gap:10,marginTop:10,fontSize:10,color:"#888",flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,borderRadius:2,background:GREEN}}/> Early</div>
          <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,borderRadius:2,background:GOLD}}/> Late</div>
          <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,borderRadius:2,background:"#ebebeb",border:"0.5px solid #ddd"}}/> Missed</div>
          <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,borderRadius:2,background:"#f5f5f5"}}/> Off day</div>
        </div>
      </div>
    </div>
  );
}

// ── Group Photos ────────────────────────────────────────────────
function GroupPhotos(){
  const[photos,setPhotos]=useState([]);
  const[selected,setSelected]=useState(null);
  useEffect(()=>{
    supabase.from("athletes").select("name,photo_url").not("photo_url","is",null).then(({data})=>setPhotos(data||[])).catch(()=>setPhotos([]));
  },[]);
  return(
    <div>
      <div style={{background:"#0f0f0f",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #333"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#fff",marginBottom:4}}>📸 Group Photos</div>
        <div style={{fontSize:12,color:"#888"}}>Your crew.</div>
      </div>
      {selected&&(
        <div onClick={()=>setSelected(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}>
          <img src={selected.photo_url} style={{maxWidth:"90vw",maxHeight:"80vh",borderRadius:12,objectFit:"contain"}} alt={selected.name}/>
          <div style={{fontSize:14,color:"#fff"}}>{selected.name}</div>
        </div>
      )}
      {photos.length===0&&<div style={{background:"#fff",borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid #e0e0e0"}}><div style={{fontSize:13,color:"#888"}}>No photos yet. Coach Ant can add them from the roster.</div></div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        {photos.map((p,i)=>(
          <div key={i} onClick={()=>setSelected(p)} style={{cursor:"pointer",borderRadius:10,overflow:"hidden",aspectRatio:"1",background:"#f0f0f0"}}>
            <img src={p.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt={p.name}/>
          </div>
        ))}
      </div>
    </div>
  );
}


function NotesTab({athleteId, athlete}){
  const[category,setCategory]=useState("mindset");
  const[saving,setSaving]=useState(null);
  const GOLD="#D4AF37",PUR="#534AB7",GREEN="#1E6B3A";

  const MINDSET_WEEKS=[
    {week:1,title:"Who Are You Now?",scripture:"2 Cor 5:17",takeaway:"Your past is not your ceiling.",color:GOLD},
    {week:2,title:"Testimony Monday",scripture:"Rev 12:11",takeaway:"Your story has power.",color:GREEN},
    {week:3,title:"Process Over Outcome",scripture:"Gal 6:9",takeaway:"Fall in love with the work.",color:GOLD},
    {week:4,title:"Testimony Monday",scripture:"Psalm 34:18",takeaway:"God doesn't waste pain.",color:GREEN},
    {week:5,title:"Confidence vs Belief",scripture:"Phil 4:13",takeaway:"Confidence runs out. Belief doesn't.",color:GOLD},
    {week:6,title:"Testimony Monday",scripture:"Isaiah 43:2",takeaway:"You will not be swept away.",color:GREEN},
    {week:7,title:"Fear vs Faith",scripture:"Joshua 1:9",takeaway:"Courage is a decision before a feeling.",color:GOLD},
    {week:8,title:"Testimony Monday",scripture:"Rom 8:28",takeaway:"Nothing you've been through is wasted.",color:GREEN},
    {week:9,title:"Mental Side of Adversity",scripture:"James 1:2-4",takeaway:"Adversity is training. Treat it like it.",color:GOLD},
    {week:10,title:"Testimony Monday",scripture:"2 Tim 1:7",takeaway:"God did not give you a spirit of fear.",color:GREEN},
    {week:11,title:"Who Are You When Nobody's Watching?",scripture:"Prov 11:3",takeaway:"Private character is real character.",color:GOLD},
    {week:12,title:"Who Did You Become?",scripture:"Micah 6:8",takeaway:"Act justly. Love mercy. Walk humbly.",color:GOLD},
  ];

  const FELLOWSHIP_WEEKS=[
    {week:1,title:"The Leader Nobody Sees",scripture:"Matt 6:1–4",takeaway:"Real leadership is built in private.",color:"#C0392B"},
    {week:2,title:"Leading Under Pressure",scripture:"Daniel 3:16–18",takeaway:"Pressure reveals your real character.",color:"#C0392B"},
    {week:3,title:"The Servant Leader",scripture:"Mark 10:42–45",takeaway:"Greatness is redefined by service.",color:"#C0392B"},
    {week:4,title:"Your Example Has a Name",scripture:"1 Tim 4:12",takeaway:"Don't let anyone look down on your youth.",color:"#C0392B"},
    {week:5,title:"The Weight of Words",scripture:"Prov 18:21",takeaway:"Words build up or tear down.",color:"#1A4F8A"},
    {week:6,title:"Accountability Is Love",scripture:"Prov 27:17",takeaway:"Iron sharpens iron.",color:"#1A4F8A"},
    {week:7,title:"Leading Through Conflict",scripture:"Matt 18:15",takeaway:"Go to your brother directly.",color:"#1A4F8A"},
    {week:8,title:"The Humble Leader",scripture:"Phil 2:3–4",takeaway:"Consider others above yourself.",color:"#1A4F8A"},
    {week:9,title:"Roots and Fruit",scripture:"John 15:5",takeaway:"Apart from me you can do nothing.",color:"#0F6E56"},
    {week:10,title:"Legacy Over Trophy",scripture:"2 Tim 4:7",takeaway:"Fight the good fight. Finish the race.",color:"#0F6E56"},
    {week:11,title:"Who Is Following You?",scripture:"1 Cor 11:1",takeaway:"Follow me as I follow Christ.",color:"#0F6E56"},
    {week:12,title:"Sent — Go and Do",scripture:"Matt 28:19–20",takeaway:"Go and make disciples.",color:"#0F6E56"},
  ];

  const saveNote=async(key,val)=>{
    setSaving(key);
    await supabase.from("athletes").update({[key]:val}).eq("id",athleteId).catch(()=>{});
    setSaving(null);
  };

  const weeks=category==="mindset"?MINDSET_WEEKS:FELLOWSHIP_WEEKS;
  const notePrefix=category==="mindset"?"mindset_note_":"fellowship_note_";
  const catColor=category==="mindset"?GOLD:"#C0392B";

  return(
    <div>
      {/* Category switcher */}
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        {[{id:"mindset",label:"Mindset Monday",color:GOLD},{id:"fellowship",label:"Fellowship Friday",color:"#C0392B"}].map(c=>(
          <button key={c.id} onClick={()=>setCategory(c.id)} style={{flex:1,padding:"10px",borderRadius:10,border:"0.5px solid "+(category===c.id?c.color:"#e0e0e0"),background:category===c.id?c.color:"#fff",color:category===c.id?"#fff":"#888",fontSize:12,fontWeight:category===c.id?600:400,cursor:"pointer",fontFamily:"Georgia,serif"}}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Header */}
      <div style={{background:"#0f0f0f",borderRadius:12,padding:"1rem 1.25rem",marginBottom:12,border:"0.5px solid "+catColor+"44"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#fff",marginBottom:2}}>{category==="mindset"?"Mindset Monday":"Fellowship Friday"} — Your Notes</div>
        <div style={{fontSize:12,color:"#888"}}>Write your personal takeaway from each week. Only you can see these.</div>
      </div>

      {/* Week cards */}
      {weeks.map((w,i)=>{
        const noteKey=notePrefix+w.week;
        return(
          <div key={i} style={{background:"#fff",borderRadius:12,padding:"1rem",marginBottom:8,border:"0.5px solid #e0e0e0",borderLeft:"4px solid "+w.color}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
              <div style={{fontSize:11,color:w.color,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em"}}>Week {w.week}</div>
              <div style={{fontSize:11,color:"#888"}}>{w.scripture}</div>
            </div>
            <div style={{fontSize:13,fontWeight:500,color:"#1a1a1a",marginBottom:2}}>{w.title}</div>
            <div style={{fontSize:12,color:"#888",fontStyle:"italic",marginBottom:8}}>"{w.takeaway}"</div>
            <textarea
              defaultValue={athlete?.[noteKey]||""}
              onBlur={e=>saveNote(noteKey,e.target.value)}
              placeholder="Your personal takeaway from this session..."
              style={{width:"100%",minHeight:55,padding:"8px",borderRadius:8,border:"0.5px solid #e0e0e0",fontSize:12,fontFamily:"Georgia,serif",resize:"none",boxSizing:"border-box",background:"#fafafa",color:"#1a1a1a"}}
            />
            {saving===noteKey&&<div style={{fontSize:11,color:GREEN,marginTop:3}}>Saving...</div>}
          </div>
        );
      })}
    </div>
  );
}


function DailyWord({announcement}){
  const WORDS=[
    {quote:"Iron sharpens iron. Show up and make each other better.",author:"Proverbs 27:17"},
    {quote:"Early is the standard. Excellence is the expectation. Faith is the foundation.",author:"Coach Ant"},
    {quote:"You don't rise to the level of your goals. You fall to the level of your systems.",author:"Coach Ant"},
    {quote:"The grind you put in when nobody's watching is what separates you.",author:"Coach Ant"},
    {quote:"Be strong and courageous. Do not be afraid. The Lord your God is with you.",author:"Joshua 1:9"},
    {quote:"Champions are made in the moments when you want to quit but don't.",author:"Coach Ant"},
    {quote:"Your body will do what your mind tells it. Train your mind first.",author:"Coach Ant"},
  ];
  const word=WORDS[new Date().getDate()%WORDS.length];
  const PUR="#534AB7";
  return(
    <div style={{background:"#0f0f0f",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #222",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,"+PUR+",#D4AF37)"}}/>
      <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Today's word</div>
      {announcement&&<div style={{fontSize:13,color:"#fff",fontWeight:500,marginBottom:10,padding:"8px 10px",background:"#1a1a1a",borderRadius:8,borderLeft:"3px solid #D4AF37"}}>{announcement.message||announcement}</div>}
      <div style={{fontSize:14,color:"#ccc",fontStyle:"italic",lineHeight:1.7,marginBottom:8}}>"{word.quote}"</div>
      <div style={{fontSize:11,color:"#555"}}>— {word.author}</div>
    </div>
  );
}

function ClassCountdown(){
  const CLASS_START=new Date("2025-06-18T09:00:00");
  const now=new Date();
  const diff=CLASS_START-now;
  const GOLD="#D4AF37";
  if(diff<=0)return null;
  const days=Math.floor(diff/(1000*60*60*24));
  const hours=Math.floor((diff%(1000*60*60*24))/(1000*60*60));
  const mins=Math.floor((diff%(1000*60*60))/(1000*60));
  return(
    <div style={{background:"#0f0f0f",borderRadius:12,padding:"1.5rem",marginBottom:12,border:"1px solid "+GOLD+"44",textAlign:"center",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,"+GOLD+",#C0392B)"}}/>
      <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>⚒ First class in</div>
      <div style={{display:"flex",justifyContent:"center",gap:20,marginBottom:8}}>
        {[{val:days,label:"Days"},{val:hours,label:"Hours"},{val:mins,label:"Mins"}].map(t=>(
          <div key={t.label}>
            <div style={{fontSize:36,fontWeight:800,color:GOLD,lineHeight:1}}>{String(t.val).padStart(2,"0")}</div>
            <div style={{fontSize:10,color:"#555",marginTop:4}}>{t.label}</div>
          </div>
        ))}
      </div>
      <div style={{fontSize:12,color:"#444"}}>June 18, 2025 · 9:00am</div>
    </div>
  );
}


function PRLog({athleteId}){
  const[prs,setPrs]=useState([]);
  const[lift,setLift]=useState("");
  const[weight,setPRWeight]=useState("");
  const[goal,setPRGoal]=useState({});
  const[showGoal,setShowGoal]=useState(null);
  const[goalInput,setGoalInput]=useState("");
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);
  const[selectedLift,setSelectedLift]=useState(null);
  const GREEN="#1E6B3A",GOLD="#D4AF37",RED="#C0392B",PUR="#534AB7",BG="#0f0f0f";
  const LIFT_CATEGORIES=[
    {label:"Upper Body",color:"#534AB7",lifts:["Bench Press","Overhead Press","Pull-ups","Bent Over Row"]},
    {label:"Lower Body",color:"#1E6B3A",lifts:["Back Squat","Front Squat","Deadlift","Romanian Deadlift","Bulgarian Split Squat"]},
    {label:"Full Body",color:"#C0392B",lifts:["Power Clean","Hang Clean","Push Press","Power Snatch","Push Jerk"]},
  ];
  const LIFTS=LIFT_CATEGORIES.flatMap(c=>c.lifts);
  const getLiftCategory=(liftName)=>LIFT_CATEGORIES.find(c=>c.lifts.includes(liftName));

  useEffect(()=>{
    supabase.from("pr_log").select("*").eq("athlete_id",athleteId).order("date",{ascending:true}).then(({data,error})=>{
      if(error){console.error("pr_log error:",error);return;}
      setPrs(data||[]);
    });
    // Load goals from localStorage
    const saved=localStorage.getItem("pr_goals_"+athleteId);
    if(saved)setPRGoal(JSON.parse(saved));
  },[]);

  const save=async()=>{
    if(!lift||!weight)return;
    setSaving(true);
    const today=new Date().toISOString().split("T")[0];
    const{data,error}=await supabase.from("pr_log").insert({athlete_id:athleteId,lift,weight:parseFloat(weight),date:today}).select();
    if(error){console.error("save error:",error);setSaving(false);return;}
    const{data:all}=await supabase.from("pr_log").select("*").eq("athlete_id",athleteId).order("date",{ascending:true});
    setPrs(all||[]);
    setLift("");setPRWeight("");setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),2000);
  };

  const saveGoal=(liftName,val)=>{
    const newGoals={...goal,[liftName]:parseFloat(val)};
    setPRGoal(newGoals);
    localStorage.setItem("pr_goals_"+athleteId,JSON.stringify(newGoals));
    setShowGoal(null);setGoalInput("");
  };

  // Group by lift
  const byLift={};
  prs.forEach(p=>{if(!byLift[p.lift])byLift[p.lift]=[];byLift[p.lift].push(p);});

  // Best per lift
  const bests={};
  Object.entries(byLift).forEach(([lft,entries])=>{
    bests[lft]=entries.reduce((best,e)=>e.weight>best.weight?e:best,entries[0]);
  });

  const activeLiftData=selectedLift?byLift[selectedLift]:null;

  return(
    <div>
      {/* Log input */}
      <div style={{background:BG,borderRadius:12,padding:"1.25rem",marginBottom:12,border:"1px solid #222",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,"+GOLD+","+RED+")"}}/>
        <div style={{fontSize:11,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>🏋️ Strength Log</div>
        <select value={lift} onChange={e=>setLift(e.target.value)} style={{width:"100%",padding:"12px",borderRadius:8,border:"1px solid #333",background:"#1a1a1a",color:lift?"#fff":"#555",fontSize:13,fontFamily:"Georgia,serif",marginBottom:8,boxSizing:"border-box"}}>
          <option value="">Select lift...</option>
          {LIFT_CATEGORIES.map(cat=>(
            <optgroup key={cat.label} label={cat.label}>
              {cat.lifts.map(l=><option key={l} value={l}>{l}</option>)}
            </optgroup>
          ))}
        </select>
        <div style={{display:"flex",gap:8}}>
          <input type="text" inputMode="decimal" value={weight} onChange={e=>setPRWeight(e.target.value)} placeholder="Weight (lbs)" style={{flex:1,padding:"12px",borderRadius:8,border:"1px solid #333",background:"#1a1a1a",color:"#fff",fontSize:16,fontFamily:"Georgia,serif",textAlign:"center"}}/>
          <button onClick={save} disabled={!lift||!weight||saving} style={{padding:"12px 20px",borderRadius:8,border:"none",background:lift&&weight?"linear-gradient(135deg,"+GOLD+",#b8960e)":"#222",color:lift&&weight?"#1a1a1a":"#444",fontSize:14,fontWeight:700,cursor:lift&&weight?"pointer":"not-allowed",fontFamily:"Georgia,serif"}}>
            {saved?"✓":saving?"...":"Log"}
          </button>
        </div>
      </div>

      {/* PR cards by lift */}
      {LIFTS.filter(l=>byLift[l]).map((liftName,li)=>{
        const entries=byLift[liftName]||[];
        const best=bests[liftName];
        const liftGoal=goal[liftName]||null;
        const isSelected=selectedLift===liftName;
        const goalPct=liftGoal&&best?Math.min(100,Math.round((best.weight/liftGoal)*100)):0;

        // Sparkline
        const sparkW=100,sparkH=40;
        const weights=entries.map(e=>parseFloat(e.weight));
        const sMin=Math.min(...weights)-5;
        const sMax=Math.max(...weights)+5;
        const pts=weights.map((w,i)=>{
          const x=(i/(Math.max(weights.length-1,1)))*sparkW;
          const y=sparkH-((w-sMin)/(Math.max(sMax-sMin,1)))*sparkH;
          return`${x},${y}`;
        }).join(" ");

        return(
          <div key={li} style={{background:"#fff",borderRadius:12,marginBottom:10,border:"0.5px solid #e0e0e0",overflow:"hidden"}}>
            <div style={{height:3,background:(()=>{const cat=getLiftCategory(liftName);return cat?"linear-gradient(90deg,"+cat.color+","+cat.color+"99)":"linear-gradient(90deg,"+GOLD+","+RED+")";})()}}/>
            <div style={{padding:"1rem 1.25rem"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#1a1a1a",cursor:"pointer"}} onClick={()=>setSelectedLift(isSelected?null:liftName)}>{liftName}</div>
                    {(()=>{const cat=getLiftCategory(liftName);return cat?<span style={{fontSize:9,padding:"2px 7px",borderRadius:4,background:cat.color+"22",color:cat.color,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em"}}>{cat.label}</span>:null;})()}
                  </div>
                  <div style={{fontSize:11,color:"#888"}}>{entries.length} log{entries.length!==1?"s":""}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:22,fontWeight:800,color:GOLD}}>{best?.weight} <span style={{fontSize:12,fontWeight:400,color:"#aaa"}}>lbs</span></div>
                  <div style={{fontSize:10,color:"#aaa"}}>best · {best?.date}</div>
                </div>
              </div>

              {/* Sparkline */}
              {weights.length>1&&(
                <div style={{background:"#f9f9f9",borderRadius:8,padding:"8px 10px",marginBottom:10}}>
                  <svg viewBox={`0 0 ${sparkW} ${sparkH}`} style={{width:"100%",height:40,overflow:"visible"}}>
                    <defs>
                      <linearGradient id={"pg"+li} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={GOLD} stopOpacity="0.3"/>
                        <stop offset="100%" stopColor={GOLD} stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <polygon points={`0,${sparkH} ${pts} ${sparkW},${sparkH}`} fill={`url(#pg${li})`}/>
                    <polyline points={pts} fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    {weights.map((w,i)=>{
                      const x=(i/(Math.max(weights.length-1,1)))*sparkW;
                      const y=sparkH-((w-sMin)/(Math.max(sMax-sMin,1)))*sparkH;
                      return<circle key={i} cx={x} cy={y} r={i===weights.length-1?3.5:2} fill={i===weights.length-1?"#1a1a1a":GOLD}/>;
                    })}
                    {liftGoal&&sMax>=liftGoal&&(
                      <line x1="0" y1={sparkH-((liftGoal-sMin)/(Math.max(sMax-sMin,1)))*sparkH} x2={sparkW} y2={sparkH-((liftGoal-sMin)/(Math.max(sMax-sMin,1)))*sparkH} stroke={GREEN} strokeWidth="1.5" strokeDasharray="4,3"/>
                    )}
                  </svg>
                </div>
              )}

              {/* Goal progress — visual slider + ring */}
              <div style={{marginBottom:10}}>
                {liftGoal?(
                  <div style={{background:"#0f0f0f",borderRadius:12,padding:"14px",border:"1px solid #222"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                      <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.08em"}}>Goal progress</div>
                      <button onClick={()=>{setShowGoal(liftName);setGoalInput(String(liftGoal));}} style={{fontSize:10,color:"#444",background:"none",border:"none",cursor:"pointer",fontFamily:"Georgia,serif"}}>edit</button>
                    </div>
                    {/* Main stats row */}
                    <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:14}}>
                      {/* Circle */}
                      <div style={{position:"relative",width:72,height:72,flexShrink:0}}>
                        <svg viewBox="0 0 72 72" style={{width:72,height:72,transform:"rotate(-90deg)"}}>
                          <circle cx="36" cy="36" r="30" fill="none" stroke="#222" strokeWidth="7"/>
                          <circle cx="36" cy="36" r="30" fill="none"
                            stroke={goalPct>=100?GREEN:goalPct>=75?GOLD:PUR}
                            strokeWidth="7"
                            strokeDasharray={`${Math.min(goalPct,100)*1.885} 188.5`}
                            strokeLinecap="round"
                            style={{filter:`drop-shadow(0 0 6px ${goalPct>=100?GREEN:goalPct>=75?GOLD:PUR})`}}/>
                        </svg>
                        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                          <div style={{fontSize:16,fontWeight:900,color:goalPct>=100?GREEN:goalPct>=75?GOLD:PUR,lineHeight:1}}>{Math.min(goalPct,100)}</div>
                          <div style={{fontSize:9,color:"#555"}}>%</div>
                        </div>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:6}}>
                          <div>
                            <div style={{fontSize:24,fontWeight:800,color:"#fff",lineHeight:1}}>{best?.weight||0}</div>
                            <div style={{fontSize:9,color:"#555",marginTop:2}}>current</div>
                          </div>
                          <div style={{fontSize:13,color:"#333"}}>→</div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:24,fontWeight:800,color:goalPct>=100?GREEN:PUR,lineHeight:1}}>{liftGoal}</div>
                            <div style={{fontSize:9,color:"#555",marginTop:2}}>goal</div>
                          </div>
                        </div>
                        {/* Slider track */}
                        <div style={{position:"relative",height:8,background:"#222",borderRadius:4,overflow:"visible"}}>
                          <div style={{position:"absolute",left:0,top:0,height:"100%",width:Math.min(goalPct,100)+"%",background:goalPct>=100?"linear-gradient(90deg,"+GREEN+",#0d4a29)":goalPct>=75?"linear-gradient(90deg,"+GOLD+",#b8960e)":"linear-gradient(90deg,"+PUR+",#3d35a0)",borderRadius:4,transition:"width 0.5s",boxShadow:goalPct>=100?"0 0 8px "+GREEN:goalPct>=75?"0 0 8px "+GOLD:"0 0 8px "+PUR}}/>
                          {/* Thumb */}
                          <div style={{position:"absolute",top:"50%",left:Math.min(goalPct,100)+"%",transform:"translate(-50%,-50%)",width:16,height:16,borderRadius:"50%",background:goalPct>=100?GREEN:goalPct>=75?GOLD:PUR,border:"2px solid #0f0f0f",boxShadow:"0 0 8px "+(goalPct>=100?GREEN:goalPct>=75?GOLD:PUR),transition:"left 0.5s"}}/>
                        </div>
                      </div>
                    </div>
                    {goalPct>=100?(
                      <div style={{textAlign:"center",fontSize:13,fontWeight:700,color:GREEN}}>🎉 Goal crushed! Set a new one.</div>
                    ):(
                      <div style={{textAlign:"center",fontSize:12,color:"#444"}}>{(liftGoal-(best?.weight||0)).toFixed(1)} lbs away from your goal</div>
                    )}
                  </div>
                ):(
                  <button onClick={()=>{setShowGoal(liftName);setGoalInput("");}} style={{fontSize:12,color:PUR,background:"#EEEDFE",border:"0.5px solid "+PUR+"44",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:500,width:"100%",boxSizing:"border-box"}}>+ Set a goal for {liftName} →</button>
                )}
                {showGoal===liftName&&(
                  <div style={{display:"flex",gap:6,marginTop:8}}>
                    <input type="text" inputMode="decimal" value={goalInput} onChange={e=>setGoalInput(e.target.value)} placeholder="Goal (lbs)" style={{flex:1,padding:"8px 10px",borderRadius:8,border:"0.5px solid #e0e0e0",fontSize:13,fontFamily:"Georgia,serif",background:"#fafafa"}}/>
                    <button onClick={()=>saveGoal(liftName,goalInput)} style={{padding:"8px 14px",borderRadius:8,border:"none",background:PUR,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"Georgia,serif"}}>Save</button>
                    <button onClick={()=>setShowGoal(null)} style={{padding:"8px 10px",borderRadius:8,border:"0.5px solid #e0e0e0",background:"transparent",color:"#888",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>✕</button>
                  </div>
                )}
              </div>

              {/* History — tap to expand */}
              {isSelected&&(
                <div style={{borderTop:"0.5px solid #f0f0f0",paddingTop:8}}>
                  {[...entries].reverse().map((e,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:i<entries.length-1?"0.5px solid #f5f5f5":"none"}}>
                      <div style={{fontSize:12,color:"#888"}}>{e.date}</div>
                      <div style={{fontSize:13,fontWeight:600,color:e.weight===best?.weight?GOLD:"#1a1a1a"}}>{e.weight} lbs {e.weight===best?.weight?"⭐":""}</div>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={()=>setSelectedLift(isSelected?null:liftName)} style={{fontSize:11,color:"#aaa",background:"none",border:"none",cursor:"pointer",fontFamily:"Georgia,serif",padding:"4px 0 0"}}>
                {isSelected?"▲ Hide history":"▼ Show history"}
              </button>
            </div>
          </div>
        );
      })}

      {Object.keys(byLift).length===0&&(
        <div style={{background:"#fff",borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid #e0e0e0"}}>
          <div style={{fontSize:40,marginBottom:12}}>🏋️</div>
          <div style={{fontSize:14,fontWeight:500,color:"#1a1a1a",marginBottom:6}}>Start tracking your lifts</div>
          <div style={{fontSize:12,color:"#888"}}>Log your first set above and watch your strength grow week by week.</div>
        </div>
      )}
    </div>
  );
}

function AchievementBadges({athlete}){
  const GOLD="#D4AF37",GREEN="#1E6B3A",RED="#C0392B",PUR="#534AB7";
  const[streak,setStreak]=useState(0);
  const[early,setEarly]=useState(0);
  const[anvilCount,setAnvilCount]=useState(0);
  const[loading,setLoading]=useState(true);
  useEffect(()=>{
    if(!athlete?.id){setLoading(false);return;}
    supabase.from("leaderboard").select("current_streak,early_count").eq("athlete_id",athlete.id).single()
      .then(({data:lb})=>{setStreak(lb?.current_streak||0);setEarly(lb?.early_count||0);})
      .catch(()=>{});
    supabase.from("anvil").select("id").then(({data})=>{
      setAnvilCount((data||[]).filter(a=>a.athlete_name===athlete.name).length);
      setLoading(false);
    }).catch(()=>setLoading(false));
  },[athlete?.id]);
  const BADGES=[
    {icon:"🌅",label:"First Light",desc:"First early check-in",earned:early>=1,color:GREEN},
    {icon:"🔥",label:"On Fire",desc:"5-day streak",earned:streak>=5,color:RED},
    {icon:"💥",label:"Unstoppable",desc:"10-day streak",earned:streak>=10,color:RED},
    {icon:"⚡",label:"Consistent",desc:"10 early arrivals",earned:early>=10,color:PUR},
    {icon:"💪",label:"Iron Standard",desc:"25 early arrivals",earned:early>=25,color:PUR},
    {icon:"⚒",label:"The Anvil",desc:"Won the Anvil",earned:anvilCount>=1,color:GOLD},
    {icon:"👑",label:"Anvil Legend",desc:"Won Anvil 3x",earned:anvilCount>=3,color:GOLD},
    {icon:"🙏",label:"Iron & Faith",desc:"TF College Group",earned:true,color:PUR},
  ];
  const earned=BADGES.filter(b=>b.earned);
  const locked=BADGES.filter(b=>!b.earned);
  if(loading)return<div style={{textAlign:"center",padding:"2rem",color:"#888",fontSize:13}}>Loading...</div>;
  return(
    <div>
      <div style={{background:"#0f0f0f",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #222"}}>
        <div style={{fontSize:11,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>🏅 Achievements</div>
        <div style={{fontSize:13,color:"#fff",marginBottom:10}}>{earned.length} of {BADGES.length} earned</div>
        <div style={{height:5,background:"#222",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:(earned.length/BADGES.length*100)+"%",background:"linear-gradient(90deg,"+GOLD+","+RED+")",borderRadius:3}}/></div>
      </div>
      {earned.length>0&&<div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Earned</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {earned.map((b,i)=><div key={i} style={{textAlign:"center",padding:"14px 8px",background:b.color+"15",borderRadius:12,border:"1px solid "+b.color+"44"}}>
            <div style={{fontSize:30,marginBottom:6}}>{b.icon}</div>
            <div style={{fontSize:11,fontWeight:700,color:b.color,marginBottom:3}}>{b.label}</div>
            <div style={{fontSize:10,color:"#888"}}>{b.desc}</div>
          </div>)}
        </div>
      </div>}
      {locked.length>0&&<div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Locked</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {locked.map((b,i)=><div key={i} style={{textAlign:"center",padding:"14px 8px",background:"#f9f9f9",borderRadius:12,border:"0.5px solid #e0e0e0"}}>
            <div style={{fontSize:30,marginBottom:6,filter:"grayscale(1)",opacity:0.4}}>{b.icon}</div>
            <div style={{fontSize:11,fontWeight:600,color:"#aaa",marginBottom:3}}>{b.label}</div>
            <div style={{fontSize:10,color:"#ccc"}}>{b.desc}</div>
          </div>)}
        </div>
      </div>}
    </div>
  );
}

