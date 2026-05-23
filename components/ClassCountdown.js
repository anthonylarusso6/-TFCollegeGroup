import { useState, useEffect } from "react";
import { GOLD, RED, GREEN, ORANGE } from "../lib/constants";

export default function ClassCountdown(){
  const[now,setNow]=useState(null);

  useEffect(()=>{
    setNow(new Date());
    const t=setInterval(()=>setNow(new Date()),1000);
    return()=>clearInterval(t);
  },[]);

  if(!now)return null;

  const CLASS_START=new Date("2026-05-19T09:00:00");
  const SEASON_END=new Date("2026-08-11T11:20:00");
  const TOTAL_WEEKS=12;

  // Before season
  if(now<CLASS_START){
    const diff=CLASS_START-now;
    const days=Math.floor(diff/(1000*60*60*24));
    const hours=Math.floor((diff%(1000*60*60*24))/(1000*60*60));
    const mins=Math.floor((diff%(1000*60*60))/(1000*60));
    const secs=Math.floor((diff%(1000*60))/1000);
    return(
      <div style={{background:"#0f0f0f",borderRadius:12,padding:"1.5rem",marginBottom:12,border:"1px solid "+GOLD+"44",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,"+GOLD+","+RED+")"}}/>
        <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:12}}>⚒ First class in</div>
        <div style={{display:"flex",justifyContent:"center",gap:12}}>
          {[{v:days,l:"Days"},{v:hours,l:"Hrs"},{v:mins,l:"Min"},{v:secs,l:"Sec"}].map(t=>(
            <div key={t.l} style={{background:"#1a1500",borderRadius:10,padding:"8px 12px",minWidth:52,border:"0.5px solid "+GOLD+"22"}}>
              <div style={{fontSize:26,fontWeight:900,color:GOLD,lineHeight:1,textAlign:"center"}}>{String(t.v).padStart(2,"0")}</div>
              <div style={{fontSize:9,color:"#555",marginTop:4,textAlign:"center",textTransform:"uppercase",letterSpacing:"0.05em"}}>{t.l}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:11,color:"#444",marginTop:10}}>May 19, 2026 · 9:00am · Iron sharpens iron</div>
      </div>
    );
  }

  // Season complete
  if(now>SEASON_END){
    return(
      <div style={{background:"linear-gradient(135deg,#0d1f0f,#1a3a1f)",borderRadius:12,padding:"1.5rem",marginBottom:12,border:"1px solid "+GREEN+"44",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,"+GREEN+","+GOLD+")"}}/>
        <div style={{fontSize:32,marginBottom:8}}>🏆</div>
        <div style={{fontSize:16,fontWeight:800,color:GREEN,marginBottom:4}}>Season Complete!</div>
        <div style={{fontSize:12,color:"#888"}}>12 weeks. Iron sharpened iron.</div>
        <div style={{fontSize:11,color:"#555",marginTop:6}}>May 19 — August 11, 2026</div>
      </div>
    );
  }

  // During season - show week progress
  const weeksSinceStart=(now-CLASS_START)/(1000*60*60*24*7);
  const currentWeek=Math.min(Math.floor(weeksSinceStart)+1,TOTAL_WEEKS);
  const pct=Math.round((currentWeek/TOTAL_WEEKS)*100);
  const daysLeft=Math.ceil((SEASON_END-now)/(1000*60*60*24));

  return(
    <div style={{background:"#0f0f0f",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"1px solid "+ORANGE+"33",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,"+ORANGE+","+GOLD+")"}}/>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div>
          <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:3}}>⚒ Season in progress</div>
          <div style={{fontSize:18,fontWeight:800,color:"#fff"}}>Week {currentWeek} <span style={{fontSize:12,color:"#555",fontWeight:400}}>of {TOTAL_WEEKS}</span></div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:22,fontWeight:900,color:ORANGE}}>{daysLeft}</div>
          <div style={{fontSize:9,color:"#555"}}>days left</div>
        </div>
      </div>
      <div style={{height:6,background:"#222",borderRadius:3,overflow:"hidden",marginBottom:4}}>
        <div style={{height:"100%",width:pct+"%",background:"linear-gradient(90deg,"+ORANGE+","+GOLD+")",borderRadius:3,transition:"width 0.5s"}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <div style={{fontSize:9,color:"#444"}}>Jun 18</div>
        <div style={{fontSize:9,color:ORANGE,fontWeight:600}}>{pct}% complete</div>
        <div style={{fontSize:9,color:"#444"}}>Sep 10</div>
      </div>
    </div>
  );
}
