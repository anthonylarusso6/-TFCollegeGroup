import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { GOLD, GREEN, RED } from "../lib/constants";
import Icon from "./Icon";
import { isFemale } from "../lib/teams";

const epley=(w,r)=>r===1?w:Math.round(w*(1+r/30));
const getCatIR=(name)=>{
  const n=(name||"").toLowerCase();
  if(n.includes("deadlift")||n.includes(" clean")||n.includes("snatch")||n.includes("swing")||n.includes("rdl")||n.includes("hinge"))return "hinge";
  if(n.includes("squat")||n.includes("lunge")||n.includes("step up"))return "lower";
  if(n.includes("bench")||n.includes("press")||n.includes("push")||n.includes("dip")||n.includes("jerk"))return "push";
  if(n.includes("pull")||n.includes("row")||n.includes("curl"))return "pull";
  return null;
};
const CATS=[
  {id:"lower",label:"Lower Body",emoji:"🦵"},
  {id:"push",label:"Push",emoji:"💪"},
  {id:"pull",label:"Pull",emoji:"🤜"},
  {id:"hinge",label:"Hinge",emoji:"⛓️"},
];

export default function IronRoomTab({athletes=[]}){
  const[ironRoomData,setIronRoomData]=useState(null);
  const[ironRoomLoading,setIronRoomLoading]=useState(false);
  const[ironRoomGender,setIronRoomGender]=useState("M");

  const loadIronRoom=async()=>{
    setIronRoomLoading(true);
    try{
      const{data}=await supabase.from("pr_log").select("athlete_id,lift,weight,reps,date");
      setIronRoomData(data||[]);
    }catch(e){setIronRoomData([]);}
    setIronRoomLoading(false);
  };
  useEffect(()=>{loadIronRoom();},[]);

  const filteredAthletes=athletes.filter(a=>a.status==="active"&&(ironRoomGender==="M"?!isFemale(a.gender):isFemale(a.gender)));
  const athMap={};
  filteredAthletes.forEach(a=>{athMap[a.id]=a;});
  // Build best est1RM per athlete per category
  const catBests={};
  CATS.forEach(c=>{catBests[c.id]={};});
  if(ironRoomData){
    ironRoomData.forEach(row=>{
      if(!athMap[row.athlete_id])return;
      const cat=getCatIR(row.lift);
      if(!cat)return;
      const e1rm=epley(Number(row.weight)||0,Number(row.reps)||1);
      if(!catBests[cat][row.athlete_id]||e1rm>catBests[cat][row.athlete_id].e1rm){
        catBests[cat][row.athlete_id]={e1rm,lift:row.lift,date:row.date};
      }
    });
  }
  return(
    <div>
      <div style={{borderRadius:20,marginBottom:16,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+GOLD+"33"}}>
        <div style={{background:"linear-gradient(140deg,"+GOLD+"28,"+GOLD+"0a,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GOLD+","+GOLD+"44,transparent)"}}/>
          <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.07,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="barbell" size={66} color="#fff"/></div>
          <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
            <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+GOLD+"44,"+GOLD+"22)",border:"1px solid "+GOLD+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>🏋️</div>
            <div style={{flex:1}}>
              <div style={{fontSize:8,color:GOLD,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Leaderboard</div>
              <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Iron Room</div>
              <div style={{fontSize:11,color:"#666",marginTop:1}}>PR leaderboard by movement category</div>
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              {["M","F"].map(g=>(
                <button key={g} onClick={()=>setIronRoomGender(g)} style={{padding:"6px 14px",borderRadius:10,border:"1px solid "+(ironRoomGender===g?GOLD+"88":"#2a2a2a"),background:ironRoomGender===g?GOLD+"22":"transparent",color:ironRoomGender===g?GOLD:"#555",fontSize:11,fontWeight:ironRoomGender===g?700:400,cursor:"pointer",fontFamily:"Georgia,serif",transition:"all 0.15s"}}>{g==="M"?"Men":"Women"}</button>
              ))}
              <button onClick={()=>{setIronRoomData(null);loadIronRoom();}} style={{padding:"6px 10px",borderRadius:10,border:"1px solid #222",background:"transparent",color:"#555",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>{ironRoomLoading?"...":"↻"}</button>
            </div>
          </div>
        </div>
      </div>
      {ironRoomLoading&&(
        <div style={{textAlign:"center",padding:"40px",color:"#555",fontSize:13}}>Loading...</div>
      )}
      {!ironRoomLoading&&ironRoomData!==null&&CATS.map(cat=>{
        const entries=Object.entries(catBests[cat.id])
          .map(([aid,v])=>({athlete:athMap[aid],e1rm:v.e1rm,lift:v.lift,date:v.date}))
          .filter(e=>e.athlete&&e.e1rm>0)
          .sort((a,b)=>b.e1rm-a.e1rm);
        return(
          <div key={cat.id} style={{marginBottom:16,borderRadius:16,overflow:"hidden",border:"1px solid #1e1e1e",background:"#111"}}>
            <div style={{padding:"12px 16px",background:"linear-gradient(135deg,#161616,#111)",borderBottom:"1px solid #1e1e1e",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:20}}>{cat.emoji}</span>
              <span style={{fontSize:14,fontWeight:800,color:"#ddd",textTransform:"uppercase",letterSpacing:"0.08em"}}>{cat.label}</span>
              <span style={{fontSize:11,color:"#444",marginLeft:"auto"}}>{entries.length} athlete{entries.length!==1?"s":""}</span>
            </div>
            {entries.length===0?(
              <div style={{padding:"20px 16px",textAlign:"center",color:"#444",fontSize:12,fontStyle:"italic"}}>No data yet</div>
            ):(
              <div>
                {entries.map((e,i)=>{
                  const rank=i+1;
                  const medal=rank===1?"🥇":rank===2?"🥈":rank===3?"🥉":null;
                  const history=(ironRoomData||[]).filter(r=>r.athlete_id===e.athlete.id&&r.lift===e.lift).sort((a,b)=>new Date(a.date)-new Date(b.date));
                  const orms=history.map(r=>epley(Number(r.weight)||0,Number(r.reps)||1));
                  const oMin=orms.length?Math.min(...orms):0;
                  const oMax=orms.length?Math.max(...orms)+1:1;
                  const sW=48,sH=18;
                  const sparkPts=orms.map((o,si)=>{const x=(si/(Math.max(orms.length-1,1)))*sW;const y=sH-((o-oMin)/(Math.max(oMax-oMin,1)))*sH;return`${x},${y}`;}).join(" ");
                  const sparkColor=orms.length>=2&&orms[orms.length-1]>orms[0]?GREEN:orms.length>=2&&orms[orms.length-1]<orms[0]?RED:"#555";
                  return(
                    <div key={e.athlete.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderBottom:i<entries.length-1?"0.5px solid #1a1a1a":"none",background:rank===1?GOLD+"08":"transparent"}}>
                      <div style={{width:28,textAlign:"center",flexShrink:0}}>
                        {medal?<span style={{fontSize:16}}>{medal}</span>:<span style={{fontSize:12,color:"#444",fontWeight:600}}>{rank}</span>}
                      </div>
                      <div style={{width:32,height:32,borderRadius:"50%",background:e.athlete.role==="forge"?"#C0392B":"#708090",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",flexShrink:0,overflow:"hidden"}}>
                        {e.athlete.photo_url?<img src={e.athlete.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(e.athlete.name||"?")[0]}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,color:rank===1?GOLD:"#ccc",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.athlete.name}</div>
                        <div style={{fontSize:10,color:"#555",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.lift}</div>
                      </div>
                      {orms.length>=2&&(
                        <svg viewBox={`0 0 ${sW} ${sH}`} style={{width:sW,height:sH,flexShrink:0}}>
                          <polyline points={sparkPts} fill="none" stroke={sparkColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          {orms.map((o,si)=>{const x=(si/(Math.max(orms.length-1,1)))*sW;const y=sH-((o-oMin)/(Math.max(oMax-oMin,1)))*sH;return<circle key={si} cx={x} cy={y} r={si===orms.length-1?2.5:1.5} fill={si===orms.length-1?"#fff":sparkColor}/>;
                          })}
                        </svg>
                      )}
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontSize:15,fontWeight:900,color:rank===1?GOLD:"#bbb"}}>{e.e1rm}<span style={{fontSize:10,color:"#555",fontWeight:400}}>lb</span></div>
                        <div style={{fontSize:9,color:"#444"}}>{e.date||"—"}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      {!ironRoomLoading&&ironRoomData!==null&&filteredAthletes.length===0&&(
        <div style={{textAlign:"center",padding:"32px",color:"#555",fontSize:12,fontStyle:"italic"}}>No {ironRoomGender==="M"?"male":"female"} athletes found.</div>
      )}
    </div>
  );
}
