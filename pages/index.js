// v4
import { useState, useEffect } from "react";
import Head from "next/head";
import { supabase } from "../lib/supabase";
import { nowEST } from "../lib/dates";
import Icon from "../components/Icon";

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

const PROGRAM_DAYS=[
  {day:"Mon",time:"9:00",note:"Mindset",color:GOLD},
  {day:"Tue",time:"9:30",note:"Training",color:ORANGE},
  {day:"Wed",time:"—",note:"Rest",color:"#3a3a3a"},
  {day:"Thu",time:"9:30",note:"Training",color:ORANGE},
  {day:"Fri",time:"9:00",note:"Fellowship",color:GREEN},
  {day:"Sat",time:"—",note:"Rest",color:"#3a3a3a"},
  {day:"Sun",time:"—",note:"Rest",color:"#3a3a3a"},
];

export default function Landing(){
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
      try{
        const{data}=await supabase.from("attendance").select("date");
        if(data){const unique=new Set(data.map(r=>r.date));setClassCount(unique.size);}
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
      // Season progress — weeks since May 19
      const start=new Date("2026-05-19T09:00:00");
      const nowDate=new Date();
      const totalWeeks=12;
      if(nowDate<start){
        setWeekProgress({current:1,total:totalWeeks,pct:0});
      }else{
        const diffWeeks=Math.floor((nowDate-start)/(1000*60*60*24*7));
        const current=Math.min(diffWeeks+1,totalWeeks);
        setWeekProgress({current,total:totalWeeks,pct:Math.round((current/totalWeeks)*100)});
      }
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

  const handleQrUnlock=(next)=>{
    setQrPin(next);
    setQrPinError(false);
    if(next.length===4){
      if(next==="1803"){
        sessionStorage.setItem("qr_unlocked","1");
        setQrUnlocked(true);
        setQrPinModal(false);
        setQrFullscreen(true);
      }else{
        setQrPinError(true);
        setQrPin("");
      }
    }
  };

  const estTime=(mounted&&time)?new Date(time.toLocaleString("en-US",{timeZone:"America/New_York"})):new Date();
  const day=mounted?["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][estTime.getDay()]:"Mon";
  const isClassDay=mounted&&["Mon","Tue","Thu","Fri"].includes(day);
  const isMonFri=typeof window!=="undefined"&&(day==="Mon"||day==="Fri");
  const todayQuote=QUOTES[(mounted?new Date().getDate():0)%QUOTES.length];

  // ── Glass design tokens ──
  const glass={background:"rgba(255,255,255,0.045)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:18,boxShadow:"inset 0 1px 0 rgba(255,255,255,0.05)"};
  const sectionLabel=(icon,text,color="rgba(255,255,255,0.42)")=>(
    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:12}}>
      <Icon name={icon} size={13} color={color}/>
      <span style={{fontSize:10,color,textTransform:"uppercase",letterSpacing:"0.16em",fontWeight:700}}>{text}</span>
    </div>
  );

  return(
    <>
      <Head>
        <title>TF College Group</title>
        <meta name="description" content="TF College Group — Iron sharpens iron"/>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
        <meta name="theme-color" content="#080808"/>
        <link rel="manifest" href="/manifest.json"/>
      </Head>
      <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#06060f 0%,#0a0608 50%,#080808 100%)",fontFamily:"Georgia,serif",position:"relative",overflowX:"hidden",color:"#fff"}}>

        {/* Ambient glows */}
        <div style={{position:"fixed",top:-160,left:-120,width:420,height:420,borderRadius:"50%",background:ORANGE,opacity:0.06,filter:"blur(120px)",pointerEvents:"none",zIndex:0}}/>
        <div style={{position:"fixed",bottom:-120,right:-120,width:340,height:340,borderRadius:"50%",background:GOLD,opacity:0.05,filter:"blur(100px)",pointerEvents:"none",zIndex:0}}/>

        {/* Top bar */}
        <div style={{position:"relative",zIndex:1,padding:"16px 20px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={toggleTheme} suppressHydrationWarning aria-label="Toggle light or dark mode" style={{display:"flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:20,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.7)",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"Georgia,serif",letterSpacing:"0.02em"}}>
              <span>{themeMode==="light"?"☀️":"🌙"}</span>{themeMode==="light"?"Light":"Dark"}
            </button>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",letterSpacing:"0.12em",textTransform:"uppercase"}}>tfcollegegroup.com</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {weather&&(
              <div style={{fontSize:12,color:"rgba(255,255,255,0.55)",display:"flex",alignItems:"center",gap:4}}>
                <span>{weather.icon}</span>{weather.temp}°
              </div>
            )}
            <div suppressHydrationWarning style={{display:"flex",alignItems:"center",gap:6,fontSize:10,fontWeight:700,padding:"4px 11px",borderRadius:20,background:isClassDay?GREEN+"22":"rgba(255,255,255,0.05)",border:"1px solid "+(isClassDay?GREEN+"44":"rgba(255,255,255,0.08)"),color:isClassDay?"#5FD08A":"rgba(255,255,255,0.4)"}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:isClassDay?"#3AD17A":"#555",boxShadow:isClassDay?"0 0 8px #3AD17A":"none"}}/>
              {isClassDay?"Class day":"No class"}
            </div>
          </div>
        </div>

        <div style={{position:"relative",zIndex:1,maxWidth:480,margin:"0 auto",padding:"0 18px 3rem",opacity:loaded?1:0,transform:loaded?"none":"translateY(16px)",transition:"opacity 0.7s ease,transform 0.7s ease"}}>

          {/* Hero — video background with TF logo + College Group overlaid */}
          <div className="tfVideoHero" style={{position:"relative",width:"100%",aspectRatio:"4 / 5",borderRadius:24,overflow:"hidden",border:"1px solid "+ORANGE+"33",boxShadow:"0 0 60px "+ORANGE+"22,0 20px 50px rgba(0,0,0,0.5)",marginTop:20,marginBottom:8}}>
            <video src="/home-hero.mp4" autoPlay loop muted playsInline preload="auto"
              style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
            {/* Legibility overlay — always dark behind the text, both themes */}
            <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(0,0,0,0.28) 0%,rgba(0,0,0,0.15) 45%,rgba(0,0,0,0.62) 100%)",pointerEvents:"none"}}/>
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:11,padding:20,textAlign:"center"}}>
              <div style={{width:96,height:96,borderRadius:22,overflow:"hidden",background:"#fff",border:"1px solid rgba(232,114,12,0.45)",boxShadow:"0 0 40px rgba(232,114,12,0.35),0 8px 24px rgba(0,0,0,0.4)"}}>
                <img src="/icon.png" alt="TF College Group logo" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
              </div>
              <div className="he" style={{fontSize:10,color:"rgba(255,255,255,0.72)",textTransform:"uppercase",letterSpacing:"0.28em",textShadow:"0 1px 10px rgba(0,0,0,0.6)"}}>Triple F Sports</div>
              <h1 style={{fontSize:34,fontWeight:800,color:"#fff",margin:0,letterSpacing:"-0.02em",lineHeight:1.05,textShadow:"0 2px 22px rgba(0,0,0,0.7)"}}>College Group</h1>
              <div className="ff" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:9,fontSize:11,color:"rgba(255,255,255,0.85)",letterSpacing:"0.04em",textShadow:"0 1px 10px rgba(0,0,0,0.6)"}}>
                <span>Faith</span><span style={{color:ORANGE}}>·</span><span>Family</span><span style={{color:ORANGE}}>·</span><span>Fitness</span>
              </div>
            </div>
          </div>

          {/* Today / Next class */}
          {(isClassDay||countdown)&&(
            <div style={{...glass,borderColor:(isClassDay?ORANGE:GOLD)+"38",padding:"16px 18px",marginTop:20,marginBottom:14,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,"+(isClassDay?ORANGE:GOLD)+",transparent)"}}/>
              {isClassDay&&(
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:44,height:44,borderRadius:13,background:ORANGE+"1e",border:"1px solid "+ORANGE+"40",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="zap" size={21} color={ORANGE}/></div>
                    <div>
                      <div style={{fontSize:9,color:ORANGE,textTransform:"uppercase",letterSpacing:"0.14em",fontWeight:700,marginBottom:3}}>Class today</div>
                      <div suppressHydrationWarning style={{fontSize:16,fontWeight:800,color:"#fff",lineHeight:1.1}}>{isMonFri?"9:00am":"9:30am"} sharp</div>
                      <div suppressHydrationWarning style={{fontSize:11,color:"rgba(255,255,255,0.42)",marginTop:2}}>{isMonFri?(day==="Mon"?"Mindset Monday":"Fellowship Friday"):"Training day"}</div>
                    </div>
                  </div>
                  {todayAttendance!==null&&(
                    <div style={{textAlign:"center",background:GREEN+"18",border:"1px solid "+GREEN+"33",borderRadius:12,padding:"8px 13px",flexShrink:0}}>
                      <div style={{fontSize:21,fontWeight:900,color:"#5FD08A",lineHeight:1}}>{todayAttendance}</div>
                      <div style={{fontSize:8,color:"#5FD08A",opacity:0.7,marginTop:3,textTransform:"uppercase",letterSpacing:"0.06em"}}>early</div>
                    </div>
                  )}
                </div>
              )}
              {countdown&&(
                <>
                  {isClassDay&&<div style={{height:1,background:"rgba(255,255,255,0.07)",margin:"14px 0"}}/>}
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
                    <Icon name="clock" size={12} color={GOLD}/>
                    <span style={{fontSize:10,color:"rgba(255,255,255,0.45)",textTransform:"uppercase",letterSpacing:"0.14em",fontWeight:700}}>{countdown.label}</span>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    {[{v:countdown.days,l:"Days"},{v:countdown.hours,l:"Hrs"},{v:countdown.mins,l:"Min"},{v:countdown.secs,l:"Sec"}].map(t=>(
                      <div key={t.l} style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"10px 4px",textAlign:"center"}}>
                        <div suppressHydrationWarning style={{fontSize:24,fontWeight:900,color:"#fff",lineHeight:1,letterSpacing:"-0.02em"}}>{String(t.v).padStart(2,"0")}</div>
                        <div style={{fontSize:8,color:"rgba(255,255,255,0.35)",marginTop:5,textTransform:"uppercase",letterSpacing:"0.08em"}}>{t.l}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {isClassDay&&(
                <div style={{fontSize:10.5,color:"rgba(255,255,255,0.32)",marginTop:countdown?12:10,fontStyle:"italic"}}>On time is late. Early is the only standard.</div>
              )}
            </div>
          )}

          {/* Quote of the day */}
          <div style={{...glass,padding:"15px 18px",marginBottom:14,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,"+ORANGE+","+GOLD+",transparent)"}}/>
            {sectionLabel("book","Today's word",ORANGE)}
            <div style={{fontSize:13.5,color:"rgba(255,255,255,0.82)",fontStyle:"italic",lineHeight:1.7,marginBottom:8}}>"{todayQuote.q}"</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>— {todayQuote.a}</div>
          </div>

          {/* Stats row */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
            {[
              {label:"Athletes",val:athleteCount||"—",color:STEEL,icon:"users"},
              {label:"Classes",val:classCount!==null?classCount:"—",color:ORANGE,icon:"calendar"},
              {label:"Week",val:weekProgress?`${weekProgress.current}/12`:"1/12",color:GOLD,icon:"activity"},
            ].map((s,i)=>(
              <div key={i} style={{...glass,padding:"13px 8px",textAlign:"center"}}>
                <div style={{display:"flex",justifyContent:"center",marginBottom:7,opacity:0.85}}><Icon name={s.icon} size={15} color={s.color}/></div>
                <div style={{fontSize:19,fontWeight:800,color:s.color,lineHeight:1}}>{s.val}</div>
                <div style={{fontSize:8.5,color:"rgba(255,255,255,0.35)",marginTop:5,textTransform:"uppercase",letterSpacing:"0.08em"}}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Season progress */}
          {weekProgress&&(
            <div style={{...glass,padding:"14px 18px",marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontSize:10,color:"rgba(255,255,255,0.45)",textTransform:"uppercase",letterSpacing:"0.14em",fontWeight:700}}>Season progress</span>
                <span style={{fontSize:12,fontWeight:700,color:"#5FD08A"}}>Week {weekProgress.current} / {weekProgress.total}</span>
              </div>
              <div style={{height:7,background:"rgba(255,255,255,0.07)",borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",width:weekProgress.pct+"%",background:"linear-gradient(90deg,"+ORANGE+","+GOLD+")",borderRadius:4,boxShadow:"0 0 12px "+ORANGE+"66",transition:"width 1s ease"}}/>
              </div>
              <div style={{fontSize:9.5,color:"rgba(255,255,255,0.3)",marginTop:7}}>{weekProgress.pct}% complete</div>
            </div>
          )}

          {/* This week's Anvil */}
          <div style={{...glass,borderColor:GOLD+"33",padding:"18px",marginBottom:14,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,"+GOLD+",transparent)"}}/>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:14}}>
              <Icon name="anvil" size={14} color={GOLD}/>
              <span style={{fontSize:10,color:GOLD,textTransform:"uppercase",letterSpacing:"0.16em",fontWeight:700}}>This week's Anvil</span>
            </div>
            {anvilWinner?(
              <div style={{textAlign:"center"}}>
                <div style={{width:74,height:74,borderRadius:"50%",margin:"0 auto 12px",border:"2px solid "+GOLD,overflow:"hidden",background:"#1a1a1a",boxShadow:"0 0 24px "+GOLD+"55",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:800,color:GOLD}}>
                  {anvilWinner.photo_url?
                    <img src={anvilWinner.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt={anvilWinner.athlete_name}/>
                    :(anvilWinner.athlete_name||"?")[0]
                  }
                </div>
                <div style={{fontSize:18,fontWeight:800,color:GOLD,marginBottom:5,letterSpacing:"-0.01em"}}>{anvilWinner.athlete_name}</div>
                {anvilWinner.note&&<div style={{fontSize:12,color:"rgba(255,255,255,0.5)",fontStyle:"italic",lineHeight:1.6}}>"{anvilWinner.note}"</div>}
              </div>
            ):(
              <div style={{textAlign:"center"}}>
                <div style={{marginBottom:8,display:"flex",justifyContent:"center"}}><Icon name="anvil" size={36} color={GOLD} style={{filter:"drop-shadow(0 0 10px "+GOLD+"55)"}}/></div>
                <div style={{fontSize:14,fontWeight:700,color:GOLD,marginBottom:3}}>To be announced</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",fontStyle:"italic"}}>"The anvil does not move."</div>
              </div>
            )}
          </div>

          {/* This week's Forge */}
          {forgeLeaders.length>0&&(
            <div style={{...glass,borderColor:RED+"2e",padding:"15px 18px",marginBottom:14,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,"+RED+",transparent)"}}/>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:12}}>
                <Icon name="flame" size={13} color={RED}/>
                <span style={{fontSize:10,color:RED,textTransform:"uppercase",letterSpacing:"0.16em",fontWeight:700}}>This week's Forge</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                {forgeLeaders.map((leader,i)=>{
                  const name=typeof leader==="string"?leader:leader.name;
                  const photoUrl=typeof leader==="object"?leader.photo_url:null;
                  return(
                  <div key={i} style={{background:"rgba(192,57,43,0.08)",borderRadius:10,padding:"8px 11px",display:"flex",alignItems:"center",gap:9,border:"1px solid "+RED+"22"}}>
                    <div style={{width:32,height:32,borderRadius:"50%",background:RED,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0,overflow:"hidden"}}>
                      {photoUrl?<img src={photoUrl} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";}} alt=""/>:(name||"?")[0]}
                    </div>
                    <div style={{fontSize:12,color:"rgba(255,255,255,0.85)",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick access */}
          <div style={{marginBottom:14}}>
            {sectionLabel("grid","Quick access")}
            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              {[
                {href:"/athlete",icon:"profile",label:"Athlete Portal",sub:"Sign in · Check-in · Your profile",color:STEEL},
                {href:"/coach",icon:"anvil",label:"Coach Dashboard",sub:"Roster · Draft · Inbox · Everything",color:GOLD},
                {href:"/callout",icon:"megaphone",label:"Call-Out Station",sub:"iPad · Weight room · Log violations",color:RED},
              ].map((btn,i)=>(
                <a key={i} href={btn.href} style={{textDecoration:"none"}}>
                  <div style={{...glass,padding:"13px 16px",display:"flex",alignItems:"center",gap:13,cursor:"pointer",transition:"border-color 0.18s,background 0.18s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=btn.color+"66";e.currentTarget.style.background="rgba(255,255,255,0.06)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";e.currentTarget.style.background="rgba(255,255,255,0.045)";}}>
                    <div style={{width:42,height:42,borderRadius:12,background:btn.color+"1c",border:"1px solid "+btn.color+"33",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name={btn.icon} size={20} color={btn.color}/></div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:2}}>{btn.label}</div>
                      <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{btn.sub}</div>
                    </div>
                    <Icon name="chevronRight" size={16} color="rgba(255,255,255,0.25)"/>
                  </div>
                </a>
              ))}

              {/* QR Check-In */}
              <div onClick={()=>{if(qrUnlocked){setQrFullscreen(true);}else{setQrPin("");setQrPinError(false);setQrPinModal(true);}}}
                style={{...glass,padding:"13px 16px",display:"flex",alignItems:"center",gap:13,cursor:"pointer",transition:"border-color 0.18s,background 0.18s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=ORANGE+"66";e.currentTarget.style.background="rgba(255,255,255,0.06)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";e.currentTarget.style.background="rgba(255,255,255,0.045)";}}>
                <div style={{width:42,height:42,borderRadius:10,background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}>
                  {qrDataUrl?<img src={qrDataUrl} style={{width:38,height:38}} alt="QR"/>:<Icon name="qr" size={20} color="#1a1a1a"/>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:2}}>Check-In QR Code</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{qrUnlocked?"Tap to display fullscreen at the door":"Coach passcode required"}</div>
                </div>
                <Icon name={qrUnlocked?"qr":"lock"} size={15} color="rgba(255,255,255,0.3)"/>
              </div>
            </div>
          </div>

          {/* PIN modal */}
          {qrPinModal&&(
            <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setQrPinModal(false)}>
              <div onClick={e=>e.stopPropagation()} style={{background:"rgba(18,18,26,0.98)",borderRadius:20,padding:"2rem 1.5rem",width:280,border:"1px solid rgba(255,255,255,0.1)",textAlign:"center",fontFamily:"Georgia,serif",boxShadow:"0 30px 80px rgba(0,0,0,0.7)"}}>
                <div style={{display:"flex",justifyContent:"center",marginBottom:10}}><Icon name="lock" size={24} color={ORANGE}/></div>
                <div style={{fontSize:15,fontWeight:700,color:"#fff",marginBottom:4}}>Coach Passcode</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:20}}>Enter your passcode to display the QR</div>
                <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:16}}>
                  {[0,1,2,3].map(i=>(
                    <div key={i} style={{width:14,height:14,borderRadius:"50%",border:"2px solid "+ORANGE,background:i<qrPin.length?ORANGE:"transparent",transition:"background 0.15s"}}/>
                  ))}
                </div>
                {qrPinError&&<div style={{fontSize:12,color:"#E66",marginBottom:12}}>Wrong passcode. Try again.</div>}
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:8}}>
                  {[1,2,3,4,5,6,7,8,9].map(n=>(
                    <button key={n} onClick={()=>handleQrUnlock(qrPin+n)} style={{padding:"14px",borderRadius:12,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"#fff",fontSize:18,fontWeight:600,cursor:"pointer",fontFamily:"Georgia,serif"}}>{n}</button>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <button onClick={()=>setQrPinModal(false)} style={{padding:"14px",borderRadius:12,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.03)",color:"rgba(255,255,255,0.4)",fontSize:13,cursor:"pointer",fontFamily:"Georgia,serif"}}>Cancel</button>
                  <button onClick={()=>handleQrUnlock(qrPin+"0")} style={{padding:"14px",borderRadius:12,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"#fff",fontSize:18,fontWeight:600,cursor:"pointer",fontFamily:"Georgia,serif"}}>0</button>
                </div>
              </div>
            </div>
          )}

          {/* Fullscreen QR overlay */}
          {qrFullscreen&&(
            <div onClick={()=>setQrFullscreen(false)} style={{position:"fixed",inset:0,background:"#fff",zIndex:999,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,cursor:"pointer"}}>
              <div style={{fontSize:13,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.1em",fontFamily:"Georgia,serif"}}>TF College Group · Check In</div>
              {qrDataUrl&&<img src={qrDataUrl} alt="QR Code" style={{width:"min(80vw,80vh)",height:"min(80vw,80vh)"}}/>}
              <div style={{fontSize:16,fontWeight:600,color:"#1a1a1a",fontFamily:"Georgia,serif"}}>tfcollegegroup.com/checkin</div>
              <div style={{fontSize:11,color:"#ccc",fontFamily:"Georgia,serif"}}>Tap anywhere to close</div>
            </div>
          )}

          {/* Weekly schedule */}
          <div style={{...glass,padding:"14px 16px",marginBottom:14}}>
            {sectionLabel("calendar","Weekly schedule")}
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
              {PROGRAM_DAYS.map((d,i)=>{
                const isToday=day===d.day;
                const isRest=d.time==="—";
                return(
                  <div key={i} style={{textAlign:"center",padding:"9px 3px",borderRadius:10,background:isToday?d.color+"22":"rgba(255,255,255,0.02)",border:"1px solid "+(isToday?d.color+"55":"rgba(255,255,255,0.05)")}}>
                    <div style={{fontSize:9,fontWeight:700,color:isToday?d.color:"rgba(255,255,255,0.4)",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.04em"}}>{d.day}</div>
                    <div style={{fontSize:11,fontWeight:600,color:isRest?"rgba(255,255,255,0.18)":"rgba(255,255,255,0.7)"}}>{d.time}</div>
                    <div style={{fontSize:7.5,color:isRest?"rgba(255,255,255,0.18)":d.color,marginTop:3,lineHeight:1.2,textTransform:"uppercase",letterSpacing:"0.03em"}}>{d.note}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Photo of the week */}
          {photo&&(
            <div style={{borderRadius:18,overflow:"hidden",marginBottom:14,position:"relative",border:"1px solid rgba(255,255,255,0.08)"}}>
              <img src={photo.photo_url} alt="Culture" style={{width:"100%",height:200,objectFit:"cover",display:"block"}}/>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.8),transparent 60%)"}}/>
              <div style={{position:"absolute",bottom:13,left:15,right:15}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                  <Icon name="camera" size={12} color="rgba(255,255,255,0.6)"/>
                  <span style={{fontSize:9.5,color:"rgba(255,255,255,0.6)",textTransform:"uppercase",letterSpacing:"0.1em"}}>Latest photo</span>
                </div>
                {photo.caption&&<div style={{fontSize:12.5,color:"#fff",fontWeight:500}}>{photo.caption}</div>}
              </div>
            </div>
          )}

          {/* Connect: GroupMe + Notifications */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:14}}>
            <a href={groupmeLink} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}>
              <div style={{...glass,padding:"15px 12px",textAlign:"center",cursor:"pointer",transition:"border-color 0.18s,background 0.18s",height:"100%"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#00aff0aa";e.currentTarget.style.background="rgba(255,255,255,0.06)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";e.currentTarget.style.background="rgba(255,255,255,0.045)";}}>
                <div style={{display:"flex",justifyContent:"center",marginBottom:8}}><Icon name="chat" size={22} color="#00aff0"/></div>
                <div style={{fontSize:12.5,fontWeight:700,color:"#fff",marginBottom:2}}>GroupMe</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>Join the group chat</div>
              </div>
            </a>
            <div style={{...glass,borderColor:notifGranted?GREEN+"44":"rgba(255,255,255,0.08)",padding:"15px 12px",textAlign:"center",cursor:"pointer",transition:"border-color 0.18s,background 0.18s"}}
              onClick={toggleNotif}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=GREEN+"66";e.currentTarget.style.background="rgba(255,255,255,0.06)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=notifGranted?GREEN+"44":"rgba(255,255,255,0.08)";e.currentTarget.style.background="rgba(255,255,255,0.045)";}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:8}}><Icon name={notifGranted?"bell":"bellOff"} size={22} color={notifGranted?"#5FD08A":"rgba(255,255,255,0.5)"}/></div>
              <div style={{fontSize:12.5,fontWeight:700,color:notifGranted?"#5FD08A":"#fff",marginBottom:2}}>{notifGranted?"Notifications on":"Get notified"}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>Draft · class alerts</div>
            </div>
          </div>

          {/* Verse of the day */}
          <div style={{background:"linear-gradient(135deg,rgba(83,74,183,0.13),rgba(83,74,183,0.03))",border:"1px solid #534AB733",borderRadius:18,padding:"16px 18px",marginBottom:14,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#534AB7,"+GOLD+",transparent)"}}/>
            {sectionLabel("book","Verse of the day",PURPLE)}
            {(()=>{
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
              const v=VERSES[(mounted?new Date().getDate():0)%VERSES.length];
              return(
                <div>
                  <div style={{fontSize:14,color:"rgba(255,255,255,0.88)",fontStyle:"italic",lineHeight:1.8,marginBottom:11}}>"{v.t}"</div>
                  <div style={{display:"inline-block",padding:"4px 13px",borderRadius:20,background:"#534AB722",border:"1px solid #534AB744"}}>
                    <div style={{fontSize:11,fontWeight:700,color:PURPLE}}>{v.r}</div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* The three tiers */}
          <div style={{...glass,padding:"15px 18px",marginBottom:16}}>
            {sectionLabel("anvil","The three tiers")}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[
                {icon:"barbell",title:"The Iron",color:STEEL,desc:"Every athlete enters here. Gray. Unfinished. Ready to be shaped. The work starts now."},
                {icon:"flame",title:"The Forge",color:RED,desc:"Weekly leaders. Drafted. Responsible for setting the standard and leading the group."},
                {icon:"anvil",title:"The Anvil",color:GOLD,desc:"The highest individual honor. Cannot be drafted. Can only be earned. One per week."},
              ].map((v,i)=>(
                <div key={i} style={{display:"flex",gap:13,alignItems:"flex-start",padding:"11px 13px",borderRadius:12,background:v.color+"0d",border:"1px solid "+v.color+"22"}}>
                  <div style={{width:34,height:34,borderRadius:10,background:v.color+"1c",border:"1px solid "+v.color+"33",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}><Icon name={v.icon} size={17} color={v.color}/></div>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:v.color,marginBottom:3}}>{v.title}</div>
                    <div style={{fontSize:11.5,color:"rgba(255,255,255,0.5)",lineHeight:1.6}}>{v.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Animated anvil + progression */}
          <div style={{textAlign:"center",marginBottom:18}}>
            <span style={{display:"inline-block",animation:"anvil-pulse 2.4s ease-in-out infinite"}}><Icon name="anvil" size={42} color={GOLD}/></span>
            <style>{`@keyframes anvil-pulse{0%,100%{filter:drop-shadow(0 0 8px ${GOLD}55);transform:scale(1);}50%{filter:drop-shadow(0 0 22px ${GOLD}aa);transform:scale(1.06);}}`}</style>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,marginTop:10}}>
              <span style={{fontSize:11,color:STEEL,fontWeight:600}}>The Iron</span>
              <Icon name="chevronRight" size={12} color="rgba(255,255,255,0.25)"/>
              <span style={{fontSize:11,color:RED,fontWeight:600}}>The Forge</span>
              <Icon name="chevronRight" size={12} color="rgba(255,255,255,0.25)"/>
              <span style={{fontSize:11,color:GOLD,fontWeight:600}}>The Anvil</span>
            </div>
          </div>

          <div style={{textAlign:"center",fontSize:10,color:"rgba(255,255,255,0.25)",letterSpacing:"0.06em"}}>
            TF College Group · Triple F Sports · Knoxville, TN
          </div>
        </div>
      </div>
    </>
  );
}
