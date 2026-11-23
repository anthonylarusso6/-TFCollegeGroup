import { useState, useEffect } from "react";
import { BG, PUR, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { supabase } from "../lib/supabase";
import { nowEST } from "../lib/dates";
import { SkeletonList } from "./Skeleton";
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

// "2026-06-20" -> { mon:"Jun", day:20, wd:"Sat" }; anything else (free text) -> null
const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WEEKDAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const dateParts=(s)=>{
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s||"").trim());
  if(!m)return null;
  const d=new Date(+m[1],+m[2]-1,+m[3]);
  if(isNaN(d))return null;
  return{mon:MONTHS[d.getMonth()],day:d.getDate(),wd:WEEKDAYS[d.getDay()]};
};

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
    const today=nowEST();
    const yyyy=today.getFullYear(),mm=String(today.getMonth()+1).padStart(2,"0"),dd=String(today.getDate()).padStart(2,"0");
    try{
      const res=await fetch("/api/ai-task",{method:"POST",headers:{"Content-Type":"application/json","x-app-secret":process.env.NEXT_PUBLIC_APP_ACTION_SECRET||""},body:JSON.stringify({prompt:`Today is ${yyyy}-${mm}-${dd}. Parse this event description and return ONLY a JSON object with these keys: name (string), date (YYYY-MM-DD string or ""), time (readable string like "3:00 PM" or ""), location (string or ""), notes (any extra details or ""). No markdown, no explanation, just the JSON.\n\nEvent: "${promptText.trim()}"`})});
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
    // Compare EST calendar dates (midnight to midnight) so the count isn't off by one
    // from parsing "YYYY-MM-DD" as UTC while "now" is local.
    const est=nowEST();
    const today=new Date(est.getFullYear(),est.getMonth(),est.getDate());
    const parts=String(dateStr).split("-").map(Number);
    if(parts.length!==3||parts.some(isNaN))return null;
    const target=new Date(parts[0],parts[1]-1,parts[2]);
    return Math.round((target-today)/(1000*60*60*24));
  };

  const activeTemplate=templates.find(t=>t.id===msgType)||templates[0];

  if(loading)return<div style={{paddingTop:8}}><SkeletonList rows={4}/></div>;

  return(
    <div className="tfx cc">

      {/* Upcoming events */}
      <section className="tfx-card cc-head">
        <div className="cc-top">
          <div>
            <div className="tfx-eyebrow">Culture</div>
            <h2>Upcoming events</h2>
            <p>{events.length} {events.length===1?"event":"events"} · RSVPs, GroupMe and photos</p>
          </div>
        </div>

        {events.length===0&&(
          <div className="cc-empty is-gold">
            <span className="cc-empty-ico"><Icon name="calendar" size={22}/></span>
            <b>No events yet</b>
            <p>Add one below to start tracking team culture activities.</p>
          </div>
        )}

        {events.length>0&&(
          <div className="cc-evs">
            {events.map(e=>{
              const days=daysUntil(e.date);
              const rsvps=rsvpMap[e.id]||[];
              const dp=dateParts(e.date);
              return(
                <article key={e.id} className={"cc-ev"+(days!==null&&days>=0&&days<=1?" is-soon":"")}>
                  <div className="cc-ev-main">
                    <div className={"cc-date"+(dp?"":" is-none")} aria-hidden="true">
                      {dp?<><small>{dp.mon}</small><b className="tfx-num">{dp.day}</b></>:<b>—</b>}
                    </div>
                    <div className="cc-ev-txt">
                      <h3 className="cc-ev-name">{e.name}</h3>
                      {((days!==null&&days>=0)||rsvps.length>0)&&(
                        <div className="cc-ev-pills">
                          {days!==null&&days>=0&&(
                            <span className={"cc-pill "+(days<=3?"is-red":days<=7?"is-amber":"is-green")}>
                              {days===0?"Today!":days===1?"Tomorrow":"In "+days+"d"}
                            </span>
                          )}
                          {rsvps.length>0&&<span className="cc-pill is-violet">✓ {rsvps.length} coming</span>}
                        </div>
                      )}
                      {e.date&&<div className="cc-ev-meta"><Icon name="clock" size={14}/><span>{dp?dp.wd+", "+dp.mon+" "+dp.day:e.date}{e.time&&" · "+e.time}</span></div>}
                      {e.location&&<div className="cc-ev-meta"><Icon name="mapPin" size={14}/><span>{e.location}</span></div>}
                      {e.notes&&<p className="cc-ev-notes">{e.notes}</p>}
                    </div>
                  </div>
                  <div className="cc-ev-acts">
                    <button className="cc-mini is-tint is-violet tfx-press" aria-expanded={expandRsvp===e.id} onClick={()=>{hTap();setExpandRsvp(expandRsvp===e.id?null:e.id);}}>RSVP</button>
                    <button className="cc-mini tfx-press" aria-expanded={activeEvent===e.id} onClick={()=>{hTap();setActiveEvent(activeEvent===e.id?null:e.id);}}>Edit</button>
                    <button className="cc-ico is-del" onClick={()=>deleteEvent(e.id)} aria-label={"Delete "+(e.name||"event")} title="Delete event">✕</button>
                  </div>

                  {expandRsvp===e.id&&(
                    <div className="cc-panel">
                      <div className="tfx-eyebrow">Who's coming?</div>
                      <div className="cc-rsvps">
                        {(athletes||[]).filter(a=>a.status==="active").map(a=>{
                          const isIn=(rsvpMap[e.id]||[]).includes(a.name);
                          return(
                            <button key={a.id} className={"cc-rsvp tfx-press"+(isIn?" is-in":"")} aria-pressed={isIn} onClick={()=>{hTap();toggleRsvp(e.id,a.name);}}>
                              <span className="rk-av cc-av is-sm" style={{"--c":a.role==="forge"?RED:STEEL}}>
                                {a.photo_url?<img src={a.photo_url} alt=""/>:(a.name||"?")[0]}
                              </span>
                              <span>{(a.name||"").split(" ")[0]}</span>
                            </button>
                          );
                        })}
                      </div>
                      {rsvps.length>0&&<p className="cc-going">✓ {rsvps.join(", ")}</p>}
                    </div>
                  )}

                  {activeEvent===e.id&&(
                    <div className="cc-panel">
                      <div className="cc-grid2">
                        <input className="cc-in" value={e.date} onChange={async ev=>{setEvents(p=>p.map(x=>x.id===e.id?{...x,date:ev.target.value}:x));await supabase.from("culture_events").update({date:ev.target.value}).eq("id",e.id);}} placeholder="Date" aria-label="Date"/>
                        <input className="cc-in" value={e.time} onChange={async ev=>{setEvents(p=>p.map(x=>x.id===e.id?{...x,time:ev.target.value}:x));await supabase.from("culture_events").update({time:ev.target.value}).eq("id",e.id);}} placeholder="Time" aria-label="Time"/>
                      </div>
                      <input className="cc-in" value={e.location} onChange={async ev=>{setEvents(p=>p.map(x=>x.id===e.id?{...x,location:ev.target.value}:x));await supabase.from("culture_events").update({location:ev.target.value}).eq("id",e.id);}} placeholder="Location" aria-label="Location"/>
                      <textarea className="cc-in" value={e.notes} onChange={async ev=>{setEvents(p=>p.map(x=>x.id===e.id?{...x,notes:ev.target.value}:x));await supabase.from("culture_events").update({notes:ev.target.value}).eq("id",e.id);}} placeholder="Notes..." aria-label="Notes"/>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Add event form */}
      <section className="tfx-card cc-sec">
        <div className="cc-sec-head">
          <div>
            <div className="tfx-eyebrow">New event</div>
            <h3>Add new event</h3>
          </div>
        </div>

        {/* AI prompt input */}
        <div className="cc-form">
          <textarea
            className="cc-in"
            value={promptText}
            onChange={e=>setPromptText(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();parseEventPrompt();}}}
            placeholder="Describe the event… e.g. Top Golf Saturday June 21 at 2pm, meet at the parking lot"
            aria-label="Describe the event"
          />
          <button className="tfx-btn-ghost tfx-press cc-btn cc-wide cc-tint is-violet" onClick={parseEventPrompt} disabled={parsing||!promptText.trim()}>
            {parsing?"Parsing…":"✦ Fill in details →"}
          </button>
          {parseErr&&<div className="cc-err" role="alert">Couldn't parse — fill in the fields below manually</div>}
        </div>

        {/* Detail fields (auto-filled or manual) */}
        <div className="cc-box">
          <div className="tfx-eyebrow">Details</div>
          <input className="cc-in" value={newEvent.name} onChange={e=>setNewEvent(p=>({...p,name:e.target.value}))} placeholder="Event name" aria-label="Event name"/>
          <div className="cc-grid2">
            <input className="cc-in" type="date" value={newEvent.date} onChange={e=>setNewEvent(p=>({...p,date:e.target.value}))} aria-label="Date"/>
            <input className="cc-in" value={newEvent.time} onChange={e=>setNewEvent(p=>({...p,time:e.target.value}))} placeholder="Time" aria-label="Time"/>
          </div>
          <input className="cc-in" value={newEvent.location} onChange={e=>setNewEvent(p=>({...p,location:e.target.value}))} placeholder="Location" aria-label="Location"/>
          <textarea className="cc-in" value={newEvent.notes} onChange={e=>setNewEvent(p=>({...p,notes:e.target.value}))} placeholder="Notes (optional)" aria-label="Notes"/>
        </div>

        <button className="tfx-btn tfx-press cc-wide" onClick={addEvent} disabled={!newEvent.name.trim()}>
          Add event →
        </button>
      </section>

      {/* GroupMe composer */}
      <section className="tfx-card cc-sec is-green">
        <div className="cc-sec-head">
          <div>
            <div className="tfx-eyebrow">Group message</div>
            <h3>GroupMe composer</h3>
          </div>
          <span className="cc-gico"><Icon name="megaphone" size={16}/></span>
        </div>

        <div className="cc-chips is-wrap" role="tablist" aria-label="Templates">
          {templates.map(t=>{
            const custom=!DEFAULT_TEMPLATES.find(d=>d.id===t.id);
            const chip=(
              <button key={t.id} role="tab" aria-selected={msgType===t.id} className={"tfx-chipbtn tfx-press"+(msgType===t.id?" is-on":"")} onClick={()=>{hTap();setMsgType(t.id);}}>
                {t.label}
              </button>
            );
            return custom?(
              <span key={t.id} className="cc-tpl">
                {chip}
                <button className="cc-tpl-x" onClick={()=>deleteTemplate(t)} aria-label={"Delete template "+t.label}>✕</button>
              </span>
            ):chip;
          })}
          <button className="tfx-chipbtn tfx-press" aria-expanded={showAddTemplate} onClick={()=>setShowAddTemplate(!showAddTemplate)}>
            + New
          </button>
        </div>

        {showAddTemplate&&(
          <div className="cc-box">
            <input className="cc-in" value={newTemplate.label} onChange={e=>setNewTemplate(p=>({...p,label:e.target.value}))} placeholder="Template name..." aria-label="Template name"/>
            <textarea className="cc-in" value={newTemplate.text} onChange={e=>setNewTemplate(p=>({...p,text:e.target.value}))} placeholder="Write your template..." aria-label="Template text"/>
            <div className="cc-row">
              <button className="tfx-btn tfx-press cc-btn cc-accent" onClick={saveTemplate}>Save template</button>
              <button className="tfx-btn-ghost tfx-press cc-btn" onClick={()=>setShowAddTemplate(false)}>Cancel</button>
            </div>
          </div>
        )}

        <button className="tfx-btn-ghost tfx-press cc-btn cc-wide" onClick={()=>setGroupMsg(activeTemplate?.text||"")}>
          Load template →
        </button>
        {groupMsg&&(
          <>
            <textarea className="cc-in cc-compose" value={groupMsg} onChange={e=>setGroupMsg(e.target.value)} aria-label="Message"/>
            <button className={"tfx-btn tfx-press cc-wide cc-copy"+(copied?" is-copied cc-accent":"")} onClick={()=>{navigator.clipboard.writeText(groupMsg);setCopied(true);setTimeout(()=>setCopied(false),2000);}}>
              {copied?"Copied! Paste into GroupMe ✓":"Copy message →"}
            </button>
          </>
        )}
      </section>

      {/* Event photo wall */}
      <section className="tfx-card cc-sec">
        <div className="cc-sec-head">
          <div>
            <div className="tfx-eyebrow">Gallery</div>
            <h3>Event photos</h3>
            <p>Top Golf, cookouts, workouts, culture moments</p>
          </div>
          <label className="cc-mini cc-upload">
            + Upload
            <input type="file" accept="image/*" className="cc-hide" onChange={e=>{const f=e.target.files[0];if(f)uploadPhoto(f,"");}}/>
          </label>
        </div>

        {photos.length===0?(
          <div className="cc-empty is-muted">
            <span className="cc-empty-ico"><Icon name="camera" size={22}/></span>
            <b>No photos yet</b>
            <p>Tap Upload to add event photos — cookouts, golf, culture moments.</p>
          </div>
        ):(
          <div className="cc-wall">
            {photos.map((p,i)=>(
              <button key={i} className="cc-thumb tfx-press" onClick={()=>setSelectedPhoto(p)} aria-label={"Open photo"+(p.caption?" — "+p.caption:"")}>
                <img src={p.photo_url} alt=""/>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Recurring events reference */}
      <section className="tfx-card cc-sec">
        <div className="cc-sec-head">
          <div>
            <div className="tfx-eyebrow">Ideas</div>
            <h3>Recurring culture events</h3>
          </div>
        </div>
        <div className="cc-ideas">
          {RECURRING.map((r,i)=>(
            <div key={i} className="cc-idea">
              <div className="cc-idea-top">
                <span><Icon name={r.icon} size={16}/></span>
                <div>
                  <b>{r.label}</b>
                  <small>{r.freq}</small>
                </div>
              </div>
              <p>{r.notes}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Lightbox lives outside the cards so position:fixed covers the screen */}
      {selectedPhoto&&(
        <div className="cc-lightbox" onClick={()=>setSelectedPhoto(null)} role="dialog" aria-label="Event photo">
          <img src={selectedPhoto.photo_url} alt=""/>
          {selectedPhoto.caption&&<p>{selectedPhoto.caption}</p>}
          <button onClick={e=>{e.stopPropagation();deletePhoto(selectedPhoto.id);setSelectedPhoto(null);}}>
            Delete photo
          </button>
        </div>
      )}

    </div>
  );
}
