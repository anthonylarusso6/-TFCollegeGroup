import { useState, useEffect } from "react";
import { BG, PUR, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
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

export default function Draft({athletes=[]}){
  const[groupCount,setGroupCount]=useState(4);
  const[groups,setGroups]=useState({0:[],1:[],2:[],3:[]});
  const[leaders,setLeaders]=useState({});
  const[bracelets,setBracelets]=useState({});
  const[activeGroup,setActiveGroup]=useState(0);
  const[search,setSearch]=useState("");
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);
  const[saveErr,setSaveErr]=useState("");
  const[view,setView]=useState("assign");// assign | teams | bracelets
  const[draftId,setDraftId]=useState(null);
  const[loading,setLoading]=useState(true);

  // Load existing draft on mount
  useEffect(()=>{
    loadDraft();
  },[]);

  const loadDraft=async()=>{
    setLoading(true);
    try{
      const{data,error}=await supabase.from("draft").select("*").order("created_at",{ascending:false}).limit(1);
      if(error)throw error;
      if(data&&data.length>0){
        const d=data[0];
        setDraftId(d.id);
        const gc=d.group_count||4;
        setGroupCount(gc);
        // Load groups
        const g={};
        (d.groups||[]).forEach((arr,i)=>{g[i]=arr||[];});
        // Fill missing groups
        for(let i=0;i<gc;i++){if(!g[i])g[i]=[];}
        setGroups(g);
        // Load leaders
        const l={};
        (d.leaders||[]).forEach((name,i)=>{if(name)l[i]=name;});
        setLeaders(l);
        // Load bracelets
        const b={};
        (d.bracelets||[]).forEach((br,i)=>{if(br)b[i]=br;});
        setBracelets(b);
      }else{
        // No draft yet - init empty groups
        const g={};
        for(let i=0;i<groupCount;i++)g[i]=[];
        setGroups(g);
      }
    }catch(e){
      console.error("Load draft error:",e);
      // Init empty on error
      const g={};
      for(let i=0;i<groupCount;i++)g[i]=[];
      setGroups(g);
    }
    setLoading(false);
  };

  // When groupCount changes, resize groups
  useEffect(()=>{
    setGroups(prev=>{
      const next={};
      for(let i=0;i<groupCount;i++)next[i]=prev[i]||[];
      return next;
    });
  },[groupCount]);

  const assigned=Object.values(groups).flat();
  const unassigned=athletes.filter(a=>!assigned.includes(a.name)&&(!search||a.name.toLowerCase().includes(search.toLowerCase())));

  const addToGroup=(name,idx)=>{
    setGroups(prev=>({...prev,[idx]:[...(prev[idx]||[]),name]}));
  };

  const removeFromGroup=(name,idx)=>{
    setGroups(prev=>({...prev,[idx]:(prev[idx]||[]).filter(n=>n!==name)}));
    // If was leader, clear
    if(leaders[idx]===name)setLeaders(prev=>{const n={...prev};delete n[idx];return n;});
  };

  const moveTo=(name,fromIdx,toIdx)=>{
    setGroups(prev=>{
      const n={...prev};
      n[fromIdx]=(n[fromIdx]||[]).filter(x=>x!==name);
      n[toIdx]=[...(n[toIdx]||[]),name];
      return n;
    });
  };

  const saveDraft=async()=>{
    setSaving(true);setSaveErr("");
    try{
      const groupsArr=Array.from({length:groupCount},(_,i)=>groups[i]||[]);
      const leadersArr=Array.from({length:groupCount},(_,i)=>leaders[i]||null);
      const braceletsArr=Array.from({length:groupCount},(_,i)=>bracelets[i]||null);
      const payload={groups:groupsArr,leaders:leadersArr,bracelets:braceletsArr,group_count:groupCount,phase:"locked",locked:true};

      let id=draftId;
      if(id){
        const{error}=await supabase.from("draft").update(payload).eq("id",id);
        if(error)throw error;
      }else{
        const{data,error}=await supabase.from("draft").insert(payload).select().single();
        if(error)throw error;
        id=data.id;setDraftId(id);
      }

      // Update athlete roles
      for(let i=0;i<groupCount;i++){
        for(const name of(groupsArr[i]||[])){
          const ath=athletes.find(a=>a.name===name);
          if(ath){
            await supabase.from("athletes").update({
              role:leadersArr[i]===name?"forge":"iron",
              group_idx:i,
            }).eq("id",ath.id).catch(()=>{});
          }
        }
      }
      setSaved(true);setTimeout(()=>setSaved(false),3000);
    }catch(e){
      console.error("Save error:",e);
      setSaveErr(e.message||"Save failed");
    }
    setSaving(false);
  };

  const resetDraft=async()=>{
    if(!window.confirm("Reset all groups?"))return;
    setGroups(Object.fromEntries(Array.from({length:groupCount},(_,i)=>[i,[]])));
    setLeaders({});setBracelets({});
    if(draftId){
      await supabase.from("draft").update({groups:Array(groupCount).fill([]),leaders:Array(groupCount).fill(null),bracelets:Array(groupCount).fill(null),phase:"setup",locked:false}).eq("id",draftId).catch(()=>{});
    }
    await supabase.from("athletes").update({role:"iron",group_idx:null}).eq("status","active").catch(()=>{});
  };

  if(loading)return<div style={{textAlign:"center",padding:"3rem",color:"#888",fontSize:13}}>Loading teams...</div>;

  return(
    <div>
      {/* Header */}
      <div style={{background:BG,borderRadius:12,padding:"12px 14px",marginBottom:12,border:"1px solid #222"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>🎯 Teams & Draft</div>
            <div style={{fontSize:11,color:"#555",marginTop:1}}>{assigned.length} assigned · {athletes.length-assigned.length} unassigned</div>
          </div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={resetDraft} style={{padding:"6px 10px",borderRadius:8,border:"0.5px solid #444",background:"transparent",color:"#666",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>Reset</button>
            <button onClick={saveDraft} disabled={saving} style={{padding:"6px 14px",borderRadius:8,border:"none",background:saved?GREEN:GOLD,color:"#1a1a1a",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif"}}>
              {saved?"✓ Saved!":saving?"Saving...":"Save Teams"}
            </button>
          </div>
        </div>
        {/* Group count */}
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{fontSize:11,color:"#555"}}>Groups:</div>
          {[2,3,4,5,6].map(n=>(
            <button key={n} onClick={()=>setGroupCount(n)} style={{width:28,height:28,borderRadius:6,border:"1px solid "+(groupCount===n?ORANGE:"#333"),background:groupCount===n?ORANGE:"transparent",color:groupCount===n?"#fff":"#555",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif"}}>{n}</button>
          ))}
        </div>
      </div>

      {saveErr&&<div style={{background:"#FFF0F0",borderRadius:8,padding:"8px 12px",marginBottom:10,fontSize:12,color:RED,border:"1px solid "+RED+"33"}}>{saveErr}</div>}

      {/* View tabs */}
      <div style={{display:"flex",gap:6,marginBottom:12}}>
        {[{id:"assign",label:"➕ Assign"},{id:"teams",label:"👥 Teams"},{id:"bracelets",label:"📿 Bracelets"}].map(t=>(
          <button key={t.id} onClick={()=>setView(t.id)} style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid "+(view===t.id?ORANGE:"#e0e0e0"),background:view===t.id?ORANGE:"#fff",color:view===t.id?"#fff":"#888",fontSize:11,fontWeight:view===t.id?700:400,cursor:"pointer",fontFamily:"Georgia,serif"}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ASSIGN VIEW */}
      {view==="assign"&&(
        <div>
          {/* Group tabs */}
          <div style={{display:"flex",gap:6,marginBottom:10,overflowX:"auto",paddingBottom:2}}>
            {Array.from({length:groupCount},(_,i)=>(
              <button key={i} onClick={()=>setActiveGroup(i)} style={{flexShrink:0,padding:"7px 14px",borderRadius:10,border:"2px solid "+(activeGroup===i?COLORS[i]:"#e0e0e0"),background:activeGroup===i?COLORS[i]+"22":"#fff",color:activeGroup===i?COLORS[i]:"#888",fontSize:12,fontWeight:activeGroup===i?700:400,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                Group {i+1} <span style={{opacity:0.7}}>({(groups[i]||[]).length})</span>
              </button>
            ))}
          </div>

          {/* Active group */}
          <div style={{background:"#fff",borderRadius:12,padding:"14px",marginBottom:10,border:"2px solid "+COLORS[activeGroup]}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <div style={{fontSize:13,fontWeight:700,color:COLORS[activeGroup]}}>Group {activeGroup+1}</div>
            </div>
            {/* Leader */}
            <div style={{marginBottom:10}}>
              <div style={{fontSize:10,color:"#aaa",marginBottom:4}}>FORGE LEADER</div>
              <select value={leaders[activeGroup]||""} onChange={e=>setLeaders(prev=>({...prev,[activeGroup]:e.target.value}))}
                style={{width:"100%",padding:"8px",borderRadius:8,border:"1px solid "+COLORS[activeGroup]+"55",fontSize:13,fontFamily:"Georgia,serif",background:"#fafafa"}}>
                <option value="">— Select leader —</option>
                {(groups[activeGroup]||[]).map(n=><option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            {/* Members */}
            {(groups[activeGroup]||[]).length===0?(
              <div style={{textAlign:"center",padding:"12px",color:"#ccc",fontSize:12,background:"#fafafa",borderRadius:8,border:"1px dashed #e0e0e0"}}>
                Tap names below to add
              </div>
            ):(
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {(groups[activeGroup]||[]).map(name=>(
                  <div key={name} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:20,background:leaders[activeGroup]===name?COLORS[activeGroup]:COLORS[activeGroup]+"22",border:"1px solid "+COLORS[activeGroup]+"44"}}>
                    {leaders[activeGroup]===name&&<span style={{fontSize:9}}>⚒</span>}
                    <span style={{fontSize:12,color:leaders[activeGroup]===name?"#fff":COLORS[activeGroup],fontWeight:500}}>{name}</span>
                    <button onClick={()=>removeFromGroup(name,activeGroup)} style={{background:"transparent",border:"none",color:leaders[activeGroup]===name?"rgba(255,255,255,0.6)":COLORS[activeGroup]+"88",cursor:"pointer",fontSize:14,padding:0,lineHeight:1}}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unassigned */}
          <div style={{background:"#fff",borderRadius:12,padding:"14px",border:"0.5px solid #e0e0e0"}}>
            <div style={{fontSize:12,fontWeight:600,color:"#1a1a1a",marginBottom:8}}>Available ({unassigned.length})</div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{width:"100%",padding:"8px",borderRadius:8,border:"0.5px solid #e0e0e0",fontSize:12,fontFamily:"Georgia,serif",marginBottom:8,boxSizing:"border-box",background:"#fafafa"}}/>
            {unassigned.length===0?(
              <div style={{textAlign:"center",padding:"1rem",color:"#aaa",fontSize:12}}>All athletes assigned ✅</div>
            ):(
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {unassigned.map(a=>(
                  <button key={a.id} onClick={()=>addToGroup(a.name,activeGroup)} style={{padding:"6px 12px",borderRadius:20,border:"1px solid "+COLORS[activeGroup]+"55",background:COLORS[activeGroup]+"11",color:COLORS[activeGroup],fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:500}}>
                    + {a.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TEAMS VIEW */}
      {view==="teams"&&(
        <div>
          {Array.from({length:groupCount},(_,i)=>(
            <div key={i} style={{background:"#fff",borderRadius:12,padding:"14px",marginBottom:10,border:"2px solid "+COLORS[i]}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontSize:13,fontWeight:700,color:COLORS[i]}}>Group {i+1}</div>
                <div style={{fontSize:11,color:"#aaa"}}>{(groups[i]||[]).length} athletes</div>
              </div>
              {/* Leader badge */}
              {leaders[i]&&(
                <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 10px",background:COLORS[i]+"22",borderRadius:20,border:"1px solid "+COLORS[i]+"44",marginBottom:8}}>
                  <span style={{fontSize:11}}>⚒</span>
                  <span style={{fontSize:12,fontWeight:700,color:COLORS[i]}}>{leaders[i]} — Forge</span>
                </div>
              )}
              {/* Members with move options */}
              {(groups[i]||[]).map(name=>(
                <div key={name} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"0.5px solid #f5f5f5"}}>
                  <div style={{flex:1,fontSize:13,color:"#1a1a1a",fontWeight:leaders[i]===name?600:400}}>{name}{leaders[i]===name?" ⚒":""}</div>
                  {/* Move to another group */}
                  <div style={{display:"flex",gap:4}}>
                    {Array.from({length:groupCount},(_,j)=>j!==i&&(
                      <button key={j} onClick={()=>moveTo(name,i,j)} style={{fontSize:10,padding:"3px 8px",borderRadius:6,border:"1px solid "+COLORS[j]+"55",background:COLORS[j]+"11",color:COLORS[j],cursor:"pointer",fontFamily:"Georgia,serif"}}>
                        →G{j+1}
                      </button>
                    ))}
                    <button onClick={()=>removeFromGroup(name,i)} style={{fontSize:10,padding:"3px 8px",borderRadius:6,border:"0.5px solid #ddd",background:"transparent",color:"#ccc",cursor:"pointer",fontFamily:"Georgia,serif"}}>✕</button>
                  </div>
                </div>
              ))}
              {(groups[i]||[]).length===0&&<div style={{fontSize:12,color:"#ccc",textAlign:"center",padding:"8px"}}>Empty</div>}
            </div>
          ))}
        </div>
      )}

      {/* BRACELETS VIEW */}
      {view==="bracelets"&&(
        <div>
          {Array.from({length:groupCount},(_,i)=>(
            <div key={i} style={{background:"#fff",borderRadius:12,padding:"14px",marginBottom:10,border:"2px solid "+COLORS[i]}}>
              <div style={{fontSize:12,fontWeight:700,color:COLORS[i],marginBottom:8}}>Group {i+1} — {leaders[i]||"No leader"}</div>
              <select value={bracelets[i]||""} onChange={e=>setBracelets(prev=>({...prev,[i]:e.target.value}))}
                style={{width:"100%",padding:"8px",borderRadius:8,border:"1px solid "+COLORS[i]+"44",fontSize:12,fontFamily:"Georgia,serif",background:"#fafafa",marginBottom:8}}>
                <option value="">— Pick a bracelet —</option>
                {BRACELETS.map(b=><option key={b.ref} value={b.ref}>{b.color} — {b.ref}</option>)}
              </select>
              {bracelets[i]&&(()=>{
                const b=BRACELETS.find(x=>x.ref===bracelets[i]);
                return b&&<div style={{padding:"8px 10px",background:b.hex+"22",borderRadius:8,border:"1px solid "+b.hex+"44"}}>
                  <div style={{fontSize:11,fontWeight:600,color:b.hex}}>{b.ref}</div>
                  <div style={{fontSize:11,color:"#666",fontStyle:"italic",marginTop:2}}>"{b.text}"</div>
                </div>;
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
