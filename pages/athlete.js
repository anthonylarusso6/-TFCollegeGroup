import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { passkeyAvailable, passkeySignIn, passkeyRegister, rememberPasskey, isCancel, passkeyErrorText } from "../lib/passkey";
// useLayoutEffect warns during SSR; fall back to useEffect on the server.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
import { BG, PUR, RED, GREEN, GOLD, STEEL, ORANGE, ATHLETE_SAFE_COLS } from "../lib/constants";
import { getTier, BRACELETS } from "../lib/teams";
import { nowEST } from "../lib/dates";
import { ErrorBoundary } from "../components/ErrorBoundary";
import WeightTracker from "../components/WeightTracker";
import AthleteLeaderboard from "../components/AthleteLeaderboard";
import PrayerWall from "../components/PrayerWall";
import BraceletWall from "../components/BraceletWall";
import AnvilHistory from "../components/AnvilHistory";
import VerseOfDay from "../components/VerseOfDay";
import StretchingTab from "../components/StretchingTab";
import PRLog from "../components/PRLog";
import AttendanceTab from "../components/AttendanceTab";
import NotesTab from "../components/NotesTab";
import DailyWord from "../components/DailyWord";
import ClassCountdown from "../components/ClassCountdown";
import Goals from "../components/Goals";
import GroupPhotos from "../components/GroupPhotos";
import AchievementBadges from "../components/AchievementBadges";
import MCastlesTab from "../components/MCastlesTab";
import AthleteEventsTab from "../components/AthleteEventsTab";
import SurpriseTab from "../components/SurpriseTab";
import Achievements from "../components/Achievements";
import SeasonRecap from "../components/SeasonRecap";
import TeamPRFeed from "../components/TeamPRFeed";
import MyCalloutsTab from "../components/MyCalloutsTab";
import InjuryBodyMap from "../components/InjuryBodyMap";
import HabitsTab from "../components/HabitsTab";
import Icon from "../components/Icon";
import { hTap, hSuccess, hError, hCelebrate } from "../lib/haptics";

import Head from "next/head";
import { supabase } from "../lib/supabase";
import { ensurePushSync } from "../lib/push";
import { authApi, setSession, loadSavedSession, clearCurrent, authErrorText } from "../lib/session";
import { loadSeason, isBeforeSeason, fmtFirstClass } from "../lib/season";
import { setMood } from "../lib/ambient";

// What this device calls its biometric sign-in.
function bioLabel(){const ua=(typeof navigator!=="undefined"&&navigator.userAgent)||"";return/iPhone|iPad|iPod/.test(ua)?"Face ID":/Mac/.test(ua)?"Touch ID":/Android/.test(ua)?"fingerprint":"Face ID";}
const LC=["#534AB7","#0F6E56","#854F0B","#993556"];
const LB=["#EEEDFE","#E1F5EE","#FAEEDA","#FBEAF0"];

