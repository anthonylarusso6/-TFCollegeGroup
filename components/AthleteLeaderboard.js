import { useState, useEffect } from "react";
import { BG, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { supabase } from "../lib/supabase";

export default function AthleteLeaderboard({athleteId}){
  const[lb,setLb]=useState([]);
  const[loading,setLoading]=useState(true);

  useEffect(()=>{
    loadLeaderboard();
  },[]);

  const loadLeaderboard=async()=>{
    try{
      // Query attendance and athletes separately to avoid join issues
      const[attRes,athRes]=await Promise.all([
        supabase.from("attendance").select("athlete_id,status"),
        supabase.from("athletes").select("id,name,photo_url,role").eq("status","active"),
      ]);

      const att=attRes.data||[];
      const aths=athRes.data||[];

      // Build athlete lookup
      const athMap={};
      aths.forEach(a=>{athMap[a.id]=a;});

      // Count early arrivals per athlete
      const counts={};
      att.forEach(r=>{
        if(!r.athlete_id)return;
        if(!counts[r.athlete_id])counts[r.athlete_id]=0;
        if(r.status==="early")counts[r.athlete_id]++;
      });

      // Build sorted leaderboard — only include athletes with check-ins
      const ranked=Object.keys(counts)
        .filter(id=>athMap[id])
        .map(id=>({
          athlete_id:id,
          early_count:counts[id],
          name:athMap[id]?.name||"Unknown",
          photo_url:athMap[id]?.photo_url||null,
          role:athMap[id]?.role||"iron",
        }))
        .sort((a,b)=>b.early_count-a.early_count);

      setLb(ranked);
    }catch(e){
      console.error("Leaderboard error:",e);
    }
    setLoading(false);
  };

  const myRank=lb.findIndex(r=>r.athlete_id===athleteId)+1;
  const myRow=lb.find(r=>r.athlete_id===athleteId);
  const maxEarly=lb.length>0?Math.max(...lb.map(r=>r.early_count||0),1):1;
  const podiumColors=[GOLD,"#C0C0C0","#CD7F32"];

  if(loading)return<div style={{textAlign:"center",padding:"2rem",color:"#888",fontSize:13}}>Loading leaderboard...</div>;
  if(lb.length===0)return(
    <div style={{background:"#fff",borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid #e0e0e0"}}>
      <div style={{fontSize:32,marginBottom:8}}>🏆</div>
      <div style={{fontSize:13,color:"#888"}}>No check-ins yet. Be the first to show up early!</div>
    </div>
  );

  return(
    <div>
      {/* My rank hero */}
      {myRow&&(
        <div style={{background:BG,borderRadius:16,padding:"1.5rem",marginBottom:12,border:"1px solid "+GOLD+"44",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GOLD+","+RED+")"}}/>
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:14}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:48,fontWeight:900,color:GOLD,lineHeight:1}}>#{myRank}</div>
              <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.08em",marginTop:2}}>Your rank</div>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:16,fontWeight:700,color:"#fff",marginBottom:8}}>{myRow.name}</div>
              <div style={{background:"#1a1a1a",borderRadius:8,padding:"8px 12px",textAlign:"center",display:"inline-block"}}>
                <div style={{fontSize:22,fontWeight:900,color:GREEN}}>{myRow.early_count}</div>
                <div style={{fontSize:10,color:"#555",marginTop:1}}>early arrivals</div>
              </div>
            </div>
          </div>
          <div style={{height:4,background:"#222",borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",width:((myRow.early_count||0)/maxEarly*100)+"%",background:"linear-gradient(90deg,"+GOLD+","+RED+")",borderRadius:2}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
            <div style={{fontSize:9,color:"#444"}}>0</div>
            <div style={{fontSize:9,color:"#444"}}>{maxEarly} (leader)</div>
          </div>
        </div>
      )}

      {/* Top 3 podium */}
      {lb.length>=2&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1.2fr 1fr",gap:8,marginBottom:12,alignItems:"flex-end"}}>
          {[1,0,2].map(displayPos=>{
            const rank=displayPos;// 0=gold,1=silver,2=bronze
            const r=lb[rank];
            if(!r)return<div key={displayPos}/>;
            const isMe=r.athlete_id===athleteId;
            const heights=["100px","80px","60px"];
            return(
              <div key={displayPos} style={{textAlign:"center"}}>
                <div style={{width:44,height:44,borderRadius:"50%",background:r.role==="forge"?RED:STEEL,margin:"0 auto 6px",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:600,color:"#fff",border:"2px solid "+podiumColors[rank],boxShadow:"0 0 10px "+podiumColors[rank]+"66"}}>
                  {r.photo_url?<img src={r.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(r.name||"?")[0]}
                </div>
                <div style={{fontSize:11,fontWeight:isMe?700:500,color:isMe?GOLD:"#1a1a1a",marginBottom:4}}>
                  {r.name?.split(" ")[0]}{isMe?" ⭐":""}
                </div>
                <div style={{background:podiumColors[rank],borderRadius:"8px 8px 0 0",height:heights[rank],display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",padding:"8px 4px"}}>
                  <div style={{fontSize:20,fontWeight:800,color:"#1a1a1a"}}>{rank===0?"🥇":rank===1?"🥈":"🥉"}</div>
                  <div style={{fontSize:14,fontWeight:700,color:"#1a1a1a"}}>{r.early_count}</div>
                  <div style={{fontSize:9,color:"#333"}}>early</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      <div style={{background:"#fff",borderRadius:12,border:"0.5px solid #e0e0e0",overflow:"hidden"}}>
        {lb.map((r,i)=>{
          const isMe=r.athlete_id===athleteId;
          return(
            <div key={r.athlete_id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderBottom:i<lb.length-1?"0.5px solid #f5f5f5":"none",background:isMe?"#fffdf0":"#fff"}}>
              <div style={{fontSize:13,fontWeight:700,color:i<3?podiumColors[i]:"#aaa",minWidth:24,textAlign:"center"}}>
                {i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}
              </div>
              <div style={{width:36,height:36,borderRadius:"50%",background:r.role==="forge"?RED:STEEL,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:600,color:"#fff",flexShrink:0}}>
                {r.photo_url?<img src={r.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(r.name||"?")[0]}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:isMe?700:500,color:isMe?GOLD:"#1a1a1a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {r.name}{isMe?" ⭐":""}
                </div>
                <div style={{height:4,background:"#f0f0f0",borderRadius:2,overflow:"hidden",marginTop:4}}>
                  <div style={{height:"100%",width:((r.early_count||0)/maxEarly*100)+"%",background:isMe?GOLD:GREEN,borderRadius:2}}/>
                </div>
              </div>
              <div style={{fontSize:14,fontWeight:700,color:isMe?GOLD:GREEN,minWidth:24,textAlign:"right"}}>{r.early_count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
