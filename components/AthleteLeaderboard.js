import { useState, useEffect } from "react";
import { BG, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { supabase } from "../lib/supabase";
import { SkeletonList } from "./Skeleton";
import EmptyState from "./EmptyState";

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
  const podiumColors=[GOLD,"#C0C0C0","#CD7F32"];

  if(loading)return<div style={{paddingTop:8}}><SkeletonList rows={6}/></div>;
  if(displayLb.length===0)return <EmptyState icon="trophy" color={GOLD} title="No check-ins yet" hint="Be the first to show up early and earn your spot on the leaderboard." />;

  return(
    <div>
      {/* View toggle */}
      <div style={{display:"flex",gap:6,marginBottom:12}}>
        {[{id:"all",label:"All Time"},{id:"week",label:"This Week"}].map(v=>(
          <button key={v.id} onClick={()=>setView(v.id)} style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid "+(view===v.id?GOLD:"#222"),background:view===v.id?GOLD:"#111",color:view===v.id?"#1a1a1a":"#555",fontSize:12,fontWeight:view===v.id?700:400,cursor:"pointer",fontFamily:"Georgia,serif"}}>
            {v.label}
          </button>
        ))}
      </div>

      {/* My rank hero */}
      {myRow&&(
        <div style={{background:BG,borderRadius:16,padding:"1.5rem",marginBottom:12,border:"1px solid "+GOLD+"44",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GOLD+","+RED+")"}}/>
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:12}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:48,fontWeight:900,color:GOLD,lineHeight:1}}>#{myRank}</div>
              <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.08em",marginTop:2}}>Your rank</div>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:700,color:"#fff",marginBottom:8}}>{myRow.name}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                {[
                  {label:"Early",val:view==="week"?myRow.earlyWeek:myRow.earlyAll,color:GREEN},
                  {label:"Streak",val:myRow.currentStreak,color:ORANGE},
                  {label:"Best",val:myRow.bestStreak,color:GOLD},
                ].map(s=>(
                  <div key={s.label} style={{background:"#1a1a1a",borderRadius:8,padding:"6px",textAlign:"center"}}>
                    <div style={{fontSize:18,fontWeight:900,color:s.color}}>{s.val}</div>
                    <div style={{fontSize:9,color:"#555",marginTop:1}}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Attendance % */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
            <div style={{fontSize:10,color:"#555"}}>Early %</div>
            <div style={{fontSize:11,fontWeight:700,color:myRow.attPct>=80?GREEN:myRow.attPct>=50?ORANGE:RED}}>{myRow.attPct}%</div>
          </div>
          <div style={{height:4,background:"#222",borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",width:myRow.attPct+"%",background:myRow.attPct>=80?GREEN:myRow.attPct>=50?ORANGE:RED,borderRadius:2}}/>
          </div>
          {/* Gap to next rank */}
          {myRank>1&&(()=>{
            const above=displayLb[myRank-2];
            const gap=(view==="week"?above.earlyWeek:above.earlyAll)-(view==="week"?myRow.earlyWeek:myRow.earlyAll);
            return gap>0?<div style={{fontSize:11,color:"#555",marginTop:8,textAlign:"center"}}>
              {gap} more early arrival{gap>1?"s":""} to reach #{myRank-1}
            </div>:null;
          })()}
        </div>
      )}

      {/* Top 3 podium */}
      {displayLb.length>=2&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1.2fr 1fr",gap:8,marginBottom:12,alignItems:"flex-end"}}>
          {[1,0,2].map(rank=>{
            const r=displayLb[rank];
            if(!r)return<div key={rank}/>;
            const isMe=r.athlete_id===athleteId;
            const isForge=r.role==="forge";
            const heights=["100px","80px","60px"];
            const earlyCount=view==="week"?r.earlyWeek:r.earlyAll;
            return(
              <div key={rank} style={{textAlign:"center"}}>
                <div style={{position:"relative",display:"inline-block",margin:"0 auto 6px"}}>
                  <div style={{width:44,height:44,borderRadius:"50%",background:isForge?RED:STEEL,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:600,color:"#fff",border:"2px solid "+podiumColors[rank],boxShadow:"0 0 10px "+podiumColors[rank]+"66"}}>
                    {r.photo_url?<img src={r.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(r.name||"?")[0]}
                  </div>
                  {isForge&&<div style={{position:"absolute",bottom:-2,right:-2,width:16,height:16,borderRadius:"50%",background:RED,border:"1px solid #fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8}}>⚒</div>}
                </div>
                <div style={{fontSize:11,fontWeight:isMe?700:500,color:isMe?GOLD:"#ccc",marginBottom:4}}>
                  {r.name?.split(" ")[0]}{isMe?" ⭐":""}
                </div>
                <div style={{background:podiumColors[rank],borderRadius:"8px 8px 0 0",height:heights[rank],display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",padding:"8px 4px"}}>
                  <div style={{fontSize:18,fontWeight:800,color:"#1a1a1a"}}>{rank===0?"🥇":rank===1?"🥈":"🥉"}</div>
                  <div style={{fontSize:14,fontWeight:700,color:"#1a1a1a"}}>{earlyCount}</div>
                  <div style={{fontSize:9,color:"#333"}}>early</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      <div style={{background:"#111",borderRadius:12,border:"0.5px solid #1e1e1e",overflow:"hidden"}}>
        {displayLb.map((r,i)=>{
          const isMe=r.athlete_id===athleteId;
          const isForge=r.role==="forge";
          const earlyCount=view==="week"?r.earlyWeek:r.earlyAll;
          const trend=r.trend||0;
          return(
            <div key={r.athlete_id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:i<displayLb.length-1?"0.5px solid #1a1a1a":"none",background:isMe?"#1a1200":"#111"}}>
              {/* Rank */}
              <div style={{fontSize:12,fontWeight:700,color:i<3?podiumColors[i]:"#aaa",minWidth:22,textAlign:"center"}}>
                {i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}
              </div>
              {/* Trend */}
              <div style={{fontSize:11,minWidth:16,textAlign:"center",color:trend>0?GREEN:trend<0?RED:"#ddd"}}>
                {trend>0?"↑":trend<0?"↓":"—"}
              </div>
              {/* Avatar */}
              <div style={{position:"relative",flexShrink:0}}>
                <div style={{width:34,height:34,borderRadius:"50%",background:isForge?RED:STEEL,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:600,color:"#fff",border:isForge?"2px solid "+RED:"none"}}>
                  {r.photo_url?<img src={r.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(r.name||"?")[0]}
                </div>
                {isForge&&<div style={{position:"absolute",bottom:-1,right:-1,width:12,height:12,borderRadius:"50%",background:RED,border:"1px solid #fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:7}}>⚒</div>}
              </div>
              {/* Name + stats */}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:isMe?700:500,color:isMe?GOLD:"#ccc",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {r.name}{isMe?" ⭐":""}{isForge?" 🔴":""}
                </div>
                <div style={{display:"flex",gap:8,marginTop:2}}>
                  <span style={{fontSize:10,color:"#aaa"}}>🔥{r.currentStreak}</span>
                  <span style={{fontSize:10,color:"#aaa"}}>⭐{r.bestStreak}</span>
                  <span style={{fontSize:10,color:r.attPct>=80?GREEN:r.attPct>=50?ORANGE:RED}}>{r.attPct}%</span>
                </div>
              </div>
              {/* Early count */}
              <div style={{fontSize:14,fontWeight:700,color:isMe?GOLD:GREEN,minWidth:20,textAlign:"right"}}>{earlyCount}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
