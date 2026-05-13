import { useState, useEffect, useRef } from "react";
import { BG, PUR, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { supabase } from "../lib/supabase";


export default function ClassCountdown(){
  const CLASS_START=new Date("2025-06-18T09:00:00");
  const now=new Date();
  const diff=CLASS_START-now;
    if(diff<=0)return null;
  const days=Math.floor(diff/(1000*60*60*24));
  const hours=Math.floor((diff%(1000*60*60*24))/(1000*60*60));
  const mins=Math.floor((diff%(1000*60*60))/(1000*60));
  return(
    <div style={{background:"#0f0f0f",borderRadius:12,padding:"1.5rem",marginBottom:12,border:"1px solid "+GOLD+"44",textAlign:"center",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,"+GOLD+",#C0392B)"}}/>
      <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>⚒ First class in</div>
      <div style={{display:"flex",justifyContent:"center",gap:20,marginBottom:8}}>
        {[{val:days,label:"Days"},{val:hours,label:"Hours"},{val:mins,label:"Mins"}].map(t=>(
          <div key={t.label}>
            <div style={{fontSize:36,fontWeight:800,color:GOLD,lineHeight:1}}>{String(t.val).padStart(2,"0")}</div>
            <div style={{fontSize:10,color:"#555",marginTop:4}}>{t.label}</div>
          </div>
        ))}
      </div>
      <div style={{fontSize:12,color:"#444"}}>June 18, 2025 · 9:00am</div>
    </div>
  );
}
