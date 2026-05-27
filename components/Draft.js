import { useState, useEffect, useCallback, useRef } from "react";
import { BG, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { supabase } from "../lib/supabase";

const playPickSound=()=>{
  try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    [[523,0],[659,0.12],[784,0.24],[1047,0.38]].forEach(([freq,t])=>{
      const o=ctx.createOscillator();const g=ctx.createGain();
      o.connect(g);g.connect(ctx.destination);
      o.type="sine";o.frequency.setValueAtTime(freq,ctx.currentTime+t);
      g.gain.setValueAtTime(0.25,ctx.currentTime+t);
      g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+t+0.35);
      o.start(ctx.currentTime+t);o.stop(ctx.currentTime+t+0.35);
    });
  }catch(e){}
};

const playTickSound=()=>{
  try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    const o=ctx.createOscillator();const g=ctx.createGain();
    o.connect(g);g.connect(ctx.destination);
    o.type="square";o.frequency.setValueAtTime(880,ctx.currentTime);
    g.gain.setValueAtTime(0.08,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.07);
    o.start(ctx.currentTime);o.stop(ctx.currentTime+0.07);
  }catch(e){}
};

const playDraftCompleteSound=()=>{
  try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    [[523,0,0.6],[659,0.1,0.6],[784,0.2,0.6],[1047,0.35,0.9],[1319,0.55,1.1]].forEach(([freq,t,dur])=>{
      const o=ctx.createOscillator();const g=ctx.createGain();
      o.connect(g);g.connect(ctx.destination);
      o.type="sine";o.frequency.setValueAtTime(freq,ctx.currentTime+t);
      g.gain.setValueAtTime(0.3,ctx.currentTime+t);
      g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+t+dur);
      o.start(ctx.currentTime+t);o.stop(ctx.currentTime+t+dur);
    });
  }catch(e){}
};

const COLORS=["#534AB7","#C0392B","#1E6B3A","#D4AF37","#E8720C","#1A4F8A"];
const BRACELETS=[
  {color:"Light orange",ref:"Proverbs 3:5",text:"Trust in the Lord with all your heart.",hex:"#F5A623"},
  {color:"Dark orange",ref:"Psalm 46:10",text:"Be still, and know that I am God.",hex:"#D4581A"},
  {color:"Yellow",ref:"Genesis 1:3",text:"And God said, let there be light.",hex:"#E8C84A"},
  {color:"Light blue",ref:"1 Peter 5:7",text:"Cast all your anxiety on him.",hex:"#5BBFEA"},
  {color:"Dark blue",ref:"1 John 3:1",text:"See what great love the Father has lavished on us.",hex:"#1A4F8A"},
  {color:"Red",ref:"Philippians 4:13",text:"I can do all things through Christ who strengthens me.",hex:"#C0392B"},
  {color:"Pink",ref:"1 Corinthians 13:13",text:"The greatest of these is love.",hex:"#E87AAC"},
  {color:"Dark purple",ref:"Matthew 11:28",text:"Come to me, all who are weary.",hex:"#5B2D8E"},
  {color:"Light purple",ref:"John 14:6",text:"I am the way and the truth and the life.",hex:"#9B59B6"},
  {color:"Dark green",ref:"Joshua 1:9",text:"Be strong and courageous.",hex:"#1E6B3A"},
  {color:"Light green",ref:"Psalm 27:1",text:"The Lord is my light and my salvation.",hex:"#58B368"},
  {color:"Teal",ref:"Jeremiah 29:11",text:"Plans to prosper you and not to harm you.",hex:"#1A9E8F"},
];

const getTier=(idx,n)=>{
  if(n<=2)return idx===0?1:2;
  if(n===3)return idx<2?1:2;
  if(n===4)return idx<2?1:idx===2?2:3;
  return idx<2?1:idx<4?2:3;
};

const makeSnake=(n,rounds)=>{
  const out=[];
  for(let r=0;r<rounds;r++){
    const row=Array.from({length:n},(_,i)=>i);
    out.push(...(r%2===0?row:[...row].reverse()));
  }
  return out;
};

