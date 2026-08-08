import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";
import { RED, GREEN, STEEL } from "../lib/constants";

export default function InjuriesTab({athletes=[]}){
  const[bodyInjuries,setBodyInjuries]=useState(null);
  const[injLoading,setInjLoading]=useState(false);
  const[injLoadErr,setInjLoadErr]=useState(false);
  const[injExpanded,setInjExpanded]=useState(null);

  const loadBodyInjuries=async()=>{
    setInjLoading(true);setInjLoadErr(false);
    try{
      const{data,error}=await supabase.from("announcements").select("day,week_label,message").eq("type","body_injury").eq("active",true);
      if(error)throw error;
      const result={};
      (data||[]).forEach(r=>{ if(!result[r.day])result[r.day]={}; try{result[r.day][r.week_label]=JSON.parse(r.message);}catch(e){} });
      setBodyInjuries(result);
    }catch(e){setInjLoadErr(true);setBodyInjuries({});}
    setInjLoading(false);
  };
  const clearInjuryPart=async(athleteId,partId)=>{
    try{
      await supabase.from("announcements").update({active:false}).eq("type","body_injury").eq("day",String(athleteId)).eq("week_label",partId).eq("active",true);
      setBodyInjuries(prev=>{ const base=prev||{}; const u={...base,[String(athleteId)]:{...(base[String(athleteId)]||{})}}; delete u[String(athleteId)][partId]; return u; });
    }catch(e){}
  };

  useEffect(()=>{loadBodyInjuries();},[]);

  const SORE="#C8941F";
  const activeAthletes=athletes.filter(a=>a.status==="active");
  if(injLoading||!bodyInjuries){return(<div style={{textAlign:"center",padding:"40px",color:"#555",fontSize:13}}>Loading injuries...</div>);}
  const flagged=activeAthletes.filter(a=>{
    const parts=(bodyInjuries||{})[String(a.id)]||{};
    return Object.values(parts).some(p=>p.status==="sore"||p.status==="pain");
  });
  const clear=activeAthletes.filter(a=>{
    const parts=(bodyInjuries||{})[String(a.id)]||{};
    return !Object.values(parts).some(p=>p.status==="sore"||p.status==="pain");
  });
  return(
    <div>
      <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+RED+"33"}}>
        <div style={{background:"linear-gradient(140deg,"+RED+"30,"+RED+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+RED+","+RED+"44,transparent)"}}/>
          <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.07,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="activity" size={66} color="#fff"/></div>
          <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
            <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+RED+"44,"+RED+"22)",border:"1px solid "+RED+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>🩺</div>
            <div>
              <div style={{fontSize:8,color:RED,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Athletes</div>
              <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Injury Check-In</div>
              <div style={{fontSize:11,color:"#666",marginTop:1}}>
                {injLoading?"Loading injuries...":`${flagged.length} flagged · ${clear.length} all good`}
                <button onClick={loadBodyInjuries} style={{marginLeft:10,fontSize:10,color:"#555",background:"transparent",border:"1px solid #333",padding:"2px 8px",borderRadius:8,cursor:"pointer",fontFamily:"Georgia,serif"}}>{injLoading?"...":"↻ Refresh"}</button>
                {injLoadErr&&<span style={{marginLeft:8,fontSize:10,color:RED}}>Load failed — tap Refresh</span>}
              </div>
            </div>
          </div>
        </div>
        <div style={{background:"#111",padding:"16px 18px"}}>
          {injLoading&&(
            <div style={{textAlign:"center",padding:"24px",color:"#555",fontSize:13}}>Loading injury data...</div>
          )}
          {!injLoading&&flagged.length===0&&(
            <div style={{textAlign:"center",padding:"24px",color:"#555",fontSize:13,fontStyle:"italic"}}>{injLoadErr?"Failed to load — tap Refresh above":"No athletes have flagged any body parts 💚"}</div>
          )}
          {flagged.map(a=>{
            const parts=bodyInjuries[String(a.id)]||{};
            const painParts=Object.entries(parts).filter(([,v])=>v.status==="pain");
            const soreParts=Object.entries(parts).filter(([,v])=>v.status==="sore");
            const isOpen=injExpanded===a.id;
            return(
              <div key={a.id} style={{borderBottom:"0.5px solid #1e1e1e",paddingBottom:12,marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setInjExpanded(isOpen?null:a.id)}>
                  <div style={{width:38,height:38,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:600,color:"#fff",flexShrink:0,overflow:"hidden"}}>
                    {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(a.name||"?")[0]}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#ddd",marginBottom:4}}>{a.name}</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                      {painParts.map(([id])=>(
                        <span key={id} style={{fontSize:9,background:RED+"22",color:RED,padding:"2px 8px",borderRadius:10,border:"1px solid "+RED+"44",fontWeight:700}}>🔴 {id.replace(/_/g," ")}</span>
                      ))}
                      {soreParts.map(([id])=>(
                        <span key={id} style={{fontSize:9,background:SORE+"22",color:SORE,padding:"2px 8px",borderRadius:10,border:"1px solid "+SORE+"44",fontWeight:600}}>🟡 {id.replace(/_/g," ")}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{fontSize:12,color:"#555"}}>{isOpen?"▲":"▼"}</div>
                </div>
                {isOpen&&(
                  <div style={{marginTop:12,paddingLeft:48}}>
                    {[...painParts,...soreParts].map(([id,v])=>(
                      <div key={id} style={{marginBottom:8,padding:"10px 12px",borderRadius:10,background:"#0e0e0e",border:"1px solid "+(v.status==="pain"?RED+"33":SORE+"33"),borderLeft:"3px solid "+(v.status==="pain"?RED:SORE)}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:v.description?6:0}}>
                          <span style={{fontSize:12,fontWeight:700,color:"#ddd",textTransform:"capitalize"}}>{id.replace(/_/g," ")}</span>
                          <span style={{fontSize:10,color:v.status==="pain"?RED:SORE,fontWeight:700,background:(v.status==="pain"?RED:SORE)+"18",padding:"2px 8px",borderRadius:8}}>
                            {v.status==="pain"?"In Pain":"A Little Sore"}{v.pain>0?" · "+v.pain+"/10":""}
                          </span>
                        </div>
                        {v.description&&<div style={{fontSize:12,color:"#777",lineHeight:1.55,fontStyle:"italic"}}>"{v.description}"</div>}
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:4}}>
                          {v.updatedAt&&<div style={{fontSize:9,color:"#444"}}>{new Date(v.updatedAt).toLocaleDateString("en-US",{timeZone:"America/New_York",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</div>}
                          <button onClick={()=>clearInjuryPart(a.id,id)} style={{fontSize:10,padding:"3px 10px",borderRadius:6,border:"0.5px solid "+GREEN+"55",background:"#081a0d",color:GREEN,cursor:"pointer",fontFamily:"Georgia,serif",marginLeft:"auto"}}>✓ Mark cleared</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {clear.length>0&&flagged.length>0&&(
            <div style={{paddingTop:8,borderTop:"0.5px solid #1a1a1a"}}>
              <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>All Good</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {clear.map(a=>(
                  <div key={a.id} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:20,background:"#141414",border:"0.5px solid #1e1e1e"}}>
                    <div style={{width:20,height:20,borderRadius:"50%",background:GREEN+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9}}>✓</div>
                    <span style={{fontSize:11,color:"#666"}}>{a.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
