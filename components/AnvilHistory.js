import { useState, useEffect } from "react";
import { BG, GOLD, STEEL, RED, GREEN, ORANGE } from "../lib/constants";
import { supabase } from "../lib/supabase";

const ANVIL_CATS=[
  {id:"Effort",     emoji:"🔥",color:"#E8720C"},
  {id:"Performance",emoji:"🏆",color:GOLD},
  {id:"Leadership", emoji:"👑",color:"#C084FC"},
  {id:"Consistency",emoji:"💪",color:GREEN},
  {id:"Character",  emoji:"🧠",color:STEEL},
];
const catInfo=(id)=>ANVIL_CATS.find(c=>c.id===id)||{id:id||"",emoji:"⚒",color:GOLD};

const PRIZES=[
  {id:"tee",     label:"Anvil Tee Shirt",      emoji:"🎽",sizes:["S","M","L","XL","XXL"]},
  {id:"hoodie",  label:"Anvil Hoodie",          emoji:"🧥",sizes:["S","M","L","XL","XXL"]},
  {id:"shaker",  label:"Shaker Bottle",         emoji:"🥤",sizes:null},
  {id:"earbuds", label:"Wireless Earbuds",      emoji:"🎧",sizes:null},
  {id:"giftcard",label:"$25 Dick's Gift Card",  emoji:"💳",sizes:null},
];

