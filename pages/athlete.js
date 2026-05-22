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
        <div key={i} style={{background:"#141414",borderRadius:12,padding:"1rem",marginBottom:8,border:"0.5px solid #252525",borderLeft:"4px solid "+w.color}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
            <div style={{fontSize:11,color:w.color,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em"}}>Week {w.week}</div>
            <div style={{fontSize:11,color:"#555"}}>{w.scripture}</div>
          </div>
          <div style={{fontSize:13,fontWeight:500,color:"#ddd",marginBottom:2}}>{w.title}</div>
          <div style={{fontSize:12,color:"#666",fontStyle:"italic",marginBottom:8}}>"{w.takeaway}"</div>
          <textarea defaultValue={athlete?.[`mindset_note_${w.week}`]||""} onBlur={e=>saveNote(w.week,e.target.value)} placeholder="Your personal takeaway..." style={{width:"100%",minHeight:55,padding:"8px",borderRadius:8,border:"0.5px solid #333",fontSize:12,fontFamily:"Georgia,serif",resize:"none",boxSizing:"border-box",background:"#1e1e1e",color:"#ddd"}}/>
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
      (async()=>{
        try{const{data}=await supabase.from("leaderboard").select("*").eq("athlete_id",partner.id).single();if(data)setLb(data);}catch(e){}
      })();
    }
  },[partner]);
  const GOLD="#D4AF37",GREEN="#1E6B3A",RED="#C0392B",STEEL="#708090",BG="#0f0f0f";
  if(!partner) return(
    <div style={{background:"#141414",borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid #252525"}}>
      <div style={{fontSize:32,marginBottom:12}}>🤝</div>
      <div style={{fontSize:15,fontWeight:500,color:"#ddd",marginBottom:8}}>No partner yet</div>
      <div style={{fontSize:13,color:"#666"}}>Coach Ant will assign your accountability partner. Check back soon!</div>
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
        <div style={{background:"#141414",borderRadius:12,padding:"1.25rem",border:"0.5px solid #252525"}}>
          <div style={{fontSize:13,fontWeight:600,color:"#ddd",marginBottom:12}}>Their stats</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {[{label:"Early",val:lb.early_count||0,color:GREEN},{label:"Streak 🔥",val:lb.current_streak||0,color:GOLD},{label:"Anvils",val:lb.anvil_count||0,color:GOLD}].map(s=>(
              <div key={s.label} style={{background:"#1e1e1e",borderRadius:10,padding:"12px",textAlign:"center",border:"0.5px solid #2a2a2a"}}>
                <div style={{fontSize:20,fontWeight:600,color:s.color}}>{s.val}</div>
                <div style={{fontSize:11,color:"#666",marginTop:2}}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:12,padding:"10px 14px",background:"#1a1a1a",borderRadius:10,border:"0.5px solid #252525"}}>
            <div style={{fontSize:12,color:"#555",fontStyle:"italic"}}>"Iron sharpens iron. Hold each other to the standard."</div>
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
    try{
      const{data}=await supabase.from("draft").select("*").order("created_at",{ascending:false}).limit(1);
      if(data&&data.length>0)setDraft(data[0]);
      else setDraft(null);
    }catch(e){}
  };

  const loadAttendance=async(athleteId)=>{
    try{
      const{data}=await supabase.from("attendance").select("*").eq("athlete_id",athleteId).order("date",{ascending:false});
      if(data)setAttendance(data);
      let s=0;
      if(data){for(const rec of data){if(rec.status==="early")s++;else break;}}
      setStreak(s);
    }catch(e){}
  };

  const doCheckin=async(athlete)=>{
    const now=new Date();
    const estTime=new Date(now.toLocaleString("en-US",{timeZone:"America/New_York"}));
    const timeStr=now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",timeZone:"America/New_York"});
    const today=DAYS[estTime.getDay()];
    if(!CLASS_DAYS.includes(today))return null;
    const cut=CUTOFFS[today]||{h:9,m:30};
    const late=estTime.getHours()>cut.h||(estTime.getHours()===cut.h&&estTime.getMinutes()>=cut.m);
    const status=late?"late":"early";
    const today_date=estTime.getFullYear()+"-"+String(estTime.getMonth()+1).padStart(2,"0")+"-"+String(estTime.getDate()).padStart(2,"0");
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
    try{await supabase.from("inbox").insert({athlete_id:selectedAthlete.id,type:"message",message:feedbackText});}catch(e){console.error("Feedback send:",e);}
    setFeedbackSent(true);
  };

  const sendPrayer=async()=>{
    if(!prayerText.trim())return;
    try{await supabase.from("inbox").insert({athlete_id:selectedAthlete.id,type:"prayer",message:prayerText});}catch(e){console.error("Prayer send:",e);}
    setPrayerSent(true);
  };

  const sendInjury=async()=>{
    if(!injuryText.trim())return;
    try{
      await supabase.from("athletes").update({injury:true,injury_note:injuryText}).eq("id",selectedAthlete.id);
      await supabase.from("inbox").insert({athlete_id:selectedAthlete.id,type:"injury",message:injuryText});
    }catch(e){console.error("Injury send:",e);}
    setInjurySent(true);
  };

  const bracelet=BRACELETS.find(b=>b.ref===selectedAthlete?.bracelet);
  const isForge=selectedAthlete?.role==="forge";

  if(loading)return(
    <div style={{minHeight:"100vh",background:"#080808",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:"40%",left:"50%",transform:"translate(-50%,-50%)",width:600,height:400,background:"radial-gradient(ellipse,#E8720C10 0%,transparent 65%)",pointerEvents:"none"}}/>
      <div style={{textAlign:"center",position:"relative"}}>
        <div style={{width:100,height:100,borderRadius:28,background:"linear-gradient(145deg,#E8720C,#C0392B,#8B0000)",margin:"0 auto 24px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:52,boxShadow:"0 0 80px #E8720C55,0 0 160px #E8720C22,inset 0 1px 0 rgba(255,255,255,0.1)"}}>⚒</div>
        <div style={{fontSize:11,color:"#E8720C",letterSpacing:"0.25em",textTransform:"uppercase",fontWeight:700}}>TF College Group</div>
      </div>
    </div>
  );

  if(screen==="roster")return(
    <>
      <Head><title>TF College Group — Athlete</title></Head>
      <div style={{minHeight:"100vh",background:"#080808",fontFamily:"Georgia, serif",maxWidth:480,margin:"0 auto",position:"relative",overflow:"hidden"}}>
        {/* Ambient fire glow top */}
        <div style={{position:"fixed",top:-120,left:"50%",transform:"translateX(-50%)",width:500,height:400,borderRadius:"50%",background:"radial-gradient(ellipse,#E8720C22 0%,transparent 70%)",pointerEvents:"none"}}/>
        {/* Ambient bottom */}
        <div style={{position:"fixed",bottom:-80,right:-80,width:300,height:300,borderRadius:"50%",background:"#C0392B0a",filter:"blur(60px)",pointerEvents:"none"}}/>

        {/* Hero Banner */}
        <div style={{background:"linear-gradient(180deg,#0e0600 0%,#080808 100%)",borderBottom:"1px solid #1a0a00",padding:"2rem 1.5rem 1.5rem",textAlign:"center",position:"relative"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,transparent 0%,#E8720C 30%,#C0392B 70%,transparent 100%)"}}/>
          {/* Nav */}
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"1.5rem"}}>
            <a href="/" style={{fontSize:11,color:"#555",textDecoration:"none",padding:"6px 14px",borderRadius:8,border:"0.5px solid #1e1e1e",background:"#0e0e0e",letterSpacing:"0.04em"}}>← Home</a>
            <a href="/coach" style={{fontSize:11,color:"#555",textDecoration:"none",padding:"6px 14px",borderRadius:8,border:"0.5px solid #1e1e1e",background:"#0e0e0e",letterSpacing:"0.04em"}}>⚒ Coach</a>
          </div>
          {/* Icon */}
          <div style={{position:"relative",display:"inline-block",marginBottom:20}}>
            <div style={{width:96,height:96,borderRadius:28,background:"linear-gradient(145deg,#E8720C,#C0392B,#8B0000)",margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"center",fontSize:52,boxShadow:"0 0 80px #E8720C55,0 0 160px #E8720C22,inset 0 1px 0 rgba(255,255,255,0.1)"}}>⚒</div>
            <div style={{position:"absolute",inset:-6,borderRadius:34,border:"1px solid #E8720C33",pointerEvents:"none"}}/>
            <div style={{position:"absolute",inset:-12,borderRadius:40,border:"0.5px solid #E8720C11",pointerEvents:"none"}}/>
          </div>
          <div style={{fontSize:32,fontWeight:900,color:"#fff",letterSpacing:"-0.03em",marginBottom:4,textTransform:"uppercase"}}>TF College Group</div>
          <div style={{fontSize:10,color:"#E8720C",textTransform:"uppercase",letterSpacing:"0.22em",fontWeight:700}}>Iron Sharpens Iron · Proverbs 27:17</div>
        </div>

        <div style={{padding:"1rem 1.25rem 2rem",position:"relative"}}>
          {/* Announcement banner */}
          {announcement&&(
            <div style={{background:"linear-gradient(135deg,#0e0900,#160e00)",border:"1px solid #E8720C33",borderRadius:14,padding:"14px 16px",marginBottom:12,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#E8720C,transparent)"}}/>
              <div style={{fontSize:10,color:"#E8720C",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:4,fontWeight:700}}>📢 This week</div>
              <div style={{fontSize:13,color:"#ccc",lineHeight:1.6}}>{announcement.message}</div>
            </div>
          )}

          {/* Anvil winner */}
          {anvilWinner&&(
            <div style={{background:"linear-gradient(135deg,#130e00,#1c1400)",border:"1px solid "+GOLD+"44",borderRadius:14,padding:"14px 16px",marginBottom:12,display:"flex",alignItems:"center",gap:12,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,"+GOLD+",transparent)"}}/>
              <div style={{fontSize:28,filter:"drop-shadow(0 0 12px "+GOLD+"aa)"}}>⚒</div>
              <div>
                <div style={{fontSize:10,color:GOLD,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:2,fontWeight:700}}>This week's Anvil</div>
                <div style={{fontSize:16,fontWeight:800,color:GOLD}}>{anvilWinner.athlete_name}</div>
              </div>
            </div>
          )}

          {/* Active / Sleeping tabs */}
          <div style={{display:"flex",gap:6,marginBottom:14,background:"#0e0e0e",borderRadius:12,padding:4,border:"0.5px solid #1e1e1e"}}>
            {[{id:"active",label:"⚡ Active"},{id:"sleeping",label:"😴 Sleeping"}].map(t=>(
              <button key={t.id} onClick={()=>setRosterTab(t.id)} style={{flex:1,padding:"9px",borderRadius:8,border:"none",background:rosterTab===t.id?"linear-gradient(135deg,#E8720C,#C0392B)":"transparent",color:rosterTab===t.id?"#fff":"#555",fontSize:12,fontWeight:rosterTab===t.id?800:400,cursor:"pointer",fontFamily:"Georgia,serif",letterSpacing:rosterTab===t.id?"0.02em":"0",textTransform:rosterTab===t.id?"uppercase":"none",boxShadow:rosterTab===t.id?"0 2px 12px #E8720C44":"none",transition:"all 0.15s"}}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{marginBottom:16,position:"relative"}}>
            <input type="text" placeholder="Search your name..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",padding:"14px 16px 14px 46px",borderRadius:14,border:"1px solid #1e1e1e",background:"#0e0e0e",color:"#fff",fontSize:14,fontFamily:"Georgia, serif",boxSizing:"border-box",outline:"none"}} autoComplete="off"/>
            <div style={{position:"absolute",left:15,top:"50%",transform:"translateY(-50%)",fontSize:15,color:"#333"}}>🔍</div>
            {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",color:"#444",fontSize:16,cursor:"pointer"}}>✕</button>}
          </div>

          {/* Athlete list */}
          <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:24}}>
            {athletes.filter(a=>(rosterTab==="active"?a.status==="active":a.status==="sleeping")&&(!search||a.name.toLowerCase().includes(search.toLowerCase()))).map((a,idx)=>{
              const isForge=a.role==="forge";
              const roleColor=isForge?RED:STEEL;
              return(
                <button key={a.id} onClick={()=>selectAthlete(a)} style={{width:"100%",padding:0,borderRadius:16,border:"1px solid "+(isForge?"#2a0808":"#151820"),background:isForge?"linear-gradient(135deg,#130808,#1a0c0c)":"linear-gradient(135deg,#0c0c10,#111318)",cursor:"pointer",fontFamily:"Georgia, serif",display:"flex",alignItems:"stretch",textAlign:"left",overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,0.5)"}}>
                  {/* Left role stripe */}
                  <div style={{width:4,background:isForge?"linear-gradient(180deg,#E8720C,"+RED+")":"linear-gradient(180deg,#8a9aa4,"+STEEL+")",flexShrink:0}}/>
                  {/* Avatar */}
                  <div style={{padding:"14px 12px 14px 14px",flexShrink:0,display:"flex",alignItems:"center"}}>
                    <div style={{width:58,height:58,borderRadius:16,background:isForge?"linear-gradient(145deg,#E8720C,"+RED+",#8B0000)":"linear-gradient(145deg,#8a9aa4,"+STEEL+",#404a55)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:800,color:"#fff",flexShrink:0,overflow:"hidden",boxShadow:"0 4px 16px "+roleColor+"44"}}>
                      {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:a.name[0]}
                    </div>
                  </div>
                  {/* Info */}
                  <div style={{flex:1,padding:"14px 4px",minWidth:0,display:"flex",flexDirection:"column",justifyContent:"center"}}>
                    <div style={{fontSize:16,fontWeight:700,color:"#fff",marginBottom:3,letterSpacing:"-0.01em"}}>{a.name}</div>
                    <div style={{fontSize:11,color:"#555",marginBottom:a.injury?4:0}}>{a.sport||"Athlete"}</div>
                    {a.injury&&<div style={{fontSize:9,fontWeight:800,color:RED,background:RED+"1a",padding:"2px 8px",borderRadius:5,border:"0.5px solid "+RED+"33",display:"inline-block",textTransform:"uppercase",letterSpacing:"0.08em",width:"fit-content"}}>⚡ Injured</div>}
                  </div>
                  {/* Right role badge */}
                  <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",alignItems:"flex-end",justifyContent:"center",gap:8}}>
                    <div style={{fontSize:9,fontWeight:800,color:roleColor,background:roleColor+"15",padding:"4px 10px",borderRadius:8,textTransform:"uppercase",letterSpacing:"0.1em",border:"0.5px solid "+roleColor+"40"}}>{isForge?"Forge":"Iron"}</div>
                    <div style={{color:"#2a2a2a",fontSize:18,fontWeight:300,lineHeight:1}}>›</div>
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{textAlign:"center",fontSize:10,color:"#222",letterSpacing:"0.08em",textTransform:"uppercase"}}>TF College Group · Triple F Sports</div>
        </div>
      </div>
    </>
  );

  if(screen==="login")return(
    <>
      <Head><title>Sign In — TF College Group</title></Head>
      <div style={{height:"100dvh",background:"#080808",fontFamily:"Georgia, serif",maxWidth:480,margin:"0 auto",textAlign:"center",position:"relative",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 1.25rem",overflow:"hidden"}}>
        <div style={{position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",width:500,height:300,background:"radial-gradient(ellipse at top,"+(isForge?"#C0392B14":"#4a5a6618")+" 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,transparent,"+(isForge?"#C0392B,#E8720C":"#505a66,#8a9aa4")+",transparent)"}}/>
        <button onClick={()=>setScreen("roster")} style={{position:"absolute",top:14,left:14,background:"#111",border:"0.5px solid #1e1e1e",color:"#555",fontSize:11,cursor:"pointer",fontFamily:"Georgia, serif",padding:"5px 11px",borderRadius:8}}>← Back</button>
        <div style={{fontSize:8,fontWeight:800,color:isForge?RED:STEEL,textTransform:"uppercase",letterSpacing:"0.2em",marginBottom:6,background:(isForge?RED:STEEL)+"15",padding:"3px 10px",borderRadius:20,border:"0.5px solid "+(isForge?RED:STEEL)+"33"}}>
          {isForge?"⚔ The Forge":"⚒ The Iron"}
        </div>
        <div style={{position:"relative",marginBottom:6}}>
          <div style={{position:"absolute",inset:-4,borderRadius:"50%",border:"1px solid "+(isForge?RED:STEEL)+"33",pointerEvents:"none"}}/>
          <div style={{width:46,height:46,borderRadius:"50%",background:isForge?"linear-gradient(145deg,#E8720C,"+RED+",#8B0000)":"linear-gradient(145deg,#8a9aa4,"+STEEL+",#404a55)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:"#fff",overflow:"hidden",boxShadow:"0 0 24px "+(isForge?RED:STEEL)+"44"}}>
            {selectedAthlete?.photo_url?<img src={selectedAthlete.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:selectedAthlete?.name[0]}
          </div>
        </div>
        <div style={{fontSize:15,fontWeight:900,color:"#fff",marginBottom:2,letterSpacing:"-0.01em",textTransform:"uppercase"}}>
          {!selectedAthlete?.pin?selectedAthlete?.name.split(" ")[0]:pinStep==="confirm"?"Confirm PIN":selectedAthlete?.name.split(" ")[0]}
        </div>
        <div style={{fontSize:10,color:"#555",marginBottom:12,letterSpacing:"0.04em"}}>
          {!selectedAthlete?.pin?"Create a 4-digit PIN":pinStep==="confirm"?"Enter the same 4 digits":"Enter your PIN to check in"}
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:10,marginBottom:14}}>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{width:10,height:10,borderRadius:"50%",border:"2px solid "+(isForge?RED:STEEL)+(i<pin.length?"":"44"),background:i<pin.length?(isForge?"linear-gradient(135deg,#E8720C,"+RED+")":"linear-gradient(135deg,#8a9aa4,"+STEEL+")"):"transparent",transition:"all 0.15s",boxShadow:i<pin.length?"0 0 6px "+(isForge?RED:STEEL)+"88":"none"}}/>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,width:"68%",maxWidth:200}}>
          {[1,2,3,4,5,6,7,8,9,null,0,"⌫"].map((k,i)=>(
            <button key={i} onClick={()=>{
              if(k===null)return;
              if(k==="⌫"){setPin(p=>p.slice(0,-1));return;}
              if(pin.length<4)setPin(p=>p+String(k));
            }} style={{padding:"9px 0",borderRadius:8,border:"0.5px solid "+(k===null?"transparent":"#1e1e1e"),background:k===null?"transparent":k==="⌫"?"#161616":"#141414",fontSize:16,fontWeight:300,cursor:k===null?"default":"pointer",color:k==="⌫"?"#555":"#ddd",fontFamily:"sans-serif"}}>
              {k===null?"":k}
            </button>
          ))}
        </div>
        {pinError&&<div style={{marginTop:8,fontSize:10,color:"#ff5555",padding:"5px 12px",background:"#1a0505",borderRadius:8,border:"1px solid #3a0808"}}>{pinError}</div>}
      </div>
    </>
  );

  if(screen==="checkin"){
    const isLate=checkinInfo?.status==="late";
    const noClass=!checkinInfo;
    const alreadyIn=checkinInfo?.already;
    const accentColor=noClass?"#444":alreadyIn?PUR:isLate?"#ff3333":GREEN;
    const bgGrad=noClass?"#080808":isLate?"linear-gradient(160deg,#080808,#100202)":alreadyIn?"linear-gradient(160deg,#080808,#04020e)":"linear-gradient(160deg,#080808,#020e06)";
    return(
      <>
        <Head><title>Check In — TF College Group</title></Head>
        <div style={{minHeight:"100vh",background:bgGrad,fontFamily:"Georgia, serif",maxWidth:480,margin:"0 auto",padding:"3rem 1.5rem 2rem",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          {/* Top accent line */}
          <div style={{position:"fixed",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,transparent,"+accentColor+",transparent)",maxWidth:480,margin:"0 auto"}}/>
          {/* Big ambient glow */}
          <div style={{position:"fixed",top:"20%",left:"50%",transform:"translateX(-50%)",width:500,height:400,background:"radial-gradient(ellipse,"+accentColor+"12 0%,transparent 65%)",pointerEvents:"none"}}/>
          {/* Status icon */}
          <div style={{position:"relative",marginBottom:24}}>
            <div style={{position:"absolute",inset:-20,borderRadius:"50%",border:"0.5px solid "+accentColor+"15",pointerEvents:"none"}}/>
            <div style={{position:"absolute",inset:-10,borderRadius:"50%",border:"1px solid "+accentColor+"25",pointerEvents:"none"}}/>
            <div style={{width:100,height:100,borderRadius:"50%",background:"linear-gradient(145deg,"+(noClass?"#222,#333":alreadyIn?PUR+",#3a2d8f":isLate?"#8B0000,#cc2200":GREEN+",#0d4a20")+")",display:"flex",alignItems:"center",justifyContent:"center",fontSize:48,boxShadow:"0 0 80px "+accentColor+"44,0 0 160px "+accentColor+"18"}}>
              {noClass?"📅":alreadyIn?"✓":isLate?"⚠":"✓"}
            </div>
          </div>
          {/* Giant status text */}
          {!noClass&&!alreadyIn&&(
            <div style={{fontSize:56,fontWeight:900,color:accentColor,letterSpacing:"-0.04em",lineHeight:1,marginBottom:4,textShadow:"0 0 60px "+accentColor+"66",textTransform:"uppercase"}}>
              {isLate?"LATE":"EARLY"}
            </div>
          )}
          <div style={{fontSize:noClass||alreadyIn?24:15,fontWeight:noClass||alreadyIn?800:600,color:noClass||alreadyIn?"#fff":"#888",marginBottom:8,letterSpacing:noClass||alreadyIn?"-0.02em":"0.04em",textTransform:noClass||alreadyIn?"none":"uppercase"}}>
            {noClass?"No class today":alreadyIn?"Already checked in":isLate?"On time is late.":"That's the standard."}
          </div>
          {checkinInfo&&<div style={{fontSize:13,color:"#444",marginBottom:20,letterSpacing:"0.04em"}}>Signed in at {checkinInfo.time}</div>}
          {checkinInfo?.error&&<div style={{fontSize:12,color:"#ff5555",marginBottom:12,padding:"10px 16px",background:"#1a0505",borderRadius:12,border:"1px solid #3a0808"}}>Save failed: {checkinInfo.error}</div>}
          {streak>0&&!noClass&&(
            <div style={{padding:"12px 24px",borderRadius:12,background:"linear-gradient(135deg,#051a0a,#0a2010)",border:"1px solid "+GREEN+"33",marginBottom:20,display:"inline-flex",alignItems:"center",gap:10,boxShadow:"0 4px 20px "+GREEN+"22"}}>
              <span style={{fontSize:22}}>🔥</span>
              <span style={{fontSize:15,color:GREEN,fontWeight:800}}>{streak}-day early streak</span>
            </div>
          )}
          {!noClass&&!alreadyIn&&(
            <div style={{padding:"16px 20px",borderRadius:16,border:"1px solid "+accentColor+"33",background:isLate?"linear-gradient(135deg,#120303,#1a0606)":"linear-gradient(135deg,#031208,#061a0d)",marginBottom:28,textAlign:"left",width:"100%",maxWidth:360,boxSizing:"border-box",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,"+accentColor+",transparent)"}}/>
              {isLate?(<><div style={{fontSize:13,fontWeight:800,color:"#ff5555",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.04em"}}>Consequence</div><div style={{fontSize:13,color:"#888",lineHeight:1.7}}><span style={{color:"#ff6666",fontWeight:700}}>50 crunches upon arrival.</span> You know the standard.</div></>)
              :(<><div style={{fontSize:13,fontWeight:800,color:"#4cdd80",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.04em"}}>Keep it up</div><div style={{fontSize:13,color:"#888",lineHeight:1.7}}>Early is the only acceptable arrival. ⚒</div></>)}
            </div>
          )}
          <button onClick={()=>{setScreen("profile");setTab("profile");}} style={{width:"100%",maxWidth:360,padding:"18px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#E8720C,#C0392B)",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"Georgia, serif",letterSpacing:"0.06em",textTransform:"uppercase",boxShadow:"0 6px 30px #E8720C44"}}>
            My Profile →
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
    const myLeaderIdx=isForge?draftLeaders.indexOf(selectedAthlete.name):-1;
    // For Forge leaders, use their leader index; for Iron, use group_idx
    const effectiveGroupIdx=isForge&&myLeaderIdx>=0?myLeaderIdx:myGroupIdx;
    const myLeader=effectiveGroupIdx!=null?draftLeaders[effectiveGroupIdx]:null;
    const myGroup=effectiveGroupIdx!=null?draftGroups[effectiveGroupIdx]:null;
    const myBracelet=effectiveGroupIdx!=null?BRACELETS.find(b=>b.ref===draftBracelets[effectiveGroupIdx]?.ref):null;
    const myTier=effectiveGroupIdx!=null?draftTiers[effectiveGroupIdx]:null;
    const takenBracelets=(draftBracelets||[]).filter(Boolean).map(b=>b?.ref);
    const myBraceletPicked=myLeaderIdx>=0?draftBracelets[myLeaderIdx]:null;

    const nonLeaders=(athletes||[]).filter(a=>!draftLeaders.includes(a.name)).map(a=>a.name);
    const allPicked=(draftGroups||[]).flat();
    const available=nonLeaders.filter(n=>!allPicked.includes(n));
    const totalPicks=nonLeaders.length;
    const numLeaders=draftLeaders.filter(Boolean).length||4;
    const MAX_PICKS_PER_GROUP=numLeaders>0&&nonLeaders.length>0?Math.ceil(nonLeaders.length/numLeaders):4;
    const pickSeq=snakeSeq(totalPicks,numLeaders);
    const pickIdx=allPicked.length;
    const currentPickerIdx=pickSeq[pickIdx]??0;
    const isMyTurn=myLeaderIdx===currentPickerIdx&&draftPhase==="draft";
    const draftComplete=draftPhase==="locked"||(available.length===0&&draftPhase==="draft");

    const pickBracelet=async(b)=>{
      if(myLeaderIdx<0||myBraceletPicked)return;
      const nb=[...(draftBracelets||Array(numLeaders).fill(null))];
      nb[myLeaderIdx]=b;
      await supabase.from("draft").update({bracelets:nb}).eq("id",draft.id);
      const allPicked=nb.slice(0,numLeaders).every(Boolean);
      if(allPicked){
        await supabase.from("draft").update({phase:"draft"}).eq("id",draft.id);
      }
      await loadDraft();
    };

    const pickAthlete=async(name)=>{
      if(!isMyTurn)return;
      const ng=(draftGroups||Array(numLeaders).fill([])).map(g=>[...g]);
      // Enforce 4-pick max per group
      if(ng[myLeaderIdx].length>=MAX_PICKS_PER_GROUP){
        alert(`Your group is full! Each group can only have ${MAX_PICKS_PER_GROUP} athletes.`);
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
        <div style={{minHeight:"100vh",background:"#080808",fontFamily:"Georgia, serif",maxWidth:480,margin:"0 auto"}}>
          {/* Profile header */}
          <div style={{background:"linear-gradient(180deg,#0e0600 0%,#0a0505 50%,#080808 100%)",borderBottom:"1px solid #1a0800",position:"relative",overflow:"hidden"}}>
            {/* Top accent */}
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,transparent,"+(isForge?"#E8720C,#C0392B":"#606a75,#8a9aa4")+",transparent)"}}/>
            {/* Ambient glow */}
            <div style={{position:"absolute",top:-40,right:-40,width:220,height:220,borderRadius:"50%",background:isForge?"#E8720C0a":"#8a9aa40a",filter:"blur(50px)",pointerEvents:"none"}}/>
            {/* Nav row */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px 10px",position:"relative"}}>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <button onClick={()=>setScreen("roster")} style={{background:"#111",border:"0.5px solid #1e1e1e",color:"#666",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif",padding:"6px 14px",borderRadius:8,letterSpacing:"0.02em"}}>← Switch</button>
                <a href="/" style={{background:"#111",border:"0.5px solid #1e1e1e",borderRadius:8,color:"#666",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif",padding:"6px 12px",textDecoration:"none"}}>🏠</a>
                <a href="/coach" style={{background:"#111",border:"0.5px solid #1e1e1e",borderRadius:8,color:"#666",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif",padding:"6px 12px",textDecoration:"none"}}>⚒</a>
              </div>
              <div style={{fontSize:9,color:"#2a2a2a",letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:600}}>TF College Group</div>
            </div>
            {/* Identity banner */}
            <div style={{display:"flex",alignItems:"center",gap:16,padding:"4px 16px 16px",position:"relative"}}>
              <div style={{position:"relative",flexShrink:0}}>
                <div style={{position:"absolute",inset:-5,borderRadius:"50%",border:"1px solid "+(isForge?RED:STEEL)+"44",pointerEvents:"none"}}/>
                <div style={{width:70,height:70,borderRadius:"50%",background:isForge?"linear-gradient(145deg,#E8720C,"+RED+",#8B0000)":"linear-gradient(145deg,#8a9aa4,"+STEEL+",#404a55)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:900,color:"#fff",overflow:"hidden",boxShadow:"0 0 30px "+(isForge?RED:STEEL)+"44"}}>
                  {selectedAthlete.photo_url?<img src={selectedAthlete.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:selectedAthlete.name[0]}
                </div>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:22,fontWeight:900,color:"#fff",letterSpacing:"-0.02em",lineHeight:1.1,textTransform:"uppercase"}}>{selectedAthlete.name}</div>
                <div style={{fontSize:11,color:"#444",marginTop:3,letterSpacing:"0.04em"}}>{selectedAthlete.sport}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:9,fontWeight:800,color:isForge?RED:STEEL,textTransform:"uppercase",letterSpacing:"0.12em",background:(isForge?RED:STEEL)+"18",padding:"4px 12px",borderRadius:20,border:"0.5px solid "+(isForge?RED:STEEL)+"44",marginBottom:5,display:"inline-block",whiteSpace:"nowrap"}}>{isForge?"⚔ Forge":"⚒ Iron"}</div>
                {streak>0&&<div style={{fontSize:11,color:GREEN,fontWeight:700}}>🔥 {streak}-day</div>}
              </div>
            </div>
            {/* Tab bar */}
            <div style={{display:"flex",overflowX:"auto",scrollbarWidth:"none",WebkitOverflowScrolling:"touch",borderTop:"1px solid #141414"}}>
              {TABS.map(t=>{
                const icons={"profile":"👤","verse":"📖","attendance":"📅","draft":"🎯","mygroup":"👥","anvil":"⚒","weight":"⚖️","prs":"🏋️","leaderboard":"🏆","prayer":"🙏","bracelets":"📿","photos":"📸","notes":"📝","private":"🔒","stretching":"🧘","journey":"🛤"};
                const isActive=tab===t.id;
                const tabColor=isForge?"#E8720C":STEEL;
                return(
                <button key={t.id} onClick={()=>setTab(t.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"10px 12px 8px",background:isActive?"#0e0e0e":"transparent",border:"none",borderBottom:"2px solid "+(isActive?tabColor:"transparent"),borderRight:"none",borderLeft:"none",borderTop:"none",color:isActive?"#fff":"#444",fontSize:10,fontWeight:isActive?800:400,cursor:"pointer",fontFamily:"Georgia,serif",whiteSpace:"nowrap",flexShrink:0,transition:"all 0.12s",textTransform:isActive?"uppercase":"none",letterSpacing:isActive?"0.04em":"0"}}>
                  <span style={{fontSize:15,filter:isActive?"drop-shadow(0 0 4px "+tabColor+"88)":"none"}}>{icons[t.id]||"•"}</span>
                  <span>{t.label}</span>
                </button>
                );
              })}
            </div>
          </div>

          <div style={{padding:"1.25rem",background:"#080808",minHeight:"60vh"}}>

            {tab==="profile"&&(
              <div>
                {(()=>{const _est=new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));const _d=_est.getDay();const isClassDay=[1,2,4,5].includes(_d);if(!isClassDay)return null;const isMonFri=_d===1||_d===5;return(<div style={{background:"linear-gradient(135deg,#C0392B,#8B1A1A)",borderRadius:12,padding:"12px 16px",marginBottom:12,border:"1px solid #C0392B44",display:"flex",alignItems:"center",justifyContent:"space-between"}}><div><div style={{fontSize:13,fontWeight:700,color:"#fff"}}>⚒ Class day — be early!</div><div style={{fontSize:11,color:"#ffaaaa"}}>Doors open at {isMonFri?"8:30am":"9:00am"} · On time is late</div></div><div style={{fontSize:24}}>🔥</div></div>);})()}
                <DailyWord announcement={announcement}/>
                <ClassCountdown/>
                {/* Day schedule — always shows */}
                {(()=>{
                  const _days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
                  const _day=_days[new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"})).getDay()];
                  const _classDays=["Mon","Tue","Thu","Fri"];
                  const _isClassDay=_classDays.includes(_day);
                  if(!_isClassDay) return(
                    <div style={{background:"#141414",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #252525"}}>
                      <div style={{fontSize:13,fontWeight:600,color:"#ddd",marginBottom:4}}>No class today</div>
                      <div style={{fontSize:12,color:"#666"}}>Class days are Monday, Tuesday, Thursday & Friday. Rest up and come back ready.</div>
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
                    <div style={{background:"#141414",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #252525"}}>
                      <div style={{fontSize:13,fontWeight:600,color:"#ddd",marginBottom:12}}>Class flow — 2 hours · done by 11:20am</div>
                      {_items.map((s,i,arr)=>(
                        <div key={i} style={{display:"flex",gap:12,padding:"8px 0",borderBottom:i<arr.length-1?"0.5px solid #1e1e1e":"none"}}>
                          <div style={{minWidth:56,fontSize:12,color:"#666",paddingTop:2}}>{s.time}</div>
                          <div style={{minWidth:8,display:"flex",flexDirection:"column",alignItems:"center"}}>
                            <div style={{width:8,height:8,borderRadius:"50%",background:s.color,marginTop:4,flexShrink:0,boxShadow:"0 0 6px "+s.color+"66"}}/>
                            {i<arr.length-1&&<div style={{width:1,flex:1,background:"#252525",marginTop:3}}/>}
                          </div>
                          <div style={{flex:1}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                              <span style={{fontSize:13,fontWeight:500,color:"#ddd"}}>{s.label}</span>
                              <span style={{fontSize:11,background:"#222",color:"#666",padding:"1px 7px",borderRadius:5}}>{s.dur}</span>
                            </div>
                            <div style={{fontSize:12,color:"#666"}}>{s.detail}</div>
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
                  <div key={goalKey} style={{background:"#141414",borderRadius:12,padding:"1rem",marginBottom:12,border:"0.5px solid #252525"}}>
                    <div style={{fontSize:11,fontWeight:500,color:"#666",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>{label}</div>
                    <textarea defaultValue={selectedAthlete[goalKey]||""} onBlur={async e=>{const val=e.target.value;setSelectedAthlete(a=>({...a,[goalKey]:val}));await supabase.from("athletes").update({[goalKey]:val}).eq("id",selectedAthlete.id);}} placeholder="What's one thing you want to improve this summer?" style={{width:"100%",minHeight:60,padding:"8px",fontSize:13,border:"0.5px solid #333",borderRadius:8,background:"#1e1e1e",color:"#ddd",fontFamily:"Georgia, serif",resize:"vertical",boxSizing:"border-box",marginBottom:6}}/>
              <button onClick={async e=>{const ta=e.target.previousSibling;const val=ta.value;setSelectedAthlete(a=>({...a,[goalKey]:val}));await supabase.from("athletes").update({[goalKey]:val}).eq("id",selectedAthlete.id);alert("Goal saved!");}} style={{padding:"6px 14px",borderRadius:8,border:"none",background:color,color:"#fff",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>Save goal →</button>
                    {selectedAthlete[taskKey]&&(
                      <div style={{marginTop:10,padding:"10px 12px",background:BG,borderRadius:8,borderLeft:"3px solid "+color}}>
                        <div style={{fontSize:11,fontWeight:500,color:color,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5}}>Task from Coach Ant</div>
                        <div style={{fontSize:13,color:"#ccc",lineHeight:1.6}}>{selectedAthlete[taskKey]}</div>
                      </div>
                    )}
                  </div>
                ))}

                <div style={{background:"#141414",borderRadius:12,border:"0.5px solid #252525",overflow:"hidden",marginBottom:12}}>
                  <button onClick={()=>setInjuryOpen(o=>!o)} style={{width:"100%",padding:"12px 16px",background:"transparent",border:"none",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",fontFamily:"Georgia, serif"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:selectedAthlete.injury?RED:GREEN,boxShadow:"0 0 6px "+(selectedAthlete.injury?RED:GREEN)+"66"}}/>
                      <span style={{fontSize:13,fontWeight:500,color:"#ddd"}}>Injury / health update</span>
                    </div>
                    <span style={{fontSize:12,color:"#555"}}>{injuryOpen?"▲":"▼"}</span>
                  </button>
                  {injuryOpen&&(
                    <div style={{padding:"0 16px 16px"}}>
                      <textarea value={injuryText} onChange={e=>setInjuryText(e.target.value)} placeholder="What's going on — what hurts, when it started..." style={{width:"100%",minHeight:80,padding:"8px",fontSize:13,border:"0.5px solid #333",borderRadius:8,background:"#1e1e1e",color:"#ddd",fontFamily:"Georgia, serif",resize:"vertical",marginBottom:8,boxSizing:"border-box"}}/>
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
                {(!draft||draftPhase==="setup")&&(
                  <div style={{background:BG,borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid #222"}}>
                    <div style={{fontSize:32,marginBottom:12}}>⏳</div>
                    <div style={{fontSize:16,color:"#fff",marginBottom:8}}>
                      {draftPhase==="setup"&&(draftGroups[myLeaderIdx]||[]).length>0
                        ?"Coach has set your group — draft pending"
                        :"Waiting for Coach Ant to start the draft..."}
                    </div>
                    <div style={{fontSize:13,color:"#555"}}>
                      {draftPhase==="setup"?"The live draft hasn't started yet. Check your My Group tab.":"Once leaders are set you'll see your draft options here."}
                    </div>
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
                        <div style={{fontSize:16,color:"#fff",marginBottom:8}}>Waiting for {draftLeaders[currentPickerIdx]||"next leader"} to pick...</div>
                        <div style={{fontSize:13,color:"#555"}}>Auto-refreshing every 3 seconds</div>
                      </div>
                    )}
                    <div style={{marginTop:12,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      {Array.from({length:numLeaders},(_,i)=>(
                        <div key={i} style={{background:LB[i%LB.length],borderRadius:10,padding:"8px 10px",border:"0.5px solid "+LC[i%LC.length]+"44"}}>
                          <div style={{fontSize:11,fontWeight:500,color:LC[i%LC.length],marginBottom:4}}>{draftLeaders[i]}{i===myLeaderIdx?" (you)":""}</div>
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
                      const myColor=LC[myLeaderIdx%LC.length];
                      const myBg=LB[myLeaderIdx%LB.length];
                      return(
                        <div style={{background:myBg,borderRadius:14,padding:"1.25rem",marginBottom:12,border:"2px solid "+myColor}}>
                          <div style={{fontSize:11,color:myColor,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Your group</div>
                          {myBrac&&(
                            <div style={{marginBottom:12}}>
                              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                                <div style={{width:14,height:14,borderRadius:"50%",background:myBrac.hex}}/>
                                <span style={{fontSize:13,fontWeight:600,color:myColor}}>{myBrac.color} — {myBrac.ref}</span>
                              </div>
                              <div style={{fontSize:14,color:"#1a1a1a",fontStyle:"italic",lineHeight:1.7,padding:"10px 12px",background:"rgba(255,255,255,0.6)",borderRadius:8,borderLeft:"3px solid "+myBrac.hex}}>
                                "{myBrac.text}"
                              </div>
                            </div>
                          )}
                          {myTd&&<div style={{display:"inline-block",fontSize:11,fontWeight:500,padding:"3px 12px",borderRadius:6,background:myTd.bg,color:myTd.color,marginBottom:10}}>{myTd.label}</div>}
                          <div style={{fontSize:11,fontWeight:500,color:myColor,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:8}}>Your team</div>
                          <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"rgba(255,255,255,0.7)",borderRadius:8,marginBottom:4}}>
                            <div style={{width:28,height:28,borderRadius:"50%",background:myColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:"#fff"}}>{selectedAthlete.name[0]}</div>
                            <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a"}}>{selectedAthlete.name} <span style={{fontSize:11,color:myColor}}>— Leader</span></div>
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
                      {draftLeaders.filter(Boolean).map((leader,i)=>{
                        const color=LC[i%LC.length];
                        const bg=LB[i%LB.length];
                        const brac=BRACELETS.find(b=>b.ref===draftBracelets[i]?.ref);
                        const isMe=i===myLeaderIdx;
                        return(
                          <div key={i} style={{background:isMe?bg:"#141414",borderRadius:12,padding:"10px",border:"0.5px solid "+(isMe?color:"#222"),borderTop:"3px solid "+(isMe?color:"#333")}}>
                            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                              {brac&&<div style={{width:8,height:8,borderRadius:"50%",background:brac.hex}}/>}
                              <span style={{fontSize:12,fontWeight:500,color:isMe?color:"#ccc"}}>{leader}{isMe?" ✓":""}</span>
                            </div>
                            {brac&&<div style={{fontSize:10,color:isMe?"#555":"#444",fontStyle:"italic",marginBottom:4}}>"{brac.text}"</div>}
                            {(draftGroups[i]||[]).map(n=><div key={n} style={{fontSize:11,color:isMe?"#444":"#666",padding:"2px 0"}}>{n}</div>)}
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
                {(!draft||(myGroupIdx==null&&myLeaderIdx<0))?(
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
                <div style={{background:"#141414",borderRadius:12,padding:"1.25rem",marginTop:12,border:"0.5px solid #252525"}}>
                  <div style={{fontSize:11,fontWeight:500,color:"#666",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:10}}>Check-in history</div>
                  {attendance.length===0&&<div style={{fontSize:12,color:"#555",textAlign:"center",padding:"1rem 0"}}>No check-ins yet.</div>}
                  {attendance.slice(0,30).map((rec,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<Math.min(attendance.length,30)-1?"0.5px solid #1e1e1e":"none"}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:500,color:"#ddd"}}>{rec.day} · {rec.date}</div>
                        <div style={{fontSize:11,color:"#555"}}>{rec.time_logged||""}</div>
                      </div>
                      <span style={{fontSize:10,padding:"4px 10px",borderRadius:6,background:rec.status==="early"?GREEN+"22":rec.status==="late"?GOLD+"22":RED+"22",color:rec.status==="early"?GREEN:rec.status==="late"?GOLD:RED,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",border:"0.5px solid "+(rec.status==="early"?GREEN:rec.status==="late"?GOLD:RED)+"44"}}>
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
                <div style={{fontSize:13,color:"#555",lineHeight:1.7,marginBottom:14}}>This is your private line to Coach Ant. Nobody else sees what you send here.</div>
                <div style={{background:"#141414",borderRadius:12,padding:"1rem",marginBottom:12,border:"0.5px solid #252525"}}>
                  <div style={{fontSize:11,fontWeight:500,color:"#666",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>Message Coach Ant</div>
                  {feedbackSent?<div style={{fontSize:13,color:GREEN,fontWeight:500,padding:"10px",background:"#0a1f0a",borderRadius:8,border:"0.5px solid "+GREEN+"44"}}>Message sent to Coach Ant.</div>:(
                    <><textarea value={feedbackText} onChange={e=>setFeedbackText(e.target.value)} placeholder="Type your message to Coach Ant..." style={{width:"100%",minHeight:90,padding:"8px",fontSize:13,border:"0.5px solid #333",borderRadius:8,background:"#1e1e1e",color:"#ddd",fontFamily:"Georgia, serif",resize:"vertical",marginBottom:8,boxSizing:"border-box"}}/><button onClick={sendFeedback} style={{padding:"10px 20px",borderRadius:8,border:"none",background:"linear-gradient(135deg,"+PUR+",#3a2d8f)",color:"#fff",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"Georgia, serif"}}>Send to Coach Ant</button></>
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
