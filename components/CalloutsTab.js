import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { nowEST } from "../lib/dates";
import Icon from "./Icon";
import { RED, STEEL } from "../lib/constants";

export default function CalloutsTab(){
  const[calloutLogs,setCalloutLogs]=useState(null);
  const[calloutLoading,setCalloutLoading]=useState(false);
  const[calloutAthFilter,setCalloutAthFilter]=useState("");
  const[broadcastTitle,setBroadcastTitle]=useState("");
  const[broadcastBody,setBroadcastBody]=useState("");
  const[broadcastSending,setBroadcastSending]=useState(false);
  const[broadcastResult,setBroadcastResult]=useState(null);
  const loadCalloutLogs=async()=>{
    setCalloutLoading(true);
    try{
      const{data,error}=await supabase.from("callouts").select("*,athletes(name,photo_url,role)").order("logged_at",{ascending:false}).limit(200);
      if(!error)setCalloutLogs(data||[]);
      else setCalloutLogs([]);
    }catch(e){setCalloutLogs([]);}
    setCalloutLoading(false);
  };
  useEffect(()=>{loadCalloutLogs();},[]);
            const logDate=(ts)=>{if(!ts)return"";const d=new Date(ts);const e=new Date(d.toLocaleString("en-US",{timeZone:"America/New_York"}));return e.getFullYear()+"-"+String(e.getMonth()+1).padStart(2,"0")+"-"+String(e.getDate()).padStart(2,"0");};
            const estToday=(()=>{const n=nowEST();return n.getFullYear()+"-"+String(n.getMonth()+1).padStart(2,"0")+"-"+String(n.getDate()).padStart(2,"0");})();
            const sendBroadcast=async()=>{
              if(broadcastSending||!broadcastTitle.trim())return;
              setBroadcastSending(true);setBroadcastResult(null);
              try{
                const r=await fetch("/api/broadcast-notification",{method:"POST",headers:{"Content-Type":"application/json","x-app-secret":process.env.NEXT_PUBLIC_APP_ACTION_SECRET||""},body:JSON.stringify({title:broadcastTitle.trim(),body:broadcastBody.trim(),url:"/athlete"})});
                const d=await r.json();
                setBroadcastResult(d.error?"Error: "+d.error:"Sent to "+d.sent+" athlete"+(d.sent!==1?"s":"")+(d.failed>0?" ("+d.failed+" failed)":""));
                if(!d.error){setBroadcastTitle("");setBroadcastBody("");}
              }catch(e){setBroadcastResult("Error: "+e.message);}
              setBroadcastSending(false);
              setTimeout(()=>setBroadcastResult(null),4000);
            };
            if(calloutLoading||!calloutLogs){return(<div className="tfx cb"><div className="tfx-card att-loading">Loading callout log...</div></div>);}
            const filtered=(calloutLogs||[]).filter(l=>!calloutAthFilter||l.athletes?.name?.toLowerCase().includes(calloutAthFilter.toLowerCase()));
            const todayLogs=filtered.filter(l=>logDate(l.logged_at)===estToday);
            const todayCrunches=todayLogs.reduce((s,l)=>s+(l.crunches||0),0);
            const grouped={};
            filtered.forEach(l=>{const d=logDate(l.logged_at);if(!grouped[d])grouped[d]=[];grouped[d].push(l);});
            const sortedDates=Object.keys(grouped).sort((a,b)=>b.localeCompare(a));
            return(
              <div className="tfx cb cb-calls">
                {/* Broadcast push notification */}
                <section className="tfx-card cb-sec cb-push">
                  <div className="cb-sec-head">
                    <div>
                      <div className="tfx-eyebrow cb-eb-gold">Broadcast</div>
                      <h3>Send push notification</h3>
                    </div>
                    <Icon name="bell" size={20}/>
                  </div>
                  <input className="tfx-field cb-field" value={broadcastTitle} onChange={e=>setBroadcastTitle(e.target.value)} placeholder="Title (e.g. Practice Update)" maxLength={80} aria-label="Notification title"/>
                  <input className="tfx-field cb-field" value={broadcastBody} onChange={e=>setBroadcastBody(e.target.value)} placeholder="Message (optional)" maxLength={150} aria-label="Notification message"/>
                  <button className="tfx-btn cb-btn-gold cb-btn-block tfx-press" onClick={sendBroadcast} disabled={broadcastSending||!broadcastTitle.trim()}>
                    {broadcastSending?"Sending…":"Send to all athletes"}
                  </button>
                  {broadcastResult&&(
                    <p className={"cb-status "+(broadcastResult.startsWith("Error")?"is-err":"is-ok")} role="status">{broadcastResult}</p>
                  )}
                </section>

                {/* Callout log header + filter */}
                <section className="tfx-card cb-head">
                  <div className="cb-head-top">
                    <div>
                      <div className="tfx-eyebrow cb-eb-red">Weight room</div>
                      <h2>Callout log</h2>
                      <p>Today: {todayLogs.length} violation{todayLogs.length!==1?"s":""} · {todayCrunches} crunches owed</p>
                    </div>
                    <button className="att-nav tfx-press cb-refresh" aria-label="Refresh callout log" onClick={()=>{setCalloutLogs(null);loadCalloutLogs();}}>
                      {calloutLoading?"…":<Icon name="refreshCw" size={17}/>}
                    </button>
                  </div>
                  <div className="cb-search">
                    <Icon name="search" size={16}/>
                    <input className="tfx-field" value={calloutAthFilter} onChange={e=>setCalloutAthFilter(e.target.value)} placeholder="Filter by athlete..." aria-label="Filter by athlete"/>
                    {calloutAthFilter&&<button className="cb-x" aria-label="Clear filter" onClick={()=>setCalloutAthFilter("")}>✕</button>}
                  </div>
                </section>

                {filtered.length===0&&(
                  <div className="tfx-card att-loading">No callouts logged yet.</div>
                )}
                {sortedDates.length>0&&(
                  <section className="tfx-card cb-log">
                    {sortedDates.map(dateStr=>{
                      const dayLogs=grouped[dateStr];
                      const isToday=dateStr===estToday;
                      const dayCrunches=dayLogs.reduce((s,l)=>s+(l.crunches||0),0);
                      const[y,m,d]=dateStr.split("-");
                      const label=isToday?"Today":new Date(Number(y),Number(m)-1,Number(d)).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
                      return(
                        <div key={dateStr} className={"cb-day"+(isToday?" is-today":"")}>
                          <div className="cb-day-head">
                            <b>{label}</b>
                            <span>{dayCrunches} crunches</span>
                          </div>
                          <ul className="cb-list">
                            {dayLogs.map((l,li)=>{
                              const ath=l.athletes;
                              return(
                                <li key={li} className="cb-row is-pad">
                                  <span className="rk-av" style={{"--c":ath?.role==="forge"?RED:STEEL}}>
                                    {ath?.photo_url?<img src={ath.photo_url} alt=""/>:(ath?.name||"?")[0]}
                                  </span>
                                  <span className="cb-who">
                                    <b>{ath?.name||"Unknown"}</b>
                                    <small>{l.violation}{l.count>1?" · "+l.count+"x":""}</small>
                                  </span>
                                  <span className="cb-amt">
                                    <b>{l.crunches}</b>
                                    <small className={l.type==="selfreport"?"is-self":""}>{l.type==="selfreport"?"self":"called out"}</small>
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })}
                  </section>
                )}
              </div>
            );
}
