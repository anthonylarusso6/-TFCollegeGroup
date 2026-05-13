import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

const BG="#0f0f0f";
const PUR="#534AB7";
const RED="#C0392B";
const GREEN="#1E6B3A";
const GOLD="#D4AF37";
const STEEL="#708090";
const ORANGE="#E8720C";

export default function AthleteLeaderboard({athleteId}){
  const[lb,setLb]=useState([]);
  useEffect(()=>{
    supabase.from("leaderboard").select("*,athletes(name,photo_url,role)").order("early_count",{ascending:false}).then(({data})=>setLb(data||[]));
  },[]);
  const myRank=lb.findIndex(r=>r.athlete_id===athleteId)+1;
  const myRow=lb.find(r=>r.athlete_id===athleteId);
  const GOLD="#D4AF37",GREEN="#1E6B3A",RED="#C0392B",STEEL="#708090",BG="#0f0f0f";
  const maxEarly=lb.length>0?Math.max(...lb.map(r=>r.early_count||0),1):1;
  return(
    <div>
      {/* My rank hero card */}
      {myRow&&(
        <div style={{background:BG,borderRadius:16,padding:"1.5rem",marginBottom:12,border:"1px solid "+GOLD+"44",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GOLD+","+RED+")"}}/>
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:14}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:48,fontWeight:900,color:GOLD,lineHeight:1}}>#{myRank}</div>
              <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.08em",marginTop:2}}>Your rank</div>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:16,fontWeight:700,color:"#fff",marginBottom:8}}>{myRow.athletes?.name||"You"}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {[{label:"Early",val:myRow.early_count||0,color:GREEN},{label:"Streak 🔥",val:myRow.current_streak||0,color:RED},{label:"Best",val:myRow.best_streak||0,color:GOLD}].map(s=>(
                  <div key={s.label} style={{background:"#1a1a1a",borderRadius:8,padding:"6px",textAlign:"center"}}>
                    <div style={{fontSize:18,fontWeight:700,color:s.color}}>{s.val}</div>
                    <div style={{fontSize:9,color:"#555",marginTop:1}}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* My progress bar */}
          <div style={{height:4,background:"#222",borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",width:((myRow.early_count||0)/maxEarly*100)+"%",background:"linear-gradient(90deg,"+GOLD+","+RED+")",borderRadius:2}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
            <div style={{fontSize:9,color:"#444"}}>0</div>
            <div style={{fontSize:9,color:"#444"}}>{maxEarly} early (leader)</div>
          </div>
        </div>
      )}

      {/* Top 3 podium */}
      {lb.length>=3&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1.2fr 1fr",gap:8,marginBottom:12,alignItems:"flex-end"}}>
          {[1,0,2].map(pos=>{
            const r=lb[pos];
            if(!r)return<div key={pos}/>;
            const isMe=r.athlete_id===athleteId;
            const podiumColors=[GOLD,"#C0C0C0","#CD7F32"];
            const heights=["80px","100px","60px"];
            return(
              <div key={pos} style={{textAlign:"center"}}>
                <div style={{width:44,height:44,borderRadius:"50%",background:r.athletes?.role==="forge"?RED:STEEL,margin:"0 auto 6px",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:600,color:"#fff",border:"2px solid "+podiumColors[pos],boxShadow:"0 0 10px "+podiumColors[pos]+"66"}}>
                  {r.athletes?.photo_url?<img src={r.athletes.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(r.athletes?.name||"?")[0]}
                </div>
                <div style={{fontSize:11,fontWeight:isMe?700:500,color:isMe?GOLD:"#1a1a1a",marginBottom:4}}>{r.athletes?.name?.split(" ")[0]||"—"}{isMe?" ⭐":""}</div>
                <div style={{background:podiumColors[pos],borderRadius:"8px 8px 0 0",height:heights[pos],display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",padding:"8px 4px"}}>
                  <div style={{fontSize:20,fontWeight:800,color:"#1a1a1a"}}>{pos===0?"🥇":pos===1?"🥈":"🥉"}</div>
                  <div style={{fontSize:12,fontWeight:700,color:"#1a1a1a"}}>{r.early_count||0}</div>
                  <div style={{fontSize:9,color:"#333"}}>early</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Full rankings</div>
        {lb.map((r,i)=>{
          const isMe=r.athlete_id===athleteId;
          const pct=maxEarly>0?((r.early_count||0)/maxEarly*100):0;
          return(
            <div key={i} style={{padding:isMe?"10px 8px":"8px 0",marginBottom:4,background:isMe?"#fffbe6":"transparent",borderRadius:isMe?10:0,border:isMe?"1px solid "+GOLD+"44":"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:isMe?6:0}}>
                <div style={{width:26,fontSize:13,fontWeight:700,color:i===0?GOLD:i===1?"#999":i===2?"#CD7F32":"#aaa",textAlign:"center",flexShrink:0}}>
                  {i===0?"🥇":i===1?"🥈":i===2?"🥉":"#"+(i+1)}
                </div>
                <div style={{width:34,height:34,borderRadius:"50%",background:r.athletes?.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:500,color:"#fff",flexShrink:0,overflow:"hidden",border:isMe?"2px solid "+GOLD:"none"}}>
                  {r.athletes?.photo_url?<img src={r.athletes.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(r.athletes?.name||"?")[0]}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:isMe?700:500,color:"#1a1a1a"}}>{r.athletes?.name||"—"}{isMe?" (you)":""}</div>
                  <div style={{fontSize:10,color:"#aaa"}}>🔥 {r.current_streak||0} streak</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:16,fontWeight:700,color:i===0?GOLD:GREEN}}>{r.early_count||0}</div>
                  <div style={{fontSize:9,color:"#aaa"}}>early</div>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{marginLeft:70,height:3,background:"#f0f0f0",borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",width:pct+"%",background:i===0?"linear-gradient(90deg,"+GOLD+",#b8960e)":isMe?"linear-gradient(90deg,"+GOLD+","+RED+")":GREEN,borderRadius:2}}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
