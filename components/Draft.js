import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

const BG="#0f0f0f";
const PUR="#534AB7";
const GOLD="#D4AF37";
const RED="#C0392B";
const STEEL="#708090";
const GREEN="#1E6B3A";
const LC=["#534AB7","#0F6E56","#854F0B","#993556"];
const LB=["#EEEDFE","#E1F5EE","#FAEEDA","#FBEAF0"];

const BRACELETS=[
  {color:"Light orange",ref:"Proverbs 3:5",text:"Trust in the Lord with all your heart.",hex:"#F5A623"},
  {color:"Dark orange",ref:"Psalm 46:10",text:"Be still, and know that I am God.",hex:"#D4581A"},
  {color:"Yellow",ref:"Genesis 1:3",text:"And God said, let there be light.",hex:"#E8C84A"},
  {color:"Light blue",ref:"1 Peter 5:7",text:"Cast all your anxiety on him.",hex:"#5BBFEA"},
  {color:"Dark blue",ref:"1 John 3:1",text:"See what great love the Father has lavished on us.",hex:"#1A4F8A"},
  {color:"Red",ref:"Philippians 4:13",text:"I can do all things through Christ who strengthens me.",hex:"#C0392B"},
  {color:"Pink",ref:"1 Corinthians 13:13",text:"The greatest of these is love.",hex:"#E87AAC"},
  {color:"Dark purple",ref:"Matthew 11:28",text:"Come to me, all who are weary, and I will give you rest.",hex:"#5B2D8E"},
  {color:"Light purple",ref:"John 14:6",text:"I am the way and the truth and the life.",hex:"#9B59B6"},
  {color:"Dark green",ref:"Joshua 1:9",text:"Be strong and courageous.",hex:"#1E6B3A"},
  {color:"Light green",ref:"Psalm 27:1",text:"The Lord is my light and my salvation.",hex:"#58B368"},
  {color:"Teal",ref:"Jeremiah 29:11",text:"Plans to prosper you and not to harm you.",hex:"#1A9E8F"},
];

const TIER_COLORS={
  1:{bg:"#EEEDFE",border:"#534AB7",color:"#3C3489",label:"Tier 1"},
  2:{bg:"#E1F5EE",border:"#0F6E56",color:"#085041",label:"Tier 2"},
  3:{bg:"#FAEEDA",border:"#854F0B",color:"#633806",label:"Tier 3"},
};

const pickRandom=(arr,n,exclude=[])=>{
  const pool=arr.filter(x=>!exclude.includes(x));
  const out=[];const used=[...exclude];
  while(out.length<n&&pool.length>out.length){
    const val=pool[Math.floor(Math.random()*pool.length)];
    if(!used.includes(val)){out.push(val);used.push(val);}
  }
  return out;
};

