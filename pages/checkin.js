import { useState, useEffect } from "react";
import Head from "next/head";
import { supabase } from "../lib/supabase";
import Icon from "../components/Icon";
import { hSuccess, hError, hTap } from "../lib/haptics";

const GREEN="#2FA869";
const GREEN_TXT="#5FD08A";
const RED="#C0392B";
const GOLD="#D4AF37";
const STEEL="#8CA0B0";
const ORANGE="#E8720C";
const BG_GRAD="linear-gradient(160deg,#06060f 0%,#0a0608 50%,#080808 100%)";

const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const CLASS_DAYS=["Mon","Tue","Thu","Fri"];
const CUTOFFS={Mon:{h:9,m:0},Fri:{h:9,m:0},Tue:{h:9,m:30},Thu:{h:9,m:30}};

export default function CheckIn(){
  const[athletes,setAthletes]=useState([]);
  const[search,setSearch]=useState("");
  const[selected,setSelected]=useState(null);
  const[done,setDone]=useState(null);
  const[loading,setLoading]=useState(true);

  useEffect(()=>{
    (async()=>{
      try{
        const{data}=await supabase.from("athletes").select("id,name,photo_url,role").eq("status","active").order("name");
        setAthletes(data||[]);
      }catch(e){}
      setLoading(false);
    })();
  },[]);

  const now=new Date();
  const estNow=new Date(now.toLocaleString("en-US",{timeZone:"America/New_York"}));
  const day=DAYS[estNow.getDay()];
  const isClassDay=CLASS_DAYS.includes(day);
  const today=estNow.getFullYear()+"-"+String(estNow.getMonth()+1).padStart(2,"0")+"-"+String(estNow.getDate()).padStart(2,"0");
  const cut=CUTOFFS[day]||{h:9,m:30};
  const isLate=estNow.getHours()>cut.h||(estNow.getHours()===cut.h&&estNow.getMinutes()>=cut.m);
  const timeStr=estNow.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});

  const doCheckin=async(athlete)=>{
    setSelected(athlete);
    try{
      const{data:existing}=await supabase.from("attendance")
        .select("*").eq("athlete_id",athlete.id).eq("date",today);
      if(existing&&existing.length>0){
        hTap();
        setDone({already:true,status:existing[0].status,time:existing[0].time_logged,name:athlete.name});
        return;
      }
      const status=isLate?"late":"early";
      await supabase.from("attendance").insert({
        athlete_id:athlete.id,date:today,day,status,time_logged:timeStr,
      });
      if(status==="early")hSuccess();else hError();
      setDone({already:false,status,time:timeStr,name:athlete.name});
    }catch(e){
      setDone({already:false,status:isLate?"late":"early",time:timeStr,name:athlete.name});
    }
  };

  // Success screen
  if(done){
    const isEarly=done.status==="early";
    const accent=done.already?GOLD:isEarly?GREEN:RED;
    const icon=done.already?"checkSquare":isEarly?"flame":"clock";
    return(
      <>
        <Head><title>Checked In!</title></Head>
        <div style={{minHeight:"100vh",background:BG_GRAD,fontFamily:"Georgia,serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem",textAlign:"center",position:"relative",overflow:"hidden",color:"#fff"}}>
          <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 50% 38%, "+accent+"22, transparent 60%)",pointerEvents:"none"}}/>
          {isEarly&&!done.already&&(
            <div style={{position:"absolute",top:"32%",left:"50%",width:0,height:0,pointerEvents:"none",zIndex:2}}>
              {Array.from({length:16}).map((_,i)=>{
                const ang=(i/16)*Math.PI*2;const dist=70+((i*37)%60);
                const cols=[GREEN,GOLD,"#fff"];
                return <div key={i} style={{position:"absolute",left:Math.cos(ang)*dist,top:Math.sin(ang)*dist*0.6,width:8,height:8,borderRadius:i%3===0?"50%":1,background:cols[i%cols.length],opacity:0,animation:`tfSpark 1.2s ease-out ${0.1+(i%5)*0.06}s both`,boxShadow:`0 0 8px ${cols[i%cols.length]}`}}/>;
              })}
            </div>
          )}
          <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center"}}>
            <div className="tf-pop" style={{width:120,height:120,borderRadius:"50%",background:accent+"1c",border:"2px solid "+accent+"66",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:22,boxShadow:"0 0 50px "+accent+"55"}}>
              <Icon name={icon} size={54} color={accent} style={{filter:"drop-shadow(0 0 12px "+accent+"88)"}}/>
            </div>
            <div style={{fontSize:27,fontWeight:900,color:accent,marginBottom:8,letterSpacing:"-0.02em"}}>
              {done.already?"Already checked in":isEarly?"You're early!":"You're late"}
            </div>
            <div style={{fontSize:19,fontWeight:700,color:"#fff",marginBottom:5}}>{done.name}</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:28}}>{done.time} · {day}</div>

            {isEarly&&!done.already&&(
              <div style={{background:"rgba(47,168,105,0.1)",borderRadius:16,padding:"16px 26px",marginBottom:26,border:"1px solid "+GREEN+"44",maxWidth:300}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:5}}>
                  <Icon name="anvil" size={16} color={GREEN_TXT}/>
                  <span style={{fontSize:16,fontWeight:800,color:GREEN_TXT}}>Iron sharpens iron</span>
                </div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>Early arrival counts toward your streak!</div>
              </div>
            )}
            {!isEarly&&!done.already&&(
              <div style={{background:"rgba(192,57,43,0.12)",borderRadius:16,padding:"16px 26px",marginBottom:26,border:"1px solid "+RED+"44",maxWidth:300}}>
                <div style={{fontSize:18,fontWeight:900,color:RED,marginBottom:4}}>50 crunches</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>On time is late. Early is the only standard.</div>
              </div>
            )}

            <button onClick={()=>{setDone(null);setSelected(null);setSearch("");}} style={{display:"flex",alignItems:"center",gap:7,padding:"12px 26px",borderRadius:24,border:"1px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.7)",fontSize:13,cursor:"pointer",fontFamily:"Georgia,serif"}}>
              <Icon name="chevronRight" size={13} color="rgba(255,255,255,0.5)" style={{transform:"rotate(180deg)"}}/> Back
            </button>
          </div>
        </div>
      </>
    );
  }

  // Not a class day
  if(!isClassDay){
    return(
      <>
        <Head><title>Check In — TF College Group</title></Head>
        <div style={{minHeight:"100vh",background:BG_GRAD,fontFamily:"Georgia,serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem",textAlign:"center",color:"#fff"}}>
          <div style={{width:84,height:84,borderRadius:"50%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20}}>
            <Icon name="calendar" size={36} color="rgba(255,255,255,0.4)"/>
          </div>
          <div style={{fontSize:20,fontWeight:800,color:"#fff",marginBottom:8,letterSpacing:"-0.01em"}}>No class today</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",lineHeight:1.6}}>Class days are Monday, Tuesday,<br/>Thursday &amp; Friday</div>
        </div>
      </>
    );
  }

  const filtered=athletes.filter(a=>!search||a.name.toLowerCase().includes(search.toLowerCase()));

  return(
    <>
      <Head><title>Check In — TF College Group</title></Head>
      <div style={{minHeight:"100vh",background:BG_GRAD,fontFamily:"Georgia,serif",maxWidth:480,margin:"0 auto",color:"#fff"}}>
        {/* Header */}
        <div style={{background:"rgba(10,10,16,0.92)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",padding:"20px 18px 16px",borderBottom:"1px solid rgba(255,255,255,0.08)",position:"sticky",top:0,zIndex:10}}>
          <div style={{textAlign:"center",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:9,marginBottom:7}}>
              <Icon name="anvil" size={20} color={GOLD}/>
              <span style={{fontSize:22,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Check In</span>
            </div>
            <div style={{display:"inline-flex",alignItems:"center",gap:7,fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:20,background:isLate?RED+"22":GREEN+"22",border:"1px solid "+(isLate?RED+"44":GREEN+"44"),color:isLate?"#E88":GREEN_TXT}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:isLate?RED:GREEN,boxShadow:"0 0 8px "+(isLate?RED:GREEN)}}/>
              {isLate?"Late":"On time"} · {timeStr} · {day}
            </div>
          </div>
          <div style={{position:"relative"}}>
            <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",display:"flex",pointerEvents:"none"}}>
              <Icon name="search" size={16} color="rgba(255,255,255,0.3)"/>
            </span>
            <input
              autoFocus
              type="search"
              value={search}
              onChange={e=>setSearch(e.target.value)}
              placeholder="Search your name…"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              style={{width:"100%",padding:"13px 16px 13px 40px",borderRadius:14,border:"1px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.06)",color:"#fff",fontSize:16,fontFamily:"Georgia,serif",boxSizing:"border-box",outline:"none",WebkitAppearance:"none"}}
              onFocus={e=>e.target.style.borderColor="rgba(255,255,255,0.28)"}
              onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"}
            />
          </div>
        </div>

        {/* Athlete list */}
        <div style={{padding:"14px"}}>
          {loading?(
            <div style={{textAlign:"center",padding:"3rem",color:"rgba(255,255,255,0.3)",fontSize:13}}>Loading…</div>
          ):filtered.length===0?(
            <div style={{textAlign:"center",padding:"3rem",color:"rgba(255,255,255,0.3)",fontSize:13}}>No athletes found</div>
          ):filtered.map(a=>{
            const isForge=a.role==="forge";
            const col=isForge?RED:STEEL;
            return(
            <button key={a.id} onClick={()=>doCheckin(a)} style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"13px 16px",borderRadius:16,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.045)",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.05)",cursor:"pointer",fontFamily:"Georgia,serif",marginBottom:9,textAlign:"left",transition:"border-color 0.15s,background 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=col+"66";e.currentTarget.style.background="rgba(255,255,255,0.07)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";e.currentTarget.style.background="rgba(255,255,255,0.045)";}}>
              <div style={{width:48,height:48,borderRadius:"50%",background:col,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#fff",flexShrink:0,overflow:"hidden",boxShadow:"0 0 16px "+col+"44"}}>
                {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="" onError={e=>{e.target.style.display="none";}}/>:a.name[0]}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:700,color:"#fff"}}>{a.name}</div>
                <div style={{display:"flex",alignItems:"center",gap:5,marginTop:3}}>
                  <Icon name={isForge?"flame":"barbell"} size={11} color={col}/>
                  <span style={{fontSize:11,color:col}}>{isForge?"The Forge":"The Iron"}</span>
                </div>
              </div>
              <Icon name="chevronRight" size={17} color="rgba(255,255,255,0.25)"/>
            </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
