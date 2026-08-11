import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { nowEST } from "../lib/dates";
import Icon from "./Icon";
import { RED, GREEN, GOLD, STEEL } from "../lib/constants";

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
            if(calloutLoading||!calloutLogs){return(<div style={{textAlign:"center",padding:"40px",color:"#555",fontSize:13}}>Loading callout log...</div>);}
            const filtered=(calloutLogs||[]).filter(l=>!calloutAthFilter||l.athletes?.name?.toLowerCase().includes(calloutAthFilter.toLowerCase()));
            const todayLogs=filtered.filter(l=>logDate(l.logged_at)===estToday);
            const todayCrunches=todayLogs.reduce((s,l)=>s+(l.crunches||0),0);
            const grouped={};
            filtered.forEach(l=>{const d=logDate(l.logged_at);if(!grouped[d])grouped[d]=[];grouped[d].push(l);});
            const sortedDates=Object.keys(grouped).sort((a,b)=>b.localeCompare(a));
            return(
              <div>
                {/* Broadcast push notification */}
                <div style={{background:"#0e0e0e",borderRadius:14,padding:"14px 16px",marginBottom:14,border:"1px solid #1e2a3a"}}>
                  <div style={{fontSize:9,color:GOLD,textTransform:"uppercase",letterSpacing:"0.18em",fontWeight:900,marginBottom:10}}>Send Push Notification</div>
                  <input value={broadcastTitle} onChange={e=>setBroadcastTitle(e.target.value)} placeholder="Title (e.g. Practice Update)" maxLength={80} style={{width:"100%",padding:"9px 12px",borderRadius:9,border:"0.5px solid #2a2a2a",background:"#111",color:"#ddd",fontSize:13,fontFamily:"Georgia,serif",boxSizing:"border-box",marginBottom:8,outline:"none"}}/>
                  <input value={broadcastBody} onChange={e=>setBroadcastBody(e.target.value)} placeholder="Message (optional)" maxLength={150} style={{width:"100%",padding:"9px 12px",borderRadius:9,border:"0.5px solid #2a2a2a",background:"#111",color:"#ddd",fontSize:13,fontFamily:"Georgia,serif",boxSizing:"border-box",marginBottom:8,outline:"none"}}/>
                  <button onClick={sendBroadcast} disabled={broadcastSending||!broadcastTitle.trim()} style={{width:"100%",padding:"10px",borderRadius:9,border:"none",background:(!broadcastTitle.trim()||broadcastSending)?"#1a1a1a":GOLD,color:(!broadcastTitle.trim()||broadcastSending)?"#444":"#000",fontSize:13,fontWeight:900,cursor:(!broadcastTitle.trim()||broadcastSending)?"default":"pointer",fontFamily:"Georgia,serif",letterSpacing:"0.04em",transition:"all 0.15s"}}>
                    {broadcastSending?"Sending…":"Send to All Athletes"}
                  </button>
                  {broadcastResult&&(
                    <div style={{marginTop:8,fontSize:12,color:broadcastResult.startsWith("Error")?RED:GREEN,fontWeight:700,textAlign:"center"}}>{broadcastResult}</div>
                  )}
                </div>
                <div style={{borderRadius:20,marginBottom:16,overflow:"hidden",border:"1px solid "+RED+"33",boxShadow:"0 8px 32px #00000060"}}>
                  <div style={{background:"linear-gradient(140deg,"+RED+"30,"+RED+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+RED+","+RED+"44,transparent)"}}/>
                    <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="alertTriangle" size={66} color="#fff"/></div>
                    <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                      <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+RED+"44,"+RED+"22)",border:"1px solid "+RED+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>⚠️</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:8,color:RED,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Weight Room</div>
                        <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Callout Log</div>
                        <div style={{fontSize:11,color:"#666",marginTop:1}}>Today: {todayLogs.length} violation{todayLogs.length!==1?"s":""} · {todayCrunches} crunches owed</div>
                      </div>
                      <button onClick={()=>{setCalloutLogs(null);loadCalloutLogs();}} style={{padding:"6px 10px",borderRadius:10,border:"1px solid #222",background:"transparent",color:"#555",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>{calloutLoading?"...":"↻"}</button>
                    </div>
                  </div>
                </div>
                <div style={{position:"relative",marginBottom:12}}>
                  <input value={calloutAthFilter} onChange={e=>setCalloutAthFilter(e.target.value)} placeholder="Filter by athlete..." style={{width:"100%",padding:"10px 12px 10px 34px",borderRadius:10,border:"0.5px solid #2a2a2a",fontSize:13,fontFamily:"Georgia,serif",background:"#111",color:"#ddd",boxSizing:"border-box"}}/>
                  <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"#555"}}><Icon name="search" size={15} color="rgba(255,255,255,0.4)"/></div>
                  {calloutAthFilter&&<button onClick={()=>setCalloutAthFilter("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",fontSize:14,color:"#aaa",cursor:"pointer"}}>✕</button>}
                </div>
                {filtered.length===0&&(
                  <div style={{textAlign:"center",padding:"3rem",color:"#555",fontSize:12,fontStyle:"italic"}}>No callouts logged yet.</div>
                )}
                {sortedDates.map(dateStr=>{
                  const dayLogs=grouped[dateStr];
                  const isToday=dateStr===estToday;
                  const dayCrunches=dayLogs.reduce((s,l)=>s+(l.crunches||0),0);
                  const[y,m,d]=dateStr.split("-");
                  const label=isToday?"Today":new Date(Number(y),Number(m)-1,Number(d)).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
                  return(
                    <div key={dateStr} style={{marginBottom:14}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                        <div style={{fontSize:10,fontWeight:700,color:isToday?RED:"#555",textTransform:"uppercase",letterSpacing:"0.08em"}}>{label}</div>
                        <div style={{flex:1,height:"0.5px",background:"#1e1e1e"}}/>
                        <div style={{fontSize:10,color:RED,fontWeight:700}}>{dayCrunches} crunches</div>
                      </div>
                      {dayLogs.map((l,li)=>{
                        const ath=l.athletes;
                        return(
                          <div key={li} style={{background:"#111",borderRadius:12,marginBottom:6,padding:"10px 14px",border:"1px solid "+(isToday?RED+"22":"#1a1a1a"),display:"flex",alignItems:"center",gap:10}}>
                            <div style={{width:34,height:34,borderRadius:"50%",background:ath?.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff",flexShrink:0,overflow:"hidden"}}>
                              {ath?.photo_url?<img src={ath.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(ath?.name||"?")[0]}
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:13,fontWeight:600,color:"#ddd"}}>{ath?.name||"Unknown"}</div>
                              <div style={{fontSize:11,color:"#555",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.violation}{l.count>1?" · "+l.count+"x":""}</div>
                            </div>
                            <div style={{textAlign:"right",flexShrink:0}}>
                              <div style={{fontSize:14,fontWeight:800,color:RED}}>{l.crunches}</div>
                              <div style={{fontSize:9,color:l.type==="selfreport"?GREEN:"#555",fontWeight:l.type==="selfreport"?700:400}}>{l.type==="selfreport"?"self":"called out"}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
}
