// v1776642403
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { passkeyAvailable, passkeySignIn, passkeyRegister, rememberPasskey, isCancel, passkeyErrorText } from "../lib/passkey";
// useLayoutEffect warns during SSR; fall back to useEffect on the server.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
import { BG, PUR, RED, GREEN, GOLD, STEEL, ORANGE, ATHLETE_SAFE_COLS } from "../lib/constants";
import { authApi, setSession, loadSavedSession, clearCurrent, authErrorText } from "../lib/session";
import { isFemale } from "../lib/teams";
import { nowEST } from "../lib/dates";
import { ErrorBoundary } from "../components/ErrorBoundary";
import ProgramUpload from "../components/ProgramUpload";
import IronRoomTab from "../components/IronRoomTab";
import CoachHabitsTab from "../components/CoachHabitsTab";
import CalloutsTab from "../components/CalloutsTab";
import InjuriesTab from "../components/InjuriesTab";
import PrayersTab from "../components/PrayersTab";
import PhotosTab from "../components/PhotosTab";
import EngagementTab from "../components/EngagementTab";
import MCastlesPostTab from "../components/MCastlesPostTab";
import AnvilTab from "../components/AnvilTab";
import CoachLeaderboardTab from "../components/CoachLeaderboardTab";
import GoalsTab from "../components/GoalsTab";
import QrTab from "../components/QrTab";
import RosterTab from "../components/RosterTab";
import CoachAttendanceTab from "../components/CoachAttendanceTab";
import OverviewTab from "../components/OverviewTab";
import WeightsTab from "../components/WeightsTab";
import InboxTab from "../components/InboxTab";
import Head from "next/head";
import { supabase } from "../lib/supabase";
import Accountability from "../components/Accountability";
import FellowshipFriday from "../components/FellowshipFriday";
import MindsetMonday from "../components/MindsetMonday";
import CultureEvents from "../components/CultureEvents";
import Icon from "../components/Icon";
import EmptyState from "../components/EmptyState";
import { hTap } from "../lib/haptics";
import { useMood } from "../lib/ambient";
import TeamsView from "../components/TeamsView";





