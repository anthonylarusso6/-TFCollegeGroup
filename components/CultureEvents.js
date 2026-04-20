import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const BG="#0f0f0f";
const PUR="#534AB7";
const RED="#C0392B";
const GREEN="#1E6B3A";
const GOLD="#D4AF37";
const STEEL="#708090";

const RECURRING=[
  {label:"Top Golf outing",icon:"⛳",freq:"Once per month",notes:"Book in advance. Split into groups by draft group."},
  {label:"Team cookout",icon:"🔥",freq:"Every 3 weeks",notes:"Rotate host. Everyone brings something."},
  {label:"Movie night",icon:"🎬",freq:"Every other week",notes:"Vote on movie. Keep it faith-friendly."},
  {label:"Community service",icon:"🤝",freq:"Once per month",notes:"Serve together as a team. Builds culture fast."},
  {label:"Bowling night",icon:"🎳",freq:"Monthly",notes:"Great for competition and laughs."},
  {label:"Team breakfast",icon:"🥞",freq:"Weekly optional",notes:"Before Monday session. Early arrivals only."},
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

  useEffect(()=>{loadAll();},[]);

  const loadAll=async()=>{
    setLoading(true);
    // Load events
    const{data:evData}=await supabase.from("culture_events").select("*").order("date",{ascending:true}).catch(()=>({data:[]}));
    if(evData)setEvents(evData);
    // Load RSVPs
    const{data:rsvpData}=await supabase.from("culture_rsvps").select("*").catch(()=>({data:[]}));
    if(rsvpData){
      const map={};
      rsvpData.forEach(r=>{
        if(!map[r.event_id])map[r.event_id]=[];
        map[r.event_id].push(r.athlete_name);
      });
      setRsvpMap(map);
    }
    // Load photos
    const{data:photoData}=await supabase.from("culture_photos").select("*").order("created_at",{ascending:false}).catch(()=>({data:[]}));
    if(photoData)setPhotos(photoData);
    // Load custom templates
    const{data:tmplData}=await supabase.from("culture_templates").select("*").catch(()=>({data:[]}));
    if(tmplData&&tmplData.length>0)setTemplates([...DEFAULT_TEMPLATES,...tmplData]);
    setLoading(false);
  };

  const addEvent=async()=>{
    if(!newEvent.name.trim())return;
    const{data}=await supabase.from("culture_events").insert({...newEvent}).select().single().catch(()=>({data:null}));
    if(data)setEvents(p=>[...p,data]);
    setNewEvent({name:"",date:"",time:"",location:"",notes:""});
  };

  const deleteEvent=async(id)=>{
    if(!window.confirm("Delete this event?"))return;
    await supabase.from("culture_events").delete().eq("id",id).catch(()=>{});
    setEvents(p=>p.filter(e=>e.id!==id));
  };

  const toggleRsvp=async(eventId,name)=>{
    const current=rsvpMap[eventId]||[];
    const isIn=current.includes(name);
    if(isIn){
      await supabase.from("culture_rsvps").delete().eq("event_id",eventId).eq("athlete_name",name).catch(()=>{});
      setRsvpMap(p=>({...p,[eventId]:current.filter(n=>n!==name)}));
    }else{
      await supabase.from("culture_rsvps").insert({event_id:eventId,athlete_name:name}).catch(()=>{});
      setRsvpMap(p=>({...p,[eventId]:[...current,name]}));
    }
  };

  const uploadPhoto=async(file,caption)=>{
    const reader=new FileReader();
    reader.onload=async(e)=>{
      const{data}=await supabase.from("culture_photos").insert({photo_url:e.target.result,caption:caption||""}).select().single().catch(()=>({data:null}));
      if(data)setPhotos(p=>[data,...p]);
    };
    reader.readAsDataURL(file);
  };

  const deletePhoto=async(id)=>{
    await supabase.from("culture_photos").delete().eq("id",id).catch(()=>{});
    setPhotos(p=>p.filter(x=>x.id!==id));
  };

  const saveTemplate=async()=>{
    if(!newTemplate.label.trim()||!newTemplate.text.trim())return;
    const{data}=await supabase.from("culture_templates").insert({label:newTemplate.label,text:newTemplate.text}).select().single().catch(()=>({data:null}));
    const t={id:data?.id||Date.now(),label:newTemplate.label,text:newTemplate.text};
    setTemplates(p=>[...p,t]);
    setNewTemplate({label:"",text:""});
    setShowAddTemplate(false);
  };

  const deleteTemplate=async(t)=>{
    if(DEFAULT_TEMPLATES.find(d=>d.id===t.id))return;
    await supabase.from("culture_templates").delete().eq("id",t.id).catch(()=>{});
    setTemplates(p=>p.filter(x=>x.id!==t.id));
  };

  const daysUntil=(dateStr)=>{
    if(!dateStr)return null;
    const diff=new Date(dateStr)-new Date();
    const days=Math.ceil(diff/(1000*60*60*24));
    return days;
  };

  const activeTemplate=templates.find(t=>t.id===msgType)||templates[0];

  if(loading)return<div style={{textAlign:"center",padding:"2rem",color:"#888",fontSize:13}}>Loading...</div>;

  return(
    <div>
      {/* Upcoming events */}
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+GOLD}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Upcoming events</div>
        {events.length===0&&<div style={{fontSize:12,color:"#aaa",textAlign:"center",padding:"1rem 0"}}>No events yet. Add one below.</div>}
        {events.map(e=>{
          const days=daysUntil(e.date);
          const rsvps=rsvpMap[e.id]||[];
          return(
            <div key={e.id} style={{padding:"10px 0",borderBottom:"0.5px solid #f0f0f0"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <div style={{fontSize:13,fontWeight:500,color:"#1a1a1a"}}>{e.name}</div>
                    {days!==null&&days>=0&&(
                      <span style={{fontSize:10,padding:"1px 7px",borderRadius:4,background:days<=3?"#FCEBEB":days<=7?"#FAEEDA":"#EAF3DE",color:days<=3?RED:days<=7?"#854F0B":GREEN,fontWeight:500}}>
                        {days===0?"Today!":days===1?"Tomorrow":"In "+days+" days"}
                      </span>
                    )}
                    {rsvps.length>0&&<span style={{fontSize:10,color:PUR}}>✓ {rsvps.length} coming</span>}
                  </div>
                  {e.date&&<div style={{fontSize:11,color:"#888",marginTop:2}}>{e.date}{e.time&&" · "+e.time}</div>}
                  {e.location&&<div style={{fontSize:11,color:"#888"}}>{e.location}</div>}
                  {e.notes&&<div style={{fontSize:11,color:"#aaa",fontStyle:"italic",marginTop:2}}>{e.notes}</div>}
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>setExpandRsvp(expandRsvp===e.id?null:e.id)} style={{padding:"4px 8px",borderRadius:6,border:"0.5px solid "+PUR,background:"transparent",color:PUR,fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>RSVP</button>
                  <button onClick={()=>setActiveEvent(activeEvent===e.id?null:e.id)} style={{padding:"4px 8px",borderRadius:6,border:"0.5px solid #e0e0e0",background:"transparent",color:"#888",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>Edit</button>
                  <button onClick={()=>deleteEvent(e.id)} style={{padding:"4px 6px",borderRadius:6,border:"0.5px solid #ffcccc",background:"transparent",color:RED,fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>✕</button>
                </div>
              </div>

              {/* RSVP tracker */}
              {expandRsvp===e.id&&(
                <div style={{marginTop:10,padding:"10px",background:"#f9f9f9",borderRadius:8,border:"0.5px solid #e0e0e0"}}>
                  <div style={{fontSize:11,fontWeight:500,color:"#888",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.04em"}}>Who's coming?</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                    {(athletes||[]).filter(a=>a.status==="active").map(a=>{
                      const isIn=(rsvpMap[e.id]||[]).includes(a.name);
                      return(
                        <button key={a.id} onClick={()=>toggleRsvp(e.id,a.name)} style={{padding:"6px 4px",borderRadius:8,border:"0.5px solid "+(isIn?GREEN:"#e0e0e0"),background:isIn?"#EAF3DE":"#fff",cursor:"pointer",fontFamily:"Georgia,serif",textAlign:"center"}}>
                          <div style={{width:28,height:28,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,margin:"0 auto 3px",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:500,color:"#fff"}}>
                            {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(a.name||"?")[0]}
                          </div>
                          <div style={{fontSize:10,color:isIn?GREEN:"#888",fontWeight:isIn?600:400}}>{a.name.split(" ")[0]}</div>
                        </button>
                      );
                    })}
                  </div>
                  {rsvps.length>0&&<div style={{fontSize:11,color:GREEN,marginTop:8}}>✓ {rsvps.join(", ")}</div>}
                </div>
              )}

              {/* Edit */}
              {activeEvent===e.id&&(
                <div style={{marginTop:10,padding:"10px",background:"#f9f9f9",borderRadius:8,border:"0.5px solid #e0e0e0"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}>
                    <input value={e.date} onChange={async ev=>{setEvents(p=>p.map(x=>x.id===e.id?{...x,date:ev.target.value}:x));await supabase.from("culture_events").update({date:ev.target.value}).eq("id",e.id);}} placeholder="Date" style={{padding:"6px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:6,background:"#fff",color:"#1a1a1a",fontFamily:"Georgia,serif"}}/>
                    <input value={e.time} onChange={async ev=>{setEvents(p=>p.map(x=>x.id===e.id?{...x,time:ev.target.value}:x));await supabase.from("culture_events").update({time:ev.target.value}).eq("id",e.id);}} placeholder="Time" style={{padding:"6px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:6,background:"#fff",color:"#1a1a1a",fontFamily:"Georgia,serif"}}/>
                  </div>
                  <input value={e.location} onChange={async ev=>{setEvents(p=>p.map(x=>x.id===e.id?{...x,location:ev.target.value}:x));await supabase.from("culture_events").update({location:ev.target.value}).eq("id",e.id);}} placeholder="Location" style={{width:"100%",padding:"6px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:6,background:"#fff",color:"#1a1a1a",fontFamily:"Georgia,serif",boxSizing:"border-box",marginBottom:6}}/>
                  <textarea value={e.notes} onChange={async ev=>{setEvents(p=>p.map(x=>x.id===e.id?{...x,notes:ev.target.value}:x));await supabase.from("culture_events").update({notes:ev.target.value}).eq("id",e.id);}} placeholder="Notes..." style={{width:"100%",minHeight:50,padding:"6px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:6,background:"#fff",color:"#1a1a1a",fontFamily:"Georgia,serif",resize:"vertical",boxSizing:"border-box"}}/>
                </div>
              )}
            </div>
          );
        })}

        {/* Add event */}
        <div style={{marginTop:14,paddingTop:14,borderTop:"0.5px solid #f0f0f0"}}>
          <div style={{fontSize:11,color:"#888",marginBottom:8}}>Add new event</div>
          <input value={newEvent.name} onChange={e=>setNewEvent(p=>({...p,name:e.target.value}))} placeholder="Event name" style={{width:"100%",padding:"6px 8px",fontSize:13,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia,serif",boxSizing:"border-box",marginBottom:6}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}>
            <input type="date" value={newEvent.date} onChange={e=>setNewEvent(p=>({...p,date:e.target.value}))} style={{padding:"6px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:6,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia,serif"}}/>
            <input value={newEvent.time} onChange={e=>setNewEvent(p=>({...p,time:e.target.value}))} placeholder="Time" style={{padding:"6px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:6,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia,serif"}}/>
          </div>
          <input value={newEvent.location} onChange={e=>setNewEvent(p=>({...p,location:e.target.value}))} placeholder="Location" style={{width:"100%",padding:"6px 8px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia,serif",boxSizing:"border-box",marginBottom:6}}/>
          <button onClick={addEvent} disabled={!newEvent.name.trim()} style={{width:"100%",padding:"8px",borderRadius:8,border:"none",background:newEvent.name.trim()?GOLD:"#e0e0e0",color:newEvent.name.trim()?"#1a1a1a":"#aaa",fontSize:13,fontWeight:500,cursor:newEvent.name.trim()?"pointer":"not-allowed",fontFamily:"Georgia,serif"}}>Add event →</button>
        </div>
      </div>

      {/* GroupMe composer */}
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+GREEN}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>GroupMe message composer</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
          {templates.map(t=>(
            <div key={t.id} style={{display:"flex",alignItems:"center",gap:4}}>
              <button onClick={()=>setMsgType(t.id)} style={{padding:"6px 10px",borderRadius:8,border:"0.5px solid "+(msgType===t.id?GREEN:"#e0e0e0"),background:msgType===t.id?"#EAF3DE":"transparent",color:msgType===t.id?GREEN:"#888",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                {t.label}
              </button>
              {!DEFAULT_TEMPLATES.find(d=>d.id===t.id)&&(
                <button onClick={()=>deleteTemplate(t)} style={{background:"transparent",border:"none",color:"#ccc",fontSize:10,cursor:"pointer",padding:0}}>✕</button>
              )}
            </div>
          ))}
          <button onClick={()=>setShowAddTemplate(!showAddTemplate)} style={{padding:"6px 10px",borderRadius:8,border:"0.5px solid #e0e0e0",background:"transparent",color:"#888",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>+ New</button>
        </div>

        {showAddTemplate&&(
          <div style={{background:"#f9f9f9",borderRadius:10,padding:"10px",marginBottom:10,border:"0.5px solid #e0e0e0"}}>
            <input value={newTemplate.label} onChange={e=>setNewTemplate(p=>({...p,label:e.target.value}))} placeholder="Template name..." style={{width:"100%",padding:"6px 8px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:6,background:"#fff",color:"#1a1a1a",fontFamily:"Georgia,serif",boxSizing:"border-box",marginBottom:6}}/>
            <textarea value={newTemplate.text} onChange={e=>setNewTemplate(p=>({...p,text:e.target.value}))} placeholder="Write your template..." style={{width:"100%",minHeight:80,padding:"6px 8px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:6,background:"#fff",color:"#1a1a1a",fontFamily:"Georgia,serif",resize:"vertical",boxSizing:"border-box",marginBottom:6}}/>
            <div style={{display:"flex",gap:6}}>
              <button onClick={saveTemplate} style={{flex:1,padding:"6px",borderRadius:6,border:"none",background:GREEN,color:"#fff",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>Save template</button>
              <button onClick={()=>setShowAddTemplate(false)} style={{padding:"6px 12px",borderRadius:6,border:"0.5px solid #e0e0e0",background:"transparent",color:"#888",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>Cancel</button>
            </div>
          </div>
        )}

        <button onClick={()=>setGroupMsg(activeTemplate?.text||"")} style={{width:"100%",padding:"8px",borderRadius:8,border:"none",background:PUR,color:"#fff",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"Georgia,serif",marginBottom:10}}>
          Load template →
        </button>
        {groupMsg&&(
          <>
            <textarea value={groupMsg} onChange={e=>setGroupMsg(e.target.value)} style={{width:"100%",minHeight:140,padding:"8px",fontSize:13,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia,serif",resize:"vertical",boxSizing:"border-box",marginBottom:8}}/>
            <button onClick={()=>{navigator.clipboard.writeText(groupMsg);setCopied(true);setTimeout(()=>setCopied(false),2000);}} style={{width:"100%",padding:"8px",borderRadius:8,border:"none",background:copied?GREEN:STEEL,color:"#fff",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"Georgia,serif"}}>
              {copied?"Copied! Paste into GroupMe ✓":"Copy message →"}
            </button>
          </>
        )}
      </div>

      {/* Photo wall */}
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+STEEL}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a"}}>📸 Event photos</div>
            <div style={{fontSize:12,color:"#888"}}>Top Golf, cookouts, workouts, culture moments</div>
          </div>
          <label style={{padding:"6px 12px",borderRadius:8,border:"0.5px solid "+STEEL,background:"transparent",color:STEEL,fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>
            + Upload
            <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(f)uploadPhoto(f,"");}}/>
          </label>
        </div>
        {selectedPhoto&&(
          <div onClick={()=>setSelectedPhoto(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}>
            <img src={selectedPhoto.photo_url} style={{maxWidth:"90vw",maxHeight:"80vh",borderRadius:12,objectFit:"contain"}} alt=""/>
            {selectedPhoto.caption&&<div style={{fontSize:13,color:"#fff"}}>{selectedPhoto.caption}</div>}
            <button onClick={e=>{e.stopPropagation();deletePhoto(selectedPhoto.id);setSelectedPhoto(null);}} style={{padding:"6px 16px",borderRadius:8,border:"0.5px solid #555",background:"transparent",color:"#aaa",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>Delete photo</button>
          </div>
        )}
        {photos.length===0&&(
          <div style={{background:"#f9f9f9",borderRadius:10,padding:"2rem",textAlign:"center",border:"1px dashed #e0e0e0"}}>
            <div style={{fontSize:32,marginBottom:8}}>📸</div>
            <div style={{fontSize:13,color:"#888"}}>No photos yet — tap Upload to add event photos</div>
          </div>
        )}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {photos.map((p,i)=>(
            <div key={i} onClick={()=>setSelectedPhoto(p)} style={{cursor:"pointer",borderRadius:10,overflow:"hidden",aspectRatio:"1",background:"#f0f0f0"}}>
              <img src={p.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>
            </div>
          ))}
        </div>
      </div>

      {/* Recurring events reference */}
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0",borderTop:"3px solid "+PUR}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Recurring culture events</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {RECURRING.map((r,i)=>(
            <div key={i} style={{background:"#f9f9f9",borderRadius:10,padding:"10px 12px",border:"0.5px solid #e0e0e0"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <span style={{fontSize:20}}>{r.icon}</span>
                <div>
                  <div style={{fontSize:13,fontWeight:500,color:"#1a1a1a"}}>{r.label}</div>
                  <div style={{fontSize:11,color:PUR}}>{r.freq}</div>
                </div>
              </div>
              <div style={{fontSize:11,color:"#888"}}>{r.notes}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
