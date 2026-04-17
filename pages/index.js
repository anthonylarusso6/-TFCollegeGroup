import { useState, useEffect } from "react";
import Head from "next/head";

const GOLD="#D4AF37";
const RED="#C0392B";
const STEEL="#708090";

export default function Landing(){
  const[loaded,setLoaded]=useState(false);
  const[time,setTime]=useState(new Date());

  useEffect(()=>{
    setTimeout(()=>setLoaded(true),100);
    const t=setInterval(()=>setTime(new Date()),1000);
    return()=>clearInterval(t);
  },[]);

  const day=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][time.getDay()];
  const isClassDay=["Mon","Tue","Thu","Fri"].includes(day);
  const timeStr=time.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
  const dateStr=time.toLocaleDateString([],{month:"long",day:"numeric",year:"numeric"});

  return(
    <>
      <Head>
        <title>TF College Group</title>
        <meta name="description" content="TF College Group — Iron sharpens iron"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="theme-color" content="#0f0f0f"/>
        <link rel="manifest" href="/manifest.json"/>
      </Head>
      <div style={{
        minHeight:"100vh",
        background:"#0f0f0f",
        fontFamily:"Georgia, serif",
        display:"flex",
        flexDirection:"column",
        alignItems:"center",
        justifyContent:"center",
        padding:"2rem 1.5rem",
        position:"relative",
        overflow:"hidden",
      }}>
        {/* Background */}
        <div style={{
          position:"absolute",top:0,left:0,right:0,bottom:0,
          background:"radial-gradient(ellipse at 20% 50%, #1a1a0a 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #0a0a1a 0%, transparent 50%)",
          pointerEvents:"none",
        }}/>

        {/* Top bar */}
        <div style={{
          position:"absolute",top:0,left:0,right:0,
          padding:"1rem 1.5rem",
          display:"flex",
          alignItems:"center",
          justifyContent:"space-between",
          borderBottom:"0.5px solid #222",
        }}>
          <div style={{fontSize:11,color:"#bbbbbb",letterSpacing:"0.1em",textTransform:"uppercase"}}>
            tfcollegegroup.com
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:12,color:"#cccccc"}}>{dateStr}</div>
            <div style={{fontSize:11,color:isClassDay?"#58B368":"#999999"}}>{isClassDay?"Class day":"No class today"} · {timeStr}</div>
          </div>
        </div>

        {/* Main content */}
        <div style={{
          textAlign:"center",
          maxWidth:480,
          width:"100%",
          opacity:loaded?1:0,
          transform:loaded?"translateY(0)":"translateY(20px)",
          transition:"opacity 0.8s ease, transform 0.8s ease",
        }}>

          {/* Icon */}
          <div style={{
            width:"100%",maxWidth:320,height:360,borderRadius:20,
            margin:"0 auto 2rem",
            overflow:"hidden",
            boxShadow:"0 0 60px rgba(255,130,0,0.35), 0 0 120px rgba(255,130,0,0.15)",
            border:"2px solid rgba(255,130,0,0.4)",
          }}>
            <img src="/poster.png" alt="TF College Group" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center 20%"}}/>
          </div>

          {/* Title */}
          <div style={{fontSize:11,color:"#999999",textTransform:"uppercase",letterSpacing:"0.2em",marginBottom:12}}>
            Triple F · College Group
          </div>
          <h1 style={{fontSize:36,fontWeight:400,color:"#fff",margin:"0 0 8px",letterSpacing:"-0.02em",lineHeight:1.1}}>
            TF College Group
          </h1>
          <div style={{fontSize:13,color:"#cccccc",fontStyle:"italic",marginBottom:48,lineHeight:1.6}}>
            "As iron sharpens iron, so one person sharpens another."
            <div style={{fontSize:11,marginTop:4,color:"#999999"}}>— Proverbs 27:17</div>
          </div>

          {/* Three buttons */}
          <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:40}}>

            {/* Athlete */}
            <a href="/athlete">
              <div style={{
                padding:"18px 24px",borderRadius:14,
                border:"0.5px solid #333",
                background:"linear-gradient(135deg, #1a1a1a, #1f1f1f)",
                cursor:"pointer",display:"flex",alignItems:"center",gap:16,
                transition:"all 0.2s ease",
              }}
              onMouseEnter={e=>{e.currentTarget.style.border="0.5px solid "+STEEL;e.currentTarget.style.transform="translateY(-2px)";}}
              onMouseLeave={e=>{e.currentTarget.style.border="0.5px solid #333";e.currentTarget.style.transform="translateY(0)";}}>
                <div style={{width:44,height:44,borderRadius:"50%",background:STEEL,border:"2px solid #fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,boxShadow:"0 0 18px "+STEEL+"88"}}>⚙</div>
                <div style={{textAlign:"left",flex:1}}>
                  <div style={{fontSize:15,fontWeight:500,color:"#fff",marginBottom:2}}>Athlete Login</div>
                  <div style={{fontSize:12,color:"#cccccc"}}>Sign in to your profile, check in, view your group</div>
                </div>
                <div style={{fontSize:18,color:"#aaaaaa"}}>→</div>
              </div>
            </a>

            {/* Coach */}
            <a href="/coach">
              <div style={{
                padding:"18px 24px",borderRadius:14,
                border:"0.5px solid #333",
                background:"linear-gradient(135deg, #1a1a1a, #1f1f1f)",
                cursor:"pointer",display:"flex",alignItems:"center",gap:16,
                transition:"all 0.2s ease",
              }}
              onMouseEnter={e=>{e.currentTarget.style.border="0.5px solid "+GOLD;e.currentTarget.style.transform="translateY(-2px)";}}
              onMouseLeave={e=>{e.currentTarget.style.border="0.5px solid #333";e.currentTarget.style.transform="translateY(0)";}}>
                <div style={{width:44,height:44,borderRadius:"50%",background:GOLD,border:"2px solid #fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,boxShadow:"0 0 18px "+GOLD+"88"}}>⚒</div>
                <div style={{textAlign:"left",flex:1}}>
                  <div style={{fontSize:15,fontWeight:500,color:GOLD,marginBottom:2}}>Coach Access</div>
                  <div style={{fontSize:12,color:"#cccccc"}}>Full dashboard · Draft · Roster · Inbox · Everything</div>
                </div>
                <div style={{fontSize:18,color:"#aaaaaa"}}>→</div>
              </div>
            </a>

            {/* Callout */}
            <a href="/callout">
              <div style={{
                padding:"18px 24px",borderRadius:14,
                border:"0.5px solid #333",
                background:"linear-gradient(135deg, #1a1a1a, #1f1f1f)",
                cursor:"pointer",display:"flex",alignItems:"center",gap:16,
                transition:"all 0.2s ease",
              }}
              onMouseEnter={e=>{e.currentTarget.style.border="0.5px solid "+RED;e.currentTarget.style.transform="translateY(-2px)";}}
              onMouseLeave={e=>{e.currentTarget.style.border="0.5px solid #333";e.currentTarget.style.transform="translateY(0)";}}>
                <div style={{width:44,height:44,borderRadius:"50%",background:RED,border:"2px solid #fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,boxShadow:"0 0 18px "+RED+"88"}}>📲</div>
                <div style={{textAlign:"left",flex:1}}>
                  <div style={{fontSize:15,fontWeight:500,color:RED,marginBottom:2}}>Call-Out Station</div>
                  <div style={{fontSize:12,color:"#cccccc"}}>iPad · Weight room · Log violations</div>
                </div>
                <div style={{fontSize:18,color:"#aaaaaa"}}>→</div>
              </div>
            </a>
          </div>

          {/* Anvil winner */}
          <div style={{
            padding:"14px 18px",borderRadius:12,
            background:"#1f1700",border:"0.5px solid "+GOLD+"44",
            display:"flex",alignItems:"center",gap:12,marginBottom:32,
          }}>
            <div style={{width:8,height:8,borderRadius:"50%",background:GOLD,flexShrink:0}}/>
            <div style={{textAlign:"left"}}>
              <div style={{fontSize:10,color:GOLD,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>This week's Anvil</div>
              <div style={{fontSize:13,color:"#fff",fontWeight:500}}>To be announced Friday</div>
              <div style={{fontSize:11,color:"#999999",fontStyle:"italic",marginTop:2}}>"The anvil does not move."</div>
            </div>
          </div>

          {/* Progression */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:32}}>
            {[{label:"The Iron",color:STEEL},{label:"→",color:"#777"},{label:"The Forge",color:RED},{label:"→",color:"#777"},{label:"The Anvil",color:GOLD}].map((item,i)=>(
              <div key={i} style={{fontSize:11,color:item.color,fontWeight:i%2===0?500:400}}>{item.label}</div>
            ))}
          </div>

          {/* Footer */}
          <div style={{fontSize:11,color:"#999999",letterSpacing:"0.05em"}}>
            TF College Group · Knoxville, TN · triplefsports.com
          </div>
        </div>
      </div>
    </>
  );
}