export default function Coach(){
  useMood("coach");
  const[authed,setAuthed]=useState(false);
  const[coachRole,setCoachRole]=useState("ant");
  const[selectedCoach,setSelectedCoach]=useState(null); // "ant" or "kevin"
  const[pin,setPin]=useState("");
  const pinRef=useRef(null);
  const[pinStep,setPinStep]=useState("select"); // "select" | "enter" | "create" | "confirm"
  const[pinConfirm,setPinConfirm]=useState("");
  const[pinError,setPinError]=useState("");
  const[tab,setTab]=useState(coachRole==="kevin"?"roster":"overview");
  const[showTabPicker,setShowTabPicker]=useState(false);
  const[themeMode,setThemeMode]=useState("dark");
  useEffect(()=>{try{setThemeMode(localStorage.getItem("tf_theme")==="light"?"light":"dark");}catch(e){}},[]);
  const toggleTheme=()=>{setThemeMode(prev=>{const next=prev==="dark"?"light":"dark";try{localStorage.setItem("tf_theme",next);}catch(e){}if(typeof document!=="undefined")document.documentElement.setAttribute("data-theme",next==="light"?"light":"");return next;});};
  const isLight=themeMode==="light";
  const[pinnedTabs,setPinnedTabs]=useState(["roster","inbox","attendance"]);
  const[editingPins,setEditingPins]=useState(false);
  const navDragOrderRef=useRef(null);
  const navLastSwapY=useRef(0);
  const[jiggleMode,setJiggleMode]=useState(false);
  const[jiggleDragId,setJiggleDragId]=useState(null);
  const longPressNavRef=useRef(null);
  const jiggleDragOrderRef=useRef(null);
  const jiggleLastSwapX=useRef(0);
  const jiggleDragStartX=useRef(0);
  const jiggleDragElemRef=useRef(null);
  const[moreOrder,setMoreOrder]=useState([]);
  const moreOrderRef=useRef([]);
  const gridDragElemRef=useRef(null);
  const gridLongPressRef=useRef(null);
  const gridLastOverId=useRef(null);
  const[athletes,setAthletes]=useState([]);
  const[attendance,setAttendance]=useState([]);
  const[inbox,setInbox]=useState([]);
  const[anvil,setAnvil]=useState([]);
  const[anvilPrizes,setAnvilPrizes]=useState({});
  const[leaderboard,setLeaderboard]=useState([]);
  const[announcement,setAnnouncement]=useState("");
  const[currentAnnouncement,setCurrentAnnouncement]=useState(null);
  const[loading,setLoading]=useState(true);
  const[newName,setNewName]=useState("");
  const[newSport,setNewSport]=useState("");
  const[newGender,setNewGender]=useState("");
  const[newRole,setNewRole]=useState("iron");
  const[genLoading,setGenLoading]=useState(null);
  const[goalReviews,setGoalReviews]=useState({});
  // Read/unread layer — tracks which inbox items the coach has already seen.
  // Persisted per-coach in localStorage; new items glow + show a NEW badge until viewed.
  const inboxSeenRef=useRef(null);
  const[inboxNewIds,setInboxNewIds]=useState(()=>new Set());
  const[weightLogs,setWeightLogs]=useState([]);
  const[prLogs,setPrLogs]=useState([]);
  const[modalAth,setModalAth]=useState(null);
  const[modalData,setModalData]=useState(null);
  const[modalLoading,setModalLoading]=useState(false);
  const[musicVotes,setMusicVotes]=useState(null);
  const[bioAvail,setBioAvail]=useState(false);
  const[bioCredId,setBioCredId]=useState(null);
  const[showBioOffer,setShowBioOffer]=useState(false);
  const[bioSetupMsg,setBioSetupMsg]=useState("");
  const[pendingNav,setPendingNav]=useState(null);
  const touchStartRef=useRef(null);
  const slideDirRef=useRef(0);
  // Remember scroll position per tab so switching away and back returns you
  // to where you were instead of jumping to the top.
  const tabScrollRef=useRef({});
  useEffect(()=>{
    if(!authed)return;
    const onScroll=()=>{tabScrollRef.current[tab]=window.scrollY;};
    window.addEventListener("scroll",onScroll,{passive:true});
    return()=>window.removeEventListener("scroll",onScroll);
  },[tab,authed]);
  useIsoLayoutEffect(()=>{
    if(!authed)return;
    const y=tabScrollRef.current[tab]||0;
    // Restore after the new tab's content lands (data can load a frame late).
    window.scrollTo(0,y);
    const r1=requestAnimationFrame(()=>window.scrollTo(0,tabScrollRef.current[tab]||0));
    const t1=setTimeout(()=>window.scrollTo(0,tabScrollRef.current[tab]||0),60);
    return()=>{cancelAnimationFrame(r1);clearTimeout(t1);};
  },[tab,authed]);

  useEffect(()=>{if(authed)loadAll();},[authed]);

  // When the coach opens the inbox, mark everything currently loaded as seen so the
  // NEW badges don't reappear next session. The in-session inboxNewIds stay for display.
  useEffect(()=>{
    if(tab!=="inbox"||inbox.length===0)return;
    if(inboxSeenRef.current===null)inboxSeenRef.current=new Set();
    inbox.forEach(x=>inboxSeenRef.current.add(x.id));
    try{localStorage.setItem("tf_inbox_seen_"+coachRole,JSON.stringify([...inboxSeenRef.current].slice(-500)));}catch(e){}
  },[tab,inbox,coachRole]);

  // Face ID support is checked on load so Quick Sign In shows before a name is picked
  useEffect(()=>{passkeyAvailable().then(setBioAvail);},[]);
  useEffect(()=>{
    if(!selectedCoach)return;
    setBioCredId(null);setShowBioOffer(false);
    (async()=>{
      try{
        if(window.PublicKeyCredential){
          const avail=await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setBioAvail(avail);
        }
      }catch(e){}
      try{
        const raw=localStorage.getItem("tf_bio_coach_"+selectedCoach);
        setBioCredId(raw?JSON.parse(raw).credId:null);
      }catch(e){setBioCredId(null);}
    })();
  },[selectedCoach]);

  const loadAll=async()=>{
    setLoading(true);
    try{
    const[{data:aths},{data:att},{data:inb},{data:anv},{data:lb},{data:ann}]=await Promise.all([
      supabase.from("athletes").select(ATHLETE_SAFE_COLS).order("name"),
      supabase.from("attendance").select("*,athletes(name)").order("date",{ascending:false}).limit(1000),
      supabase.from("inbox").select("*,athletes(name)").eq("done",false).order("created_at",{ascending:false}),
      supabase.from("anvil").select("*").order("created_at",{ascending:false}),
      supabase.from("leaderboard").select("*,athletes(name)").order("early_count",{ascending:false}),
      supabase.from("announcements").select("*").eq("active",true).eq("type","general").order("created_at",{ascending:false}).limit(1),
    ]);
    if(aths)setAthletes(prev=>aths.map(a=>({...a,photo_url:a.photo_url||prev.find(p=>p.id===a.id)?.photo_url||null})));
    if(aths)setGoalReviews(Object.fromEntries(aths.map(a=>[a.id,a.goal_review_status||""])));
    if(att)setAttendance(att);
    if(inb){
      setInbox(inb);
      // Load the per-coach "seen" set lazily, then flag any items not yet seen as new.
      if(inboxSeenRef.current===null){
        try{const s=localStorage.getItem("tf_inbox_seen_"+coachRole);inboxSeenRef.current=new Set(s?JSON.parse(s):[]);}catch(e){inboxSeenRef.current=new Set();}
      }
      const fresh=new Set(inb.filter(x=>!inboxSeenRef.current.has(x.id)).map(x=>x.id));
      setInboxNewIds(fresh);
    }
    if(anv)setAnvil(anv);
    if(lb)setLeaderboard(lb);
    if(ann&&ann.length>0){setCurrentAnnouncement(ann[0]);setAnnouncement(ann[0].message);}
    }catch(e){console.error("loadAll error:",e);}
    setLoading(false);
    // Load secondary data independently — won't block main load
    try{const{data}=await supabase.from("weight_log").select("*").order("date",{ascending:false});if(data)setWeightLogs(data);}catch(e){}
    try{const{data}=await supabase.from("pr_log").select("*").order("date",{ascending:false});if(data)setPrLogs(data);}catch(e){}
    try{const{data}=await supabase.from("announcements").select("day,message").eq("type","anvil_prize").eq("active",true);if(data){const m={};data.forEach(r=>{try{m[r.day]=JSON.parse(r.message);}catch(e){}});setAnvilPrizes(m);}}catch(e){}
    await loadMusicVotes();
  };

  const loadMusicVotes=async()=>{
    try{
      const _d=nowEST();
      const _ds=`${_d.getFullYear()}-${String(_d.getMonth()+1).padStart(2,'0')}-${String(_d.getDate()).padStart(2,'0')}`;
      const{data}=await supabase.from("announcements").select("message").eq("type","music_vote").eq("week_label",_ds);
      if(data){
        const counts={};
        data.forEach(r=>{counts[r.message]=(counts[r.message]||0)+1;});
        setMusicVotes(counts);
      }
    }catch(e){}
  };





  const callAI=async(prompt)=>{
    const res=await fetch("/api/ai-task",{method:"POST",headers:{"Content-Type":"application/json","x-app-secret":process.env.NEXT_PUBLIC_APP_ACTION_SECRET||""},body:JSON.stringify({prompt})});
    const data=await res.json();
    return data.text||"";
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
    const{data,error}=await supabase.from("athletes").insert({name:newName.trim(),sport:newSport.trim(),gender:newGender,role:newRole,status:"active"}).select(ATHLETE_SAFE_COLS);
    if(error){if(typeof window!=="undefined")alert("Couldn't add athlete: "+error.message);return;}
    if(data)setAthletes(p=>[...p,data[0]]);
    setNewName("");setNewSport("");setNewGender("");setNewRole("iron");
  };

  const deleteAthlete=async(id,name)=>{
    if(!window.confirm("Delete "+name+"? This cannot be undone."))return;
    // Delete all related records first
    const tables=["inbox","attendance","leaderboard","weight_log","callouts","goal_reviews"];
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
      await supabase.from("announcements").insert({type:"general",message:announcement,week_label:"This week",active:true});
    }
    await loadAll();
  };

  const openAthleteModal=async(ath)=>{
    setModalAth(ath);
    setModalData(null);
    setModalLoading(true);
    try{
      const[{data:att},{data:lbRow},{data:msgs},{data:wt},{data:anv}]=await Promise.all([
        supabase.from("attendance").select("*").eq("athlete_id",ath.id).order("date",{ascending:false}).limit(20),
        supabase.from("leaderboard").select("*").eq("athlete_id",ath.id).maybeSingle(),
        supabase.from("inbox").select("*").eq("athlete_id",ath.id).order("created_at",{ascending:false}).limit(8),
        supabase.from("weight_log").select("*").eq("athlete_id",ath.id).order("date",{ascending:false}).limit(6),
        supabase.from("anvil").select("*").eq("athlete_name",ath.name).order("created_at",{ascending:false}),
      ]);
      setModalData({att:att||[],lbRow,msgs:msgs||[],wt:wt||[],anv:anv||[]});
    }catch(e){console.error("Modal load:",e);}
    setModalLoading(false);
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
    {id:"roster",label:"Roster",icon:"👥"},
    {id:"teams",label:"Teams",icon:"👥"},
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
    {id:"mcastles-post",label:"MCastles 🍑",icon:"🍑"},
    {id:"injuries",label:"Injuries",icon:"🩺"},
    {id:"ironroom",label:"Iron Room",icon:"🏋️"},
    {id:"program",label:"Program",icon:"📋"},
    {id:"habits",label:"Habits",icon:"💧"},
    {id:"callouts",label:"Callouts",icon:"⚠️"},
  ];
  // Kevin only sees roster, mindset and attendance
  const KEVIN_TABS=["roster","mindset","attendance"];
  const TABS=coachRole==="kevin"?ALL_TABS.filter(t=>KEVIN_TABS.includes(t.id)):ALL_TABS;

  // Coach PINs are checked on the server (/api/auth); nothing secret lives in this page.

  const getBioLabel=()=>{
    if(typeof window==="undefined")return"Biometrics";
    const ua=navigator.userAgent||"";
    if(/iPhone|iPad|iPod/.test(ua))return"Face ID / Touch ID";
    if(/Mac/.test(ua))return"Touch ID";
    if(/Android/.test(ua))return"Fingerprint";
    return"Biometrics";
  };

  const coachNavFor=(id)=>{
    const roleMap={ant:"ant",kevin:"kevin",mcastles:"mcastles"};
    const tabMap={ant:"overview",kevin:"roster",mcastles:"overview"};
    return{role:roleMap[id]||"ant",tab:tabMap[id]||"overview"};
  };

  const completeCoachAuth=(role,tab)=>{
    setAuthed(true);setCoachRole(role);if(tab)setTab(tab);setPin("");setEditingPins(false);slideDirRef.current=0;
    try{const s=localStorage.getItem("tf_pinned_coach_"+role);setPinnedTabs(s?JSON.parse(s):(role==="kevin"?["mindset","attendance"]:["roster","inbox","attendance"]));}catch(e){}
    try{const storedOrder=localStorage.getItem("tf_more_order_coach_"+role);const defaultOrder=ALL_TABS.map(t=>t.id);const raw=storedOrder?JSON.parse(storedOrder):defaultOrder;const seen=new Set();const initOrder=raw.filter(id=>{if(seen.has(id))return false;seen.add(id);return true;});const newTabs=defaultOrder.filter(id=>!seen.has(id));const fullOrder=[...initOrder,...newTabs];setMoreOrder(fullOrder);moreOrderRef.current=fullOrder;}catch(e){}
  };

  const COACH_IDS=["ant","kevin","mcastles"];
  // Discoverable Face ID: iOS offers any passkey saved for this site and we
  // read which coach it belongs to from its user handle ("coach_<id>").
  // Must be called straight from a tap (no await before passkeySignIn).
  const authenticateWithBiometric=async(cid)=>{
    const picked=cid||selectedCoach||null;
    let res;
    try{res=await passkeySignIn();}
    catch(e){if(!isCancel(e))setBioSetupMsg(passkeyErrorText(e));return false;}
    let resolved=null;
    if(res.userHandle&&res.userHandle.startsWith("coach_")){const id=res.userHandle.slice(6);if(COACH_IDS.includes(id))resolved=id;}
    if(!resolved){
      for(const c of COACH_IDS){try{const raw=localStorage.getItem("tf_bio_coach_"+c);if(raw&&JSON.parse(raw).credId===res.credId){resolved=c;break;}}catch(e){}}
    }
    if(!resolved&&res.userHandle){setBioSetupMsg("That Face ID belongs to an athlete account. Pick your name and use your PIN.");return false;}
    if(!resolved)resolved=picked;
    if(!resolved){setBioSetupMsg("Couldn't tell which coach that Face ID is for. Pick your name and use your PIN.");return false;}
    rememberPasskey("tf_bio_coach_"+resolved,res.credId); // repair this browser's hint
    // Face ID unlocks this device's saved session; without one, the PIN is needed once.
    if(!loadSavedSession("coach_"+resolved)){
      setSelectedCoach(resolved);setPin("");setPinError("");setPinStep("enter");
      setBioSetupMsg("Enter your PIN once on this device to finish signing in.");
      return false;
    }
    setBioSetupMsg("");
    const nav=coachNavFor(resolved);
    completeCoachAuth(nav.role,nav.tab);
    return true;
  };

  const registerBiometric=async()=>{
    const c=coaches.find(x=>x.id===selectedCoach);
    try{
      const credId=await passkeyRegister({userId:"coach_"+selectedCoach,name:c?.name||selectedCoach});
      rememberPasskey("tf_bio_coach_"+selectedCoach,credId);
      setBioCredId(credId);setBioSetupMsg("");
    }catch(e){
      if(!isCancel(e)){setBioSetupMsg(passkeyErrorText(e,"turn on"));return;} // stay on the offer so the message is seen
    }
    const nav=pendingNav;setPendingNav(null);setShowBioOffer(false);
    completeCoachAuth(nav?.role||"ant",nav?.tab||"overview");
  };

  // Direct (re)enrollment from the PIN screen — creates a fresh Apple passkey
  // in one tap and reports exactly what happens, so a stale/Google passkey can
  // always be replaced without the obscure reset dance.
  const setupCoachBiometric=async()=>{
    if(!selectedCoach)return;
    const c=coaches.find(x=>x.id===selectedCoach);
    setBioSetupMsg("Opening Face ID…");
    try{
      const credId=await passkeyRegister({userId:"coach_"+selectedCoach,name:c?.name||selectedCoach});
      rememberPasskey("tf_bio_coach_"+selectedCoach,credId);
      setBioCredId(credId);
      setBioSetupMsg("✓ Face ID is on, saved to Apple Passwords. Tap “Use Face ID” to test it.");
    }catch(e){
      setBioSetupMsg(isCancel(e)?"":passkeyErrorText(e,"turn on"));
    }
  };

  const [pinBusy,setPinBusy]=useState(false);
  function handlePinKey(k){
    if(k===null||pinBusy)return;
    if(k==="⌫"){setPin(p=>p.slice(0,-1));setPinError("");return;}
    if(pin.length>=4)return;
    const newPin=pin+String(k);
    setPin(newPin);
    if(newPin.length<4)return;
    const nav=coachNavFor(selectedCoach);
    const offerBio=()=>{
      if(bioAvail&&!bioCredId){setPendingNav(nav);setShowBioOffer(true);setPin("");}
      else{setPin("");completeCoachAuth(nav.role,nav.tab);}
    };
    const signedIn=(token)=>{setSession("coach_"+selectedCoach,token);setPinError("");offerBio();};
    (async()=>{
      setPinBusy(true);
      try{
        if(pinStep==="enter"){
          const r=await authApi({action:"login",kind:"coach",id:selectedCoach,pin:newPin});
          if(r.token)signedIn(r.token);
          else if(r.needsCreate){setPinConfirm(newPin);setPin("");setPinStep("confirm");setPinError("");}
          else{setPinError(authErrorText(r));setPin("");}
        }else if(pinStep==="create"){
          setPinConfirm(newPin);setPin("");setPinStep("confirm");setPinError("");
        }else if(pinStep==="confirm"){
          if(newPin!==pinConfirm){setPinError("PINs don't match. Try again.");setPin("");setPinStep("create");setPinConfirm("");}
          else if(selectedCoach==="ant"){
            const r=await authApi({action:"create",kind:"coach",id:"ant",pin:newPin});
            if(r.token)signedIn(r.token);else{setPinError(authErrorText(r));setPin("");setPinStep("enter");}
          }else{setPin("");setPinStep("approve");setPinError("");}
        }else if(pinStep==="approve"){
          // Coach Ant approves a new coach PIN with his own PIN
          const r=await authApi({action:"create",kind:"coach",id:selectedCoach,pin:pinConfirm,approvePin:newPin});
          if(r.token)signedIn(r.token);
          else if(r.error==="already_set"){setPinError(authErrorText(r));setPin("");setPinStep("enter");setPinConfirm("");}
          else{setPinError(authErrorText(r));setPin("");}
        }
      }finally{setPinBusy(false);}
    })();
  }

  const coaches=[
    {id:"ant",name:"Coach Ant",sub:"Head Coach",color:GOLD,emoji:"⚒"},
    {id:"kevin",name:"Coach Kevin",sub:"Guest Speaker",color:PUR,emoji:"📖"},
    {id:"mcastles",name:"MCastles",sub:"Motivator · Full Access",color:ORANGE,emoji:"🍑🚀"},
  ];

  const selCoach=coaches.find(x=>x.id===selectedCoach);
  if(!authed) return(
    <>
      <Head><title>Coach — TF College Group</title></Head>
      <div className="tfx lg">
        <div className="lg-col">
          {/* Step 1 — pick a coach */}
          {pinStep==="select"&&(
            <>
              <div className="lg-brand"><img src="/icon.png" alt=""/><span>TF College Group</span></div>
              <div className="lg-head">
                <div className="tfx-eyebrow">Coach</div>
                <h1>Sign in</h1>
                <p>Pick your name to continue.</p>
              </div>
              {bioAvail&&(
                <button className="lg-faceid tfx-press" onClick={()=>authenticateWithBiometric(null)}>
                  <Icon name="faceId" size={22} color="currentColor"/><span>Quick sign in with {getBioLabel()}</span>
                </button>
              )}
              {bioSetupMsg&&!bioSetupMsg.startsWith("Opening")&&<div role="alert" className="lg-msg is-warn">{bioSetupMsg}</div>}
              <div className="lg-list">
                {coaches.map(c=>(
                  <button key={c.id} className="tfx-card lg-row tfx-press" style={{"--c":c.color}} onClick={()=>{
                    // Fire Face ID instantly within the tap gesture (no awaits before
                    // credentials.get) so the prompt appears immediately on iOS.
                    let bioRaw=null;try{bioRaw=localStorage.getItem("tf_bio_coach_"+c.id);}catch(e){}
                    if(bioRaw)authenticateWithBiometric(c.id);
                    setSelectedCoach(c.id);
                    setPin("");setPinError("");setPinConfirm("");setPinStep("enter");
                    authApi({action:"status",kind:"coach",id:c.id}).then(r=>{if(r.hasPin===false)setPinStep(s=>s==="enter"?"create":s);});
                  }}>
                    <span className="lg-av">{c.emoji}</span>
                    <span className="lg-row-txt"><b>{c.name}</b><small>{c.sub}</small></span>
                    <span className="lg-chev" aria-hidden="true">›</span>
                  </button>
                ))}
              </div>
              <a href="/" className="lg-link">← Back to home</a>
            </>
          )}

          {/* Step 2 — PIN entry / create / confirm */}
          {pinStep!=="select"&&selCoach&&(
            <>
              <button className="lg-back tfx-press" onClick={()=>{setPinStep("select");setPin("");setPinError("");setSelectedCoach(null);}}>‹ Back</button>
              <div className="lg-who" style={{"--c":selCoach.color}}>
                <span className="lg-av is-big">{selCoach.emoji}</span>
                <h1>{selCoach.name}</h1>
                <p>{pinStep==="create"?"Create your 4-digit PIN":pinStep==="confirm"?"Enter it once more to confirm":pinStep==="approve"?"Coach Ant: enter your PIN to approve":"Enter your PIN"}</p>
              </div>

              {bioCredId&&pinStep==="enter"&&!showBioOffer&&(
                <button className="lg-faceid tfx-press" onClick={()=>authenticateWithBiometric()}>
                  <Icon name="faceId" size={22} color="currentColor"/><span>Use {getBioLabel()}</span>
                </button>
              )}

              {showBioOffer?(
                <div className="tfx-card lg-offer" style={{"--c":selCoach.color}}>
                  <Icon name="faceId" size={40} color="currentColor"/>
                  <b>Turn on {getBioLabel()}?</b>
                  <p>Skip the PIN next time and sign in with your face or fingerprint.</p>
                  {bioSetupMsg&&!bioSetupMsg.startsWith("Opening")&&<div role="alert" className="lg-msg is-warn">{bioSetupMsg}</div>}
                  <button className="tfx-btn tfx-press lg-wide" onClick={registerBiometric}>Turn on {getBioLabel()}</button>
                  <button className="tfx-btn-ghost tfx-press lg-wide" onClick={()=>{
                    const nav=pendingNav;setPendingNav(null);setShowBioOffer(false);
                    completeCoachAuth(nav?.role||"ant",nav?.tab||"overview");
                  }}>Not now</button>
                </div>
              ):(
                <>
                  <div className={"lg-dots"+(pinError?" is-error":"")} style={{"--c":selCoach.color}} aria-label={pin.length+" of 4 digits entered"}>
                    {[0,1,2,3].map(i=><i key={i} className={i<pin.length?"is-on":""}/>)}
                  </div>
                  {pinError&&<div role="alert" className="lg-msg is-error">{pinError}</div>}
                  <div className="lg-pad">
                    {[1,2,3,4,5,6,7,8,9,null,0,"⌫"].map((k,i)=>k===null?<span key={i}/>:(
                      <button key={i} className={"tfx-press"+(k==="⌫"?" is-del":"")} onClick={()=>handlePinKey(k)} aria-label={k==="⌫"?"Delete":String(k)}>{k}</button>
                    ))}
                  </div>
                  {bioAvail&&(
                    <button className="lg-link is-btn" onClick={setupCoachBiometric}>{bioCredId?"Re-enable "+getBioLabel()+" (save to Apple Passwords)":"Set up "+getBioLabel()+" on this device"}</button>
                  )}
                  {bioSetupMsg&&<div className={"lg-msg"+(bioSetupMsg.startsWith("✓")?" is-ok":bioSetupMsg.startsWith("Opening")?"":" is-warn")}>{bioSetupMsg}</div>}
                  {bioCredId&&<button className="lg-link is-btn is-quiet" onClick={()=>{try{localStorage.removeItem("tf_bio_coach_"+selectedCoach);}catch(e){}setBioCredId(null);setBioSetupMsg("");}}>Reset saved passkey</button>}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );

  if(loading) return(
    <div className="tfx lg"><div className="lg-loading"><img src="/icon.png" alt=""/><span className="tfx-eyebrow">Loading the coach dashboard…</span></div></div>
  );

  const fixedTabForSwipe=coachRole==="kevin"?"roster":"overview";
  const validPinnedForSwipe=pinnedTabs.filter(id=>TABS.find(t=>t.id===id)&&id!==fixedTabForSwipe);
  const PRIMARY_NAV=[fixedTabForSwipe,...validPinnedForSwipe];
  const handleTouchStart=(e)=>{touchStartRef.current={x:e.touches[0].clientX,y:e.touches[0].clientY};};
  const handleTouchEnd=(e)=>{
    if(!touchStartRef.current)return;
    const dx=e.changedTouches[0].clientX-touchStartRef.current.x;
    const dy=e.changedTouches[0].clientY-touchStartRef.current.y;
    touchStartRef.current=null;
    if(Math.abs(dx)<52||Math.abs(dx)<Math.abs(dy)*1.5)return;
    const idx=PRIMARY_NAV.indexOf(tab);
    if(dx>0&&idx<PRIMARY_NAV.length-1){slideDirRef.current=1;setTab(PRIMARY_NAV[idx+1]);}
    else if(dx<0&&idx>0){slideDirRef.current=-1;setTab(PRIMARY_NAV[idx-1]);}
  };

  return(
    <>
      <style>{`@keyframes tfSlideFromRight{from{transform:translateX(52px) scale(0.98);opacity:0}to{transform:translateX(0) scale(1);opacity:1}}@keyframes tfSlideFromLeft{from{transform:translateX(-52px) scale(0.98);opacity:0}to{transform:translateX(0) scale(1);opacity:1}}@keyframes tfJiggle{0%{transform:rotate(-1.5deg) scale(1.03)}100%{transform:rotate(1.5deg) scale(1.03)}}`}</style>
      <Head><title>Coach Dashboard — TF College Group</title></Head>
      <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} style={{fontFamily:"Georgia, serif",paddingBottom:"2rem",background:"transparent",minHeight:"100vh"}}>

        <header className="cs-head">
          <div className="cs-head-in">
            <img src="/icon.png" alt="" className="cs-logo"/>
            <div className="cs-id">
              <b>{coachRole==="mcastles"?"MCastles":coachRole==="kevin"?"Coach Kevin":"Coach Ant"}</b>
              <small>{dayName} · <span className={isClassDay?"is-on":""}>{isClassDay?"Class day":"No class"}</span> · {athletes.filter(a=>a.status==="active").length} active</small>
            </div>
            <button className="cs-out tfx-press" onClick={()=>{clearCurrent();setAuthed(false);}}>Sign out</button>
          </div>
        </header>

        <div key={tab} style={{padding:"1rem",maxWidth:900,margin:"0 auto",paddingBottom:"110px",animation:slideDirRef.current>0?"tfSlideFromRight 0.32s cubic-bezier(0.22,1,0.36,1) backwards":slideDirRef.current<0?"tfSlideFromLeft 0.32s cubic-bezier(0.22,1,0.36,1) backwards":"none"}}>

          <ErrorBoundary>

          {tab==="overview"&&<OverviewTab athletes={athletes} attendance={attendance} estTodayStr={estTodayStr} weekDays={weekDays} dayName={dayName} inboxCount={inboxCount} musicVotes={musicVotes} loadMusicVotes={loadMusicVotes} announcement={announcement} setAnnouncement={setAnnouncement} saveAnnouncement={saveAnnouncement} injuries={injuries} messages={messages} prayers={prayers}/>}


          {tab==="teams"&&(<TeamsView athletes={athletes}/>)}

          {tab==="roster"&&<RosterTab athletes={athletes} setAthletes={setAthletes} updateAthlete={updateAthlete} deleteAthlete={deleteAthlete} addAthlete={addAthlete} uploadAthletePhoto={uploadAthletePhoto} openAthleteModal={openAthleteModal} newName={newName} setNewName={setNewName} newSport={newSport} setNewSport={setNewSport} newGender={newGender} setNewGender={setNewGender} newRole={newRole} setNewRole={setNewRole}/>}
          {tab==="attendance"&&<CoachAttendanceTab weekDays={weekDays} mostMissed={mostMissed} estTodayStr={estTodayStr} attendance={attendance} setAttendance={setAttendance} athletes={athletes} leaderboard={leaderboard}/>}

          {tab==="accountability"&&<Accountability athletes={athletes.filter(a=>a.status==="active")}/>}
{tab==="fellowship"&&<FellowshipFriday/>}
{tab==="mindset"&&<MindsetMonday/>}
{tab==="culture"&&<CultureEvents athletes={athletes}/>}

            {tab==="prayers"&&<PrayersTab/>}

          {tab==="weights"&&<WeightsTab athletes={athletes} weightLogs={weightLogs} prLogs={prLogs}/>}

            {tab==="photos"&&<PhotosTab athletes={athletes} setAthletes={setAthletes} uploadAthletePhoto={uploadAthletePhoto}/>}

            {tab==="qr"&&<QrTab athletes={athletes} attendance={attendance}/>}

            {tab==="engagement"&&<EngagementTab/>}


            {tab==="anvil"&&<AnvilTab athletes={athletes} anvil={anvil} setAnvil={setAnvil} anvilPrizes={anvilPrizes} loadAll={loadAll}/>}


          {tab==="inbox"&&<InboxTab inbox={inbox} setInbox={setInbox} injuries={injuries} messages={messages} prayers={prayers} athletes={athletes} inboxNewIds={inboxNewIds} genLoading={genLoading} replyToInbox={replyToInbox} generateReply={generateReply}/>}

            {tab==="leaderboard"&&<CoachLeaderboardTab leaderboard={leaderboard} athletes={athletes} openAthleteModal={openAthleteModal}/>}

            {tab==="goals"&&<GoalsTab athletes={athletes} goalReviews={goalReviews} setGoalReviews={setGoalReviews} genLoading={genLoading} generateTask={generateTask}/>}

            {tab==="mcastles-post"&&<MCastlesPostTab/>}
            {tab==="injuries"&&<InjuriesTab athletes={athletes}/>}

            {tab==="ironroom"&&<IronRoomTab athletes={athletes}/>}
            {tab==="program"&&<ProgramUpload/>}

            {tab==="habits"&&<CoachHabitsTab athletes={athletes}/>}

            {tab==="callouts"&&<CalloutsTab/>}
          </ErrorBoundary>
        </div>
        {/* ── BOTTOM BAR (pinned tabs) + ALL TABS DRAWER ── */}
        {(()=>{
            const ICON_MAP={"overview":"barChart","teams":"grid","roster":"users","attendance":"calendar","accountability":"checkSquare","inbox":"inbox","leaderboard":"trophy","goals":"target","fellowship":"pray","mindset":"compass","culture":"flame","prayers":"heart","weights":"scale","photos":"camera","engagement":"megaphone","qr":"smartphone","ironroom":"barbell","program":"fileText","injuries":"alertTriangle","habits":"droplet","callouts":"zap","anvil":"anvil","mcastles-post":"crown"};
            const fixedTab=coachRole==="kevin"?"roster":"overview";
            const validPinned=pinnedTabs.filter(id=>TABS.find(t=>t.id===id)&&id!==fixedTab);
            const PRIMARY=[fixedTab,...validPinned];
            const ic=(id,size)=><Icon name={ICON_MAP[id]||"grid"} size={size} color="currentColor"/>;
            const SECTIONS=[
              {label:"Today",ids:["overview","roster","teams","attendance"]},
              {label:"Accountability",ids:["accountability","inbox","leaderboard","anvil"]},
              {label:"Culture & faith",ids:["culture","fellowship","prayers","mindset"]},
              {label:"Training",ids:["program","ironroom","weights","goals","engagement","qr"]},
              {label:"More",ids:["photos","injuries","habits","callouts","mcastles-post"]},
            ].map(s=>({...s,ids:s.ids.filter(id=>TABS.find(t=>t.id===id))})).filter(s=>s.ids.length>0);
            const activeIdx=PRIMARY.indexOf(tab);
            return(
              <>
                <nav className="cs-nav" aria-label="Coach tabs">
                  <div className="cs-nav-in" style={{"--n":PRIMARY.length+1,"--i":activeIdx}}>
                    {activeIdx>=0&&!jiggleMode&&<i className="cs-ind" aria-hidden="true"/>}
                    {PRIMARY.map(id=>{
                      const t=TABS.find(x=>x.id===id);
                      if(!t)return null;
                      const isActive=tab===id&&!jiggleMode;
                      const cnt=id==="inbox"&&inboxCount>0?inboxCount:0;
                      const isJiggling=jiggleMode&&id!==fixedTab&&jiggleDragId!==id;
                      const isDragging=jiggleDragId===id;
                      return(
                        <button key={id}
                          ref={isDragging?jiggleDragElemRef:null}
                          className={"cs-tab"+(isActive?" is-on":"")+(isJiggling?" is-jiggle":"")+(isDragging?" is-drag":"")+(jiggleMode?" is-edit":"")}
                          aria-current={isActive?"page":undefined}
                          onClick={()=>{if(jiggleMode)return;hTap();slideDirRef.current=0;setTab(id);}}
                          onTouchStart={(e)=>{
                            if(id===fixedTab)return;
                            const startX=e.touches[0].clientX;
                            longPressNavRef.current=setTimeout(()=>{
                              if(navigator.vibrate)navigator.vibrate(20);
                              jiggleDragOrderRef.current=[...validPinned];
                              jiggleDragStartX.current=startX;
                              jiggleLastSwapX.current=startX;
                              setJiggleDragId(id);
                              setJiggleMode(true);
                            },480);
                          }}
                          onTouchMove={(e)=>{
                            if(!jiggleMode){clearTimeout(longPressNavRef.current);return;}
                            if(jiggleDragId!==id)return;
                            e.stopPropagation();
                            const cx=e.touches[0].clientX;
                            if(jiggleDragElemRef.current){jiggleDragElemRef.current.style.transform=`translateX(${cx-jiggleDragStartX.current}px) scale(1.14)`;}
                            const dx=cx-jiggleLastSwapX.current;
                            if(Math.abs(dx)<50)return;
                            const dir=dx>0?1:-1;
                            const arr=jiggleDragOrderRef.current;
                            const from=arr.indexOf(id);
                            const to=from+dir;
                            if(to>=0&&to<arr.length){[arr[from],arr[to]]=[arr[to],arr[from]];jiggleLastSwapX.current+=dir*50;jiggleDragStartX.current+=dir*50;setPinnedTabs([...arr]);}
                          }}
                          onTouchEnd={()=>{
                            clearTimeout(longPressNavRef.current);
                            if(jiggleDragElemRef.current)jiggleDragElemRef.current.style.transform="";
                            setJiggleDragId(null);
                            if(jiggleDragOrderRef.current){try{localStorage.setItem("tf_pinned_coach_"+coachRole,JSON.stringify(jiggleDragOrderRef.current));}catch(err){}jiggleDragOrderRef.current=null;}
                          }}>
                          <span className="cs-ic">{ic(id,20)}</span>
                          <span className="cs-lbl">{t.label.replace(/\s*\(\d+\)$/,"")}</span>
                          {cnt>0&&!jiggleMode&&<em className="cs-badge" aria-label={cnt+" new"}>{cnt}</em>}
                        </button>
                      );
                    })}
                    <button className={"cs-tab is-all"+(showTabPicker?" is-on":"")} onClick={()=>{setShowTabPicker(true);setEditingPins(false);}} aria-haspopup="dialog">
                      <span className="cs-ic"><Icon name="menu" size={20} color="currentColor"/></span>
                      <span className="cs-lbl">All tabs</span>
                    </button>
                  </div>
                </nav>

                {jiggleMode&&(
                  <button className="cs-done tfx-press" onClick={()=>{setJiggleMode(false);setJiggleDragId(null);if(jiggleDragElemRef.current)jiggleDragElemRef.current.style.transform="";}}>Done</button>
                )}

                {showTabPicker&&(
                  <div className="cs-scrim" onClick={()=>setShowTabPicker(false)}>
                    <aside className="cs-drawer" role="dialog" aria-label="All tabs" onClick={e=>e.stopPropagation()}>
                      <div className="cs-drawer-head">
                        <b>All tabs</b>
                        <button className="cs-x tfx-press" onClick={()=>setShowTabPicker(false)} aria-label="Close">✕</button>
                      </div>
                      <div className="cs-drawer-sec">
                        <div className="tfx-eyebrow">Appearance</div>
                        <div className="ir-seg">
                          {[{m:"dark",label:"Dark"},{m:"light",label:"Light"}].map(o=>(
                            <button key={o.m} className={themeMode===o.m?"is-on":""} onClick={()=>{if(themeMode!==o.m)toggleTheme();}}>{o.label}</button>
                          ))}
                        </div>
                      </div>
                      {SECTIONS.map(section=>(
                        <div key={section.label} className="cs-drawer-sec">
                          <div className="tfx-eyebrow">{section.label}</div>
                          <div className="cs-items">
                            {section.ids.map(id=>{
                              const t=TABS.find(x=>x.id===id);
                              if(!t)return null;
                              const active=tab===id;
                              const pinned=id===fixedTab||validPinned.includes(id);
                              const cnt=id==="inbox"&&inboxCount>0?inboxCount:0;
                              return(
                                <button key={id} className={"cs-item tfx-press"+(active?" is-on":"")} aria-current={active?"page":undefined} onClick={()=>{slideDirRef.current=0;setTab(id);setShowTabPicker(false);}}>
                                  <span className="cs-item-ic">{ic(id,17)}</span>
                                  <span className="cs-item-lbl">{t.label.replace(/\s*\(\d+\)$/,"")}</span>
                                  {cnt>0&&<em className="cs-badge is-inline">{cnt}</em>}
                                  {pinned&&<small title="On the bottom bar">On bar</small>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      <p className="cs-hint">Hold a tab on the bottom bar to reorder it.</p>
                    </aside>
                  </div>
                )}
              </>
            );
          })()}
      </div>
      {modalAth&&(()=>{
        const close=()=>{setModalAth(null);setModalData(null);};
        const forge=modalAth.role==="forge";
        return(
        <div className="cs-scrim is-sheet" onClick={close}>
          <div className="cs-sheet" role="dialog" aria-label={modalAth.name} onClick={e=>e.stopPropagation()} style={{"--c":forge?"#C0392B":"#708090"}}>
            <div className="cs-grab" aria-hidden="true"/>
            <div className="cs-sheet-head">
              <span className="lg-av">{modalAth.photo_url?<img src={modalAth.photo_url} alt=""/>:(modalAth.name||"?")[0]}</span>
              <div className="cs-sheet-id">
                <b>{modalAth.name}</b>
                <small>{[modalAth.sport,forge?"Forge":"Iron",modalAth.status==="sleeping"?"Sleeping":null].filter(Boolean).join(" · ")}</small>
              </div>
              <button className="cs-x tfx-press" onClick={close} aria-label="Close">✕</button>
            </div>
            {modalLoading&&<div className="cs-sheet-empty">Loading…</div>}
            {modalData&&(()=>{
              const{att,lbRow,msgs,wt,anv}=modalData;
              const stats=[{label:"Streak",val:lbRow?.current_streak||0},{label:"Best",val:lbRow?.best_streak||0},{label:"Early",val:lbRow?.early_count||0},{label:"Late",val:lbRow?.late_count||0,warn:true}];
              const open=msgs.filter(m=>!m.done).slice(0,3);
              return(
                <div className="cs-sheet-body">
                  <div className="cs-stats">
                    {stats.map(s=>(
                      <div key={s.label} className={"cs-stat"+(s.warn&&s.val>0?" is-warn":"")}><b className="tfx-num">{s.val}</b><small>{s.label}</small></div>
                    ))}
                  </div>
                  {att.length>0&&(
                    <section>
                      <div className="tfx-eyebrow">Recent check-ins</div>
                      <div className="cs-att">
                        {att.slice(0,8).map((r,i)=>(
                          <div key={i} className={"cs-att-d is-"+(r.status||"none")}><i>{r.status==="early"?"✓":r.status==="late"?"L":"–"}</i><small>{r.date?.slice(5).replace("-","/")}</small></div>
                        ))}
                      </div>
                    </section>
                  )}
                  {(modalAth.athletic_goal||modalAth.character_goal)&&(
                    <section>
                      <div className="tfx-eyebrow">Goals</div>
                      {modalAth.athletic_goal&&<div className="cs-quote" style={{"--q":"var(--green)"}}><small>Athletic</small><p>{modalAth.athletic_goal}</p></div>}
                      {modalAth.character_goal&&<div className="cs-quote" style={{"--q":"var(--violet)"}}><small>Character</small><p>{modalAth.character_goal}</p></div>}
                    </section>
                  )}
                  {open.length>0&&(
                    <section>
                      <div className="tfx-eyebrow">Open messages</div>
                      {open.map((m,i)=>(
                        <div key={i} className="cs-quote" style={{"--q":m.type==="injury"?"var(--red)":m.type==="prayer"?"var(--green)":"var(--violet)"}}><small>{m.type==="injury"?"Injury":m.type==="prayer"?"Prayer":"Message"}</small><p>{m.message}</p></div>
                      ))}
                    </section>
                  )}
                  {wt.length>0&&(
                    <section>
                      <div className="tfx-eyebrow">Weigh-ins</div>
                      <div className="cs-chips">
                        {wt.map((w,i)=><div key={i} className="cs-chip"><b className="tfx-num">{w.weight}<em>lb</em></b><small>{w.date?.slice(5).replace("-","/")}</small></div>)}
                      </div>
                    </section>
                  )}
                  {anv.length>0&&(
                    <section>
                      <div className="tfx-eyebrow">Anvil awards · {anv.length}</div>
                      {anv.map((a,i)=><div key={i} className="cs-anvil"><span>{a.type==="group"?"Group":"Individual"}</span><small>{a.date_awarded}</small></div>)}
                    </section>
                  )}
                  {!att.length&&!open.length&&!wt.length&&!anv.length&&!modalAth.athletic_goal&&!modalAth.character_goal&&<div className="cs-sheet-empty">Nothing logged yet.</div>}
                </div>
              );
            })()}
          </div>
        </div>
        );
      })()}
    </>
  );
}
