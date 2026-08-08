import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";
import { PUR, GREEN } from "../lib/constants";

export default function PrayersTab(){
  const[coachPrayers,setCoachPrayers]=useState([]);
  const[prayedFor,setPrayedFor]=useState({});

  useEffect(()=>{
    (async()=>{
      try{const{data}=await supabase.from("inbox").select("*,athletes(name)").eq("type","prayer").order("created_at",{ascending:false});if(data)setCoachPrayers(data);}catch(e){}
    })();
  },[]);

  return (
            <div>
              <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+PUR+"33"}}>
                <div style={{background:"linear-gradient(140deg,"+PUR+"30,"+PUR+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+PUR+","+PUR+"44,transparent)"}}/>
                  <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="pray" size={66} color="#fff"/></div>
                  <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+PUR+"12,transparent 70%)",pointerEvents:"none"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                    <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+PUR+"44,"+PUR+"22)",border:"1px solid "+PUR+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+PUR+"33"}}>🙏</div>
                    <div>
                      <div style={{fontSize:8,color:PUR,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Athletes</div>
                      <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Prayer Requests</div>
                      <div style={{fontSize:11,color:"#666",marginTop:1}}>{coachPrayers.length} request{coachPrayers.length!==1?"s":""} from your athletes</div>
                    </div>
                  </div>
                </div>
                <div style={{background:"#111",padding:"0 18px"}}>
                  {coachPrayers.length===0&&<div style={{fontSize:13,color:"#555",textAlign:"center",padding:"1.5rem 0"}}>No prayer requests yet.</div>}
                  {coachPrayers.map((p,i)=>(
                    <div key={i} style={{padding:"14px 0",borderBottom:i<coachPrayers.length-1?"0.5px solid #1e1e1e":"none",borderLeft:"3px solid "+(prayedFor[p.id]?GREEN:PUR),paddingLeft:12,opacity:prayedFor[p.id]?0.6:1}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                        <div style={{fontSize:11,fontWeight:700,color:PUR,textTransform:"uppercase",letterSpacing:"0.06em"}}>{p.anonymous?"Anonymous":p.athletes?.name||"Athlete"}</div>
                        <div style={{fontSize:11,color:"#555"}}>{new Date(p.created_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{fontSize:13,color:"#ccc",lineHeight:1.7,fontStyle:"italic",marginBottom:10}}>"{p.message}"</div>
                      <button onClick={()=>setPrayedFor(prev=>({...prev,[p.id]:true}))} style={{padding:"6px 14px",borderRadius:8,border:"none",background:prayedFor[p.id]?GREEN+"22":PUR,color:prayedFor[p.id]?GREEN:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                        {prayedFor[p.id]?"✓ Prayed for":"Mark as prayed →"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
  );
}
