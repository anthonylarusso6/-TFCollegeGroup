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
  const[leaders,setLeaders]=useState([null,null,null,null]);
  const[swapIdx,setSwapIdx]=useState(null);
  const[editMode,setEditMode]=useState(false);
  const[editGroups,setEditGroups]=useState(null);
  const[saving,setSaving]=useState(false);
  const pollRef=useRef(null);

  useEffect(()=>{
    loadDraft();
    pollRef.current=setInterval(loadDraft,3000);
    return()=>clearInterval(pollRef.current);
  },[]);

  const loadDraft=async()=>{
    const{data}=await supabase.from("draft").select("*").order("created_at",{ascending:false}).limit(1);
    if(data&&data.length>0){
      setDraft(data[0]);
      setLeaders(data[0].leaders||[null,null,null,null]);
    }
    setLoading(false);
  };

  const generateLeaders=async()=>{
    const names=athletes.map(a=>a.name);
    if(names.length<4){alert("Need at least 4 athletes in roster first.");return;}
    const chosen=pickRandom(names,4,[]);
    setSaving(true);
    // Delete old draft and create fresh one
    await supabase.from("draft").delete().neq("id","00000000-0000-0000-0000-000000000000");
    const{data}=await supabase.from("draft").insert({
      week_start:new Date().toISOString().split("T")[0],
      leaders:chosen,
      bracelets:[null,null,null,null],
      groups:[[],[],[],[]],
      tiers:[1,1,2,3].sort(()=>Math.random()-0.5),
      phase:"bracelet",
      locked:false,
    }).select();
    if(data){setDraft(data[0]);setLeaders(chosen);}
    setSaving(false);
    // Update athletes to forge role
    for(const name of chosen){
      const ath=athletes.find(a=>a.name===name);
      if(ath)await supabase.from("athletes").update({role:"forge"}).eq("id",ath.id);
    }
    // Reset all others to iron
    const others=athletes.filter(a=>!chosen.includes(a.name));
    for(const ath of others){
      await supabase.from("athletes").update({role:"iron",group_idx:null,bracelet:null,tier:null}).eq("id",ath.id);
    }
  };

  const swapLeader=(i,newName)=>{
    const n=[...leaders];n[i]=newName;setLeaders(n);setSwapIdx(null);
  };

  const confirmLeaders=async()=>{
    if(!leaders.every(l=>l))return;
    setSaving(true);
    await supabase.from("draft").update({leaders,phase:"bracelet"}).eq("id",draft.id);
    await loadDraft();
    setSaving(false);
  };

  const saveEdits=async()=>{
    setSaving(true);
    await supabase.from("draft").update({groups:editGroups,locked:true,phase:"locked"}).eq("id",draft.id);
    // Update athlete group assignments
    editGroups.forEach(async(group,i)=>{
      group.forEach(async(name)=>{
        const ath=athletes.find(a=>a.name===name);
        if(ath)await supabase.from("athletes").update({group_idx:i,tier:draft.tiers?.[i]}).eq("id",ath.id);
      });
    });
    if(draft.leaders){
      draft.leaders.forEach(async(name,i)=>{
        const ath=athletes.find(a=>a.name===name);
        if(ath)await supabase.from("athletes").update({group_idx:i,tier:draft.tiers?.[i],bracelet:draft.bracelets?.[i]?.ref}).eq("id",ath.id);
      });
    }
    setEditMode(false);
    await loadDraft();
    setSaving(false);
  };

  const resetDraft=async()=>{
    if(!window.confirm("Reset the entire draft? This cannot be undone."))return;
    await supabase.from("draft").delete().neq("id","00000000-0000-0000-0000-000000000000");
    setDraft(null);setLeaders([null,null,null,null]);
  };

  if(loading)return<div style={{textAlign:"center",padding:"2rem",color:"#888"}}>Loading draft...</div>;

  const phase=draft?.phase;
  const groups=draft?.groups||[[],[],[],[]];
  const bracelets=draft?.bracelets||[null,null,null,null];
  const tiers=draft?.tiers||[null,null,null,null];
  const draftLeaders=draft?.leaders||[null,null,null,null];

  return(
    <div>
      {/* Status bar */}
      <div style={{background:BG,borderRadius:12,padding:"1rem",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:11,color:"#555",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Draft status</div>
          <div style={{fontSize:16,fontWeight:500,color:"#fff"}}>
            {!draft?"No draft started":phase==="bracelet"?"Leaders picking bracelets...":phase==="draft"?"Live draft in progress ⚡":phase==="locked"?"Draft complete — groups locked ✓":"Setting up..."}
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {phase==="locked"&&<button onClick={()=>{setEditMode(true);setEditGroups(groups.map(g=>[...g]));}} style={{padding:"6px 14px",borderRadius:8,border:"0.5px solid "+GOLD,background:"transparent",color:GOLD,fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>Edit groups</button>}
          {draft&&<button onClick={resetDraft} style={{padding:"6px 14px",borderRadius:8,border:"0.5px solid #555",background:"transparent",color:"#888",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>Reset</button>}
        </div>
      </div>

      {/* Generate leaders */}
      {!draft&&(
        <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+PUR}}>
          <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:8}}>Step 1 — Generate this week's leaders</div>
          <div style={{fontSize:12,color:"#888",marginBottom:12}}>System picks 4 random athletes. You can swap any of them before confirming. Once confirmed Forge leaders pick their bracelets on their phones and the live draft begins.</div>
          <button onClick={generateLeaders} disabled={saving||athletes.length<4} style={{width:"100%",padding:"12px",borderRadius:8,border:"none",background:athletes.length>=4?PUR:"#e0e0e0",color:"#fff",fontSize:14,fontWeight:500,cursor:athletes.length>=4?"pointer":"not-allowed",fontFamily:"Georgia,serif"}}>
            {saving?"Generating...":"Generate leaders →"}
          </button>
          {athletes.length<4&&<div style={{fontSize:12,color:RED,marginTop:8,textAlign:"center"}}>Need at least 4 athletes in roster first.</div>}
        </div>
      )}

      {/* Leader cards — setup phase */}
      {draft&&phase==="setup"&&(
        <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+PUR}}>
          <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Confirm leaders — swap any before starting</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            {[0,1,2,3].map(i=>(
              <div key={i} style={{background:LB[i],borderRadius:10,padding:"10px 12px",border:"0.5px solid "+LC[i]+"33"}}>
                <div style={{fontSize:11,fontWeight:500,color:LC[i],marginBottom:6,textTransform:"uppercase",letterSpacing:"0.04em"}}>Group {i+1}</div>
                <div style={{fontSize:13,fontWeight:500,color:"#1a1a1a",marginBottom:6}}>{leaders[i]||"—"}</div>
                {swapIdx===i?(
                  <select autoFocus onChange={e=>e.target.value&&swapLeader(i,e.target.value)} style={{width:"100%",fontSize:11,padding:"4px",borderRadius:6,border:"0.5px solid #e0e0e0",background:"#fff",color:"#1a1a1a"}}>
                    <option value="">Swap to...</option>
                    {athletes.filter(a=>!leaders.includes(a.name)||a.name===leaders[i]).map(a=><option key={a.id} value={a.name}>{a.name}</option>)}
                  </select>
                ):(
                  <button onClick={()=>setSwapIdx(i)} style={{fontSize:11,padding:"3px 10px",borderRadius:6,border:"0.5px solid "+LC[i],background:"transparent",color:LC[i],cursor:"pointer",fontFamily:"Georgia,serif"}}>Swap</button>
                )}
              </div>
            ))}
          </div>
          <button onClick={confirmLeaders} disabled={!leaders.every(l=>l)||saving} style={{width:"100%",padding:"10px",borderRadius:8,border:"none",background:leaders.every(l=>l)?BG:"#e0e0e0",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:500,fontFamily:"Georgia,serif"}}>
            {saving?"Saving...":"Confirm leaders → Leaders pick bracelets on their phones"}
          </button>
        </div>
      )}

      {/* Live draft view — bracelet phase */}
      {draft&&phase==="bracelet"&&(
        <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+GOLD}}>
          <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:4}}>Leaders are picking bracelets on their phones</div>
          <div style={{fontSize:12,color:"#888",marginBottom:12}}>Auto-refreshing every 3 seconds. Watch it live.</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {draftLeaders.map((name,i)=>{
              const b=bracelets[i];
              const brac=BRACELETS.find(x=>x.ref===b?.ref);
              return(
                <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:10,background:LB[i],border:"0.5px solid "+LC[i]+"44"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:brac?.hex||"#ccc",flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:500,color:LC[i]}}>{name}</div>
                    {brac?<div style={{fontSize:11,color:"#888"}}>{brac.color} — {brac.ref}</div>:<div style={{fontSize:11,color:"#aaa"}}>Picking...</div>}
                  </div>
                  {brac?<span style={{fontSize:10,background:LC[i],color:"#fff",padding:"2px 7px",borderRadius:4}}>✓ Picked</span>:<span style={{fontSize:10,color:"#aaa"}}>Waiting</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Live draft view — draft phase */}
      {draft&&phase==="draft"&&(
        <div>
          <div style={{background:BG,borderRadius:12,padding:"1rem",marginBottom:12,border:"2px solid "+RED}}>
            <div style={{fontSize:11,color:RED,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>⚡ Live draft in progress</div>
            <div style={{fontSize:13,color:"#fff"}}>Leaders are picking on their phones. Watch the groups build in real time below.</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[0,1,2,3].map(i=>{
              const brac=BRACELETS.find(b=>b.ref===bracelets[i]?.ref);
              const td=TIER_COLORS[tiers[i]];
              return(
                <div key={i} style={{background:"#fff",borderRadius:12,padding:"1rem",border:"0.5px solid "+LC[i]+"66",borderTop:"3px solid "+LC[i]}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                    {brac&&<div style={{width:8,height:8,borderRadius:"50%",background:brac.hex}}/>}
                    <span style={{fontSize:13,fontWeight:500,color:LC[i]}}>{draftLeaders[i]}</span>
                  </div>
                  {brac&&<div style={{fontSize:11,color:"#888",fontStyle:"italic",marginBottom:6}}>"{brac.text}"</div>}
                  {td&&<div style={{display:"inline-block",fontSize:10,fontWeight:500,padding:"1px 8px",borderRadius:4,background:td.bg,color:td.color,marginBottom:8}}>{td.label}</div>}
                  {groups[i]?.map(name=>(
                    <div key={name} style={{fontSize:12,padding:"4px 8px",background:"#f5f5f5",borderRadius:6,marginBottom:3,color:"#1a1a1a"}}>{name}</div>
                  ))}
                  {(!groups[i]||groups[i].length===0)&&<div style={{fontSize:11,color:"#aaa"}}>No picks yet...</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked groups view */}
      {draft&&phase==="locked"&&!editMode&&(
        <div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            {[0,1,2,3].map(i=>{
              const brac=BRACELETS.find(b=>b.ref===bracelets[i]?.ref);
              const td=TIER_COLORS[tiers[i]];
              return(
                <div key={i} style={{background:"#fff",borderRadius:12,padding:"1rem",border:"0.5px solid "+LC[i]+"66",borderTop:"3px solid "+LC[i]}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                    {brac&&<div style={{width:10,height:10,borderRadius:"50%",background:brac.hex}}/>}
                    <span style={{fontSize:14,fontWeight:500,color:LC[i]}}>{draftLeaders[i]}</span>
                  </div>
                  {brac&&<div style={{fontSize:11,color:"#888",fontStyle:"italic",marginBottom:6}}>"{brac.text}" — {brac.ref}</div>}
                  {td&&<div style={{display:"inline-block",fontSize:11,fontWeight:500,padding:"2px 10px",borderRadius:6,background:td.bg,color:td.color,marginBottom:8}}>{td.label}</div>}
                  {groups[i]?.map(name=>(
                    <div key={name} style={{fontSize:13,padding:"4px 8px",background:"#f5f5f5",borderRadius:6,marginBottom:3,color:"#1a1a1a"}}>{name}</div>
                  ))}
                  <div style={{fontSize:11,color:"#aaa",marginTop:6}}>{(groups[i]?.length||0)+1} total including leader</div>
                </div>
              );
            })}
          </div>
          <button onClick={generateLeaders} style={{width:"100%",padding:"10px",borderRadius:8,border:"0.5px solid "+PUR,background:"transparent",color:PUR,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"Georgia,serif"}}>
            Start new week → Generate new leaders
          </button>
        </div>
      )}

      {/* Edit mode */}
      {editMode&&editGroups&&(
        <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0",borderTop:"3px solid "+GOLD}}>
          <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Edit groups — drag athletes between groups</div>
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
    </div>
  );
}
