// v2
import { useState, useEffect } from "react";
import Head from "next/head";
import { supabase } from "../lib/supabase";

const GOLD="#D4AF37";
const RED="#C0392B";
const STEEL="#708090";
const ORANGE="#E8720C";

export default function Landing(){
  const[loaded,setLoaded]=useState(false);
  const[time,setTime]=useState(new Date());
  const[anvilWinner,setAnvilWinner]=useState(null);
  const[athleteCount,setAthleteCount]=useState(null);
  const[classCountdown,setClassCountdown]=useState(null);

  useEffect(()=>{
    setTimeout(()=>setLoaded(true),100);
    const t=setInterval(()=>{
      setTime(new Date());
      // Update countdown every second
      const start=new Date("2025-06-18T09:00:00");
      const diff=start-new Date();
      if(diff>0){
        const days=Math.floor(diff/(1000*60*60*24));
        const hours=Math.floor((diff%(1000*60*60*24))/(1000*60*60));
        const mins=Math.floor((diff%(1000*60*60))/(1000*60));
        const secs=Math.floor((diff%(1000*60))/1000);
        setClassCountdown({days,hours,mins,secs});
      }else{
        setClassCountdown(null);
      }
    },1000);
    // Load anvil winner
    supabase.from("anvil").select("*").order("created_at",{ascending:false}).limit(1).then(({data})=>{
      if(data&&data.length>0)setAnvilWinner(data[0]);
    }).catch(()=>{});
    // Load athlete count
    supabase.from("athletes").select("id",{count:"exact"}).eq("status","active").then(({count})=>{
      if(count)setAthleteCount(count);
    }).catch(()=>{});
    return()=>clearInterval(t);
  },[]);

  const day=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][time.getDay()];
  const isClassDay=["Mon","Tue","Thu","Fri"].includes(day);
  const isMonFri=day==="Mon"||day==="Fri";
  const timeStr=time.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
  const dateStr=time.toLocaleDateString([],{weekday:"long",month:"long",day:"numeric"});

  return(
    <>
      <Head>
        <title>TF College Group</title>
        <meta name="description" content="TF College Group — Iron sharpens iron"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="theme-color" content="#0f0f0f"/>
        <link rel="manifest" href="/manifest.json"/>
      </Head>
      <div style={{minHeight:"100vh",background:"#0f0f0f",fontFamily:"Georgia, serif",position:"relative",overflowY:"auto"}}>

        {/* Ambient glows */}
        <div style={{position:"fixed",top:-150,left:-100,width:400,height:400,borderRadius:"50%",background:ORANGE,opacity:0.05,filter:"blur(100px)",pointerEvents:"none"}}/>
        <div style={{position:"fixed",bottom:-100,right:-100,width:300,height:300,borderRadius:"50%",background:GOLD,opacity:0.05,filter:"blur(80px)",pointerEvents:"none"}}/>
        <div style={{position:"fixed",top:"40%",right:-50,width:200,height:200,borderRadius:"50%",background:RED,opacity:0.04,filter:"blur(60px)",pointerEvents:"none"}}/>

        {/* Top bar */}
        <div style={{position:"relative",zIndex:10,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"0.5px solid #1a1a1a"}}>
          <div style={{fontSize:11,color:"#444",letterSpacing:"0.1em",textTransform:"uppercase"}}>tfcollegegroup.com</div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:12,color:"#888"}}>{dateStr}</div>
            <div style={{fontSize:11,color:isClassDay?"#58B368":"#555",fontWeight:isClassDay?600:400}}>
              {isClassDay?"⚡ Class day · "+timeStr:"No class · "+timeStr}
            </div>
          </div>
        </div>

        <div style={{maxWidth:480,margin:"0 auto",padding:"0 20px 3rem",position:"relative",zIndex:1,opacity:loaded?1:0,transform:loaded?"translateY(0)":"translateY(20px)",transition:"opacity 0.8s,transform 0.8s"}}>

          {/* Class day banner */}
          {isClassDay&&(
            <div style={{background:"linear-gradient(135deg,#1a0800,#250e00)",border:"1px solid "+ORANGE+"44",borderRadius:14,padding:"14px 18px",marginTop:20,marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,"+ORANGE+",transparent)"}}/>
              <div>
                <div style={{fontSize:11,color:ORANGE,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:3}}>🔥 Game day</div>
                <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>Class today — {isMonFri?"9:00am":"9:30am"} sharp</div>
                <div style={{fontSize:11,color:"#666",marginTop:2}}>On time is late. Early is the standard.</div>
              </div>
              <div style={{fontSize:32,filter:"drop-shadow(0 0 8px "+ORANGE+"88)"}}>⚒</div>
            </div>
          )}

          {/* Poster */}
          <div style={{width:200,margin:"24px auto 20px",boxShadow:"0 0 50px "+ORANGE+"44,0 0 100px "+ORANGE+"18",border:"1.5px solid "+ORANGE+"44",borderRadius:18,overflow:"hidden"}}>
            <img src="/poster.png" alt="TF College Group" style={{width:"100%",height:"auto",display:"block"}}/>
          </div>

          {/* Title */}
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{fontSize:11,color:"#555",textTransform:"uppercase",letterSpacing:"0.2em",marginBottom:10}}>Triple F · College Group</div>
            <h1 style={{fontSize:34,fontWeight:800,color:"#fff",margin:"0 0 10px",letterSpacing:"-0.02em",lineHeight:1.1}}>TF College Group</h1>
            <div style={{fontSize:13,color:"#666",fontStyle:"italic",lineHeight:1.7,marginBottom:8}}>
              "As iron sharpens iron, so one person sharpens another."
            </div>
            <div style={{fontSize:11,color:"#444"}}>— Proverbs 27:17</div>
          </div>

          {/* Stats row */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20}}>
            {[
              {label:"Athletes",val:athleteCount||"—",color:STEEL},
              {label:"Season",val:"2025",color:ORANGE},
              {label:"Class",val:"June 18",color:GOLD},
            ].map((s,i)=>(
              <div key={i} style={{background:"#111",borderRadius:12,padding:"12px 8px",textAlign:"center",border:"0.5px solid #1e1e1e"}}>
                <div style={{fontSize:20,fontWeight:800,color:s.color}}>{s.val}</div>
                <div style={{fontSize:10,color:"#555",marginTop:3,textTransform:"uppercase",letterSpacing:"0.05em"}}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Countdown to first class */}
          {classCountdown&&(
            <div style={{background:"linear-gradient(135deg,#1a1400,#221b00)",border:"1px solid "+GOLD+"33",borderRadius:14,padding:"16px",marginBottom:20,textAlign:"center",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,"+GOLD+",transparent)"}}/>
              <div style={{fontSize:10,color:GOLD,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:12}}>⚒ First class in</div>
              <div style={{display:"flex",justifyContent:"center",gap:16}}>
                {[{v:classCountdown.days,l:"Days"},{v:classCountdown.hours,l:"Hours"},{v:classCountdown.mins,l:"Mins"},{v:classCountdown.secs,l:"Secs"}].map(t=>(
                  <div key={t.l}>
                    <div style={{fontSize:28,fontWeight:900,color:GOLD,lineHeight:1,minWidth:40,textAlign:"center"}}>{String(t.v).padStart(2,"0")}</div>
                    <div style={{fontSize:9,color:"#555",marginTop:4,textTransform:"uppercase",letterSpacing:"0.05em"}}>{t.l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nav buttons */}
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
            {[
              {href:"/athlete",icon:"⚙",label:"Athlete Portal",sub:"Sign in · Check-in · Your profile · Stats",color:STEEL},
              {href:"/coach",icon:"⚒",label:"Coach Dashboard",sub:"Roster · Draft · Inbox · Everything",color:GOLD},
              {href:"/callout",icon:"📲",label:"Call-Out Station",sub:"iPad · Weight room · Log violations",color:RED},
            ].map((btn,i)=>(
              <a key={i} href={btn.href} style={{textDecoration:"none"}}>
                <div style={{padding:"16px 18px",borderRadius:14,border:"1px solid #1e1e1e",background:"#111",cursor:"pointer",display:"flex",alignItems:"center",gap:14}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=btn.color+"66";e.currentTarget.style.transform="translateY(-1px)";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="#1e1e1e";e.currentTarget.style.transform="none";}}>
                  <div style={{width:46,height:46,borderRadius:12,background:"linear-gradient(135deg,"+btn.color+"33,"+btn.color+"11)",border:"1px solid "+btn.color+"33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                    {btn.icon}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:15,fontWeight:600,color:btn.color,marginBottom:2}}>{btn.label}</div>
                    <div style={{fontSize:11,color:"#555"}}>{btn.sub}</div>
                  </div>
                  <div style={{fontSize:16,color:"#333"}}>→</div>
                </div>
              </a>
            ))}
          </div>

          {/* Anvil winner */}
          <div style={{background:"linear-gradient(135deg,#1f1700,#2a2000)",border:"1px solid "+GOLD+"33",borderRadius:14,padding:"14px 18px",marginBottom:20,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,"+GOLD+",transparent)"}}/>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontSize:26,filter:"drop-shadow(0 0 8px "+GOLD+"66)"}}>⚒</div>
              <div>
                <div style={{fontSize:10,color:GOLD,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:2}}>This week's Anvil</div>
                <div style={{fontSize:14,fontWeight:700,color:GOLD}}>
                  {anvilWinner?anvilWinner.athlete_name:"To be announced"}
                </div>
                {anvilWinner?.note&&<div style={{fontSize:11,color:"#666",fontStyle:"italic",marginTop:2}}>"{anvilWinner.note}"</div>}
                {!anvilWinner&&<div style={{fontSize:11,color:"#555",fontStyle:"italic",marginTop:2}}>"The anvil does not move."</div>}
              </div>
            </div>
          </div>

          {/* Role progression */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:24}}>
            {[{l:"The Iron",c:STEEL},{l:"→",c:"#333"},{l:"The Forge",c:RED},{l:"→",c:"#333"},{l:"The Anvil",c:GOLD}].map((x,i)=>(
              <div key={i} style={{fontSize:11,color:x.c,fontWeight:i%2===0?600:400}}>{x.l}</div>
            ))}
          </div>

          {/* Footer */}
          <div style={{textAlign:"center",fontSize:11,color:"#333",letterSpacing:"0.05em"}}>
            TF College Group · Triple F Sports · Knoxville, TN
          </div>
        </div>
      </div>
    </>
  );
}