export default function Draft({athletes=[]}){
  const[step,setStep]=useState("setup");
  const[numGroups,setNumGroups]=useState(4);
  const[picksPerGroup,setPicksPerGroup]=useState(4);
  const[leaders,setLeaders]=useState(Array(4).fill(""));
  const[bracelets,setBracelets]=useState({});
  const[groups,setGroups]=useState({});
  const[pickSeq,setPickSeq]=useState([]);
  const[pickIdx,setPickIdx]=useState(0);
  const[search,setSearch]=useState("");
  const[draftId,setDraftId]=useState(null);
  const[loading,setLoading]=useState(true);
  const[leaderSearch,setLeaderSearch]=useState("");
  const[saveError,setSaveError]=useState("");
  const lastSnapshotRef=useRef(null);

  const applyDraftData=useCallback((d,currentPP)=>{
    setDraftId(d.id);
    const loadedLeaders=d.leaders||[];
    const n=Math.max(loadedLeaders.filter(Boolean).length,2);
    setNumGroups(n);
    const l=Array(n).fill("");
    loadedLeaders.slice(0,n).forEach((name,i)=>{if(name)l[i]=name;});
    setLeaders(l);
    if(d.bracelets){
      const b={};d.bracelets.forEach((br,i)=>{if(br)b[i]=typeof br==="string"?BRACELETS.find(x=>x.ref===br)||br:br;});
      setBracelets(b);
    }
    if(d.groups){
      const g={};d.groups.forEach((arr,i)=>{g[i]=arr||[];});setGroups(g);
    }
    const phase=d.phase||"setup";
    setStep(phase==="locked"?"done":phase);
    if(phase==="draft"||phase==="bracelet"){
      const maxMembers=Math.max(...(d.groups||[]).map(g=>(g||[]).length),0);
      const pp=Math.max(maxMembers,currentPP||4);
      setPicksPerGroup(pp);
      const seq=makeSnake(n,pp);
      setPickSeq(seq);
      const leaders=(d.leaders||[]).filter(Boolean);
      const totalPicked=Math.max(0,(d.groups||[]).flat().length-leaders.length);
      setPickIdx(Math.max(0,totalPicked));
    }
  },[]);

  useEffect(()=>{
    let pollTimer=null;
    (async()=>{
      try{
        const{data}=await supabase.from("draft").select("*").order("created_at",{ascending:false}).limit(1);
        if(data&&data[0])applyDraftData(data[0],picksPerGroup);
      }catch(e){console.error("Load draft:",e);}
      setLoading(false);
    })();
    pollTimer=setInterval(async()=>{
      try{
        const{data}=await supabase.from("draft").select("*").order("created_at",{ascending:false}).limit(1);
        if(!data||!data[0])return;
        const snap=JSON.stringify({g:data[0].groups,b:data[0].bracelets,p:data[0].phase});
        if(snap===lastSnapshotRef.current)return;
        lastSnapshotRef.current=snap;
        applyDraftData(data[0],picksPerGroup);
      }catch(e){}
    },3000);
    return()=>clearInterval(pollTimer);
  },[applyDraftData]);

  useEffect(()=>{
    setLeaders(prev=>{
      const next=Array(numGroups).fill("");
      prev.slice(0,numGroups).forEach((l,i)=>{next[i]=l;});
      return next;
    });
  },[numGroups]);

  const save=async(updates={})=>{
    setSaveError("");
    const payload={
      leaders:leaders.slice(0,numGroups),
      bracelets:Array.from({length:numGroups},(_,i)=>bracelets[i]||null),
      groups:Array.from({length:numGroups},(_,i)=>groups[i]||[]),
      ...updates,
    };
    delete payload.group_count;
    delete payload.picks_per_group;
    delete payload.pick_order;
    delete payload.current_pick;
    try{
      if(draftId){
        const{error:err}=await supabase.from("draft").update(payload).eq("id",draftId);
        if(err)throw err;
      }else{
        const{data,error:err}=await supabase.from("draft").insert({...payload,phase:"setup",locked:false}).select().single();
        if(err)throw err;
        if(data)setDraftId(data.id);
      }
    }catch(e){
      console.error("Save draft:",e);
      setSaveError(e.message||"Save failed");
    }
  };

  const startBracelets=()=>{
    if(leaders.some(l=>!l)){alert("Select all leaders first!");return;}
    const g={};
    leaders.forEach((l,i)=>{g[i]=[l];});
    setGroups(g);
    setStep("bracelet");
    save({phase:"bracelet",groups:leaders.map(l=>[l])});
  };

  const startDraft=()=>{
    const seq=makeSnake(numGroups,picksPerGroup);
    setPickSeq(seq);setPickIdx(0);setStep("draft");
    save({phase:"draft"});
  };

  const pick=async(athleteName)=>{
    playPickSound();
    const gIdx=pickSeq[pickIdx];
    const newGroups={...groups,[gIdx]:[...(groups[gIdx]||[]),athleteName]};
    const newIdx=pickIdx+1;
    setGroups(newGroups);setPickIdx(newIdx);

    const ath=athletes.find(a=>a.name===athleteName);
    if(ath){
      try{await supabase.from("athletes").update({role:"iron",group_idx:gIdx,tier:getTier(gIdx,numGroups)}).eq("id",ath.id);}
      catch(e){console.error("Athlete update:",e);}
    }

    const seqDone=newIdx>=pickSeq.length;
    const noMore=activeAthletes.filter(a=>![...Object.values(newGroups).flat()].includes(a.name)).length===0;

    if(seqDone||noMore){
      await Promise.all(leaders.map(async(name,i)=>{
        const a=athletes.find(x=>x.name===name);
        if(a){try{await supabase.from("athletes").update({role:"forge",group_idx:i,tier:getTier(i,numGroups)}).eq("id",a.id);}catch(e){}}
      }));
      setTimeout(playDraftCompleteSound,200);
      setStep("done");
      save({phase:"locked",groups:Object.values(newGroups),locked:true});
    }else{
      save({groups:Object.values(newGroups),phase:"draft"});
    }
  };

  const reset=async()=>{
    if(!confirm("Reset draft? This will clear all groups and set everyone back to Iron."))return;
    setStep("setup");setLeaders(Array(numGroups).fill(""));
    setBracelets({});setGroups({});setPickSeq([]);setPickIdx(0);setSaveError("");
    try{
      await supabase.from("athletes").update({role:"iron",group_idx:null,tier:null}).eq("status","active");
      if(draftId)await supabase.from("draft").update({
        phase:"setup",leaders:[],groups:[],bracelets:[],locked:false
      }).eq("id",draftId);
    }catch(e){console.error("Reset error:",e);}
  };

  const takenRefs=Object.values(bracelets).filter(Boolean).map(b=>typeof b==="object"?b.ref:b);
  const assigned=[...Object.values(groups).flat()];
  const activeAthletes=athletes.filter(a=>a.status==="active");
  const pool=activeAthletes.filter(a=>!assigned.includes(a.name)&&(!search||a.name.toLowerCase().includes(search.toLowerCase())));
  const curGroup=pickSeq[pickIdx];
  const curLeader=leaders[curGroup];
  const isDone=pickIdx>=pickSeq.length||pool.length===0;
  const stepNum=step==="setup"?0:step==="bracelet"?1:step==="draft"?2:3;
  const STEP_LABELS=["Setup","Bracelets","Draft","Complete"];
  const clockCol=curGroup!==undefined?COLORS[curGroup%COLORS.length]:COLORS[0];
  const clockPickedCount=curGroup!==undefined?(groups[curGroup]||[]).length-1:0;

  if(loading)return<div style={{textAlign:"center",padding:"2rem",color:"#888"}}>Loading...</div>;

  return(
    <div>

      {/* ── HEADER ── */}
      <div style={{background:"#111",borderRadius:12,padding:"12px 16px",marginBottom:10,border:"1px solid #1e1e1e",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
            <div style={{fontSize:15,fontWeight:700,color:"#fff"}}>🎯 Draft Board</div>
            {(step==="draft"||step==="bracelet")&&(
              <div style={{display:"flex",alignItems:"center",gap:4,background:"#0d2010",borderRadius:8,padding:"2px 8px",border:"0.5px solid "+GREEN+"55"}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:GREEN,boxShadow:"0 0 8px "+GREEN}}/>
                <span style={{fontSize:9,color:GREEN,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em"}}>Live</span>
              </div>
            )}
          </div>
          <div style={{fontSize:10,color:"#444",textTransform:"uppercase",letterSpacing:"0.06em"}}>
            {step==="setup"&&"Configure groups & leaders"}
            {step==="bracelet"&&"Leaders choosing bracelets"}
            {step==="draft"&&`Pick ${pickIdx+1} of ${pickSeq.length} · auto-refreshing`}
            {step==="done"&&"Draft locked · manage in Teams tab"}
          </div>
        </div>
        <button onClick={reset} style={{padding:"6px 12px",borderRadius:8,border:"0.5px solid #2a2a2a",background:"transparent",color:"#555",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>Reset</button>
      </div>

      {/* ── STEP PROGRESS BAR ── */}
      <div style={{display:"flex",alignItems:"flex-start",marginBottom:16,padding:"0 2px"}}>
        {STEP_LABELS.map((s,i)=>(
          <div key={s} style={{display:"flex",alignItems:"center",flex:i<STEP_LABELS.length-1?"1":"0"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <div style={{
                width:26,height:26,borderRadius:"50%",
                background:i<stepNum?GREEN:i===stepNum?ORANGE:"#1a1a1a",
                border:"2px solid "+(i<stepNum?GREEN:i===stepNum?ORANGE:"#252525"),
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:10,fontWeight:700,color:i<=stepNum?"#fff":"#444",
              }}>{i<stepNum?"✓":i+1}</div>
              <div style={{fontSize:8,color:i===stepNum?ORANGE:i<stepNum?GREEN:"#333",textTransform:"uppercase",letterSpacing:"0.04em",fontWeight:i===stepNum?700:500,whiteSpace:"nowrap"}}>{s}</div>
            </div>
            {i<STEP_LABELS.length-1&&(
              <div style={{flex:1,height:1.5,background:i<stepNum?GREEN+"55":"#1e1e1e",margin:"0 6px",marginTop:11}}/>
            )}
          </div>
        ))}
      </div>

      {/* ── SAVE ERROR ── */}
      {saveError&&(
        <div style={{background:"#180606",borderRadius:10,padding:"10px 14px",marginBottom:10,border:"0.5px solid "+RED+"55",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:12,color:RED}}>⚠ {saveError}</span>
          <button onClick={()=>setSaveError("")} style={{background:"transparent",border:"none",color:"#666",fontSize:18,cursor:"pointer",lineHeight:1}}>×</button>
        </div>
      )}

      {/* ════════════════════════════
          STEP 1 — SETUP
      ════════════════════════════ */}
      {step==="setup"&&(
        <div>
          <div style={{background:"#111",borderRadius:12,padding:"16px 14px",marginBottom:10,border:"0.5px solid #1e1e1e"}}>

            {/* Group count */}
            <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Number of groups</div>
            <div style={{display:"flex",gap:8,marginBottom:18}}>
              {[2,3,4,5,6].map(n=>(
                <button key={n} onClick={()=>setNumGroups(n)} style={{
                  width:44,height:44,borderRadius:10,
                  border:"1.5px solid "+(numGroups===n?ORANGE:"#252525"),
                  background:numGroups===n?ORANGE+"20":"transparent",
                  color:numGroups===n?ORANGE:"#555",
                  fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif",
                }}>{n}</button>
              ))}
            </div>

            {/* Picks per group */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
              <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em"}}>Athletes per group</div>
              <div style={{fontSize:20,fontWeight:800,color:ORANGE,lineHeight:1}}>{picksPerGroup}</div>
            </div>
            <input type="range" min={2} max={12} value={picksPerGroup} onChange={e=>setPicksPerGroup(+e.target.value)} style={{width:"100%",accentColor:ORANGE,marginBottom:4}}/>
            <div style={{fontSize:10,color:"#3a3a3a",marginBottom:18,textAlign:"right"}}>{numGroups} groups × {picksPerGroup} = <span style={{color:"#555"}}>{numGroups*picksPerGroup} total athletes</span></div>

            {/* Leader slots */}
            <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Forge leaders</div>
            {Array.from({length:numGroups},(_,i)=>{
              const color=COLORS[i%COLORS.length];
              const isSet=!!leaders[i];
              return(
                <div key={i} style={{
                  display:"flex",alignItems:"center",gap:10,marginBottom:6,
                  padding:"10px 12px",borderRadius:10,
                  background:isSet?color+"14":"#0d0d0d",
                  border:"1px solid "+(isSet?color+"55":"#1a1a1a"),
                }}>
                  <div style={{
                    width:30,height:30,borderRadius:"50%",background:color,flexShrink:0,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:11,fontWeight:700,color:"#fff",
                  }}>G{i+1}</div>
                  <div style={{flex:1}}>
                    {isSet?(
                      <div style={{fontSize:13,fontWeight:600,color}}>{leaders[i]}</div>
                    ):(
                      <div style={{fontSize:12,color:"#2e2e2e"}}>Tap a name below</div>
                    )}
                    <div style={{fontSize:9,color:"#3a3a3a",marginTop:1,textTransform:"uppercase",letterSpacing:"0.05em"}}>Tier {getTier(i,numGroups)}</div>
                  </div>
                  {isSet&&(
                    <button onClick={()=>{const l=[...leaders];l[i]="";setLeaders(l);}} style={{background:"transparent",border:"none",color:"#555",fontSize:20,cursor:"pointer",padding:"0 2px",lineHeight:1}}>×</button>
                  )}
                </div>
              );
            })}

            {/* Athlete picker */}
            <div style={{marginTop:12}}>
              <input value={leaderSearch} onChange={e=>setLeaderSearch(e.target.value)} placeholder="🔍 Search athletes…" style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"0.5px solid #1e1e1e",fontSize:13,fontFamily:"Georgia,serif",marginBottom:8,boxSizing:"border-box",background:"#0d0d0d",color:"#ddd",outline:"none"}}/>
              <div style={{maxHeight:190,overflowY:"auto",borderRadius:8,border:"0.5px solid #1a1a1a"}}>
                {activeAthletes.filter(a=>!leaders.includes(a.name)&&(!leaderSearch||a.name.toLowerCase().includes(leaderSearch.toLowerCase()))).map(a=>{
                  const emptySlot=leaders.findIndex(l=>!l);
                  const slotColor=emptySlot>=0?COLORS[emptySlot%COLORS.length]:null;
                  return(
                    <button key={a.id} onClick={()=>{if(emptySlot>=0){const l=[...leaders];l[emptySlot]=a.name;setLeaders(l);}}} disabled={emptySlot<0}
                      style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#0d0d0d",border:"none",borderBottom:"0.5px solid #141414",cursor:emptySlot>=0?"pointer":"default",fontFamily:"Georgia,serif",textAlign:"left",opacity:emptySlot>=0?1:0.3}}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:STEEL,flexShrink:0,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:600,color:"#fff"}}>
                        {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:a.name[0]}
                      </div>
                      <div style={{flex:1,fontSize:13,color:"#ccc"}}>{a.name}</div>
                      {emptySlot>=0&&<div style={{fontSize:10,color:slotColor,fontWeight:600,background:slotColor+"1a",padding:"3px 8px",borderRadius:6,flexShrink:0}}>→ G{emptySlot+1}</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button onClick={startBracelets} disabled={leaders.some(l=>!l)} style={{
            width:"100%",padding:"15px",borderRadius:10,border:"none",
            background:leaders.some(l=>!l)?"#191919":ORANGE,
            color:leaders.some(l=>!l)?"#3a3a3a":"#fff",
            fontSize:14,fontWeight:700,cursor:leaders.some(l=>!l)?"not-allowed":"pointer",
            fontFamily:"Georgia,serif",
          }}>
            Next → Assign Bracelets
          </button>
        </div>
      )}

      {/* ════════════════════════════
          STEP 2 — BRACELETS
      ════════════════════════════ */}
      {step==="bracelet"&&(
        <div>
          {Array.from({length:numGroups},(_,i)=>{
            const color=COLORS[i%COLORS.length];
            const brac=bracelets[i];
            return(
              <div key={i} style={{background:"#0d0d0d",borderRadius:14,padding:"14px",marginBottom:10,border:"2px solid "+color+"55"}}>
                {/* Group header */}
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                  <div style={{width:38,height:38,borderRadius:"50%",background:color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff",flexShrink:0}}>G{i+1}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,fontWeight:700,color}}>{leaders[i]}</div>
                    <div style={{fontSize:10,color:"#444",marginTop:1}}>Tier {getTier(i,numGroups)} · pick a bracelet</div>
                  </div>
                  {brac&&(
                    <div style={{width:24,height:24,borderRadius:"50%",background:brac.hex,border:"2px solid #1a1a1a",flexShrink:0,boxShadow:"0 0 10px "+brac.hex+"88"}}/>
                  )}
                </div>

                {/* Bracelet swatch grid — 6 per row */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8,marginBottom:12}}>
                  {BRACELETS.map(b=>{
                    const isTaken=takenRefs.includes(b.ref)&&brac?.ref!==b.ref;
                    const isSelected=brac?.ref===b.ref;
                    return(
                      <button key={b.ref}
                        onClick={()=>{if(!isTaken){setBracelets(p=>({...p,[i]:BRACELETS.find(x=>x.ref===b.ref)||null}));}}}
                        title={b.color+" — "+b.ref}
                        style={{
                          width:"100%",aspectRatio:"1",minHeight:44,borderRadius:"50%",padding:0,
                          background:b.hex,
                          border:isSelected?"3px solid #fff":isTaken?"2px solid transparent":"2px solid "+b.hex+"33",
                          cursor:isTaken?"not-allowed":"pointer",
                          opacity:isTaken?0.18:1,
                          boxShadow:isSelected?"0 0 0 2px "+b.hex+", 0 0 14px "+b.hex+"99":"none",
                          outline:"none",
                        }}/>
                    );
                  })}
                </div>

                {/* Selected preview */}
                {brac?(
                  <div style={{padding:"10px 12px",background:brac.hex+"18",borderRadius:10,border:"1px solid "+brac.hex+"44"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                      <div style={{width:12,height:12,borderRadius:"50%",background:brac.hex,flexShrink:0}}/>
                      <div style={{fontSize:12,fontWeight:600,color:brac.hex}}>{brac.color} · {brac.ref}</div>
                    </div>
                    <div style={{fontSize:11,color:"#888",fontStyle:"italic",paddingLeft:20}}>"{brac.text}"</div>
                  </div>
                ):(
                  <div style={{textAlign:"center",padding:"6px",color:"#2e2e2e",fontSize:11}}>Tap a swatch to assign</div>
                )}
              </div>
            );
          })}

          <button onClick={startDraft} style={{
            width:"100%",padding:"15px",borderRadius:10,border:"none",
            background:GOLD,color:"#0f0f0f",fontSize:14,fontWeight:700,
            cursor:"pointer",fontFamily:"Georgia,serif",marginTop:4,
          }}>
            🏁 Start Draft!
          </button>
        </div>
      )}

      {/* ════════════════════════════
          STEP 3 — DRAFT
      ════════════════════════════ */}
      {step==="draft"&&(
        <div>
          {!isDone?(
            <>
              {/* ON THE CLOCK — hero card */}
              <div style={{
                background:"linear-gradient(145deg,"+clockCol+"1e,"+clockCol+"08)",
                borderRadius:16,padding:"18px 18px 16px",marginBottom:12,
                border:"2px solid "+clockCol+"77",
                position:"relative",overflow:"hidden",
              }}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+clockCol+","+clockCol+"33)"}}/>
                <div style={{fontSize:9,color:clockCol,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:8,opacity:0.9}}>On the clock</div>
                <div style={{fontSize:30,fontWeight:800,color:"#fff",letterSpacing:"-0.02em",marginBottom:6,lineHeight:1}}>{curLeader}</div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                  <div style={{fontSize:11,color:"#666"}}>Group {(curGroup||0)+1}</div>
                  <div style={{width:3,height:3,borderRadius:"50%",background:"#2e2e2e"}}/>
                  <div style={{fontSize:11,color:"#666"}}>Tier {getTier(curGroup||0,numGroups)}</div>
                  <div style={{width:3,height:3,borderRadius:"50%",background:"#2e2e2e"}}/>
                  <div style={{fontSize:11,color:clockCol,fontWeight:600}}>{clockPickedCount} picked</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{flex:1,height:4,background:"#1a1a1a",borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:(pickSeq.length>0?pickIdx/pickSeq.length*100:0)+"%",background:"linear-gradient(90deg,"+clockCol+","+clockCol+"88)",borderRadius:2,transition:"width 0.4s ease"}}/>
                  </div>
                  <div style={{fontSize:10,color:"#555",flexShrink:0,fontWeight:600}}>{pickIdx+1} / {pickSeq.length}</div>
                </div>
              </div>

              {/* SNAKE ORDER PREVIEW */}
              <div style={{marginBottom:12,overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
                <div style={{display:"flex",gap:5,paddingBottom:2,minWidth:"max-content"}}>
                  {pickSeq.slice(Math.max(0,pickIdx-1),Math.min(pickSeq.length,pickIdx+9)).map((gIdx,offset)=>{
                    const absIdx=Math.max(0,pickIdx-1)+offset;
                    const isPast=absIdx<pickIdx;
                    const isCurrent=absIdx===pickIdx;
                    const col=COLORS[gIdx%COLORS.length];
                    return(
                      <div key={offset} style={{
                        flexShrink:0,padding:"5px 10px",borderRadius:8,textAlign:"center",minWidth:46,
                        background:isCurrent?col:isPast?"#111":"#151515",
                        border:"1px solid "+(isCurrent?col:isPast?col+"1a":col+"33"),
                        opacity:isPast?0.35:1,
                      }}>
                        <div style={{fontSize:11,fontWeight:isCurrent?700:400,color:isCurrent?"#fff":col}}>G{gIdx+1}</div>
                        <div style={{fontSize:8,color:isCurrent?"#ffffffaa":"#444",marginTop:1,letterSpacing:"0.04em"}}>{isCurrent?"NOW":"#"+(absIdx+1)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ATHLETE SEARCH + POOL */}
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search athletes…" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid #1e1e1e",fontSize:14,fontFamily:"Georgia,serif",marginBottom:8,boxSizing:"border-box",background:"#111",color:"#ddd",outline:"none"}}/>
              <div style={{background:"#0d0d0d",borderRadius:12,border:"0.5px solid #161616",overflow:"hidden",marginBottom:14}}>
                {pool.length===0?(
                  <div style={{textAlign:"center",padding:"2rem",color:"#444",fontSize:13}}>No athletes available</div>
                ):pool.map(a=>{
                  const col=COLORS[curGroup%COLORS.length];
                  return(
                    <button key={a.id} onClick={()=>pick(a.name)} style={{
                      width:"100%",display:"flex",alignItems:"center",gap:12,
                      padding:"13px 14px",background:"#0d0d0d",
                      border:"none",borderBottom:"0.5px solid #121212",
                      cursor:"pointer",fontFamily:"Georgia,serif",textAlign:"left",
                    }}>
                      <div style={{width:40,height:40,borderRadius:"50%",background:STEEL,flexShrink:0,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:600,color:"#fff"}}>
                        {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:a.name[0]}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:500,color:"#e0e0e0"}}>{a.name}</div>
                        {a.sport&&<div style={{fontSize:11,color:"#555",marginTop:1}}>{a.sport}</div>}
                      </div>
                      <div style={{
                        width:34,height:34,borderRadius:"50%",flexShrink:0,
                        background:col+"1e",border:"1.5px solid "+col+"66",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:18,fontWeight:700,color:col,
                      }}>+</div>
                    </button>
                  );
                })}
              </div>

              {/* GROUP BOARDS */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
                {Array.from({length:numGroups},(_,i)=>{
                  const col=COLORS[i%COLORS.length];
                  const isCurrent=i===curGroup;
                  const members=groups[i]||[];
                  const brac=bracelets[i];
                  return(
                    <div key={i} style={{
                      background:isCurrent?col+"18":"#0d0d0d",
                      borderRadius:10,padding:"10px 10px 8px",
                      border:"1.5px solid "+(isCurrent?col:col+"22"),
                    }}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
                        <div style={{display:"flex",alignItems:"center",gap:5}}>
                          <div style={{width:7,height:7,borderRadius:"50%",background:col}}/>
                          <div style={{fontSize:10,fontWeight:700,color:col,textTransform:"uppercase",letterSpacing:"0.06em"}}>G{i+1}</div>
                          {isCurrent&&<div style={{fontSize:8,color:col,fontWeight:700,letterSpacing:"0.06em"}}>▶</div>}
                        </div>
                        <div style={{fontSize:9,color:"#3a3a3a"}}>{members.length-1}/{picksPerGroup-1}</div>
                      </div>
                      <div style={{fontSize:11,fontWeight:600,color:isCurrent?col:"#999",marginBottom:4,paddingLeft:12}}>⚒ {leaders[i]||"—"}</div>
                      {members.slice(1).map(n=>(
                        <div key={n} style={{fontSize:10,color:"#666",paddingLeft:12,padding:"1px 0 1px 12px"}}>· {n}</div>
                      ))}
                      {brac&&(
                        <div style={{marginTop:5,paddingLeft:12,display:"flex",alignItems:"center",gap:4}}>
                          <div style={{width:7,height:7,borderRadius:"50%",background:brac.hex,flexShrink:0}}/>
                          <div style={{fontSize:8,color:"#444"}}>{brac.ref}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ):(
            <div style={{textAlign:"center",padding:"3rem 1rem"}}>
              <div style={{fontSize:64,marginBottom:16}}>🏆</div>
              <div style={{fontSize:22,fontWeight:800,color:GOLD,marginBottom:6,letterSpacing:"-0.02em"}}>Draft Complete!</div>
              <div style={{fontSize:12,color:"#555",marginBottom:24}}>{numGroups} groups · iron sharpens iron</div>
              <button onClick={()=>setStep("done")} style={{padding:"13px 28px",borderRadius:10,border:"none",background:GOLD,color:"#0f0f0f",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif"}}>View Groups →</button>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════
          DONE / LOCKED
      ════════════════════════════ */}
      {step==="done"&&(
        <div>
          <div style={{background:"linear-gradient(135deg,#091a0b,#0c2210)",borderRadius:12,padding:"13px 16px",marginBottom:14,border:"1px solid "+GREEN+"33",textAlign:"center"}}>
            <div style={{fontSize:10,color:GREEN,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:4}}>Draft complete</div>
            <div style={{fontSize:13,fontWeight:600,color:"#ddd"}}>Groups are locked · manage in Teams tab</div>
          </div>

          {Array.from({length:numGroups},(_,i)=>{
            const color=COLORS[i%COLORS.length];
            const brac=bracelets[i];
            const members=groups[i]||[];
            return(
              <div key={i} style={{background:"#0d0d0d",borderRadius:14,padding:"14px",marginBottom:10,border:"2px solid "+color+"44"}}>
                {/* Header */}
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <div style={{width:38,height:38,borderRadius:"50%",background:color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff",flexShrink:0}}>G{i+1}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,color}}>⚒ {leaders[i]}</div>
                    <div style={{fontSize:10,color:"#444",marginTop:1}}>Tier {getTier(i,numGroups)} · {members.length-1} athletes</div>
                  </div>
                  {brac&&(
                    <div style={{width:22,height:22,borderRadius:"50%",background:brac.hex,border:"2px solid #1a1a1a",flexShrink:0,boxShadow:"0 0 8px "+brac.hex+"66"}}/>
                  )}
                </div>

                {/* Bracelet */}
                {brac&&(
                  <div style={{padding:"8px 11px",background:brac.hex+"14",borderRadius:8,marginBottom:10,border:"0.5px solid "+brac.hex+"33"}}>
                    <div style={{fontSize:10,fontWeight:600,color:brac.hex}}>{brac.ref}</div>
                    <div style={{fontSize:10,color:"#777",fontStyle:"italic",marginTop:1}}>"{brac.text}"</div>
                  </div>
                )}

                {/* Roster chips */}
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {members.slice(1).map(n=>(
                    <span key={n} style={{fontSize:11,padding:"4px 10px",borderRadius:12,background:color+"14",color,border:"1px solid "+color+"33",fontWeight:500}}>{n}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
