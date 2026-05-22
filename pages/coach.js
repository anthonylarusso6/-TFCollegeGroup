// v1776642403
import { useState, useEffect, useRef } from "react";
import { BG, PUR, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { ErrorBoundary } from "../components/ErrorBoundary";
import TeamsView from "../components/TeamsView";
import ProgramUpload from "../components/ProgramUpload";
import Head from "next/head";
import { supabase } from "../lib/supabase";
import Draft from "../components/Draft";
import Accountability from "../components/Accountability";
import FellowshipFriday from "../components/FellowshipFriday";
import MindsetMonday from "../components/MindsetMonday";
import CultureEvents from "../components/CultureEvents";

const COACH_PIN="1803";

function DriveLinksManager(){
  const[links,setLinks]=useState([]);
  const[title,setTitle]=useState("");
  const[url,setUrl]=useState("");
  const[desc,setDesc]=useState("");
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);

  useEffect(()=>{
    (async()=>{
      try{const{data}=await supabase.from("announcements").select("*").eq("type","drive_link").eq("active",true).order("created_at",{ascending:false});setLinks(data||[]);}catch(e){}
    })();
  },[]);

  const addLink=async()=>{
    if(!title.trim()||!url.trim())return;
    setSaving(true);
    try{
      const{data}=await supabase.from("announcements").insert({
        type:"drive_link",active:true,
        message:JSON.stringify({title,url,description:desc})
      }).select().single();
      if(data)setLinks(p=>[data,...p]);
    }catch(e){}
    setTitle("");setUrl("");setDesc("");setSaving(false);setSaved(true);
    setTimeout(()=>setSaved(false),2000);
  };

  const removeLink=async(id)=>{
    try{await supabase.from("announcements").update({active:false}).eq("id",id);}catch(e){}
    setLinks(p=>p.filter(l=>l.id!==id));
  };

  return(
    <div>
      {links.map((l,i)=>{
        const data=JSON.parse(l.message||"{}");
        return(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#141414",borderRadius:10,marginBottom:8,border:"0.5px solid #252525"}}>
            <div style={{fontSize:20}}>📄</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:"#ddd",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{data.title}</div>
              {data.description&&<div style={{fontSize:11,color:"#666"}}>{data.description}</div>}
            </div>
            <a href={data.url} target="_blank" rel="noreferrer" style={{fontSize:11,color:"#4285f4",textDecoration:"none",fontFamily:"Georgia,serif",padding:"4px 8px",border:"0.5px solid #4285f4",borderRadius:6}}>Open</a>
            <button onClick={()=>removeLink(l.id)} style={{fontSize:11,color:RED,background:"transparent",border:"0.5px solid "+RED+"44",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontFamily:"Georgia,serif"}}>Remove</button>
          </div>
        );
      })}
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Document title (e.g. Summer Program Poster)" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"0.5px solid #222",fontSize:12,fontFamily:"Georgia,serif",background:"#111",color:"#ddd",marginBottom:6,boxSizing:"border-box"}}/>
      <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="Google Drive link" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"0.5px solid #222",fontSize:12,fontFamily:"Georgia,serif",background:"#111",color:"#ddd",marginBottom:6,boxSizing:"border-box"}}/>
      <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Short description (optional)" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"0.5px solid #222",fontSize:12,fontFamily:"Georgia,serif",background:"#111",color:"#ddd",marginBottom:8,boxSizing:"border-box"}}/>
      <button onClick={addLink} disabled={!title.trim()||!url.trim()||saving} style={{width:"100%",padding:"10px",borderRadius:8,border:"none",background:title&&url?"#4285f4":"#e0e0e0",color:title&&url?"#fff":"#aaa",fontSize:13,fontWeight:600,cursor:title&&url?"pointer":"not-allowed",fontFamily:"Georgia,serif"}}>
        {saved?"✓ Added!":saving?"Saving...":"Add document →"}
      </button>
    </div>
  );
}



