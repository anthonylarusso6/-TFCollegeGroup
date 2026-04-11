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

const snakeSeq=(total)=>{
  const order=[];let i=0,dir=1;
  while(order.length<total){
    order.push(i);
    if(i===3)dir=-1;
    if(i===0&&order.length>1)dir=1;
    i+=dir;
  }
  return order;
};

export default function Draft({athletes}){
  const[phase,setPhase]=useState("setup");
  const[leaders,setLeaders]=useState([null,null,null,null]);
  const[prevLeaders,setPrevLeaders]=useState([]);
  const[bracelets,setBracelets]=useState([null,null,null,null]);
  const[braceletDone,setBraceletDone]=useState([false,false,false,false]);
  const[groups,setGroups]=useState([[],[],[],[]]);
  const[available,setAvailable]=useState([]);
  const[pickSeq,setPickSeq]=useState([]);
  const[pickIdx,setPickIdx]=useState(0);
  const[timeLeft,setTimeLeft]=useState(10);
  const[tiers,setTiers]=useState([null,null,null,null]);
  const[swapIdx,setSwapIdx]=useState(null);
  const[saving,setSaving]=useState(false);
  const[draftId,setDraftId]=useState(null);
  const timerRef=useRef(null);

  useEffect(()=>{loadDraft();},[]);

  const loadDraft=async()=>{
    const{data}=await supabase.from("draft").select("*").order("created_at",{ascending:false}).limit(1);
    if(data&&data.length>0){
      const d=data[0];
      setDraftId(d.id);
      setPhase(d.phase||"setup");
      setLeaders(d.leaders||[null,null,null,null]);
      setBracelets(d.bracelets||[null,null,null,null]);
      setBraceletDone((d.bracelets||[]).map(b=>!!b));
      setGroups(d.groups||[[],[],[],[]]);
      setTiers(d.tiers||[null,null,null,null]);
    }
  };

  const saveDraft=async(updates)=>{
    setSaving(true);
    if(draftId){
      await supabase.from("draft").update(updates).eq("id",draftId);
    } else {
      const{data}=await supabase.from("draft").insert({...updates,week_start:new Date().toISOString().split("T")[0]}).select();
      if(data)setDraftId(data[0].id);
    }
    setSaving(false);
  };

  const generateLeaders=()=>{
    const names=athletes.map(a=>a.name);
    if(names.length<4)return;
    const chosen=pickRandom(names,4,prevLeaders.slice(-8));
    const final=chosen.length===4?chosen:pickRandom(names,4,[]);
    setLeaders(final);
    setBracelets([null,null,null,null]);
    setBraceletDone([false,false,false,false]);
    setGroups([[],[],[],[]]);
    setAvailable([]);setPickSeq([]);setPickIdx(0);
    setTiers([null,null,null,null]);setSwapIdx(null);
    setPhase("setup");
    saveDraft({phase:"setup",leaders:final,bracelets:[null,null,null,null],groups:[[],[],[],[]],tiers:[null,null,null,null],locked:false});
  };

  const startBracelets=()=>{
    setPhase("bracelet");
    saveDraft({phase:"bracelet"});
  };

  const pickBracelet=(i,b)=>{
    const nb=[...bracelets];nb[i]=b;
    const nd=[...braceletDone];nd[i]=true;
    setBracelets(nb);setBraceletDone(nd);
    saveDraft({bracelets:nb});
  };

  const startDraft=()=>{
    const nonLeaders=athletes.map(a=>a.name).filter(n=>!leaders.includes(n));
    const shuffled=[...nonLeaders].sort(()=>Math.random()-0.5);
    const t=[1,1,2,3].sort(()=>Math.random()-0.5);
    setTiers(t);
    setAvailable(shuffled);
    setPickSeq(snakeSeq(nonLeaders.length));
    setPickIdx(0);setTimeLeft(10);
    setGroups([[],[],[],[]]);
    setPhase("draft");
    saveDraft({phase:"draft",tiers:t,groups:[[],[],[],[]]});
  };

  const currentLeader=pickSeq[pickIdx]??0;

  const doPick=(athlete,leaderIdx,remaining)=>{
    setGroups(g=>{
      const n=g.map(x=>[...x]);
      n[leaderIdx].push(athlete);
      const next=pickIdx+1;
      if(next>=pickSeq.length||remaining.length===0){
        setPhase("locked");
        clearInterval(timerRef.current);
        saveDraft({phase:"locked",groups:n,locked:true});
        // Update athlete tiers and groups in database
        leaders.forEach(async(lName,i)=>{
          const leader=athletes.find(a=>a.name===lName);
          if(leader)await supabase.from("athletes").update({tier:tiers[i],group_idx:i,bracelet:bracelets[i]?.ref}).eq("id",leader.id);
        });
        n.forEach(async(group,i)=>{
          group.forEach(async(name)=>{
            const ath=athletes.find(a=>a.name===name);
            if(ath)await supabase.from("athletes").update({tier:tiers[i],group_idx:i}).eq("id",ath.id);
          });
        });
      } else {
        setPickIdx(next);
        setTimeLeft(10);
        saveDraft({groups:n});
      }
      return n;
    });
  };

  const selectAthlete=(athlete)=>{
    if(phase!=="draft")return;
    clearInterval(timerRef.current);
    const remaining=available.filter(x=>x!==athlete);
    setAvailable(remaining);
    doPick(athlete,currentLeader,remaining);
  };

  useEffect(()=>{
    if(phase!=="draft")return;
    clearInterval(timerRef.current);
    timerRef.current=setInterval(()=>{
      setTimeLeft(t=>{
        if(t<=1){
          setAvailable(av=>{
            if(!av.length)return av;
            const chosen=av[0];
            const remaining=av.filter(x=>x!==chosen);
            doPick(chosen,currentLeader,remaining);
            return remaining;
          });
          return 10;
        }
        return t-1;
      });
    },1000);
    return()=>clearInterval(timerRef.current);
  },[phase,pickIdx]);

  const newWeek=()=>{
    setPrevLeaders(p=>[...p,...leaders].slice(-8));
    setLeaders([null,null,null,null]);
    setBracelets([null,null,null,null]);
    setBraceletDone([false,false,false,false]);
    setGroups([[],[],[],[]]);
    setAvailable([]);setPickSeq([]);setPickIdx(0);
    setTiers([null,null,null,null]);
    setPhase("setup");setDraftId(null);
    saveDraft({phase:"setup",leaders:[null,null,null,null],bracelets:[null,null,null,null],groups:[[],[],[],[]],tiers:[null,null,null,null],locked:false});
  };

  const takenBracelets=bracelets.filter(Boolean).map(b=>b?.ref);

  return(
    <div>
      {saving&&<div style={{fontSize:11,color:PUR,marginBottom:8,textAlign:"right"}}>Saving...</div>}

      {/* How it works */}
      <div style={{background:BG,borderRadius:12,padding:"1rem 1.25rem",marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:500,color:"#fff",marginBottom:8}}>How the draft works</div>
        {[
          {n:"1",label:"Generate leaders",desc:"System picks 4 random athletes avoiding recent leaders. Swap any manually."},
          {n:"2",label:"Pick bracelets",desc:"Each leader picks their bracelet verse. First come first served."},
          {n:"3",label:"Draft athletes",desc:"Snake order — 1,2,3,4, back to 1. 10 seconds per pick. Auto-picks if timer hits zero."},
          {n:"4",label:"Groups locked",desc:"Tiers auto-assigned. Locked all week. Reshuffles next Monday."},
        ].map((s,i)=>(
          <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:6}}>
            <div style={{width:22,height:22,borderRadius:"50%",background:PUR,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:500,color:"#fff",flexShrink:0}}>{s.n}</div>
            <div style={{fontSize:12}}><span style={{fontWeight:500,color:"#fff"}}>{s.label} — </span><span style={{color:"#888"}}>{s.desc}</span></div>
          </div>
        ))}
      </div>

      {/* SETUP */}
      {phase==="setup"&&(
        <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+PUR}}>
          <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Step 1 — Generate this week's leaders</div>
          {athletes.length<4&&<div style={{fontSize:12,color:RED,marginBottom:10}}>Add at least 4 athletes in Roster first.</div>}
          <button onClick={generateLeaders} disabled={athletes.length<4} style={{width:"100%",padding:"12px",borderRadius:8,border:"none",background:athletes.length>=4?PUR:"#e0e0e0",color:"#fff",cursor:athletes.length>=4?"pointer":"not-allowed",fontSize:14,fontWeight:500,fontFamily:"Georgia,serif",marginBottom:14}}>
            Generate leaders
          </button>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:14}}>
            {[0,1,2,3].map(i=>(
              <div key={i} style={{background:LB[i],borderRadius:10,padding:10,border:"0.5px solid "+LC[i]+"33"}}>
                <div style={{fontSize:11,fontWeight:500,color:LC[i],marginBottom:6,textTransform:"uppercase",letterSpacing:"0.04em"}}>Group {i+1}</div>
                {leaders[i]?(
                  <>
                    <div style={{fontSize:13,fontWeight:500,color:"#1a1a1a",marginBottom:6}}>{leaders[i]}</div>
                    {swapIdx===i?(
                      <select autoFocus onChange={e=>{if(e.target.value){const n=[...leaders];n[i]=e.target.value;setLeaders(n);setSwapIdx(null);}}} style={{width:"100%",fontSize:11,padding:"4px",borderRadius:6,border:"0.5px solid #e0e0e0",background:"#fff",color:"#1a1a1a"}}>
                        <option value="">Swap to...</option>
                        {athletes.filter(a=>!leaders.includes(a.name)||a.name===leaders[i]).map(a=><option key={a.id} value={a.name}>{a.name}</option>)}
                      </select>
                    ):(
                      <button onClick={()=>setSwapIdx(i)} style={{fontSize:11,padding:"3px 10px",borderRadius:6,border:"0.5px solid "+LC[i],background:"transparent",color:LC[i],cursor:"pointer",fontFamily:"Georgia,serif"}}>Swap</button>
                    )}
                  </>
                ):(
                  <div style={{fontSize:12,color:"#aaa",padding:"8px 0"}}>Not set</div>
                )}
              </div>
            ))}
          </div>
          {leaders.every(l=>l)&&(
            <button onClick={startBracelets} style={{width:"100%",padding:"10px",borderRadius:8,border:"none",background:BG,color:"#fff",cursor:"pointer",fontSize:14,fontWeight:500,fontFamily:"Georgia,serif"}}>
              Lock leaders → Pick bracelets
            </button>
          )}
        </div>
      )}

      {/* BRACELET */}
      {phase==="bracelet"&&(
        <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+GOLD}}>
          <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:4}}>Step 2 — Leaders pick their bracelet</div>
          <div style={{fontSize:12,color:"#888",marginBottom:12}}>First come first served. Once taken it's gone.</div>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{background:LB[i],borderRadius:10,padding:"10px 14px",marginBottom:8,border:"0.5px solid "+LC[i]+"44"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:braceletDone[i]?0:8}}>
                <div>
                  <span style={{fontSize:13,fontWeight:500,color:LC[i]}}>{leaders[i]}</span>
                  <span style={{fontSize:11,color:"#888",marginLeft:8}}>Group {i+1}</span>
                </div>
                {braceletDone[i]&&bracelets[i]&&(
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:BRACELETS.find(b=>b.ref===bracelets[i]?.ref)?.hex||"#888"}}/>
                    <span style={{fontSize:12,fontWeight:500,color:LC[i]}}>{bracelets[i]?.color} — {bracelets[i]?.ref}</span>
                  </div>
                )}
              </div>
              {!braceletDone[i]&&(
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {BRACELETS.map(b=>{
                    const taken=takenBracelets.includes(b.ref)&&bracelets[i]?.ref!==b.ref;
                    return(
                      <button key={b.ref} disabled={taken} onClick={()=>pickBracelet(i,b)} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:7,border:"0.5px solid "+(taken?"#e0e0e0":b.hex),background:taken?"#f5f5f5":"transparent",opacity:taken?0.4:1,cursor:taken?"not-allowed":"pointer",fontSize:11,color:"#1a1a1a",fontFamily:"Georgia,serif"}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:b.hex,flexShrink:0}}/>
                        {b.color}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          {braceletDone.every(Boolean)&&(
            <button onClick={startDraft} style={{width:"100%",padding:"10px",borderRadius:8,border:"none",background:BG,color:"#fff",cursor:"pointer",fontSize:14,fontWeight:500,fontFamily:"Georgia,serif",marginTop:8}}>
              All bracelets picked → Start draft
            </button>
          )}
        </div>
      )}

      {/* DRAFT */}
      {phase==="draft"&&(
        <div>
          <div style={{background:BG,borderRadius:12,padding:"1rem 1.25rem",marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div>
                <div style={{fontSize:11,color:"#555",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:3}}>Now picking</div>
                <div style={{fontSize:20,fontWeight:500,color:"#fff"}}>{leaders[currentLeader]}</div>
                <div style={{fontSize:12,color:"#666",marginTop:3}}>Group {currentLeader+1} · {bracelets[currentLeader]?.color||""}</div>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:36,fontWeight:500,color:timeLeft<=3?RED:timeLeft<=6?"#EF9F27":"#fff"}}>{timeLeft}</div>
                <div style={{fontSize:11,color:"#666"}}>seconds</div>
              </div>
            </div>
            {pickSeq[pickIdx+1]!==undefined&&<div style={{fontSize:12,color:"#555"}}>Next: {leaders[pickSeq[pickIdx+1]]}</div>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={{background:"#fff",borderRadius:12,padding:"1rem",border:"0.5px solid #e0e0e0"}}>
              <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:8}}>Available — {available.length}</div>
              <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:300,overflowY:"auto"}}>
                {available.map(a=>(
                  <button key={a} onClick={()=>selectAthlete(a)} style={{padding:"10px 12px",borderRadius:8,border:"0.5px solid "+LC[currentLeader],background:LB[currentLeader],color:"#1a1a1a",cursor:"pointer",fontSize:13,fontWeight:500,textAlign:"left",fontFamily:"Georgia,serif"}}>{a}</button>
                ))}
                {available.length===0&&<div style={{fontSize:13,color:"#aaa"}}>All drafted.</div>}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[0,1,2,3].map(i=>{
                const td=TIER_COLORS[tiers[i]];
                return(
                  <div key={i} style={{background:LB[i],borderRadius:10,padding:"8px 12px",border:"0.5px solid "+LC[i]+"33"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                      {bracelets[i]&&<div style={{width:8,height:8,borderRadius:"50%",background:BRACELETS.find(b=>b.ref===bracelets[i]?.ref)?.hex||LC[i]}}/>}
                      <span style={{fontSize:12,fontWeight:500,color:LC[i]}}>{leaders[i]}</span>
                      {currentLeader===i&&<span style={{fontSize:10,background:LC[i],color:"#fff",padding:"1px 6px",borderRadius:4}}>picking</span>}
                    </div>
                    {td&&<div style={{fontSize:10,fontWeight:500,color:td.color,background:td.bg,display:"inline-block",padding:"1px 6px",borderRadius:4,marginBottom:4}}>{td.label}</div>}
                    {groups[i].map(a=><div key={a} style={{fontSize:12,paddingLeft:4,lineHeight:1.8,color:"#555"}}>{a}</div>)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* LOCKED */}
      {phase==="locked"&&(
        <div>
          <div style={{background:BG,borderRadius:12,padding:"1rem 1.25rem",marginBottom:12,textAlign:"center"}}>
            <div style={{fontSize:11,color:"#888",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Draft complete — groups locked for the week</div>
            <div style={{fontSize:20,fontWeight:500,color:"#fff"}}>This week's groups</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            {[0,1,2,3].map(i=>{
              const brac=BRACELETS.find(b=>b.ref===bracelets[i]?.ref);
              const td=TIER_COLORS[tiers[i]];
              return(
                <div key={i} style={{background:"#fff",border:"0.5px solid "+LC[i]+"66",borderRadius:12,padding:"1rem",borderTop:"3px solid "+LC[i]}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                    {brac&&<div style={{width:10,height:10,borderRadius:"50%",background:brac.hex}}/>}
                    <span style={{fontSize:13,fontWeight:500,color:LC[i]}}>{leaders[i]}</span>
                  </div>
                  {brac&&<div style={{fontSize:11,color:"#888",fontStyle:"italic",marginBottom:6}}>"{brac.text}" — {brac.ref}</div>}
                  {td&&<div style={{display:"inline-block",fontSize:11,fontWeight:500,padding:"2px 10px",borderRadius:6,background:td.bg,color:td.color,marginBottom:8}}>{td.label}</div>}
                  {groups[i].map(a=>(
                    <div key={a} style={{fontSize:13,padding:"4px 8px",background:"#f5f5f5",borderRadius:6,marginBottom:3,color:"#1a1a1a"}}>{a}</div>
                  ))}
                  <div style={{fontSize:11,color:"#aaa",marginTop:6}}>{groups[i].length+1} total including leader</div>
                </div>
              );
            })}
          </div>
          <button onClick={newWeek} style={{width:"100%",padding:"10px",borderRadius:8,border:"0.5px solid "+PUR,background:PUR,color:"#fff",cursor:"pointer",fontSize:14,fontWeight:500,fontFamily:"Georgia,serif"}}>
            Start new week → Generate new leaders
          </button>
        </div>
      )}
    </div>
  );
}
