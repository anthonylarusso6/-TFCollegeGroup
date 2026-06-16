import { useState, useEffect, useRef } from "react";
import { BG, PUR, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { supabase } from "../lib/supabase";


export default function GoalsCountdown({athlete}){
  const GREEN="#1E6B3A",PUR="#534AB7",GOLD="#D4AF37",BG="#0f0f0f";
  const[deadline,setDeadline]=useState(athlete?.goal_deadline||"");
  const[saving,setSaving]=useState(false);
  const estNow=new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
  const daysLeft=deadline?Math.max(0,Math.ceil((new Date(deadline+"T23:59:59")-estNow)/(1000*60*60*24))):null;
  const save=async()=>{
    setSaving(true);
    try{await supabase.from("athletes").update({goal_deadline:deadline}).eq("id",athlete.id);}catch(e){}
    setSaving(false);
  };
  return(
    <div>
      {daysLeft!==null&&(
        <div style={{background:BG,borderRadius:12,padding:"2rem",textAlign:"center",marginBottom:12,border:"2px solid "+GOLD}}>
          <div style={{fontSize:64,fontWeight:700,color:GOLD,lineHeight:1}}>{daysLeft}</div>
          <div style={{fontSize:14,color:"#fff",marginTop:4}}>days until your goal deadline</div>
          <div style={{fontSize:11,color:"#555",marginTop:4}}>{deadline}</div>
        </div>
      )}
      <div style={{background:"rgba(255,255,255,0.045)",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"1px solid rgba(255,255,255,0.08)",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.05)"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#fff",marginBottom:12}}>Athletic goal</div>
        <div style={{fontSize:13,color:"#aaa",fontStyle:"italic",lineHeight:1.6,marginBottom:12}}>{athlete?.athletic_goal||"No goal set yet — go to My Profile to set one."}</div>
        <div style={{fontSize:11,color:"#888",marginBottom:6}}>Goal deadline</div>
        <input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} style={{width:"100%",padding:"10px",borderRadius:8,border:"0.5px solid rgba(255,255,255,0.1)",fontSize:13,fontFamily:"Georgia,serif",background:"rgba(255,255,255,0.05)",color:"#ddd",boxSizing:"border-box",marginBottom:10}}/>
        <button onClick={save} disabled={!deadline||saving} style={{width:"100%",padding:"10px",borderRadius:8,border:"none",background:GOLD,color:"#1a1a1a",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"Georgia,serif"}}>
          {saving?"Saving...":"Set deadline →"}
        </button>
      </div>
      <div style={{background:"rgba(255,255,255,0.045)",borderRadius:12,padding:"1.25rem",border:"1px solid rgba(255,255,255,0.08)",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.05)"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#fff",marginBottom:8}}>Character goal</div>
        <div style={{fontSize:13,color:"#aaa",fontStyle:"italic",lineHeight:1.6}}>{athlete?.character_goal||"No goal set yet."}</div>
      </div>
    </div>
  );
}

// ── Verse of the Day ────────────────────────────────────────────