export default function Coach(){
  const[authed,setAuthed]=useState(false);
  const[coachRole,setCoachRole]=useState("ant");
  const[selectedCoach,setSelectedCoach]=useState(null); // "ant" or "kevin"
  const[pin,setPin]=useState("");
  const pinRef=useRef(null);
  const[pinStep,setPinStep]=useState("select"); // "select" | "enter" | "create" | "confirm"
  const[pinConfirm,setPinConfirm]=useState("");
  const[pinError,setPinError]=useState("");
  const[tab,setTab]=useState(coachRole==="kevin"?"roster":"overview");
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
  const[attDate,setAttDate]=useState((()=>{const n=new Date();return n.getFullYear()+"-"+String(n.getMonth()+1).padStart(2,"0")+"-"+String(n.getDate()).padStart(2,"0");})());
  const[attRecords,setAttRecords]=useState(null);
  const[weightSort,setWeightSort]=useState("change");
  const[weightData,setWeightData]=useState(null);
  const[goalsSearch,setGoalsSearch]=useState("");
  const[goalsFilter,setGoalsFilter]=useState("all");
  const[goalReviews,setGoalReviews]=useState({});
  const[lbSort,setLbSort]=useState("early");
  const[inboxFilter,setInboxFilter]=useState("all");
  const[inboxAthFilter,setInboxAthFilter]=useState("");
  const[rosterSearch,setRosterSearch]=useState("");
  const[rosterStatus,setRosterStatus]=useState("active");
  const[rosterExpanded,setRosterExpanded]=useState(null);
  const[coachPrayers,setCoachPrayers]=useState([]);
  const[prayedFor,setPrayedFor]=useState({});
  const[weightLogs,setWeightLogs]=useState([]);
  const[engAthletes,setEngAthletes]=useState([]);
  const[uploadingPhoto,setUploadingPhoto]=useState(null);
  const[qrDataUrl,setQrDataUrl]=useState("");
  const[qrType,setQrType]=useState("checkin");
  const[qrFullscreen,setQrFullscreen]=useState(false);
  const[anvilWinner,setAnvilWinner]=useState("");
  const[anvilNote,setAnvilNote]=useState("");
  const[anvilDate,setAnvilDate]=useState("");

  useEffect(()=>{if(authed)loadAll();},[authed]);

  useEffect(()=>{
    if(tab!=="qr")return;
    const url=qrType==="checkin"?"https://tfcollegegroup.com/checkin":"https://tfcollegegroup.com/athlete";
    import("qrcode").then(QRCode=>{
      QRCode.default.toDataURL(url,{width:280,margin:2,color:{dark:"#1a1a1a",light:"#ffffff"}}).then(setQrDataUrl);
    });
  },[tab,qrType]);

  const loadAll=async()=>{
    setLoading(true);
    try{
    const[{data:aths},{data:att},{data:inb},{data:anv},{data:lb},{data:ann}]=await Promise.all([
      supabase.from("athletes").select("*").order("name"),
      supabase.from("attendance").select("*,athletes(name)").order("date",{ascending:false}).limit(200),
      supabase.from("inbox").select("*,athletes(name)").eq("done",false).order("created_at",{ascending:false}),
      supabase.from("anvil").select("*").order("created_at",{ascending:false}),
      supabase.from("leaderboard").select("*,athletes(name)").order("early_count",{ascending:false}),
      supabase.from("announcements").select("*").eq("active",true).order("created_at",{ascending:false}).limit(1),
    ]);
    if(aths)setAthletes(prev=>aths.map(a=>({...a,photo_url:a.photo_url||prev.find(p=>p.id===a.id)?.photo_url||null})));
    if(att)setAttendance(att);
    if(inb)setInbox(inb);
    if(anv)setAnvil(anv);
    if(lb)setLeaderboard(lb);
    if(ann&&ann.length>0){setCurrentAnnouncement(ann[0]);setAnnouncement(ann[0].message);}
    }catch(e){console.error("loadAll error:",e);}
    setLoading(false);
    // Load secondary data independently — won't block main load
    try{const{data}=await supabase.from("inbox").select("*,athletes(name)").eq("type","prayer").order("created_at",{ascending:false});if(data)setCoachPrayers(data);}catch(e){}
    try{const{data}=await supabase.from("weight_log").select("*").order("date",{ascending:false});if(data)setWeightLogs(data);}catch(e){}
    try{const{data}=await supabase.from("athletes").select("id,name,photo_url,athletic_goal,character_goal,mindset_note_1,mindset_note_2,mindset_note_3,mindset_note_4,mindset_note_5,mindset_note_6").eq("status","active").order("name");if(data)setEngAthletes(data);}catch(e){}
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

  const uploadAthletePhoto=async(athleteId,file)=>{
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onerror=()=>reject(new Error("Could not read file"));
      reader.onload=ev=>{
        const img=new Image();
        img.onerror=()=>reject(new Error("Could not decode image"));
        img.onload=()=>{
          const SIZE=150;
          const canvas=document.createElement("canvas");
          canvas.width=SIZE;canvas.height=SIZE;
          const ctx=canvas.getContext("2d");
          const min=Math.min(img.width,img.height);
          ctx.drawImage(img,(img.width-min)/2,(img.height-min)/2,min,min,0,0,SIZE,SIZE);
          canvas.toBlob(async blob=>{
            try{
              const fileName=`athlete_${athleteId}_${Date.now()}.jpg`;
              const{error:upErr}=await supabase.storage.from("athlete-photos").upload(fileName,blob,{contentType:"image/jpeg",upsert:true});
              if(upErr){reject(upErr);return;}
              const{data:{publicUrl}}=supabase.storage.from("athlete-photos").getPublicUrl(fileName);
              resolve(publicUrl);
            }catch(e){reject(e);}
          },"image/jpeg",0.8);
        };
        img.src=ev.target.result;
      };
      reader.readAsDataURL(file);
    });
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
    const _n=new Date();const _e=new Date(_n.toLocaleString("en-US",{timeZone:"America/New_York"}));const _iso=_e.getFullYear()+"-"+String(_e.getMonth()+1).padStart(2,"0")+"-"+String(_e.getDate()).padStart(2,"0");
    await supabase.from("anvil").insert({athlete_name:anvilWinner,note:anvilNote,date_awarded:anvilDate||_iso,type:"individual",athlete_role:"iron"});
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

  const now=new Date();
  const estNow=new Date(now.toLocaleString("en-US",{timeZone:"America/New_York"}));
  const dayName=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][estNow.getDay()];
  const isClassDay=["Mon","Tue","Thu","Fri"].includes(dayName);
  const estTodayStr=estNow.getFullYear()+"-"+String(estNow.getMonth()+1).padStart(2,"0")+"-"+String(estNow.getDate()).padStart(2,"0");
  const todayAtt=attendance.filter(a=>a.date===estTodayStr);
  const earlyToday=todayAtt.filter(a=>a.status==="early").length;
  const lateToday=todayAtt.filter(a=>a.status==="late").length;
  const thisMonth=estNow.getFullYear()+"-"+String(estNow.getMonth()+1).padStart(2,"0");
  // Find Monday of current week
  const dowEst=estNow.getDay();// 0=Sun
  const daysToMon=dowEst===0?6:dowEst-1;
  const monDate=new Date(estNow);
  monDate.setDate(estNow.getDate()-daysToMon);
  monDate.setHours(0,0,0,0);
  const weekDays=["Mon","Tue","Thu","Fri"].map((dn,idx)=>{
    const d=new Date(monDate);
    d.setDate(monDate.getDate()+[0,1,3,4][idx]);
    const yr=d.getFullYear();
    const mo=String(d.getMonth()+1).padStart(2,"0");
    const dy=String(d.getDate()).padStart(2,"0");
    const ds=yr+"-"+mo+"-"+dy;
    const recs=attendance.filter(r=>r.date===ds);
    return{dn,ds,early:recs.filter(r=>r.status==="early").length,late:recs.filter(r=>r.status==="late").length};
  });
  const monthClassDates=[...new Set(attendance.filter(r=>r.date&&r.date.startsWith(thisMonth)).map(r=>r.date))];
  const mostMissed=monthClassDates.length>=2?athletes.filter(a=>a.status==="active").map(a=>({name:a.name,missed:monthClassDates.length-attendance.filter(r=>r.athlete_id===a.id&&r.date&&r.date.startsWith(thisMonth)).length})).filter(a=>a.missed>0).sort((a,b)=>b.missed-a.missed).slice(0,5):[];

  const ALL_TABS=[
    {id:"overview",label:"Overview",icon:"📊"},
    {id:"draft",label:"Draft",icon:"🎯"},
    {id:"teams",label:"Teams",icon:"👥"},
    {id:"roster",label:"Roster",icon:"👥"},
    {id:"attendance",label:"Attendance",icon:"📅"},
    {id:"accountability",label:"Accountability",icon:"✊"},
    {id:"anvil",label:"The Anvil",icon:"⚒"},
    {id:"inbox",label:`Inbox${inboxCount>0?` (${inboxCount})`:""}`,icon:"📬"},
    {id:"leaderboard",label:"Leaderboard",icon:"🏆"},
    {id:"goals",label:"Goals",icon:"🎯"},
    {id:"fellowship",label:"Fellowship",icon:"🙏"},
    {id:"mindset",label:"Mindset",icon:"💡"},
    {id:"culture",label:"Culture",icon:"🔥"},
    {id:"prayers",label:"Prayers",icon:"🙌"},
    {id:"weights",label:"Weights",icon:"⚖️"},
    {id:"photos",label:"Photos",icon:"📸"},
    {id:"engagement",label:"Engagement",icon:"📢"},
    {id:"qr",label:"QR Code",icon:"📱"},
  ];
  // Kevin only sees roster, mindset and attendance
  const KEVIN_TABS=["roster","mindset","attendance"];
  // Malkmus (Luke) sees overview, attendance, leaderboard, culture, anvil, weights, engagement
  const LUKE_TABS=["overview","attendance","leaderboard","culture","anvil","weights","engagement"];
  const TABS=coachRole==="kevin"?ALL_TABS.filter(t=>KEVIN_TABS.includes(t.id)):(coachRole==="malkmus"||coachRole==="adoriyan")?ALL_TABS.filter(t=>LUKE_TABS.includes(t.id)):ALL_TABS;

  // Kevin PIN stored in localStorage
  const getKevinPin=()=>typeof window!=="undefined"?localStorage.getItem("kevin_coach_pin_v2"):null;
  const saveKevinPin=(p)=>localStorage.setItem("kevin_coach_pin_v2",p);
  // Malkmus PIN stored in localStorage
  const getMalkmusPin=()=>typeof window!=="undefined"?localStorage.getItem("malkmus_coach_pin"):null;
  const saveMalkmusPin=(p)=>localStorage.setItem("malkmus_coach_pin",p);
  // Adoriyan PIN stored in localStorage
  const getAdoriyanPin=()=>typeof window!=="undefined"?localStorage.getItem("adoriyan_coach_pin"):null;
  const saveAdoriyanPin=(p)=>localStorage.setItem("adoriyan_coach_pin",p);

  function handlePinKey(k){
    if(k===null)return;
    if(k==="⌫"){setPin(p=>p.slice(0,-1));setPinError("");return;}
    if(pin.length>=4)return;
    const newPin=pin+String(k);
    setPin(newPin);
    if(newPin.length===4){
      if(pinStep==="enter"){
        if(selectedCoach==="ant"){
          if(newPin===COACH_PIN){setAuthed(true);setCoachRole("ant");setPin("");}
          else{setPinError("Wrong PIN. Try again.");setPin("");}
        }else if(selectedCoach==="kevin"){
          const kp=getKevinPin();
          if(kp&&newPin===kp){setAuthed(true);setCoachRole("kevin");setTab("roster");setPin("");}
          else{setPinError("Wrong PIN. Try again.");setPin("");}
        }else if(selectedCoach==="malkmus"){
          const mp=getMalkmusPin();
          if(mp&&newPin===mp){setAuthed(true);setCoachRole("malkmus");setTab("overview");setPin("");}
          else{setPinError("Wrong PIN. Try again.");setPin("");}
        }
      }else if(pinStep==="create"){
        setPinConfirm(newPin);setPin("");setPinStep("confirm");setPinError("");
      }else if(pinStep==="confirm"){
        if(selectedCoach==="malkmus"){
          if(newPin===pinConfirm){saveMalkmusPin(newPin);setAuthed(true);setCoachRole("malkmus");setTab("overview");setPin("");}
          else{setPinError("PINs don't match. Try again.");setPin("");setPinStep("create");setPinConfirm("");}
        }else{
          if(newPin===pinConfirm){saveKevinPin(newPin);setAuthed(true);setCoachRole("kevin");setTab("roster");setPin("");}
          else{setPinError("PINs don't match. Try again.");setPin("");setPinStep("create");setPinConfirm("");}
        }
      }
    }
  }

  const coaches=[
    {id:"ant",name:"Coach Ant",sub:"Head Coach",color:GOLD,emoji:"⚒"},
    {id:"kevin",name:"Coach Kevin",sub:"Guest Speaker",color:PUR,emoji:"📖"},
    {id:"malkmus",name:"Luke",sub:"Assistant Coach",color:"#1A4F8A",emoji:"📋"},
    {id:"adoriyan",name:"Adoriyan Daniels",sub:"Assistant Coach",color:"#0F6E56",emoji:"💪"},
  ];

  if(!authed) return(
    <>
      <Head><title>Coach — TF College Group</title></Head>
      <div style={{minHeight:"100vh",background:"#080808",fontFamily:"Georgia, serif",display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem",position:"relative",overflow:"hidden"}}>
        <div style={{position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",width:600,height:400,background:"radial-gradient(ellipse at top,#E8720C10 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,transparent,#E8720C,#C0392B,transparent)"}}/>
        <div style={{textAlign:"center",maxWidth:340,width:"100%",position:"relative"}}>

          {/* Step 1 — Select coach */}
          {pinStep==="select"&&(
            <>
              <div style={{width:72,height:72,borderRadius:20,background:"linear-gradient(145deg,#E8720C,#C0392B,#8B0000)",margin:"0 auto 1.5rem",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,boxShadow:"0 0 60px #E8720C55,0 0 120px #E8720C22"}}>⚒</div>
              <div style={{fontSize:24,fontWeight:900,color:"#fff",marginBottom:4,letterSpacing:"-0.02em",textTransform:"uppercase"}}>Coach Login</div>
              <div style={{fontSize:12,color:"#555",marginBottom:28,letterSpacing:"0.04em"}}>Select your name to continue</div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {coaches.map(c=>(
                  <button key={c.id} onClick={()=>{
                    setSelectedCoach(c.id);
                    setPin("");setPinError("");
                    const hasPin=c.id==="ant"||(c.id==="kevin"&&getKevinPin())||(c.id==="malkmus"&&getMalkmusPin())||(c.id==="adoriyan"&&getAdoriyanPin());
                    setPinStep(hasPin?"enter":"create");
                  }} style={{width:"100%",padding:0,borderRadius:14,border:"1px solid #1e1e1e",background:"linear-gradient(135deg,#0e0e0e,#131313)",color:"#fff",cursor:"pointer",fontFamily:"Georgia, serif",display:"flex",alignItems:"stretch",textAlign:"left",overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,0.4)"}}>
                    <div style={{width:4,background:"linear-gradient(180deg,"+c.color+","+c.color+"88)",flexShrink:0}}/>
                    <div style={{padding:"14px 14px",display:"flex",alignItems:"center",gap:14,flex:1}}>
                      <div style={{width:44,height:44,borderRadius:"50%",background:c.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0,boxShadow:"0 0 20px "+c.color+"55"}}>{c.emoji}</div>
                      <div>
                        <div style={{fontSize:15,fontWeight:700,letterSpacing:"-0.01em"}}>{c.name}</div>
                        <div style={{fontSize:12,color:"#555"}}>{c.sub}</div>
                      </div>
                      <div style={{marginLeft:"auto",color:"#2a2a2a",fontSize:18,paddingRight:4}}>›</div>
                    </div>
                  </button>
                ))}
              </div>
              <a href="/" style={{display:"block",marginTop:24,fontSize:11,color:"#333",letterSpacing:"0.04em"}}>← Back to home</a>
            </>
          )}

          {/* Step 2 — PIN entry / create */}
          {pinStep!=="select"&&(
            <>
              <button onClick={()=>{setPinStep("select");setPin("");setPinError("");setSelectedCoach(null);}} style={{position:"absolute",top:20,left:20,background:"#111",border:"0.5px solid #1e1e1e",color:"#555",fontSize:12,cursor:"pointer",fontFamily:"Georgia, serif",padding:"6px 14px",borderRadius:10}}>← Back</button>
              {(() => {
                const c=coaches.find(x=>x.id===selectedCoach);
                return(
                  <div style={{position:"relative",display:"inline-block",marginBottom:14}}>
                    <div style={{position:"absolute",inset:-6,borderRadius:"50%",border:"1px solid "+c.color+"33",pointerEvents:"none"}}/>
                    <div style={{width:68,height:68,borderRadius:"50%",background:c.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,boxShadow:"0 0 40px "+c.color+"44"}}>{c.emoji}</div>
                  </div>
                );
              })()}
              <div style={{fontSize:22,fontWeight:900,color:"#fff",marginBottom:4,letterSpacing:"-0.01em",textTransform:"uppercase"}}>{coaches.find(x=>x.id===selectedCoach)?.name}</div>
              <div style={{fontSize:12,color:"#555",marginBottom:20,letterSpacing:"0.04em"}}>
                {pinStep==="create"?"Create your 4-digit PIN":pinStep==="confirm"?"Confirm your PIN":"Enter your PIN"}
              </div>
              <div style={{display:"flex",justifyContent:"center",gap:14,marginBottom:16}}>
                {[0,1,2,3].map(i=>{const cc=coaches.find(x=>x.id===selectedCoach)?.color||GOLD;return(<div key={i} style={{width:14,height:14,borderRadius:"50%",border:"2px solid "+cc+(i<pin.length?"":"44"),background:i<pin.length?cc:"transparent",transition:"all 0.15s",boxShadow:i<pin.length?"0 0 10px "+cc+"88":"none"}}/>);})}
              </div>
              {/* Hidden keyboard input */}
              <input
                ref={pinRef}
                autoFocus
                type="tel"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={e=>{
                  const val=e.target.value.replace(/[^0-9]/g,"").slice(0,4);
                  setPin(val);
                  if(val.length===4){
                    if(pinStep==="enter"){
                      if(selectedCoach==="ant"){
                        if(val===COACH_PIN){setAuthed(true);setCoachRole("ant");setPin("");}
                        else{setPinError("Wrong PIN. Try again.");setPin("");}
                      }else if(selectedCoach==="kevin"){
                        const kp=getKevinPin();
                        if(kp&&val===kp){setAuthed(true);setCoachRole("kevin");setTab("roster");setPin("");}
                        else{setPinError("Wrong PIN. Try again.");setPin("");}
                      }else if(selectedCoach==="adoriyan"){
                        const ap=getAdoriyanPin();
                        if(ap&&val===ap){setAuthed(true);setCoachRole("adoriyan");setTab("overview");setPin("");}
                        else{setPinError("Wrong PIN. Try again.");setPin("");}
                      }else if(selectedCoach==="malkmus"){
                        const mp=getMalkmusPin();
                        if(mp&&val===mp){setAuthed(true);setCoachRole("malkmus");setTab("overview");setPin("");}
                        else{setPinError("Wrong PIN. Try again.");setPin("");}
                      }
                    }else if(pinStep==="create"){
                      setPinConfirm(val);setPinStep("confirm");setPin("");
                    }else if(pinStep==="confirm"){
                      if(selectedCoach==="adoriyan"){
                        if(val===pinConfirm){saveAdoriyanPin(val);setAuthed(true);setCoachRole("adoriyan");setTab("overview");setPin("");}
                        else{setPinError("PINs don't match. Try again.");setPin("");setPinStep("create");setPinConfirm("");}
                      }else if(selectedCoach==="malkmus"){
                        if(val===pinConfirm){saveMalkmusPin(val);setAuthed(true);setCoachRole("malkmus");setTab("overview");setPin("");}
                        else{setPinError("PINs don't match. Try again.");setPin("");setPinStep("create");setPinConfirm("");}
                      }else{
                        if(val===pinConfirm){saveKevinPin(val);setAuthed(true);setCoachRole("kevin");setTab("roster");setPin("");}
                        else{setPinError("PINs don't match. Try again.");setPin("");setPinStep("create");setPinConfirm("");}
                      }
                    }
                  }
                }}
                style={{position:"fixed",top:-100,left:-100,width:1,height:1,opacity:0,pointerEvents:"none"}}
              />
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,maxWidth:240,margin:"0 auto"}}>
                {[1,2,3,4,5,6,7,8,9,null,0,"⌫"].map((k,i)=>(
                  <button key={i} onClick={()=>{handlePinKey(k);pinRef.current&&pinRef.current.focus();}} style={{padding:"14px 8px",borderRadius:12,border:"0.5px solid "+(k===null?"transparent":"#1a1a1a"),background:k===null?"transparent":k==="⌫"?"#141414":"#111",fontSize:20,fontWeight:300,cursor:k===null?"default":"pointer",color:k==="⌫"?"#555":"#e0e0e0",fontFamily:"sans-serif",transition:"background 0.1s"}}>
                    {k===null?"":k}
                  </button>
                ))}
              </div>
              <div style={{marginTop:10,fontSize:10,color:"#2a2a2a",textAlign:"center",letterSpacing:"0.04em"}}>Tap keypad or type on keyboard</div>
              {pinError&&<div style={{marginTop:12,fontSize:12,color:"#ff5555",padding:"8px 16px",background:"#1a0505",borderRadius:10,border:"1px solid #3a0808"}}>{pinError}</div>}
            </>
          )}
        </div>
      </div>
    </>
  );

  if(loading) return(
    <div style={{minHeight:"100vh",background:"#080808",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:"40%",left:"50%",transform:"translate(-50%,-50%)",width:600,height:400,background:"radial-gradient(ellipse,#E8720C10 0%,transparent 65%)",pointerEvents:"none"}}/>
      <div style={{textAlign:"center",position:"relative"}}>
        <div style={{width:80,height:80,borderRadius:22,background:"linear-gradient(145deg,#E8720C,#C0392B,#8B0000)",margin:"0 auto 20px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:42,boxShadow:"0 0 80px #E8720C55,0 0 160px #E8720C22"}}>⚒</div>
        <div style={{fontSize:11,color:"#E8720C",letterSpacing:"0.25em",textTransform:"uppercase",fontWeight:700}}>Coach Dashboard</div>
      </div>
    </div>
  );

  return(
    <>
      <Head><title>Coach Dashboard — TF College Group</title></Head>
      <div style={{fontFamily:"Georgia, serif",paddingBottom:"2rem",background:"#080808",minHeight:"100vh"}}>

        <div style={{background:"linear-gradient(180deg,#0e0600 0%,#0a0505 50%,#080808 100%)",borderBottom:"1px solid #1a0800",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,transparent,#E8720C,#C0392B,transparent)"}}/>
          <div style={{position:"absolute",top:-40,right:-40,width:200,height:200,borderRadius:"50%",background:"#E8720C08",filter:"blur(50px)",pointerEvents:"none"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px 10px",position:"relative"}}>
            <div>
              <div style={{fontSize:18,fontWeight:900,color:"#fff",letterSpacing:"-0.01em",textTransform:"uppercase"}}>TF College Group</div>
              <div style={{fontSize:11,color:"#555",marginTop:2,letterSpacing:"0.04em"}}>{coachRole==="adoriyan"?"Adoriyan":coachRole==="malkmus"?"Luke":coachRole==="kevin"?"Kevin":"Coach Ant"} · {dayName} · <span style={{color:isClassDay?"#E8720C":"#444"}}>{isClassDay?"Class day":"No class"}</span></div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:11,color:"#555",marginBottom:2}}>{athletes.filter(a=>a.status==="active").length} athletes</div>
              <button onClick={()=>setAuthed(false)} style={{fontSize:10,color:"#333",background:"transparent",border:"none",cursor:"pointer",fontFamily:"Georgia, serif",letterSpacing:"0.04em"}}>Sign out</button>
            </div>
          </div>
          <div style={{display:"flex",overflowX:"auto",scrollbarWidth:"none",WebkitOverflowScrolling:"touch",borderTop:"1px solid #141414"}}>
            {TABS.map(t=>{
              const ICONS={"overview":"📊","draft":"🎯","teams":"👥","roster":"📋","attendance":"📅","accountability":"✊","anvil":"⚒","inbox":"📬","leaderboard":"🏆","goals":"🎯","fellowship":"🙏","mindset":"💡","culture":"🔥","prayers":"🙌","weights":"⚖️","photos":"📸","engagement":"📢","qr":"📱"};
              const isActive=tab===t.id;
              return(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"10px 12px 8px",background:isActive?"#0e0e0e":"transparent",border:"none",borderBottom:"2px solid "+(isActive?"#E8720C":"transparent"),borderRight:"none",borderLeft:"none",borderTop:"none",color:isActive?"#fff":"#444",fontSize:10,fontWeight:isActive?800:400,cursor:"pointer",fontFamily:"Georgia,serif",whiteSpace:"nowrap",flexShrink:0,transition:"all 0.12s",textTransform:isActive?"uppercase":"none",letterSpacing:isActive?"0.04em":"0"}}>
                <span style={{fontSize:15,filter:isActive?"drop-shadow(0 0 4px #E8720C88)":"none"}}>{ICONS[t.id]||"•"}</span>
                <span>{t.label}</span>
              </button>
              );
            })}
          </div>
        </div>

        <div style={{padding:"1rem",maxWidth:900,margin:"0 auto"}}>
          <ErrorBoundary>

          {tab==="overview"&&(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
                {[
                  {label:"Athletes",val:athletes.filter(a=>a.status==="active").length,color:"#aaa",accent:"#1a1a1a",border:"#2a2a2a"},
                  {label:"Early today",val:earlyToday,color:GREEN,accent:GREEN+"22",border:GREEN+"33"},
                  {label:"Late today",val:lateToday,color:RED,accent:RED+"18",border:RED+"33"},
                  {label:"Inbox",val:inboxCount,color:inboxCount>0?PUR:"#444",accent:inboxCount>0?PUR+"18":"#1a1a1a",border:inboxCount>0?PUR+"33":"#252525"},
                ].map(s=>(
                  <div key={s.label} style={{background:s.accent,borderRadius:12,padding:"12px 8px",textAlign:"center",border:"1px solid "+s.border}}>
                    <div style={{fontSize:24,fontWeight:900,color:s.color,lineHeight:1}}>{s.val}</div>
                    <div style={{fontSize:10,color:"#555",marginTop:4,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+PUR+"33"}}>
                <div style={{background:"linear-gradient(140deg,"+PUR+"30,"+PUR+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+PUR+","+PUR+"44,transparent)"}}/>
                  <div style={{position:"absolute",bottom:-10,right:-8,fontSize:72,opacity:0.08,lineHeight:1,userSelect:"none",filter:"saturate(0)"}}>📣</div>
                  <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+PUR+"12,transparent 70%)",pointerEvents:"none"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                    <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+PUR+"44,"+PUR+"22)",border:"1px solid "+PUR+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+PUR+"33"}}>📣</div>
                    <div>
                      <div style={{fontSize:8,color:PUR,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Coach Ant</div>
                      <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Weekly Announcement</div>
                      <div style={{fontSize:11,color:"#666",marginTop:1}}>Pushed to every athlete's home screen</div>
                    </div>
                  </div>
                </div>
                <div style={{background:"#111",padding:"16px 18px"}}>
                  <textarea value={announcement} onChange={e=>setAnnouncement(e.target.value)} placeholder="Type this week's message to your athletes..." style={{width:"100%",minHeight:80,padding:"8px",fontSize:13,border:"0.5px solid #333",borderRadius:8,background:"#1a1a1a",color:"#ddd",fontFamily:"Georgia, serif",resize:"vertical",boxSizing:"border-box",marginBottom:8}}/>
                  <button onClick={saveAnnouncement} style={{padding:"8px 20px",borderRadius:8,border:"none",background:PUR,color:"#fff",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"Georgia, serif"}}>Save & push to athletes →</button>
                </div>
              </div>
              {(injuries.length>0||messages.length>0||prayers.length>0)&&(
                <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+RED+"33"}}>
                  <div style={{background:"linear-gradient(140deg,"+RED+"30,"+RED+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+RED+","+RED+"44,transparent)"}}/>
                    <div style={{position:"absolute",bottom:-10,right:-8,fontSize:72,opacity:0.08,lineHeight:1,userSelect:"none",filter:"saturate(0)"}}>🚨</div>
                    <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+RED+"12,transparent 70%)",pointerEvents:"none"}}/>
                    <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                      <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+RED+"44,"+RED+"22)",border:"1px solid "+RED+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+RED+"33"}}>🚨</div>
                      <div>
                        <div style={{fontSize:8,color:RED,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Action Required</div>
                        <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Needs Attention</div>
                        <div style={{fontSize:11,color:"#666",marginTop:1}}>{injuries.length>0?injuries.length+" injur"+(injuries.length===1?"y":"ies"):""}{injuries.length>0&&messages.length>0?" · ":""}{messages.length>0?messages.length+" message"+(messages.length===1?"":"s"):""}{(injuries.length>0||messages.length>0)&&prayers.length>0?" · ":""}{prayers.length>0?prayers.length+" prayer"+(prayers.length===1?"":"s"):""}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{background:"#111",padding:"16px 18px"}}>
                    {injuries.map((i,idx)=>(
                      <div key={idx} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:"0.5px solid #1e1e1e",alignItems:"flex-start"}}>
                        <div style={{width:7,height:7,borderRadius:"50%",background:RED,marginTop:5,flexShrink:0}}/>
                        <div style={{fontSize:13,color:"#ddd"}}><span style={{fontWeight:500}}>{i.athletes?.name}</span> — injury: <span style={{color:"#666"}}>{i.message}</span></div>
                      </div>
                    ))}
                    {messages.map((m,idx)=>(
                      <div key={idx} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:"0.5px solid #1e1e1e",alignItems:"flex-start"}}>
                        <div style={{width:7,height:7,borderRadius:"50%",background:PUR,marginTop:5,flexShrink:0}}/>
                        <div style={{fontSize:13,color:"#ddd"}}><span style={{fontWeight:500}}>{m.athletes?.name}</span> sent a message</div>
                      </div>
                    ))}
                    {prayers.map((p,idx)=>(
                      <div key={idx} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:"0.5px solid #1e1e1e",alignItems:"flex-start"}}>
                        <div style={{width:7,height:7,borderRadius:"50%",background:GREEN,marginTop:5,flexShrink:0}}/>
                        <div style={{fontSize:13,color:"#ddd"}}><span style={{fontWeight:500}}>{p.athletes?.name}</span> submitted a prayer request</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* This week attendance chart */}
              <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+GREEN+"33"}}>
                <div style={{background:"linear-gradient(140deg,"+GREEN+"30,"+GREEN+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GREEN+","+GREEN+"44,transparent)"}}/>
                  <div style={{position:"absolute",bottom:-10,right:-8,fontSize:72,opacity:0.08,lineHeight:1,userSelect:"none",filter:"saturate(0)"}}>📊</div>
                  <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+GREEN+"12,transparent 70%)",pointerEvents:"none"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                    <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+GREEN+"44,"+GREEN+"22)",border:"1px solid "+GREEN+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+GREEN+"33"}}>📊</div>
                    <div>
                      <div style={{fontSize:8,color:GREEN,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>This Week</div>
                      <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Attendance</div>
                      <div style={{fontSize:11,color:"#666",marginTop:1}}>Mon · Tue · Thu · Fri check-ins</div>
                    </div>
                  </div>
                </div>
                <div style={{background:"#111",padding:"16px 18px"}}>
                  {(()=>{
                    const days=weekDays.map(d=>({dayName:d.dn,early:d.early,late:d.late,isToday:d.ds===estTodayStr}));
                    const maxVal=Math.max(...days.map(d=>d.early+d.late),5);
                    return(
                      <div>
                        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-around",gap:8,height:140,marginBottom:12,borderBottom:"0.5px solid #252525",paddingBottom:4}}>
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
                                  {total>0&&<div style={{fontSize:11,fontWeight:600,color:"#fff",marginBottom:2}}>{total}</div>}
                                </div>
                                <div style={{fontSize:11,fontWeight:d.isToday?600:400,color:d.isToday?GREEN:"#666"}}>{d.dayName}</div>
                              </div>
                            );
                          })}
                        </div>
                        <div style={{display:"flex",gap:16,justifyContent:"center",fontSize:11,color:"#666"}}>
                          <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,borderRadius:2,background:GREEN}}/> Early</div>
                          <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,borderRadius:2,background:RED}}/> Late</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div style={{borderRadius:20,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+PUR+"33"}}>
                <div style={{background:"linear-gradient(140deg,"+PUR+"30,"+PUR+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+PUR+","+PUR+"44,transparent)"}}/>
                  <div style={{position:"absolute",bottom:-10,right:-8,fontSize:72,opacity:0.08,lineHeight:1,userSelect:"none",filter:"saturate(0)"}}>⏱</div>
                  <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+PUR+"12,transparent 70%)",pointerEvents:"none"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                    <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+PUR+"44,"+PUR+"22)",border:"1px solid "+PUR+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+PUR+"33"}}>⏱</div>
                    <div>
                      <div style={{fontSize:8,color:PUR,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Daily Structure</div>
                      <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Class Flow</div>
                      <div style={{fontSize:11,color:"#666",marginTop:1}}>2 hours · done by 11:20am</div>
                    </div>
                  </div>
                </div>
                <div style={{background:"#111",padding:"16px 18px"}}>
                  {[
                    {time:"9:00am",label:"Pre-class",detail:dayName==="Mon"?"Draft → Mindset Monday":dayName==="Fri"?"Fellowship Friday devotional":"Sign-in · stretch prep",color:PUR,dur:"30 min"},
                    {time:"9:30am",label:"Stretch & mobility",detail:"10 min · dynamic stretching · all athletes together",color:GREEN,dur:"10 min"},
                    {time:"9:40am",label:"Run",detail:"40–50 min · all 4 groups · hand positions enforced · leaders set pace",color:"#854F0B",dur:"40–50 min"},
                    {time:"10:30am",label:"Weight room",detail:"30–50 min · 2 groups Tier 1 · 1 group Tier 2 · 1 group Tier 3",color:PUR,dur:"30–50 min"},
                    {time:"11:15am",label:"Closeout & prayer",detail:"5 min · all together · coach or athlete prays",color:RED,dur:"5 min"},
                  ].map((s,i,arr)=>(
                    <div key={i} style={{display:"flex",gap:12,padding:"8px 0",borderBottom:i<arr.length-1?"0.5px solid #252525":"none"}}>
                      <div style={{minWidth:56,fontSize:12,color:"#555",paddingTop:2}}>{s.time}</div>
                      <div style={{minWidth:8,display:"flex",flexDirection:"column",alignItems:"center"}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:s.color,marginTop:4,flexShrink:0}}/>
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
              </div>
            </div>
          )}

          {tab==="draft"&&<Draft athletes={athletes.filter(a=>a.status==="active")}/>}

          {tab==="teams"&&(
            <TeamsView athletes={athletes}/>
          )}

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
                            try{
                              const publicUrl=await uploadAthletePhoto(a.id,file);
                              const{data,error}=await supabase.from("athletes").update({photo_url:publicUrl}).eq("id",a.id).select("id");
                              if(error){alert("Photo save failed: "+error.message);return;}
                              if(!data||data.length===0){alert("Photo not saved — check Supabase permissions.");return;}
                              setAthletes(prev=>prev.map(x=>x.id===a.id?{...x,photo_url:publicUrl}:x));
                            }catch(err){alert("Photo save failed: "+err.message);}
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
                          {hasInjury&&(
                            <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:RED,padding:"6px 10px",background:"#FCEBEB",borderRadius:8,border:"0.5px solid #ffcccc",marginBottom:8}}>
                              <span style={{flex:1}}>🤕 {a.injury_note||a.injury}</span>
                              <button onClick={async e=>{e.stopPropagation();await supabase.from("athletes").update({injury:false,injury_note:null}).eq("id",a.id);setAthletes(p=>p.map(x=>x.id===a.id?{...x,injury:false,injury_note:null}:x));}} style={{padding:"2px 8px",borderRadius:4,border:"0.5px solid #ffaaaa",background:"#fff",color:RED,fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif",flexShrink:0}}>Clear</button>
                            </div>
                          )}
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
              <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+GREEN}}>
                <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:10}}>This week's summary</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
                  {weekDays.map((d,i)=>(
                    <div key={i} onClick={()=>setAttDate(d.ds)} style={{borderRadius:10,padding:"10px 6px",textAlign:"center",cursor:"pointer",background:attDate===d.ds?GREEN:"#f9f9f9",border:"0.5px solid "+(attDate===d.ds?GREEN:"#e0e0e0")}}>
                      <div style={{fontSize:11,fontWeight:600,color:attDate===d.ds?"#fff":"#888",marginBottom:4}}>{d.dn}</div>
                      <div style={{fontSize:16,fontWeight:700,color:attDate===d.ds?"#fff":GREEN}}>{d.early}</div>
                      <div style={{fontSize:10,color:attDate===d.ds?"#cfffcc":"#888"}}>early</div>
                      {d.late>0&&<div style={{fontSize:10,color:attDate===d.ds?"#ffcccc":RED}}>{d.late} late</div>}
                    </div>
                  ))}
                </div>
              </div>

              {mostMissed.length>0&&(
                <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+RED}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:10}}>Most missed this month</div>
                  {mostMissed.map((a,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<mostMissed.length-1?"0.5px solid #f0f0f0":"none"}}>
                      <div style={{fontSize:13,color:"#1a1a1a"}}>{a.name}</div>
                      <div style={{fontSize:12,fontWeight:600,color:RED}}>{a.missed} missed</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Date selector + attendance list */}
              <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0",borderTop:"3px solid "+GREEN}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a"}}>
                    {attDate===estTodayStr?"Today's attendance":attDate}
                  </div>
                  <input type="date" value={attDate} onChange={e=>setAttDate(e.target.value)} style={{padding:"4px 8px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a"}}/>
                </div>

                {attendance.filter(r=>r.date===attDate).length>0&&(
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
                    {[{l:"Early",v:attendance.filter(r=>r.date===attDate&&r.status==="early").length,c:GREEN,bg:"#EAF3DE"},{l:"Late",v:attendance.filter(r=>r.date===attDate&&r.status==="late").length,c:RED,bg:"#FCEBEB"},{l:"Absent",v:athletes.filter(a=>a.status==="active").length-attendance.filter(r=>r.date===attDate).length,c:"#888",bg:"#f5f5f5"}].map(s=>(
                      <div key={s.l} style={{background:s.bg,borderRadius:10,padding:"10px",textAlign:"center"}}>
                        <div style={{fontSize:18,fontWeight:600,color:s.c}}>{s.v}</div>
                        <div style={{fontSize:11,color:"#888"}}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                )}

                {athletes.filter(a=>a.status==="active").map(a=>{
                  const rec=attendance.find(r=>r.athlete_id===a.id&&r.date===attDate);
                  const lb=leaderboard.find(r=>r.athlete_id===a.id);
                  const streak=lb?.current_streak||0;
                  const isAbsent=!rec;
                  return(
                    <div key={a.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"0.5px solid #f0f0f0",background:isAbsent&&attDate===estTodayStr?"#fffbf0":"transparent",borderRadius:4,paddingLeft:isAbsent&&attDate===estTodayStr?6:0}}>
                      <div style={{width:34,height:34,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:500,color:"#fff",flexShrink:0,overflow:"hidden"}}>
                        {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(a.name||"?")[0]}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div style={{fontSize:13,fontWeight:500,color:"#1a1a1a"}}>{a.name}</div>
                          {streak>0&&<span style={{fontSize:10,color:GOLD}}>🔥 {streak}</span>}
                        </div>
                        {rec?.time_logged&&<div style={{fontSize:11,color:"#888"}}>{rec.time_logged}</div>}
                        {isAbsent&&attDate===estTodayStr&&<div style={{fontSize:11,color:"#854F0B"}}>⚠ Not checked in yet</div>}
                      </div>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"flex-end"}}>
                          {rec&&<span style={{fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:6,background:rec.status==="early"?"#EAF3DE":rec.status==="excused"?"#FAEEDA":"#FCEBEB",color:rec.status==="early"?GREEN:rec.status==="excused"?"#854F0B":RED,marginRight:4}}>
                            {rec.status==="early"?"✓ Early":rec.status==="excused"?"Excused":"Late"}
                          </span>}
                          <button onClick={async()=>{
                            const now=new Date();
                            const timeStr=now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",timeZone:"America/New_York"});
                            const day=new Date(attDate+"T12:00:00").toLocaleDateString("en-US",{weekday:"short"});
                            if(rec){await supabase.from("attendance").update({status:"early",time_logged:timeStr}).eq("id",rec.id);}
                            else{await supabase.from("attendance").insert({athlete_id:a.id,date:attDate,status:"early",time_logged:timeStr,day});}
                            const{data}=await supabase.from("attendance").select("*,athletes(name)").order("date",{ascending:false}).limit(200);
                            if(data)setAttendance(data);
                          }} style={{fontSize:11,padding:"3px 8px",borderRadius:6,border:"0.5px solid "+GREEN,background:rec?.status==="early"?GREEN:"transparent",color:rec?.status==="early"?"#fff":GREEN,cursor:"pointer",fontFamily:"Georgia,serif"}}>Early</button>
                          <button onClick={async()=>{
                            const now=new Date();
                            const timeStr=now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",timeZone:"America/New_York"});
                            const day=new Date(attDate+"T12:00:00").toLocaleDateString("en-US",{weekday:"short"});
                            if(rec){await supabase.from("attendance").update({status:"late",time_logged:timeStr}).eq("id",rec.id);}
                            else{await supabase.from("attendance").insert({athlete_id:a.id,date:attDate,status:"late",time_logged:timeStr,day});}
                            const{data}=await supabase.from("attendance").select("*,athletes(name)").order("date",{ascending:false}).limit(200);
                            if(data)setAttendance(data);
                          }} style={{fontSize:11,padding:"3px 8px",borderRadius:6,border:"0.5px solid "+RED,background:rec?.status==="late"?RED:"transparent",color:rec?.status==="late"?"#fff":RED,cursor:"pointer",fontFamily:"Georgia,serif"}}>Late</button>
                          <button onClick={async()=>{
                            const now=new Date();
                            const timeStr=now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",timeZone:"America/New_York"});
                            const day=new Date(attDate+"T12:00:00").toLocaleDateString("en-US",{weekday:"short"});
                            if(rec){await supabase.from("attendance").update({status:"excused",time_logged:timeStr}).eq("id",rec.id);}
                            else{await supabase.from("attendance").insert({athlete_id:a.id,date:attDate,status:"excused",time_logged:timeStr,day});}
                            const{data}=await supabase.from("attendance").select("*,athletes(name)").order("date",{ascending:false}).limit(200);
                            if(data)setAttendance(data);
                          }} style={{fontSize:11,padding:"3px 8px",borderRadius:6,border:"0.5px solid #854F0B",background:rec?.status==="excused"?"#854F0B":"transparent",color:rec?.status==="excused"?"#fff":"#854F0B",cursor:"pointer",fontFamily:"Georgia,serif"}}>Excused</button>
                          {rec&&<button onClick={async()=>{
                            await supabase.from("attendance").delete().eq("id",rec.id);
                            const{data}=await supabase.from("attendance").select("*,athletes(name)").order("date",{ascending:false}).limit(200);
                            if(data)setAttendance(data);
                          }} style={{fontSize:11,padding:"3px 8px",borderRadius:6,border:"0.5px solid #ddd",background:"transparent",color:"#aaa",cursor:"pointer",fontFamily:"Georgia,serif"}}>✕</button>}
                        </div>
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
{tab==="culture"&&<CultureEvents athletes={athletes}/>}

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
              <ProgramUpload/>
              <div style={{height:1,background:"#e0e0e0",margin:"16px 0"}}/>
              {/* Header stat bar */}
              <div style={{background:"#0f0f0f",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"1px solid #222",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GREEN+","+PUR+")"}}/>
                <div style={{fontSize:11,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>⚖️ Weight Log</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div>
                    <div style={{fontSize:28,fontWeight:700,color:"#fff"}}>{[...new Set(weightLogs.map(l=>l.athlete_id))].length}</div>
                    <div style={{fontSize:11,color:"#555"}}>athletes tracking</div>
                  </div>
                  <div>
                    <div style={{fontSize:28,fontWeight:700,color:"#fff"}}>{weightLogs.length}</div>
                    <div style={{fontSize:11,color:"#555"}}>total entries</div>
                  </div>
                </div>
              </div>

              {weightLogs.length===0&&(
                <div style={{background:"#fff",borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid #e0e0e0"}}>
                  <div style={{fontSize:32,marginBottom:8}}>⚖️</div>
                  <div style={{fontSize:13,color:"#888"}}>No weight logs yet.</div>
                  <div style={{fontSize:11,color:"#aaa",marginTop:4}}>Athletes log from their Weight tab.</div>
                </div>
              )}

              {[...new Set(weightLogs.map(l=>l.athlete_id))].map(aid=>{
                const ath=athletes.find(a=>a.id===aid);
                const entries=[...weightLogs.filter(l=>l.athlete_id===aid)].sort((a,b)=>new Date(a.date)-new Date(b.date));
                const first=entries[0]?.weight!=null?parseFloat(entries[0].weight):null;
                const latest=entries[entries.length-1]?.weight!=null?parseFloat(entries[entries.length-1].weight):null;
                const diff=first!=null&&latest!=null?parseFloat((latest-first).toFixed(1)):null;
                const trending=diff===null?"flat":diff<0?"down":diff>0?"up":"flat";
                const trendColor=trending==="down"?GREEN:trending==="up"?RED:"#888";

                // Mini sparkline
                const sparkH=40,sparkW=100;
                const weights=entries.map(e=>parseFloat(e.weight));
                const sMin=Math.min(...weights)-1;
                const sMax=Math.max(...weights)+1;
                const sparkPts=weights.map((w,i)=>{
                  const x=(i/(Math.max(weights.length-1,1)))*sparkW;
                  const y=sparkH-((w-sMin)/(sMax-sMin||1))*sparkH;
                  return`${x},${y}`;
                }).join(" ");

                return(
                  <div key={aid} style={{background:"#fff",borderRadius:12,marginBottom:10,border:"0.5px solid #e0e0e0",overflow:"hidden"}}>
                    {/* Colored top bar based on trend */}
                    <div style={{height:3,background:trendColor}}/>
                    <div style={{padding:"1rem 1.25rem"}}>
                      {/* Athlete header */}
                      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                        <div style={{width:44,height:44,borderRadius:"50%",background:ath?.role==="forge"?RED:STEEL,overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:600,color:"#fff",border:"2px solid #f0f0f0"}}>
                          {ath?.photo_url?<img src={ath.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(ath?.name||"?")[0]}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:15,fontWeight:700,color:"#1a1a1a"}}>{ath?.name||"Unknown"}</div>
                          <div style={{fontSize:11,color:"#888"}}>{entries.length} log{entries.length!==1?"s":""} · {ath?.sport||""}</div>
                        </div>
                        {/* Big trend badge */}
                        <div style={{background:trendColor+"15",borderRadius:10,padding:"6px 12px",border:"1px solid "+trendColor+"44",textAlign:"center"}}>
                          <div style={{fontSize:18,fontWeight:800,color:trendColor}}>
                            {diff===null?"—":(diff>0?"↑":diff<0?"↓":"→")+" "+Math.abs(diff)}
                          </div>
                          <div style={{fontSize:9,color:trendColor,textTransform:"uppercase",letterSpacing:"0.05em"}}>lbs</div>
                        </div>
                      </div>

                      {/* Stats row */}
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
                        {[{label:"Start",val:first,color:"#888"},{label:"Current",val:latest,color:"#1a1a1a"},{label:"Entries",val:entries.length,color:PUR}].map(s=>(
                          <div key={s.label} style={{background:"#f9f9f9",borderRadius:10,padding:"10px 8px",textAlign:"center",border:"0.5px solid #f0f0f0"}}>
                            <div style={{fontSize:18,fontWeight:700,color:s.color}}>{s.val!=null?s.val:"—"}</div>
                            <div style={{fontSize:10,color:"#aaa",marginTop:2}}>{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Sparkline */}
                      {weights.length>1&&(
                        <div style={{background:"#f9f9f9",borderRadius:10,padding:"10px 12px",marginBottom:10}}>
                          <svg viewBox={`0 0 ${sparkW} ${sparkH}`} style={{width:"100%",height:40,overflow:"visible"}}>
                            <defs>
                              <linearGradient id={"sg"+aid} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={trendColor} stopOpacity="0.3"/>
                                <stop offset="100%" stopColor={trendColor} stopOpacity="0"/>
                              </linearGradient>
                            </defs>
                            <polygon points={`0,${sparkH} ${sparkPts} ${sparkW},${sparkH}`} fill={`url(#sg${aid})`}/>
                            <polyline points={sparkPts} fill="none" stroke={trendColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            {weights.map((w,i)=>{
                              const x=(i/(Math.max(weights.length-1,1)))*sparkW;
                              const y=sparkH-((w-sMin)/(sMax-sMin||1))*sparkH;
                              return<circle key={i} cx={x} cy={y} r={i===weights.length-1?3:1.5} fill={i===weights.length-1?"#1a1a1a":trendColor}/>;
                            })}
                          </svg>
                        </div>
                      )}

                      {/* Entry history pills */}
                      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2}}>
                        {entries.map((e,ei)=>{
                          const prev=ei>0?parseFloat(entries[ei-1].weight):null;
                          const cur=parseFloat(e.weight);
                          const wd=prev!=null?parseFloat((cur-prev).toFixed(1)):null;
                          return(
                            <div key={ei} style={{flexShrink:0,background:ei===entries.length-1?"#1a1a1a":"#f9f9f9",borderRadius:8,padding:"6px 10px",textAlign:"center",minWidth:54,border:"0.5px solid "+(ei===entries.length-1?"#333":"#f0f0f0")}}>
                              <div style={{fontSize:13,fontWeight:700,color:ei===entries.length-1?"#fff":"#1a1a1a"}}>{cur}</div>
                              {wd!=null&&<div style={{fontSize:10,color:wd<0?GREEN:wd>0?RED:"#888",fontWeight:600}}>{wd>0?"↑":wd<0?"↓":"→"}{Math.abs(wd)}</div>}
                              <div style={{fontSize:10,color:ei===entries.length-1?"#ccc":"#555",fontWeight:600}}>{e.date?.slice(5)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab==="photos"&&(
            <div>
              {/* Google Drive link manager */}
              <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid #4285f4"}}>
                <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:4}}>📄 Google Drive documents</div>
                <div style={{fontSize:12,color:"#888",marginBottom:12}}>Add a Google Drive link — athletes will see it in their Photos tab. Great for posters, programs, or any doc you want to share.</div>
                <div style={{background:"#f0f7ff",borderRadius:8,padding:"10px 12px",marginBottom:12,border:"0.5px solid #4285f422"}}>
                  <div style={{fontSize:11,color:"#4285f4",fontWeight:600,marginBottom:4}}>How to share from Google Drive:</div>
                  <div style={{fontSize:11,color:"#666",lineHeight:2}}>1. Open doc in Google Drive &nbsp; 2. Share → Anyone with link &nbsp; 3. Paste below</div>
                </div>
                <DriveLinksManager/>
              </div>
              <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+STEEL}}>
                <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:4}}>📸 Athlete Photos</div>
                <div style={{fontSize:12,color:"#888"}}>Manage athlete profile photos — these show on the athlete photo wall.</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {athletes.filter(a=>a.status==="active").map((a,i)=>(
                  <div key={i} style={{background:"#fff",borderRadius:12,padding:"1rem",border:"0.5px solid #e0e0e0",textAlign:"center"}}>
                    <div style={{width:64,height:64,borderRadius:"50%",background:STEEL,margin:"0 auto 8px",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#fff"}}>
                      {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={ev=>{ev.target.style.display="none";}} alt=""/>:a.name[0]}
                    </div>
                    <div style={{fontSize:12,fontWeight:500,color:"#1a1a1a",marginBottom:8}}>{a.name}</div>
                    <label style={{padding:"6px 12px",borderRadius:8,border:"0.5px solid "+ORANGE,background:"#FFF8F0",fontSize:11,cursor:"pointer",color:ORANGE,display:"inline-block",fontWeight:600}}>
                      {uploadingPhoto===a.id?"Saving...":a.photo_url?"Change":"Add Photo"}
                      <input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={async e=>{
                        const file=e.target.files[0];
                        if(!file)return;
                        setUploadingPhoto(a.id);
                        try{
                          const publicUrl=await uploadAthletePhoto(a.id,file);
                          const{error}=await supabase.from("athletes").update({photo_url:publicUrl}).eq("id",a.id);
                          if(error){alert("Error saving photo: "+error.message);}
                          else{setAthletes(prev=>prev.map(x=>x.id===a.id?{...x,photo_url:publicUrl}:x));}
                        }catch(err){alert("Error saving photo: "+err.message);}
                        setUploadingPhoto(null);
                      }}/>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==="qr"&&(
            <div>
              {/* Type toggle */}
              <div style={{display:"flex",gap:6,marginBottom:12}}>
                {[{id:"checkin",label:"⏱ Check-In",url:"tfcollegegroup.com/checkin"},{id:"athlete",label:"👤 Athlete Portal",url:"tfcollegegroup.com/athlete"}].map(t=>(
                  <button key={t.id} onClick={()=>setQrType(t.id)} style={{flex:1,padding:"10px 6px",borderRadius:10,border:"1px solid "+(qrType===t.id?ORANGE:"#e0e0e0"),background:qrType===t.id?ORANGE:"#fff",color:qrType===t.id?"#fff":"#888",fontSize:12,fontWeight:qrType===t.id?700:400,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* QR card */}
              <div style={{background:"#fff",borderRadius:12,padding:"1.5rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+ORANGE,textAlign:"center"}}>
                <div style={{fontSize:14,fontWeight:700,color:"#1a1a1a",marginBottom:2}}>
                  {qrType==="checkin"?"⏱ Check-In QR":"👤 Athlete Portal QR"}
                </div>
                <div style={{fontSize:12,color:"#888",marginBottom:16}}>
                  {qrType==="checkin"?"Show at the door — athletes scan and check in instantly.":"Athletes scan to log in and view their profile."}
                </div>
                <div style={{background:"#f9f9f9",borderRadius:12,padding:"20px",display:"inline-block",marginBottom:12,border:"1px solid #e0e0e0"}}>
                  {qrDataUrl?<img src={qrDataUrl} alt="QR Code" style={{width:220,height:220,display:"block"}}/>:<div style={{width:220,height:220,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#aaa"}}>Generating...</div>}
                </div>
                <div style={{fontSize:11,color:"#aaa",marginBottom:16}}>
                  {qrType==="checkin"?"tfcollegegroup.com/checkin":"tfcollegegroup.com/athlete"}
                </div>
                <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                  <button onClick={()=>setQrFullscreen(true)} style={{padding:"10px 20px",borderRadius:10,border:"none",background:"#1a1a1a",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                    ⛶ Display at door
                  </button>
                  {qrDataUrl&&(
                    <a href={qrDataUrl} download={"tf-"+qrType+"-qr.png"} style={{padding:"10px 20px",borderRadius:10,border:"0.5px solid #e0e0e0",background:"#fff",color:"#555",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"Georgia,serif",textDecoration:"none",display:"inline-block"}}>
                      ↓ Download
                    </a>
                  )}
                </div>
              </div>

              {/* Today's live attendance */}
              {(()=>{
                const todayRecs=attendance.filter(r=>r.date===attDate);
                const early=todayRecs.filter(r=>r.status==="early").length;
                const late=todayRecs.filter(r=>r.status==="late").length;
                const total=athletes.filter(a=>a.status==="active").length;
                return(
                  <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:10}}>📊 Today's check-ins (live)</div>
                    <div style={{display:"flex",gap:10}}>
                      <div style={{flex:1,textAlign:"center",padding:"12px 8px",background:"#EAF3DE",borderRadius:10}}>
                        <div style={{fontSize:28,fontWeight:700,color:GREEN}}>{early}</div>
                        <div style={{fontSize:11,color:GREEN}}>Early</div>
                      </div>
                      <div style={{flex:1,textAlign:"center",padding:"12px 8px",background:"#FCEBEB",borderRadius:10}}>
                        <div style={{fontSize:28,fontWeight:700,color:RED}}>{late}</div>
                        <div style={{fontSize:11,color:RED}}>Late</div>
                      </div>
                      <div style={{flex:1,textAlign:"center",padding:"12px 8px",background:"#f5f5f5",borderRadius:10}}>
                        <div style={{fontSize:28,fontWeight:700,color:"#888"}}>{total-early-late}</div>
                        <div style={{fontSize:11,color:"#888"}}>Not in</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div style={{background:"#f9f9f9",borderRadius:12,padding:"14px",border:"0.5px solid #e0e0e0"}}>
                <div style={{fontSize:12,fontWeight:600,color:"#1a1a1a",marginBottom:8}}>How it works:</div>
                {["Show this QR on your phone or iPad at the door","Athletes scan with their camera — no app needed","They tap their name and check in instantly","Early / Late is determined automatically by time","Attendance updates on your coach dashboard live"].map((s,i)=>(
                  <div key={i} style={{display:"flex",gap:8,marginBottom:6}}>
                    <div style={{width:18,height:18,borderRadius:"50%",background:ORANGE,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff",flexShrink:0}}>{i+1}</div>
                    <div style={{fontSize:12,color:"#666"}}>{s}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fullscreen QR overlay */}
          {qrFullscreen&&(
            <div onClick={()=>setQrFullscreen(false)} style={{position:"fixed",inset:0,background:"#fff",zIndex:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,cursor:"pointer"}}>
              <div style={{fontSize:13,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.1em"}}>TF College Group · {qrType==="checkin"?"Check In":"Athlete Portal"}</div>
              {qrDataUrl&&<img src={qrDataUrl} alt="QR Code" style={{width:"min(80vw,80vh)",height:"min(80vw,80vh)"}}/>}
              <div style={{fontSize:15,fontWeight:600,color:"#1a1a1a"}}>
                {qrType==="checkin"?"tfcollegegroup.com/checkin":"tfcollegegroup.com/athlete"}
              </div>
              {(()=>{
                const todayRecs=attendance.filter(r=>r.date===attDate);
                const early=todayRecs.filter(r=>r.status==="early").length;
                const late=todayRecs.filter(r=>r.status==="late").length;
                return early+late>0?(
                  <div style={{display:"flex",gap:16,fontSize:13}}>
                    <span style={{color:GREEN,fontWeight:600}}>✓ {early} early</span>
                    {late>0&&<span style={{color:RED,fontWeight:600}}>⚠ {late} late</span>}
                  </div>
                ):null;
              })()}
              <div style={{fontSize:11,color:"#ccc"}}>Tap anywhere to close</div>
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
              {/* Award form — photo grid picker */}
              <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+GOLD}}>
                <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Award this week's Anvil</div>

                {/* Athlete photo grid */}
                <div style={{fontSize:11,color:"#888",marginBottom:8}}>Tap to select athlete</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
                  {athletes.filter(a=>a.status==="active").map(a=>{
                    const isSelected=anvilWinner===a.name;
                    const timesWon=anvil.filter(w=>w.athlete_name===a.name&&w.type==="individual").length;
                    return(
                      <button key={a.id} onClick={()=>setAnvilWinner(isSelected?"":a.name)} style={{padding:"8px 4px",borderRadius:10,border:"2px solid "+(isSelected?GOLD:"#e0e0e0"),background:isSelected?"#1f1700":"#f9f9f9",cursor:"pointer",fontFamily:"Georgia,serif",textAlign:"center",position:"relative"}}>
                        <div style={{width:40,height:40,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,margin:"0 auto 4px",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:500,color:"#fff",border:isSelected?"2px solid "+GOLD:"none"}}>
                          {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(a.name||"?")[0]}
                        </div>
                        <div style={{fontSize:10,fontWeight:500,color:isSelected?GOLD:"#1a1a1a",lineHeight:1.2}}>{a.name.split(" ")[0]}</div>
                        {timesWon>0&&<div style={{fontSize:9,color:GOLD}}>⚒ ×{timesWon}</div>}
                        {isSelected&&<div style={{position:"absolute",top:3,right:3,fontSize:12}}>⭐</div>}
                      </button>
                    );
                  })}
                </div>

                {anvilWinner&&(
                  <div style={{background:"#1f1700",borderRadius:10,padding:"10px 12px",marginBottom:12,border:"0.5px solid "+GOLD+"44"}}>
                    <div style={{fontSize:12,color:GOLD,fontWeight:600}}>⚒ {anvilWinner}</div>
                    <div style={{fontSize:11,color:"#888",marginTop:2}}>
                      {anvil.filter(w=>w.athlete_name===anvilWinner&&w.type==="individual").length>0
                        ?"Has won "+(anvil.filter(w=>w.athlete_name===anvilWinner&&w.type==="individual").length)+" time"+(anvil.filter(w=>w.athlete_name===anvilWinner&&w.type==="individual").length!==1?"s":"")+" before"
                        :"First time winner"}
                    </div>
                  </div>
                )}

                <div style={{marginBottom:8}}>
                  <div style={{fontSize:11,color:"#888",marginBottom:4}}>Week / date</div>
                  <input value={anvilDate} onChange={e=>setAnvilDate(e.target.value)} placeholder="e.g. Week 1 · June 2" style={{width:"100%",padding:"8px",fontSize:13,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia,serif",boxSizing:"border-box"}}/>
                </div>
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:11,color:"#888",marginBottom:4}}>Why they earned it</div>
                  <textarea value={anvilNote} onChange={e=>setAnvilNote(e.target.value)} placeholder="What did this person do that nobody else did this week?" style={{width:"100%",minHeight:70,padding:"8px",fontSize:13,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia,serif",resize:"vertical",boxSizing:"border-box"}}/>
                </div>
                <button onClick={awardAnvil} disabled={!anvilWinner} style={{width:"100%",padding:"12px",borderRadius:8,border:"none",background:anvilWinner?GOLD:"#e0e0e0",color:anvilWinner?"#1a1a1a":"#aaa",fontSize:14,fontWeight:600,cursor:anvilWinner?"pointer":"not-allowed",fontFamily:"Georgia,serif"}}>
                  Award The Anvil →
                </button>
              </div>

              {/* Who's never won */}
              {(()=>{
                const winners=new Set(anvil.filter(w=>w.type==="individual").map(w=>w.athlete_name));
                const neverWon=athletes.filter(a=>a.status==="active"&&!winners.has(a.name));
                if(!neverWon.length)return null;
                return(
                  <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:4}}>Never won the Anvil</div>
                    <div style={{fontSize:12,color:"#888",marginBottom:10}}>{neverWon.length} athlete{neverWon.length!==1?"s":""} waiting to be recognized</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                      {neverWon.map((a,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:20,background:"#f9f9f9",border:"0.5px solid #e0e0e0"}}>
                          <div style={{width:22,height:22,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",fontWeight:500,flexShrink:0}}>
                            {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(a.name||"?")[0]}
                          </div>
                          <span style={{fontSize:12,color:"#1a1a1a"}}>{a.name.split(" ")[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Hall of Fame */}
              <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0"}}>
                <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Hall of Fame</div>
                {anvil.length===0&&<div style={{fontSize:13,color:"#aaa",textAlign:"center",padding:"16px 0"}}>No Anvil winners yet.</div>}
                {anvil.filter(a=>a.type==="individual").map((w,i)=>{
                  const ath=athletes.find(a=>a.name===w.athlete_name);
                  const timesWon=anvil.filter(x=>x.athlete_name===w.athlete_name&&x.type==="individual").length;
                  const prevWinner=i>0?anvil.filter(a=>a.type==="individual")[i-1]:null;
                  const isStreak=prevWinner&&prevWinner.athlete_name===w.athlete_name;
                  return(
                    <div key={i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:"0.5px solid #f0f0f0",alignItems:"center"}}>
                      <div style={{width:38,height:38,borderRadius:"50%",background:i===0?"#1f1700":BG,border:"2px solid "+(i===0?GOLD:"#333"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:i===0?GOLD:"#666",fontWeight:600,flexShrink:0,overflow:"hidden"}}>
                        {ath?.photo_url?<img src={ath.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(w.athlete_name||"?")[0]}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                          <div style={{fontSize:13,fontWeight:600,color:i===0?GOLD:RED}}>{w.athlete_name}</div>
                          {i===0&&<span style={{fontSize:10,background:"#1f1700",color:GOLD,padding:"1px 6px",borderRadius:4}}>Current ⚡</span>}
                          {isStreak&&<span style={{fontSize:10,background:"#FAEEDA",color:"#854F0B",padding:"1px 6px",borderRadius:4}}>🔥 Back to back</span>}
                          {timesWon>1&&<span style={{fontSize:10,background:"#f9f9f9",color:"#888",padding:"1px 6px",borderRadius:4}}>×{timesWon} all time</span>}
                        </div>
                        <div style={{fontSize:11,color:"#888"}}>{w.date_awarded}</div>
                        {w.note&&<div style={{fontSize:12,color:"#555",fontStyle:"italic",marginTop:2}}>"{w.note}"</div>}
                      </div>
                      <button onClick={async()=>{
                        if(!window.confirm("Remove this Anvil award?"))return;
                        await supabase.from("anvil").delete().eq("id",w.id);
                        setAnvil(p=>p.filter(x=>x.id!==w.id));
                      }} style={{background:"transparent",border:"none",color:"#ddd",cursor:"pointer",fontSize:14,padding:"4px",flexShrink:0}}>✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          {tab==="inbox"&&(
            <div>
              {/* Unread counts + filter */}
              <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                {[
                  {id:"all",label:"All",count:inbox.length},
                  {id:"injury",label:"🤕 Injuries",count:injuries.length,color:RED},
                  {id:"message",label:"💬 Messages",count:messages.length,color:PUR},
                  {id:"prayer",label:"🙏 Prayers",count:prayers.length,color:GREEN},
                ].map(f=>(
                  <button key={f.id} onClick={()=>setInboxFilter(f.id)} style={{padding:"6px 12px",borderRadius:8,border:"0.5px solid "+(inboxFilter===f.id?(f.color||"#1a1a1a"):"#e0e0e0"),background:inboxFilter===f.id?(f.color||"#1a1a1a"):"#fff",color:inboxFilter===f.id?"#fff":"#888",fontSize:12,fontWeight:inboxFilter===f.id?600:400,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                    {f.label} {f.count>0&&<span style={{background:inboxFilter===f.id?"rgba(255,255,255,0.3)":"#f0f0f0",borderRadius:10,padding:"0 5px",fontSize:10,color:inboxFilter===f.id?"#fff":"#888"}}>{f.count}</span>}
                  </button>
                ))}
              </div>

              {/* Athlete filter */}
              <div style={{marginBottom:12,display:"flex",gap:8,alignItems:"center"}}>
                <select value={inboxAthFilter} onChange={e=>setInboxAthFilter(e.target.value)} style={{flex:1,padding:"8px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia,serif"}}>
                  <option value="">All athletes</option>
                  {athletes.filter(a=>a.status==="active").map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <button onClick={async()=>{
                  if(!window.confirm("Mark all as done and clear inbox?"))return;
                  await Promise.all(inbox.map(item=>supabase.from("inbox").update({done:true}).eq("id",item.id)));
                  setInbox([]);
                }} style={{padding:"8px 12px",borderRadius:8,border:"0.5px solid #e0e0e0",background:"#fff",color:"#888",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif",flexShrink:0}}>
                  Mark all done
                </button>
              </div>

              {/* Filtered inbox */}
              {(()=>{
                const archiveItem=async(item)=>{
                  await supabase.from("inbox").update({done:true}).eq("id",item.id);
                  setInbox(p=>p.filter(x=>x.id!==item.id));
                };
                const priorityItem=async(item)=>{
                  const newPriority=!item.priority;
                  try{await supabase.from("inbox").update({priority:newPriority}).eq("id",item.id);}catch(e){}
                  setInbox(p=>p.map(x=>x.id===item.id?{...x,priority:newPriority}:x));
                };
                let filtered=[...inbox].sort((a,b)=>(b.priority?1:0)-(a.priority?1:0));
                if(inboxFilter!=="all") filtered=filtered.filter(x=>x.type===inboxFilter);
                if(inboxAthFilter) filtered=filtered.filter(x=>x.athlete_id===inboxAthFilter);
                const inj=filtered.filter(x=>x.type==="injury");
                const msgs=filtered.filter(x=>x.type==="message");
                const prays=filtered.filter(x=>x.type==="prayer");
                const other=filtered.filter(x=>!["injury","message","prayer"].includes(x.type));
                return(
                  <>
                    {inj.length>0&&(
                      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+RED}}>
                        <div style={{fontSize:13,fontWeight:600,color:RED,marginBottom:10}}>🤕 Injury flags · {inj.length}</div>
                        {inj.map((item,i)=><InboxItem key={i} item={item} color={RED} bg="#FCEBEB" type="injury" onReply={replyToInbox} onGenerate={(prompt,cb)=>generateReply(prompt,cb,"inj-"+item.id)} genLoading={genLoading} loadKey={"inj-"+item.id} onArchive={archiveItem} onPriority={priorityItem} athletes={athletes}/>)}
                      </div>
                    )}
                    {msgs.length>0&&(
                      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+PUR}}>
                        <div style={{fontSize:13,fontWeight:600,color:PUR,marginBottom:10}}>💬 Messages · {msgs.length}</div>
                        {msgs.map((item,i)=><InboxItem key={i} item={item} color={PUR} bg="#EEEDFE" type="message" onReply={replyToInbox} onGenerate={(prompt,cb)=>generateReply(prompt,cb,"msg-"+item.id)} genLoading={genLoading} loadKey={"msg-"+item.id} onArchive={archiveItem} onPriority={priorityItem} athletes={athletes}/>)}
                      </div>
                    )}
                    {prays.length>0&&(
                      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+GREEN}}>
                        <div style={{fontSize:13,fontWeight:600,color:GREEN,marginBottom:10}}>🙏 Prayer requests · {prays.length}</div>
                        {prays.map((item,i)=><InboxItem key={i} item={item} color={GREEN} bg="#EAF3DE" type="prayer" onReply={replyToInbox} onGenerate={(prompt,cb)=>generateReply(prompt,cb,"pry-"+item.id)} genLoading={genLoading} loadKey={"pry-"+item.id} onArchive={archiveItem} onPriority={priorityItem} athletes={athletes}/>)}
                      </div>
                    )}
                    {other.length>0&&(
                      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0"}}>
                        <div style={{fontSize:13,fontWeight:600,color:"#888",marginBottom:10}}>Other · {other.length}</div>
                        {other.map((item,i)=><InboxItem key={i} item={item} color="#888" bg="#f5f5f5" type="message" onReply={replyToInbox} onGenerate={(prompt,cb)=>generateReply(prompt,cb,"oth-"+item.id)} genLoading={genLoading} loadKey={"oth-"+item.id} onArchive={archiveItem} onPriority={priorityItem} athletes={athletes}/>)}
                      </div>
                    )}
                    {filtered.length===0&&(
                      <div style={{background:"#fff",borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid #e0e0e0"}}>
                        <div style={{fontSize:32,marginBottom:8}}>✓</div>
                        <div style={{fontSize:14,color:"#888"}}>Inbox is clear</div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {tab==="leaderboard"&&(
            <div>
              {/* Sort options */}
              <div style={{display:"flex",gap:6,marginBottom:12,overflowX:"auto"}}>
                {[
                  {id:"early",label:"Early arrivals"},
                  {id:"streak",label:"Current streak"},
                  {id:"best",label:"Best streak"},
                  {id:"callout",label:"Most callouts"},
                ].map(s=>(
                  <button key={s.id} onClick={()=>setLbSort(s.id)} style={{padding:"6px 12px",borderRadius:8,border:"0.5px solid "+(lbSort===s.id?GOLD:"#e0e0e0"),background:lbSort===s.id?GOLD:"#fff",color:lbSort===s.id?"#1a1a1a":"#888",fontSize:12,fontWeight:lbSort===s.id?600:400,cursor:"pointer",fontFamily:"Georgia,serif",flexShrink:0}}>
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Most improved */}
              {(()=>{
                const improved=leaderboard.filter(lb=>lb.current_streak>=3&&lb.current_streak>=(lb.best_streak||0)*0.8).sort((a,b)=>(b.current_streak||0)-(a.current_streak||0))[0];
                if(!improved)return null;
                const ath=athletes.find(a=>a.name===improved.athletes?.name);
                return(
                  <div style={{background:"linear-gradient(135deg,#1f1700,#2a2000)",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"1px solid "+GOLD+"44"}}>
                    <div style={{fontSize:11,color:GOLD,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>🔥 Most improved — on fire</div>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:44,height:44,borderRadius:"50%",background:STEEL,overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:500,color:"#fff",border:"2px solid "+GOLD}}>
                        {ath?.photo_url?<img src={ath.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(improved.athletes?.name||"?")[0]}
                      </div>
                      <div>
                        <div style={{fontSize:15,fontWeight:600,color:GOLD}}>{improved.athletes?.name}</div>
                        <div style={{fontSize:12,color:"#888"}}>🔥 {improved.current_streak} day streak · {improved.early_count||0} early total</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0",borderTop:"3px solid "+GOLD}}>
                <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>
                  {lbSort==="early"?"Early arrivals":lbSort==="streak"?"Current streak":lbSort==="best"?"Best streak":"Most callouts"}
                </div>
                {leaderboard.length===0&&<div style={{fontSize:13,color:"#aaa",textAlign:"center",padding:"16px 0"}}>No data yet.</div>}
                {[...leaderboard].sort((a,b)=>{
                  if(lbSort==="early")return(b.early_count||0)-(a.early_count||0);
                  if(lbSort==="streak")return(b.current_streak||0)-(a.current_streak||0);
                  if(lbSort==="best")return(b.best_streak||0)-(a.best_streak||0);
                  return(b.callout_count||0)-(a.callout_count||0);
                }).map((lb,i)=>{
                  const ath=athletes.find(a=>a.name===lb.athletes?.name);
                  const maxVal=Math.max(...leaderboard.map(x=>lbSort==="early"?x.early_count||0:lbSort==="streak"?x.current_streak||0:lbSort==="best"?x.best_streak||0:x.callout_count||0),1);
                  const val=lbSort==="early"?lb.early_count||0:lbSort==="streak"?lb.current_streak||0:lbSort==="best"?lb.best_streak||0:lb.callout_count||0;
                  const pct=Math.round((val/maxVal)*100);
                  return(
                    <div key={i} style={{padding:"10px 0",borderBottom:"0.5px solid #f0f0f0"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                        <div style={{width:24,fontSize:13,fontWeight:700,color:i===0?GOLD:i===1?"#999":i===2?"#CD7F32":"#888",textAlign:"center",flexShrink:0}}>
                          {i===0?"🥇":i===1?"🥈":i===2?"🥉":"#"+(i+1)}
                        </div>
                        <div style={{width:34,height:34,borderRadius:"50%",background:ath?.role==="forge"?RED:STEEL,overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:500,color:"#fff"}}>
                          {ath?.photo_url?<img src={ath.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(lb.athletes?.name||"?")[0]}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                            <div style={{fontSize:13,fontWeight:500,color:"#1a1a1a"}}>{lb.athletes?.name}</div>
                            <div style={{fontSize:13,fontWeight:700,color:lbSort==="callout"?RED:GOLD}}>{val}</div>
                          </div>
                          {/* Progress bar */}
                          <div style={{height:5,background:"#f0f0f0",borderRadius:3,overflow:"hidden"}}>
                            <div style={{height:"100%",width:pct+"%",background:lbSort==="callout"?RED:i===0?GOLD:GREEN,borderRadius:3,transition:"width 0.3s"}}/>
                          </div>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:10,paddingLeft:68,flexWrap:"wrap"}}>
                        <span style={{fontSize:11,color:GREEN}}>🟢 {lb.early_count||0} early</span>
                        <span style={{fontSize:11,color:"#854F0B"}}>🔥 {lb.current_streak||0} streak</span>
                        <span style={{fontSize:11,color:"#aaa"}}>best {lb.best_streak||0}</span>
                        {(lb.late_count||0)>0&&<span style={{fontSize:11,color:RED}}>{lb.late_count} late</span>}
                        {(lb.callout_count||0)>0&&<span style={{fontSize:11,color:"#aaa"}}>{lb.callout_count} callouts</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab==="goals"&&(
            <div>
              {/* Search + filter */}
              <div style={{position:"relative",marginBottom:10}}>
                <input value={goalsSearch} onChange={e=>setGoalsSearch(e.target.value)} placeholder="Search athlete..." style={{width:"100%",padding:"10px 12px 10px 34px",borderRadius:10,border:"0.5px solid #e0e0e0",fontSize:13,fontFamily:"Georgia,serif",background:"#fafafa",color:"#1a1a1a",boxSizing:"border-box"}}/>
                <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"#aaa"}}>🔍</div>
                {goalsSearch&&<button onClick={()=>setGoalsSearch("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",fontSize:14,color:"#aaa",cursor:"pointer"}}>✕</button>}
              </div>
              <div style={{display:"flex",gap:6,marginBottom:12}}>
                {[
                  {id:"all",label:"All"},
                  {id:"missing",label:"⚠ No goals"},
                  {id:"set",label:"✓ Has goals"},
                ].map(f=>(
                  <button key={f.id} onClick={()=>setGoalsFilter(f.id)} style={{flex:1,padding:"7px",borderRadius:8,border:"0.5px solid "+(goalsFilter===f.id?PUR:"#e0e0e0"),background:goalsFilter===f.id?PUR:"#fff",color:goalsFilter===f.id?"#fff":"#888",fontSize:12,fontWeight:goalsFilter===f.id?600:400,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                    {f.label}
                  </button>
                ))}
              </div>

              {athletes.filter(a=>{
                if(a.status!=="active")return false;
                if(goalsSearch&&!a.name?.toLowerCase().includes(goalsSearch.toLowerCase()))return false;
                if(goalsFilter==="missing")return!a.athletic_goal&&!a.character_goal;
                if(goalsFilter==="set")return!!(a.athletic_goal||a.character_goal);
                return true;
              }).map(a=>{
                const hasGoal=!!(a.athletic_goal||a.character_goal);
                const review=goalReviews[a.id]||"";
                return(
                <div key={a.id} style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:10,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+(hasGoal?GREEN:RED)}}>
                  {/* Header with photo */}
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <div style={{width:38,height:38,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:500,color:"#fff",flexShrink:0,overflow:"hidden"}}>
                      {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(a.name||"?")[0]}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:600,color:"#1a1a1a"}}>{a.name}</div>
                      <div style={{fontSize:12,color:"#888"}}>{a.sport}</div>
                    </div>
                    {/* Review status */}
                    <div style={{display:"flex",gap:4}}>
                      {[{id:"on_track",label:"✓",color:GREEN,bg:"#EAF3DE"},{id:"needs_work",label:"!",color:"#854F0B",bg:"#FAEEDA"},{id:"reviewed",label:"👁",color:PUR,bg:"#EEEDFE"}].map(r=>(
                        <button key={r.id} onClick={async()=>{
                          const newVal=review===r.id?"":r.id;
                          setGoalReviews(p=>({...p,[a.id]:newVal}));
                          try{await supabase.from("athletes").update({goal_review_status:newVal||null}).eq("id",a.id);}catch(e){}
                        }} title={r.id.replace("_"," ")} style={{width:28,height:28,borderRadius:6,border:"0.5px solid "+(review===r.id?r.color:"#e0e0e0"),background:review===r.id?r.bg:"#fafafa",color:review===r.id?r.color:"#aaa",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {!hasGoal&&(
                    <div style={{background:"#FCEBEB",borderRadius:8,padding:"8px 12px",marginBottom:10,border:"0.5px solid #ffcccc"}}>
                      <div style={{fontSize:12,color:RED}}>⚠ No goals set yet — follow up with {a.name.split(" ")[0]}</div>
                    </div>
                  )}

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {[{label:"Athletic goal",goalKey:"athletic_goal",taskKey:"coach_athletic_task",type:"athletic",color:GREEN},{label:"Character goal",goalKey:"character_goal",taskKey:"coach_character_task",type:"character",color:PUR}].map(({label,goalKey,taskKey,type,color})=>(
                      <div key={goalKey}>
                        <div style={{fontSize:11,color:"#888",marginBottom:4}}>{label}</div>
                        <div style={{fontSize:12,color:a[goalKey]?"#1a1a1a":"#ccc",fontStyle:a[goalKey]?"normal":"italic",padding:"6px 8px",background:"#f9f9f9",borderRadius:6,minHeight:36,marginBottom:6}}>{a[goalKey]||"Not set"}</div>
                        <textarea id={a.id+"-"+type} defaultValue={a[taskKey]||""} placeholder="Write or generate a task..." style={{width:"100%",minHeight:60,padding:"8px",fontSize:12,border:"0.5px solid "+color,borderRadius:6,background:BG,color:"#fff",fontFamily:"Georgia,serif",resize:"vertical",boxSizing:"border-box",marginBottom:6}}/>
                        <div style={{display:"flex",gap:6}}>
                          <button onClick={()=>generateTask(a,type)} disabled={!a[goalKey]||genLoading===a.id+"-"+type} style={{flex:1,padding:"6px",borderRadius:6,border:"0.5px solid "+color,background:"transparent",color:color,fontSize:11,cursor:a[goalKey]?"pointer":"not-allowed",fontFamily:"Georgia,serif",opacity:a[goalKey]?1:0.4}}>
                            {genLoading===a.id+"-"+type?"Generating...":"AI task"}
                          </button>
                          <button onClick={async()=>{const val=document.getElementById(a.id+"-"+type)?.value;if(val){await supabase.from("athletes").update({[taskKey]:val}).eq("id",a.id);alert("Sent to "+a.name+"!");}}} style={{flex:1,padding:"6px",borderRadius:6,border:"none",background:color,color:"#fff",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                            Send →
                          </button>
                        </div>
                        {a[taskKey]&&(
                          <div style={{padding:"6px 8px",background:BG,borderRadius:6,borderLeft:"3px solid "+color,marginTop:6}}>
                            <div style={{fontSize:10,color:color,marginBottom:2}}>Current task</div>
                            <div style={{fontSize:11,color:"#ccc",lineHeight:1.5}}>{a[taskKey]}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                );
              })}
            </div>
          )}
          </ErrorBoundary>
        </div>
      </div>
    </>
  );
}

function InboxItem({item,color,bg,type,onReply,onGenerate,genLoading,loadKey,onArchive,onPriority,athletes}){
  const[reply,setReply]=useState(item.reply||"");
  const[sent,setSent]=useState(item.reply_sent||false);
  const[showReply,setShowReply]=useState(!item.reply_sent);
  const ath=athletes?.find(a=>a.id===item.athlete_id);
  const prompts={
    injury:`You are Coach Ant, a faith-based strength coach. Athlete ${item.athletes?.name} reported: "${item.message}". Write a caring professional response as Coach Ant. Acknowledge the injury, tell them what to do, encourage them. Under 60 words.`,
    message:`You are Coach Ant, a faith-based strength coach. Athlete ${item.athletes?.name} sent: "${item.message}". Write a warm personal reply as Coach Ant. Encouraging, real, grounded in faith. Under 60 words.`,
    prayer:`You are Coach Ant, a faith-based coach who prays for athletes. ${item.athletes?.name} submitted: "${item.message}". Write a warm faith-filled response as Coach Ant. Include a short scripture if natural. Under 70 words.`,
  };
  const RED="#C0392B",GREEN="#1E6B3A",GOLD="#D4AF37",STEEL="#708090";
  return(
    <div style={{padding:"12px 0",borderBottom:"0.5px solid #f0f0f0",opacity:item.archived?0.5:1}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
        {/* Photo */}
        <div style={{width:34,height:34,borderRadius:"50%",background:ath?.role==="forge"?RED:STEEL,flexShrink:0,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:500,color:"#fff"}}>
          {ath?.photo_url?<img src={ath.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(item.athletes?.name||"?")[0]}
        </div>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:13,fontWeight:600,color}}>{item.anonymous?"Anonymous":item.athletes?.name}</span>
            {item.priority&&<span style={{fontSize:9,background:RED,color:"#fff",padding:"1px 5px",borderRadius:3,fontWeight:600}}>URGENT</span>}
            {item.reply_sent&&<span style={{fontSize:10,color:GREEN}}>✓ Replied</span>}
          </div>
          <span style={{fontSize:11,color:"#aaa"}}>{new Date(item.created_at).toLocaleDateString()}</span>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>onPriority&&onPriority(item)} title="Mark urgent" style={{background:"transparent",border:"none",fontSize:14,cursor:"pointer",opacity:item.priority?1:0.3}}>🚨</button>
          <button onClick={()=>onArchive&&onArchive(item)} title="Archive" style={{background:"transparent",border:"none",fontSize:14,cursor:"pointer",opacity:0.5}}>📁</button>
        </div>
      </div>
      <div style={{fontSize:13,color:"#555",marginBottom:8,padding:"8px 10px",background:bg,borderRadius:8,borderLeft:"3px solid "+color}}>{item.message}</div>
      {/* Reply history */}
      {item.reply&&(
        <div style={{marginBottom:8}}>
          <div onClick={()=>setShowReply(!showReply)} style={{fontSize:11,color:GREEN,cursor:"pointer",marginBottom:4}}>
            {showReply?"▼ Hide reply":"▶ Show your reply"}
          </div>
          {showReply&&(
            <div style={{fontSize:12,color:"#555",padding:"6px 10px",background:"#EAF3DE",borderRadius:8,borderLeft:"3px solid "+GREEN,fontStyle:"italic"}}>
              "{item.reply}"
            </div>
          )}
        </div>
      )}
      {/* Reply box */}
      {!item.archived&&(
        <>
          <textarea value={reply} onChange={e=>setReply(e.target.value)} placeholder="Write a reply..." style={{width:"100%",minHeight:50,padding:"6px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia,serif",resize:"vertical",boxSizing:"border-box",marginBottom:6}}/>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button onClick={()=>onGenerate(prompts[type],text=>setReply(text))} style={{padding:"5px 12px",borderRadius:8,border:"0.5px solid "+color,background:"transparent",color,fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>
              {genLoading===loadKey?"Generating...":"Generate reply"}
            </button>
            <button onClick={async()=>{await onReply(item,reply);setSent(true);}} style={{padding:"5px 14px",borderRadius:8,border:"none",background:color,color:"#fff",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"Georgia,serif"}}>Send reply</button>
            {sent&&<span style={{fontSize:12,color:GREEN,fontWeight:500}}>✓ Sent</span>}
          </div>
        </>
      )}
    </div>
  );
}
