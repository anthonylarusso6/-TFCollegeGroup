// v1776642403
import { useState, useEffect, useRef } from "react";
import { BG, PUR, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { ErrorBoundary } from "../components/ErrorBoundary";
import ProgramUpload from "../components/ProgramUpload";
import Head from "next/head";
import { supabase } from "../lib/supabase";
import Accountability from "../components/Accountability";
import FellowshipFriday from "../components/FellowshipFriday";
import MindsetMonday from "../components/MindsetMonday";
import CultureEvents from "../components/CultureEvents";
import Icon from "../components/Icon";
import EmptyState from "../components/EmptyState";
import { hTap } from "../lib/haptics";
import TeamsView from "../components/TeamsView";

const COACH_PIN="1803";

function DriveLinksManager(){
  const[links,setLinks]=useState([]);
  const[title,setTitle]=useState("");
  const[url,setUrl]=useState("");
  const[desc,setDesc]=useState("");
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);

  useEffect(()=>{
    (async()=>{
      try{const{data}=await supabase.from("announcements").select("*").eq("type","drive_link").eq("active",true).order("created_at",{ascending:false});setLinks(data||[]);}catch(e){}
    })();
  },[]);

  const addLink=async()=>{
    if(!title.trim()||!url.trim())return;
    setSaving(true);
    try{
      const{data}=await supabase.from("announcements").insert({
        type:"drive_link",active:true,
        message:JSON.stringify({title,url,description:desc})
      }).select().single();
      if(data)setLinks(p=>[data,...p]);
    }catch(e){}
    setTitle("");setUrl("");setDesc("");setSaving(false);setSaved(true);
    setTimeout(()=>setSaved(false),2000);
  };

  const removeLink=async(id)=>{
    try{await supabase.from("announcements").update({active:false}).eq("id",id);}catch(e){}
    setLinks(p=>p.filter(l=>l.id!==id));
  };

  return(
    <div>
      {links.map((l,i)=>{
        const data=JSON.parse(l.message||"{}");
        return(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#141414",borderRadius:10,marginBottom:8,border:"0.5px solid #252525"}}>
            <div style={{fontSize:20}}>📄</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:"#ddd",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{data.title}</div>
              {data.description&&<div style={{fontSize:11,color:"#666"}}>{data.description}</div>}
            </div>
            <a href={data.url} target="_blank" rel="noreferrer" style={{fontSize:11,color:"#4285f4",textDecoration:"none",fontFamily:"Georgia,serif",padding:"4px 8px",border:"0.5px solid #4285f4",borderRadius:6}}>Open</a>
            <button onClick={()=>removeLink(l.id)} style={{fontSize:11,color:RED,background:"transparent",border:"0.5px solid "+RED+"44",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontFamily:"Georgia,serif"}}>Remove</button>
          </div>
        );
      })}
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Document title (e.g. Summer Program Poster)" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"0.5px solid #222",fontSize:12,fontFamily:"Georgia,serif",background:"#111",color:"#ddd",marginBottom:6,boxSizing:"border-box"}}/>
      <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="Google Drive link" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"0.5px solid #222",fontSize:12,fontFamily:"Georgia,serif",background:"#111",color:"#ddd",marginBottom:6,boxSizing:"border-box"}}/>
      <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Short description (optional)" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"0.5px solid #222",fontSize:12,fontFamily:"Georgia,serif",background:"#111",color:"#ddd",marginBottom:8,boxSizing:"border-box"}}/>
      <button onClick={addLink} disabled={!title.trim()||!url.trim()||saving} style={{width:"100%",padding:"10px",borderRadius:8,border:"none",background:title&&url?"#4285f4":"#e0e0e0",color:title&&url?"#fff":"#aaa",fontSize:13,fontWeight:600,cursor:title&&url?"pointer":"not-allowed",fontFamily:"Georgia,serif"}}>
        {saved?"✓ Added!":saving?"Saving...":"Add document →"}
      </button>
    </div>
  );
}