const CUTOFFS={Mon:{h:9,m:0},Tue:{h:9,m:30},Thu:{h:9,m:30},Fri:{h:9,m:0}};
const CLASS_DAYS=["Mon","Tue","Thu","Fri"];
const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const TIER_COLORS={
  1:{bg:"#EEEDFE",border:"#534AB7",color:"#3C3489",label:"Tier 1"},
  2:{bg:"#E1F5EE",border:"#0F6E56",color:"#085041",label:"Tier 2"},
  3:{bg:"#FAEEDA",border:"#854F0B",color:"#633806",label:"Tier 3"},
};

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
  const[athHasPin,setAthHasPin]=useState(null); // null = checking, from /api/auth status
  const[pinBusy,setPinBusy]=useState(false);
  const[bioAvail,setBioAvail]=useState(false);
  const[bioCredId,setBioCredId]=useState(null);
  const[bioDeclined,setBioDeclined]=useState(false);
  const[showBioOffer,setShowBioOffer]=useState(false);
  const[bioMsg,setBioMsg]=useState(""); // Face ID problem to show the athlete (empty = none)
  const[pendingNav,setPendingNav]=useState(null);
  const[bioRegistering,setBioRegistering]=useState(false);
  const[bioRegResult,setBioRegResult]=useState(null);
  const[showTabPicker,setShowTabPicker]=useState(false);
  const[themeMode,setThemeMode]=useState("dark");
  useEffect(()=>{try{setThemeMode(localStorage.getItem("tf_theme")==="light"?"light":"dark");}catch(e){}},[]);
  const toggleTheme=()=>setThemeMode(prev=>{const next=prev==="dark"?"light":"dark";try{localStorage.setItem("tf_theme",next);}catch(e){}if(typeof document!=="undefined")document.documentElement.setAttribute("data-theme",next==="light"?"light":"");return next;});
  const isLight=themeMode==="light";
  const[pinnedTabs,setPinnedTabs]=useState(["prs","attendance","weight","callouts"]);
  const[editingPins,setEditingPins]=useState(false);
  const[navDragId,setNavDragId]=useState(null);
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
  const[gridDragId,setGridDragId]=useState(null);
  const gridDragElemRef=useRef(null);
  const gridLongPressRef=useRef(null);
  const gridLastOverId=useRef(null);
  const[checkinInfo,setCheckinInfo]=useState(null);
  const[postCheckinStep,setPostCheckinStep]=useState(null); // null | "weight" | "habits" — guided post-check-in flow
  const[tab,setTab]=useState("profile");
  const[loading,setLoading]=useState(true);
  const[feedbackText,setFeedbackText]=useState("");
  const[feedbackSent,setFeedbackSent]=useState(false);
  const[prayerText,setPrayerText]=useState("");
  const[prayerSent,setPrayerSent]=useState(false);
  const[injuryOpen,setInjuryOpen]=useState(false);
  const[injuryText,setInjuryText]=useState("");
  const[injurySent,setInjurySent]=useState(false);
  const[painLevel,setPainLevel]=useState(0);
  const[attendance,setAttendance]=useState([]);
  const[streak,setStreak]=useState(0);
  const[athleteLb,setAthleteLb]=useState(null);
  const[milestone,setMilestone]=useState(null);
  const[myVote,setMyVote]=useState(null);
  const[groupmeLink,setGroupmeLink]=useState("https://groupme.com/join_group/111967377/1JobSG7L");
  const[weightLoggedToday,setWeightLoggedToday]=useState(null);
  const[habitsDoneToday,setHabitsDoneToday]=useState(null);
  // Profile editing
  const[editOpen,setEditOpen]=useState(false);
  const[editName,setEditName]=useState("");
  const[editSport,setEditSport]=useState("");
  const[editCollege,setEditCollege]=useState("");
  const[editYear,setEditYear]=useState("");
  const[editPin,setEditPin]=useState("");
  const[editPinConfirm,setEditPinConfirm]=useState("");
  const[editSaving,setEditSaving]=useState(false);
  const[editMsg,setEditMsg]=useState("");
  const[editPhotoBusy,setEditPhotoBusy]=useState(false);
  // Self sign-up
  const[signupName,setSignupName]=useState("");
  const[signupGender,setSignupGender]=useState("male");
  const[signupSport,setSignupSport]=useState("");
  const[signupCollege,setSignupCollege]=useState("");
  const[signupYear,setSignupYear]=useState("");
  const[signupPin,setSignupPin]=useState("");
  const[signupPinConfirm,setSignupPinConfirm]=useState("");
  const[signupError,setSignupError]=useState("");
  const[signupSaving,setSignupSaving]=useState(false);
  const[notifCard,setNotifCard]=useState("unknown"); // unknown | idle | enabled | denied | unsupported | ios-browser
  const[notifLoading,setNotifLoading]=useState(false);
  const pollRef=useRef(null);
  const athleteIdRef=useRef(null);
  const touchStartRef=useRef(null);
  const slideDirRef=useRef(0);
  // Remember scroll position per tab so switching away and back returns you
  // to where you were instead of jumping to the top (home/profile view).
  const tabScrollRef=useRef({});
  // The All Tabs drawer remounts each time it opens — remember its scroll so
  // it reopens where you left it instead of back at the top.
  const drawerScrollRef=useRef(null);
  const drawerRef=(el)=>{
    if(!el||el.dataset.restored)return;
    el.dataset.restored="1";
    if(drawerScrollRef.current!=null){el.scrollTop=drawerScrollRef.current;return;}
    // First open: bring the current tab into view
    const on=el.querySelector('[data-active="1"]');
    if(on)el.scrollTop=Math.max(0,on.offsetTop-el.clientHeight/2);
  };
  useEffect(()=>{
    if(screen!=="profile")return;
    const onScroll=()=>{tabScrollRef.current[tab]=window.scrollY;};
    window.addEventListener("scroll",onScroll,{passive:true});
    return()=>window.removeEventListener("scroll",onScroll);
  },[tab,screen]);
  useIsoLayoutEffect(()=>{
    if(screen!=="profile")return;
    window.scrollTo(0,tabScrollRef.current[tab]||0);
    const r1=requestAnimationFrame(()=>window.scrollTo(0,tabScrollRef.current[tab]||0));
    const t1=setTimeout(()=>window.scrollTo(0,tabScrollRef.current[tab]||0),60);
    return()=>{cancelAnimationFrame(r1);clearTimeout(t1);};
  },[tab,screen]);

  useEffect(()=>{loadData();},[]);

  const loadData=async()=>{
    setLoading(true);
    try{
      const{data:aths,error:athErr}=await supabase.from("athletes").select(ATHLETE_SAFE_COLS).in("status",["active","sleeping"]).order("name");
      if(athErr)console.error("Athletes error:",athErr);
      if(aths&&aths.length>0){
        setAthletes(aths);
      }else{
        const{data:allAths}=await supabase.from("athletes").select(ATHLETE_SAFE_COLS).order("name");
        if(allAths)setAthletes(allAths.filter(a=>a.status!=="archived"));
      }
    }catch(e){console.error("Athletes fetch failed:",e);}
    try{
      const{data:ann}=await supabase.from("announcements").select("*").eq("active",true).eq("type","general").order("created_at",{ascending:false}).limit(1);
      if(ann&&ann.length>0)setAnnouncement(ann[0]);
    }catch(e){}
    try{
      const{data:anv}=await supabase.from("anvil").select("athlete_name,date_awarded,note").order("created_at",{ascending:false}).limit(1);
      if(anv&&anv.length>0)setAnvilWinner(anv[0]);
    }catch(e){}
    try{
      const{data:gm}=await supabase.from("announcements").select("day").eq("type","groupme_link").order("created_at",{ascending:false}).limit(1).maybeSingle();
      if(gm?.day)setGroupmeLink(gm.day);
    }catch(e){}
    setLoading(false);
  };

  // Keep ref in sync with state
  useEffect(()=>{athleteIdRef.current=selectedAthlete?.id;},[selectedAthlete]);

  useEffect(()=>{passkeyAvailable().then(setBioAvail);},[]);
  // Check biometric availability and stored credential when athlete is selected
  useEffect(()=>{
    if(!selectedAthlete?.id)return;
    setBioCredId(null);setBioDeclined(false);setShowBioOffer(false);
    (async()=>{
      try{
        if(window.PublicKeyCredential){
          const avail=await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setBioAvail(avail);
        }
      }catch(e){}
      try{
        const raw=localStorage.getItem("tf_bio_"+selectedAthlete.id);
        setBioCredId(raw?JSON.parse(raw).credId:null);
      }catch(e){setBioCredId(null);}
      try{
        setBioDeclined(!!localStorage.getItem("tf_bio_declined_"+selectedAthlete.id));
      }catch(e){}
    })();
  },[selectedAthlete?.id]);

  // Face ID sign-in. `expected` is the athlete whose name was tapped, or null
  // from the roster's "Sign in with Face ID" (whoever the passkey belongs to).
  // Must be called straight from a tap: passkeySignIn() runs before any await.
  const authenticateWithBiometric=async(expected)=>{
    const exp=expected===undefined?selectedAthlete:expected;
    let res;
    try{res=await passkeySignIn();}
    catch(e){if(!isCancel(e))setBioMsg(passkeyErrorText(e));return false;}
    setBioMsg("");
    // Who is this passkey for? Registered with user.id = athlete id.
    let id=res.userHandle;
    if(!id){
      try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);
        if(k&&k.startsWith("tf_bio_")&&!k.startsWith("tf_bio_declined_")&&!k.startsWith("tf_bio_coach_")){
          const v=JSON.parse(localStorage.getItem(k)||"{}");if(v.credId===res.credId){id=k.slice(7);break;}}}}catch(e){}
    }
    if(!id&&exp)id=exp.id;
    let athlete=(athletes||[]).find(x=>String(x.id)===String(id))||(exp&&String(exp.id)===String(id)?exp:null);
    if(!athlete&&id){try{const{data}=await supabase.from("athletes").select(ATHLETE_SAFE_COLS).eq("id",id).maybeSingle();if(data&&data.status!=="archived")athlete=data;}catch(e){}}
    if(!athlete){setBioMsg("That Face ID isn't linked to anyone on the roster. Tap your name and use your PIN.");return false;}
    if(exp&&String(exp.id)!==String(athlete.id)){setBioMsg("That Face ID is saved for "+(athlete.name||"someone else").split(" ")[0]+". Use your PIN, then turn on Face ID in your profile.");return false;}
    // Repair this browser's hint (storage may have been cleared) so the UI shows Face ID as on
    rememberPasskey("tf_bio_"+athlete.id,res.credId);
    setBioCredId(res.credId);
    if(!exp)primeAthlete(athlete);
    // Face ID unlocks the sign-in saved on this phone. No saved sign-in yet
    // (first time since the update, or it expired after 30 days): PIN once.
    if(!loadSavedSession("athlete_"+athlete.id)){
      setScreen("login");
      setBioMsg("Face ID works. Enter your PIN once on this phone to finish signing in.");
      return false;
    }
    const info=await doCheckin(athlete);
    setCheckinInfo(info);setPin("");setPinError("");
    if(info){setScreen("checkin");if(info.milestoneHit)setMilestone(info.milestoneHit);}
    else setScreen("profile");
    return true;
  };

  // Turn on Face ID for the signed-in athlete. Returns "ok" | "cancel" | "error".
  const registerBiometric=async(fromProfile=false)=>{
    let status="ok";
    try{
      const credId=await passkeyRegister({userId:selectedAthlete.id,name:selectedAthlete.name});
      rememberPasskey("tf_bio_"+selectedAthlete.id,credId);
      try{localStorage.removeItem("tf_bio_declined_"+selectedAthlete.id);}catch(e){}
      setBioCredId(credId);setBioMsg("");
    }catch(e){
      status=isCancel(e)?"cancel":"error";
      if(status==="error")setBioMsg(passkeyErrorText(e,"turn on"));
    }
    if(fromProfile!==true&&status!=="error"){
      const nav=pendingNav;setPendingNav(null);setShowBioOffer(false);
      if(nav?.screen==="checkin"){setScreen("checkin");if(nav.milestone)setMilestone(nav.milestone);}
      else setScreen("profile");
    }
    return status;
  };

  // Check if athlete already logged weight today (only matters on Mon/Fri weigh-in days)
  useEffect(()=>{
    if(!selectedAthlete)return;
    const est=nowEST();
    const dow=est.getDay();
    if(dow!==1&&dow!==5){setWeightLoggedToday(true);return;}
    const today=est.getFullYear()+"-"+String(est.getMonth()+1).padStart(2,"0")+"-"+String(est.getDate()).padStart(2,"0");
    (async()=>{
      try{
        const{data}=await supabase.from("weight_log").select("id").eq("athlete_id",selectedAthlete.id).eq("date",today).maybeSingle();
        setWeightLoggedToday(!!data);
      }catch(e){setWeightLoggedToday(true);}
    })();
  },[selectedAthlete]);

  // Check if athlete completed all three habits today (drives the home nudge)
  useEffect(()=>{
    if(!selectedAthlete)return;
    const est=nowEST();
    const today=est.getFullYear()+"-"+String(est.getMonth()+1).padStart(2,"0")+"-"+String(est.getDate()).padStart(2,"0");
    (async()=>{
      try{
        const{data}=await supabase.from("announcements").select("message").eq("type","habit_log").eq("day",String(selectedAthlete.id)).eq("week_label",today).maybeSingle();
        let done=false;
        if(data?.message){try{const p=JSON.parse(data.message);done=p.water===true&&p.nutrition===true&&p.sleep!=null;}catch(e){}}
        setHabitsDoneToday(done);
      }catch(e){setHabitsDoneToday(true);}
    })();
  },[selectedAthlete]);

  // Season the coach set — before its first class, don't tell athletes "class today"
  const[seasonInfo,setSeasonInfo]=useState(null);
  useEffect(()=>{loadSeason().then(setSeasonInfo).catch(()=>{});},[]);

  // Room light: tint the living background to the current screen / tab / check-in result
  useEffect(()=>{
    const TAB_MOOD={prs:"iron",habits:"habits",weight:"weight",stretching:"stretch",goals:"goals",body:"body",
      verse:"faith",prayer:"faith",notes:"faith",bracelets:"faith",mygroup:"faith",private:"faith",mcastles:"faith",
      prfeed:"social",leaderboard:"social",anvil:"social",badges:"social",recap:"social",events:"social",
      callouts:"callouts",surprise:"celebrate"};
    if(screen==="checkin"){
      const ci=checkinInfo;
      setMood(!ci?"base":ci.already?"already":ci.status==="late"?"late":"early");
    }else if(screen==="profile")setMood(TAB_MOOD[tab]||"base");
    else setMood("base");
  },[screen,tab,checkinInfo]);

  // End the guided post-check-in flow the moment they navigate off weight/habits
  useEffect(()=>{
    if(postCheckinStep&&tab!=="weight"&&tab!=="habits")setPostCheckinStep(null);
  },[tab,postCheckinStep]);

  // Resize + upload a profile photo to Supabase storage, return the public URL
  const uploadAthletePhoto=(athleteId,file)=>new Promise((resolve,reject)=>{
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

  const openEditProfile=()=>{
    if(!selectedAthlete)return;
    setEditName(selectedAthlete.name||"");
    setEditSport(selectedAthlete.sport||"");
    setEditCollege(selectedAthlete.college||"");
    setEditYear(selectedAthlete.year||"");
    setEditPin("");setEditPinConfirm("");setEditMsg("");setEditOpen(true);
  };

  const onEditPhoto=async(file)=>{
    if(!file||!selectedAthlete)return;
    setEditPhotoBusy(true);setEditMsg("");
    try{
      const url=await uploadAthletePhoto(selectedAthlete.id,file);
      await supabase.from("athletes").update({photo_url:url}).eq("id",selectedAthlete.id);
      const updated={...selectedAthlete,photo_url:url};
      setSelectedAthlete(updated);
      setAthletes(prev=>prev.map(a=>a.id===updated.id?{...a,photo_url:url}:a));
    }catch(e){setEditMsg("Photo upload failed — try a smaller image.");}
    setEditPhotoBusy(false);
  };

  const saveProfile=async()=>{
    if(!selectedAthlete)return;
    setEditMsg("");
    const name=editName.trim();
    if(!name){setEditMsg("Name can't be empty.");return;}
    if(editPin&&!/^\d{4}$/.test(editPin)){setEditMsg("PIN must be exactly 4 digits.");return;}
    if(editPin&&editPin!==editPinConfirm){setEditMsg("PINs don't match.");return;}
    setEditSaving(true);
    const patch={name,sport:editSport.trim()};
    // Only touch college/year when there's a value (or the athlete already has one),
    // so profiles still save even before those columns are added to the table.
    if(editCollege.trim()||selectedAthlete.college!=null)patch.college=editCollege.trim();
    if(editYear||selectedAthlete.year!=null)patch.year=editYear;
    try{
      if(editPin){
        const r=await authApi({action:"change",newPin:editPin});
        if(!r.ok){setEditMsg(r.error==="signin_required"?"Sign out and back in, then change your PIN.":authErrorText(r,"athlete"));setEditSaving(false);return;}
      }
      const{error}=await supabase.from("athletes").update(patch).eq("id",selectedAthlete.id);
      if(error){setEditMsg(error.message);setEditSaving(false);return;}
      const updated={...selectedAthlete,...patch};
      setSelectedAthlete(updated);
      setAthletes(prev=>prev.map(a=>a.id===updated.id?{...a,...patch}:a));
      setEditSaving(false);setEditOpen(false);setEditPin("");setEditPinConfirm("");
    }catch(e){setEditMsg(e.message);setEditSaving(false);}
  };

  const createAccount=async()=>{
    setSignupError("");
    const name=signupName.trim();
    if(!name){setSignupError("Enter your name.");return;}
    if(!/^\d{4}$/.test(signupPin)){setSignupError("PIN must be exactly 4 digits.");return;}
    if(signupPin!==signupPinConfirm){setSignupError("PINs don't match.");return;}
    setSignupSaving(true);
    try{
      const{data:existing}=await supabase.from("athletes").select("id").ilike("name",name).maybeSingle();
      if(existing){setSignupError("That name's already on the roster — find it on the list to sign in.");setSignupSaving(false);return;}
      const signupPayload={name,sport:signupSport.trim(),gender:signupGender,role:"iron",status:"active"};
      if(signupCollege.trim())signupPayload.college=signupCollege.trim();
      if(signupYear)signupPayload.year=signupYear;
      const{data,error}=await supabase.from("athletes").insert(signupPayload).select(ATHLETE_SAFE_COLS).single();
      if(error){setSignupError(error.message);setSignupSaving(false);return;}
      // The PIN is set through the server so it never sits in a readable column.
      const pr=await authApi({action:"create",kind:"athlete",id:data.id,pin:signupPin});
      if(pr.token)setSession("athlete_"+data.id,pr.token);
      setAthletes(prev=>[...prev,data].sort((a,b)=>(a.name||"").localeCompare(b.name||"")));
      athleteIdRef.current=data.id;
      setSelectedAthlete(data);
      loadAttendance(data.id).catch(()=>{});
      setSignupName("");setSignupSport("");setSignupCollege("");setSignupYear("");setSignupPin("");setSignupPinConfirm("");setSignupGender("male");setSignupSaving(false);
      const info=await doCheckin(data);
      setCheckinInfo(info);
      if(info){setScreen("checkin");if(info.milestoneHit)setMilestone(info.milestoneHit);}
      else setScreen("profile");
    }catch(e){setSignupError(e.message);setSignupSaving(false);}
  };

  // Check push notification status when athlete profile loads
  useEffect(()=>{
    if(!selectedAthlete||typeof window==="undefined")return;
    (async()=>{
      if(!("Notification" in window)||!("serviceWorker" in navigator)){setNotifCard("unsupported");return;}
      // Detect iOS browser (not installed as PWA)
      const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent||"");
      const isStandalone=("standalone" in navigator&&navigator.standalone)||window.matchMedia("(display-mode: standalone)").matches;
      if(isIOS&&!isStandalone){setNotifCard("ios-browser");return;}
      const perm=Notification.permission;
      if(perm==="denied"){setNotifCard("denied");return;}
      if(perm==="granted"){
        // Repairs + re-saves this phone's subscription silently (no prompt).
        try{const sub=await ensurePushSync(selectedAthlete.id);if(sub){setNotifCard("enabled");return;}}catch(e){}
      }
      setNotifCard("idle");
    })();
  },[selectedAthlete]);


  const enableProfileNotif=async()=>{
    if(!selectedAthlete)return;
    setNotifLoading(true);
    try{
      const perm=await Notification.requestPermission();
      if(perm!=="granted"){setNotifCard("denied");setNotifLoading(false);return;}
      let reg=await navigator.serviceWorker.getRegistration();
      if(!reg)reg=await navigator.serviceWorker.register("/sw.js");
      const sub=await ensurePushSync(selectedAthlete.id);
      if(!sub)throw new Error("subscribe failed");
      setNotifCard("enabled");
    }catch(e){setNotifCard("denied");}
    setNotifLoading(false);
  };


  const loadAttendance=async(athleteId)=>{
    try{
      const{data}=await supabase.from("attendance").select("*").eq("athlete_id",athleteId).order("date",{ascending:false});
      if(data)setAttendance(data);
      let s=0;
      if(data){for(const rec of data){if(rec.status==="early")s++;else break;}}
      setStreak(s);
    }catch(e){}
    try{const{data:lbRow}=await supabase.from("leaderboard").select("*").eq("athlete_id",athleteId).maybeSingle();if(lbRow)setAthleteLb(lbRow);}catch(e){}
    try{
      const _vd=nowEST();
      const _ds=`${_vd.getFullYear()}-${String(_vd.getMonth()+1).padStart(2,'0')}-${String(_vd.getDate()).padStart(2,'0')}`;
      const{data:vt}=await supabase.from("announcements").select("message").eq("type","music_vote").eq("week_label",_ds).eq("day",athleteId).order("created_at",{ascending:false}).limit(1).maybeSingle();
      if(vt)setMyVote(vt.message);
    }catch(e){}
  };

  const submitVote=async(genre)=>{
    setMyVote(genre);
    const _d=nowEST();
    const dateStr=`${_d.getFullYear()}-${String(_d.getMonth()+1).padStart(2,'0')}-${String(_d.getDate()).padStart(2,'0')}`;
    try{
      await supabase.from("announcements").delete().eq("type","music_vote").eq("week_label",dateStr).eq("day",selectedAthlete.id);
      await supabase.from("announcements").insert({type:"music_vote",week_label:dateStr,message:genre,day:selectedAthlete.id,active:false});
    }catch(e){}
  };

  const STREAK_MILESTONES=[3,5,7,10,15,20];
  const EARLY_MILESTONES=[5,10,25,50];
  const MILESTONE_CONFIGS={
    streak:{
      3:{icon:"🔥",headline:"3-Day Streak",msg:"Three in a row. Iron is being forged.",color:GREEN},
      5:{icon:"⚡",headline:"5-Day Streak",msg:"Five straight. You're locked in.",color:GREEN},
      7:{icon:"💎",headline:"7-Day Streak",msg:"A full week. Leaders lead.",color:GREEN},
      10:{icon:"⚒️",headline:"10-Day Streak",msg:"Ten in a row. Anvil-level consistency.",color:GOLD},
      15:{icon:"🏆",headline:"15-Day Streak",msg:"Fifteen straight. You are elite.",color:GOLD},
      20:{icon:"👑",headline:"20-Day Streak",msg:"Twenty straight. Legend status.",color:GOLD},
    },
    early:{
      5:{icon:"⭐",headline:"5 Early Arrivals",msg:"Five times early. Keep setting the tone.",color:GREEN},
      10:{icon:"🌟",headline:"10 Early Arrivals",msg:"Ten early arrivals. Leaders lead by example.",color:GREEN},
      25:{icon:"🌠",headline:"25 Early Arrivals",msg:"25 times early. You live this.",color:GOLD},
    },
  };

  const doCheckin=async(athlete)=>{
    // Returning athlete: logging in puts them back on the active roster
    if(athlete.status&&athlete.status!=="active"){
      try{
        await supabase.from("athletes").update({status:"active"}).eq("id",athlete.id);
        setSelectedAthlete(prev=>prev&&prev.id===athlete.id?{...prev,status:"active"}:prev);
        setAthletes(prev=>prev.map(x=>x.id===athlete.id?{...x,status:"active"}:x));
      }catch(e){}
    }
    const now=new Date();
    const estTime=new Date(now.toLocaleString("en-US",{timeZone:"America/New_York"}));
    const timeStr=now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",timeZone:"America/New_York"});
    const today=DAYS[estTime.getDay()];
    if(!CLASS_DAYS.includes(today))return null;
    const cut=CUTOFFS[today]||{h:9,m:30};
    const late=estTime.getHours()>cut.h||(estTime.getHours()===cut.h&&estTime.getMinutes()>=cut.m);
    const status=late?"late":"early";
    const today_date=estTime.getFullYear()+"-"+String(estTime.getMonth()+1).padStart(2,"0")+"-"+String(estTime.getDate()).padStart(2,"0");
    // Fetch attendance + leaderboard in parallel — they're independent reads
    let existing,existErr,lb;
    {
      const[att,lbRes]=await Promise.all([
        supabase.from("attendance").select("*").eq("athlete_id",athlete.id).eq("date",today_date),
        supabase.from("leaderboard").select("*").eq("athlete_id",athlete.id),
      ]);
      existing=att.data;existErr=att.error;lb=lbRes.data;
    }
    if(existErr)console.error("Attendance check error:",existErr);
    if(existing&&existing.length>0){hTap();return{status:existing[0].status,time:existing[0].time_logged,already:true};}
    const{error:insertErr}=await supabase.from("attendance").insert({athlete_id:athlete.id,date:today_date,day:today,status,time_logged:timeStr});
    if(insertErr){console.error("Attendance insert error:",insertErr);hError();return{status,time:timeStr,error:insertErr.message};}
    if(status==="early")hSuccess();else hError();
    let milestoneHit=null;
    if(lb&&lb.length>0){
      const updates={};
      if(status==="early"){
        const oldStreak=lb[0].current_streak||0;
        const oldEarly=lb[0].early_count||0;
        updates.early_count=oldEarly+1;
        updates.current_streak=oldStreak+1;
        if(updates.current_streak>(lb[0].best_streak||0))updates.best_streak=updates.current_streak;
        if(STREAK_MILESTONES.includes(updates.current_streak)&&!STREAK_MILESTONES.includes(oldStreak)){
          milestoneHit=MILESTONE_CONFIGS.streak[updates.current_streak]||null;
        }
        if(!milestoneHit&&EARLY_MILESTONES.includes(updates.early_count)&&!EARLY_MILESTONES.includes(oldEarly)){
          milestoneHit=MILESTONE_CONFIGS.early[updates.early_count]||null;
        }
      }
      else{updates.late_count=(lb[0].late_count||0)+1;updates.current_streak=0;}
      await supabase.from("leaderboard").update(updates).eq("athlete_id",athlete.id);
    } else {
      if(status==="early"){
        if(STREAK_MILESTONES.includes(1))milestoneHit=MILESTONE_CONFIGS.streak[1]||null;
        if(!milestoneHit&&EARLY_MILESTONES.includes(1))milestoneHit=MILESTONE_CONFIGS.early[1]||null;
      }
      await supabase.from("leaderboard").insert({athlete_id:athlete.id,early_count:status==="early"?1:0,late_count:status==="late"?1:0,current_streak:status==="early"?1:0,best_streak:status==="early"?1:0});
    }
    if(milestoneHit)hCelebrate();
    return{status,time:timeStr,milestoneHit};
  };

  // Set up everything for a signed-in (or signing-in) athlete
  const primeAthlete=(a)=>{
    setSelectedAthlete(a);setBioMsg("");
    setPin("");setPinError("");setPinStep("enter");setPinConfirm("");
    clearCurrent();
    setAthHasPin(null);
    authApi({action:"status",kind:"athlete",id:a.id}).then(r=>{if(typeof r.hasPin==="boolean")setAthHasPin(r.hasPin);});
    setFeedbackText("");setFeedbackSent(false);
    setPrayerText("");setPrayerSent(false);
    setInjuryText("");setInjurySent(false);setInjuryOpen(false);
    setMyVote(null);
    setTab("profile");setEditingPins(false);slideDirRef.current=0;
    try{
      const s=localStorage.getItem("tf_pinned_"+a.id);
      let pins=s?JSON.parse(s):["prs","attendance","weight","callouts"];
      // One-time migration: make sure the new Callouts tab lands on the bottom nav for existing athletes
      const migKey="tf_pinmig_callouts_"+a.id;
      if(!localStorage.getItem(migKey)){
        if(!pins.includes("callouts"))pins=[...pins,"callouts"].slice(0,4);
        try{localStorage.setItem(migKey,"1");localStorage.setItem("tf_pinned_"+a.id,JSON.stringify(pins));}catch(e2){}
      }
      setPinnedTabs(pins);
    }catch(e){setPinnedTabs(["prs","attendance","weight","callouts"]);}
    const defaultOrder=["profile","mcastles","events","verse","notes","attendance","mygroup","anvil","weight","body","prs","prfeed","callouts","stretching","leaderboard","prayer","bracelets","photos","habits","private"];
    try{const storedOrder=localStorage.getItem("tf_more_order_"+a.id);const raw=storedOrder?JSON.parse(storedOrder):defaultOrder;const seen=new Set();const initOrder=raw.filter(id=>{if(seen.has(id))return false;seen.add(id);return true;});const newTabs=defaultOrder.filter(id=>!seen.has(id));const fullOrder=[...initOrder,...newTabs];setMoreOrder(fullOrder);moreOrderRef.current=fullOrder;}catch(e){setMoreOrder(defaultOrder);moreOrderRef.current=defaultOrder;}
    // Load supporting data in the background
    Promise.all([
      loadAttendance(a.id),
      (async()=>{try{const{data}=await supabase.from("athletes").select(ATHLETE_SAFE_COLS).eq("id",a.id).maybeSingle();if(data)setSelectedAthlete(data);}catch(e){}})(),
    ]).catch(()=>{});
  };

  const selectAthlete=async(a)=>{
    // Fire Face ID FIRST, synchronously within the tap gesture — no awaits before
    // navigator.credentials.get() so iOS keeps the user-activation and the prompt
    // appears instantly. Only when this phone has used Face ID for this athlete;
    // otherwise the PIN pad (with a Face ID button) is enough.
    let bioRaw=null;try{bioRaw=localStorage.getItem("tf_bio_"+a.id);}catch(e){}
    const bioPromise=bioRaw?authenticateWithBiometric(a):null;
    primeAthlete(a);
    // PIN pad is the base layer; a successful Face ID navigates away over the top.
    setScreen("login");
    if(bioPromise)bioPromise.catch(()=>{});
  };

  // PIN check happens on the server (/api/auth); the app never sees the PIN on file.
  const afterSignIn=async(a)=>{
    const info=await doCheckin(a);
    setCheckinInfo(info);setPin("");setPinError("");setPinStep("enter");setPinConfirm("");
    if(bioAvail&&!bioCredId&&!bioDeclined){
      setPendingNav({screen:info?"checkin":"profile",milestone:info?.milestoneHit||null});
      setShowBioOffer(true);
    }else{
      if(info){setScreen("checkin");if(info.milestoneHit)setMilestone(info.milestoneHit);}
      else setScreen("profile");
    }
  };
  const submitPin=async()=>{
    const a=selectedAthlete;
    if(pin.length<4||pinBusy||!a)return;
    const startOver=(msg)=>{setPinError(msg);setPin("");setPinStep("enter");setPinConfirm("");};
    setPinBusy(true);
    try{
      if(pinStep==="confirm"){
        if(pin!==pinConfirm){startOver("PINs don't match. Try again.");return;}
        const r=await authApi({action:"create",kind:"athlete",id:a.id,pin});
        if(r.token){setSession("athlete_"+a.id,r.token);setAthHasPin(true);setBioMsg("");await afterSignIn(a);}
        else{if(r.error==="already_set")setAthHasPin(true);startOver(authErrorText(r,"athlete"));}
        return;
      }
      const r=await authApi({action:"login",kind:"athlete",id:a.id,pin});
      if(r.token){setSession("athlete_"+a.id,r.token);setAthHasPin(true);setBioMsg("");await afterSignIn(a);}
      else if(r.needsCreate){setAthHasPin(false);setPinConfirm(pin);setPin("");setPinStep("confirm");setPinError("");}
      else{setPinError(authErrorText(r,"athlete"));setPin("");}
    }finally{setPinBusy(false);}
  };

  useEffect(()=>{if(pin.length===4)submitPin();},[pin]);
  // Leaving to the roster or sign-up drops the active sign-in (it stays saved for Face ID).
  useEffect(()=>{if(screen==="roster"||screen==="signup")clearCurrent();},[screen]);

  useEffect(()=>{
    if(screen==="profile"){
      // Poll the athlete row so group assignment updates automatically after the coach sets it
      pollRef.current=setInterval(async()=>{
        if(athleteIdRef.current){
          try{
            const{data}=await supabase.from("athletes").select(ATHLETE_SAFE_COLS).eq("id",athleteIdRef.current).maybeSingle();
            if(data)setSelectedAthlete(data);
          }catch(e){}
        }
      },5000);
      return()=>clearInterval(pollRef.current);
    }
    return()=>clearInterval(pollRef.current);
  },[screen,tab]);

  const sendFeedback=async()=>{
    if(!feedbackText.trim())return;
    try{
      const{error}=await supabase.from("inbox").insert({athlete_id:selectedAthlete.id,type:"message",message:feedbackText});
      if(error)throw error;
      setFeedbackSent(true);
    }catch(e){console.error("Feedback send:",e);}
  };

  const sendPrayer=async()=>{
    if(!prayerText.trim())return;
    try{
      const{error}=await supabase.from("inbox").insert({athlete_id:selectedAthlete.id,type:"prayer",message:prayerText});
      if(error)throw error;
      setPrayerSent(true);
    }catch(e){console.error("Prayer send:",e);}
  };

  const sendInjury=async()=>{
    if(!injuryText.trim()&&painLevel===0)return;
    const fullMsg=(painLevel>0?"Pain level: "+painLevel+"/10. ":"")+injuryText.trim();
    try{
      const{error:ue}=await supabase.from("athletes").update({injury:true,injury_note:fullMsg}).eq("id",selectedAthlete.id);
      if(ue)throw ue;
      const{error:ie}=await supabase.from("inbox").insert({athlete_id:selectedAthlete.id,type:"injury",message:fullMsg});
      if(ie)throw ie;
      setInjurySent(true);
    }catch(e){console.error("Injury send:",e);}
  };

  const bracelet=BRACELETS.find(b=>b.ref===selectedAthlete?.bracelet);
  const isForge=selectedAthlete?.role==="forge";

  if(loading)return(
    <div className="tfx lg"><div className="lg-loading"><img src="/icon.png" alt=""/><span className="tfx-eyebrow">Loading the roster…</span></div></div>
  );

  if(screen==="roster"){
    const q=search.trim().toLowerCase();
    const counts={active:athletes.filter(a=>a.status==="active").length,sleeping:athletes.filter(a=>a.status==="sleeping").length};
    const list=athletes.filter(a=>a.status===rosterTab&&(!q||(a.name||"").toLowerCase().includes(q)));
    return(
    <>
      <Head><title>TF College Group — Athlete</title></Head>
      <div className="tfx lg">
        <div className="lg-col is-top">
          <div className="lg-top">
            <a href="/" className="lg-brand"><img src="/icon.png" alt=""/><span>TF College Group</span></a>
            <a href="/coach" className="lg-link is-quiet">Coach sign in ›</a>
          </div>
          <div className="lg-head">
            <div className="tfx-eyebrow">Athletes</div>
            <h1>Check in</h1>
            <p>Tap your name to sign in.</p>
          </div>

          {/* One tap: works even if this phone forgot who was signed in */}
          {bioAvail&&(
            <button className="lg-faceid tfx-press" onClick={()=>{setBioMsg("");authenticateWithBiometric(null);}}>
              <Icon name="faceId" size={22} color="currentColor"/><span>Sign in with {bioLabel()}</span>
            </button>
          )}
          {bioMsg&&<div role="alert" className="lg-msg is-warn">{bioMsg}</div>}

          {announcement&&(
            <div className="tfx-card lg-note">
              <div className="tfx-eyebrow">This week</div>
              <p>{announcement.message}</p>
            </div>
          )}
          {anvilWinner&&(
            <div className="tfx-card lg-note is-row" style={{"--c":GOLD}}>
              <span className="lg-note-ic" aria-hidden="true">⚒</span>
              <div><div className="tfx-eyebrow">This week's Anvil</div><b>{anvilWinner.athlete_name}</b></div>
            </div>
          )}

          <div className="ir-seg" role="tablist" aria-label="Roster">
            {[{id:"active",label:"Active"},{id:"sleeping",label:"Sleeping"}].map(t=>(
              <button key={t.id} role="tab" aria-selected={rosterTab===t.id} className={rosterTab===t.id?"is-on":""} onClick={()=>setRosterTab(t.id)}>
                {t.label}<span className="lg-seg-n">{counts[t.id]}</span>
              </button>
            ))}
          </div>

          <div className="lg-search">
            <Icon name="search" size={16} color="currentColor"/>
            <input className="tfx-field" type="text" placeholder="Search your name" value={search} onChange={e=>setSearch(e.target.value)} autoComplete="off" aria-label="Search your name"/>
            {search&&<button className="lg-clear" onClick={()=>setSearch("")} aria-label="Clear search">✕</button>}
          </div>

          <div className="lg-list is-long">
            {list.map(a=>{
              const forge=a.role==="forge";
              return(
                <button key={a.id} className="tfx-card lg-row tfx-press" style={{"--c":forge?"#C0392B":"#708090"}} onClick={()=>selectAthlete(a)}>
                  <span className="lg-av">{a.photo_url?<img src={a.photo_url} alt=""/>:(a.name||"?")[0]}</span>
                  <span className="lg-row-txt"><b>{a.name}</b><small>{a.sport||"Athlete"}</small></span>
                  {a.injury&&<span className="lg-tag is-hurt">Injured</span>}
                  {forge&&<span className="lg-tag">Forge</span>}
                  <span className="lg-chev" aria-hidden="true">›</span>
                </button>
              );
            })}
            {list.length===0&&<div className="lg-empty">{q?"No one on the "+rosterTab+" list matches “"+search.trim()+"”.":"No one on the "+rosterTab+" list."}</div>}
          </div>

          <button className="tfx-btn-ghost tfx-press lg-wide" onClick={()=>{setSignupError("");setScreen("signup");}}>New here? Create your profile</button>
          <div className="lg-foot">Iron sharpens iron · Proverbs 27:17</div>
        </div>
      </div>
    </>
    );
  }

  if(screen==="signup")return(
    <>
      <Head><title>Create Your Profile — TF College Group</title></Head>
      <div className="tfx lg">
        <div className="lg-col is-top">
          <button className="lg-back tfx-press" onClick={()=>setScreen("roster")}>‹ Back</button>
          <div className="lg-head">
            <div className="tfx-eyebrow">New athlete</div>
            <h1>Create your profile</h1>
            <p>Takes about 20 seconds.</p>
          </div>
          <div className="lg-form">
            <label className="lg-label"><span>Your name</span>
              <input className="tfx-field" type="text" value={signupName} onChange={e=>setSignupName(e.target.value)} placeholder="First and last name" autoComplete="name"/>
            </label>
            <div className="lg-label"><span>Strength standards</span>
              <div className="ir-seg">
                {[{id:"male",label:"Men's"},{id:"female",label:"Women's"}].map(g=>(
                  <button key={g.id} className={signupGender===g.id?"is-on":""} onClick={()=>setSignupGender(g.id)}>{g.label}</button>
                ))}
              </div>
              <small>Only used to scale your strength benchmarks. Coach sets your group.</small>
            </div>
            <label className="lg-label"><span>Sport / position <em>· optional</em></span>
              <input className="tfx-field" type="text" value={signupSport} onChange={e=>setSignupSport(e.target.value)} placeholder="e.g. Baseball · OF" autoComplete="off"/>
            </label>
            <label className="lg-label"><span>College</span>
              <input className="tfx-field" type="text" value={signupCollege} onChange={e=>setSignupCollege(e.target.value)} placeholder="e.g. University of Tennessee" autoComplete="off"/>
            </label>
            <div className="lg-label"><span>Year</span>
              <div className="lg-chips">
                {["Freshman","Sophomore","Junior","Senior","5th Year","Grad"].map(y=>(
                  <button key={y} className={"tfx-chipbtn tfx-press"+(signupYear===y?" is-on":"")} onClick={()=>setSignupYear(signupYear===y?"":y)}>{y}</button>
                ))}
              </div>
            </div>
            <div className="lg-pair">
              <label className="lg-label"><span>4-digit PIN</span>
                <input className="tfx-field is-pin" type="password" inputMode="numeric" maxLength={4} value={signupPin} onChange={e=>setSignupPin(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="••••" autoComplete="new-password"/>
              </label>
              <label className="lg-label"><span>Confirm PIN</span>
                <input className="tfx-field is-pin" type="password" inputMode="numeric" maxLength={4} value={signupPinConfirm} onChange={e=>setSignupPinConfirm(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="••••" autoComplete="new-password"/>
              </label>
            </div>
            {signupError&&<div role="alert" className="lg-msg is-error">{signupError}</div>}
            <button className="tfx-btn tfx-press lg-wide" onClick={createAccount} disabled={signupSaving}>{signupSaving?"Creating…":"Create profile"}</button>
            <button className="lg-link is-btn" onClick={()=>setScreen("roster")}>Already on the list? Find your name</button>
          </div>
        </div>
      </div>
    </>
  );

  if(screen==="login"){
    const roleC=isForge?"#C0392B":"#708090";
    const first=(selectedAthlete?.name||"").split(" ")[0];
    const creating=athHasPin===false||pinStep==="confirm";
    const notNow=()=>{
      try{localStorage.setItem("tf_bio_declined_"+selectedAthlete.id,"1");}catch(e){}
      setBioDeclined(true);
      const nav=pendingNav;setPendingNav(null);setShowBioOffer(false);
      if(nav?.screen==="checkin"){setScreen("checkin");if(nav.milestone)setMilestone(nav.milestone);}
      else setScreen("profile");
    };
    const key=(k)=>{
      if(pinBusy)return;
      if(k==="⌫"){setPin(p=>p.slice(0,-1));return;}
      setPin(p=>p.length<4?p+String(k):p);
    };
    return(
    <>
      <Head><title>Sign In — TF College Group</title></Head>
      <div className="tfx lg">
        <div className="lg-col">
          <button className="lg-back tfx-press" onClick={()=>setScreen("roster")}>‹ Back</button>
          <div className="lg-who" style={{"--c":roleC}}>
            <span className="lg-av is-big">{selectedAthlete?.photo_url?<img src={selectedAthlete.photo_url} alt=""/>:(first[0]||"?")}</span>
            <h1>{pinStep==="confirm"?"Confirm your PIN":first}</h1>
            <p>{pinStep==="confirm"?"Enter the same 4 digits again":athHasPin===false?"Create a 4-digit PIN":"Enter your PIN to check in"}</p>
          </div>

          {bioAvail&&!showBioOffer&&!creating&&(
            <button className="lg-faceid tfx-press" onClick={()=>{setBioMsg("");authenticateWithBiometric(selectedAthlete);}}>
              <Icon name="faceId" size={22} color="currentColor"/><span>Use {bioLabel()}</span>
            </button>
          )}
          {bioMsg&&!showBioOffer&&<div role="alert" className="lg-msg is-warn">{bioMsg}</div>}

          {showBioOffer?(
            <div className="tfx-card lg-offer" style={{"--c":roleC}}>
              <Icon name="faceId" size={40} color="currentColor"/>
              <b>Turn on {bioLabel()}?</b>
              <p>Skip the PIN next time and check in with your face or fingerprint.</p>
              {bioMsg&&<div role="alert" className="lg-msg is-warn">{bioMsg}</div>}
              <button className="tfx-btn tfx-press lg-wide" onClick={()=>registerBiometric(false)}>Turn on {bioLabel()}</button>
              <button className="tfx-btn-ghost tfx-press lg-wide" onClick={notNow}>Not now</button>
            </div>
          ):(
            <>
              <div key={"d"+pinError} className={"lg-dots"+(pinError?" is-error":"")+(pinBusy?" is-busy":"")} style={{"--c":roleC}} aria-label={pinBusy?"Checking your PIN":pin.length+" of 4 digits entered"}>
                {[0,1,2,3].map(i=><i key={i} className={i<pin.length?"is-on":""}/>)}
              </div>
              {pinError&&<div role="alert" className="lg-msg is-error">{pinError}</div>}
              <div className="lg-pad">
                {[1,2,3,4,5,6,7,8,9,null,0,"⌫"].map((k,i)=>k===null?<span key={i}/>:(
                  <button key={i} className={"tfx-press"+(k==="⌫"?" is-del":"")} onClick={()=>key(k)} aria-label={k==="⌫"?"Delete":String(k)}>{k}</button>
                ))}
              </div>
              {athHasPin!==false&&pinStep==="enter"&&<div className="lg-msg">Forgot your PIN? Ask Coach Ant to reset it.</div>}
            </>
          )}
        </div>
      </div>
    </>
    );
  }

  if(screen==="checkin"){
    const isLate=checkinInfo?.status==="late";
    const noClass=!checkinInfo;
    const alreadyIn=checkinInfo?.already;
    const accentColor=noClass?"#444":alreadyIn?PUR:isLate?"#ff3333":GREEN;
    const bgGrad=noClass?"#080808":isLate?"linear-gradient(160deg,#080808,#100202)":alreadyIn?"linear-gradient(160deg,#080808,#04020e)":"linear-gradient(160deg,#080808,#020e06)";
    return(
      <>
        <Head><title>Check In — TF College Group</title></Head>
        <div style={{minHeight:"100vh",background:"transparent",fontFamily:"Georgia, serif",maxWidth:480,margin:"0 auto",padding:"3rem 1.5rem 2rem",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          {/* Top accent line */}
          <div style={{position:"fixed",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,transparent,"+accentColor+",transparent)",maxWidth:480,margin:"0 auto"}}/>
          {/* Big ambient glow */}
          <div style={{position:"fixed",top:"20%",left:"50%",transform:"translateX(-50%)",width:500,height:400,background:"radial-gradient(ellipse,"+accentColor+"12 0%,transparent 65%)",pointerEvents:"none"}}/>
          {/* Confetti sparks — fire on a fresh early check-in */}
          {!noClass&&!alreadyIn&&!isLate&&(
            <div style={{position:"fixed",top:"22%",left:"50%",width:0,height:0,pointerEvents:"none",zIndex:5}}>
              {Array.from({length:14}).map((_,i)=>{
                const ang=(i/14)*Math.PI*2;const dist=60+((i*37)%50);
                const cols=[GREEN,GOLD,ORANGE,"#fff"];
                return <div key={i} style={{position:"absolute",left:Math.cos(ang)*dist,top:Math.sin(ang)*dist*0.6,width:7,height:7,borderRadius:i%3===0?"50%":1,background:cols[i%cols.length],opacity:0,animation:`tfSpark 1.1s ease-out ${0.1+(i%5)*0.06}s both`,boxShadow:`0 0 8px ${cols[i%cols.length]}`}}/>;
              })}
            </div>
          )}
          {/* Status icon */}
          <div className="tf-pop" style={{position:"relative",marginBottom:24}}>
            <div style={{position:"absolute",inset:-20,borderRadius:"50%",border:"0.5px solid "+accentColor+"15",pointerEvents:"none"}}/>
            <div style={{position:"absolute",inset:-10,borderRadius:"50%",border:"1px solid "+accentColor+"25",pointerEvents:"none"}}/>
            <div style={{width:100,height:100,borderRadius:"50%",background:"linear-gradient(145deg,"+(noClass?"#222,#333":alreadyIn?PUR+",#3a2d8f":isLate?"#8B0000,#cc2200":GREEN+",#0d4a20")+")",display:"flex",alignItems:"center",justifyContent:"center",fontSize:48,boxShadow:"0 0 80px "+accentColor+"44,0 0 160px "+accentColor+"18"}}>
              <Icon name={noClass?"calendar":alreadyIn?"checkSquare":isLate?"clock":"flame"} size={46} color="#fff"/>
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
            <div className="tf-pop" style={{padding:"12px 24px",borderRadius:12,background:"linear-gradient(135deg,#051a0a,#0a2010)",border:"1px solid "+GREEN+"33",marginBottom:20,display:"inline-flex",alignItems:"center",gap:10,boxShadow:"0 4px 20px "+GREEN+"22",animationDelay:"0.2s"}}>
              <span style={{display:"flex",alignItems:"center"}}><Icon name="flame" size={20} color={GREEN}/></span>
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
          {noClass?(
            <button onClick={()=>{setScreen("profile");setTab("profile");slideDirRef.current=0;}} style={{width:"100%",maxWidth:360,padding:"18px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#E8720C,#C0392B)",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"Georgia, serif",letterSpacing:"0.06em",textTransform:"uppercase",boxShadow:"0 6px 30px #E8720C44"}}>
              My Profile →
            </button>
          ):(()=>{
            const _dow=nowEST().getDay();
            const isWeighDay=_dow===1||_dow===5;
            return(
              <div style={{width:"100%",maxWidth:360,display:"flex",flexDirection:"column",gap:11}}>
                <div style={{fontSize:12,color:"#777",letterSpacing:"0.02em",marginBottom:2}}>{isWeighDay?"Two quick things before you go 👇":"One quick thing before you go 👇"}</div>
                <button onClick={()=>{const first=isWeighDay?"weight":"habits";setPostCheckinStep(first);setScreen("profile");setTab(first);slideDirRef.current=0;}} style={{width:"100%",padding:"18px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#E8720C,#C0392B)",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"Georgia, serif",letterSpacing:"0.04em",textTransform:"uppercase",boxShadow:"0 6px 30px #E8720C44"}}>
                  {isWeighDay?"Log weight & habits →":"Log today's habits →"}
                </button>
                <button onClick={()=>{setPostCheckinStep(null);setScreen("profile");setTab("profile");slideDirRef.current=0;}} style={{width:"100%",padding:"13px",borderRadius:12,border:"1px solid rgba(255,255,255,0.12)",background:"transparent",color:"#777",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"Georgia, serif"}}>
                  Skip for now
                </button>
              </div>
            );
          })()}
        </div>
      </>
    );
  }

  if(screen==="profile"&&selectedAthlete){
    const TABS=[
      {id:"profile",label:"Profile"},
      {id:"mcastles",label:"MCastles"},
      {id:"events",label:"Events"},
      {id:"verse",label:"Verse"},
      {id:"attendance",label:"Attendance"},
      {id:"mygroup",label:"My Group"},
      {id:"anvil",label:"Anvil"},
      {id:"prfeed",label:"PR Feed"},
      {id:"callouts",label:"Callouts"},
      {id:"badges",label:"Badges"},
      {id:"recap",label:"My Season"},
      {id:"weight",label:"Weight"},
      {id:"body",label:"Injury"},
      {id:"prs",label:"Iron Room"},
      {id:"stretching",label:"Stretch"},
      {id:"leaderboard",label:"Leaderboard"},
      {id:"prayer",label:"Prayer"},
      {id:"bracelets",label:"Bracelets"},
      {id:"photos",label:"Photos"},
      {id:"notes",label:"Study Notes"},
      {id:"habits",label:"Habits"},
      {id:"private",label:"Private"},
      {id:"surprise",label:"Surprise 🎁"},
    ];

    // Swipe between bottom-nav tabs
    const validPinnedForSwipe=pinnedTabs.filter(id=>TABS.find(t=>t.id===id));
    const PRIMARY_NAV=["profile",...validPinnedForSwipe];
    const handleTouchStart=(e)=>{touchStartRef.current={x:e.touches[0].clientX,y:e.touches[0].clientY};};
    const handleTouchEnd=(e)=>{
      if(!touchStartRef.current)return;
      const dx=e.changedTouches[0].clientX-touchStartRef.current.x;
      const dy=e.changedTouches[0].clientY-touchStartRef.current.y;
      touchStartRef.current=null;
      if(Math.abs(dx)<52||Math.abs(dx)<Math.abs(dy)*1.5)return;
      const idx=PRIMARY_NAV.indexOf(tab);
      if(idx<0)return; // current tab isn't in the primary swipe nav (opened from More) — don't hijack the swipe
      if(dx>0&&idx<PRIMARY_NAV.length-1){slideDirRef.current=1;setTab(PRIMARY_NAV[idx+1]);}
      else if(dx<0&&idx>0){slideDirRef.current=-1;setTab(PRIMARY_NAV[idx-1]);}
    };

    // Group info is driven entirely by the athlete record. Coach assigns groups
    // manually in the coach Teams tab, which writes group_idx / role / tier / bracelet.
    const myGroupIdx=selectedAthlete.group_idx;
    const myTier=selectedAthlete?.tier||null;
    const groupmates=myGroupIdx!=null?(athletes||[]).filter(a=>a.group_idx===myGroupIdx):[];
    const myGroupLeader=groupmates.find(a=>a.role==="forge")||null;
    const myBraceletRef=selectedAthlete?.bracelet||myGroupLeader?.bracelet||null;
    const myBracelet=myBraceletRef?BRACELETS.find(b=>b.ref===myBraceletRef):null;

    // Accent for the athlete's role (Forge = ember, Iron = steel) — passed to CSS as --c
    const roleC=isForge?"#E8720C":"#8a9aa4";

    return(
      <>
        <style>{`@keyframes tfSlideFromRight{from{transform:translateX(52px) scale(0.98);opacity:0}to{transform:translateX(0) scale(1);opacity:1}}@keyframes tfSlideFromLeft{from{transform:translateX(-52px) scale(0.98);opacity:0}to{transform:translateX(0) scale(1);opacity:1}}@keyframes tfJiggle{0%{transform:rotate(-1.5deg) scale(1.03)}100%{transform:rotate(1.5deg) scale(1.03)}}`}</style>
        <Head><title>{selectedAthlete.name} — TF College Group</title></Head>
        {milestone&&(
          <div className="tfx ag-ms" onClick={()=>setMilestone(null)} style={{"--c":milestone.color}} role="dialog" aria-label="Milestone reached">
            <div className="ag-ms-in">
              <div className="ag-ms-ic" aria-hidden="true">{milestone.icon}</div>
              <div className="tfx-eyebrow">Milestone reached</div>
              <h2>{milestone.headline}</h2>
              <p>{milestone.msg}</p>
              <button className="tfx-btn tfx-press" onClick={()=>setMilestone(null)}>Let's go →</button>
            </div>
          </div>
        )}
        {editOpen&&(
          <div className="cs-scrim is-sheet" onClick={()=>!editSaving&&setEditOpen(false)}>
            <div className="tfx cs-sheet ag-sheet" role="dialog" aria-label="Edit profile" onClick={e=>e.stopPropagation()}>
              <div className="cs-grab" aria-hidden="true"/>
              <div className="cs-sheet-head">
                <div className="cs-sheet-id"><b>Edit profile</b><small>Your photo, details and PIN</small></div>
                <button className="cs-x tfx-press" onClick={()=>!editSaving&&setEditOpen(false)} aria-label="Close">✕</button>
              </div>
              <div className="cs-sheet-body ag-form">
                {/* Photo */}
                <div className="ag-photo">
                  <span className="ag-av is-lg" style={{"--c":roleC}}>
                    {selectedAthlete.photo_url?<img src={selectedAthlete.photo_url} alt=""/>:(editName||selectedAthlete.name||"?")[0]}
                  </span>
                  <label className="tfx-btn-ghost tfx-press ag-photo-btn">
                    <Icon name="camera" size={16}/>{editPhotoBusy?"Uploading…":"Change photo"}
                    <input type="file" accept="image/*" hidden onChange={e=>{const f=e.target.files?.[0];if(f)onEditPhoto(f);e.target.value="";}}/>
                  </label>
                </div>
                <label className="lg-label">
                  <span>Name</span>
                  <input type="text" className="tfx-field ag-field" value={editName} onChange={e=>setEditName(e.target.value)}/>
                </label>
                <label className="lg-label">
                  <span>Sport / position</span>
                  <input type="text" className="tfx-field ag-field" value={editSport} onChange={e=>setEditSport(e.target.value)} placeholder="e.g. Baseball · OF"/>
                </label>
                <label className="lg-label">
                  <span>College</span>
                  <input type="text" className="tfx-field ag-field" value={editCollege} onChange={e=>setEditCollege(e.target.value)} placeholder="e.g. University of Tennessee"/>
                </label>
                <div className="lg-label">
                  <span>Year</span>
                  <div className="lg-chips">
                    {["Freshman","Sophomore","Junior","Senior","5th Year","Grad"].map(y=>(
                      <button key={y} className={"tfx-chipbtn tfx-press ag-chip"+(editYear===y?" is-on":"")} aria-pressed={editYear===y} onClick={()=>setEditYear(editYear===y?"":y)}>{y}</button>
                    ))}
                  </div>
                </div>
                <div className="lg-label">
                  <span>Change PIN <em>· leave blank to keep current</em></span>
                  <div className="lg-pair">
                    <input type="password" inputMode="numeric" maxLength={4} className="tfx-field ag-field is-pin" aria-label="New PIN" value={editPin} onChange={e=>setEditPin(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="New PIN"/>
                    <input type="password" inputMode="numeric" maxLength={4} className="tfx-field ag-field is-pin" aria-label="Confirm new PIN" value={editPinConfirm} onChange={e=>setEditPinConfirm(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="Confirm"/>
                  </div>
                </div>
                {editMsg&&<div className="ir-err" role="alert">{editMsg}</div>}
                <div className="ag-actions">
                  <button className="tfx-btn-ghost tfx-press" onClick={()=>!editSaving&&setEditOpen(false)}>Cancel</button>
                  <button className="tfx-btn tfx-press" onClick={saveProfile} disabled={editSaving}>{editSaving?"Saving…":"Save changes"}</button>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="tfx ag-page" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          {/* Profile header */}
          <header className="cs-head ag-head">
            <div className="cs-head-in ag-head-in">
              <div className="ag-id">
                <button className="ag-av tfx-press" style={{"--c":roleC}} onClick={openEditProfile} aria-label="Edit profile">
                  {selectedAthlete.photo_url?<img src={selectedAthlete.photo_url} alt="" onError={e=>{e.target.style.display="none";}}/>:selectedAthlete.name[0]}
                  <i className="ag-av-edit" aria-hidden="true">✎</i>
                </button>
                <div className="ag-who">
                  <b>{selectedAthlete.name}</b>
                  {selectedAthlete.sport&&<small>{selectedAthlete.sport}</small>}
                  {(selectedAthlete.college||selectedAthlete.year)&&(
                    <small>
                      {selectedAthlete.college}
                      {selectedAthlete.college&&selectedAthlete.year&&<span className="ag-dot"> · </span>}
                      {selectedAthlete.year&&<span className="ag-year">{selectedAthlete.year}</span>}
                    </small>
                  )}
                </div>
                <span className="ag-role" style={{"--c":roleC}}>{isForge?"Forge":"Iron"}</span>
              </div>
              <div className="ag-bar">
                <button className="ag-chip-link tfx-press" onClick={()=>setScreen("roster")}>← Switch</button>
                <a className="ag-ic-link tfx-press" href="/" aria-label="Home"><Icon name="home" size={16}/></a>
                <a className="ag-ic-link tfx-press" href="/coach" aria-label="Coach app"><Icon name="anvil" size={16}/></a>
                {streak>0&&<span className="ag-streak"><Icon name="flame" size={13}/><span><b className="tfx-num">{streak}</b>-day streak</span></span>}
              </div>
            </div>
          </header>

          <div key={tab} className="ag-body" style={{animation:slideDirRef.current>0?"tfSlideFromRight 0.32s cubic-bezier(0.22,1,0.36,1) backwards":slideDirRef.current<0?"tfSlideFromLeft 0.32s cubic-bezier(0.22,1,0.36,1) backwards":"none"}}>

            {tab==="profile"&&(
              <div className="tfx ag-stack">
                {(()=>{const _est=nowEST();const _d=_est.getDay();const isClassDay=[1,2,4,5].includes(_d);if(!isClassDay||isBeforeSeason(seasonInfo))return null;const isMonFri=_d===1||_d===5;return(
                  <div className="tfx-card ag-row" style={{"--c":"var(--ember)"}}>
                    <span className="ag-tile"><Icon name="zap" size={18}/></span>
                    <span className="ag-row-txt"><b>Class day — be early!</b><small>Doors open at {isMonFri?"8:30am":"9:00am"} · On time is late</small></span>
                  </div>
                );})()}
                {weightLoggedToday===false&&(
                  <button className="tfx-card ag-row is-tap tfx-press" style={{"--c":"var(--green)"}} onClick={()=>{slideDirRef.current=0;setTab("weight");}}>
                    <span className="ag-tile"><Icon name="scale" size={18}/></span>
                    <span className="ag-row-txt"><b>Weigh-in day</b><small>Tap to log your weight → stay on track</small></span>
                    <span className="ag-chev" aria-hidden="true">›</span>
                  </button>
                )}
                {habitsDoneToday===false&&(
                  <button className="tfx-card ag-row is-tap tfx-press" style={{"--c":"var(--violet)"}} onClick={()=>{slideDirRef.current=0;setTab("habits");}}>
                    <span className="ag-tile"><Icon name="droplet" size={18}/></span>
                    <span className="ag-row-txt"><b>Log today's habits</b><small>Water · nutrition · sleep → keep your streak alive</small></span>
                    <span className="ag-chev" aria-hidden="true">›</span>
                  </button>
                )}
                {/* Recent team PRs — hype feed (hidden until there's at least one) */}
                <div className="ag-slot">
                  <TeamPRFeed athletes={athletes} currentAthleteId={selectedAthlete.id} compact onSeeAll={()=>{slideDirRef.current=0;setTab("prfeed");}}/>
                </div>
                {/* Push notification setup card — shown until enabled */}
                {notifCard==="idle"&&(
                  <div className="tfx-card ag-row">
                    <span className="ag-tile"><Icon name="bell" size={18}/></span>
                    <span className="ag-row-txt"><b>Lock screen reminders</b><small>Get notified to log weight on class days</small></span>
                    <button className="tfx-btn-ghost tfx-press ag-mini" onClick={enableProfileNotif} disabled={notifLoading}>{notifLoading?"…":"Enable"}</button>
                  </div>
                )}
                {notifCard==="ios-browser"&&(
                  <div className="tfx-card ag-card">
                    <div className="ag-row is-flat">
                      <span className="ag-tile"><Icon name="bell" size={18}/></span>
                      <span className="ag-row-txt"><b>Get lock screen reminders</b><small>Then tap Enable inside the app to get notifications</small></span>
                    </div>
                    <p className="ag-p">On iPhone, add this app to your Home Screen first: tap <strong>Share</strong> → <strong>Add to Home Screen</strong> → open from there.</p>
                  </div>
                )}
                {notifCard==="denied"&&(
                  <div className="tfx-card ag-row">
                    <span className="ag-tile"><Icon name="bellOff" size={18}/></span>
                    <span className="ag-row-txt"><b>Notifications blocked</b><small>Enable in your browser or phone settings · Settings → Safari/Chrome</small></span>
                  </div>
                )}
                {bioAvail&&!bioCredId&&(
                  <div className="tfx-card ag-card">
                    <div className="ag-row is-flat">
                      <span className="ag-tile"><Icon name="faceId" size={18}/></span>
                      <span className="ag-row-txt"><b>Enable Face ID / Touch ID</b><small>Sign in instantly — skip the PIN next time</small></span>
                      <button className="tfx-btn-ghost tfx-press ag-mini" disabled={bioRegistering} onClick={async()=>{
                        setBioRegistering(true);setBioRegResult(null);
                        try{localStorage.removeItem("tf_bio_declined_"+selectedAthlete.id);}catch(e){}
                        try{localStorage.removeItem("tf_bio_"+selectedAthlete.id);}catch(e){}
                        setBioDeclined(false);setBioCredId(null);
                        const st=await registerBiometric(true);
                        setBioRegResult(st==="ok"?"success":st==="error"?"failed":null);
                        setBioRegistering(false);
                      }}>
                        {bioRegistering?"Setting up…":"Enable"}
                      </button>
                    </div>
                    {bioRegResult==="success"&&<div className="ag-note is-ok">✓ Face ID enabled — use it next time you log in</div>}
                    {bioRegResult==="failed"&&<div className="ag-note is-bad">{bioMsg||"Setup failed — make sure Face ID is on and try again."}</div>}
                  </div>
                )}
                {bioAvail&&bioCredId&&(
                  <div className="tfx-card ag-card">
                    <div className="ag-row is-flat">
                      <span className="ag-tile" style={{"--c":"var(--green)"}}><Icon name="faceId" size={18}/></span>
                      <span className="ag-row-txt"><b>Face ID / Touch ID enabled</b><small>Reset to re-register with Apple Passwords</small></span>
                      <button className="tfx-btn-ghost tfx-press ag-mini" disabled={bioRegistering} onClick={async()=>{
                        setBioRegistering(true);setBioRegResult(null);
                        try{localStorage.removeItem("tf_bio_declined_"+selectedAthlete.id);}catch(e){}
                        try{localStorage.removeItem("tf_bio_"+selectedAthlete.id);}catch(e){}
                        setBioDeclined(false);setBioCredId(null);
                        const st=await registerBiometric(true);
                        setBioRegResult(st==="ok"?"success":st==="error"?"failed":null);
                        setBioRegistering(false);
                      }}>
                        {bioRegistering?"Resetting…":"Reset"}
                      </button>
                    </div>
                    {bioRegResult==="success"&&<div className="ag-note is-ok">✓ Face ID re-registered with Apple Passwords</div>}
                    {bioRegResult==="failed"&&<div className="ag-note is-bad">{bioMsg||"Setup failed — make sure Face ID is on and try again."}</div>}
                  </div>
                )}
                <div className="ag-slot"><DailyWord announcement={announcement}/></div>
                <div className="ag-slot"><ClassCountdown/></div>
                {(()=>{
                  const _e=nowEST();
                  const _dow=_e.getDay();
                  const GENRES=[{id:"rock",label:"Rock",emoji:"🎸"},{id:"wgt",label:"White Girl Throwbacks",emoji:"💅"},{id:"rap",label:"Rap / Hip-Hop",emoji:"🎤"},{id:"country",label:"Country",emoji:"🤠"},{id:"pop",label:"Pop",emoji:"🎵"},{id:"mcastle",label:"MCASTLES SECRET PICK",emoji:"🍑🚀"}];
                  if(_dow===1||_dow===5)return(
                    <div className="tfx-card ag-card" style={{"--c":"var(--gold)"}}>
                      <div className="tfx-eyebrow ag-eb">Today's music</div>
                      <h3 className="ag-h">Worship music</h3>
                      <p className="ag-sub">{_dow===1?"Mindset Monday":"Fellowship Friday"} · Proverbs 27:17</p>
                    </div>
                  );
                  return(
                    <div className="tfx-card ag-card" style={{"--c":"var(--ember)"}}>
                      <div className="ag-head-row">
                        <div>
                          <div className="tfx-eyebrow ag-eb">Vote now</div>
                          <h3 className="ag-h">Today's music</h3>
                        </div>
                        {myVote&&<small className="ag-hint">Tap to change your vote</small>}
                      </div>
                      <div className="ag-votes">
                        {GENRES.map(g=>(
                          <button key={g.id} className={"ag-vote tfx-press"+(myVote===g.id?" is-on":"")} aria-pressed={myVote===g.id} onClick={()=>submitVote(g.id)}>
                            <span className="ag-vote-em" aria-hidden="true">{g.emoji}</span>
                            <span className="ag-vote-lbl">{g.label}</span>
                            {myVote===g.id&&<span className="ag-vote-ck" aria-hidden="true">✓</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                {/* Day schedule — always shows */}
                {(()=>{
                  const _days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
                  const _day=_days[nowEST().getDay()];
                  const _classDays=["Mon","Tue","Thu","Fri"];
                  const _isClassDay=_classDays.includes(_day);
                  if(isBeforeSeason(seasonInfo)) return(
                    <div className="tfx-card ag-card">
                      <div className="tfx-eyebrow">Schedule</div>
                      <h3 className="ag-h">{seasonInfo.label} starts {fmtFirstClass(seasonInfo)}</h3>
                      <p className="ag-sub">Class days are Monday, Tuesday, Thursday &amp; Friday. Get your body ready — log your weight and habits so you show up strong.</p>
                    </div>
                  );
                  if(!_isClassDay) return(
                    <div className="tfx-card ag-card">
                      <div className="tfx-eyebrow">Schedule</div>
                      <h3 className="ag-h">No class today</h3>
                      <p className="ag-sub">Class days are Monday, Tuesday, Thursday &amp; Friday. Rest up and come back ready.</p>
                    </div>
                  );
                  const _items=[
                    {time:"9:00am",label:_day==="Mon"?"Mindset Monday":_day==="Fri"?"Fellowship Friday":"Pre-class",detail:_day==="Mon"?"Pre-class · mindset session with Coach Ant & Kevin":_day==="Fri"?"Pre-class · devotional & discussion with Coach Ant":"30 min · sign-in · stretch prep",color:_day==="Mon"?GOLD:_day==="Fri"?PUR:"#708090",dur:"30 min"},
                    {time:"9:30am",label:"Stretch & mobility",detail:"10 min · dynamic stretching · all athletes together",color:GREEN,dur:"10 min"},
                    {time:"9:40am",label:"Run",detail:"40–50 min · all 4 groups · hand positions enforced · leaders set pace",color:"#854F0B",dur:"40–50 min"},
                    {time:"10:30am",label:"Weight room",detail:"30–50 min · 2 groups Tier 1 · 1 group Tier 2 · 1 group Tier 3",color:PUR,dur:"30–50 min"},
                    {time:"11:15am",label:"Closeout & prayer",detail:"5 min · all together · coach or athlete prays",color:RED,dur:"5 min"},
                  ];
                  return(
                    <div className="tfx-card ag-card">
                      <div className="tfx-eyebrow">Today</div>
                      <h3 className="ag-h">Class flow</h3>
                      <p className="ag-sub">2 hours · done by 11:20am</p>
                      <ol className="ag-flow">
                        {_items.map((s,i)=>(
                          <li key={i} style={{"--c":s.color}}>
                            <span className="ag-flow-t tfx-num">{s.time}</span>
                            <span className="ag-flow-dot" aria-hidden="true"/>
                            <span className="ag-flow-txt">
                              <b>{s.label}<em>{s.dur}</em></b>
                              <small>{s.detail}</small>
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  );
                })()}
                {announcement&&(
                  <div className="tfx-card ag-card ag-coach" style={{"--c":"var(--violet)"}}>
                    <div className="tfx-eyebrow ag-eb">From Coach Ant</div>
                    <p className="ag-msg">{announcement.message}</p>
                  </div>
                )}
                {bracelet&&(
                  <div className="tfx-card ag-card" style={{"--c":bracelet.hex}}>
                    <div className="ag-verse-ref"><i aria-hidden="true"/>{bracelet.color} · {bracelet.ref}</div>
                    <blockquote className="ag-verse">&#8220;{bracelet.text}&#8221;</blockquote>
                  </div>
                )}
                {streak>0&&(
                  <div className="tfx-card ag-card" style={{"--c":"var(--green)"}}>
                    <div className="tfx-eyebrow ag-eb">Early arrival streak</div>
                    <h3 className="ag-h"><span className="tfx-num">{streak}</span> <span className="ag-h-soft">days straight</span></h3>
                    <div className="ag-stats">
                      <div className="cs-stat"><b className="tfx-num">{streak}</b><small>Current</small></div>
                      <div className="cs-stat"><b className="tfx-num">{athleteLb?.best_streak||streak}</b><small>Best</small></div>
                      <div className="cs-stat"><b className="tfx-num">{athleteLb?.early_count||streak}</b><small>Total early</small></div>
                    </div>
                    {(()=>{
                      const allM=[3,5,7,10,15,20];
                      const next=allM.find(m=>m>streak);
                      if(!next)return<div className="ag-note is-ok">🏆 Elite streak. Keep going.</div>;
                      const prev=allM.filter(m=>m<streak).pop()||0;
                      const pct=Math.round(((streak-prev)/(next-prev))*100);
                      return(
                        <div className="ag-prog">
                          <div className="ag-prog-lbl"><span>{streak} days</span><span>{next-streak} more to {next}-day milestone</span></div>
                          <div className="ag-prog-track"><i style={{width:pct+"%"}}/></div>
                        </div>
                      );
                    })()}
                  </div>
                )}
                {anvilWinner&&(
                  <div className="tfx-card ag-row" style={{"--c":"var(--gold)"}}>
                    {(()=>{const wa=athletes.find(a=>a.name===anvilWinner.athlete_name);return(<span className="ag-av is-md">{wa?.photo_url?<img src={wa.photo_url} onError={e=>{e.target.style.display="none";}} alt=""/>:(anvilWinner.athlete_name||"?")[0]}</span>);})()}
                    <span className="ag-row-txt">
                      <span className="tfx-eyebrow ag-eb">This week's Anvil</span>
                      <b className="ag-big">{anvilWinner.athlete_name}</b>
                      <small>Iron sharpens iron.</small>
                    </span>
                  </div>
                )}
                {/* ── GOALS ── */}
                <div className="ag-slot"><Goals athlete={selectedAthlete} season={seasonInfo} onUpdate={patch=>setSelectedAthlete(x=>({...x,...patch}))}/></div>

                <a href={groupmeLink} target="_blank" rel="noreferrer" className="tfx-card ag-row is-tap tfx-press" style={{"--c":"var(--sky)"}}>
                  <span className="ag-tile"><Icon name="chat" size={18}/></span>
                  <span className="ag-row-txt">
                    <span className="tfx-eyebrow ag-eb">Group chat</span>
                    <b className="ag-big">Join GroupMe</b>
                    <small>Tap to join the team group chat</small>
                  </span>
                  <span className="ag-chev" aria-hidden="true">›</span>
                </a>
              </div>
            )}


            {tab==="mygroup"&&(
              <div className="tfx ag-stack">
                {myGroupIdx==null?(
                  <div className="tfx-card ag-card">
                    <div className="tfx-eyebrow">Your group</div>
                    <h2 className="ag-title">Not assigned yet</h2>
                    <p className="ag-sub">Coach will place you in a group soon.</p>
                  </div>
                ):(()=>{
                  const gc=myBracelet?.hex||LC[myGroupIdx%LC.length]||PUR;
                  const leaderName=myGroupLeader?.name||null;
                  const amLeader=selectedAthlete?.role==="forge";
                  return(
                    <>
                      {/* Group identity card */}
                      <div className="tfx-card ag-card" style={{"--c":gc}}>
                        <div className="tfx-eyebrow ag-eb">{amLeader?"You're leading this group":"Your group"}</div>
                        {leaderName&&(
                          <div className="ag-leader">
                            <span className="ag-av is-lg">{myGroupLeader?.photo_url?<img src={myGroupLeader.photo_url} alt=""/>:(leaderName||"?")[0]}</span>
                            <span className="ag-row-txt">
                              <b className="ag-big">{leaderName}</b>
                              <small>{amLeader?"Group leader · That's you":"Group leader"}</small>
                              {myTier&&<span className="ag-pill">Tier {myTier}</span>}
                            </span>
                          </div>
                        )}
                        {/* Scripture */}
                        {myBracelet&&(
                          <div className="ag-scripture">
                            <div className="ag-verse-ref"><i aria-hidden="true"/>{myBracelet.color} — {myBracelet.ref}</div>
                            <blockquote className="ag-verse">&#8220;{myBracelet.text}&#8221;</blockquote>
                          </div>
                        )}
                      </div>

                      {/* Teammates grid */}
                      {groupmates.length>0&&(
                        <div className="tfx-card ag-card" style={{"--c":gc}}>
                          <div className="ag-head-row">
                            <div className="tfx-eyebrow">Teammates</div>
                            <small className="ag-hint">{groupmates.length} member{groupmates.length!==1?"s":""}</small>
                          </div>
                          <div className="ag-mates">
                            {groupmates.map((ath,i)=>{
                              const isMe=ath.id===selectedAthlete?.id;
                              return(
                                <div key={ath.id||i} className={"ag-mate"+(isMe?" is-me":"")}>
                                  <span className="ag-av is-sm">{ath?.photo_url?<img src={ath.photo_url} alt=""/>:(ath.name||"?")[0]}</span>
                                  <span className="ag-row-txt">
                                    <b>{(ath.name||"").split(" ")[0]}</b>
                                    {isMe&&<small>you</small>}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}



            {tab==="prayer"&&<PrayerWall athleteId={selectedAthlete.id} athleteName={selectedAthlete.name}/>}

            {tab==="leaderboard"&&<AthleteLeaderboard athleteId={selectedAthlete.id}/>}

            {tab==="bracelets"&&<BraceletWall athleteBracelet={selectedAthlete.bracelet}/>}

            {tab==="notes"&&<NotesTab athleteId={selectedAthlete.id} athlete={selectedAthlete}/>}


            {tab==="weight"&&(<>
              {postCheckinStep==="weight"&&(
                <div className="tfx tfx-card wt-step tfx-rise">
                  <div style={{minWidth:0}}>
                    <div className="tfx-eyebrow">✓ Checked in · Step 1 of 2</div>
                    <b>Log your weight</b>
                  </div>
                  <button className="tfx-btn-ghost tfx-press" onClick={()=>{setPostCheckinStep("habits");slideDirRef.current=0;setTab("habits");}}>Skip →</button>
                </div>
              )}
              <WeightTracker athleteId={selectedAthlete.id} onWeighed={()=>{setWeightLoggedToday(true);if(postCheckinStep==="weight"){setPostCheckinStep("habits");slideDirRef.current=0;setTimeout(()=>setTab("habits"),650);}}}/>
            </>)}

            {tab==="body"&&<InjuryBodyMap athleteId={selectedAthlete.id}/>}

            {tab==="goals"&&<Goals athlete={selectedAthlete} season={seasonInfo} onUpdate={patch=>setSelectedAthlete(x=>({...x,...patch}))}/>}

            {tab==="verse"&&<VerseOfDay/>}

            {tab==="anvil"&&<AnvilHistory athleteId={selectedAthlete?.id} athleteName={selectedAthlete?.name}/>}
            {tab==="prfeed"&&<TeamPRFeed athletes={athletes} currentAthleteId={selectedAthlete?.id}/>}
            {tab==="callouts"&&<MyCalloutsTab athleteId={selectedAthlete.id} athleteName={selectedAthlete.name}/>}
            {tab==="badges"&&<Achievements athleteId={selectedAthlete?.id} athleteName={selectedAthlete?.name}/>}
            {tab==="recap"&&<SeasonRecap athleteId={selectedAthlete?.id} athleteName={selectedAthlete?.name} photoUrl={selectedAthlete?.photo_url}/>}

            {tab==="photos"&&<GroupPhotos/>}

            {tab==="mcastles"&&<MCastlesTab/>}

            {tab==="events"&&<AthleteEventsTab athleteName={selectedAthlete.name}/>}

            {tab==="attendance"&&<AttendanceTab athleteId={selectedAthlete.id}/>}


            {tab==="prs"&&<PRLog athleteId={selectedAthlete.id} gender={selectedAthlete.gender} onNavigate={(t)=>{slideDirRef.current=0;setTab(t);}}/>}
            {tab==="stretching"&&<StretchingTab/>}

            {tab==="journey"&&(
              <div className="tfx ag-stack">
                <div className="tfx-card ag-card" style={{"--c":"var(--gold)"}}>
                  <div className="tfx-eyebrow ag-eb">Proverbs 27:17</div>
                  <h2 className="ag-title">As iron sharpens iron…</h2>
                  <blockquote className="ag-verse">&#8220;As iron sharpens iron, so one person sharpens another.&#8221;</blockquote>
                  <p className="ag-cite">— Proverbs 27:17</p>
                </div>
                {[
                  {title:"The Iron",color:STEEL,isYou:!isForge,body:"Every athlete enters as The Iron. Raw. Unfinished. Full of potential but not yet fully shaped.",call:"Show up early. Work hard. Hold the standard."},
                  {title:"The Forge",color:RED,isYou:isForge,body:"The Forge is called up for the week. They set the pace, lead the group, hold the standard.",call:"Lead by example before you lead by voice."},
                  {title:"The Anvil",color:GOLD,isYou:false,body:"The Anvil is the highest individual honor in TF College Group. It cannot be drafted. It can only be earned.",call:"You do not chase the Anvil. You become the kind of person who earns it."},
                ].map((item,i)=>(
                  <div key={i} className={"tfx-card ag-card ag-tier"+(item.isYou?" is-you":"")} style={{"--c":item.color}}>
                    <div className="ag-head-row">
                      <div>
                        <div className="tfx-eyebrow ag-eb">Tier</div>
                        <h3 className="ag-h">{item.title}</h3>
                      </div>
                      {item.isYou&&<span className="ag-pill">You are here</span>}
                    </div>
                    <p className="ag-p">{item.body}</p>
                    <p className="ag-call">{item.call}</p>
                  </div>
                ))}
              </div>
            )}

            {tab==="habits"&&(<>
              {postCheckinStep==="habits"&&(()=>{
                const _wd=nowEST().getDay();const _weigh=_wd===1||_wd===5;
                return(
                  <div className="tfx tfx-card wt-step tfx-rise">
                    <div style={{minWidth:0}}>
                      <div className="tfx-eyebrow">✓ Checked in · {_weigh?"Step 2 of 2":"Last step"}</div>
                      <b>Log today's habits</b>
                    </div>
                    <button className="tfx-btn-ghost tfx-press" onClick={()=>{setPostCheckinStep(null);slideDirRef.current=0;setTab("profile");}}>Done</button>
                  </div>
                );
              })()}
              <HabitsTab athleteId={selectedAthlete.id} onComplete={()=>setHabitsDoneToday(true)}/>
            </>)}

            {tab==="surprise"&&<SurpriseTab athleteName={selectedAthlete.name}/>}
            {tab==="private"&&(
              <div className="tfx ag-stack">
                <div className="tfx-card ag-card" style={{"--c":"#8a9aa4"}}>
                  <div className="tfx-eyebrow ag-eb">Message</div>
                  <h3 className="ag-h">Message Coach Ant</h3>
                  <p className="ag-sub">Nobody else sees what you send here.</p>
                  {feedbackSent?(
                    <div className="ag-sent" role="status">✓ Message sent to Coach Ant.</div>
                  ):(
                    <>
                      <textarea className="tfx-field ag-area" value={feedbackText} onChange={e=>setFeedbackText(e.target.value)} placeholder="Type your message to Coach Ant..." aria-label="Message to Coach Ant"/>
                      <button className={"ag-send tfx-press"+(feedbackText.trim()?"":" is-off")} onClick={sendFeedback}>Send to Coach Ant →</button>
                    </>
                  )}
                </div>
                <div className="tfx-card ag-card" style={{"--c":"var(--violet)"}}>
                  <div className="tfx-eyebrow ag-eb">Prayer</div>
                  <h3 className="ag-h">Prayer request</h3>
                  <p className="ag-sub">Coach Ant will pray for you personally.</p>
                  {prayerSent?(
                    <div className="ag-sent" role="status">✓ Your request has been received. We're praying for you.</div>
                  ):(
                    <>
                      <textarea className="tfx-field ag-area" value={prayerText} onChange={e=>setPrayerText(e.target.value)} placeholder="Share your prayer request here..." aria-label="Prayer request"/>
                      <button className={"ag-send tfx-press"+(prayerText.trim()?"":" is-off")} onClick={sendPrayer}>Submit prayer request →</button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* ── BOTTOM BAR (pinned tabs) + ALL TABS DRAWER ── */}
        {(()=>{
            const ICON_MAP={"profile":"profile","verse":"book","attendance":"calendar","draft":"target","mygroup":"users","weight":"scale","body":"heart","prs":"barbell","leaderboard":"trophy","prayer":"pray","bracelets":"link","photos":"camera","notes":"fileText","habits":"droplet","private":"lock","stretching":"activity","journey":"compass","anvil":"anvil","mcastles":"crown","events":"star","surprise":"gift","badges":"medal","recap":"award","prfeed":"flame","callouts":"megaphone"};
            const validPinned=pinnedTabs.filter(id=>TABS.find(t=>t.id===id));
            const PRIMARY=["profile",...validPinned];
            const togglePin=(id)=>{
              if(id==="profile")return;
              const next=validPinned.includes(id)?validPinned.filter(p=>p!==id):(validPinned.length<4?[...validPinned,id]:validPinned);
              setPinnedTabs(next);
              try{localStorage.setItem("tf_pinned_"+selectedAthlete.id,JSON.stringify(next));}catch(e){}
            };
            const ic=(id,size)=><Icon name={ICON_MAP[id]||"grid"} size={size} color="currentColor"/>;
            const activeIdx=PRIMARY.indexOf(tab);
            return(
              <>
                <nav className="cs-nav ag-nav" aria-label="Athlete tabs">
                  <div className="cs-nav-in" style={{"--n":PRIMARY.length+1,"--i":activeIdx}}>
                    {activeIdx>=0&&!jiggleMode&&<i className="cs-ind" aria-hidden="true"/>}
                    {PRIMARY.map(id=>{
                      const t=TABS.find(x=>x.id===id);
                      if(!t)return null;
                      const isActive=tab===id&&!jiggleMode;
                      const isJiggling=jiggleMode&&id!=="profile"&&jiggleDragId!==id;
                      const isDragging=jiggleDragId===id;
                      return(
                        <button key={id}
                          ref={isDragging?jiggleDragElemRef:null}
                          className={"cs-tab"+(isActive?" is-on":"")+(isJiggling?" is-jiggle":"")+(isDragging?" is-drag":"")+(jiggleMode?" is-edit":"")}
                          aria-current={isActive?"page":undefined}
                          onClick={()=>{if(jiggleMode)return;hTap();slideDirRef.current=0;setTab(id);}}
                          onTouchStart={(e)=>{
                            if(id==="profile")return;
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
                            if(jiggleDragOrderRef.current){try{localStorage.setItem("tf_pinned_"+selectedAthlete.id,JSON.stringify(jiggleDragOrderRef.current));}catch(err){}jiggleDragOrderRef.current=null;}
                          }}>
                          <span className="cs-ic">{ic(id,20)}</span>
                          <span className="cs-lbl">{t.label}</span>
                        </button>
                      );
                    })}
                    <button data-nav="more" className={"cs-tab is-all"+(showTabPicker?" is-on":"")} onClick={()=>{setShowTabPicker(true);setEditingPins(false);}} aria-haspopup="dialog">
                      <span className="cs-ic"><Icon name="menu" size={20} color="currentColor"/></span>
                      <span className="cs-lbl">More</span>
                    </button>
                  </div>
                </nav>

                {jiggleMode&&(
                  <button className="cs-done tfx-press" onClick={()=>{setJiggleMode(false);setJiggleDragId(null);if(jiggleDragElemRef.current)jiggleDragElemRef.current.style.transform="";}}>Done</button>
                )}

                {showTabPicker&&(
                  <div className="cs-scrim" onClick={()=>setShowTabPicker(false)}>
                    <aside className="tfx cs-drawer ag-drawer" role="dialog" aria-label="All tabs" ref={drawerRef} onScroll={e=>{drawerScrollRef.current=e.currentTarget.scrollTop;}} onClick={e=>e.stopPropagation()}>
                      <div className="cs-drawer-head">
                        <b>All tabs</b>
                        <button className="cs-x tfx-press" onClick={()=>setShowTabPicker(false)} aria-label="Close">✕</button>
                      </div>
                      {/* Appearance: light / dark */}
                      <div className="cs-drawer-sec">
                        <div className="tfx-eyebrow">Appearance</div>
                        <div className="ir-seg">
                          {[{m:"dark",label:"Dark"},{m:"light",label:"Light"}].map(o=>(
                            <button key={o.m} className={themeMode===o.m?"is-on":""} aria-pressed={themeMode===o.m} onClick={()=>{if(themeMode!==o.m)toggleTheme();}}>{o.label}</button>
                          ))}
                        </div>
                      </div>
                      {[
                        {label:"Home",ids:["profile"]},
                        {label:"Training",ids:["prs","weight","stretching","body"]},
                        {label:"Progress",ids:["attendance","leaderboard","prfeed","callouts","anvil","badges","recap"]},
                        {label:"Team & faith",ids:["mygroup","verse","prayer","bracelets"]},
                        {label:"More",ids:["surprise","mcastles","events","photos","notes","habits","private"]},
                      ].map(section=>(
                        <div key={section.label} className="cs-drawer-sec">
                          <div className="tfx-eyebrow">{section.label}</div>
                          <div className="cs-items">
                            {section.ids.map(id=>{
                              const t=TABS.find(x=>x.id===id);
                              if(!t)return null;
                              const active=tab===id;
                              const pinned=id==="profile"||validPinned.includes(id);
                              return(
                                <button key={id} data-active={active?"1":"0"} className={"cs-item tfx-press"+(active?" is-on":"")} aria-current={active?"page":undefined} onClick={()=>{slideDirRef.current=0;setTab(id);setShowTabPicker(false);}}>
                                  <span className="cs-item-ic">{ic(id,17)}</span>
                                  <span className="cs-item-lbl">{t.label}</span>
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
      </>
    );
  }
  return null;
}
// force redeploy Sat Apr 18 17:18:14 UTC 2026
