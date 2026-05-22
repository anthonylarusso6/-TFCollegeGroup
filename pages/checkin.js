import { useState, useEffect } from "react";
import Head from "next/head";
import { supabase } from "../lib/supabase";

const BG="#0f0f0f";
const GREEN="#1E6B3A";
const RED="#C0392B";
const GOLD="#D4AF37";
const STEEL="#708090";
const ORANGE="#E8720C";

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
      }catch(e){console.error("Load athletes:",e);}
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
        setDone({already:true,status:existing[0].status,time:existing[0].time_logged,name:athlete.name});
        return;
      }
      const status=isLate?"late":"early";
      await supabase.from("attendance").insert({
        athlete_id:athlete.id,date:today,day,status,time_logged:timeStr,
      });
      setDone({already:false,status,time:timeStr,name:athlete.name});
    }catch(e){
      console.error("Check-in error:",e);
      setDone({already:false,status:isLate?"late":"early",time:timeStr,name:athlete.name});
    }
  };

  // Success screen
  if(done){
    const isEarly=done.status==="early";
    return(
      <>
        <Head><title>Checked In!</title></Head>
        <div style={{minHeight:"100vh",background:BG,fontFamily:"Georgia,serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem",textAlign:"center",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,background:isEarly?"radial-gradient(circle at 50% 40%, #0d1f0d, #0f0f0f)":"radial-gradient(circle at 50% 40%, #1a0808, #0f0f0f)"}}/>
          <div style={{position:"relative",zIndex:1}}>
            <div style={{fontSize:90,marginBottom:16,filter:"drop-shadow(0 0 30px "+(isEarly?GREEN:RED)+"99)"}}>
              {done.already?"✅":isEarly?"🏃":"🕐"}
            </div>
            <div style={{fontSize:26,fontWeight:800,color:isEarly?GREEN:RED,marginBottom:8}}>
              {done.already?"Already checked in!":isEarly?"You're early! 🔥":"You're late!"}
            </div>
            <div style={{fontSize:18,fontWeight:600,color:"#fff",marginBottom:4}}>{done.name}</div>
            <div style={{fontSize:14,color:"#666",marginBottom:28}}>{done.time} · {day}</div>

            {isEarly&&!done.already&&(
              <div style={{background:"#0d1f0d",borderRadius:14,padding:"16px 24px",marginBottom:24,border:"1px solid "+GREEN+"44",maxWidth:280}}>
                <div style={{fontSize:16,fontWeight:700,color:GREEN,marginBottom:4}}>Iron sharpens iron ⚒</div>
                <div style={{fontSize:12,color:"#888"}}>Early arrival counts toward your streak!</div>
              </div>
            )}
            {!isEarly&&!done.already&&(
              <div style={{background:"#1a0808",borderRadius:14,padding:"16px 24px",marginBottom:24,border:"1px solid "+RED+"44",maxWidth:280}}>
                <div style={{fontSize:16,fontWeight:700,color:RED,marginBottom:4}}>50 crunches</div>
                <div style={{fontSize:12,color:"#888"}}>On time is late. Early is the only standard.</div>
              </div>
            )}

            <button onClick={()=>{setDone(null);setSelected(null);setSearch("");}} style={{padding:"12px 28px",borderRadius:12,border:"1px solid #333",background:"transparent",color:"#666",fontSize:13,cursor:"pointer",fontFamily:"Georgia,serif"}}>
              ← Back
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
        <div style={{minHeight:"100vh",background:BG,fontFamily:"Georgia,serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem",textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:16}}>😴</div>
          <div style={{fontSize:18,fontWeight:600,color:"#fff",marginBottom:8}}>No class today</div>
          <div style={{fontSize:13,color:"#555"}}>Class days are Monday, Tuesday, Thursday, Friday</div>
        </div>
      </>
    );
  }

  const filtered=athletes.filter(a=>!search||a.name.toLowerCase().includes(search.toLowerCase()));

  return(
    <>
      <Head><title>Check In — TF College Group</title></Head>
      <div style={{minHeight:"100vh",background:BG,fontFamily:"Georgia,serif",maxWidth:480,margin:"0 auto"}}>
        {/* Header */}
        <div style={{background:"#111",padding:"20px 20px 16px",borderBottom:"1px solid #1a1a1a",position:"sticky",top:0,zIndex:10}}>
          <div style={{textAlign:"center",marginBottom:12}}>
            <div style={{fontSize:22,fontWeight:800,color:"#fff",marginBottom:2}}>⚒ Check In</div>
            <div style={{fontSize:12,color:isLate?RED:GREEN,fontWeight:600}}>
              {isLate?"⚠️ Late":"✅ On time"} · {timeStr} · {day}
            </div>
          </div>
          <input
            autoFocus
            type="search"
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder="🔍 Search your name..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            style={{width:"100%",padding:"12px 16px",borderRadius:12,border:"1px solid #333",background:"#1a1a1a",color:"#fff",fontSize:16,fontFamily:"Georgia,serif",boxSizing:"border-box",outline:"none",WebkitAppearance:"none"}}
          />
        </div>

        {/* Athlete list */}
        <div style={{padding:"12px"}}>
          {loading?(
            <div style={{textAlign:"center",padding:"3rem",color:"#555"}}>Loading...</div>
          ):filtered.length===0?(
            <div style={{textAlign:"center",padding:"3rem",color:"#555"}}>No athletes found</div>
          ):filtered.map(a=>(
            <button key={a.id} onClick={()=>doCheckin(a)} style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:14,border:"1px solid #1e1e1e",background:"#111",cursor:"pointer",fontFamily:"Georgia,serif",marginBottom:8,textAlign:"left"}}>
              <div style={{width:46,height:46,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:700,color:"#fff",flexShrink:0,overflow:"hidden",border:a.role==="forge"?"2px solid "+RED:"none"}}>
                {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:a.name[0]}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:600,color:"#fff"}}>{a.name}</div>
                <div style={{fontSize:11,color:a.role==="forge"?RED:STEEL,marginTop:2}}>{a.role==="forge"?"⚒ The Forge":"The Iron"}</div>
              </div>
              <div style={{fontSize:20,color:"#333"}}>→</div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
