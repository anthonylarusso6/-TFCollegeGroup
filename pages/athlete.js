import { useState, useEffect, useRef } from "react";
import { BG, PUR, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { ErrorBoundary } from "../components/ErrorBoundary";
import WeightTracker from "../components/WeightTracker";
import AthleteLeaderboard from "../components/AthleteLeaderboard";
import PrayerWall from "../components/PrayerWall";
import BraceletWall from "../components/BraceletWall";
import AnvilHistory from "../components/AnvilHistory";
import VerseOfDay from "../components/VerseOfDay";
import StretchingTab from "../components/StretchingTab";
import PRLog from "../components/PRLog";
import AttendanceCalendar from "../components/AttendanceCalendar";
import NotesTab from "../components/NotesTab";
import DailyWord from "../components/DailyWord";
import ClassCountdown from "../components/ClassCountdown";
import GoalsCountdown from "../components/GoalsCountdown";
import GroupPhotos from "../components/GroupPhotos";
import AchievementBadges from "../components/AchievementBadges";

import Head from "next/head";
import { supabase } from "../lib/supabase";

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

const snakeSeq=(total,numGroups=4)=>{
  const order=[];let i=0,dir=1;
  while(order.length<total){
    order.push(i);
    if(i===numGroups-1)dir=-1;
    if(i===0&&order.length>1)dir=1;
    i+=dir;
  }
  return order;
};
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

function MindsetNotes({athleteId, athlete}){
  const WEEKS=[
    {week:1,title:"Who Are You Now?",scripture:"2 Cor 5:17",takeaway:"Your past is not your ceiling.",color:"#D4AF37"},
    {week:2,title:"Testimony Monday",scripture:"Rev 12:11",takeaway:"Your story has power.",color:"#D4AF37"},
    {week:3,title:"Process Over Outcome",scripture:"Gal 6:9",takeaway:"Fall in love with the work.",color:"#534AB7"},
    {week:4,title:"Testimony Monday",scripture:"Psalm 34:18",takeaway:"God doesn't waste pain.",color:"#D4AF37"},
    {week:5,title:"Confidence vs Belief",scripture:"Phil 4:13",takeaway:"Confidence runs out. Belief doesn't.",color:"#534AB7"},
    {week:6,title:"Testimony Monday",scripture:"Isaiah 43:2",takeaway:"You will not be swept away.",color:"#534AB7"},
    {week:7,title:"Fear vs Faith",scripture:"Joshua 1:9",takeaway:"Courage is a decision before a feeling.",color:"#534AB7"},
    {week:8,title:"Testimony Monday",scripture:"Rom 8:28",takeaway:"Nothing you've been through is wasted.",color:"#534AB7"},
    {week:9,title:"Mental Side of Adversity",scripture:"James 1:2-4",takeaway:"Adversity is training. Treat it like it.",color:"#1E6B3A"},
    {week:10,title:"Testimony Monday",scripture:"2 Tim 1:7",takeaway:"God did not give you a spirit of fear.",color:"#1E6B3A"},
    {week:11,title:"Who Are You When Nobody's Watching?",scripture:"Prov 11:3",takeaway:"Private character is real character.",color:"#1E6B3A"},
    {week:12,title:"Who Did You Become?",scripture:"Micah 6:8",takeaway:"Act justly. Love mercy. Walk humbly.",color:"#D4AF37"},
  ];
  const[saving,setSaving]=useState(null);
  const saveNote=async(week,val)=>{
    setSaving(week);
    await supabase.from("athletes").update({[`mindset_note_${week}`]:val}).eq("id",athleteId);
    setSaving(null);
  };
  return(
    <div>
      <div style={{background:"#0f0f0f",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #333"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#fff",marginBottom:4}}>Mindset Monday — Your Notes</div>
        <div style={{fontSize:12,color:"#888"}}>Write your takeaway from each week. Only you can see these.</div>
      </div>
      {WEEKS.map((w,i)=>(
        <div key={i} style={{background:"#fff",borderRadius:12,padding:"1rem",marginBottom:8,border:"0.5px solid #e0e0e0",borderLeft:"4px solid "+w.color}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
            <div style={{fontSize:11,color:w.color,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em"}}>Week {w.week}</div>
            <div style={{fontSize:11,color:"#888"}}>{w.scripture}</div>
          </div>
          <div style={{fontSize:13,fontWeight:500,color:"#1a1a1a",marginBottom:2}}>{w.title}</div>
          <div style={{fontSize:12,color:"#888",fontStyle:"italic",marginBottom:8}}>"{w.takeaway}"</div>
          <textarea defaultValue={athlete?.[`mindset_note_${w.week}`]||""} onBlur={e=>saveNote(w.week,e.target.value)} placeholder="Your personal takeaway..." style={{width:"100%",minHeight:55,padding:"8px",borderRadius:8,border:"0.5px solid #e0e0e0",fontSize:12,fontFamily:"Georgia,serif",resize:"none",boxSizing:"border-box",background:"#fafafa",color:"#1a1a1a"}}/>
          {saving===w.week&&<div style={{fontSize:11,color:"#1E6B3A",marginTop:3}}>Saving...</div>}
        </div>
      ))}
    </div>
  );
}


// ── Accountability Partner ──────────────────────────────────────
function AccountabilityPartner({athleteId, athletes}){
  const myPartner=athletes.find(a=>a.accountability_partner===athleteId||athleteId===a.accountability_partner);
  const partner=athletes.find(a=>a.id===myPartner?.accountability_partner||a.accountability_partner===athleteId);
  const[lb,setLb]=useState(null);
  useEffect(()=>{
    if(partner){
      supabase.from("leaderboard").select("*").eq("athlete_id",partner.id).single().then(({data})=>setLb(data));
    }
  },[partner]);
  const GOLD="#D4AF37",GREEN="#1E6B3A",RED="#C0392B",STEEL="#708090",BG="#0f0f0f";
  if(!partner) return(
    <div style={{background:"#fff",borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid #e0e0e0"}}>
      <div style={{fontSize:32,marginBottom:12}}>🤝</div>
      <div style={{fontSize:15,fontWeight:500,color:"#1a1a1a",marginBottom:8}}>No partner yet</div>
      <div style={{fontSize:13,color:"#888"}}>Coach Ant will assign your accountability partner. Check back soon!</div>
    </div>
  );
  return(
    <div>
      <div style={{background:BG,borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #333"}}>
        <div style={{fontSize:11,color:GREEN,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Your accountability partner</div>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:56,height:56,borderRadius:"50%",background:partner.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:500,color:"#fff",flexShrink:0,overflow:"hidden"}}>
            {partner.photo_url?<img src={partner.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:partner.name[0]}
          </div>
          <div>
            <div style={{fontSize:18,fontWeight:500,color:"#fff"}}>{partner.name}</div>
            <div style={{fontSize:12,color:"#888"}}>{partner.sport} · {partner.role==="forge"?"The Forge":"The Iron"}</div>
          </div>
        </div>
      </div>
      {lb&&(
        <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0"}}>
          <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Their stats</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {[{label:"Early",val:lb.early_count||0,color:GREEN},{label:"Streak 🔥",val:lb.current_streak||0,color:GOLD},{label:"Anvils",val:lb.anvil_count||0,color:GOLD}].map(s=>(
              <div key={s.label} style={{background:"#f9f9f9",borderRadius:10,padding:"12px",textAlign:"center",border:"0.5px solid #e0e0e0"}}>
                <div style={{fontSize:20,fontWeight:600,color:s.color}}>{s.val}</div>
                <div style={{fontSize:11,color:"#888",marginTop:2}}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:12,padding:"10px 14px",background:"#f9f9f9",borderRadius:10,border:"0.5px solid #e0e0e0"}}>
            <div style={{fontSize:12,color:"#888",fontStyle:"italic"}}>"Iron sharpens iron. Hold each other to the standard."</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Body Weight Tracker ─────────────────────────────────────────
export default function Athlete(){
  const[athletes,setAthletes]=useState([]);
  const[announcement,setAnnouncement]=useState(null);
  const[anvilWinner,setAnvilWinner]=useState(null);
  const[screen,setScreen]=useState("roster");
  const[selectedAthlete,setSelectedAthlete]=useState(null);
  const[search,setSearch]=useState("");
  const[rosterTab,setRosterTab]=useState("active");
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
  const athleteIdRef=useRef(null);

  useEffect(()=>{loadData();},[]);

  const loadData=async()=>{
    setLoading(true);
    try{
      const{data:aths,error:athErr}=await supabase.from("athletes").select("*").in("status",["active","sleeping"]).order("name");
      if(athErr)console.error("Athletes error:",athErr);
      if(aths&&aths.length>0){
        setAthletes(aths);
      }else{
        const{data:allAths}=await supabase.from("athletes").select("*").order("name");
        if(allAths)setAthletes(allAths.filter(a=>a.status!=="archived"));
      }
    }catch(e){console.error("Athletes fetch failed:",e);}
    try{
      const{data:ann}=await supabase.from("announcements").select("*").eq("active",true).order("created_at",{ascending:false}).limit(1);
      if(ann&&ann.length>0)setAnnouncement(ann[0]);
    }catch(e){}
    try{
      const{data:anv}=await supabase.from("anvil").select("athlete_name,date_awarded,note").order("created_at",{ascending:false}).limit(1);
      if(anv&&anv.length>0)setAnvilWinner(anv[0]);
    }catch(e){}
    setLoading(false);
  };

  // Keep ref in sync with state
  useEffect(()=>{athleteIdRef.current=selectedAthlete?.id;},[selectedAthlete]);

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
    const timeStr=now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",timeZone:"America/New_York"});
    const today=DAYS[now.getDay()];
    if(!CLASS_DAYS.includes(today))return null;
    const cut=CUTOFFS[today]||{h:9,m:30};
    // Use EST time for cutoff check
    const estTime=new Date(now.toLocaleString("en-US",{timeZone:"America/New_York"}));
    const late=estTime.getHours()>cut.h||(estTime.getHours()===cut.h&&estTime.getMinutes()>=cut.m);
    const status=late?"late":"early";
    // Use local date not UTC to match the local day
    const today_date=now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0");
    const{data:existing,error:existErr}=await supabase.from("attendance").select("*").eq("athlete_id",athlete.id).eq("date",today_date);
    if(existErr)console.error("Attendance check error:",existErr);
    if(existing&&existing.length>0)return{status:existing[0].status,time:existing[0].time_logged,already:true};
    const{error:insertErr}=await supabase.from("attendance").insert({athlete_id:athlete.id,date:today_date,day:today,status,time_logged:timeStr});
    if(insertErr){console.error("Attendance insert error:",insertErr);return{status,time:timeStr,error:insertErr.message};}
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
    try{
      const{data}=await supabase.from("athletes").select("*").eq("id",a.id).single();
      if(data)setSelectedAthlete(data);
    }catch(e){}
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
    if(screen==="profile"){
      // Always poll draft so group updates automatically after draft ends
      pollRef.current=setInterval(async()=>{
        await loadDraft();
        // Also refresh athlete data to get latest group_idx
        if(athleteIdRef.current){
          const{data}=await supabase.from("athletes").select("*").eq("id",athleteIdRef.current).single();
          if(data)setSelectedAthlete(data);
        }
      },5000);
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
      <div style={{minHeight:"100vh",background:BG,fontFamily:"Georgia, serif",maxWidth:480,margin:"0 auto",position:"relative",overflow:"hidden"}}>
        {/* Background glow effects */}
        <div style={{position:"fixed",top:-100,left:-100,width:300,height:300,borderRadius:"50%",background:"#E8720C",opacity:0.07,filter:"blur(80px)",pointerEvents:"none"}}/>
        <div style={{position:"fixed",bottom:-100,right:-100,width:250,height:250,borderRadius:"50%",background:GOLD,opacity:0.07,filter:"blur(60px)",pointerEvents:"none"}}/>

        <div style={{padding:"1rem 1.5rem 2rem",position:"relative"}}>
          {/* Top nav bar */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.5rem"}}>
            <a href="/" style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#555",textDecoration:"none",padding:"7px 12px",borderRadius:8,border:"0.5px solid #222",background:"#111"}}>
              ← Home
            </a>
            <a href="/coach" style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#555",textDecoration:"none",padding:"7px 12px",borderRadius:8,border:"0.5px solid #222",background:"#111"}}>
              ⚒ Coach
            </a>
          </div>
          {/* Hero header */}
          <div style={{textAlign:"center",marginBottom:"2rem"}}>
            <div style={{position:"relative",display:"inline-block",marginBottom:16}}>
              <div style={{width:80,height:80,borderRadius:22,background:"linear-gradient(135deg,#E8720C,#C0392B)",margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,boxShadow:"0 0 40px #E8720C55,0 0 80px #E8720C22"}}>⚒</div>
              <div style={{position:"absolute",inset:-3,borderRadius:25,border:"1px solid #E8720C33",pointerEvents:"none"}}/>
            </div>
            <div style={{fontSize:26,fontWeight:800,color:"#fff",letterSpacing:"-0.02em",marginBottom:6}}>TF College Group</div>
            <div style={{fontSize:12,color:"#444",textTransform:"uppercase",letterSpacing:"0.15em"}}>Iron sharpens iron · Proverbs 27:17</div>
          </div>

          {/* Announcement banner */}
          {announcement&&(
            <div style={{background:"linear-gradient(135deg,#1a1200,#201a00)",border:"1px solid #E8720C44",borderRadius:14,padding:"14px 16px",marginBottom:16,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#E8720C,transparent)"}}/>
              <div style={{fontSize:10,color:"#E8720C",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>📢 This week</div>
              <div style={{fontSize:13,color:"#ccc",lineHeight:1.6}}>{announcement.message}</div>
            </div>
          )}

          {/* Anvil winner */}
          {anvilWinner&&(
            <div style={{background:"linear-gradient(135deg,#1f1700,#2a2000)",border:"1px solid "+GOLD+"44",borderRadius:14,padding:"14px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:12,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,"+GOLD+",transparent)"}}/>
              <div style={{fontSize:28,filter:"drop-shadow(0 0 8px "+GOLD+"88)"}}>⚒</div>
              <div>
                <div style={{fontSize:10,color:GOLD,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:2}}>This week's Anvil</div>
                <div style={{fontSize:15,fontWeight:700,color:GOLD}}>{anvilWinner.athlete_name}</div>
              </div>
            </div>
          )}

          {/* Active / Sleeping tabs */}
          <div style={{display:"flex",gap:6,marginBottom:12}}>
            {[{id:"active",label:"Active"},{id:"sleeping",label:"😴 Sleeping"}].map(t=>(
              <button key={t.id} onClick={()=>setRosterTab(t.id)} style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid "+(rosterTab===t.id?ORANGE:"#222"),background:rosterTab===t.id?ORANGE:"transparent",color:rosterTab===t.id?"#fff":"#666",fontSize:12,fontWeight:rosterTab===t.id?700:400,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{marginBottom:14,position:"relative"}}>
            <input type="text" placeholder="Search your name..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",padding:"14px 16px 14px 44px",borderRadius:14,border:"1px solid #222",background:"#111",color:"#fff",fontSize:14,fontFamily:"Georgia, serif",boxSizing:"border-box",outline:"none"}} autoComplete="off"/>
            <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:16,color:"#444"}}>🔍</div>
            {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",color:"#444",fontSize:16,cursor:"pointer"}}>✕</button>}
          </div>

          {/* Athlete list */}
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
            {athletes.filter(a=>(rosterTab==="active"?a.status==="active":a.status==="sleeping")&&(!search||a.name.toLowerCase().includes(search.toLowerCase()))).map((a,idx)=>{
              const isForge=a.role==="forge";
              const roleColor=isForge?RED:STEEL;
              return(
                <button key={a.id} onClick={()=>selectAthlete(a)} style={{width:"100%",padding:"12px 16px",borderRadius:14,border:"1px solid "+(isForge?"#3a1a1a":"#1e1e1e"),background:isForge?"#1a0d0d":"#111",color:"#fff",cursor:"pointer",fontFamily:"Georgia, serif",display:"flex",alignItems:"center",gap:14,textAlign:"left",transition:"all 0.15s"}}>
                  {/* Avatar */}
                  <div style={{width:44,height:44,borderRadius:12,background:isForge?"linear-gradient(135deg,"+RED+",#8B1A1A)":"linear-gradient(135deg,"+STEEL+",#505a66)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:700,color:"#fff",flexShrink:0,overflow:"hidden",boxShadow:"0 2px 8px "+roleColor+"44"}}>
                    {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:a.name[0]}
                  </div>
                  {/* Info */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:600,color:"#fff",marginBottom:2}}>{a.name}</div>
                    <div style={{fontSize:11,color:"#555"}}>{a.sport||"Athlete"}</div>
                  </div>
                  {/* Role badge */}
                  <div style={{flexShrink:0,display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:10,fontWeight:700,color:roleColor,background:roleColor+"22",padding:"3px 8px",borderRadius:6,textTransform:"uppercase",letterSpacing:"0.04em"}}>{isForge?"Forge":"Iron"}</span>
                    <span style={{color:"#333",fontSize:14}}>→</span>
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{textAlign:"center",fontSize:11,color:"#333",letterSpacing:"0.05em"}}>TF College Group · Triple F Sports</div>
        </div>
      </div>
    </>
  );

  if(screen==="login")return(
    <>
      <Head><title>Sign In — TF College Group</title></Head>
      <div style={{minHeight:"100vh",background:BG,fontFamily:"Georgia, serif",maxWidth:480,margin:"0 auto",padding:"3rem 1.5rem 2rem",textAlign:"center",position:"relative"}}>
        <button onClick={()=>setScreen("roster")} style={{position:"absolute",top:20,left:20,background:"transparent",border:"none",color:"#666",fontSize:13,cursor:"pointer",fontFamily:"Georgia, serif"}}>← Back</button>
        <div style={{width:56,height:56,borderRadius:"50%",background:isForge?"linear-gradient(135deg,"+RED+",#8B1A1A)":"linear-gradient(135deg,"+STEEL+",#505a66)",margin:"0 auto 1rem",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:"#fff",overflow:"hidden",boxShadow:"0 0 20px "+(isForge?RED:STEEL)+"44"}}>
          {selectedAthlete?.photo_url?<img src={selectedAthlete.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:selectedAthlete?.name[0]}
        </div>
        <div style={{fontSize:20,fontWeight:700,color:"#fff",marginBottom:6}}>
          {!selectedAthlete?.pin?`Hey ${selectedAthlete?.name.split(" ")[0]}!`:pinStep==="confirm"?"Confirm your PIN":`Welcome back, ${selectedAthlete?.name.split(" ")[0]}!`}
        </div>
        <div style={{fontSize:13,color:"#666",marginBottom:24}}>
          {!selectedAthlete?.pin?"Create your 4-digit PIN.":pinStep==="confirm"?"Enter the same 4 digits again.":"Enter your 4-digit PIN."}
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:14,marginBottom:16}}>
          {[0,1,2,3].map(i=><div key={i} style={{width:14,height:14,borderRadius:"50%",border:"2px solid "+(isForge?RED:ORANGE),background:i<pin.length?(isForge?RED:ORANGE):"transparent",transition:"background 0.15s"}}/>)}
        </div>
        {/* Visible input for keyboard entry */}
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={e=>{
            const val=e.target.value.replace(/[^0-9]/g,"").slice(0,4);
            setPin(val);
          }}
          placeholder="····"
          style={{display:"block",width:160,margin:"0 auto 20px",padding:"14px",borderRadius:12,border:"1px solid #333",background:"#141414",color:"#fff",fontSize:24,textAlign:"center",fontFamily:"Georgia,serif",letterSpacing:"0.3em",outline:"none",boxSizing:"border-box"}}
        />
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
          {checkinInfo?.error&&<div style={{fontSize:12,color:"#E24B4A",marginBottom:8,padding:"8px 12px",background:"#FFF0F0",borderRadius:8}}>Save failed: {checkinInfo.error} — check Supabase RLS</div>}
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
      {id:"profile",label:"My Profile"},
      {id:"verse",label:"Verse"},
      {id:"attendance",label:"Attendance"},
      ...(isForge?[{id:"draft",label:"Draft"},{id:"mygroup",label:"My Group"}]:[{id:"mygroup",label:"My Group"}]),
      {id:"anvil",label:"Anvil"},
      {id:"weight",label:"Weight"},
      {id:"prs",label:"Iron Room"},
      {id:"stretching",label:"Stretch"},
      {id:"leaderboard",label:"Leaderboard"},
      {id:"prayer",label:"Prayer"},
      {id:"bracelets",label:"Bracelets"},
      {id:"photos",label:"Photos"},
      {id:"notes",label:"Notes"},
      {id:"private",label:"Private"},
    ];

    const myGroupIdx=selectedAthlete.group_idx;
    const draftLeaders=draft?.leaders||[];
    const draftGroups=draft?.groups||[];
    const draftBracelets=draft?.bracelets||[];
    const draftTiers=draft?.tiers||[];
    const draftPhase=draft?.phase;
    // For Forge leaders, use their leader index; for Iron, use group_idx
    const effectiveGroupIdx=isForge&&myLeaderIdx>=0?myLeaderIdx:myGroupIdx;
    const myLeader=effectiveGroupIdx!=null?draftLeaders[effectiveGroupIdx]:null;
    const myGroup=effectiveGroupIdx!=null?draftGroups[effectiveGroupIdx]:null;
    const myBracelet=effectiveGroupIdx!=null?BRACELETS.find(b=>b.ref===draftBracelets[effectiveGroupIdx]?.ref):null;
    const myTier=effectiveGroupIdx!=null?draftTiers[effectiveGroupIdx]:null;

    const myLeaderIdx=isForge?draftLeaders.indexOf(selectedAthlete.name):-1;
    const takenBracelets=(draftBracelets||[]).filter(Boolean).map(b=>b?.ref);
    const myBraceletPicked=myLeaderIdx>=0?draftBracelets[myLeaderIdx]:null;

    const nonLeaders=(athletes||[]).filter(a=>!draftLeaders.includes(a.name)).map(a=>a.name);
    const allPicked=(draftGroups||[]).flat();
    const available=nonLeaders.filter(n=>!allPicked.includes(n));
    const totalPicks=nonLeaders.length;
    const numLeaders=draftLeaders.filter(Boolean).length||draft?.group_count||4;
    const pickSeq=snakeSeq(totalPicks,numLeaders);
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

    const MAX_PICKS_PER_GROUP=draft?.picks_per_group||4;
    const pickAthlete=async(name)=>{
      if(!isMyTurn)return;
      const ng=(draftGroups||[[],[],[],[]]).map(g=>[...g]);
      // Enforce 4-pick max per group
      if(ng[myLeaderIdx].length>=MAX_PICKS_PER_GROUP){
        alert("Your group is full! Each group can only have 4 athletes.");
        return;
      }
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
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <button onClick={()=>setScreen("roster")} style={{background:"transparent",border:"none",color:"#666",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif",padding:"6px 10px",borderRadius:8,border:"0.5px solid #222"}}>← Switch</button>
                <a href="/" style={{background:"transparent",border:"0.5px solid #222",borderRadius:8,color:"#666",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif",padding:"6px 10px",textDecoration:"none"}}>🏠 Home</a>
                <a href="/coach" style={{background:"transparent",border:"0.5px solid #222",borderRadius:8,color:"#666",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif",padding:"6px 10px",textDecoration:"none"}}>⚒ Coach</a>
              </div>
              <div style={{fontSize:11,color:"#444"}}>TF College Group</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
             <div style={{width:50,height:50,borderRadius:"50%",background:isForge?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:500,color:"#fff",flexShrink:0,overflow:"hidden"}}>
                {selectedAthlete.photo_url?<img src={selectedAthlete.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:selectedAthlete.name[0]}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:18,fontWeight:400,color:"#fff"}}>{selectedAthlete.name}</div>
                <div style={{fontSize:12,color:"#888"}}>{selectedAthlete.sport}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:11,fontWeight:500,color:isForge?RED:STEEL,textTransform:"uppercase",letterSpacing:"0.06em"}}>{isForge?"The Forge":"The Iron"}</div>
                {streak>0&&<div style={{fontSize:11,color:GREEN,marginTop:2}}>🔥 {streak} day streak</div>}
              </div>
            </div>
            <div style={{display:"flex",overflowX:"auto",gap:4,padding:"0 4px",scrollbarWidth:"none"}}>
              {TABS.map(t=>{
                const icons={"profile":"👤","verse":"📖","attendance":"📅","draft":"🎯","mygroup":"👥","anvil":"⚒","weight":"⚖️","prs":"🏋️","leaderboard":"🏆","prayer":"🙏","bracelets":"📿","photos":"📸","notes":"📝","private":"🔒","stretching":"🧘","journey":"🛤"};
                const isActive=tab===t.id;
                return(
                <button key={t.id} onClick={()=>setTab(t.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"8px 12px",background:isActive?"#fff":"transparent",border:"none",borderRadius:10,color:isActive?"#1a1a1a":"#666",fontSize:11,fontWeight:isActive?700:400,cursor:"pointer",fontFamily:"Georgia,serif",whiteSpace:"nowrap",flexShrink:0,transition:"all 0.15s",boxShadow:isActive?"0 2px 8px rgba(0,0,0,0.15)":"none"}}>
                  <span style={{fontSize:16}}>{icons[t.id]||"•"}</span>
                  <span>{t.label}</span>
                </button>
                );
              })}
            </div>
          </div>

          <div style={{padding:"1.25rem"}}>

            {tab==="profile"&&(
              <div>
                {(()=>{const _d=new Date().getDay();const isClassDay=[1,2,4,5].includes(_d);if(!isClassDay)return null;const isMonFri=_d===1||_d===5;return(<div style={{background:"linear-gradient(135deg,#C0392B,#8B1A1A)",borderRadius:12,padding:"12px 16px",marginBottom:12,border:"1px solid #C0392B44",display:"flex",alignItems:"center",justifyContent:"space-between"}}><div><div style={{fontSize:13,fontWeight:700,color:"#fff"}}>⚒ Class day — be early!</div><div style={{fontSize:11,color:"#ffaaaa"}}>Doors open at {isMonFri?"8:30am":"9:00am"} · On time is late</div></div><div style={{fontSize:24}}>🔥</div></div>);})()}
                <DailyWord announcement={announcement}/>
                <ClassCountdown/>
                {/* Day schedule — always shows */}
                {(()=>{
                  const _days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
                  const _day=_days[new Date().getDay()];
                  const _classDays=["Mon","Tue","Thu","Fri"];
                  const _isClassDay=_classDays.includes(_day);
                  if(!_isClassDay) return(
                    <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
                      <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:4}}>No class today</div>
                      <div style={{fontSize:12,color:"#888"}}>Class days are Monday, Tuesday, Thursday & Friday. Rest up and come back ready.</div>
                    </div>
                  );
                  const _items=[
                    {time:"9:00am",label:_day==="Mon"?"Mindset Monday":_day==="Fri"?"Fellowship Friday":"Pre-class",detail:_day==="Mon"?"Pre-class · mindset session with Coach Ant & Kevin":_day==="Fri"?"Pre-class · devotional & discussion with Coach Ant":"30 min · Polar sign-in · stretch prep",color:_day==="Mon"?GOLD:_day==="Fri"?PUR:"#708090",dur:"30 min"},
                    {time:"9:30am",label:"Stretch & mobility",detail:"10 min · dynamic stretching · all athletes together",color:GREEN,dur:"10 min"},
                    {time:"9:40am",label:"Run",detail:"40–50 min · all 4 groups · hand positions enforced · leaders set pace",color:"#854F0B",dur:"40–50 min"},
                    {time:"10:30am",label:"Weight room",detail:"30–50 min · 2 groups Tier 1 · 1 group Tier 2 · 1 group Tier 3",color:PUR,dur:"30–50 min"},
                    {time:"11:15am",label:"Closeout & prayer",detail:"5 min · all together · coach or athlete prays",color:RED,dur:"5 min"},
                  ];
                  return(
                    <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
                      <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Class flow — 2 hours · done by 11:20am</div>
                      {_items.map((s,i,arr)=>(
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
                  );
                })()}
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
                    <textarea defaultValue={selectedAthlete[goalKey]||""} onBlur={async e=>{const val=e.target.value;setSelectedAthlete(a=>({...a,[goalKey]:val}));await supabase.from("athletes").update({[goalKey]:val}).eq("id",selectedAthlete.id);}} placeholder="What's one thing you want to improve this summer?" style={{width:"100%",minHeight:60,padding:"8px",fontSize:13,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia, serif",resize:"vertical",boxSizing:"border-box",marginBottom:6}}/>
              <button onClick={async e=>{const ta=e.target.previousSibling;const val=ta.value;setSelectedAthlete(a=>({...a,[goalKey]:val}));await supabase.from("athletes").update({[goalKey]:val}).eq("id",selectedAthlete.id);alert("Goal saved!");}} style={{padding:"6px 14px",borderRadius:8,border:"none",background:color,color:"#fff",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>Save goal →</button>
                    {selectedAthlete[taskKey]&&(
                      <div style={{marginTop:10,padding:"10px 12px",background:BG,borderRadius:8,borderLeft:"3px solid "+color}}>
                        <div style={{fontSize:11,fontWeight:500,color:color,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5}}>Task from Coach Ant</div>
                        <div style={{fontSize:13,color:"#ccc",lineHeight:1.6}}>{selectedAthlete[taskKey]}</div>
                      </div>
                    )}
                  </div>
                ))}

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

{tab==="polar"&&(
              <div>
                <div style={{background:"#fff",borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid #e0e0e0"}}>
                  <div style={{fontSize:32,marginBottom:12}}>⚡</div>
                  <div style={{fontSize:15,fontWeight:500,color:"#1a1a1a",marginBottom:8}}>Polar Integration</div>
                  <div style={{fontSize:13,color:"#888",lineHeight:1.7}}>We are working with Polar to get your class data syncing automatically. Check back soon!</div>
                </div>
              </div>
            )}

            {tab==="vitruve"&&(
              <div>
                <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid #1a1a1a"}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:4}}>Vitruve — Velocity Based Training</div>
                  <div style={{fontSize:12,color:"#888",marginBottom:12}}>Your bar speed and load data from the Vitruve encoder.</div>
                </div>
                <VitruveData athleteId={selectedAthlete.id} athleteName={selectedAthlete.name} vitruveId={selectedAthlete.vitruve_id}/>
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
                            <button key={name} onClick={()=>pickAthlete(name)} disabled={(draftGroups[myLeaderIdx]||[]).length>=MAX_PICKS_PER_GROUP} style={{padding:"14px 18px",borderRadius:12,border:"0.5px solid "+LC[myLeaderIdx],background:(draftGroups[myLeaderIdx]||[]).length>=MAX_PICKS_PER_GROUP?"#e0e0e0":LB[myLeaderIdx],color:(draftGroups[myLeaderIdx]||[]).length>=MAX_PICKS_PER_GROUP?"#aaa":"#1a1a1a",cursor:(draftGroups[myLeaderIdx]||[]).length>=MAX_PICKS_PER_GROUP?"not-allowed":"pointer",fontSize:14,fontWeight:500,textAlign:"left",fontFamily:"Georgia,serif"}}>
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

            {tab==="mygroup"&&(
              <div>
                {!draft||draftPhase==="setup"||(myGroupIdx==null&&myLeaderIdx<0&&draftPhase!=="locked")?(
                  <div style={{background:BG,borderRadius:12,padding:"1.5rem",textAlign:"center",border:"0.5px solid #222"}}>
                    <div style={{fontSize:32,marginBottom:12}}>⏳</div>
                    <div style={{fontSize:16,fontWeight:600,color:"#fff",marginBottom:8}}>
                      {draftPhase==="bracelet"?"Leaders are picking bracelets...":draftPhase==="draft"?"Draft is live — waiting to be picked...":"Draft pending..."}
                    </div>
                    <div style={{fontSize:13,color:"#555",lineHeight:1.7,marginBottom:16}}>You'll see your group here once you've been picked.</div>
                    {/* Show athlete's name so they know they're in the pool */}
                    {draftPhase==="draft"&&(
                      <div style={{background:"#1a1a1a",borderRadius:10,padding:"12px 16px",border:"1px solid #333",display:"flex",alignItems:"center",gap:12,textAlign:"left"}}>
                        <div style={{width:36,height:36,borderRadius:"50%",background:isForge?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff",flexShrink:0,overflow:"hidden"}}>
                          {selectedAthlete?.photo_url?<img src={selectedAthlete.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:selectedAthlete?.name[0]}
                        </div>
                        <div>
                          <div style={{fontSize:13,fontWeight:600,color:"#fff"}}>{selectedAthlete?.name}</div>
                          <div style={{fontSize:11,color:"#555"}}>In the draft pool — waiting to be picked</div>
                        </div>
                        <div style={{marginLeft:"auto",width:10,height:10,borderRadius:"50%",background:GREEN,boxShadow:"0 0 8px "+GREEN}}/>
                      </div>
                    )}
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

            
            
            {tab==="prayer"&&<PrayerWall athleteId={selectedAthlete.id} athleteName={selectedAthlete.name}/>}

            {tab==="leaderboard"&&<AthleteLeaderboard athleteId={selectedAthlete.id}/>}

            {tab==="bracelets"&&<BraceletWall athleteBracelet={selectedAthlete.bracelet}/>}

            {tab==="notes"&&<NotesTab athleteId={selectedAthlete.id} athlete={selectedAthlete}/>}


            {tab==="weight"&&<WeightTracker athleteId={selectedAthlete.id}/>}

            {tab==="goals"&&<GoalsCountdown athlete={selectedAthlete}/>}

            {tab==="verse"&&<VerseOfDay/>}

            {tab==="anvil"&&<AnvilHistory/>}

            {tab==="photos"&&<GroupPhotos/>}


            {tab==="attendance"&&(
              <div>
                <AttendanceCalendar athleteId={selectedAthlete.id}/>
                <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginTop:12,border:"0.5px solid #e0e0e0"}}>
                  <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:10}}>Check-in history</div>
                  {attendance.length===0&&<div style={{fontSize:12,color:"#aaa",textAlign:"center",padding:"1rem 0"}}>No check-ins yet.</div>}
                  {attendance.slice(0,30).map((rec,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<Math.min(attendance.length,30)-1?"0.5px solid #f0f0f0":"none"}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:500,color:"#1a1a1a"}}>{rec.day} · {rec.date}</div>
                        <div style={{fontSize:11,color:"#888"}}>{rec.time_logged||""}</div>
                      </div>
                      <span style={{fontSize:11,padding:"3px 10px",borderRadius:6,background:rec.status==="early"?"#EAF3DE":rec.status==="late"?"#FFF3CD":"#FCEBEB",color:rec.status==="early"?GREEN:rec.status==="late"?"#854F0B":RED,fontWeight:500}}>
                        {rec.status==="early"?"Early":rec.status==="late"?"Late":"No show"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {tab==="prs"&&<PRLog athleteId={selectedAthlete.id}/>}
            {tab==="stretching"&&<StretchingTab/>}

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
// force redeploy Sat Apr 18 17:18:14 UTC 2026
