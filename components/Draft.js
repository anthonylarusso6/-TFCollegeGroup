import { useState, useEffect } from "react";
import { BG, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { supabase } from "../lib/supabase";

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

  useEffect(()=>{
    (async()=>{
      try{
        const{data}=await supabase.from("draft").select("*").order("created_at",{ascending:false}).limit(1);
        if(data&&data[0]){
          const d=data[0];
          setDraftId(d.id);
          // Derive group count from leaders array — group_count column doesn't exist
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
          if(phase==="draft"){
            const maxMembers=Math.max(...(d.groups||[]).map(g=>(g||[]).length),1);
            const pp=Math.max(maxMembers,picksPerGroup);
            setPicksPerGroup(pp);
            const seq=makeSnake(n,pp);
            setPickSeq(seq);
            const totalPicked=(d.groups||[]).flat().length;
            setPickIdx(Math.max(0,totalPicked-n));
          }
        }
      }catch(e){console.error("Load draft:",e);}
      setLoading(false);
    })();
  },[]);

  useEffect(()=>{
    setLeaders(prev=>{
      const next=Array(numGroups).fill("");
      prev.slice(0,numGroups).forEach((l,i)=>{next[i]=l;});
      return next;
    });
  },[numGroups]);

  // Only save columns that actually exist in the draft table
  const save=async(updates={})=>{
    setSaveError("");
    const payload={
      leaders:leaders.slice(0,numGroups),
      bracelets:Array.from({length:numGroups},(_,i)=>bracelets[i]||null),
      groups:Array.from({length:numGroups},(_,i)=>groups[i]||[]),
      ...updates,
    };
    // Strip columns that don't exist in the schema
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
    const noMore=athletes.filter(a=>![...Object.values(newGroups).flat()].includes(a.name)).length===0;

    if(seqDone||noMore){
      await Promise.all(leaders.map(async(name,i)=>{
        const a=athletes.find(x=>x.name===name);
        if(a){try{await supabase.from("athletes").update({role:"forge",group_idx:i,tier:getTier(i,numGroups)}).eq("id",a.id);}catch(e){}}
      }));
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
  const pool=athletes.filter(a=>!assigned.includes(a.name)&&(!search||a.name.toLowerCase().includes(search.toLowerCase())));
  const curGroup=pickSeq[pickIdx];
  const curLeader=leaders[curGroup];
  const isDone=pickIdx>=pickSeq.length||pool.length===0;

  if(loading)return<div style={{textAlign:"center",padding:"2rem",color:"#888"}}>Loading...</div>;

  return(
    <div>
      {/* Header */}
      <div style={{background:BG,borderRadius:12,padding:"12px 14px",marginBottom:12,border:"1px solid #222",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>🎯 Draft Board</div>
          <div style={{fontSize:11,color:"#555",marginTop:2}}>
            {step==="setup"&&"Step 1 — Set up groups"}
            {step==="bracelet"&&"Step 2 — Assign bracelets"}
            {step==="draft"&&`Step 3 — Pick ${pickIdx+1} of ${pickSeq.length}`}
            {step==="done"&&"✅ Draft complete — edit in Teams tab"}
          </div>
        </div>
        <button onClick={reset} style={{padding:"6px 12px",borderRadius:8,border:"0.5px solid #444",background:"transparent",color:"#777",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>Reset</button>
      </div>

      {/* Save error */}
      {saveError&&(
        <div style={{background:"#1a0808",borderRadius:10,padding:"10px 14px",marginBottom:10,border:"0.5px solid #C0392B44",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:12,color:"#C0392B"}}>⚠ {saveError}</span>
          <button onClick={()=>setSaveError("")} style={{background:"transparent",border:"none",color:"#666",fontSize:14,cursor:"pointer",padding:"0 4px"}}>×</button>
        </div>
      )}

      {/* STEP 1: SETUP */}
      {step==="setup"&&(
        <div>
          <div style={{background:"#111",borderRadius:12,padding:"16px",marginBottom:10,border:"0.5px solid #1e1e1e"}}>
            {/* Group count */}
            <div style={{fontSize:12,fontWeight:600,color:"#ddd",marginBottom:8}}>Number of groups</div>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              {[1,2,3,4,5,6].map(n=>(
                <button key={n} onClick={()=>setNumGroups(n)} style={{width:38,height:38,borderRadius:8,border:"1px solid "+(numGroups===n?ORANGE:"#333"),background:numGroups===n?ORANGE:"#1a1a1a",color:numGroups===n?"#fff":"#888",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif"}}>{n}</button>
              ))}
            </div>

            {/* Picks per group */}
            <div style={{fontSize:12,fontWeight:600,color:"#ddd",marginBottom:6}}>Athletes per group: <span style={{color:ORANGE}}>{picksPerGroup}</span></div>
            <input type="range" min={2} max={12} value={picksPerGroup} onChange={e=>setPicksPerGroup(+e.target.value)} style={{width:"100%",accentColor:ORANGE,marginBottom:4}}/>
            <div style={{fontSize:11,color:"#555",marginBottom:16}}>{numGroups} groups × {picksPerGroup} picks = {numGroups*picksPerGroup} total athletes</div>

            {/* Leader selectors */}
            <div style={{fontSize:12,fontWeight:600,color:"#ddd",marginBottom:8}}>Select Forge leaders</div>
            <input value={leaderSearch} onChange={e=>setLeaderSearch(e.target.value)} placeholder="🔍 Search..." style={{width:"100%",padding:"8px 12px",borderRadius:8,border:"0.5px solid #222",fontSize:13,fontFamily:"Georgia,serif",marginBottom:10,boxSizing:"border-box",background:"#1a1a1a",color:"#ddd"}}/>
            {Array.from({length:numGroups},(_,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,padding:"8px 10px",borderRadius:8,background:leaders[i]?COLORS[i%COLORS.length]+"18":"#0e0e0e",border:"1px solid "+(leaders[i]?COLORS[i%COLORS.length]+"44":"#252525")}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:COLORS[i%COLORS.length],flexShrink:0}}/>
                <div style={{fontSize:11,color:COLORS[i%COLORS.length],fontWeight:700,minWidth:60}}>G{i+1} · T{getTier(i,numGroups)}</div>
                {leaders[i]?(
                  <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{fontSize:13,fontWeight:600,color:COLORS[i%COLORS.length]}}>{leaders[i]}</div>
                    <button onClick={()=>{const l=[...leaders];l[i]="";setLeaders(l);}} style={{background:"transparent",border:"none",color:COLORS[i%COLORS.length],fontSize:16,cursor:"pointer",padding:0}}>×</button>
                  </div>
                ):(
                  <div style={{fontSize:12,color:"#444",flex:1}}>Tap a name below →</div>
                )}
              </div>
            ))}
            <div style={{maxHeight:200,overflowY:"auto",border:"0.5px solid #1e1e1e",borderRadius:8,marginTop:6}}>
              {athletes.filter(a=>
                !leaders.includes(a.name)&&
                (!leaderSearch||a.name.toLowerCase().includes(leaderSearch.toLowerCase()))
              ).map(a=>{
                const emptySlot=leaders.findIndex(l=>!l);
                return(
                  <button key={a.id} onClick={()=>{
                    if(emptySlot>=0){const l=[...leaders];l[emptySlot]=a.name;setLeaders(l);}
                  }} disabled={emptySlot<0} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#141414",border:"none",borderBottom:"0.5px solid #1e1e1e",cursor:emptySlot>=0?"pointer":"default",fontFamily:"Georgia,serif",textAlign:"left",opacity:emptySlot>=0?1:0.4}}>
                    <div style={{width:32,height:32,borderRadius:"50%",background:STEEL,flexShrink:0,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:600,color:"#fff"}}>
                      {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:a.name[0]}
                    </div>
                    <div style={{fontSize:13,color:"#ddd"}}>{a.name}</div>
                    {emptySlot>=0&&<div style={{marginLeft:"auto",fontSize:11,color:COLORS[emptySlot%COLORS.length],fontWeight:600}}>→ G{emptySlot+1}</div>}
                  </button>
                );
              })}
            </div>
          </div>
          <button onClick={startBracelets} disabled={leaders.some(l=>!l)} style={{width:"100%",padding:"14px",borderRadius:10,border:"none",background:leaders.some(l=>!l)?"#222":ORANGE,color:leaders.some(l=>!l)?"#555":"#fff",fontSize:14,fontWeight:700,cursor:leaders.some(l=>!l)?"not-allowed":"pointer",fontFamily:"Georgia,serif"}}>
            Next → Assign Bracelets
          </button>
        </div>
      )}

      {/* STEP 2: BRACELETS */}
      {step==="bracelet"&&(
        <div>
          {Array.from({length:numGroups},(_,i)=>{
            const color=COLORS[i%COLORS.length];
            const currentBrac=bracelets[i];
            return(
              <div key={i} style={{background:"#141414",borderRadius:12,padding:"14px",marginBottom:8,border:"2px solid "+color}}>
                <div style={{fontSize:13,fontWeight:700,color,marginBottom:8}}>⚒ {leaders[i]} — Group {i+1}</div>
                <select value={currentBrac?.ref||""} onChange={e=>{const b=BRACELETS.find(x=>x.ref===e.target.value)||null;setBracelets(p=>({...p,[i]:b}));}}
                  style={{width:"100%",padding:"8px",borderRadius:8,border:"1px solid "+color+"33",fontSize:12,fontFamily:"Georgia,serif",marginBottom:6,background:"#1a1a1a",color:"#ddd"}}>
                  <option value="">— Choose bracelet —</option>
                  {BRACELETS.filter(b=>!takenRefs.includes(b.ref)||currentBrac?.ref===b.ref).map(b=>(
                    <option key={b.ref} value={b.ref}>{b.color} — {b.ref}</option>
                  ))}
                </select>
                {currentBrac&&(
                  <div style={{padding:"8px",background:currentBrac.hex+"22",borderRadius:8,border:"1px solid "+currentBrac.hex+"33"}}>
                    <div style={{fontSize:11,fontWeight:600,color:currentBrac.hex}}>{currentBrac.ref}</div>
                    <div style={{fontSize:11,color:"#888",fontStyle:"italic",marginTop:2}}>"{currentBrac.text}"</div>
                  </div>
                )}
              </div>
            );
          })}
          <button onClick={startDraft} style={{width:"100%",padding:"14px",borderRadius:10,border:"none",background:GOLD,color:"#1a1a1a",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif",marginTop:4}}>
            🏁 Start Draft!
          </button>
        </div>
      )}

      {/* STEP 3: DRAFT */}
      {step==="draft"&&(
        <div>
          {!isDone?(
            <>
              <div style={{background:"linear-gradient(135deg,#111,#1a1a1a)",borderRadius:14,padding:"16px",marginBottom:12,border:"2px solid "+COLORS[curGroup%COLORS.length],textAlign:"center"}}>
                <div style={{fontSize:11,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Now picking · {pickIdx+1}/{pickSeq.length}</div>
                <div style={{fontSize:24,fontWeight:800,color:COLORS[curGroup%COLORS.length]}}>{curLeader}</div>
                <div style={{fontSize:11,color:"#555",marginTop:4}}>Group {curGroup+1} · Tier {getTier(curGroup,numGroups)} · {(groups[curGroup]||[]).length} picked</div>
              </div>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search athletes..." style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid #222",fontSize:14,fontFamily:"Georgia,serif",marginBottom:8,boxSizing:"border-box",background:"#111",color:"#ddd"}}/>
              <div style={{background:"#141414",borderRadius:12,border:"0.5px solid #1e1e1e",overflow:"hidden",marginBottom:12}}>
                {pool.length===0?<div style={{textAlign:"center",padding:"2rem",color:"#555",fontSize:13}}>No athletes available</div>:
                  pool.map(a=>(
                    <button key={a.id} onClick={()=>pick(a.name)} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"#141414",border:"none",borderBottom:"0.5px solid #1e1e1e",cursor:"pointer",fontFamily:"Georgia,serif",textAlign:"left"}}>
                      <div style={{width:36,height:36,borderRadius:"50%",background:STEEL,flexShrink:0,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:600,color:"#fff"}}>
                        {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:a.name[0]}
                      </div>
                      <div style={{flex:1,fontSize:14,color:"#ddd"}}>{a.name}</div>
                      <div style={{fontSize:18,color:COLORS[curGroup%COLORS.length],fontWeight:700}}>+</div>
                    </button>
                  ))
                }
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:6}}>
                {Array.from({length:numGroups},(_,i)=>(
                  <div key={i} style={{background:"#141414",borderRadius:8,padding:"8px",border:"1px solid "+(i===curGroup?COLORS[i%COLORS.length]+"88":"#222")}}>
                    <div style={{fontSize:10,fontWeight:700,color:COLORS[i%COLORS.length],marginBottom:4}}>Group {i+1} ({(groups[i]||[]).length})</div>
                    {(groups[i]||[]).map(n=><div key={n} style={{fontSize:11,color:"#888"}}>{n}</div>)}
                  </div>
                ))}
              </div>
            </>
          ):(
            <div style={{textAlign:"center",padding:"2rem"}}>
              <div style={{fontSize:48,marginBottom:12}}>🏆</div>
              <div style={{fontSize:18,fontWeight:700,color:GREEN,marginBottom:16}}>Draft Complete!</div>
              <button onClick={()=>setStep("done")} style={{padding:"12px 24px",borderRadius:10,border:"none",background:GOLD,color:"#1a1a1a",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif"}}>View Groups →</button>
            </div>
          )}
        </div>
      )}

      {/* DONE */}
      {step==="done"&&(
        <div>
          <div style={{background:"linear-gradient(135deg,#0d1f0d,#1a3a1f)",borderRadius:12,padding:"12px 14px",marginBottom:12,border:"1px solid "+GREEN+"44",textAlign:"center"}}>
            <div style={{fontSize:15,fontWeight:700,color:GREEN}}>✅ Draft Complete — edit groups in the Teams tab</div>
          </div>
          {Array.from({length:numGroups},(_,i)=>{
            const color=COLORS[i%COLORS.length];
            const brac=bracelets[i];
            return(
              <div key={i} style={{background:"#141414",borderRadius:12,padding:"12px",marginBottom:8,border:"2px solid "+color}}>
                <div style={{fontSize:13,fontWeight:700,color,marginBottom:6}}>⚒ {leaders[i]} — Group {i+1} · Tier {getTier(i,numGroups)}</div>
                {brac&&<div style={{fontSize:11,color:"#888",marginBottom:6,fontStyle:"italic"}}>📿 {brac.ref} — "{brac.text}"</div>}
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {(groups[i]||[]).map(n=><span key={n} style={{fontSize:11,padding:"3px 8px",borderRadius:12,background:color+"11",color,border:"1px solid "+color+"33"}}>{n}</span>)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
