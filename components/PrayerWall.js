import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function PrayerWall({athleteId, athleteName}){
  const[prayers,setPrayers]=useState([]);
  const[text,setText]=useState("");
  const[anon,setAnon]=useState(false);
  const[submitting,setSubmitting]=useState(false);
  const[submitted,setSubmitted]=useState(false);

  const PUR="#534AB7";

  useEffect(()=>{
    (async()=>{
      try{
        const{data}=await supabase.from("inbox").select("*").eq("type","prayer").order("created_at",{ascending:false});
        setPrayers(data||[]);
      }catch(e){setPrayers([]);}
    })();
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

  return(
    <div>
      {/* Submit banner */}
      <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+PUR+"33"}}>
        <div style={{background:"linear-gradient(140deg,"+PUR+"30,"+PUR+"10,#0d0d0d)",padding:"20px 18px 18px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+PUR+","+PUR+"44,transparent)"}}/>
          <div style={{position:"absolute",bottom:-10,right:-8,fontSize:72,opacity:0.08,lineHeight:1,userSelect:"none",filter:"saturate(0)"}}>🙏</div>
          <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+PUR+"12,transparent 70%)",pointerEvents:"none"}}/>
          <div style={{display:"flex",alignItems:"flex-start",gap:14,position:"relative",marginBottom:16}}>
            <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+PUR+"44,"+PUR+"22)",border:"1px solid "+PUR+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+PUR+"33"}}>🙏</div>
            <div style={{flex:1}}>
              <div style={{fontSize:8,color:PUR,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Community</div>
              <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em",lineHeight:1.1}}>Prayer Wall</div>
              <div style={{fontSize:11,color:"#666",marginTop:3}}>Coach Ant and the group are praying for you.</div>
            </div>
          </div>
          <textarea
            value={text}
            onChange={e=>setText(e.target.value)}
            placeholder="What can the group pray for you about?"
            style={{width:"100%",minHeight:90,padding:"12px 14px",borderRadius:12,border:"1px solid #2a2a2a",background:"#0a0a0a",color:"#fff",fontSize:13,fontFamily:"Georgia,serif",resize:"none",boxSizing:"border-box",marginBottom:12,lineHeight:1.6,outline:"none",transition:"border-color 0.2s"}}
            onFocus={e=>e.target.style.borderColor=PUR+"88"}
            onBlur={e=>e.target.style.borderColor="#2a2a2a"}
          />
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
            <button onClick={()=>setAnon(!anon)} style={{display:"flex",alignItems:"center",gap:7,background:"transparent",border:"none",cursor:"pointer",padding:0,flexShrink:0}}>
              <div style={{width:18,height:18,borderRadius:4,border:"1.5px solid "+(anon?PUR:"#555"),background:anon?PUR:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {anon&&<span style={{color:"#fff",fontSize:11}}>✓</span>}
              </div>
              <span style={{fontSize:12,color:"#777"}}>Submit anonymously</span>
            </button>
            <button
              onClick={submit}
              disabled={submitting||!text.trim()}
              style={{padding:"11px 22px",borderRadius:12,border:"none",background:text.trim()?"linear-gradient(135deg,"+PUR+",#3a2d8f)":"#1e1e1e",color:text.trim()?"#fff":"#444",fontSize:13,fontWeight:800,cursor:text.trim()?"pointer":"default",fontFamily:"Georgia,serif",boxShadow:text.trim()?"0 0 16px "+PUR+"44":"none",transition:"all 0.2s",whiteSpace:"nowrap",letterSpacing:"0.02em"}}
            >
              {submitted?"✓ Praying for you":submitting?"Submitting...":"Submit →"}
            </button>
          </div>
        </div>
      </div>

      {/* Group wall */}
      <div style={{borderRadius:20,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid #222"}}>
        <div style={{background:"#111",padding:"14px 18px",borderBottom:"0.5px solid #1e1e1e"}}>
          <div style={{fontSize:10,fontWeight:700,color:"#555",textTransform:"uppercase",letterSpacing:"0.14em"}}>Group prayer requests</div>
        </div>
        <div style={{background:"#0e0e0e",padding:"0 18px"}}>
          {prayers.length===0&&(
            <div style={{fontSize:12,color:"#444",textAlign:"center",padding:"1.5rem 0"}}>No prayer requests yet. Be the first to share.</div>
          )}
          {prayers.map((p,i)=>(
            <div key={i} style={{padding:"14px 0",borderBottom:i<prayers.length-1?"0.5px solid #1a1a1a":"none"}}>
              <div style={{fontSize:10,color:PUR,fontWeight:700,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.08em"}}>{p.anonymous?"Anonymous":athleteName||"Athlete"}</div>
              <div style={{fontSize:13,color:"#ccc",lineHeight:1.75,fontStyle:"italic"}}>"{p.message}"</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
