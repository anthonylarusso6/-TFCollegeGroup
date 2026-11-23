import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { nowEST } from "../lib/dates";
import { RED, STEEL } from "../lib/constants";

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
  if(habitLoading||!habitLogs){return(<div className="tfx cd"><p className="cd-loading">Loading habit data...</p></div>);}
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
    <div className="tfx cd cd-hb">
      <section className="tfx-card cd-head">
        <div className="cd-head-top">
          <div className="cd-head-txt">
            <div className="tfx-eyebrow">Daily discipline</div>
            <h2>Habit leaderboard</h2>
            <p>Water · Nutrition · Sleep · Last 7 days</p>
          </div>
          <button className="att-nav tfx-press" onClick={()=>{setHabitLogs(null);loadHabitLogs();}} aria-label="Refresh">{habitLoading?"…":"↻"}</button>
        </div>
        <div className="cd-legend">
          <span className="is-full"><i/>All 3 done</span>
          <span className="is-part"><i/>Partial</span>
          <span className="is-none"><i/>Not logged</span>
        </div>
      </section>

      {ranked.length>0&&(
        <ol className="cd-hb-list">
          {ranked.map((a,i)=>{
            const rank=i+1;
            const medal=rank===1?"🥇":rank===2?"🥈":rank===3?"🥉":null;
            const isOpen=habitExpanded===a.id;
            return(
              <li key={a.id} className={"tfx-card cd-hb-ath"+(a.streak>0?" is-on":"")}>
                <button className="cd-xrow" onClick={()=>setHabitExpanded(habitExpanded===a.id?null:a.id)} aria-expanded={isOpen}>
                  <span className={"cd-rank-n"+(medal?" is-medal":"")}>{medal||rank}</span>
                  <span className="rk-av" style={{"--c":a.role==="forge"?RED:STEEL}}>
                    {a.photo_url?<img src={a.photo_url} alt=""/>:(a.name||"?")[0]}
                  </span>
                  <span className="cd-who">
                    <b>{a.name}</b>
                    <small>{a.sport?a.sport+" · ":""}<span className="tfx-num">{a.full7}/7</span> full days</small>
                  </span>
                  {a.streak>0?(
                    <span className="cd-streak" aria-label={a.streak+" day streak"}>🔥<b>{a.streak}</b></span>
                  ):(
                    <span className="cd-nostreak">No streak</span>
                  )}
                  <span className="cd-chev" aria-hidden="true">▼</span>
                </button>
                <div className="cd-hb-days">
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
                      <div key={dateStr} className={"cd-hb-day"+(allOk?" is-full":partial?" is-part":"")+(isToday?" is-today":"")} title={allOk?"All 3 done":partial?"Partial":"Not logged"}>
                        <span>{dayLetter}</span>
                        <b>{parseInt(dd,10)}</b>
                        <i>{allOk?"✓":partial?"◐":"—"}</i>
                      </div>
                    );
                  })}
                </div>
                {isOpen&&(()=>{
                  const allDays=(habitLogs||[]).filter(r=>r.day===String(a.id)).sort((x,y)=>y.week_label.localeCompare(x.week_label));
                  return(
                    <div className="cd-hb-hist">
                      <div className="tfx-eyebrow">30-day history</div>
                      {allDays.length===0&&<p className="cd-empty">No logs in last 30 days.</p>}
                      {allDays.length>0&&(
                        <ul>
                          {allDays.map(r=>{
                            let d={};
                            try{d=JSON.parse(r.message||"{}");}catch(e){}
                            const wOk=d.water===true;
                            const nOk=d.nutrition===true;
                            const sVal=typeof d.sleep==="number"?d.sleep:null;
                            const allOk=wOk&&nOk&&sVal!=null&&sVal>0;
                            const[,mm,dd]=r.week_label.split("-");
                            return(
                              <li key={r.week_label}>
                                <span className="cd-hb-date">{mm}/{dd}</span>
                                <span className={"cd-hb-h"+(wOk?" is-ok":"")}>{wOk?"💧✓":"💧—"}</span>
                                <span className={"cd-hb-h"+(nOk?" is-ok":"")}>{nOk?"🥗✓":"🥗—"}</span>
                                <span className={"cd-hb-h"+(sVal&&sVal>0?" is-ok":"")}>{sVal&&sVal>0?"😴"+sVal+"h":"😴—"}</span>
                                <em>{allOk?"✓ All":""}</em>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })()}
              </li>
            );
          })}
        </ol>
      )}
      {ranked.length===0&&(
        <section className="tfx-card cd-card"><p className="cd-empty cd-center">No active athletes found.</p></section>
      )}
    </div>
  );
}
