import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { GREEN, RED, GOLD, ORANGE } from "../lib/constants";
import { SkeletonList } from "./Skeleton";
import EmptyState from "./EmptyState";

const STEEL = "#8CB4D5";

function daysUntil(dateStr){
  if(!dateStr)return null;
  const est=new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
  const target=new Date(dateStr+"T00:00:00");
  return Math.ceil((target-est)/(1000*60*60*24));
}

function fmtDate(dateStr){
  if(!dateStr)return "";
  try{return new Date(dateStr+"T00:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});}catch(e){return dateStr;}
}

export default function AthleteEventsTab(){
  const[events,setEvents]=useState([]);
  const[loading,setLoading]=useState(true);

  useEffect(()=>{
    (async()=>{
      try{
        const{data}=await supabase.from("culture_events").select("*").order("date",{ascending:true});
        setEvents(data||[]);
      }catch(e){}
      setLoading(false);
    })();
  },[]);

  const est=new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
  const upcoming=events.filter(e=>!e.date||daysUntil(e.date)>=0);
  const past=events.filter(e=>e.date&&daysUntil(e.date)<0);

  if(loading)return<div style={{paddingTop:8}}><SkeletonList rows={3}/></div>;

  return(
    <div>
      {/* Header */}
      <div style={{borderRadius:16,marginBottom:14,overflow:"hidden",border:"1px solid "+GOLD+"44",position:"relative"}}>
        <div style={{background:"linear-gradient(140deg,#1a1000,#0f0900)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GOLD+","+ORANGE+",transparent)"}}/>
          <div style={{position:"absolute",bottom:-10,right:-8,fontSize:72,opacity:0.07,lineHeight:1,userSelect:"none"}}>📅</div>
          <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
            <div style={{width:52,height:52,borderRadius:14,background:"linear-gradient(145deg,"+GOLD+"44,"+GOLD+"22)",border:"1px solid "+GOLD+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+GOLD+"33"}}>📅</div>
            <div>
              <div style={{fontSize:9,color:GOLD,textTransform:"uppercase",letterSpacing:"0.22em",fontWeight:900,marginBottom:2}}>TF COLLEGE GROUP</div>
              <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Upcoming Events</div>
              <div style={{fontSize:11,color:"#555",marginTop:1}}>Culture · Community · Brotherhood</div>
            </div>
          </div>
        </div>
      </div>

      {upcoming.length===0&&past.length===0&&(
        <EmptyState icon="calendar" color={GOLD} title="No events yet" hint="Coach Ant will post upcoming team events here. Check back soon."/>
      )}

      {/* Upcoming */}
      {upcoming.map(e=>{
        const days=daysUntil(e.date);
        const isToday=days===0;
        const isSoon=days!==null&&days<=3;
        const accent=isToday?RED:isSoon?ORANGE:GOLD;
        return(
          <div key={e.id} style={{background:"linear-gradient(135deg,#111,#0d0d0d)",borderRadius:14,padding:"16px",marginBottom:10,border:"1px solid "+(isSoon?accent+"44":"#1e1e1e"),borderLeft:"3px solid "+accent,position:"relative",overflow:"hidden"}}>
            {isToday&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,"+RED+",transparent)"}}/>}
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:6}}>
              <div style={{fontSize:15,fontWeight:800,color:"#fff",flex:1}}>{e.name}</div>
              {days!==null&&(
                <span style={{fontSize:10,padding:"3px 9px",borderRadius:20,background:accent+"22",color:accent,fontWeight:800,border:"1px solid "+accent+"44",whiteSpace:"nowrap",flexShrink:0}}>
                  {isToday?"TODAY!":(days===1?"Tomorrow":"In "+days+"d")}
                </span>
              )}
            </div>
            {(e.date||e.time)&&(
              <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#888",marginBottom:e.location||e.notes?5:0}}>
                <span style={{color:accent}}>📅</span>
                {e.date&&<span>{fmtDate(e.date)}</span>}
                {e.time&&<span style={{color:"#666"}}>· {e.time}</span>}
              </div>
            )}
            {e.location&&(
              <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#888",marginBottom:e.notes?5:0}}>
                <span>📍</span><span>{e.location}</span>
              </div>
            )}
            {e.notes&&(
              <div style={{fontSize:12,color:"#666",fontStyle:"italic",lineHeight:1.6,borderTop:"0.5px solid #1e1e1e",paddingTop:8,marginTop:4}}>
                {e.notes}
              </div>
            )}
          </div>
        );
      })}

      {/* Past events */}
      {past.length>0&&(
        <div style={{marginTop:18}}>
          <div style={{fontSize:9,color:"#333",textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:700,marginBottom:10}}>Past Events</div>
          {past.slice().reverse().map(e=>(
            <div key={e.id} style={{background:"#0d0d0d",borderRadius:12,padding:"12px 14px",marginBottom:7,border:"1px solid #1a1a1a",opacity:0.7}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                <div style={{fontSize:13,fontWeight:600,color:"#555"}}>{e.name}</div>
                {e.date&&<span style={{fontSize:10,color:"#333"}}>{fmtDate(e.date)}</span>}
              </div>
              {e.location&&<div style={{fontSize:11,color:"#333",marginTop:2}}>📍 {e.location}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
