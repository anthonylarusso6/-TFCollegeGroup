import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { SkeletonList } from "./Skeleton";

const GC=["#534AB7","#C0392B","#1E6B3A","#D4AF37","#E8720C","#1A4F8A"];
const getTier=(i,n)=>i<2?1:i===2?2:3;
const TIER_LABEL={1:"Tier 1",2:"Tier 2",3:"Tier 3"};

const BRACELETS=[
  {color:"Light orange", ref:"Proverbs 3:5",   text:"Trust in the Lord with all your heart.",                    hex:"#F5A623"},
  {color:"Dark orange",  ref:"Psalm 46:10",    text:"Be still, and know that I am God.",                        hex:"#D4581A"},
  {color:"Yellow",       ref:"Genesis 1:3",    text:"And God said, let there be light.",                        hex:"#E8C84A"},
  {color:"Light blue",   ref:"1 Peter 5:7",    text:"Cast all your anxiety on him.",                            hex:"#5BBFEA"},
  {color:"Dark blue",    ref:"1 John 3:1",     text:"See what great love the Father has lavished on us.",       hex:"#1A4F8A"},
  {color:"Red",          ref:"Philippians 4:13",text:"I can do all things through Christ who strengthens me.", hex:"#C0392B"},
  {color:"Pink",         ref:"1 Cor 13:13",    text:"The greatest of these is love.",                           hex:"#E87AAC"},
  {color:"Dark purple",  ref:"Matthew 11:28",  text:"Come to me, all who are weary, and I will give you rest.",hex:"#5B2D8E"},
  {color:"Light purple", ref:"John 14:6",      text:"I am the way and the truth and the life.",                 hex:"#9B59B6"},
  {color:"Dark green",   ref:"Joshua 1:9",     text:"Be strong and courageous.",                                hex:"#1E6B3A"},
  {color:"Light green",  ref:"Psalm 27:1",     text:"The Lord is my light and my salvation.",                  hex:"#58B368"},
  {color:"Teal",         ref:"Jeremiah 29:11", text:"Plans to prosper you and not to harm you.",               hex:"#1A9E8F"},
];

