import { useState, useEffect } from "react";
import Head from "next/head";
import { supabase } from "../lib/supabase";

const BG="#0f0f0f";
const PUR="#534AB7";
const GOLD="#D4AF37";
const RED="#C0392B";
const STEEL="#708090";
const GREEN="#1E6B3A";

const CUTOFFS={Mon:{h:9,m:0},Tue:{h:9,m:30},Thu:{h:9,m:30},Fri:{h:9,m:0}};
const CLASS_DAYS=["Mon","Tue","Thu","Fri"];
const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

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

export default function Athlete(){
  const[athletes,setAthletes]=useState([]);
  const[announcement,setAnnouncement]=useState(null);
  const[anvilWinner,setAnvilWinner]=useState(null);
  const[screen,setScreen]=useState("roster");
  const[selectedAthlete,setSelectedAthlete]=useState(null);
  const[pin,setPin]=useState("");
  const[pinStep,setPinStep]=useState("enter");
  const[pinConfirm,setPinConfirm]=useState("");
  const[pinError,setPinError]=useState("");
  const[checkinInfo,setCheckinInfo]=useState(null);
  const[tab,setTab]=useState("profile");
  const[loading,setLoading]=useState(true);
  const[feedbackText,setFeedbackText]=useState("");
  const[feedbackSent,setFeedbackSent]=useState(false);
  const[prayerText,setPrayerText]=useState("");
  const[prayerSent,setPrayerSent]=useState(false);
  const[injuryOpen,setInjuryOpen]=useState(false);
  const[injuryText,setInjuryText]=useState("");
  const[injurySent,setInjurySent]=useState(false);
  const[attendance,setAttendance]=useState([]);
  const[streak,setStreak]=useState(0);

  useEffect(()=>{
    loadData();
  },[]);

  const loadData=async()=>{
    setLoading(true);
    const{data:aths}=await supabase.from("athletes").select("*").eq("status","active").order("name");
    if(aths)setAthletes(aths);
    const{data:ann}=await supabase.from("announcements").select("*").eq("active",true).order("created_at",{ascending:false}).limit(1);
    if(ann&&ann.length>0)setAnnouncement(ann[0]);
    const{data:anv}=await supabase.from("anvil").select("*").eq("type","individual").order("created_at",{ascending:false}).limit(1);
    if(anv&&anv.length>0)setAnvilWinner(anv[0]);
    setLoading(false);
  };

  const loadAttendance=async(athleteId)=>{
    const{data}=await supabase.from("attendance").select("*").eq("athlete_id",athleteId).order("date",{ascending:false});
    if(data)setAttendance(data);
    // Calculate streak
    let s=0;
    if(data){
      for(const rec of data){
        if(rec.status==="early")s++;
        else break;
      }
    }
    setStreak(s);
  };

  const doCheckin=async(athlete)=>{
    const now=new Date();
    const timeStr=now.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
    const today=DAYS[now.getDay()];
    if(!CLASS_DAYS.includes(today))return null;
    const cut=CUTOFFS[today]||{h:9,m:30};
    const late=now.getHours()>cut.h||(now.getHours()===cut.h&&now.getMinutes()>=cut.m);
    const status=late?"late":"early";
    // Check if already checked in today
    const today_date=now.toISOString().split("T")[0];
    const{data:existing}=await supabase.from("attendance").select("*").eq("athlete_id",athlete.id).eq("date",today_date);
    if(existing&&existing.length>0)return{status:existing[0].status,time:existing[0].time_logged,already:true};
    // Log attendance
    await supabase.from("attendance").insert({
      athlete_id:athlete.id,
      date:today_date,
      day:today,
      status,
      time_logged:timeStr,
    });
    // Update leaderboard
    const{data:lb}=await supabase.from("leaderboard").select("*").eq("athlete_id",athlete.id);
    if(lb&&lb.length>0){
      const updates={};
      if(status==="early"){updates.early_count=(lb[0].early_count||0)+1;updates.current_streak=(lb[0].current_streak||0)+1;if(updates.current_streak>(lb[0].best_streak||0))updates.best_streak=updates.current_streak;}
      else{updates.late_count=(lb[0].late_count||0)+1;updates.current_streak=0;}
      await supabase.from("leaderboard").update(updates).eq("athlete_id",athlete.id);
    } else {
      await supabase.from("leaderboard").insert({athlete_id:athlete.id,early_count:status==="early"?1:0,late_count:status==="late"?1:0,current_streak:status==="early"?1:0,best_streak:status==="early"?1:0});
    }
    return{status,time:timeStr};
  };

  const selectAthlete=async(a)=>{
    setSelectedAthlete(a);
    setPin("");setPinError("");setPinStep("enter");setPinConfirm("");
    setFeedbackText("");setFeedbackSent(false);
    setPrayerText("");setPrayerSent(false);
    setInjuryText("");setInjurySent(false);setInjuryOpen(false);
    setTab("profile");setScreen("login");
    await loadAttendance(a.id);
  };

  const submitPin=async()=>{
    if(pin.length<4)return;
    const saved=selectedAthlete.pin;
    if(!saved||saved===""){
      if(pinStep==="enter"){setPinConfirm(pin);setPin("");setPinStep("confirm");setPinError("");}
      else{
        if(pin===pinConfirm){
          await supabase.from("athletes").update({pin}).eq("id",selectedAthlete.id);
          setSelectedAthlete({...selectedAthlete,pin});
          const info=await doCheckin(selectedAthlete);
          setCheckinInfo(info);setPin("");setScreen("checkin");
        } else {setPinError("PINs don't match. Try again.");setPin("");setPinStep("enter");setPinConfirm("");}
      }
    } else {
      if(pin===saved){
        const info=await doCheckin(selectedAthlete);
        setCheckinInfo(info);setPin("");setScreen("checkin");setPinError("");
      } else {setPinError("Incorrect PIN. Try again.");setPin("");}
    }
  };

  useEffect(()=>{if(pin.length===4)submitPin();},[pin]);

  const sendFeedback=async()=>{
    if(!feedbackText.trim())return;
    await supabase.from("inbox").insert({athlete_id:selectedAthlete.id,type:"message",message:feedbackText});
    setFeedbackSent(true);
  };

  const sendPrayer=async()=>{
    if(!prayerText.trim())return;
    await supabase.from("inbox").insert({athlete_id:selectedAthlete.id,type:"prayer",message:prayerText});
    setPrayerSent(true);
  };

  const sendInjury=async()=>{
    if(!injuryText.trim())return;
    await supabase.from("athletes").update({injury:true,injury_note:injuryText}).eq("id",selectedAthlete.id);
    await supabase.from("inbox").insert({athlete_id:selectedAthlete.id,type:"injury",message:injuryText});
    setInjurySent(true);
  };

  const bracelet=BRACELETS.find(b=>b.ref===selectedAthlete?.bracelet);
  const isForge=selectedAthlete?.role==="forge";
  const thisWeekAtt=attendance.filter(a=>{
    const d=new Date(a.date);
    const now=new Date();
    const weekStart=new Date(now);
    weekStart.setDate(now.getDate()-now.getDay()+1);
    return d>=weekStart;
  });

  // ── LOADING ──
  if(loading) return(
    <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:32,marginBottom:16}}>⚒</div>
        <div style={{fontSize:14,color:"#555"}}>Loading...</div>
      </div>
    </div>
  );

  // ── ROSTER ──
  if(screen==="roster") return(
    <>
      <Head><title>TF College Group — Athlete</title></Head>
      <div style={{minHeight:"100vh",background:BG,fontFamily:"Georgia, serif",maxWidth:480,margin:"0 auto",padding:"3rem 1.5rem 2rem"}}>

        {/* Announcement banner */}
        {announcement&&(
          <div style={{background:"#1a1a2a",border:"0.5px solid "+PUR+"66",borderRadius:12,padding:"12px 16px",marginBottom:20}}>
            <div style={{fontSize:10,color:PUR,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>This week</div>
            <div style={{fontSize:13,color:"#fff",lineHeight:1.6}}>{announcement.message}</div>
          </div>
        )}

        {/* Anvil winner */}
        {anvilWinner&&(
          <div style={{background:"#1f1700",border:"0.5px solid "+GOLD+"44",borderRadius:12,padding:"12px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:GOLD,flexShrink:0}}/>
            <div>
              <div style={{fontSize:10,color:GOLD,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>This week's Anvil</div>
              <div style={{fontSize:14,fontWeight:500,color:GOLD}}>{anvilWinner.athlete_name}</div>
              {anvilWinner.note&&<div style={{fontSize:11,color:"#888",fontStyle:"italic",marginTop:2}}>"{anvilWinner.note}"</div>}
            </div>
          </div>
        )}

        <div style={{textAlign:"center",marginBottom:"2rem"}}>
          <div style={{width:60,height:60,borderRadius:16,background:PUR,margin:"0 auto 1rem",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>⚒</div>
          <div style={{fontSize:22,fontWeight:400,color:"#fff",marginBottom:4}}>TF College Group</div>
          <div style={{fontSize:13,color:"#888"}}>Select your name to sign in</div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
          {athletes.filter(a=>a.name!=="Anthony LaRusso"||a.role==="iron").map(a=>(
            <button key={a.id} onClick={()=>selectAthlete(a)} style={{width:"100%",padding:"14px 18px",borderRadius:12,border:"0.5px solid #2a2a2a",background:"#141414",color:"#fff",fontSize:14,fontWeight:500,cursor:"pointer",fontFamily:"Georgia, serif",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:500,color:"#fff",flexShrink:0}}>{a.name[0]}</div>
                <div style={{textAlign:"left"}}>
                  <div style={{fontSize:14,fontWeight:500}}>{a.name}</div>
                  <div style={{fontSize:12,color:"#888"}}>{a.sport}</div>
                </div>
              </div>
              <div style={{fontSize:12,color:a.role==="forge"?RED:STEEL,fontWeight:500}}>{a.role==="forge"?"The Forge":"The Iron"}</div>
            </button>
          ))}
        </div>
        <div style={{textAlign:"center",fontSize:12,color:"#444"}}>Proverbs 27:17 — Iron sharpens iron</div>
      </div>
    </>
  );

  // ── LOGIN ──
  if(screen==="login") return(
    <>
      <Head><title>Sign In — TF College Group</title></Head>
      <div style={{minHeight:"100vh",background:BG,fontFamily:"Georgia, serif",maxWidth:480,margin:"0 auto",padding:"3rem 1.5rem 2rem",textAlign:"center",position:"relative"}}>
        <button onClick={()=>setScreen("roster")} style={{position:"absolute",top:20,left:20,background:"transparent",border:"none",color:"#666",fontSize:13,cursor:"pointer",fontFamily:"Georgia, serif"}}>← Back</button>
        <div style={{width:48,height:48,borderRadius:"50%",background:isForge?RED:STEEL,margin:"0 auto 1rem",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:500,color:"#fff"}}>{selectedAthlete?.name[0]}</div>
        <div style={{fontSize:18,fontWeight:400,color:"#fff",marginBottom:6}}>{!selectedAthlete?.pin?`Hey ${selectedAthlete?.name.split(" ")[0]}, create your passcode`:pinStep==="confirm"?"Confirm your passcode":`Welcome back, ${selectedAthlete?.name.split(" ")[0]}`}</div>
        <div style={{fontSize:13,color:"#888",marginBottom:"2.5rem"}}>{!selectedAthlete?.pin?"You'll use this every time you sign in.":pinStep==="confirm"?"Enter the same 4 digits again.":"Enter your 4-digit passcode."}</div>
        {/* PIN dots */}
        <div style={{display:"flex",justifyContent:"center",gap:14,marginBottom:28}}>
          {[0,1,2,3].map(i=><div key={i} style={{width:14,height:14,borderRadius:"50%",border:"2px solid "+PUR,background:i<pin.length?PUR:"transparent"}}/>)}
        </div>
        {/* PIN pad */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,maxWidth:240,margin:"0 auto"}}>
          {[1,2,3,4,5,6,7,8,9,null,0,"⌫"].map((k,i)=>(
            <button key={i} onClick={()=>{
              if(k===null)return;
              if(k==="⌫"){setPin(p=>p.slice(0,-1));return;}
              if(pin.length<4)setPin(p=>p+String(k));
            }} style={{padding:"16px",borderRadius:12,border:"0.5px solid "+(k===null?"transparent":"#333"),background:k===null?"transparent":"#141414",fontSize:20,fontWeight:500,cursor:k===null?"default":"pointer",color:"#fff",fontFamily:"Georgia, serif"}}>
              {k===null?"":k}
            </button>
          ))}
        </div>
        {pinError&&<div style={{marginTop:14,fontSize:13,color:"#E24B4A"}}>{pinError}</div>}
      </div>
    </>
  );

  // ── CHECK-IN ──
  if(screen==="checkin"){
    const isLate=checkinInfo?.status==="late";
    const noClass=!checkinInfo;
    const alreadyIn=checkinInfo?.already;
    return(
      <>
        <Head><title>Check In — TF College Group</title></Head>
        <div style={{minHeight:"100vh",background:BG,fontFamily:"Georgia, serif",maxWidth:480,margin:"0 auto",padding:"3rem 1.5rem 2rem",textAlign:"center"}}>
          <div style={{width:70,height:70,borderRadius:"50%",background:noClass?"#333":alreadyIn?PUR:isLate?RED:GREEN,margin:"0 auto 1.5rem",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>
            {noClass?"📅":alreadyIn?"✓":isLate?"⚠":"✓"}
          </div>
          <div style={{fontSize:22,fontWeight:400,color:"#fff",marginBottom:6}}>
            {noClass?"No class today":alreadyIn?"Already checked in":isLate?"You're late.":"You're in early."}
          </div>
          {checkinInfo&&<div style={{fontSize:14,color:"#888",marginBottom:16}}>Signed in at {checkinInfo.time}</div>}
          {streak>0&&!noClass&&(
            <div style={{padding:"10px 16px",borderRadius:10,background:"#1a1f1a",border:"0.5px solid "+GREEN+"44",marginBottom:16,display:"inline-block"}}>
              <div style={{fontSize:13,color:GREEN}}>🔥 {streak} day early streak</div>
            </div>
          )}
          {!noClass&&!alreadyIn&&(
            <div style={{padding:"14px 16px",borderRadius:10,border:"0.5px solid "+(isLate?"#E24B4A":GREEN),background:isLate?"#2a0a0a":"#0a1f0a",marginBottom:24,textAlign:"left"}}>
              {isLate?(<><div style={{fontSize:13,fontWeight:500,color:"#E24B4A",marginBottom:6}}>On time is late. Early is the only standard.</div><div style={{fontSize:13,color:"#aaa",lineHeight:1.6}}>Consequence: <span style={{color:"#E24B4A",fontWeight:500}}>50 crunches upon arrival.</span> See Coach Ant before joining the group.</div></>)
              :(<><div style={{fontSize:13,fontWeight:500,color:"#58B368",marginBottom:6}}>That's the standard. Keep setting it.</div><div style={{fontSize:13,color:"#aaa",lineHeight:1.6}}>Early is the only acceptable arrival. You're setting the tone for everyone else.</div></>)}
            </div>
          )}
          <button onClick={()=>{setScreen("profile");setTab("profile");}} style={{width:"100%",padding:"14px",borderRadius:10,border:"none",background:PUR,color:"#fff",fontSize:15,fontWeight:500,cursor:"pointer",fontFamily:"Georgia, serif"}}>
            Go to my profile →
          </button>
        </div>
      </>
    );
  }

  // ── PROFILE ──
  if(screen==="profile"&&selectedAthlete){
    const TABS=[
      {id:"profile",label:"My profile"},
      ...(isForge?[{id:"draft",label:"Draft"}]:[{id:"mygroup",label:"My group"}]),
      {id:"journey",label:"The journey"},
      {id:"attendance",label:"Attendance"},
      {id:"private",label:"Private"},
    ];

    return(
      <>
        <Head><title>{selectedAthlete.name} — TF College Group</title></Head>
        <div style={{minHeight:"100vh",background:"#f5f5f5",fontFamily:"Georgia, serif",maxWidth:480,margin:"0 auto"}}>
          {/* Header */}
          <div style={{background:BG,padding:"1rem 1.25rem 0"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <button onClick={()=>setScreen("roster")} style={{background:"transparent",border:"none",color:"#666",fontSize:13,cursor:"pointer",fontFamily:"Georgia, serif"}}>← Sign out</button>
              <div style={{fontSize:12,color:"#555"}}>TF College Group</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
              <div style={{width:50,height:50,borderRadius:"50%",background:isForge?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:500,color:"#fff",flexShrink:0}}>{selectedAthlete.name[0]}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:18,fontWeight:400,color:"#fff"}}>{selectedAthlete.name}</div>
                <div style={{fontSize:12,color:"#888"}}>{selectedAthlete.sport}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:11,fontWeight:500,color:isForge?RED:STEEL,textTransform:"uppercase",letterSpacing:"0.06em"}}>{isForge?"The Forge":"The Iron"}</div>
                {streak>0&&<div style={{fontSize:11,color:GREEN,marginTop:2}}>🔥 {streak} day streak</div>}
              </div>
            </div>
            <div style={{display:"flex",overflowX:"auto"}}>
              {TABS.map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 14px",background:"transparent",border:"none",borderBottom:"2px solid "+(tab===t.id?"#fff":"transparent"),color:tab===t.id?"#fff":"#555",fontSize:13,fontWeight:tab===t.id?500:400,cursor:"pointer",fontFamily:"Georgia, serif",whiteSpace:"nowrap"}}>{t.label}</button>
              ))}
            </div>
          </div>

          <div style={{padding:"1.25rem"}}>

            {/* MY PROFILE */}
            {tab==="profile"&&(
              <div>
                {/* Announcement */}
                {announcement&&(
                  <div style={{background:"#1a1a2a",border:"0.5px solid "+PUR+"66",borderRadius:12,padding:"12px 16px",marginBottom:12}}>
                    <div style={{fontSize:10,color:PUR,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>This week from Coach Ant</div>
                    <div style={{fontSize:13,color:"#fff",lineHeight:1.6}}>{announcement.message}</div>
                  </div>
                )}

                {/* Bracelet verse */}
                {bracelet&&(
                  <div style={{background:BG,borderRadius:12,padding:"1rem",marginBottom:12,border:"0.5px solid "+bracelet.hex+"44"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <div style={{width:10,height:10,borderRadius:"50%",background:bracelet.hex}}/>
                      <span style={{fontSize:11,fontWeight:500,color:bracelet.hex,textTransform:"uppercase",letterSpacing:"0.05em"}}>{bracelet.color} · {bracelet.ref}</span>
                    </div>
                    <div style={{fontSize:14,color:"#fff",fontStyle:"italic",lineHeight:1.7}}>"{bracelet.text}"</div>
                    <div style={{fontSize:11,color:"#555",marginTop:6}}>Your verse for the week — carry it with you.</div>
                  </div>
                )}

                {/* Streak card */}
                {streak>0&&(
                  <div style={{background:"#0a1f0a",borderRadius:12,padding:"12px 16px",marginBottom:12,border:"0.5px solid "+GREEN+"44",display:"flex",alignItems:"center",gap:12}}>
                    <div style={{fontSize:28}}>🔥</div>
                    <div>
                      <div style={{fontSize:16,fontWeight:500,color:GREEN}}>{streak} day early streak</div>
                      <div style={{fontSize:12,color:"#888"}}>Keep showing up early. Don't break it.</div>
                    </div>
                  </div>
                )}

                {/* Anvil winner */}
                {anvilWinner&&(
                  <div style={{background:"#1f1700",borderRadius:12,padding:"12px 16px",marginBottom:12,border:"0.5px solid "+GOLD+"44",display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:GOLD,flexShrink:0}}/>
                    <div>
                      <div style={{fontSize:10,color:GOLD,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>This week's Anvil</div>
                      <div style={{fontSize:14,fontWeight:500,color:GOLD}}>{anvilWinner.athlete_name}</div>
                      {anvilWinner.note&&<div style={{fontSize:11,color:"#888",fontStyle:"italic",marginTop:2}}>"{anvilWinner.note}"</div>}
                    </div>
                  </div>
                )}

                {/* Goals */}
                {[{label:"Athletic goal",goalKey:"athletic_goal",taskKey:"coach_athletic_task",color:GREEN},{label:"Character goal",goalKey:"character_goal",taskKey:"coach_character_task",color:PUR}].map(({label,goalKey,taskKey,color})=>(
                  <div key={goalKey} style={{background:"#fff",borderRadius:12,padding:"1rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
                    <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>{label}</div>
                    <textarea
                      value={selectedAthlete[goalKey]||""}
                      onChange={async e=>{
                        const val=e.target.value;
                        setSelectedAthlete(a=>({...a,[goalKey]:val}));
                        await supabase.from("athletes").update({[goalKey]:val}).eq("id",selectedAthlete.id);
                      }}
                      placeholder="What's one thing you want to improve this summer?"
                      style={{width:"100%",minHeight:60,padding:"8px",fontSize:13,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia, serif",resize:"vertical",boxSizing:"border-box"}}
                    />
                    {selectedAthlete[taskKey]&&(
                      <div style={{marginTop:10,padding:"10px 12px",background:BG,borderRadius:8,borderLeft:"3px solid "+color}}>
                        <div style={{fontSize:11,fontWeight:500,color:color,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5}}>Task from Coach Ant</div>
                        <div style={{fontSize:13,color:"#ccc",lineHeight:1.6}}>{selectedAthlete[taskKey]}</div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Polar placeholder */}
                <div style={{background:"#fff",borderRadius:12,padding:"1rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
                  <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Polar — heart rate & training data</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {[{label:"Avg HR",val:"—"},{label:"Calories",val:"—"},{label:"Training load",val:"—"},{label:"Active time",val:"—"}].map(s=>(
                      <div key={s.label} style={{background:"#f5f5f5",borderRadius:8,padding:"10px",textAlign:"center"}}>
                        <div style={{fontSize:18,fontWeight:500,color:"#ccc"}}>{s.val}</div>
                        <div style={{fontSize:11,color:"#aaa",marginTop:2}}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{fontSize:11,color:"#aaa",marginTop:8,textAlign:"center"}}>Polar sync coming soon — connecting automatically</div>
                </div>

                {/* Vitruve */}
                <div style={{background:"#fff",borderRadius:12,padding:"1rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
                  <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Vitruve — lift velocity & power</div>
                  <div style={{fontSize:11,color:"#aaa",textAlign:"center",padding:"10px 0"}}>Vitruve sync coming soon</div>
                </div>

                {/* Injury */}
                <div style={{background:"#fff",borderRadius:12,border:"0.5px solid #e0e0e0",overflow:"hidden",marginBottom:12}}>
                  <button onClick={()=>setInjuryOpen(o=>!o)} style={{width:"100%",padding:"12px 16px",background:"transparent",border:"none",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",fontFamily:"Georgia, serif"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:selectedAthlete.injury?RED:GREEN}}/>
                      <span style={{fontSize:13,fontWeight:500,color:"#1a1a1a"}}>Injury / health update</span>
                    </div>
                    <span style={{fontSize:12,color:"#888"}}>{injuryOpen?"▲":"▼"}</span>
                  </button>
                  {injuryOpen&&(
                    <div style={{padding:"0 16px 16px"}}>
                      <div style={{fontSize:12,color:"#888",marginBottom:10}}>Let Coach Ant know before it becomes a bigger issue.</div>
                      <textarea value={injuryText} onChange={e=>setInjuryText(e.target.value)} placeholder="What's going on — what hurts, when it started, how it feels..." style={{width:"100%",minHeight:80,padding:"8px",fontSize:13,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia, serif",resize:"vertical",marginBottom:8,boxSizing:"border-box"}}/>
                      {injurySent?<div style={{fontSize:13,color:GREEN,fontWeight:500,padding:"8px 10px",background:"#EAF3DE",borderRadius:8}}>Coach Ant has been notified.</div>
                      :<button onClick={sendInjury} style={{padding:"8px 16px",borderRadius:8,border:"0.5px solid "+RED,background:"transparent",color:RED,fontSize:13,cursor:"pointer",fontFamily:"Georgia, serif"}}>Notify Coach Ant</button>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MY GROUP */}
            {tab==="mygroup"&&!isForge&&(
              <div style={{background:BG,borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid #222"}}>
                <div style={{fontSize:32,marginBottom:12}}>⏳</div>
                <div style={{fontSize:16,fontWeight:400,color:"#fff",marginBottom:8}}>Draft pending...</div>
                <div style={{fontSize:13,color:"#555",lineHeight:1.7}}>The Forge leaders are selecting their bracelets and building their groups. Check back soon — you'll see your group, leader, bracelet verse, and tier right here once you've been picked.</div>
              </div>
            )}

            {/* THE JOURNEY */}
            {tab==="journey"&&(
              <div>
                <div style={{background:BG,borderRadius:12,padding:"1.25rem",marginBottom:12,textAlign:"center"}}>
                  <div style={{fontSize:11,fontWeight:500,color:"#555",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>The foundation</div>
                  <div style={{fontSize:15,color:"#ccc",fontStyle:"italic",lineHeight:1.7}}>"As iron sharpens iron, so one person sharpens another."</div>
                  <div style={{fontSize:12,color:"#444",marginTop:6}}>— Proverbs 27:17</div>
                </div>
                {[
                  {title:"The Iron",color:STEEL,bg:"#1a1e20",border:"#2a3035",isYou:!isForge,body:"Every athlete enters as The Iron. Raw. Unfinished. Full of potential but not yet fully shaped. The Iron shows up, does the work, and gets sharpened by the people around them. Being Iron is not lesser — it is the beginning of everything.",call:"Show up early. Work hard. Hold the standard. Push the person next to you. Be coachable."},
                  {title:"The Forge",color:RED,bg:"#200a0a",border:"#5a1a1a",isYou:isForge,body:"The Forge is called up for the week. They set the pace, lead the group, hold the standard. Being chosen as the Forge is not a reward — it's a responsibility.",call:"Lead by example before you lead by voice. The Forge does not finish until everyone finishes."},
                  {title:"The Anvil",color:GOLD,bg:"#1f1700",border:"#5a4500",isYou:false,body:"The Anvil is the highest individual honor in TF College Group. It cannot be drafted. It can only be earned — by The Forge or The Iron. Awarded each Friday to the one athlete who held everything together that week.",call:"You do not chase the Anvil. You become the kind of person who earns it — and one week, it finds you."},
                ].map((item,i)=>(
                  <div key={i} style={{background:item.bg,borderRadius:12,padding:"1.25rem",marginBottom:10,border:"0.5px solid "+item.border}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                      <div style={{width:10,height:10,borderRadius:"50%",background:item.color,flexShrink:0}}/>
                      <div style={{fontSize:18,fontWeight:400,color:item.color}}>{item.title}</div>
                      {item.isYou&&<span style={{fontSize:11,background:item.color,color:"#1a1a1a",padding:"2px 8px",borderRadius:5,fontWeight:500}}>You are here</span>}
                      {item.title==="The Anvil"&&<span style={{fontSize:11,background:"#2a2a2a",color:"#666",padding:"2px 8px",borderRadius:5}}>Open to all</span>}
                    </div>
                    <div style={{fontSize:13,color:"#999",lineHeight:1.75,marginBottom:10}}>{item.body}</div>
                    <div style={{fontSize:12,color:item.color,fontStyle:"italic",lineHeight:1.6}}>{item.call}</div>
                  </div>
                ))}
              </div>
            )}

            {/* ATTENDANCE */}
            {tab==="attendance"&&(
              <div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
                  {[
                    {label:"Early",count:attendance.filter(a=>a.status==="early").length,bg:"#EAF3DE",color:GREEN},
                    {label:"Late",count:attendance.filter(a=>a.status==="late").length,bg:"#FCEBEB",color:"#E24B4A"},
                    {label:"No shows",count:attendance.filter(a=>a.status==="noshow"||a.status==="noshow_explained").length,bg:"#FAEEDA",color:"#854F0B"},
                  ].map(s=>(
                    <div key={s.label} style={{background:s.bg,borderRadius:10,padding:"12px",textAlign:"center"}}>
                      <div style={{fontSize:24,fontWeight:500,color:s.color}}>{s.count}</div>
                      <div style={{fontSize:11,color:s.color,marginTop:2}}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {streak>0&&(
                  <div style={{background:"#0a1f0a",borderRadius:12,padding:"12px 16px",marginBottom:12,border:"0.5px solid "+GREEN+"44",display:"flex",alignItems:"center",gap:12}}>
                    <div style={{fontSize:24}}>🔥</div>
                    <div>
                      <div style={{fontSize:15,fontWeight:500,color:GREEN}}>{streak} day early streak</div>
                      <div style={{fontSize:12,color:"#888"}}>Keep it going. Don't break the chain.</div>
                    </div>
                  </div>
                )}
                <div style={{background:"#fff",borderRadius:12,padding:"1rem",border:"0.5px solid #e0e0e0"}}>
                  <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Full history</div>
                  {attendance.length===0&&<div style={{fontSize:13,color:"#aaa",textAlign:"center",padding:"10px 0"}}>No attendance logged yet.</div>}
                  {attendance.map((rec,i)=>(
                    <div key={i} style={{padding:"10px 0",borderBottom:"0.5px solid #f0f0f0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:500,color:"#1a1a1a"}}>{rec.day} · {rec.date}</div>
                        {rec.time_logged&&<div style={{fontSize:11,color:"#888"}}>{rec.time_logged}</div>}
                      </div>
                      <span style={{fontSize:11,fontWeight:500,padding:"2px 10px",borderRadius:6,background:rec.status==="early"?"#EAF3DE":rec.status==="late"?"#FCEBEB":"#FAEEDA",color:rec.status==="early"?GREEN:rec.status==="late"?"#E24B4A":"#854F0B"}}>{rec.status==="early"?"Early":rec.status==="late"?"Late":"No show"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PRIVATE */}
            {tab==="private"&&(
              <div>
                <div style={{fontSize:13,color:"#888",lineHeight:1.7,marginBottom:14}}>This is your private line to Coach Ant. Nobody else sees what you send here.</div>
                <div style={{background:"#fff",borderRadius:12,padding:"1rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
                  <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>Message Coach Ant</div>
                  <div style={{fontSize:12,color:"#aaa",marginBottom:10}}>Struggling with something? Need to talk? Something on your mind?</div>
                  {feedbackSent?<div style={{fontSize:13,color:GREEN,fontWeight:500,padding:"10px",background:"#EAF3DE",borderRadius:8}}>Message sent to Coach Ant. He will reach out to you directly.</div>:(
                    <><textarea value={feedbackText} onChange={e=>setFeedbackText(e.target.value)} placeholder="Type your message to Coach Ant..." style={{width:"100%",minHeight:90,padding:"8px",fontSize:13,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia, serif",resize:"vertical",marginBottom:8,boxSizing:"border-box"}}/><button onClick={sendFeedback} style={{padding:"10px 20px",borderRadius:8,border:"none",background:PUR,color:"#fff",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"Georgia, serif"}}>Send to Coach Ant</button></>
                  )}
                </div>
                <div style={{background:BG,borderRadius:12,padding:"1rem",border:"0.5px solid #2a2a2a"}}>
                  <div style={{fontSize:13,fontWeight:500,color:"#fff",marginBottom:4}}>Prayer request</div>
                  <div style={{fontSize:12,color:"#666",marginBottom:10}}>Share what's on your heart. Private, between you and Coach Ant.</div>
                  {prayerSent?<div style={{fontSize:13,color:"#58B368",fontWeight:500,padding:"10px",background:"#0d1f0f",borderRadius:8}}>Your request has been received. You are being prayed for.</div>:(
                    <><textarea value={prayerText} onChange={e=>setPrayerText(e.target.value)} placeholder="Share your prayer request here..." style={{width:"100%",minHeight:90,padding:"8px",fontSize:13,border:"0.5px solid #333",borderRadius:8,background:"#242424",color:"#fff",fontFamily:"Georgia, serif",resize:"vertical",marginBottom:8,boxSizing:"border-box"}}/><button onClick={sendPrayer} style={{padding:"10px 20px",borderRadius:8,border:"0.5px solid #58B368",background:"transparent",color:"#58B368",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"Georgia, serif"}}>Submit prayer request</button></>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }
  return null;
}
