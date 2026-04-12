import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { supabase } from "../lib/supabase";

const BG="#0f0f0f";
const PUR="#534AB7";
const GOLD="#D4AF37";
const RED="#C0392B";
const STEEL="#708090";
const GREEN="#1E6B3A";
const LC=["#534AB7","#0F6E56","#854F0B","#993556"];
const LB=["#EEEDFE","#E1F5EE","#FAEEDA","#FBEAF0"];

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

const TIER_COLORS={
  1:{bg:"#EEEDFE",border:"#534AB7",color:"#3C3489",label:"Tier 1"},
  2:{bg:"#E1F5EE",border:"#0F6E56",color:"#085041",label:"Tier 2"},
  3:{bg:"#FAEEDA",border:"#854F0B",color:"#633806",label:"Tier 3"},
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
function VitruveData({athleteId}){
  const[data,setData]=useState(null);
  useEffect(()=>{
    fetch("/api/vitruve?athleteId="+athleteId).then(r=>r.json()).then(setData);
  },[athleteId]);
  return(
    <div style={{background:"#fff",borderRadius:12,padding:"1rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
      <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Vitruve — velocity based training</div>
      {!data&&<div style={{fontSize:12,color:"#aaa",textAlign:"center",padding:"8px 0"}}>Loading...</div>}
      {data?.noData&&<div style={{fontSize:12,color:"#aaa",textAlign:"center",padding:"8px 0"}}>No sessions yet — sync after your next lift</div>}
      {data?.error&&<div style={{fontSize:12,color:"#aaa",textAlign:"center",padding:"8px 0"}}>Vitruve connecting...</div>}
      {data?.connected&&(
        <div>
          <div style={{fontSize:11,color:"#1E6B3A",marginBottom:8}}>✓ Connected · {data.exercise||"Last session"} · {data.date||""}</div>
          {(data.sets||[]).slice(0,5).map((s,i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6,marginBottom:6,padding:"8px",background:"#f9f9f9",borderRadius:8}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:14,fontWeight:500,color:"#1a1a1a"}}>{s.load||"—"}</div>
                <div style={{fontSize:10,color:"#888"}}>kg</div>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:14,fontWeight:500,color:"#534AB7"}}>{s.peakVelocity||"—"}</div>
                <div style={{fontSize:10,color:"#888"}}>peak m/s</div>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:14,fontWeight:500,color:"#0F6E56"}}>{s.meanVelocity||"—"}</div>
                <div style={{fontSize:10,color:"#888"}}>mean m/s</div>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:14,fontWeight:500,color:"#1a1a1a"}}>{s.reps||"—"}</div>
                <div style={{fontSize:10,color:"#888"}}>reps</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function PolarData({token}){
  const[data,setData]=useState(null);
  useEffect(()=>{
    fetch("/api/polar?token="+token).then(r=>r.json()).then(setData);
  },[token]);
  if(!data)return<div style={{fontSize:12,color:"#aaa",textAlign:"center",padding:"8px 0"}}>Loading Polar data...</div>;
  if(data.noData)return<div style={{fontSize:12,color:"#58B368",textAlign:"center",padding:"8px 0"}}>✓ Polar connected — sync after your next workout</div>;
  if(data.error)return<div style={{fontSize:12,color:"#58B368",textAlign:"center",padding:"8px 0"}}>✓ Polar connected</div>;
  return(
    <div>
      <div style={{fontSize:11,color:"#58B368",marginBottom:8}}>✓ Connected · Last session: {data.date||"—"}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {[
          {label:"Avg HR",val:data.avgHr?data.avgHr+" bpm":"—"},
          {label:"Max HR",val:data.maxHr?data.maxHr+" bpm":"—"},
          {label:"Calories",val:data.calories?data.calories+" kcal":"—"},
          {label:"Duration",val:data.duration||"—"},
        ].map(s=>(
          <div key={s.label} style={{background:"#f5f5f5",borderRadius:8,padding:"10px",textAlign:"center"}}>
            <div style={{fontSize:16,fontWeight:500,color:"#1a1a1a"}}>{s.val}</div>
            <div style={{fontSize:11,color:"#888",marginTop:2}}>{s.label}</div>
          </div>
               ))}
      </div>
      {(data.zone1||data.zone2||data.zone3||data.zone4||data.zone5)&&(
        <div style={{background:"#f9f9f9",borderRadius:8,padding:"10px",border:"0.5px solid #e0e0e0",marginTop:10}}>
          <div style={{fontSize:11,color:"#888",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.04em"}}>Heart rate zones</div>
          {[
            {z:"Z1",val:data.zone1,color:"#5BBFEA"},
            {z:"Z2",val:data.zone2,color:"#1E6B3A"},
            {z:"Z3",val:data.zone3,color:"#D4AF37"},
            {z:"Z4",val:data.zone4,color:"#C0392B"},
            {z:"Z5",val:data.zone5,color:"#5B2D8E"},
          ].map(z=>{
            const total=(data.zone1||0)+(data.zone2||0)+(data.zone3||0)+(data.zone4||0)+(data.zone5||0);
            const pct=total>0?Math.round((z.val||0)/total*100):0;
            const mins=z.val?Math.round(z.val/60)+"m":"—";
            return(
              <div key={z.z} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <div style={{fontSize:11,color:"#888",width:24}}>{z.z}</div>
                <div style={{flex:1,background:"#e0e0e0",borderRadius:4,height:8,overflow:"hidden"}}>
                  <div style={{width:pct+"%",height:"100%",background:z.color,borderRadius:4}}/>
                </div>
                <div style={{fontSize:11,color:"#888",width:28,textAlign:"right"}}>{mins}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
function CountdownPicker({onTimeout}){
  const[timeLeft,setTimeLeft]=useState(10);
  useEffect(()=>{
    if(timeLeft<=0){onTimeout();return;}
    const t=setTimeout(()=>setTimeLeft(p=>p-1),1000);
    return()=>clearTimeout(t);
  },[timeLeft,onTimeout]);
  return(
    <div style={{background:"#C0392B",borderRadius:12,padding:"1rem",marginBottom:12,textAlign:"center"}}>
      <div style={{fontSize:11,color:"#fff",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Your turn to pick!</div>
      <div style={{fontSize:48,fontWeight:700,color:timeLeft<=3?"#ffcccc":"#fff",lineHeight:1}}>{timeLeft}</div>
      <div style={{fontSize:12,color:"rgba(255,255,255,0.7)",marginTop:4}}>{timeLeft<=3?"Picking automatically...":"seconds to pick"}</div>
    </div>
  );
}

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
  const[draft,setDraft]=useState(null);
  const pollRef=useRef(null);

  useEffect(()=>{loadData();},[]);

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

  const loadDraft=async()=>{
    const{data}=await supabase.from("draft").select("*").order("created_at",{ascending:false}).limit(1);
    if(data&&data.length>0)setDraft(data[0]);
    else setDraft(null);
  };

  const loadAttendance=async(athleteId)=>{
    const{data}=await supabase.from("attendance").select("*").eq("athlete_id",athleteId).order("date",{ascending:false});
    if(data)setAttendance(data);
    let s=0;
    if(data){for(const rec of data){if(rec.status==="early")s++;else break;}}
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
    const today_date=now.toISOString().split("T")[0];
    const{data:existing}=await supabase.from("attendance").select("*").eq("athlete_id",athlete.id).eq("date",today_date);
    if(existing&&existing.length>0)return{status:existing[0].status,time:existing[0].time_logged,already:true};
    await supabase.from("attendance").insert({athlete_id:athlete.id,date:today_date,day:today,status,time_logged:timeStr});
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
    await loadDraft();
  };

  const submitPin=async()=>{
    if(pin.length<4)return;
    const saved=selectedAthlete.pin;
    if(!saved||saved===""||saved===null){
      if(pinStep==="enter"){setPinConfirm(pin);setPin("");setPinStep("confirm");setPinError("");}
      else{
        if(pin===pinConfirm){
          await supabase.from("athletes").update({pin}).eq("id",selectedAthlete.id);
          setSelectedAthlete({...selectedAthlete,pin});
          const info=await doCheckin({...selectedAthlete,pin});
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

  useEffect(()=>{
    if(screen==="profile"&&(tab==="draft"||tab==="mygroup")){
      pollRef.current=setInterval(loadDraft,3000);
      return()=>clearInterval(pollRef.current);
    }
    return()=>clearInterval(pollRef.current);
  },[screen,tab]);

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

  if(loading)return(
    <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}><div style={{fontSize:32,marginBottom:16}}>⚒</div><div style={{fontSize:14,color:"#555"}}>Loading...</div></div>
    </div>
  );

  if(screen==="roster")return(
    <>
      <Head><title>TF College Group — Athlete</title></Head>
      <div style={{minHeight:"100vh",background:BG,fontFamily:"Georgia, serif",maxWidth:480,margin:"0 auto",padding:"3rem 1.5rem 2rem"}}>
        {announcement&&(
          <div style={{background:"#1a1a2a",border:"0.5px solid "+PUR+"66",borderRadius:12,padding:"12px 16px",marginBottom:20}}>
            <div style={{fontSize:10,color:PUR,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>This week</div>
            <div style={{fontSize:13,color:"#fff",lineHeight:1.6}}>{announcement.message}</div>
          </div>
        )}
        {anvilWinner&&(
          <div style={{background:"#1f1700",border:"0.5px solid "+GOLD+"44",borderRadius:12,padding:"12px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:GOLD,flexShrink:0}}/>
            <div>
              <div style={{fontSize:10,color:GOLD,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>This week's Anvil</div>
              <div style={{fontSize:14,fontWeight:500,color:GOLD}}>{anvilWinner.athlete_name}</div>
            </div>
          </div>
        )}
        <div style={{textAlign:"center",marginBottom:"2rem"}}>
          <div style={{width:60,height:60,borderRadius:16,background:PUR,margin:"0 auto 1rem",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>⚒</div>
          <div style={{fontSize:22,fontWeight:400,color:"#fff",marginBottom:4}}>TF College Group</div>
          <div style={{fontSize:13,color:"#888"}}>Select your name to sign in</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
          {athletes.map(a=>(
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

  if(screen==="login")return(
    <>
      <Head><title>Sign In — TF College Group</title></Head>
      <div style={{minHeight:"100vh",background:BG,fontFamily:"Georgia, serif",maxWidth:480,margin:"0 auto",padding:"3rem 1.5rem 2rem",textAlign:"center",position:"relative"}}>
        <button onClick={()=>setScreen("roster")} style={{position:"absolute",top:20,left:20,background:"transparent",border:"none",color:"#666",fontSize:13,cursor:"pointer",fontFamily:"Georgia, serif"}}>← Back</button>
        <div style={{width:48,height:48,borderRadius:"50%",background:isForge?RED:STEEL,margin:"0 auto 1rem",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:500,color:"#fff"}}>{selectedAthlete?.name[0]}</div>
        <div style={{fontSize:18,fontWeight:400,color:"#fff",marginBottom:6}}>
          {!selectedAthlete?.pin?`Hey ${selectedAthlete?.name.split(" ")[0]}, create your passcode`:pinStep==="confirm"?"Confirm your passcode":`Welcome back, ${selectedAthlete?.name.split(" ")[0]}`}
        </div>
        <div style={{fontSize:13,color:"#888",marginBottom:"2.5rem"}}>
          {!selectedAthlete?.pin?"You'll use this every time you sign in.":pinStep==="confirm"?"Enter the same 4 digits again.":"Enter your 4-digit passcode."}
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:14,marginBottom:28}}>
          {[0,1,2,3].map(i=><div key={i} style={{width:14,height:14,borderRadius:"50%",border:"2px solid "+PUR,background:i<pin.length?PUR:"transparent"}}/>)}
        </div>
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
              {isLate?(<><div style={{fontSize:13,fontWeight:500,color:"#E24B4A",marginBottom:6}}>On time is late. Early is the only standard.</div><div style={{fontSize:13,color:"#aaa",lineHeight:1.6}}>Consequence: <span style={{color:"#E24B4A",fontWeight:500}}>50 crunches upon arrival.</span></div></>)
              :(<><div style={{fontSize:13,fontWeight:500,color:"#58B368",marginBottom:6}}>That's the standard. Keep setting it.</div><div style={{fontSize:13,color:"#aaa",lineHeight:1.6}}>Early is the only acceptable arrival.</div></>)}
            </div>
          )}
          <button onClick={()=>{setScreen("profile");setTab("profile");}} style={{width:"100%",padding:"14px",borderRadius:10,border:"none",background:PUR,color:"#fff",fontSize:15,fontWeight:500,cursor:"pointer",fontFamily:"Georgia, serif"}}>
            Go to my profile →
          </button>
        </div>
      </>
    );
  }

  if(screen==="profile"&&selectedAthlete){
    const TABS=[
      {id:"profile",label:"My profile"},
      ...(isForge?[{id:"draft",label:"Draft"}]:[{id:"mygroup",label:"My group"}]),
      {id:"journey",label:"The journey"},
      {id:"attendance",label:"Attendance"},
      {id:"private",label:"Private"},
    ];

    const myGroupIdx=selectedAthlete.group_idx;
    const draftLeaders=draft?.leaders||[];
    const draftGroups=draft?.groups||[];
    const draftBracelets=draft?.bracelets||[];
    const draftTiers=draft?.tiers||[];
    const draftPhase=draft?.phase;
    const myLeader=myGroupIdx!=null?draftLeaders[myGroupIdx]:null;
    const myGroup=myGroupIdx!=null?draftGroups[myGroupIdx]:null;
    const myBracelet=myGroupIdx!=null?BRACELETS.find(b=>b.ref===draftBracelets[myGroupIdx]?.ref):null;
    const myTier=myGroupIdx!=null?draftTiers[myGroupIdx]:null;

    const myLeaderIdx=isForge?draftLeaders.indexOf(selectedAthlete.name):-1;
    const takenBracelets=(draftBracelets||[]).filter(Boolean).map(b=>b?.ref);
    const myBraceletPicked=myLeaderIdx>=0?draftBracelets[myLeaderIdx]:null;

    const nonLeaders=(athletes||[]).filter(a=>!draftLeaders.includes(a.name)).map(a=>a.name);
    const allPicked=(draftGroups||[]).flat();
    const available=nonLeaders.filter(n=>!allPicked.includes(n));
    const totalPicks=nonLeaders.length;
    const pickSeq=snakeSeq(totalPicks);
    const pickIdx=allPicked.length;
    const currentPickerIdx=pickSeq[pickIdx]??0;
    const isMyTurn=myLeaderIdx===currentPickerIdx&&draftPhase==="draft";
    const draftComplete=draftPhase==="locked"||(available.length===0&&draftPhase==="draft");

    const pickBracelet=async(b)=>{
      if(myLeaderIdx<0||myBraceletPicked)return;
      const nb=[...(draftBracelets||[null,null,null,null])];
      nb[myLeaderIdx]=b;
      await supabase.from("draft").update({bracelets:nb}).eq("id",draft.id);
      const allPicked=nb.every(Boolean);
      if(allPicked){
        await supabase.from("draft").update({phase:"draft"}).eq("id",draft.id);
      }
      await loadDraft();
    };

    const pickAthlete=async(name)=>{
      if(!isMyTurn)return;
      const ng=(draftGroups||[[],[],[],[]]).map(g=>[...g]);
      ng[myLeaderIdx].push(name);
      const newAvailable=available.filter(n=>n!==name);
      const newPickIdx=pickIdx+1;
      const done=newPickIdx>=pickSeq.length||newAvailable.length===0;
      await supabase.from("draft").update({
        groups:ng,
        phase:done?"locked":"draft",
        locked:done,
      }).eq("id",draft.id);
      if(done){
        for(let i=0;i<ng.length;i++){
          for(const n of ng[i]){
            const ath=athletes.find(a=>a.name===n);
            if(ath)await supabase.from("athletes").update({group_idx:i,tier:draftTiers[i]}).eq("id",ath.id);
          }
          const leader=athletes.find(a=>a.name===draftLeaders[i]);
          if(leader)await supabase.from("athletes").update({group_idx:i,tier:draftTiers[i],bracelet:draftBracelets[i]?.ref}).eq("id",leader.id);
        }
      }
      await loadDraft();
    };

    return(
      <>
        <Head><title>{selectedAthlete.name} — TF College Group</title></Head>
        <div style={{minHeight:"100vh",background:"#f5f5f5",fontFamily:"Georgia, serif",maxWidth:480,margin:"0 auto"}}>
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

            {tab==="profile"&&(
              <div>
                {announcement&&(
                  <div style={{background:"#1a1a2a",border:"0.5px solid "+PUR+"66",borderRadius:12,padding:"12px 16px",marginBottom:12}}>
                    <div style={{fontSize:10,color:PUR,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>This week from Coach Ant</div>
                    <div style={{fontSize:13,color:"#fff",lineHeight:1.6}}>{announcement.message}</div>
                  </div>
                )}
                {bracelet&&(
                  <div style={{background:BG,borderRadius:12,padding:"1rem",marginBottom:12,border:"0.5px solid "+bracelet.hex+"44"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <div style={{width:10,height:10,borderRadius:"50%",background:bracelet.hex}}/>
                      <span style={{fontSize:11,fontWeight:500,color:bracelet.hex,textTransform:"uppercase",letterSpacing:"0.05em"}}>{bracelet.color} · {bracelet.ref}</span>
                    </div>
                    <div style={{fontSize:14,color:"#fff",fontStyle:"italic",lineHeight:1.7}}>"{bracelet.text}"</div>
                  </div>
                )}
                {streak>0&&(
                  <div style={{background:"#0a1f0a",borderRadius:12,padding:"12px 16px",marginBottom:12,border:"0.5px solid "+GREEN+"44",display:"flex",alignItems:"center",gap:12}}>
                    <div style={{fontSize:28}}>🔥</div>
                    <div>
                      <div style={{fontSize:16,fontWeight:500,color:GREEN}}>{streak} day early streak</div>
                      <div style={{fontSize:12,color:"#888"}}>Keep showing up early.</div>
                    </div>
                  </div>
                )}
                {anvilWinner&&(
                  <div style={{background:"#1f1700",borderRadius:12,padding:"12px 16px",marginBottom:12,border:"0.5px solid "+GOLD+"44",display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:GOLD,flexShrink:0}}/>
                    <div>
                      <div style={{fontSize:10,color:GOLD,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>This week's Anvil</div>
                      <div style={{fontSize:14,fontWeight:500,color:GOLD}}>{anvilWinner.athlete_name}</div>
                    </div>
                  </div>
                )}
                {[{label:"Athletic goal",goalKey:"athletic_goal",taskKey:"coach_athletic_task",color:GREEN},{label:"Character goal",goalKey:"character_goal",taskKey:"coach_character_task",color:PUR}].map(({label,goalKey,taskKey,color})=>(
                  <div key={goalKey} style={{background:"#fff",borderRadius:12,padding:"1rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
                    <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>{label}</div>
                    <textarea value={selectedAthlete[goalKey]||""} onChange={async e=>{const val=e.target.value;setSelectedAthlete(a=>({...a,[goalKey]:val}));await supabase.from("athletes").update({[goalKey]:val}).eq("id",selectedAthlete.id);}} placeholder="What's one thing you want to improve this summer?" style={{width:"100%",minHeight:60,padding:"8px",fontSize:13,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia, serif",resize:"vertical",boxSizing:"border-box"}}/>
                    {selectedAthlete[taskKey]&&(
                      <div style={{marginTop:10,padding:"10px 12px",background:BG,borderRadius:8,borderLeft:"3px solid "+color}}>
                        <div style={{fontSize:11,fontWeight:500,color:color,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5}}>Task from Coach Ant</div>
                        <div style={{fontSize:13,color:"#ccc",lineHeight:1.6}}>{selectedAthlete[taskKey]}</div>
                      </div>
                    )}
                  </div>
                ))}
<VitruveData athleteId={selectedAthlete.id}/>
               <div style={{background:"#fff",borderRadius:12,padding:"1rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
                  <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Polar — heart rate & training data</div>
                  {selectedAthlete.polar_token?(
                    <PolarData token={selectedAthlete.polar_token}/>
                  ):(
                    <a href={"https://flow.polar.com/oauth2/authorization?response_type=code&client_id=d2759b37-57d2-4f8b-8d4a-b12a13288f4b&redirect_uri=https://tfcollegegroup.com/callback&scope=accesslink.read_all&state="+selectedAthlete.id} style={{display:"block",width:"100%",padding:"10px",borderRadius:8,border:"none",background:"#E8001E",color:"#fff",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"Georgia,serif",textAlign:"center",textDecoration:"none"}}>
                      Connect Polar →
                    </a>
                  )}
                </div>
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
                      <textarea value={injuryText} onChange={e=>setInjuryText(e.target.value)} placeholder="What's going on — what hurts, when it started..." style={{width:"100%",minHeight:80,padding:"8px",fontSize:13,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia, serif",resize:"vertical",marginBottom:8,boxSizing:"border-box"}}/>
                      {injurySent?<div style={{fontSize:13,color:GREEN,fontWeight:500,padding:"8px 10px",background:"#EAF3DE",borderRadius:8}}>Coach Ant has been notified.</div>
                      :<button onClick={sendInjury} style={{padding:"8px 16px",borderRadius:8,border:"0.5px solid "+RED,background:"transparent",color:RED,fontSize:13,cursor:"pointer",fontFamily:"Georgia, serif"}}>Notify Coach Ant</button>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab==="draft"&&isForge&&(
              <div>
                {!draft&&(
                  <div style={{background:BG,borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid #222"}}>
                    <div style={{fontSize:32,marginBottom:12}}>⏳</div>
                    <div style={{fontSize:16,color:"#fff",marginBottom:8}}>Waiting for Coach Ant to start the draft...</div>
                    <div style={{fontSize:13,color:"#555"}}>Once leaders are generated you'll see your draft options here.</div>
                  </div>
                )}

                {draft&&draftPhase==="bracelet"&&myLeaderIdx>=0&&!myBraceletPicked&&(
                  <div>
                    <div style={{background:BG,borderRadius:12,padding:"1rem",marginBottom:12,border:"2px solid "+GOLD}}>
                      <div style={{fontSize:11,color:GOLD,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Step 1 — Pick your bracelet</div>
                      <div style={{fontSize:14,color:"#fff"}}>Choose your verse for the week. First come first served.</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {BRACELETS.map(b=>{
                        const taken=takenBracelets.includes(b.ref);
                        return(
                          <button key={b.ref} disabled={taken} onClick={()=>pickBracelet(b)} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderRadius:12,border:"0.5px solid "+(taken?"#222":b.hex),background:taken?"#111":"#141414",cursor:taken?"not-allowed":"pointer",fontFamily:"Georgia,serif",opacity:taken?0.4:1}}>
                            <div style={{width:14,height:14,borderRadius:"50%",background:b.hex,flexShrink:0}}/>
                            <div style={{textAlign:"left",flex:1}}>
                              <div style={{fontSize:13,fontWeight:500,color:taken?"#555":"#fff"}}>{b.color}</div>
                              <div style={{fontSize:11,color:taken?"#444":"#888"}}>{b.ref} — {b.text}</div>
                            </div>
                            {taken&&<span style={{fontSize:10,color:"#444"}}>Taken</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {draft&&draftPhase==="bracelet"&&myLeaderIdx>=0&&myBraceletPicked&&(
                  <div style={{background:BG,borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid "+GOLD+"44"}}>
                    <div style={{fontSize:32,marginBottom:12}}>✓</div>
                    <div style={{fontSize:16,color:GOLD,fontWeight:500,marginBottom:8}}>Bracelet picked!</div>
                    <div style={{fontSize:13,color:"#888",marginBottom:16}}>Waiting for other leaders...</div>
                    <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}>
                      <div style={{width:10,height:10,borderRadius:"50%",background:BRACELETS.find(b=>b.ref===myBraceletPicked.ref)?.hex}}/>
                      <span style={{fontSize:13,color:"#fff"}}>{myBraceletPicked.color} — {myBraceletPicked.ref}</span>
                    </div>
                  </div>
                )}

                {draft&&draftPhase==="draft"&&myLeaderIdx>=0&&(
                  <div>
                    {isMyTurn?(
                      <div>
                        <CountdownPicker onTimeout={()=>{
                          if(available.length>0)pickAthlete(available[0]);
                        }}/>
                        <div style={{display:"flex",flexDirection:"column",gap:8}}>
                          {available.map(name=>(
                            <button key={name} onClick={()=>pickAthlete(name)} style={{padding:"14px 18px",borderRadius:12,border:"0.5px solid "+LC[myLeaderIdx],background:LB[myLeaderIdx],color:"#1a1a1a",cursor:"pointer",fontSize:14,fontWeight:500,textAlign:"left",fontFamily:"Georgia,serif"}}>
                              {name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ):(
                      <div style={{background:BG,borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid #222"}}>
                        <div style={{fontSize:32,marginBottom:12}}>⏳</div>
                        <div style={{fontSize:16,color:"#fff",marginBottom:8}}>Waiting for {draftLeaders[currentPickerIdx]} to pick...</div>
                        <div style={{fontSize:13,color:"#555"}}>Auto-refreshing every 3 seconds</div>
                      </div>
                    )}
                    <div style={{marginTop:12,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      {[0,1,2,3].map(i=>(
                        <div key={i} style={{background:LB[i],borderRadius:10,padding:"8px 10px",border:"0.5px solid "+LC[i]+"44"}}>
                          <div style={{fontSize:11,fontWeight:500,color:LC[i],marginBottom:4}}>{draftLeaders[i]}{i===myLeaderIdx?" (you)":""}</div>
                          {(draftGroups[i]||[]).map(n=><div key={n} style={{fontSize:11,color:"#555",padding:"2px 0"}}>{n}</div>)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {draft&&(draftPhase==="locked"||draftComplete)&&myLeaderIdx>=0&&(
                  <div>
                    <div style={{background:"#0a1f0a",borderRadius:12,padding:"1rem",marginBottom:12,border:"0.5px solid "+GREEN+"44",textAlign:"center"}}>
                      <div style={{fontSize:16,color:GREEN,fontWeight:500,marginBottom:4}}>Draft complete ✓</div>
                      <div style={{fontSize:13,color:"#888"}}>Groups are locked for the week.</div>
                    </div>
                    {myLeaderIdx>=0&&(()=>{
                      const myBrac=BRACELETS.find(b=>b.ref===draftBracelets[myLeaderIdx]?.ref);
                      const myTd=TIER_COLORS[draftTiers[myLeaderIdx]];
                      return(
                        <div style={{background:LB[myLeaderIdx],borderRadius:14,padding:"1.25rem",marginBottom:12,border:"2px solid "+LC[myLeaderIdx]}}>
                          <div style={{fontSize:11,color:LC[myLeaderIdx],textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Your group</div>
                          {myBrac&&(
                            <div style={{marginBottom:12}}>
                              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                                <div style={{width:14,height:14,borderRadius:"50%",background:myBrac.hex}}/>
                                <span style={{fontSize:13,fontWeight:600,color:LC[myLeaderIdx]}}>{myBrac.color} — {myBrac.ref}</span>
                              </div>
                              <div style={{fontSize:14,color:"#1a1a1a",fontStyle:"italic",lineHeight:1.7,padding:"10px 12px",background:"rgba(255,255,255,0.6)",borderRadius:8,borderLeft:"3px solid "+myBrac.hex}}>
                                "{myBrac.text}"
                              </div>
                            </div>
                          )}
                          {myTd&&<div style={{display:"inline-block",fontSize:11,fontWeight:500,padding:"3px 12px",borderRadius:6,background:myTd.bg,color:myTd.color,marginBottom:10}}>{myTd.label}</div>}
                          <div style={{fontSize:11,fontWeight:500,color:LC[myLeaderIdx],textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:8}}>Your team</div>
                          <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"rgba(255,255,255,0.7)",borderRadius:8,marginBottom:4}}>
                            <div style={{width:28,height:28,borderRadius:"50%",background:LC[myLeaderIdx],display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:"#fff"}}>{selectedAthlete.name[0]}</div>
                            <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a"}}>{selectedAthlete.name} <span style={{fontSize:11,color:LC[myLeaderIdx]}}>— Leader</span></div>
                          </div>
                          {(draftGroups[myLeaderIdx]||[]).map(n=>(
                            <div key={n} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"rgba(255,255,255,0.7)",borderRadius:8,marginBottom:4}}>
                              <div style={{width:28,height:28,borderRadius:"50%",background:"#888",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:"#fff"}}>{n[0]}</div>
                              <div style={{fontSize:13,color:"#1a1a1a"}}>{n}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                    <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>All groups</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      {[0,1,2,3].map(i=>{
                        const brac=BRACELETS.find(b=>b.ref===draftBracelets[i]?.ref);
                        return(
                          <div key={i} style={{background:i===myLeaderIdx?LB[i]:"#fff",borderRadius:12,padding:"10px",border:"0.5px solid "+(i===myLeaderIdx?LC[i]:"#e0e0e0"),borderTop:"3px solid "+(i===myLeaderIdx?LC[i]:"#e0e0e0")}}>
                            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                              {brac&&<div style={{width:8,height:8,borderRadius:"50%",background:brac.hex}}/>}
                              <span style={{fontSize:12,fontWeight:500,color:i===myLeaderIdx?LC[i]:"#1a1a1a"}}>{draftLeaders[i]}{i===myLeaderIdx?" ✓":""}</span>
                            </div>
                            {brac&&<div style={{fontSize:10,color:"#888",fontStyle:"italic",marginBottom:4}}>"{brac.text}"</div>}
                            {(draftGroups[i]||[]).map(n=><div key={n} style={{fontSize:11,color:"#555",padding:"2px 0"}}>{n}</div>)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab==="mygroup"&&!isForge&&(
              <div>
                {!draft||draftPhase==="setup"||(myGroupIdx==null&&draftPhase!=="locked")?(
                  <div style={{background:BG,borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid #222"}}>
                    <div style={{fontSize:32,marginBottom:12}}>⏳</div>
                    <div style={{fontSize:16,fontWeight:400,color:"#fff",marginBottom:8}}>
                      {draftPhase==="bracelet"?"Leaders are picking bracelets...":draftPhase==="draft"?"Draft is live — waiting to be picked...":"Draft pending..."}
                    </div>
                    <div style={{fontSize:13,color:"#555",lineHeight:1.7}}>You'll see your group, leader, bracelet verse, and tier right here once you've been picked.</div>
                  </div>
                ):(
                  <div>
                    {myLeader&&(
                      <div style={{background:LB[myGroupIdx]||"#f5f5f5",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"2px solid "+(LC[myGroupIdx]||PUR)}}>
                        <div style={{fontSize:11,color:LC[myGroupIdx]||PUR,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Your group</div>
                        <div style={{fontSize:18,fontWeight:500,color:"#1a1a1a",marginBottom:4}}>{myLeader}</div>
                        <div style={{fontSize:12,color:"#888",marginBottom:12}}>Your leader this week</div>
                        {myBracelet&&(
                          <div style={{marginBottom:12}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                              <div style={{width:10,height:10,borderRadius:"50%",background:myBracelet.hex}}/>
                              <span style={{fontSize:12,fontWeight:500,color:myBracelet.hex}}>{myBracelet.color} — {myBracelet.ref}</span>
                            </div>
                            <div style={{fontSize:14,color:"#1a1a1a",fontStyle:"italic",lineHeight:1.7,padding:"10px 12px",background:"rgba(255,255,255,0.6)",borderRadius:8,borderLeft:"3px solid "+myBracelet.hex}}>
                              "{myBracelet.text}"
                            </div>
                          </div>
                        )}
                        {myTier&&<div style={{fontSize:11,fontWeight:500,color:TIER_COLORS[myTier]?.color||"#888",background:TIER_COLORS[myTier]?.bg||"#f5f5f5",display:"inline-block",padding:"2px 10px",borderRadius:6,marginBottom:10}}>Tier {myTier}</div>}
                        {myGroup&&myGroup.length>0&&(
                          <div>
                            <div style={{fontSize:11,fontWeight:500,color:LC[myGroupIdx]||PUR,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:6}}>Your teammates</div>
                            {myGroup.map(name=>(
                              <div key={name} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"rgba(255,255,255,0.7)",borderRadius:8,marginBottom:4}}>
                                <div style={{width:28,height:28,borderRadius:"50%",background:"#888",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:"#fff"}}>{name[0]}</div>
                                <div style={{fontSize:13,color:"#1a1a1a"}}>{name}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {tab==="journey"&&(
              <div>
                <div style={{background:BG,borderRadius:12,padding:"1.25rem",marginBottom:12,textAlign:"center"}}>
                  <div style={{fontSize:15,color:"#ccc",fontStyle:"italic",lineHeight:1.7}}>"As iron sharpens iron, so one person sharpens another."</div>
                  <div style={{fontSize:12,color:"#444",marginTop:6}}>— Proverbs 27:17</div>
                </div>
                {[
                  {title:"The Iron",color:STEEL,bg:"#1a1e20",border:"#2a3035",isYou:!isForge,body:"Every athlete enters as The Iron. Raw. Unfinished. Full of potential but not yet fully shaped.",call:"Show up early. Work hard. Hold the standard."},
                  {title:"The Forge",color:RED,bg:"#200a0a",border:"#5a1a1a",isYou:isForge,body:"The Forge is called up for the week. They set the pace, lead the group, hold the standard.",call:"Lead by example before you lead by voice."},
                  {title:"The Anvil",color:GOLD,bg:"#1f1700",border:"#5a4500",isYou:false,body:"The Anvil is the highest individual honor in TF College Group. It cannot be drafted. It can only be earned.",call:"You do not chase the Anvil. You become the kind of person who earns it."},
                ].map((item,i)=>(
                  <div key={i} style={{background:item.bg,borderRadius:12,padding:"1.25rem",marginBottom:10,border:"0.5px solid "+item.border}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                      <div style={{width:10,height:10,borderRadius:"50%",background:item.color}}/>
                      <div style={{fontSize:18,fontWeight:400,color:item.color}}>{item.title}</div>
                      {item.isYou&&<span style={{fontSize:11,background:item.color,color:"#1a1a1a",padding:"2px 8px",borderRadius:5,fontWeight:500}}>You are here</span>}
                    </div>
                    <div style={{fontSize:13,color:"#999",lineHeight:1.75,marginBottom:10}}>{item.body}</div>
                    <div style={{fontSize:12,color:item.color,fontStyle:"italic"}}>{item.call}</div>
                  </div>
                ))}
              </div>
            )}

            {tab==="attendance"&&(
              <div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
                  {[
                    {label:"Early",count:attendance.filter(a=>a.status==="early").length,bg:"#EAF3DE",color:GREEN},
                    {label:"Late",count:attendance.filter(a=>a.status==="late").length,bg:"#FCEBEB",color:"#E24B4A"},
                    {label:"No shows",count:attendance.filter(a=>a.status==="noshow").length,bg:"#FAEEDA",color:"#854F0B"},
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
                      <div style={{fontSize:12,color:"#888"}}>Keep it going.</div>
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

            {tab==="private"&&(
              <div>
                <div style={{fontSize:13,color:"#888",lineHeight:1.7,marginBottom:14}}>This is your private line to Coach Ant. Nobody else sees what you send here.</div>
                <div style={{background:"#fff",borderRadius:12,padding:"1rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
                  <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>Message Coach Ant</div>
                  {feedbackSent?<div style={{fontSize:13,color:GREEN,fontWeight:500,padding:"10px",background:"#EAF3DE",borderRadius:8}}>Message sent to Coach Ant.</div>:(
                    <><textarea value={feedbackText} onChange={e=>setFeedbackText(e.target.value)} placeholder="Type your message to Coach Ant..." style={{width:"100%",minHeight:90,padding:"8px",fontSize:13,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia, serif",resize:"vertical",marginBottom:8,boxSizing:"border-box"}}/><button onClick={sendFeedback} style={{padding:"10px 20px",borderRadius:8,border:"none",background:PUR,color:"#fff",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"Georgia, serif"}}>Send to Coach Ant</button></>
                  )}
                </div>
                <div style={{background:BG,borderRadius:12,padding:"1rem",border:"0.5px solid #2a2a2a"}}>
                  <div style={{fontSize:13,fontWeight:500,color:"#fff",marginBottom:4}}>Prayer request</div>
                  {prayerSent?<div style={{fontSize:13,color:"#58B368",fontWeight:500,padding:"10px",background:"#0d1f0f",borderRadius:8}}>Your request has been received.</div>:(
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
