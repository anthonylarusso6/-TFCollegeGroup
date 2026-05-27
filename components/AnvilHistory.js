import { useState, useEffect } from "react";
import { BG, GOLD, STEEL, RED, GREEN } from "../lib/constants";
import { supabase } from "../lib/supabase";

const ANVIL_CATS=[
  {id:"Effort",     emoji:"🔥",color:"#E8720C"},
  {id:"Performance",emoji:"🏆",color:GOLD},
  {id:"Leadership", emoji:"👑",color:"#C084FC"},
  {id:"Consistency",emoji:"💪",color:GREEN},
  {id:"Character",  emoji:"🧠",color:STEEL},
];
const catInfo=(id)=>ANVIL_CATS.find(c=>c.id===id)||{id:id||"",emoji:"⚒",color:GOLD};

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
  const latestCat=latest?catInfo(latest.athlete_role):null;

  return(
    <div>
      {/* No winners yet */}
      {anvils.length===0&&(
        <div style={{background:"linear-gradient(135deg,#1f1700,#2a2000)",borderRadius:16,padding:"2rem",marginBottom:12,border:"1px solid "+GOLD+"44",textAlign:"center"}}>
          <div style={{fontSize:52,marginBottom:8,filter:"drop-shadow(0 0 16px "+GOLD+"44)"}}>⚒</div>
          <div style={{fontSize:15,fontWeight:700,color:GOLD,marginBottom:4}}>The Anvil</div>
          <div style={{fontSize:12,color:"#555",lineHeight:1.6}}>Awarded each week to the one athlete<br/>who did what nobody else did.</div>
          <div style={{fontSize:10,color:"#444",marginTop:12,fontStyle:"italic",letterSpacing:"0.06em"}}>EARNED. NOT GIVEN.</div>
        </div>
      )}

      {/* Current champion hero */}
      {latest&&(
        <div style={{borderRadius:20,marginBottom:14,overflow:"hidden",boxShadow:"0 12px 48px "+GOLD+"22",border:"1px solid "+GOLD+"44",position:"relative"}}>
          {/* Gold shimmer bar */}
          <div style={{height:3,background:"linear-gradient(90deg,transparent,"+GOLD+","+GOLD+"88,transparent)"}}/>

          <div style={{background:"linear-gradient(160deg,#1f1700 0%,#0f0e00 60%,#0d0d0d 100%)",padding:"20px 18px 18px",position:"relative",overflow:"hidden"}}>
            {/* Big background anvil */}
            <div style={{position:"absolute",bottom:-12,right:-4,fontSize:100,opacity:0.06,lineHeight:1,userSelect:"none",filter:"saturate(0)"}}>⚒</div>

            <div style={{fontSize:9,color:GOLD,textTransform:"uppercase",letterSpacing:"0.22em",fontWeight:900,marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
              <span>⚡</span><span>This week&#39;s Anvil winner</span>
            </div>

            {/* Photo + name row */}
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:14}}>
              <div style={{width:72,height:72,borderRadius:"50%",flexShrink:0,border:"3px solid "+GOLD,overflow:"hidden",background:"#333",boxShadow:"0 0 32px "+GOLD+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:700,color:GOLD}}>
                {latestAth?.photo_url?
                  <img src={latestAth.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt={latest.athlete_name}/>
                  :(latest.athlete_name||"?")[0]
                }
              </div>
              <div>
                <div style={{fontSize:24,fontWeight:900,color:GOLD,letterSpacing:"-0.02em",lineHeight:1.1}}>{latest.athlete_name}</div>
                <div style={{fontSize:11,color:"#888",marginTop:2}}>{latest.date_awarded}</div>
                {latestCat&&(
                  <div style={{marginTop:6}}>
                    <span style={{fontSize:11,background:latestCat.color+"22",color:latestCat.color,padding:"3px 10px",borderRadius:20,fontWeight:700,border:"0.5px solid "+latestCat.color+"44"}}>
                      {latestCat.emoji} {latestCat.id}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Why they won — the citation */}
            {latest.note&&(
              <div style={{background:"rgba(212,175,55,0.06)",borderRadius:10,padding:"12px 14px",border:"1px solid "+GOLD+"22",position:"relative"}}>
                <div style={{fontSize:9,color:GOLD+"88",textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:700,marginBottom:6}}>Why they earned it</div>
                <div style={{fontSize:14,color:"#e8d5a0",lineHeight:1.7,fontStyle:"italic",fontFamily:"Georgia,serif"}}>
                  &#8220;{latest.note}&#8221;
                </div>
              </div>
            )}

            <div style={{marginTop:14,fontSize:10,color:"#444",letterSpacing:"0.1em",fontWeight:700,textTransform:"uppercase",textAlign:"center"}}>
              &#8212;&nbsp;&nbsp;Earned. Not given.&nbsp;&nbsp;&#8212;
            </div>
          </div>
        </div>
      )}

      {/* Previous winners */}
      {anvils.length>1&&(
        <div style={{background:"#0e0e0e",borderRadius:16,overflow:"hidden",border:"0.5px solid #1e1e1e"}}>
          <div style={{padding:"12px 16px",borderBottom:"0.5px solid #1a1a1a",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#777",textTransform:"uppercase",letterSpacing:"0.1em"}}>Previous winners</div>
            <div style={{fontSize:10,color:"#444"}}>{anvils.length-1} before this</div>
          </div>
          {anvils.slice(1).map((a,i)=>{
            const ath=athletes[a.athlete_name];
            const cat=catInfo(a.athlete_role);
            const timesWon=anvils.filter(x=>x.athlete_name===a.athlete_name).length;
            return(
              <div key={i} style={{padding:"12px 16px",borderBottom:i<anvils.length-2?"0.5px solid #171717":"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:40,height:40,borderRadius:"50%",overflow:"hidden",background:"#1a1a1a",border:"1.5px solid #2a2a2a",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:"#666"}}>
                    {ath?.photo_url?
                      <img src={ath.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt={a.athlete_name}/>
                      :(a.athlete_name||"?")[0]
                    }
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3,flexWrap:"wrap"}}>
                      <div style={{fontSize:13,fontWeight:600,color:"#ddd"}}>{a.athlete_name}</div>
                      <span style={{fontSize:9,background:cat.color+"18",color:cat.color,padding:"2px 7px",borderRadius:20,border:"0.5px solid "+cat.color+"33"}}>{cat.emoji} {cat.id}</span>
                      {timesWon>1&&<span style={{fontSize:9,color:"#555"}}>⚒ ×{timesWon}</span>}
                    </div>
                    {a.note&&(
                      <div style={{fontSize:11,color:"#888",fontStyle:"italic",lineHeight:1.5}}>&#8220;{a.note}&#8221;</div>
                    )}
                    <div style={{fontSize:10,color:"#444",marginTop:2}}>{a.date_awarded}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
