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
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);
  useEffect(()=>{
    supabase.from("weight_log").select("*").eq("athlete_id",athleteId).order("date",{ascending:true}).then(({data})=>setEntries(data||[])).catch(()=>setEntries([]));
  },[]);
  const save=async()=>{
    if(!weight)return;
    setSaving(true);
    const today=new Date().toISOString().split("T")[0];
    await supabase.from("weight_log").upsert({athlete_id:athleteId,date:today,weight:parseFloat(weight)},{onConflict:"athlete_id,date"}).catch(()=>{});
    const{data}=await supabase.from("weight_log").select("*").eq("athlete_id",athleteId).order("date",{ascending:true}).catch(()=>({data:[]}));
    setEntries(data||[]);
    setWeight("");setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),3000);
  };
  const first=entries[0]?.weight;
  const latest=entries[entries.length-1]?.weight;
  const diff=first&&latest?parseFloat((latest-first).toFixed(1)):null;
  const GREEN="#1E6B3A",RED="#C0392B",BG="#0f0f0f";
  return(
    <div>
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+GREEN}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Log today's weight</div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <input type="number" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="lbs" style={{flex:1,padding:"12px",borderRadius:8,border:"0.5px solid #e0e0e0",fontSize:16,fontFamily:"Georgia,serif",background:"#fafafa",textAlign:"center"}}/>
          <button onClick={save} disabled={!weight||saving} style={{padding:"12px 20px",borderRadius:8,border:"none",background:weight?GREEN:"#e0e0e0",color:weight?"#fff":"#aaa",fontSize:14,fontWeight:500,cursor:"pointer",fontFamily:"Georgia,serif"}}>
            {saved?"✓":saving?"...":"Save"}
          </button>
        </div>
        <div style={{fontSize:11,color:"#888",marginTop:8,textAlign:"center"}}>Private — only you can see this</div>
      </div>
      {entries.length>0&&(
        <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
            <div style={{background:"#f9f9f9",borderRadius:10,padding:"12px",textAlign:"center"}}>
              <div style={{fontSize:18,fontWeight:600,color:"#1a1a1a"}}>{first} lbs</div>
              <div style={{fontSize:11,color:"#888"}}>Start</div>
            </div>
            <div style={{background:"#f9f9f9",borderRadius:10,padding:"12px",textAlign:"center"}}>
              <div style={{fontSize:18,fontWeight:600,color:"#1a1a1a"}}>{latest} lbs</div>
              <div style={{fontSize:11,color:"#888"}}>Current</div>
            </div>
            <div style={{background:"#f9f9f9",borderRadius:10,padding:"12px",textAlign:"center"}}>
              <div style={{fontSize:18,fontWeight:600,color:diff===null?"#888":diff<0?GREEN:diff>0?RED:"#1a1a1a"}}>{diff===null?"—":(diff>0?"+":"")+diff+" lbs"}</div>
              <div style={{fontSize:11,color:"#888"}}>Change</div>
            </div>
          </div>
          <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>History</div>
          {[...entries].reverse().slice(0,10).map((e,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"0.5px solid #f0f0f0"}}>
              <div style={{fontSize:12,color:"#888"}}>{e.date}</div>
              <div style={{fontSize:13,fontWeight:500,color:"#1a1a1a"}}>{e.weight} lbs</div>
            </div>
          ))}
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
    {week:2,title:"Testimony Monday",scripture:"Rev 12:11",takeaway:"Your story has power.",color:GOLD},
    {week:3,title:"Process Over Outcome",scripture:"Gal 6:9",takeaway:"Fall in love with the work.",color:PUR},
    {week:4,title:"Testimony Monday",scripture:"Psalm 34:18",takeaway:"God doesn't waste pain.",color:GOLD},
    {week:5,title:"Confidence vs Belief",scripture:"Phil 4:13",takeaway:"Confidence runs out. Belief doesn't.",color:PUR},
    {week:6,title:"Testimony Monday",scripture:"Isaiah 43:2",takeaway:"You will not be swept away.",color:PUR},
    {week:7,title:"Fear vs Faith",scripture:"Joshua 1:9",takeaway:"Courage is a decision before a feeling.",color:PUR},
    {week:8,title:"Testimony Monday",scripture:"Rom 8:28",takeaway:"Nothing you've been through is wasted.",color:PUR},
    {week:9,title:"Mental Side of Adversity",scripture:"James 1:2-4",takeaway:"Adversity is training. Treat it like it.",color:GREEN},
    {week:10,title:"Testimony Monday",scripture:"2 Tim 1:7",takeaway:"God did not give you a spirit of fear.",color:GREEN},
    {week:11,title:"Who Are You When Nobody's Watching?",scripture:"Prov 11:3",takeaway:"Private character is real character.",color:GREEN},
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


