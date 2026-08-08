import { useState } from "react";
import { supabase } from "../lib/supabase";
import { GOLD, GREEN, STEEL, RED } from "../lib/constants";

export default function AnvilTab({ athletes=[], anvil=[], setAnvil, anvilPrizes={}, loadAll }){
  const[anvilWinner,setAnvilWinner]=useState("");
  const[anvilNote,setAnvilNote]=useState("");
  const[anvilDate,setAnvilDate]=useState("");
  const[anvilCategory,setAnvilCategory]=useState("Effort");

  const awardAnvil=async()=>{
    if(!anvilWinner.trim())return;
    const _n=new Date();const _e=new Date(_n.toLocaleString("en-US",{timeZone:"America/New_York"}));const _iso=_e.getFullYear()+"-"+String(_e.getMonth()+1).padStart(2,"0")+"-"+String(_e.getDate()).padStart(2,"0");
    await supabase.from("anvil").insert({athlete_name:anvilWinner,note:anvilNote,date_awarded:anvilDate||_iso,type:"individual",athlete_role:anvilCategory});
    const ath=athletes.find(a=>a.name===anvilWinner);
    if(ath){
      const{data:lb}=await supabase.from("leaderboard").select("*").eq("athlete_id",ath.id);
      if(lb&&lb.length>0)await supabase.from("leaderboard").update({anvil_count:(lb[0].anvil_count||0)+1}).eq("athlete_id",ath.id);
    }
    setAnvilWinner("");setAnvilNote("");setAnvilDate("");setAnvilCategory("Effort");
    await loadAll();
  };

  const ANVIL_CATS=[
    {id:"Effort",     emoji:"🔥",color:"#E8720C",desc:"Left everything on the floor"},
    {id:"Performance",emoji:"🏆",color:GOLD,    desc:"Hit a mark nobody else reached"},
    {id:"Leadership", emoji:"👑",color:"#C084FC",desc:"Elevated everyone around them"},
    {id:"Consistency",emoji:"💪",color:GREEN,   desc:"Showed up every single time"},
    {id:"Character",  emoji:"🧠",color:STEEL,   desc:"Did the hard thing without being asked"},
  ];
  const catInfo=(id)=>ANVIL_CATS.find(c=>c.id===id)||ANVIL_CATS[0];
  const indivAnvil=anvil.filter(a=>a.type==="individual");
  return(
  <div>
    {/* Award form */}
    <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+GOLD+"33"}}>
      <div style={{background:"linear-gradient(140deg,"+GOLD+"30,"+GOLD+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GOLD+","+GOLD+"44,transparent)"}}/>
        <div style={{position:"absolute",bottom:-10,right:-8,fontSize:72,opacity:0.08,lineHeight:1,userSelect:"none",filter:"saturate(0)"}}>⚒</div>
        <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+GOLD+"12,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
          <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+GOLD+"44,"+GOLD+"22)",border:"1px solid "+GOLD+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+GOLD+"33"}}>⚒️</div>
          <div>
            <div style={{fontSize:8,color:GOLD,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Bi-Weekly Honor</div>
            <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Award the Anvil</div>
            <div style={{fontSize:11,color:"#666",marginTop:1}}>Earned. Not given. The highest individual honor in TF College Group.</div>
          </div>
        </div>
      </div>
      <div style={{background:"#111",padding:"16px 18px"}}>
        <div style={{fontSize:11,color:"#666",marginBottom:8}}>Tap to select athlete</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
          {athletes.filter(a=>a.status==="active").map(a=>{
            const isSelected=anvilWinner===a.name;
            const timesWon=indivAnvil.filter(w=>w.athlete_name===a.name).length;
            return(
              <button key={a.id} onClick={()=>setAnvilWinner(isSelected?"":a.name)} style={{padding:"8px 4px",borderRadius:10,border:"2px solid "+(isSelected?GOLD:"#252525"),background:isSelected?"#1f1700":"#1a1a1a",cursor:"pointer",fontFamily:"Georgia,serif",textAlign:"center",position:"relative"}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,margin:"0 auto 4px",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:500,color:"#fff",border:isSelected?"2px solid "+GOLD:"none"}}>
                  {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(a.name||"?")[0]}
                </div>
                <div style={{fontSize:10,fontWeight:500,color:isSelected?GOLD:"#aaa",lineHeight:1.2}}>{a.name.split(" ")[0]}</div>
                {timesWon>0&&<div style={{fontSize:9,color:GOLD}}>⚒ ×{timesWon}</div>}
                {isSelected&&<div style={{position:"absolute",top:3,right:3,fontSize:12}}>⭐</div>}
              </button>
            );
          })}
        </div>
        {anvilWinner&&(
          <div style={{background:"#1f1700",borderRadius:10,padding:"10px 12px",marginBottom:12,border:"0.5px solid "+GOLD+"44",display:"flex",alignItems:"center",gap:8}}>
            <div style={{fontSize:20}}>⚒</div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,color:GOLD,fontWeight:700}}>{anvilWinner}</div>
              <div style={{fontSize:11,color:"#888",marginTop:1}}>
                {indivAnvil.filter(w=>w.athlete_name===anvilWinner).length>0
                  ?"Won it "+(indivAnvil.filter(w=>w.athlete_name===anvilWinner).length)+" time"+(indivAnvil.filter(w=>w.athlete_name===anvilWinner).length!==1?"s":"")+" before"
                  :"First time winner — make it count"}
              </div>
            </div>
          </div>
        )}
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,color:"#666",marginBottom:6}}>Reason category</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {ANVIL_CATS.map(c=>(
              <button key={c.id} onClick={()=>setAnvilCategory(c.id)} style={{padding:"8px 10px",borderRadius:10,border:"1.5px solid "+(anvilCategory===c.id?c.color+"88":"#252525"),background:anvilCategory===c.id?c.color+"18":"#1a1a1a",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16}}>{c.emoji}</span>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:anvilCategory===c.id?c.color:"#aaa"}}>{c.id}</div>
                  <div style={{fontSize:9,color:"#555"}}>{c.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:8}}>
          <div style={{fontSize:11,color:"#666",marginBottom:4}}>Week / date</div>
          <input value={anvilDate} onChange={e=>setAnvilDate(e.target.value)} placeholder="e.g. Week 1 · June 2" style={{width:"100%",padding:"8px",fontSize:13,border:"0.5px solid #333",borderRadius:8,background:"#1a1a1a",color:"#ddd",fontFamily:"Georgia,serif",boxSizing:"border-box"}}/>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <div style={{fontSize:11,color:"#666"}}>Why they earned it <span style={{color:RED}}>*</span></div>
            <div style={{fontSize:10,color:anvilNote.length>20?GOLD:"#444"}}>{anvilNote.length} chars</div>
          </div>
          <textarea value={anvilNote} onChange={e=>setAnvilNote(e.target.value)} placeholder="Be specific. What did they do that nobody else did this week? This becomes part of their permanent record." style={{width:"100%",minHeight:80,padding:"10px",fontSize:13,border:"0.5px solid "+(anvilNote.length>10?"#444":"#333"),borderRadius:8,background:"#1a1a1a",color:"#ddd",fontFamily:"Georgia,serif",resize:"vertical",boxSizing:"border-box",lineHeight:1.6}}/>
          <div style={{fontSize:10,color:"#444",marginTop:4,fontStyle:"italic"}}>Athletes can see exactly what you write here.</div>
        </div>
        <button onClick={awardAnvil} disabled={!anvilWinner||!anvilNote.trim()} style={{width:"100%",padding:"13px",borderRadius:8,border:"none",background:(anvilWinner&&anvilNote.trim())?"linear-gradient(135deg,"+GOLD+","+GOLD+"cc)":"#252525",color:(anvilWinner&&anvilNote.trim())?"#1a1a1a":"#555",fontSize:14,fontWeight:700,cursor:(anvilWinner&&anvilNote.trim())?"pointer":"not-allowed",fontFamily:"Georgia,serif",letterSpacing:"0.02em"}}>
          ⚒ Award The Anvil
        </button>
      </div>
    </div>

    {/* Never won section */}
    {(()=>{
      const winners=new Set(indivAnvil.map(w=>w.athlete_name));
      const neverWon=athletes.filter(a=>a.status==="active"&&!winners.has(a.name));
      if(!neverWon.length)return null;
      return(
        <div style={{background:"#111",borderRadius:20,padding:"1.25rem",marginBottom:12,border:"0.5px solid #252525"}}>
          <div style={{fontSize:13,fontWeight:600,color:"#fff",marginBottom:2}}>Yet to be recognized</div>
          <div style={{fontSize:12,color:"#555",marginBottom:10}}>{neverWon.length} athlete{neverWon.length!==1?"s":""} still waiting for their first</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {neverWon.map((a,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:20,background:"#1a1a1a",border:"0.5px solid #252525"}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",fontWeight:500,flexShrink:0}}>
                  {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(a.name||"?")[0]}
                </div>
                <span style={{fontSize:12,color:"#ddd"}}>{a.name.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </div>
      );
    })()}

    {/* Hall of Fame */}
    <div style={{borderRadius:20,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+GOLD+"33"}}>
      <div style={{background:"linear-gradient(140deg,"+GOLD+"20,"+GOLD+"08,#0d0d0d)",padding:"14px 18px",borderBottom:"0.5px solid #1e1e1e",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:10,fontWeight:700,color:GOLD,textTransform:"uppercase",letterSpacing:"0.14em"}}>Hall of Fame</div>
          <div style={{fontSize:11,color:"#555",marginTop:1}}>Every winner. Every reason.</div>
        </div>
        <div style={{fontSize:10,color:"#444"}}>{indivAnvil.length} award{indivAnvil.length!==1?"s":""}</div>
      </div>
      <div style={{background:"#0e0e0e"}}>
        {indivAnvil.length===0&&<div style={{fontSize:13,color:"#444",textAlign:"center",padding:"2rem 1rem"}}>No Anvil winners yet. The first one will be earned on the floor.</div>}
        {indivAnvil.map((w,i)=>{
          const ath=athletes.find(a=>a.name===w.athlete_name);
          const timesWon=indivAnvil.filter(x=>x.athlete_name===w.athlete_name).length;
          const prevWinner=i>0?indivAnvil[i-1]:null;
          const isStreak=prevWinner&&prevWinner.athlete_name===w.athlete_name;
          const cat=catInfo(w.athlete_role);
          const isCurrent=i===0;
          return(
            <div key={i} style={{padding:"14px 18px",borderBottom:"0.5px solid #1a1a1a",background:isCurrent?"#0f0e00":"transparent"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                <div style={{width:44,height:44,borderRadius:"50%",background:isCurrent?"#1f1700":"#111",border:"2px solid "+(isCurrent?GOLD:"#2a2a2a"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:isCurrent?GOLD:"#666",fontWeight:600,flexShrink:0,overflow:"hidden",boxShadow:isCurrent?"0 0 16px "+GOLD+"44":"none"}}>
                  {ath?.photo_url?<img src={ath.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(w.athlete_name||"?")[0]}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:4}}>
                    <div style={{fontSize:14,fontWeight:700,color:isCurrent?GOLD:"#ddd"}}>{w.athlete_name}</div>
                    {isCurrent&&<span style={{fontSize:9,background:GOLD+"22",color:GOLD,padding:"2px 7px",borderRadius:20,fontWeight:700,letterSpacing:"0.05em"}}>⚡ CURRENT</span>}
                    {isStreak&&<span style={{fontSize:9,background:"#2a1000",color:"#E8720C",padding:"2px 7px",borderRadius:20}}>🔥 Back to back</span>}
                    {timesWon>1&&<span style={{fontSize:9,background:"#1a1a1a",color:"#888",padding:"2px 7px",borderRadius:20}}>⚒ ×{timesWon}</span>}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                    <span style={{fontSize:10,background:cat.color+"20",color:cat.color,padding:"2px 8px",borderRadius:20,fontWeight:600,border:"0.5px solid "+cat.color+"44"}}>{cat.emoji} {cat.id}</span>
                    <span style={{fontSize:10,color:"#555"}}>{w.date_awarded}</span>
                  </div>
                  {w.note&&(
                    <div style={{background:isCurrent?GOLD+"0D":"#111",borderRadius:8,padding:"8px 10px",borderLeft:"2px solid "+(isCurrent?GOLD:"#333"),marginBottom:anvilPrizes[String(w.id)]?6:0}}>
                      <div style={{fontSize:9,color:isCurrent?GOLD+"88":"#444",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>Why they earned it</div>
                      <div style={{fontSize:12,color:isCurrent?"#e8d5a0":"#aaa",lineHeight:1.6,fontStyle:"italic"}}>"{w.note}"</div>
                    </div>
                  )}
                  {anvilPrizes[String(w.id)]&&(()=>{
                    const ps=anvilPrizes[String(w.id)];
                    const PRIZE_EMOJIS={tee:"🎽",shorts:"🩳",dicks:"🏪",food_gc:"🍽️"};
                    return(
                      <div style={{display:"inline-flex",alignItems:"center",gap:6,background:isCurrent?GOLD+"15":"#161616",borderRadius:8,padding:"5px 10px",border:"1px solid "+(isCurrent?GOLD+"44":"#252525"),marginTop:2}}>
                        <span style={{fontSize:14}}>{PRIZE_EMOJIS[ps.prize]||"🎁"}</span>
                        <span style={{fontSize:11,color:isCurrent?GOLD:"#888",fontWeight:600}}>{ps.label}</span>
                        {ps.size&&<span style={{fontSize:10,color:"#555"}}>· {ps.size}</span>}
                      </div>
                    );
                  })()}
                </div>
                <button onClick={async()=>{
                  if(!window.confirm("Remove this Anvil award?"))return;
                  try{await supabase.from("anvil").delete().eq("id",w.id);}catch(e){}
                  setAnvil(p=>p.filter(x=>x.id!==w.id));
                }} style={{background:"transparent",border:"none",color:"#333",cursor:"pointer",fontSize:14,padding:"4px",flexShrink:0}}>✕</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
  );
}
