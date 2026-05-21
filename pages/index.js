// v3
import { useState, useEffect } from "react";
import Head from "next/head";
import { supabase } from "../lib/supabase";

const GOLD="#D4AF37";
const RED="#C0392B";
const STEEL="#708090";
const ORANGE="#E8720C";
const GREEN="#1E6B3A";

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
  {day:"Mon",time:"9:00am",note:"Mindset Monday",color:GOLD},
  {day:"Tue",time:"9:30am",note:"Training",color:ORANGE},
  {day:"Wed",time:"—",note:"Rest",color:"#333"},
  {day:"Thu",time:"9:30am",note:"Training",color:ORANGE},
  {day:"Fri",time:"9:00am",note:"Fellowship",color:GREEN},
  {day:"Sat",time:"—",note:"Rest",color:"#333"},
  {day:"Sun",time:"—",note:"Rest",color:"#333"},
];

export default function Landing(){
  const[qrDataUrl,setQrDataUrl]=useState("");
  const[qrFullscreen,setQrFullscreen]=useState(false);
  const[loaded,setLoaded]=useState(false);
  const[time,setTime]=useState(new Date());
  const[countdown,setCountdown]=useState(null);
  const[anvilWinner,setAnvilWinner]=useState(null);
  const[athleteCount,setAthleteCount]=useState(null);
  const[todayAttendance,setTodayAttendance]=useState(null);
  const[forgeLeaders,setForgeLeaders]=useState([]);
  const[weather,setWeather]=useState(null);
  const[weekProgress,setWeekProgress]=useState(null);
  const[photo,setPhoto]=useState(null);
  const[notifGranted,setNotifGranted]=useState(typeof window!=="undefined"&&"Notification" in window&&Notification.permission==="granted"&&localStorage.getItem("notif_disabled")!=="true");
  const GROUPME_LINK="https://groupme.com/join_group/111967377/1JobSG7L";

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
        const classStart=new Date("2026-06-18T00:00:00");
        if(now<classStart){
          const diff=new Date("2026-06-18T09:00:00")-now;
          return{diff,label:"First class"};
        }
        // Find next class day
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
      try{const{count}=await supabase.from("athletes").select("id",{count:"exact",head:true}).eq("status","active");if(count)setAthleteCount(count);}catch(e){}
      try{const{data}=await supabase.from("anvil").select("*").order("created_at",{ascending:false}).limit(1);if(data&&data[0])setAnvilWinner(data[0]);}catch(e){}
      try{
        const estNow=new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
        const today=estNow.getFullYear()+"-"+String(estNow.getMonth()+1).padStart(2,"0")+"-"+String(estNow.getDate()).padStart(2,"0");
        const{count}=await supabase.from("attendance").select("id",{count:"exact",head:true}).eq("date",today).eq("status","early");
        if(count)setTodayAttendance(count);
      }catch(e){}
      try{
        const{data}=await supabase.from("draft").select("*").order("created_at",{ascending:false}).limit(1);
        if(data&&data[0]&&data[0].leaders&&data[0].leaders.some(l=>l)){
          setForgeLeaders(data[0].leaders.filter(Boolean));
        }else{
          const{data:aths}=await supabase.from("athletes").select("name").eq("role","forge").eq("status","active");
          if(aths&&aths.length>0)setForgeLeaders(aths.map(a=>a.name));
        }
      }catch(e){}
      // Season progress — weeks since June 18
      const start=new Date("2026-06-18");
      const nowDate=new Date();
      const diffWeeks=Math.floor((nowDate-start)/(1000*60*60*24*7));
      const totalWeeks=12;
      if(diffWeeks>=0&&diffWeeks<=totalWeeks)setWeekProgress({current:diffWeeks+1,total:totalWeeks,pct:Math.round(((diffWeeks+1)/totalWeeks)*100)});
      try{const{data}=await supabase.from("culture_photos").select("*").order("created_at",{ascending:false}).limit(1);if(data&&data[0])setPhoto(data[0]);}catch(e){}
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

  const day=typeof window!=="undefined"?["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][time.getDay()]:"Mon";
  const isClassDay=typeof window!=="undefined"&&["Mon","Tue","Thu","Fri"].includes(day);
  const isMonFri=typeof window!=="undefined"&&(day==="Mon"||day==="Fri");
  const todayQuote=QUOTES[new Date().getDate()%QUOTES.length];

  return(
    <>
      <Head>
        <title>TF College Group</title>
        <meta name="description" content="TF College Group — Iron sharpens iron"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="theme-color" content="#0f0f0f"/>
        <link rel="manifest" href="/manifest.json"/>
      </Head>
      <div style={{minHeight:"100vh",background:"#0f0f0f",fontFamily:"Georgia,serif",position:"relative",overflowY:"auto"}}>

        {/* Ambient glows */}
        <div style={{position:"fixed",top:-150,left:-100,width:400,height:400,borderRadius:"50%",background:ORANGE,opacity:0.05,filter:"blur(100px)",pointerEvents:"none"}}/>
        <div style={{position:"fixed",bottom:-100,right:-100,width:300,height:300,borderRadius:"50%",background:GOLD,opacity:0.05,filter:"blur(80px)",pointerEvents:"none"}}/>

        {/* Top bar */}
        <div style={{padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"0.5px solid #1a1a1a"}}>
          <div style={{fontSize:11,color:"#444",letterSpacing:"0.1em",textTransform:"uppercase"}}>tfcollegegroup.com</div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {weather&&(
              <div style={{fontSize:12,color:"#888"}}>
                <span style={{marginRight:4}}>{weather.icon}</span>{weather.temp}°F
              </div>
            )}
            <div style={{textAlign:"right"}}>
              <div suppressHydrationWarning style={{fontSize:11,color:isClassDay?GREEN:"#555",fontWeight:600}}>
                {isClassDay?"⚡ Class day":"No class"}
              </div>
            </div>
          </div>
        </div>

        <div style={{maxWidth:480,margin:"0 auto",padding:"0 18px 3rem",opacity:loaded?1:0,transform:loaded?"none":"translateY(20px)",transition:"opacity 0.8s,transform 0.8s"}}>

          {/* Class day banner */}
          {isClassDay&&(
            <div style={{background:"linear-gradient(135deg,#1a0800,#250e00)",border:"1px solid "+ORANGE+"44",borderRadius:14,padding:"14px 18px",marginTop:16,marginBottom:12,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,"+ORANGE+",transparent)"}}/>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontSize:11,color:ORANGE,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:3}}>🔥 Class today</div>
                  <div style={{fontSize:15,fontWeight:700,color:"#fff"}}>{isMonFri?"9:00am":"9:30am"} sharp · {isMonFri?(day==="Mon"?"Mindset Monday":"Fellowship Friday"):"Training"}</div>
                  <div style={{fontSize:11,color:"#555",marginTop:2}}>On time is late. Early is the only standard.</div>
                </div>
                {todayAttendance!==null&&(
                  <div style={{textAlign:"center",background:"#111",borderRadius:10,padding:"8px 12px"}}>
                    <div style={{fontSize:20,fontWeight:900,color:GREEN}}>{todayAttendance}</div>
                    <div style={{fontSize:9,color:"#555"}}>early</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Poster */}
          <div style={{width:190,margin:"20px auto 16px",boxShadow:"0 0 50px "+ORANGE+"44,0 0 100px "+ORANGE+"18",border:"1.5px solid "+ORANGE+"33",borderRadius:18,overflow:"hidden"}}>
            <img src="/poster.png" alt="TF College Group" style={{width:"100%",height:"auto",display:"block"}}/>
          </div>

          {/* Title */}
          <div style={{textAlign:"center",marginBottom:20}}>
            <div style={{fontSize:11,color:"#444",textTransform:"uppercase",letterSpacing:"0.2em",marginBottom:8}}>Triple F · College Group</div>
            <h1 style={{fontSize:32,fontWeight:800,color:"#fff",margin:"0 0 8px",letterSpacing:"-0.02em",lineHeight:1.1}}>TF College Group</h1>
          </div>

          {/* Quote of the day */}
          <div style={{background:"#111",borderRadius:14,padding:"14px 18px",marginBottom:16,border:"0.5px solid #1e1e1e",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,"+ORANGE+","+GOLD+",transparent)"}}/>
            <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>📖 Today's word</div>
            <div style={{fontSize:13,color:"#ccc",fontStyle:"italic",lineHeight:1.7,marginBottom:6}}>"{todayQuote.q}"</div>
            <div style={{fontSize:11,color:"#555"}}>— {todayQuote.a}</div>
          </div>

          {/* Stats row */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
            {[
              {label:"Athletes",val:athleteCount||"—",color:STEEL},
              {label:"Season",val:"2026",color:ORANGE},
              {label:"Starts",val:"Jun 18",color:GOLD},
            ].map((s,i)=>(
              <div key={i} style={{background:"#111",borderRadius:12,padding:"12px 8px",textAlign:"center",border:"0.5px solid #1e1e1e"}}>
                <div style={{fontSize:18,fontWeight:800,color:s.color}}>{s.val}</div>
                <div style={{fontSize:9,color:"#444",marginTop:3,textTransform:"uppercase",letterSpacing:"0.05em"}}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Season progress bar */}
          {weekProgress&&(
            <div style={{background:"#111",borderRadius:14,padding:"14px 18px",marginBottom:16,border:"0.5px solid #1e1e1e"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{fontSize:11,color:"#555",textTransform:"uppercase",letterSpacing:"0.08em"}}>Season progress</div>
                <div style={{fontSize:12,fontWeight:700,color:GREEN}}>Week {weekProgress.current} of {weekProgress.total}</div>
              </div>
              <div style={{height:6,background:"#222",borderRadius:3,overflow:"hidden",marginBottom:4}}>
                <div style={{height:"100%",width:weekProgress.pct+"%",background:"linear-gradient(90deg,"+ORANGE+","+GOLD+")",borderRadius:3}}/>
              </div>
              <div style={{fontSize:10,color:"#444"}}>{weekProgress.pct}% complete</div>
            </div>
          )}

          {/* Countdown */}
          {countdown&&(
            <div style={{background:"linear-gradient(135deg,#1a1400,#221b00)",border:"1px solid "+GOLD+"33",borderRadius:14,padding:"16px",marginBottom:16,textAlign:"center",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,"+GOLD+",transparent)"}}/>
              <div style={{fontSize:10,color:GOLD,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:12}}>⚒ {countdown.label}</div>
              <div style={{display:"flex",justifyContent:"center",gap:12}}>
                {[{v:countdown.days,l:"Days"},{v:countdown.hours,l:"Hrs"},{v:countdown.mins,l:"Min"},{v:countdown.secs,l:"Sec"}].map(t=>(
                  <div key={t.l} style={{background:"#1a1500",borderRadius:10,padding:"8px 12px",minWidth:52,border:"0.5px solid "+GOLD+"22"}}>
                    <div style={{fontSize:26,fontWeight:900,color:GOLD,lineHeight:1,textAlign:"center"}}>{String(t.v).padStart(2,"0")}</div>
                    <div style={{fontSize:9,color:"#555",marginTop:4,textAlign:"center",textTransform:"uppercase",letterSpacing:"0.05em"}}>{t.l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Forge leaders */}
          {forgeLeaders.length>0&&(
            <div style={{background:"#111",borderRadius:14,padding:"14px 18px",marginBottom:16,border:"0.5px solid "+RED+"33",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,"+RED+",transparent)"}}/>
              <div style={{fontSize:11,color:RED,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>🔴 This week's Forge</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                {forgeLeaders.map((name,i)=>(
                  <div key={i} style={{background:"#1a0d0d",borderRadius:8,padding:"8px 10px",display:"flex",alignItems:"center",gap:8,border:"0.5px solid "+RED+"22"}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:RED,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>{(name||"?")[0]}</div>
                    <div style={{fontSize:12,color:"#ddd",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Anvil winner */}
          <div style={{background:"linear-gradient(135deg,#1f1700,#2a2000)",border:"1px solid "+GOLD+"33",borderRadius:14,padding:"16px 18px",marginBottom:16,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,"+GOLD+",transparent)"}}/>
            <div style={{fontSize:10,color:GOLD,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:12,textAlign:"center"}}>⚒ This week's Anvil</div>
            {anvilWinner?(
              <div style={{textAlign:"center"}}>
                <div style={{width:72,height:72,borderRadius:"50%",margin:"0 auto 10px",border:"2px solid "+GOLD,overflow:"hidden",background:"#333",boxShadow:"0 0 20px "+GOLD+"55",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:700,color:GOLD}}>
                  {anvilWinner.photo_url?
                    <img src={anvilWinner.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt={anvilWinner.athlete_name}/>
                    :(anvilWinner.athlete_name||"?")[0]
                  }
                </div>
                <div style={{fontSize:17,fontWeight:800,color:GOLD,marginBottom:4}}>{anvilWinner.athlete_name}</div>
                {anvilWinner.note&&<div style={{fontSize:12,color:"#888",fontStyle:"italic",lineHeight:1.6}}>"{anvilWinner.note}"</div>}
              </div>
            ):(
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:36,marginBottom:6,filter:"drop-shadow(0 0 8px "+GOLD+"44)"}}>⚒</div>
                <div style={{fontSize:14,fontWeight:600,color:GOLD,marginBottom:2}}>To be announced</div>
                <div style={{fontSize:11,color:"#555",fontStyle:"italic"}}>"The anvil does not move."</div>
              </div>
            )}
          </div>

          {/* Photo of the week */}
          {photo&&(
            <div style={{borderRadius:14,overflow:"hidden",marginBottom:16,position:"relative",border:"1px solid #222"}}>
              <img src={photo.photo_url} alt="Culture" style={{width:"100%",height:200,objectFit:"cover",display:"block"}}/>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.7),transparent)"}}/>
              <div style={{position:"absolute",bottom:12,left:14}}>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>📸 Latest photo</div>
                {photo.caption&&<div style={{fontSize:12,color:"#fff",fontWeight:500}}>{photo.caption}</div>}
              </div>
            </div>
          )}

          {/* Program schedule */}
          <div style={{background:"#111",borderRadius:14,padding:"14px 18px",marginBottom:16,border:"0.5px solid #1e1e1e"}}>
            <div style={{fontSize:11,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>📅 Weekly schedule</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
              {PROGRAM_DAYS.map((d,i)=>{
                const isToday=day===d.day;
                return(
                  <div key={i} style={{textAlign:"center",padding:"8px 4px",borderRadius:8,background:isToday?d.color+"22":"transparent",border:isToday?"1px solid "+d.color+"44":"1px solid transparent"}}>
                    <div style={{fontSize:9,fontWeight:700,color:isToday?d.color:"#555",marginBottom:3,textTransform:"uppercase"}}>{d.day}</div>
                    <div style={{fontSize:11,color:d.time==="—"?"#333":"#888"}}>{d.time}</div>
                    <div style={{fontSize:8,color:d.color=="#333"?"#333":d.color,marginTop:2,lineHeight:1.2}}>{d.note}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nav buttons */}
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
            {[
              {href:"/athlete",icon:"⚙",label:"Athlete Portal",sub:"Sign in · Check-in · Your profile",color:STEEL},
              {href:"/coach",icon:"⚒",label:"Coach Dashboard",sub:"Roster · Draft · Inbox · Everything",color:GOLD},
              {href:"/callout",icon:"📲",label:"Call-Out Station",sub:"iPad · Weight room · Log violations",color:RED},
            ].map((btn,i)=>(
              <a key={i} href={btn.href} style={{textDecoration:"none"}}>
                <div style={{padding:"14px 18px",borderRadius:14,border:"1px solid #1e1e1e",background:"#111",cursor:"pointer",display:"flex",alignItems:"center",gap:14}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=btn.color+"66";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="#1e1e1e";}}>
                  <div style={{width:44,height:44,borderRadius:12,background:btn.color+"22",border:"1px solid "+btn.color+"33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{btn.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:600,color:btn.color,marginBottom:2}}>{btn.label}</div>
                    <div style={{fontSize:11,color:"#555"}}>{btn.sub}</div>
                  </div>
                  <div style={{fontSize:16,color:"#333"}}>→</div>
                </div>
              </a>
            ))}
          </div>

          {/* QR Check-In */}
          <div onClick={()=>setQrFullscreen(true)} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",borderRadius:14,border:"1px solid #1e1e1e",background:"#111",cursor:"pointer",marginBottom:10}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=ORANGE+"66"}
            onMouseLeave={e=>e.currentTarget.style.borderColor="#1e1e1e"}>
            <div style={{width:44,height:44,borderRadius:10,background:"#1a1a1a",border:"1px solid #2a2a2a",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}>
              {qrDataUrl?<img src={qrDataUrl} style={{width:40,height:40}} alt="QR"/>:<div style={{fontSize:20}}>📱</div>}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,color:ORANGE,marginBottom:2}}>Check-In QR Code</div>
              <div style={{fontSize:11,color:"#555"}}>Tap to display fullscreen at the door</div>
            </div>
            <div style={{fontSize:16,color:"#333"}}>⛶</div>
          </div>

          {/* Fullscreen QR overlay */}
          {qrFullscreen&&(
            <div onClick={()=>setQrFullscreen(false)} style={{position:"fixed",inset:0,background:"#fff",zIndex:999,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,cursor:"pointer"}}>
              <div style={{fontSize:13,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.1em",fontFamily:"Georgia,serif"}}>TF College Group · Check In</div>
              {qrDataUrl&&<img src={qrDataUrl} alt="QR Code" style={{width:"min(80vw,80vh)",height:"min(80vw,80vh)"}}/>}
              <div style={{fontSize:16,fontWeight:600,color:"#1a1a1a",fontFamily:"Georgia,serif"}}>tfcollegegroup.com/checkin</div>
              <div style={{fontSize:11,color:"#ccc",fontFamily:"Georgia,serif"}}>Tap anywhere to close</div>
            </div>
          )}

          {/* GroupMe + Notifications */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            <a href={GROUPME_LINK} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}>
              <div style={{background:"#111",borderRadius:14,padding:"14px",border:"1px solid #1e1e1e",textAlign:"center",cursor:"pointer"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#00aff0aa"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#1e1e1e"}>
                <div style={{fontSize:26,marginBottom:6}}>💬</div>
                <div style={{fontSize:12,fontWeight:700,color:"#00aff0",marginBottom:2}}>GroupMe</div>
                <div style={{fontSize:10,color:"#555"}}>Join the group chat</div>
              </div>
            </a>
            <div style={{background:"#111",borderRadius:14,padding:"14px",border:"1px solid "+(notifGranted?GREEN+"44":"#1e1e1e"),textAlign:"center",cursor:"pointer"}}
              onClick={toggleNotif}
              onMouseEnter={e=>e.currentTarget.style.borderColor=GREEN+"66"}
              onMouseLeave={e=>e.currentTarget.style.borderColor=notifGranted?GREEN+"44":"#1e1e1e"}>
              <div style={{fontSize:26,marginBottom:6}}>{notifGranted?"🔔":"🔕"}</div>
              <div style={{fontSize:12,fontWeight:700,color:notifGranted?GREEN:"#888",marginBottom:2}}>{notifGranted?"Notifications on":"Get notified"}</div>
              <div style={{fontSize:10,color:"#555"}}>Draft · class alerts</div>
            </div>
          </div>

          {/* Verse of the day */}
          <div style={{background:"linear-gradient(135deg,#0d0d1f,#12122a)",borderRadius:14,padding:"16px 18px",marginBottom:16,border:"1px solid #534AB722",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#534AB7,"+GOLD+",transparent)"}}/>
            <div style={{fontSize:10,color:"#534AB7",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:10}}>📖 Verse of the Day</div>
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
              const v=VERSES[new Date().getDate()%VERSES.length];
              return(
                <div>
                  <div style={{fontSize:14,color:"#e0e0e0",fontStyle:"italic",lineHeight:1.8,marginBottom:10}}>"{v.t}"</div>
                  <div style={{display:"inline-block",padding:"4px 12px",borderRadius:20,background:"#534AB722",border:"1px solid #534AB744"}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#534AB7"}}>{v.r}</div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Program values */}
          <div style={{background:"#111",borderRadius:14,padding:"14px 18px",marginBottom:16,border:"0.5px solid #1e1e1e"}}>
            <div style={{fontSize:11,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>⚒ The three tiers</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[
                {icon:"⚙️",title:"The Iron",color:STEEL,desc:"Every athlete enters here. Gray. Unfinished. Ready to be shaped. The work starts now."},
                {icon:"🔥",title:"The Forge",color:RED,desc:"Weekly leaders. Drafted. Responsible for setting the standard and leading the group."},
                {icon:"⚒",title:"The Anvil",color:GOLD,desc:"The highest individual honor. Cannot be drafted. Can only be earned. One per week."},
              ].map((v,i)=>(
                <div key={i} style={{display:"flex",gap:14,alignItems:"flex-start",padding:"10px 12px",borderRadius:10,background:v.color+"0a",border:"1px solid "+v.color+"22"}}>
                  <div style={{fontSize:22,flexShrink:0,marginTop:2}}>{v.icon}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:v.color,marginBottom:3}}>{v.title}</div>
                    <div style={{fontSize:12,color:"#666",lineHeight:1.6}}>{v.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Animated anvil + role progression */}
          <div style={{textAlign:"center",marginBottom:16}}>
            <div style={{fontSize:48,animation:"anvil-pulse 2s ease-in-out infinite",display:"inline-block"}}>⚒</div>
            <style>{`@keyframes anvil-pulse{0%,100%{filter:drop-shadow(0 0 8px ${GOLD}44);transform:scale(1);}50%{filter:drop-shadow(0 0 20px ${GOLD}88);transform:scale(1.05);}}`}</style>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginTop:8}}>
              {[{l:"The Iron",c:STEEL},{l:"→",c:"#333"},{l:"The Forge",c:RED},{l:"→",c:"#333"},{l:"The Anvil",c:GOLD}].map((x,i)=>(
                <div key={i} style={{fontSize:11,color:x.c,fontWeight:i%2===0?600:400}}>{x.l}</div>
              ))}
            </div>
          </div>

          <div style={{textAlign:"center",fontSize:11,color:"#333",letterSpacing:"0.05em"}}>
            TF College Group · Triple F Sports · Knoxville, TN
          </div>
        </div>
      </div>
    </>
  );
}
