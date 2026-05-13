import { useState, useEffect, useRef } from "react";
import { BG, PUR, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { supabase } from "../lib/supabase";


export default function AnvilHistory(){
  const[anvils,setAnvils]=useState([]);
  const GOLD="#D4AF37",BG="#0f0f0f";
  useEffect(()=>{
    supabase.from("anvil").select("*").order("created_at",{ascending:false}).then(({data})=>setAnvils(data||[])).catch(()=>setAnvils([]));
  },[]);
  return(
    <div>
      <div style={{background:BG,borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid "+GOLD+"44",textAlign:"center"}}>
        <div style={{fontSize:32,marginBottom:8}}>⚒</div>
        <div style={{fontSize:15,fontWeight:500,color:GOLD,marginBottom:4}}>The Anvil</div>
        <div style={{fontSize:12,color:"#888"}}>Awarded each week to the athlete who did what nobody else did.</div>
      </div>
      {anvils.length===0&&<div style={{background:"#fff",borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid #e0e0e0"}}><div style={{fontSize:13,color:"#888"}}>No anvil winners yet.</div></div>}
      {anvils.map((a,i)=>(
        <div key={i} style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:8,border:"0.5px solid #e0e0e0",borderLeft:"4px solid "+GOLD}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:a.note?8:0}}>
            <div>
              <div style={{fontSize:15,fontWeight:600,color:"#1a1a1a"}}>{a.athlete_name}</div>
              <div style={{fontSize:11,color:"#888"}}>{a.date_awarded}</div>
            </div>
            <div style={{fontSize:24}}>⚒</div>
          </div>
          {a.note&&<div style={{fontSize:13,color:"#555",fontStyle:"italic",lineHeight:1.6}}>"{a.note}"</div>}
        </div>
      ))}
    </div>
  );
}

// ── Attendance Calendar ─────────────────────────────────────────
