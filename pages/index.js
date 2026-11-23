// v4
import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { supabase } from "../lib/supabase";
import { nowEST } from "../lib/dates";
import { loadSeason, seasonStart, seasonEnd, seasonWeeks, isBeforeSeason, firstClassAt, fmtFirstClass } from "../lib/season";
import Icon from "../components/Icon";
import { useMood } from "../lib/ambient";
import { authApi, authErrorText } from "../lib/session";

const GOLD="#D4AF37";
const RED="#C0392B";
const STEEL="#8CA0B0";
const ORANGE="#E8720C";
const GREEN="#2FA869";
const PURPLE="#8C82E8";

const QUOTES=[
  {q:"Iron sharpens iron. Show up and make each other better.",a:"Proverbs 27:17"},
  {q:"Early is the standard. Excellence is the expectation. Faith is the foundation.",a:"Coach Ant"},
  {q:"The grind you put in when nobody's watching is what separates you.",a:"Coach Ant"},
  {q:"Be strong and courageous. Do not be afraid. The Lord your God is with you.",a:"Joshua 1:9"},
  {q:"Champions are made in the moments when you want to quit but don't.",a:"Coach Ant"},
  {q:"Your body will do what your mind tells it. Train your mind first.",a:"Coach Ant"},
  {q:"You don't rise to the level of your goals. You fall to the level of your systems.",a:"Coach Ant"},
  {q:"Process over outcome. Fall in love with the work.",a:"Coach Ant"},
  {q:"Confidence runs out. Belief doesn't.",a:"Coach Ant"},
  {q:"What you do in private will eventually show up in public.",a:"Coach Ant"},
  {q:"Do not be anxious about anything. In every situation, present your requests to God.",a:"Philippians 4:6"},
  {q:"The iron does not move. But the iron that shows up every day becomes the anvil.",a:"Coach Ant"},
];

const SCHEDULE=[
  {d:"Mon",dow:1,time:"9:00",title:"Mindset Monday"},
  {d:"Tue",dow:2,time:"9:30",title:"Training"},
  {d:"Thu",dow:4,time:"9:30",title:"Training"},
  {d:"Fri",dow:5,time:"9:00",title:"Fellowship Friday"},
];
const VERSES=[
  {t:"As iron sharpens iron, so one person sharpens another.",r:"Proverbs 27:17"},
  {t:"I can do all things through Christ who strengthens me.",r:"Philippians 4:13"},
  {t:"Be strong and courageous. Do not be afraid. The Lord your God is with you.",r:"Joshua 1:9"},
  {t:"Do not be anxious about anything, but in every situation present your requests to God.",r:"Philippians 4:6"},
  {t:"For we are God's handiwork, created in Christ Jesus to do good works.",r:"Ephesians 2:10"},
  {t:"Let us not become weary in doing good, for at the proper time we will reap a harvest.",r:"Galatians 6:9"},
  {t:"The Lord is my strength and my shield; my heart trusts in him.",r:"Psalm 28:7"},
  {t:"Even youths grow tired and weary, but those who hope in the Lord will renew their strength.",r:"Isaiah 40:31"},
  {t:"No discipline seems pleasant at the time, but painful. Later on, however, it produces righteousness.",r:"Hebrews 12:11"},
  {t:"Whatever you do, work at it with all your heart, as working for the Lord.",r:"Colossians 3:23"},
  {t:"The heart of man plans his way, but the Lord establishes his steps.",r:"Proverbs 16:9"},
  {t:"For God gave us a spirit not of fear but of power and love and self-control.",r:"2 Timothy 1:7"},
];

