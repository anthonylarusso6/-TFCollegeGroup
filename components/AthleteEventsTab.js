import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { GREEN, RED, GOLD, ORANGE } from "../lib/constants";
import { SkeletonList } from "./Skeleton";
import EmptyState from "./EmptyState";

function daysUntil(dateStr){
  if(!dateStr)return null;
  const est=new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
  const target=new Date(dateStr+"T00:00:00");
  return Math.ceil((target-est)/(1000*60*60*24));
}

function fmtDate(dateStr){
  if(!dateStr)return "";
  try{
    return new Date(dateStr+"T00:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
  }catch(e){return dateStr;}
}

function mapsUrl(location){
  return "https://maps.apple.com/?q="+encodeURIComponent(location);
}

function CalIcon({size=44,accent}){
  return(
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" style={{display:"block",flexShrink:0}}>
      <rect x="2" y="7" width="40" height="33" rx="7" fill={accent+"22"} stroke={accent+"66"} strokeWidth="1.5"/>
      <rect x="2" y="7" width="40" height="12" rx="7" fill={accent+"44"}/>
      <rect x="2" y="13" width="40" height="6" fill={accent+"44"}/>
      <rect x="11" y="2" width="4" height="10" rx="2" fill={accent}/>
      <rect x="29" y="2" width="4" height="10" rx="2" fill={accent}/>
      <rect x="9" y="25" width="7" height="6" rx="2" fill={accent+"99"}/>
      <rect x="18.5" y="25" width="7" height="6" rx="2" fill={accent+"99"}/>
      <rect x="28" y="25" width="7" height="6" rx="2" fill={accent+"66"}/>
    </svg>
  );
}

// "yes" → culture_rsvps (event_id, athlete_name) — existing table, coach sees this count
// "no"  → announcements (type="rsvp_decline", day=athleteName, week_label=String(eventId))
export default function AthleteEventsTab({athleteName=""}){
  const[events,setEvents]=useState([]);
  const[yesMap,setYesMap]=useState({});   // eventId → [names]
  const[noSet,setNoSet]=useState(new Set()); // "eventId|name" keys
  const[loading,setLoading]=useState(true);
  const[toggling,setToggling]=useState({});

  useEffect(()=>{
    (async()=>{
      try{
        const[{data:evData},{data:rsvpData},{data:declineData}]=await Promise.all([
          supabase.from("culture_events").select("*").order("date",{ascending:true}),
          supabase.from("culture_rsvps").select("*"),
          supabase.from("announcements").select("week_label,day").eq("type","rsvp_decline").eq("active",true),
        ]);
        setEvents(evData||[]);
        const ym={};
        (rsvpData||[]).forEach(r=>{if(!ym[r.event_id])ym[r.event_id]=[];ym[r.event_id].push(r.athlete_name);});
        setYesMap(ym);
        const ns=new Set();
        (declineData||[]).forEach(r=>ns.add(r.week_label+"|"+r.day));
        setNoSet(ns);
      }catch(e){}
      setLoading(false);
    })();
  },[]);

  const toggleRsvp=async(eventId,response)=>{
    if(!athleteName||toggling[eventId])return;
    setToggling(p=>({...p,[eventId]:true}));
    const eid=String(eventId);
    const yesNames=yesMap[eventId]||[];
    const alreadyYes=yesNames.includes(athleteName);
    const noKey=eid+"|"+athleteName;
    const alreadyNo=noSet.has(noKey);
    const isSame=(response==="yes"&&alreadyYes)||(response==="no"&&alreadyNo);

    try{
      // always clear both sides first
      await supabase.from("culture_rsvps").delete().eq("event_id",eventId).eq("athlete_name",athleteName);
      await supabase.from("announcements").delete().eq("type","rsvp_decline").eq("week_label",eid).eq("day",athleteName);

      if(!isSame){
        if(response==="yes"){
          await supabase.from("culture_rsvps").insert({event_id:eventId,athlete_name:athleteName});
        } else {
          await supabase.from("announcements").insert({type:"rsvp_decline",week_label:eid,day:athleteName,active:true,message:""});
        }
      }

      setYesMap(prev=>{
        const cur=prev[eventId]||[];
        const next=cur.filter(n=>n!==athleteName);
        if(!isSame&&response==="yes")next.push(athleteName);
        return{...prev,[eventId]:next};
      });
      setNoSet(prev=>{
        const next=new Set(prev);
        next.delete(noKey);
        if(!isSame&&response==="no")next.add(noKey);
        return next;
      });
    }catch(e){}
    setToggling(p=>({...p,[eventId]:false}));
  };

  const upcoming=events.filter(e=>!e.date||daysUntil(e.date)>=0);
  const past=events.filter(e=>e.date&&daysUntil(e.date)<0);

  if(loading)return<div style={{paddingTop:8}}><SkeletonList rows={3}/></div>;

  return(
    <div>
      {/* Header */}
      <div style={{borderRadius:18,marginBottom:18,overflow:"hidden",border:"1px solid "+GOLD+"33",position:"relative",background:"linear-gradient(145deg,#1a1200,#0e0900)"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,"+GOLD+","+ORANGE+"cc,transparent)"}}/>
        <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(ellipse at 80% 50%,"+GOLD+"0d 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{padding:"20px 20px 18px",position:"relative",display:"flex",alignItems:"center",gap:16}}>
          <CalIcon size={48} accent={GOLD}/>
          <div>
            <div style={{fontSize:9,color:GOLD,textTransform:"uppercase",letterSpacing:"0.26em",fontWeight:900,marginBottom:3}}>TF College Group</div>
            <div style={{fontSize:22,fontWeight:900,color:"#fff",letterSpacing:"-0.03em",lineHeight:1.1}}>Team Events</div>
            <div style={{fontSize:11,color:"#55503a",marginTop:4,fontWeight:500}}>
              {upcoming.length>0?`${upcoming.length} upcoming event${upcoming.length>1?"s":""}` :"No upcoming events"}
            </div>
          </div>
        </div>
      </div>

      {upcoming.length===0&&past.length===0&&(
        <EmptyState icon="calendar" color={GOLD} title="No events yet" hint="Coach Ant will post upcoming team events here. Check back soon."/>
      )}

      {upcoming.map(e=>{
        const days=daysUntil(e.date);
        const isToday=days===0;
        const isTomorrow=days===1;
        const isUrgent=days!==null&&days<=3;
        const accent=isToday?RED:isUrgent?ORANGE:GOLD;
        const yesNames=yesMap[e.id]||[];
        const noCount=[...noSet].filter(k=>k.startsWith(String(e.id)+"|")).length;
        const myResponse=yesNames.includes(athleteName)?"yes":noSet.has(String(e.id)+"|"+athleteName)?"no":null;
        const isBusy=toggling[e.id];

        return(
          <div key={e.id} style={{borderRadius:16,marginBottom:12,overflow:"hidden",border:"1px solid "+(isUrgent?accent+"44":"#1e1e1e"),position:"relative",background:"#0e0e0e"}}>
            <div style={{height:3,background:"linear-gradient(90deg,"+accent+","+accent+"44,transparent)"}}/>
            <div style={{padding:"14px 16px 16px"}}>

              {/* Name + countdown */}
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:12}}>
                <div style={{fontSize:17,fontWeight:900,color:"#fff",lineHeight:1.2,flex:1,letterSpacing:"-0.01em"}}>{e.name}</div>
                {days!==null&&(
                  <div style={{flexShrink:0,textAlign:"center",background:accent+"1a",border:"1px solid "+accent+"55",borderRadius:10,padding:"6px 10px",minWidth:52}}>
                    <div style={{fontSize:isToday?13:17,fontWeight:900,color:accent,lineHeight:1}}>
                      {isToday?"TODAY":isTomorrow?"TOM":days}
                    </div>
                    {!isToday&&!isTomorrow&&<div style={{fontSize:8,color:accent+"99",fontWeight:700,letterSpacing:"0.08em",marginTop:1}}>DAYS</div>}
                    {isTomorrow&&<div style={{fontSize:8,color:accent+"99",fontWeight:700,letterSpacing:"0.08em",marginTop:1}}>ORROW</div>}
                  </div>
                )}
              </div>

              {/* Date / time */}
              {(e.date||e.time)&&(
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,padding:"8px 10px",background:"rgba(255,255,255,0.04)",borderRadius:8,border:"0.5px solid rgba(255,255,255,0.06)"}}>
                  <CalIcon size={16} accent={accent}/>
                  <div>
                    {e.date&&<div style={{fontSize:13,fontWeight:700,color:"#ccc"}}>{fmtDate(e.date)}</div>}
                    {e.time&&<div style={{fontSize:11,color:"#666",marginTop:1}}>{e.time}</div>}
                  </div>
                </div>
              )}

              {/* Location */}
              {e.location&&(
                <a href={mapsUrl(e.location)} target="_blank" rel="noopener noreferrer"
                  style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,padding:"9px 10px",background:"rgba(255,255,255,0.04)",borderRadius:8,border:"0.5px solid rgba(255,255,255,0.06)",textDecoration:"none"}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill={accent+"cc"}/>
                    <circle cx="12" cy="9" r="2.5" fill="#0e0e0e"/>
                  </svg>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,color:"#aaa",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.location}</div>
                    <div style={{fontSize:10,color:accent,fontWeight:600,marginTop:1}}>Open in Maps →</div>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{flexShrink:0,opacity:0.4}}>
                    <path d="M7 17L17 7M17 7H7M17 7v10" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              )}

              {/* Notes */}
              {e.notes&&(
                <div style={{marginBottom:10,padding:"10px 12px",background:"rgba(255,255,255,0.025)",borderRadius:8,border:"0.5px solid rgba(255,255,255,0.05)"}}>
                  <div style={{fontSize:9,color:"#444",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700,marginBottom:5}}>Details</div>
                  <div style={{fontSize:13,color:"#888",lineHeight:1.65}}>{e.notes}</div>
                </div>
              )}

              {/* RSVP */}
              <div style={{borderTop:"0.5px solid rgba(255,255,255,0.06)",paddingTop:12}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{fontSize:9,color:"#444",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700}}>Are you going?</div>
                  <div style={{display:"flex",gap:8,fontSize:10}}>
                    {yesNames.length>0&&<span style={{color:GREEN+"99"}}>✓ {yesNames.length} going</span>}
                    {noCount>0&&<span style={{color:"#444"}}>{noCount} not going</span>}
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>toggleRsvp(e.id,"yes")} disabled={isBusy}
                    style={{flex:1,padding:"12px",borderRadius:11,border:"1px solid "+(myResponse==="yes"?GREEN+"88":"rgba(255,255,255,0.08)"),background:myResponse==="yes"?"rgba(30,160,70,0.18)":"rgba(255,255,255,0.04)",color:myResponse==="yes"?GREEN:"#666",fontSize:14,fontWeight:myResponse==="yes"?800:500,cursor:isBusy?"default":"pointer",fontFamily:"Georgia,serif",transition:"all 0.15s",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
                    <span style={{fontSize:18,lineHeight:1}}>{myResponse==="yes"?"✓":"👍"}</span>
                    <span>{myResponse==="yes"?"I'm Going":"Yes"}</span>
                  </button>
                  <button onClick={()=>toggleRsvp(e.id,"no")} disabled={isBusy}
                    style={{flex:1,padding:"12px",borderRadius:11,border:"1px solid "+(myResponse==="no"?RED+"88":"rgba(255,255,255,0.08)"),background:myResponse==="no"?"rgba(180,30,30,0.15)":"rgba(255,255,255,0.04)",color:myResponse==="no"?RED:"#666",fontSize:14,fontWeight:myResponse==="no"?800:500,cursor:isBusy?"default":"pointer",fontFamily:"Georgia,serif",transition:"all 0.15s",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
                    <span style={{fontSize:18,lineHeight:1}}>{myResponse==="no"?"✕":"👎"}</span>
                    <span>{myResponse==="no"?"Can't Go":"No"}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })}

      {/* Past events */}
      {past.length>0&&(
        <div style={{marginTop:24}}>
          <div style={{fontSize:9,color:"#2a2a2a",textTransform:"uppercase",letterSpacing:"0.14em",fontWeight:700,marginBottom:10}}>Past Events</div>
          {past.slice().reverse().map(e=>(
            <div key={e.id} style={{background:"#0a0a0a",borderRadius:10,padding:"10px 14px",marginBottom:6,border:"1px solid #161616",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:"#3a3a3a"}}>{e.name}</div>
                {e.location&&(
                  <a href={mapsUrl(e.location)} target="_blank" rel="noopener noreferrer"
                    style={{fontSize:11,color:"#2a2a2a",textDecoration:"none",display:"flex",alignItems:"center",gap:4,marginTop:2}}>
                    📍 {e.location}
                  </a>
                )}
              </div>
              {e.date&&<span style={{fontSize:10,color:"#2a2a2a",whiteSpace:"nowrap",flexShrink:0}}>{fmtDate(e.date)}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
