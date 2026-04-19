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
  const[attDate,setAttDate]=useState(new Date().toISOString().split("T")[0]);
  const[attRecords,setAttRecords]=useState(null);
  const[rosterSearch,setRosterSearch]=useState("");
  const[rosterStatus,setRosterStatus]=useState("active");
  const[rosterExpanded,setRosterExpanded]=useState(null);
  const[coachPrayers,setCoachPrayers]=useState([]);
  const[prayedFor,setPrayedFor]=useState({});
  const[weightLogs,setWeightLogs]=useState([]);
  const[engAthletes,setEngAthletes]=useState([]);
  const[uploadingPhoto,setUploadingPhoto]=useState(null);
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
    setLoading(false);
    // Load secondary data independently — won't block main load
    supabase.from("inbox").select("*,athletes(name)").eq("type","prayer").order("created_at",{ascending:false}).then(({data})=>{if(data)setCoachPrayers(data);}).catch(()=>{});
    supabase.from("weight_log").select("*,athletes(name)").order("date",{ascending:false}).then(({data})=>{if(data)setWeightLogs(data);}).catch(()=>{});
    supabase.from("athletes").select("id,name,photo_url,athletic_goal,character_goal,mindset_note_1,mindset_note_2,mindset_note_3,mindset_note_4,mindset_note_5,mindset_note_6").eq("status","active").order("name").then(({data})=>{if(data)setEngAthletes(data);}).catch(()=>{});
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
    // Delete all related records first
    const tables=["inbox","attendance","leaderboard","weight_log","polar_sessions","vitruve_sessions","callouts","goal_reviews"];
    for(const t of tables){
      try{await supabase.from(t).delete().eq("athlete_id",id);}catch(e){}
    }
    // Small delay to ensure deletes propagate
    await new Promise(r=>setTimeout(r,500));
    const{error}=await supabase.from("athletes").delete().eq("id",id);
    if(error){
      // If still failing, just archive instead
      await supabase.from("athletes").update({status:"archived"}).eq("id",id);
      setAthletes(p=>p.map(x=>x.id===id?{...x,status:"archived"}:x));
      alert(name+" could not be fully deleted due to linked records — archived instead.");
    }else{
      setAthletes(p=>p.filter(x=>x.id!==id));
    }
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
              {/* This week attendance chart */}
              <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+GREEN}}>
                <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:2}}>This week's attendance</div>
                <div style={{fontSize:12,color:"#888",marginBottom:14}}>Daily check-ins · Mon, Tue, Thu, Fri</div>
                {(()=>{
                  const now=new Date();
                  const monday=new Date(now);
                  const dow=now.getDay();
                  const diff=dow===0?-6:1-dow;
                  monday.setDate(now.getDate()+diff);
                  const days=[];
                  for(let i=0;i<5;i++){
                    const d=new Date(monday);
                    d.setDate(monday.getDate()+i);
                    const dayName=["Mon","Tue","Wed","Thu","Fri"][i];
                    if(dayName==="Wed")continue;
                    const dateStr=d.toISOString().split("T")[0];
                    const recs=attendance.filter(a=>a.date===dateStr);
                    days.push({dayName,date:d.getDate(),early:recs.filter(r=>r.status==="early").length,late:recs.filter(r=>r.status==="late").length,isToday:dateStr===now.toISOString().split("T")[0]});
                  }
                  const maxVal=Math.max(...days.map(d=>d.early+d.late),5);
                  return(
                    <div>
                      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-around",gap:8,height:140,marginBottom:12,borderBottom:"0.5px solid #e0e0e0",paddingBottom:4}}>
                        {days.map((d,i)=>{
                          const total=d.early+d.late;
                          const earlyPct=total>0?(d.early/maxVal)*100:0;
                          const latePct=total>0?(d.late/maxVal)*100:0;
                          return(
                            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,height:"100%"}}>
                              <div style={{flex:1,width:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end",alignItems:"center",gap:1}}>
                                {total>0&&(
                                  <>
                                    {d.late>0&&<div style={{width:"70%",height:`${latePct}%`,background:RED,borderRadius:"4px 4px 0 0",minHeight:latePct>0?4:0}}/>}
                                    {d.early>0&&<div style={{width:"70%",height:`${earlyPct}%`,background:GREEN,borderRadius:d.late>0?"0":"4px 4px 0 0",minHeight:earlyPct>0?4:0}}/>}
                                  </>
                                )}
                                {total>0&&<div style={{fontSize:11,fontWeight:600,color:"#1a1a1a",marginBottom:2}}>{total}</div>}
                              </div>
                              <div style={{fontSize:11,fontWeight:d.isToday?600:400,color:d.isToday?GREEN:"#888"}}>{d.dayName}</div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{display:"flex",gap:16,justifyContent:"center",fontSize:11,color:"#888"}}>
                        <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,borderRadius:2,background:GREEN}}/> Early</div>
                        <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,borderRadius:2,background:RED}}/> Late</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
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
              <div style={{display:"flex",gap:6,marginBottom:12}}>
                {["active","sleeping","archived"].map(s=>(
                  <button key={s} onClick={()=>setRosterStatus(s)} style={{flex:1,padding:"8px",borderRadius:8,border:"0.5px solid "+(rosterStatus===s?PUR:"#e0e0e0"),background:rosterStatus===s?PUR:"#fff",color:rosterStatus===s?"#fff":"#888",fontSize:12,fontWeight:rosterStatus===s?600:400,cursor:"pointer",fontFamily:"Georgia,serif",textTransform:"capitalize"}}>
                    {s} ({athletes.filter(a=>a.status===s).length})
                  </button>
                ))}
              </div>
              <div style={{position:"relative",marginBottom:12}}>
                <input value={rosterSearch} onChange={e=>setRosterSearch(e.target.value)} placeholder="Search name or sport..." style={{width:"100%",padding:"10px 12px 10px 34px",borderRadius:10,border:"0.5px solid #e0e0e0",fontSize:13,fontFamily:"Georgia,serif",background:"#fafafa",color:"#1a1a1a",boxSizing:"border-box"}}/>
                <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"#aaa"}}>🔍</div>
                {rosterSearch&&<button onClick={()=>setRosterSearch("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",fontSize:14,color:"#aaa",cursor:"pointer"}}>✕</button>}
              </div>
              <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+PUR}}>
                <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>
                  {rosterStatus.charAt(0).toUpperCase()+rosterStatus.slice(1)} — {athletes.filter(a=>a.status===rosterStatus&&(!rosterSearch||a.name?.toLowerCase().includes(rosterSearch.toLowerCase())||a.sport?.toLowerCase().includes(rosterSearch.toLowerCase()))).length} athletes
                </div>
                {athletes.filter(a=>a.status===rosterStatus&&(!rosterSearch||a.name?.toLowerCase().includes(rosterSearch.toLowerCase())||a.sport?.toLowerCase().includes(rosterSearch.toLowerCase()))).map(a=>{
                  const isExp=rosterExpanded===a.id;
                  const hasInjury=!!(a.injury||a.injury_note);
                  return(
                    <div key={a.id} style={{borderBottom:"0.5px solid #f0f0f0"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",cursor:"pointer"}} onClick={()=>setRosterExpanded(isExp?null:a.id)}>
                        <label style={{width:36,height:36,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:500,color:"#fff",flexShrink:0,cursor:"pointer",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
                          {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(a.name||"?")[0]}
                          <input type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{
                            const file=e.target.files[0];if(!file)return;
                            const reader=new FileReader();
                            reader.onload=async ev=>{
                              await supabase.from("athletes").update({photo_url:ev.target.result}).eq("id",a.id);
                              setAthletes(prev=>prev.map(x=>x.id===a.id?{...x,photo_url:ev.target.result}:x));
                            };
                            reader.readAsDataURL(file);
                          }}/>
                        </label>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                            <div style={{fontSize:13,fontWeight:500,color:"#1a1a1a"}}>{a.name}</div>
                            {hasInjury&&<span style={{fontSize:10,background:"#FCEBEB",color:RED,padding:"1px 6px",borderRadius:4,fontWeight:500}}>🤕 Injured</span>}
                          </div>
                          <div style={{fontSize:11,color:"#888"}}>{a.sport} · {a.gender} · <span style={{color:a.role==="forge"?RED:STEEL}}>{a.role==="forge"?"Forge":"Iron"}</span></div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:6}} onClick={e=>e.stopPropagation()}>
                          <select value={a.status} onChange={e=>updateAthlete(a.id,"status",e.target.value)} style={{padding:"3px 6px",fontSize:11,border:"0.5px solid #e0e0e0",borderRadius:6,background:"#fff",color:a.status==="active"?GREEN:a.status==="sleeping"?"#854F0B":RED}}>
                            <option value="active">Active</option>
                            <option value="sleeping">Sleeping</option>
                            <option value="archived">Archived</option>
                          </select>
                          <button onClick={e=>{e.stopPropagation();deleteAthlete(a.id,a.name);}} style={{padding:"3px 8px",borderRadius:6,border:"0.5px solid #ffcccc",background:"transparent",color:RED,fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>✕</button>
                        </div>
                        <div style={{fontSize:12,color:"#ccc"}}>{isExp?"▲":"▼"}</div>
                      </div>
                      {isExp&&(
                        <div style={{paddingBottom:14,paddingLeft:46}}>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                            <div>
                              <div style={{fontSize:10,color:"#aaa",marginBottom:3}}>Role</div>
                              <select value={a.role} onChange={e=>updateAthlete(a.id,"role",e.target.value)} style={{width:"100%",padding:"6px 8px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:a.role==="forge"?RED:STEEL}}>
                                <option value="iron">The Iron</option>
                                <option value="forge">The Forge</option>
                              </select>
                            </div>
                            <div>
                              <div style={{fontSize:10,color:"#aaa",marginBottom:3}}>PIN</div>
                              <input defaultValue={a.pin||""} placeholder="4-digit PIN" onBlur={async e=>{await supabase.from("athletes").update({pin:e.target.value||null}).eq("id",a.id);}} style={{width:"100%",padding:"6px 8px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia,serif",boxSizing:"border-box"}}/>
                            </div>
                            <div>
                              <div style={{fontSize:10,color:"#aaa",marginBottom:3}}>Bracelet</div>
                              <input defaultValue={a.bracelet||""} placeholder="e.g. Phil 4:13" onBlur={async e=>{await supabase.from("athletes").update({bracelet:e.target.value||null}).eq("id",a.id);setAthletes(prev=>prev.map(x=>x.id===a.id?{...x,bracelet:e.target.value}:x));}} style={{width:"100%",padding:"6px 8px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia,serif",boxSizing:"border-box"}}/>
                            </div>
                            <div>
                              <div style={{fontSize:10,color:"#aaa",marginBottom:3}}>Partner</div>
                              <select defaultValue={a.accountability_partner||""} onChange={async e=>{await supabase.from("athletes").update({accountability_partner:e.target.value||null}).eq("id",a.id);setAthletes(prev=>prev.map(x=>x.id===a.id?{...x,accountability_partner:e.target.value}:x));}} style={{width:"100%",padding:"6px 8px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a"}}>
                                <option value="">No partner</option>
                                {athletes.filter(x=>x.id!==a.id&&x.status==="active").map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
                              </select>
                            </div>
                          </div>
                          {a.athletic_goal&&<div style={{fontSize:12,color:"#555",fontStyle:"italic",padding:"6px 10px",background:"#f9f9f9",borderRadius:8,border:"0.5px solid #e0e0e0",marginBottom:8}}>🎯 {a.athletic_goal}</div>}
                          {hasInjury&&<div style={{fontSize:12,color:RED,padding:"6px 10px",background:"#FCEBEB",borderRadius:8,border:"0.5px solid #ffcccc",marginBottom:8}}>🤕 {a.injury_note||a.injury}</div>}
                          <div>
                            <div style={{fontSize:10,color:"#aaa",marginBottom:3}}>Vitruve ID</div>
                            <input defaultValue={a.vitruve_id||""} placeholder="Paste Vitruve ID..." onBlur={async e=>{const val=e.target.value.trim();if(val!==a.vitruve_id){await supabase.from("athletes").update({vitruve_id:val||null}).eq("id",a.id);}}} style={{width:"100%",padding:"6px 8px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia,serif",boxSizing:"border-box"}}/>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 50px 70px 60px",gap:6,marginTop:16}}>
                  <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Name" style={{padding:"6px 8px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia,serif"}}/>
                  <input value={newSport} onChange={e=>setNewSport(e.target.value)} placeholder="Sport" style={{padding:"6px 8px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia,serif"}}/>
                  <select value={newGender} onChange={e=>setNewGender(e.target.value)} style={{padding:"6px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a"}}>
                    <option value="">M/F</option><option value="M">M</option><option value="F">F</option>
                  </select>
                  <select value={newRole} onChange={e=>setNewRole(e.target.value)} style={{padding:"6px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a"}}>
                    <option value="iron">Iron</option><option value="forge">Forge</option>
                  </select>
                  <button onClick={addAthlete} disabled={!newName.trim()} style={{padding:"6px 12px",borderRadius:8,border:"none",background:newName.trim()?PUR:"#e0e0e0",color:"#fff",fontSize:12,fontWeight:500,cursor:newName.trim()?"pointer":"not-allowed",fontFamily:"Georgia,serif"}}>Add</button>
                </div>
              </div>
            </div>
          )}


          {tab==="attendance"&&(
            <div>
              {/* Weekly summary */}
              {(()=>{
                const now=new Date();
                const monday=new Date(now);
                const diff=now.getDay()===0?-6:1-now.getDay();
                monday.setDate(now.getDate()+diff);
                const days=[];
                for(let i=0;i<5;i++){
                  const d=new Date(monday);
                  d.setDate(monday.getDate()+i);
                  const dn=["Mon","Tue","Wed","Thu","Fri"][i];
                  if(dn==="Wed")continue;
                  const ds=d.toISOString().split("T")[0];
                  const recs=attendance.filter(r=>r.date===ds);
                  days.push({dn,ds,early:recs.filter(r=>r.status==="early").length,late:recs.filter(r=>r.status==="late").length,total:recs.length});
                }
                return(
                  <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+GREEN}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:10}}>This week's summary</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
                      {days.map((d,i)=>(
                        <div key={i} onClick={()=>setAttDate(d.ds)} style={{borderRadius:10,padding:"10px 6px",textAlign:"center",cursor:"pointer",background:attDate===d.ds?GREEN:"#f9f9f9",border:"0.5px solid "+(attDate===d.ds?GREEN:"#e0e0e0")}}>
                          <div style={{fontSize:11,fontWeight:600,color:attDate===d.ds?"#fff":"#888",marginBottom:4}}>{d.dn}</div>
                          <div style={{fontSize:16,fontWeight:700,color:attDate===d.ds?"#fff":GREEN}}>{d.early}</div>
                          <div style={{fontSize:10,color:attDate===d.ds?"#cfffcc":"#888"}}>early</div>
                          {d.late>0&&<div style={{fontSize:10,color:attDate===d.ds?"#ffcccc":RED}}>{d.late} late</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Most missed athletes */}
              {(()=>{
                const thisMonth=new Date().toISOString().slice(0,7);
                const classDates=[...new Set(attendance.filter(r=>r.date&&r.date.startsWith(thisMonth)).map(r=>r.date))];
                if(!classDates.length)return null;
                const activeAthletes=athletes.filter(a=>a.status==="active");
                const missed=activeAthletes.map(a=>{
                  const attended=attendance.filter(r=>r.athlete_id===a.id&&r.date&&r.date.startsWith(thisMonth)).length;
                  return{name:a.name,missed:classDates.length-attended};
                }).filter(a=>a.missed>0).sort((a,b)=>b.missed-a.missed).slice(0,5);
                if(!missed.length)return null;
                return(
                  <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+RED}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:10}}>Most missed this month</div>
                    {missed.map((a,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<missed.length-1?"0.5px solid #f0f0f0":"none"}}>
                        <div style={{fontSize:13,color:"#1a1a1a"}}>{a.name}</div>
                        <div style={{fontSize:12,fontWeight:600,color:RED}}>{a.missed} missed</div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Date selector + attendance list */}
              <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0",borderTop:"3px solid "+GREEN}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a"}}>
                    {attDate===new Date().toISOString().split("T")[0]?"Today's attendance":attDate}
                  </div>
                  <input type="date" value={attDate} onChange={e=>setAttDate(e.target.value)} style={{padding:"4px 8px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a"}}/>
                </div>

                {/* Stats for selected day */}
                {(()=>{
                  const dayRecs=attendance.filter(r=>r.date===attDate);
                  const earlyN=dayRecs.filter(r=>r.status==="early").length;
                  const lateN=dayRecs.filter(r=>r.status==="late").length;
                  const totalActive=athletes.filter(a=>a.status==="active").length;
                  if(!dayRecs.length)return null;
                  return(
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
                      {[{l:"Early",v:earlyN,c:GREEN,bg:"#EAF3DE"},{l:"Late",v:lateN,c:RED,bg:"#FCEBEB"},{l:"Absent",v:totalActive-dayRecs.length,c:"#888",bg:"#f5f5f5"}].map(s=>(
                        <div key={s.l} style={{background:s.bg,borderRadius:10,padding:"10px",textAlign:"center"}}>
                          <div style={{fontSize:18,fontWeight:600,color:s.c}}>{s.v}</div>
                          <div style={{fontSize:11,color:"#888"}}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {athletes.filter(a=>a.status==="active").map(a=>{
                  const rec=attendance.find(r=>r.athlete_id===a.id&&r.date===attDate);
                  const lb=leaderboard.find(r=>r.athlete_id===a.id);
                  const streak=lb?.current_streak||0;
                  const isAbsent=!rec;
                  return(
                    <div key={a.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"0.5px solid #f0f0f0",background:isAbsent&&attDate===new Date().toISOString().split("T")[0]?"#fffbf0":"transparent",borderRadius:4,paddingLeft:isAbsent&&attDate===new Date().toISOString().split("T")[0]?6:0}}>
                      <div style={{width:34,height:34,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:500,color:"#fff",flexShrink:0,overflow:"hidden"}}>
                        {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(a.name||"?")[0]}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div style={{fontSize:13,fontWeight:500,color:"#1a1a1a"}}>{a.name}</div>
                          {streak>0&&<span style={{fontSize:10,color:GOLD}}>🔥 {streak}</span>}
                        </div>
                        {rec?.time_logged&&<div style={{fontSize:11,color:"#888"}}>{rec.time_logged}</div>}
                        {isAbsent&&attDate===new Date().toISOString().split("T")[0]&&<div style={{fontSize:11,color:"#854F0B"}}>⚠ Not checked in yet</div>}
                      </div>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        {rec?(
                          <span style={{fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:6,background:rec.status==="early"?"#EAF3DE":"#FCEBEB",color:rec.status==="early"?GREEN:RED}}>
                            {rec.status==="early"?"Early ✓":"Late"}
                          </span>
                        ):(
                          <div style={{display:"flex",gap:4}}>
                            <button onClick={async()=>{
                              const now=new Date();
                              const timeStr=now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
                              await supabase.from("attendance").insert({athlete_id:a.id,date:attDate,status:"early",time_logged:timeStr,day:new Date(attDate).toLocaleDateString("en-US",{weekday:"short"})});
                              const{data}=await supabase.from("attendance").select("*,athletes(name)").order("date",{ascending:false}).limit(200);
                              if(data)setAttendance(data);
                            }} style={{fontSize:11,padding:"3px 8px",borderRadius:6,border:"0.5px solid "+GREEN,background:"transparent",color:GREEN,cursor:"pointer",fontFamily:"Georgia,serif"}}>+ Early</button>
                            <button onClick={async()=>{
                              const now=new Date();
                              const timeStr=now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
                              await supabase.from("attendance").insert({athlete_id:a.id,date:attDate,status:"late",time_logged:timeStr,day:new Date(attDate).toLocaleDateString("en-US",{weekday:"short"})});
                              const{data}=await supabase.from("attendance").select("*,athletes(name)").order("date",{ascending:false}).limit(200);
                              if(data)setAttendance(data);
                            }} style={{fontSize:11,padding:"3px 8px",borderRadius:6,border:"0.5px solid "+RED,background:"transparent",color:RED,cursor:"pointer",fontFamily:"Georgia,serif"}}>+ Late</button>
                          </div>
                        )}
                      </div>
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
                <div style={{fontSize:12,color:"#888"}}>{weightLogs.length} total entries · {Object.keys(weightLogs.reduce((a,l)=>{a[l.athletes?.name||"?"]=1;return a;},{})).length} athletes</div>
              </div>
              {weightLogs.length===0&&<div style={{background:"#fff",borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid #e0e0e0"}}><div style={{fontSize:13,color:"#888"}}>No weight logs yet. Create the weight_log table in Supabase.</div></div>}
              {Object.entries(weightLogs.reduce((a,l)=>{const n=l.athletes?.name||"Unknown";if(!a[n])a[n]=[];a[n].push(l);return a;},{})).map(([name,entries],i)=>{
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
                      <div style={{flex:1,background:"#f9f9f9",borderRadius:8,padding:"8px",textAlign:"center"}}><div style={{fontSize:13,fontWeight:500}}>{first||"—"} lbs</div><div style={{fontSize:10,color:"#888"}}>Start</div></div>
                      <div style={{flex:1,background:"#f9f9f9",borderRadius:8,padding:"8px",textAlign:"center"}}><div style={{fontSize:13,fontWeight:500}}>{latest||"—"} lbs</div><div style={{fontSize:10,color:"#888"}}>Latest</div></div>
                      <div style={{flex:1,background:"#f9f9f9",borderRadius:8,padding:"8px",textAlign:"center"}}><div style={{fontSize:13,fontWeight:500}}>{entries.length}</div><div style={{fontSize:10,color:"#888"}}>Entries</div></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab==="photos"&&(
            <div>
              <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+STEEL}}>
                <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:4}}>📸 Athlete Photos</div>
                <div style={{fontSize:12,color:"#888"}}>Manage athlete profile photos — these show on the athlete photo wall.</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {athletes.filter(a=>a.status==="active").map((a,i)=>(
                  <div key={i} style={{background:"#fff",borderRadius:12,padding:"1rem",border:"0.5px solid #e0e0e0",textAlign:"center"}}>
                    <div style={{width:64,height:64,borderRadius:"50%",background:STEEL,margin:"0 auto 8px",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#fff"}}>
                      {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:a.name[0]}
                    </div>
                    <div style={{fontSize:12,fontWeight:500,color:"#1a1a1a",marginBottom:8}}>{a.name}</div>
                    <label style={{padding:"6px 12px",borderRadius:8,border:"0.5px solid #e0e0e0",background:"#f9f9f9",fontSize:11,cursor:"pointer",color:"#555",display:"inline-block"}}>
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
                <div style={{fontSize:12,color:"#888"}}>See who's using the app, setting goals, and writing notes.</div>
              </div>
              <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0"}}>
                <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:8,marginBottom:8,padding:"0 4px"}}>
                  <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.04em"}}>Athlete</div>
                  <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.04em",textAlign:"center"}}>Goals</div>
                  <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.04em",textAlign:"center"}}>Notes</div>
                  <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.04em",textAlign:"center"}}>Photo</div>
                </div>
                {engAthletes.map((a,i)=>{
                  const hasGoal=!!(a.athletic_goal||a.character_goal);
                  const noteCount=[1,2,3,4,5,6].filter(n=>a["mindset_note_"+n]).length;
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


          {tab==="anvil"&&(
            <div>
              <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+GOLD}}>
                <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Award this week's Anvil</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                  <div>
                    <div style={{fontSize:11,color:"#888",marginBottom:4}}>Athlete</div>
                    <select value={anvilWinner} onChange={e=>setAnvilWinner(e.target.value)} style={{width:"100%",padding:"8px",fontSize:13,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a"}}>
                      <option value="">Select athlete...</option>
                      {athletes.filter(a=>a.status==="active").map(a=><option key={a.id} value={a.name}>{a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{fontSize:11,color:"#888",marginBottom:4}}>Week / date</div>
                    <input value={anvilDate} onChange={e=>setAnvilDate(e.target.value)} placeholder="e.g. Week 1 · June 2" style={{width:"100%",padding:"8px",fontSize:13,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia, serif",boxSizing:"border-box"}}/>
                  </div>
                </div>
                <div style={{marginBottom:8}}>
                  <div style={{fontSize:11,color:"#888",marginBottom:4}}>Why they earned it</div>
                  <textarea value={anvilNote} onChange={e=>setAnvilNote(e.target.value)} placeholder="What did this person do that nobody else did this week?" style={{width:"100%",minHeight:70,padding:"8px",fontSize:13,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia, serif",resize:"vertical",boxSizing:"border-box"}}/>
                </div>
                <button onClick={awardAnvil} disabled={!anvilWinner} style={{width:"100%",padding:"12px",borderRadius:8,border:"none",background:anvilWinner?GOLD:"#e0e0e0",color:anvilWinner?"#1a1a1a":"#aaa",fontSize:14,fontWeight:600,cursor:anvilWinner?"pointer":"not-allowed",fontFamily:"Georgia, serif"}}>Award The Anvil →</button>
              </div>
              <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0"}}>
                <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Hall of Fame</div>
                {anvil.filter(a=>a.type==="individual").map((w,i)=>(
                  <div key={i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:"0.5px solid #f0f0f0",alignItems:"center"}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:i===0?"#1f1700":BG,border:"2px solid "+(i===0?GOLD:"#333"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:i===0?GOLD:"#666",fontWeight:600,flexShrink:0}}>{w.athlete_name[0]}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:500,color:i===0?GOLD:"#1a1a1a"}}>{w.athlete_name} {i===0&&"⚡"}</div>
                      <div style={{fontSize:11,color:"#888"}}>{w.date_awarded}</div>
                      {w.note&&<div style={{fontSize:12,color:"#aaa",fontStyle:"italic"}}>"{w.note}"</div>}
                    </div>
                    {i===0&&<span style={{fontSize:10,background:"#1f1700",color:GOLD,padding:"2px 7px",borderRadius:5}}>Current</span>}
                  </div>
                ))}
                {anvil.length===0&&<div style={{fontSize:13,color:"#aaa",textAlign:"center",padding:"16px 0"}}>No Anvil winners yet.</div>}
              </div>
            </div>
          )}

          {tab==="inbox"&&(
            <div>
              {injuries.length>0&&(
                <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+RED}}>
                  <div style={{fontSize:13,fontWeight:600,color:RED,marginBottom:10}}>Injury flags</div>
                  {injuries.map((item,i)=>(
                    <InboxItem key={i} item={item} color={RED} bg="#FCEBEB" type="injury" onReply={replyToInbox} onGenerate={(prompt,cb)=>generateReply(prompt,cb,"inj-"+item.id)} genLoading={genLoading} loadKey={"inj-"+item.id}/>
                  ))}
                </div>
              )}
              <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+PUR}}>
                <div style={{fontSize:13,fontWeight:600,color:PUR,marginBottom:10}}>Messages from athletes</div>
                {messages.length===0&&<div style={{fontSize:13,color:"#aaa"}}>No messages.</div>}
                {messages.map((item,i)=>(
                  <InboxItem key={i} item={item} color={PUR} bg="#EEEDFE" type="message" onReply={replyToInbox} onGenerate={(prompt,cb)=>generateReply(prompt,cb,"msg-"+item.id)} genLoading={genLoading} loadKey={"msg-"+item.id}/>
                ))}
              </div>
              <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0",borderTop:"3px solid "+GREEN}}>
                <div style={{fontSize:13,fontWeight:600,color:GREEN,marginBottom:10}}>Prayer requests</div>
                {prayers.length===0&&<div style={{fontSize:13,color:"#aaa"}}>No prayer requests.</div>}
                {prayers.map((item,i)=>(
                  <InboxItem key={i} item={item} color={GREEN} bg="#EAF3DE" type="prayer" onReply={replyToInbox} onGenerate={(prompt,cb)=>generateReply(prompt,cb,"pry-"+item.id)} genLoading={genLoading} loadKey={"pry-"+item.id}/>
                ))}
              </div>
            </div>
          )}

          {tab==="leaderboard"&&(
            <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0",borderTop:"3px solid "+GOLD}}>
              <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Summer leaderboard</div>
              {leaderboard.length===0&&<div style={{fontSize:13,color:"#aaa",textAlign:"center",padding:"16px 0"}}>No data yet. Leaderboard builds as athletes check in.</div>}
              {leaderboard.map((lb,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"0.5px solid #f0f0f0"}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:i===0?GOLD:i===1?"#aaa":i===2?"#CD7F32":"#f5f5f5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,color:i<3?"#fff":"#888",flexShrink:0}}>{i+1}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:500,color:"#1a1a1a"}}>{lb.athletes?.name}</div>
                    <div style={{display:"flex",gap:10,marginTop:2}}>
                      <span style={{fontSize:11,color:GREEN}}>🟢 {lb.early_count||0} early</span>
                      <span style={{fontSize:11,color:"#854F0B"}}>🔥 {lb.current_streak||0} streak</span>
                      <span style={{fontSize:11,color:GOLD}}>⚡ {lb.anvil_count||0} anvil</span>
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:11,color:RED}}>{lb.late_count||0} late</div>
                    <div style={{fontSize:11,color:"#aaa"}}>{lb.callout_count||0} callouts</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab==="goals"&&(
            <div>
              {athletes.filter(a=>a.status==="active").map(a=>(
                <div key={a.id} style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:10,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+(a.role==="forge"?RED:STEEL)}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:500,color:"#fff",flexShrink:0}}>{a.name[0]}</div>
                    <div><div style={{fontSize:14,fontWeight:600,color:"#1a1a1a"}}>{a.name}</div><div style={{fontSize:12,color:"#888"}}>{a.sport}</div></div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {[{label:"Athletic goal",goalKey:"athletic_goal",taskKey:"coach_athletic_task",type:"athletic",color:GREEN},{label:"Character goal",goalKey:"character_goal",taskKey:"coach_character_task",type:"character",color:PUR}].map(({label,goalKey,taskKey,type,color})=>(
                      <div key={goalKey}>
                        <div style={{fontSize:11,color:"#888",marginBottom:4}}>{label}</div>
                        <div style={{fontSize:12,color:"#1a1a1a",padding:"6px 8px",background:"#f9f9f9",borderRadius:6,minHeight:40,marginBottom:6}}>{a[goalKey]||<span style={{color:"#ccc"}}>Not set</span>}</div>
                       <textarea id={a.id+"-"+type} defaultValue={a[taskKey]||""} placeholder="Type your response or generate one..." style={{width:"100%",minHeight:70,padding:"8px",fontSize:12,border:"0.5px solid "+color,borderRadius:6,background:BG,color:"#fff",fontFamily:"Georgia,serif",resize:"vertical",boxSizing:"border-box",marginBottom:6}}/>
                        <div style={{display:"flex",gap:6,marginBottom:6}}>
                          <button onClick={()=>generateTask(a,type)} disabled={!a[goalKey]||genLoading===a.id+"-"+type} style={{flex:1,padding:"6px",borderRadius:6,border:"0.5px solid "+color,background:"transparent",color:color,fontSize:11,cursor:a[goalKey]?"pointer":"not-allowed",fontFamily:"Georgia,serif",opacity:a[goalKey]?1:0.4}}>
                            {genLoading===a.id+"-"+type?"Generating...":"Generate response"}
                          </button>
                          <button onClick={async()=>{const val=document.getElementById(a.id+"-"+type)?.value;if(val){await supabase.from("athletes").update({[taskKey]:val}).eq("id",a.id);alert("Sent to "+a.name+"!");}}} style={{flex:1,padding:"6px",borderRadius:6,border:"none",background:color,color:"#fff",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                            Send →
                          </button>
                        </div>
                        {a[taskKey]&&(
                          <div style={{padding:"8px",background:BG,borderRadius:6,borderLeft:"3px solid "+color}}>
                            <div style={{fontSize:10,color:color,marginBottom:3}}>Task from Coach Ant</div>
                            <div style={{fontSize:11,color:"#ccc",lineHeight:1.5}}>{a[taskKey]}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
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