export default function Landing(){
  useMood("base");
  const[qrDataUrl,setQrDataUrl]=useState("");
  const[qrFullscreen,setQrFullscreen]=useState(false);
  const[qrUnlocked,setQrUnlocked]=useState(false);
  const[qrPinModal,setQrPinModal]=useState(false);
  const[qrPin,setQrPin]=useState("");
  const[qrPinError,setQrPinError]=useState(false);
  const[loaded,setLoaded]=useState(false);
  const[time,setTime]=useState(null);
  const[countdown,setCountdown]=useState(null);
  const[anvilWinner,setAnvilWinner]=useState(null);
  const[athleteCount,setAthleteCount]=useState(null);
  const[todayAttendance,setTodayAttendance]=useState(null);
  const[forgeLeaders,setForgeLeaders]=useState([]);
  const[weather,setWeather]=useState(null);
  const[weekProgress,setWeekProgress]=useState(null);
  const[classCount,setClassCount]=useState(null);
  const[photo,setPhoto]=useState(null);
  const[notifGranted,setNotifGranted]=useState(false);
  const[groupmeLink,setGroupmeLink]=useState("https://groupme.com/join_group/111967377/1JobSG7L");
  const[themeMode,setThemeMode]=useState("dark");
  // `mounted` gates client-only values so the first client render matches the
  // server render (no hydration mismatch); real values apply after mount.
  const[mounted,setMounted]=useState(false);
  // Season the coach set; before its first class the group is off, so no "class today"
  const seasonRef=useRef(null);
  const[preSeason,setPreSeason]=useState(false);
  useEffect(()=>{
    setMounted(true);
    try{setThemeMode(localStorage.getItem("tf_theme")==="light"?"light":"dark");}catch(e){}
    try{if(sessionStorage.getItem("qr_unlocked")==="1")setQrUnlocked(true);}catch(e){}
    try{if("Notification" in window&&Notification.permission==="granted"&&localStorage.getItem("notif_disabled")!=="true")setNotifGranted(true);}catch(e){}
  },[]);
  const toggleTheme=()=>setThemeMode(prev=>{const next=prev==="dark"?"light":"dark";try{localStorage.setItem("tf_theme",next);}catch(e){}if(typeof document!=="undefined")document.documentElement.setAttribute("data-theme",next==="light"?"light":"");return next;});

  useEffect(()=>{
    import("qrcode").then(QRCode=>{
      QRCode.default.toDataURL("https://tfcollegegroup.com/checkin",{width:200,margin:2,color:{dark:"#1a1a1a",light:"#ffffff"}}).then(setQrDataUrl);
    });
  },[]);

  useEffect(()=>{
    setTimeout(()=>setLoaded(true),100);

    // Live clock + countdown
    const t=setInterval(()=>{
      const now=new Date();
      setTime(now);
      // Next class time
      const getNextClass=()=>{
        const ssn=seasonRef.current;
        if(isBeforeSeason(ssn,now))return{diff:firstClassAt(ssn)-now,label:"First class · "+fmtFirstClass(ssn)};
        const classDays=[1,2,4,5]; // Mon,Tue,Thu,Fri
        let next=new Date(now);
        next.setSeconds(0);next.setMilliseconds(0);
        for(let i=0;i<8;i++){
          const d=new Date(next);
          d.setDate(next.getDate()+i);
          if(classDays.includes(d.getDay())){
            const isMonFri=d.getDay()===1||d.getDay()===5;
            d.setHours(isMonFri?9:9,isMonFri?0:30,0,0);
            if(d>now)return{diff:d-now,label:"Next class"};
          }
        }
        return null;
      };
      const nc=getNextClass();
      if(nc){
        const{diff,label}=nc;
        setCountdown({
          days:Math.floor(diff/(1000*60*60*24)),
          hours:Math.floor((diff%(1000*60*60*24))/(1000*60*60)),
          mins:Math.floor((diff%(1000*60*60))/(1000*60)),
          secs:Math.floor((diff%(1000*60))/1000),
          label,
        });
      }
    },1000);

    // Load data
    const loadData=async()=>{
      try{const{count}=await supabase.from("athletes").select("id",{count:"exact",head:true}).eq("status","active");if(count!=null)setAthleteCount(count);}catch(e){}
      try{
        const{data:anvData}=await supabase.from("anvil").select("*").order("created_at",{ascending:false}).limit(1);
        if(anvData&&anvData[0]){
          const winner=anvData[0];
          try{
            const{data:athData}=await supabase.from("athletes").select("photo_url").eq("name",winner.athlete_name).maybeSingle();
            winner.photo_url=athData?.photo_url||null;
          }catch(e){}
          setAnvilWinner(winner);
        }
      }catch(e){}
      try{
        const estNow=nowEST();
        const today=estNow.getFullYear()+"-"+String(estNow.getMonth()+1).padStart(2,"0")+"-"+String(estNow.getDate()).padStart(2,"0");
        const{count}=await supabase.from("attendance").select("id",{count:"exact",head:true}).eq("date",today).eq("status","early");
        if(count!=null)setTodayAttendance(count);
      }catch(e){}
      // Classes held this season (not all-time)
      try{
        const ssn=await loadSeason();
        if(ssn.explicit){
          const{data}=await supabase.from("attendance").select("date").gte("date",ssn.start).lte("date",ssn.end);
          if(data)setClassCount(new Set(data.map(r=>r.date)).size);
        }
      }catch(e){}
      try{
        const{data}=await supabase.from("draft").select("*").order("created_at",{ascending:false}).limit(1);
        let names=[];
        if(data&&data[0]&&data[0].leaders&&data[0].leaders.some(l=>l)){
          names=data[0].leaders.filter(Boolean);
        }else{
          const{data:aths}=await supabase.from("athletes").select("name").eq("role","forge").eq("status","active");
          if(aths&&aths.length>0)names=aths.map(a=>a.name);
        }
        if(names.length>0){
          try{
            const{data:athObjs}=await supabase.from("athletes").select("name,photo_url").in("name",names);
            const photoMap={};
            (athObjs||[]).forEach(a=>{photoMap[a.name]=a.photo_url||null;});
            setForgeLeaders(names.map(n=>({name:n,photo_url:photoMap[n]||null})));
          }catch(e){setForgeLeaders(names.map(n=>({name:n,photo_url:null})));}
        }
      }catch(e){}
      // Season progress — only while a coach-set season is actually running
      try{
        const season=await loadSeason();
        seasonRef.current=season;
        setPreSeason(isBeforeSeason(season));
        const nowDate=new Date();
        if(season.explicit&&nowDate>=seasonStart(season)&&nowDate<=seasonEnd(season)){
          const totalWeeks=seasonWeeks(season);
          const diffWeeks=Math.floor((nowDate-seasonStart(season))/(1000*60*60*24*7));
          const current=Math.min(diffWeeks+1,totalWeeks);
          setWeekProgress({current,total:totalWeeks,pct:Math.round((current/totalWeeks)*100),label:season.label});
        }else setWeekProgress(null);
      }catch(e){setWeekProgress(null);}
      try{const{data}=await supabase.from("culture_photos").select("*").order("created_at",{ascending:false}).limit(1);if(data&&data[0])setPhoto(data[0]);}catch(e){}
      try{const{data}=await supabase.from("announcements").select("day").eq("type","groupme_link").order("created_at",{ascending:false}).limit(1).maybeSingle();if(data?.day)setGroupmeLink(data.day);}catch(e){}
      try{
        const r=await fetch("https://api.open-meteo.com/v1/forecast?latitude=35.9606&longitude=-83.9207&current_weather=true&temperature_unit=fahrenheit");
        const d=await r.json();
        if(d.current_weather){
          const code=d.current_weather.weathercode;
          const temp=Math.round(d.current_weather.temperature);
          const icons={0:"☀️",1:"🌤",2:"⛅",3:"☁️",45:"🌫",48:"🌫",51:"🌦",61:"🌧",71:"❄️",80:"🌦",95:"⛈"};
          const icon=icons[code]||"🌡";
          setWeather({temp,icon,wind:Math.round(d.current_weather.windspeed)});
        }
      }catch(e){}
    };
    loadData();
    return()=>clearInterval(t);
  },[]);

  const toggleNotif=()=>{
    if(!("Notification" in window)){alert("Notifications not supported on this browser.");return;}
    if(notifGranted){
      // Can't revoke programmatically — store a preference in localStorage
      localStorage.setItem("notif_disabled","true");
      setNotifGranted(false);
    }else{
      localStorage.removeItem("notif_disabled");
      if(Notification.permission==="granted"){
        setNotifGranted(true);
        new Notification("TF College Group",{body:"Notifications back on!",icon:"/icon.png"});
      }else{
        Notification.requestPermission().then(p=>{
          if(p==="granted"){
            setNotifGranted(true);
            new Notification("TF College Group",{body:"You'll be notified when draft starts!",icon:"/icon.png"});
          }else{
            alert("Notifications blocked. Go to your browser settings to allow them.");
          }
        });
      }
    }
  };

  // The QR is unlocked with Coach Ant's PIN, checked on the server.
  const handleQrUnlock=(next)=>{
    if(next.length>4)return;
    setQrPin(next);
    setQrPinError(false);
    if(next.length===4){
      authApi({action:"login",kind:"coach",id:"ant",pin:next}).then(r=>{
        if(r.token){
          try{sessionStorage.setItem("qr_unlocked","1");}catch(e){}
          setQrUnlocked(true);setQrPinModal(false);setQrFullscreen(true);
        }else{setQrPinError(r.error==="locked"?authErrorText(r):true);setQrPin("");}
      });
    }
  };

  const estTime=(mounted&&time)?new Date(time.toLocaleString("en-US",{timeZone:"America/New_York"})):new Date();
  const day=mounted?["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][estTime.getDay()]:"Mon";
  const isClassDay=mounted&&!preSeason&&["Mon","Tue","Thu","Fri"].includes(day);
  const isMonFri=typeof window!=="undefined"&&(day==="Mon"||day==="Fri");
  const todayQuote=QUOTES[(mounted?new Date().getDate():0)%QUOTES.length];

  const verse=VERSES[(mounted?new Date().getDate():0)%VERSES.length];
  // Once today's class has started, the countdown is to the next one
  const classTitle=day==="Mon"?"Mindset Monday":day==="Fri"?"Fellowship Friday":"Training";
  const classTime=isMonFri?"9:00am":"9:30am";
  const started=isClassDay&&(estTime.getHours()*60+estTime.getMinutes())>=(isMonFri?540:570);
  const todayDow=mounted?estTime.getDay():-1;
  const status=!mounted?"":preSeason?"Season starts soon":isClassDay?"Class day":"No class today";
  const tiles=[
    {href:"/athlete",icon:"profile",label:"Athlete app",sub:"Check in · lifts · habits",c:"#e8720c"},
    {href:"/coach",icon:"anvil",label:"Coach",sub:"Roster · attendance · program",c:"#d4af37"},
    {href:"/rack",icon:"barbell",label:"Rack station",sub:"Log sets at the rack",c:"#8e7cf0"},
    {href:"/callout",icon:"megaphone",label:"Call-out station",sub:"Weight room iPad",c:"#e5484d"},
  ];

  return(
    <>
      <Head>
        <title>TF College Group</title>
        <meta name="description" content="TF College Group — Iron sharpens iron"/>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
        <meta name="theme-color" content="#080808"/>
        <link rel="manifest" href="/manifest.json"/>
      </Head>
      <div className={"tfx hm"+(loaded?" is-in":"")}>
        <header className="hm-bar">
          <a href="/" className="hm-brand"><img src="/icon.png" alt=""/><span>College Group</span></a>
          <div className="hm-bar-r">
            {weather&&<span className="hm-weather tfx-num" title={weather.wind+" mph wind"}>{weather.icon} {weather.temp}°</span>}
            <span suppressHydrationWarning className={"hm-status"+(isClassDay?" is-live":"")}><i/>{status||"\u00a0"}</span>
            <button onClick={toggleTheme} suppressHydrationWarning className="hm-theme tfx-press" aria-label={"Switch to "+(themeMode==="light"?"dark":"light")+" mode"}>{themeMode==="light"?"☀️":"🌙"}</button>
          </div>
        </header>

        <main className="hm-main">
          {/* Hero — the video stays dark behind white text in both themes */}
          <section className="tfVideoHero hm-hero">
            <video src="/home-hero.mp4" autoPlay loop muted playsInline preload="auto"/>
            <div className="hm-hero-shade"/>
            <div className="hm-hero-copy">
              <div className="he hm-hero-eyebrow">Triple F Sports · Knoxville</div>
              <h1>College Group</h1>
              <div className="ff hm-hero-ff">Faith <i>·</i> Family <i>·</i> Fitness</div>
              <div className="hm-hero-cta">
                <a href="/athlete" className="tfx-btn tfx-press">Open the athlete app</a>
                <a href="/coach" className="hm-ghost tfx-press">Coach</a>
              </div>
            </div>
          </section>

          {/* Next class */}
          {mounted&&countdown&&(
            <section className={"tfx-card hm-next"+(isClassDay?" is-today":"")}>
              <div className="hm-next-head">
                <div>
                  <div className="tfx-eyebrow" suppressHydrationWarning>{isClassDay?(started?"Today · "+classTitle:"Class today"):countdown.label}</div>
                  <b suppressHydrationWarning>{isClassDay?(started?"Started at "+classTime+". Next class in:":classTime+" sharp · "+classTitle):preSeason?"Get ready. The season is close.":"Be early. Early is the standard."}</b>
                </div>
                {isClassDay&&todayAttendance!==null&&<span className="hm-early"><b className="tfx-num">{todayAttendance}</b>early</span>}
              </div>
              <div className="hm-count">
                {[{v:countdown.days,l:"days"},{v:countdown.hours,l:"hrs"},{v:countdown.mins,l:"min"},{v:countdown.secs,l:"sec"}].map(t=>(
                  <div key={t.l}><b className="tfx-num" suppressHydrationWarning>{String(t.v).padStart(2,"0")}</b><small>{t.l}</small></div>
                ))}
              </div>
              {(athleteCount!=null||weekProgress||classCount)&&(
                <div className="hm-stats">
                  {athleteCount!=null&&<span><b className="tfx-num">{athleteCount}</b> athletes</span>}
                  {weekProgress&&<span>Week <b className="tfx-num">{weekProgress.current}</b> of {weekProgress.total}</span>}
                  {classCount>0&&<span><b className="tfx-num">{classCount}</b> classes this season</span>}
                </div>
              )}
              {weekProgress&&<div className="hm-season" aria-hidden="true"><i style={{"--p":weekProgress.pct/100}}/></div>}
            </section>
          )}

          {/* This week: Anvil + Forge */}
          <section className="tfx-card hm-week">
            <div className="tfx-eyebrow">This week</div>
            <div className="hm-anvil">
              <span className="hm-anvil-av">
                {anvilWinner?.photo_url?<img src={anvilWinner.photo_url} alt=""/>:<Icon name="anvil" size={26} color="#d4af37"/>}
              </span>
              <div>
                <small>The Anvil</small>
                <b>{anvilWinner?anvilWinner.athlete_name:"To be announced"}</b>
                {anvilWinner?.note?<p>"{anvilWinner.note}"</p>:!anvilWinner&&<p>The anvil does not move.</p>}
              </div>
            </div>
            {forgeLeaders.length>0&&(
              <div className="hm-forge">
                <small>The Forge · leading this week</small>
                <div className="hm-forge-row">
                  {forgeLeaders.map((l,i)=>{const name=typeof l==="string"?l:l.name;const ph=typeof l==="object"?l.photo_url:null;return(
                    <span key={i} className="hm-leader">
                      <span className="hm-leader-av">{ph?<img src={ph} alt="" onError={e=>{e.target.style.display="none";}}/>:(name||"?")[0]}</span>
                      {(name||"").split(" ")[0]}
                    </span>);})}
                </div>
              </div>
            )}
          </section>

          {/* Quick links */}
          <section className="hm-tiles">
            {tiles.map(t=>(
              <a key={t.href} href={t.href} className="tfx-card hm-tile tfx-press" style={{"--c":t.c}}>
                <span className="hm-tile-ico"><Icon name={t.icon} size={20} color="currentColor"/></span>
                <b>{t.label}</b><small>{t.sub}</small>
              </a>
            ))}
            <button className="tfx-card hm-tile hm-qr tfx-press" onClick={()=>{if(qrUnlocked){setQrFullscreen(true);}else{setQrPin("");setQrPinError(false);setQrPinModal(true);}}}>
              <span className="hm-qr-img">{qrDataUrl?<img src={qrDataUrl} alt=""/>:<Icon name="qr" size={20} color="#1a1a1a"/>}</span>
              <span className="hm-qr-txt"><b>Check-in QR</b><small>{qrUnlocked?"Tap to show it full screen at the door":"Coach passcode required"}</small></span>
              <Icon name={qrUnlocked?"qr":"lock"} size={16} color="currentColor"/>
            </button>
          </section>

          {/* Schedule */}
          <section className="tfx-card hm-sched">
            <div className="hm-sec-head"><div className="tfx-eyebrow">Weekly schedule</div><span>Wed & weekends off</span></div>
            <ul>
              {SCHEDULE.map(x=>(
                <li key={x.d} className={todayDow===x.dow&&!preSeason?"is-today":""}>
                  <span className="hm-sched-d">{x.d}</span>
                  <b>{x.title}</b>
                  <span className="hm-sched-t tfx-num">{x.time}<small>am</small></span>
                </li>
              ))}
            </ul>
          </section>

          {/* Daily word */}
          <section className="tfx-card hm-word">
            <div className="tfx-eyebrow">Today's word</div>
            <blockquote>{todayQuote.q}<cite>{todayQuote.a}</cite></blockquote>
            <div className="hm-verse">
              <p>{verse.t}</p>
              <span>{verse.r}</span>
            </div>
          </section>

          {/* Photo */}
          {photo&&(
            <figure className="hm-photo">
              <img src={photo.photo_url} alt={photo.caption||"Latest team photo"}/>
              <figcaption><small>Latest photo</small>{photo.caption&&<span>{photo.caption}</span>}</figcaption>
            </figure>
          )}

          {/* The path */}
          <section className="tfx-card hm-path">
            <div className="tfx-eyebrow">The path</div>
            <ol>
              {[
                {icon:"barbell",t:"The Iron",c:"#8ca0b0",d:"Everyone starts here. Unfinished, ready to be shaped."},
                {icon:"flame",t:"The Forge",c:"#e5484d",d:"Weekly leaders. Drafted to set the standard."},
                {icon:"anvil",t:"The Anvil",c:"#d4af37",d:"The top individual honor. Can't be drafted, only earned."},
              ].map(v=>(
                <li key={v.t} style={{"--c":v.c}}>
                  <span className="hm-path-ico"><Icon name={v.icon} size={18} color="currentColor"/></span>
                  <div><b>{v.t}</b><p>{v.d}</p></div>
                </li>
              ))}
            </ol>
          </section>

          {/* Connect */}
          <section className="hm-connect">
            <a href={groupmeLink} target="_blank" rel="noreferrer" className="tfx-card hm-link tfx-press">
              <Icon name="chat" size={20} color="#00aff0"/><span><b>GroupMe</b><small>Join the group chat</small></span>
            </a>
            <button onClick={toggleNotif} className={"tfx-card hm-link tfx-press"+(notifGranted?" is-on":"")}>
              <Icon name={notifGranted?"bell":"bellOff"} size={20} color="currentColor"/><span><b>{notifGranted?"Notifications on":"Get notified"}</b><small>Draft & class alerts</small></span>
            </button>
          </section>

          <footer className="hm-foot">TF College Group · Triple F Sports · Knoxville, TN</footer>
        </main>

        {/* Coach passcode for the QR */}
        {qrPinModal&&(
          <div className="hm-scrim" onClick={()=>setQrPinModal(false)}>
            <div className="tfx-card hm-pin" onClick={e=>e.stopPropagation()} role="dialog" aria-label="Coach passcode">
              <Icon name="lock" size={22} color="#e8720c"/>
              <b>Coach passcode</b>
              <small>Enter it to show the check-in QR</small>
              <div className="hm-pin-dots" aria-hidden="true">{[0,1,2,3].map(i=><i key={i} className={i<qrPin.length?"is-on":""}/>)}</div>
              {qrPinError&&<div className="hm-pin-err">{typeof qrPinError==="string"?qrPinError:"Wrong passcode. Try again."}</div>}
              <div className="hm-pin-pad">
                {[1,2,3,4,5,6,7,8,9].map(n=><button key={n} className="tfx-press" onClick={()=>handleQrUnlock(qrPin+n)}>{n}</button>)}
                <button className="tfx-press is-text" onClick={()=>setQrPinModal(false)}>Cancel</button>
                <button className="tfx-press" onClick={()=>handleQrUnlock(qrPin+"0")}>0</button>
                <button className="tfx-press is-text" onClick={()=>setQrPin(p=>p.slice(0,-1))} aria-label="Delete">⌫</button>
              </div>
            </div>
          </div>
        )}
        {qrFullscreen&&(
          <div className="hm-qrfull" onClick={()=>setQrFullscreen(false)}>
            <div>TF College Group · Check in</div>
            {qrDataUrl&&<img src={qrDataUrl} alt="Check-in QR code"/>}
            <b>tfcollegegroup.com/checkin</b>
            <small>Tap anywhere to close</small>
          </div>
        )}
      </div>
    </>
  );
}
