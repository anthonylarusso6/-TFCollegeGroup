import { useState, useEffect, useRef } from "react";
import { BG, PUR, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { supabase } from "../lib/supabase";

const GROUP_COLORS=["#534AB7","#C0392B","#1E6B3A","#D4AF37","#E8720C","#1A4F8A"];
const GROUP_NAMES=["Group 1","Group 2","Group 3","Group 4","Group 5","Group 6"];

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

export default function Draft({athletes}){
  const[groups,setGroups]=useState({});// {groupIdx: [athleteName,...]}
  const[leaders,setLeaders]=useState({});// {groupIdx: athleteName}
  const[bracelets,setBracelets]=useState({});// {groupIdx: braceletRef}
  const[groupCount,setGroupCount]=useState(4);
  const[saved,setSaved]=useState(false);
  const[saving,setSaving]=useState(false);
  const[locked,setLocked]=useState(false);
  const[search,setSearch]=useState("");
  const[activeGroup,setActiveGroup]=useState(0);
  const[tab,setTab]=useState("groups");// groups | bracelets | preview
  const[existingDraft,setExistingDraft]=useState(null);
  const[loading,setLoading]=useState(true);

  useEffect(()=>{
    loadDraft();
  },[]);

  const loadDraft=async()=>{
    const{data}=await supabase.from("draft").select("*").order("created_at",{ascending:false}).limit(1).catch(()=>({data:null}));
    if(data&&data[0]){
      setExistingDraft(data[0]);
      if(data[0].groups){
        // Convert array format to object
        const g={};
        (data[0].groups||[]).forEach((arr,i)=>{g[i]=arr||[];});
        setGroups(g);
      }
      if(data[0].leaders){
        const l={};
        (data[0].leaders||[]).forEach((name,i)=>{if(name)l[i]=name;});
        setLeaders(l);
      }
      if(data[0].bracelets){
        const b={};
        (data[0].bracelets||[]).forEach((br,i)=>{if(br)b[i]=br;});
        setBracelets(b);
      }
      if(data[0].group_count)setGroupCount(data[0].group_count);
      if(data[0].phase==="locked")setLocked(true);
    }
    setLoading(false);
  };

  // All athletes not yet assigned to any group
  const assigned=Object.values(groups).flat();
  const unassigned=athletes.filter(a=>!assigned.includes(a.name)&&(!search||a.name.toLowerCase().includes(search.toLowerCase())));
  const totalAssigned=assigned.length;

  const addToGroup=(athleteName,groupIdx)=>{
    setGroups(prev=>({
      ...prev,
      [groupIdx]:[...(prev[groupIdx]||[]),athleteName]
    }));
  };

  const removeFromGroup=(athleteName,groupIdx)=>{
    setGroups(prev=>({
      ...prev,
      [groupIdx]:(prev[groupIdx]||[]).filter(n=>n!==athleteName)
    }));
  };

  const moveToGroup=(athleteName,fromIdx,toIdx)=>{
    setGroups(prev=>{
      const next={...prev};
      next[fromIdx]=(next[fromIdx]||[]).filter(n=>n!==athleteName);
      next[toIdx]=[...(next[toIdx]||[]),athleteName];
      return next;
    });
  };

  const setLeader=(groupIdx,name)=>{
    setLeaders(prev=>({...prev,[groupIdx]:name}));
    // Auto-set role to forge for this athlete
  };

  const saveDraft=async(lock=false)=>{
    setSaving(true);
    // Convert object format to array for storage
    const groupsArr=Array.from({length:groupCount},(_,i)=>groups[i]||[]);
    const leadersArr=Array.from({length:groupCount},(_,i)=>leaders[i]||null);
    const braceletsArr=Array.from({length:groupCount},(_,i)=>bracelets[i]||null);

    const payload={
      groups:groupsArr,
      leaders:leadersArr,
      bracelets:braceletsArr,
      group_count:groupCount,
      phase:lock?"locked":"draft",
      locked:lock,
      updated_at:new Date().toISOString(),
    };

    try{
      if(existingDraft){
        await supabase.from("draft").update(payload).eq("id",existingDraft.id);
      }else{
        const{data}=await supabase.from("draft").insert(payload).select().single();
        setExistingDraft(data);
      }

      // Update athlete roles and group_idx
      for(let i=0;i<groupCount;i++){
        const groupAthletes=groupsArr[i]||[];
        for(const name of groupAthletes){
          const ath=athletes.find(a=>a.name===name);
          if(ath){
            const isLeader=leadersArr[i]===name;
            await supabase.from("athletes").update({
              role:isLeader?"forge":"iron",
              group_idx:i,
            }).eq("id",ath.id).catch(()=>{});
          }
        }
      }

      if(lock)setLocked(true);
      setSaved(true);setTimeout(()=>setSaved(false),3000);
    }catch(e){console.error("Draft save error:",e);}
    setSaving(false);
  };

  const resetDraft=async()=>{
    if(!window.confirm("Reset draft? This clears all groups."))return;
    setGroups({});setLeaders({});setBracelets({});setLocked(false);
    // Reset all athlete roles
    await supabase.from("athletes").update({role:"iron",group_idx:null}).eq("status","active").catch(()=>{});
    if(existingDraft){
      await supabase.from("draft").update({groups:[],leaders:[],bracelets:[],phase:"setup",locked:false}).eq("id",existingDraft.id).catch(()=>{});
    }
  };

  if(loading)return<div style={{textAlign:"center",padding:"2rem",color:"#888"}}>Loading...</div>;

  return(
    <div>
      {/* Header */}
      <div style={{background:BG,borderRadius:12,padding:"14px 16px",marginBottom:12,border:"1px solid #222"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>🎯 Draft Board</div>
            <div style={{fontSize:11,color:"#555",marginTop:2}}>{totalAssigned} assigned · {athletes.length-totalAssigned} remaining</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={resetDraft} style={{padding:"6px 12px",borderRadius:8,border:"0.5px solid #555",background:"transparent",color:"#888",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>Reset</button>
            <button onClick={()=>saveDraft(false)} disabled={saving} style={{padding:"6px 12px",borderRadius:8,border:"0.5px solid "+ORANGE,background:"transparent",color:ORANGE,fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>
              {saving?"...":"Save"}
            </button>
            <button onClick={()=>saveDraft(true)} disabled={saving||locked} style={{padding:"6px 12px",borderRadius:8,border:"none",background:locked?GREEN:GOLD,color:"#1a1a1a",fontSize:12,fontWeight:700,cursor:locked?"default":"pointer",fontFamily:"Georgia,serif"}}>
              {locked?"✓ Locked":"Lock Draft"}
            </button>
          </div>
        </div>

        {/* Group count */}
        {!locked&&(
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{fontSize:11,color:"#555"}}>Groups:</div>
            {[2,3,4,5,6].map(n=>(
              <button key={n} onClick={()=>setGroupCount(n)} style={{width:28,height:28,borderRadius:6,border:"1px solid "+(groupCount===n?ORANGE:"#333"),background:groupCount===n?ORANGE:"transparent",color:groupCount===n?"#fff":"#666",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                {n}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:6,marginBottom:12}}>
        {[{id:"groups",label:"👥 Groups"},{id:"bracelets",label:"📿 Bracelets"},{id:"preview",label:"👁 Preview"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid "+(tab===t.id?ORANGE:"#e0e0e0"),background:tab===t.id?ORANGE:"#fff",color:tab===t.id?"#fff":"#888",fontSize:11,fontWeight:tab===t.id?700:400,cursor:"pointer",fontFamily:"Georgia,serif"}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* GROUPS TAB */}
      {tab==="groups"&&(
        <div>
          {/* Group selector */}
          <div style={{display:"flex",gap:6,marginBottom:10,overflowX:"auto"}}>
            {Array.from({length:groupCount},(_,i)=>(
              <button key={i} onClick={()=>setActiveGroup(i)} style={{flexShrink:0,padding:"8px 14px",borderRadius:10,border:"2px solid "+(activeGroup===i?GROUP_COLORS[i]:"#e0e0e0"),background:activeGroup===i?GROUP_COLORS[i]+"22":"#fff",color:activeGroup===i?GROUP_COLORS[i]:"#888",fontSize:12,fontWeight:activeGroup===i?700:400,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                {GROUP_NAMES[i]} ({(groups[i]||[]).length})
              </button>
            ))}
          </div>

          {/* Active group */}
          <div style={{background:"#fff",borderRadius:12,padding:"14px",marginBottom:12,border:"2px solid "+GROUP_COLORS[activeGroup]}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontSize:13,fontWeight:700,color:GROUP_COLORS[activeGroup]}}>{GROUP_NAMES[activeGroup]}</div>
              <div style={{fontSize:11,color:"#aaa"}}>{(groups[activeGroup]||[]).length} athletes</div>
            </div>

            {/* Leader selector */}
            <div style={{marginBottom:10}}>
              <div style={{fontSize:10,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Leader (Forge)</div>
              <select value={leaders[activeGroup]||""} onChange={e=>setLeader(activeGroup,e.target.value)}
                style={{width:"100%",padding:"8px",borderRadius:8,border:"1px solid "+GROUP_COLORS[activeGroup]+"44",fontSize:13,fontFamily:"Georgia,serif",color:"#1a1a1a",background:"#fafafa"}}>
                <option value="">— Select leader —</option>
                {(groups[activeGroup]||[]).map(name=><option key={name} value={name}>{name}</option>)}
              </select>
            </div>

            {/* Athletes in this group */}
            {(groups[activeGroup]||[]).length===0?(
              <div style={{textAlign:"center",padding:"1rem",color:"#ccc",fontSize:12,background:"#fafafa",borderRadius:8,border:"1px dashed #e0e0e0"}}>
                Tap athletes below to add them here
              </div>
            ):(
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {(groups[activeGroup]||[]).map(name=>(
                  <div key={name} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",borderRadius:20,background:leaders[activeGroup]===name?GROUP_COLORS[activeGroup]:GROUP_COLORS[activeGroup]+"22",border:"1px solid "+GROUP_COLORS[activeGroup]+"44"}}>
                    {leaders[activeGroup]===name&&<span style={{fontSize:10}}>⚒</span>}
                    <span style={{fontSize:12,fontWeight:500,color:leaders[activeGroup]===name?"#fff":GROUP_COLORS[activeGroup]}}>{name}</span>
                    {!locked&&<button onClick={()=>removeFromGroup(name,activeGroup)} style={{background:"transparent",border:"none",color:leaders[activeGroup]===name?"rgba(255,255,255,0.7)":GROUP_COLORS[activeGroup]+"88",cursor:"pointer",fontSize:14,lineHeight:1,padding:0}}>×</button>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unassigned athletes */}
          {!locked&&(
            <div style={{background:"#fff",borderRadius:12,padding:"14px",border:"0.5px solid #e0e0e0"}}>
              <div style={{fontSize:12,fontWeight:600,color:"#1a1a1a",marginBottom:8}}>
                Available athletes ({unassigned.length})
              </div>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"0.5px solid #e0e0e0",fontSize:12,fontFamily:"Georgia,serif",marginBottom:8,boxSizing:"border-box",background:"#fafafa"}}/>
              {unassigned.length===0?(
                <div style={{textAlign:"center",padding:"1rem",color:"#aaa",fontSize:12}}>All athletes assigned! ✅</div>
              ):(
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {unassigned.map(a=>(
                    <button key={a.id} onClick={()=>addToGroup(a.name,activeGroup)} style={{padding:"6px 12px",borderRadius:20,border:"1px solid "+GROUP_COLORS[activeGroup]+"44",background:GROUP_COLORS[activeGroup]+"11",color:GROUP_COLORS[activeGroup],fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:500}}>
                      + {a.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* BRACELETS TAB */}
      {tab==="bracelets"&&(
        <div>
          {Array.from({length:groupCount},(_,i)=>(
            <div key={i} style={{background:"#fff",borderRadius:12,padding:"14px",marginBottom:10,border:"2px solid "+GROUP_COLORS[i]}}>
              <div style={{fontSize:12,fontWeight:700,color:GROUP_COLORS[i],marginBottom:8}}>{GROUP_NAMES[i]} — {leaders[i]||"No leader"}</div>
              <select value={bracelets[i]||""} onChange={e=>setBracelets(prev=>({...prev,[i]:e.target.value}))}
                style={{width:"100%",padding:"8px",borderRadius:8,border:"1px solid "+GROUP_COLORS[i]+"44",fontSize:12,fontFamily:"Georgia,serif",color:"#1a1a1a",background:"#fafafa"}}>
                <option value="">— Pick a bracelet —</option>
                {BRACELETS.map(b=>(
                  <option key={b.ref} value={b.ref}>{b.color} — {b.ref}</option>
                ))}
              </select>
              {bracelets[i]&&(()=>{
                const b=BRACELETS.find(x=>x.ref===bracelets[i]);
                return b?(
                  <div style={{marginTop:8,padding:"8px 10px",background:b.hex+"22",borderRadius:8,border:"1px solid "+b.hex+"44"}}>
                    <div style={{fontSize:11,fontWeight:600,color:b.hex}}>{b.ref}</div>
                    <div style={{fontSize:11,color:"#666",fontStyle:"italic",marginTop:2}}>"{b.text}"</div>
                  </div>
                ):null;
              })()}
            </div>
          ))}
        </div>
      )}

      {/* PREVIEW TAB */}
      {tab==="preview"&&(
        <div>
          {Array.from({length:groupCount},(_,i)=>(
            <div key={i} style={{background:"#fff",borderRadius:12,padding:"14px",marginBottom:10,border:"2px solid "+GROUP_COLORS[i]}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontSize:13,fontWeight:700,color:GROUP_COLORS[i]}}>{GROUP_NAMES[i]}</div>
                <div style={{fontSize:11,color:"#aaa"}}>{(groups[i]||[]).length} athletes</div>
              </div>
              {leaders[i]&&(
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8,padding:"6px 10px",background:GROUP_COLORS[i]+"22",borderRadius:8}}>
                  <span style={{fontSize:12}}>⚒</span>
                  <span style={{fontSize:12,fontWeight:700,color:GROUP_COLORS[i]}}>{leaders[i]} — The Forge</span>
                </div>
              )}
              {bracelets[i]&&(()=>{
                const b=BRACELETS.find(x=>x.ref===bracelets[i]);
                return b?(
                  <div style={{fontSize:11,color:"#888",fontStyle:"italic",marginBottom:8}}>📿 {b.color} — {b.ref}</div>
                ):null;
              })()}
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {(groups[i]||[]).map(name=>(
                  <span key={name} style={{fontSize:11,padding:"3px 8px",borderRadius:12,background:"#f5f5f5",color:"#555",border:"0.5px solid #e0e0e0"}}>{name}</span>
                ))}
              </div>
              {!locked&&(
                <div style={{marginTop:10,display:"flex",gap:6,flexWrap:"wrap"}}>
                  {Array.from({length:groupCount},(_,j)=>j!==i&&(
                    <div key={j} style={{fontSize:10,color:"#aaa"}}>
                      Move to {GROUP_NAMES[j]}:
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div style={{background:"#f9f9f9",borderRadius:10,padding:"10px 14px",marginTop:4,border:"0.5px solid #e0e0e0"}}>
            <div style={{fontSize:11,color:"#888"}}>
              {athletes.length-totalAssigned} athletes not yet assigned
            </div>
          </div>
        </div>
      )}

      {saved&&<div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",background:GREEN,color:"#fff",padding:"10px 20px",borderRadius:20,fontSize:13,fontWeight:600,boxShadow:"0 4px 12px rgba(0,0,0,0.2)"}}>✓ Draft saved!</div>}
    </div>
  );
}
