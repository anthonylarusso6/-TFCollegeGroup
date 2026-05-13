import { useState, useEffect, useRef } from "react";
import { BG, PUR, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { supabase } from "../lib/supabase";


export default function PrayerWall({athleteId, athleteName}){
  const[prayers,setPrayers]=useState([]);
  const[text,setText]=useState("");
  const[anon,setAnon]=useState(false);
  const[submitting,setSubmitting]=useState(false);
  const[submitted,setSubmitted]=useState(false);
  useEffect(()=>{
    supabase.from("inbox").select("*").eq("type","prayer").order("created_at",{ascending:false}).then(({data})=>setPrayers(data||[])).catch(()=>setPrayers([]));
  },[]);
  const submit=async()=>{
    if(!text.trim())return;
    setSubmitting(true);
    try{
      await supabase.from("inbox").insert({athlete_id:athleteId,type:"prayer",message:text,anonymous:anon});
      const{data}=await supabase.from("inbox").select("*").eq("type","prayer").order("created_at",{ascending:false});
      setPrayers(data||[]);
    }catch(e){}
    setText("");setSubmitting(false);setSubmitted(true);setTimeout(()=>setSubmitted(false),3000);
  };
  const PUR="#534AB7",GREEN="#1E6B3A",BG="#0f0f0f";
  return(
    <div>
      <div style={{background:BG,borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #333"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#fff",marginBottom:4}}>🙏 Prayer Wall</div>
        <div style={{fontSize:12,color:"#888",marginBottom:12}}>Submit a prayer request. Coach Ant and the group are praying for you.</div>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="What can the group pray for you about?" style={{width:"100%",minHeight:80,padding:"10px",borderRadius:8,border:"0.5px solid #333",background:"#141414",color:"#fff",fontSize:13,fontFamily:"Georgia,serif",resize:"none",boxSizing:"border-box",marginBottom:10}}/>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <button onClick={()=>setAnon(!anon)} style={{display:"flex",alignItems:"center",gap:6,background:"transparent",border:"none",cursor:"pointer",padding:0}}>
            <div style={{width:18,height:18,borderRadius:4,border:"1.5px solid "+(anon?PUR:"#555"),background:anon?PUR:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {anon&&<span style={{color:"#fff",fontSize:11}}>✓</span>}
            </div>
            <span style={{fontSize:12,color:"#888"}}>Submit anonymously</span>
          </button>
        </div>
        <button onClick={submit} disabled={submitting||!text.trim()} style={{width:"100%",padding:"12px",borderRadius:8,border:"none",background:text.trim()?PUR:"#333",color:text.trim()?"#fff":"#666",fontSize:14,fontWeight:500,cursor:"pointer",fontFamily:"Georgia,serif"}}>
          {submitted?"✓ Submitted — we're praying for you":submitting?"Submitting...":"Submit prayer request →"}
        </button>
      </div>
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Group prayer requests</div>
        {prayers.length===0&&<div style={{fontSize:12,color:"#888",textAlign:"center",padding:"1rem 0"}}>No prayer requests yet. Be the first to share.</div>}
        {prayers.map((p,i)=>(
          <div key={i} style={{padding:"10px 0",borderBottom:i<prayers.length-1?"0.5px solid #f0f0f0":"none"}}>
            <div style={{fontSize:11,color:PUR,fontWeight:500,marginBottom:3}}>{p.anonymous?"Anonymous":athleteName||"Athlete"}</div>
            <div style={{fontSize:13,color:"#1a1a1a",lineHeight:1.6}}>{p.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
