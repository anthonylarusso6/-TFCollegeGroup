import { useState, useEffect } from "react";
import { BG, GOLD, STEEL, RED } from "../lib/constants";
import { supabase } from "../lib/supabase";

export default function AnvilHistory(){
  const[anvils,setAnvils]=useState([]);
  const[athletes,setAthletes]=useState({});

  useEffect(()=>{
    (async()=>{
      try{
        const{data}=await supabase.from("anvil").select("*").order("created_at",{ascending:false});
        setAnvils(data||[]);
        if(data&&data.length>0){
          const names=[...new Set(data.map(a=>a.athlete_name))];
          try{
            const{data:aths}=await supabase.from("athletes").select("name,photo_url,role").in("name",names);
            const map={};
            (aths||[]).forEach(a=>map[a.name]=a);
            setAthletes(map);
          }catch(e){}
        }
      }catch(e){}
    })();
  },[]);

  const latest=anvils[0];
  const latestAth=latest?athletes[latest.athlete_name]:null;

  return(
    <div>
      {/* Hero card for latest winner */}
      {latest?(
        <div style={{background:"linear-gradient(135deg,#1f1700,#2a2000)",borderRadius:16,padding:"1.5rem",marginBottom:12,border:"1px solid "+GOLD+"44",position:"relative",overflow:"hidden",textAlign:"center"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,transparent,"+GOLD+",transparent)"}}/>
          <div style={{fontSize:10,color:GOLD,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:12}}>⚒ This week's Anvil</div>
          {/* Winner photo */}
          <div style={{width:90,height:90,borderRadius:"50%",margin:"0 auto 12px",border:"3px solid "+GOLD,overflow:"hidden",background:"#333",boxShadow:"0 0 30px "+GOLD+"55",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,fontWeight:700,color:GOLD}}>
            {latestAth?.photo_url?
              <img src={latestAth.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt={latest.athlete_name}/>
              :(latest.athlete_name||"?")[0]
            }
          </div>
          <div style={{fontSize:22,fontWeight:800,color:GOLD,marginBottom:4}}>{latest.athlete_name}</div>
          <div style={{fontSize:11,color:"#888",marginBottom:8}}>{latest.date_awarded}</div>
          {latest.note&&(
            <div style={{fontSize:13,color:"#ccc",fontStyle:"italic",lineHeight:1.7,padding:"10px 16px",background:"rgba(255,255,255,0.05)",borderRadius:8}}>
              "{latest.note}"
            </div>
          )}
          <div style={{fontSize:48,marginTop:12,filter:"drop-shadow(0 0 12px "+GOLD+"88)"}}>⚒</div>
        </div>
      ):(
        <div style={{background:"linear-gradient(135deg,#1f1700,#2a2000)",borderRadius:16,padding:"1.5rem",marginBottom:12,border:"1px solid "+GOLD+"44",textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:8,filter:"drop-shadow(0 0 12px "+GOLD+"44)"}}>⚒</div>
          <div style={{fontSize:15,fontWeight:600,color:GOLD,marginBottom:4}}>The Anvil</div>
          <div style={{fontSize:12,color:"#555"}}>Awarded each week to the athlete who did what nobody else did.</div>
        </div>
      )}

      {/* History list */}
      {anvils.length>1&&(
        <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0"}}>
          <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Previous winners</div>
          {anvils.slice(1).map((a,i)=>{
            const ath=athletes[a.athlete_name];
            return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<anvils.length-2?"0.5px solid #f0f0f0":"none"}}>
                <div style={{width:42,height:42,borderRadius:"50%",overflow:"hidden",background:"#f0f0f0",border:"2px solid "+GOLD+"44",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:GOLD}}>
                  {ath?.photo_url?
                    <img src={ath.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt={a.athlete_name}/>
                    :(a.athlete_name||"?")[0]
                  }
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a"}}>{a.athlete_name}</div>
                  {a.note&&<div style={{fontSize:11,color:"#888",fontStyle:"italic",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>"{a.note}"</div>}
                </div>
                <div style={{fontSize:11,color:"#aaa",flexShrink:0}}>{a.date_awarded}</div>
                <div style={{fontSize:18}}>⚒</div>
              </div>
            );
          })}
        </div>
      )}

      {anvils.length===0&&(
        <div style={{background:"#fff",borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid #e0e0e0"}}>
          <div style={{fontSize:13,color:"#888"}}>No anvil winners yet. The first one will be earned on June 18th.</div>
        </div>
      )}
    </div>
  );
}
