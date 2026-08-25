import { useState, useEffect, useRef, useLayoutEffect } from "react";
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
import AttendanceCalendar from "../components/AttendanceCalendar";
import NotesTab from "../components/NotesTab";
import DailyWord from "../components/DailyWord";
import ClassCountdown from "../components/ClassCountdown";
import GoalsCountdown from "../components/GoalsCountdown";
import GroupPhotos from "../components/GroupPhotos";
import AchievementBadges from "../components/AchievementBadges";
import MCastlesTab from "../components/MCastlesTab";
import AthleteEventsTab from "../components/AthleteEventsTab";
import SurpriseTab from "../components/SurpriseTab";
import Achievements from "../components/Achievements";
import SeasonRecap from "../components/SeasonRecap";
import TeamPRFeed from "../components/TeamPRFeed";
import InjuryBodyMap from "../components/InjuryBodyMap";
import HabitsTab from "../components/HabitsTab";
import Icon from "../components/Icon";
import { hTap, hSuccess, hError, hCelebrate } from "../lib/haptics";

import Head from "next/head";
import { supabase } from "../lib/supabase";

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
  const[bioAvail,setBioAvail]=useState(false);
  const[bioCredId,setBioCredId]=useState(null);
  const[bioDeclined,setBioDeclined]=useState(false);
  const[showBioOffer,setShowBioOffer]=useState(false);
  const[pendingNav,setPendingNav]=useState(null);
  const[bioRegistering,setBioRegistering]=useState(false);
  const[bioRegResult,setBioRegResult]=useState(null);
  const[showTabPicker,setShowTabPicker]=useState(false);
  const[themeMode,setThemeMode]=useState("dark");
  useEffect(()=>{try{setThemeMode(localStorage.getItem("tf_theme")==="light"?"light":"dark");}catch(e){}},[]);
  const toggleTheme=()=>setThemeMode(prev=>{const next=prev==="dark"?"light":"dark";try{localStorage.setItem("tf_theme",next);}catch(e){}if(typeof document!=="undefined")document.documentElement.setAttribute("data-theme",next==="light"?"light":"");return next;});
  const isLight=themeMode==="light";
  const[pinnedTabs,setPinnedTabs]=useState(["prs","attendance","weight"]);
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
  const[goalSaved,setGoalSaved]=useState({});
  const[goalText,setGoalText]=useState({});
  const[painLevel,setPainLevel]=useState(0);
  const athleticGoalRef=useRef();
  const characterGoalRef=useRef();
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

  const authenticateWithBiometric=async(ath)=>{
    const athlete=ath||selectedAthlete;
    try{
      const raw=localStorage.getItem("tf_bio_"+athlete.id);
      if(!raw)return false;
      const stored=JSON.parse(raw);
      const challenge=crypto.getRandomValues(new Uint8Array(32));
      const credIdBytes=Uint8Array.from(atob(stored.credId),c=>c.charCodeAt(0));
      const assertion=await navigator.credentials.get({
        publicKey:{
          challenge,
          rpId:stored.rpId||window.location.hostname,
          allowCredentials:[{type:"public-key",id:credIdBytes,transports:["internal"]}],
          userVerification:"required",
          hints:["client-device"], // prefer the on-device Face ID / Apple Passwords authenticator
          timeout:60000,
        }
      });
      if(assertion){
        const info=await doCheckin(athlete);
        setCheckinInfo(info);setPin("");
        if(info){setScreen("checkin");if(info.milestoneHit)setMilestone(info.milestoneHit);}
        else setScreen("profile");
        return true;
      }
    }catch(e){/* user cancelled — fall through to PIN */}
    return false;
  };

  const registerBiometric=async(fromProfile=false)=>{
    try{
      const challenge=crypto.getRandomValues(new Uint8Array(32));
      const credential=await navigator.credentials.create({
        publicKey:{
          challenge,
          rp:{name:"TF College Group",id:window.location.hostname},
          user:{
            id:new TextEncoder().encode(String(selectedAthlete.id)),
            name:selectedAthlete.name,
            displayName:selectedAthlete.name,
          },
          pubKeyCredParams:[{type:"public-key",alg:-7},{type:"public-key",alg:-257}],
          // platform + client-device hint keeps this on the built-in authenticator
          // (Face ID → Apple Passwords / iCloud Keychain), not Google or a cross-device passkey.
          authenticatorSelection:{authenticatorAttachment:"platform",userVerification:"required",residentKey:"required"},
          hints:["client-device"],
          timeout:60000,
        }
      });
      const credId=btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      localStorage.setItem("tf_bio_"+selectedAthlete.id,JSON.stringify({credId,rpId:window.location.hostname}));
      setBioCredId(credId);
    }catch(e){}
    if(!fromProfile){
      const nav=pendingNav;setPendingNav(null);setShowBioOffer(false);
      if(nav?.screen==="checkin"){setScreen("checkin");if(nav.milestone)setMilestone(nav.milestone);}
      else setScreen("profile");
    }
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
    if(editPin)patch.pin=editPin;
    try{
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
      const signupPayload={name,sport:signupSport.trim(),gender:signupGender,role:"iron",status:"active",pin:signupPin};
      if(signupCollege.trim())signupPayload.college=signupCollege.trim();
      if(signupYear)signupPayload.year=signupYear;
      const{data,error}=await supabase.from("athletes").insert(signupPayload).select().single();
      if(error){setSignupError(error.message);setSignupSaving(false);return;}
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
        try{
          const reg=await navigator.serviceWorker.getRegistration();
          if(reg?.active){const sub=await reg.pushManager.getSubscription();if(sub){setNotifCard("enabled");return;}}
        }catch(e){}
      }
      setNotifCard("idle");
    })();
  },[selectedAthlete]);

  const VAPID_KEY="BJH-bvrd9uoxQC76SpcJLkipflZHMbuN6ky8htrZ9Itd2-9o_2fqyEDb6WqglLStoE26XIT05CYI2KZ00eHL_XE";
  function urlB64ToUint8(b){const p="=".repeat((4-(b.length%4))%4);const s=(b+p).replace(/-/g,"+").replace(/_/g,"/");const r=atob(s);return Uint8Array.from([...r].map(c=>c.charCodeAt(0)));}

  const enableProfileNotif=async()=>{
    if(!selectedAthlete)return;
    setNotifLoading(true);
    try{
      const perm=await Notification.requestPermission();
      if(perm!=="granted"){setNotifCard("denied");setNotifLoading(false);return;}
      const reg=await navigator.serviceWorker.ready;
      const sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlB64ToUint8(VAPID_KEY)});
      const resp=await fetch("/api/subscribe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({athleteId:selectedAthlete.id,subscription:sub})});
      if(!resp.ok)throw new Error("save failed");
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

  const selectAthlete=async(a)=>{
    // Fire Face ID FIRST, synchronously within the tap gesture — no awaits before
    // navigator.credentials.get() so iOS keeps the user-activation and the prompt
    // appears instantly (an await here makes the sheet sluggish or require a 2nd tap).
    let bioRaw=null;try{bioRaw=localStorage.getItem("tf_bio_"+a.id);}catch(e){}
    const bioPromise=bioRaw?authenticateWithBiometric(a):null;

    setSelectedAthlete(a);
    setPin("");setPinError("");setPinStep("enter");setPinConfirm("");
    setFeedbackText("");setFeedbackSent(false);
    setPrayerText("");setPrayerSent(false);
    setInjuryText("");setInjurySent(false);setInjuryOpen(false);
    setGoalSaved({});setGoalText({});setMyVote(null);
    setTab("profile");setEditingPins(false);slideDirRef.current=0;
    try{const s=localStorage.getItem("tf_pinned_"+a.id);setPinnedTabs(s?JSON.parse(s):["prs","attendance","weight"]);}catch(e){setPinnedTabs(["prs","attendance","weight"]);}
    const defaultOrder=["profile","mcastles","events","verse","notes","attendance","mygroup","anvil","weight","body","prs","prfeed","stretching","leaderboard","prayer","bracelets","photos","habits","private"];
    try{const storedOrder=localStorage.getItem("tf_more_order_"+a.id);const raw=storedOrder?JSON.parse(storedOrder):defaultOrder;const seen=new Set();const initOrder=raw.filter(id=>{if(seen.has(id))return false;seen.add(id);return true;});const newTabs=defaultOrder.filter(id=>!seen.has(id));const fullOrder=[...initOrder,...newTabs];setMoreOrder(fullOrder);moreOrderRef.current=fullOrder;}catch(e){setMoreOrder(defaultOrder);moreOrderRef.current=defaultOrder;}

    // Show the PIN pad immediately as the base layer so it's already there if
    // Face ID is cancelled or unavailable (no awaited jump — matches coach).
    // If Face ID succeeds, authenticateWithBiometric navigates away over the top.
    setScreen("login");

    // Load supporting data in the background while Face ID is scanning.
    Promise.all([
      loadAttendance(a.id),
      (async()=>{try{const{data}=await supabase.from("athletes").select("*").eq("id",a.id).maybeSingle();if(data)setSelectedAthlete(data);}catch(e){}})(),
    ]).catch(()=>{});
    if(bioPromise)bioPromise.catch(()=>{});
  };

  const submitPin=async()=>{
    if(pin.length<4)return;
    // The roster list no longer carries pins (privacy), so fetch this athlete's
    // pin at login time if it isn't loaded yet — undefined must NOT be treated
    // as "no pin set" or it would silently overwrite an existing pin.
    let saved=selectedAthlete.pin;
    if(saved===undefined){
      try{const{data}=await supabase.from("athletes").select("pin").eq("id",selectedAthlete.id).maybeSingle();saved=data?(data.pin??null):null;}catch(e){saved=null;}
    }
    if(!saved||saved===""||saved===null){
      if(pinStep==="enter"){setPinConfirm(pin);setPin("");setPinStep("confirm");setPinError("");}
      else{
        if(pin===pinConfirm){
          await supabase.from("athletes").update({pin}).eq("id",selectedAthlete.id);
          setSelectedAthlete({...selectedAthlete,pin});
          const info=await doCheckin({...selectedAthlete,pin});
          setCheckinInfo(info);setPin("");
          if(bioAvail&&!bioCredId&&!bioDeclined){
            setPendingNav({screen:info?"checkin":"profile",milestone:info?.milestoneHit||null});
            setShowBioOffer(true);
          }else{
            if(info){setScreen("checkin");if(info.milestoneHit)setMilestone(info.milestoneHit);}
            else setScreen("profile");
          }
        } else {setPinError("PINs don't match. Try again.");setPin("");setPinStep("enter");setPinConfirm("");}
      }
    } else {
      if(pin===saved){
        const info=await doCheckin(selectedAthlete);
        setCheckinInfo(info);setPin("");setPinError("");
        if(bioAvail&&!bioCredId&&!bioDeclined){
          setPendingNav({screen:info?"checkin":"profile",milestone:info?.milestoneHit||null});
          setShowBioOffer(true);
        }else{
          if(info){setScreen("checkin");if(info.milestoneHit)setMilestone(info.milestoneHit);}
          else setScreen("profile");
        }
      } else {setPinError("Incorrect PIN. Try again.");setPin("");}
    }
  };

  useEffect(()=>{if(pin.length===4)submitPin();},[pin]);

  useEffect(()=>{
    if(screen==="profile"){
      // Poll the athlete row so group assignment updates automatically after the coach sets it
      pollRef.current=setInterval(async()=>{
        if(athleteIdRef.current){
          try{
            const{data}=await supabase.from("athletes").select("*").eq("id",athleteIdRef.current).maybeSingle();
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
      <div style={{minHeight:"100vh",background:"#080808",fontFamily:"Georgia, serif",maxWidth:480,margin:"0 auto",position:"relative",overflowX:"hidden"}}>
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
              <div style={{fontSize:10,color:"#E8720C",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:4,fontWeight:700}}>This week</div>
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
          <div style={{display:"flex",gap:6,marginBottom:10,background:"#0a0a0a",borderRadius:12,padding:4,border:"0.5px solid #1e1e1e"}}>
            {[{id:"active",label:"Active"},{id:"sleeping",label:"Sleeping"}].map(t=>{
              const count=athletes.filter(a=>t.id==="active"?a.status==="active":a.status==="sleeping").length;
              return(
                <button key={t.id} onClick={()=>setRosterTab(t.id)} style={{flex:1,padding:"10px 8px",borderRadius:9,border:"none",background:rosterTab===t.id?"linear-gradient(135deg,#E8720C,#C0392B)":"transparent",color:rosterTab===t.id?"#fff":"#555",fontSize:12,fontWeight:rosterTab===t.id?800:400,cursor:"pointer",fontFamily:"Georgia,serif",letterSpacing:rosterTab===t.id?"0.02em":"0",textTransform:rosterTab===t.id?"uppercase":"none",boxShadow:rosterTab===t.id?"0 2px 14px #E8720C44":"none",transition:"all 0.15s",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  {t.label}
                  <span style={{fontSize:10,fontWeight:700,opacity:rosterTab===t.id?0.75:0.4,background:"rgba(255,255,255,0.12)",borderRadius:6,padding:"1px 6px"}}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div style={{marginBottom:14,position:"relative"}}>
            <input type="text" placeholder="Search your name..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",padding:"13px 42px 13px 44px",borderRadius:12,border:"1px solid #252525",background:"#0a0a0a",color:"#fff",fontSize:14,fontFamily:"Georgia, serif",boxSizing:"border-box",outline:"none",letterSpacing:"-0.01em"}} autoComplete="off"/>
            <div style={{position:"absolute",left:15,top:"50%",transform:"translateY(-50%)",display:"flex",alignItems:"center"}}><Icon name="search" size={14} color="#333"/></div>
            {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"#1a1a1a",border:"none",color:"#666",fontSize:12,cursor:"pointer",width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>}
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
          {/* New here → self sign-up */}
          <button onClick={()=>{setSignupError("");setScreen("signup");}} style={{width:"100%",padding:"15px",borderRadius:14,border:"1px dashed #E8720C55",background:"linear-gradient(135deg,#140a02,#1a0d00)",color:"#E8720C",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"Georgia,serif",letterSpacing:"0.02em",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <span style={{fontSize:17,lineHeight:1}}>＋</span> New here? Create your profile
          </button>
          <div style={{textAlign:"center",fontSize:10,color:"#222",letterSpacing:"0.08em",textTransform:"uppercase"}}>TF College Group · Triple F Sports</div>
        </div>
      </div>
    </>
  );

  if(screen==="signup")return(
    <>
      <Head><title>Create Your Profile — TF College Group</title></Head>
      <div style={{minHeight:"100dvh",background:"#080808",fontFamily:"Georgia, serif",maxWidth:480,margin:"0 auto",position:"relative",overflowX:"hidden",padding:"0 0 3rem"}}>
        <div style={{position:"fixed",top:-120,left:"50%",transform:"translateX(-50%)",width:500,height:400,borderRadius:"50%",background:"radial-gradient(ellipse,#E8720C22 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{background:"linear-gradient(180deg,#0e0600 0%,#080808 100%)",borderBottom:"1px solid #1a0a00",padding:"1.5rem 1.5rem 1.75rem",position:"relative"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,transparent 0%,#E8720C 30%,#C0392B 70%,transparent 100%)"}}/>
          <button onClick={()=>setScreen("roster")} style={{background:"#0e0e0e",border:"0.5px solid #1e1e1e",color:"#555",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif",padding:"7px 14px",borderRadius:10,marginBottom:18}}>← Back</button>
          <div style={{width:72,height:72,borderRadius:22,background:"linear-gradient(145deg,#E8720C,#C0392B,#8B0000)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:38,boxShadow:"0 0 60px #E8720C44",marginBottom:14}}>⚒</div>
          <div style={{fontSize:26,fontWeight:900,color:"#fff",letterSpacing:"-0.02em",textTransform:"uppercase"}}>Create your profile</div>
          <div style={{fontSize:12,color:"#E8720C",letterSpacing:"0.04em",marginTop:4}}>Join the College Group · takes 20 seconds</div>
        </div>

        <div style={{padding:"1.5rem 1.25rem",position:"relative",display:"flex",flexDirection:"column",gap:16}}>
          {/* Name */}
          <div>
            <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700,marginBottom:7}}>Your name</div>
            <input type="text" value={signupName} onChange={e=>setSignupName(e.target.value)} placeholder="First & last name" autoComplete="off"
              style={{width:"100%",padding:"14px",borderRadius:12,border:"1px solid #252525",background:"#0d0d0d",color:"#fff",fontSize:16,fontFamily:"Georgia,serif",boxSizing:"border-box",outline:"none"}}/>
          </div>
          {/* Team / gender */}
          <div>
            <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700,marginBottom:7}}>Strength standards</div>
            <div style={{display:"flex",gap:8}}>
              {[{id:"male",label:"Men's"},{id:"female",label:"Women's"}].map(g=>(
                <button key={g.id} onClick={()=>setSignupGender(g.id)} style={{flex:1,padding:"13px",borderRadius:12,border:"1px solid "+(signupGender===g.id?"#E8720C":"#252525"),background:signupGender===g.id?"linear-gradient(135deg,#E8720C22,#C0392B22)":"#0d0d0d",color:signupGender===g.id?"#E8720C":"#666",fontSize:14,fontWeight:signupGender===g.id?800:500,cursor:"pointer",fontFamily:"Georgia,serif"}}>{g.label}</button>
              ))}
            </div>
            <div style={{fontSize:10,color:"#444",marginTop:6}}>Used only to scale your strength benchmarks. Coach sets your group later.</div>
          </div>
          {/* Sport */}
          <div>
            <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700,marginBottom:7}}>Sport / position <span style={{color:"#444",textTransform:"none",letterSpacing:0}}>· optional</span></div>
            <input type="text" value={signupSport} onChange={e=>setSignupSport(e.target.value)} placeholder="e.g. Baseball · OF" autoComplete="off"
              style={{width:"100%",padding:"14px",borderRadius:12,border:"1px solid #252525",background:"#0d0d0d",color:"#fff",fontSize:16,fontFamily:"Georgia,serif",boxSizing:"border-box",outline:"none"}}/>
          </div>
          {/* College */}
          <div>
            <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700,marginBottom:7}}>College</div>
            <input type="text" value={signupCollege} onChange={e=>setSignupCollege(e.target.value)} placeholder="e.g. University of Tennessee" autoComplete="off"
              style={{width:"100%",padding:"14px",borderRadius:12,border:"1px solid #252525",background:"#0d0d0d",color:"#fff",fontSize:16,fontFamily:"Georgia,serif",boxSizing:"border-box",outline:"none"}}/>
          </div>
          {/* Year */}
          <div>
            <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700,marginBottom:7}}>Year</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {["Freshman","Sophomore","Junior","Senior","5th Year","Grad"].map(y=>(
                <button key={y} onClick={()=>setSignupYear(signupYear===y?"":y)} style={{padding:"11px 15px",borderRadius:11,border:"1px solid "+(signupYear===y?"#E8720C":"#252525"),background:signupYear===y?"linear-gradient(135deg,#E8720C22,#C0392B22)":"#0d0d0d",color:signupYear===y?"#E8720C":"#666",fontSize:13,fontWeight:signupYear===y?800:500,cursor:"pointer",fontFamily:"Georgia,serif"}}>{y}</button>
              ))}
            </div>
          </div>
          {/* PIN */}
          <div style={{display:"flex",gap:10}}>
            <div style={{flex:1}}>
              <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700,marginBottom:7}}>Create a 4-digit PIN</div>
              <input type="password" inputMode="numeric" maxLength={4} value={signupPin} onChange={e=>setSignupPin(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="••••"
                style={{width:"100%",padding:"14px",borderRadius:12,border:"1px solid #252525",background:"#0d0d0d",color:"#fff",fontSize:18,fontFamily:"Georgia,serif",boxSizing:"border-box",outline:"none",textAlign:"center",letterSpacing:"0.3em"}}/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700,marginBottom:7}}>Confirm PIN</div>
              <input type="password" inputMode="numeric" maxLength={4} value={signupPinConfirm} onChange={e=>setSignupPinConfirm(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="••••"
                style={{width:"100%",padding:"14px",borderRadius:12,border:"1px solid #252525",background:"#0d0d0d",color:"#fff",fontSize:18,fontFamily:"Georgia,serif",boxSizing:"border-box",outline:"none",textAlign:"center",letterSpacing:"0.3em"}}/>
            </div>
          </div>
          {signupError&&<div style={{fontSize:12,color:"#ff6b6b",background:"#1a0707",borderRadius:10,padding:"10px 14px",border:"1px solid #3a0a0a"}}>{signupError}</div>}
          <button onClick={createAccount} disabled={signupSaving} style={{width:"100%",padding:"16px",borderRadius:14,border:"none",background:signupSaving?"#1a1a1a":"linear-gradient(135deg,#E8720C,#C0392B)",color:"#fff",fontSize:15,fontWeight:800,cursor:signupSaving?"default":"pointer",fontFamily:"Georgia,serif",letterSpacing:"0.03em",boxShadow:signupSaving?"none":"0 6px 22px #E8720C44",marginTop:4}}>
            {signupSaving?"Creating…":"Create profile & enter →"}
          </button>
          <div style={{textAlign:"center",fontSize:10.5,color:"#444",lineHeight:1.6}}>Already have a profile? <span onClick={()=>setScreen("roster")} style={{color:"#E8720C",cursor:"pointer",fontWeight:700}}>Find your name</span> on the list instead.</div>
        </div>
      </div>
    </>
  );

  if(screen==="login")return(
    <>
      <Head><title>Sign In — TF College Group</title></Head>
      <div style={{height:"100dvh",background:"#080808",fontFamily:"Georgia, serif",maxWidth:480,margin:"0 auto",textAlign:"center",position:"relative",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 1.5rem",overflow:"hidden"}}>
        <div style={{position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",width:560,height:400,background:"radial-gradient(ellipse at top,"+(isForge?"#C0392B18":"#4a5a6618")+" 0%,transparent 65%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,transparent,"+(isForge?"#C0392B,#E8720C":"#505a66,#8a9aa4")+",transparent)"}}/>
        <button onClick={()=>setScreen("roster")} style={{position:"absolute",top:16,left:16,background:"#111",border:"0.5px solid #222",color:"#555",fontSize:11,cursor:"pointer",fontFamily:"Georgia, serif",padding:"7px 14px",borderRadius:10}}>← Back</button>

        {/* Role pill */}
        <div style={{fontSize:9,fontWeight:800,color:isForge?RED:STEEL,textTransform:"uppercase",letterSpacing:"0.2em",marginBottom:18,background:(isForge?RED:STEEL)+"15",padding:"4px 14px",borderRadius:20,border:"0.5px solid "+(isForge?RED:STEEL)+"33"}}>
          {isForge?"⚔ The Forge":"⚒ The Iron"}
        </div>

        {/* Avatar */}
        <div style={{position:"relative",marginBottom:18}}>
          <div style={{position:"absolute",inset:-8,borderRadius:"50%",border:"1px solid "+(isForge?RED:STEEL)+"40",pointerEvents:"none"}}/>
          <div style={{position:"absolute",inset:-16,borderRadius:"50%",border:"0.5px solid "+(isForge?RED:STEEL)+"18",pointerEvents:"none"}}/>
          <div style={{width:84,height:84,borderRadius:"50%",background:isForge?"linear-gradient(145deg,#E8720C,"+RED+",#8B0000)":"linear-gradient(145deg,#8a9aa4,"+STEEL+",#404a55)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,fontWeight:900,color:"#fff",overflow:"hidden",boxShadow:"0 0 60px "+(isForge?RED:STEEL)+"55,0 0 120px "+(isForge?RED:STEEL)+"18"}}>
            {selectedAthlete?.photo_url?<img src={selectedAthlete.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:selectedAthlete?.name[0]}
          </div>
        </div>

        {/* Name */}
        <div style={{fontSize:26,fontWeight:900,color:"#fff",marginBottom:5,letterSpacing:"-0.02em",textTransform:"uppercase"}}>
          {!selectedAthlete?.pin?(selectedAthlete?.name||"").split(" ")[0]:pinStep==="confirm"?"Confirm PIN":(selectedAthlete?.name||"").split(" ")[0]}
        </div>
        <div style={{fontSize:12,color:"#555",marginBottom:28,letterSpacing:"0.05em"}}>
          {!selectedAthlete?.pin?"Create a 4-digit PIN":pinStep==="confirm"?"Enter the same 4 digits":"Enter your PIN to check in"}
        </div>

        {/* Biometric shortcut — shown when credential stored */}
        {bioCredId&&!showBioOffer&&(
          <div style={{marginBottom:22,display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
            <button onClick={()=>authenticateWithBiometric()}
              style={{display:"flex",alignItems:"center",gap:10,padding:"14px 28px",
                borderRadius:16,border:"1px solid "+(isForge?RED:STEEL)+"44",
                background:(isForge?RED:STEEL)+"12",color:"#fff",fontSize:15,fontWeight:700,
                cursor:"pointer",fontFamily:"Georgia,serif",letterSpacing:"0.02em",
                boxShadow:"0 0 24px "+(isForge?RED:STEEL)+"22"}}>
              <Icon name="faceId" size={24} color="#fff"/>
              <span>Use {(()=>{const ua=navigator.userAgent||"";return/iPhone|iPad|iPod/.test(ua)?"Face ID / Touch ID":/Mac/.test(ua)?"Touch ID":/Android/.test(ua)?"Fingerprint":"Biometrics";})()}</span>
            </button>
            <button onClick={()=>{
              try{localStorage.removeItem("tf_bio_"+selectedAthlete.id);}catch(e){}
              setBioCredId(null);
            }} style={{background:"transparent",border:"none",color:"#333",fontSize:11,
              cursor:"pointer",fontFamily:"Georgia,serif",textDecoration:"underline",padding:"2px 8px"}}>
              Remove saved login
            </button>
          </div>
        )}

        {showBioOffer?(
          /* Bio enroll offer — replaces keypad after first PIN success */
          <div style={{width:"100%",maxWidth:320,textAlign:"center"}}>
            <div style={{marginBottom:14,display:"flex",justifyContent:"center"}}><Icon name="faceId" size={42} color={isForge?RED:STEEL}/></div>
            <div style={{fontSize:18,fontWeight:800,color:"#fff",marginBottom:8,letterSpacing:"-0.01em"}}>Enable Biometrics?</div>
            <div style={{fontSize:12,color:"#555",marginBottom:28,lineHeight:1.6}}>
              Skip the PIN next time. Sign in instantly with your fingerprint or face.
            </div>
            <button onClick={registerBiometric}
              style={{width:"100%",padding:"14px",borderRadius:12,border:"none",
                background:"linear-gradient(135deg,"+(isForge?"#E8720C,"+RED:"#8a9aa4,"+STEEL)+")",
                color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",
                fontFamily:"Georgia,serif",letterSpacing:"0.04em",marginBottom:12,
                boxShadow:"0 4px 24px "+(isForge?RED:STEEL)+"44"}}>
              Enable Biometrics
            </button>
            <button onClick={()=>{
              try{localStorage.setItem("tf_bio_declined_"+selectedAthlete.id,"1");}catch(e){}
              setBioDeclined(true);
              const nav=pendingNav;setPendingNav(null);setShowBioOffer(false);
              if(nav?.screen==="checkin"){setScreen("checkin");if(nav.milestone)setMilestone(nav.milestone);}
              else setScreen("profile");
            }} style={{width:"100%",padding:"12px",borderRadius:12,border:"0.5px solid #222",
              background:"transparent",color:"#444",fontSize:13,fontWeight:500,
              cursor:"pointer",fontFamily:"Georgia,serif"}}>
              Not now
            </button>
          </div>
        ):(
          <>
            {/* PIN dots */}
            <div style={{display:"flex",justifyContent:"center",gap:18,marginBottom:28}}>
              {[0,1,2,3].map(i=>(
                <div key={i} style={{width:18,height:18,borderRadius:"50%",border:"2px solid "+(isForge?RED:STEEL)+(i<pin.length?"":"33"),background:i<pin.length?(isForge?"linear-gradient(135deg,#E8720C,"+RED+")":"linear-gradient(135deg,#8a9aa4,"+STEEL+")"):"transparent",transition:"all 0.15s",boxShadow:i<pin.length?"0 0 14px "+(isForge?RED:STEEL)+"99":"none"}}/>
              ))}
            </div>
            {/* Keypad */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,width:"100%",maxWidth:300,margin:"0 auto"}}>
              {[1,2,3,4,5,6,7,8,9,null,0,"⌫"].map((k,i)=>(
                <button key={i} onClick={()=>{
                  if(k===null)return;
                  if(k==="⌫"){setPin(p=>p.slice(0,-1));return;}
                  if(pin.length<4)setPin(p=>p+String(k));
                }} style={{padding:"20px 8px",borderRadius:14,border:"0.5px solid "+(k===null?"transparent":isLight?"rgba(0,0,0,0.22)":"#222"),background:k===null?"transparent":isLight?(k==="⌫"?"#eef0f4":"#ffffff"):(k==="⌫"?"#161616":"#131313"),fontSize:26,fontWeight:500,cursor:k===null?"default":"pointer",color:k==="⌫"?(isLight?"#767d87":"#666"):(isLight?"#16191f":"#ebebeb"),fontFamily:"sans-serif",transition:"background 0.1s",lineHeight:1,boxShadow:k===null?"none":isLight?"0 1px 3px rgba(0,0,0,0.08)":"none"}}>
                  {k===null?"":k}
                </button>
              ))}
            </div>
            {pinError&&<div style={{marginTop:16,fontSize:12,color:"#ff5555",padding:"9px 18px",background:"#1a0505",borderRadius:10,border:"1px solid #3a0808"}}>{pinError}</div>}
          </>
        )}
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

    // Theme-aware colors for the edit-profile sheet (its custom shades aren't in the CSS light-map)
    const mSheet=isLight?"#ffffff":"linear-gradient(180deg,#12121c,#0b0b12)";
    const mText=isLight?"#16191f":"#fff";
    const mField=isLight?"#f4f5f8":"#0d0d14";
    const mBorder=isLight?"rgba(0,0,0,0.16)":"#2a2a3a";
    const mHandle=isLight?"rgba(0,0,0,0.18)":"rgba(255,255,255,0.18)";
    const mChipBg=isLight?"rgba(0,0,0,0.05)":"rgba(255,255,255,0.05)";
    const mChipBorder=isLight?"rgba(0,0,0,0.14)":"rgba(255,255,255,0.14)";

    return(
      <>
        <style>{`@keyframes tfSlideFromRight{from{transform:translateX(52px) scale(0.98);opacity:0}to{transform:translateX(0) scale(1);opacity:1}}@keyframes tfSlideFromLeft{from{transform:translateX(-52px) scale(0.98);opacity:0}to{transform:translateX(0) scale(1);opacity:1}}@keyframes tfJiggle{0%{transform:rotate(-1.5deg) scale(1.03)}100%{transform:rotate(1.5deg) scale(1.03)}}`}</style>
        <Head><title>{selectedAthlete.name} — TF College Group</title></Head>
        {milestone&&(
          <div onClick={()=>setMilestone(null)} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem"}}>
            <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:400,height:400,background:"radial-gradient(circle,"+milestone.color+"22 0%,transparent 70%)",pointerEvents:"none"}}/>
            <div style={{textAlign:"center",position:"relative"}}>
              <div style={{fontSize:80,marginBottom:20,lineHeight:1}}>{milestone.icon}</div>
              <div style={{fontSize:11,color:milestone.color,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:8}}>Milestone reached</div>
              <div style={{fontSize:32,fontWeight:900,color:"#fff",letterSpacing:"-0.02em",marginBottom:12,lineHeight:1.1}}>{milestone.headline}</div>
              <div style={{fontSize:15,color:"#888",marginBottom:32,lineHeight:1.6,maxWidth:260,margin:"0 auto 32px"}}>{milestone.msg}</div>
              <button onClick={()=>setMilestone(null)} style={{padding:"14px 32px",borderRadius:16,border:"none",background:"linear-gradient(135deg,"+milestone.color+","+milestone.color+"aa)",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"Georgia,serif",letterSpacing:"0.02em"}}>Let's go →</button>
            </div>
          </div>
        )}
        {editOpen&&(
          <div onClick={()=>!editSaving&&setEditOpen(false)} style={{position:"fixed",inset:0,zIndex:9997,background:"rgba(0,0,0,0.82)",backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)",display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"0"}}>
            <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:480,background:mSheet,borderTopLeftRadius:24,borderTopRightRadius:24,borderTop:"1px solid "+mChipBorder,padding:"10px 22px 32px",maxHeight:"92dvh",overflowY:"auto",boxShadow:"0 -20px 60px rgba(0,0,0,0.6)"}}>
              <div style={{width:40,height:4,borderRadius:2,background:mHandle,margin:"0 auto 18px"}}/>
              <div style={{fontSize:20,fontWeight:900,color:mText,letterSpacing:"-0.02em",marginBottom:20}}>Edit profile</div>
              {/* Photo */}
              <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
                <div style={{width:66,height:66,borderRadius:"50%",background:isForge?"linear-gradient(145deg,#E8720C,"+RED+")":"linear-gradient(145deg,#8a9aa4,"+STEEL+")",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:900,color:"#fff",overflow:"hidden",flexShrink:0}}>
                  {selectedAthlete.photo_url?<img src={selectedAthlete.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(editName||selectedAthlete.name||"?")[0]}
                </div>
                <label style={{padding:"11px 18px",borderRadius:11,border:"1px solid "+mChipBorder,background:mChipBg,color:mText,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                  {editPhotoBusy?"Uploading…":"📷 Change photo"}
                  <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)onEditPhoto(f);e.target.value="";}}/>
                </label>
              </div>
              {/* Name */}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700,marginBottom:7}}>Name</div>
                <input type="text" value={editName} onChange={e=>setEditName(e.target.value)} style={{width:"100%",padding:"13px",borderRadius:11,border:"1px solid "+mBorder,background:mField,color:mText,fontSize:16,fontFamily:"Georgia,serif",boxSizing:"border-box",outline:"none"}}/>
              </div>
              {/* Sport */}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700,marginBottom:7}}>Sport / position</div>
                <input type="text" value={editSport} onChange={e=>setEditSport(e.target.value)} placeholder="e.g. Baseball · OF" style={{width:"100%",padding:"13px",borderRadius:11,border:"1px solid "+mBorder,background:mField,color:mText,fontSize:16,fontFamily:"Georgia,serif",boxSizing:"border-box",outline:"none"}}/>
              </div>
              {/* College */}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700,marginBottom:7}}>College</div>
                <input type="text" value={editCollege} onChange={e=>setEditCollege(e.target.value)} placeholder="e.g. University of Tennessee" style={{width:"100%",padding:"13px",borderRadius:11,border:"1px solid "+mBorder,background:mField,color:mText,fontSize:16,fontFamily:"Georgia,serif",boxSizing:"border-box",outline:"none"}}/>
              </div>
              {/* Year */}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700,marginBottom:7}}>Year</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {["Freshman","Sophomore","Junior","Senior","5th Year","Grad"].map(y=>(
                    <button key={y} onClick={()=>setEditYear(editYear===y?"":y)} style={{padding:"10px 14px",borderRadius:10,border:"1px solid "+(editYear===y?"#E8720C":mBorder),background:editYear===y?"linear-gradient(135deg,#E8720C22,#C0392B22)":mField,color:editYear===y?"#E8720C":(isLight?"#5b626c":"#888"),fontSize:13,fontWeight:editYear===y?800:500,cursor:"pointer",fontFamily:"Georgia,serif"}}>{y}</button>
                  ))}
                </div>
              </div>
              {/* PIN change */}
              <div style={{marginBottom:16}}>
                <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700,marginBottom:7}}>Change PIN <span style={{color:"#666",textTransform:"none",letterSpacing:0}}>· leave blank to keep current</span></div>
                <div style={{display:"flex",gap:10}}>
                  <input type="password" inputMode="numeric" maxLength={4} value={editPin} onChange={e=>setEditPin(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="New PIN" style={{flex:1,padding:"13px",borderRadius:11,border:"1px solid "+mBorder,background:mField,color:mText,fontSize:16,fontFamily:"Georgia,serif",boxSizing:"border-box",outline:"none",textAlign:"center",letterSpacing:"0.25em"}}/>
                  <input type="password" inputMode="numeric" maxLength={4} value={editPinConfirm} onChange={e=>setEditPinConfirm(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="Confirm" style={{flex:1,padding:"13px",borderRadius:11,border:"1px solid "+mBorder,background:mField,color:mText,fontSize:16,fontFamily:"Georgia,serif",boxSizing:"border-box",outline:"none",textAlign:"center",letterSpacing:"0.25em"}}/>
                </div>
              </div>
              {editMsg&&<div style={{fontSize:12,color:"#ff6b6b",background:"#1a0707",borderRadius:10,padding:"9px 13px",border:"1px solid #3a0a0a",marginBottom:14}}>{editMsg}</div>}
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>!editSaving&&setEditOpen(false)} style={{flex:1,padding:"14px",borderRadius:12,border:"1px solid "+mChipBorder,background:"transparent",color:isLight?"#5b626c":"#999",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif"}}>Cancel</button>
                <button onClick={saveProfile} disabled={editSaving} style={{flex:2,padding:"14px",borderRadius:12,border:"none",background:editSaving?"#1a1a1a":"linear-gradient(135deg,"+(isForge?"#E8720C,"+RED:"#8a9aa4,"+STEEL)+")",color:"#fff",fontSize:14,fontWeight:800,cursor:editSaving?"default":"pointer",fontFamily:"Georgia,serif",letterSpacing:"0.02em"}}>{editSaving?"Saving…":"Save changes"}</button>
              </div>
            </div>
          </div>
        )}
        <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} style={{minHeight:"100vh",background:"linear-gradient(160deg,#06060f 0%,#0a0608 50%,#080808 100%)",fontFamily:"Georgia, serif",maxWidth:480,margin:"0 auto"}}>
          {/* Profile header */}
          <div style={{background:"linear-gradient(180deg,#0e0e1c 0%,#0a0a14 100%)",borderBottom:"1px solid rgba(255,255,255,0.08)",position:"relative",overflow:"hidden"}}>
            {/* Top accent */}
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,"+(isForge?"rgba(232,114,12,0.9),rgba(192,57,43,0.8)":"rgba(96,106,117,0.8),rgba(138,154,164,0.9)")+",transparent)"}}/>
            {/* Ambient glow */}
            <div style={{position:"absolute",top:-40,right:-40,width:220,height:220,borderRadius:"50%",background:isForge?"rgba(232,114,12,0.06)":"rgba(138,154,164,0.06)",filter:"blur(50px)",pointerEvents:"none"}}/>
            {/* Nav row */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px 10px",position:"relative"}}>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <button onClick={()=>setScreen("roster")} style={{background:"rgba(255,255,255,0.06)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.5)",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif",padding:"6px 14px",borderRadius:20,letterSpacing:"0.02em"}}>← Switch</button>
                <a href="/" style={{background:"rgba(255,255,255,0.06)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:20,color:"rgba(255,255,255,0.5)",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif",padding:"6px 12px",textDecoration:"none"}}>🏠</a>
                <a href="/coach" style={{background:"rgba(255,255,255,0.06)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:20,color:"rgba(255,255,255,0.5)",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif",padding:"6px 12px",textDecoration:"none"}}>⚒</a>
              </div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.15)",letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:600}}>TF College Group</div>
            </div>
            {/* Identity banner */}
            <div style={{display:"flex",alignItems:"center",gap:16,padding:"4px 16px 16px",position:"relative"}}>
              <div onClick={openEditProfile} style={{position:"relative",flexShrink:0,cursor:"pointer"}}>
                <div style={{position:"absolute",inset:-5,borderRadius:"50%",border:"1px solid "+(isForge?RED:STEEL)+"44",pointerEvents:"none"}}/>
                <div style={{width:70,height:70,borderRadius:"50%",background:isForge?"linear-gradient(145deg,#E8720C,"+RED+",#8B0000)":"linear-gradient(145deg,#8a9aa4,"+STEEL+",#404a55)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:900,color:"#fff",overflow:"hidden",boxShadow:"0 0 30px "+(isForge?RED:STEEL)+"44"}}>
                  {selectedAthlete.photo_url?<img src={selectedAthlete.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";}}/>:selectedAthlete.name[0]}
                </div>
                <div style={{position:"absolute",bottom:-2,right:-2,width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#E8720C,#C0392B)",border:"2px solid #0a0a14",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,boxShadow:"0 2px 8px rgba(0,0,0,0.5)"}}>✎</div>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:22,fontWeight:900,color:"#fff",letterSpacing:"-0.02em",lineHeight:1.1,textTransform:"uppercase"}}>{selectedAthlete.name}</div>
                {selectedAthlete.sport&&<div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:3,letterSpacing:"0.04em"}}>{selectedAthlete.sport}</div>}
                {(selectedAthlete.college||selectedAthlete.year)&&(
                  <div style={{fontSize:10.5,color:"rgba(255,255,255,0.42)",marginTop:4,letterSpacing:"0.03em",display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    {selectedAthlete.college&&<span style={{display:"flex",alignItems:"center",gap:4}}>🎓 {selectedAthlete.college}</span>}
                    {selectedAthlete.college&&selectedAthlete.year&&<span style={{color:"rgba(255,255,255,0.2)"}}>·</span>}
                    {selectedAthlete.year&&<span style={{color:GOLD,fontWeight:700}}>{selectedAthlete.year}</span>}
                  </div>
                )}
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:9,fontWeight:800,color:isForge?RED:STEEL,textTransform:"uppercase",letterSpacing:"0.12em",background:(isForge?RED:STEEL)+"18",padding:"4px 12px",borderRadius:20,border:"0.5px solid "+(isForge?RED:STEEL)+"44",marginBottom:5,display:"inline-block",whiteSpace:"nowrap"}}>{isForge?"⚔ Forge":"⚒ Iron"}</div>
                {streak>0&&<div style={{fontSize:11,color:GREEN,fontWeight:700,display:"flex",alignItems:"center",gap:3,justifyContent:"flex-end"}}><Icon name="flame" size={11} color={GREEN}/>{streak}-day</div>}
              </div>
            </div>
          </div>

          <div key={tab} style={{padding:"1.25rem",background:"transparent",minHeight:"60vh",paddingBottom:"110px",animation:slideDirRef.current>0?"tfSlideFromRight 0.32s cubic-bezier(0.22,1,0.36,1) backwards":slideDirRef.current<0?"tfSlideFromLeft 0.32s cubic-bezier(0.22,1,0.36,1) backwards":"none"}}>

            {tab==="profile"&&(
              <div>
                {(()=>{const _est=nowEST();const _d=_est.getDay();const isClassDay=[1,2,4,5].includes(_d);if(!isClassDay)return null;const isMonFri=_d===1||_d===5;return(<div style={{background:"linear-gradient(135deg,#C0392B,#8B1A1A)",borderRadius:12,padding:"12px 16px",marginBottom:12,border:"1px solid #C0392B44",display:"flex",alignItems:"center",justifyContent:"space-between"}}><div><div style={{fontSize:13,fontWeight:700,color:"#fff"}}>⚒ Class day — be early!</div><div style={{fontSize:11,color:"#ffaaaa"}}>Doors open at {isMonFri?"8:30am":"9:00am"} · On time is late</div></div><Icon name="zap" size={22} color="rgba(255,255,255,0.6)"/></div>);})()}
                {weightLoggedToday===false&&(
                  <div onClick={()=>{slideDirRef.current=0;setTab("weight");}} style={{background:"linear-gradient(135deg,#1a3a1a,#0e240e)",borderRadius:12,padding:"12px 16px",marginBottom:12,border:"1px solid "+GREEN+"44",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>Weigh-in day</div>
                      <div style={{fontSize:11,color:GREEN}}>Tap to log your weight → stay on track</div>
                    </div>
                    <Icon name="barChart" size={22} color={GREEN}/>
                  </div>
                )}
                {habitsDoneToday===false&&(
                  <div onClick={()=>{slideDirRef.current=0;setTab("habits");}} style={{background:"linear-gradient(135deg,#1a1330,#100a22)",borderRadius:12,padding:"12px 16px",marginBottom:12,border:"1px solid "+PUR+"55",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>Log today's habits</div>
                      <div style={{fontSize:11,color:"#b9a6ff"}}>Water · nutrition · sleep → keep your streak alive</div>
                    </div>
                    <div style={{fontSize:20}}>💧</div>
                  </div>
                )}
                {/* Recent team PRs — hype feed (hidden until there's at least one) */}
                <div style={{marginBottom:14}}>
                  <TeamPRFeed athletes={athletes} currentAthleteId={selectedAthlete.id} compact onSeeAll={()=>{slideDirRef.current=0;setTab("prfeed");}}/>
                </div>
                {/* Push notification setup card — shown until enabled */}
                {notifCard==="idle"&&(
                  <div style={{background:"#111",borderRadius:12,padding:"12px 16px",marginBottom:12,border:"1px solid #1e2a1e",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                    <div>
                      <div style={{fontSize:12,fontWeight:700,color:"#fff",marginBottom:2}}>Lock screen reminders</div>
                      <div style={{fontSize:10,color:"#555"}}>Get notified to log weight on class days</div>
                    </div>
                    <button onClick={enableProfileNotif} disabled={notifLoading} style={{padding:"8px 14px",borderRadius:8,border:"none",background:"linear-gradient(135deg,"+GREEN+","+GREEN+"aa)",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif",flexShrink:0,whiteSpace:"nowrap"}}>
                      {notifLoading?"...":"Enable →"}
                    </button>
                  </div>
                )}
                {notifCard==="ios-browser"&&(
                  <div style={{background:"#111",borderRadius:12,padding:"12px 16px",marginBottom:12,border:"1px solid #1e2a1e"}}>
                    <div style={{display:"flex",alignItems:"center",gap:7,fontSize:12,fontWeight:700,color:"#fff",marginBottom:6}}><Icon name="bell" size={13} color="#fff"/>Get lock screen reminders</div>
                    <div style={{fontSize:11,color:"#888",lineHeight:1.6,marginBottom:8}}>
                      On iPhone, add this app to your Home Screen first:<br/>
                      <span style={{color:"#aaa"}}>Tap <strong style={{color:"#fff"}}>Share</strong> → <strong style={{color:"#fff"}}>Add to Home Screen</strong> → open from there</span>
                    </div>
                    <div style={{fontSize:10,color:"#555"}}>Then tap Enable inside the app to get notifications</div>
                  </div>
                )}
                {notifCard==="denied"&&(
                  <div style={{background:"#111",borderRadius:12,padding:"12px 16px",marginBottom:12,border:"1px solid #2a1e1e",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:7,fontSize:12,fontWeight:700,color:"#fff",marginBottom:2}}><Icon name="bell" size={13} color="#fff"/>Notifications blocked</div>
                      <div style={{fontSize:10,color:"#555"}}>Enable in your browser or phone settings</div>
                    </div>
                    <div style={{fontSize:10,color:"#555",flexShrink:0}}>Settings → Safari/Chrome</div>
                  </div>
                )}
                {bioAvail&&!bioCredId&&(
                  <div style={{background:"#111",borderRadius:12,padding:"12px 16px",marginBottom:12,border:"1px solid #1e2a3a"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:7,fontSize:12,fontWeight:700,color:"#fff",marginBottom:2}}><Icon name="faceId" size={13} color="#fff"/>Enable Face ID / Touch ID</div>
                        <div style={{fontSize:10,color:"#555"}}>Sign in instantly — skip the PIN next time</div>
                      </div>
                      <button disabled={bioRegistering} onClick={async()=>{
                        setBioRegistering(true);setBioRegResult(null);
                        try{localStorage.removeItem("tf_bio_declined_"+selectedAthlete.id);}catch(e){}
                        try{localStorage.removeItem("tf_bio_"+selectedAthlete.id);}catch(e){}
                        setBioDeclined(false);setBioCredId(null);
                        await registerBiometric(true);
                        const stored=localStorage.getItem("tf_bio_"+selectedAthlete.id);
                        if(stored){setBioRegResult("success");}else{setBioRegResult("failed");}
                        setBioRegistering(false);
                      }} style={{padding:"8px 14px",borderRadius:10,border:"none",background:bioRegistering?"#222":"linear-gradient(135deg,"+(isForge?"#E8720C,"+RED:"#8a9aa4,"+STEEL)+")",color:bioRegistering?"#555":"#fff",fontSize:12,fontWeight:700,cursor:bioRegistering?"default":"pointer",fontFamily:"Georgia,serif",whiteSpace:"nowrap",flexShrink:0}}>
                        {bioRegistering?"Setting up…":"Enable"}
                      </button>
                    </div>
                    {bioRegResult==="success"&&<div style={{fontSize:11,color:GREEN,fontWeight:700,marginTop:8}}>✓ Face ID enabled — use it next time you log in</div>}
                    {bioRegResult==="failed"&&<div style={{fontSize:11,color:"#e05",marginTop:8}}>Setup failed — make sure Face ID is enabled in your phone settings and try again</div>}
                  </div>
                )}
                {bioAvail&&bioCredId&&(
                  <div style={{background:"#111",borderRadius:12,padding:"12px 16px",marginBottom:12,border:"1px solid #1e2a3a"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:7,fontSize:12,fontWeight:700,color:"#fff",marginBottom:2}}><Icon name="faceId" size={13} color="#fff"/>Face ID / Touch ID enabled</div>
                        <div style={{fontSize:10,color:"#555"}}>Reset to re-register with Apple Passwords</div>
                      </div>
                      <button disabled={bioRegistering} onClick={async()=>{
                        setBioRegistering(true);setBioRegResult(null);
                        try{localStorage.removeItem("tf_bio_declined_"+selectedAthlete.id);}catch(e){}
                        try{localStorage.removeItem("tf_bio_"+selectedAthlete.id);}catch(e){}
                        setBioDeclined(false);setBioCredId(null);
                        await registerBiometric(true);
                        const stored=localStorage.getItem("tf_bio_"+selectedAthlete.id);
                        if(stored){setBioRegResult("success");}else{setBioRegResult("failed");}
                        setBioRegistering(false);
                      }} style={{padding:"8px 14px",borderRadius:10,border:"none",background:bioRegistering?"#222":"#1a1a1a",color:bioRegistering?"#555":"#888",fontSize:12,fontWeight:700,cursor:bioRegistering?"default":"pointer",fontFamily:"Georgia,serif",whiteSpace:"nowrap",flexShrink:0,border:"0.5px solid #333"}}>
                        {bioRegistering?"Resetting…":"Reset →"}
                      </button>
                    </div>
                    {bioRegResult==="success"&&<div style={{fontSize:11,color:GREEN,fontWeight:700,marginTop:8}}>✓ Face ID re-registered with Apple Passwords</div>}
                    {bioRegResult==="failed"&&<div style={{fontSize:11,color:"#e05",marginTop:8}}>Setup failed — make sure Face ID is enabled in your phone settings and try again</div>}
                  </div>
                )}
                <DailyWord announcement={announcement}/>
                <ClassCountdown/>
                {(()=>{
                  const _e=nowEST();
                  const _dow=_e.getDay();
                  const GENRES=[{id:"rock",label:"Rock",emoji:"🎸"},{id:"wgt",label:"White Girl Throwbacks",emoji:"💅"},{id:"rap",label:"Rap / Hip-Hop",emoji:"🎤"},{id:"country",label:"Country",emoji:"🤠"},{id:"pop",label:"Pop",emoji:"🎵"},{id:"mcastle",label:"MCASTLES SECRET PICK",emoji:"🍑🚀"}];
                  if(_dow===1||_dow===5)return(
                    <div style={{borderRadius:16,marginBottom:12,overflow:"hidden",border:"1px solid "+GOLD+"33"}}>
                      <div style={{background:"linear-gradient(140deg,"+GOLD+"20,"+GOLD+"08,#0d0d0d)",padding:"16px",position:"relative",overflow:"hidden",display:"flex",alignItems:"center",gap:14}}>
                        <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,"+GOLD+","+GOLD+"55,transparent)"}}/>
                        <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+GOLD+"44,"+GOLD+"22)",border:"1px solid "+GOLD+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>🙏</div>
                        <div>
                          <div style={{fontSize:9,color:GOLD,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Today's Music</div>
                          <div style={{fontSize:18,fontWeight:900,color:"#fff"}}>Worship Music</div>
                          <div style={{fontSize:11,color:"#666",marginTop:2}}>{_dow===1?"Mindset Monday":"Fellowship Friday"} · Proverbs 27:17</div>
                        </div>
                      </div>
                    </div>
                  );
                  return(
                    <div style={{borderRadius:16,marginBottom:12,overflow:"hidden",border:"1px solid "+ORANGE+"33"}}>
                      <div style={{background:"linear-gradient(140deg,"+ORANGE+"18,"+ORANGE+"06,#0d0d0d)",padding:"16px 16px 14px",position:"relative",overflow:"hidden"}}>
                        <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,"+ORANGE+","+ORANGE+"55,transparent)"}}/>
                        <div style={{position:"absolute",bottom:-8,right:-6,fontSize:60,opacity:0.05,lineHeight:1,userSelect:"none"}}>🎵</div>
                        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                          <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+ORANGE+"44,"+ORANGE+"22)",border:"1px solid "+ORANGE+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 16px "+ORANGE+"33"}}>🎵</div>
                          <div>
                            <div style={{fontSize:9,color:ORANGE,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Vote Now</div>
                            <div style={{fontSize:18,fontWeight:900,color:"#fff"}}>Today's Music</div>
                            {myVote&&<div style={{fontSize:10,color:"#555",marginTop:2}}>Tap to change your vote</div>}
                          </div>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:7}}>
                          {GENRES.map(g=>(
                            <button key={g.id} onClick={()=>submitVote(g.id)} style={{padding:"11px 14px",borderRadius:12,border:"1px solid "+(myVote===g.id?ORANGE+"55":"#1e1e1e"),background:myVote===g.id?"linear-gradient(135deg,"+ORANGE+"1a,"+ORANGE+"0d)":"#111",color:myVote===g.id?"#fff":"#888",fontSize:13,fontWeight:myVote===g.id?700:400,cursor:"pointer",fontFamily:"Georgia,serif",display:"flex",alignItems:"center",gap:10,textAlign:"left",transition:"all 0.12s",boxShadow:myVote===g.id?"0 0 10px "+ORANGE+"22":"none"}}>
                              <span style={{fontSize:18,lineHeight:1}}>{g.emoji}</span>
                              <span style={{flex:1}}>{g.label}</span>
                              {myVote===g.id&&<span style={{fontSize:11,color:ORANGE,fontWeight:800}}>✓</span>}
                            </button>
                          ))}
                        </div>
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
                  if(!_isClassDay) return(
                    <div style={{background:"#141414",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #252525"}}>
                      <div style={{fontSize:13,fontWeight:600,color:"#ddd",marginBottom:4}}>No class today</div>
                      <div style={{fontSize:12,color:"#666"}}>Class days are Monday, Tuesday, Thursday & Friday. Rest up and come back ready.</div>
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
                  <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+PUR+"33"}}>
                    <div style={{background:"linear-gradient(140deg,"+PUR+"30,"+PUR+"10,#0d0d0d)",padding:"18px 18px 16px",position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+PUR+","+PUR+"44,transparent)"}}/>
                      <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+PUR+"12,transparent 70%)",pointerEvents:"none"}}/>
                      <div style={{display:"flex",alignItems:"flex-start",gap:14,position:"relative"}}>
                        <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+PUR+"44,"+PUR+"22)",border:"1px solid "+PUR+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+PUR+"33"}}>📣</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:8,color:PUR,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>From Coach Ant</div>
                          <div style={{fontSize:13,color:"#fff",lineHeight:1.7}}>{announcement.message}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {bracelet&&(
                  <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+bracelet.hex+"33"}}>
                    <div style={{background:"linear-gradient(140deg,"+bracelet.hex+"30,"+bracelet.hex+"10,#0d0d0d)",padding:"18px 18px 16px",position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+bracelet.hex+","+bracelet.hex+"44,transparent)"}}/>
                      <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+bracelet.hex+"12,transparent 70%)",pointerEvents:"none"}}/>
                      <div style={{display:"flex",alignItems:"flex-start",gap:14,position:"relative"}}>
                        <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+bracelet.hex+"44,"+bracelet.hex+"22)",border:"1px solid "+bracelet.hex+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+bracelet.hex+"33"}}>📿</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:8,color:bracelet.hex,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>{bracelet.color} · {bracelet.ref}</div>
                          <div style={{fontSize:14,color:"#fff",fontStyle:"italic",lineHeight:1.75}}>"{bracelet.text}"</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {streak>0&&(
                  <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+GREEN+"33"}}>
                    <div style={{background:"linear-gradient(140deg,"+GREEN+"30,"+GREEN+"10,#0d0d0d)",padding:"18px 18px 16px",position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GREEN+","+GREEN+"44,transparent)"}}/>
                      <div style={{position:"absolute",bottom:-10,right:-8,fontSize:72,opacity:0.08,lineHeight:1,userSelect:"none",filter:"saturate(0)"}}>🔥</div>
                      <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+GREEN+"12,transparent 70%)",pointerEvents:"none"}}/>
                      <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                        <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+GREEN+"44,"+GREEN+"22)",border:"1px solid "+GREEN+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+GREEN+"33"}}>🔥</div>
                        <div>
                          <div style={{fontSize:8,color:GREEN,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Early arrival streak</div>
                          <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>{streak} <span style={{fontSize:13,color:"#888",fontWeight:400}}>days straight</span></div>
                          <div style={{fontSize:11,color:"#555",marginTop:1}}>{(()=>{const allM=[3,5,7,10,15,20];const next=allM.find(m=>m>streak);return next?next-streak+" more to "+next+"-day milestone":"Keep showing up early.";})()}</div>
                        </div>
                      </div>
                    </div>
                    <div style={{background:"#111",padding:"14px 18px"}}>
                      <div style={{display:"flex",gap:8,marginBottom:12}}>
                        <div style={{flex:1,background:"#1a1a1a",borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
                          <div style={{fontSize:22,fontWeight:900,color:GREEN}}>{streak}</div>
                          <div style={{fontSize:9,color:"#555",textTransform:"uppercase",letterSpacing:"0.08em",marginTop:2}}>Current</div>
                        </div>
                        <div style={{flex:1,background:"#1a1a1a",borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
                          <div style={{fontSize:22,fontWeight:900,color:GOLD}}>{athleteLb?.best_streak||streak}</div>
                          <div style={{fontSize:9,color:"#555",textTransform:"uppercase",letterSpacing:"0.08em",marginTop:2}}>Best</div>
                        </div>
                        <div style={{flex:1,background:"#1a1a1a",borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
                          <div style={{fontSize:22,fontWeight:900,color:"#ddd"}}>{athleteLb?.early_count||streak}</div>
                          <div style={{fontSize:9,color:"#555",textTransform:"uppercase",letterSpacing:"0.08em",marginTop:2}}>Total Early</div>
                        </div>
                      </div>
                      {(()=>{
                        const allM=[3,5,7,10,15,20];
                        const next=allM.find(m=>m>streak);
                        if(!next)return<div style={{fontSize:11,color:GREEN,textAlign:"center"}}>🏆 Elite streak. Keep going.</div>;
                        const prev=allM.filter(m=>m<streak).pop()||0;
                        const pct=Math.round(((streak-prev)/(next-prev))*100);
                        return(
                          <div>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                              <div style={{fontSize:10,color:"#555"}}>{streak} days</div>
                              <div style={{fontSize:10,color:GREEN}}>{next-streak} more to {next}-day milestone</div>
                            </div>
                            <div style={{height:4,background:"#222",borderRadius:2,overflow:"hidden"}}>
                              <div style={{height:"100%",width:pct+"%",background:"linear-gradient(90deg,"+GREEN+","+GOLD+")",borderRadius:2,transition:"width 0.5s"}}/>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
                {anvilWinner&&(
                  <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+GOLD+"33"}}>
                    <div style={{background:"linear-gradient(140deg,"+GOLD+"30,"+GOLD+"10,#0d0d0d)",padding:"18px 18px 16px",position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GOLD+","+GOLD+"44,transparent)"}}/>
                      <div style={{position:"absolute",bottom:-10,right:-8,fontSize:72,opacity:0.08,lineHeight:1,userSelect:"none",filter:"saturate(0)"}}>⚒</div>
                      <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+GOLD+"12,transparent 70%)",pointerEvents:"none"}}/>
                      <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                        {(()=>{const wa=athletes.find(a=>a.name===anvilWinner.athlete_name);return(<div style={{width:56,height:56,borderRadius:"50%",background:"linear-gradient(145deg,"+GOLD+","+GOLD+"88)",border:"2px solid "+GOLD,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700,color:"#1a1a1a",flexShrink:0,boxShadow:"0 0 20px "+GOLD+"55"}}>{wa?.photo_url?<img src={wa.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";}} alt=""/>:<span>⚒️</span>}</div>);})()}
                        <div>
                          <div style={{fontSize:8,color:GOLD,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>This week's Anvil</div>
                          <div style={{fontSize:20,fontWeight:900,color:GOLD,letterSpacing:"-0.02em"}}>{anvilWinner.athlete_name}</div>
                          <div style={{fontSize:11,color:"#666",marginTop:1}}>Iron sharpens iron.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* ── GOALS ── */}
                {[
                  {label:"Athletic Goal",sub:"Physical",question:"What are you chasing this summer?",goalKey:"athletic_goal",taskKey:"coach_athletic_task",color:GREEN,icon:"🎯",placeholder:"Drop my 40 time, add 20 lbs to my squat, make the travel roster…",ref:athleticGoalRef},
                  {label:"Character Goal",sub:"Who you're becoming",question:"How are you growing as a person?",goalKey:"character_goal",taskKey:"coach_character_task",color:PUR,icon:"⚔️",placeholder:"First one in every day, lead without being asked, own my mistakes fast…",ref:characterGoalRef},
                ].map(({label,sub,question,goalKey,taskKey,color,icon,placeholder,ref})=>(
                  <div key={goalKey} style={{borderRadius:20,marginBottom:14,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+color+"33"}}>
                    {/* Hero banner */}
                    <div style={{background:"linear-gradient(140deg,"+color+"30,"+color+"10,#0d0d0d)",padding:"20px 18px 16px",position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+color+","+color+"44,transparent)"}}/>
                      <div style={{position:"absolute",bottom:-10,right:-8,fontSize:72,opacity:0.08,lineHeight:1,userSelect:"none",filter:"saturate(0)"}}>{icon}</div>
                      <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+color+"12,transparent 70%)",pointerEvents:"none"}}/>
                      <div style={{display:"flex",alignItems:"flex-start",gap:14,position:"relative"}}>
                        <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+color+"44,"+color+"22)",border:"1px solid "+color+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+color+"33"}}>{icon}</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:8,color:color,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>{sub}</div>
                          <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em",lineHeight:1.1}}>{label}</div>
                          <div style={{fontSize:11,color:"#666",marginTop:3}}>{question}</div>
                        </div>
                      </div>
                      {/* Goal display */}
                      {selectedAthlete[goalKey]&&(
                        <div style={{marginTop:14,position:"relative"}}>
                          <div style={{fontSize:9,color:color+"aa",textTransform:"uppercase",letterSpacing:"0.14em",fontWeight:700,marginBottom:5}}>Your goal</div>
                          <div style={{fontSize:15,fontWeight:700,color:"#fff",lineHeight:1.5,fontStyle:"italic",borderLeft:"3px solid "+color,paddingLeft:12}}>"{selectedAthlete[goalKey]}"</div>
                        </div>
                      )}
                    </div>
                    {/* Edit area */}
                    <div style={{background:"#111",padding:"16px"}}>
                      <div style={{fontSize:10,color:"#444",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8,fontWeight:600}}>{selectedAthlete[goalKey]?"Update your goal":"Set your goal"}</div>
                      <textarea
                        ref={ref}
                        defaultValue={selectedAthlete[goalKey]||""}
                        onChange={e=>setGoalText(p=>({...p,[goalKey]:e.target.value}))}
                        placeholder={placeholder}
                        rows={2}
                        style={{width:"100%",padding:"12px 14px",fontSize:14,border:"1px solid #2a2a2a",borderRadius:12,background:"#0a0a0a",color:"#fff",fontFamily:"Georgia,serif",resize:"none",boxSizing:"border-box",lineHeight:1.6,outline:"none",transition:"border-color 0.2s"}}
                        onFocus={e=>e.target.style.borderColor=color+"88"}
                        onBlur={e=>e.target.style.borderColor="#2a2a2a"}
                      />
                      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10}}>
                        <button onClick={async()=>{
                          const val=ref.current.value.trim();
                          if(!val)return;
                          setSelectedAthlete(a=>({...a,[goalKey]:val}));
                          try{await supabase.from("athletes").update({[goalKey]:val}).eq("id",selectedAthlete.id);}catch(e){}
                          setGoalSaved(p=>({...p,[goalKey]:true}));
                          setTimeout(()=>setGoalSaved(p=>({...p,[goalKey]:false})),2500);
                        }} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:goalSaved[goalKey]?"linear-gradient(135deg,#0a2a0a,#0d360d)":"linear-gradient(135deg,"+color+","+color+"cc)",color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"Georgia,serif",letterSpacing:"0.02em",boxShadow:goalSaved[goalKey]?"0 0 12px "+GREEN+"44":"0 0 16px "+color+"44",transition:"all 0.25s"}}>
                          {goalSaved[goalKey]?"✓ Goal saved":"Lock it in →"}
                        </button>
                      </div>
                    </div>
                    {/* Coach task */}
                    {selectedAthlete[taskKey]&&(
                      <div style={{background:"#0a0a0a",padding:"14px 16px",borderTop:"1px solid "+color+"22"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{width:32,height:32,borderRadius:8,background:color+"18",border:"1px solid "+color+"33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>⚒</div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:9,color:color,textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:800,marginBottom:3}}>Task from Coach Ant</div>
                            <div style={{fontSize:13,color:"#bbb",lineHeight:1.65}}>{selectedAthlete[taskKey]}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <a href={groupmeLink} target="_blank" rel="noreferrer" style={{textDecoration:"none",display:"block",marginBottom:12}}>
                  <div style={{borderRadius:20,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid #00aff033"}}>
                    <div style={{background:"linear-gradient(140deg,#001828,#000d18,#0d0d0d)",padding:"16px 18px",position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,#00aff0,#00aff055,transparent)"}}/>
                      <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.07,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="chat" size={66} color="#fff"/></div>
                      <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                        <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,#00aff044,#00aff022)",border:"1px solid #00aff044",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px #00aff033"}}>💬</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:8,color:"#00aff0",textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Group Chat</div>
                          <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Join GroupMe</div>
                          <div style={{fontSize:11,color:"#555",marginTop:1}}>Tap to join the team group chat</div>
                        </div>
                        <div style={{fontSize:18,color:"#00aff044"}}>→</div>
                      </div>
                    </div>
                  </div>
                </a>
              </div>
            )}


            {tab==="mygroup"&&(
              <div>
                {myGroupIdx==null?(
                  <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+STEEL+"33"}}>
                    <div style={{background:"linear-gradient(140deg,"+STEEL+"30,"+STEEL+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+STEEL+","+STEEL+"44,transparent)"}}/>
                      <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="clock" size={66} color="#fff"/></div>
                      <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+STEEL+"12,transparent 70%)",pointerEvents:"none"}}/>
                      <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                        <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+STEEL+"44,"+STEEL+"22)",border:"1px solid "+STEEL+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+STEEL+"33"}}>⏳</div>
                        <div>
                          <div style={{fontSize:8,color:STEEL,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Your Group</div>
                          <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Not assigned yet</div>
                          <div style={{fontSize:11,color:"#666",marginTop:1}}>Coach will place you in a group soon</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ):(()=>{
                  const gc=myBracelet?.hex||LC[myGroupIdx%LC.length]||PUR;
                  const leaderName=myGroupLeader?.name||null;
                  const amLeader=selectedAthlete?.role==="forge";
                  return(
                    <div>
                      {/* Group identity card */}
                      <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",border:"1px solid "+gc+"44",boxShadow:"0 8px 32px "+gc+"18"}}>
                        <div style={{height:3,background:"linear-gradient(90deg,"+gc+","+gc+"44,transparent)"}}/>
                        <div style={{background:"linear-gradient(140deg,"+gc+"22,"+gc+"06,#0d0d0d)",padding:"18px 18px 16px",position:"relative",overflow:"hidden"}}>
                          <div style={{position:"absolute",bottom:-10,right:-4,fontSize:80,opacity:0.05,lineHeight:1,userSelect:"none",filter:"saturate(0)"}}>⚒</div>
                          <div style={{fontSize:9,color:gc,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:14}}>
                            {amLeader?"You're Leading This Group":"Your Group"}
                          </div>
                          {/* Leader row */}
                          {leaderName&&(
                            <div style={{display:"flex",alignItems:"center",gap:14}}>
                              <div style={{width:64,height:64,borderRadius:"50%",border:"2px solid "+gc,overflow:"hidden",flexShrink:0,background:"#222",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:700,color:gc,boxShadow:"0 0 24px "+gc+"44"}}>
                                {myGroupLeader?.photo_url?<img src={myGroupLeader.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(leaderName||"?")[0]}
                              </div>
                              <div style={{flex:1}}>
                                <div style={{fontSize:22,fontWeight:900,color:"#fff",letterSpacing:"-0.02em",lineHeight:1.1}}>{leaderName}</div>
                                <div style={{fontSize:11,color:"#666",marginTop:3}}>{amLeader?"Group Leader · That's you":"Group Leader"}</div>
                                {myTier&&(
                                  <div style={{marginTop:6}}>
                                    <span style={{fontSize:10,background:gc+"22",color:gc,padding:"3px 10px",borderRadius:20,fontWeight:700,border:"0.5px solid "+gc+"44"}}>Tier {myTier}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Scripture */}
                        {myBracelet&&(
                          <div style={{background:"#111",padding:"14px 18px",borderTop:"0.5px solid #1a1a1a"}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                              <div style={{width:10,height:10,borderRadius:"50%",background:gc,boxShadow:"0 0 8px "+gc+"88",flexShrink:0}}/>
                              <span style={{fontSize:10,fontWeight:700,color:gc,textTransform:"uppercase",letterSpacing:"0.07em"}}>{myBracelet.color} — {myBracelet.ref}</span>
                            </div>
                            <div style={{fontSize:14,color:"#ddd",fontStyle:"italic",lineHeight:1.8,fontFamily:"Georgia,serif",padding:"10px 14px",background:gc+"0D",borderRadius:10,borderLeft:"2px solid "+gc}}>
                              &#8220;{myBracelet.text}&#8221;
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Teammates grid */}
                      {groupmates.length>0&&(
                        <div style={{background:"#0e0e0e",borderRadius:16,overflow:"hidden",border:"0.5px solid #1e1e1e",marginBottom:12}}>
                          <div style={{padding:"12px 16px",borderBottom:"0.5px solid #1a1a1a",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div style={{fontSize:11,fontWeight:700,color:"#666",textTransform:"uppercase",letterSpacing:"0.1em"}}>Teammates</div>
                            <div style={{fontSize:10,color:"#444"}}>{groupmates.length} member{groupmates.length!==1?"s":""}</div>
                          </div>
                          <div style={{padding:"10px 12px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                            {groupmates.map((ath,i)=>{
                              const isMe=ath.id===selectedAthlete?.id;
                              return(
                                <div key={ath.id||i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:isMe?gc+"18":"#151515",borderRadius:12,border:"0.5px solid "+(isMe?gc+"44":"#222")}}>
                                  <div style={{width:38,height:38,borderRadius:"50%",background:isMe?gc+"33":"#222",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:isMe?gc:"#555",flexShrink:0,overflow:"hidden",border:"1.5px solid "+(isMe?gc:"#2a2a2a")}}>
                                    {ath?.photo_url?<img src={ath.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(ath.name||"?")[0]}
                                  </div>
                                  <div style={{minWidth:0}}>
                                    <div style={{fontSize:12,fontWeight:isMe?700:500,color:isMe?gc:"#ccc",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{(ath.name||"").split(" ")[0]}</div>
                                    {isMe&&<div style={{fontSize:9,color:gc+"88",marginTop:1}}>you</div>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
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
                <div style={{background:"linear-gradient(135deg,#12210f,#0d1a0b)",borderRadius:12,padding:"12px 14px",marginBottom:14,border:"1px solid "+GREEN+"55",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:9.5,color:GREEN,textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:800,marginBottom:2}}>✓ Checked in · Step 1 of 2</div>
                    <div style={{fontSize:13.5,fontWeight:700,color:"#fff"}}>Log your weight</div>
                  </div>
                  <button onClick={()=>{setPostCheckinStep("habits");slideDirRef.current=0;setTab("habits");}} style={{flexShrink:0,fontSize:12,fontWeight:700,color:"#9a9a9a",border:"1px solid rgba(255,255,255,0.14)",borderRadius:9,padding:"8px 13px",background:"transparent",cursor:"pointer",fontFamily:"Georgia,serif"}}>Skip →</button>
                </div>
              )}
              <WeightTracker athleteId={selectedAthlete.id} onWeighed={()=>{setWeightLoggedToday(true);if(postCheckinStep==="weight"){setPostCheckinStep("habits");slideDirRef.current=0;setTimeout(()=>setTab("habits"),650);}}}/>
            </>)}

            {tab==="body"&&<InjuryBodyMap athleteId={selectedAthlete.id}/>}

            {tab==="goals"&&<GoalsCountdown athlete={selectedAthlete}/>}

            {tab==="verse"&&<VerseOfDay/>}

            {tab==="anvil"&&<AnvilHistory athleteId={selectedAthlete?.id} athleteName={selectedAthlete?.name}/>}
            {tab==="prfeed"&&<TeamPRFeed athletes={athletes} currentAthleteId={selectedAthlete?.id}/>}
            {tab==="badges"&&<Achievements athleteId={selectedAthlete?.id} athleteName={selectedAthlete?.name}/>}
            {tab==="recap"&&<SeasonRecap athleteId={selectedAthlete?.id} athleteName={selectedAthlete?.name} photoUrl={selectedAthlete?.photo_url}/>}

            {tab==="photos"&&<GroupPhotos/>}

            {tab==="mcastles"&&<MCastlesTab/>}

            {tab==="events"&&<AthleteEventsTab athleteName={selectedAthlete.name}/>}

            {tab==="attendance"&&(
              <div>
                <AttendanceCalendar athleteId={selectedAthlete.id}/>
                <div style={{borderRadius:20,marginTop:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+ORANGE+"33"}}>
                  <div style={{background:"linear-gradient(140deg,"+ORANGE+"30,"+ORANGE+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+ORANGE+","+ORANGE+"44,transparent)"}}/>
                    <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="calendar" size={66} color="#fff"/></div>
                    <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+ORANGE+"12,transparent 70%)",pointerEvents:"none"}}/>
                    <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                      <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+ORANGE+"44,"+ORANGE+"22)",border:"1px solid "+ORANGE+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+ORANGE+"33"}}>📅</div>
                      <div>
                        <div style={{fontSize:8,color:ORANGE,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Your record</div>
                        <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Check-in History</div>
                        <div style={{fontSize:11,color:"#555",marginTop:1}}>{attendance.length} session{attendance.length!==1?"s":""} logged</div>
                      </div>
                    </div>
                  </div>
                  <div style={{background:"#0e0e0e",padding:"0 18px"}}>
                    {attendance.length===0&&<div style={{fontSize:12,color:"#444",textAlign:"center",padding:"1.5rem 0"}}>No check-ins yet.</div>}
                    {attendance.slice(0,30).map((rec,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:i<Math.min(attendance.length,30)-1?"0.5px solid #1a1a1a":"none"}}>
                        <div>
                          <div style={{fontSize:13,fontWeight:600,color:"#ddd"}}>{rec.day} · {rec.date}</div>
                          <div style={{fontSize:11,color:"#555",marginTop:2}}>{rec.time_logged||""}</div>
                        </div>
                        <span style={{fontSize:10,padding:"4px 12px",borderRadius:8,background:rec.status==="early"?GREEN+"22":rec.status==="late"?GOLD+"22":RED+"22",color:rec.status==="early"?GREEN:rec.status==="late"?GOLD:RED,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em",border:"0.5px solid "+(rec.status==="early"?GREEN:rec.status==="late"?GOLD:RED)+"44"}}>
                          {rec.status==="early"?"Early":rec.status==="late"?"Late":"No show"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}


            {tab==="prs"&&<PRLog athleteId={selectedAthlete.id} gender={selectedAthlete.gender} onNavigate={(t)=>{slideDirRef.current=0;setTab(t);}}/>}
            {tab==="stretching"&&<StretchingTab/>}

            {tab==="journey"&&(
              <div>
                <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+GOLD+"33"}}>
                  <div style={{background:"linear-gradient(140deg,"+GOLD+"30,"+GOLD+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GOLD+","+GOLD+"44,transparent)"}}/>
                    <div style={{position:"absolute",bottom:-10,right:-8,fontSize:72,opacity:0.08,lineHeight:1,userSelect:"none",filter:"saturate(0)"}}>⚒️</div>
                    <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+GOLD+"12,transparent 70%)",pointerEvents:"none"}}/>
                    <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                      <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+GOLD+"44,"+GOLD+"22)",border:"1px solid "+GOLD+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+GOLD+"33"}}>⚒️</div>
                      <div>
                        <div style={{fontSize:8,color:GOLD,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Proverbs 27:17</div>
                        <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>As iron sharpens iron...</div>
                      </div>
                    </div>
                  </div>
                  <div style={{background:"#111",padding:"16px 18px"}}>
                    <div style={{fontSize:15,color:"#ccc",fontStyle:"italic",lineHeight:1.7}}>"As iron sharpens iron, so one person sharpens another."</div>
                    <div style={{fontSize:12,color:"#444",marginTop:6}}>— Proverbs 27:17</div>
                  </div>
                </div>
                {[
                  {title:"The Iron",icon:"⚙️",color:STEEL,bg:"#1a1e20",border:"#2a3035",isYou:!isForge,body:"Every athlete enters as The Iron. Raw. Unfinished. Full of potential but not yet fully shaped.",call:"Show up early. Work hard. Hold the standard."},
                  {title:"The Forge",icon:"🔥",color:RED,bg:"#200a0a",border:"#5a1a1a",isYou:isForge,body:"The Forge is called up for the week. They set the pace, lead the group, hold the standard.",call:"Lead by example before you lead by voice."},
                  {title:"The Anvil",icon:"⚒️",color:GOLD,bg:"#1f1700",border:"#5a4500",isYou:false,body:"The Anvil is the highest individual honor in TF College Group. It cannot be drafted. It can only be earned.",call:"You do not chase the Anvil. You become the kind of person who earns it."},
                ].map((item,i)=>(
                  <div key={i} style={{borderRadius:20,marginBottom:10,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+item.color+"33"}}>
                    <div style={{background:"linear-gradient(140deg,"+item.color+"30,"+item.color+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+item.color+","+item.color+"44,transparent)"}}/>
                      <div style={{position:"absolute",bottom:-10,right:-8,fontSize:72,opacity:0.08,lineHeight:1,userSelect:"none",filter:"saturate(0)"}}>{item.icon}</div>
                      <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+item.color+"12,transparent 70%)",pointerEvents:"none"}}/>
                      <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                        <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+item.color+"44,"+item.color+"22)",border:"1px solid "+item.color+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+item.color+"33"}}>{item.icon}</div>
                        <div>
                          <div style={{fontSize:8,color:item.color,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Tier</div>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>{item.title}</div>
                            {item.isYou&&<span style={{fontSize:11,background:item.color,color:"#1a1a1a",padding:"2px 8px",borderRadius:5,fontWeight:500}}>You are here</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{background:"#111",padding:"16px 18px"}}>
                      <div style={{fontSize:13,color:"#999",lineHeight:1.75,marginBottom:10}}>{item.body}</div>
                      <div style={{fontSize:12,color:item.color,fontStyle:"italic"}}>{item.call}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab==="habits"&&(<>
              {postCheckinStep==="habits"&&(()=>{
                const _wd=nowEST().getDay();const _weigh=_wd===1||_wd===5;
                return(
                  <div style={{background:"linear-gradient(135deg,#12210f,#0d1a0b)",borderRadius:12,padding:"12px 14px",marginBottom:14,border:"1px solid "+GREEN+"55",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:9.5,color:GREEN,textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:800,marginBottom:2}}>✓ Checked in · {_weigh?"Step 2 of 2":"Last step"}</div>
                      <div style={{fontSize:13.5,fontWeight:700,color:"#fff"}}>Log today's habits</div>
                    </div>
                    <button onClick={()=>{setPostCheckinStep(null);slideDirRef.current=0;setTab("profile");}} style={{flexShrink:0,fontSize:12,fontWeight:700,color:"#9a9a9a",border:"1px solid rgba(255,255,255,0.14)",borderRadius:9,padding:"8px 13px",background:"transparent",cursor:"pointer",fontFamily:"Georgia,serif"}}>Done</button>
                  </div>
                );
              })()}
              <HabitsTab athleteId={selectedAthlete.id}/>
            </>)}

            {tab==="surprise"&&<SurpriseTab athleteName={selectedAthlete.name}/>}
            {tab==="private"&&(
              <div>
                <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+STEEL+"33"}}>
                  <div style={{background:"linear-gradient(140deg,"+STEEL+"30,"+STEEL+"10,#0d0d0d)",padding:"20px 18px 18px",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+STEEL+","+STEEL+"44,transparent)"}}/>
                    <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="mail" size={66} color="#fff"/></div>
                    <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+STEEL+"12,transparent 70%)",pointerEvents:"none"}}/>
                    <div style={{display:"flex",alignItems:"flex-start",gap:14,position:"relative",marginBottom:14}}>
                      <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+STEEL+"44,"+STEEL+"22)",border:"1px solid "+STEEL+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+STEEL+"33"}}>✉️</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:8,color:STEEL,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Private</div>
                        <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em",lineHeight:1.1}}>Message Coach Ant</div>
                        <div style={{fontSize:11,color:"#666",marginTop:3}}>Nobody else sees what you send here.</div>
                      </div>
                    </div>
                    {feedbackSent?(
                      <div style={{fontSize:13,color:GREEN,fontWeight:600,padding:"14px",background:GREEN+"18",borderRadius:12,border:"0.5px solid "+GREEN+"44",textAlign:"center"}}>✓ Message sent to Coach Ant.</div>
                    ):(
                      <>
                        <textarea value={feedbackText} onChange={e=>setFeedbackText(e.target.value)} placeholder="Type your message to Coach Ant..." style={{width:"100%",minHeight:90,padding:"12px 14px",fontSize:13,border:"1px solid #2a2a2a",borderRadius:12,background:"#0a0a0a",color:"#fff",fontFamily:"Georgia,serif",resize:"vertical",marginBottom:10,boxSizing:"border-box",lineHeight:1.6,outline:"none",transition:"border-color 0.2s"}} onFocus={e=>e.target.style.borderColor=STEEL+"88"} onBlur={e=>e.target.style.borderColor="#2a2a2a"}/>
                        <button onClick={sendFeedback} style={{width:"100%",padding:"12px",borderRadius:12,border:"none",background:feedbackText.trim()?"linear-gradient(135deg,"+STEEL+",#2a3a4a)":"#1e1e1e",color:feedbackText.trim()?"#fff":"#444",fontSize:13,fontWeight:800,cursor:feedbackText.trim()?"pointer":"default",fontFamily:"Georgia,serif",boxShadow:feedbackText.trim()?"0 0 16px "+STEEL+"44":"none",transition:"all 0.2s",letterSpacing:"0.02em"}}>Send to Coach Ant →</button>
                      </>
                    )}
                  </div>
                </div>
                <div style={{borderRadius:20,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+PUR+"33"}}>
                  <div style={{background:"linear-gradient(140deg,"+PUR+"30,"+PUR+"10,#0d0d0d)",padding:"18px 18px 16px",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+PUR+","+PUR+"44,transparent)"}}/>
                    <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="pray" size={66} color="#fff"/></div>
                    <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+PUR+"12,transparent 70%)",pointerEvents:"none"}}/>
                    <div style={{display:"flex",alignItems:"flex-start",gap:14,position:"relative",marginBottom:14}}>
                      <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+PUR+"44,"+PUR+"22)",border:"1px solid "+PUR+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+PUR+"33"}}>🙏</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:8,color:PUR,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Private</div>
                        <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em",lineHeight:1.1}}>Prayer Request</div>
                        <div style={{fontSize:11,color:"#666",marginTop:3}}>Coach Ant will pray for you personally.</div>
                      </div>
                    </div>
                    {prayerSent?(
                      <div style={{fontSize:13,color:GREEN,fontWeight:600,padding:"14px",background:GREEN+"18",borderRadius:12,border:"0.5px solid "+GREEN+"44",textAlign:"center"}}>✓ Your request has been received. We're praying for you.</div>
                    ):(
                      <>
                        <textarea value={prayerText} onChange={e=>setPrayerText(e.target.value)} placeholder="Share your prayer request here..." style={{width:"100%",minHeight:90,padding:"12px 14px",fontSize:13,border:"1px solid #2a2a2a",borderRadius:12,background:"#0a0a0a",color:"#fff",fontFamily:"Georgia,serif",resize:"vertical",marginBottom:10,boxSizing:"border-box",lineHeight:1.6,outline:"none",transition:"border-color 0.2s"}} onFocus={e=>e.target.style.borderColor=PUR+"88"} onBlur={e=>e.target.style.borderColor="#2a2a2a"}/>
                        <button onClick={sendPrayer} style={{width:"100%",padding:"12px",borderRadius:12,border:"none",background:prayerText.trim()?"linear-gradient(135deg,"+PUR+",#3a2d8f)":"#1e1e1e",color:prayerText.trim()?"#fff":"#444",fontSize:13,fontWeight:800,cursor:prayerText.trim()?"pointer":"default",fontFamily:"Georgia,serif",boxShadow:prayerText.trim()?"0 0 16px "+PUR+"44":"none",transition:"all 0.2s",letterSpacing:"0.02em"}}>Submit prayer request →</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* ── LIQUID GLASS BOTTOM NAV ── */}
        {(()=>{
            const ICON_MAP={"profile":"profile","verse":"book","attendance":"calendar","draft":"target","mygroup":"users","weight":"scale","body":"heart","prs":"barbell","leaderboard":"trophy","prayer":"pray","bracelets":"link","photos":"camera","notes":"fileText","habits":"droplet","private":"lock","stretching":"activity","journey":"compass","anvil":"anvil","mcastles":"crown","events":"star","surprise":"gift","badges":"medal","recap":"award","prfeed":"flame"};
            const ICON_COLORS={"profile":"#8CB4D5","prs":"#FF7A2F","attendance":"#7B6EE8","weight":"#C8D040","verse":"#4DC8F5","draft":"#44D9B0","mygroup":"#90A8C0","anvil":"#F0C040","body":"#E05555","leaderboard":"#FFD700","prayer":"#9060E0","bracelets":"#C090F0","photos":"#50D0B8","notes":"#E8B84A","habits":"#20BEA8","private":"#666","stretching":"#3A9E5A","journey":"#E8720C","mcastles":"#D060C0","events":"#D4AF37","surprise":"#E8478C","badges":"#D4AF37","recap":"#E8720C","prfeed":"#F0C040"};
            const tabColor=isForge?"#E8720C":STEEL;
            const validPinned=pinnedTabs.filter(id=>TABS.find(t=>t.id===id));
            const PRIMARY=["profile",...validPinned];
            const togglePin=(id)=>{
              if(id==="profile")return;
              const next=validPinned.includes(id)?validPinned.filter(p=>p!==id):(validPinned.length<3?[...validPinned,id]:validPinned);
              setPinnedTabs(next);
              try{localStorage.setItem("tf_pinned_"+selectedAthlete.id,JSON.stringify(next));}catch(e){}
            };
            const renderTabIcon=(id,size,isActive,grid=false)=>{const n=ICON_MAP[id];const col=ICON_COLORS[id]||"#aaa";const op=isActive?1:grid?0.65:0.55;if(n)return <span style={{opacity:op,display:"flex",alignItems:"center"}}><Icon name={n} size={size} color={col}/></span>;return <span style={{fontSize:size,lineHeight:1,opacity:op}}>{col}</span>;};
            return(
              <>
                <div style={{position:"fixed",bottom:16,left:"50%",transform:"translateX(-50%)",width:"calc(100% - 32px)",maxWidth:448,zIndex:1000,fontFamily:"Georgia,serif"}}>
                  <div style={{background:"rgba(8,8,14,0.88)",backdropFilter:"blur(48px) saturate(220%)",WebkitBackdropFilter:"blur(48px) saturate(220%)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:28,boxShadow:"0 20px 60px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.12)",display:"flex",alignItems:"stretch",padding:"6px 4px 6px",position:"relative"}}>
                    {(()=>{const n=PRIMARY.length+1;const activeIdx=PRIMARY.indexOf(tab);if(activeIdx<0||jiggleMode)return null;const col=ICON_COLORS[tab]||tabColor;return <div style={{position:"absolute",bottom:6,left:`calc(4px + ${activeIdx} * (100% - 8px) / ${n})`,width:`calc((100% - 8px) / ${n})`,height:2,borderRadius:2,background:col,boxShadow:`0 0 8px ${col}99`,transition:"left 0.32s cubic-bezier(0.22,1,0.36,1),background 0.2s",pointerEvents:"none",zIndex:0}}/>})()}
                    {PRIMARY.map(id=>{
                      const t=TABS.find(x=>x.id===id);
                      if(!t)return null;
                      const isActive=tab===id;
                      const col=ICON_COLORS[id]||tabColor;
                      const isJiggling=jiggleMode&&id!=="profile"&&jiggleDragId!==id;
                      const isDragging=jiggleDragId===id;
                      return(
                        <button key={id}
                          ref={isDragging?jiggleDragElemRef:null}
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
                          }}
                          style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"8px 4px 6px",background:isActive&&!jiggleMode?"rgba(255,255,255,0.11)":"transparent",border:"none",borderRadius:22,fontSize:9,fontWeight:isActive?700:400,cursor:"pointer",fontFamily:"Georgia,serif",transition:isDragging?"none":"transform 0.18s cubic-bezier(0.34,1.56,0.64,1)",boxShadow:isDragging?"0 12px 32px rgba(0,0,0,0.55)":isActive&&!jiggleMode?"inset 0 1px 0 rgba(255,255,255,0.18)":"none",animation:isJiggling?"tfJiggle 0.22s ease-in-out infinite alternate":"none",position:"relative",zIndex:isDragging?10:1,userSelect:"none",WebkitUserSelect:"none",touchAction:jiggleMode?"none":"auto"}}>
                          <span style={{filter:isActive&&!jiggleMode?"drop-shadow(0 0 10px "+col+"dd)":"none",transition:"filter 0.2s",display:"flex",alignItems:"center",justifyContent:"center",height:20}}>{renderTabIcon(id,19,isActive)}</span>
                          <span style={{letterSpacing:"0.02em",color:isActive&&!jiggleMode?col:"rgba(255,255,255,0.38)"}}>{t.label}</span>
                        </button>
                      );
                    })}
                    <button onClick={()=>{setShowTabPicker(true);setEditingPins(false);}}
                      style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"8px 4px 6px",background:"transparent",border:"none",borderRadius:22,color:"rgba(255,255,255,0.38)",fontSize:9,fontWeight:400,cursor:"pointer",fontFamily:"Georgia,serif",transition:"all 0.15s"}}>
                      <span style={{display:"flex",alignItems:"center",justifyContent:"center",height:20,opacity:0.55}}><Icon name="menu" size={19} color="#aaa"/></span>
                      <span>More</span>
                    </button>
                  </div>
                </div>

                {jiggleMode&&(
                  <div style={{position:"fixed",bottom:100,left:"50%",transform:"translateX(-50%)",zIndex:1002}}>
                    <button onClick={()=>{setJiggleMode(false);setJiggleDragId(null);if(jiggleDragElemRef.current)jiggleDragElemRef.current.style.transform="";}} style={{background:"rgba(255,255,255,0.92)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",color:"#000",fontSize:13,fontWeight:800,padding:"9px 28px",borderRadius:24,border:"none",cursor:"pointer",fontFamily:"Georgia,serif",boxShadow:"0 4px 20px rgba(0,0,0,0.35)",letterSpacing:"0.04em"}}>Done</button>
                  </div>
                )}

                {showTabPicker&&(
                  <>
                  <style>{`@keyframes tfDrawerIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
                  <div onClick={()=>setShowTabPicker(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.62)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",zIndex:9999,display:"flex"}}>
                    <div onClick={e=>e.stopPropagation()} style={{width:"min(84vw,300px)",height:"100%",overflowY:"auto",background:"rgba(10,10,18,0.98)",backdropFilter:"blur(48px) saturate(200%)",WebkitBackdropFilter:"blur(48px) saturate(200%)",borderRight:"1px solid rgba(255,255,255,0.12)",boxShadow:"24px 0 60px rgba(0,0,0,0.7)",paddingBottom:40,animation:"tfDrawerIn 0.26s cubic-bezier(0.22,1,0.36,1)",WebkitOverflowScrolling:"touch"}}>
                      <div style={{position:"sticky",top:0,background:"rgba(10,10,18,0.98)",padding:"18px 16px 12px",zIndex:1,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"0.5px solid rgba(255,255,255,0.08)"}}>
                        <div style={{fontSize:17,fontWeight:900,color:"#fff",letterSpacing:"-0.01em"}}>All Tabs</div>
                        <button onClick={()=>setShowTabPicker(false)} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.55)",fontSize:14,cursor:"pointer",width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>✕</button>
                      </div>
                      {/* Appearance: light / dark */}
                      <div style={{padding:"12px 16px 4px"}}>
                        <div style={{fontSize:10,color:"rgba(255,255,255,0.28)",textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:700,marginBottom:8}}>Appearance</div>
                        <div style={{display:"flex",gap:6,background:"#131313",borderRadius:12,padding:4,border:"1px solid #222"}}>
                          {[{m:"dark",label:"🌙 Dark"},{m:"light",label:"☀️ Light"}].map(o=>{
                            const on=themeMode===o.m;
                            return(
                              <button key={o.m} onClick={()=>{if(themeMode!==o.m)toggleTheme();}}
                                style={{flex:1,padding:"9px",borderRadius:9,border:"none",background:on?"#E8720C":"transparent",color:on?"#fff":"rgba(255,255,255,0.5)",fontSize:12,fontWeight:on?800:500,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                                {o.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {[
                        {label:"Home",ids:["profile"]},
                        {label:"Training",ids:["prs","weight","stretching","body"]},
                        {label:"Progress",ids:["attendance","leaderboard","anvil","badges","recap"]},
                        {label:"Team & Faith",ids:["mygroup","verse","prayer","bracelets"]},
                        {label:"More",ids:["surprise","mcastles","events","photos","notes","habits","private"]},
                      ].map(section=>(
                        <div key={section.label} style={{marginTop:6}}>
                          <div style={{fontSize:10,color:"rgba(255,255,255,0.28)",textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:700,padding:"12px 18px 6px"}}>{section.label}</div>
                          {section.ids.map(id=>{
                            const t=TABS.find(x=>x.id===id);
                            if(!t)return null;
                            const col=ICON_COLORS[id]||"#aaa";
                            const active=tab===id;
                            const pinned=validPinned.includes(id);
                            return(
                              <button key={id} onClick={()=>{slideDirRef.current=0;setTab(id);setShowTabPicker(false);}}
                                style={{width:"100%",display:"flex",alignItems:"center",gap:13,padding:"12px 18px",background:active?col+"1f":"transparent",borderLeft:"3px solid "+(active?col:"transparent"),borderTop:"none",borderRight:"none",borderBottom:"none",cursor:"pointer",fontFamily:"Georgia,serif",textAlign:"left",transition:"background 0.12s"}}>
                                <span style={{width:24,height:24,borderRadius:8,background:active?col+"22":"rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{renderTabIcon(id,17,active)}</span>
                                <span style={{fontSize:14.5,fontWeight:active?800:500,color:active?col:"rgba(255,255,255,0.72)",letterSpacing:active?"0.01em":"0"}}>{t.label}</span>
                                {pinned&&<span title="On the bottom bar" style={{marginLeft:"auto",fontSize:9,color:active?col:"rgba(255,255,255,0.3)",flexShrink:0}}>● bar</span>}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                  </>
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
