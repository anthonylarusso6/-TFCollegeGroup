import { useState, useEffect } from "react";
import Head from "next/head";
import { supabase } from "../lib/supabase";
import Draft from "../components/Draft";
import Accountability from "../components/Accountability";
import FellowshipFriday from "../components/FellowshipFriday";
import MindsetMonday from "../components/MindsetMonday";
import CultureEvents from "../components/CultureEvents";

const BG="#0f0f0f";
const PUR="#534AB7";
const GOLD="#D4AF37";
const RED="#C0392B";
const STEEL="#708090";
const GREEN="#1E6B3A";
const COACH_PIN="1803";

export default function Coach(){
  const[authed,setAuthed]=useState(false);
  const[coachRole,setCoachRole]=useState("ant");
  const[selectedCoach,setSelectedCoach]=useState(null); // "ant" or "kevin"
  const[pin,setPin]=useState("");
  const[pinStep,setPinStep]=useState("select"); // "select" | "enter" | "create" | "confirm"
  const[pinConfirm,setPinConfirm]=useState("");
  const[pinError,setPinError]=useState("");
  const[tab,setTab]=useState("overview");
  const[athletes,setAthletes]=useState([]);
  const[attendance,setAttendance]=useState([]);
  const[inbox,setInbox]=useState([]);
  const[anvil,setAnvil]=useState([]);
  const[leaderboard,setLeaderboard]=useState([]);
  const[announcement,setAnnouncement]=useState("");
  const[currentAnnouncement,setCurrentAnnouncement]=useState(null);
  const[loading,setLoading]=useState(true);
  const[newName,setNewName]=useState("");
  const[newSport,setNewSport]=useState("");
  const[newGender,setNewGender]=useState("");
  const[newRole,setNewRole]=useState("iron");
  const[genLoading,setGenLoading]=useState(null);
  const[coachPrayers,setCoachPrayers]=useState([]);
  const[prayedFor,setPrayedFor]=useState({});
  const[weightLogs,setWeightLogs]=useState([]);
  const[photoAthletes,setPhotoAthletes]=useState([]);
  const[uploadingPhoto,setUploadingPhoto]=useState(null);
  const[engAthletes,setEngAthletes]=useState([]);
    const[anvilWinner,setAnvilWinner]=useState("");
  const[anvilNote,setAnvilNote]=useState("");
  const[anvilDate,setAnvilDate]=useState("");

  useEffect(()=>{if(authed)loadAll();},[authed]);

  const loadAll=async()=>{
    setLoading(true);
    const[{data:aths},{data:att},{data:inb},{data:anv},{data:lb},{data:ann}]=await Promise.all([
      supabase.from("athletes").select("*").order("name"),
      supabase.from("attendance").select("*,athletes(name)").order("date",{ascending:false}).limit(200),
      supabase.from("inbox").select("*,athletes(name)").eq("done",false).order("created_at",{ascending:false}),
      supabase.from("anvil").select("*").order("created_at",{ascending:false}),
      supabase.from("leaderboard").select("*,athletes(name)").order("early_count",{ascending:false}),
      supabase.from("announcements").select("*").eq("active",true).order("created_at",{ascending:false}).limit(1),
    ]);
    if(aths)setAthletes(aths);
    if(att)setAttendance(att);
    if(inb)setInbox(inb);
    if(anv)setAnvil(anv);
    if(lb)setLeaderboard(lb);
    if(ann&&ann.length>0){setCurrentAnnouncement(ann[0]);setAnnouncement(ann[0].message);}
    if(prays)setCoachPrayers(prays);
    if(wlogs)setWeightLogs(wlogs);
    if(engaths)setEngAthletes(engaths);
    setLoading(false);
  };

  const callAI=async(prompt)=>{
    const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:prompt}]})});
    const data=await res.json();
    return data.content?.[0]?.text||"";
  };

  const generateTask=async(athlete,type)=>{
    const goal=type==="athletic"?athlete.athletic_goal:athlete.character_goal;
    if(!goal?.trim())return;
    setGenLoading(athlete.id+"-"+type);
    try{
      const prompt=type==="athletic"
        ?`You are Coach Ant, a faith-based strength coach. Athlete ${athlete.name} plays ${athlete.sport}. Their athletic goal: "${goal}". Give 3 specific exercises before training. Direct, under 60 words, no bullets.`
        :`You are Coach Ant, a faith-based coach. Athlete ${athlete.name}'s character goal: "${goal}". Give one specific actionable task this week. Personal, encouraging, under 50 words.`;
      const text=await callAI(prompt);
      const key=type==="athletic"?"coach_athletic_task":"coach_character_task";
      await supabase.from("athletes").update({[key]:text}).eq("id",athlete.id);
      setAthletes(p=>p.map(a=>a.id===athlete.id?{...a,[key]:text}:a));
    }catch(e){console.error(e);}
    setGenLoading(null);
  };

  const generateReply=async(prompt,onResult,key)=>{
    setGenLoading(key);
    try{const text=await callAI(prompt);if(text)onResult(text);}
    catch(e){console.error(e);}
    setGenLoading(null);
  };

  const addAthlete=async()=>{
    if(!newName.trim())return;
    const{data}=await supabase.from("athletes").insert({name:newName.trim(),sport:newSport.trim(),gender:newGender,role:newRole,status:"active"}).select();
    if(data)setAthletes(p=>[...p,data[0]]);
    setNewName("");setNewSport("");setNewGender("");setNewRole("iron");
  };

  const deleteAthlete=async(id,name)=>{
    if(!window.confirm("Delete "+name+"? This cannot be undone."))return;
    await supabase.from("athletes").delete().eq("id",id);
    setAthletes(p=>p.filter(x=>x.id!==id));
  };

  const updateAthlete=async(id,key,val)=>{
    setAthletes(p=>p.map(a=>a.id===id?{...a,[key]:val}:a));
    await supabase.from("athletes").update({[key]:val}).eq("id",id);
  };

  const saveAnnouncement=async()=>{
    if(currentAnnouncement){
      await supabase.from("announcements").update({message:announcement}).eq("id",currentAnnouncement.id);
    } else {
      await supabase.from("announcements").insert({message:announcement,week_label:"This week",active:true});
    }
    await loadAll();
  };

  const awardAnvil=async()=>{
    if(!anvilWinner.trim())return;
    await supabase.from("anvil").insert({athlete_name:anvilWinner,note:anvilNote,date_awarded:anvilDate||new Date().toLocaleDateString(),type:"individual",athlete_role:"iron"});
    const ath=athletes.find(a=>a.name===anvilWinner);
    if(ath){
      const{data:lb}=await supabase.from("leaderboard").select("*").eq("athlete_id",ath.id);
      if(lb&&lb.length>0)await supabase.from("leaderboard").update({anvil_count:(lb[0].anvil_count||0)+1}).eq("athlete_id",ath.id);
    }
    setAnvilWinner("");setAnvilNote("");setAnvilDate("");
    await loadAll();
  };

  const replyToInbox=async(item,reply)=>{
    await supabase.from("inbox").update({reply,reply_sent:true,done:true}).eq("id",item.id);
    await loadAll();
  };

  const injuries=inbox.filter(i=>i.type==="injury");
  const messages=inbox.filter(i=>i.type==="message");
  const prayers=inbox.filter(i=>i.type==="prayer");
  const inboxCount=inbox.length;

  const today=new Date();
  const dayName=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][today.getDay()];
  const isClassDay=["Mon","Tue","Thu","Fri"].includes(dayName);
  const todayAtt=attendance.filter(a=>a.date===today.toISOString().split("T")[0]);
  const earlyToday=todayAtt.filter(a=>a.status==="early").length;
  const lateToday=todayAtt.filter(a=>a.status==="late").length;

  const TABS=[
    {id:"overview",label:"Overview"},
    {id:"draft",label:"Draft"},
    {id:"roster",label:"Roster"},
    {id:"attendance",label:"Attendance"},
    {id:"accountability",label:"Accountability"},
    {id:"anvil",label:"The Anvil"},
    {id:"inbox",label:`Inbox${inboxCount>0?` (${inboxCount})`:""}`},
    {id:"leaderboard",label:"Leaderboard"},
    {id:"goals",label:"Goals"},
    {id:"fellowship",label:"Fellowship Friday"},
    {id:"mindset",label:"Mindset Monday"},
    {id:"culture",label:"Culture & Events"},
    {id:"prayers",label:"Prayers"},
    {id:"weights",label:"Weights"},
    {id:"photos",label:"Photos"},
    {id:"engagement",label:"Engagement"},
  ];

  // Kevin PIN stored in localStorage
  const getKevinPin=()=>typeof window!=="undefined"?localStorage.getItem("kevin_coach_pin"):null;
  const saveKevinPin=(p)=>localStorage.setItem("kevin_coach_pin",p);

  function handlePinKey(k){
    if(k===null)return;
    if(k==="⌫"){setPin(p=>p.slice(0,-1));setPinError("");return;}
    if(pin.length>=4)return;
    const newPin=pin+String(k);
    setPin(newPin);
    if(newPin.length===4){
      if(pinStep==="enter"){
        // Logging in
        if(selectedCoach==="ant"){
          if(newPin===COACH_PIN){setAuthed(true);setCoachRole("ant");setPin("");}
          else{setPinError("Wrong PIN. Try again.");setPin("");}
        } else {
          const kp=getKevinPin();
          if(newPin===kp){setAuthed(true);setCoachRole("kevin");setPin("");}
          else{setPinError("Wrong PIN. Try again.");setPin("");}
        }
      } else if(pinStep==="create"){
        setPinConfirm(newPin);setPin("");setPinStep("confirm");setPinError("");
      } else if(pinStep==="confirm"){
        if(newPin===pinConfirm){saveKevinPin(newPin);setAuthed(true);setCoachRole("kevin");setPin("");}
        else{setPinError("PINs don't match. Try again.");setPin("");setPinStep("create");setPinConfirm("");}
      }
    }
  }

  const coaches=[
    {id:"ant",name:"Coach Ant",sub:"Head Coach",color:GOLD,emoji:"⚒"},
    {id:"kevin",name:"Coach Kevin",sub:"Guest Speaker",color:PUR,emoji:"📖"},
  ];

  if(!authed) return(
    <>
      <Head><title>Coach — TF College Group</title></Head>
      <div style={{minHeight:"100vh",background:BG,fontFamily:"Georgia, serif",display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem"}}>
        <div style={{textAlign:"center",maxWidth:340,width:"100%"}}>

          {/* Step 1 — Select coach */}
          {pinStep==="select"&&(
            <>
              <div style={{width:60,height:60,borderRadius:16,background:GOLD,margin:"0 auto 1.5rem",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,boxShadow:"0 0 30px "+GOLD+"44"}}>⚒</div>
              <div style={{fontSize:20,fontWeight:400,color:"#fff",marginBottom:4}}>Coach Login</div>
              <div style={{fontSize:13,color:"#888",marginBottom:28}}>Select your name to continue</div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {coaches.map(c=>(
                  <button key={c.id} onClick={()=>{
                    setSelectedCoach(c.id);
                    setPin("");setPinError("");
                    const hasPin=c.id==="ant"||getKevinPin();
                    setPinStep(hasPin?"enter":"create");
                  }} style={{width:"100%",padding:"16px 20px",borderRadius:14,border:"0.5px solid #2a2a2a",background:"#141414",color:"#fff",cursor:"pointer",fontFamily:"Georgia, serif",display:"flex",alignItems:"center",gap:14,textAlign:"left"}}>
                    <div style={{width:44,height:44,borderRadius:"50%",background:c.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0,boxShadow:"0 0 18px "+c.color+"66"}}>{c.emoji}</div>
                    <div>
                      <div style={{fontSize:15,fontWeight:500}}>{c.name}</div>
                      <div style={{fontSize:12,color:"#888"}}>{c.sub}</div>
                    </div>
                    <div style={{marginLeft:"auto",color:"#555",fontSize:18}}>→</div>
                  </button>
                ))}
              </div>
              <a href="/" style={{display:"block",marginTop:24,fontSize:12,color:"#444"}}>← Back to home</a>
            </>
          )}

          {/* Step 2 — PIN entry / create */}
          {pinStep!=="select"&&(
            <>
              <button onClick={()=>{setPinStep("select");setPin("");setPinError("");setSelectedCoach(null);}} style={{position:"absolute",top:20,left:20,background:"transparent",border:"none",color:"#666",fontSize:13,cursor:"pointer",fontFamily:"Georgia, serif"}}>← Back</button>
              {(() => {
                const c=coaches.find(x=>x.id===selectedCoach);
                return(
                  <div style={{width:60,height:60,borderRadius:"50%",background:c.color,margin:"0 auto 1rem",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,boxShadow:"0 0 30px "+c.color+"44"}}>{c.emoji}</div>
                );
              })()}
              <div style={{fontSize:18,fontWeight:400,color:"#fff",marginBottom:4}}>{coaches.find(x=>x.id===selectedCoach)?.name}</div>
              <div style={{fontSize:13,color:"#888",marginBottom:28}}>
                {pinStep==="create"?"Create your 4-digit PIN":pinStep==="confirm"?"Confirm your PIN":"Enter your PIN"}
              </div>
              <div style={{display:"flex",justifyContent:"center",gap:14,marginBottom:28}}>
                {[0,1,2,3].map(i=><div key={i} style={{width:14,height:14,borderRadius:"50%",border:"2px solid "+(coaches.find(x=>x.id===selectedCoach)?.color||GOLD),background:i<pin.length?(coaches.find(x=>x.id===selectedCoach)?.color||GOLD):"transparent"}}/>)}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,maxWidth:240,margin:"0 auto"}}>
                {[1,2,3,4,5,6,7,8,9,null,0,"⌫"].map((k,i)=>(
                  <button key={i} onClick={()=>handlePinKey(k)} style={{padding:"16px",borderRadius:12,border:"0.5px solid "+(k===null?"transparent":"#333"),background:k===null?"transparent":"#141414",fontSize:20,fontWeight:500,cursor:k===null?"default":"pointer",color:"#fff",fontFamily:"Georgia, serif"}}>
                    {k===null?"":k}
                  </button>
                ))}
              </div>
              {pinError&&<div style={{marginTop:14,fontSize:13,color:RED}}>{pinError}</div>}
            </>
          )}
        </div>
      </div>
    </>
  );

  if(loading) return(
    <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}><div style={{fontSize:32,marginBottom:16}}>⚒</div><div style={{fontSize:14,color:"#555"}}>Loading dashboard...</div></div>
    </div>
  );

  return(
    <>
      <Head><title>Coach Dashboard — TF College Group</title></Head>
      <div style={{fontFamily:"Georgia, serif",paddingBottom:"2rem",background:"#f5f5f5",minHeight:"100vh"}}>

        <div style={{background:BG,padding:"1rem 1.25rem 0"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div>
              <div style={{fontSize:18,fontWeight:400,color:"#fff"}}>TF College Group</div>
              <div style={{fontSize:12,color:"#555"}}>{coachRole==="kevin"?"Kevin" : "Coach Ant"} · {dayName} · {isClassDay?"Class day":"No class"}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:12,color:"#888"}}>{athletes.filter(a=>a.status==="active").length} athletes</div>
              <button onClick={()=>setAuthed(false)} style={{fontSize:11,color:"#444",background:"transparent",border:"none",cursor:"pointer",fontFamily:"Georgia, serif"}}>Sign out</button>
            </div>
          </div>
          <div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:1}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 14px",background:"transparent",border:"none",borderBottom:"2px solid "+(tab===t.id?"#fff":"transparent"),color:tab===t.id?"#fff":"#555",fontSize:13,fontWeight:tab===t.id?500:400,cursor:"pointer",fontFamily:"Georgia, serif",whiteSpace:"nowrap"}}>{t.label}</button>
            ))}
          </div>
        </div>

        <div style={{padding:"1rem",maxWidth:900,margin:"0 auto"}}>

          {tab==="overview"&&(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
                {[
                  {label:"Athletes",val:athletes.filter(a=>a.status==="active").length,color:"#1a1a1a",bg:"#fff"},
                  {label:"Early today",val:earlyToday,color:GREEN,bg:"#EAF3DE"},
                  {label:"Late today",val:lateToday,color:RED,bg:"#FCEBEB"},
                  {label:"Inbox",val:inboxCount,color:inboxCount>0?PUR:"#888",bg:inboxCount>0?"#EEEDFE":"#fff"},
                ].map(s=>(
                  <div key={s.label} style={{background:s.bg,borderRadius:10,padding:"10px",textAlign:"center",border:"0.5px solid #e0e0e0"}}>
                    <div style={{fontSize:22,fontWeight:500,color:s.color}}>{s.val}</div>
                    <div style={{fontSize:11,color:"#888",marginTop:2}}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+PUR}}>
                <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:8}}>Weekly announcement</div>
                <div style={{fontSize:12,color:"#888",marginBottom:8}}>This shows on every athlete's home screen when they log in.</div>
                <textarea value={announcement} onChange={e=>setAnnouncement(e.target.value)} placeholder="Type this week's message to your athletes..." style={{width:"100%",minHeight:80,padding:"8px",fontSize:13,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia, serif",resize:"vertical",boxSizing:"border-box",marginBottom:8}}/>
                <button onClick={saveAnnouncement} style={{padding:"8px 20px",borderRadius:8,border:"none",background:PUR,color:"#fff",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"Georgia, serif"}}>Save & push to athletes →</button>
              </div>
              {(injuries.length>0||messages.length>0||prayers.length>0)&&(
                <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+RED}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:10}}>Needs attention</div>
                  {injuries.map((i,idx)=>(
                    <div key={idx} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:"0.5px solid #f0f0f0",alignItems:"flex-start"}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:RED,marginTop:5,flexShrink:0}}/>
                      <div style={{fontSize:13}}><span style={{fontWeight:500}}>{i.athletes?.name}</span> — injury: <span style={{color:"#888"}}>{i.message}</span></div>
                    </div>
                  ))}
                  {messages.map((m,idx)=>(
                    <div key={idx} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:"0.5px solid #f0f0f0",alignItems:"flex-start"}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:PUR,marginTop:5,flexShrink:0}}/>
                      <div style={{fontSize:13}}><span style={{fontWeight:500}}>{m.athletes?.name}</span> sent a message</div>
                    </div>
                  ))}
                  {prayers.map((p,idx)=>(
                    <div key={idx} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:"0.5px solid #f0f0f0",alignItems:"flex-start"}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:GREEN,marginTop:5,flexShrink:0}}/>
                      <div style={{fontSize:13}}><span style={{fontWeight:500}}>{p.athletes?.name}</span> submitted a prayer request</div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0"}}>
                <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Class flow — 2 hours · done by 11:20am</div>
                {[
                  {time:"9:00am",label:"Pre-class",detail:dayName==="Mon"?"Draft → Mindset Monday":dayName==="Fri"?"Fellowship Friday devotional":"Polar sign-in · stretch prep",color:PUR,dur:"30 min"},
                  {time:"9:30am",label:"Stretch & mobility",detail:"10 min · dynamic stretching · all athletes together",color:GREEN,dur:"10 min"},
                  {time:"9:40am",label:"Run",detail:"40–50 min · all 4 groups · hand positions enforced · leaders set pace",color:"#854F0B",dur:"40–50 min"},
                  {time:"10:30am",label:"Weight room",detail:"30–50 min · 2 groups Tier 1 · 1 group Tier 2 · 1 group Tier 3",color:PUR,dur:"30–50 min"},
                  {time:"11:15am",label:"Closeout & prayer",detail:"5 min · all together · coach or athlete prays",color:RED,dur:"5 min"},
                ].map((s,i,arr)=>(
                  <div key={i} style={{display:"flex",gap:12,padding:"8px 0",borderBottom:i<arr.length-1?"0.5px solid #f0f0f0":"none"}}>
                    <div style={{minWidth:56,fontSize:12,color:"#888",paddingTop:2}}>{s.time}</div>
                    <div style={{minWidth:8,display:"flex",flexDirection:"column",alignItems:"center"}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:s.color,marginTop:4,flexShrink:0}}/>
                      {i<arr.length-1&&<div style={{width:1,flex:1,background:"#e0e0e0",marginTop:3}}/>}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                        <span style={{fontSize:13,fontWeight:500,color:"#1a1a1a"}}>{s.label}</span>
                        <span style={{fontSize:11,background:"#f5f5f5",color:"#888",padding:"1px 7px",borderRadius:5}}>{s.dur}</span>
                      </div>
                      <div style={{fontSize:12,color:"#888"}}>{s.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==="draft"&&<Draft athletes={athletes.filter(a=>a.status==="active")}/>}

          {tab==="roster"&&(
            <div>
              <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+PUR}}>
                <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Athletes — {athletes.filter(a=>a.status==="active").length} active</div>
               {athletes.map(a=>(
                  <div key={a.id} style={{padding:"10px 0",borderBottom:"0.5px solid #f0f0f0"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
                   <label style={{width:36,height:36,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:500,color:"#fff",flexShrink:0,cursor:"pointer",overflow:"hidden",position:"relative"}}>
                      {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:a.name[0]}
                      <input type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{
                        const file=e.target.files[0];
                        if(!file)return;
                        const ext=file.name.split(".").pop();
                        const path=`${a.id}.${ext}`;
                        const{error}=await supabase.storage.from("athlete-photos").upload(path,file,{upsert:true});
                        if(!error){
                          const{data}=supabase.storage.from("athlete-photos").getPublicUrl(path);
                          await supabase.from("athletes").update({photo_url:data.publicUrl}).eq("id",a.id);
                          loadAthletes();
                        }
                      }}/>
                    </label>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:500,color:"#1a1a1a"}}>{a.name}</div>
                        <div style={{fontSize:11,color:"#888"}}>{a.sport} · {a.gender}</div>
                      </div>
                      <select value={a.role} onChange={e=>updateAthlete(a.id,"role",e.target.value)} style={{padding:"4px 8px",fontSize:11,border:"0.5px solid #e0e0e0",borderRadius:6,background:"#fff",color:a.role==="forge"?RED:STEEL}}>
                        <option value="iron">The Iron</option>
                        <option value="forge">The Forge</option>
                      </select>
                      <select value={a.status} onChange={e=>updateAthlete(a.id,"status",e.target.value)} style={{padding:"4px 8px",fontSize:11,border:"0.5px solid #e0e0e0",borderRadius:6,background:"#fff",color:a.status==="active"?GREEN:a.status==="sleeping"?"#854F0B":RED}}>
                        <option value="active">Active</option>
                        <option value="sleeping">Sleeping</option>
                        <option value="archived">Archived</option>
                      </select>
                      <button onClick={()=>deleteAthlete(a.id,a.name)} style={{padding:"4px 8px",borderRadius:6,border:"0.5px solid #ffcccc",background:"transparent",color:RED,fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>✕</button>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6,paddingLeft:48}}>
                      <div style={{fontSize:10,color:"#aaa",flexShrink:0}}>Vitruve ID:</div>
                      <input
                        defaultValue={a.vitruve_id||""}
                        placeholder="Paste Vitruve ID from URL..."
                        onBlur={async e=>{
                          const val=e.target.value.trim();
                          if(val!==a.vitruve_id){
                            await supabase.from("athletes").update({vitruve_id:val||null}).eq("id",a.id);
                          }
                        }}
                        style={{flex:1,padding:"3px 8px",fontSize:11,border:"0.5px solid #e0e0e0",borderRadius:6,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia,serif"}}
                      />
                      {a.vitruve_id&&<div style={{width:8,height:8,borderRadius:"50%",background:"#1E6B3A",flexShrink:0}}/>}
                    </div>
                  </div>
                ))}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 60px 80px 80px auto",gap:8,marginTop:16}}>
                  <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Name" style={{padding:"6px 8px",fontSize:13,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia, serif"}}/>
                  <input value={newSport} onChange={e=>setNewSport(e.target.value)} placeholder="Sport" style={{padding:"6px 8px",fontSize:13,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia, serif"}}/>
                  <select value={newGender} onChange={e=>setNewGender(e.target.value)} style={{padding:"6px 8px",fontSize:13,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a"}}>
                    <option value="">M/F</option><option value="M">M</option><option value="F">F</option>
                  </select>
                  <select value={newRole} onChange={e=>setNewRole(e.target.value)} style={{padding:"6px 8px",fontSize:13,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a"}}>
                    <option value="iron">Iron</option><option value="forge">Forge</option>
                  </select>
                  <button onClick={addAthlete} disabled={!newName.trim()} style={{padding:"6px 16px",borderRadius:8,border:"none",background:newName.trim()?PUR:"#e0e0e0",color:"#fff",fontSize:13,fontWeight:500,cursor:newName.trim()?"pointer":"not-allowed",fontFamily:"Georgia, serif"}}>Add</button>
                </div>
              </div>
            </div>
          )}

          {tab==="attendance"&&(
            <div>
              <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0",borderTop:"3px solid "+GREEN}}>
                <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Today's attendance — {dayName}</div>
                {athletes.filter(a=>a.status==="active").map(a=>{
                  const rec=todayAtt.find(r=>r.athlete_id===a.id);
                  return(
                    <div key={a.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"0.5px solid #f0f0f0"}}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:500,color:"#fff",flexShrink:0}}>{a.name[0]}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:500,color:"#1a1a1a"}}>{a.name}</div>
                        {rec&&<div style={{fontSize:11,color:"#888"}}>{rec.time_logged}</div>}
                      </div>
                      {rec?(
                        <span style={{fontSize:11,fontWeight:500,padding:"2px 10px",borderRadius:6,background:rec.status==="early"?"#EAF3DE":"#FCEBEB",color:rec.status==="early"?GREEN:RED}}>{rec.status==="early"?"Early ✓":"Late"}</span>
                      ):(
                        <span style={{fontSize:11,color:"#aaa"}}>Not checked in</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab==="accountability"&&<Accountability athletes={athletes.filter(a=>a.status==="active")}/>}
{tab==="fellowship"&&<FellowshipFriday/>}
{tab==="mindset"&&<MindsetMonday/>}
{tab==="culture"&&<CultureEvents/>}

          {tab==="prayers"&&(
            <div>
              <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+PUR}}>
                <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:4}}>🙏 Prayer Wall</div>
                <div style={{fontSize:12,color:"#888"}}>{coachPrayers.length} prayer request{coachPrayers.length!==1?"s":""} from your athletes</div>
              </div>
              {coachPrayers.length===0&&<div style={{background:"#fff",borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid #e0e0e0"}}><div style={{fontSize:13,color:"#888"}}>No prayer requests yet.</div></div>}
              {coachPrayers.map((p,i)=>(
                <div key={i} style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:8,border:"0.5px solid #e0e0e0",borderLeft:"4px solid "+(prayedFor[p.id]?GREEN:PUR),opacity:prayedFor[p.id]?0.6:1}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                    <div style={{fontSize:12,fontWeight:600,color:PUR}}>{p.anonymous?"Anonymous":p.athletes?.name||"Athlete"}</div>
                    <div style={{fontSize:11,color:"#aaa"}}>{new Date(p.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{fontSize:13,color:"#1a1a1a",lineHeight:1.6,marginBottom:10}}>{p.message}</div>
                  <button onClick={()=>setPrayedFor(prev=>({...prev,[p.id]:true}))} style={{padding:"6px 14px",borderRadius:8,border:"none",background:prayedFor[p.id]?"#EAF3DE":PUR,color:prayedFor[p.id]?GREEN:"#fff",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                    {prayedFor[p.id]?"✓ Prayed for":"Mark as prayed →"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab==="weights"&&(
            <div>
              <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+GREEN}}>
                <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:4}}>⚖️ Weight Log</div>
                <div style={{fontSize:12,color:"#888"}}>
                  {Object.keys(weightLogs.reduce((a,l)=>{a[l.athletes?.name||"?"]=1;return a;},{})).length} athletes logging weight
                </div>
              </div>
              {weightLogs.length===0&&<div style={{background:"#fff",borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid #e0e0e0"}}><div style={{fontSize:13,color:"#888"}}>No weight logs yet.</div></div>}
              {(()=>{
                const byAthlete={};
                weightLogs.forEach(l=>{const n=l.athletes?.name||"Unknown";if(!byAthlete[n])byAthlete[n]=[];byAthlete[n].push(l);});
                return Object.entries(byAthlete).map(([name,entries],i)=>{
                  const first=entries[entries.length-1]?.weight;
                  const latest=entries[0]?.weight;
                  const diff=first&&latest?parseFloat((latest-first).toFixed(1)):null;
                  return(
                    <div key={i} style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:8,border:"0.5px solid #e0e0e0"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a"}}>{name}</div>
                        <div style={{fontSize:13,fontWeight:600,color:diff===null?"#888":diff<0?GREEN:diff>0?RED:"#888"}}>{diff===null?"—":(diff>0?"+":"")+diff+" lbs"}</div>
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        {[{l:"Start",v:first},{l:"Latest",v:latest},{l:"Entries",v:entries.length}].map(s=>(
                          <div key={s.l} style={{flex:1,background:"#f9f9f9",borderRadius:8,padding:"8px",textAlign:"center"}}>
                            <div style={{fontSize:13,fontWeight:500}}>{s.v||"—"}{typeof s.v==="number"&&s.l!=="Entries"?" lbs":""}</div>
                            <div style={{fontSize:10,color:"#888"}}>{s.l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {tab==="photos"&&(
            <div>
              <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+STEEL}}>
                <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:4}}>📸 Group Photos</div>
                <div style={{fontSize:12,color:"#888"}}>Manage athlete profile photos — these show on the athlete photo wall.</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {athletes.filter(a=>a.status==="active").map((a,i)=>(
                  <div key={i} style={{background:"#fff",borderRadius:12,padding:"1rem",border:"0.5px solid #e0e0e0",textAlign:"center"}}>
                    <div style={{width:64,height:64,borderRadius:"50%",background:STEEL,margin:"0 auto 8px",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#fff"}}>
                      {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:a.name[0]}
                    </div>
                    <div style={{fontSize:12,fontWeight:500,color:"#1a1a1a",marginBottom:8}}>{a.name}</div>
                    <label style={{padding:"6px 12px",borderRadius:8,border:"0.5px solid #e0e0e0",background:"#f9f9f9",fontSize:11,cursor:"pointer",color:"#555"}}>
                      {uploadingPhoto===a.id?"Uploading...":a.photo_url?"Change photo":"Add photo"}
                      <input type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{
                        const file=e.target.files[0];
                        if(!file)return;
                        setUploadingPhoto(a.id);
                        const reader=new FileReader();
                        reader.onload=async ev=>{
                          await supabase.from("athletes").update({photo_url:ev.target.result}).eq("id",a.id);
                          setAthletes(prev=>prev.map(x=>x.id===a.id?{...x,photo_url:ev.target.result}:x));
                          setUploadingPhoto(null);
                        };
                        reader.readAsDataURL(file);
                      }}/>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==="engagement"&&(
            <div>
              <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+PUR}}>
                <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:4}}>📊 Athlete Engagement</div>
                <div style={{fontSize:12,color:"#888"}}>See who's using the app, filling out goals, and writing notes.</div>
              </div>
              <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0"}}>
                <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:8,marginBottom:8,padding:"0 4px"}}>
                  {["Athlete","Goals","Notes","Photo"].map(h=>(
                    <div key={h} style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.04em",textAlign:h==="Athlete"?"left":"center"}}>{h}</div>
                  ))}
                </div>
                {engAthletes.map((a,i)=>{
                  const hasGoal=!!(a.athletic_goal||a.character_goal);
                  const noteCount=[1,2,3,4,5,6].filter(n=>a[`mindset_note_${n}`]||a[`fellowship_note_${n}`]).length;
                  const hasPhoto=!!a.photo_url;
                  return(
                    <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:8,padding:"10px 4px",borderBottom:i<engAthletes.length-1?"0.5px solid #f0f0f0":"none",alignItems:"center"}}>
                      <div style={{fontSize:13,fontWeight:500,color:"#1a1a1a"}}>{a.name}</div>
                      <div style={{textAlign:"center",fontSize:14}}>{hasGoal?"✅":"⬜"}</div>
                      <div style={{textAlign:"center"}}><span style={{fontSize:12,fontWeight:600,color:noteCount>0?PUR:"#ccc"}}>{noteCount}</span></div>
                      <div style={{textAlign:"center",fontSize:14}}>{hasPhoto?"📸":"⬜"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


}

function InboxItem({item,color,bg,type,onReply,onGenerate,genLoading,loadKey}){
  const[reply,setReply]=useState(item.reply||"");
  const[sent,setSent]=useState(item.reply_sent||false);
  const prompts={
    injury:`You are Coach Ant, a faith-based strength coach. Athlete ${item.athletes?.name} reported: "${item.message}". Write a caring professional response as Coach Ant. Acknowledge the injury, tell them what to do, encourage them. Under 60 words.`,
    message:`You are Coach Ant, a faith-based strength coach. Athlete ${item.athletes?.name} sent: "${item.message}". Write a warm personal reply as Coach Ant. Encouraging, real, grounded in faith. Under 60 words.`,
    prayer:`You are Coach Ant, a faith-based coach who prays for athletes. ${item.athletes?.name} submitted: "${item.message}". Write a warm faith-filled response as Coach Ant. Include a short scripture if natural. Under 70 words.`,
  };
  return(
    <div style={{padding:"10px 0",borderBottom:"0.5px solid #f0f0f0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <span style={{fontSize:13,fontWeight:500,color}}>{item.athletes?.name}</span>
        <span style={{fontSize:11,color:"#aaa"}}>{new Date(item.created_at).toLocaleDateString()}</span>
      </div>
      <div style={{fontSize:13,color:"#555",marginBottom:8,padding:"8px 10px",background:bg,borderRadius:8,borderLeft:"3px solid "+color}}>{item.message}</div>
      <textarea value={reply} onChange={e=>setReply(e.target.value)} placeholder="Write a reply..." style={{width:"100%",minHeight:50,padding:"6px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia, serif",resize:"vertical",boxSizing:"border-box",marginBottom:6}}/>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <button onClick={()=>onGenerate(prompts[type],text=>setReply(text))} style={{padding:"5px 12px",borderRadius:8,border:"0.5px solid "+color,background:"transparent",color,fontSize:11,cursor:"pointer",fontFamily:"Georgia, serif"}}>
          {genLoading===loadKey?"Generating...":"Generate reply"}
        </button>
        <button onClick={async()=>{await onReply(item,reply);setSent(true);}} style={{padding:"5px 14px",borderRadius:8,border:"none",background:color,color:"#fff",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"Georgia, serif"}}>Send reply</button>
        {sent&&<span style={{fontSize:12,color:GREEN,fontWeight:500}}>✓ Sent</span>}
      </div>
    </div>
  );
}
