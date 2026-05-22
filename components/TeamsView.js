import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const GC=["#534AB7","#C0392B","#1E6B3A","#D4AF37","#E8720C","#1A4F8A"];
const getTier=(i,n)=>i<2?1:i===2?2:3;
const TIER_LABEL={1:"Tier 1",2:"Tier 2",3:"Tier 3"};

export default function TeamsView({athletes=[]}){
  const[groups,setGroups]=useState({});
  const[leaders,setLeaders]=useState({});
  const[groupCount,setGroupCount]=useState(4);
  const[draftId,setDraftId]=useState(null);
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);
  const[error,setError]=useState("");
  const[dragging,setDragging]=useState(null);   // {name, fromGroup: idx|null}
  const[dragOver,setDragOver]=useState(null);   // group idx | "pool"
  const[picker,setPicker]=useState(null);        // athlete name waiting for group pick

  useEffect(()=>{loadTeams();},[]);

  const loadTeams=async()=>{
    setLoading(true);
    try{
      const{data}=await supabase.from("draft").select("*").order("created_at",{ascending:false}).limit(1);
      if(data&&data.length>0){
        const d=data[0];
        setDraftId(d.id);
        const gc=d.group_count||4;
        setGroupCount(gc);
        const g={};
        (d.groups||[]).forEach((arr,i)=>{g[i]=arr||[];});
        for(let i=0;i<gc;i++){if(!g[i])g[i]=[];}
        setGroups(g);
        const l={};
        (d.leaders||[]).forEach((name,i)=>{if(name)l[i]=name;});
        setLeaders(l);
      }else{
        const g={};for(let i=0;i<4;i++)g[i]=[];
        setGroups(g);
      }
    }catch(e){
      console.error("Teams load:",e);
      setError(e.message||"Failed to load teams");
      const g={};for(let i=0;i<4;i++)g[i]=[];
      setGroups(g);
    }
    setLoading(false);
  };

  const addToGroup=(name,toIdx)=>{
    setGroups(prev=>{
      const n={...prev};
      // remove from wherever they are
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

  const toggleLeader=(name,idx)=>{
    setLeaders(prev=>({...prev,[idx]:prev[idx]===name?null:name}));
  };

  // Drag handlers
  const onDragStart=(name,fromGroup)=>setDragging({name,fromGroup});
  const onDragEnd=()=>{setDragging(null);setDragOver(null);};
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

  const saveChanges=async()=>{
    setSaving(true);
    try{
      const groupsArr=Array.from({length:groupCount},(_,i)=>groups[i]||[]);
      const leadersArr=Array.from({length:groupCount},(_,i)=>leaders[i]||null);
      const payload={groups:groupsArr,leaders:leadersArr,group_count:groupCount};
      if(draftId){
        const{error:err}=await supabase.from("draft").update(payload).eq("id",draftId);
        if(err)throw err;
      }
      for(let i=0;i<groupCount;i++){
        for(const name of(groupsArr[i]||[])){
          const ath=athletes.find(a=>a.name===name);
          if(ath)await supabase.from("athletes").update({role:leadersArr[i]===name?"forge":"iron",group_idx:i}).eq("id",ath.id);
        }
      }
      setSaved(true);setTimeout(()=>setSaved(false),3000);
    }catch(e){console.error("Save error:",e);}
    setSaving(false);
  };

  if(loading)return<div style={{textAlign:"center",padding:"3rem",color:"#555",fontSize:13}}>Loading teams...</div>;
  if(error)return<div style={{background:"#1a0808",borderRadius:10,padding:"14px",color:"#C0392B",fontSize:13,border:"0.5px solid #C0392B44"}}>{error}</div>;

  const allAssigned=Object.values(groups).flat();
  const active=athletes.filter(a=>a.status==="active");
  const unassigned=active.filter(a=>!allAssigned.includes(a.name));

  return(
    <div>
      {/* Group-picker modal (tap-to-assign) */}
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

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div>
          <div style={{fontSize:13,fontWeight:600,color:"#ddd"}}>{allAssigned.length}/{active.length} assigned</div>
          {unassigned.length>0&&<div style={{fontSize:11,color:"#555"}}>{unassigned.length} not yet placed</div>}
        </div>
        <button onClick={saveChanges} disabled={saving} style={{padding:"10px 20px",borderRadius:10,border:"none",background:saved?"#1E6B3A":saving?"#222":"linear-gradient(135deg,#E8720C,#C0392B)",color:"#fff",fontSize:12,fontWeight:700,cursor:saving?"not-allowed":"pointer",fontFamily:"Georgia,serif",boxShadow:(saved||saving)?"none":"0 4px 16px #E8720C44",transition:"all 0.2s"}}>
          {saved?"✓ Saved!":saving?"Saving...":"Save Teams"}
        </button>
      </div>

      {/* Unassigned pool — drag source + tap to assign */}
      {unassigned.length>0&&(
        <div
          onDragOver={e=>{e.preventDefault();setDragOver("pool");}}
          onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setDragOver(null);}}
          onDrop={onDropPool}
          style={{background:dragOver==="pool"?"#1a1a2a":"#111",borderRadius:14,padding:"14px",marginBottom:12,border:"1px dashed "+(dragOver==="pool"?"#534AB7":"#252525"),transition:"all 0.15s"}}>
          <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Unassigned — tap to place · drag to group</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {unassigned.map(a=>(
              <div key={a.id}
                draggable
                onDragStart={()=>onDragStart(a.name,null)}
                onDragEnd={onDragEnd}
                onClick={()=>setPicker(a.name)}
                style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px 6px 6px",borderRadius:20,border:"0.5px solid #2a2a2a",background:"#1e1e1e",cursor:"grab",userSelect:"none",transition:"border-color 0.1s"}}>
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
              {leaders[i]&&<span style={{fontSize:10,color:color+"bb"}}>⚒ {leaders[i].split(" ")[0]}</span>}
              <div style={{marginLeft:"auto",fontSize:11,color:"#444"}}>{members.length}</div>
            </div>

            {/* Empty drop zone */}
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
                    <div key={name}
                      draggable
                      onDragStart={()=>onDragStart(name,i)}
                      onDragEnd={onDragEnd}
                      style={{display:"flex",alignItems:"center",gap:5,padding:"5px 4px 5px 6px",borderRadius:20,background:isLeader?color+"22":"#1e1e1e",border:"1px solid "+(isLeader?color+"88":"#2a2a2a"),cursor:"grab",userSelect:"none"}}>
                      <div style={{width:20,height:20,borderRadius:"50%",background:isLeader?color:"#333",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff",flexShrink:0,overflow:"hidden"}}>
                        {ath?.photo_url?<img src={ath.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:name[0]}
                      </div>
                      <span style={{fontSize:12,color:isLeader?color:"#ccc",fontWeight:isLeader?700:400}}>{name.split(" ")[0]}</span>
                      {/* Leader toggle */}
                      <button onClick={()=>toggleLeader(name,i)} title={isLeader?"Remove as leader":"Set as leader"} style={{background:"transparent",border:"none",cursor:"pointer",padding:"0 2px",fontSize:11,color:isLeader?color:"#333",lineHeight:1,transition:"color 0.1s"}}>⚒</button>
                      {/* Remove */}
                      <button onClick={()=>removeFromGroup(name,i)} style={{background:"transparent",border:"none",cursor:"pointer",padding:"0 4px 0 0",fontSize:13,color:"#333",lineHeight:1}}>×</button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick-add unassigned */}
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
