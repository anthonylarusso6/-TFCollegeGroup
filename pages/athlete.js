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
import MCastlesTab from "../components/MCastlesTab";
import InjuryBodyMap from "../components/InjuryBodyMap";
import HabitsTab from "../components/HabitsTab";

import Head from "next/head";
import { supabase } from "../lib/supabase";

const LC=["#534AB7","#0F6E56","#854F0B","#993556"];
const LB=["#EEEDFE","#E1F5EE","#FAEEDA","#FBEAF0"];

const playPickSound=()=>{
  try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    [[523,0],[659,0.12],[784,0.24],[1047,0.38]].forEach(([freq,t])=>{
      const o=ctx.createOscillator();const g=ctx.createGain();
      o.connect(g);g.connect(ctx.destination);
      o.type="sine";o.frequency.setValueAtTime(freq,ctx.currentTime+t);
      g.gain.setValueAtTime(0.25,ctx.currentTime+t);
      g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+t+0.35);
      o.start(ctx.currentTime+t);o.stop(ctx.currentTime+t+0.35);
    });
  }catch(e){}
};

const playTickSound=()=>{
  try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    const o=ctx.createOscillator();const g=ctx.createGain();
    o.connect(g);g.connect(ctx.destination);
    o.type="square";o.frequency.setValueAtTime(880,ctx.currentTime);
    g.gain.setValueAtTime(0.08,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.07);
    o.start(ctx.currentTime);o.stop(ctx.currentTime+0.07);
  }catch(e){}
};

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

// Correct snake order: [0,1,2,3, 3,2,1,0, 0,1,2,3, ...]
const snakeSeq=(total,numGroups=4)=>{
  const seq=[];
  for(let r=0;seq.length<total;r++){
    const row=Array.from({length:numGroups},(_,i)=>i);
    seq.push(...(r%2===0?row:[...row].reverse()));
  }
  return seq.slice(0,total);
};