export default function AnvilHistory({athleteId,athleteName}){
  const[anvils,setAnvils]=useState([]);
  const[athletes,setAthletes]=useState({});
  const[prizeSelection,setPrizeSelection]=useState(null);
  const[pendingPrize,setPendingPrize]=useState(null);
  const[pendingSize,setPendingSize]=useState(null);
  const[savingPrize,setSavingPrize]=useState(false);
  const[prizeSaved,setPrizeSaved]=useState(false);

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
          // Load prize selection for latest anvil
          try{
            const{data:ps}=await supabase.from("announcements")
              .select("message")
              .eq("type","anvil_prize")
              .eq("day",String(data[0].id))
              .order("created_at",{ascending:false})
              .limit(1)
              .maybeSingle();
            if(ps?.message){try{setPrizeSelection(JSON.parse(ps.message));}catch(e){}}
          }catch(e){}
        }
      }catch(e){}
    })();
  },[]);

  const savePrize=async()=>{
    const prize=PRIZES.find(p=>p.id===pendingPrize);
    if(!prize||!latest)return;
    if(prize.sizes&&!pendingSize)return;
    setSavingPrize(true);
    try{
      const selection={prize:pendingPrize,label:prize.label,size:pendingSize||null};
      try{await supabase.from("announcements").delete().eq("type","anvil_prize").eq("day",String(latest.id));}catch(e){}
      await supabase.from("announcements").insert({type:"anvil_prize",day:String(latest.id),message:JSON.stringify(selection),active:true});
      setPrizeSelection(selection);
      setPrizeSaved(true);
      setPendingPrize(null);setPendingSize(null);
      setTimeout(()=>setPrizeSaved(false),4000);
    }catch(e){}
    setSavingPrize(false);
  };

  const latest=anvils[0];
  const latestAth=latest?athletes[latest.athlete_name]:null;
  const latestCat=latest?catInfo(latest.athlete_role):null;
  const isCurrentWinner=latest&&athleteName&&latest.athlete_name===athleteName;
  const pendingPrizeObj=PRIZES.find(p=>p.id===pendingPrize);
  const canSave=pendingPrize&&(!pendingPrizeObj?.sizes||pendingSize);

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
          <div style={{height:3,background:"linear-gradient(90deg,transparent,"+GOLD+","+GOLD+"88,transparent)"}}/>
          <div style={{background:"linear-gradient(160deg,#1f1700 0%,#0f0e00 60%,#0d0d0d 100%)",padding:"20px 18px 18px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",bottom:-12,right:-4,fontSize:100,opacity:0.06,lineHeight:1,userSelect:"none",filter:"saturate(0)"}}>⚒</div>
            <div style={{fontSize:9,color:GOLD,textTransform:"uppercase",letterSpacing:"0.22em",fontWeight:900,marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
              <span>⚡</span><span>This week&#39;s Anvil winner</span>
            </div>
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

      {/* Prize picker — only shown to the current winner */}
      {isCurrentWinner&&(
        <div style={{borderRadius:20,marginBottom:14,overflow:"hidden",border:"1px solid "+GOLD+"33",background:"#0f0f0f"}}>
          <div style={{height:3,background:"linear-gradient(90deg,"+GOLD+","+ORANGE+","+GOLD+"44)"}}/>
          <div style={{padding:"16px 16px 14px"}}>

            {/* Already selected — locked-in state */}
            {prizeSelection&&!pendingPrize&&(
              <div>
                <div style={{fontSize:8,color:GOLD,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:10}}>Your Prize</div>
                <div style={{background:"linear-gradient(135deg,#1f1700,#1a1200)",borderRadius:14,padding:"14px 16px",border:"1px solid "+GOLD+"44",display:"flex",alignItems:"center",gap:14}}>
                  <div style={{fontSize:36,filter:"drop-shadow(0 0 10px "+GOLD+"66)"}}>{PRIZES.find(p=>p.id===prizeSelection.prize)?.emoji||"🎁"}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,fontWeight:800,color:GOLD}}>{prizeSelection.label}</div>
                    {prizeSelection.size&&<div style={{fontSize:12,color:"#888",marginTop:2}}>Size: <span style={{color:"#fff",fontWeight:600}}>{prizeSelection.size}</span></div>}
                    <div style={{fontSize:10,color:GREEN,marginTop:4,fontWeight:600}}>✓ Coach has been notified</div>
                  </div>
                  <button onClick={()=>{setPendingPrize(prizeSelection.prize);setPendingSize(prizeSelection.size);}}
                    style={{fontSize:11,color:"#555",background:"none",border:"none",cursor:"pointer",padding:"4px 8px"}}>Change</button>
                </div>
                {prizeSaved&&(
                  <div style={{fontSize:12,color:GREEN,textAlign:"center",marginTop:10,fontWeight:600}}>🎉 Prize locked in!</div>
                )}
              </div>
            )}

            {/* Picker — not yet selected or changing */}
            {(!prizeSelection||pendingPrize)&&(
              <div>
                <div style={{fontSize:8,color:GOLD,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:4}}>Claim Your Prize</div>
                <div style={{fontSize:11,color:"#555",marginBottom:14}}>You earned it — pick what you want.</div>

                {/* Prize options */}
                <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
                  {PRIZES.map(p=>{
                    const isSelected=pendingPrize===p.id;
                    return(
                      <button key={p.id} onClick={()=>{setPendingPrize(p.id);if(!p.sizes)setPendingSize(null);else setPendingSize(null);}}
                        style={{display:"flex",alignItems:"center",gap:14,padding:"12px 14px",borderRadius:12,border:"1.5px solid "+(isSelected?GOLD+"88":"#1e1e1e"),background:isSelected?"linear-gradient(135deg,#1f1700,#1a1200)":"#161616",cursor:"pointer",textAlign:"left",width:"100%",transition:"all 0.1s"}}>
                        <span style={{fontSize:28,filter:isSelected?"drop-shadow(0 0 8px "+GOLD+"66)":"none"}}>{p.emoji}</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:14,fontWeight:isSelected?700:500,color:isSelected?GOLD:"#ccc"}}>{p.label}</div>
                          {p.sizes&&<div style={{fontSize:10,color:"#555",marginTop:1}}>Choose size below</div>}
                        </div>
                        <div style={{width:20,height:20,borderRadius:"50%",border:"2px solid "+(isSelected?GOLD:"#333"),background:isSelected?GOLD:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          {isSelected&&<div style={{width:8,height:8,borderRadius:"50%",background:"#1a1200"}}/>}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Size picker — shown when sized prize selected */}
                {pendingPrizeObj?.sizes&&(
                  <div style={{marginBottom:14}}>
                    <div style={{fontSize:10,color:"#666",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.08em"}}>Select size</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {pendingPrizeObj.sizes.map(sz=>{
                        const isSz=pendingSize===sz;
                        return(
                          <button key={sz} onClick={()=>setPendingSize(sz)}
                            style={{padding:"10px 16px",borderRadius:10,border:"2px solid "+(isSz?GOLD:"#252525"),background:isSz?"linear-gradient(135deg,"+GOLD+"22,"+GOLD+"11)":"#1a1a1a",color:isSz?GOLD:"#666",fontSize:13,fontWeight:isSz?800:400,cursor:"pointer",fontFamily:"Georgia,serif",minWidth:52,transition:"all 0.1s",boxShadow:isSz?"0 0 12px "+GOLD+"33":"none"}}>
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button onClick={savePrize} disabled={!canSave||savingPrize}
                  style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:canSave?"linear-gradient(135deg,"+GOLD+","+GOLD+"cc)":"#1a1a1a",color:canSave?"#1a1200":"#444",fontSize:14,fontWeight:800,cursor:canSave?"pointer":"not-allowed",fontFamily:"Georgia,serif",letterSpacing:"0.04em",boxShadow:canSave?"0 4px 20px "+GOLD+"44":"none"}}>
                  {savingPrize?"Saving...":(canSave?"🎁 Claim Prize":"Select a prize above")}
                </button>
              </div>
            )}
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
