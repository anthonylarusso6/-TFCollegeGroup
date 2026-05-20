import { useState, useEffect } from "react";
import { RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { supabase } from "../lib/supabase";

const COLORS=["#534AB7","#C0392B","#1E6B3A","#D4AF37","#E8720C","#1A4F8A"];
const getTier=(groupIdx,numGroups)=>{
  if(numGroups<=2)return groupIdx===0?1:2;
  if(numGroups===3)return groupIdx<2?1:2;
  if(numGroups===4)return groupIdx<2?1:groupIdx===2?2:3;
  if(numGroups===5)return groupIdx<2?1:groupIdx<4?2:3;
  return groupIdx<2?1:groupIdx<4?2:3;
};
const TIER_LABELS={1:"Tier 1",2:"Tier 2",3:"Tier 3"};

export default function TeamsView({athletes=[]}){
  const[groups,setGroups]=useState({});
  const[leaders,setLeaders]=useState({});
  const[groupCount,setGroupCount]=useState(4);
  const[draftId,setDraftId]=useState(null);
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);
  const[error,setError]=useState("");

  useEffect(()=>{loadTeams();},[]);

  const loadTeams=async()=>{
    setLoading(true);
    try{
      const{data,error:err}=await supabase.from("draft").select("*").order("created_at",{ascending:false}).limit(1);
      if(err)throw err;
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
        // No draft yet
        const g={};for(let i=0;i<4;i++)g[i]=[];
        setGroups(g);
      }
    }catch(e){
      console.error("Teams load error:",e);
      setError(e.message||"Failed to load teams");
      const g={};for(let i=0;i<4;i++)g[i]=[];
      setGroups(g);
    }
    setLoading(false);
  };

  const moveTo=(name,fromIdx,toIdx)=>{
    setGroups(prev=>{
      const n={...prev};
      n[fromIdx]=(n[fromIdx]||[]).filter(x=>x!==name);
      n[toIdx]=[...(n[toIdx]||[]),name];
      return n;
    });
  };

  const removeFromGroup=(name,idx)=>{
    setGroups(prev=>({...prev,[idx]:(prev[idx]||[]).filter(n=>n!==name)}));
    if(leaders[idx]===name)setLeaders(prev=>{const n={...prev};delete n[idx];return n;});
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
          if(ath){
            await supabase.from("athletes").update({
              role:leadersArr[i]===name?"forge":"iron",
              group_idx:i,
            }).eq("id",ath.id);
          }
        }
      }
      setSaved(true);setTimeout(()=>setSaved(false),3000);
    }catch(e){
      console.error("Save error:",e);
    }
    setSaving(false);
  };

  if(loading)return<div style={{textAlign:"center",padding:"3rem",color:"#888",fontSize:13}}>Loading teams...</div>;
  if(error)return<div style={{background:"#FFF0F0",borderRadius:10,padding:"14px",color:"#C0392B",fontSize:13}}>{error}</div>;

  const allAssigned=Object.values(groups).flat();
  const unassigned=athletes.filter(a=>!allAssigned.includes(a.name));

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a"}}>{allAssigned.length} assigned · {unassigned.length} unassigned</div>
        <button onClick={saveChanges} disabled={saving} style={{padding:"8px 16px",borderRadius:8,border:"none",background:saved?GREEN:GOLD,color:"#1a1a1a",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif"}}>
          {saved?"✓ Saved!":saving?"Saving...":"Save Changes"}
        </button>
      </div>

      {Array.from({length:groupCount},(_,i)=>(
        <div key={i} style={{background:"#fff",borderRadius:12,padding:"14px",marginBottom:10,border:"2px solid "+COLORS[i]}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontSize:13,fontWeight:700,color:COLORS[i]}}>Group {i+1} <span style={{fontSize:10,fontWeight:400,color:"#aaa"}}>· {TIER_LABELS[getTier(i,groupCount)]}</span></div>
            <div style={{fontSize:11,color:"#aaa"}}>{(groups[i]||[]).length} athletes</div>
          </div>
          <div style={{marginBottom:10}}>
            <select value={leaders[i]||""} onChange={e=>setLeaders(prev=>({...prev,[i]:e.target.value}))}
              style={{width:"100%",padding:"7px",borderRadius:8,border:"1px solid "+COLORS[i]+"44",fontSize:12,fontFamily:"Georgia,serif",background:"#fafafa"}}>
              <option value="">— Select Forge leader —</option>
              {(groups[i]||[]).map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          {(groups[i]||[]).length===0?(
            <div style={{fontSize:12,color:"#ccc",textAlign:"center",padding:"8px",background:"#fafafa",borderRadius:8}}>Empty</div>
          ):(
            (groups[i]||[]).map(name=>(
              <div key={name} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"0.5px solid #f5f5f5"}}>
                <div style={{flex:1,fontSize:13,color:"#1a1a1a",fontWeight:leaders[i]===name?700:400}}>
                  {leaders[i]===name&&<span style={{marginRight:4}}>⚒</span>}{name}
                </div>
                <div style={{display:"flex",gap:4}}>
                  {Array.from({length:groupCount},(_,j)=>j!==i&&(
                    <button key={j} onClick={()=>moveTo(name,i,j)} style={{fontSize:10,padding:"3px 7px",borderRadius:6,border:"1px solid "+COLORS[j]+"55",background:COLORS[j]+"11",color:COLORS[j],cursor:"pointer",fontFamily:"Georgia,serif"}}>→G{j+1}</button>
                  ))}
                  <button onClick={()=>removeFromGroup(name,i)} style={{fontSize:10,padding:"3px 7px",borderRadius:6,border:"0.5px solid #ddd",background:"transparent",color:"#ccc",cursor:"pointer",fontFamily:"Georgia,serif"}}>✕</button>
                </div>
              </div>
            ))
          )}
        </div>
      ))}

      {unassigned.length>0&&(
        <div style={{background:"#fff",borderRadius:12,padding:"14px",border:"0.5px solid #e0e0e0"}}>
          <div style={{fontSize:12,fontWeight:600,color:"#888",marginBottom:8}}>Not assigned ({unassigned.length})</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {unassigned.map(a=>(
              <span key={a.id} style={{fontSize:11,padding:"4px 10px",borderRadius:12,background:"#f5f5f5",color:"#888",border:"0.5px solid #e0e0e0"}}>{a.name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
