import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

const BG="#0f0f0f";
const PUR="#534AB7";
const RED="#C0392B";
const GREEN="#1E6B3A";
const GOLD="#D4AF37";
const STEEL="#708090";
const ORANGE="#E8720C";

export default function GoalsCountdown({athlete}){
  const GREEN="#1E6B3A",PUR="#534AB7",GOLD="#D4AF37",BG="#0f0f0f";
  const[deadline,setDeadline]=useState(athlete?.goal_deadline||"");
  const[saving,setSaving]=useState(false);
  const daysLeft=deadline?Math.max(0,Math.ceil((new Date(deadline)-new Date())/(1000*60*60*24))):null;
  const save=async()=>{
    setSaving(true);
    await supabase.from("athletes").update({goal_deadline:deadline}).eq("id",athlete.id).catch(()=>{});
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
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Athletic goal</div>
        <div style={{fontSize:13,color:"#555",fontStyle:"italic",lineHeight:1.6,marginBottom:12}}>{athlete?.athletic_goal||"No goal set yet — go to My Profile to set one."}</div>
        <div style={{fontSize:11,color:"#888",marginBottom:6}}>Goal deadline</div>
        <input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} style={{width:"100%",padding:"10px",borderRadius:8,border:"0.5px solid #e0e0e0",fontSize:13,fontFamily:"Georgia,serif",background:"#fafafa",boxSizing:"border-box",marginBottom:10}}/>
        <button onClick={save} disabled={!deadline||saving} style={{width:"100%",padding:"10px",borderRadius:8,border:"none",background:GOLD,color:"#1a1a1a",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"Georgia,serif"}}>
          {saving?"Saving...":"Set deadline →"}
        </button>
      </div>
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:8}}>Character goal</div>
        <div style={{fontSize:13,color:"#555",fontStyle:"italic",lineHeight:1.6}}>{athlete?.character_goal||"No goal set yet."}</div>
      </div>
    </div>
  );
}

// ── Verse of the Day ────────────────────────────────────────────
