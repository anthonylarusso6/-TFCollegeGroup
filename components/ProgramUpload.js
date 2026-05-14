import { useState, useEffect } from "react";
import { BG, PUR, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { supabase } from "../lib/supabase";

const COMPOUND_LIFTS=[
  "Power Clean","Hang Clean","Back Squat","Front Squat","Deadlift",
  "Bench Press","Military Press","Push Press","Pull-ups","Bent Over Row",
  "Romanian Deadlift","Incline Bench","Hang Snatch","Push Jerk","Box Squat"
];

export default function ProgramUpload(){
  const[phase,setPhase]=useState("");
  const[selectedLifts,setSelectedLifts]=useState([]);
  const[notes,setNotes]=useState("");
  const[saved,setSaved]=useState(false);
  const[currentProgram,setCurrentProgram]=useState(null);
  const[loading,setLoading]=useState(true);

  useEffect(()=>{
    supabase.from("announcements").select("*").eq("type","program").order("created_at",{ascending:false}).limit(1)
      .then(({data})=>{
        if(data&&data[0]){
          const p=JSON.parse(data[0].message||"{}");
          setCurrentProgram(p);
          if(p.phase)setPhase(p.phase);
          if(p.lifts)setSelectedLifts(p.lifts);
          if(p.notes)setNotes(p.notes);
        }
        setLoading(false);
      }).catch(()=>setLoading(false));
  },[]);

  const toggleLift=(lift)=>{
    setSelectedLifts(prev=>prev.includes(lift)?prev.filter(l=>l!==lift):[...prev,lift]);
  };

  const saveProgram=async()=>{
    const program={phase,lifts:selectedLifts,notes,updatedAt:new Date().toISOString()};
    // Save to announcements table with type "program"
    const existing=await supabase.from("announcements").select("id").eq("type","program").limit(1);
    if(existing.data&&existing.data[0]){
      await supabase.from("announcements").update({message:JSON.stringify(program),active:true}).eq("id",existing.data[0].id);
    }else{
      await supabase.from("announcements").insert({type:"program",message:JSON.stringify(program),active:true});
    }
    setCurrentProgram(program);
    setSaved(true);setTimeout(()=>setSaved(false),3000);
  };

  if(loading)return<div style={{textAlign:"center",padding:"2rem",color:"#888",fontSize:13}}>Loading...</div>;

  return(
    <div>
      {/* Current program display */}
      {currentProgram&&(
        <div style={{background:"linear-gradient(135deg,#1a1400,#221b00)",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"1px solid "+GOLD+"33",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,"+GOLD+",transparent)"}}/>
          <div style={{fontSize:11,color:GOLD,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>⚡ Active program</div>
          <div style={{fontSize:15,fontWeight:700,color:"#fff",marginBottom:8}}>{currentProgram.phase||"Current phase"}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
            {(currentProgram.lifts||[]).map((l,i)=>(
              <span key={i} style={{fontSize:11,padding:"3px 10px",borderRadius:6,background:GOLD+"22",color:GOLD,fontWeight:600,border:"1px solid "+GOLD+"33"}}>{l}</span>
            ))}
          </div>
          {currentProgram.notes&&<div style={{fontSize:12,color:"#888",fontStyle:"italic"}}>{currentProgram.notes}</div>}
        </div>
      )}

      {/* Phase input */}
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>📋 Set training phase</div>
        <input value={phase} onChange={e=>setPhase(e.target.value)} placeholder="e.g. Strength Phase 1, Hypertrophy, Peaking..." style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"0.5px solid #e0e0e0",fontSize:13,fontFamily:"Georgia,serif",background:"#fafafa",color:"#1a1a1a",boxSizing:"border-box",marginBottom:12}}/>
        
        <div style={{fontSize:12,fontWeight:600,color:"#1a1a1a",marginBottom:8}}>Select key lifts for this phase:</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
          {COMPOUND_LIFTS.map((lift,i)=>{
            const isSelected=selectedLifts.includes(lift);
            return(
              <button key={i} onClick={()=>toggleLift(lift)} style={{padding:"8px 10px",borderRadius:8,border:"1px solid "+(isSelected?ORANGE:"#e0e0e0"),background:isSelected?ORANGE+"15":"#fafafa",color:isSelected?ORANGE:"#888",fontSize:11,fontWeight:isSelected?700:400,cursor:"pointer",fontFamily:"Georgia,serif",textAlign:"left"}}>
                {isSelected?"✓ ":""}{lift}
              </button>
            );
          })}
        </div>

        <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes for athletes (e.g. focus on depth, control the eccentric...)" style={{width:"100%",minHeight:60,padding:"10px",borderRadius:8,border:"0.5px solid #e0e0e0",fontSize:12,fontFamily:"Georgia,serif",background:"#fafafa",color:"#1a1a1a",resize:"vertical",boxSizing:"border-box",marginBottom:12}}/>

        <button onClick={saveProgram} disabled={!phase||selectedLifts.length===0} style={{width:"100%",padding:"12px",borderRadius:8,border:"none",background:phase&&selectedLifts.length>0?"linear-gradient(135deg,"+ORANGE+","+RED+")":"#e0e0e0",color:phase&&selectedLifts.length>0?"#fff":"#aaa",fontSize:13,fontWeight:600,cursor:phase&&selectedLifts.length>0?"pointer":"not-allowed",fontFamily:"Georgia,serif"}}>
          {saved?"✓ Program saved!":"Push program to athletes →"}
        </button>
        {selectedLifts.length>0&&<div style={{fontSize:11,color:"#aaa",textAlign:"center",marginTop:6}}>{selectedLifts.length} lifts selected</div>}
      </div>
    </div>
  );
}