export default function Athlete(){
  const[athletes,setAthletes]=useState([]);
  const[announcement,setAnnouncement]=useState(null);
  const[anvilWinner,setAnvilWinner]=useState(null);
  const[screen,setScreen]=useState("roster");
  const[selectedAthlete,setSelectedAthlete]=useState(null);
  const[search,setSearch]=useState("");
  const[pin,setPin]=useState("");
  const[pinStep,setPinStep]=useState("enter");
  const[pinConfirm,setPinConfirm]=useState("");
  const[pinError,setPinError]=useState("");
  const[checkinInfo,setCheckinInfo]=useState(null);
  const[tab,setTab]=useState("profile");
  const[loading,setLoading]=useState(true);
  const[feedbackText,setFeedbackText]=useState("");
  const[feedbackSent,setFeedbackSent]=useState(false);
  const[prayerText,setPrayerText]=useState("");
  const[prayerSent,setPrayerSent]=useState(false);
  const[injuryOpen,setInjuryOpen]=useState(false);
  const[injuryText,setInjuryText]=useState("");
  const[injurySent,setInjurySent]=useState(false);
  const[attendance,setAttendance]=useState([]);
  const[streak,setStreak]=useState(0);
  const[draft,setDraft]=useState(null);
  const pollRef=useRef(null);

  useEffect(()=>{loadData();},[]);

  const loadData=async()=>{
    setLoading(true);
    const{data:aths}=await supabase.from("athletes").select("*").eq("status","active").order("name");
    if(aths)setAthletes(aths);
    const{data:ann}=await supabase.from("announcements").select("*").eq("active",true).order("created_at",{ascending:false}).limit(1);
    if(ann&&ann.length>0)setAnnouncement(ann[0]);
    const{data:anv}=await supabase.from("anvil").select("*").eq("type","individual").order("created_at",{ascending:false}).limit(1);
    if(anv&&anv.length>0)setAnvilWinner(anv[0]);
    setLoading(false);
  };

  const loadDraft=async()=>{
    const{data}=await supabase.from("draft").select("*").order("created_at",{ascending:false}).limit(1);
    if(data&&data.length>0)setDraft(data[0]);
    else setDraft(null);
  };

  const loadAttendance=async(athleteId)=>{
    const{data}=await supabase.from("attendance").select("*").eq("athlete_id",athleteId).order("date",{ascending:false});
    if(data)setAttendance(data);
    let s=0;
    if(data){for(const rec of data){if(rec.status==="early")s++;else break;}}
    setStreak(s);
  };

  const doCheckin=async(athlete)=>{
    const now=new Date();
    const timeStr=now.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
    const today=DAYS[now.getDay()];
    if(!CLASS_DAYS.includes(today))return null;
    const cut=CUTOFFS[today]||{h:9,m:30};
    const late=now.getHours()>cut.h||(now.getHours()===cut.h&&now.getMinutes()>=cut.m);
    const status=late?"late":"early";
    const today_date=now.toISOString().split("T")[0];
    const{data:existing}=await supabase.from("attendance").select("*").eq("athlete_id",athlete.id).eq("date",today_date);
    if(existing&&existing.length>0)return{status:existing[0].status,time:existing[0].time_logged,already:true};
    await supabase.from("attendance").insert({athlete_id:athlete.id,date:today_date,day:today,status,time_logged:timeStr});
    const{data:lb}=await supabase.from("leaderboard").select("*").eq("athlete_id",athlete.id);
    if(lb&&lb.length>0){
      const updates={};
      if(status==="early"){updates.early_count=(lb[0].early_count||0)+1;updates.current_streak=(lb[0].current_streak||0)+1;if(updates.current_streak>(lb[0].best_streak||0))updates.best_streak=updates.current_streak;}
      else{updates.late_count=(lb[0].late_count||0)+1;updates.current_streak=0;}
      await supabase.from("leaderboard").update(updates).eq("athlete_id",athlete.id);
    } else {
      await supabase.from("leaderboard").insert({athlete_id:athlete.id,early_count:status==="early"?1:0,late_count:status==="late"?1:0,current_streak:status==="early"?1:0,best_streak:status==="early"?1:0});
    }
    return{status,time:timeStr};
  };

  const selectAthlete=async(a)=>{
    setSelectedAthlete(a);
    setPin("");setPinError("");setPinStep("enter");setPinConfirm("");
    setFeedbackText("");setFeedbackSent(false);
    setPrayerText("");setPrayerSent(false);
    setInjuryText("");setInjurySent(false);setInjuryOpen(false);
    setTab("profile");setScreen("login");
    await loadAttendance(a.id);
    await loadDraft();
  };

  const submitPin=async()=>{
    if(pin.length<4)return;
    const saved=selectedAthlete.pin;
    if(!saved||saved===""||saved===null){
      if(pinStep==="enter"){setPinConfirm(pin);setPin("");setPinStep("confirm");setPinError("");}
      else{
        if(pin===pinConfirm){
          await supabase.from("athletes").update({pin}).eq("id",selectedAthlete.id);
          setSelectedAthlete({...selectedAthlete,pin});
          const info=await doCheckin({...selectedAthlete,pin});
          setCheckinInfo(info);setPin("");setScreen("checkin");
        } else {setPinError("PINs don't match. Try again.");setPin("");setPinStep("enter");setPinConfirm("");}
      }
    } else {
      if(pin===saved){
        const info=await doCheckin(selectedAthlete);
        setCheckinInfo(info);setPin("");setScreen("checkin");setPinError("");
      } else {setPinError("Incorrect PIN. Try again.");setPin("");}
    }
  };

  useEffect(()=>{if(pin.length===4)submitPin();},[pin]);

  useEffect(()=>{
    if(screen==="profile"&&(tab==="draft"||tab==="mygroup")){
      pollRef.current=setInterval(loadDraft,3000);
      return()=>clearInterval(pollRef.current);
    }
    return()=>clearInterval(pollRef.current);
  },[screen,tab]);

  const sendFeedback=async()=>{
    if(!feedbackText.trim())return;
    await supabase.from("inbox").insert({athlete_id:selectedAthlete.id,type:"message",message:feedbackText});
    setFeedbackSent(true);
  };

  const sendPrayer=async()=>{
    if(!prayerText.trim())return;
    await supabase.from("inbox").insert({athlete_id:selectedAthlete.id,type:"prayer",message:prayerText});
    setPrayerSent(true);
  };

  const sendInjury=async()=>{
    if(!injuryText.trim())return;
    await supabase.from("athletes").update({injury:true,injury_note:injuryText}).eq("id",selectedAthlete.id);
    await supabase.from("inbox").insert({athlete_id:selectedAthlete.id,type:"injury",message:injuryText});
    setInjurySent(true);
  };

  const bracelet=BRACELETS.find(b=>b.ref===selectedAthlete?.bracelet);
  const isForge=selectedAthlete?.role==="forge";

  if(loading)return(
    <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}><div style={{fontSize:32,marginBottom:16}}>⚒</div><div style={{fontSize:14,color:"#555"}}>Loading...</div></div>
    </div>
  );

  if(screen==="roster")return(
    <>
      <Head><title>TF College Group — Athlete</title></Head>
      <div style={{minHeight:"100vh",background:BG,fontFamily:"Georgia, serif",maxWidth:480,margin:"0 auto",padding:"3rem 1.5rem 2rem"}}>
        {announcement&&(
          <div style={{background:"#1a1a2a",border:"0.5px solid "+PUR+"66",borderRadius:12,padding:"12px 16px",marginBottom:20}}>
            <div style={{fontSize:10,color:PUR,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>This week</div>
            <div style={{fontSize:13,color:"#fff",lineHeight:1.6}}>{announcement.message}</div>
          </div>
        )}
        {anvilWinner&&(
          <div style={{background:"#1f1700",border:"0.5px solid "+GOLD+"44",borderRadius:12,padding:"12px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:GOLD,flexShrink:0}}/>
            <div>
              <div style={{fontSize:10,color:GOLD,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>This week's Anvil</div>
              <div style={{fontSize:14,fontWeight:500,color:GOLD}}>{anvilWinner.athlete_name}</div>
            </div>
          </div>
        )}
        <div style={{textAlign:"center",marginBottom:"2rem"}}>
          <div style={{width:60,height:60,borderRadius:16,background:PUR,margin:"0 auto 1rem",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>⚒</div>
          <div style={{fontSize:22,fontWeight:400,color:"#fff",marginBottom:4}}>TF College Group</div>
          <div style={{fontSize:13,color:"#888"}}>Select your name to sign in</div>
        </div>
        <div style={{marginBottom:14,position:"relative"}}>
          <input type="text" placeholder="Search your name..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",padding:"12px 16px 12px 42px",borderRadius:12,border:"0.5px solid #333",background:"#141414",color:"#fff",fontSize:14,fontFamily:"Georgia, serif",boxSizing:"border-box",outline:"none"}} autoComplete="off"/>
          <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:16,color:"#555"}}>🔍</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
          {athletes.filter(a=>!search||a.name.toLowerCase().includes(search.toLowerCase())).map(a=>(
            <button key={a.id} onClick={()=>selectAthlete(a)} style={{width:"100%",padding:"14px 18px",borderRadius:12,border:"0.5px solid #2a2a2a",background:"#141414",color:"#fff",fontSize:14,fontWeight:500,cursor:"pointer",fontFamily:"Georgia, serif",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:500,color:"#fff",flexShrink:0,overflow:"hidden"}}>{a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:a.name[0]}</div>
                <div style={{textAlign:"left"}}>
                  <div style={{fontSize:14,fontWeight:500}}>{a.name}</div>
                  <div style={{fontSize:12,color:"#888"}}>{a.sport}</div>
                </div>
              </div>
              <div style={{fontSize:12,color:a.role==="forge"?RED:STEEL,fontWeight:500}}>{a.role==="forge"?"The Forge":"The Iron"}</div>
            </button>
          ))}
        </div>
        <div style={{textAlign:"center",fontSize:12,color:"#444"}}>Proverbs 27:17 — Iron sharpens iron</div>
      </div>
    </>
  );

  if(screen==="login")return(
    <>
      <Head><title>Sign In — TF College Group</title></Head>
      <div style={{minHeight:"100vh",background:BG,fontFamily:"Georgia, serif",maxWidth:480,margin:"0 auto",padding:"3rem 1.5rem 2rem",textAlign:"center",position:"relative"}}>
        <button onClick={()=>setScreen("roster")} style={{position:"absolute",top:20,left:20,background:"transparent",border:"none",color:"#666",fontSize:13,cursor:"pointer",fontFamily:"Georgia, serif"}}>← Back</button>
        <div style={{width:48,height:48,borderRadius:"50%",background:isForge?RED:STEEL,margin:"0 auto 1rem",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:500,color:"#fff"}}>{selectedAthlete?.name[0]}</div>
        <div style={{fontSize:18,fontWeight:400,color:"#fff",marginBottom:6}}>
          {!selectedAthlete?.pin?`Hey ${selectedAthlete?.name.split(" ")[0]}, create your passcode`:pinStep==="confirm"?"Confirm your passcode":`Welcome back, ${selectedAthlete?.name.split(" ")[0]}`}
        </div>
        <div style={{fontSize:13,color:"#888",marginBottom:"2.5rem"}}>
          {!selectedAthlete?.pin?"You'll use this every time you sign in.":pinStep==="confirm"?"Enter the same 4 digits again.":"Enter your 4-digit passcode."}
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:14,marginBottom:28}}>
          {[0,1,2,3].map(i=><div key={i} style={{width:14,height:14,borderRadius:"50%",border:"2px solid "+PUR,background:i<pin.length?PUR:"transparent"}}/>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,maxWidth:240,margin:"0 auto"}}>
          {[1,2,3,4,5,6,7,8,9,null,0,"⌫"].map((k,i)=>(
            <button key={i} onClick={()=>{
              if(k===null)return;
              if(k==="⌫"){setPin(p=>p.slice(0,-1));return;}
              if(pin.length<4)setPin(p=>p+String(k));
            }} style={{padding:"16px",borderRadius:12,border:"0.5px solid "+(k===null?"transparent":"#333"),background:k===null?"transparent":"#141414",fontSize:20,fontWeight:500,cursor:k===null?"default":"pointer",color:"#fff",fontFamily:"Georgia, serif"}}>
              {k===null?"":k}
            </button>
          ))}
        </div>
        {pinError&&<div style={{marginTop:14,fontSize:13,color:"#E24B4A"}}>{pinError}</div>}
      </div>
    </>
  );

  if(screen==="checkin"){
    const isLate=checkinInfo?.status==="late";
    const noClass=!checkinInfo;
    const alreadyIn=checkinInfo?.already;
    return(
      <>
        <Head><title>Check In — TF College Group</title></Head>
        <div style={{minHeight:"100vh",background:BG,fontFamily:"Georgia, serif",maxWidth:480,margin:"0 auto",padding:"3rem 1.5rem 2rem",textAlign:"center"}}>
          <div style={{width:70,height:70,borderRadius:"50%",background:noClass?"#333":alreadyIn?PUR:isLate?RED:GREEN,margin:"0 auto 1.5rem",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>
            {noClass?"📅":alreadyIn?"✓":isLate?"⚠":"✓"}
          </div>
          <div style={{fontSize:22,fontWeight:400,color:"#fff",marginBottom:6}}>
            {noClass?"No class today":alreadyIn?"Already checked in":isLate?"You're late.":"You're in early."}
          </div>
          {checkinInfo&&<div style={{fontSize:14,color:"#888",marginBottom:16}}>Signed in at {checkinInfo.time}</div>}
          {streak>0&&!noClass&&(
            <div style={{padding:"10px 16px",borderRadius:10,background:"#1a1f1a",border:"0.5px solid "+GREEN+"44",marginBottom:16,display:"inline-block"}}>
              <div style={{fontSize:13,color:GREEN}}>🔥 {streak} day early streak</div>
            </div>
          )}
          {!noClass&&!alreadyIn&&(
            <div style={{padding:"14px 16px",borderRadius:10,border:"0.5px solid "+(isLate?"#E24B4A":GREEN),background:isLate?"#2a0a0a":"#0a1f0a",marginBottom:24,textAlign:"left"}}>
              {isLate?(<><div style={{fontSize:13,fontWeight:500,color:"#E24B4A",marginBottom:6}}>On time is late. Early is the only standard.</div><div style={{fontSize:13,color:"#aaa",lineHeight:1.6}}>Consequence: <span style={{color:"#E24B4A",fontWeight:500}}>50 crunches upon arrival.</span></div></>)
              :(<><div style={{fontSize:13,fontWeight:500,color:"#58B368",marginBottom:6}}>That's the standard. Keep setting it.</div><div style={{fontSize:13,color:"#aaa",lineHeight:1.6}}>Early is the only acceptable arrival.</div></>)}
            </div>
          )}
          <button onClick={()=>{setScreen("profile");setTab("profile");}} style={{width:"100%",padding:"14px",borderRadius:10,border:"none",background:PUR,color:"#fff",fontSize:15,fontWeight:500,cursor:"pointer",fontFamily:"Georgia, serif"}}>
            Go to my profile →
          </button>
        </div>
      </>
    );
  }

  if(screen==="profile"&&selectedAthlete){
    const TABS=[
      {id:"profile",label:"My profile"},
      {id:"prayer",label:"Prayer"},
      {id:"leaderboard",label:"Leaderboard"},
      {id:"bracelets",label:"Bracelets"},
      {id:"notes",label:"Notes"},
      {id:"weight",label:"Weight"},
      {id:"goals",label:"Goals"},
      {id:"verse",label:"Verse"},
      {id:"anvil",label:"Anvil"},
      {id:"calendar",label:"Calendar"},
      {id:"photos",label:"Photos"},
      ...(isForge?[{id:"draft",label:"Draft"}]:[{id:"mygroup",label:"My group"}]),
      {id:"journey",label:"The journey"},
      {id:"private",label:"Private"},
    ];

    const myGroupIdx=selectedAthlete.group_idx;
    const draftLeaders=draft?.leaders||[];
    const draftGroups=draft?.groups||[];
    const draftBracelets=draft?.bracelets||[];
    const draftTiers=draft?.tiers||[];
    const draftPhase=draft?.phase;
    const myLeader=myGroupIdx!=null?draftLeaders[myGroupIdx]:null;
    const myGroup=myGroupIdx!=null?draftGroups[myGroupIdx]:null;
    const myBracelet=myGroupIdx!=null?BRACELETS.find(b=>b.ref===draftBracelets[myGroupIdx]?.ref):null;
    const myTier=myGroupIdx!=null?draftTiers[myGroupIdx]:null;

    const myLeaderIdx=isForge?draftLeaders.indexOf(selectedAthlete.name):-1;
    const takenBracelets=(draftBracelets||[]).filter(Boolean).map(b=>b?.ref);
    const myBraceletPicked=myLeaderIdx>=0?draftBracelets[myLeaderIdx]:null;

    const nonLeaders=(athletes||[]).filter(a=>!draftLeaders.includes(a.name)).map(a=>a.name);
    const allPicked=(draftGroups||[]).flat();
    const available=nonLeaders.filter(n=>!allPicked.includes(n));
    const totalPicks=nonLeaders.length;
    const pickSeq=snakeSeq(totalPicks);
    const pickIdx=allPicked.length;
    const currentPickerIdx=pickSeq[pickIdx]??0;
    const isMyTurn=myLeaderIdx===currentPickerIdx&&draftPhase==="draft";
    const draftComplete=draftPhase==="locked"||(available.length===0&&draftPhase==="draft");

    const pickBracelet=async(b)=>{
      if(myLeaderIdx<0||myBraceletPicked)return;
      const nb=[...(draftBracelets||[null,null,null,null])];
      nb[myLeaderIdx]=b;
      await supabase.from("draft").update({bracelets:nb}).eq("id",draft.id);
      const allPicked=nb.every(Boolean);
      if(allPicked){
        await supabase.from("draft").update({phase:"draft"}).eq("id",draft.id);
      }
      await loadDraft();
    };

    const pickAthlete=async(name)=>{
      if(!isMyTurn)return;
      const ng=(draftGroups||[[],[],[],[]]).map(g=>[...g]);
      ng[myLeaderIdx].push(name);
      const newAvailable=available.filter(n=>n!==name);
      const newPickIdx=pickIdx+1;
      const done=newPickIdx>=pickSeq.length||newAvailable.length===0;
      await supabase.from("draft").update({
        groups:ng,
        phase:done?"locked":"draft",
        locked:done,
      }).eq("id",draft.id);
      if(done){
        for(let i=0;i<ng.length;i++){
          for(const n of ng[i]){
            const ath=athletes.find(a=>a.name===n);
            if(ath)await supabase.from("athletes").update({group_idx:i,tier:draftTiers[i]}).eq("id",ath.id);
          }
          const leader=athletes.find(a=>a.name===draftLeaders[i]);
          if(leader)await supabase.from("athletes").update({group_idx:i,tier:draftTiers[i],bracelet:draftBracelets[i]?.ref}).eq("id",leader.id);
        }
      }
      await loadDraft();
    };

    return(
      <>
        <Head><title>{selectedAthlete.name} — TF College Group</title></Head>
        <div style={{minHeight:"100vh",background:"#f5f5f5",fontFamily:"Georgia, serif",maxWidth:480,margin:"0 auto"}}>
          <div style={{background:BG,padding:"1rem 1.25rem 0"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <button onClick={()=>setScreen("roster")} style={{background:"transparent",border:"none",color:"#666",fontSize:13,cursor:"pointer",fontFamily:"Georgia, serif"}}>← Sign out</button>
              <div style={{fontSize:12,color:"#555"}}>TF College Group</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
             <div style={{width:50,height:50,borderRadius:"50%",background:isForge?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:500,color:"#fff",flexShrink:0,overflow:"hidden"}}>
                {selectedAthlete.photo_url?<img src={selectedAthlete.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:selectedAthlete.name[0]}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:18,fontWeight:400,color:"#fff"}}>{selectedAthlete.name}</div>
                <div style={{fontSize:12,color:"#888"}}>{selectedAthlete.sport}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:11,fontWeight:500,color:isForge?RED:STEEL,textTransform:"uppercase",letterSpacing:"0.06em"}}>{isForge?"The Forge":"The Iron"}</div>
                {streak>0&&<div style={{fontSize:11,color:GREEN,marginTop:2}}>🔥 {streak} day streak</div>}
              </div>
            </div>
            <div style={{display:"flex",overflowX:"auto"}}>
              {TABS.map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 14px",background:"transparent",border:"none",borderBottom:"2px solid "+(tab===t.id?"#fff":"transparent"),color:tab===t.id?"#fff":"#555",fontSize:13,fontWeight:tab===t.id?500:400,cursor:"pointer",fontFamily:"Georgia, serif",whiteSpace:"nowrap"}}>{t.label}</button>
              ))}
            </div>
          </div>

          <div style={{padding:"1.25rem"}}>

            {tab==="profile"&&(
              <div>
                {/* Day schedule — always shows */}
                {(()=>{
                  const _days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
                  const _day=_days[new Date().getDay()];
                  const _classDays=["Mon","Tue","Thu","Fri"];
                  const _isClassDay=_classDays.includes(_day);
                  if(!_isClassDay) return(
                    <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
                      <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:4}}>No class today</div>
                      <div style={{fontSize:12,color:"#888"}}>Class days are Monday, Tuesday, Thursday & Friday. Rest up and come back ready.</div>
                    </div>
                  );
                  const _items=[
                    ...(_day==="Mon"?[{time:"9:00am",label:"Mindset Monday",detail:"Pre-class · mindset session with Coach Ant & Kevin",color:GOLD,dur:"30 min"}]:[]),
                    ...(_day==="Fri"?[{time:"9:00am",label:"Fellowship Friday",detail:"Pre-class · devotional & discussion with Coach Ant",color:PUR,dur:"30 min"}]:[]),
                    {time:"9:30am",label:"Stretch & mobility",detail:"10 min · dynamic stretching · all athletes together",color:GREEN,dur:"10 min"},
                    {time:"9:40am",label:"Run",detail:"40–50 min · all 4 groups · hand positions enforced · leaders set pace",color:"#854F0B",dur:"40–50 min"},
                    {time:"10:30am",label:"Weight room",detail:"30–50 min · groups by tier",color:PUR,dur:"30–50 min"},
                    {time:"11:15am",label:"Closeout & prayer",detail:"5 min · all together · coach or athlete prays",color:RED,dur:"5 min"},
                  ];
                  return(
                    <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
                      <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Class flow — 2 hours · done by 11:20am</div>
                      {_items.map((s,i,arr)=>(
                        <div key={i} style={{display:"flex",gap:12,padding:"8px 0",borderBottom:i<arr.length-1?"0.5px solid #f0f0f0":"none"}}>
                          <div style={{minWidth:56,fontSize:12,color:"#888",paddingTop:2}}>{s.time}</div>
                          <div style={{minWidth:8,display:"flex",flexDirection:"column",alignItems:"center"}}>
                            <div style={{width:8,height:8,borderRadius:"50%",background:s.color,marginTop:4,flexShrink:0}}/>
                            {i<arr.length-1&&<div style={{width:1,flex:1,background:"#e0e0e0",marginTop:3}}/>}
                          </div>
                          <div style={{flex:1}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                              <span style={{fontSize:13,fontWeight:500,color:"#1a1a1a"}}>{s.label}</span>
                              <span style={{fontSize:11,background:"#f5f5f5",color:"#888",padding:"1px 7px",borderRadius:5}}>{s.dur}</span>
                            </div>
                            <div style={{fontSize:12,color:"#888"}}>{s.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                {announcement&&(
                  <div style={{background:"#1a1a2a",border:"0.5px solid "+PUR+"66",borderRadius:12,padding:"12px 16px",marginBottom:12}}>
                    <div style={{fontSize:10,color:PUR,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>This week from Coach Ant</div>
                    <div style={{fontSize:13,color:"#fff",lineHeight:1.6}}>{announcement.message}</div>
                  </div>
                )}
                {bracelet&&(
                  <div style={{background:BG,borderRadius:12,padding:"1rem",marginBottom:12,border:"0.5px solid "+bracelet.hex+"44"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <div style={{width:10,height:10,borderRadius:"50%",background:bracelet.hex}}/>
                      <span style={{fontSize:11,fontWeight:500,color:bracelet.hex,textTransform:"uppercase",letterSpacing:"0.05em"}}>{bracelet.color} · {bracelet.ref}</span>
                    </div>
                    <div style={{fontSize:14,color:"#fff",fontStyle:"italic",lineHeight:1.7}}>"{bracelet.text}"</div>
                  </div>
                )}
                {streak>0&&(
                  <div style={{background:"#0a1f0a",borderRadius:12,padding:"12px 16px",marginBottom:12,border:"0.5px solid "+GREEN+"44",display:"flex",alignItems:"center",gap:12}}>
                    <div style={{fontSize:28}}>🔥</div>
                    <div>
                      <div style={{fontSize:16,fontWeight:500,color:GREEN}}>{streak} day early streak</div>
                      <div style={{fontSize:12,color:"#888"}}>Keep showing up early.</div>
                    </div>
                  </div>
                )}
                {anvilWinner&&(
                  <div style={{background:"#1f1700",borderRadius:12,padding:"12px 16px",marginBottom:12,border:"0.5px solid "+GOLD+"44",display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:GOLD,flexShrink:0}}/>
                    <div>
                      <div style={{fontSize:10,color:GOLD,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>This week's Anvil</div>
                      <div style={{fontSize:14,fontWeight:500,color:GOLD}}>{anvilWinner.athlete_name}</div>
                    </div>
                  </div>
                )}
                {[{label:"Athletic goal",goalKey:"athletic_goal",taskKey:"coach_athletic_task",color:GREEN},{label:"Character goal",goalKey:"character_goal",taskKey:"coach_character_task",color:PUR}].map(({label,goalKey,taskKey,color})=>(
                  <div key={goalKey} style={{background:"#fff",borderRadius:12,padding:"1rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
                    <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>{label}</div>
                    <textarea defaultValue={selectedAthlete[goalKey]||""} onBlur={async e=>{const val=e.target.value;setSelectedAthlete(a=>({...a,[goalKey]:val}));await supabase.from("athletes").update({[goalKey]:val}).eq("id",selectedAthlete.id);}} placeholder="What's one thing you want to improve this summer?" style={{width:"100%",minHeight:60,padding:"8px",fontSize:13,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia, serif",resize:"vertical",boxSizing:"border-box",marginBottom:6}}/>
              <button onClick={async e=>{const ta=e.target.previousSibling;const val=ta.value;setSelectedAthlete(a=>({...a,[goalKey]:val}));await supabase.from("athletes").update({[goalKey]:val}).eq("id",selectedAthlete.id);alert("Goal saved!");}} style={{padding:"6px 14px",borderRadius:8,border:"none",background:color,color:"#fff",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>Save goal →</button>
                    {selectedAthlete[taskKey]&&(
                      <div style={{marginTop:10,padding:"10px 12px",background:BG,borderRadius:8,borderLeft:"3px solid "+color}}>
                        <div style={{fontSize:11,fontWeight:500,color:color,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5}}>Task from Coach Ant</div>
                        <div style={{fontSize:13,color:"#ccc",lineHeight:1.6}}>{selectedAthlete[taskKey]}</div>
                      </div>
                    )}
                  </div>
                ))}

                <div style={{background:"#fff",borderRadius:12,border:"0.5px solid #e0e0e0",overflow:"hidden",marginBottom:12}}>
                  <button onClick={()=>setInjuryOpen(o=>!o)} style={{width:"100%",padding:"12px 16px",background:"transparent",border:"none",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",fontFamily:"Georgia, serif"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:selectedAthlete.injury?RED:GREEN}}/>
                      <span style={{fontSize:13,fontWeight:500,color:"#1a1a1a"}}>Injury / health update</span>
                    </div>
                    <span style={{fontSize:12,color:"#888"}}>{injuryOpen?"▲":"▼"}</span>
                  </button>
                  {injuryOpen&&(
                    <div style={{padding:"0 16px 16px"}}>
                      <textarea value={injuryText} onChange={e=>setInjuryText(e.target.value)} placeholder="What's going on — what hurts, when it started..." style={{width:"100%",minHeight:80,padding:"8px",fontSize:13,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia, serif",resize:"vertical",marginBottom:8,boxSizing:"border-box"}}/>
                      {injurySent?<div style={{fontSize:13,color:GREEN,fontWeight:500,padding:"8px 10px",background:"#EAF3DE",borderRadius:8}}>Coach Ant has been notified.</div>
                      :<button onClick={sendInjury} style={{padding:"8px 16px",borderRadius:8,border:"0.5px solid "+RED,background:"transparent",color:RED,fontSize:13,cursor:"pointer",fontFamily:"Georgia, serif"}}>Notify Coach Ant</button>}
                    </div>
                  )}
                </div>
              </div>
            )}

{tab==="polar"&&(
              <div>
                <div style={{background:"#fff",borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid #e0e0e0"}}>
                  <div style={{fontSize:32,marginBottom:12}}>⚡</div>
                  <div style={{fontSize:15,fontWeight:500,color:"#1a1a1a",marginBottom:8}}>Polar Integration</div>
                  <div style={{fontSize:13,color:"#888",lineHeight:1.7}}>We are working with Polar to get your class data syncing automatically. Check back soon!</div>
                </div>
              </div>
            )}

            {tab==="vitruve"&&(
              <div>
                <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid #1a1a1a"}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:4}}>Vitruve — Velocity Based Training</div>
                  <div style={{fontSize:12,color:"#888",marginBottom:12}}>Your bar speed and load data from the Vitruve encoder.</div>
                </div>
                <VitruveData athleteId={selectedAthlete.id} athleteName={selectedAthlete.name} vitruveId={selectedAthlete.vitruve_id}/>
              </div>
            )}
            {tab==="draft"&&isForge&&(
              <div>
                {!draft&&(
                  <div style={{background:BG,borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid #222"}}>
                    <div style={{fontSize:32,marginBottom:12}}>⏳</div>
                    <div style={{fontSize:16,color:"#fff",marginBottom:8}}>Waiting for Coach Ant to start the draft...</div>
                    <div style={{fontSize:13,color:"#555"}}>Once leaders are generated you'll see your draft options here.</div>
                  </div>
                )}

                {draft&&draftPhase==="bracelet"&&myLeaderIdx>=0&&!myBraceletPicked&&(
                  <div>
                    <div style={{background:BG,borderRadius:12,padding:"1rem",marginBottom:12,border:"2px solid "+GOLD}}>
                      <div style={{fontSize:11,color:GOLD,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Step 1 — Pick your bracelet</div>
                      <div style={{fontSize:14,color:"#fff"}}>Choose your verse for the week. First come first served.</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {BRACELETS.map(b=>{
                        const taken=takenBracelets.includes(b.ref);
                        return(
                          <button key={b.ref} disabled={taken} onClick={()=>pickBracelet(b)} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderRadius:12,border:"0.5px solid "+(taken?"#222":b.hex),background:taken?"#111":"#141414",cursor:taken?"not-allowed":"pointer",fontFamily:"Georgia,serif",opacity:taken?0.4:1}}>
                            <div style={{width:14,height:14,borderRadius:"50%",background:b.hex,flexShrink:0}}/>
                            <div style={{textAlign:"left",flex:1}}>
                              <div style={{fontSize:13,fontWeight:500,color:taken?"#555":"#fff"}}>{b.color}</div>
                              <div style={{fontSize:11,color:taken?"#444":"#888"}}>{b.ref} — {b.text}</div>
                            </div>
                            {taken&&<span style={{fontSize:10,color:"#444"}}>Taken</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {draft&&draftPhase==="bracelet"&&myLeaderIdx>=0&&myBraceletPicked&&(
                  <div style={{background:BG,borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid "+GOLD+"44"}}>
                    <div style={{fontSize:32,marginBottom:12}}>✓</div>
                    <div style={{fontSize:16,color:GOLD,fontWeight:500,marginBottom:8}}>Bracelet picked!</div>
                    <div style={{fontSize:13,color:"#888",marginBottom:16}}>Waiting for other leaders...</div>
                    <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}>
                      <div style={{width:10,height:10,borderRadius:"50%",background:BRACELETS.find(b=>b.ref===myBraceletPicked.ref)?.hex}}/>
                      <span style={{fontSize:13,color:"#fff"}}>{myBraceletPicked.color} — {myBraceletPicked.ref}</span>
                    </div>
                  </div>
                )}

                {draft&&draftPhase==="draft"&&myLeaderIdx>=0&&(
                  <div>
                    {isMyTurn?(
                      <div>
                        <CountdownPicker onTimeout={()=>{
                          if(available.length>0)pickAthlete(available[0]);
                        }}/>
                        <div style={{display:"flex",flexDirection:"column",gap:8}}>
                          {available.map(name=>(
                            <button key={name} onClick={()=>pickAthlete(name)} style={{padding:"14px 18px",borderRadius:12,border:"0.5px solid "+LC[myLeaderIdx],background:LB[myLeaderIdx],color:"#1a1a1a",cursor:"pointer",fontSize:14,fontWeight:500,textAlign:"left",fontFamily:"Georgia,serif"}}>
                              {name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ):(
                      <div style={{background:BG,borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid #222"}}>
                        <div style={{fontSize:32,marginBottom:12}}>⏳</div>
                        <div style={{fontSize:16,color:"#fff",marginBottom:8}}>Waiting for {draftLeaders[currentPickerIdx]} to pick...</div>
                        <div style={{fontSize:13,color:"#555"}}>Auto-refreshing every 3 seconds</div>
                      </div>
                    )}
                    <div style={{marginTop:12,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      {[0,1,2,3].map(i=>(
                        <div key={i} style={{background:LB[i],borderRadius:10,padding:"8px 10px",border:"0.5px solid "+LC[i]+"44"}}>
                          <div style={{fontSize:11,fontWeight:500,color:LC[i],marginBottom:4}}>{draftLeaders[i]}{i===myLeaderIdx?" (you)":""}</div>
                          {(draftGroups[i]||[]).map(n=><div key={n} style={{fontSize:11,color:"#555",padding:"2px 0"}}>{n}</div>)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {draft&&(draftPhase==="locked"||draftComplete)&&myLeaderIdx>=0&&(
                  <div>
                    <div style={{background:"#0a1f0a",borderRadius:12,padding:"1rem",marginBottom:12,border:"0.5px solid "+GREEN+"44",textAlign:"center"}}>
                      <div style={{fontSize:16,color:GREEN,fontWeight:500,marginBottom:4}}>Draft complete ✓</div>
                      <div style={{fontSize:13,color:"#888"}}>Groups are locked for the week.</div>
                    </div>
                    {myLeaderIdx>=0&&(()=>{
                      const myBrac=BRACELETS.find(b=>b.ref===draftBracelets[myLeaderIdx]?.ref);
                      const myTd=TIER_COLORS[draftTiers[myLeaderIdx]];
                      return(
                        <div style={{background:LB[myLeaderIdx],borderRadius:14,padding:"1.25rem",marginBottom:12,border:"2px solid "+LC[myLeaderIdx]}}>
                          <div style={{fontSize:11,color:LC[myLeaderIdx],textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Your group</div>
                          {myBrac&&(
                            <div style={{marginBottom:12}}>
                              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                                <div style={{width:14,height:14,borderRadius:"50%",background:myBrac.hex}}/>
                                <span style={{fontSize:13,fontWeight:600,color:LC[myLeaderIdx]}}>{myBrac.color} — {myBrac.ref}</span>
                              </div>
                              <div style={{fontSize:14,color:"#1a1a1a",fontStyle:"italic",lineHeight:1.7,padding:"10px 12px",background:"rgba(255,255,255,0.6)",borderRadius:8,borderLeft:"3px solid "+myBrac.hex}}>
                                "{myBrac.text}"
                              </div>
                            </div>
                          )}
                          {myTd&&<div style={{display:"inline-block",fontSize:11,fontWeight:500,padding:"3px 12px",borderRadius:6,background:myTd.bg,color:myTd.color,marginBottom:10}}>{myTd.label}</div>}
                          <div style={{fontSize:11,fontWeight:500,color:LC[myLeaderIdx],textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:8}}>Your team</div>
                          <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"rgba(255,255,255,0.7)",borderRadius:8,marginBottom:4}}>
                            <div style={{width:28,height:28,borderRadius:"50%",background:LC[myLeaderIdx],display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:"#fff"}}>{selectedAthlete.name[0]}</div>
                            <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a"}}>{selectedAthlete.name} <span style={{fontSize:11,color:LC[myLeaderIdx]}}>— Leader</span></div>
                          </div>
                          {(draftGroups[myLeaderIdx]||[]).map(n=>(
                            <div key={n} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"rgba(255,255,255,0.7)",borderRadius:8,marginBottom:4}}>
                              <div style={{width:28,height:28,borderRadius:"50%",background:"#888",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:"#fff"}}>{n[0]}</div>
                              <div style={{fontSize:13,color:"#1a1a1a"}}>{n}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                    <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>All groups</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      {[0,1,2,3].map(i=>{
                        const brac=BRACELETS.find(b=>b.ref===draftBracelets[i]?.ref);
                        return(
                          <div key={i} style={{background:i===myLeaderIdx?LB[i]:"#fff",borderRadius:12,padding:"10px",border:"0.5px solid "+(i===myLeaderIdx?LC[i]:"#e0e0e0"),borderTop:"3px solid "+(i===myLeaderIdx?LC[i]:"#e0e0e0")}}>
                            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                              {brac&&<div style={{width:8,height:8,borderRadius:"50%",background:brac.hex}}/>}
                              <span style={{fontSize:12,fontWeight:500,color:i===myLeaderIdx?LC[i]:"#1a1a1a"}}>{draftLeaders[i]}{i===myLeaderIdx?" ✓":""}</span>
                            </div>
                            {brac&&<div style={{fontSize:10,color:"#888",fontStyle:"italic",marginBottom:4}}>"{brac.text}"</div>}
                            {(draftGroups[i]||[]).map(n=><div key={n} style={{fontSize:11,color:"#555",padding:"2px 0"}}>{n}</div>)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab==="mygroup"&&!isForge&&(
              <div>
                {!draft||draftPhase==="setup"||(myGroupIdx==null&&draftPhase!=="locked")?(
                  <div style={{background:BG,borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid #222"}}>
                    <div style={{fontSize:32,marginBottom:12}}>⏳</div>
                    <div style={{fontSize:16,fontWeight:400,color:"#fff",marginBottom:8}}>
                      {draftPhase==="bracelet"?"Leaders are picking bracelets...":draftPhase==="draft"?"Draft is live — waiting to be picked...":"Draft pending..."}
                    </div>
                    <div style={{fontSize:13,color:"#555",lineHeight:1.7}}>You'll see your group, leader, bracelet verse, and tier right here once you've been picked.</div>
                  </div>
                ):(
                  <div>
                    {myLeader&&(
                      <div style={{background:LB[myGroupIdx]||"#f5f5f5",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"2px solid "+(LC[myGroupIdx]||PUR)}}>
                        <div style={{fontSize:11,color:LC[myGroupIdx]||PUR,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Your group</div>
                        <div style={{fontSize:18,fontWeight:500,color:"#1a1a1a",marginBottom:4}}>{myLeader}</div>
                        <div style={{fontSize:12,color:"#888",marginBottom:12}}>Your leader this week</div>
                        {myBracelet&&(
                          <div style={{marginBottom:12}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                              <div style={{width:10,height:10,borderRadius:"50%",background:myBracelet.hex}}/>
                              <span style={{fontSize:12,fontWeight:500,color:myBracelet.hex}}>{myBracelet.color} — {myBracelet.ref}</span>
                            </div>
                            <div style={{fontSize:14,color:"#1a1a1a",fontStyle:"italic",lineHeight:1.7,padding:"10px 12px",background:"rgba(255,255,255,0.6)",borderRadius:8,borderLeft:"3px solid "+myBracelet.hex}}>
                              "{myBracelet.text}"
                            </div>
                          </div>
                        )}
                        {myTier&&<div style={{fontSize:11,fontWeight:500,color:TIER_COLORS[myTier]?.color||"#888",background:TIER_COLORS[myTier]?.bg||"#f5f5f5",display:"inline-block",padding:"2px 10px",borderRadius:6,marginBottom:10}}>Tier {myTier}</div>}
                        {myGroup&&myGroup.length>0&&(
                          <div>
                            <div style={{fontSize:11,fontWeight:500,color:LC[myGroupIdx]||PUR,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:6}}>Your teammates</div>
                            {myGroup.map(name=>(
                              <div key={name} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"rgba(255,255,255,0.7)",borderRadius:8,marginBottom:4}}>
                                <div style={{width:28,height:28,borderRadius:"50%",background:"#888",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:"#fff"}}>{name[0]}</div>
                                <div style={{fontSize:13,color:"#1a1a1a"}}>{name}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            
            
            {tab==="prayer"&&<PrayerWall athleteId={selectedAthlete.id} athleteName={selectedAthlete.name}/>}

            {tab==="leaderboard"&&<AthleteLeaderboard athleteId={selectedAthlete.id}/>}

            {tab==="bracelets"&&<BraceletWall athleteBracelet={selectedAthlete.bracelet}/>}

            {tab==="notes"&&<NotesTab athleteId={selectedAthlete.id} athlete={selectedAthlete}/>}


            {tab==="weight"&&<WeightTracker athleteId={selectedAthlete.id}/>}

            {tab==="goals"&&<GoalsCountdown athlete={selectedAthlete}/>}

            {tab==="verse"&&<VerseOfDay/>}

            {tab==="anvil"&&<AnvilHistory/>}

            {tab==="photos"&&<GroupPhotos/>}


            {tab==="journey"&&(
              <div>
                <div style={{background:BG,borderRadius:12,padding:"1.25rem",marginBottom:12,textAlign:"center"}}>
                  <div style={{fontSize:15,color:"#ccc",fontStyle:"italic",lineHeight:1.7}}>"As iron sharpens iron, so one person sharpens another."</div>
                  <div style={{fontSize:12,color:"#444",marginTop:6}}>— Proverbs 27:17</div>
                </div>
                {[
                  {title:"The Iron",color:STEEL,bg:"#1a1e20",border:"#2a3035",isYou:!isForge,body:"Every athlete enters as The Iron. Raw. Unfinished. Full of potential but not yet fully shaped.",call:"Show up early. Work hard. Hold the standard."},
                  {title:"The Forge",color:RED,bg:"#200a0a",border:"#5a1a1a",isYou:isForge,body:"The Forge is called up for the week. They set the pace, lead the group, hold the standard.",call:"Lead by example before you lead by voice."},
                  {title:"The Anvil",color:GOLD,bg:"#1f1700",border:"#5a4500",isYou:false,body:"The Anvil is the highest individual honor in TF College Group. It cannot be drafted. It can only be earned.",call:"You do not chase the Anvil. You become the kind of person who earns it."},
                ].map((item,i)=>(
                  <div key={i} style={{background:item.bg,borderRadius:12,padding:"1.25rem",marginBottom:10,border:"0.5px solid "+item.border}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                      <div style={{width:10,height:10,borderRadius:"50%",background:item.color}}/>
                      <div style={{fontSize:18,fontWeight:400,color:item.color}}>{item.title}</div>
                      {item.isYou&&<span style={{fontSize:11,background:item.color,color:"#1a1a1a",padding:"2px 8px",borderRadius:5,fontWeight:500}}>You are here</span>}
                    </div>
                    <div style={{fontSize:13,color:"#999",lineHeight:1.75,marginBottom:10}}>{item.body}</div>
                    <div style={{fontSize:12,color:item.color,fontStyle:"italic"}}>{item.call}</div>
                  </div>
                ))}
              </div>
            )}

            {tab==="private"&&(
              <div>
                <div style={{fontSize:13,color:"#888",lineHeight:1.7,marginBottom:14}}>This is your private line to Coach Ant. Nobody else sees what you send here.</div>
                <div style={{background:"#fff",borderRadius:12,padding:"1rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
                  <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>Message Coach Ant</div>
                  {feedbackSent?<div style={{fontSize:13,color:GREEN,fontWeight:500,padding:"10px",background:"#EAF3DE",borderRadius:8}}>Message sent to Coach Ant.</div>:(
                    <><textarea value={feedbackText} onChange={e=>setFeedbackText(e.target.value)} placeholder="Type your message to Coach Ant..." style={{width:"100%",minHeight:90,padding:"8px",fontSize:13,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia, serif",resize:"vertical",marginBottom:8,boxSizing:"border-box"}}/><button onClick={sendFeedback} style={{padding:"10px 20px",borderRadius:8,border:"none",background:PUR,color:"#fff",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"Georgia, serif"}}>Send to Coach Ant</button></>
                  )}
                </div>
                <div style={{background:BG,borderRadius:12,padding:"1rem",border:"0.5px solid #2a2a2a"}}>
                  <div style={{fontSize:13,fontWeight:500,color:"#fff",marginBottom:4}}>Prayer request</div>
                  {prayerSent?<div style={{fontSize:13,color:"#58B368",fontWeight:500,padding:"10px",background:"#0d1f0f",borderRadius:8}}>Your request has been received.</div>:(
                    <><textarea value={prayerText} onChange={e=>setPrayerText(e.target.value)} placeholder="Share your prayer request here..." style={{width:"100%",minHeight:90,padding:"8px",fontSize:13,border:"0.5px solid #333",borderRadius:8,background:"#242424",color:"#fff",fontFamily:"Georgia, serif",resize:"vertical",marginBottom:8,boxSizing:"border-box"}}/><button onClick={sendPrayer} style={{padding:"10px 20px",borderRadius:8,border:"0.5px solid #58B368",background:"transparent",color:"#58B368",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"Georgia, serif"}}>Submit prayer request</button></>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }
  return null;
}
