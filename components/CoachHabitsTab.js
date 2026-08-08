import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { nowEST } from "../lib/dates";
import Icon from "./Icon";
import { RED, GREEN, GOLD, STEEL } from "../lib/constants";

export default function HabitsTab({athletes=[]}){
  const[habitLogs,setHabitLogs]=useState(null);
  const[habitLoading,setHabitLoading]=useState(false);
  const[habitExpanded,setHabitExpanded]=useState(null);

  const loadHabitLogs=async()=>{
    setHabitLoading(true);
    try{
      const est=nowEST();
      const oldest=new Date(est);
      oldest.setDate(est.getDate()-30);
      const oldestStr=oldest.getFullYear()+"-"+String(oldest.getMonth()+1).padStart(2,"0")+"-"+String(oldest.getDate()).padStart(2,"0");
      const{data,error}=await supabase.from("announcements").select("day,week_label,message").eq("type","habit_log").gte("week_label",oldestStr);
      if(!error)setHabitLogs(data||[]);
      else setHabitLogs([]);
    }catch(e){setHabitLogs([]);}
    setHabitLoading(false);
  };

  useEffect(()=>{loadHabitLogs();},[]);

  const estNow=nowEST();
  const todayHab=estNow.getFullYear()+"-"+String(estNow.getMonth()+1).padStart(2,"0")+"-"+String(estNow.getDate()).padStart(2,"0");
  const getLast7=()=>{
    const days=[];
    for(let i=6;i>=0;i--){const d=new Date(estNow);d.setDate(estNow.getDate()-i);days.push(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"));}
    return days;
  };
  const last7=getLast7();
  const computeHabitStreak=(map)=>{
    let s=0;
    const c=new Date(estNow);
    const complete=(row)=>row&&row.water&&row.nutrition&&row.sleep!=null&&row.sleep>0;
    const todayKey=c.getFullYear()+"-"+String(c.getMonth()+1).padStart(2,"0")+"-"+String(c.getDate()).padStart(2,"0");
    // If today isn't logged yet, don't zero the streak — start counting from yesterday.
    if(!complete(map[todayKey]))c.setDate(c.getDate()-1);
    while(true){
      const k=c.getFullYear()+"-"+String(c.getMonth()+1).padStart(2,"0")+"-"+String(c.getDate()).padStart(2,"0");
      if(!complete(map[k]))break;
      s++;c.setDate(c.getDate()-1);
    }
    return s;
  };
  if(habitLoading||!habitLogs){return(<div style={{textAlign:"center",padding:"40px",color:"#555",fontSize:13}}>Loading habit data...</div>);}
  const athMaps={};
  (habitLogs||[]).forEach(r=>{
    const aid=r.day;
    if(!athMaps[aid])athMaps[aid]={};
    try{const d=JSON.parse(r.message||"{}");athMaps[aid][r.week_label]={water:d.water===true,nutrition:d.nutrition===true,sleep:typeof d.sleep==="number"?d.sleep:null};}catch(e){}
  });
  const ranked=athletes.filter(a=>a.status==="active").map(a=>{
    const map=athMaps[String(a.id)]||{};
    const streak=computeHabitStreak(map);
    const full7=last7.filter(d=>{const r=map[d];return r&&r.water&&r.nutrition&&r.sleep!=null&&r.sleep>0;}).length;
    return{...a,habitMap:map,streak,full7};
  }).sort((a,b)=>b.streak!==a.streak?b.streak-a.streak:b.full7-a.full7);
  return(
    <div>
      <div style={{borderRadius:20,marginBottom:16,overflow:"hidden",border:"1px solid "+GREEN+"33",boxShadow:"0 8px 32px #00000060"}}>
        <div style={{background:"linear-gradient(140deg,"+GREEN+"30,"+GREEN+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GREEN+","+GREEN+"44,transparent)"}}/>
          <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="droplet" size={66} color="#fff"/></div>
          <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
            <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+GREEN+"44,"+GREEN+"22)",border:"1px solid "+GREEN+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>💧</div>
            <div style={{flex:1}}>
              <div style={{fontSize:8,color:GREEN,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Daily Discipline</div>
              <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Habit Leaderboard</div>
              <div style={{fontSize:11,color:"#666",marginTop:1}}>Water · Nutrition · Sleep · Last 7 days</div>
            </div>
            <button onClick={()=>{setHabitLogs(null);loadHabitLogs();}} style={{padding:"6px 10px",borderRadius:10,border:"1px solid #222",background:"transparent",color:"#555",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>{habitLoading?"...":"↻"}</button>
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:12,marginBottom:12,fontSize:9,color:"#555",flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:4}}><span style={{color:GREEN,fontWeight:700}}>✓</span><span>All 3 done</span></div>
        <div style={{display:"flex",alignItems:"center",gap:4}}><span style={{color:GOLD,fontWeight:700}}>◐</span><span>Partial</span></div>
        <div style={{display:"flex",alignItems:"center",gap:4}}><span style={{color:"#333"}}>—</span><span>Not logged</span></div>
      </div>
      {ranked.map((a,i)=>{
        const rank=i+1;
        const medal=rank===1?"🥇":rank===2?"🥈":rank===3?"🥉":null;
        return(
          <div key={a.id} style={{background:"#111",borderRadius:14,marginBottom:8,border:"1px solid "+(a.streak>0?GREEN+"22":"#1a1a1a"),overflow:"hidden"}}>
            {a.streak>0&&<div style={{height:2,background:"linear-gradient(90deg,"+GREEN+","+GREEN+"22,transparent)"}}/>}
            <div style={{padding:"12px 14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,cursor:"pointer"}} onClick={()=>setHabitExpanded(habitExpanded===a.id?null:a.id)}>
                <div style={{width:26,textAlign:"center",flexShrink:0}}>
                  {medal?<span style={{fontSize:16}}>{medal}</span>:<span style={{fontSize:12,color:"#444",fontWeight:700}}>{rank}</span>}
                </div>
                <div style={{width:36,height:36,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff",flexShrink:0,overflow:"hidden",border:"1.5px solid "+(a.streak>0?GREEN+"44":"transparent")}}>
                  {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(a.name||"?")[0]}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name}</div>
                  <div style={{fontSize:10,color:"#555"}}>{a.sport||""}</div>
                </div>
                <div style={{flexShrink:0}}>
                  {a.streak>0?(
                    <div style={{display:"flex",alignItems:"center",gap:4,background:GREEN+"18",borderRadius:10,padding:"5px 10px",border:"1px solid "+GREEN+"33"}}>
                      <span style={{fontSize:13}}>🔥</span>
                      <span style={{fontSize:14,fontWeight:900,color:GREEN}}>{a.streak}</span>
                    </div>
                  ):(
                    <div style={{fontSize:11,color:"#333"}}>No streak</div>
                  )}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
                {last7.map(dateStr=>{
                  const row=a.habitMap[dateStr];
                  const isToday=dateStr===todayHab;
                  const waterOk=row&&row.water;
                  const nutOk=row&&row.nutrition;
                  const sleepOk=row&&row.sleep!=null&&row.sleep>0;
                  const allOk=waterOk&&nutOk&&sleepOk;
                  const partial=(waterOk||nutOk||sleepOk)&&!allOk;
                  const[,,dd]=dateStr.split("-");
                  const dayLetter=new Date(...dateStr.split("-").map((v,idx)=>idx===1?Number(v)-1:Number(v))).toLocaleDateString("en-US",{weekday:"short"}).slice(0,1);
                  return(
                    <div key={dateStr} style={{background:allOk?GREEN+"22":partial?GOLD+"18":"#0d0d0d",borderRadius:8,padding:"5px 2px",textAlign:"center",border:"1px solid "+(isToday?GOLD+"55":allOk?GREEN+"44":partial?GOLD+"33":"#1a1a1a")}}>
                      <div style={{fontSize:7,color:isToday?GOLD:"#444",textTransform:"uppercase",marginBottom:1}}>{dayLetter}</div>
                      <div style={{fontSize:9,color:isToday?GOLD:"#555",fontWeight:isToday?700:400}}>{parseInt(dd,10)}</div>
                      <div style={{fontSize:10,color:allOk?GREEN:partial?GOLD:"#333",fontWeight:700,marginTop:1}}>{allOk?"✓":partial?"◐":"—"}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{display:"flex",gap:8,marginTop:8}}>
                <div style={{flex:1,background:"#0d0d0d",borderRadius:8,padding:"6px 8px",textAlign:"center",border:"0.5px solid #1a1a1a"}}>
                  <div style={{fontSize:12,fontWeight:700,color:a.full7>0?GREEN:"#555"}}>{a.full7}<span style={{fontSize:9,fontWeight:400,color:"#444"}}>/7</span></div>
                  <div style={{fontSize:8,color:"#444",textTransform:"uppercase",letterSpacing:"0.04em"}}>Full days</div>
                </div>
                <div style={{flex:1,background:"#0d0d0d",borderRadius:8,padding:"6px 8px",textAlign:"center",border:"0.5px solid #1a1a1a"}}>
                  <div style={{fontSize:12,fontWeight:700,color:a.streak>0?GREEN:"#555"}}>{a.streak}<span style={{fontSize:9,fontWeight:400,color:"#444"}}>d</span></div>
                  <div style={{fontSize:8,color:"#444",textTransform:"uppercase",letterSpacing:"0.04em"}}>Streak</div>
                </div>
              </div>
              {habitExpanded===a.id&&(()=>{
                const allDays=(habitLogs||[]).filter(r=>r.day===String(a.id)).sort((x,y)=>y.week_label.localeCompare(x.week_label));
                return(
                  <div style={{marginTop:10,borderTop:"0.5px solid #1e1e1e",paddingTop:10}}>
                    <div style={{fontSize:9,color:GREEN,textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:700,marginBottom:8}}>30-Day History</div>
                    {allDays.length===0&&<div style={{fontSize:11,color:"#444",fontStyle:"italic"}}>No logs in last 30 days.</div>}
                    {allDays.map(r=>{
                      let d={};
                      try{d=JSON.parse(r.message||"{}");}catch(e){}
                      const wOk=d.water===true;
                      const nOk=d.nutrition===true;
                      const sVal=typeof d.sleep==="number"?d.sleep:null;
                      const allOk=wOk&&nOk&&sVal!=null&&sVal>0;
                      const[,mm,dd]=r.week_label.split("-");
                      return(
                        <div key={r.week_label} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:"0.5px solid #1a1a1a"}}>
                          <div style={{fontSize:10,color:"#555",minWidth:46}}>{mm}/{dd}</div>
                          <div style={{display:"flex",gap:6,flex:1}}>
                            <span style={{fontSize:10,color:wOk?GREEN:"#333",fontWeight:wOk?700:400}}>{wOk?"💧✓":"💧—"}</span>
                            <span style={{fontSize:10,color:nOk?GREEN:"#333",fontWeight:nOk?700:400}}>{nOk?"🥗✓":"🥗—"}</span>
                            <span style={{fontSize:10,color:sVal&&sVal>0?GOLD:"#333",fontWeight:sVal&&sVal>0?700:400}}>{sVal&&sVal>0?"😴"+sVal+"h":"😴—"}</span>
                          </div>
                          <div style={{fontSize:9,color:allOk?GREEN:"#333",fontWeight:700}}>{allOk?"✓ All":""}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })}
      {ranked.length===0&&(
        <div style={{textAlign:"center",padding:"3rem",color:"#555",fontSize:12,fontStyle:"italic"}}>No active athletes found.</div>
      )}
    </div>
  );
}