export default function TeamsView({athletes=[]}){
  const[groups,setGroups]=useState({});
  const[leaders,setLeaders]=useState({});
  const[bracelets,setBracelets]=useState({});   // {groupIdx: bracelet object | null}
  const[groupCount,setGroupCount]=useState(4);
  const[draftId,setDraftId]=useState(null);
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);
  const[saveError,setSaveError]=useState("");
  const[loadError,setLoadError]=useState("");
  const[dragging,setDragging]=useState(null);
  const[dragOver,setDragOver]=useState(null);
  const[dragOverLeader,setDragOverLeader]=useState(null);
  const[picker,setPicker]=useState(null);           // athlete name waiting for group pick
  const[braceletModal,setBraceletModal]=useState(null); // group idx whose bracelet is being picked
  const[leaderPicker,setLeaderPicker]=useState(null);   // group idx whose leader is being picked

  useEffect(()=>{loadTeams();},[]);

  const loadTeams=async()=>{
    setLoading(true);
    try{
      const{data}=await supabase.from("draft").select("*").order("created_at",{ascending:false}).limit(1);
      if(data&&data.length>0){
        const d=data[0];
        setDraftId(d.id);
        const loadedGroups=d.groups||[];
        const gc=Math.max(loadedGroups.length,4);
        setGroupCount(gc);
        const g={};
        loadedGroups.forEach((arr,i)=>{g[i]=arr||[];});
        for(let i=0;i<gc;i++){if(!g[i])g[i]=[];}
        setGroups(g);
        const l={};
        (d.leaders||[]).forEach((name,i)=>{if(name)l[i]=name;});
        setLeaders(l);
        const b={};
        (d.bracelets||[]).forEach((br,i)=>{if(br)b[i]=br;});
        setBracelets(b);
      }else{
        const g={};for(let i=0;i<4;i++)g[i]=[];
        setGroups(g);
      }
    }catch(e){
      console.error("Teams load:",e);
      setLoadError(e.message||"Failed to load teams");
      const g={};for(let i=0;i<4;i++)g[i]=[];
      setGroups(g);
    }
    setLoading(false);
  };

  const addToGroup=(name,toIdx)=>{
    setGroups(prev=>{
      const n={...prev};
      Object.keys(n).forEach(k=>{n[k]=(n[k]||[]).filter(x=>x!==name);});
      n[toIdx]=[...(n[toIdx]||[]),name];
      return n;
    });
    setPicker(null);
  };

  const removeFromGroup=(name,idx)=>{
    setGroups(prev=>({...prev,[idx]:(prev[idx]||[]).filter(n=>n!==name)}));
    if(leaders[idx]===name)setLeaders(prev=>{const n={...prev};delete n[idx];return n;});
  };

  const onDragStart=(name,fromGroup)=>setDragging({name,fromGroup});
  const onDragEnd=()=>{setDragging(null);setDragOver(null);setDragOverLeader(null);};

  const onDropLeader=(groupIdx)=>{
    if(!dragging)return;
    const{name}=dragging;
    setGroups(prev=>{
      const n={...prev};
      Object.keys(n).forEach(k=>{n[k]=(n[k]||[]).filter(x=>x!==name);});
      n[groupIdx]=[...(n[groupIdx]||[]),name];
      return n;
    });
    setLeaders(prev=>({...prev,[groupIdx]:name}));
    setDragging(null);setDragOver(null);setDragOverLeader(null);
  };

  const onDropGroup=(toIdx)=>{
    if(!dragging)return;
    addToGroup(dragging.name,toIdx);
    setDragging(null);setDragOver(null);
  };

  const onDropPool=()=>{
    if(!dragging||dragging.fromGroup===null)return;
    removeFromGroup(dragging.name,dragging.fromGroup);
    setDragging(null);setDragOver(null);
  };

  const takenRefs=Object.values(bracelets).filter(Boolean).map(b=>b.ref);

  const saveChanges=async()=>{
    setSaving(true);
    setSaveError("");
    try{
      const groupsArr=Array.from({length:groupCount},(_,i)=>groups[i]||[]);
      const leadersArr=Array.from({length:groupCount},(_,i)=>leaders[i]||null);
      const braceletsArr=Array.from({length:groupCount},(_,i)=>bracelets[i]||null);
      const payload={groups:groupsArr,leaders:leadersArr,bracelets:braceletsArr};
      if(draftId){
        // Don't overwrite phase/locked when editing — preserve existing draft state
        const{error:err}=await supabase.from("draft").update(payload).eq("id",draftId);
        if(err)throw err;
      }else{
        const{data:inserted,error:err}=await supabase.from("draft").insert({...payload,phase:"setup",locked:false}).select().single();
        if(err)throw err;
        if(inserted)setDraftId(inserted.id);
      }
      for(let i=0;i<groupCount;i++){
        for(const name of(groupsArr[i]||[])){
          const ath=athletes.find(a=>a.name===name);
          if(ath){
            const updates={role:leadersArr[i]===name?"forge":"iron",group_idx:i};
            if(leadersArr[i]===name&&braceletsArr[i])updates.bracelet=braceletsArr[i].ref;
            try{await supabase.from("athletes").update(updates).eq("id",ath.id);}catch(ae){console.error("Athlete update:",ae);}
          }
        }
      }
      setSaved(true);setTimeout(()=>setSaved(false),3000);
    }catch(e){
      console.error("Save error:",e);
      setSaveError(e.message||"Save failed — check console");
    }
    setSaving(false);
  };

  if(loading)return<div style={{paddingTop:8}}><SkeletonList rows={5}/></div>;

  const allAssigned=Object.values(groups).flat();
  const active=athletes.filter(a=>a.status==="active");
  const unassigned=active.filter(a=>!allAssigned.includes(a.name));

  return(
    <div>
      {/* Athlete group-picker modal */}
      {picker&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}} onClick={()=>setPicker(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#141414",borderRadius:16,padding:"1.5rem",width:"100%",maxWidth:300,border:"1px solid #2a2a2a",fontFamily:"Georgia,serif"}}>
            <div style={{fontSize:15,fontWeight:700,color:"#fff",marginBottom:2}}>{picker}</div>
            <div style={{fontSize:11,color:"#555",marginBottom:16}}>Add to which group?</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {Array.from({length:groupCount},(_,i)=>(
                <button key={i} onClick={()=>addToGroup(picker,i)} style={{padding:"14px 10px",borderRadius:10,border:"2px solid "+GC[i]+"55",background:GC[i]+"18",color:GC[i],fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif",textAlign:"center",lineHeight:1.3}}>
                  Group {i+1}
                  <div style={{fontSize:9,fontWeight:400,color:GC[i]+"99",marginTop:3}}>{TIER_LABEL[getTier(i,groupCount)]}</div>
                  <div style={{fontSize:10,color:GC[i]+"cc",marginTop:2}}>{(groups[i]||[]).length} members</div>
                </button>
              ))}
            </div>
            <button onClick={()=>setPicker(null)} style={{width:"100%",marginTop:12,padding:"10px",borderRadius:10,border:"0.5px solid #252525",background:"transparent",color:"#555",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>Cancel</button>
          </div>
        </div>
      )}

      {/* Leader + Bracelet picker modal */}
      {leaderPicker!==null&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:999,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setLeaderPicker(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#141414",borderRadius:"20px 20px 0 0",padding:"1.25rem 1.25rem 2rem",width:"100%",maxWidth:480,border:"1px solid #252525",borderBottom:"none",fontFamily:"Georgia,serif",maxHeight:"85vh",overflowY:"auto"}}>
            <div style={{width:40,height:4,borderRadius:2,background:"#333",margin:"0 auto 14px"}}/>
            {/* Header */}
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:GC[leaderPicker],flexShrink:0}}/>
              <div style={{fontSize:15,fontWeight:700,color:GC[leaderPicker]}}>Group {leaderPicker+1}</div>
            </div>

            {/* ── LEADER SECTION ── */}
            <div style={{fontSize:11,fontWeight:700,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>⚒ Forge Leader</div>
            <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:20}}>
              {active.map(a=>{
                const isCurrentLeader=leaders[leaderPicker]===a.name;
                const isLeaderElsewhere=Object.entries(leaders).some(([k,v])=>Number(k)!==leaderPicker&&v===a.name);
                return(
                  <button key={a.id} disabled={isLeaderElsewhere}
                    onClick={()=>{
                      if(isCurrentLeader){setLeaders(prev=>{const n={...prev};delete n[leaderPicker];return n;});}
                      else{
                        setGroups(prev=>{const n={...prev};Object.keys(n).forEach(k=>{n[k]=(n[k]||[]).filter(x=>x!==a.name);});n[leaderPicker]=[...(n[leaderPicker]||[]),a.name];return n;});
                        setLeaders(prev=>({...prev,[leaderPicker]:a.name}));
                      }
                    }}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,border:"1.5px solid "+(isCurrentLeader?GC[leaderPicker]:isLeaderElsewhere?"#1e1e1e":"#252525"),background:isCurrentLeader?GC[leaderPicker]+"22":isLeaderElsewhere?"#0d0d0d":"#1a1a1a",cursor:isLeaderElsewhere?"not-allowed":"pointer",fontFamily:"Georgia,serif",opacity:isLeaderElsewhere?0.4:1,textAlign:"left"}}>
                    <div style={{width:34,height:34,borderRadius:"50%",background:isCurrentLeader?GC[leaderPicker]:"#333",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff",flexShrink:0,overflow:"hidden"}}>
                      {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:a.name[0]}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:isCurrentLeader?700:500,color:isCurrentLeader?GC[leaderPicker]:"#ccc"}}>{a.name}</div>
                      <div style={{fontSize:10,color:"#555"}}>{a.sport||"Athlete"}{isLeaderElsewhere?" · Leader elsewhere":""}</div>
                    </div>
                    {isCurrentLeader&&<span style={{fontSize:13}}>✓</span>}
                  </button>
                );
              })}
            </div>

            {/* ── BRACELET SECTION ── */}
            <div style={{fontSize:11,fontWeight:700,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>📿 Bracelet Verse</div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {BRACELETS.map(b=>{
                const taken=takenRefs.includes(b.ref)&&bracelets[leaderPicker]?.ref!==b.ref;
                const selected=bracelets[leaderPicker]?.ref===b.ref;
                return(
                  <button key={b.ref} disabled={taken}
                    onClick={()=>setBracelets(prev=>({...prev,[leaderPicker]:selected?null:b}))}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,border:"1.5px solid "+(selected?b.hex:taken?"#1e1e1e":b.hex+"33"),background:selected?b.hex+"22":taken?"#0d0d0d":"#1a1a1a",cursor:taken?"not-allowed":"pointer",fontFamily:"Georgia,serif",opacity:taken?0.3:1,textAlign:"left"}}>
                    <div style={{width:14,height:14,borderRadius:"50%",background:taken?"#333":b.hex,flexShrink:0,boxShadow:selected?"0 0 8px "+b.hex+"88":"none"}}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:selected?700:400,color:taken?"#333":selected?b.hex:"#ccc"}}>{b.color}</div>
                      <div style={{fontSize:10,color:taken?"#2a2a2a":"#555",fontStyle:"italic"}}>{b.ref} — {b.text}</div>
                    </div>
                    {selected&&<span style={{fontSize:12,color:b.hex}}>✓</span>}
                    {taken&&<span style={{fontSize:10,color:"#2a2a2a"}}>taken</span>}
                  </button>
                );
              })}
            </div>

            <button onClick={()=>setLeaderPicker(null)} style={{width:"100%",marginTop:14,padding:"12px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#E8720C,#C0392B)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif"}}>Done</button>
          </div>
        </div>
      )}

      {/* Bracelet picker modal */}
      {braceletModal!==null&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:999,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setBraceletModal(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#141414",borderRadius:"20px 20px 0 0",padding:"1.25rem 1.25rem 2rem",width:"100%",maxWidth:480,border:"1px solid #252525",borderBottom:"none",fontFamily:"Georgia,serif",maxHeight:"80vh",overflowY:"auto"}}>
            <div style={{width:40,height:4,borderRadius:2,background:"#333",margin:"0 auto 16px"}}/>
            <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:4}}>Group {braceletModal+1} — Bracelet</div>
            <div style={{fontSize:11,color:"#555",marginBottom:16}}>Pick the verse bracelet for this group's leader. Taken ones are grayed out.</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {BRACELETS.map(b=>{
                const taken=takenRefs.includes(b.ref)&&bracelets[braceletModal]?.ref!==b.ref;
                const selected=bracelets[braceletModal]?.ref===b.ref;
                return(
                  <button key={b.ref} disabled={taken} onClick={()=>{setBracelets(prev=>({...prev,[braceletModal]:b}));setBraceletModal(null);}}
                    style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:12,border:"1.5px solid "+(selected?b.hex:taken?"#1e1e1e":b.hex+"44"),background:selected?b.hex+"22":taken?"#0d0d0d":"#1a1a1a",cursor:taken?"not-allowed":"pointer",fontFamily:"Georgia,serif",opacity:taken?0.35:1,textAlign:"left"}}>
                    <div style={{width:16,height:16,borderRadius:"50%",background:taken?"#333":b.hex,flexShrink:0,boxShadow:selected?"0 0 8px "+b.hex+"99":"none"}}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:selected?700:400,color:taken?"#444":selected?b.hex:"#ccc"}}>{b.color}</div>
                      <div style={{fontSize:10,color:taken?"#333":"#555"}}>{b.ref} — <span style={{fontStyle:"italic"}}>{b.text}</span></div>
                    </div>
                    {selected&&<span style={{fontSize:11,color:b.hex}}>✓</span>}
                    {taken&&<span style={{fontSize:10,color:"#333"}}>taken</span>}
                  </button>
                );
              })}
            </div>
            {bracelets[braceletModal]&&(
              <button onClick={()=>{setBracelets(prev=>{const n={...prev};delete n[braceletModal];return n;});setBraceletModal(null);}} style={{width:"100%",marginTop:10,padding:"10px",borderRadius:10,border:"0.5px solid #333",background:"transparent",color:"#555",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>Remove bracelet</button>
            )}
          </div>
        </div>
      )}

      {/* Load error banner */}
      {loadError&&(
        <div style={{background:"#1a0808",borderRadius:10,padding:"10px 14px",marginBottom:10,border:"0.5px solid #C0392B44",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
          <span style={{fontSize:12,color:"#C0392B"}}>⚠ {loadError}</span>
          <button onClick={()=>{setLoadError("");loadTeams();}} style={{background:"transparent",border:"0.5px solid #C0392B55",borderRadius:6,color:"#C0392B",fontSize:11,cursor:"pointer",padding:"4px 10px",fontFamily:"Georgia,serif"}}>Retry</button>
        </div>
      )}

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:saveError?6:14}}>
        <div>
          <div style={{fontSize:13,fontWeight:600,color:"#ddd"}}>{allAssigned.length}/{active.length} assigned</div>
          {unassigned.length>0&&<div style={{fontSize:11,color:"#555"}}>{unassigned.length} not yet placed</div>}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {saved&&<button onClick={loadTeams} style={{padding:"8px 12px",borderRadius:10,border:"0.5px solid #1E6B3A55",background:"transparent",color:"#1E6B3A",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>↺ Reload</button>}
          <button onClick={saveChanges} disabled={saving} style={{padding:"10px 20px",borderRadius:10,border:"none",background:saved?"#1E6B3A":saving?"#222":"linear-gradient(135deg,#E8720C,#C0392B)",color:"#fff",fontSize:12,fontWeight:700,cursor:saving?"not-allowed":"pointer",fontFamily:"Georgia,serif",boxShadow:(saved||saving)?"none":"0 4px 16px #E8720C44",transition:"all 0.2s"}}>
            {saved?"✓ Saved!":saving?"Saving...":"Save Teams"}
          </button>
        </div>
      </div>

      {/* Save error banner */}
      {saveError&&(
        <div style={{background:"#1a0808",borderRadius:10,padding:"10px 14px",marginBottom:12,border:"0.5px solid #C0392B44",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
          <span style={{fontSize:12,color:"#C0392B"}}>⚠ {saveError}</span>
          <button onClick={()=>setSaveError("")} style={{background:"transparent",border:"none",color:"#666",fontSize:14,cursor:"pointer",padding:"0 4px"}}>×</button>
        </div>
      )}

      {/* Group count slider */}
      <div style={{background:"#111",borderRadius:12,padding:"12px 14px",marginBottom:14,border:"0.5px solid #1e1e1e"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontSize:11,color:"#555",textTransform:"uppercase",letterSpacing:"0.08em"}}>Number of groups</div>
          <div style={{fontSize:18,fontWeight:900,color:"#fff",minWidth:20,textAlign:"center"}}>{groupCount}</div>
        </div>
        <input type="range" min={1} max={6} value={groupCount}
          onChange={e=>{
            const n=Number(e.target.value);
            setGroupCount(n);
            setGroups(prev=>{const next={...prev};for(let i=0;i<n;i++){if(!next[i])next[i]=[];}return next;});
          }}
          style={{width:"100%",accentColor:"#E8720C",cursor:"pointer",height:4}}
        />
        <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
          {[1,2,3,4,5,6].map(n=>(
            <span key={n} style={{fontSize:10,color:n===groupCount?"#E8720C":"#333",fontWeight:n===groupCount?700:400,transition:"color 0.15s"}}>{n}</span>
          ))}
        </div>
      </div>

      {/* Unassigned pool */}
      {unassigned.length>0&&(
        <div
          onDragOver={e=>{e.preventDefault();setDragOver("pool");}}
          onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setDragOver(null);}}
          onDrop={onDropPool}
          style={{background:dragOver==="pool"?"#1a1a2a":"#111",borderRadius:14,padding:"14px",marginBottom:12,border:"1px dashed "+(dragOver==="pool"?"#534AB7":"#252525"),transition:"all 0.15s"}}>
          <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Unassigned — tap to place · drag to group</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {unassigned.map(a=>(
              <div key={a.id} draggable
                onDragStart={()=>onDragStart(a.name,null)} onDragEnd={onDragEnd}
                onClick={()=>setPicker(a.name)}
                style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px 6px 6px",borderRadius:20,border:"0.5px solid #2a2a2a",background:"#1e1e1e",cursor:"grab",userSelect:"none"}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:"#333",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:600,color:"#888",flexShrink:0,overflow:"hidden"}}>
                  {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:a.name[0]}
                </div>
                <span style={{fontSize:12,color:"#888"}}>{a.name.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Group cards */}
      {Array.from({length:groupCount},(_,i)=>{
        const color=GC[i];
        const members=groups[i]||[];
        const isTarget=dragOver===i;
        const brac=bracelets[i]||null;
        return(
          <div key={i}
            onDragOver={e=>{e.preventDefault();setDragOver(i);}}
            onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setDragOver(null);}}
            onDrop={()=>onDropGroup(i)}
            style={{background:"#141414",borderRadius:14,padding:"14px",marginBottom:10,border:"2px solid "+(isTarget?color:color+"33"),boxShadow:isTarget?"0 0 20px "+color+"33":"none",transition:"all 0.15s"}}>

            {/* Group header */}
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:color,flexShrink:0,boxShadow:"0 0 6px "+color+"88"}}/>
              <div style={{fontSize:13,fontWeight:700,color}}>Group {i+1}</div>
              <span style={{fontSize:9,padding:"2px 8px",borderRadius:5,background:color+"18",color,border:"0.5px solid "+color+"33"}}>{TIER_LABEL[getTier(i,groupCount)]}</span>
              <div style={{marginLeft:"auto",fontSize:11,color:"#444"}}>{members.length}</div>
            </div>

            {/* Leader drop zone */}
            {(()=>{
              const isLeaderTarget=dragOverLeader===i;
              const currentLeader=leaders[i];
              const leaderAth=currentLeader?athletes.find(a=>a.name===currentLeader):null;
              return(
                <div
                  onDragOver={e=>{e.preventDefault();e.stopPropagation();setDragOverLeader(i);setDragOver(null);}}
                  onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setDragOverLeader(null);}}
                  onDrop={e=>{e.stopPropagation();onDropLeader(i);}}
                  onClick={()=>setLeaderPicker(i)}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:10,marginBottom:8,border:"1.5px dashed "+(isLeaderTarget?color:currentLeader?color+"55":"#2a2a2a"),background:isLeaderTarget?color+"18":currentLeader?color+"10":"transparent",transition:"all 0.15s",cursor:"pointer",minHeight:38}}>
                  <span style={{fontSize:13,filter:"drop-shadow(0 0 4px "+(currentLeader?color+"88":"transparent")+")"}}>⚒</span>
                  {currentLeader?(
                    <div style={{display:"flex",alignItems:"center",gap:6,flex:1}}>
                      <div style={{width:22,height:22,borderRadius:"50%",background:color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff",flexShrink:0,overflow:"hidden"}}>
                        {leaderAth?.photo_url?<img src={leaderAth.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:currentLeader[0]}
                      </div>
                      <span style={{fontSize:12,fontWeight:700,color}}>{currentLeader}</span>
                      <span style={{fontSize:9,color:color+"88",marginLeft:2}}>Forge leader · tap to change</span>
                    </div>
                  ):(
                    <span style={{fontSize:11,color:isLeaderTarget?color:"#444",flex:1}}>{isLeaderTarget?"Drop to set as leader":"Tap or drag to set Forge leader"}</span>
                  )}
                  {currentLeader&&(
                    <button onClick={e=>{e.stopPropagation();setLeaders(prev=>{const n={...prev};delete n[i];return n;});}} style={{background:"transparent",border:"none",cursor:"pointer",color:"#333",fontSize:13,lineHeight:1,padding:"0 2px"}}>×</button>
                  )}
                </div>
              );
            })()}

            {/* Bracelet row */}
            {brac?(
              <button onClick={()=>setBraceletModal(i)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:8,marginBottom:8,background:brac.hex+"12",border:"1px solid "+brac.hex+"33",cursor:"pointer",fontFamily:"Georgia,serif",textAlign:"left"}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:brac.hex,flexShrink:0}}/>
                <span style={{fontSize:11,fontWeight:600,color:brac.hex}}>{brac.color}</span>
                <span style={{fontSize:10,color:"#555",marginLeft:2}}>{brac.ref}</span>
                <span style={{marginLeft:"auto",fontSize:10,color:"#444"}}>change</span>
              </button>
            ):(
              <button onClick={()=>setBraceletModal(i)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:8,marginBottom:8,border:"1px dashed #252525",background:"transparent",cursor:"pointer",fontFamily:"Georgia,serif",textAlign:"left"}}>
                <span style={{fontSize:12}}>📿</span>
                <span style={{fontSize:11,color:"#444"}}>Assign bracelet verse</span>
              </button>
            )}

            {/* Members */}
            {members.length===0?(
              <div style={{fontSize:12,color:isTarget?color+"88":"#2a2a2a",textAlign:"center",padding:"18px 8px",border:"1px dashed "+(isTarget?color+"55":"#252525"),borderRadius:8,transition:"all 0.15s"}}>
                {isTarget?"Drop here":"Empty — drag athletes here"}
              </div>
            ):(
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {members.map(name=>{
                  const isLeader=leaders[i]===name;
                  const ath=athletes.find(a=>a.name===name);
                  return(
                    <div key={name} draggable
                      onDragStart={()=>onDragStart(name,i)} onDragEnd={onDragEnd}
                      style={{display:"flex",alignItems:"center",gap:5,padding:"5px 4px 5px 6px",borderRadius:20,background:isLeader?color+"22":"#1e1e1e",border:"1px solid "+(isLeader?color+"88":"#2a2a2a"),cursor:"grab",userSelect:"none"}}>
                      <div style={{width:20,height:20,borderRadius:"50%",background:isLeader?color:"#333",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff",flexShrink:0,overflow:"hidden"}}>
                        {ath?.photo_url?<img src={ath.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:name[0]}
                      </div>
                      <span style={{fontSize:12,color:isLeader?color:"#ccc",fontWeight:isLeader?700:400}}>{name.split(" ")[0]}</span>
                      <button onClick={()=>removeFromGroup(name,i)} style={{background:"transparent",border:"none",cursor:"pointer",padding:"0 4px 0 2px",fontSize:13,color:"#333",lineHeight:1}}>×</button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick-add */}
            {unassigned.length>0&&(
              <div style={{marginTop:10,paddingTop:10,borderTop:"0.5px solid #1e1e1e"}}>
                <div style={{fontSize:10,color:"#444",marginBottom:6}}>Quick add:</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {unassigned.map(a=>(
                    <button key={a.id} onClick={()=>addToGroup(a.name,i)} style={{fontSize:10,padding:"3px 8px",borderRadius:10,border:"0.5px solid "+color+"44",background:"transparent",color:color+"99",cursor:"pointer",fontFamily:"Georgia,serif"}}>+ {a.name.split(" ")[0]}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