export default function Coach(){
  const[authed,setAuthed]=useState(false);
  const[coachRole,setCoachRole]=useState("ant");
  const[selectedCoach,setSelectedCoach]=useState(null); // "ant" or "kevin"
  const[pin,setPin]=useState("");
  const pinRef=useRef(null);
  const[pinStep,setPinStep]=useState("select"); // "select" | "enter" | "create" | "confirm"
  const[pinConfirm,setPinConfirm]=useState("");
  const[pinError,setPinError]=useState("");
  const[tab,setTab]=useState(coachRole==="kevin"?"roster":"overview");
  const[showTabPicker,setShowTabPicker]=useState(false);
  const[pinnedTabs,setPinnedTabs]=useState(["roster","inbox","attendance"]);
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
  const[athletes,setAthletes]=useState([]);
  const[attendance,setAttendance]=useState([]);
  const[inbox,setInbox]=useState([]);
  const[anvil,setAnvil]=useState([]);
  const[anvilPrizes,setAnvilPrizes]=useState({});
  const[leaderboard,setLeaderboard]=useState([]);
  const[announcement,setAnnouncement]=useState("");
  const[currentAnnouncement,setCurrentAnnouncement]=useState(null);
  const[loading,setLoading]=useState(true);
  const[newName,setNewName]=useState("");
  const[newSport,setNewSport]=useState("");
  const[newGender,setNewGender]=useState("");
  const[newRole,setNewRole]=useState("iron");
  const[genLoading,setGenLoading]=useState(null);
  const[attDate,setAttDate]=useState((()=>{const e=new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));return e.getFullYear()+"-"+String(e.getMonth()+1).padStart(2,"0")+"-"+String(e.getDate()).padStart(2,"0");})());
  const[attRecords,setAttRecords]=useState(null);
  const[weightSort,setWeightSort]=useState("change");
  const[weightData,setWeightData]=useState(null);
  const[goalsSearch,setGoalsSearch]=useState("");
  const[goalsFilter,setGoalsFilter]=useState("all");
  const[goalReviews,setGoalReviews]=useState({});
  const[lbSort,setLbSort]=useState("early");
  const[inboxFilter,setInboxFilter]=useState("all");
  const[inboxAthFilter,setInboxAthFilter]=useState("");
  // Read/unread layer — tracks which inbox items the coach has already seen.
  // Persisted per-coach in localStorage; new items glow + show a NEW badge until viewed.
  const inboxSeenRef=useRef(null);
  const[inboxNewIds,setInboxNewIds]=useState(()=>new Set());
  const[rosterSearch,setRosterSearch]=useState("");
  const[rosterStatus,setRosterStatus]=useState("active");
  const[rosterExpanded,setRosterExpanded]=useState(null);
  const[coachPrayers,setCoachPrayers]=useState([]);
  const[prayedFor,setPrayedFor]=useState({});
  const[weightLogs,setWeightLogs]=useState([]);
  const[prLogs,setPrLogs]=useState([]);
  const[engAthletes,setEngAthletes]=useState([]);
  const[uploadingPhoto,setUploadingPhoto]=useState(null);
  const[qrDataUrl,setQrDataUrl]=useState("");
  const[qrType,setQrType]=useState("checkin");
  const[qrFullscreen,setQrFullscreen]=useState(false);
  const[anvilWinner,setAnvilWinner]=useState("");
  const[anvilNote,setAnvilNote]=useState("");
  const[anvilDate,setAnvilDate]=useState("");
  const[anvilCategory,setAnvilCategory]=useState("Effort");
  const[recapOpen,setRecapOpen]=useState(false);
  const[recapData,setRecapData]=useState(null);
  const[recapLoading,setRecapLoading]=useState(false);
  const[modalAth,setModalAth]=useState(null);
  const[modalData,setModalData]=useState(null);
  const[modalLoading,setModalLoading]=useState(false);
  const[musicVotes,setMusicVotes]=useState(null);
  const[mcCurrentPhoto,setMcCurrentPhoto]=useState(null);
  const[mcCaption,setMcCaption]=useState("");
  const[mcWeek,setMcWeek]=useState("");
  const[mcUploading,setMcUploading]=useState(false);
  const[mcError,setMcError]=useState("");
  const[mcFile,setMcFile]=useState(null);
  const[mcPreview,setMcPreview]=useState(null);
  const[mcSuccess,setMcSuccess]=useState(false);
  const[gpCaption,setGpCaption]=useState("");
  const[gpFile,setGpFile]=useState(null);
  const[gpPreview,setGpPreview]=useState(null);
  const[gpUploading,setGpUploading]=useState(false);
  const[gpError,setGpError]=useState("");
  const[gpSuccess,setGpSuccess]=useState(false);
  const[gpPhotos,setGpPhotos]=useState([]);
  const[groupmeLink,setGroupmeLink]=useState("https://groupme.com/join_group/111967377/1JobSG7L");
  const[groupmeLinkInput,setGroupmeLinkInput]=useState("https://groupme.com/join_group/111967377/1JobSG7L");
  const[groupmeLinkSaving,setGroupmeLinkSaving]=useState(false);
  const[groupmeLinkSaved,setGroupmeLinkSaved]=useState(false);
  const[bodyInjuries,setBodyInjuries]=useState(null);
  const[injExpanded,setInjExpanded]=useState(null);
  const[injLoading,setInjLoading]=useState(false);
  const[injLoadErr,setInjLoadErr]=useState(false);
  const[ironRoomData,setIronRoomData]=useState(null);
  const[ironRoomLoading,setIronRoomLoading]=useState(false);
  const[ironRoomGender,setIronRoomGender]=useState("M");
  const[habitLogs,setHabitLogs]=useState(null);
  const[habitLoading,setHabitLoading]=useState(false);
  const[calloutLogs,setCalloutLogs]=useState(null);
  const[calloutLoading,setCalloutLoading]=useState(false);
  const[calloutAthFilter,setCalloutAthFilter]=useState("");
  const[habitExpanded,setHabitExpanded]=useState(null);
  const[broadcastTitle,setBroadcastTitle]=useState("");
  const[broadcastBody,setBroadcastBody]=useState("");
  const[broadcastSending,setBroadcastSending]=useState(false);
  const[broadcastResult,setBroadcastResult]=useState(null);
  const[bioAvail,setBioAvail]=useState(false);
  const[bioCredId,setBioCredId]=useState(null);
  const[showBioOffer,setShowBioOffer]=useState(false);
  const[pendingNav,setPendingNav]=useState(null);
  const touchStartRef=useRef(null);
  const slideDirRef=useRef(0);

  useEffect(()=>{if(authed)loadAll();},[authed]);

  // When the coach opens the inbox, mark everything currently loaded as seen so the
  // NEW badges don't reappear next session. The in-session inboxNewIds stay for display.
  useEffect(()=>{
    if(tab!=="inbox"||inbox.length===0)return;
    if(inboxSeenRef.current===null)inboxSeenRef.current=new Set();
    inbox.forEach(x=>inboxSeenRef.current.add(x.id));
    try{localStorage.setItem("tf_inbox_seen_"+coachRole,JSON.stringify([...inboxSeenRef.current].slice(-500)));}catch(e){}
  },[tab,inbox,coachRole]);

  useEffect(()=>{
    if(!selectedCoach)return;
    setBioCredId(null);setShowBioOffer(false);
    (async()=>{
      try{
        if(window.PublicKeyCredential){
          const avail=await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setBioAvail(avail);
        }
      }catch(e){}
      try{
        const raw=localStorage.getItem("tf_bio_coach_"+selectedCoach);
        setBioCredId(raw?JSON.parse(raw).credId:null);
      }catch(e){setBioCredId(null);}
    })();
  },[selectedCoach]);

  useEffect(()=>{
    if(tab!=="qr")return;
    const url=qrType==="checkin"?"https://tfcollegegroup.com/checkin":"https://tfcollegegroup.com/athlete";
    import("qrcode").then(QRCode=>{
      QRCode.default.toDataURL(url,{width:280,margin:2,color:{dark:"#1a1a1a",light:"#ffffff"}}).then(setQrDataUrl);
    });
  },[tab,qrType]);

  useEffect(()=>{
    if(tab==="mcastles-post")loadMcPhoto();
  },[tab]);

  useEffect(()=>{
    if(tab==="injuries")loadBodyInjuries();
  },[tab]);

  useEffect(()=>{
    if(tab==="ironroom"&&!ironRoomData&&!ironRoomLoading)loadIronRoom();
  },[tab]);

  useEffect(()=>{
    if(tab==="habits"&&!habitLogs&&!habitLoading)loadHabitLogs();
  },[tab]);

  useEffect(()=>{
    if(tab==="callouts"&&!calloutLogs&&!calloutLoading)loadCalloutLogs();
  },[tab]);

  const loadAll=async()=>{
    setLoading(true);
    try{
    const[{data:aths},{data:att},{data:inb},{data:anv},{data:lb},{data:ann}]=await Promise.all([
      supabase.from("athletes").select("*").order("name"),
      supabase.from("attendance").select("*,athletes(name)").order("date",{ascending:false}).limit(200),
      supabase.from("inbox").select("*,athletes(name)").eq("done",false).order("created_at",{ascending:false}),
      supabase.from("anvil").select("*").order("created_at",{ascending:false}),
      supabase.from("leaderboard").select("*,athletes(name)").order("early_count",{ascending:false}),
      supabase.from("announcements").select("*").eq("active",true).eq("type","general").order("created_at",{ascending:false}).limit(1),
    ]);
    if(aths)setAthletes(prev=>aths.map(a=>({...a,photo_url:a.photo_url||prev.find(p=>p.id===a.id)?.photo_url||null})));
    if(aths)setGoalReviews(Object.fromEntries(aths.map(a=>[a.id,a.goal_review_status||""])));
    if(att)setAttendance(att);
    if(inb){
      setInbox(inb);
      // Load the per-coach "seen" set lazily, then flag any items not yet seen as new.
      if(inboxSeenRef.current===null){
        try{const s=localStorage.getItem("tf_inbox_seen_"+coachRole);inboxSeenRef.current=new Set(s?JSON.parse(s):[]);}catch(e){inboxSeenRef.current=new Set();}
      }
      const fresh=new Set(inb.filter(x=>!inboxSeenRef.current.has(x.id)).map(x=>x.id));
      setInboxNewIds(fresh);
    }
    if(anv)setAnvil(anv);
    if(lb)setLeaderboard(lb);
    if(ann&&ann.length>0){setCurrentAnnouncement(ann[0]);setAnnouncement(ann[0].message);}
    }catch(e){console.error("loadAll error:",e);}
    setLoading(false);
    // Load secondary data independently — won't block main load
    try{const{data}=await supabase.from("inbox").select("*,athletes(name)").eq("type","prayer").order("created_at",{ascending:false});if(data)setCoachPrayers(data);}catch(e){}
    try{const{data}=await supabase.from("weight_log").select("*").order("date",{ascending:false});if(data)setWeightLogs(data);}catch(e){}
    try{const{data}=await supabase.from("pr_log").select("*").order("date",{ascending:false});if(data)setPrLogs(data);}catch(e){}
    try{const{data}=await supabase.from("announcements").select("day,message").eq("type","anvil_prize").eq("active",true);if(data){const m={};data.forEach(r=>{try{m[r.day]=JSON.parse(r.message);}catch(e){}});setAnvilPrizes(m);}}catch(e){}
    try{const{data}=await supabase.from("athletes").select("id,name,photo_url,athletic_goal,character_goal,mindset_note_1,mindset_note_2,mindset_note_3,mindset_note_4,mindset_note_5,mindset_note_6").eq("status","active").order("name");if(data)setEngAthletes(data);}catch(e){}
    await loadMusicVotes();
    await loadGroupmeLink();
    try{const{data}=await supabase.from("announcements").select("*").eq("type","group_photo").eq("active",true).order("created_at",{ascending:false}).limit(30);if(data)setGpPhotos(data);}catch(e){}
  };

  const loadMusicVotes=async()=>{
    try{
      const _d=new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
      const _ds=`${_d.getFullYear()}-${String(_d.getMonth()+1).padStart(2,'0')}-${String(_d.getDate()).padStart(2,'0')}`;
      const{data}=await supabase.from("announcements").select("message").eq("type","music_vote").eq("week_label",_ds);
      if(data){
        const counts={};
        data.forEach(r=>{counts[r.message]=(counts[r.message]||0)+1;});
        setMusicVotes(counts);
      }
    }catch(e){}
  };

  const loadMcPhoto=async()=>{
    try{
      const{data}=await supabase.from("announcements").select("*").eq("type","mcastles").order("created_at",{ascending:false}).limit(1).maybeSingle();
      if(data){setMcCurrentPhoto(data);setMcCaption(data.message||"");setMcWeek(data.week_label||"");}
    }catch(e){}
  };

  const loadGroupPhotos=async()=>{
    try{const{data}=await supabase.from("announcements").select("*").eq("type","group_photo").eq("active",true).order("created_at",{ascending:false}).limit(30);if(data)setGpPhotos(data);}catch(e){}
  };

  const uploadGroupPhoto=async(file)=>{
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onerror=()=>reject(new Error("Could not read file"));
      reader.onload=ev=>{
        const img=new Image();
        img.onerror=()=>reject(new Error("Could not decode image"));
        img.onload=()=>{
          // Keep full resolution up to 4000px — high quality for download
          const MAX=4000;
          const scale=Math.min(1,MAX/Math.max(img.width,img.height));
          const canvas=document.createElement("canvas");
          canvas.width=Math.round(img.width*scale);
          canvas.height=Math.round(img.height*scale);
          canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
          canvas.toBlob(async blob=>{
            try{
              const fileName=`group_${Date.now()}.jpg`;
              const{error:upErr}=await supabase.storage.from("athlete-photos").upload(fileName,blob,{contentType:"image/jpeg",upsert:true});
              if(upErr){reject(upErr);return;}
              const{data:{publicUrl}}=supabase.storage.from("athlete-photos").getPublicUrl(fileName);
              resolve(publicUrl);
            }catch(e){reject(e);}
          },"image/jpeg",0.96);
        };
        img.src=ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const postGroupPhoto=async()=>{
    if(!gpFile){setGpError("Select a photo first.");return;}
    setGpUploading(true);setGpError("");
    try{
      const url=await uploadGroupPhoto(gpFile);
      const{error}=await supabase.from("announcements").insert({type:"group_photo",day:url,message:gpCaption.trim(),active:true});
      if(error){setGpError("Post failed: "+error.message);setGpUploading(false);return;}
      await loadGroupPhotos();
      setGpFile(null);setGpPreview(null);setGpCaption("");
      setGpSuccess(true);setTimeout(()=>setGpSuccess(false),3000);
    }catch(e){setGpError("Post failed: "+e.message);}
    setGpUploading(false);
  };

  const deleteGroupPhoto=async(id)=>{
    try{
      await supabase.from("announcements").update({active:false}).eq("id",id);
      setGpPhotos(prev=>prev.filter(p=>p.id!==id));
    }catch(e){}
  };

  const loadGroupmeLink=async()=>{
    try{
      const{data}=await supabase.from("announcements").select("day").eq("type","groupme_link").order("created_at",{ascending:false}).limit(1).maybeSingle();
      if(data?.day){setGroupmeLink(data.day);setGroupmeLinkInput(data.day);}
    }catch(e){}
  };

  const loadBodyInjuries=async()=>{
    setInjLoading(true);setInjLoadErr(false);
    try{
      const{data,error}=await supabase.from("announcements")
        .select("day,week_label,message")
        .eq("type","body_injury").eq("active",true);
      if(error)throw error;
      const result={};
      (data||[]).forEach(r=>{
        if(!result[r.day])result[r.day]={};
        try{result[r.day][r.week_label]=JSON.parse(r.message);}catch(e){}
      });
      setBodyInjuries(result);
    }catch(e){setInjLoadErr(true);setBodyInjuries({});}
    setInjLoading(false);
  };

  const loadIronRoom=async()=>{
    setIronRoomLoading(true);
    try{
      const{data}=await supabase.from("pr_log").select("athlete_id,lift,weight,reps,date");
      setIronRoomData(data||[]);
    }catch(e){setIronRoomData([]);}
    setIronRoomLoading(false);
  };

  const loadCalloutLogs=async()=>{
    setCalloutLoading(true);
    try{
      const{data,error}=await supabase.from("callouts")
        .select("*,athletes(name,photo_url,role)")
        .order("logged_at",{ascending:false})
        .limit(200);
      if(!error)setCalloutLogs(data||[]);
      else setCalloutLogs([]);
    }catch(e){setCalloutLogs([]);}
    setCalloutLoading(false);
  };

  const clearInjuryPart=async(athleteId,partId)=>{
    try{
      await supabase.from("announcements")
        .update({active:false})
        .eq("type","body_injury")
        .eq("day",String(athleteId))
        .eq("week_label",partId)
        .eq("active",true);
      setBodyInjuries(prev=>{
        const base=prev||{};
        const u={...base,[String(athleteId)]:{...(base[String(athleteId)]||{})}};
        delete u[String(athleteId)][partId];
        return u;
      });
    }catch(e){}
  };

  const loadHabitLogs=async()=>{
    setHabitLoading(true);
    try{
      const est=new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
      const oldest=new Date(est);
      oldest.setDate(est.getDate()-30);
      const oldestStr=oldest.getFullYear()+"-"+String(oldest.getMonth()+1).padStart(2,"0")+"-"+String(oldest.getDate()).padStart(2,"0");
      const{data,error}=await supabase.from("announcements")
        .select("day,week_label,message")
        .eq("type","habit_log")
        .gte("week_label",oldestStr);
      if(!error)setHabitLogs(data||[]);
      else setHabitLogs([]);
    }catch(e){setHabitLogs([]);}
    setHabitLoading(false);
  };

  const saveGroupmeLink=async()=>{
    if(!groupmeLinkInput.trim())return;
    setGroupmeLinkSaving(true);
    try{
      const{error}=await supabase.from("announcements").insert({type:"groupme_link",day:groupmeLinkInput.trim(),active:true,message:"GroupMe invite link"});
      if(error){alert("Save failed: "+error.message);setGroupmeLinkSaving(false);return;}
      setGroupmeLink(groupmeLinkInput.trim());
      setGroupmeLinkSaved(true);
      setTimeout(()=>setGroupmeLinkSaved(false),2500);
    }catch(e){alert("Save failed: "+e.message);}
    setGroupmeLinkSaving(false);
  };

  const uploadMotivationalPhoto=async(file)=>{
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onerror=()=>reject(new Error("Could not read file"));
      reader.onload=ev=>{
        const img=new Image();
        img.onerror=()=>reject(new Error("Could not decode image"));
        img.onload=()=>{
          const MAX=900;
          const scale=Math.min(1,MAX/Math.max(img.width,img.height));
          const canvas=document.createElement("canvas");
          canvas.width=Math.round(img.width*scale);
          canvas.height=Math.round(img.height*scale);
          canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
          canvas.toBlob(async blob=>{
            try{
              const fileName=`motivational_${Date.now()}.jpg`;
              const{error:upErr}=await supabase.storage.from("athlete-photos").upload(fileName,blob,{contentType:"image/jpeg",upsert:true});
              if(upErr){reject(upErr);return;}
              const{data:{publicUrl}}=supabase.storage.from("athlete-photos").getPublicUrl(fileName);
              resolve(publicUrl);
            }catch(e){reject(e);}
          },"image/jpeg",0.85);
        };
        img.src=ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const postMcPhoto=async(file)=>{
    setMcUploading(true);setMcError("");setMcSuccess(false);
    try{
      let photoUrl=mcCurrentPhoto?.day||null;
      if(file){photoUrl=await uploadMotivationalPhoto(file);}
      if(!photoUrl&&!mcCaption.trim()){setMcError("Add a photo or caption first.");setMcUploading(false);return;}
      const{error:insErr}=await supabase.from("announcements").insert({
        message:mcCaption.trim(),
        week_label:mcWeek.trim(),
        day:photoUrl,
        type:"mcastles",
        active:false
      });
      if(insErr){setMcError("Save failed: "+insErr.message);setMcUploading(false);return;}
      await loadMcPhoto();
      setMcCaption("");setMcWeek("");setMcFile(null);setMcPreview(null);setMcSuccess(true);
    }catch(e){setMcError("Error: "+e.message);}
    setMcUploading(false);
  };

  const callAI=async(prompt)=>{
    const res=await fetch("/api/ai-task",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt})});
    const data=await res.json();
    return data.text||"";
  };

  const generateTask=async(athlete,type)=>{
    const goal=type==="athletic"?athlete.athletic_goal:athlete.character_goal;
    if(!goal?.trim())return;
    setGenLoading(athlete.id+"-"+type);
    try{
      const prompt=type==="athletic"
        ?`You are Coach Ant, a faith-based strength coach. Athlete ${athlete.name} plays ${athlete.sport}. Their athletic goal: "${goal}". Give 3 specific exercises before training. Direct, under 60 words, no bullets.`
        :`You are Coach Ant, a faith-based coach. Athlete ${athlete.name}'s character goal: "${goal}". Give one specific actionable task this week. Personal, encouraging, under 50 words.`;
      const text=await callAI(prompt);
      const key=type==="athletic"?"coach_athletic_task":"coach_character_task";
      await supabase.from("athletes").update({[key]:text}).eq("id",athlete.id);
      setAthletes(p=>p.map(a=>a.id===athlete.id?{...a,[key]:text}:a));
    }catch(e){console.error(e);}
    setGenLoading(null);
  };

  const generateReply=async(prompt,onResult,key)=>{
    setGenLoading(key);
    try{const text=await callAI(prompt);if(text)onResult(text);}
    catch(e){console.error(e);}
    setGenLoading(null);
  };

  const addAthlete=async()=>{
    if(!newName.trim())return;
    const{data}=await supabase.from("athletes").insert({name:newName.trim(),sport:newSport.trim(),gender:newGender,role:newRole,status:"active"}).select();
    if(data)setAthletes(p=>[...p,data[0]]);
    setNewName("");setNewSport("");setNewGender("");setNewRole("iron");
  };

  const deleteAthlete=async(id,name)=>{
    if(!window.confirm("Delete "+name+"? This cannot be undone."))return;
    // Delete all related records first
    const tables=["inbox","attendance","leaderboard","weight_log","callouts","goal_reviews"];
    for(const t of tables){
      try{await supabase.from(t).delete().eq("athlete_id",id);}catch(e){}
    }
    // Small delay to ensure deletes propagate
    await new Promise(r=>setTimeout(r,500));
    const{error}=await supabase.from("athletes").delete().eq("id",id);
    if(error){
      // If still failing, just archive instead
      await supabase.from("athletes").update({status:"archived"}).eq("id",id);
      setAthletes(p=>p.map(x=>x.id===id?{...x,status:"archived"}:x));
      alert(name+" could not be fully deleted due to linked records — archived instead.");
    }else{
      setAthletes(p=>p.filter(x=>x.id!==id));
    }
  };

  const updateAthlete=async(id,key,val)=>{
    setAthletes(p=>p.map(a=>a.id===id?{...a,[key]:val}:a));
    await supabase.from("athletes").update({[key]:val}).eq("id",id);
  };

  const uploadAthletePhoto=async(athleteId,file)=>{
    return new Promise((resolve,reject)=>{
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
  };

  const saveAnnouncement=async()=>{
    if(currentAnnouncement){
      await supabase.from("announcements").update({message:announcement}).eq("id",currentAnnouncement.id);
    } else {
      await supabase.from("announcements").insert({type:"general",message:announcement,week_label:"This week",active:true});
    }
    await loadAll();
  };

  const awardAnvil=async()=>{
    if(!anvilWinner.trim())return;
    const _n=new Date();const _e=new Date(_n.toLocaleString("en-US",{timeZone:"America/New_York"}));const _iso=_e.getFullYear()+"-"+String(_e.getMonth()+1).padStart(2,"0")+"-"+String(_e.getDate()).padStart(2,"0");
    await supabase.from("anvil").insert({athlete_name:anvilWinner,note:anvilNote,date_awarded:anvilDate||_iso,type:"individual",athlete_role:anvilCategory});
    const ath=athletes.find(a=>a.name===anvilWinner);
    if(ath){
      const{data:lb}=await supabase.from("leaderboard").select("*").eq("athlete_id",ath.id);
      if(lb&&lb.length>0)await supabase.from("leaderboard").update({anvil_count:(lb[0].anvil_count||0)+1}).eq("athlete_id",ath.id);
    }
    setAnvilWinner("");setAnvilNote("");setAnvilDate("");setAnvilCategory("Effort");
    await loadAll();
  };

  const loadRecap=async()=>{
    setRecapLoading(true);
    try{
      const now=new Date();
      const est=new Date(now.toLocaleString("en-US",{timeZone:"America/New_York"}));
      const day=est.getDay();
      const monday=new Date(est);
      monday.setDate(est.getDate()-(day===0?6:day-1));
      monday.setHours(0,0,0,0);
      const monStr=monday.getFullYear()+"-"+String(monday.getMonth()+1).padStart(2,"0")+"-"+String(monday.getDate()).padStart(2,"0");
      const todayStr=est.getFullYear()+"-"+String(est.getMonth()+1).padStart(2,"0")+"-"+String(est.getDate()).padStart(2,"0");
      const[{data:weekAtt},{data:lbRows},{data:weekInbox}]=await Promise.all([
        supabase.from("attendance").select("*,athletes(name)").gte("date",monStr).lte("date",todayStr),
        supabase.from("leaderboard").select("*,athletes(name)").order("current_streak",{ascending:false}),
        supabase.from("inbox").select("*,athletes(name)").eq("done",false).gte("created_at",new Date(monday.getTime()+(now.getTime()-est.getTime())).toISOString()),
      ]);
      setRecapData({weekAtt:weekAtt||[],lbRows:lbRows||[],weekInbox:weekInbox||[]});
    }catch(e){console.error("Recap load:",e);}
    setRecapLoading(false);
  };

  const openAthleteModal=async(ath)=>{
    setModalAth(ath);
    setModalData(null);
    setModalLoading(true);
    try{
      const[{data:att},{data:lbRow},{data:msgs},{data:wt},{data:anv}]=await Promise.all([
        supabase.from("attendance").select("*").eq("athlete_id",ath.id).order("date",{ascending:false}).limit(20),
        supabase.from("leaderboard").select("*").eq("athlete_id",ath.id).single(),
        supabase.from("inbox").select("*").eq("athlete_id",ath.id).order("created_at",{ascending:false}).limit(8),
        supabase.from("weight_log").select("*").eq("athlete_id",ath.id).order("date",{ascending:false}).limit(6),
        supabase.from("anvil").select("*").eq("athlete_name",ath.name).order("created_at",{ascending:false}),
      ]);
      setModalData({att:att||[],lbRow,msgs:msgs||[],wt:wt||[],anv:anv||[]});
    }catch(e){console.error("Modal load:",e);}
    setModalLoading(false);
  };

  const replyToInbox=async(item,reply)=>{
    await supabase.from("inbox").update({reply,reply_sent:true,done:true}).eq("id",item.id);
    await loadAll();
  };

  const injuries=inbox.filter(i=>i.type==="injury");
  const messages=inbox.filter(i=>i.type==="message");
  const prayers=inbox.filter(i=>i.type==="prayer");
  const inboxCount=inbox.length;

  const now=new Date();
  const estNow=new Date(now.toLocaleString("en-US",{timeZone:"America/New_York"}));
  const dayName=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][estNow.getDay()];
  const isClassDay=["Mon","Tue","Thu","Fri"].includes(dayName);
  const estTodayStr=estNow.getFullYear()+"-"+String(estNow.getMonth()+1).padStart(2,"0")+"-"+String(estNow.getDate()).padStart(2,"0");
  const todayAtt=attendance.filter(a=>a.date===estTodayStr);
  const earlyToday=todayAtt.filter(a=>a.status==="early").length;
  const lateToday=todayAtt.filter(a=>a.status==="late").length;
  const thisMonth=estNow.getFullYear()+"-"+String(estNow.getMonth()+1).padStart(2,"0");
  // Find Monday of current week
  const dowEst=estNow.getDay();// 0=Sun
  const daysToMon=dowEst===0?6:dowEst-1;
  const monDate=new Date(estNow);
  monDate.setDate(estNow.getDate()-daysToMon);
  monDate.setHours(0,0,0,0);
  const weekDays=["Mon","Tue","Thu","Fri"].map((dn,idx)=>{
    const d=new Date(monDate);
    d.setDate(monDate.getDate()+[0,1,3,4][idx]);
    const yr=d.getFullYear();
    const mo=String(d.getMonth()+1).padStart(2,"0");
    const dy=String(d.getDate()).padStart(2,"0");
    const ds=yr+"-"+mo+"-"+dy;
    const recs=attendance.filter(r=>r.date===ds);
    return{dn,ds,early:recs.filter(r=>r.status==="early").length,late:recs.filter(r=>r.status==="late").length};
  });
  const monthClassDates=[...new Set(attendance.filter(r=>r.date&&r.date.startsWith(thisMonth)).map(r=>r.date))];
  const mostMissed=monthClassDates.length>=2?athletes.filter(a=>a.status==="active").map(a=>({name:a.name,missed:monthClassDates.length-attendance.filter(r=>r.athlete_id===a.id&&r.date&&r.date.startsWith(thisMonth)).length})).filter(a=>a.missed>0).sort((a,b)=>b.missed-a.missed).slice(0,5):[];

  const ALL_TABS=[
    {id:"overview",label:"Overview",icon:"📊"},
    {id:"roster",label:"Roster",icon:"👥"},
    {id:"teams",label:"Teams",icon:"👥"},
    {id:"attendance",label:"Attendance",icon:"📅"},
    {id:"accountability",label:"Accountability",icon:"✊"},
    {id:"anvil",label:"The Anvil",icon:"⚒"},
    {id:"inbox",label:`Inbox${inboxCount>0?` (${inboxCount})`:""}`,icon:"📬"},
    {id:"leaderboard",label:"Leaderboard",icon:"🏆"},
    {id:"goals",label:"Goals",icon:"🎯"},
    {id:"fellowship",label:"Fellowship",icon:"🙏"},
    {id:"mindset",label:"Mindset",icon:"💡"},
    {id:"culture",label:"Culture",icon:"🔥"},
    {id:"prayers",label:"Prayers",icon:"🙌"},
    {id:"weights",label:"Weights",icon:"⚖️"},
    {id:"photos",label:"Photos",icon:"📸"},
    {id:"engagement",label:"Engagement",icon:"📢"},
    {id:"qr",label:"QR Code",icon:"📱"},
    {id:"mcastles-post",label:"MCastles 🍑",icon:"🍑"},
    {id:"injuries",label:"Injuries",icon:"🩺"},
    {id:"ironroom",label:"Iron Room",icon:"🏋️"},
    {id:"habits",label:"Habits",icon:"💧"},
    {id:"callouts",label:"Callouts",icon:"⚠️"},
  ];
  // Kevin only sees roster, mindset and attendance
  const KEVIN_TABS=["roster","mindset","attendance"];
  const TABS=coachRole==="kevin"?ALL_TABS.filter(t=>KEVIN_TABS.includes(t.id)):ALL_TABS;

  // Kevin PIN stored in localStorage
  const getKevinPin=()=>typeof window!=="undefined"?localStorage.getItem("kevin_coach_pin_v2"):null;
  const saveKevinPin=(p)=>localStorage.setItem("kevin_coach_pin_v2",p);
  // MCastles PIN stored in localStorage
  const getMCastlesPin=()=>typeof window!=="undefined"?localStorage.getItem("mcastles_coach_pin"):null;
  const saveMCastlesPin=(p)=>localStorage.setItem("mcastles_coach_pin",p);

  const getBioLabel=()=>{
    if(typeof window==="undefined")return"Biometrics";
    const ua=navigator.userAgent||"";
    if(/iPhone|iPad|iPod/.test(ua))return"Face ID / Touch ID";
    if(/Mac/.test(ua))return"Touch ID";
    if(/Android/.test(ua))return"Fingerprint";
    return"Biometrics";
  };

  const coachNavFor=(id)=>{
    const roleMap={ant:"ant",kevin:"kevin",mcastles:"mcastles"};
    const tabMap={ant:"overview",kevin:"roster",mcastles:"overview"};
    return{role:roleMap[id]||"ant",tab:tabMap[id]||"overview"};
  };

  const completeCoachAuth=(role,tab)=>{
    setAuthed(true);setCoachRole(role);if(tab)setTab(tab);setPin("");setEditingPins(false);slideDirRef.current=0;
    try{const s=localStorage.getItem("tf_pinned_coach_"+role);setPinnedTabs(s?JSON.parse(s):(role==="kevin"?["mindset","attendance"]:["roster","inbox","attendance"]));}catch(e){}
    try{const storedOrder=localStorage.getItem("tf_more_order_coach_"+role);const defaultOrder=ALL_TABS.map(t=>t.id);const raw=storedOrder?JSON.parse(storedOrder):defaultOrder;const seen=new Set();const initOrder=raw.filter(id=>{if(seen.has(id))return false;seen.add(id);return true;});const newTabs=defaultOrder.filter(id=>!seen.has(id));const fullOrder=[...initOrder,...newTabs];setMoreOrder(fullOrder);moreOrderRef.current=fullOrder;}catch(e){}
  };

  const authenticateWithBiometric=async(cid)=>{
    const fallbackCoach=cid||selectedCoach||"ant";
    try{
      const challenge=crypto.getRandomValues(new Uint8Array(32));
      const assertion=await navigator.credentials.get({
        publicKey:{
          challenge,
          rpId:window.location.hostname,
          allowCredentials:[],
          userVerification:"required",
          timeout:60000,
          hints:["client-device"], // prefer platform authenticator (Face ID → iCloud Keychain)
        }
      });
      if(assertion){
        // Identify coach from userHandle (set during registration)
        let resolvedCoach=fallbackCoach;
        if(assertion.response.userHandle){
          const handle=new TextDecoder().decode(assertion.response.userHandle);
          const parsed=handle.replace("coach_","");
          if(["ant","kevin","mcastles"].includes(parsed))resolvedCoach=parsed;
        }
        // If userHandle didn't resolve it, match by rawId
        if(resolvedCoach===fallbackCoach){
          const credB64=btoa(String.fromCharCode(...new Uint8Array(assertion.rawId)));
          for(const c of["ant","kevin","mcastles"]){
            const raw=localStorage.getItem("tf_bio_coach_"+c);
            if(raw&&JSON.parse(raw).credId===credB64){resolvedCoach=c;break;}
          }
        }
        // If we couldn't identify the coach from the passkey and no coach was pre-selected, refuse
        if(resolvedCoach===fallbackCoach&&!cid&&!selectedCoach)return false;
        const nav=coachNavFor(resolvedCoach);
        completeCoachAuth(nav.role,nav.tab);
        return true;
      }
    }catch(e){/* cancelled — fall through to PIN */}
    return false;
  };

  const registerBiometric=async()=>{
    const c=coaches.find(x=>x.id===selectedCoach);
    try{
      const challenge=crypto.getRandomValues(new Uint8Array(32));
      const credential=await navigator.credentials.create({
        publicKey:{
          challenge,
          rp:{name:"TF College Group",id:window.location.hostname},
          user:{
            id:new TextEncoder().encode("coach_"+selectedCoach),
            name:c?.name||selectedCoach,
            displayName:c?.name||selectedCoach,
          },
          pubKeyCredParams:[{type:"public-key",alg:-7},{type:"public-key",alg:-257}],
          authenticatorSelection:{
            authenticatorAttachment:"platform", // forces Face ID/Touch ID → iCloud Keychain, not Chrome PM
            userVerification:"required",
            residentKey:"required",
          },
          timeout:60000,
        }
      });
      const credId=btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      localStorage.setItem("tf_bio_coach_"+selectedCoach,JSON.stringify({credId,rpId:window.location.hostname}));
      setBioCredId(credId);
    }catch(e){}
    const nav=pendingNav;setPendingNav(null);setShowBioOffer(false);
    completeCoachAuth(nav?.role||"ant",nav?.tab||"overview");
  };

  function handlePinKey(k){
    if(k===null)return;
    if(k==="⌫"){setPin(p=>p.slice(0,-1));setPinError("");return;}
    if(pin.length>=4)return;
    const newPin=pin+String(k);
    setPin(newPin);
    if(newPin.length===4){
      const offerBio=(nav)=>{
        if(bioAvail&&!bioCredId){setPendingNav(nav);setShowBioOffer(true);setPin("");}
        else{setPin("");completeCoachAuth(nav.role,nav.tab);}
      };
      if(pinStep==="enter"){
        if(selectedCoach==="ant"){
          if(newPin===COACH_PIN)offerBio({role:"ant",tab:"overview"});
          else{setPinError("Wrong PIN. Try again.");setPin("");}
        }else if(selectedCoach==="kevin"){
          const kp=getKevinPin();
          if(kp&&newPin===kp)offerBio({role:"kevin",tab:"roster"});
          else{setPinError("Wrong PIN. Try again.");setPin("");}
        }else if(selectedCoach==="mcastles"){
          const mcp=getMCastlesPin();
          if(mcp&&newPin===mcp)offerBio({role:"mcastles",tab:"overview"});
          else{setPinError("Wrong PIN. Try again.");setPin("");}
        }
      }else if(pinStep==="create"){
        setPinConfirm(newPin);setPin("");setPinStep("confirm");setPinError("");
      }else if(pinStep==="confirm"){
        if(selectedCoach==="mcastles"){
          if(newPin===pinConfirm){saveMCastlesPin(newPin);offerBio({role:"mcastles",tab:"overview"});}
          else{setPinError("PINs don't match. Try again.");setPin("");setPinStep("create");setPinConfirm("");}
        }else{
          if(newPin===pinConfirm){saveKevinPin(newPin);offerBio({role:"kevin",tab:"roster"});}
          else{setPinError("PINs don't match. Try again.");setPin("");setPinStep("create");setPinConfirm("");}
        }
      }
    }
  }

  const coaches=[
    {id:"ant",name:"Coach Ant",sub:"Head Coach",color:GOLD,emoji:"⚒"},
    {id:"kevin",name:"Coach Kevin",sub:"Guest Speaker",color:PUR,emoji:"📖"},
    {id:"mcastles",name:"MCastles",sub:"Motivator · Full Access",color:ORANGE,emoji:"🍑🚀"},
  ];

  if(!authed) return(
    <>
      <Head><title>Coach — TF College Group</title></Head>
      <div style={{height:"100dvh",background:"#080808",fontFamily:"Georgia, serif",maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 1.25rem",position:"relative",overflow:"hidden"}}>
        <div style={{position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",width:600,height:400,background:"radial-gradient(ellipse at top,#E8720C10 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,transparent,#E8720C,#C0392B,transparent)"}}/>
        <div style={{textAlign:"center",width:"100%",position:"relative"}}>

          {/* Step 1 — Select coach */}
          {pinStep==="select"&&(
            <>
              <div style={{width:72,height:72,borderRadius:20,background:"linear-gradient(145deg,#E8720C,#C0392B,#8B0000)",margin:"0 auto 1.5rem",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,boxShadow:"0 0 60px #E8720C55,0 0 120px #E8720C22"}}>⚒</div>
              <div style={{fontSize:24,fontWeight:900,color:"#fff",marginBottom:4,letterSpacing:"-0.02em",textTransform:"uppercase"}}>Coach Login</div>
              <div style={{fontSize:12,color:"#555",marginBottom:20,letterSpacing:"0.04em"}}>Select your name to continue</div>
              {/* Quick Sign In — appears when any passkey is stored for this site */}
              {bioAvail&&(()=>{const anyStored=["ant","kevin","mcastles"].some(c=>{try{return!!localStorage.getItem("tf_bio_coach_"+c);}catch(e){return false;}});return anyStored;})()&&(
                <button onClick={()=>authenticateWithBiometric(null)}
                  style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,
                    padding:"15px",borderRadius:14,border:"1px solid rgba(232,114,12,0.35)",
                    background:"linear-gradient(135deg,rgba(232,114,12,0.12),rgba(192,57,43,0.08))",
                    color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"Georgia,serif",
                    marginBottom:16,boxShadow:"0 0 24px rgba(232,114,12,0.15)",letterSpacing:"0.01em"}}>
                  <Icon name="faceId" size={22} color="#E8720C"/>
                  <span>Quick Sign In</span>
                </button>
              )}
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {coaches.map(c=>(
                  <button key={c.id} onClick={()=>{
                    // Fire Face ID instantly within the tap gesture (no awaits before
                    // credentials.get) so the prompt appears immediately on iOS.
                    let bioRaw=null;try{bioRaw=localStorage.getItem("tf_bio_coach_"+c.id);}catch(e){}
                    if(bioRaw)authenticateWithBiometric(c.id);
                    setSelectedCoach(c.id);
                    setPin("");setPinError("");
                    const hasPin=c.id==="ant"||(c.id==="kevin"&&getKevinPin())||(c.id==="mcastles"&&getMCastlesPin());
                    setPinStep(hasPin?"enter":"create");
                  }} style={{width:"100%",padding:0,borderRadius:14,border:"1px solid #1e1e1e",background:"linear-gradient(135deg,#0e0e0e,#131313)",color:"#fff",cursor:"pointer",fontFamily:"Georgia, serif",display:"flex",alignItems:"stretch",textAlign:"left",overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,0.4)"}}>
                    <div style={{width:4,background:"linear-gradient(180deg,"+c.color+","+c.color+"88)",flexShrink:0}}/>
                    <div style={{padding:"14px 14px",display:"flex",alignItems:"center",gap:14,flex:1}}>
                      <div style={{width:44,height:44,borderRadius:"50%",background:c.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0,boxShadow:"0 0 20px "+c.color+"55"}}>{c.emoji}</div>
                      <div>
                        <div style={{fontSize:15,fontWeight:700,letterSpacing:"-0.01em"}}>{c.name}</div>
                        <div style={{fontSize:12,color:"#555"}}>{c.sub}</div>
                      </div>
                      <div style={{marginLeft:"auto",color:"#2a2a2a",fontSize:18,paddingRight:4}}>›</div>
                    </div>
                  </button>
                ))}
              </div>
              <a href="/" style={{display:"block",marginTop:24,fontSize:11,color:"#333",letterSpacing:"0.04em"}}>← Back to home</a>
            </>
          )}

          {/* Step 2 — PIN entry / create */}
          {pinStep!=="select"&&(
            <>
              <button onClick={()=>{setPinStep("select");setPin("");setPinError("");setSelectedCoach(null);}} style={{position:"absolute",top:20,left:20,background:"#111",border:"0.5px solid #1e1e1e",color:"#555",fontSize:12,cursor:"pointer",fontFamily:"Georgia, serif",padding:"6px 14px",borderRadius:10}}>← Back</button>
              {(() => {
                const c=coaches.find(x=>x.id===selectedCoach);
                return(
                  <div style={{position:"relative",display:"inline-block",marginBottom:14}}>
                    <div style={{position:"absolute",inset:-6,borderRadius:"50%",border:"1px solid "+c.color+"33",pointerEvents:"none"}}/>
                    <div style={{width:68,height:68,borderRadius:"50%",background:c.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,boxShadow:"0 0 40px "+c.color+"44"}}>{c.emoji}</div>
                  </div>
                );
              })()}
              <div style={{fontSize:22,fontWeight:900,color:"#fff",marginBottom:4,letterSpacing:"-0.01em",textTransform:"uppercase"}}>{coaches.find(x=>x.id===selectedCoach)?.name}</div>
              <div style={{fontSize:12,color:"#555",marginBottom:20,letterSpacing:"0.04em"}}>
                {pinStep==="create"?"Create your 4-digit PIN":pinStep==="confirm"?"Confirm your PIN":"Enter your PIN"}
              </div>

              {/* Bio shortcut button — above PIN dots when credential stored */}
              {bioCredId&&pinStep==="enter"&&!showBioOffer&&(
                <button onClick={()=>authenticateWithBiometric()}
                  style={{marginBottom:20,display:"flex",alignItems:"center",gap:10,padding:"13px 24px",
                    borderRadius:14,border:"1px solid "+(coaches.find(x=>x.id===selectedCoach)?.color||GOLD)+"44",
                    background:(coaches.find(x=>x.id===selectedCoach)?.color||GOLD)+"12",
                    color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif",
                    letterSpacing:"0.02em",margin:"0 auto 20px",boxShadow:"0 0 20px "+(coaches.find(x=>x.id===selectedCoach)?.color||GOLD)+"22"}}>
                  <Icon name="faceId" size={22} color="#fff"/>
                  <span>Use {getBioLabel()}</span>
                </button>
              )}

              {showBioOffer?(
                <div style={{width:"100%",maxWidth:300,textAlign:"center",margin:"0 auto"}}>
                  <div style={{marginBottom:14,display:"flex",justifyContent:"center"}}><Icon name="faceId" size={42} color={coaches.find(x=>x.id===selectedCoach)?.color||GOLD}/></div>
                  <div style={{fontSize:17,fontWeight:800,color:"#fff",marginBottom:8,letterSpacing:"-0.01em"}}>Enable {getBioLabel()}?</div>
                  <div style={{fontSize:12,color:"#555",marginBottom:24,lineHeight:1.6}}>
                    Skip the PIN next time and sign in instantly with your fingerprint or face.
                  </div>
                  <button onClick={registerBiometric}
                    style={{width:"100%",padding:"14px",borderRadius:12,border:"none",
                      background:"linear-gradient(135deg,"+(coaches.find(x=>x.id===selectedCoach)?.color||GOLD)+","+(coaches.find(x=>x.id===selectedCoach)?.color||GOLD)+"aa)",
                      color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",
                      fontFamily:"Georgia,serif",letterSpacing:"0.04em",marginBottom:12,
                      boxShadow:"0 4px 24px "+(coaches.find(x=>x.id===selectedCoach)?.color||GOLD)+"44"}}>
                    Enable {getBioLabel()}
                  </button>
                  <button onClick={()=>{
                    const nav=pendingNav;setPendingNav(null);setShowBioOffer(false);
                    completeCoachAuth(nav?.role||"ant",nav?.tab||"overview");
                  }} style={{width:"100%",padding:"12px",borderRadius:12,border:"0.5px solid #222",
                    background:"transparent",color:"#444",fontSize:13,fontWeight:500,
                    cursor:"pointer",fontFamily:"Georgia,serif"}}>
                    Not now
                  </button>
                </div>
              ):(
              <>
              <div style={{display:"flex",justifyContent:"center",gap:14,marginBottom:16}}>
                {[0,1,2,3].map(i=>{const cc=coaches.find(x=>x.id===selectedCoach)?.color||GOLD;return(<div key={i} style={{width:14,height:14,borderRadius:"50%",border:"2px solid "+cc+(i<pin.length?"":"44"),background:i<pin.length?cc:"transparent",transition:"all 0.15s",boxShadow:i<pin.length?"0 0 10px "+cc+"88":"none"}}/>);})}
              </div>
              {/* Hidden keyboard input */}
              <input
                ref={pinRef}
                autoFocus
                type="tel"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={e=>{
                  const val=e.target.value.replace(/[^0-9]/g,"").slice(0,4);
                  setPin(val);
                  if(val.length===4){handlePinKey(null);setPin(val);/* route through handlePinKey by rebuilding */
                    const offerBio=(nav)=>{
                      if(bioAvail&&!bioCredId){setPendingNav(nav);setShowBioOffer(true);setPin("");}
                      else{setPin("");completeCoachAuth(nav.role,nav.tab);}
                    };
                    if(pinStep==="enter"){
                      if(selectedCoach==="ant"){
                        if(val===COACH_PIN)offerBio({role:"ant",tab:"overview"});
                        else{setPinError("Wrong PIN. Try again.");setPin("");}
                      }else if(selectedCoach==="kevin"){
                        const kp=getKevinPin();
                        if(kp&&val===kp)offerBio({role:"kevin",tab:"roster"});
                        else{setPinError("Wrong PIN. Try again.");setPin("");}
                      }else if(selectedCoach==="mcastles"){
                        const mcp=getMCastlesPin();
                        if(mcp&&val===mcp)offerBio({role:"mcastles",tab:"overview"});
                        else{setPinError("Wrong PIN. Try again.");setPin("");}
                      }
                    }else if(pinStep==="create"){
                      setPinConfirm(val);setPinStep("confirm");setPin("");
                    }else if(pinStep==="confirm"){
                      if(selectedCoach==="mcastles"){
                        if(val===pinConfirm){saveMCastlesPin(val);offerBio({role:"mcastles",tab:"overview"});}
                        else{setPinError("PINs don't match. Try again.");setPin("");setPinStep("create");setPinConfirm("");}
                      }else{
                        if(val===pinConfirm){saveKevinPin(val);offerBio({role:"kevin",tab:"roster"});}
                        else{setPinError("PINs don't match. Try again.");setPin("");setPinStep("create");setPinConfirm("");}
                      }
                    }
                  }
                }}
                style={{position:"fixed",top:-100,left:-100,width:1,height:1,opacity:0,pointerEvents:"none"}}
              />
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,maxWidth:240,margin:"0 auto"}}>
                {[1,2,3,4,5,6,7,8,9,null,0,"⌫"].map((k,i)=>(
                  <button key={i} onClick={()=>{handlePinKey(k);pinRef.current&&pinRef.current.focus();}} style={{padding:"14px 8px",borderRadius:12,border:"0.5px solid "+(k===null?"transparent":"#1a1a1a"),background:k===null?"transparent":k==="⌫"?"#141414":"#111",fontSize:20,fontWeight:300,cursor:k===null?"default":"pointer",color:k==="⌫"?"#555":"#e0e0e0",fontFamily:"sans-serif",transition:"background 0.1s"}}>
                    {k===null?"":k}
                  </button>
                ))}
              </div>
              <div style={{marginTop:10,fontSize:10,color:"#2a2a2a",textAlign:"center",letterSpacing:"0.04em"}}>Tap keypad or type on keyboard</div>
              {bioCredId&&<button onClick={()=>{try{localStorage.removeItem("tf_bio_coach_"+selectedCoach);}catch(e){}setBioCredId(null);}} style={{marginTop:12,background:"transparent",border:"none",color:"#2a2a2a",fontSize:10,cursor:"pointer",fontFamily:"Georgia,serif",letterSpacing:"0.04em"}}>Reset saved passkey</button>}
              {pinError&&<div style={{marginTop:12,fontSize:12,color:"#ff5555",padding:"8px 16px",background:"#1a0505",borderRadius:10,border:"1px solid #3a0808"}}>{pinError}</div>}
            </>
            )}
            </>
          )}
        </div>
      </div>
    </>
  );

  if(loading) return(
    <div style={{minHeight:"100vh",background:"#080808",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:"40%",left:"50%",transform:"translate(-50%,-50%)",width:600,height:400,background:"radial-gradient(ellipse,#E8720C10 0%,transparent 65%)",pointerEvents:"none"}}/>
      <div style={{textAlign:"center",position:"relative"}}>
        <div style={{width:80,height:80,borderRadius:22,background:"linear-gradient(145deg,#E8720C,#C0392B,#8B0000)",margin:"0 auto 20px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:42,boxShadow:"0 0 80px #E8720C55,0 0 160px #E8720C22"}}>⚒</div>
        <div style={{fontSize:11,color:"#E8720C",letterSpacing:"0.25em",textTransform:"uppercase",fontWeight:700}}>Coach Dashboard</div>
      </div>
    </div>
  );

  const fixedTabForSwipe=coachRole==="kevin"?"roster":"overview";
  const validPinnedForSwipe=pinnedTabs.filter(id=>TABS.find(t=>t.id===id)&&id!==fixedTabForSwipe);
  const PRIMARY_NAV=[fixedTabForSwipe,...validPinnedForSwipe];
  const handleTouchStart=(e)=>{touchStartRef.current={x:e.touches[0].clientX,y:e.touches[0].clientY};};
  const handleTouchEnd=(e)=>{
    if(!touchStartRef.current)return;
    const dx=e.changedTouches[0].clientX-touchStartRef.current.x;
    const dy=e.changedTouches[0].clientY-touchStartRef.current.y;
    touchStartRef.current=null;
    if(Math.abs(dx)<52||Math.abs(dx)<Math.abs(dy)*1.5)return;
    const idx=PRIMARY_NAV.indexOf(tab);
    if(dx>0&&idx<PRIMARY_NAV.length-1){slideDirRef.current=1;setTab(PRIMARY_NAV[idx+1]);}
    else if(dx<0&&idx>0){slideDirRef.current=-1;setTab(PRIMARY_NAV[idx-1]);}
  };

  return(
    <>
      <style>{`@keyframes tfSlideFromRight{from{transform:translateX(52px) scale(0.98);opacity:0}to{transform:translateX(0) scale(1);opacity:1}}@keyframes tfSlideFromLeft{from{transform:translateX(-52px) scale(0.98);opacity:0}to{transform:translateX(0) scale(1);opacity:1}}@keyframes tfJiggle{0%{transform:rotate(-1.5deg) scale(1.03)}100%{transform:rotate(1.5deg) scale(1.03)}}`}</style>
      <Head><title>Coach Dashboard — TF College Group</title></Head>
      <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} style={{fontFamily:"Georgia, serif",paddingBottom:"2rem",background:"linear-gradient(160deg,#06060f 0%,#0a0608 50%,#080808 100%)",minHeight:"100vh"}}>

        <div style={{background:"linear-gradient(180deg,#0e0e1c 0%,#0a0a14 100%)",borderBottom:"1px solid rgba(255,255,255,0.08)",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,rgba(232,114,12,0.9),rgba(192,57,43,0.8),transparent)"}}/>
          <div style={{position:"absolute",top:-40,right:-40,width:200,height:200,borderRadius:"50%",background:"rgba(232,114,12,0.05)",filter:"blur(50px)",pointerEvents:"none"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px 10px",position:"relative"}}>
            <div>
              <div style={{fontSize:18,fontWeight:900,color:"#fff",letterSpacing:"-0.01em",textTransform:"uppercase"}}>TF College Group</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:2,letterSpacing:"0.04em"}}>{coachRole==="mcastles"?"MCastles 🍑":coachRole==="kevin"?"Kevin":"Coach Ant"} · {dayName} · <span style={{color:isClassDay?"#E8720C":"rgba(255,255,255,0.2)"}}>{isClassDay?"Class day":"No class"}</span></div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.25)",marginBottom:2}}>{athletes.filter(a=>a.status==="active").length} athletes</div>
              <button onClick={()=>setAuthed(false)} style={{fontSize:10,color:"rgba(255,255,255,0.2)",background:"transparent",border:"none",cursor:"pointer",fontFamily:"Georgia, serif",letterSpacing:"0.04em"}}>Sign out</button>
            </div>
          </div>
        </div>

        <div key={tab} style={{padding:"1rem",maxWidth:900,margin:"0 auto",paddingBottom:"110px",animation:slideDirRef.current>0?"tfSlideFromRight 0.32s cubic-bezier(0.22,1,0.36,1) backwards":slideDirRef.current<0?"tfSlideFromLeft 0.32s cubic-bezier(0.22,1,0.36,1) backwards":"none"}}>

          <ErrorBoundary>

          {tab==="overview"&&(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
                {[
                  {label:"Athletes",val:athletes.filter(a=>a.status==="active").length,color:"#aaa",accent:"#1a1a1a",border:"#2a2a2a"},
                  {label:"Early today",val:earlyToday,color:GREEN,accent:GREEN+"22",border:GREEN+"33"},
                  {label:"Late today",val:lateToday,color:RED,accent:RED+"18",border:RED+"33"},
                  {label:"Inbox",val:inboxCount,color:inboxCount>0?PUR:"#444",accent:inboxCount>0?PUR+"18":"#1a1a1a",border:inboxCount>0?PUR+"33":"#252525"},
                ].map(s=>(
                  <div key={s.label} style={{background:s.accent,borderRadius:12,padding:"12px 8px",textAlign:"center",border:"1px solid "+s.border}}>
                    <div style={{fontSize:24,fontWeight:900,color:s.color,lineHeight:1}}>{s.val}</div>
                    <div style={{fontSize:10,color:"#555",marginTop:4,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>{s.label}</div>
                  </div>
                ))}
              </div>
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
                        <div style={{fontSize:11,color:"#666",marginTop:2}}>{_dow===1?"Mindset Monday":"Fellowship Friday"} · no vote needed</div>
                      </div>
                    </div>
                  </div>
                );
                const total=musicVotes?Object.values(musicVotes).reduce((a,b)=>a+b,0):0;
                const topGenre=musicVotes&&total>0?Object.entries(musicVotes).sort((a,b)=>b[1]-a[1])[0]?.[0]:null;
                return(
                  <div style={{borderRadius:16,marginBottom:12,overflow:"hidden",border:"1px solid "+ORANGE+"33"}}>
                    <div style={{background:"linear-gradient(140deg,"+ORANGE+"18,"+ORANGE+"06,#0d0d0d)",padding:"16px",position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,"+ORANGE+","+ORANGE+"55,transparent)"}}/>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                        <div style={{display:"flex",alignItems:"center",gap:12}}>
                          <div style={{width:44,height:44,borderRadius:12,background:"linear-gradient(145deg,"+ORANGE+"44,"+ORANGE+"22)",border:"1px solid "+ORANGE+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🎵</div>
                          <div>
                            <div style={{fontSize:9,color:ORANGE,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Music Vote</div>
                            <div style={{fontSize:16,fontWeight:900,color:"#fff"}}>Today's Genre</div>
                          </div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:20,fontWeight:900,color:ORANGE}}>{total}</div>
                            <div style={{fontSize:9,color:"#555"}}>votes</div>
                          </div>
                          <button onClick={loadMusicVotes} style={{background:"#111",border:"0.5px solid #222",color:"#555",fontSize:11,padding:"5px 10px",borderRadius:8,cursor:"pointer",fontFamily:"Georgia,serif"}}>↻</button>
                        </div>
                      </div>
                      {!musicVotes||total===0?(
                        <div style={{textAlign:"center",padding:"10px",color:"#444",fontSize:12}}>No votes yet — athletes vote from their profile tab</div>
                      ):(
                        <div style={{display:"flex",flexDirection:"column",gap:8}}>
                          {GENRES.map(g=>{
                            const count=musicVotes[g.id]||0;
                            const pct=total?Math.round((count/total)*100):0;
                            const isTop=g.id===topGenre;
                            return(
                              <div key={g.id} style={{display:"flex",alignItems:"center",gap:10}}>
                                <span style={{fontSize:16,width:22,textAlign:"center",flexShrink:0}}>{g.emoji}</span>
                                <div style={{flex:1}}>
                                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                                    <span style={{fontSize:11,color:isTop?"#fff":"#777",fontWeight:isTop?700:400}}>{g.label}</span>
                                    <span style={{fontSize:11,color:isTop?ORANGE:"#444",fontWeight:isTop?700:400}}>{count} {pct>0?<span style={{color:"#333"}}>({pct}%)</span>:""}</span>
                                  </div>
                                  <div style={{height:4,background:"#1e1e1e",borderRadius:2,overflow:"hidden"}}>
                                    <div style={{height:"100%",width:pct+"%",background:isTop?"linear-gradient(90deg,"+ORANGE+","+GOLD+")":"#2a2a2a",borderRadius:2,transition:"width 0.5s"}}/>
                                  </div>
                                </div>
                                {isTop&&<span style={{fontSize:9,color:ORANGE,fontWeight:800,flexShrink:0,letterSpacing:"0.05em"}}>WIN</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
              <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+PUR+"33"}}>
                <div style={{background:"linear-gradient(140deg,"+PUR+"30,"+PUR+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+PUR+","+PUR+"44,transparent)"}}/>
                  <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="megaphone" size={66} color="#fff"/></div>
                  <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+PUR+"12,transparent 70%)",pointerEvents:"none"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                    <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+PUR+"44,"+PUR+"22)",border:"1px solid "+PUR+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+PUR+"33"}}>📣</div>
                    <div>
                      <div style={{fontSize:8,color:PUR,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Coach Ant</div>
                      <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Weekly Announcement</div>
                      <div style={{fontSize:11,color:"#666",marginTop:1}}>Pushed to every athlete's home screen</div>
                    </div>
                  </div>
                </div>
                <div style={{background:"#111",padding:"16px 18px"}}>
                  <textarea value={announcement} onChange={e=>setAnnouncement(e.target.value)} placeholder="Type this week's message to your athletes..." style={{width:"100%",minHeight:80,padding:"8px",fontSize:13,border:"0.5px solid #333",borderRadius:8,background:"#1a1a1a",color:"#ddd",fontFamily:"Georgia, serif",resize:"vertical",boxSizing:"border-box",marginBottom:8}}/>
                  <button onClick={saveAnnouncement} style={{padding:"8px 20px",borderRadius:8,border:"none",background:PUR,color:"#fff",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"Georgia, serif"}}>Save & push to athletes →</button>
                </div>
              </div>
              <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+PUR+"33"}}>
                <div onClick={()=>{setRecapOpen(o=>{if(!o&&!recapData)loadRecap();return!o;})}}
                     style={{background:"linear-gradient(140deg,"+PUR+"30,"+PUR+"10,#0d0d0d)",padding:"16px 18px",cursor:"pointer",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+PUR+","+PUR+"44,transparent)"}}/>
                  <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.07,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="barChart" size={66} color="#fff"/></div>
                  <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                    <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+PUR+"44,"+PUR+"22)",border:"1px solid "+PUR+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+PUR+"33"}}>📊</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:8,color:PUR,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>This Week</div>
                      <div style={{fontSize:18,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Weekly Recap</div>
                      <div style={{fontSize:11,color:"#666",marginTop:1}}>Attendance, streaks, follow-ups</div>
                    </div>
                    <div style={{fontSize:18,color:"#444",transition:"transform 0.2s",transform:recapOpen?"rotate(180deg)":"none"}}>▾</div>
                  </div>
                </div>
                {recapOpen&&(
                  <div style={{background:"#0e0e0e",padding:"16px 18px"}}>
                    {recapLoading&&<div style={{fontSize:13,color:"#555",textAlign:"center",padding:"1rem 0"}}>Loading...</div>}
                    {recapData&&(()=>{
                      const{weekAtt,lbRows,weekInbox}=recapData;
                      const activeAthletes=athletes.filter(a=>a.status==="active");
                      const uniqueAttendees=[...new Set(weekAtt.map(r=>r.athlete_id))];
                      const attendancePct=activeAthletes.length>0?Math.round((uniqueAttendees.length/activeAthletes.length)*100):0;
                      const missedThis=(athletes.filter(a=>a.status==="active"&&!uniqueAttendees.includes(a.id)));
                      const onStreak=lbRows.filter(lb=>(lb.current_streak||0)>=3);
                      const earlyThisWeek=weekAtt.filter(r=>r.status==="early");
                      return(
                        <div>
                          <div style={{display:"flex",gap:8,marginBottom:14}}>
                            <div style={{flex:1,background:"#111",borderRadius:12,padding:"12px",textAlign:"center",border:"0.5px solid #1e1e1e"}}>
                              <div style={{fontSize:28,fontWeight:900,color:attendancePct>=80?GREEN:attendancePct>=60?GOLD:RED}}>{attendancePct}%</div>
                              <div style={{fontSize:9,color:"#555",textTransform:"uppercase",letterSpacing:"0.08em",marginTop:2}}>Attendance</div>
                              <div style={{fontSize:10,color:"#444",marginTop:2}}>{uniqueAttendees.length}/{activeAthletes.length} athletes</div>
                            </div>
                            <div style={{flex:1,background:"#111",borderRadius:12,padding:"12px",textAlign:"center",border:"0.5px solid #1e1e1e"}}>
                              <div style={{fontSize:28,fontWeight:900,color:GREEN}}>{earlyThisWeek.length}</div>
                              <div style={{fontSize:9,color:"#555",textTransform:"uppercase",letterSpacing:"0.08em",marginTop:2}}>Early</div>
                              <div style={{fontSize:10,color:"#444",marginTop:2}}>this week</div>
                            </div>
                            <div style={{flex:1,background:"#111",borderRadius:12,padding:"12px",textAlign:"center",border:"0.5px solid #1e1e1e"}}>
                              <div style={{fontSize:28,fontWeight:900,color:weekInbox.length>0?RED:"#555"}}>{weekInbox.length}</div>
                              <div style={{fontSize:9,color:"#555",textTransform:"uppercase",letterSpacing:"0.08em",marginTop:2}}>Unread</div>
                              <div style={{fontSize:10,color:"#444",marginTop:2}}>follow-ups</div>
                            </div>
                          </div>
                          {onStreak.length>0&&(
                            <div style={{marginBottom:12}}>
                              <div style={{fontSize:10,color:GOLD,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700,marginBottom:8}}>🔥 On a streak (3+)</div>
                              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                                {onStreak.map((lb,i)=>(
                                  <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",borderRadius:20,background:"#1a1500",border:"0.5px solid "+GOLD+"33"}}>
                                    <span style={{fontSize:11,fontWeight:700,color:GOLD}}>{lb.current_streak}🔥</span>
                                    <span style={{fontSize:11,color:"#ccc"}}>{lb.athletes?.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {missedThis.length>0&&(
                            <div>
                              <div style={{fontSize:10,color:RED,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700,marginBottom:8}}>⚠ Missed this week</div>
                              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                                {missedThis.map((a,i)=>(
                                  <div key={i} style={{padding:"5px 10px",borderRadius:20,background:"#1a0808",border:"0.5px solid "+RED+"33",fontSize:11,color:"#aaa"}}>{a.name}</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
              {(injuries.length>0||messages.length>0||prayers.length>0)&&(
                <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+RED+"33"}}>
                  <div style={{background:"linear-gradient(140deg,"+RED+"30,"+RED+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+RED+","+RED+"44,transparent)"}}/>
                    <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="alertTriangle" size={66} color="#fff"/></div>
                    <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+RED+"12,transparent 70%)",pointerEvents:"none"}}/>
                    <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                      <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+RED+"44,"+RED+"22)",border:"1px solid "+RED+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+RED+"33"}}>🚨</div>
                      <div>
                        <div style={{fontSize:8,color:RED,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Action Required</div>
                        <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Needs Attention</div>
                        <div style={{fontSize:11,color:"#666",marginTop:1}}>{injuries.length>0?injuries.length+" injur"+(injuries.length===1?"y":"ies"):""}{injuries.length>0&&messages.length>0?" · ":""}{messages.length>0?messages.length+" message"+(messages.length===1?"":"s"):""}{(injuries.length>0||messages.length>0)&&prayers.length>0?" · ":""}{prayers.length>0?prayers.length+" prayer"+(prayers.length===1?"":"s"):""}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{background:"#111",padding:"16px 18px"}}>
                    {injuries.map((i,idx)=>(
                      <div key={idx} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:"0.5px solid #1e1e1e",alignItems:"flex-start"}}>
                        <div style={{width:7,height:7,borderRadius:"50%",background:RED,marginTop:5,flexShrink:0}}/>
                        <div style={{fontSize:13,color:"#ddd"}}><span style={{fontWeight:500}}>{i.athletes?.name}</span> — injury: <span style={{color:"#666"}}>{i.message}</span></div>
                      </div>
                    ))}
                    {messages.map((m,idx)=>(
                      <div key={idx} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:"0.5px solid #1e1e1e",alignItems:"flex-start"}}>
                        <div style={{width:7,height:7,borderRadius:"50%",background:PUR,marginTop:5,flexShrink:0}}/>
                        <div style={{fontSize:13,color:"#ddd"}}><span style={{fontWeight:500}}>{m.athletes?.name}</span> sent a message</div>
                      </div>
                    ))}
                    {prayers.map((p,idx)=>(
                      <div key={idx} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:"0.5px solid #1e1e1e",alignItems:"flex-start"}}>
                        <div style={{width:7,height:7,borderRadius:"50%",background:GREEN,marginTop:5,flexShrink:0}}/>
                        <div style={{fontSize:13,color:"#ddd"}}><span style={{fontWeight:500}}>{p.athletes?.name}</span> submitted a prayer request</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* This week attendance chart */}
              <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+GREEN+"33"}}>
                <div style={{background:"linear-gradient(140deg,"+GREEN+"30,"+GREEN+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GREEN+","+GREEN+"44,transparent)"}}/>
                  <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="barChart" size={66} color="#fff"/></div>
                  <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+GREEN+"12,transparent 70%)",pointerEvents:"none"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                    <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+GREEN+"44,"+GREEN+"22)",border:"1px solid "+GREEN+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+GREEN+"33"}}>📊</div>
                    <div>
                      <div style={{fontSize:8,color:GREEN,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>This Week</div>
                      <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Attendance</div>
                      <div style={{fontSize:11,color:"#666",marginTop:1}}>Mon · Tue · Thu · Fri check-ins</div>
                    </div>
                  </div>
                </div>
                <div style={{background:"#111",padding:"16px 18px"}}>
                  {(()=>{
                    const days=weekDays.map(d=>({dayName:d.dn,early:d.early,late:d.late,isToday:d.ds===estTodayStr}));
                    const maxVal=Math.max(...days.map(d=>d.early+d.late),5);
                    return(
                      <div>
                        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-around",gap:8,height:140,marginBottom:12,borderBottom:"0.5px solid #252525",paddingBottom:4}}>
                          {days.map((d,i)=>{
                            const total=d.early+d.late;
                            const earlyPct=total>0?(d.early/maxVal)*100:0;
                            const latePct=total>0?(d.late/maxVal)*100:0;
                            return(
                              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,height:"100%"}}>
                                <div style={{flex:1,width:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end",alignItems:"center",gap:1}}>
                                  {total>0&&(
                                    <>
                                      {d.late>0&&<div style={{width:"70%",height:`${latePct}%`,background:RED,borderRadius:"4px 4px 0 0",minHeight:latePct>0?4:0}}/>}
                                      {d.early>0&&<div style={{width:"70%",height:`${earlyPct}%`,background:GREEN,borderRadius:d.late>0?"0":"4px 4px 0 0",minHeight:earlyPct>0?4:0}}/>}
                                    </>
                                  )}
                                  {total>0&&<div style={{fontSize:11,fontWeight:600,color:"#fff",marginBottom:2}}>{total}</div>}
                                </div>
                                <div style={{fontSize:11,fontWeight:d.isToday?600:400,color:d.isToday?GREEN:"#666"}}>{d.dayName}</div>
                              </div>
                            );
                          })}
                        </div>
                        <div style={{display:"flex",gap:16,justifyContent:"center",fontSize:11,color:"#666"}}>
                          <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,borderRadius:2,background:GREEN}}/> Early</div>
                          <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,borderRadius:2,background:RED}}/> Late</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div style={{borderRadius:20,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+PUR+"33"}}>
                <div style={{background:"linear-gradient(140deg,"+PUR+"30,"+PUR+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+PUR+","+PUR+"44,transparent)"}}/>
                  <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="clock" size={66} color="#fff"/></div>
                  <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+PUR+"12,transparent 70%)",pointerEvents:"none"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                    <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+PUR+"44,"+PUR+"22)",border:"1px solid "+PUR+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+PUR+"33"}}>⏱</div>
                    <div>
                      <div style={{fontSize:8,color:PUR,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Daily Structure</div>
                      <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Class Flow</div>
                      <div style={{fontSize:11,color:"#666",marginTop:1}}>2 hours · done by 11:20am</div>
                    </div>
                  </div>
                </div>
                <div style={{background:"#111",padding:"16px 18px"}}>
                  {[
                    {time:"9:00am",label:"Pre-class",detail:dayName==="Mon"?"Draft → Mindset Monday":dayName==="Fri"?"Fellowship Friday devotional":"Sign-in · stretch prep",color:PUR,dur:"30 min"},
                    {time:"9:30am",label:"Stretch & mobility",detail:"10 min · dynamic stretching · all athletes together",color:GREEN,dur:"10 min"},
                    {time:"9:40am",label:"Run",detail:"40–50 min · all 4 groups · hand positions enforced · leaders set pace",color:"#854F0B",dur:"40–50 min"},
                    {time:"10:30am",label:"Weight room",detail:"30–50 min · 2 groups Tier 1 · 1 group Tier 2 · 1 group Tier 3",color:PUR,dur:"30–50 min"},
                    {time:"11:15am",label:"Closeout & prayer",detail:"5 min · all together · coach or athlete prays",color:RED,dur:"5 min"},
                  ].map((s,i,arr)=>(
                    <div key={i} style={{display:"flex",gap:12,padding:"8px 0",borderBottom:i<arr.length-1?"0.5px solid #252525":"none"}}>
                      <div style={{minWidth:56,fontSize:12,color:"#555",paddingTop:2}}>{s.time}</div>
                      <div style={{minWidth:8,display:"flex",flexDirection:"column",alignItems:"center"}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:s.color,marginTop:4,flexShrink:0}}/>
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
              </div>
            </div>
          )}


          {tab==="teams"&&(<TeamsView athletes={athletes}/>)}

          {tab==="roster"&&(
            <div>
              <div style={{display:"flex",gap:6,marginBottom:12}}>
                {["active","sleeping","archived"].map(s=>(
                  <button key={s} onClick={()=>setRosterStatus(s)} style={{flex:1,padding:"8px",borderRadius:8,border:"0.5px solid "+(rosterStatus===s?PUR:"#252525"),background:rosterStatus===s?PUR:"#111",color:rosterStatus===s?"#fff":"#666",fontSize:12,fontWeight:rosterStatus===s?600:400,cursor:"pointer",fontFamily:"Georgia,serif",textTransform:"capitalize"}}>
                    {s} ({athletes.filter(a=>a.status===s).length})
                  </button>
                ))}
              </div>
              <div style={{position:"relative",marginBottom:12}}>
                <input value={rosterSearch} onChange={e=>setRosterSearch(e.target.value)} placeholder="Search name or sport..." style={{width:"100%",padding:"10px 12px 10px 34px",borderRadius:10,border:"0.5px solid #252525",fontSize:13,fontFamily:"Georgia,serif",background:"#1a1a1a",color:"#ddd",boxSizing:"border-box"}}/>
                <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"#aaa"}}><Icon name="search" size={15} color="rgba(255,255,255,0.4)"/></div>
                {rosterSearch&&<button onClick={()=>setRosterSearch("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",fontSize:14,color:"#aaa",cursor:"pointer"}}>✕</button>}
              </div>
              <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+PUR+"33"}}>
                <div style={{background:"linear-gradient(140deg,"+PUR+"30,"+PUR+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+PUR+","+PUR+"44,transparent)"}}/>
                  <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="users" size={66} color="#fff"/></div>
                  <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+PUR+"12,transparent 70%)",pointerEvents:"none"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                    <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+PUR+"44,"+PUR+"22)",border:"1px solid "+PUR+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+PUR+"33"}}>👥</div>
                    <div>
                      <div style={{fontSize:8,color:PUR,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Athletes</div>
                      <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Roster</div>
                      <div style={{fontSize:11,color:"#666",marginTop:1}}>{athletes.filter(a=>a.status===rosterStatus&&(!rosterSearch||a.name?.toLowerCase().includes(rosterSearch.toLowerCase())||a.sport?.toLowerCase().includes(rosterSearch.toLowerCase()))).length} athletes · {rosterStatus}</div>
                    </div>
                  </div>
                </div>
                <div style={{background:"#111",padding:"16px 18px"}}>
                {athletes.filter(a=>a.status===rosterStatus&&(!rosterSearch||a.name?.toLowerCase().includes(rosterSearch.toLowerCase())||a.sport?.toLowerCase().includes(rosterSearch.toLowerCase()))).map(a=>{
                  const isExp=rosterExpanded===a.id;
                  const hasInjury=!!(a.injury||a.injury_note);
                  return(
                    <div key={a.id} style={{borderBottom:"0.5px solid #1e1e1e"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",cursor:"pointer"}} onClick={()=>setRosterExpanded(isExp?null:a.id)}>
                        <label style={{width:36,height:36,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:500,color:"#fff",flexShrink:0,cursor:"pointer",overflow:"hidden",outline:hasInjury?"2.5px solid "+RED:"none",outlineOffset:"1px"}} onClick={e=>e.stopPropagation()}>
                          {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(a.name||"?")[0]}
                          <input type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{
                            const file=e.target.files[0];if(!file)return;
                            try{
                              const publicUrl=await uploadAthletePhoto(a.id,file);
                              const{data,error}=await supabase.from("athletes").update({photo_url:publicUrl}).eq("id",a.id).select("id");
                              if(error){alert("Photo save failed: "+error.message);return;}
                              if(!data||data.length===0){alert("Photo not saved — check Supabase permissions.");return;}
                              setAthletes(prev=>prev.map(x=>x.id===a.id?{...x,photo_url:publicUrl}:x));
                            }catch(err){alert("Photo save failed: "+err.message);}
                          }}/>
                        </label>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                            <div onClick={e=>{e.stopPropagation();openAthleteModal(a);}} style={{fontSize:13,fontWeight:500,color:"#ddd",cursor:"pointer",textDecoration:"underline",textDecorationColor:"#444"}}>{a.name}</div>
                            {hasInjury&&<span style={{fontSize:10,background:"#2a0808",color:RED,padding:"1px 6px",borderRadius:4,fontWeight:500}}>🤕 Injured</span>}
                          </div>
                          <div style={{fontSize:11,color:"#666"}}>{a.sport} · {a.gender} · <span style={{color:a.role==="forge"?RED:STEEL}}>{a.role==="forge"?"Forge":"Iron"}</span></div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:6}} onClick={e=>e.stopPropagation()}>
                          <select value={a.status} onChange={e=>updateAthlete(a.id,"status",e.target.value)} style={{padding:"3px 6px",fontSize:11,border:"0.5px solid #333",borderRadius:6,background:"#1a1a1a",color:a.status==="active"?GREEN:a.status==="sleeping"?"#854F0B":RED}}>
                            <option value="active">Active</option>
                            <option value="sleeping">Sleeping</option>
                            <option value="archived">Archived</option>
                          </select>
                          <button onClick={e=>{e.stopPropagation();deleteAthlete(a.id,a.name);}} style={{padding:"3px 8px",borderRadius:6,border:"0.5px solid #ffcccc",background:"transparent",color:RED,fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>✕</button>
                        </div>
                        <div style={{fontSize:12,color:"#ccc"}}>{isExp?"▲":"▼"}</div>
                      </div>
                      {isExp&&(
                        <div style={{paddingBottom:14,paddingLeft:46}}>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                            <div>
                              <div style={{fontSize:10,color:"#aaa",marginBottom:3}}>Role</div>
                              <select value={a.role} onChange={e=>updateAthlete(a.id,"role",e.target.value)} style={{width:"100%",padding:"6px 8px",fontSize:12,border:"0.5px solid #333",borderRadius:8,background:"#1a1a1a",color:a.role==="forge"?RED:STEEL}}>
                                <option value="iron">The Iron</option>
                                <option value="forge">The Forge</option>
                              </select>
                            </div>
                            <div>
                              <div style={{fontSize:10,color:"#aaa",marginBottom:3}}>PIN</div>
                              <input defaultValue={a.pin||""} placeholder="4-digit PIN" onBlur={async e=>{await supabase.from("athletes").update({pin:e.target.value||null}).eq("id",a.id);}} style={{width:"100%",padding:"6px 8px",fontSize:12,border:"0.5px solid #333",borderRadius:8,background:"#1a1a1a",color:"#ddd",fontFamily:"Georgia,serif",boxSizing:"border-box"}}/>
                            </div>
                            <div>
                              <div style={{fontSize:10,color:"#aaa",marginBottom:3}}>Bracelet</div>
                              <input defaultValue={a.bracelet||""} placeholder="e.g. Phil 4:13" onBlur={async e=>{await supabase.from("athletes").update({bracelet:e.target.value||null}).eq("id",a.id);setAthletes(prev=>prev.map(x=>x.id===a.id?{...x,bracelet:e.target.value}:x));}} style={{width:"100%",padding:"6px 8px",fontSize:12,border:"0.5px solid #333",borderRadius:8,background:"#1a1a1a",color:"#ddd",fontFamily:"Georgia,serif",boxSizing:"border-box"}}/>
                            </div>
                            <div>
                              <div style={{fontSize:10,color:"#aaa",marginBottom:3}}>Partner</div>
                              <select defaultValue={a.accountability_partner||""} onChange={async e=>{await supabase.from("athletes").update({accountability_partner:e.target.value||null}).eq("id",a.id);setAthletes(prev=>prev.map(x=>x.id===a.id?{...x,accountability_partner:e.target.value}:x));}} style={{width:"100%",padding:"6px 8px",fontSize:12,border:"0.5px solid #333",borderRadius:8,background:"#1a1a1a",color:"#ddd"}}>
                                <option value="">No partner</option>
                                {athletes.filter(x=>x.id!==a.id&&x.status==="active").map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
                              </select>
                            </div>
                          </div>
                          {a.athletic_goal&&<div style={{fontSize:12,color:"#555",fontStyle:"italic",padding:"6px 10px",background:"#1a1a1a",borderRadius:8,border:"0.5px solid #252525",marginBottom:8}}>🎯 {a.athletic_goal}</div>}
                          {hasInjury&&(
                            <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:RED,padding:"6px 10px",background:"#2a0808",borderRadius:8,border:"0.5px solid "+RED+"44",marginBottom:8}}>
                              <span style={{flex:1}}>🤕 {a.injury_note||a.injury}</span>
                              <button onClick={async e=>{e.stopPropagation();await supabase.from("athletes").update({injury:false,injury_note:null}).eq("id",a.id);setAthletes(p=>p.map(x=>x.id===a.id?{...x,injury:false,injury_note:null}:x));}} style={{padding:"2px 8px",borderRadius:4,border:"0.5px solid #ffaaaa",background:"transparent",color:RED,fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif",flexShrink:0}}>Clear</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 50px 70px 60px",gap:6,marginTop:16}}>
                  <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Name" style={{padding:"6px 8px",fontSize:12,border:"0.5px solid #333",borderRadius:8,background:"#1a1a1a",color:"#ddd",fontFamily:"Georgia,serif"}}/>
                  <input value={newSport} onChange={e=>setNewSport(e.target.value)} placeholder="Sport" style={{padding:"6px 8px",fontSize:12,border:"0.5px solid #333",borderRadius:8,background:"#1a1a1a",color:"#ddd",fontFamily:"Georgia,serif"}}/>
                  <select value={newGender} onChange={e=>setNewGender(e.target.value)} style={{padding:"6px",fontSize:12,border:"0.5px solid #333",borderRadius:8,background:"#1a1a1a",color:"#ddd"}}>
                    <option value="">M/F</option><option value="M">M</option><option value="F">F</option>
                  </select>
                  <select value={newRole} onChange={e=>setNewRole(e.target.value)} style={{padding:"6px",fontSize:12,border:"0.5px solid #333",borderRadius:8,background:"#1a1a1a",color:"#ddd"}}>
                    <option value="iron">Iron</option><option value="forge">Forge</option>
                  </select>
                  <button onClick={addAthlete} disabled={!newName.trim()} style={{padding:"6px 12px",borderRadius:8,border:"none",background:newName.trim()?PUR:"#e0e0e0",color:"#fff",fontSize:12,fontWeight:500,cursor:newName.trim()?"pointer":"not-allowed",fontFamily:"Georgia,serif"}}>Add</button>
                </div>
                </div>
              </div>
            </div>
          )}


          {tab==="attendance"&&(
            <div>
              <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+GREEN+"33"}}>
                <div style={{background:"linear-gradient(140deg,"+GREEN+"30,"+GREEN+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GREEN+","+GREEN+"44,transparent)"}}/>
                  <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="calendar" size={66} color="#fff"/></div>
                  <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+GREEN+"12,transparent 70%)",pointerEvents:"none"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                    <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+GREEN+"44,"+GREEN+"22)",border:"1px solid "+GREEN+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+GREEN+"33"}}>📅</div>
                    <div>
                      <div style={{fontSize:8,color:GREEN,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>This Week</div>
                      <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Attendance Summary</div>
                      <div style={{fontSize:11,color:"#666",marginTop:1}}>Mon · Tue · Thu · Fri check-ins</div>
                    </div>
                  </div>
                </div>
                <div style={{background:"#111",padding:"16px 18px"}}>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
                    {weekDays.map((d,i)=>(
                      <div key={i} onClick={()=>setAttDate(d.ds)} style={{borderRadius:10,padding:"10px 6px",textAlign:"center",cursor:"pointer",background:attDate===d.ds?GREEN:"#1a1a1a",border:"0.5px solid "+(attDate===d.ds?GREEN:"#252525")}}>
                        <div style={{fontSize:11,fontWeight:600,color:attDate===d.ds?"#fff":"#666",marginBottom:4}}>{d.dn}</div>
                        <div style={{fontSize:16,fontWeight:700,color:attDate===d.ds?"#fff":GREEN}}>{d.early}</div>
                        <div style={{fontSize:10,color:attDate===d.ds?"#cfffcc":"#555"}}>early</div>
                        {d.late>0&&<div style={{fontSize:10,color:attDate===d.ds?"#ffcccc":RED}}>{d.late} late</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {mostMissed.length>0&&(
                <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+RED+"33"}}>
                  <div style={{background:"linear-gradient(140deg,"+RED+"30,"+RED+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+RED+","+RED+"44,transparent)"}}/>
                    <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="alertTriangle" size={66} color="#fff"/></div>
                    <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+RED+"12,transparent 70%)",pointerEvents:"none"}}/>
                    <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                      <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+RED+"44,"+RED+"22)",border:"1px solid "+RED+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+RED+"33"}}>⚠️</div>
                      <div>
                        <div style={{fontSize:8,color:RED,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Pattern Alert</div>
                        <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Most Missed</div>
                        <div style={{fontSize:11,color:"#666",marginTop:1}}>This month</div>
                      </div>
                    </div>
                  </div>
                  <div style={{background:"#111",padding:"0 18px"}}>
                    {mostMissed.map((a,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:i<mostMissed.length-1?"0.5px solid #1e1e1e":"none"}}>
                        <div style={{fontSize:13,color:"#ddd"}}>{a.name}</div>
                        <div style={{fontSize:12,fontWeight:700,color:RED}}>{a.missed} missed</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Date selector + attendance list */}
              <div style={{borderRadius:20,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+GREEN+"33"}}>
                <div style={{background:"linear-gradient(140deg,"+GREEN+"30,"+GREEN+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GREEN+","+GREEN+"44,transparent)"}}/>
                  <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="list" size={66} color="#fff"/></div>
                  <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+GREEN+"12,transparent 70%)",pointerEvents:"none"}}/>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative"}}>
                    <div style={{display:"flex",alignItems:"center",gap:14}}>
                      <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+GREEN+"44,"+GREEN+"22)",border:"1px solid "+GREEN+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+GREEN+"33"}}>📋</div>
                      <div>
                        <div style={{fontSize:8,color:GREEN,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Check-In Log</div>
                        <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>{attDate===estTodayStr?"Today's Attendance":attDate}</div>
                      </div>
                    </div>
                    <input type="date" value={attDate} onChange={e=>setAttDate(e.target.value)} style={{padding:"6px 10px",fontSize:12,border:"0.5px solid #333",borderRadius:8,background:"#1a1a1a",color:"#ddd"}}/>
                  </div>
                </div>
                <div style={{background:"#111",padding:"16px 18px"}}>
                {attendance.filter(r=>r.date===attDate).length>0&&(
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
                    {[{l:"Early",v:attendance.filter(r=>r.date===attDate&&r.status==="early").length,c:GREEN,bg:GREEN+"22"},{l:"Late",v:attendance.filter(r=>r.date===attDate&&r.status==="late").length,c:RED,bg:RED+"22"},{l:"Absent",v:athletes.filter(a=>a.status==="active").length-attendance.filter(r=>r.date===attDate).length,c:"#888",bg:"#1a1a1a"}].map(s=>(
                      <div key={s.l} style={{background:s.bg,borderRadius:10,padding:"10px",textAlign:"center",border:"0.5px solid #252525"}}>
                        <div style={{fontSize:18,fontWeight:700,color:s.c}}>{s.v}</div>
                        <div style={{fontSize:11,color:"#666"}}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                )}

                {athletes.filter(a=>a.status==="active").map(a=>{
                  const rec=attendance.find(r=>r.athlete_id===a.id&&r.date===attDate);
                  const lb=leaderboard.find(r=>r.athlete_id===a.id);
                  const streak=lb?.current_streak||0;
                  const isAbsent=!rec;
                  return(
                    <div key={a.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"0.5px solid #1e1e1e",background:isAbsent&&attDate===estTodayStr?GOLD+"10":"transparent",borderRadius:4,paddingLeft:isAbsent&&attDate===estTodayStr?6:0}}>
                      <div style={{width:34,height:34,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:500,color:"#fff",flexShrink:0,overflow:"hidden"}}>
                        {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(a.name||"?")[0]}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div style={{fontSize:13,fontWeight:500,color:"#ddd"}}>{a.name}</div>
                          {streak>0&&<span style={{fontSize:10,color:GOLD}}>🔥 {streak}</span>}
                        </div>
                        {rec?.time_logged&&<div style={{fontSize:11,color:"#666"}}>{rec.time_logged}</div>}
                        {isAbsent&&attDate===estTodayStr&&<div style={{fontSize:11,color:"#854F0B"}}>⚠ Not checked in yet</div>}
                      </div>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"flex-end"}}>
                          {rec&&<span style={{fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:6,background:rec.status==="early"?GREEN+"22":rec.status==="excused"?GOLD+"22":RED+"22",color:rec.status==="early"?GREEN:rec.status==="excused"?"#854F0B":RED,marginRight:4}}>
                            {rec.status==="early"?"✓ Early":rec.status==="excused"?"Excused":"Late"}
                          </span>}
                          <button onClick={async()=>{
                            const now=new Date();
                            const timeStr=now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",timeZone:"America/New_York"});
                            const day=new Date(attDate+"T12:00:00").toLocaleDateString("en-US",{weekday:"short"});
                            if(rec){await supabase.from("attendance").update({status:"early",time_logged:timeStr}).eq("id",rec.id);}
                            else{await supabase.from("attendance").insert({athlete_id:a.id,date:attDate,status:"early",time_logged:timeStr,day});}
                            const{data}=await supabase.from("attendance").select("*,athletes(name)").order("date",{ascending:false}).limit(200);
                            if(data)setAttendance(data);
                          }} style={{fontSize:11,padding:"3px 8px",borderRadius:6,border:"0.5px solid "+GREEN,background:rec?.status==="early"?GREEN:"transparent",color:rec?.status==="early"?"#fff":GREEN,cursor:"pointer",fontFamily:"Georgia,serif"}}>Early</button>
                          <button onClick={async()=>{
                            const now=new Date();
                            const timeStr=now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",timeZone:"America/New_York"});
                            const day=new Date(attDate+"T12:00:00").toLocaleDateString("en-US",{weekday:"short"});
                            if(rec){await supabase.from("attendance").update({status:"late",time_logged:timeStr}).eq("id",rec.id);}
                            else{await supabase.from("attendance").insert({athlete_id:a.id,date:attDate,status:"late",time_logged:timeStr,day});}
                            const{data}=await supabase.from("attendance").select("*,athletes(name)").order("date",{ascending:false}).limit(200);
                            if(data)setAttendance(data);
                          }} style={{fontSize:11,padding:"3px 8px",borderRadius:6,border:"0.5px solid "+RED,background:rec?.status==="late"?RED:"transparent",color:rec?.status==="late"?"#fff":RED,cursor:"pointer",fontFamily:"Georgia,serif"}}>Late</button>
                          <button onClick={async()=>{
                            const now=new Date();
                            const timeStr=now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",timeZone:"America/New_York"});
                            const day=new Date(attDate+"T12:00:00").toLocaleDateString("en-US",{weekday:"short"});
                            if(rec){await supabase.from("attendance").update({status:"excused",time_logged:timeStr}).eq("id",rec.id);}
                            else{await supabase.from("attendance").insert({athlete_id:a.id,date:attDate,status:"excused",time_logged:timeStr,day});}
                            const{data}=await supabase.from("attendance").select("*,athletes(name)").order("date",{ascending:false}).limit(200);
                            if(data)setAttendance(data);
                          }} style={{fontSize:11,padding:"3px 8px",borderRadius:6,border:"0.5px solid #854F0B",background:rec?.status==="excused"?"#854F0B":"transparent",color:rec?.status==="excused"?"#fff":"#854F0B",cursor:"pointer",fontFamily:"Georgia,serif"}}>Excused</button>
                          {rec&&<button onClick={async()=>{
                            await supabase.from("attendance").delete().eq("id",rec.id);
                            const{data}=await supabase.from("attendance").select("*,athletes(name)").order("date",{ascending:false}).limit(200);
                            if(data)setAttendance(data);
                          }} style={{fontSize:11,padding:"3px 8px",borderRadius:6,border:"0.5px solid #ddd",background:"transparent",color:"#aaa",cursor:"pointer",fontFamily:"Georgia,serif"}}>✕</button>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            </div>
          )}

          {tab==="accountability"&&<Accountability athletes={athletes.filter(a=>a.status==="active")}/>}
{tab==="fellowship"&&<FellowshipFriday/>}
{tab==="mindset"&&<MindsetMonday/>}
{tab==="culture"&&<CultureEvents athletes={athletes}/>}

          {tab==="prayers"&&(
            <div>
              <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+PUR+"33"}}>
                <div style={{background:"linear-gradient(140deg,"+PUR+"30,"+PUR+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+PUR+","+PUR+"44,transparent)"}}/>
                  <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="pray" size={66} color="#fff"/></div>
                  <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+PUR+"12,transparent 70%)",pointerEvents:"none"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                    <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+PUR+"44,"+PUR+"22)",border:"1px solid "+PUR+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+PUR+"33"}}>🙏</div>
                    <div>
                      <div style={{fontSize:8,color:PUR,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Athletes</div>
                      <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Prayer Requests</div>
                      <div style={{fontSize:11,color:"#666",marginTop:1}}>{coachPrayers.length} request{coachPrayers.length!==1?"s":""} from your athletes</div>
                    </div>
                  </div>
                </div>
                <div style={{background:"#111",padding:"0 18px"}}>
                  {coachPrayers.length===0&&<div style={{fontSize:13,color:"#555",textAlign:"center",padding:"1.5rem 0"}}>No prayer requests yet.</div>}
                  {coachPrayers.map((p,i)=>(
                    <div key={i} style={{padding:"14px 0",borderBottom:i<coachPrayers.length-1?"0.5px solid #1e1e1e":"none",borderLeft:"3px solid "+(prayedFor[p.id]?GREEN:PUR),paddingLeft:12,opacity:prayedFor[p.id]?0.6:1}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                        <div style={{fontSize:11,fontWeight:700,color:PUR,textTransform:"uppercase",letterSpacing:"0.06em"}}>{p.anonymous?"Anonymous":p.athletes?.name||"Athlete"}</div>
                        <div style={{fontSize:11,color:"#555"}}>{new Date(p.created_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{fontSize:13,color:"#ccc",lineHeight:1.7,fontStyle:"italic",marginBottom:10}}>"{p.message}"</div>
                      <button onClick={()=>setPrayedFor(prev=>({...prev,[p.id]:true}))} style={{padding:"6px 14px",borderRadius:8,border:"none",background:prayedFor[p.id]?GREEN+"22":PUR,color:prayedFor[p.id]?GREEN:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                        {prayedFor[p.id]?"✓ Prayed for":"Mark as prayed →"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab==="weights"&&(
            <div>
              <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+GREEN+"33"}}>
                <div style={{background:"linear-gradient(140deg,"+GREEN+"30,"+GREEN+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GREEN+","+PUR+")"}}/>
                  <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="scale" size={66} color="#fff"/></div>
                  <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+GREEN+"12,transparent 70%)",pointerEvents:"none"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                    <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+GREEN+"44,"+GREEN+"22)",border:"1px solid "+GREEN+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+GREEN+"33"}}>⚖️</div>
                    <div>
                      <div style={{fontSize:8,color:GREEN,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Weight Room</div>
                      <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Weight Log</div>
                      <div style={{fontSize:11,color:"#666",marginTop:1}}>{[...new Set(weightLogs.map(l=>l.athlete_id))].length} athletes · {weightLogs.length} entries</div>
                    </div>
                  </div>
                </div>
                <div style={{background:"#111",padding:"16px 18px"}}>
                  <ProgramUpload/>
                </div>
              </div>

              {weightLogs.length===0&&(
                <div style={{background:"#111",borderRadius:20,padding:"2rem",textAlign:"center",border:"0.5px solid #252525"}}>
                  <div style={{marginBottom:8,display:"flex",justifyContent:"center"}}><Icon name="scale" size={30} color="rgba(255,255,255,0.35)"/></div>
                  <div style={{fontSize:13,color:"#555"}}>No weight logs yet.</div>
                  <div style={{fontSize:11,color:"#444",marginTop:4}}>Athletes log from their Weight tab.</div>
                </div>
              )}

              {[...new Set(weightLogs.map(l=>l.athlete_id))].map(aid=>{
                const ath=athletes.find(a=>a.id===aid);
                const entries=[...weightLogs.filter(l=>l.athlete_id===aid)].sort((a,b)=>new Date(a.date)-new Date(b.date));
                const first=entries[0]?.weight!=null?parseFloat(entries[0].weight):null;
                const latest=entries[entries.length-1]?.weight!=null?parseFloat(entries[entries.length-1].weight):null;
                const diff=first!=null&&latest!=null?parseFloat((latest-first).toFixed(1)):null;
                const trending=diff===null?"flat":diff<0?"down":diff>0?"up":"flat";
                const trendColor=trending==="down"?GREEN:trending==="up"?RED:"#888";

                // Mini sparkline
                const sparkH=40,sparkW=100;
                const weights=entries.map(e=>parseFloat(e.weight));
                const sMin=Math.min(...weights)-1;
                const sMax=Math.max(...weights)+1;
                const sparkPts=weights.map((w,i)=>{
                  const x=(i/(Math.max(weights.length-1,1)))*sparkW;
                  const y=sparkH-((w-sMin)/(sMax-sMin||1))*sparkH;
                  return`${x},${y}`;
                }).join(" ");

                return(
                  <div key={aid} style={{background:"#111",borderRadius:20,marginBottom:10,border:"1px solid "+trendColor+"33",overflow:"hidden"}}>
                    <div style={{height:3,background:"linear-gradient(90deg,"+trendColor+","+trendColor+"44,transparent)"}}/>
                    <div style={{padding:"1rem 1.25rem"}}>
                      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                        <div style={{width:44,height:44,borderRadius:"50%",background:ath?.role==="forge"?RED:STEEL,overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:600,color:"#fff",border:"2px solid "+trendColor+"44"}}>
                          {ath?.photo_url?<img src={ath.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(ath?.name||"?")[0]}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:15,fontWeight:700,color:"#fff"}}>{ath?.name||"Unknown"}</div>
                          <div style={{fontSize:11,color:"#666"}}>{entries.length} log{entries.length!==1?"s":""} · {ath?.sport||""}</div>
                        </div>
                        <div style={{background:trendColor+"22",borderRadius:10,padding:"6px 12px",border:"1px solid "+trendColor+"44",textAlign:"center"}}>
                          <div style={{fontSize:18,fontWeight:800,color:trendColor}}>
                            {diff===null?"—":(diff>0?"↑":diff<0?"↓":"→")+" "+Math.abs(diff)}
                          </div>
                          <div style={{fontSize:9,color:trendColor,textTransform:"uppercase",letterSpacing:"0.05em"}}>lbs</div>
                        </div>
                      </div>

                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
                        {[{label:"Start",val:first,color:"#888"},{label:"Current",val:latest,color:"#fff"},{label:"Entries",val:entries.length,color:PUR}].map(s=>(
                          <div key={s.label} style={{background:"#1a1a1a",borderRadius:10,padding:"10px 8px",textAlign:"center",border:"0.5px solid #222"}}>
                            <div style={{fontSize:18,fontWeight:800,color:s.color}}>{s.val!=null?s.val:"—"}</div>
                            <div style={{fontSize:10,color:"#555",marginTop:3,textTransform:"uppercase",letterSpacing:"0.06em"}}>{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {weights.length>1&&(
                        <div style={{background:"#1a1a1a",borderRadius:10,padding:"10px 12px",marginBottom:10}}>
                          <svg viewBox={`0 0 ${sparkW} ${sparkH}`} style={{width:"100%",height:40,overflow:"visible"}}>
                            <defs>
                              <linearGradient id={"sg"+aid} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={trendColor} stopOpacity="0.3"/>
                                <stop offset="100%" stopColor={trendColor} stopOpacity="0"/>
                              </linearGradient>
                            </defs>
                            <polygon points={`0,${sparkH} ${sparkPts} ${sparkW},${sparkH}`} fill={`url(#sg${aid})`}/>
                            <polyline points={sparkPts} fill="none" stroke={trendColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            {weights.map((w,i)=>{
                              const x=(i/(Math.max(weights.length-1,1)))*sparkW;
                              const y=sparkH-((w-sMin)/(sMax-sMin||1))*sparkH;
                              return<circle key={i} cx={x} cy={y} r={i===weights.length-1?3:1.5} fill={i===weights.length-1?"#fff":trendColor}/>;
                            })}
                          </svg>
                        </div>
                      )}

                      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2}}>
                        {entries.map((e,ei)=>{
                          const prev=ei>0?parseFloat(entries[ei-1].weight):null;
                          const cur=parseFloat(e.weight);
                          const wd=prev!=null?parseFloat((cur-prev).toFixed(1)):null;
                          return(
                            <div key={ei} style={{flexShrink:0,background:ei===entries.length-1?"#222":"#1a1a1a",borderRadius:10,padding:"6px 10px",textAlign:"center",minWidth:54,border:"1px solid "+(ei===entries.length-1?"#333":"#202020")}}>
                              <div style={{fontSize:13,fontWeight:700,color:ei===entries.length-1?"#fff":"#aaa"}}>{cur}</div>
                              {wd!=null&&<div style={{fontSize:10,color:wd<0?GREEN:wd>0?RED:"#888",fontWeight:600}}>{wd>0?"↑":wd<0?"↓":"→"}{Math.abs(wd)}</div>}
                              <div style={{fontSize:10,color:"#555",fontWeight:600}}>{e.date?.slice(5)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab==="weights"&&prLogs.length>0&&(()=>{
            const epley=(w,r)=>r===1?w:Math.round(w*(1+r/30));
            const CATS_M=[
              {id:"lower",label:"Lower Body",emoji:"🦵",keywords:["squat","lunge","step up"],ref:225},
              {id:"push", label:"Push",       emoji:"💪",keywords:["bench","press","push","dip","jerk"],ref:175},
              {id:"pull", label:"Pull",       emoji:"🤜",keywords:["pull","row","curl"],ref:155},
              {id:"hinge",label:"Hinge",      emoji:"⛓️",keywords:["deadlift","clean","snatch","swing","rdl","hinge"],ref:255},
            ];
            const CATS_F=[
              {id:"lower",label:"Lower Body",emoji:"🦵",keywords:["squat","lunge","step up"],ref:145},
              {id:"push", label:"Push",       emoji:"💪",keywords:["bench","press","push","dip","jerk"],ref:95},
              {id:"pull", label:"Pull",       emoji:"🤜",keywords:["pull","row","curl"],ref:85},
              {id:"hinge",label:"Hinge",      emoji:"⛓️",keywords:["deadlift","clean","snatch","swing","rdl","hinge"],ref:165},
            ];
            const getCatFrom=(cats,name)=>{
              const n=name.toLowerCase();
              if(cats[3].keywords.some(k=>n.includes(k)))return "hinge";
              if(cats[0].keywords.some(k=>n.includes(k)))return "lower";
              if(cats[1].keywords.some(k=>n.includes(k)))return "push";
              if(cats[2].keywords.some(k=>n.includes(k)))return "pull";
              return null;
            };
            const isF=(g)=>{const v=(g||"").toLowerCase();return v==="female"||v==="f"||v==="woman";};
            // Build per-athlete best estimated 1RM per lift
            const byAthlete={};
            prLogs.forEach(r=>{
              const aid=r.athlete_id;
              const orm=epley(parseFloat(r.weight)||0,parseInt(r.reps)||1);
              if(!byAthlete[aid])byAthlete[aid]={};
              if(!byAthlete[aid][r.lift]||orm>byAthlete[aid][r.lift].orm){
                byAthlete[aid][r.lift]={weight:r.weight,reps:r.reps,orm};
              }
            });
            const renderSection=(cats,gLabel,accentColor)=>{
              const rows=[];
              Object.entries(byAthlete).forEach(([aid,lifts])=>{
                const ath=athletes.find(a=>String(a.id)===String(aid));
                const female=isF(ath?.gender);
                const wantFemale=gLabel==="Women's";
                if(female!==wantFemale)return;
                // Sum all category orms as a simple overall score
                let totalOrm=0,count=0;
                cats.forEach(cat=>{
                  const catLifts=Object.entries(lifts).filter(([name])=>getCatFrom(cats,name)===cat.id);
                  if(!catLifts.length)return;
                  const best=catLifts.reduce((b,[,v])=>v.orm>b.orm?v.orm:b,0);
                  if(best>0){totalOrm+=best;count++;}
                });
                if(!count)return;
                rows.push({aid,name:ath?.name||"Unknown",photo:ath?.photo_url,lifts,totalOrm,count});
              });
              if(!rows.length)return null;
              return(
                <div style={{marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,paddingBottom:10,borderBottom:"1px solid #1e1e1e"}}>
                    <div style={{width:3,height:18,borderRadius:2,background:accentColor,flexShrink:0}}/>
                    <div style={{fontSize:13,fontWeight:800,color:accentColor,textTransform:"uppercase",letterSpacing:"0.14em"}}>{gLabel} Rankings</div>
                    <div style={{flex:1,height:1,background:"linear-gradient(90deg,"+accentColor+"22,transparent)"}}/>
                  </div>
                  {cats.map(cat=>{
                    const catRows=[];
                    Object.entries(byAthlete).forEach(([aid,lifts])=>{
                      const ath=athletes.find(a=>String(a.id)===String(aid));
                      const female=isF(ath?.gender);
                      const wantFemale=gLabel==="Women's";
                      if(female!==wantFemale)return;
                      const catLifts=Object.entries(lifts).filter(([name])=>getCatFrom(cats,name)===cat.id);
                      if(!catLifts.length)return;
                      const best=catLifts.reduce((b,[n,v])=>v.orm>b.orm?{liftName:n,...v}:b,{orm:0});
                      if(!best.orm)return;
                      catRows.push({aid,name:ath?.name||"Unknown",photo:ath?.photo_url,liftName:best.liftName,weight:best.weight,reps:best.reps,orm:best.orm});
                    });
                    catRows.sort((a,b)=>b.orm-a.orm);
                    if(!catRows.length)return null;
                    const pctOf=(orm)=>Math.round(Math.min(100,orm/cat.ref*100));
                    return(
                      <div key={cat.id} style={{marginBottom:14,background:"#0e0e0e",borderRadius:12,padding:"12px 12px 8px",border:"0.5px solid #1a1a1a"}}>
                        <div style={{fontSize:11,color:accentColor,fontWeight:700,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                          <span style={{fontSize:14}}>{cat.emoji}</span>
                          <span style={{textTransform:"uppercase",letterSpacing:"0.1em",fontSize:11}}>{cat.label}</span>
                          <span style={{color:"#444",fontWeight:400,fontSize:10,textTransform:"none",marginLeft:2}}>· est. 1RM</span>
                        </div>
                        {catRows.slice(0,5).map((r,ri)=>(
                          <div key={ri} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:ri===0?GOLD+"12":"#151515",borderRadius:10,marginBottom:5,border:"1px solid "+(ri===0?GOLD+"33":"#1e1e1e")}}>
                            <div style={{width:22,fontSize:ri<3?15:12,fontWeight:700,color:ri===0?GOLD:ri===1?"#ccc":ri===2?ORANGE:"#555",textAlign:"center",flexShrink:0}}>
                              {ri===0?"🥇":ri===1?"🥈":ri===2?"🥉":`${ri+1}.`}
                            </div>
                            <div style={{width:32,height:32,borderRadius:"50%",overflow:"hidden",flexShrink:0,background:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:600,color:"#fff",border:"1.5px solid "+(ri===0?GOLD+"66":"#252525")}}>
                              {r.photo?<img src={r.photo} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:r.name[0]}
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:13,fontWeight:ri===0?700:500,color:ri===0?"#fff":"#bbb",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div>
                              <div style={{fontSize:10,color:"#444",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.liftName}</div>
                            </div>
                            <div style={{textAlign:"right",flexShrink:0}}>
                              <div style={{fontSize:16,fontWeight:700,color:ri===0?GOLD:"#ccc"}}>{r.orm}</div>
                              <div style={{fontSize:9,color:"#444"}}>{pctOf(r.orm)}% of ref</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            };
            const menSection=renderSection(CATS_M,"Men's",GOLD);
            const womenSection=renderSection(CATS_F,"Women's","#C084FC");
            if(!menSection&&!womenSection)return null;
            return(
              <div style={{marginTop:16}}>
                <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+GOLD+"33"}}>
                  <div style={{background:"linear-gradient(140deg,"+GOLD+"30,"+GOLD+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GOLD+",#C084FC,"+GOLD+"44)"}}/>
                    <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="trophy" size={66} color="#fff"/></div>
                    <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                      <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+GOLD+"44,"+GOLD+"22)",border:"1px solid "+GOLD+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+GOLD+"33"}}>🏆</div>
                      <div>
                        <div style={{fontSize:8,color:GOLD,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Strength Room</div>
                        <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Team Leaderboard</div>
                        <div style={{fontSize:11,color:"#666",marginTop:1}}>Estimated 1RM · Gender-separated · {Object.keys(byAthlete).length} athletes logged</div>
                      </div>
                    </div>
                  </div>
                  <div style={{background:"#111",padding:"14px 16px"}}>
                    {menSection}
                    {womenSection}
                  </div>
                </div>
              </div>
            );
          })()}

          {tab==="photos"&&(
            <div>
              {/* ── Post group photos ── */}
              <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+PUR+"33"}}>
                <div style={{background:"linear-gradient(140deg,"+PUR+"30,"+PUR+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+PUR+","+PUR+"44,transparent)"}}/>
                  <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="camera" size={66} color="#fff"/></div>
                  <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+PUR+"12,transparent 70%)",pointerEvents:"none"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                    <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+PUR+"44,"+PUR+"22)",border:"1px solid "+PUR+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+PUR+"33"}}>📸</div>
                    <div>
                      <div style={{fontSize:8,color:PUR,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Group Feed</div>
                      <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Post Photos</div>
                      <div style={{fontSize:11,color:"#666",marginTop:1}}>Athletes see these in their Photos tab</div>
                    </div>
                  </div>
                </div>
                <div style={{background:"#111",padding:"16px 18px"}}>
                  <label style={{display:"block",marginBottom:10,cursor:"pointer"}}>
                    <div style={{borderRadius:12,overflow:"hidden",border:"1.5px dashed "+PUR+"55",background:"#0d0d0d",
                      minHeight:110,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                      {gpPreview?(
                        <img src={gpPreview} style={{width:"100%",maxHeight:220,objectFit:"cover",display:"block"}} alt=""/>
                      ):(
                        <div style={{textAlign:"center",padding:"1.5rem"}}>
                          <div style={{marginBottom:6,display:"flex",justifyContent:"center"}}><Icon name="camera" size={28} color="rgba(255,255,255,0.4)"/></div>
                          <div style={{fontSize:12,color:"#555"}}>Tap to choose photo</div>
                        </div>
                      )}
                    </div>
                    <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
                      const file=e.target.files[0];
                      if(!file)return;
                      setGpFile(file);
                      const reader=new FileReader();
                      reader.onload=ev=>setGpPreview(ev.target.result);
                      reader.readAsDataURL(file);
                    }}/>
                  </label>
                  <input value={gpCaption} onChange={e=>setGpCaption(e.target.value)}
                    placeholder="Caption (optional)..."
                    style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"0.5px solid #252525",
                      background:"#0d0d0d",color:"#fff",fontSize:13,fontFamily:"Georgia,serif",
                      marginBottom:10,boxSizing:"border-box"}}/>
                  {gpError&&<div style={{fontSize:12,color:RED,marginBottom:8}}>{gpError}</div>}
                  <button onClick={postGroupPhoto} disabled={gpUploading||!gpFile}
                    style={{width:"100%",padding:"12px",borderRadius:10,border:"none",
                      background:gpUploading||!gpFile?"#252525":"linear-gradient(135deg,"+PUR+","+PUR+"cc)",
                      color:gpUploading||!gpFile?"#555":"#fff",fontSize:13,fontWeight:700,
                      cursor:gpUploading||!gpFile?"not-allowed":"pointer",fontFamily:"Georgia,serif"}}>
                    {gpSuccess?"✓ Posted!":gpUploading?"Uploading...":"Post to athletes →"}
                  </button>
                  {gpPhotos.length>0&&(
                    <div style={{marginTop:16}}>
                      <div style={{fontSize:11,color:"#444",marginBottom:8}}>Posted ({gpPhotos.length}) · tap × to remove</div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                        {gpPhotos.map((p,i)=>(
                          <div key={i} style={{position:"relative",borderRadius:8,overflow:"hidden",aspectRatio:"1",background:"#1a1a1a"}}>
                            <img src={p.day} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>
                            <button onClick={()=>deleteGroupPhoto(p.id)}
                              style={{position:"absolute",top:3,right:3,width:20,height:20,borderRadius:"50%",
                                border:"none",background:"rgba(0,0,0,0.75)",color:RED,cursor:"pointer",
                                fontSize:13,fontWeight:900,lineHeight:1,padding:0,display:"flex",
                                alignItems:"center",justifyContent:"center"}}>×</button>
                            {p.message&&(
                              <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"2px 4px",
                                background:"rgba(0,0,0,0.6)",fontSize:8,color:"#ddd",
                                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.message}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Google Drive documents ── */}
              <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid #4285f433"}}>
                <div style={{background:"linear-gradient(140deg,#4285f430,#4285f410,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,#4285f4,#4285f444,transparent)"}}/>
                  <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="fileText" size={66} color="#fff"/></div>
                  <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,#4285f412,transparent 70%)",pointerEvents:"none"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                    <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,#4285f444,#4285f422)",border:"1px solid #4285f444",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px #4285f433"}}>📁</div>
                    <div>
                      <div style={{fontSize:8,color:"#4285f4",textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Documents</div>
                      <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Google Drive</div>
                      <div style={{fontSize:11,color:"#666",marginTop:1}}>Share docs, programs, or posters with athletes</div>
                    </div>
                  </div>
                </div>
                <div style={{background:"#111",padding:"16px 18px"}}>
                  <div style={{background:"#0a1520",borderRadius:8,padding:"10px 12px",marginBottom:12,border:"0.5px solid #4285f422"}}>
                    <div style={{fontSize:11,color:"#4285f4",fontWeight:600,marginBottom:4}}>How to share from Google Drive:</div>
                    <div style={{fontSize:11,color:"#777",lineHeight:2}}>1. Open doc in Google Drive &nbsp; 2. Share → Anyone with link &nbsp; 3. Paste below</div>
                  </div>
                  <DriveLinksManager/>
                </div>
              </div>

              {/* ── Athlete profile photos ── */}
              <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+STEEL+"33"}}>
                <div style={{background:"linear-gradient(140deg,"+STEEL+"30,"+STEEL+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+STEEL+","+STEEL+"44,transparent)"}}/>
                  <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="profile" size={66} color="#fff"/></div>
                  <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+STEEL+"12,transparent 70%)",pointerEvents:"none"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                    <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+STEEL+"44,"+STEEL+"22)",border:"1px solid "+STEEL+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+STEEL+"33"}}>👤</div>
                    <div>
                      <div style={{fontSize:8,color:STEEL,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Profile Photos</div>
                      <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Athlete Headshots</div>
                      <div style={{fontSize:11,color:"#666",marginTop:1}}>Used on profile cards, leaderboards, etc.</div>
                    </div>
                  </div>
                </div>
                <div style={{background:"#111",padding:"16px 18px"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    {athletes.filter(a=>a.status==="active").map((a,i)=>(
                      <div key={i} style={{background:"#1a1a1a",borderRadius:12,padding:"1rem",border:"0.5px solid #252525",textAlign:"center"}}>
                        <div style={{width:64,height:64,borderRadius:"50%",background:STEEL,margin:"0 auto 8px",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#fff"}}>
                          {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={ev=>{ev.target.style.display="none";}} alt=""/>:a.name[0]}
                        </div>
                        <div style={{fontSize:12,fontWeight:500,color:"#ddd",marginBottom:8}}>{a.name}</div>
                        <label style={{padding:"6px 12px",borderRadius:8,border:"0.5px solid "+ORANGE,background:ORANGE+"18",fontSize:11,cursor:"pointer",color:ORANGE,display:"inline-block",fontWeight:600}}>
                          {uploadingPhoto===a.id?"Saving...":a.photo_url?"Change":"Add Photo"}
                          <input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={async e=>{
                            const file=e.target.files[0];
                            if(!file)return;
                            setUploadingPhoto(a.id);
                            try{
                              const publicUrl=await uploadAthletePhoto(a.id,file);
                              const{error}=await supabase.from("athletes").update({photo_url:publicUrl}).eq("id",a.id);
                              if(error){alert("Error saving photo: "+error.message);}
                              else{setAthletes(prev=>prev.map(x=>x.id===a.id?{...x,photo_url:publicUrl}:x));}
                            }catch(err){alert("Error saving photo: "+err.message);}
                            setUploadingPhoto(null);
                          }}/>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab==="qr"&&(
            <div>
              <div style={{display:"flex",gap:6,marginBottom:12}}>
                {[{id:"checkin",label:"⏱ Check-In"},{id:"athlete",label:"👤 Athlete Portal"}].map(t=>(
                  <button key={t.id} onClick={()=>setQrType(t.id)} style={{flex:1,padding:"10px 6px",borderRadius:10,border:"1px solid "+(qrType===t.id?ORANGE:"#252525"),background:qrType===t.id?ORANGE:"#111",color:qrType===t.id?"#fff":"#666",fontSize:12,fontWeight:qrType===t.id?700:400,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+ORANGE+"33"}}>
                <div style={{background:"linear-gradient(140deg,"+ORANGE+"30,"+ORANGE+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+ORANGE+","+ORANGE+"44,transparent)"}}/>
                  <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="smartphone" size={66} color="#fff"/></div>
                  <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+ORANGE+"12,transparent 70%)",pointerEvents:"none"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                    <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+ORANGE+"44,"+ORANGE+"22)",border:"1px solid "+ORANGE+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+ORANGE+"33"}}>📱</div>
                    <div>
                      <div style={{fontSize:8,color:ORANGE,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>{qrType==="checkin"?"Check-In":"Athlete Portal"}</div>
                      <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>{qrType==="checkin"?"Check-In QR":"Portal QR"}</div>
                      <div style={{fontSize:11,color:"#666",marginTop:1}}>{qrType==="checkin"?"Show at the door — athletes scan and check in.":"Athletes scan to log in and view their profile."}</div>
                    </div>
                  </div>
                </div>
                <div style={{background:"#111",padding:"16px 18px",textAlign:"center"}}>
                  <div style={{background:"#1a1a1a",borderRadius:12,padding:"20px",display:"inline-block",marginBottom:12,border:"1px solid #333"}}>
                    {qrDataUrl?<img src={qrDataUrl} alt="QR Code" style={{width:220,height:220,display:"block"}}/>:<div style={{width:220,height:220,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#555"}}>Generating...</div>}
                  </div>
                  <div style={{fontSize:11,color:"#555",marginBottom:16}}>{qrType==="checkin"?"tfcollegegroup.com/checkin":"tfcollegegroup.com/athlete"}</div>
                  <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                    <button onClick={()=>setQrFullscreen(true)} style={{padding:"10px 20px",borderRadius:10,border:"none",background:"#1a1a1a",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"Georgia,serif",border:"1px solid #333"}}>
                      ⛶ Display at door
                    </button>
                    {qrDataUrl&&(
                      <a href={qrDataUrl} download={"tf-"+qrType+"-qr.png"} style={{padding:"10px 20px",borderRadius:10,border:"0.5px solid #333",background:"#1a1a1a",color:"#aaa",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"Georgia,serif",textDecoration:"none",display:"inline-block"}}>
                        ↓ Download
                      </a>
                    )}
                  </div>
                </div>
              </div>
              {(()=>{
                const todayRecs=attendance.filter(r=>r.date===attDate);
                const early=todayRecs.filter(r=>r.status==="early").length;
                const late=todayRecs.filter(r=>r.status==="late").length;
                const total=athletes.filter(a=>a.status==="active").length;
                return(
                  <div style={{background:"#111",borderRadius:20,padding:"1.25rem",marginBottom:12,border:"0.5px solid #252525"}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#555",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:10}}>Today's check-ins (live)</div>
                    <div style={{display:"flex",gap:10}}>
                      <div style={{flex:1,textAlign:"center",padding:"12px 8px",background:GREEN+"22",borderRadius:10,border:"0.5px solid "+GREEN+"33"}}>
                        <div style={{fontSize:28,fontWeight:700,color:GREEN}}>{early}</div>
                        <div style={{fontSize:11,color:GREEN}}>Early</div>
                      </div>
                      <div style={{flex:1,textAlign:"center",padding:"12px 8px",background:RED+"22",borderRadius:10,border:"0.5px solid "+RED+"33"}}>
                        <div style={{fontSize:28,fontWeight:700,color:RED}}>{late}</div>
                        <div style={{fontSize:11,color:RED}}>Late</div>
                      </div>
                      <div style={{flex:1,textAlign:"center",padding:"12px 8px",background:"#1a1a1a",borderRadius:10,border:"0.5px solid #252525"}}>
                        <div style={{fontSize:28,fontWeight:700,color:"#666"}}>{total-early-late}</div>
                        <div style={{fontSize:11,color:"#555"}}>Not in</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
              <div style={{background:"#111",borderRadius:20,padding:"14px 18px",border:"0.5px solid #252525"}}>
                <div style={{fontSize:11,fontWeight:700,color:"#555",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:10}}>How it works</div>
                {["Show this QR on your phone or iPad at the door","Athletes scan with their camera — no app needed","They tap their name and check in instantly","Early / Late is determined automatically by time","Attendance updates on your coach dashboard live"].map((s,i)=>(
                  <div key={i} style={{display:"flex",gap:8,marginBottom:6}}>
                    <div style={{width:18,height:18,borderRadius:"50%",background:ORANGE,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff",flexShrink:0}}>{i+1}</div>
                    <div style={{fontSize:12,color:"#777"}}>{s}</div>
                  </div>
                ))}
              </div>
              <div style={{background:"#111",borderRadius:20,padding:"16px 18px",marginTop:12,border:"1px solid #00aff033"}}>
                <div style={{fontSize:11,fontWeight:700,color:"#00aff0",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:6}}>💬 GroupMe Invite Link</div>
                <div style={{fontSize:11,color:"#555",marginBottom:10}}>This link appears in the athlete portal and home page. Update it here whenever GroupMe gives you a new code.</div>
                <a href={groupmeLink} target="_blank" rel="noreferrer" style={{display:"block",padding:"8px 12px",borderRadius:8,background:"#00aff011",border:"0.5px solid #00aff022",fontSize:11,color:"#00aff0",textDecoration:"none",marginBottom:10,wordBreak:"break-all"}}>{groupmeLink}</a>
                <input value={groupmeLinkInput} onChange={e=>setGroupmeLinkInput(e.target.value)} placeholder="https://groupme.com/join_group/..." style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"0.5px solid #333",fontSize:12,background:"#1a1a1a",color:"#ddd",boxSizing:"border-box",marginBottom:8,fontFamily:"Georgia,serif"}}/>
                <button onClick={saveGroupmeLink} disabled={groupmeLinkSaving||!groupmeLinkInput.trim()} style={{width:"100%",padding:"10px",borderRadius:10,border:"none",background:groupmeLinkSaved?"#1E6B3A":"#00aff0",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                  {groupmeLinkSaved?"✓ Link updated!":groupmeLinkSaving?"Saving...":"Update GroupMe Link →"}
                </button>
              </div>
            </div>
          )}

          {/* Fullscreen QR overlay */}
          {qrFullscreen&&(
            <div onClick={()=>setQrFullscreen(false)} style={{position:"fixed",inset:0,background:"#fff",zIndex:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,cursor:"pointer"}}>
              <div style={{fontSize:13,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.1em"}}>TF College Group · {qrType==="checkin"?"Check In":"Athlete Portal"}</div>
              {qrDataUrl&&<img src={qrDataUrl} alt="QR Code" style={{width:"min(80vw,80vh)",height:"min(80vw,80vh)"}}/>}
              <div style={{fontSize:15,fontWeight:600,color:"#1a1a1a"}}>
                {qrType==="checkin"?"tfcollegegroup.com/checkin":"tfcollegegroup.com/athlete"}
              </div>
              {(()=>{
                const todayRecs=attendance.filter(r=>r.date===attDate);
                const early=todayRecs.filter(r=>r.status==="early").length;
                const late=todayRecs.filter(r=>r.status==="late").length;
                return early+late>0?(
                  <div style={{display:"flex",gap:16,fontSize:13}}>
                    <span style={{color:GREEN,fontWeight:600}}>✓ {early} early</span>
                    {late>0&&<span style={{color:RED,fontWeight:600}}>⚠ {late} late</span>}
                  </div>
                ):null;
              })()}
              <div style={{fontSize:11,color:"#ccc"}}>Tap anywhere to close</div>
            </div>
          )}

          {tab==="engagement"&&(
            <div>
              <div style={{borderRadius:20,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+PUR+"33"}}>
                <div style={{background:"linear-gradient(140deg,"+PUR+"30,"+PUR+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+PUR+","+PUR+"44,transparent)"}}/>
                  <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="barChart" size={66} color="#fff"/></div>
                  <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+PUR+"12,transparent 70%)",pointerEvents:"none"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                    <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+PUR+"44,"+PUR+"22)",border:"1px solid "+PUR+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+PUR+"33"}}>📊</div>
                    <div>
                      <div style={{fontSize:8,color:PUR,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>App Usage</div>
                      <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Athlete Engagement</div>
                      <div style={{fontSize:11,color:"#666",marginTop:1}}>Goals, notes, and photos</div>
                    </div>
                  </div>
                </div>
                <div style={{background:"#111",padding:"16px 18px"}}>
                  <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:8,marginBottom:8,padding:"0 4px"}}>
                    <div style={{fontSize:11,fontWeight:500,color:"#555",textTransform:"uppercase",letterSpacing:"0.04em"}}>Athlete</div>
                    <div style={{fontSize:11,fontWeight:500,color:"#555",textTransform:"uppercase",letterSpacing:"0.04em",textAlign:"center"}}>Goals</div>
                    <div style={{fontSize:11,fontWeight:500,color:"#555",textTransform:"uppercase",letterSpacing:"0.04em",textAlign:"center"}}>Notes</div>
                    <div style={{fontSize:11,fontWeight:500,color:"#555",textTransform:"uppercase",letterSpacing:"0.04em",textAlign:"center"}}>Photo</div>
                  </div>
                  {engAthletes.map((a,i)=>{
                    const hasGoal=!!(a.athletic_goal||a.character_goal);
                    const noteCount=[1,2,3,4,5,6].filter(n=>a["mindset_note_"+n]).length;
                    const hasPhoto=!!a.photo_url;
                    return(
                      <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:8,padding:"10px 4px",borderBottom:i<engAthletes.length-1?"0.5px solid #1e1e1e":"none",alignItems:"center"}}>
                        <div style={{fontSize:13,fontWeight:500,color:"#ddd"}}>{a.name}</div>
                        <div style={{textAlign:"center",fontSize:14}}>{hasGoal?"✅":"⬜"}</div>
                        <div style={{textAlign:"center"}}><span style={{fontSize:12,fontWeight:600,color:noteCount>0?PUR:"#333"}}>{noteCount}</span></div>
                        <div style={{textAlign:"center",fontSize:14}}>{hasPhoto?"📸":"⬜"}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}


          {tab==="anvil"&&(()=>{
            const ANVIL_CATS=[
              {id:"Effort",     emoji:"🔥",color:"#E8720C",desc:"Left everything on the floor"},
              {id:"Performance",emoji:"🏆",color:GOLD,    desc:"Hit a mark nobody else reached"},
              {id:"Leadership", emoji:"👑",color:"#C084FC",desc:"Elevated everyone around them"},
              {id:"Consistency",emoji:"💪",color:GREEN,   desc:"Showed up every single time"},
              {id:"Character",  emoji:"🧠",color:STEEL,   desc:"Did the hard thing without being asked"},
            ];
            const catInfo=(id)=>ANVIL_CATS.find(c=>c.id===id)||ANVIL_CATS[0];
            const indivAnvil=anvil.filter(a=>a.type==="individual");
            return(
            <div>
              {/* Award form */}
              <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+GOLD+"33"}}>
                <div style={{background:"linear-gradient(140deg,"+GOLD+"30,"+GOLD+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GOLD+","+GOLD+"44,transparent)"}}/>
                  <div style={{position:"absolute",bottom:-10,right:-8,fontSize:72,opacity:0.08,lineHeight:1,userSelect:"none",filter:"saturate(0)"}}>⚒</div>
                  <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+GOLD+"12,transparent 70%)",pointerEvents:"none"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                    <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+GOLD+"44,"+GOLD+"22)",border:"1px solid "+GOLD+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+GOLD+"33"}}>⚒️</div>
                    <div>
                      <div style={{fontSize:8,color:GOLD,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Bi-Weekly Honor</div>
                      <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Award the Anvil</div>
                      <div style={{fontSize:11,color:"#666",marginTop:1}}>Earned. Not given. The highest individual honor in TF College Group.</div>
                    </div>
                  </div>
                </div>
                <div style={{background:"#111",padding:"16px 18px"}}>
                  <div style={{fontSize:11,color:"#666",marginBottom:8}}>Tap to select athlete</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
                    {athletes.filter(a=>a.status==="active").map(a=>{
                      const isSelected=anvilWinner===a.name;
                      const timesWon=indivAnvil.filter(w=>w.athlete_name===a.name).length;
                      return(
                        <button key={a.id} onClick={()=>setAnvilWinner(isSelected?"":a.name)} style={{padding:"8px 4px",borderRadius:10,border:"2px solid "+(isSelected?GOLD:"#252525"),background:isSelected?"#1f1700":"#1a1a1a",cursor:"pointer",fontFamily:"Georgia,serif",textAlign:"center",position:"relative"}}>
                          <div style={{width:40,height:40,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,margin:"0 auto 4px",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:500,color:"#fff",border:isSelected?"2px solid "+GOLD:"none"}}>
                            {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(a.name||"?")[0]}
                          </div>
                          <div style={{fontSize:10,fontWeight:500,color:isSelected?GOLD:"#aaa",lineHeight:1.2}}>{a.name.split(" ")[0]}</div>
                          {timesWon>0&&<div style={{fontSize:9,color:GOLD}}>⚒ ×{timesWon}</div>}
                          {isSelected&&<div style={{position:"absolute",top:3,right:3,fontSize:12}}>⭐</div>}
                        </button>
                      );
                    })}
                  </div>
                  {anvilWinner&&(
                    <div style={{background:"#1f1700",borderRadius:10,padding:"10px 12px",marginBottom:12,border:"0.5px solid "+GOLD+"44",display:"flex",alignItems:"center",gap:8}}>
                      <div style={{fontSize:20}}>⚒</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,color:GOLD,fontWeight:700}}>{anvilWinner}</div>
                        <div style={{fontSize:11,color:"#888",marginTop:1}}>
                          {indivAnvil.filter(w=>w.athlete_name===anvilWinner).length>0
                            ?"Won it "+(indivAnvil.filter(w=>w.athlete_name===anvilWinner).length)+" time"+(indivAnvil.filter(w=>w.athlete_name===anvilWinner).length!==1?"s":"")+" before"
                            :"First time winner — make it count"}
                        </div>
                      </div>
                    </div>
                  )}
                  <div style={{marginBottom:10}}>
                    <div style={{fontSize:11,color:"#666",marginBottom:6}}>Reason category</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                      {ANVIL_CATS.map(c=>(
                        <button key={c.id} onClick={()=>setAnvilCategory(c.id)} style={{padding:"8px 10px",borderRadius:10,border:"1.5px solid "+(anvilCategory===c.id?c.color+"88":"#252525"),background:anvilCategory===c.id?c.color+"18":"#1a1a1a",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:16}}>{c.emoji}</span>
                          <div>
                            <div style={{fontSize:11,fontWeight:700,color:anvilCategory===c.id?c.color:"#aaa"}}>{c.id}</div>
                            <div style={{fontSize:9,color:"#555"}}>{c.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{marginBottom:8}}>
                    <div style={{fontSize:11,color:"#666",marginBottom:4}}>Week / date</div>
                    <input value={anvilDate} onChange={e=>setAnvilDate(e.target.value)} placeholder="e.g. Week 1 · June 2" style={{width:"100%",padding:"8px",fontSize:13,border:"0.5px solid #333",borderRadius:8,background:"#1a1a1a",color:"#ddd",fontFamily:"Georgia,serif",boxSizing:"border-box"}}/>
                  </div>
                  <div style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <div style={{fontSize:11,color:"#666"}}>Why they earned it <span style={{color:RED}}>*</span></div>
                      <div style={{fontSize:10,color:anvilNote.length>20?GOLD:"#444"}}>{anvilNote.length} chars</div>
                    </div>
                    <textarea value={anvilNote} onChange={e=>setAnvilNote(e.target.value)} placeholder="Be specific. What did they do that nobody else did this week? This becomes part of their permanent record." style={{width:"100%",minHeight:80,padding:"10px",fontSize:13,border:"0.5px solid "+(anvilNote.length>10?"#444":"#333"),borderRadius:8,background:"#1a1a1a",color:"#ddd",fontFamily:"Georgia,serif",resize:"vertical",boxSizing:"border-box",lineHeight:1.6}}/>
                    <div style={{fontSize:10,color:"#444",marginTop:4,fontStyle:"italic"}}>Athletes can see exactly what you write here.</div>
                  </div>
                  <button onClick={awardAnvil} disabled={!anvilWinner||!anvilNote.trim()} style={{width:"100%",padding:"13px",borderRadius:8,border:"none",background:(anvilWinner&&anvilNote.trim())?"linear-gradient(135deg,"+GOLD+","+GOLD+"cc)":"#252525",color:(anvilWinner&&anvilNote.trim())?"#1a1a1a":"#555",fontSize:14,fontWeight:700,cursor:(anvilWinner&&anvilNote.trim())?"pointer":"not-allowed",fontFamily:"Georgia,serif",letterSpacing:"0.02em"}}>
                    ⚒ Award The Anvil
                  </button>
                </div>
              </div>

              {/* Never won section */}
              {(()=>{
                const winners=new Set(indivAnvil.map(w=>w.athlete_name));
                const neverWon=athletes.filter(a=>a.status==="active"&&!winners.has(a.name));
                if(!neverWon.length)return null;
                return(
                  <div style={{background:"#111",borderRadius:20,padding:"1.25rem",marginBottom:12,border:"0.5px solid #252525"}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#fff",marginBottom:2}}>Yet to be recognized</div>
                    <div style={{fontSize:12,color:"#555",marginBottom:10}}>{neverWon.length} athlete{neverWon.length!==1?"s":""} still waiting for their first</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                      {neverWon.map((a,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:20,background:"#1a1a1a",border:"0.5px solid #252525"}}>
                          <div style={{width:22,height:22,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",fontWeight:500,flexShrink:0}}>
                            {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(a.name||"?")[0]}
                          </div>
                          <span style={{fontSize:12,color:"#ddd"}}>{a.name.split(" ")[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Hall of Fame */}
              <div style={{borderRadius:20,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+GOLD+"33"}}>
                <div style={{background:"linear-gradient(140deg,"+GOLD+"20,"+GOLD+"08,#0d0d0d)",padding:"14px 18px",borderBottom:"0.5px solid #1e1e1e",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,color:GOLD,textTransform:"uppercase",letterSpacing:"0.14em"}}>Hall of Fame</div>
                    <div style={{fontSize:11,color:"#555",marginTop:1}}>Every winner. Every reason.</div>
                  </div>
                  <div style={{fontSize:10,color:"#444"}}>{indivAnvil.length} award{indivAnvil.length!==1?"s":""}</div>
                </div>
                <div style={{background:"#0e0e0e"}}>
                  {indivAnvil.length===0&&<div style={{fontSize:13,color:"#444",textAlign:"center",padding:"2rem 1rem"}}>No Anvil winners yet. The first one will be earned on the floor.</div>}
                  {indivAnvil.map((w,i)=>{
                    const ath=athletes.find(a=>a.name===w.athlete_name);
                    const timesWon=indivAnvil.filter(x=>x.athlete_name===w.athlete_name).length;
                    const prevWinner=i>0?indivAnvil[i-1]:null;
                    const isStreak=prevWinner&&prevWinner.athlete_name===w.athlete_name;
                    const cat=catInfo(w.athlete_role);
                    const isCurrent=i===0;
                    return(
                      <div key={i} style={{padding:"14px 18px",borderBottom:"0.5px solid #1a1a1a",background:isCurrent?"#0f0e00":"transparent"}}>
                        <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                          <div style={{width:44,height:44,borderRadius:"50%",background:isCurrent?"#1f1700":"#111",border:"2px solid "+(isCurrent?GOLD:"#2a2a2a"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:isCurrent?GOLD:"#666",fontWeight:600,flexShrink:0,overflow:"hidden",boxShadow:isCurrent?"0 0 16px "+GOLD+"44":"none"}}>
                            {ath?.photo_url?<img src={ath.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(w.athlete_name||"?")[0]}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:4}}>
                              <div style={{fontSize:14,fontWeight:700,color:isCurrent?GOLD:"#ddd"}}>{w.athlete_name}</div>
                              {isCurrent&&<span style={{fontSize:9,background:GOLD+"22",color:GOLD,padding:"2px 7px",borderRadius:20,fontWeight:700,letterSpacing:"0.05em"}}>⚡ CURRENT</span>}
                              {isStreak&&<span style={{fontSize:9,background:"#2a1000",color:"#E8720C",padding:"2px 7px",borderRadius:20}}>🔥 Back to back</span>}
                              {timesWon>1&&<span style={{fontSize:9,background:"#1a1a1a",color:"#888",padding:"2px 7px",borderRadius:20}}>⚒ ×{timesWon}</span>}
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                              <span style={{fontSize:10,background:cat.color+"20",color:cat.color,padding:"2px 8px",borderRadius:20,fontWeight:600,border:"0.5px solid "+cat.color+"44"}}>{cat.emoji} {cat.id}</span>
                              <span style={{fontSize:10,color:"#555"}}>{w.date_awarded}</span>
                            </div>
                            {w.note&&(
                              <div style={{background:isCurrent?GOLD+"0D":"#111",borderRadius:8,padding:"8px 10px",borderLeft:"2px solid "+(isCurrent?GOLD:"#333"),marginBottom:anvilPrizes[String(w.id)]?6:0}}>
                                <div style={{fontSize:9,color:isCurrent?GOLD+"88":"#444",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>Why they earned it</div>
                                <div style={{fontSize:12,color:isCurrent?"#e8d5a0":"#aaa",lineHeight:1.6,fontStyle:"italic"}}>"{w.note}"</div>
                              </div>
                            )}
                            {anvilPrizes[String(w.id)]&&(()=>{
                              const ps=anvilPrizes[String(w.id)];
                              const PRIZE_EMOJIS={tee:"🎽",shorts:"🩳",dicks:"🏪",food_gc:"🍽️"};
                              return(
                                <div style={{display:"inline-flex",alignItems:"center",gap:6,background:isCurrent?GOLD+"15":"#161616",borderRadius:8,padding:"5px 10px",border:"1px solid "+(isCurrent?GOLD+"44":"#252525"),marginTop:2}}>
                                  <span style={{fontSize:14}}>{PRIZE_EMOJIS[ps.prize]||"🎁"}</span>
                                  <span style={{fontSize:11,color:isCurrent?GOLD:"#888",fontWeight:600}}>{ps.label}</span>
                                  {ps.size&&<span style={{fontSize:10,color:"#555"}}>· {ps.size}</span>}
                                </div>
                              );
                            })()}
                          </div>
                          <button onClick={async()=>{
                            if(!window.confirm("Remove this Anvil award?"))return;
                            try{await supabase.from("anvil").delete().eq("id",w.id);}catch(e){}
                            setAnvil(p=>p.filter(x=>x.id!==w.id));
                          }} style={{background:"transparent",border:"none",color:"#333",cursor:"pointer",fontSize:14,padding:"4px",flexShrink:0}}>✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            );
          })()}


          {tab==="inbox"&&(
            <div>
              {inboxNewIds.size>0&&(
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,padding:"10px 14px",borderRadius:12,background:PUR+"14",border:"1px solid "+PUR+"33"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:PUR,flexShrink:0,boxShadow:"0 0 8px "+PUR}}/>
                  <span style={{fontSize:12.5,color:"#ddd",fontWeight:600}}>{inboxNewIds.size} new {inboxNewIds.size===1?"message":"messages"} since your last visit</span>
                </div>
              )}
              {/* Unread counts + filter */}
              <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                {[
                  {id:"all",label:"All",count:inbox.length},
                  {id:"injury",label:"🤕 Injuries",count:injuries.length,color:RED},
                  {id:"message",label:"💬 Messages",count:messages.length,color:PUR},
                  {id:"prayer",label:"🙏 Prayers",count:prayers.length,color:GREEN},
                ].map(f=>(
                  <button key={f.id} onClick={()=>setInboxFilter(f.id)} style={{padding:"6px 12px",borderRadius:8,border:"0.5px solid "+(inboxFilter===f.id?(f.color||GOLD):"#333"),background:inboxFilter===f.id?(f.color||"#1a1a1a"):"#111",color:inboxFilter===f.id?"#fff":"#666",fontSize:12,fontWeight:inboxFilter===f.id?600:400,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                    {f.label} {f.count>0&&<span style={{background:inboxFilter===f.id?"rgba(255,255,255,0.2)":"#222",borderRadius:10,padding:"0 5px",fontSize:10,color:inboxFilter===f.id?"#fff":"#555"}}>{f.count}</span>}
                  </button>
                ))}
              </div>

              {/* Athlete filter */}
              <div style={{marginBottom:12,display:"flex",gap:8,alignItems:"center"}}>
                <select value={inboxAthFilter} onChange={e=>setInboxAthFilter(e.target.value)} style={{flex:1,padding:"8px",fontSize:12,border:"0.5px solid #333",borderRadius:8,background:"#1a1a1a",color:"#ddd",fontFamily:"Georgia,serif"}}>
                  <option value="">All athletes</option>
                  {athletes.filter(a=>a.status==="active").map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <button onClick={async()=>{
                  if(!window.confirm("Mark all as done and clear inbox?"))return;
                  await Promise.all(inbox.map(item=>supabase.from("inbox").update({done:true}).eq("id",item.id)));
                  setInbox([]);
                }} style={{padding:"8px 12px",borderRadius:8,border:"0.5px solid #333",background:"#111",color:"#666",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif",flexShrink:0}}>
                  Mark all done
                </button>
              </div>

              {/* Filtered inbox */}
              {(()=>{
                const archiveItem=async(item)=>{
                  await supabase.from("inbox").update({done:true}).eq("id",item.id);
                  setInbox(p=>p.filter(x=>x.id!==item.id));
                };
                const priorityItem=async(item)=>{
                  const newPriority=!item.priority;
                  try{await supabase.from("inbox").update({priority:newPriority}).eq("id",item.id);}catch(e){}
                  setInbox(p=>p.map(x=>x.id===item.id?{...x,priority:newPriority}:x));
                };
                let filtered=[...inbox].sort((a,b)=>(b.priority?1:0)-(a.priority?1:0));
                if(inboxFilter!=="all") filtered=filtered.filter(x=>x.type===inboxFilter);
                if(inboxAthFilter) filtered=filtered.filter(x=>x.athlete_id===inboxAthFilter);
                const inj=filtered.filter(x=>x.type==="injury");
                const msgs=filtered.filter(x=>x.type==="message");
                const prays=filtered.filter(x=>x.type==="prayer");
                const other=filtered.filter(x=>!["injury","message","prayer"].includes(x.type));
                return(
                  <>
                    {inj.length>0&&(
                      <div style={{background:"#111",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #1e1e1e",borderTop:"3px solid "+RED}}>
                        <div style={{display:"flex",alignItems:"center",gap:7,fontSize:13,fontWeight:600,color:RED,marginBottom:10}}><Icon name="alertTriangle" size={14} color={RED}/>Injury flags · {inj.length}</div>
                        {inj.map((item,i)=><InboxItem key={i} item={item} color={RED} bg="#1a0808" type="injury" onReply={replyToInbox} onGenerate={(prompt,cb)=>generateReply(prompt,cb,"inj-"+item.id)} genLoading={genLoading} loadKey={"inj-"+item.id} onArchive={archiveItem} onPriority={priorityItem} athletes={athletes} isNew={inboxNewIds.has(item.id)}/>)}
                      </div>
                    )}
                    {msgs.length>0&&(
                      <div style={{background:"#111",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #1e1e1e",borderTop:"3px solid "+PUR}}>
                        <div style={{display:"flex",alignItems:"center",gap:7,fontSize:13,fontWeight:600,color:PUR,marginBottom:10}}><Icon name="chat" size={14} color={PUR}/>Messages · {msgs.length}</div>
                        {msgs.map((item,i)=><InboxItem key={i} item={item} color={PUR} bg="#13122a" type="message" onReply={replyToInbox} onGenerate={(prompt,cb)=>generateReply(prompt,cb,"msg-"+item.id)} genLoading={genLoading} loadKey={"msg-"+item.id} onArchive={archiveItem} onPriority={priorityItem} athletes={athletes} isNew={inboxNewIds.has(item.id)}/>)}
                      </div>
                    )}
                    {prays.length>0&&(
                      <div style={{background:"#111",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #1e1e1e",borderTop:"3px solid "+GREEN}}>
                        <div style={{display:"flex",alignItems:"center",gap:7,fontSize:13,fontWeight:600,color:GREEN,marginBottom:10}}><Icon name="pray" size={14} color={GREEN}/>Prayer requests · {prays.length}</div>
                        {prays.map((item,i)=><InboxItem key={i} item={item} color={GREEN} bg="#0d1a10" type="prayer" onReply={replyToInbox} onGenerate={(prompt,cb)=>generateReply(prompt,cb,"pry-"+item.id)} genLoading={genLoading} loadKey={"pry-"+item.id} onArchive={archiveItem} onPriority={priorityItem} athletes={athletes} isNew={inboxNewIds.has(item.id)}/>)}
                      </div>
                    )}
                    {other.length>0&&(
                      <div style={{background:"#111",borderRadius:12,padding:"1.25rem",border:"0.5px solid #1e1e1e"}}>
                        <div style={{fontSize:13,fontWeight:600,color:"#666",marginBottom:10}}>Other · {other.length}</div>
                        {other.map((item,i)=><InboxItem key={i} item={item} color="#888" bg="#1a1a1a" type="message" onReply={replyToInbox} onGenerate={(prompt,cb)=>generateReply(prompt,cb,"oth-"+item.id)} genLoading={genLoading} loadKey={"oth-"+item.id} onArchive={archiveItem} onPriority={priorityItem} athletes={athletes} isNew={inboxNewIds.has(item.id)}/>)}
                      </div>
                    )}
                    {filtered.length===0&&(
                      <EmptyState icon="checkSquare" color={GREEN} title="Inbox is clear" hint="No open messages, injuries, or prayer requests right now. New ones will land here." />
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {tab==="leaderboard"&&(
            <div>
              {/* Sort options */}
              <div style={{display:"flex",gap:6,marginBottom:12,overflowX:"auto"}}>
                {[
                  {id:"early",label:"Early arrivals"},
                  {id:"streak",label:"Current streak"},
                  {id:"best",label:"Best streak"},
                  {id:"callout",label:"Most callouts"},
                ].map(s=>(
                  <button key={s.id} onClick={()=>setLbSort(s.id)} style={{padding:"6px 12px",borderRadius:8,border:"0.5px solid "+(lbSort===s.id?GOLD:"#333"),background:lbSort===s.id?GOLD:"#111",color:lbSort===s.id?"#1a1a1a":"#666",fontSize:12,fontWeight:lbSort===s.id?600:400,cursor:"pointer",fontFamily:"Georgia,serif",flexShrink:0}}>
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Most improved */}
              {(()=>{
                const improved=leaderboard.filter(lb=>lb.current_streak>=3&&lb.current_streak>=(lb.best_streak||0)*0.8).sort((a,b)=>(b.current_streak||0)-(a.current_streak||0))[0];
                if(!improved)return null;
                const ath=athletes.find(a=>a.name===improved.athletes?.name);
                return(
                  <div style={{background:"linear-gradient(135deg,#1f1700,#2a2000)",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"1px solid "+GOLD+"44"}}>
                    <div style={{fontSize:11,color:GOLD,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>🔥 Most improved — on fire</div>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:44,height:44,borderRadius:"50%",background:STEEL,overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:500,color:"#fff",border:"2px solid "+GOLD}}>
                        {ath?.photo_url?<img src={ath.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(improved.athletes?.name||"?")[0]}
                      </div>
                      <div>
                        <div style={{fontSize:15,fontWeight:600,color:GOLD}}>{improved.athletes?.name}</div>
                        <div style={{fontSize:12,color:"#888"}}>🔥 {improved.current_streak} day streak · {improved.early_count||0} early total</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div style={{borderRadius:20,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+GOLD+"33"}}>
                <div style={{background:"linear-gradient(140deg,"+GOLD+"22,"+GOLD+"08,#0d0d0d)",padding:"16px 18px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GOLD+","+GOLD+"44,transparent)"}}/>
                  <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.07,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="trophy" size={66} color="#fff"/></div>
                  <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                    <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+GOLD+"44,"+GOLD+"22)",border:"1px solid "+GOLD+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+GOLD+"33"}}>🏆</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:8,color:GOLD,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Rankings</div>
                      <div style={{fontSize:18,fontWeight:900,color:"#fff",letterSpacing:"-0.02em",lineHeight:1.1}}>{lbSort==="early"?"Early arrivals":lbSort==="streak"?"Current streak":lbSort==="best"?"Best streak":"Most callouts"}</div>
                    </div>
                  </div>
                </div>
                <div style={{background:"#0e0e0e",padding:"0 18px"}}>
                  {leaderboard.length===0&&<div style={{fontSize:13,color:"#444",textAlign:"center",padding:"1.5rem 0"}}>No data yet.</div>}
                  {[...leaderboard].sort((a,b)=>{
                    if(lbSort==="early")return(b.early_count||0)-(a.early_count||0);
                    if(lbSort==="streak")return(b.current_streak||0)-(a.current_streak||0);
                    if(lbSort==="best")return(b.best_streak||0)-(a.best_streak||0);
                    return(b.callout_count||0)-(a.callout_count||0);
                  }).map((lb,i)=>{
                    const ath=athletes.find(a=>a.name===lb.athletes?.name);
                    const maxVal=Math.max(...leaderboard.map(x=>lbSort==="early"?x.early_count||0:lbSort==="streak"?x.current_streak||0:lbSort==="best"?x.best_streak||0:x.callout_count||0),1);
                    const val=lbSort==="early"?lb.early_count||0:lbSort==="streak"?lb.current_streak||0:lbSort==="best"?lb.best_streak||0:lb.callout_count||0;
                    const pct=Math.round((val/maxVal)*100);
                    return(
                      <div key={i} style={{padding:"12px 0",borderBottom:"0.5px solid #1a1a1a"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                          <div style={{width:24,fontSize:13,fontWeight:700,color:i===0?GOLD:i===1?"#999":i===2?"#CD7F32":"#555",textAlign:"center",flexShrink:0}}>
                            {i===0?"🥇":i===1?"🥈":i===2?"🥉":"#"+(i+1)}
                          </div>
                          <div style={{width:34,height:34,borderRadius:"50%",background:ath?.role==="forge"?RED:STEEL,overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:500,color:"#fff"}}>
                            {ath?.photo_url?<img src={ath.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(lb.athletes?.name||"?")[0]}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                              <div onClick={()=>{const a=athletes.find(x=>x.name===lb.athletes?.name);if(a)openAthleteModal(a);}} style={{fontSize:13,fontWeight:500,color:"#ddd",cursor:"pointer",textDecoration:"underline",textDecorationColor:"#444"}}>{lb.athletes?.name}</div>
                              <div style={{fontSize:13,fontWeight:700,color:lbSort==="callout"?RED:GOLD}}>{val}</div>
                            </div>
                            <div style={{height:5,background:"#222",borderRadius:3,overflow:"hidden"}}>
                              <div style={{height:"100%",width:pct+"%",background:lbSort==="callout"?RED:i===0?GOLD:GREEN,borderRadius:3,transition:"width 0.3s"}}/>
                            </div>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:10,paddingLeft:68,flexWrap:"wrap"}}>
                          <span style={{fontSize:11,color:GREEN}}>🟢 {lb.early_count||0} early</span>
                          <span style={{fontSize:11,color:"#854F0B"}}>🔥 {lb.current_streak||0} streak</span>
                          <span style={{fontSize:11,color:"#555"}}>best {lb.best_streak||0}</span>
                          {(lb.late_count||0)>0&&<span style={{fontSize:11,color:RED}}>{lb.late_count} late</span>}
                          {(lb.callout_count||0)>0&&<span style={{fontSize:11,color:"#555"}}>{lb.callout_count} callouts</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab==="goals"&&(
            <div>
              {/* Search + filter */}
              <div style={{position:"relative",marginBottom:10}}>
                <input value={goalsSearch} onChange={e=>setGoalsSearch(e.target.value)} placeholder="Search athlete..." style={{width:"100%",padding:"10px 12px 10px 34px",borderRadius:10,border:"0.5px solid #2a2a2a",fontSize:13,fontFamily:"Georgia,serif",background:"#111",color:"#ddd",boxSizing:"border-box"}}/>
                <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"#aaa"}}><Icon name="search" size={15} color="rgba(255,255,255,0.4)"/></div>
                {goalsSearch&&<button onClick={()=>setGoalsSearch("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",fontSize:14,color:"#aaa",cursor:"pointer"}}>✕</button>}
              </div>
              <div style={{display:"flex",gap:6,marginBottom:12}}>
                {[
                  {id:"all",label:"All"},
                  {id:"missing",label:"⚠ No goals"},
                  {id:"set",label:"✓ Has goals"},
                ].map(f=>(
                  <button key={f.id} onClick={()=>setGoalsFilter(f.id)} style={{flex:1,padding:"7px",borderRadius:8,border:"0.5px solid "+(goalsFilter===f.id?PUR:"#333"),background:goalsFilter===f.id?PUR:"#111",color:goalsFilter===f.id?"#fff":"#666",fontSize:12,fontWeight:goalsFilter===f.id?600:400,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                    {f.label}
                  </button>
                ))}
              </div>

              {athletes.filter(a=>{
                if(a.status!=="active")return false;
                if(goalsSearch&&!a.name?.toLowerCase().includes(goalsSearch.toLowerCase()))return false;
                if(goalsFilter==="missing")return!a.athletic_goal&&!a.character_goal;
                if(goalsFilter==="set")return!!(a.athletic_goal||a.character_goal);
                return true;
              }).map(a=>{
                const hasGoal=!!(a.athletic_goal||a.character_goal);
                const review=goalReviews[a.id]||"";
                return(
                <div key={a.id} style={{background:"#111",borderRadius:12,padding:"1.25rem",marginBottom:10,border:"0.5px solid #1e1e1e",borderTop:"3px solid "+(hasGoal?GREEN:RED)}}>
                  {/* Header with photo */}
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <div style={{width:38,height:38,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:500,color:"#fff",flexShrink:0,overflow:"hidden"}}>
                      {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(a.name||"?")[0]}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:600,color:"#ddd"}}>{a.name}</div>
                      <div style={{fontSize:12,color:"#666"}}>{a.sport}</div>
                    </div>
                    {/* Review status */}
                    <div style={{display:"flex",gap:4}}>
                      {[{id:"on_track",label:"✓",color:GREEN,bg:"#0d1a10"},{id:"needs_work",label:"!",color:"#854F0B",bg:"#1a1200"},{id:"reviewed",label:"👁",color:PUR,bg:"#13122a"}].map(r=>(
                        <button key={r.id} onClick={async()=>{
                          const newVal=review===r.id?"":r.id;
                          setGoalReviews(p=>({...p,[a.id]:newVal}));
                          try{await supabase.from("athletes").update({goal_review_status:newVal||null}).eq("id",a.id);}catch(e){}
                        }} title={r.id.replace("_"," ")} style={{width:28,height:28,borderRadius:6,border:"0.5px solid "+(review===r.id?r.color:"#333"),background:review===r.id?r.bg:"#1a1a1a",color:review===r.id?r.color:"#555",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {!hasGoal&&(
                    <div style={{background:"#1a0808",borderRadius:8,padding:"8px 12px",marginBottom:10,border:"0.5px solid "+RED+"33"}}>
                      <div style={{fontSize:12,color:RED}}>⚠ No goals set yet — follow up with {a.name.split(" ")[0]}</div>
                    </div>
                  )}

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {[{label:"Athletic goal",goalKey:"athletic_goal",taskKey:"coach_athletic_task",type:"athletic",color:GREEN},{label:"Character goal",goalKey:"character_goal",taskKey:"coach_character_task",type:"character",color:PUR}].map(({label,goalKey,taskKey,type,color})=>(
                      <div key={goalKey}>
                        <div style={{fontSize:11,color:"#666",marginBottom:4}}>{label}</div>
                        <div style={{fontSize:12,color:a[goalKey]?"#ddd":"#444",fontStyle:a[goalKey]?"normal":"italic",padding:"6px 8px",background:"#1a1a1a",borderRadius:6,minHeight:36,marginBottom:6}}>{a[goalKey]||"Not set"}</div>
                        <textarea id={a.id+"-"+type} defaultValue={a[taskKey]||""} placeholder="Write or generate a task..." style={{width:"100%",minHeight:60,padding:"8px",fontSize:12,border:"0.5px solid "+color,borderRadius:6,background:BG,color:"#fff",fontFamily:"Georgia,serif",resize:"vertical",boxSizing:"border-box",marginBottom:6}}/>
                        <div style={{display:"flex",gap:6}}>
                          <button onClick={()=>generateTask(a,type)} disabled={!a[goalKey]||genLoading===a.id+"-"+type} style={{flex:1,padding:"6px",borderRadius:6,border:"0.5px solid "+color,background:"transparent",color:color,fontSize:11,cursor:a[goalKey]?"pointer":"not-allowed",fontFamily:"Georgia,serif",opacity:a[goalKey]?1:0.4}}>
                            {genLoading===a.id+"-"+type?"Generating...":"AI task"}
                          </button>
                          <button onClick={async()=>{const val=document.getElementById(a.id+"-"+type)?.value;if(val){await supabase.from("athletes").update({[taskKey]:val}).eq("id",a.id);alert("Sent to "+a.name+"!");}}} style={{flex:1,padding:"6px",borderRadius:6,border:"none",background:color,color:"#fff",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                            Send →
                          </button>
                        </div>
                        {a[taskKey]&&(
                          <div style={{padding:"6px 8px",background:BG,borderRadius:6,borderLeft:"3px solid "+color,marginTop:6}}>
                            <div style={{fontSize:10,color:color,marginBottom:2}}>Current task</div>
                            <div style={{fontSize:11,color:"#ccc",lineHeight:1.5}}>{a[taskKey]}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                );
              })}
            </div>
          )}

          {tab==="mcastles-post"&&(
            <div>
              {/* Hero banner */}
              <div style={{borderRadius:16,marginBottom:14,overflow:"hidden",border:"1px solid "+ORANGE+"44",position:"relative"}}>
                <div style={{background:"linear-gradient(140deg,#1a0800,#0f0600)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+ORANGE+","+GOLD+",transparent)"}}/>
                  <div style={{position:"absolute",bottom:-10,right:-8,fontSize:72,opacity:0.07,lineHeight:1,userSelect:"none"}}>🍑</div>
                  <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                    <div style={{width:52,height:52,borderRadius:14,background:"linear-gradient(145deg,"+ORANGE+"44,"+ORANGE+"22)",border:"1px solid "+ORANGE+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0,boxShadow:"0 0 20px "+ORANGE+"33"}}>🍑🚀</div>
                    <div>
                      <div style={{fontSize:9,color:ORANGE,textTransform:"uppercase",letterSpacing:"0.22em",fontWeight:900,marginBottom:2}}>MCASTLES</div>
                      <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Photo of the Week</div>
                      <div style={{fontSize:11,color:"#555",marginTop:1}}>Upload · Motivate · Inspire</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Currently live */}
              {mcCurrentPhoto&&(
                <div style={{background:"#111",borderRadius:14,padding:"14px",marginBottom:14,border:"0.5px solid #1e1e1e"}}>
                  <div style={{fontSize:10,color:ORANGE,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:8}}>Currently Live</div>
                  {mcCurrentPhoto.week_label&&<div style={{fontSize:11,color:"#777",marginBottom:6}}>{mcCurrentPhoto.week_label}</div>}
                  {mcCurrentPhoto.day&&<img src={mcCurrentPhoto.day} alt="Current motivational" style={{width:"100%",borderRadius:10,marginBottom:8,display:"block"}}/>}
                  {mcCurrentPhoto.message&&<div style={{fontSize:13,color:"#ccc",fontStyle:"italic",lineHeight:1.6}}>&ldquo;{mcCurrentPhoto.message}&rdquo;</div>}
                </div>
              )}

              {/* Post form */}
              <div style={{background:"#111",borderRadius:14,padding:"16px",border:"0.5px solid "+ORANGE+"33"}}>
                <div style={{fontSize:12,fontWeight:700,color:ORANGE,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.1em"}}>Post New Photo of the Week</div>

                {/* Photo picker */}
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:11,color:"#666",marginBottom:6}}>Photo</div>
                  <label style={{display:"block",cursor:"pointer"}}>
                    <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
                      const f=e.target.files?.[0];
                      if(!f)return;
                      setMcFile(f);
                      setMcPreview(URL.createObjectURL(f));
                      setMcSuccess(false);setMcError("");
                    }}/>
                    {mcPreview?(
                      <div style={{position:"relative"}}>
                        <img src={mcPreview} style={{width:"100%",borderRadius:10,maxHeight:200,objectFit:"cover",display:"block"}}/>
                        <div style={{position:"absolute",bottom:6,right:6,background:"rgba(0,0,0,0.7)",borderRadius:6,padding:"3px 8px",fontSize:11,color:ORANGE}}>tap to change</div>
                      </div>
                    ):(
                      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"18px",borderRadius:10,border:"1px dashed "+ORANGE+"55",background:"#0f0600",color:ORANGE,fontSize:13,fontWeight:600}}>
                        📸 Tap to choose photo
                      </div>
                    )}
                  </label>
                </div>

                {/* Week label */}
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:11,color:"#666",marginBottom:4}}>Week label</div>
                  <input value={mcWeek} onChange={e=>setMcWeek(e.target.value)} placeholder='e.g. "Week 3 — May 2026"'
                    style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"0.5px solid #2a2a2a",fontSize:13,background:"#1a1a1a",color:"#ddd",fontFamily:"Georgia,serif",boxSizing:"border-box"}}/>
                </div>

                {/* Caption */}
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,color:"#666",marginBottom:4}}>Caption / message</div>
                  <textarea value={mcCaption} onChange={e=>setMcCaption(e.target.value)} placeholder="Write something motivational..." rows={3}
                    style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"0.5px solid #2a2a2a",fontSize:13,background:"#1a1a1a",color:"#ddd",fontFamily:"Georgia,serif",resize:"vertical",boxSizing:"border-box"}}/>
                </div>

                {mcError&&<div style={{fontSize:12,color:RED,marginBottom:10,padding:"8px 10px",background:"#1a0808",borderRadius:6,border:"0.5px solid "+RED+"33"}}>{mcError}</div>}
                {mcSuccess&&<div style={{fontSize:12,color:GREEN,marginBottom:10,padding:"8px 10px",background:"#081a0d",borderRadius:6,border:"0.5px solid "+GREEN+"33"}}>✓ Posted! Athletes can see it now.</div>}

                <button
                  disabled={mcUploading||(!mcFile&&!mcCaption.trim())}
                  onClick={()=>postMcPhoto(mcFile||null)}
                  style={{width:"100%",padding:"14px",borderRadius:10,border:"none",background:mcUploading?"#333":ORANGE,color:"#fff",fontSize:15,fontWeight:800,cursor:mcUploading?"not-allowed":"pointer",fontFamily:"Georgia,serif",opacity:(mcUploading||(!mcFile&&!mcCaption.trim()))?0.5:1,letterSpacing:"0.02em"}}>
                  {mcUploading?"⏳ Posting...":"🍑🚀 Post Photo of the Week"}
                </button>
              </div>
            </div>
          )}
          {tab==="injuries"&&(()=>{
            const SORE="#C8941F";
            const activeAthletes=athletes.filter(a=>a.status==="active");
            if(injLoading||!bodyInjuries){return(<div style={{textAlign:"center",padding:"40px",color:"#555",fontSize:13}}>Loading injuries...</div>);}
            const flagged=activeAthletes.filter(a=>{
              const parts=(bodyInjuries||{})[String(a.id)]||{};
              return Object.values(parts).some(p=>p.status==="sore"||p.status==="pain");
            });
            const clear=activeAthletes.filter(a=>{
              const parts=(bodyInjuries||{})[String(a.id)]||{};
              return !Object.values(parts).some(p=>p.status==="sore"||p.status==="pain");
            });
            return(
              <div>
                <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+RED+"33"}}>
                  <div style={{background:"linear-gradient(140deg,"+RED+"30,"+RED+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+RED+","+RED+"44,transparent)"}}/>
                    <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.07,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="activity" size={66} color="#fff"/></div>
                    <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                      <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+RED+"44,"+RED+"22)",border:"1px solid "+RED+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>🩺</div>
                      <div>
                        <div style={{fontSize:8,color:RED,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Athletes</div>
                        <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Injury Check-In</div>
                        <div style={{fontSize:11,color:"#666",marginTop:1}}>
                          {injLoading?"Loading injuries...":`${flagged.length} flagged · ${clear.length} all good`}
                          <button onClick={loadBodyInjuries} style={{marginLeft:10,fontSize:10,color:"#555",background:"transparent",border:"1px solid #333",padding:"2px 8px",borderRadius:8,cursor:"pointer",fontFamily:"Georgia,serif"}}>{injLoading?"...":"↻ Refresh"}</button>
                          {injLoadErr&&<span style={{marginLeft:8,fontSize:10,color:RED}}>Load failed — tap Refresh</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{background:"#111",padding:"16px 18px"}}>
                    {injLoading&&(
                      <div style={{textAlign:"center",padding:"24px",color:"#555",fontSize:13}}>Loading injury data...</div>
                    )}
                    {!injLoading&&flagged.length===0&&(
                      <div style={{textAlign:"center",padding:"24px",color:"#555",fontSize:13,fontStyle:"italic"}}>{injLoadErr?"Failed to load — tap Refresh above":"No athletes have flagged any body parts 💚"}</div>
                    )}
                    {flagged.map(a=>{
                      const parts=bodyInjuries[String(a.id)]||{};
                      const painParts=Object.entries(parts).filter(([,v])=>v.status==="pain");
                      const soreParts=Object.entries(parts).filter(([,v])=>v.status==="sore");
                      const isOpen=injExpanded===a.id;
                      return(
                        <div key={a.id} style={{borderBottom:"0.5px solid #1e1e1e",paddingBottom:12,marginBottom:12}}>
                          <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setInjExpanded(isOpen?null:a.id)}>
                            <div style={{width:38,height:38,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:600,color:"#fff",flexShrink:0,overflow:"hidden"}}>
                              {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(a.name||"?")[0]}
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:13,fontWeight:600,color:"#ddd",marginBottom:4}}>{a.name}</div>
                              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                                {painParts.map(([id])=>(
                                  <span key={id} style={{fontSize:9,background:RED+"22",color:RED,padding:"2px 8px",borderRadius:10,border:"1px solid "+RED+"44",fontWeight:700}}>🔴 {id.replace(/_/g," ")}</span>
                                ))}
                                {soreParts.map(([id])=>(
                                  <span key={id} style={{fontSize:9,background:SORE+"22",color:SORE,padding:"2px 8px",borderRadius:10,border:"1px solid "+SORE+"44",fontWeight:600}}>🟡 {id.replace(/_/g," ")}</span>
                                ))}
                              </div>
                            </div>
                            <div style={{fontSize:12,color:"#555"}}>{isOpen?"▲":"▼"}</div>
                          </div>
                          {isOpen&&(
                            <div style={{marginTop:12,paddingLeft:48}}>
                              {[...painParts,...soreParts].map(([id,v])=>(
                                <div key={id} style={{marginBottom:8,padding:"10px 12px",borderRadius:10,background:"#0e0e0e",border:"1px solid "+(v.status==="pain"?RED+"33":SORE+"33"),borderLeft:"3px solid "+(v.status==="pain"?RED:SORE)}}>
                                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:v.description?6:0}}>
                                    <span style={{fontSize:12,fontWeight:700,color:"#ddd",textTransform:"capitalize"}}>{id.replace(/_/g," ")}</span>
                                    <span style={{fontSize:10,color:v.status==="pain"?RED:SORE,fontWeight:700,background:(v.status==="pain"?RED:SORE)+"18",padding:"2px 8px",borderRadius:8}}>
                                      {v.status==="pain"?"In Pain":"A Little Sore"}{v.pain>0?" · "+v.pain+"/10":""}
                                    </span>
                                  </div>
                                  {v.description&&<div style={{fontSize:12,color:"#777",lineHeight:1.55,fontStyle:"italic"}}>"{v.description}"</div>}
                                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:4}}>
                                    {v.updatedAt&&<div style={{fontSize:9,color:"#444"}}>{new Date(v.updatedAt).toLocaleDateString("en-US",{timeZone:"America/New_York",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</div>}
                                    <button onClick={()=>clearInjuryPart(a.id,id)} style={{fontSize:10,padding:"3px 10px",borderRadius:6,border:"0.5px solid "+GREEN+"55",background:"#081a0d",color:GREEN,cursor:"pointer",fontFamily:"Georgia,serif",marginLeft:"auto"}}>✓ Mark cleared</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {clear.length>0&&flagged.length>0&&(
                      <div style={{paddingTop:8,borderTop:"0.5px solid #1a1a1a"}}>
                        <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>All Good</div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                          {clear.map(a=>(
                            <div key={a.id} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:20,background:"#141414",border:"0.5px solid #1e1e1e"}}>
                              <div style={{width:20,height:20,borderRadius:"50%",background:GREEN+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9}}>✓</div>
                              <span style={{fontSize:11,color:"#666"}}>{a.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {tab==="ironroom"&&(()=>{
            const epley=(w,r)=>r===1?w:Math.round(w*(1+r/30));
            const getCatIR=(name)=>{
              const n=(name||"").toLowerCase();
              if(n.includes("deadlift")||n.includes(" clean")||n.includes("snatch")||n.includes("swing")||n.includes("rdl")||n.includes("hinge"))return "hinge";
              if(n.includes("squat")||n.includes("lunge")||n.includes("step up"))return "lower";
              if(n.includes("bench")||n.includes("press")||n.includes("push")||n.includes("dip")||n.includes("jerk"))return "push";
              if(n.includes("pull")||n.includes("row")||n.includes("curl"))return "pull";
              return null;
            };
            const CATS=[
              {id:"lower",label:"Lower Body",emoji:"🦵"},
              {id:"push",label:"Push",emoji:"💪"},
              {id:"pull",label:"Pull",emoji:"🤜"},
              {id:"hinge",label:"Hinge",emoji:"⛓️"},
            ];
            const filteredAthletes=athletes.filter(a=>a.status==="active"&&(ironRoomGender==="M"?a.gender==="M":a.gender==="F"));
            const athMap={};
            filteredAthletes.forEach(a=>{athMap[a.id]=a;});
            // Build best est1RM per athlete per category
            const catBests={};
            CATS.forEach(c=>{catBests[c.id]={};});
            if(ironRoomData){
              ironRoomData.forEach(row=>{
                if(!athMap[row.athlete_id])return;
                const cat=getCatIR(row.lift);
                if(!cat)return;
                const e1rm=epley(Number(row.weight)||0,Number(row.reps)||1);
                if(!catBests[cat][row.athlete_id]||e1rm>catBests[cat][row.athlete_id].e1rm){
                  catBests[cat][row.athlete_id]={e1rm,lift:row.lift,date:row.date};
                }
              });
            }
            return(
              <div>
                <div style={{borderRadius:20,marginBottom:16,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+GOLD+"33"}}>
                  <div style={{background:"linear-gradient(140deg,"+GOLD+"28,"+GOLD+"0a,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GOLD+","+GOLD+"44,transparent)"}}/>
                    <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.07,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="barbell" size={66} color="#fff"/></div>
                    <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                      <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+GOLD+"44,"+GOLD+"22)",border:"1px solid "+GOLD+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>🏋️</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:8,color:GOLD,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Leaderboard</div>
                        <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Iron Room</div>
                        <div style={{fontSize:11,color:"#666",marginTop:1}}>PR leaderboard by movement category</div>
                      </div>
                      <div style={{display:"flex",gap:6,flexShrink:0}}>
                        {["M","F"].map(g=>(
                          <button key={g} onClick={()=>setIronRoomGender(g)} style={{padding:"6px 14px",borderRadius:10,border:"1px solid "+(ironRoomGender===g?GOLD+"88":"#2a2a2a"),background:ironRoomGender===g?GOLD+"22":"transparent",color:ironRoomGender===g?GOLD:"#555",fontSize:11,fontWeight:ironRoomGender===g?700:400,cursor:"pointer",fontFamily:"Georgia,serif",transition:"all 0.15s"}}>{g==="M"?"Men":"Women"}</button>
                        ))}
                        <button onClick={()=>{setIronRoomData(null);loadIronRoom();}} style={{padding:"6px 10px",borderRadius:10,border:"1px solid #222",background:"transparent",color:"#555",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>{ironRoomLoading?"...":"↻"}</button>
                      </div>
                    </div>
                  </div>
                </div>
                {ironRoomLoading&&(
                  <div style={{textAlign:"center",padding:"40px",color:"#555",fontSize:13}}>Loading...</div>
                )}
                {!ironRoomLoading&&ironRoomData!==null&&CATS.map(cat=>{
                  const entries=Object.entries(catBests[cat.id])
                    .map(([aid,v])=>({athlete:athMap[aid],e1rm:v.e1rm,lift:v.lift,date:v.date}))
                    .filter(e=>e.athlete&&e.e1rm>0)
                    .sort((a,b)=>b.e1rm-a.e1rm);
                  return(
                    <div key={cat.id} style={{marginBottom:16,borderRadius:16,overflow:"hidden",border:"1px solid #1e1e1e",background:"#111"}}>
                      <div style={{padding:"12px 16px",background:"linear-gradient(135deg,#161616,#111)",borderBottom:"1px solid #1e1e1e",display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:20}}>{cat.emoji}</span>
                        <span style={{fontSize:14,fontWeight:800,color:"#ddd",textTransform:"uppercase",letterSpacing:"0.08em"}}>{cat.label}</span>
                        <span style={{fontSize:11,color:"#444",marginLeft:"auto"}}>{entries.length} athlete{entries.length!==1?"s":""}</span>
                      </div>
                      {entries.length===0?(
                        <div style={{padding:"20px 16px",textAlign:"center",color:"#444",fontSize:12,fontStyle:"italic"}}>No data yet</div>
                      ):(
                        <div>
                          {entries.map((e,i)=>{
                            const rank=i+1;
                            const medal=rank===1?"🥇":rank===2?"🥈":rank===3?"🥉":null;
                            const history=(ironRoomData||[]).filter(r=>r.athlete_id===e.athlete.id&&r.lift===e.lift).sort((a,b)=>new Date(a.date)-new Date(b.date));
                            const orms=history.map(r=>epley(Number(r.weight)||0,Number(r.reps)||1));
                            const oMin=orms.length?Math.min(...orms):0;
                            const oMax=orms.length?Math.max(...orms)+1:1;
                            const sW=48,sH=18;
                            const sparkPts=orms.map((o,si)=>{const x=(si/(Math.max(orms.length-1,1)))*sW;const y=sH-((o-oMin)/(Math.max(oMax-oMin,1)))*sH;return`${x},${y}`;}).join(" ");
                            const sparkColor=orms.length>=2&&orms[orms.length-1]>orms[0]?GREEN:orms.length>=2&&orms[orms.length-1]<orms[0]?RED:"#555";
                            return(
                              <div key={e.athlete.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderBottom:i<entries.length-1?"0.5px solid #1a1a1a":"none",background:rank===1?GOLD+"08":"transparent"}}>
                                <div style={{width:28,textAlign:"center",flexShrink:0}}>
                                  {medal?<span style={{fontSize:16}}>{medal}</span>:<span style={{fontSize:12,color:"#444",fontWeight:600}}>{rank}</span>}
                                </div>
                                <div style={{width:32,height:32,borderRadius:"50%",background:e.athlete.role==="forge"?"#C0392B":"#708090",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",flexShrink:0,overflow:"hidden"}}>
                                  {e.athlete.photo_url?<img src={e.athlete.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(e.athlete.name||"?")[0]}
                                </div>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:13,fontWeight:600,color:rank===1?GOLD:"#ccc",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.athlete.name}</div>
                                  <div style={{fontSize:10,color:"#555",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.lift}</div>
                                </div>
                                {orms.length>=2&&(
                                  <svg viewBox={`0 0 ${sW} ${sH}`} style={{width:sW,height:sH,flexShrink:0}}>
                                    <polyline points={sparkPts} fill="none" stroke={sparkColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    {orms.map((o,si)=>{const x=(si/(Math.max(orms.length-1,1)))*sW;const y=sH-((o-oMin)/(Math.max(oMax-oMin,1)))*sH;return<circle key={si} cx={x} cy={y} r={si===orms.length-1?2.5:1.5} fill={si===orms.length-1?"#fff":sparkColor}/>;
                                    })}
                                  </svg>
                                )}
                                <div style={{textAlign:"right",flexShrink:0}}>
                                  <div style={{fontSize:15,fontWeight:900,color:rank===1?GOLD:"#bbb"}}>{e.e1rm}<span style={{fontSize:10,color:"#555",fontWeight:400}}>lb</span></div>
                                  <div style={{fontSize:9,color:"#444"}}>{e.date||"—"}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                {!ironRoomLoading&&ironRoomData!==null&&filteredAthletes.length===0&&(
                  <div style={{textAlign:"center",padding:"32px",color:"#555",fontSize:12,fontStyle:"italic"}}>No {ironRoomGender==="M"?"male":"female"} athletes found.</div>
                )}
              </div>
            );
          })()}

          {tab==="habits"&&(()=>{
            const estNow=new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
            const todayHab=estNow.getFullYear()+"-"+String(estNow.getMonth()+1).padStart(2,"0")+"-"+String(estNow.getDate()).padStart(2,"0");
            const getLast7=()=>{
              const days=[];
              for(let i=6;i>=0;i--){const d=new Date(estNow);d.setDate(estNow.getDate()-i);days.push(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"));}
              return days;
            };
            const last7=getLast7();
            const computeHabitStreak=(map)=>{
              let s=0;
              const c=new Date(estNow);
              while(true){
                const k=c.getFullYear()+"-"+String(c.getMonth()+1).padStart(2,"0")+"-"+String(c.getDate()).padStart(2,"0");
                const row=map[k];
                if(!(row&&row.water&&row.nutrition&&row.sleep!=null&&row.sleep>0))break;
                s++;c.setDate(c.getDate()-1);
              }
              return s;
            };
            if(habitLoading||!habitLogs){return(<div style={{textAlign:"center",padding:"40px",color:"#555",fontSize:13}}>Loading habit data...</div>);}
            const athMaps={};
            (habitLogs||[]).forEach(r=>{
              const aid=r.day;
              if(!athMaps[aid])athMaps[aid]={};
              try{const d=JSON.parse(r.message||"{}");athMaps[aid][r.week_label]={water:d.water===true,nutrition:d.nutrition===true,sleep:typeof d.sleep==="number"?d.sleep:null};}catch(e){}
            });
            const ranked=athletes.filter(a=>a.status==="active").map(a=>{
              const map=athMaps[String(a.id)]||{};
              const streak=computeHabitStreak(map);
              const full7=last7.filter(d=>{const r=map[d];return r&&r.water&&r.nutrition&&r.sleep!=null&&r.sleep>0;}).length;
              return{...a,habitMap:map,streak,full7};
            }).sort((a,b)=>b.streak!==a.streak?b.streak-a.streak:b.full7-a.full7);
            return(
              <div>
                <div style={{borderRadius:20,marginBottom:16,overflow:"hidden",border:"1px solid "+GREEN+"33",boxShadow:"0 8px 32px #00000060"}}>
                  <div style={{background:"linear-gradient(140deg,"+GREEN+"30,"+GREEN+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GREEN+","+GREEN+"44,transparent)"}}/>
                    <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="droplet" size={66} color="#fff"/></div>
                    <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                      <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+GREEN+"44,"+GREEN+"22)",border:"1px solid "+GREEN+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>💧</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:8,color:GREEN,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Daily Discipline</div>
                        <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Habit Leaderboard</div>
                        <div style={{fontSize:11,color:"#666",marginTop:1}}>Water · Nutrition · Sleep · Last 7 days</div>
                      </div>
                      <button onClick={()=>{setHabitLogs(null);loadHabitLogs();}} style={{padding:"6px 10px",borderRadius:10,border:"1px solid #222",background:"transparent",color:"#555",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>{habitLoading?"...":"↻"}</button>
                    </div>
                  </div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:12,fontSize:9,color:"#555",flexWrap:"wrap"}}>
                  <div style={{display:"flex",alignItems:"center",gap:4}}><span style={{color:GREEN,fontWeight:700}}>✓</span><span>All 3 done</span></div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}><span style={{color:GOLD,fontWeight:700}}>◐</span><span>Partial</span></div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}><span style={{color:"#333"}}>—</span><span>Not logged</span></div>
                </div>
                {ranked.map((a,i)=>{
                  const rank=i+1;
                  const medal=rank===1?"🥇":rank===2?"🥈":rank===3?"🥉":null;
                  return(
                    <div key={a.id} style={{background:"#111",borderRadius:14,marginBottom:8,border:"1px solid "+(a.streak>0?GREEN+"22":"#1a1a1a"),overflow:"hidden"}}>
                      {a.streak>0&&<div style={{height:2,background:"linear-gradient(90deg,"+GREEN+","+GREEN+"22,transparent)"}}/>}
                      <div style={{padding:"12px 14px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,cursor:"pointer"}} onClick={()=>setHabitExpanded(habitExpanded===a.id?null:a.id)}>
                          <div style={{width:26,textAlign:"center",flexShrink:0}}>
                            {medal?<span style={{fontSize:16}}>{medal}</span>:<span style={{fontSize:12,color:"#444",fontWeight:700}}>{rank}</span>}
                          </div>
                          <div style={{width:36,height:36,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff",flexShrink:0,overflow:"hidden",border:"1.5px solid "+(a.streak>0?GREEN+"44":"transparent")}}>
                            {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(a.name||"?")[0]}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:14,fontWeight:700,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name}</div>
                            <div style={{fontSize:10,color:"#555"}}>{a.sport||""}</div>
                          </div>
                          <div style={{flexShrink:0}}>
                            {a.streak>0?(
                              <div style={{display:"flex",alignItems:"center",gap:4,background:GREEN+"18",borderRadius:10,padding:"5px 10px",border:"1px solid "+GREEN+"33"}}>
                                <span style={{fontSize:13}}>🔥</span>
                                <span style={{fontSize:14,fontWeight:900,color:GREEN}}>{a.streak}</span>
                              </div>
                            ):(
                              <div style={{fontSize:11,color:"#333"}}>No streak</div>
                            )}
                          </div>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
                          {last7.map(dateStr=>{
                            const row=a.habitMap[dateStr];
                            const isToday=dateStr===todayHab;
                            const waterOk=row&&row.water;
                            const nutOk=row&&row.nutrition;
                            const sleepOk=row&&row.sleep!=null&&row.sleep>0;
                            const allOk=waterOk&&nutOk&&sleepOk;
                            const partial=(waterOk||nutOk||sleepOk)&&!allOk;
                            const[,,dd]=dateStr.split("-");
                            const dayLetter=new Date(...dateStr.split("-").map((v,idx)=>idx===1?Number(v)-1:Number(v))).toLocaleDateString("en-US",{weekday:"short"}).slice(0,1);
                            return(
                              <div key={dateStr} style={{background:allOk?GREEN+"22":partial?GOLD+"18":"#0d0d0d",borderRadius:8,padding:"5px 2px",textAlign:"center",border:"1px solid "+(isToday?GOLD+"55":allOk?GREEN+"44":partial?GOLD+"33":"#1a1a1a")}}>
                                <div style={{fontSize:7,color:isToday?GOLD:"#444",textTransform:"uppercase",marginBottom:1}}>{dayLetter}</div>
                                <div style={{fontSize:9,color:isToday?GOLD:"#555",fontWeight:isToday?700:400}}>{parseInt(dd,10)}</div>
                                <div style={{fontSize:10,color:allOk?GREEN:partial?GOLD:"#333",fontWeight:700,marginTop:1}}>{allOk?"✓":partial?"◐":"—"}</div>
                              </div>
                            );
                          })}
                        </div>
                        <div style={{display:"flex",gap:8,marginTop:8}}>
                          <div style={{flex:1,background:"#0d0d0d",borderRadius:8,padding:"6px 8px",textAlign:"center",border:"0.5px solid #1a1a1a"}}>
                            <div style={{fontSize:12,fontWeight:700,color:a.full7>0?GREEN:"#555"}}>{a.full7}<span style={{fontSize:9,fontWeight:400,color:"#444"}}>/7</span></div>
                            <div style={{fontSize:8,color:"#444",textTransform:"uppercase",letterSpacing:"0.04em"}}>Full days</div>
                          </div>
                          <div style={{flex:1,background:"#0d0d0d",borderRadius:8,padding:"6px 8px",textAlign:"center",border:"0.5px solid #1a1a1a"}}>
                            <div style={{fontSize:12,fontWeight:700,color:a.streak>0?GREEN:"#555"}}>{a.streak}<span style={{fontSize:9,fontWeight:400,color:"#444"}}>d</span></div>
                            <div style={{fontSize:8,color:"#444",textTransform:"uppercase",letterSpacing:"0.04em"}}>Streak</div>
                          </div>
                        </div>
                        {habitExpanded===a.id&&(()=>{
                          const allDays=(habitLogs||[]).filter(r=>r.day===String(a.id)).sort((x,y)=>y.week_label.localeCompare(x.week_label));
                          return(
                            <div style={{marginTop:10,borderTop:"0.5px solid #1e1e1e",paddingTop:10}}>
                              <div style={{fontSize:9,color:GREEN,textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:700,marginBottom:8}}>30-Day History</div>
                              {allDays.length===0&&<div style={{fontSize:11,color:"#444",fontStyle:"italic"}}>No logs in last 30 days.</div>}
                              {allDays.map(r=>{
                                let d={};
                                try{d=JSON.parse(r.message||"{}");}catch(e){}
                                const wOk=d.water===true;
                                const nOk=d.nutrition===true;
                                const sVal=typeof d.sleep==="number"?d.sleep:null;
                                const allOk=wOk&&nOk&&sVal!=null&&sVal>0;
                                const[,mm,dd]=r.week_label.split("-");
                                return(
                                  <div key={r.week_label} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:"0.5px solid #1a1a1a"}}>
                                    <div style={{fontSize:10,color:"#555",minWidth:46}}>{mm}/{dd}</div>
                                    <div style={{display:"flex",gap:6,flex:1}}>
                                      <span style={{fontSize:10,color:wOk?GREEN:"#333",fontWeight:wOk?700:400}}>{wOk?"💧✓":"💧—"}</span>
                                      <span style={{fontSize:10,color:nOk?GREEN:"#333",fontWeight:nOk?700:400}}>{nOk?"🥗✓":"🥗—"}</span>
                                      <span style={{fontSize:10,color:sVal&&sVal>0?GOLD:"#333",fontWeight:sVal&&sVal>0?700:400}}>{sVal&&sVal>0?"😴"+sVal+"h":"😴—"}</span>
                                    </div>
                                    <div style={{fontSize:9,color:allOk?GREEN:"#333",fontWeight:700}}>{allOk?"✓ All":""}</div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
                {ranked.length===0&&(
                  <div style={{textAlign:"center",padding:"3rem",color:"#555",fontSize:12,fontStyle:"italic"}}>No active athletes found.</div>
                )}
              </div>
            );
          })()}

          {tab==="callouts"&&(()=>{
            const logDate=(ts)=>{if(!ts)return"";const d=new Date(ts);const e=new Date(d.toLocaleString("en-US",{timeZone:"America/New_York"}));return e.getFullYear()+"-"+String(e.getMonth()+1).padStart(2,"0")+"-"+String(e.getDate()).padStart(2,"0");};
            const estToday=(()=>{const n=new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));return n.getFullYear()+"-"+String(n.getMonth()+1).padStart(2,"0")+"-"+String(n.getDate()).padStart(2,"0");})();
            const sendBroadcast=async()=>{
              if(broadcastSending||!broadcastTitle.trim())return;
              setBroadcastSending(true);setBroadcastResult(null);
              try{
                const r=await fetch("/api/broadcast-notification",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:broadcastTitle.trim(),body:broadcastBody.trim(),url:"/athlete"})});
                const d=await r.json();
                setBroadcastResult(d.error?"Error: "+d.error:"Sent to "+d.sent+" athlete"+(d.sent!==1?"s":"")+(d.failed>0?" ("+d.failed+" failed)":""));
                if(!d.error){setBroadcastTitle("");setBroadcastBody("");}
              }catch(e){setBroadcastResult("Error: "+e.message);}
              setBroadcastSending(false);
              setTimeout(()=>setBroadcastResult(null),4000);
            };
            if(calloutLoading||!calloutLogs){return(<div style={{textAlign:"center",padding:"40px",color:"#555",fontSize:13}}>Loading callout log...</div>);}
            const filtered=(calloutLogs||[]).filter(l=>!calloutAthFilter||l.athletes?.name?.toLowerCase().includes(calloutAthFilter.toLowerCase()));
            const todayLogs=filtered.filter(l=>logDate(l.logged_at)===estToday);
            const todayCrunches=todayLogs.reduce((s,l)=>s+(l.crunches||0),0);
            const grouped={};
            filtered.forEach(l=>{const d=logDate(l.logged_at);if(!grouped[d])grouped[d]=[];grouped[d].push(l);});
            const sortedDates=Object.keys(grouped).sort((a,b)=>b.localeCompare(a));
            return(
              <div>
                {/* Broadcast push notification */}
                <div style={{background:"#0e0e0e",borderRadius:14,padding:"14px 16px",marginBottom:14,border:"1px solid #1e2a3a"}}>
                  <div style={{fontSize:9,color:GOLD,textTransform:"uppercase",letterSpacing:"0.18em",fontWeight:900,marginBottom:10}}>Send Push Notification</div>
                  <input value={broadcastTitle} onChange={e=>setBroadcastTitle(e.target.value)} placeholder="Title (e.g. Practice Update)" maxLength={80} style={{width:"100%",padding:"9px 12px",borderRadius:9,border:"0.5px solid #2a2a2a",background:"#111",color:"#ddd",fontSize:13,fontFamily:"Georgia,serif",boxSizing:"border-box",marginBottom:8,outline:"none"}}/>
                  <input value={broadcastBody} onChange={e=>setBroadcastBody(e.target.value)} placeholder="Message (optional)" maxLength={150} style={{width:"100%",padding:"9px 12px",borderRadius:9,border:"0.5px solid #2a2a2a",background:"#111",color:"#ddd",fontSize:13,fontFamily:"Georgia,serif",boxSizing:"border-box",marginBottom:8,outline:"none"}}/>
                  <button onClick={sendBroadcast} disabled={broadcastSending||!broadcastTitle.trim()} style={{width:"100%",padding:"10px",borderRadius:9,border:"none",background:(!broadcastTitle.trim()||broadcastSending)?"#1a1a1a":GOLD,color:(!broadcastTitle.trim()||broadcastSending)?"#444":"#000",fontSize:13,fontWeight:900,cursor:(!broadcastTitle.trim()||broadcastSending)?"default":"pointer",fontFamily:"Georgia,serif",letterSpacing:"0.04em",transition:"all 0.15s"}}>
                    {broadcastSending?"Sending…":"Send to All Athletes"}
                  </button>
                  {broadcastResult&&(
                    <div style={{marginTop:8,fontSize:12,color:broadcastResult.startsWith("Error")?RED:GREEN,fontWeight:700,textAlign:"center"}}>{broadcastResult}</div>
                  )}
                </div>
                <div style={{borderRadius:20,marginBottom:16,overflow:"hidden",border:"1px solid "+RED+"33",boxShadow:"0 8px 32px #00000060"}}>
                  <div style={{background:"linear-gradient(140deg,"+RED+"30,"+RED+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+RED+","+RED+"44,transparent)"}}/>
                    <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="alertTriangle" size={66} color="#fff"/></div>
                    <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                      <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+RED+"44,"+RED+"22)",border:"1px solid "+RED+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>⚠️</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:8,color:RED,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Weight Room</div>
                        <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Callout Log</div>
                        <div style={{fontSize:11,color:"#666",marginTop:1}}>Today: {todayLogs.length} violation{todayLogs.length!==1?"s":""} · {todayCrunches} crunches owed</div>
                      </div>
                      <button onClick={()=>{setCalloutLogs(null);loadCalloutLogs();}} style={{padding:"6px 10px",borderRadius:10,border:"1px solid #222",background:"transparent",color:"#555",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>{calloutLoading?"...":"↻"}</button>
                    </div>
                  </div>
                </div>
                <div style={{position:"relative",marginBottom:12}}>
                  <input value={calloutAthFilter} onChange={e=>setCalloutAthFilter(e.target.value)} placeholder="Filter by athlete..." style={{width:"100%",padding:"10px 12px 10px 34px",borderRadius:10,border:"0.5px solid #2a2a2a",fontSize:13,fontFamily:"Georgia,serif",background:"#111",color:"#ddd",boxSizing:"border-box"}}/>
                  <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"#555"}}><Icon name="search" size={15} color="rgba(255,255,255,0.4)"/></div>
                  {calloutAthFilter&&<button onClick={()=>setCalloutAthFilter("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",fontSize:14,color:"#aaa",cursor:"pointer"}}>✕</button>}
                </div>
                {filtered.length===0&&(
                  <div style={{textAlign:"center",padding:"3rem",color:"#555",fontSize:12,fontStyle:"italic"}}>No callouts logged yet.</div>
                )}
                {sortedDates.map(dateStr=>{
                  const dayLogs=grouped[dateStr];
                  const isToday=dateStr===estToday;
                  const dayCrunches=dayLogs.reduce((s,l)=>s+(l.crunches||0),0);
                  const[y,m,d]=dateStr.split("-");
                  const label=isToday?"Today":new Date(Number(y),Number(m)-1,Number(d)).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
                  return(
                    <div key={dateStr} style={{marginBottom:14}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                        <div style={{fontSize:10,fontWeight:700,color:isToday?RED:"#555",textTransform:"uppercase",letterSpacing:"0.08em"}}>{label}</div>
                        <div style={{flex:1,height:"0.5px",background:"#1e1e1e"}}/>
                        <div style={{fontSize:10,color:RED,fontWeight:700}}>{dayCrunches} crunches</div>
                      </div>
                      {dayLogs.map((l,li)=>{
                        const ath=l.athletes;
                        return(
                          <div key={li} style={{background:"#111",borderRadius:12,marginBottom:6,padding:"10px 14px",border:"1px solid "+(isToday?RED+"22":"#1a1a1a"),display:"flex",alignItems:"center",gap:10}}>
                            <div style={{width:34,height:34,borderRadius:"50%",background:ath?.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff",flexShrink:0,overflow:"hidden"}}>
                              {ath?.photo_url?<img src={ath.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(ath?.name||"?")[0]}
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:13,fontWeight:600,color:"#ddd"}}>{ath?.name||"Unknown"}</div>
                              <div style={{fontSize:11,color:"#555",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.violation}{l.count>1?" · "+l.count+"x":""}</div>
                            </div>
                            <div style={{textAlign:"right",flexShrink:0}}>
                              <div style={{fontSize:14,fontWeight:800,color:RED}}>{l.crunches}</div>
                              <div style={{fontSize:9,color:l.type==="selfreport"?GREEN:"#555",fontWeight:l.type==="selfreport"?700:400}}>{l.type==="selfreport"?"self":"called out"}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          </ErrorBoundary>
        </div>
        {/* ── LIQUID GLASS BOTTOM NAV ── */}
        {(()=>{
            const ICON_MAP={"overview":"barChart","teams":"grid","roster":"users","attendance":"calendar","accountability":"checkSquare","inbox":"inbox","leaderboard":"trophy","goals":"target","fellowship":"pray","mindset":"compass","culture":"flame","prayers":"heart","weights":"scale","photos":"camera","engagement":"megaphone","qr":"smartphone","ironroom":"barbell","injuries":"alertTriangle","habits":"droplet","callouts":"zap","anvil":"anvil","mcastles-post":"crown"};
            const ICON_COLORS={"overview":"#FF7A2F","teams":"#60A8D0","roster":"#8CB4D5","attendance":"#7B6EE8","accountability":"#3A9E5A","anvil":"#F0C040","inbox":"#B56EE8","leaderboard":"#FFD700","goals":"#44D9B0","fellowship":"#A080D0","mindset":"#4DC8F5","culture":"#E8720C","prayers":"#FF80A8","weights":"#C8D040","photos":"#50D0B8","engagement":"#FF5A9D","qr":"#80C0D8","mcastles-post":"#D060C0","ironroom":"#E05555","injuries":"#FF8060","habits":"#20BEA8","callouts":"#FFC040"};
            const fixedTab=coachRole==="kevin"?"roster":"overview";
            const validPinned=pinnedTabs.filter(id=>TABS.find(t=>t.id===id)&&id!==fixedTab);
            const PRIMARY=[fixedTab,...validPinned];
            const togglePin=(id)=>{
              if(id===fixedTab)return;
              const next=validPinned.includes(id)?validPinned.filter(p=>p!==id):(validPinned.length<3?[...validPinned,id]:validPinned);
              setPinnedTabs(next);
              try{localStorage.setItem("tf_pinned_coach_"+coachRole,JSON.stringify(next));}catch(e){}
            };
            const renderTabIcon=(id,size,isActive,grid=false)=>{const n=ICON_MAP[id];const col=ICON_COLORS[id]||"#aaa";const op=isActive?1:grid?0.65:0.55;if(n)return <span style={{opacity:op,display:"flex",alignItems:"center"}}><Icon name={n} size={size} color={col}/></span>;return <span style={{fontSize:size,lineHeight:1,opacity:op}}>{col}</span>;};
            return(
              <>
                <div style={{position:"fixed",bottom:16,left:"50%",transform:"translateX(-50%)",width:"calc(100% - 32px)",maxWidth:680,zIndex:1000,fontFamily:"Georgia,serif"}}>
                  <div style={{background:"rgba(8,8,14,0.88)",backdropFilter:"blur(48px) saturate(220%)",WebkitBackdropFilter:"blur(48px) saturate(220%)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:28,boxShadow:"0 20px 60px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.12)",display:"flex",alignItems:"stretch",padding:"6px 4px 6px",position:"relative"}}>
                    {(()=>{const n=PRIMARY.length+1;const activeIdx=PRIMARY.indexOf(tab);if(activeIdx<0||jiggleMode)return null;const col=ICON_COLORS[tab]||"#E8720C";return <div style={{position:"absolute",bottom:6,left:`calc(4px + ${activeIdx} * (100% - 8px) / ${n})`,width:`calc((100% - 8px) / ${n})`,height:2,borderRadius:2,background:col,boxShadow:`0 0 8px ${col}99`,transition:"left 0.32s cubic-bezier(0.22,1,0.36,1),background 0.2s",pointerEvents:"none",zIndex:0}}/>})()}
                    {PRIMARY.map(id=>{
                      const t=TABS.find(x=>x.id===id);
                      if(!t)return null;
                      const isActive=tab===id;
                      const col=ICON_COLORS[id]||"#E8720C";
                      const cnt=id==="inbox"&&inboxCount>0?inboxCount:0;
                      const isJiggling=jiggleMode&&id!==fixedTab&&jiggleDragId!==id;
                      const isDragging=jiggleDragId===id;
                      return(
                        <button key={id}
                          ref={isDragging?jiggleDragElemRef:null}
                          onClick={()=>{if(jiggleMode)return;hTap();slideDirRef.current=0;setTab(id);}}
                          onTouchStart={(e)=>{
                            if(id===fixedTab)return;
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
                            if(jiggleDragOrderRef.current){try{localStorage.setItem("tf_pinned_coach_"+coachRole,JSON.stringify(jiggleDragOrderRef.current));}catch(err){}jiggleDragOrderRef.current=null;}
                          }}
                          style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"8px 4px 6px",background:isActive&&!jiggleMode?"rgba(255,255,255,0.11)":"transparent",border:"none",borderRadius:22,fontSize:9,fontWeight:isActive?700:400,cursor:"pointer",fontFamily:"Georgia,serif",transition:isDragging?"none":"transform 0.18s cubic-bezier(0.34,1.56,0.64,1)",boxShadow:isDragging?"0 12px 32px rgba(0,0,0,0.55)":isActive&&!jiggleMode?"inset 0 1px 0 rgba(255,255,255,0.18)":"none",animation:isJiggling?"tfJiggle 0.22s ease-in-out infinite alternate":"none",position:"relative",zIndex:isDragging?10:1,userSelect:"none",WebkitUserSelect:"none",touchAction:jiggleMode?"none":"auto"}}>
                          <span style={{filter:isActive&&!jiggleMode?"drop-shadow(0 0 10px "+col+"dd)":"none",transition:"filter 0.2s",display:"flex",alignItems:"center",justifyContent:"center",height:20}}>{renderTabIcon(id,19,isActive)}</span>
                          <span style={{letterSpacing:"0.02em",color:isActive&&!jiggleMode?col:"rgba(255,255,255,0.38)"}}>{t.label}</span>
                          {cnt>0&&!jiggleMode&&<div style={{position:"absolute",top:4,right:"50%",transform:"translateX(6px)",background:"#E8720C",color:"#fff",fontSize:7,fontWeight:900,minWidth:14,height:14,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 3px"}}>{cnt}</div>}
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
                  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",zIndex:9999,display:"flex",flexDirection:"column"}} onClick={()=>setShowTabPicker(false)}>
                    <div style={{flex:1}}/>
                    <div style={{background:"rgba(10,10,18,0.97)",backdropFilter:"blur(48px) saturate(200%)",WebkitBackdropFilter:"blur(48px) saturate(200%)",borderRadius:"28px 28px 0 0",border:"1px solid rgba(255,255,255,0.12)",borderBottom:"none",boxShadow:"0 -24px 60px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.1)",maxHeight:"86vh",overflowY:"auto",paddingBottom:44}} onClick={e=>e.stopPropagation()}>
                      <div style={{padding:"20px 16px 0",position:"sticky",top:0,background:"rgba(10,10,18,0.97)",zIndex:1}}>
                        <div style={{width:36,height:4,borderRadius:2,background:"rgba(255,255,255,0.2)",margin:"0 auto 16px"}}/>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                          <div style={{fontSize:17,fontWeight:800,color:"#fff"}}>All Tabs</div>
                          <button onClick={()=>setShowTabPicker(false)} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.5)",fontSize:15,cursor:"pointer",lineHeight:1,width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,padding:0}}>✕</button>
                        </div>
                        <div style={{height:"0.5px",background:"rgba(255,255,255,0.07)",marginBottom:4}}/>
                      </div>
                      {[
                        {label:"Overview",ids:["overview","roster","teams","attendance"]},
                        {label:"Accountability",ids:["accountability","inbox","leaderboard","anvil"]},
                        {label:"Culture & Faith",ids:["culture","fellowship","prayers","mindset"]},
                        {label:"Tools",ids:["engagement","qr","goals","weights","ironroom"]},
                        {label:"More",ids:["photos","injuries","habits","callouts","mcastles-post"]},
                      ].filter(s=>s.ids.some(id=>TABS.find(t=>t.id===id))).map(section=>(
                        <div key={section.label}>
                          <div style={{fontSize:10,color:"rgba(255,255,255,0.28)",textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:700,padding:"14px 16px 8px"}}>{section.label}</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,padding:"0 12px"}}>
                            {section.ids.map(id=>{
                              const t=TABS.find(x=>x.id===id);
                              if(!t)return null;
                              const col=ICON_COLORS[id]||"#aaa";
                              const isActive=tab===id;
                              const isFixed=id===fixedTab;
                              const isPinned=isFixed||validPinned.includes(id);
                              const canPin=!isPinned&&validPinned.length<3;
                              return(
                                <div key={id} style={{position:"relative"}}>
                                  <button
                                    onClick={()=>{slideDirRef.current=0;setTab(id);setShowTabPicker(false);}}
                                    style={{width:"100%",display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"16px 8px 12px",borderRadius:16,background:isActive?col+"18":"rgba(255,255,255,0.04)",border:"1px solid "+(isActive?col+"55":"rgba(255,255,255,0.07)"),boxShadow:isActive?"0 0 16px "+col+"33":"none",cursor:"pointer",fontFamily:"Georgia,serif",boxSizing:"border-box"}}>
                                    <div style={{width:46,height:46,borderRadius:14,background:col+"1c",border:"1px solid "+col+(isActive?"55":"2a"),display:"flex",alignItems:"center",justifyContent:"center",boxShadow:isActive?"0 0 14px "+col+"44":"none"}}>
                                      <span style={{display:"flex",alignItems:"center",filter:isActive?"drop-shadow(0 0 6px "+col+"bb)":"none"}}>{renderTabIcon(id,22,isActive)}</span>
                                    </div>
                                    <span style={{fontSize:12,fontWeight:isActive?700:500,color:isActive?col:"rgba(255,255,255,0.65)",textAlign:"center",lineHeight:1.3}}>{t.label}</span>
                                  </button>
                                  <button
                                    onClick={(e)=>{e.stopPropagation();if(!isFixed&&(isPinned||canPin))togglePin(id);}}
                                    style={{position:"absolute",top:7,right:7,width:22,height:22,borderRadius:6,background:isPinned?col+"33":"rgba(255,255,255,0.07)",border:"1px solid "+(isPinned?col+"66":"rgba(255,255,255,0.12)"),display:"flex",alignItems:"center",justifyContent:"center",cursor:!isFixed&&(isPinned||canPin)?"pointer":"default",opacity:!isPinned&&!canPin&&!isFixed?0.2:1,padding:0}}>
                                    {isFixed?<Icon name="lock" size={9} color="rgba(255,255,255,0.35)"/>:<span style={{fontSize:9,color:isPinned?col:"rgba(255,255,255,0.3)",fontWeight:800,lineHeight:1}}>{isPinned?"✓":"+"}</span>}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
      </div>
      {modalAth&&(
        <div style={{position:"fixed",inset:0,zIndex:9000,background:"rgba(0,0,0,0.85)"}} onClick={()=>{setModalAth(null);setModalData(null);}}>
          <div onClick={e=>e.stopPropagation()} style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"#0e0e0e",borderRadius:"24px 24px 0 0",maxHeight:"90vh",overflowY:"auto",border:"1px solid #1e1e1e",borderBottom:"none",fontFamily:"Georgia,serif"}}>
            <div style={{width:40,height:4,borderRadius:2,background:"#333",margin:"12px auto 0"}}/>
            <div style={{padding:"16px 20px 14px",borderBottom:"0.5px solid #1a1a1a",display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:52,height:52,borderRadius:"50%",background:modalAth.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:"#fff",flexShrink:0,overflow:"hidden",border:"2px solid "+(modalAth.role==="forge"?RED:STEEL)+"55"}}>
                {modalAth.photo_url?<img src={modalAth.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:modalAth.name[0]}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:18,fontWeight:900,color:"#fff"}}>{modalAth.name}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:3}}>
                  {modalAth.sport&&<span style={{fontSize:10,color:"#666"}}>{modalAth.sport}</span>}
                  <span style={{fontSize:10,color:modalAth.role==="forge"?RED:STEEL,fontWeight:700,textTransform:"uppercase"}}>{modalAth.role||"iron"}</span>
                  {modalAth.status==="sleeping"&&<span style={{fontSize:10,color:"#666"}}>· sleeping</span>}
                </div>
              </div>
              <button onClick={()=>{setModalAth(null);setModalData(null);}} style={{background:"transparent",border:"none",color:"#444",fontSize:20,cursor:"pointer",padding:"4px"}}>✕</button>
            </div>
            {modalLoading&&<div style={{textAlign:"center",padding:"3rem",color:"#555",fontSize:13}}>Loading...</div>}
            {modalData&&(()=>{
              const{att,lbRow,msgs,wt,anv}=modalData;
              const streak=lbRow?.current_streak||0;
              const early=lbRow?.early_count||0;
              const best=lbRow?.best_streak||0;
              const lastAtt=att.slice(0,8);
              return(
                <div style={{padding:"16px 20px 40px"}}>
                  <div style={{display:"flex",gap:8,marginBottom:16}}>
                    {[{label:"Streak",val:streak,color:GREEN,icon:"🔥"},{label:"Best",val:best,color:GOLD,icon:"⭐"},{label:"Early",val:early,color:"#ddd",icon:"⏰"},{label:"Late",val:lbRow?.late_count||0,color:RED,icon:"⚠"}].map(s=>(
                      <div key={s.label} style={{flex:1,background:"#111",borderRadius:10,padding:"8px",textAlign:"center",border:"0.5px solid #1e1e1e"}}>
                        <div style={{fontSize:8,marginBottom:2}}>{s.icon}</div>
                        <div style={{fontSize:20,fontWeight:900,color:s.color}}>{s.val}</div>
                        <div style={{fontSize:8,color:"#555",textTransform:"uppercase",letterSpacing:"0.06em"}}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {lastAtt.length>0&&(
                    <div style={{marginBottom:16}}>
                      <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Recent attendance</div>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                        {lastAtt.map((r,i)=>(
                          <div key={i} style={{textAlign:"center"}}>
                            <div style={{width:28,height:28,borderRadius:8,background:r.status==="early"?GREEN+"22":r.status==="late"?"#2a1500":"#1a1a1a",border:"0.5px solid "+(r.status==="early"?GREEN:r.status==="late"?GOLD:"#2a2a2a"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:10}}>{r.status==="early"?"✓":r.status==="late"?"↓":"?"}</div>
                            <div style={{fontSize:7,color:"#444",marginTop:2,whiteSpace:"nowrap"}}>{r.date?.slice(5)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(modalAth.athletic_goal||modalAth.character_goal)&&(
                    <div style={{marginBottom:16}}>
                      <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Goals</div>
                      {modalAth.athletic_goal&&<div style={{background:"#111",borderRadius:10,padding:"10px 12px",marginBottom:6,borderLeft:"3px solid "+GREEN}}><div style={{fontSize:9,color:GREEN,marginBottom:3,fontWeight:700}}>ATHLETIC</div><div style={{fontSize:12,color:"#ccc"}}>{modalAth.athletic_goal}</div></div>}
                      {modalAth.character_goal&&<div style={{background:"#111",borderRadius:10,padding:"10px 12px",borderLeft:"3px solid "+PUR}}><div style={{fontSize:9,color:PUR,marginBottom:3,fontWeight:700}}>CHARACTER</div><div style={{fontSize:12,color:"#ccc"}}>{modalAth.character_goal}</div></div>}
                    </div>
                  )}
                  {msgs.filter(m=>!m.done).length>0&&(
                    <div style={{marginBottom:16}}>
                      <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Recent messages</div>
                      {msgs.filter(m=>!m.done).slice(0,3).map((m,i)=>{
                        const typeColor=m.type==="injury"?RED:m.type==="prayer"?GREEN:PUR;
                        return<div key={i} style={{background:"#111",borderRadius:10,padding:"10px 12px",marginBottom:6,borderLeft:"3px solid "+typeColor}}><div style={{fontSize:9,color:typeColor,marginBottom:3,fontWeight:700,textTransform:"uppercase"}}>{m.type}</div><div style={{fontSize:12,color:"#ccc",fontStyle:"italic"}}>"{m.message}"</div></div>;
                      })}
                    </div>
                  )}
                  {wt.length>0&&(
                    <div style={{marginBottom:16}}>
                      <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Weight log</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        {wt.map((w,i)=>(
                          <div key={i} style={{background:"#111",borderRadius:8,padding:"6px 10px",border:"0.5px solid #1e1e1e"}}>
                            <div style={{fontSize:13,fontWeight:700,color:"#ddd"}}>{w.weight}<span style={{fontSize:10,color:"#555"}}>lb</span></div>
                            <div style={{fontSize:9,color:"#444"}}>{w.date?.slice(5)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {anv.length>0&&(
                    <div>
                      <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>⚒ Anvil awards ({anv.length})</div>
                      {anv.map((a,i)=><div key={i} style={{background:"#1f1700",borderRadius:8,padding:"8px 12px",marginBottom:4,border:"0.5px solid "+GOLD+"33",display:"flex",justifyContent:"space-between"}}><span style={{fontSize:12,color:GOLD}}>{a.type==="group"?"Group":"Individual"}</span><span style={{fontSize:11,color:"#666"}}>{a.date_awarded}</span></div>)}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}

function InboxItem({item,color,bg,type,onReply,onGenerate,genLoading,loadKey,onArchive,onPriority,athletes,isNew}){
  const[reply,setReply]=useState(item.reply||"");
  const[sent,setSent]=useState(item.reply_sent||false);
  const[showReply,setShowReply]=useState(!item.reply_sent);
  const ath=athletes?.find(a=>a.id===item.athlete_id);
  const prompts={
    injury:`You are Coach Ant, a faith-based strength coach. Athlete ${item.athletes?.name} reported: "${item.message}". Write a caring professional response as Coach Ant. Acknowledge the injury, tell them what to do, encourage them. Under 60 words.`,
    message:`You are Coach Ant, a faith-based strength coach. Athlete ${item.athletes?.name} sent: "${item.message}". Write a warm personal reply as Coach Ant. Encouraging, real, grounded in faith. Under 60 words.`,
    prayer:`You are Coach Ant, a faith-based coach who prays for athletes. ${item.athletes?.name} submitted: "${item.message}". Write a warm faith-filled response as Coach Ant. Include a short scripture if natural. Under 70 words.`,
  };
  const RED="#C0392B",GREEN="#1E6B3A",GOLD="#D4AF37",STEEL="#708090";
  return(
    <div className={isNew?"tf-pulse-glow":""} style={{padding:isNew?"12px":"12px 0",margin:isNew?"0 -4px 4px":0,borderRadius:isNew?12:0,borderBottom:isNew?"none":"0.5px solid #1e1e1e",background:isNew?color+"0d":"transparent",opacity:item.archived?0.5:1}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
        <div style={{position:"relative",flexShrink:0}}>
          {isNew&&<div style={{position:"absolute",top:-2,right:-2,width:9,height:9,borderRadius:"50%",background:color,border:"2px solid #0d0d0d",zIndex:2}}/>}
          <div style={{width:34,height:34,borderRadius:"50%",background:ath?.role==="forge"?RED:STEEL,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:500,color:"#fff"}}>
            {ath?.photo_url?<img src={ath.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(item.athletes?.name||"?")[0]}
          </div>
        </div>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:13,fontWeight:600,color}}>{item.anonymous?"Anonymous":item.athletes?.name}</span>
            {isNew&&<span style={{fontSize:8.5,background:color,color:"#fff",padding:"1px 6px",borderRadius:4,fontWeight:800,letterSpacing:"0.06em"}}>NEW</span>}
            {item.priority&&<span style={{fontSize:9,background:RED,color:"#fff",padding:"1px 5px",borderRadius:3,fontWeight:600}}>URGENT</span>}
            {item.reply_sent&&<span style={{fontSize:10,color:GREEN}}>✓ Replied</span>}
          </div>
          <span style={{fontSize:11,color:"#555"}}>{new Date(item.created_at).toLocaleDateString()}</span>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>onPriority&&onPriority(item)} title="Mark urgent" style={{background:"transparent",border:"none",fontSize:14,cursor:"pointer",opacity:item.priority?1:0.3}}>🚨</button>
          <button onClick={()=>onArchive&&onArchive(item)} title="Archive" style={{background:"transparent",border:"none",fontSize:14,cursor:"pointer",opacity:0.5}}>📁</button>
        </div>
      </div>
      <div style={{fontSize:13,color:"#bbb",marginBottom:8,padding:"8px 10px",background:bg,borderRadius:8,borderLeft:"3px solid "+color,fontStyle:"italic"}}>"{item.message}"</div>
      {item.reply&&(
        <div style={{marginBottom:8}}>
          <div onClick={()=>setShowReply(!showReply)} style={{fontSize:11,color:GREEN,cursor:"pointer",marginBottom:4}}>
            {showReply?"▼ Hide reply":"▶ Show your reply"}
          </div>
          {showReply&&(
            <div style={{fontSize:12,color:"#aaa",padding:"6px 10px",background:"#0d1a10",borderRadius:8,borderLeft:"3px solid "+GREEN,fontStyle:"italic"}}>
              "{item.reply}"
            </div>
          )}
        </div>
      )}
      {!item.archived&&(
        <>
          <textarea value={reply} onChange={e=>setReply(e.target.value)} placeholder="Write a reply..." style={{width:"100%",minHeight:50,padding:"6px",fontSize:12,border:"0.5px solid #2a2a2a",borderRadius:8,background:"#111",color:"#ddd",fontFamily:"Georgia,serif",resize:"vertical",boxSizing:"border-box",marginBottom:6}}/>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button onClick={()=>onGenerate(prompts[type],text=>setReply(text))} style={{padding:"5px 12px",borderRadius:8,border:"0.5px solid "+color,background:"transparent",color,fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>
              {genLoading===loadKey?"Generating...":"Generate reply"}
            </button>
            <button onClick={async()=>{await onReply(item,reply);setSent(true);}} style={{padding:"5px 14px",borderRadius:8,border:"none",background:color,color:"#fff",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"Georgia,serif"}}>Send reply</button>
            {sent&&<span style={{fontSize:12,color:GREEN,fontWeight:500}}>✓ Sent</span>}
          </div>
        </>
      )}
    </div>
  );
}
