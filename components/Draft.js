import { useState, useEffect, useRef } from "react";
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

// Snake draft order: 0,1,2,3,3,2,1,0,0,1,2,3...
const snakeOrder=(numGroups,numRounds)=>{
  const order=[];
  for(let r=0;r<numRounds;r++){
    const round=r%2===0
      ?Array.from({length:numGroups},(_,i)=>i)
      :Array.from({length:numGroups},(_,i)=>numGroups-1-i);
    order.push(...round);
  }
  return order;
};

export default function Draft({athletes=[]}){
  const[phase,setPhase]=useState("setup");// setup | bracelet | draft | done
  const[groupCount,setGroupCount]=useState(4);
  const[picksPerGroup,setPicksPerGroup]=useState(4);
  const[leaders,setLeaders]=useState([]);// [{name, athleteId}]
  const[groups,setGroups]=useState({});// {idx: [names]}
  const[bracelets,setBracelets]=useState({});
  const[pickOrder,setPickOrder]=useState([]);// snake order array
  const[currentPick,setCurrentPick]=useState(0);// index into pickOrder
  const[search,setSearch]=useState("");
  const[saving,setSaving]=useState(false);
  const[draftId,setDraftId]=useState(null);
  const[loading,setLoading]=useState(true);
  const[view,setView]=useState("bracelets");// bracelets | draft (during draft phase)

  useEffect(()=>{loadDraft();},[]);

  const loadDraft=async()=>{
    setLoading(true);
    const{data,error}=await supabase.from("draft").select("*").order("created_at",{ascending:false}).limit(1).catch(e=>({data:[],error:e}));
    if(error)console.error("Draft load error:",error);
    if(data&&data[0]){
      const d=data[0];
      setDraftId(d.id);
      const gc=d.group_count||4;
      const ppg=d.picks_per_group||4;
      setGroupCount(gc);setPicksPerGroup(ppg);
      if(d.leaders){
        const l=d.leaders.filter(Boolean).map(name=>{
          const ath=athletes.find(a=>a.name===name);
          return{name,athleteId:ath?.id};
        });
        setLeaders(l);
      }
      if(d.groups){
        const g={};
        (d.groups||[]).forEach((arr,i)=>{g[i]=arr||[];});
        setGroups(g);
      }
      if(d.bracelets){
        const b={};
        (d.bracelets||[]).forEach((br,i)=>{if(br)b[i]=br;});
        setBracelets(b);
      }
      if(d.phase)setPhase(d.phase);
      if(d.current_pick!=null)setCurrentPick(d.current_pick);
      if(d.pick_order)setPickOrder(d.pick_order);
    }
    setLoading(false);
  };

  const saveToDB=async(updates)=>{
    const payload={
      group_count:groupCount,
      picks_per_group:picksPerGroup,
      leaders:Array.from({length:groupCount},(_,i)=>leaders[i]?.name||null),
      groups:Array.from({length:groupCount},(_,i)=>groups[i]||[]),
      bracelets:Array.from({length:groupCount},(_,i)=>bracelets[i]||null),
      ...updates,
    };
    if(draftId){
      await supabase.from("draft").update(payload).eq("id",draftId).catch(()=>{});
    }else{
      const{data}=await supabase.from("draft").insert(payload).select().single().catch(()=>({data:null}));
      if(data)setDraftId(data.id);
    }
  };

  // All athletes assigned to any group
  const assigned=[...Object.values(groups).flat(),...leaders.map(l=>l.name)];
  const available=athletes.filter(a=>!assigned.includes(a.name)&&(!search||a.name.toLowerCase().includes(search.toLowerCase())));

  // Current picker
  const currentGroupIdx=pickOrder[currentPick];
  const currentLeader=leaders[currentGroupIdx];
  const isDraftDone=currentPick>=pickOrder.length||available.length===0;

  // STEP 1: Setup
  const startBraceletPhase=()=>{
    if(leaders.length<groupCount){alert(`Select all ${groupCount} leaders first.`);return;}
    // Init groups with leaders already in them
    const g={};
    leaders.forEach((l,i)=>{g[i]=[l.name];});
    setGroups(g);
    setPhase("bracelet");
    saveToDB({phase:"bracelet",groups:Array.from({length:groupCount},(_,i)=>[leaders[i]?.name||null])});
  };

  // STEP 2: After bracelets, start draft
  const startDraft=()=>{
    const order=snakeOrder(groupCount,picksPerGroup);
    setPickOrder(order);
    setCurrentPick(0);
    setPhase("draft");
    setView("draft");
    saveToDB({phase:"draft",pick_order:order,current_pick:0});
  };

  // STEP 3: Pick an athlete
  const pickAthlete=async(athleteName)=>{
    if(isDraftDone)return;
    const idx=currentGroupIdx;
    const newGroups={...groups,[idx]:[...(groups[idx]||[]),athleteName]};
    const newPick=currentPick+1;
    setGroups(newGroups);
    setCurrentPick(newPick);

    // Update athlete role
    const ath=athletes.find(a=>a.name===athleteName);
    if(ath)await supabase.from("athletes").update({role:"iron",group_idx:idx}).eq("id",ath.id).catch(()=>{});

    // Check if done
    const done=newPick>=pickOrder.length||available.filter(a=>a.name!==athleteName).length===0;
    if(done){
      setPhase("done");
      await saveToDB({phase:"done",groups:Array.from({length:groupCount},(_,i)=>newGroups[i]||[]),current_pick:newPick});
      // Update leader roles
      leaders.forEach(async(l,i)=>{
        if(l.athleteId)await supabase.from("athletes").update({role:"forge",group_idx:i}).eq("id",l.athleteId).catch(()=>{});
      });
    }else{
      await saveToDB({groups:Array.from({length:groupCount},(_,i)=>newGroups[i]||[]),current_pick:newPick});
    }
  };

  const resetDraft=async()=>{
    if(!window.confirm("Reset entire draft?"))return;
    setPhase("setup");setLeaders([]);setGroups({});setBracelets({});setPickOrder([]);setCurrentPick(0);
    await supabase.from("athletes").update({role:"iron",group_idx:null}).eq("status","active").catch(()=>{});
    if(draftId)await supabase.from("draft").update({phase:"setup",leaders:[],groups:[],bracelets:[],pick_order:[],current_pick:0}).eq("id",draftId).catch(()=>{});
  };

  if(loading)return<div style={{textAlign:"center",padding:"3rem",color:"#888"}}>Loading draft...</div>;

  return(
    <div>
      {/* Header */}
      <div style={{background:BG,borderRadius:12,padding:"12px 14px",marginBottom:12,border:"1px solid #222",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>🎯 Draft</div>
          <div style={{fontSize:11,color:"#555",marginTop:1}}>
            {phase==="setup"&&"Step 1: Set up groups & leaders"}
            {phase==="bracelet"&&"Step 2: Assign bracelets"}
            {phase==="draft"&&`Step 3: Drafting — Pick ${currentPick+1} of ${pickOrder.length}`}
            {phase==="done"&&"✅ Draft complete"}
          </div>
        </div>
        <button onClick={resetDraft} style={{padding:"6px 12px",borderRadius:8,border:"0.5px solid #444",background:"transparent",color:"#666",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>Reset</button>
      </div>

      {/* SETUP PHASE */}
      {phase==="setup"&&(
        <div>
          <div style={{background:"#fff",borderRadius:12,padding:"14px",marginBottom:10,border:"0.5px solid #e0e0e0"}}>
            <div style={{fontSize:12,fontWeight:600,color:"#1a1a1a",marginBottom:10}}>How many groups?</div>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              {[2,3,4,5,6].map(n=>(
                <button key={n} onClick={()=>{setGroupCount(n);setLeaders(Array(n).fill(null).map((_,i)=>leaders[i]||null).filter(Boolean).slice(0,n));}} style={{width:36,height:36,borderRadius:8,border:"1px solid "+(groupCount===n?ORANGE:"#e0e0e0"),background:groupCount===n?ORANGE:"#fff",color:groupCount===n?"#fff":"#888",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif"}}>{n}</button>
              ))}
            </div>
            <div style={{fontSize:12,fontWeight:600,color:"#1a1a1a",marginBottom:6}}>Picks per group:</div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <input type="range" min={2} max={12} value={picksPerGroup} onChange={e=>setPicksPerGroup(parseInt(e.target.value))} style={{flex:1,accentColor:ORANGE}}/>
              <div style={{fontSize:14,fontWeight:700,color:ORANGE,minWidth:24}}>{picksPerGroup}</div>
            </div>
            <div style={{fontSize:11,color:"#aaa",marginBottom:16}}>{groupCount} groups × {picksPerGroup} picks = {groupCount*picksPerGroup} athletes total</div>

            {/* Select leaders */}
            <div style={{fontSize:12,fontWeight:600,color:"#1a1a1a",marginBottom:8}}>Select {groupCount} Forge leaders:</div>
            {Array.from({length:groupCount},(_,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:COLORS[i],display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>⚒</div>
                <select value={leaders[i]?.name||""} onChange={e=>{
                  const ath=athletes.find(a=>a.name===e.target.value);
                  const newLeaders=[...leaders];
                  newLeaders[i]=ath?{name:ath.name,athleteId:ath.id}:null;
                  setLeaders(newLeaders);
                }} style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid "+COLORS[i]+"55",fontSize:13,fontFamily:"Georgia,serif",background:"#fafafa"}}>
                  <option value="">— Group {i+1} leader —</option>
                  {athletes.filter(a=>!leaders.some((l,j)=>j!==i&&l?.name===a.name)).map(a=>(
                    <option key={a.id} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <button onClick={startBraceletPhase} disabled={leaders.filter(Boolean).length<groupCount} style={{width:"100%",padding:"14px",borderRadius:10,border:"none",background:leaders.filter(Boolean).length>=groupCount?ORANGE:"#e0e0e0",color:leaders.filter(Boolean).length>=groupCount?"#fff":"#aaa",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif"}}>
            Next: Assign Bracelets →
          </button>
        </div>
      )}

      {/* BRACELET PHASE */}
      {phase==="bracelet"&&(
        <div>
          {Array.from({length:groupCount},(_,i)=>(
            <div key={i} style={{background:"#fff",borderRadius:12,padding:"14px",marginBottom:10,border:"2px solid "+COLORS[i]}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:COLORS[i],display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff"}}>⚒</div>
                <div style={{fontSize:13,fontWeight:700,color:COLORS[i]}}>{leaders[i]?.name||`Group ${i+1}`}</div>
              </div>
              <select value={bracelets[i]||""} onChange={e=>setBracelets(prev=>({...prev,[i]:e.target.value}))}
                style={{width:"100%",padding:"8px",borderRadius:8,border:"1px solid "+COLORS[i]+"44",fontSize:12,fontFamily:"Georgia,serif",background:"#fafafa",marginBottom:8}}>
                <option value="">— Pick a bracelet —</option>
                {BRACELETS.filter(b=>!Object.values(bracelets).includes(b.ref)||bracelets[i]===b.ref).map(b=>(
                  <option key={b.ref} value={b.ref}>{b.color} — {b.ref}</option>
                ))}
              </select>
              {bracelets[i]&&(()=>{
                const b=BRACELETS.find(x=>x.ref===bracelets[i]);
                return b&&<div style={{padding:"8px",background:b.hex+"22",borderRadius:8,border:"1px solid "+b.hex+"44"}}>
                  <div style={{fontSize:11,fontWeight:600,color:b.hex}}>{b.ref}</div>
                  <div style={{fontSize:11,color:"#666",fontStyle:"italic",marginTop:2}}>"{b.text}"</div>
                </div>;
              })()}
            </div>
          ))}
          <button onClick={startDraft} style={{width:"100%",padding:"14px",borderRadius:10,border:"none",background:GOLD,color:"#1a1a1a",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif"}}>
            Start Draft! →
          </button>
        </div>
      )}

      {/* DRAFT PHASE */}
      {phase==="draft"&&(
        <div>
          {!isDraftDone?(
            <div>
              {/* Current picker banner */}
              <div style={{background:"linear-gradient(135deg,#1a1400,#221b00)",borderRadius:14,padding:"16px",marginBottom:12,border:"2px solid "+COLORS[currentGroupIdx],position:"relative",overflow:"hidden",textAlign:"center"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:COLORS[currentGroupIdx]}}/>
                <div style={{fontSize:11,color:"#888",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Now picking — Pick {currentPick+1}/{pickOrder.length}</div>
                <div style={{fontSize:22,fontWeight:800,color:COLORS[currentGroupIdx]}}>{currentLeader?.name||`Group ${currentGroupIdx+1}`}</div>
                <div style={{fontSize:11,color:"#555",marginTop:4}}>Group {currentGroupIdx+1} · {(groups[currentGroupIdx]||[]).length} picks so far</div>
              </div>

              {/* Search */}
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search athletes..." style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid #e0e0e0",fontSize:14,fontFamily:"Georgia,serif",marginBottom:10,boxSizing:"border-box",background:"#fff"}}/>

              {/* Available athletes */}
              <div style={{background:"#fff",borderRadius:12,border:"0.5px solid #e0e0e0",overflow:"hidden"}}>
                {available.length===0?(
                  <div style={{textAlign:"center",padding:"2rem",color:"#aaa"}}>No more athletes available</div>
                ):available.map(a=>(
                  <button key={a.id} onClick={()=>pickAthlete(a.name)} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"#fff",border:"none",borderBottom:"0.5px solid #f5f5f5",cursor:"pointer",fontFamily:"Georgia,serif",textAlign:"left"}}>
                    <div style={{width:38,height:38,borderRadius:"50%",background:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:"#fff",flexShrink:0,overflow:"hidden"}}>
                      {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:a.name[0]}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:500,color:"#1a1a1a"}}>{a.name}</div>
                      <div style={{fontSize:11,color:"#aaa"}}>{a.sport||"Athlete"}</div>
                    </div>
                    <div style={{fontSize:16,color:COLORS[currentGroupIdx]}}>+</div>
                  </button>
                ))}
              </div>

              {/* Current groups progress */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:6,marginTop:10}}>
                {Array.from({length:groupCount},(_,i)=>(
                  <div key={i} style={{background:"#fff",borderRadius:8,padding:"8px 10px",border:"1px solid "+(i===currentGroupIdx?COLORS[i]+"88":"#e0e0e0")}}>
                    <div style={{fontSize:10,fontWeight:700,color:COLORS[i],marginBottom:4}}>Group {i+1} ({(groups[i]||[]).length})</div>
                    {(groups[i]||[]).map(name=>(
                      <div key={name} style={{fontSize:11,color:"#555"}}>{name}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ):(
            <div style={{textAlign:"center",padding:"2rem"}}>
              <div style={{fontSize:48,marginBottom:12}}>🏆</div>
              <div style={{fontSize:18,fontWeight:700,color:GREEN,marginBottom:8}}>Draft Complete!</div>
              <div style={{fontSize:13,color:"#888",marginBottom:16}}>All picks are in. Groups are saved.</div>
              <button onClick={()=>setPhase("done")} style={{padding:"12px 24px",borderRadius:10,border:"none",background:GOLD,color:"#1a1a1a",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif"}}>View Results →</button>
            </div>
          )}
        </div>
      )}

      {/* DONE PHASE */}
      {phase==="done"&&(
        <div>
          <div style={{background:"linear-gradient(135deg,#0d1f0d,#1a3a1f)",borderRadius:12,padding:"14px",marginBottom:12,border:"1px solid "+GREEN+"44",textAlign:"center"}}>
            <div style={{fontSize:16,fontWeight:700,color:GREEN,marginBottom:4}}>✅ Draft Complete</div>
            <div style={{fontSize:12,color:"#888"}}>Groups are locked and saved</div>
          </div>
          {Array.from({length:groupCount},(_,i)=>(
            <div key={i} style={{background:"#fff",borderRadius:12,padding:"14px",marginBottom:8,border:"2px solid "+COLORS[i]}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{width:24,height:24,borderRadius:"50%",background:COLORS[i],display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff"}}>⚒</div>
                <div style={{fontSize:13,fontWeight:700,color:COLORS[i]}}>{leaders[i]?.name} — Group {i+1}</div>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {(groups[i]||[]).map(name=>(
                  <span key={name} style={{fontSize:11,padding:"3px 8px",borderRadius:12,background:COLORS[i]+"11",color:COLORS[i],border:"1px solid "+COLORS[i]+"33"}}>{name}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
