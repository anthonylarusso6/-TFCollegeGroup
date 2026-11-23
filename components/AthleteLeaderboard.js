import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { SkeletonList } from "./Skeleton";
import Icon from "./Icon";

const CLASS_DAYS=["Mon","Tue","Thu","Fri"];

export default function AthleteLeaderboard({athleteId}){
  const[lb,setLb]=useState([]);
  const[loading,setLoading]=useState(true);
  const[view,setView]=useState("all"); // all | week

  useEffect(()=>{loadLeaderboard();},[]);

  const loadLeaderboard=async()=>{
    try{
      const[attRes,athRes]=await Promise.all([
        supabase.from("attendance").select("athlete_id,status,date,day"),
        supabase.from("athletes").select("id,name,photo_url,role").eq("status","active"),
      ]);
      const att=attRes.data||[];
      const aths=athRes.data||[];
      const athMap={};
      aths.forEach(a=>{athMap[a.id]=a;});

      // Get this week's dates (Mon-Fri) using EST
      const now=new Date();
      const estNow=new Date(now.toLocaleString("en-US",{timeZone:"America/New_York"}));
      const weekStart=new Date(estNow);
      // Days back to this week's Monday. On Sunday (getDay()===0) that's 6 days back, not -1.
      weekStart.setDate(estNow.getDate()-((estNow.getDay()+6)%7));
      weekStart.setHours(0,0,0,0);

      // Calculate stats per athlete
      const stats={};
      att.forEach(r=>{
        if(!r.athlete_id||!athMap[r.athlete_id])return;
        if(!stats[r.athlete_id]){
          stats[r.athlete_id]={
            earlyAll:0,earlyWeek:0,totalAll:0,totalWeek:0,
            dates:[],weekDates:[],
          };
        }
        const s=stats[r.athlete_id];
        const recDate=new Date(r.date+"T12:00:00");
        const isThisWeek=recDate>=weekStart;
        s.totalAll++;
        if(isThisWeek)s.totalWeek++;
        if(r.status==="early"){
          s.earlyAll++;
          s.dates.push(r.date);
          if(isThisWeek){s.earlyWeek++;s.weekDates.push(r.date);}
        }
      });

      // Calculate streaks
      const calcStreak=(dates)=>{
        if(!dates.length)return{current:0,best:0};
        const sorted=[...new Set(dates)].sort();
        let current=0,best=0,streak=1;
        // Check if last entry was recent (within last class day)
        for(let i=1;i<sorted.length;i++){
          const d1=new Date(sorted[i-1]+"T12:00:00");
          const d2=new Date(sorted[i]+"T12:00:00");
          const diffDays=Math.round((d2-d1)/(1000*60*60*24));
          if(diffDays<=4){streak++;}else{best=Math.max(best,streak);streak=1;}
        }
        best=Math.max(best,streak);
        // Current streak only counts if the most recent early date is recent (<=4 days ago EST).
        // Class days are never more than 3 days apart (Fri→Mon), so a larger gap means a
        // class day has been missed since — the current streak is broken (best is unaffected).
        const lastDate=new Date(sorted[sorted.length-1]+"T12:00:00");
        const estMid=new Date(estNow.getFullYear(),estNow.getMonth(),estNow.getDate(),12,0,0);
        const gap=Math.round((estMid-lastDate)/(1000*60*60*24));
        current=gap<=4?streak:0;
        return{current,best};
      };

      // Build ranked list
      const ranked=Object.keys(stats)
        .filter(id=>athMap[id])
        .map(id=>{
          const s=stats[id];
          const{current,best}=calcStreak(s.dates);
          // Total possible classes
          const totalPossible=Math.max(s.totalAll,1);
          const attPct=Math.round((s.earlyAll/totalPossible)*100);
          return{
            athlete_id:id,
            name:athMap[id]?.name||"Unknown",
            photo_url:athMap[id]?.photo_url||null,
            role:athMap[id]?.role||"iron",
            earlyAll:s.earlyAll,
            earlyWeek:s.earlyWeek,
            currentStreak:current,
            bestStreak:best,
            attPct,
          };
        })
        .sort((a,b)=>b.earlyAll-a.earlyAll);

      // Add rank change (week vs all time position)
      const rankedWeek=[...ranked].sort((a,b)=>b.earlyWeek-a.earlyWeek);
      ranked.forEach((r,i)=>{
        const weekPos=rankedWeek.findIndex(x=>x.athlete_id===r.athlete_id);
        r.trend=i-weekPos; // positive = moved up
      });

      setLb(ranked);
    }catch(e){console.error("Leaderboard error:",e);}
    setLoading(false);
  };

  const displayLb=view==="week"?[...lb].sort((a,b)=>b.earlyWeek-a.earlyWeek):lb;
  const myRank=displayLb.findIndex(r=>r.athlete_id===athleteId)+1;
  const myRow=displayLb.find(r=>r.athlete_id===athleteId);
  const maxEarly=displayLb.length>0?Math.max(...displayLb.map(r=>view==="week"?r.earlyWeek:r.earlyAll),1):1;
  const tone=(p)=>p>=80?"af-good":p>=50?"af-mid":"af-low";
  const av=(r,cls="")=>(
    <span className={"af-av"+(r.role==="forge"?" is-forge":"")+(cls?" "+cls:"")}>
      {r.photo_url?<img src={r.photo_url} alt=""/>:(r.name||"?")[0]}
      {r.role==="forge"&&<i className="af-forge" aria-label="Forge">⚒</i>}
    </span>
  );

  const Head=()=>(
    <header className="tfx-hb-head">
      <div>
        <div className="tfx-eyebrow">Leaderboard</div>
        <h2>Early arrivals</h2>
      </div>
    </header>
  );

  if(loading)return<div className="tfx af af-lb"><Head/><SkeletonList rows={6}/></div>;
  if(displayLb.length===0)return(
    <div className="tfx af af-lb">
      <Head/>
      <section className="tfx-card af-empty" style={{"--c":"var(--gold)"}}>
        <span className="af-empty-ic"><Icon name="trophy" size={24}/></span>
        <b>No check-ins yet</b>
        <p>Be the first to show up early and earn your spot on the leaderboard.</p>
      </section>
    </div>
  );

  return(
    <div className="tfx af af-lb">
      <Head/>

      {/* View toggle */}
      <div className="ir-seg" role="tablist" aria-label="Leaderboard range">
        {[{id:"all",label:"All time"},{id:"week",label:"This week"}].map(v=>(
          <button key={v.id} role="tab" aria-selected={view===v.id} className={view===v.id?"is-on":""} onClick={()=>setView(v.id)}>
            {v.label}
          </button>
        ))}
      </div>

      {/* My rank hero */}
      {myRow&&(
        <section className="tfx-card af-lb-me">
          <div className="af-lb-me-top">
            <div className="af-lb-rank">
              <b className="tfx-num">#{myRank}</b>
              <small>Your rank</small>
            </div>
            <div className="af-lb-me-txt">
              <b>{myRow.name}</b>
              <div className="af-lb-stats">
                {[
                  {label:"Early",val:view==="week"?myRow.earlyWeek:myRow.earlyAll},
                  {label:"Streak",val:myRow.currentStreak},
                  {label:"Best",val:myRow.bestStreak},
                ].map(s=>(
                  <div key={s.label} className="af-lb-stat">
                    <b className="tfx-num">{s.val}</b>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Attendance % */}
          <div className={"af-lb-pct "+tone(myRow.attPct)}>
            <div className="af-lb-pct-row"><span>Early %</span><b className="tfx-num">{myRow.attPct}%</b></div>
            <div className="af-meter"><i style={{width:myRow.attPct+"%"}}/></div>
          </div>
          {/* Gap to next rank */}
          {myRank>1&&(()=>{
            const above=displayLb[myRank-2];
            const gap=(view==="week"?above.earlyWeek:above.earlyAll)-(view==="week"?myRow.earlyWeek:myRow.earlyAll);
            return gap>0?<p className="af-lb-gap">
              {gap} more early arrival{gap>1?"s":""} to reach #{myRank-1}
            </p>:null;
          })()}
        </section>
      )}

      {/* Top 3 podium */}
      {displayLb.length>=2&&(
        <section className="tfx-card af-lb-podium" aria-label="Top three">
          {[1,0,2].map(rank=>{
            const r=displayLb[rank];
            if(!r)return<div key={rank}/>;
            const isMe=r.athlete_id===athleteId;
            const heights=["104px","88px","74px"];
            const earlyCount=view==="week"?r.earlyWeek:r.earlyAll;
            return(
              <div key={rank} className={"af-pod is-r"+(rank+1)}>
                {av(r,"is-lg")}
                <div className="af-pod-name"><span>{r.name?.split(" ")[0]}</span>{isMe&&<span className="af-pill af-you">You</span>}</div>
                <div className="af-pod-block" style={{height:heights[rank]}}>
                  <small>{rank===0?"1st":rank===1?"2nd":"3rd"}</small>
                  <b className="tfx-num">{earlyCount}</b>
                  <small>early</small>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Full list */}
      <section className="tfx-card af-lb-list">
        <div className="af-sec-head"><div className="tfx-eyebrow">Standings</div><span>{displayLb.length} athletes · early check-ins</span></div>
        <ol>
          {displayLb.map((r,i)=>{
            const isMe=r.athlete_id===athleteId;
            const isForge=r.role==="forge";
            const earlyCount=view==="week"?r.earlyWeek:r.earlyAll;
            const trend=r.trend||0;
            return(
              <li key={r.athlete_id} className={"af-lb-row"+(isMe?" is-me":"")}>
                {/* Rank */}
                <span className={"af-lb-pos"+(i<3?" is-r"+(i+1):"")}>{i+1}</span>
                {/* Trend */}
                <span className={"af-trend"+(trend>0?" is-up":trend<0?" is-down":"")} aria-label={trend>0?"Moving up this week":trend<0?"Moving down this week":"No change"}>
                  {trend>0?"↑":trend<0?"↓":"–"}
                </span>
                {/* Avatar */}
                {av(r)}
                {/* Name + stats */}
                <div className="af-lb-who">
                  <div className="af-lb-name">
                    <span>{r.name}</span>
                    {isMe&&<span className="af-pill af-you">You</span>}
                  </div>
                  <div className="af-lb-meta">
                    <span>🔥 {r.currentStreak}</span>
                    <span>Best {r.bestStreak}</span>
                    <em className={tone(r.attPct)}>{r.attPct}%</em>
                  </div>
                </div>
                {/* Early count */}
                <b className="af-lb-count tfx-num">{earlyCount}</b>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