const getTier=(idx,n)=>{
  if(n<=2)return idx===0?1:2;
  if(n===3)return idx<2?1:2;
  if(n===4)return idx<2?1:idx===2?2:3;
  return idx<2?1:idx<4?2:3;
};
function CountdownPicker({onTimeout}){
  const[timeLeft,setTimeLeft]=useState(10);
  useEffect(()=>{
    if(timeLeft<=0){onTimeout();return;}
    if(timeLeft<=3)playTickSound();
    const t=setTimeout(()=>setTimeLeft(p=>p-1),1000);
    return()=>clearTimeout(t);
  },[timeLeft,onTimeout]);
  const urgent=timeLeft<=3;
  return(
    <div style={{background:urgent?"#3d0a0a":"#1a0808",borderRadius:12,padding:"8px 14px",textAlign:"center",border:"1px solid "+(urgent?"#C0392B88":"#C0392B44"),minWidth:64,flexShrink:0}}>
      <div style={{fontSize:32,fontWeight:900,color:urgent?"#ff6b6b":"#C0392B",lineHeight:1}}>{timeLeft}</div>
      <div style={{fontSize:9,color:urgent?"#ff6b6b88":"#66222280",marginTop:2,textTransform:"uppercase",letterSpacing:"0.06em"}}>{urgent?"auto":"sec"}</div>
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
  const me=athletes.find(a=>a.id===athleteId);
  const partner=athletes.find(a=>a.id===me?.accountability_partner)||athletes.find(a=>a.accountability_partner===athleteId);
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
  const[bioAvail,setBioAvail]=useState(false);
  const[bioCredId,setBioCredId]=useState(null);
  const[bioDeclined,setBioDeclined]=useState(false);
  const[showBioOffer,setShowBioOffer]=useState(false);
  const[pendingNav,setPendingNav]=useState(null);
  const[bioRegistering,setBioRegistering]=useState(false);
  const[bioRegResult,setBioRegResult]=useState(null);
  const[showTabPicker,setShowTabPicker]=useState(false);
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
  const[draft,setDraft]=useState(null);
  const[weightLoggedToday,setWeightLoggedToday]=useState(null);
  const[notifCard,setNotifCard]=useState("unknown"); // unknown | idle | enabled | denied | unsupported | ios-browser
  const[notifLoading,setNotifLoading]=useState(false);
  const pollRef=useRef(null);
  const athleteIdRef=useRef(null);
  const isPickingRef=useRef(false);

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
          authenticatorSelection:{authenticatorAttachment:"platform",userVerification:"required",residentKey:"preferred"},
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
    const est=new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
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
    try{const{data:lbRow}=await supabase.from("leaderboard").select("*").eq("athlete_id",athleteId).single();if(lbRow)setAthleteLb(lbRow);}catch(e){}
    try{
      const _vd=new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
      const _ds=`${_vd.getFullYear()}-${String(_vd.getMonth()+1).padStart(2,'0')}-${String(_vd.getDate()).padStart(2,'0')}`;
      const{data:vt}=await supabase.from("announcements").select("message").eq("type","music_vote").eq("week_label",_ds).eq("day",athleteId).order("created_at",{ascending:false}).limit(1).maybeSingle();
      if(vt)setMyVote(vt.message);
    }catch(e){}
  };

  const submitVote=async(genre)=>{
    setMyVote(genre);
    const _d=new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
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
    return{status,time:timeStr,milestoneHit};
  };

  const selectAthlete=async(a)=>{
    setSelectedAthlete(a);
    setPin("");setPinError("");setPinStep("enter");setPinConfirm("");
    setFeedbackText("");setFeedbackSent(false);
    setPrayerText("");setPrayerSent(false);
    setInjuryText("");setInjurySent(false);setInjuryOpen(false);
    setGoalSaved({});setGoalText({});setMyVote(null);
    setTab("profile");
    // Auto-trigger Face ID if credential exists — check availability inline (don't rely on bioAvail state)
    const raw=localStorage.getItem("tf_bio_"+a.id);
    let canBio=false;
    if(raw&&window.PublicKeyCredential){
      try{canBio=await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();}catch(e){}
    }
    if(raw&&canBio){
      const handled=await authenticateWithBiometric(a);
      if(handled){
        await loadAttendance(a.id);
        await loadDraft();
        try{
          const{data}=await supabase.from("athletes").select("*").eq("id",a.id).single();
          if(data)setSelectedAthlete(data);
        }catch(e){}
        return;
      }
    }
    setScreen("login");
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
      await supabase.from("athletes").update({injury:true,injury_note:fullMsg}).eq("id",selectedAthlete.id);
      await supabase.from("inbox").insert({athlete_id:selectedAthlete.id,type:"injury",message:fullMsg});
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
          <div style={{display:"flex",gap:6,marginBottom:10,background:"#0a0a0a",borderRadius:12,padding:4,border:"0.5px solid #1e1e1e"}}>
            {[{id:"active",label:"⚡ Active"},{id:"sleeping",label:"😴 Sleeping"}].map(t=>{
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
            <div style={{position:"absolute",left:15,top:"50%",transform:"translateY(-50%)",fontSize:14,color:"#333"}}>🔍</div>
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
          <div style={{textAlign:"center",fontSize:10,color:"#222",letterSpacing:"0.08em",textTransform:"uppercase"}}>TF College Group · Triple F Sports</div>
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
          {!selectedAthlete?.pin?selectedAthlete?.name.split(" ")[0]:pinStep==="confirm"?"Confirm PIN":selectedAthlete?.name.split(" ")[0]}
        </div>
        <div style={{fontSize:12,color:"#555",marginBottom:28,letterSpacing:"0.05em"}}>
          {!selectedAthlete?.pin?"Create a 4-digit PIN":pinStep==="confirm"?"Enter the same 4 digits":"Enter your PIN to check in"}
        </div>

        {/* Biometric shortcut — shown when credential stored */}
        {bioCredId&&!showBioOffer&&(
          <div style={{marginBottom:22,display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
            <button onClick={authenticateWithBiometric}
              style={{display:"flex",alignItems:"center",gap:10,padding:"14px 28px",
                borderRadius:16,border:"1px solid "+(isForge?RED:STEEL)+"44",
                background:(isForge?RED:STEEL)+"12",color:"#fff",fontSize:15,fontWeight:700,
                cursor:"pointer",fontFamily:"Georgia,serif",letterSpacing:"0.02em",
                boxShadow:"0 0 24px "+(isForge?RED:STEEL)+"22"}}>
              <span style={{fontSize:26}}>👆</span>
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
            <div style={{fontSize:44,marginBottom:12}}>👆</div>
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
                }} style={{padding:"20px 8px",borderRadius:14,border:"0.5px solid "+(k===null?"transparent":"#222"),background:k===null?"transparent":k==="⌫"?"#161616":"#131313",fontSize:26,fontWeight:500,cursor:k===null?"default":"pointer",color:k==="⌫"?"#666":"#ebebeb",fontFamily:"sans-serif",transition:"background 0.1s",lineHeight:1}}>
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
      {id:"mcastles",label:"MCastles"},
      {id:"verse",label:"Verse"},
      {id:"attendance",label:"Attendance"},
      ...(isForge?[{id:"draft",label:"Draft"},{id:"mygroup",label:"My Group"}]:[{id:"mygroup",label:"My Group"}]),
      {id:"anvil",label:"Anvil"},
      {id:"weight",label:"Weight"},
      {id:"body",label:"Injury"},
      {id:"prs",label:"Iron Room"},
      {id:"stretching",label:"Stretch"},
      {id:"leaderboard",label:"Leaderboard"},
      {id:"prayer",label:"Prayer"},
      {id:"bracelets",label:"Bracelets"},
      {id:"photos",label:"Photos"},
      {id:"notes",label:"Notes"},
      {id:"habits",label:"Habits"},
      {id:"private",label:"Private"},
    ];

    const myGroupIdx=selectedAthlete.group_idx;
    const draftLeaders=draft?.leaders||[];
    const draftGroups=draft?.groups||[];
    const draftBracelets=draft?.bracelets||[];
    const draftPhase=draft?.phase;
    const myLeaderIdx=isForge?draftLeaders.indexOf(selectedAthlete.name):-1;
    // For Forge leaders, use their leader index; for Iron, use group_idx
    const effectiveGroupIdx=isForge&&myLeaderIdx>=0?myLeaderIdx:myGroupIdx;
    const myLeader=effectiveGroupIdx!=null?draftLeaders[effectiveGroupIdx]:null;
    const myGroup=effectiveGroupIdx!=null?draftGroups[effectiveGroupIdx]:null;
    const myBracelet=effectiveGroupIdx!=null?BRACELETS.find(b=>b.ref===draftBracelets[effectiveGroupIdx]?.ref):null;
    const myTier=selectedAthlete?.tier||null;
    const takenBracelets=(draftBracelets||[]).filter(Boolean).map(b=>b?.ref);
    const myBraceletPicked=myLeaderIdx>=0?draftBracelets[myLeaderIdx]:null;

    const nonLeaders=(athletes||[]).filter(a=>!draftLeaders.includes(a.name)).map(a=>a.name);
    const allPicked=(draftGroups||[]).flat();
    // Exclude leaders from pickIdx so snake order starts at 0 (leaders occupy groups[i][0])
    const pickedNonLeaders=allPicked.filter(n=>!draftLeaders.includes(n));
    const available=nonLeaders.filter(n=>!allPicked.includes(n));
    const totalPicks=nonLeaders.length;
    const numLeaders=draftLeaders.filter(Boolean).length||4;
    // +1 because leader occupies slot 0 in each group array
    const MAX_PICKS_PER_GROUP=numLeaders>0&&nonLeaders.length>0?Math.ceil(nonLeaders.length/numLeaders)+1:5;
    const pickSeq=snakeSeq(totalPicks,numLeaders);
    const pickIdx=pickedNonLeaders.length;
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
      if(!isMyTurn||isPickingRef.current)return;
      isPickingRef.current=true;
      playPickSound();
      try{
        // Re-read latest draft state from DB to guard against concurrent picks
        const{data:latest}=await supabase.from("draft").select("*").eq("id",draft.id).single();
        if(!latest||latest.phase==="locked"){await loadDraft();return;}
        const latestGroups=(latest.groups||[]).map(g=>[...g]);
        if(latestGroups[myLeaderIdx]&&latestGroups[myLeaderIdx].includes(name)){await loadDraft();return;}
        if(latestGroups[myLeaderIdx]&&latestGroups[myLeaderIdx].length>=MAX_PICKS_PER_GROUP){await loadDraft();return;}
        latestGroups[myLeaderIdx]=latestGroups[myLeaderIdx]||[];
        latestGroups[myLeaderIdx].push(name);
        const latestAllPicked=latestGroups.flat();
        const latestPickedNL=latestAllPicked.filter(n=>!draftLeaders.includes(n));
        const newPickIdx=latestPickedNL.length;
        const latestNonLeaders=nonLeaders.filter(n=>!latestAllPicked.includes(n));
        const done=newPickIdx>=pickSeq.length||latestNonLeaders.length===0;
        await supabase.from("draft").update({
          groups:latestGroups,
          phase:done?"locked":"draft",
          locked:done,
        }).eq("id",draft.id);
        if(done){
          for(let i=0;i<latestGroups.length;i++){
            for(const n of latestGroups[i]){
              const ath=athletes.find(a=>a.name===n);
              if(ath){
                try{await supabase.from("athletes").update({group_idx:i,tier:getTier(i,numLeaders)}).eq("id",ath.id);}catch(e){}
              }
            }
            const leader=athletes.find(a=>a.name===draftLeaders[i]);
            if(leader){
              try{await supabase.from("athletes").update({group_idx:i,tier:getTier(i,numLeaders),bracelet:draftBracelets[i]?.ref}).eq("id",leader.id);}catch(e){}
            }
          }
        }
        await loadDraft();
      }catch(e){console.error("pickAthlete:",e);}
      finally{isPickingRef.current=false;}
    };

    return(
      <>
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
                  {selectedAthlete.photo_url?<img src={selectedAthlete.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";}}/>:selectedAthlete.name[0]}
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
            <div style={{display:"flex",overflowX:"auto",scrollbarWidth:"none",WebkitOverflowScrolling:"touch",borderTop:"1px solid #141414",position:"relative"}}>
              {TABS.map(t=>{
                const icons={"profile":"👤","mcastles":"🍑","verse":"📖","attendance":"📅","draft":"🎯","mygroup":"👥","anvil":"⚒","weight":"⚖️","body":"🩺","prs":"🏋️","leaderboard":"🏆","prayer":"🙏","bracelets":"📿","photos":"📸","notes":"📝","habits":"🌟","private":"🔒","stretching":"🧘","journey":"🛤"};
                const isActive=tab===t.id;
                const tabColor=isForge?"#E8720C":STEEL;
                return(
                <button key={t.id} onClick={()=>setTab(t.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"10px 12px 8px",background:isActive?"#0e0e0e":"transparent",border:"none",borderBottom:"2px solid "+(isActive?tabColor:"transparent"),borderRight:"none",borderLeft:"none",borderTop:"none",color:isActive?"#fff":"#444",fontSize:10,fontWeight:isActive?800:400,cursor:"pointer",fontFamily:"Georgia,serif",whiteSpace:"nowrap",flexShrink:0,transition:"all 0.12s",textTransform:isActive?"uppercase":"none",letterSpacing:isActive?"0.04em":"0"}}>
                  <span style={{fontSize:15,filter:isActive?"drop-shadow(0 0 4px "+tabColor+"88)":"none"}}>{icons[t.id]||"•"}</span>
                  <span>{t.label}</span>
                </button>
                );
              })}
              <button onClick={()=>setShowTabPicker(true)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"10px 14px 8px",background:"transparent",border:"none",borderBottom:"2px solid transparent",color:"#444",fontSize:10,fontWeight:400,cursor:"pointer",fontFamily:"Georgia,serif",whiteSpace:"nowrap",flexShrink:0}}>
                <span style={{fontSize:15}}>☰</span>
                <span>All</span>
              </button>
            </div>
            {showTabPicker&&(
              <div style={{position:"fixed",inset:0,background:"#000000ee",zIndex:9999,display:"flex",flexDirection:"column"}} onClick={()=>setShowTabPicker(false)}>
                <div style={{flex:1}}/>
                <div style={{background:"#0e0e0e",borderRadius:"20px 20px 0 0",padding:"20px 16px 32px",maxHeight:"80vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#fff",letterSpacing:"0.04em",textTransform:"uppercase"}}>All Tabs</div>
                    <button onClick={()=>setShowTabPicker(false)} style={{background:"none",border:"none",color:"#666",fontSize:20,cursor:"pointer",lineHeight:1}}>✕</button>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                    {TABS.map(t=>{
                      const icons={"profile":"👤","mcastles":"🍑","verse":"📖","attendance":"📅","draft":"🎯","mygroup":"👥","anvil":"⚒","weight":"⚖️","body":"🩺","prs":"🏋️","leaderboard":"🏆","prayer":"🙏","bracelets":"📿","photos":"📸","notes":"📝","habits":"🌟","private":"🔒","stretching":"🧘","journey":"🛤"};
                      const isActive=tab===t.id;
                      const tabColor=isForge?"#E8720C":STEEL;
                      return(
                        <button key={t.id} onClick={()=>{setTab(t.id);setShowTabPicker(false);}}
                          style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"14px 8px",borderRadius:12,
                            background:isActive?tabColor+"22":"#1a1a1a",
                            border:"1px solid "+(isActive?tabColor+"66":"#252525"),
                            color:isActive?"#fff":"#888",fontSize:10,fontWeight:isActive?700:400,
                            cursor:"pointer",fontFamily:"Georgia,serif",transition:"all 0.1s"}}>
                          <span style={{fontSize:20}}>{icons[t.id]||"•"}</span>
                          <span style={{textAlign:"center",lineHeight:1.3,wordBreak:"break-word"}}>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{padding:"1.25rem",background:"#080808",minHeight:"60vh"}}>

            {tab==="profile"&&(
              <div>
                {(()=>{const _est=new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));const _d=_est.getDay();const isClassDay=[1,2,4,5].includes(_d);if(!isClassDay)return null;const isMonFri=_d===1||_d===5;return(<div style={{background:"linear-gradient(135deg,#C0392B,#8B1A1A)",borderRadius:12,padding:"12px 16px",marginBottom:12,border:"1px solid #C0392B44",display:"flex",alignItems:"center",justifyContent:"space-between"}}><div><div style={{fontSize:13,fontWeight:700,color:"#fff"}}>⚒ Class day — be early!</div><div style={{fontSize:11,color:"#ffaaaa"}}>Doors open at {isMonFri?"8:30am":"9:00am"} · On time is late</div></div><div style={{fontSize:24}}>🔥</div></div>);})()}
                {weightLoggedToday===false&&(
                  <div onClick={()=>setTab("weight")} style={{background:"linear-gradient(135deg,#1a3a1a,#0e240e)",borderRadius:12,padding:"12px 16px",marginBottom:12,border:"1px solid "+GREEN+"44",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>⚖️ Weigh-in day!</div>
                      <div style={{fontSize:11,color:GREEN}}>Tap to log your weight → stay on track</div>
                    </div>
                    <div style={{fontSize:24}}>📊</div>
                  </div>
                )}
                {/* Push notification setup card — shown until enabled */}
                {notifCard==="idle"&&(
                  <div style={{background:"#111",borderRadius:12,padding:"12px 16px",marginBottom:12,border:"1px solid #1e2a1e",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                    <div>
                      <div style={{fontSize:12,fontWeight:700,color:"#fff",marginBottom:2}}>🔔 Lock screen reminders</div>
                      <div style={{fontSize:10,color:"#555"}}>Get notified to log weight on class days</div>
                    </div>
                    <button onClick={enableProfileNotif} disabled={notifLoading} style={{padding:"8px 14px",borderRadius:8,border:"none",background:"linear-gradient(135deg,"+GREEN+","+GREEN+"aa)",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif",flexShrink:0,whiteSpace:"nowrap"}}>
                      {notifLoading?"...":"Enable →"}
                    </button>
                  </div>
                )}
                {notifCard==="ios-browser"&&(
                  <div style={{background:"#111",borderRadius:12,padding:"12px 16px",marginBottom:12,border:"1px solid #1e2a1e"}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#fff",marginBottom:6}}>🔔 Get lock screen reminders</div>
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
                      <div style={{fontSize:12,fontWeight:700,color:"#fff",marginBottom:2}}>🔔 Notifications blocked</div>
                      <div style={{fontSize:10,color:"#555"}}>Enable in your browser or phone settings</div>
                    </div>
                    <div style={{fontSize:10,color:"#555",flexShrink:0}}>Settings → Safari/Chrome</div>
                  </div>
                )}
                {bioAvail&&!bioCredId&&(
                  <div style={{background:"#111",borderRadius:12,padding:"12px 16px",marginBottom:12,border:"1px solid #1e2a3a"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:"#fff",marginBottom:2}}>👆 Enable Face ID / Touch ID</div>
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
                <DailyWord announcement={announcement}/>
                <ClassCountdown/>
                {(()=>{
                  const _e=new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
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
                      <div style={{position:"absolute",bottom:-10,right:-8,fontSize:72,opacity:0.07,lineHeight:1,userSelect:"none"}}>💬</div>
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

            {tab==="draft"&&isForge&&(
              <div>
                {/* ── Pending / setup ── */}
                {(!draft||draftPhase==="setup")&&(
                  <div style={{borderRadius:20,overflow:"hidden",border:"1px solid "+GOLD+"33",boxShadow:"0 8px 32px #00000060"}}>
                    <div style={{background:"linear-gradient(140deg,"+GOLD+"30,"+GOLD+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GOLD+","+GOLD+"44,transparent)"}}/>
                      <div style={{position:"absolute",bottom:-10,right:-8,fontSize:72,opacity:0.08,lineHeight:1,userSelect:"none",filter:"saturate(0)"}}>🎯</div>
                      <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                        <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+GOLD+"44,"+GOLD+"22)",border:"1px solid "+GOLD+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>🎯</div>
                        <div>
                          <div style={{fontSize:8,color:GOLD,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Forge Leader</div>
                          <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Draft Pending</div>
                          <div style={{fontSize:11,color:"#666",marginTop:1}}>Waiting for Coach Ant to start the draft</div>
                        </div>
                      </div>
                    </div>
                    <div style={{background:"#111",padding:"14px 18px"}}>
                      <div style={{fontSize:12,color:"#555"}}>Once the draft opens you&#39;ll pick a bracelet verse, then build your group one athlete at a time.</div>
                    </div>
                  </div>
                )}

                {/* ── Pick bracelet ── */}
                {draft&&draftPhase==="bracelet"&&myLeaderIdx>=0&&!myBraceletPicked&&(
                  <div>
                    <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",border:"1px solid "+GOLD+"33",boxShadow:"0 8px 32px #00000060"}}>
                      <div style={{background:"linear-gradient(140deg,"+GOLD+"30,"+GOLD+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GOLD+","+GOLD+"44,transparent)"}}/>
                        <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                          <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+GOLD+"44,"+GOLD+"22)",border:"1px solid "+GOLD+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>📿</div>
                          <div>
                            <div style={{fontSize:8,color:GOLD,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Step 1 of 2</div>
                            <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Pick Your Bracelet</div>
                            <div style={{fontSize:11,color:"#666",marginTop:1}}>Your verse for the week — first come first served</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {BRACELETS.map(b=>{
                        const taken=takenBracelets.includes(b.ref);
                        return(
                          <button key={b.ref} disabled={taken} onClick={()=>pickBracelet(b)} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:14,border:"1px solid "+(taken?"#1e1e1e":b.hex+"55"),background:taken?"#0d0d0d":b.hex+"12",cursor:taken?"not-allowed":"pointer",fontFamily:"Georgia,serif",opacity:taken?0.35:1,textAlign:"left"}}>
                            <div style={{width:16,height:16,borderRadius:"50%",background:b.hex,flexShrink:0,boxShadow:taken?"none":"0 0 10px "+b.hex+"88"}}/>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:13,fontWeight:600,color:taken?"#444":b.hex,marginBottom:2}}>{b.color}</div>
                              <div style={{fontSize:11,color:taken?"#333":"#888",fontStyle:"italic",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.ref} — {b.text}</div>
                            </div>
                            {taken?<span style={{fontSize:10,color:"#333",flexShrink:0}}>Taken</span>:<span style={{fontSize:16,flexShrink:0}}>→</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Bracelet picked, waiting for others ── */}
                {draft&&draftPhase==="bracelet"&&myLeaderIdx>=0&&myBraceletPicked&&(()=>{
                  const pickedB=BRACELETS.find(b=>b.ref===myBraceletPicked.ref);
                  return(
                    <div style={{borderRadius:20,overflow:"hidden",border:"1px solid "+(pickedB?.hex||GOLD)+"44",boxShadow:"0 8px 32px "+(pickedB?.hex||GOLD)+"18"}}>
                      <div style={{height:3,background:"linear-gradient(90deg,"+(pickedB?.hex||GOLD)+","+(pickedB?.hex||GOLD)+"44,transparent)"}}/>
                      <div style={{background:"linear-gradient(140deg,"+(pickedB?.hex||GOLD)+"22,"+(pickedB?.hex||GOLD)+"06,#0d0d0d)",padding:"18px 18px 16px",position:"relative",overflow:"hidden"}}>
                        <div style={{fontSize:9,color:pickedB?.hex||GOLD,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:12}}>Bracelet locked in</div>
                        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                          <div style={{width:18,height:18,borderRadius:"50%",background:pickedB?.hex,boxShadow:"0 0 14px "+(pickedB?.hex||GOLD)+"88",flexShrink:0}}/>
                          <div style={{fontSize:18,fontWeight:800,color:pickedB?.hex||GOLD}}>{pickedB?.color} — {pickedB?.ref}</div>
                        </div>
                        <div style={{fontSize:14,color:"#ddd",fontStyle:"italic",lineHeight:1.8,fontFamily:"Georgia,serif",padding:"10px 14px",background:(pickedB?.hex||GOLD)+"0D",borderRadius:10,borderLeft:"2px solid "+(pickedB?.hex||GOLD)}}>
                          &#8220;{pickedB?.text}&#8221;
                        </div>
                      </div>
                      <div style={{background:"#111",padding:"12px 18px",display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:ORANGE,boxShadow:"0 0 8px "+ORANGE,animation:"pulse 1s infinite"}}/>
                        <span style={{fontSize:12,color:"#666"}}>Waiting for other leaders to pick their bracelets...</span>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Live draft ── */}
                {draft&&draftPhase==="draft"&&myLeaderIdx>=0&&(
                  <div>
                    {/* Your turn */}
                    {isMyTurn?(
                      <div>
                        <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",border:"2px solid "+RED+"88",boxShadow:"0 8px 40px "+RED+"44"}}>
                          <div style={{height:3,background:RED}}/>
                          <div style={{background:"linear-gradient(140deg,"+RED+"33,"+RED+"10,#0d0d0d)",padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                            <div>
                              <div style={{fontSize:9,color:RED,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:4}}>🔴 Your pick</div>
                              <div style={{fontSize:18,fontWeight:900,color:"#fff"}}>Choose your next athlete</div>
                              <div style={{fontSize:11,color:"#888",marginTop:2}}>{pickedNonLeaders.length} of {MAX_PICKS_PER_GROUP-1} picks used</div>
                            </div>
                            <CountdownPicker onTimeout={async()=>{
                              // Re-read available from DB to avoid stale closure
                              try{
                                const{data}=await supabase.from("draft").select("groups").eq("id",draft.id).single();
                                const latestPicked=(data?.groups||[]).flat();
                                const freshAvail=nonLeaders.filter(n=>!latestPicked.includes(n));
                                if(freshAvail.length>0)pickAthlete(freshAvail[0]);
                              }catch(e){if(available.length>0)pickAthlete(available[0]);}
                            }}/>
                          </div>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
                          {available.map(name=>{
                            const ath=athletes.find(a=>a.name===name);
                            const full=(draftGroups[myLeaderIdx]||[]).length>=MAX_PICKS_PER_GROUP;
                            return(
                              <button key={name} onClick={()=>pickAthlete(name)} disabled={full} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:14,border:"1px solid "+(full?"#1a1a1a":"#333"),background:full?"#0d0d0d":"#141414",cursor:full?"not-allowed":"pointer",fontFamily:"Georgia,serif",textAlign:"left",transition:"border-color 0.1s"}}>
                                <div style={{width:42,height:42,borderRadius:"50%",background:"#222",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"#666",overflow:"hidden",border:"1.5px solid #333"}}>
                                  {ath?.photo_url?<img src={ath.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(name||"?")[0]}
                                </div>
                                <div style={{flex:1}}>
                                  <div style={{fontSize:14,fontWeight:600,color:full?"#444":"#fff"}}>{name}</div>
                                  <div style={{fontSize:11,color:"#555"}}>{ath?.role==="forge"?"Forge":"Iron"}</div>
                                </div>
                                {!full&&<span style={{fontSize:18,color:"#555"}}>+</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ):(
                      /* Waiting for another leader */
                      <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",border:"1px solid "+ORANGE+"44",boxShadow:"0 8px 32px "+ORANGE+"18"}}>
                        <div style={{height:3,background:"linear-gradient(90deg,"+ORANGE+","+ORANGE+"44,transparent)"}}/>
                        <div style={{background:"linear-gradient(140deg,"+ORANGE+"22,"+ORANGE+"08,#0d0d0d)",padding:"16px 18px"}}>
                          <div style={{fontSize:9,color:ORANGE,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:8}}>Draft is live</div>
                          <div style={{fontSize:16,fontWeight:800,color:"#fff",marginBottom:4}}>
                            {draftLeaders[currentPickerIdx]||"Next leader"} is picking...
                          </div>
                          <div style={{fontSize:11,color:"#666"}}>You&#39;re up when it&#39;s your turn — auto-refreshing</div>
                        </div>
                        <div style={{background:"#0e0e0e",padding:"10px 18px",display:"flex",alignItems:"center",gap:8}}>
                          <div style={{fontSize:10,color:"#555"}}>Pick {pickedNonLeaders.length+1} of {totalPicks} · {available.length} athletes remaining</div>
                        </div>
                      </div>
                    )}

                    {/* Live draft board */}
                    <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700,marginBottom:8}}>Draft board</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      {Array.from({length:numLeaders},(_,i)=>{
                        const brac=BRACELETS.find(b=>b.ref===draftBracelets[i]?.ref);
                        const gc=brac?.hex||LC[i%LC.length];
                        const isMe=i===myLeaderIdx;
                        const isCurrent=i===currentPickerIdx&&draftPhase==="draft";
                        return(
                          <div key={i} style={{borderRadius:14,overflow:"hidden",border:"1px solid "+(isCurrent?gc+"88":isMe?gc+"44":"#1e1e1e"),boxShadow:isCurrent?"0 0 16px "+gc+"33":"none"}}>
                            {isCurrent&&<div style={{height:2,background:gc}}/>}
                            <div style={{background:isMe?gc+"14":"#0f0f0f",padding:"10px 12px"}}>
                              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                                {brac&&<div style={{width:8,height:8,borderRadius:"50%",background:brac.hex,flexShrink:0}}/>}
                                <span style={{fontSize:11,fontWeight:700,color:isMe?gc:"#ccc",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{draftLeaders[i]||"—"}{isMe?" (you)":""}</span>
                                {isCurrent&&<span style={{fontSize:9,background:gc+"22",color:gc,padding:"1px 6px",borderRadius:8,marginLeft:"auto",flexShrink:0}}>picking</span>}
                              </div>
                              {(draftGroups[i]||[]).length===0?(
                                <div style={{fontSize:10,color:"#333",fontStyle:"italic"}}>No picks yet</div>
                              ):(draftGroups[i]||[]).map(n=>{
                                const nath=athletes.find(a=>a.name===n);
                                return(
                                  <div key={n} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",borderTop:"0.5px solid #1a1a1a"}}>
                                    <div style={{width:22,height:22,borderRadius:"50%",background:"#1a1a1a",overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#555"}}>
                                      {nath?.photo_url?<img src={nath.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:n[0]}
                                    </div>
                                    <span style={{fontSize:11,color:isMe?"#ccc":"#666"}}>{n.split(" ")[0]}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Draft complete / locked ── */}
                {draft&&(draftPhase==="locked"||draftComplete)&&myLeaderIdx>=0&&(()=>{
                  const myBrac=BRACELETS.find(b=>b.ref===draftBracelets[myLeaderIdx]?.ref);
                  const gc=myBrac?.hex||LC[myLeaderIdx%LC.length];
                  return(
                    <div>
                      {/* Banner */}
                      <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",border:"1px solid "+GREEN+"44",boxShadow:"0 8px 32px "+GREEN+"18"}}>
                        <div style={{height:3,background:"linear-gradient(90deg,"+GREEN+","+GREEN+"44,transparent)"}}/>
                        <div style={{background:"linear-gradient(140deg,"+GREEN+"22,"+GREEN+"08,#0d0d0d)",padding:"16px 18px",display:"flex",alignItems:"center",gap:14}}>
                          <div style={{width:44,height:44,borderRadius:14,background:GREEN+"22",border:"1px solid "+GREEN+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>✅</div>
                          <div>
                            <div style={{fontSize:9,color:GREEN,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Draft Complete</div>
                            <div style={{fontSize:18,fontWeight:900,color:"#fff"}}>Groups are locked</div>
                            <div style={{fontSize:11,color:"#555",marginTop:1}}>Iron sharpens iron — lead well</div>
                          </div>
                        </div>
                      </div>

                      {/* My group summary */}
                      <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",border:"1px solid "+gc+"44",boxShadow:"0 6px 24px "+gc+"18"}}>
                        <div style={{height:3,background:"linear-gradient(90deg,"+gc+","+gc+"44,transparent)"}}/>
                        <div style={{background:"linear-gradient(140deg,"+gc+"18,"+gc+"06,#0d0d0d)",padding:"16px 18px 14px"}}>
                          <div style={{fontSize:9,color:gc,textTransform:"uppercase",letterSpacing:"0.18em",fontWeight:900,marginBottom:10}}>Your group</div>
                          {myBrac&&(
                            <div style={{marginBottom:14}}>
                              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                                <div style={{width:12,height:12,borderRadius:"50%",background:myBrac.hex,boxShadow:"0 0 10px "+myBrac.hex+"88"}}/>
                                <span style={{fontSize:11,fontWeight:700,color:myBrac.hex,textTransform:"uppercase",letterSpacing:"0.07em"}}>{myBrac.color} — {myBrac.ref}</span>
                              </div>
                              <div style={{fontSize:13,color:"#ddd",fontStyle:"italic",lineHeight:1.7,fontFamily:"Georgia,serif",padding:"10px 14px",background:gc+"0D",borderRadius:10,borderLeft:"2px solid "+gc}}>
                                &#8220;{myBrac.text}&#8221;
                              </div>
                            </div>
                          )}
                        </div>
                        <div style={{background:"#0e0e0e",padding:"10px 14px",display:"flex",flexDirection:"column",gap:6}}>
                          {/* Leader row */}
                          <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:gc+"14",borderRadius:12,border:"0.5px solid "+gc+"33"}}>
                            <div style={{width:36,height:36,borderRadius:"50%",background:gc+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:gc,flexShrink:0,overflow:"hidden",border:"1.5px solid "+gc}}>
                              {selectedAthlete?.photo_url?<img src={selectedAthlete.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:selectedAthlete?.name[0]}
                            </div>
                            <div>
                              <div style={{fontSize:13,fontWeight:700,color:gc}}>{selectedAthlete?.name}</div>
                              <div style={{fontSize:10,color:gc+"88"}}>Group Leader</div>
                            </div>
                          </div>
                          {/* Members */}
                          {(draftGroups[myLeaderIdx]||[]).map(n=>{
                            const nath=athletes.find(a=>a.name===n);
                            return(
                              <div key={n} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"#151515",borderRadius:12,border:"0.5px solid #222"}}>
                                <div style={{width:36,height:36,borderRadius:"50%",background:"#222",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#555",flexShrink:0,overflow:"hidden",border:"1.5px solid #2a2a2a"}}>
                                  {nath?.photo_url?<img src={nath.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:n[0]}
                                </div>
                                <div style={{fontSize:13,color:"#ccc"}}>{n}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* All groups */}
                      <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700,marginBottom:8}}>All groups</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                        {draftLeaders.filter(Boolean).map((leader,i)=>{
                          const brac=BRACELETS.find(b=>b.ref===draftBracelets[i]?.ref);
                          const c=brac?.hex||LC[i%LC.length];
                          const isMe=i===myLeaderIdx;
                          return(
                            <div key={i} style={{borderRadius:14,overflow:"hidden",border:"1px solid "+(isMe?c+"55":"#1e1e1e")}}>
                              <div style={{height:2,background:c}}/>
                              <div style={{background:isMe?c+"14":"#0f0f0f",padding:"10px 12px"}}>
                                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                                  {brac&&<div style={{width:8,height:8,borderRadius:"50%",background:brac.hex,flexShrink:0}}/>}
                                  <span style={{fontSize:11,fontWeight:700,color:isMe?c:"#ccc",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{leader}{isMe?" ✓":""}</span>
                                </div>
                                {brac&&<div style={{fontSize:10,color:"#444",fontStyle:"italic",marginBottom:6,lineHeight:1.4}}>"{brac.text}"</div>}
                                {(draftGroups[i]||[]).map(n=>{
                                  const nath=athletes.find(a=>a.name===n);
                                  return(
                                    <div key={n} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0",borderTop:"0.5px solid #1a1a1a"}}>
                                      <div style={{width:20,height:20,borderRadius:"50%",background:"#1a1a1a",overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#555"}}>
                                        {nath?.photo_url?<img src={nath.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:n[0]}
                                      </div>
                                      <span style={{fontSize:11,color:isMe?"#bbb":"#555"}}>{n.split(" ")[0]}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {tab==="mygroup"&&(
              <div>
                {(!draft||(myGroupIdx==null&&myLeaderIdx<0))?(
                  <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+STEEL+"33"}}>
                    <div style={{background:"linear-gradient(140deg,"+STEEL+"30,"+STEEL+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+STEEL+","+STEEL+"44,transparent)"}}/>
                      <div style={{position:"absolute",bottom:-10,right:-8,fontSize:72,opacity:0.08,lineHeight:1,userSelect:"none",filter:"saturate(0)"}}>⏳</div>
                      <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+STEEL+"12,transparent 70%)",pointerEvents:"none"}}/>
                      <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                        <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+STEEL+"44,"+STEEL+"22)",border:"1px solid "+STEEL+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+STEEL+"33"}}>⏳</div>
                        <div>
                          <div style={{fontSize:8,color:STEEL,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Your Group</div>
                          <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Waiting on the Draft</div>
                          <div style={{fontSize:11,color:"#666",marginTop:1}}>You'll appear here once you've been picked</div>
                        </div>
                      </div>
                    </div>
                    <div style={{background:"#111",padding:"16px 18px"}}>
                      <div style={{fontSize:14,color:"#fff",marginBottom:draftPhase==="draft"?12:0}}>
                        {draftPhase==="bracelet"?"Leaders are picking bracelets...":draftPhase==="draft"?"Draft is live — waiting to be picked...":"Draft pending..."}
                      </div>
                      {/* Show athlete's name so they know they're in the pool */}
                      {draftPhase==="draft"&&(
                        <div style={{background:"#1a1a1a",borderRadius:10,padding:"12px 16px",border:"1px solid #333",display:"flex",alignItems:"center",gap:12}}>
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
                  </div>
                ):(
                  <div>
                    {myLeader&&(()=>{
                      const gc=myBracelet?.hex||LC[effectiveGroupIdx%LC.length]||PUR;
                      const leaderAth=athletes.find(a=>a.name===myLeader);
                      const amLeader=myLeaderIdx>=0;
                      return(
                        <div>
                          {/* Group identity card */}
                          <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",border:"1px solid "+gc+"44",boxShadow:"0 8px 32px "+gc+"18"}}>
                            <div style={{height:3,background:"linear-gradient(90deg,"+gc+","+gc+"44,transparent)"}}/>
                            <div style={{background:"linear-gradient(140deg,"+gc+"22,"+gc+"06,#0d0d0d)",padding:"18px 18px 16px",position:"relative",overflow:"hidden"}}>
                              <div style={{position:"absolute",bottom:-10,right:-4,fontSize:80,opacity:0.05,lineHeight:1,userSelect:"none",filter:"saturate(0)"}}>⚒</div>
                              <div style={{fontSize:9,color:gc,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:14}}>
                                {amLeader?"You&#39;re Leading This Group":"Your Group"}
                              </div>
                              {/* Leader row */}
                              <div style={{display:"flex",alignItems:"center",gap:14}}>
                                <div style={{width:64,height:64,borderRadius:"50%",border:"2px solid "+gc,overflow:"hidden",flexShrink:0,background:"#222",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:700,color:gc,boxShadow:"0 0 24px "+gc+"44"}}>
                                  {leaderAth?.photo_url?<img src={leaderAth.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(myLeader||"?")[0]}
                                </div>
                                <div style={{flex:1}}>
                                  <div style={{fontSize:22,fontWeight:900,color:"#fff",letterSpacing:"-0.02em",lineHeight:1.1}}>{myLeader}</div>
                                  <div style={{fontSize:11,color:"#666",marginTop:3}}>{amLeader?"Group Leader · That&#39;s you":"Group Leader"}</div>
                                  {myTier&&(
                                    <div style={{marginTop:6}}>
                                      <span style={{fontSize:10,background:gc+"22",color:gc,padding:"3px 10px",borderRadius:20,fontWeight:700,border:"0.5px solid "+gc+"44"}}>Tier {myTier}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
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
                          {myGroup&&myGroup.length>0&&(
                            <div style={{background:"#0e0e0e",borderRadius:16,overflow:"hidden",border:"0.5px solid #1e1e1e",marginBottom:12}}>
                              <div style={{padding:"12px 16px",borderBottom:"0.5px solid #1a1a1a",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                <div style={{fontSize:11,fontWeight:700,color:"#666",textTransform:"uppercase",letterSpacing:"0.1em"}}>Teammates</div>
                                <div style={{fontSize:10,color:"#444"}}>{myGroup.length} member{myGroup.length!==1?"s":""}</div>
                              </div>
                              <div style={{padding:"10px 12px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                                {myGroup.map((name,i)=>{
                                  const ath=athletes.find(a=>a.name===name);
                                  const isMe=name===selectedAthlete?.name;
                                  return(
                                    <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:isMe?gc+"18":"#151515",borderRadius:12,border:"0.5px solid "+(isMe?gc+"44":"#222")}}>
                                      <div style={{width:38,height:38,borderRadius:"50%",background:isMe?gc+"33":"#222",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:isMe?gc:"#555",flexShrink:0,overflow:"hidden",border:"1.5px solid "+(isMe?gc:"#2a2a2a")}}>
                                        {ath?.photo_url?<img src={ath.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(name||"?")[0]}
                                      </div>
                                      <div style={{minWidth:0}}>
                                        <div style={{fontSize:12,fontWeight:isMe?700:500,color:isMe?gc:"#ccc",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name.split(" ")[0]}</div>
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
              </div>
            )}

            
            
            {tab==="prayer"&&<PrayerWall athleteId={selectedAthlete.id} athleteName={selectedAthlete.name}/>}

            {tab==="leaderboard"&&<AthleteLeaderboard athleteId={selectedAthlete.id}/>}

            {tab==="bracelets"&&<BraceletWall athleteBracelet={selectedAthlete.bracelet}/>}

            {tab==="notes"&&<NotesTab athleteId={selectedAthlete.id} athlete={selectedAthlete}/>}


            {tab==="weight"&&<WeightTracker athleteId={selectedAthlete.id} onWeighed={()=>setWeightLoggedToday(true)}/>}

            {tab==="body"&&<InjuryBodyMap athleteId={selectedAthlete.id}/>}

            {tab==="goals"&&<GoalsCountdown athlete={selectedAthlete}/>}

            {tab==="verse"&&<VerseOfDay/>}

            {tab==="anvil"&&<AnvilHistory athleteId={selectedAthlete?.id} athleteName={selectedAthlete?.name}/>}

            {tab==="photos"&&<GroupPhotos/>}

            {tab==="mcastles"&&<MCastlesTab/>}

            {tab==="attendance"&&(
              <div>
                <AttendanceCalendar athleteId={selectedAthlete.id}/>
                <div style={{borderRadius:20,marginTop:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+ORANGE+"33"}}>
                  <div style={{background:"linear-gradient(140deg,"+ORANGE+"30,"+ORANGE+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+ORANGE+","+ORANGE+"44,transparent)"}}/>
                    <div style={{position:"absolute",bottom:-10,right:-8,fontSize:72,opacity:0.08,lineHeight:1,userSelect:"none",filter:"saturate(0)"}}>📅</div>
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


            {tab==="prs"&&<PRLog athleteId={selectedAthlete.id} gender={selectedAthlete.gender}/>}
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

            {tab==="habits"&&<HabitsTab athleteId={selectedAthlete.id}/>}

            {tab==="private"&&(
              <div>
                <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+STEEL+"33"}}>
                  <div style={{background:"linear-gradient(140deg,"+STEEL+"30,"+STEEL+"10,#0d0d0d)",padding:"20px 18px 18px",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+STEEL+","+STEEL+"44,transparent)"}}/>
                    <div style={{position:"absolute",bottom:-10,right:-8,fontSize:72,opacity:0.08,lineHeight:1,userSelect:"none",filter:"saturate(0)"}}>✉️</div>
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
                    <div style={{position:"absolute",bottom:-10,right:-8,fontSize:72,opacity:0.08,lineHeight:1,userSelect:"none",filter:"saturate(0)"}}>🙏</div>
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
      </>
    );
  }
  return null;
}
// force redeploy Sat Apr 18 17:18:14 UTC 2026
