import { useState, useEffect, useRef } from "react";
import { BG, PUR, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { supabase } from "../lib/supabase";


export default function AchievementBadges({athlete}){
  const GOLD="#D4AF37",GREEN="#1E6B3A",RED="#C0392B",PUR="#534AB7";
  const[lb,setLb]=useState(null);
  const[myAnvils,setMyAnvils]=useState([]);
  useEffect(()=>{
    if(!athlete?.id)return;
    (async()=>{
      try{const{data}=await supabase.from("leaderboard").select("*").eq("athlete_id",athlete.id).single();setLb(data||{});}catch(e){setLb({});}
      try{const{data}=await supabase.from("anvil").select("*");setMyAnvils((data||[]).filter(a=>a.athlete_name===athlete.name));}catch(e){}
    })();
  },[athlete?.id]);
  const streak=lb?.current_streak||0;
  const early=lb?.early_count||0;
  const anvilCount=myAnvils.length;
  const BADGES=[
    {icon:"🌅",label:"First Light",desc:"First early check-in",earned:early>=1,color:GREEN},
    {icon:"🔥",label:"On Fire",desc:"5-day streak",earned:streak>=5,color:RED},
    {icon:"💥",label:"Unstoppable",desc:"10-day streak",earned:streak>=10,color:RED},
    {icon:"⚡",label:"Consistent",desc:"10 early check-ins",earned:early>=10,color:PUR},
    {icon:"💪",label:"Iron Standard",desc:"25 early check-ins",earned:early>=25,color:PUR},
    {icon:"⚒",label:"The Anvil",desc:"Won the Anvil award",earned:anvilCount>=1,color:GOLD},
    {icon:"👑",label:"Anvil Legend",desc:"Won Anvil 3 times",earned:anvilCount>=3,color:GOLD},
    {icon:"🙏",label:"Iron & Faith",desc:"Part of TF College Group",earned:true,color:PUR},
  ];
  const earned=BADGES.filter(b=>b.earned);
  const locked=BADGES.filter(b=>!b.earned);
  return(
    <div>
      <div style={{background:"#0f0f0f",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #222"}}>
        <div style={{fontSize:11,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>🏅 Achievements</div>
        <div style={{fontSize:13,color:"#fff",marginBottom:8}}>{earned.length} of {BADGES.length} badges earned</div>
        <div style={{height:4,background:"#222",borderRadius:2,overflow:"hidden"}}>
          <div style={{height:"100%",width:(earned.length/BADGES.length*100)+"%",background:"linear-gradient(90deg,"+GOLD+","+RED+")",borderRadius:2}}/>
        </div>
      </div>
      {earned.length>0&&(
        <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
          <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Earned</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {earned.map((b,i)=>(
              <div key={i} style={{textAlign:"center",padding:"12px 8px",background:b.color+"11",borderRadius:10,border:"1px solid "+b.color+"33"}}>
                <div style={{fontSize:28,marginBottom:4}}>{b.icon}</div>
                <div style={{fontSize:11,fontWeight:600,color:b.color,marginBottom:2}}>{b.label}</div>
                <div style={{fontSize:10,color:"#888"}}>{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {locked.length>0&&(
        <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0"}}>
          <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Locked</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {locked.map((b,i)=>(
              <div key={i} style={{textAlign:"center",padding:"12px 8px",background:"#f9f9f9",borderRadius:10,border:"0.5px solid #e0e0e0",opacity:0.5}}>
                <div style={{fontSize:28,marginBottom:4,filter:"grayscale(1)"}}>{b.icon}</div>
                <div style={{fontSize:11,fontWeight:600,color:"#888",marginBottom:2}}>{b.label}</div>
                <div style={{fontSize:10,color:"#aaa"}}>{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
