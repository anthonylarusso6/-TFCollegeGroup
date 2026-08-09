// v1776642403
import { useState, useEffect, useRef } from "react";
import { BG, PUR, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
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
import TeamsView from "../components/TeamsView";

const COACH_PIN="1803";




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
  const[showTabPicker,setShowTabPicker]=useState(false);
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
  const[pendingNav,setPendingNav]=useState(null);
  const touchStartRef=useRef(null);
  const slideDirRef=useRef(0);

  useEffect(()=>{if(authed)loadAll();},[authed]);

  // When the coach opens the inbox, mark everything currently loaded as seen so the
  // NEW badges don't reappear next session. The in-session inboxNewIds stay for display.
  useEffect(()=>{
    if(tab!=="inbox"||inbox.length===0)return;
    if(inboxSeenRef.current===null)inboxSeenRef.current=new Set();
    inbox.forEach(x=>inboxSeenRef.current.add(x.id));
    try{localStorage.setItem("tf_inbox_seen_"+coachRole,JSON.stringify([...inboxSeenRef.current].slice(-500)));}catch(e){}
  },[tab,inbox,coachRole]);

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
      supabase.from("athletes").select("*").order("name"),
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
    const res=await fetch("/api/ai-task",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt})});
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
    const{data,error}=await supabase.from("athletes").insert({name:newName.trim(),sport:newSport.trim(),gender:newGender,role:newRole,status:"active"}).select();
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
    {id:"habits",label:"Habits",icon:"💧"},
    {id:"callouts",label:"Callouts",icon:"⚠️"},
  ];
  // Kevin only sees roster, mindset and attendance
  const KEVIN_TABS=["roster","mindset","attendance"];
  const TABS=coachRole==="kevin"?ALL_TABS.filter(t=>KEVIN_TABS.includes(t.id)):ALL_TABS;

  // Kevin PIN stored in localStorage
  const getKevinPin=()=>typeof window!=="undefined"?localStorage.getItem("kevin_coach_pin_v2"):null;
  const saveKevinPin=(p)=>localStorage.setItem("kevin_coach_pin_v2",p);
  // MCastles PIN stored in localStorage
  const getMCastlesPin=()=>typeof window!=="undefined"?localStorage.getItem("mcastles_coach_pin"):null;
  const saveMCastlesPin=(p)=>localStorage.setItem("mcastles_coach_pin",p);

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

  const authenticateWithBiometric=async(cid)=>{
    const fallbackCoach=cid||selectedCoach||"ant";
    try{
      const challenge=crypto.getRandomValues(new Uint8Array(32));
      const assertion=await navigator.credentials.get({
        publicKey:{
          challenge,
          rpId:window.location.hostname,
          allowCredentials:[],
          userVerification:"required",
          timeout:60000,
          hints:["client-device"], // prefer platform authenticator (Face ID → iCloud Keychain)
        }
      });
      if(assertion){
        // Identify coach from userHandle (set during registration)
        let resolvedCoach=fallbackCoach;
        if(assertion.response.userHandle){
          const handle=new TextDecoder().decode(assertion.response.userHandle);
          const parsed=handle.replace("coach_","");
          if(["ant","kevin","mcastles"].includes(parsed))resolvedCoach=parsed;
        }
        // If userHandle didn't resolve it, match by rawId
        if(resolvedCoach===fallbackCoach){
          const credB64=btoa(String.fromCharCode(...new Uint8Array(assertion.rawId)));
          for(const c of["ant","kevin","mcastles"]){
            const raw=localStorage.getItem("tf_bio_coach_"+c);
            if(raw&&JSON.parse(raw).credId===credB64){resolvedCoach=c;break;}
          }
        }
        // If we couldn't identify the coach from the passkey and no coach was pre-selected, refuse
        if(resolvedCoach===fallbackCoach&&!cid&&!selectedCoach)return false;
        const nav=coachNavFor(resolvedCoach);
        completeCoachAuth(nav.role,nav.tab);
        return true;
      }
    }catch(e){/* cancelled — fall through to PIN */}
    return false;
  };

  const registerBiometric=async()=>{
    const c=coaches.find(x=>x.id===selectedCoach);
    try{
      const challenge=crypto.getRandomValues(new Uint8Array(32));
      const credential=await navigator.credentials.create({
        publicKey:{
          challenge,
          rp:{name:"TF College Group",id:window.location.hostname},
          user:{
            id:new TextEncoder().encode("coach_"+selectedCoach),
            name:c?.name||selectedCoach,
            displayName:c?.name||selectedCoach,
          },
          pubKeyCredParams:[{type:"public-key",alg:-7},{type:"public-key",alg:-257}],
          authenticatorSelection:{
            authenticatorAttachment:"platform", // forces Face ID/Touch ID → iCloud Keychain, not Chrome PM
            userVerification:"required",
            residentKey:"required",
          },
          timeout:60000,
        }
      });
      const credId=btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      localStorage.setItem("tf_bio_coach_"+selectedCoach,JSON.stringify({credId,rpId:window.location.hostname}));
      setBioCredId(credId);
    }catch(e){}
    const nav=pendingNav;setPendingNav(null);setShowBioOffer(false);
    completeCoachAuth(nav?.role||"ant",nav?.tab||"overview");
  };

  function handlePinKey(k){
    if(k===null)return;
    if(k==="⌫"){setPin(p=>p.slice(0,-1));setPinError("");return;}
    if(pin.length>=4)return;
    const newPin=pin+String(k);
    setPin(newPin);
    if(newPin.length===4){
      const offerBio=(nav)=>{
        if(bioAvail&&!bioCredId){setPendingNav(nav);setShowBioOffer(true);setPin("");}
        else{setPin("");completeCoachAuth(nav.role,nav.tab);}
      };
      if(pinStep==="enter"){
        if(selectedCoach==="ant"){
          if(newPin===COACH_PIN)offerBio({role:"ant",tab:"overview"});
          else{setPinError("Wrong PIN. Try again.");setPin("");}
        }else if(selectedCoach==="kevin"){
          const kp=getKevinPin();
          if(kp&&newPin===kp)offerBio({role:"kevin",tab:"roster"});
          else{setPinError("Wrong PIN. Try again.");setPin("");}
        }else if(selectedCoach==="mcastles"){
          const mcp=getMCastlesPin();
          if(mcp&&newPin===mcp)offerBio({role:"mcastles",tab:"overview"});
          else{setPinError("Wrong PIN. Try again.");setPin("");}
        }
      }else if(pinStep==="create"){
        setPinConfirm(newPin);setPin("");setPinStep("confirm");setPinError("");
      }else if(pinStep==="confirm"){
        if(selectedCoach==="mcastles"){
          if(newPin===pinConfirm){saveMCastlesPin(newPin);offerBio({role:"mcastles",tab:"overview"});}
          else{setPinError("PINs don't match. Try again.");setPin("");setPinStep("create");setPinConfirm("");}
        }else{
          if(newPin===pinConfirm){saveKevinPin(newPin);offerBio({role:"kevin",tab:"roster"});}
          else{setPinError("PINs don't match. Try again.");setPin("");setPinStep("create");setPinConfirm("");}
        }
      }
    }
  }

  const coaches=[
    {id:"ant",name:"Coach Ant",sub:"Head Coach",color:GOLD,emoji:"⚒"},
    {id:"kevin",name:"Coach Kevin",sub:"Guest Speaker",color:PUR,emoji:"📖"},
    {id:"mcastles",name:"MCastles",sub:"Motivator · Full Access",color:ORANGE,emoji:"🍑🚀"},
  ];

  if(!authed) return(
    <>
      <Head><title>Coach — TF College Group</title></Head>
      <div style={{height:"100dvh",background:"#080808",fontFamily:"Georgia, serif",maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 1.25rem",position:"relative",overflow:"hidden"}}>
        <div style={{position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",width:600,height:400,background:"radial-gradient(ellipse at top,#E8720C10 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,transparent,#E8720C,#C0392B,transparent)"}}/>
        <div style={{textAlign:"center",width:"100%",position:"relative"}}>

          {/* Step 1 — Select coach */}
          {pinStep==="select"&&(
            <>
              <div style={{width:72,height:72,borderRadius:20,background:"linear-gradient(145deg,#E8720C,#C0392B,#8B0000)",margin:"0 auto 1.5rem",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,boxShadow:"0 0 60px #E8720C55,0 0 120px #E8720C22"}}>⚒</div>
              <div style={{fontSize:24,fontWeight:900,color:"#fff",marginBottom:4,letterSpacing:"-0.02em",textTransform:"uppercase"}}>Coach Login</div>
              <div style={{fontSize:12,color:"#555",marginBottom:20,letterSpacing:"0.04em"}}>Select your name to continue</div>
              {/* Quick Sign In — appears when any passkey is stored for this site */}
              {bioAvail&&(()=>{const anyStored=["ant","kevin","mcastles"].some(c=>{try{return!!localStorage.getItem("tf_bio_coach_"+c);}catch(e){return false;}});return anyStored;})()&&(
                <button onClick={()=>authenticateWithBiometric(null)}
                  style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,
                    padding:"15px",borderRadius:14,border:"1px solid rgba(232,114,12,0.35)",
                    background:"linear-gradient(135deg,rgba(232,114,12,0.12),rgba(192,57,43,0.08))",
                    color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"Georgia,serif",
                    marginBottom:16,boxShadow:"0 0 24px rgba(232,114,12,0.15)",letterSpacing:"0.01em"}}>
                  <Icon name="faceId" size={22} color="#E8720C"/>
                  <span>Quick Sign In</span>
                </button>
              )}
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {coaches.map(c=>(
                  <button key={c.id} onClick={()=>{
                    // Fire Face ID instantly within the tap gesture (no awaits before
                    // credentials.get) so the prompt appears immediately on iOS.
                    let bioRaw=null;try{bioRaw=localStorage.getItem("tf_bio_coach_"+c.id);}catch(e){}
                    if(bioRaw)authenticateWithBiometric(c.id);
                    setSelectedCoach(c.id);
                    setPin("");setPinError("");
                    const hasPin=c.id==="ant"||(c.id==="kevin"&&getKevinPin())||(c.id==="mcastles"&&getMCastlesPin());
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

              {/* Bio shortcut button — above PIN dots when credential stored */}
              {bioCredId&&pinStep==="enter"&&!showBioOffer&&(
                <button onClick={()=>authenticateWithBiometric()}
                  style={{marginBottom:20,display:"flex",alignItems:"center",gap:10,padding:"13px 24px",
                    borderRadius:14,border:"1px solid "+(coaches.find(x=>x.id===selectedCoach)?.color||GOLD)+"44",
                    background:(coaches.find(x=>x.id===selectedCoach)?.color||GOLD)+"12",
                    color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif",
                    letterSpacing:"0.02em",margin:"0 auto 20px",boxShadow:"0 0 20px "+(coaches.find(x=>x.id===selectedCoach)?.color||GOLD)+"22"}}>
                  <Icon name="faceId" size={22} color="#fff"/>
                  <span>Use {getBioLabel()}</span>
                </button>
              )}

              {showBioOffer?(
                <div style={{width:"100%",maxWidth:300,textAlign:"center",margin:"0 auto"}}>
                  <div style={{marginBottom:14,display:"flex",justifyContent:"center"}}><Icon name="faceId" size={42} color={coaches.find(x=>x.id===selectedCoach)?.color||GOLD}/></div>
                  <div style={{fontSize:17,fontWeight:800,color:"#fff",marginBottom:8,letterSpacing:"-0.01em"}}>Enable {getBioLabel()}?</div>
                  <div style={{fontSize:12,color:"#555",marginBottom:24,lineHeight:1.6}}>
                    Skip the PIN next time and sign in instantly with your fingerprint or face.
                  </div>
                  <button onClick={registerBiometric}
                    style={{width:"100%",padding:"14px",borderRadius:12,border:"none",
                      background:"linear-gradient(135deg,"+(coaches.find(x=>x.id===selectedCoach)?.color||GOLD)+","+(coaches.find(x=>x.id===selectedCoach)?.color||GOLD)+"aa)",
                      color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",
                      fontFamily:"Georgia,serif",letterSpacing:"0.04em",marginBottom:12,
                      boxShadow:"0 4px 24px "+(coaches.find(x=>x.id===selectedCoach)?.color||GOLD)+"44"}}>
                    Enable {getBioLabel()}
                  </button>
                  <button onClick={()=>{
                    const nav=pendingNav;setPendingNav(null);setShowBioOffer(false);
                    completeCoachAuth(nav?.role||"ant",nav?.tab||"overview");
                  }} style={{width:"100%",padding:"12px",borderRadius:12,border:"0.5px solid #222",
                    background:"transparent",color:"#444",fontSize:13,fontWeight:500,
                    cursor:"pointer",fontFamily:"Georgia,serif"}}>
                    Not now
                  </button>
                </div>
              ):(
              <>
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
                  if(val.length===4){handlePinKey(null);setPin(val);/* route through handlePinKey by rebuilding */
                    const offerBio=(nav)=>{
                      if(bioAvail&&!bioCredId){setPendingNav(nav);setShowBioOffer(true);setPin("");}
                      else{setPin("");completeCoachAuth(nav.role,nav.tab);}
                    };
                    if(pinStep==="enter"){
                      if(selectedCoach==="ant"){
                        if(val===COACH_PIN)offerBio({role:"ant",tab:"overview"});
                        else{setPinError("Wrong PIN. Try again.");setPin("");}
                      }else if(selectedCoach==="kevin"){
                        const kp=getKevinPin();
                        if(kp&&val===kp)offerBio({role:"kevin",tab:"roster"});
                        else{setPinError("Wrong PIN. Try again.");setPin("");}
                      }else if(selectedCoach==="mcastles"){
                        const mcp=getMCastlesPin();
                        if(mcp&&val===mcp)offerBio({role:"mcastles",tab:"overview"});
                        else{setPinError("Wrong PIN. Try again.");setPin("");}
                      }
                    }else if(pinStep==="create"){
                      setPinConfirm(val);setPinStep("confirm");setPin("");
                    }else if(pinStep==="confirm"){
                      if(selectedCoach==="mcastles"){
                        if(val===pinConfirm){saveMCastlesPin(val);offerBio({role:"mcastles",tab:"overview"});}
                        else{setPinError("PINs don't match. Try again.");setPin("");setPinStep("create");setPinConfirm("");}
                      }else{
                        if(val===pinConfirm){saveKevinPin(val);offerBio({role:"kevin",tab:"roster"});}
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
              {bioCredId&&<button onClick={()=>{try{localStorage.removeItem("tf_bio_coach_"+selectedCoach);}catch(e){}setBioCredId(null);}} style={{marginTop:12,background:"transparent",border:"none",color:"#2a2a2a",fontSize:10,cursor:"pointer",fontFamily:"Georgia,serif",letterSpacing:"0.04em"}}>Reset saved passkey</button>}
              {pinError&&<div style={{marginTop:12,fontSize:12,color:"#ff5555",padding:"8px 16px",background:"#1a0505",borderRadius:10,border:"1px solid #3a0808"}}>{pinError}</div>}
            </>
            )}
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
      <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} style={{fontFamily:"Georgia, serif",paddingBottom:"2rem",background:"linear-gradient(160deg,#06060f 0%,#0a0608 50%,#080808 100%)",minHeight:"100vh"}}>

        <div style={{background:"linear-gradient(180deg,#0e0e1c 0%,#0a0a14 100%)",borderBottom:"1px solid rgba(255,255,255,0.08)",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,rgba(232,114,12,0.9),rgba(192,57,43,0.8),transparent)"}}/>
          <div style={{position:"absolute",top:-40,right:-40,width:200,height:200,borderRadius:"50%",background:"rgba(232,114,12,0.05)",filter:"blur(50px)",pointerEvents:"none"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px 10px",position:"relative"}}>
            <div>
              <div style={{fontSize:18,fontWeight:900,color:"#fff",letterSpacing:"-0.01em",textTransform:"uppercase"}}>TF College Group</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:2,letterSpacing:"0.04em"}}>{coachRole==="mcastles"?"MCastles 🍑":coachRole==="kevin"?"Kevin":"Coach Ant"} · {dayName} · <span style={{color:isClassDay?"#E8720C":"rgba(255,255,255,0.2)"}}>{isClassDay?"Class day":"No class"}</span></div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.25)",marginBottom:2}}>{athletes.filter(a=>a.status==="active").length} athletes</div>
              <button onClick={()=>setAuthed(false)} style={{fontSize:10,color:"rgba(255,255,255,0.2)",background:"transparent",border:"none",cursor:"pointer",fontFamily:"Georgia, serif",letterSpacing:"0.04em"}}>Sign out</button>
            </div>
          </div>
        </div>

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

            {tab==="habits"&&<CoachHabitsTab athletes={athletes}/>}

            {tab==="callouts"&&<CalloutsTab/>}
          </ErrorBoundary>
        </div>
        {/* ── SIDE TAB NAV (drawer) ── */}
        {(()=>{
            const ICON_MAP={"overview":"barChart","teams":"grid","roster":"users","attendance":"calendar","accountability":"checkSquare","inbox":"inbox","leaderboard":"trophy","goals":"target","fellowship":"pray","mindset":"compass","culture":"flame","prayers":"heart","weights":"scale","photos":"camera","engagement":"megaphone","qr":"smartphone","ironroom":"barbell","injuries":"alertTriangle","habits":"droplet","callouts":"zap","anvil":"anvil","mcastles-post":"crown"};
            const ICON_COLORS={"overview":"#FF7A2F","teams":"#60A8D0","roster":"#8CB4D5","attendance":"#7B6EE8","accountability":"#3A9E5A","anvil":"#F0C040","inbox":"#B56EE8","leaderboard":"#FFD700","goals":"#44D9B0","fellowship":"#A080D0","mindset":"#4DC8F5","culture":"#E8720C","prayers":"#FF80A8","weights":"#C8D040","photos":"#50D0B8","engagement":"#FF5A9D","qr":"#80C0D8","mcastles-post":"#D060C0","ironroom":"#E05555","injuries":"#FF8060","habits":"#20BEA8","callouts":"#FFC040"};
            const SECTIONS=[
              {label:"Overview",ids:["overview","roster","teams","attendance"]},
              {label:"Accountability",ids:["accountability","inbox","leaderboard","anvil"]},
              {label:"Culture & Faith",ids:["culture","fellowship","prayers","mindset"]},
              {label:"Tools",ids:["engagement","qr","goals","weights","ironroom"]},
              {label:"More",ids:["photos","injuries","habits","callouts","mcastles-post"]},
            ].map(s=>({...s,ids:s.ids.filter(id=>TABS.find(t=>t.id===id))})).filter(s=>s.ids.length>0);
            const renderIcon=(id,size,active)=>{const n=ICON_MAP[id];const col=ICON_COLORS[id]||"#aaa";return n?<span style={{display:"flex",alignItems:"center",opacity:active?1:0.75}}><Icon name={n} size={size} color={col}/></span>:<span style={{fontSize:size}}>{col}</span>;};
            const current=TABS.find(t=>t.id===tab);
            const curCol=ICON_COLORS[tab]||"#E8720C";
            return(
              <>
                <style>{`@keyframes tfDrawerIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
                {/* Floating "you are here" + menu button */}
                <button onClick={()=>setShowTabPicker(true)} style={{position:"fixed",bottom:18,left:16,zIndex:1000,display:"flex",alignItems:"center",gap:9,padding:"10px 16px 10px 12px",borderRadius:26,border:"1px solid rgba(255,255,255,0.15)",background:"rgba(8,8,14,0.9)",backdropFilter:"blur(40px) saturate(200%)",WebkitBackdropFilter:"blur(40px) saturate(200%)",boxShadow:"0 12px 40px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.12)",cursor:"pointer",fontFamily:"Georgia,serif",maxWidth:"calc(100% - 32px)"}}>
                  <Icon name="menu" size={20} color="#fff"/>
                  <span style={{width:22,height:22,borderRadius:7,background:curCol+"22",border:"1px solid "+curCol+"55",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{renderIcon(tab,14,true)}</span>
                  <span style={{fontSize:13,fontWeight:700,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{current?.label||"Menu"}</span>
                </button>

                {/* Left slide-in tab drawer */}
                {showTabPicker&&(
                  <div onClick={()=>setShowTabPicker(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.62)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",zIndex:9999,display:"flex"}}>
                    <div onClick={e=>e.stopPropagation()} style={{width:"min(84vw,300px)",height:"100%",overflowY:"auto",background:"rgba(10,10,18,0.98)",backdropFilter:"blur(48px) saturate(200%)",WebkitBackdropFilter:"blur(48px) saturate(200%)",borderRight:"1px solid rgba(255,255,255,0.12)",boxShadow:"24px 0 60px rgba(0,0,0,0.7)",paddingBottom:40,animation:"tfDrawerIn 0.26s cubic-bezier(0.22,1,0.36,1)",WebkitOverflowScrolling:"touch"}}>
                      <div style={{position:"sticky",top:0,background:"rgba(10,10,18,0.98)",padding:"18px 16px 12px",zIndex:1,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"0.5px solid rgba(255,255,255,0.08)"}}>
                        <div style={{fontSize:17,fontWeight:900,color:"#fff",letterSpacing:"-0.01em"}}>Menu</div>
                        <button onClick={()=>setShowTabPicker(false)} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.55)",fontSize:14,cursor:"pointer",width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>✕</button>
                      </div>
                      {SECTIONS.map(section=>(
                        <div key={section.label} style={{marginTop:6}}>
                          <div style={{fontSize:10,color:"rgba(255,255,255,0.28)",textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:700,padding:"12px 18px 6px"}}>{section.label}</div>
                          {section.ids.map(id=>{
                            const t=TABS.find(x=>x.id===id);
                            if(!t)return null;
                            const col=ICON_COLORS[id]||"#aaa";
                            const active=tab===id;
                            return(
                              <button key={id} onClick={()=>{slideDirRef.current=0;setTab(id);setShowTabPicker(false);}}
                                style={{width:"100%",display:"flex",alignItems:"center",gap:13,padding:"12px 18px",background:active?col+"1f":"transparent",borderLeft:"3px solid "+(active?col:"transparent"),borderTop:"none",borderRight:"none",borderBottom:"none",cursor:"pointer",fontFamily:"Georgia,serif",textAlign:"left",transition:"background 0.12s"}}>
                                <span style={{width:24,height:24,borderRadius:8,background:active?col+"22":"rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{renderIcon(id,17,active)}</span>
                                <span style={{fontSize:14.5,fontWeight:active?800:500,color:active?col:"rgba(255,255,255,0.72)",letterSpacing:active?"0.01em":"0"}}>{t.label}</span>
                                {active&&<span style={{marginLeft:"auto",width:7,height:7,borderRadius:"50%",background:col,boxShadow:"0 0 8px "+col,flexShrink:0}}/>}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
      </div>
      {modalAth&&(
        <div style={{position:"fixed",inset:0,zIndex:9000,background:"rgba(0,0,0,0.85)"}} onClick={()=>{setModalAth(null);setModalData(null);}}>
          <div onClick={e=>e.stopPropagation()} style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"#0e0e0e",borderRadius:"24px 24px 0 0",maxHeight:"90vh",overflowY:"auto",border:"1px solid #1e1e1e",borderBottom:"none",fontFamily:"Georgia,serif"}}>
            <div style={{width:40,height:4,borderRadius:2,background:"#333",margin:"12px auto 0"}}/>
            <div style={{padding:"16px 20px 14px",borderBottom:"0.5px solid #1a1a1a",display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:52,height:52,borderRadius:"50%",background:modalAth.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:"#fff",flexShrink:0,overflow:"hidden",border:"2px solid "+(modalAth.role==="forge"?RED:STEEL)+"55"}}>
                {modalAth.photo_url?<img src={modalAth.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:modalAth.name[0]}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:18,fontWeight:900,color:"#fff"}}>{modalAth.name}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:3}}>
                  {modalAth.sport&&<span style={{fontSize:10,color:"#666"}}>{modalAth.sport}</span>}
                  <span style={{fontSize:10,color:modalAth.role==="forge"?RED:STEEL,fontWeight:700,textTransform:"uppercase"}}>{modalAth.role||"iron"}</span>
                  {modalAth.status==="sleeping"&&<span style={{fontSize:10,color:"#666"}}>· sleeping</span>}
                </div>
              </div>
              <button onClick={()=>{setModalAth(null);setModalData(null);}} style={{background:"transparent",border:"none",color:"#444",fontSize:20,cursor:"pointer",padding:"4px"}}>✕</button>
            </div>
            {modalLoading&&<div style={{textAlign:"center",padding:"3rem",color:"#555",fontSize:13}}>Loading...</div>}
            {modalData&&(()=>{
              const{att,lbRow,msgs,wt,anv}=modalData;
              const streak=lbRow?.current_streak||0;
              const early=lbRow?.early_count||0;
              const best=lbRow?.best_streak||0;
              const lastAtt=att.slice(0,8);
              return(
                <div style={{padding:"16px 20px 40px"}}>
                  <div style={{display:"flex",gap:8,marginBottom:16}}>
                    {[{label:"Streak",val:streak,color:GREEN,icon:"🔥"},{label:"Best",val:best,color:GOLD,icon:"⭐"},{label:"Early",val:early,color:"#ddd",icon:"⏰"},{label:"Late",val:lbRow?.late_count||0,color:RED,icon:"⚠"}].map(s=>(
                      <div key={s.label} style={{flex:1,background:"#111",borderRadius:10,padding:"8px",textAlign:"center",border:"0.5px solid #1e1e1e"}}>
                        <div style={{fontSize:8,marginBottom:2}}>{s.icon}</div>
                        <div style={{fontSize:20,fontWeight:900,color:s.color}}>{s.val}</div>
                        <div style={{fontSize:8,color:"#555",textTransform:"uppercase",letterSpacing:"0.06em"}}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {lastAtt.length>0&&(
                    <div style={{marginBottom:16}}>
                      <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Recent attendance</div>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                        {lastAtt.map((r,i)=>(
                          <div key={i} style={{textAlign:"center"}}>
                            <div style={{width:28,height:28,borderRadius:8,background:r.status==="early"?GREEN+"22":r.status==="late"?"#2a1500":"#1a1a1a",border:"0.5px solid "+(r.status==="early"?GREEN:r.status==="late"?GOLD:"#2a2a2a"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:10}}>{r.status==="early"?"✓":r.status==="late"?"↓":"?"}</div>
                            <div style={{fontSize:7,color:"#444",marginTop:2,whiteSpace:"nowrap"}}>{r.date?.slice(5)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(modalAth.athletic_goal||modalAth.character_goal)&&(
                    <div style={{marginBottom:16}}>
                      <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Goals</div>
                      {modalAth.athletic_goal&&<div style={{background:"#111",borderRadius:10,padding:"10px 12px",marginBottom:6,borderLeft:"3px solid "+GREEN}}><div style={{fontSize:9,color:GREEN,marginBottom:3,fontWeight:700}}>ATHLETIC</div><div style={{fontSize:12,color:"#ccc"}}>{modalAth.athletic_goal}</div></div>}
                      {modalAth.character_goal&&<div style={{background:"#111",borderRadius:10,padding:"10px 12px",borderLeft:"3px solid "+PUR}}><div style={{fontSize:9,color:PUR,marginBottom:3,fontWeight:700}}>CHARACTER</div><div style={{fontSize:12,color:"#ccc"}}>{modalAth.character_goal}</div></div>}
                    </div>
                  )}
                  {msgs.filter(m=>!m.done).length>0&&(
                    <div style={{marginBottom:16}}>
                      <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Recent messages</div>
                      {msgs.filter(m=>!m.done).slice(0,3).map((m,i)=>{
                        const typeColor=m.type==="injury"?RED:m.type==="prayer"?GREEN:PUR;
                        return<div key={i} style={{background:"#111",borderRadius:10,padding:"10px 12px",marginBottom:6,borderLeft:"3px solid "+typeColor}}><div style={{fontSize:9,color:typeColor,marginBottom:3,fontWeight:700,textTransform:"uppercase"}}>{m.type}</div><div style={{fontSize:12,color:"#ccc",fontStyle:"italic"}}>"{m.message}"</div></div>;
                      })}
                    </div>
                  )}
                  {wt.length>0&&(
                    <div style={{marginBottom:16}}>
                      <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Weight log</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        {wt.map((w,i)=>(
                          <div key={i} style={{background:"#111",borderRadius:8,padding:"6px 10px",border:"0.5px solid #1e1e1e"}}>
                            <div style={{fontSize:13,fontWeight:700,color:"#ddd"}}>{w.weight}<span style={{fontSize:10,color:"#555"}}>lb</span></div>
                            <div style={{fontSize:9,color:"#444"}}>{w.date?.slice(5)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {anv.length>0&&(
                    <div>
                      <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>⚒ Anvil awards ({anv.length})</div>
                      {anv.map((a,i)=><div key={i} style={{background:"#1f1700",borderRadius:8,padding:"8px 12px",marginBottom:4,border:"0.5px solid "+GOLD+"33",display:"flex",justifyContent:"space-between"}}><span style={{fontSize:12,color:GOLD}}>{a.type==="group"?"Group":"Individual"}</span><span style={{fontSize:11,color:"#666"}}>{a.date_awarded}</span></div>)}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}

function InboxItem({item,color,bg,type,onReply,onGenerate,genLoading,loadKey,onArchive,onPriority,athletes,isNew}){
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
    <div className={isNew?"tf-pulse-glow":""} style={{padding:isNew?"12px":"12px 0",margin:isNew?"0 -4px 4px":0,borderRadius:isNew?12:0,borderBottom:isNew?"none":"0.5px solid #1e1e1e",background:isNew?color+"0d":"transparent",opacity:item.archived?0.5:1}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
        <div style={{position:"relative",flexShrink:0}}>
          {isNew&&<div style={{position:"absolute",top:-2,right:-2,width:9,height:9,borderRadius:"50%",background:color,border:"2px solid #0d0d0d",zIndex:2}}/>}
          <div style={{width:34,height:34,borderRadius:"50%",background:ath?.role==="forge"?RED:STEEL,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:500,color:"#fff"}}>
            {ath?.photo_url?<img src={ath.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(item.athletes?.name||"?")[0]}
          </div>
        </div>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:13,fontWeight:600,color}}>{item.anonymous?"Anonymous":item.athletes?.name}</span>
            {isNew&&<span style={{fontSize:8.5,background:color,color:"#fff",padding:"1px 6px",borderRadius:4,fontWeight:800,letterSpacing:"0.06em"}}>NEW</span>}
            {item.priority&&<span style={{fontSize:9,background:RED,color:"#fff",padding:"1px 5px",borderRadius:3,fontWeight:600}}>URGENT</span>}
            {item.reply_sent&&<span style={{fontSize:10,color:GREEN}}>✓ Replied</span>}
          </div>
          <span style={{fontSize:11,color:"#555"}}>{new Date(item.created_at).toLocaleDateString()}</span>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>onPriority&&onPriority(item)} title="Mark urgent" style={{background:"transparent",border:"none",fontSize:14,cursor:"pointer",opacity:item.priority?1:0.3}}>🚨</button>
          <button onClick={()=>onArchive&&onArchive(item)} title="Archive" style={{background:"transparent",border:"none",fontSize:14,cursor:"pointer",opacity:0.5}}>📁</button>
        </div>
      </div>
      <div style={{fontSize:13,color:"#bbb",marginBottom:8,padding:"8px 10px",background:bg,borderRadius:8,borderLeft:"3px solid "+color,fontStyle:"italic"}}>"{item.message}"</div>
      {item.reply&&(
        <div style={{marginBottom:8}}>
          <div onClick={()=>setShowReply(!showReply)} style={{fontSize:11,color:GREEN,cursor:"pointer",marginBottom:4}}>
            {showReply?"▼ Hide reply":"▶ Show your reply"}
          </div>
          {showReply&&(
            <div style={{fontSize:12,color:"#aaa",padding:"6px 10px",background:"#0d1a10",borderRadius:8,borderLeft:"3px solid "+GREEN,fontStyle:"italic"}}>
              "{item.reply}"
            </div>
          )}
        </div>
      )}
      {!item.archived&&(
        <>
          <textarea value={reply} onChange={e=>setReply(e.target.value)} placeholder="Write a reply..." style={{width:"100%",minHeight:50,padding:"6px",fontSize:12,border:"0.5px solid #2a2a2a",borderRadius:8,background:"#111",color:"#ddd",fontFamily:"Georgia,serif",resize:"vertical",boxSizing:"border-box",marginBottom:6}}/>
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