export default function Draft({athletes}){
  const[draft,setDraft]=useState(null);
  const[loading,setLoading]=useState(true);
  const[step,setStep]=useState("pool");
  const[pool,setPool]=useState([]);
  const[leaders,setLeaders]=useState([null,null,null,null]);
  const[swapIdx,setSwapIdx]=useState(null);
  const[editMode,setEditMode]=useState(false);
  const[editGroups,setEditGroups]=useState(null);
  const[saving,setSaving]=useState(false);
  const[history,setHistory]=useState([]);
  const[athleteStats,setAthleteStats]=useState({});
  const[forgeHistory,setForgeHistory]=useState({});
  const[manualPickMode,setManualPickMode]=useState(false);
  const[timerMs,setTimerMs]=useState(null);
  const pollRef=useRef(null);
  const timerRef=useRef(null);

  useEffect(()=>{
    // Initialize pool with all active athletes
    setPool(athletes.map(a=>a.name));
    loadDraft();
    loadHistory();
    loadStats();
    pollRef.current=setInterval(loadDraft,3000);
    return()=>{clearInterval(pollRef.current); if(timerRef.current) clearInterval(timerRef.current);};
  },[]);

  const loadDraft=async()=>{
    const{data}=await supabase.from("draft").select("*").order("created_at",{ascending:false}).limit(1);
    if(data&&data.length>0){
      setDraft(data[0]);
      setLeaders(data[0].leaders||[null,null,null,null]);
      if(data[0].phase&&data[0].phase!=="setup")setStep("watching");
      // Track timer for draft phase
      if(data[0].phase==="draft"&&data[0].turn_started_at){
        const elapsed=Date.now()-new Date(data[0].turn_started_at).getTime();
        const remaining=Math.max(0,10000-elapsed);
        setTimerMs(remaining);
      }else{
        setTimerMs(null);
      }
    }
    setLoading(false);
  };

  // Local tick for smooth timer
  useEffect(()=>{
    if(timerMs===null||timerMs<=0){return;}
    const tick=setInterval(()=>{
      setTimerMs(ms=>ms===null?null:Math.max(0,ms-100));
    },100);
    return()=>clearInterval(tick);
  },[timerMs]);

  const loadHistory=async()=>{
    const{data}=await supabase.from("draft").select("*").order("created_at",{ascending:false}).limit(12);
    if(data)setHistory(data);
    // Build forge history — count how many times each athlete has been a leader
    const fh={};
    (data||[]).forEach(d=>{
      (d.leaders||[]).forEach(name=>{
        if(name) fh[name]=(fh[name]||0)+1;
      });
    });
    setForgeHistory(fh);
  };

  const loadStats=async()=>{
    const{data:lb}=await supabase.from("leaderboard").select("*,athletes(name)");
    const{data:anv}=await supabase.from("anvil").select("athlete_name");
    const stats={};
    (lb||[]).forEach(r=>{
      const name=r.athletes?.name;
      if(name)stats[name]={streak:r.current_streak||0,early:r.early_count||0};
    });
    (anv||[]).forEach(a=>{
      if(!stats[a.athlete_name])stats[a.athlete_name]={streak:0,early:0};
      stats[a.athlete_name].anvils=(stats[a.athlete_name].anvils||0)+1;
    });
    setAthleteStats(stats);
  };

  const togglePool=(name)=>{
    setPool(p=>p.includes(name)?p.filter(x=>x!==name):[...p,name]);
  };

  const generateLeaders=()=>{
    if(pool.length<4){alert("Need at least 4 athletes in the pool.");return;}
    const chosen=pickRandom(pool,4,[]);
    setLeaders(chosen);
    setStep("leaders");
  };

  const swapLeader=(i,newName)=>{
    const n=[...leaders];n[i]=newName;setLeaders(n);setSwapIdx(null);
  };

  const startDraft=async()=>{
    if(!leaders.every(l=>l))return;
    setSaving(true);
    await supabase.from("draft").delete().neq("id","00000000-0000-0000-0000-000000000000");
    const{data}=await supabase.from("draft").insert({
      week_start:new Date().toISOString().split("T")[0],
      leaders,
      bracelets:[null,null,null,null],
      groups:[[],[],[],[]],
      tiers:[1,1,2,3].sort(()=>Math.random()-0.5),
      phase:"bracelet",
      locked:false,
    }).select();
    if(data)setDraft(data[0]);
    // Set leaders to forge, others to iron
    for(const name of leaders){
      const ath=athletes.find(a=>a.name===name);
      if(ath)await supabase.from("athletes").update({role:"forge"}).eq("id",ath.id);
    }
    const others=athletes.filter(a=>!leaders.includes(a.name));
    for(const ath of others){
      await supabase.from("athletes").update({role:"iron",group_idx:null,bracelet:null,tier:null}).eq("id",ath.id);
    }
    setSaving(false);
    setStep("watching");
  };

  const saveEdits=async()=>{
    setSaving(true);
    await supabase.from("draft").update({groups:editGroups,locked:true,phase:"locked"}).eq("id",draft.id);
    editGroups.forEach(async(group,i)=>{
      group.forEach(async(name)=>{
        const ath=athletes.find(a=>a.name===name);
        if(ath)await supabase.from("athletes").update({group_idx:i,tier:draft.tiers?.[i]}).eq("id",ath.id);
      });
    });
    draft.leaders?.forEach(async(name,i)=>{
      const ath=athletes.find(a=>a.name===name);
      if(ath)await supabase.from("athletes").update({group_idx:i,tier:draft.tiers?.[i],bracelet:draft.bracelets?.[i]?.ref}).eq("id",ath.id);
    });
    setEditMode(false);
    await loadDraft();
    setSaving(false);
  };

  const resetDraft=async()=>{
    if(!window.confirm("Reset the entire draft? This cannot be undone."))return;
    await supabase.from("draft").delete().neq("id","00000000-0000-0000-0000-000000000000");
    setDraft(null);
    setLeaders([null,null,null,null]);
    setPool(athletes.map(a=>a.name));
    setStep("pool");
  };

  if(loading)return<div style={{textAlign:"center",padding:"2rem",color:"#888"}}>Loading draft...</div>;

  const phase=draft?.phase;
  const groups=draft?.groups||[[],[],[],[]];
  const bracelets=draft?.bracelets||[null,null,null,null];
  const tiers=draft?.tiers||[null,null,null,null];
  const draftLeaders=draft?.leaders||[null,null,null,null];

  return(
    <div>

      {/* STEP 1 — Pool selection */}
      {step==="pool"&&(
        <div>
          <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+PUR}}>
            <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:4}}>Step 1 — Select who's in the draft</div>
            <div style={{fontSize:12,color:"#888",marginBottom:12}}>Check everyone who's here today. Uncheck anyone who's absent or sitting out. Only checked athletes go into the draft pool.</div>

            {/* Readiness check */}
            <div style={{background:pool.length>=4?"#EAF3DE":"#FCEBEB",borderRadius:10,padding:"10px 12px",marginBottom:12,border:"0.5px solid "+(pool.length>=4?GREEN:RED)+"44"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                <div style={{fontSize:12,fontWeight:600,color:pool.length>=4?GREEN:RED}}>
                  {pool.length>=4?"✓ Ready to draft":"⚠ Not ready yet"}
                </div>
                <div style={{fontSize:11,color:"#666"}}>{pool.length} / {athletes.length} in · {athletes.length-pool.length} out</div>
              </div>
              {athletes.length-pool.length>0&&(
                <div style={{fontSize:11,color:"#666",marginTop:4}}>
                  Out: {athletes.filter(a=>!pool.includes(a.name)).map(a=>a.name).join(", ")}
                </div>
              )}
            </div>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:12,color:PUR,fontWeight:500}}>{pool.length} athletes in pool</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setPool(athletes.map(a=>a.name))} style={{fontSize:11,padding:"3px 10px",borderRadius:6,border:"0.5px solid "+GREEN,background:"transparent",color:GREEN,cursor:"pointer",fontFamily:"Georgia,serif"}}>All in</button>
                <button onClick={()=>setPool([])} style={{fontSize:11,padding:"3px 10px",borderRadius:6,border:"0.5px solid #aaa",background:"transparent",color:"#888",cursor:"pointer",fontFamily:"Georgia,serif"}}>Clear</button>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
              {athletes.map(a=>{
                const inPool=pool.includes(a.name);
                const s=athleteStats[a.name]||{};
                const forgeCount=forgeHistory[a.name]||0;
                const neverForge=forgeCount===0;
                return(
                  <button key={a.id} onClick={()=>togglePool(a.name)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:10,border:"0.5px solid "+(inPool?PUR:"#e0e0e0"),background:inPool?"#EEEDFE":"#f9f9f9",cursor:"pointer",fontFamily:"Georgia,serif",textAlign:"left"}}>
                    <div style={{width:22,height:22,borderRadius:6,border:"2px solid "+(inPool?PUR:"#ccc"),background:inPool?PUR:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {inPool&&<span style={{color:"#fff",fontSize:12,fontWeight:700}}>✓</span>}
                    </div>
                    <div style={{width:32,height:32,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:500,color:"#fff",flexShrink:0,position:"relative"}}>
                      {a.name[0]}
                      {neverForge&&inPool&&<div style={{position:"absolute",top:-3,right:-3,width:10,height:10,borderRadius:"50%",background:GOLD,border:"1.5px solid #fff"}}/>}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:500,color:inPool?"#1a1a1a":"#aaa"}}>{a.name}</div>
                      <div style={{fontSize:11,color:"#888",display:"flex",gap:8}}>
                        <span>{a.sport}</span>
                        {s.streak>0&&<span>🔥 {s.streak}</span>}
                        {s.anvils>0&&<span>⚒ {s.anvils}</span>}
                        <span style={{color:neverForge?GOLD:"#aaa"}}>Forge: {forgeCount}</span>
                      </div>
                    </div>
                    <div style={{fontSize:11,color:inPool?PUR:"#ccc"}}>{inPool?"In":"Out"}</div>
                  </button>
                );
              })}
              {/* Legend for gold dot */}
              <div style={{fontSize:10,color:"#888",marginTop:6,display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:GOLD}}/>
                Never been Forge leader
              </div>
            </div>
            <button onClick={generateLeaders} disabled={pool.length<4} style={{width:"100%",padding:"12px",borderRadius:8,border:"none",background:pool.length>=4?PUR:"#e0e0e0",color:"#fff",fontSize:14,fontWeight:500,cursor:pool.length>=4?"pointer":"not-allowed",fontFamily:"Georgia,serif"}}>
              {pool.length<4?"Need at least 4 athletes":"Generate leaders →"}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — Leader selection */}
      {step==="leaders"&&(
        <div>
          <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+PUR}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
              <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a"}}>Step 2 — Confirm leaders</div>
              <button onClick={()=>{
                if(manualPickMode){
                  setManualPickMode(false);
                  setLeaders(pickRandom(pool,4,[]));
                }else{
                  setManualPickMode(true);
                  setLeaders([null,null,null,null]);
                }
              }} style={{fontSize:11,padding:"4px 10px",borderRadius:6,border:"0.5px solid "+(manualPickMode?GOLD:PUR),background:manualPickMode?"#FAEEDA":"transparent",color:manualPickMode?"#633806":PUR,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                {manualPickMode?"Manual mode ✓":"Manual pick"}
              </button>
            </div>
            <div style={{fontSize:12,color:"#888",marginBottom:14}}>{manualPickMode?"Tap athletes below to fill the 4 leader slots.":"System picked 4 random leaders from your pool. Swap any before starting."}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[0,1,2,3].map(i=>{
                const lname=leaders[i];
                const s=lname?athleteStats[lname]||{}:{};
                const forgeCount=lname?forgeHistory[lname]||0:0;
                return(
                  <div key={i} style={{background:LB[i],borderRadius:10,padding:"12px",border:"0.5px solid "+LC[i]+"44"}}>
                    <div style={{fontSize:11,fontWeight:500,color:LC[i],marginBottom:6,textTransform:"uppercase",letterSpacing:"0.04em"}}>Group {i+1}</div>
                    <div style={{fontSize:14,fontWeight:500,color:"#1a1a1a",marginBottom:4}}>{lname||"— Empty —"}</div>
                    {lname&&(
                      <div style={{fontSize:10,color:"#666",marginBottom:8,display:"flex",gap:6,flexWrap:"wrap"}}>
                        {s.streak>0&&<span>🔥 {s.streak}</span>}
                        {s.anvils>0&&<span>⚒ {s.anvils}</span>}
                        <span>Forge: {forgeCount}×</span>
                      </div>
                    )}
                    {swapIdx===i?(
                      <select autoFocus onChange={e=>e.target.value&&swapLeader(i,e.target.value)} style={{width:"100%",fontSize:11,padding:"4px",borderRadius:6,border:"0.5px solid #e0e0e0",background:"#fff",color:"#1a1a1a"}}>
                        <option value="">Swap to...</option>
                        {pool.filter(name=>!leaders.includes(name)||name===leaders[i]).map(name=><option key={name} value={name}>{name}</option>)}
                      </select>
                    ):(
                      <button onClick={()=>setSwapIdx(swapIdx===i?null:i)} style={{fontSize:11,padding:"4px 12px",borderRadius:6,border:"0.5px solid "+LC[i],background:"transparent",color:LC[i],cursor:"pointer",fontFamily:"Georgia,serif"}}>
                        {lname?"Swap":"Pick"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {manualPickMode&&(
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:8}}>Tap to fill next empty slot</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,maxHeight:240,overflowY:"auto"}}>
                  {pool.map(name=>{
                    const inLeaders=leaders.includes(name);
                    const forgeCount=forgeHistory[name]||0;
                    const neverForge=forgeCount===0;
                    return(
                      <button key={name} onClick={()=>{
                        if(inLeaders){
                          setLeaders(ls=>ls.map(l=>l===name?null:l));
                        }else{
                          const emptyIdx=leaders.findIndex(l=>!l);
                          if(emptyIdx>=0){
                            const newLeaders=[...leaders];
                            newLeaders[emptyIdx]=name;
                            setLeaders(newLeaders);
                          }
                        }
                      }} style={{padding:"8px",borderRadius:8,border:"0.5px solid "+(inLeaders?RED:neverForge?GOLD:"#e0e0e0"),background:inLeaders?"#FCEBEB":neverForge?"#FAEEDA":"#fafafa",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:11,color:"#1a1a1a",position:"relative",textAlign:"center"}}>
                        <div style={{fontWeight:500}}>{name.split(" ")[0]}</div>
                        <div style={{fontSize:9,color:"#888",marginTop:2}}>Forge: {forgeCount}×</div>
                        {inLeaders&&<div style={{position:"absolute",top:2,right:4,fontSize:10,color:RED}}>✓</div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setStep("pool")} style={{padding:"10px 16px",borderRadius:8,border:"0.5px solid #e0e0e0",background:"transparent",color:"#888",fontSize:13,cursor:"pointer",fontFamily:"Georgia,serif"}}>← Back</button>
              <button onClick={startDraft} disabled={!leaders.every(l=>l)||saving} style={{flex:1,padding:"10px",borderRadius:8,border:"none",background:leaders.every(l=>l)?RED:"#e0e0e0",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                {saving?"Starting...":"Start draft → Leaders pick on their phones"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3 — Watching live */}
      {step==="watching"&&draft&&(
        <div>
          {/* Status */}
          <div style={{background:BG,borderRadius:12,padding:"1rem",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:11,color:"#555",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Draft status</div>
              <div style={{fontSize:15,fontWeight:500,color:"#fff"}}>
                {phase==="bracelet"?"Leaders picking bracelets...":phase==="draft"?"⚡ Live draft in progress":phase==="locked"?"✓ Draft complete — groups locked":"Setting up..."}
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              {phase==="locked"&&<button onClick={()=>{setEditMode(true);setEditGroups(groups.map(g=>[...g]));}} style={{padding:"6px 14px",borderRadius:8,border:"0.5px solid "+GOLD,background:"transparent",color:GOLD,fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>Edit groups</button>}
              <button onClick={resetDraft} style={{padding:"6px 14px",borderRadius:8,border:"0.5px solid #555",background:"transparent",color:"#888",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>Reset</button>
            </div>
          </div>

          {/* Live draft timer */}
          {phase==="draft"&&timerMs!==null&&(
            <div style={{background:timerMs<3000?"#FCEBEB":"#fff",borderRadius:12,padding:"1rem",marginBottom:12,border:"1px solid "+(timerMs<3000?RED:"#e0e0e0"),borderTop:"3px solid "+(timerMs<3000?RED:PUR)}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <div style={{fontSize:12,fontWeight:500,color:timerMs<3000?RED:"#888",textTransform:"uppercase",letterSpacing:"0.05em"}}>Pick timer</div>
                <div style={{fontSize:24,fontWeight:700,color:timerMs<3000?RED:PUR,fontVariantNumeric:"tabular-nums"}}>{(timerMs/1000).toFixed(1)}s</div>
              </div>
              <div style={{width:"100%",height:6,background:"#f0f0f0",borderRadius:3,overflow:"hidden"}}>
                <div style={{width:`${(timerMs/10000)*100}%`,height:"100%",background:timerMs<3000?RED:PUR,transition:"width 100ms linear"}}/>
              </div>
              {draft?.current_picker&&<div style={{fontSize:11,color:"#888",marginTop:6,textAlign:"center"}}>Waiting on <strong>{draft.current_picker}</strong> to pick...</div>}
            </div>
          )}

          {/* Bracelet phase */}
          {phase==="bracelet"&&(
            <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+GOLD}}>
              <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Leaders picking bracelets — auto-refreshing</div>
              {draftLeaders.map((name,i)=>{
                const b=bracelets[i];
                const brac=BRACELETS.find(x=>x.ref===b?.ref);
                return(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:10,background:LB[i],border:"0.5px solid "+LC[i]+"44",marginBottom:8}}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:brac?.hex||"#ccc",flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:500,color:LC[i]}}>{name}</div>
                      {brac?<div style={{fontSize:11,color:"#888"}}>{brac.color} — {brac.ref}</div>:<div style={{fontSize:11,color:"#aaa"}}>Picking...</div>}
                    </div>
                    {brac?<span style={{fontSize:10,background:LC[i],color:"#fff",padding:"2px 7px",borderRadius:4}}>✓ Picked</span>:<span style={{fontSize:10,color:"#aaa"}}>Waiting</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Draft phase — live groups */}
          {(phase==="draft"||phase==="locked")&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              {[0,1,2,3].map(i=>{
                const brac=BRACELETS.find(b=>b.ref===bracelets[i]?.ref);
                const td=TIER_COLORS[tiers[i]];
                return(
                  <div key={i} style={{background:"#fff",borderRadius:12,padding:"1rem",border:"0.5px solid "+LC[i]+"66",borderTop:"3px solid "+LC[i]}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                      {brac&&<div style={{width:8,height:8,borderRadius:"50%",background:brac.hex}}/>}
                      <span style={{fontSize:13,fontWeight:500,color:LC[i]}}>{draftLeaders[i]}</span>
                    </div>
                    {brac&&<div style={{fontSize:10,color:"#888",fontStyle:"italic",marginBottom:4}}>"{brac.text}"</div>}
                    {td&&<div style={{display:"inline-block",fontSize:10,fontWeight:500,padding:"1px 8px",borderRadius:4,background:td.bg,color:td.color,marginBottom:6}}>{td.label}</div>}
                    {(groups[i]||[]).map(name=>(
                      <div key={name} style={{fontSize:12,padding:"4px 8px",background:"#f5f5f5",borderRadius:6,marginBottom:3,color:"#1a1a1a"}}>{name}</div>
                    ))}
                    {(!groups[i]||groups[i].length===0)&&phase==="draft"&&<div style={{fontSize:11,color:"#aaa"}}>No picks yet...</div>}
                    {phase==="locked"&&<div style={{fontSize:11,color:"#aaa",marginTop:4}}>{(groups[i]?.length||0)+1} total</div>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Edit mode */}
          {editMode&&editGroups&&(
            <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+GOLD}}>
              <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Edit groups — move athletes between groups</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                {[0,1,2,3].map(i=>(
                  <div key={i} style={{background:LB[i],borderRadius:10,padding:"10px",border:"0.5px solid "+LC[i]+"44"}}>
                    <div style={{fontSize:12,fontWeight:500,color:LC[i],marginBottom:8}}>Group {i+1} — {draftLeaders[i]}</div>
                    {editGroups[i].map((name,j)=>(
                      <div key={name} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                        <div style={{flex:1,fontSize:12,padding:"4px 8px",background:"#fff",borderRadius:6,color:"#1a1a1a"}}>{name}</div>
                        <select onChange={e=>{
                          if(e.target.value==="")return;
                          const newG=editGroups.map(g=>[...g]);
                          newG[i].splice(j,1);
                          newG[parseInt(e.target.value)].push(name);
                          setEditGroups(newG);
                        }} style={{fontSize:10,padding:"2px",borderRadius:4,border:"0.5px solid #e0e0e0",background:"#fff",color:"#1a1a1a"}}>
                          <option value="">Move →</option>
                          {[0,1,2,3].filter(x=>x!==i).map(x=><option key={x} value={x}>Group {x+1}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={saveEdits} disabled={saving} style={{flex:1,padding:"10px",borderRadius:8,border:"none",background:GOLD,color:"#1a1a1a",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"Georgia,serif"}}>{saving?"Saving...":"Save changes →"}</button>
                <button onClick={()=>setEditMode(false)} style={{padding:"10px 16px",borderRadius:8,border:"0.5px solid #e0e0e0",background:"transparent",color:"#888",fontSize:13,cursor:"pointer",fontFamily:"Georgia,serif"}}>Cancel</button>
              </div>
            </div>
          )}

          {/* Post-draft summary */}
          {phase==="locked"&&!editMode&&(
            <div style={{background:BG,borderRadius:12,padding:"1.25rem",marginBottom:12,border:"1px solid "+GOLD+"66"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div>
                  <div style={{fontSize:11,color:GOLD,textTransform:"uppercase",letterSpacing:"0.06em"}}>Draft summary · {new Date(draft.created_at).toLocaleDateString()}</div>
                  <div style={{fontSize:14,fontWeight:500,color:"#fff"}}>The week's 4 groups</div>
                </div>
                <div style={{fontSize:24}}>📋</div>
              </div>
              {[0,1,2,3].map(i=>{
                const bracInfo=bracelets[i]?BRACELETS.find(b=>b.ref===bracelets[i].ref):null;
                const t=tiers[i];
                const tierInfo=TIER_COLORS[t];
                return(
                  <div key={i} style={{background:"#141414",borderRadius:10,padding:"10px 12px",marginBottom:8,borderLeft:"3px solid "+(bracInfo?.hex||LC[i])}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                      <div style={{fontSize:12,fontWeight:600,color:"#fff"}}>Group {i+1} · {draftLeaders[i]}</div>
                      <div style={{fontSize:10,padding:"1px 8px",borderRadius:4,background:tierInfo?.color+"33",color:tierInfo?.color||"#888"}}>{tierInfo?.label||"—"}</div>
                    </div>
                    {bracInfo&&(
                      <div style={{fontSize:11,color:bracInfo.hex,marginBottom:4}}>
                        <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:bracInfo.hex,marginRight:5}}/>
                        {bracInfo.color} · {bracInfo.ref}
                      </div>
                    )}
                    <div style={{fontSize:11,color:"#888"}}>
                      Members: {(groups[i]||[]).join(", ")||"—"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {phase==="locked"&&!editMode&&(
            <button onClick={resetDraft} style={{width:"100%",padding:"10px",borderRadius:8,border:"0.5px solid "+PUR,background:"transparent",color:PUR,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"Georgia,serif",marginBottom:12}}>
              Start new week → Reset draft
            </button>
          )}
        </div>
      )}

      {/* Weekly draft history — always visible */}
      {history.length>0&&step!=="watching"&&(
        <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginTop:12,border:"0.5px solid #e0e0e0"}}>
          <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:4}}>Past drafts</div>
          <div style={{fontSize:12,color:"#888",marginBottom:12}}>Last {history.length} week{history.length!==1?"s":""} · who was Forge, which bracelets picked</div>
          {history.map((d,i)=>(
            <div key={i} style={{padding:"10px 0",borderBottom:i<history.length-1?"0.5px solid #f0f0f0":"none"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                <div style={{fontSize:12,fontWeight:500,color:"#1a1a1a"}}>{new Date(d.created_at).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</div>
                <div style={{fontSize:10,padding:"1px 6px",borderRadius:4,background:d.phase==="locked"?"#EAF3DE":"#FFF3CD",color:d.phase==="locked"?GREEN:"#854F0B"}}>{d.phase==="locked"?"Complete":d.phase}</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
                {(d.leaders||[]).map((ldr,li)=>{
                  const brac=d.bracelets?.[li]?BRACELETS.find(b=>b.ref===d.bracelets[li].ref):null;
                  return(
                    <div key={li} style={{fontSize:10,padding:"3px 6px",borderRadius:4,background:brac?.hex+"22"||"#f5f5f5",borderLeft:"2px solid "+(brac?.hex||"#ccc")}}>
                      <div style={{color:"#555"}}>G{li+1}: <strong>{ldr||"—"}</strong></div>
                      {brac&&<div style={{color:"#888",fontSize:9}}>{brac.color}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
