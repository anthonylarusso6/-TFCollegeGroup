import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { nowEST } from "../lib/dates";
import Icon from "./Icon";

function daysUntil(dateStr){
  if(!dateStr)return null;
  const est=nowEST();
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

  if(loading)return(
    <div className="tfx ae ae-gold" aria-label="Loading">
      <div className="ae-skel-stack">
        {[0,1,2].map(i=><div key={i} className="ae-skel" style={{height:i===0?150:66,borderRadius:16}}/>)}
      </div>
    </div>
  );

  return(
    <div className="tfx ae ae-gold">
      <header className="ae-head">
        <div>
          <div className="tfx-eyebrow">TF College Group</div>
          <h2>Team events</h2>
          <p>{upcoming.length>0?`${upcoming.length} upcoming event${upcoming.length>1?"s":""}` :"No upcoming events"}</p>
        </div>
      </header>

      {upcoming.length===0&&past.length===0&&(
        <section className="tfx-card ae-empty">
          <span className="ae-empty-ico"><Icon name="calendar" size={24}/></span>
          <b>No events yet</b>
          <p>Coach Ant will post upcoming team events here. Check back soon.</p>
        </section>
      )}

      {upcoming.map(e=>{
        const days=daysUntil(e.date);
        const isToday=days===0;
        const isTomorrow=days===1;
        const isUrgent=days!==null&&days<=3;
        const accent=isToday?"var(--red)":isUrgent?"#e8a33c":"var(--gold)";
        const yesNames=yesMap[e.id]||[];
        const noCount=[...noSet].filter(k=>k.startsWith(String(e.id)+"|")).length;
        const myResponse=yesNames.includes(athleteName)?"yes":noSet.has(String(e.id)+"|"+athleteName)?"no":null;
        const isBusy=toggling[e.id];

        return(
          <section key={e.id} className={"tfx-card ae-ev"+(isUrgent?" is-soon":"")} style={{"--c":accent}}>
            {/* Name + countdown */}
            <div className="ae-ev-top">
              <h3>{e.name}</h3>
              {days!==null&&(
                <div className="ae-ev-when">
                  {isToday?<b className="is-word">Today</b>:isTomorrow?<b className="is-word">Tomorrow</b>:<><b>{days}</b><small>{days===1?"day":"days"}</small></>}
                </div>
              )}
            </div>

            <div className="ae-ev-info">
              {/* Date / time */}
              {(e.date||e.time)&&(
                <div className="ae-info">
                  <Icon name="calendar" size={18}/>
                  <div>
                    {e.date&&<b>{fmtDate(e.date)}</b>}
                    {e.time&&<small>{e.time}</small>}
                  </div>
                </div>
              )}

              {/* Location */}
              {e.location&&(
                <a className="ae-info tfx-press" href={mapsUrl(e.location)} target="_blank" rel="noopener noreferrer">
                  <Icon name="mapPin" size={18}/>
                  <div>
                    <b>{e.location}</b>
                    <small>Open in Maps</small>
                  </div>
                  <span className="ae-go" aria-hidden="true">↗</span>
                </a>
              )}

              {/* Notes */}
              {e.notes&&(
                <div className="ae-ev-notes">
                  <div className="tfx-eyebrow">Details</div>
                  <p>{e.notes}</p>
                </div>
              )}
            </div>

            {/* RSVP */}
            <div className="ae-rsvp">
              <div className="ae-rsvp-top">
                <div className="tfx-eyebrow">Are you going?</div>
                <div className="ae-rsvp-n">
                  {yesNames.length>0&&<span className="is-yes">✓ {yesNames.length} going</span>}
                  {noCount>0&&<span>{noCount} not going</span>}
                </div>
              </div>
              <div className="ae-rsvp-btns">
                <button type="button" onClick={()=>toggleRsvp(e.id,"yes")} disabled={isBusy} aria-pressed={myResponse==="yes"}
                  className={"tfx-press is-yes"+(myResponse==="yes"?" is-on":"")}>
                  {myResponse==="yes"&&<i aria-hidden="true">✓</i>}
                  <span>{myResponse==="yes"?"I'm going":"Yes"}</span>
                </button>
                <button type="button" onClick={()=>toggleRsvp(e.id,"no")} disabled={isBusy} aria-pressed={myResponse==="no"}
                  className={"tfx-press is-no"+(myResponse==="no"?" is-on":"")}>
                  {myResponse==="no"&&<i aria-hidden="true">✕</i>}
                  <span>{myResponse==="no"?"Can't go":"No"}</span>
                </button>
              </div>
            </div>
          </section>
        );
      })}

      {/* Past events */}
      {past.length>0&&(
        <section className="tfx-card ae-card">
          <div className="ae-sec">
            <div className="tfx-eyebrow">Past events</div>
            <span className="tfx-num">{past.length}</span>
          </div>
          <ul className="ae-past">
            {past.slice().reverse().map(e=>(
              <li key={e.id}>
                <div>
                  <b>{e.name}</b>
                  {e.location&&(
                    <a href={mapsUrl(e.location)} target="_blank" rel="noopener noreferrer">
                      <Icon name="mapPin" size={13}/><span>{e.location}</span>
                    </a>
                  )}
                </div>
                {e.date&&<span className="ae-past-date">{fmtDate(e.date)}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
