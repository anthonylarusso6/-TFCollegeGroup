import { useState, useEffect } from "react";
import { BG, PUR, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { supabase } from "../lib/supabase";
import { SkeletonList } from "./Skeleton";
import EmptyState from "./EmptyState";
import Icon from "./Icon";
import { hTap } from "../lib/haptics";

const glass=(extra={})=>({
  background:"rgba(255,255,255,0.045)",
  border:"1px solid rgba(255,255,255,0.08)",
  borderRadius:14,
  boxShadow:"inset 0 1px 0 rgba(255,255,255,0.05)",
  ...extra,
});

const RECURRING=[
  {label:"Top Golf outing",icon:"target",freq:"Once per month",notes:"Book in advance. Split into groups by draft group."},
  {label:"Team cookout",icon:"flame",freq:"Every 3 weeks",notes:"Rotate host. Everyone brings something."},
  {label:"Movie night",icon:"star",freq:"Every other week",notes:"Vote on movie. Keep it faith-friendly."},
  {label:"Community service",icon:"heart",freq:"Once per month",notes:"Serve together as a team. Builds culture fast."},
  {label:"Bowling night",icon:"trophy",freq:"Monthly",notes:"Great for competition and laughs."},
  {label:"Team breakfast",icon:"zap",freq:"Weekly optional",notes:"Before Monday session. Early arrivals only."},
];

const DEFAULT_TEMPLATES=[
  {id:"general",label:"General",text:`Hey TF College Group fam! 🙏\n\nJust a reminder — we're a program built on iron sharpening iron. That means showing up for each other on AND off the field.\n\nKeep pushing. See you Monday at 9am sharp.\n\n— Coach Ant`},
  {id:"event",label:"Event",text:`Hey TF College Group! 🔥\n\nWe've got [EVENT NAME] coming up on [DATE] at [TIME].\n\nLocation: [LOCATION]\n\nThis is family time. Show up, have fun, build the culture.\n\nLet Coach Ant know if you can make it.\n\n— Coach Ant ⚒`},
  {id:"hype",label:"Hype",text:`LET'S GO TF COLLEGE GROUP! ⚒🔥\n\nThis week we go harder. Iron sharpens iron — let's remind each other what that means.\n\nEarly is the standard. Excellence is the expectation. Faith is the foundation.\n\nSee you Monday. Come ready.\n\n— Coach Ant`},
  {id:"reminder",label:"Reminder",text:`TF College Group reminder 📲\n\nClass tomorrow — Mon/Fri at 9am, Tue/Thu at 9:30am.\n\nEarly only. Late = 50 crunches. No show = shred mill.\n\nThe standard doesn't change. See you there.\n\n— Coach Ant`},
];

export default function CultureEvents({athletes=[]}){
  const[events,setEvents]=useState([]);
  const[newEvent,setNewEvent]=useState({name:"",date:"",time:"",location:"",notes:""});
  const[activeEvent,setActiveEvent]=useState(null);
  const[groupMsg,setGroupMsg]=useState("");
  const[msgType,setMsgType]=useState("general");
  const[copied,setCopied]=useState(false);
  const[templates,setTemplates]=useState(DEFAULT_TEMPLATES);
  const[newTemplate,setNewTemplate]=useState({label:"",text:""});
  const[showAddTemplate,setShowAddTemplate]=useState(false);
  const[rsvpMap,setRsvpMap]=useState({});
  const[expandRsvp,setExpandRsvp]=useState(null);
  const[photos,setPhotos]=useState([]);
  const[selectedPhoto,setSelectedPhoto]=useState(null);
  const[loading,setLoading]=useState(true);
  const[promptText,setPromptText]=useState("");
  const[parsing,setParsing]=useState(false);
  const[parseErr,setParseErr]=useState(false);

  useEffect(()=>{loadAll();},[]);

  const loadAll=async()=>{
    setLoading(true);
    try{
      const safe=async(fn)=>{try{const r=await fn();return r.data||[];}catch{return[];}};
      const[evData,rsvpData,photoData,tmplData]=await Promise.all([
        safe(()=>supabase.from("culture_events").select("*").order("date",{ascending:true})),
        safe(()=>supabase.from("culture_rsvps").select("*")),
        safe(()=>supabase.from("culture_photos").select("*").order("created_at",{ascending:false})),
        safe(()=>supabase.from("culture_templates").select("*")),
      ]);
      setEvents(evData);setPhotos(photoData);
      if(tmplData.length>0)setTemplates([...DEFAULT_TEMPLATES,...tmplData]);
      const map={};
      rsvpData.forEach(r=>{if(!map[r.event_id])map[r.event_id]=[];map[r.event_id].push(r.athlete_name);});
      setRsvpMap(map);
    }catch(e){console.error("CultureEvents load error:",e);}
    setLoading(false);
  };

  const addEvent=async()=>{
    if(!newEvent.name.trim())return;
    try{const{data}=await supabase.from("culture_events").insert({...newEvent}).select().single();if(data)setEvents(p=>[...p,data]);}catch(e){}
    setNewEvent({name:"",date:"",time:"",location:"",notes:""});
  };

  const parseEventPrompt=async()=>{
    if(!promptText.trim())return;
    setParsing(true);setParseErr(false);
    const today=new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
    const yyyy=today.getFullYear(),mm=String(today.getMonth()+1).padStart(2,"0"),dd=String(today.getDate()).padStart(2,"0");
    try{
      const res=await fetch("/api/ai-task",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:`Today is ${yyyy}-${mm}-${dd}. Parse this event description and return ONLY a JSON object with these keys: name (string), date (YYYY-MM-DD string or ""), time (readable string like "3:00 PM" or ""), location (string or ""), notes (any extra details or ""). No markdown, no explanation, just the JSON.\n\nEvent: "${promptText.trim()}"`})});
      const d=await res.json();
      const txt=(d.text||"").trim();
      const match=txt.match(/\{[\s\S]*\}/);
      if(!match)throw new Error("no json");
      const parsed=JSON.parse(match[0]);
      setNewEvent(p=>({
        name:parsed.name||p.name,
        date:parsed.date||p.date,
        time:parsed.time||p.time,
        location:parsed.location||p.location,
        notes:parsed.notes||p.notes,
      }));
    }catch(e){setParseErr(true);setTimeout(()=>setParseErr(false),3000);}
    setParsing(false);
  };

  const deleteEvent=async(id)=>{
    if(!window.confirm("Delete this event?"))return;
    try{await supabase.from("culture_events").delete().eq("id",id);}catch(e){}
    setEvents(p=>p.filter(e=>e.id!==id));
  };

  const toggleRsvp=async(eventId,name)=>{
    const current=rsvpMap[eventId]||[];
    const isIn=current.includes(name);
    if(isIn){
      try{await supabase.from("culture_rsvps").delete().eq("event_id",eventId).eq("athlete_name",name);}catch(e){}
      setRsvpMap(p=>({...p,[eventId]:current.filter(n=>n!==name)}));
    }else{
      try{await supabase.from("culture_rsvps").insert({event_id:eventId,athlete_name:name});}catch(e){}
      setRsvpMap(p=>({...p,[eventId]:[...current,name]}));
    }
  };

  const uploadPhoto=async(file,caption)=>{
    try{
      const ext=file.name.split(".").pop()||"jpg";
      const fileName=`event_${Date.now()}.${ext}`;
      const{error:upErr}=await supabase.storage.from("team-photos").upload(fileName,file,{contentType:file.type,upsert:false});
      if(upErr){alert("Photo upload failed: "+upErr.message);return;}
      const{data:{publicUrl}}=supabase.storage.from("team-photos").getPublicUrl(fileName);
      const{data}=await supabase.from("culture_photos").insert({photo_url:publicUrl,caption:caption||"",storage_path:fileName}).select().single();
      if(data)setPhotos(p=>[data,...p]);
    }catch(err){alert("Photo upload failed: "+err.message);}
  };

  const deletePhoto=async(id)=>{
    try{
      const photo=photos.find(p=>p.id===id);
      await supabase.from("culture_photos").delete().eq("id",id);
      if(photo?.storage_path){try{await supabase.storage.from("team-photos").remove([photo.storage_path]);}catch(e){}}
    }catch(e){}
    setPhotos(p=>p.filter(x=>x.id!==id));
  };

  const saveTemplate=async()=>{
    if(!newTemplate.label.trim()||!newTemplate.text.trim())return;
    let savedId=Date.now();
    try{const{data}=await supabase.from("culture_templates").insert({label:newTemplate.label,text:newTemplate.text}).select().single();if(data)savedId=data.id;}catch(e){}
    setTemplates(p=>[...p,{id:savedId,label:newTemplate.label,text:newTemplate.text}]);
    setNewTemplate({label:"",text:""});setShowAddTemplate(false);
  };

  const deleteTemplate=async(t)=>{
    if(DEFAULT_TEMPLATES.find(d=>d.id===t.id))return;
    try{await supabase.from("culture_templates").delete().eq("id",t.id);}catch(e){}
    setTemplates(p=>p.filter(x=>x.id!==t.id));
  };

  const daysUntil=(dateStr)=>{
    if(!dateStr)return null;
    return Math.ceil((new Date(dateStr)-new Date())/(1000*60*60*24));
  };

  const activeTemplate=templates.find(t=>t.id===msgType)||templates[0];

  if(loading)return<div style={{paddingTop:8}}><SkeletonList rows={4}/></div>;

  return(
    <div>

      {/* Upcoming events */}
      <div style={{...glass({borderRadius:16}),padding:"1.25rem",marginBottom:12,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GOLD+",transparent)"}}/>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <Icon name="calendar" size={14} color={GOLD}/>
          <span style={{fontSize:13,fontWeight:700,color:"#fff"}}>Upcoming Events</span>
        </div>

        {events.length===0&&(
          <EmptyState icon="calendar" color={GOLD} title="No events yet" hint="Add one below to start tracking team culture activities." />
        )}

        {events.map(e=>{
          const days=daysUntil(e.date);
          const rsvps=rsvpMap[e.id]||[];
          return(
            <div key={e.id} style={{padding:"12px 0",borderBottom:"0.5px solid rgba(255,255,255,0.07)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#fff"}}>{e.name}</div>
                    {days!==null&&days>=0&&(
                      <span style={{fontSize:9.5,padding:"2px 7px",borderRadius:5,background:days<=3?"rgba(192,57,43,0.2)":days<=7?"rgba(133,79,11,0.2)":"rgba(30,107,58,0.18)",color:days<=3?RED:days<=7?ORANGE:GREEN,fontWeight:700,border:"1px solid "+(days<=3?RED+"44":days<=7?ORANGE+"44":GREEN+"44")}}>
                        {days===0?"Today!":days===1?"Tomorrow":"In "+days+"d"}
                      </span>
                    )}
                    {rsvps.length>0&&<span style={{fontSize:10,color:PUR,fontWeight:600}}>✓ {rsvps.length} coming</span>}
                  </div>
                  {e.date&&<div style={{fontSize:11,color:"#555",marginTop:3}}>{e.date}{e.time&&" · "+e.time}</div>}
                  {e.location&&<div style={{fontSize:11,color:"#555"}}>{e.location}</div>}
                  {e.notes&&<div style={{fontSize:11,color:"#444",fontStyle:"italic",marginTop:2}}>{e.notes}</div>}
                </div>
                <div style={{display:"flex",gap:5,flexShrink:0}}>
                  <button onClick={()=>{hTap();setExpandRsvp(expandRsvp===e.id?null:e.id);}} style={{padding:"4px 9px",borderRadius:7,border:"1px solid "+PUR+"55",background:"transparent",color:PUR,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"Georgia,serif"}}>RSVP</button>
                  <button onClick={()=>{hTap();setActiveEvent(activeEvent===e.id?null:e.id);}} style={{padding:"4px 9px",borderRadius:7,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"#666",fontSize:10,cursor:"pointer",fontFamily:"Georgia,serif"}}>Edit</button>
                  <button onClick={()=>deleteEvent(e.id)} style={{padding:"4px 7px",borderRadius:7,border:"1px solid "+RED+"44",background:"transparent",color:RED,fontSize:10,cursor:"pointer",fontFamily:"Georgia,serif"}}>✕</button>
                </div>
              </div>

              {expandRsvp===e.id&&(
                <div style={{marginTop:10,padding:"12px",background:"rgba(255,255,255,0.04)",borderRadius:10,border:"1px solid rgba(255,255,255,0.07)"}}>
                  <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Who's coming?</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                    {(athletes||[]).filter(a=>a.status==="active").map(a=>{
                      const isIn=(rsvpMap[e.id]||[]).includes(a.name);
                      return(
                        <button key={a.id} onClick={()=>{hTap();toggleRsvp(e.id,a.name);}}
                          style={{padding:"7px 4px",borderRadius:9,border:"1px solid "+(isIn?GREEN+"55":"rgba(255,255,255,0.08)"),background:isIn?"rgba(30,107,58,0.2)":"rgba(255,255,255,0.04)",cursor:"pointer",fontFamily:"Georgia,serif",textAlign:"center",transition:"all 0.15s"}}>
                          <div style={{width:26,height:26,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,margin:"0 auto 4px",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:500,color:"#fff"}}>
                            {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(a.name||"?")[0]}
                          </div>
                          <div style={{fontSize:10,color:isIn?GREEN:"#888",fontWeight:isIn?600:400}}>{a.name.split(" ")[0]}</div>
                        </button>
                      );
                    })}
                  </div>
                  {rsvps.length>0&&<div style={{fontSize:11,color:GREEN,marginTop:8,fontWeight:600}}>✓ {rsvps.join(", ")}</div>}
                </div>
              )}

              {activeEvent===e.id&&(
                <div style={{marginTop:10,padding:"12px",background:"rgba(255,255,255,0.04)",borderRadius:10,border:"1px solid rgba(255,255,255,0.07)"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:7}}>
                    <input value={e.date} onChange={async ev=>{setEvents(p=>p.map(x=>x.id===e.id?{...x,date:ev.target.value}:x));await supabase.from("culture_events").update({date:ev.target.value}).eq("id",e.id);}} placeholder="Date" style={{padding:"7px 9px",fontSize:12,borderRadius:8,fontFamily:"Georgia,serif"}}/>
                    <input value={e.time} onChange={async ev=>{setEvents(p=>p.map(x=>x.id===e.id?{...x,time:ev.target.value}:x));await supabase.from("culture_events").update({time:ev.target.value}).eq("id",e.id);}} placeholder="Time" style={{padding:"7px 9px",fontSize:12,borderRadius:8,fontFamily:"Georgia,serif"}}/>
                  </div>
                  <input value={e.location} onChange={async ev=>{setEvents(p=>p.map(x=>x.id===e.id?{...x,location:ev.target.value}:x));await supabase.from("culture_events").update({location:ev.target.value}).eq("id",e.id);}} placeholder="Location" style={{width:"100%",padding:"7px 9px",fontSize:12,borderRadius:8,fontFamily:"Georgia,serif",boxSizing:"border-box",marginBottom:7}}/>
                  <textarea value={e.notes} onChange={async ev=>{setEvents(p=>p.map(x=>x.id===e.id?{...x,notes:ev.target.value}:x));await supabase.from("culture_events").update({notes:ev.target.value}).eq("id",e.id);}} placeholder="Notes..." style={{width:"100%",minHeight:50,padding:"7px 9px",fontSize:12,borderRadius:8,fontFamily:"Georgia,serif",resize:"vertical",boxSizing:"border-box"}}/>
                </div>
              )}
            </div>
          );
        })}

        {/* Add event form */}
        <div style={{marginTop:14,paddingTop:14,borderTop:"0.5px solid rgba(255,255,255,0.07)"}}>
          <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Add new event</div>

          {/* AI prompt input */}
          <div style={{marginBottom:10}}>
            <textarea
              value={promptText}
              onChange={e=>setPromptText(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();parseEventPrompt();}}}
              placeholder="Describe the event… e.g. Top Golf Saturday June 21 at 2pm, meet at the parking lot"
              style={{width:"100%",minHeight:64,padding:"10px 12px",fontSize:13,borderRadius:10,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"#fff",fontFamily:"Georgia,serif",resize:"none",boxSizing:"border-box",lineHeight:1.55}}
            />
            <button onClick={parseEventPrompt} disabled={parsing||!promptText.trim()}
              style={{width:"100%",padding:"9px",borderRadius:9,border:"none",background:parsing||!promptText.trim()?"rgba(255,255,255,0.07)":"linear-gradient(135deg,"+PUR+",#3a32a0)",color:parsing||!promptText.trim()?"rgba(255,255,255,0.2)":"#fff",fontSize:12,fontWeight:700,cursor:parsing||!promptText.trim()?"not-allowed":"pointer",fontFamily:"Georgia,serif",marginTop:5}}>
              {parsing?"Parsing…":"✦ Fill in details →"}
            </button>
            {parseErr&&<div style={{fontSize:11,color:RED,marginTop:5,textAlign:"center"}}>Couldn't parse — fill in the fields below manually</div>}
          </div>

          {/* Detail fields (auto-filled or manual) */}
          <div style={{background:"rgba(255,255,255,0.03)",borderRadius:10,padding:"10px 10px 6px",border:"1px solid rgba(255,255,255,0.06)",marginBottom:8}}>
            <div style={{fontSize:9,color:"#444",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Details</div>
            <input value={newEvent.name} onChange={e=>setNewEvent(p=>({...p,name:e.target.value}))} placeholder="Event name" style={{width:"100%",padding:"8px 10px",fontSize:13,borderRadius:9,border:"1px solid rgba(255,255,255,0.09)",background:"rgba(255,255,255,0.05)",color:"#fff",fontFamily:"Georgia,serif",boxSizing:"border-box",marginBottom:6}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}>
              <input type="date" value={newEvent.date} onChange={e=>setNewEvent(p=>({...p,date:e.target.value}))} style={{padding:"7px 9px",fontSize:12,borderRadius:8,border:"1px solid rgba(255,255,255,0.09)",background:"rgba(255,255,255,0.05)",color:"#fff",fontFamily:"Georgia,serif"}}/>
              <input value={newEvent.time} onChange={e=>setNewEvent(p=>({...p,time:e.target.value}))} placeholder="Time" style={{padding:"7px 9px",fontSize:12,borderRadius:8,border:"1px solid rgba(255,255,255,0.09)",background:"rgba(255,255,255,0.05)",color:"#fff",fontFamily:"Georgia,serif"}}/>
            </div>
            <input value={newEvent.location} onChange={e=>setNewEvent(p=>({...p,location:e.target.value}))} placeholder="Location" style={{width:"100%",padding:"8px 10px",fontSize:12,borderRadius:9,border:"1px solid rgba(255,255,255,0.09)",background:"rgba(255,255,255,0.05)",color:"#fff",fontFamily:"Georgia,serif",boxSizing:"border-box",marginBottom:6}}/>
            <textarea value={newEvent.notes} onChange={e=>setNewEvent(p=>({...p,notes:e.target.value}))} placeholder="Notes (optional)" style={{width:"100%",minHeight:48,padding:"8px 10px",fontSize:12,borderRadius:9,border:"1px solid rgba(255,255,255,0.09)",background:"rgba(255,255,255,0.05)",color:"#fff",fontFamily:"Georgia,serif",resize:"none",boxSizing:"border-box"}}/>
          </div>

          <button onClick={addEvent} disabled={!newEvent.name.trim()}
            style={{width:"100%",padding:"11px",borderRadius:10,border:"none",background:newEvent.name.trim()?"linear-gradient(135deg,"+GOLD+","+ORANGE+")":"rgba(255,255,255,0.07)",color:newEvent.name.trim()?"#1a1a1a":"rgba(255,255,255,0.2)",fontSize:13,fontWeight:700,cursor:newEvent.name.trim()?"pointer":"not-allowed",fontFamily:"Georgia,serif"}}>
            Add event →
          </button>
        </div>
      </div>

      {/* GroupMe composer */}
      <div style={{...glass({borderRadius:16}),padding:"1.25rem",marginBottom:12,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GREEN+",transparent)"}}/>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <Icon name="megaphone" size={14} color={GREEN}/>
          <span style={{fontSize:13,fontWeight:700,color:"#fff"}}>GroupMe Composer</span>
        </div>

        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
          {templates.map(t=>(
            <div key={t.id} style={{display:"flex",alignItems:"center",gap:3}}>
              <button onClick={()=>{hTap();setMsgType(t.id);}}
                style={{padding:"6px 11px",borderRadius:8,border:"1px solid "+(msgType===t.id?GREEN+"55":"rgba(255,255,255,0.08)"),background:msgType===t.id?"rgba(30,107,58,0.2)":"rgba(255,255,255,0.04)",color:msgType===t.id?GREEN:"#888",fontSize:11,fontWeight:msgType===t.id?600:400,cursor:"pointer",fontFamily:"Georgia,serif",transition:"all 0.15s"}}>
                {t.label}
              </button>
              {!DEFAULT_TEMPLATES.find(d=>d.id===t.id)&&(
                <button onClick={()=>deleteTemplate(t)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.25)",fontSize:10,cursor:"pointer",padding:"0 2px"}}>✕</button>
              )}
            </div>
          ))}
          <button onClick={()=>setShowAddTemplate(!showAddTemplate)}
            style={{padding:"6px 11px",borderRadius:8,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:"#666",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>
            + New
          </button>
        </div>

        {showAddTemplate&&(
          <div style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"12px",marginBottom:10,border:"1px solid rgba(255,255,255,0.08)"}}>
            <input value={newTemplate.label} onChange={e=>setNewTemplate(p=>({...p,label:e.target.value}))} placeholder="Template name..." style={{width:"100%",padding:"7px 9px",fontSize:12,borderRadius:8,fontFamily:"Georgia,serif",boxSizing:"border-box",marginBottom:7}}/>
            <textarea value={newTemplate.text} onChange={e=>setNewTemplate(p=>({...p,text:e.target.value}))} placeholder="Write your template..." style={{width:"100%",minHeight:80,padding:"7px 9px",fontSize:12,borderRadius:8,fontFamily:"Georgia,serif",resize:"vertical",boxSizing:"border-box",marginBottom:7}}/>
            <div style={{display:"flex",gap:7}}>
              <button onClick={saveTemplate} style={{flex:1,padding:"7px",borderRadius:8,border:"none",background:"linear-gradient(135deg,"+GREEN+",#0e4a20)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif"}}>Save template</button>
              <button onClick={()=>setShowAddTemplate(false)} style={{padding:"7px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"#666",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>Cancel</button>
            </div>
          </div>
        )}

        <button onClick={()=>setGroupMsg(activeTemplate?.text||"")}
          style={{width:"100%",padding:"10px",borderRadius:10,border:"none",background:"linear-gradient(135deg,"+PUR+",#3a32a0)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif",marginBottom:10}}>
          Load template →
        </button>
        {groupMsg&&(
          <>
            <textarea value={groupMsg} onChange={e=>setGroupMsg(e.target.value)}
              style={{width:"100%",minHeight:140,padding:"10px",fontSize:13,borderRadius:10,fontFamily:"Georgia,serif",resize:"vertical",boxSizing:"border-box",marginBottom:8}}/>
            <button onClick={()=>{navigator.clipboard.writeText(groupMsg);setCopied(true);setTimeout(()=>setCopied(false),2000);}}
              style={{width:"100%",padding:"11px",borderRadius:10,border:"none",background:copied?"linear-gradient(135deg,"+GREEN+",#0e4a20)":"linear-gradient(135deg,"+STEEL+",#4a5568)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Georgia,serif"}}>
              {copied?"Copied! Paste into GroupMe ✓":"Copy message →"}
            </button>
          </>
        )}
      </div>

      {/* Event photo wall */}
      <div style={{...glass({borderRadius:16}),padding:"1.25rem",marginBottom:12,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+STEEL+",transparent)"}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"#fff",display:"flex",alignItems:"center",gap:8}}>
              <Icon name="camera" size={13} color={STEEL}/> Event Photos
            </div>
            <div style={{fontSize:11,color:"#555",marginTop:2}}>Top Golf, cookouts, workouts, culture moments</div>
          </div>
          <label style={{padding:"7px 13px",borderRadius:9,border:"1px solid "+STEEL+"55",background:"rgba(255,255,255,0.04)",color:STEEL,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"Georgia,serif"}}>
            + Upload
            <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(f)uploadPhoto(f,"");}}/>
          </label>
        </div>

        {selectedPhoto&&(
          <div onClick={()=>setSelectedPhoto(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.96)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}>
            <img src={selectedPhoto.photo_url} style={{maxWidth:"90vw",maxHeight:"80vh",borderRadius:12,objectFit:"contain"}} alt=""/>
            {selectedPhoto.caption&&<div style={{fontSize:13,color:"#fff"}}>{selectedPhoto.caption}</div>}
            <button onClick={e=>{e.stopPropagation();deletePhoto(selectedPhoto.id);setSelectedPhoto(null);}}
              style={{padding:"7px 18px",borderRadius:9,border:"1px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.06)",color:"#888",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>
              Delete photo
            </button>
          </div>
        )}

        {photos.length===0?(
          <EmptyState icon="camera" color={STEEL} title="No photos yet" hint="Tap Upload to add event photos — cookouts, golf, culture moments." />
        ):(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {photos.map((p,i)=>(
              <div key={i} onClick={()=>setSelectedPhoto(p)} style={{cursor:"pointer",borderRadius:10,overflow:"hidden",aspectRatio:"1",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)"}}>
                <img src={p.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recurring events reference */}
      <div style={{...glass({borderRadius:16}),padding:"1.25rem",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+PUR+",transparent)"}}/>
        <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
          <Icon name="compass" size={13} color={PUR}/> Recurring Culture Events
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {RECURRING.map((r,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"11px 12px",border:"1px solid rgba(255,255,255,0.07)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                <Icon name={r.icon} size={16} color={PUR}/>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:"#ddd"}}>{r.label}</div>
                  <div style={{fontSize:10,color:PUR,fontWeight:600}}>{r.freq}</div>
                </div>
              </div>
              <div style={{fontSize:10,color:"#555",lineHeight:1.5}}>{r.notes}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
