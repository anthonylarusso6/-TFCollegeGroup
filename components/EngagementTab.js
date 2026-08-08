import { useState, useEffect } from "react";
import { PUR } from "../lib/constants";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";

export default function EngagementTab(){
  const[engAthletes,setEngAthletes]=useState([]);

  useEffect(()=>{
    (async()=>{
      try{const{data}=await supabase.from("athletes").select("id,name,photo_url,athletic_goal,character_goal,mindset_note_1,mindset_note_2,mindset_note_3,mindset_note_4,mindset_note_5,mindset_note_6").eq("status","active").order("name");if(data)setEngAthletes(data);}catch(e){}
    })();
  },[]);

  return(
            <div>
              <div style={{borderRadius:20,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+PUR+"33"}}>
                <div style={{background:"linear-gradient(140deg,"+PUR+"30,"+PUR+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+PUR+","+PUR+"44,transparent)"}}/>
                  <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="barChart" size={66} color="#fff"/></div>
                  <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+PUR+"12,transparent 70%)",pointerEvents:"none"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                    <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+PUR+"44,"+PUR+"22)",border:"1px solid "+PUR+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+PUR+"33"}}>📊</div>
                    <div>
                      <div style={{fontSize:8,color:PUR,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>App Usage</div>
                      <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Athlete Engagement</div>
                      <div style={{fontSize:11,color:"#666",marginTop:1}}>Goals, notes, and photos</div>
                    </div>
                  </div>
                </div>
                <div style={{background:"#111",padding:"16px 18px"}}>
                  <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:8,marginBottom:8,padding:"0 4px"}}>
                    <div style={{fontSize:11,fontWeight:500,color:"#555",textTransform:"uppercase",letterSpacing:"0.04em"}}>Athlete</div>
                    <div style={{fontSize:11,fontWeight:500,color:"#555",textTransform:"uppercase",letterSpacing:"0.04em",textAlign:"center"}}>Goals</div>
                    <div style={{fontSize:11,fontWeight:500,color:"#555",textTransform:"uppercase",letterSpacing:"0.04em",textAlign:"center"}}>Notes</div>
                    <div style={{fontSize:11,fontWeight:500,color:"#555",textTransform:"uppercase",letterSpacing:"0.04em",textAlign:"center"}}>Photo</div>
                  </div>
                  {engAthletes.map((a,i)=>{
                    const hasGoal=!!(a.athletic_goal||a.character_goal);
                    const noteCount=[1,2,3,4,5,6].filter(n=>a["mindset_note_"+n]).length;
                    const hasPhoto=!!a.photo_url;
                    return(
                      <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:8,padding:"10px 4px",borderBottom:i<engAthletes.length-1?"0.5px solid #1e1e1e":"none",alignItems:"center"}}>
                        <div style={{fontSize:13,fontWeight:500,color:"#ddd"}}>{a.name}</div>
                        <div style={{textAlign:"center",fontSize:14}}>{hasGoal?"✅":"⬜"}</div>
                        <div style={{textAlign:"center"}}><span style={{fontSize:12,fontWeight:600,color:noteCount>0?PUR:"#333"}}>{noteCount}</span></div>
                        <div style={{textAlign:"center",fontSize:14}}>{hasPhoto?"📸":"⬜"}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
  );
}
