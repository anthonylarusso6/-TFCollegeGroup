import { useState } from "react";

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

export default function CultureEvents(){
  const[events,setEvents]=useState([
    {id:1,name:"Top Golf",date:"",time:"",location:"",notes:"",rsvps:[],confirmed:false},
  ]);
  const[newEvent,setNewEvent]=useState({name:"",date:"",time:"",location:"",notes:""});
  const[activeEvent,setActiveEvent]=useState(null);
  const[groupMsg,setGroupMsg]=useState("");
  const[msgType,setMsgType]=useState("general");
  const[copied,setCopied]=useState(false);
  const[photos,setPhotos]=useState([]);

  const addEvent=()=>{
    if(!newEvent.name.trim())return;
    setEvents(p=>[...p,{...newEvent,id:Date.now(),rsvps:[],confirmed:false}]);
    setNewEvent({name:"",date:"",time:"",location:"",notes:""});
  };

  const deleteEvent=(id)=>{
    if(window.confirm("Delete this event?"))setEvents(p=>p.filter(e=>e.id!==id));
  };

  const MSG_TEMPLATES={
    general:`Hey TF College Group fam! 🙏\n\nJust a reminder — we're a program built on iron sharpening iron. That means showing up for each other on AND off the field.\n\nKeep pushing. See you Monday at 9am sharp.\n\n— Coach Ant`,
    event:`Hey TF College Group! 🔥\n\nWe've got [EVENT NAME] coming up on [DATE] at [TIME].\n\nLocation: [LOCATION]\n\nThis is family time. Show up, have fun, build the culture.\n\nLet Coach Ant know if you can make it.\n\n— Coach Ant ⚒`,
    hype:`LET'S GO TF COLLEGE GROUP! ⚒🔥\n\nThis week we go harder. Iron sharpens iron — let's remind each other what that means.\n\nEarly is the standard. Excellence is the expectation. Faith is the foundation.\n\nSee you Monday. Come ready.\n\n— Coach Ant`,
    reminder:`TF College Group reminder 📲\n\nClass tomorrow — Mon/Fri at 9am, Tue/Thu at 9:30am.\n\nEarly only. Late = 50 crunches. No show = shred mill.\n\nThe standard doesn't change. See you there.\n\n— Coach Ant`,
  };

  const generateMessage=()=>{
    setGroupMsg(MSG_TEMPLATES[msgType]||MSG_TEMPLATES.general);
  };

  const copyMessage=()=>{
    navigator.clipboard.writeText(groupMsg);
    setCopied(true);
    setTimeout(()=>setCopied(false),2000);
  };

  return(
    <div>
      {/* Recurring events reference */}
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+PUR}}>
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

      {/* Upcoming events */}
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+GOLD}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Upcoming events</div>
        {events.map(e=>(
          <div key={e.id} style={{padding:"10px 0",borderBottom:"0.5px solid #f0f0f0"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500,color:"#1a1a1a"}}>{e.name}</div>
                {e.date&&<div style={{fontSize:11,color:"#888"}}>{e.date}{e.time&&" · "+e.time}</div>}
                {e.location&&<div style={{fontSize:11,color:"#888"}}>{e.location}</div>}
                {e.notes&&<div style={{fontSize:11,color:"#aaa",fontStyle:"italic",marginTop:2}}>{e.notes}</div>}
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <button onClick={()=>setActiveEvent(activeEvent===e.id?null:e.id)} style={{padding:"4px 10px",borderRadius:6,border:"0.5px solid "+PUR,background:"transparent",color:PUR,fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                  {activeEvent===e.id?"Hide":"Details"}
                </button>
                <button onClick={()=>deleteEvent(e.id)} style={{padding:"4px 8px",borderRadius:6,border:"0.5px solid #ffcccc",background:"transparent",color:RED,fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>✕</button>
              </div>
            </div>
            {activeEvent===e.id&&(
              <div style={{marginTop:10,padding:"10px",background:"#f9f9f9",borderRadius:8,border:"0.5px solid #e0e0e0"}}>
                <div style={{fontSize:11,color:"#888",marginBottom:6}}>Quick edit</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}>
                  <input value={e.date} onChange={ev=>setEvents(p=>p.map(x=>x.id===e.id?{...x,date:ev.target.value}:x))} placeholder="Date" style={{padding:"6px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:6,background:"#fff",color:"#1a1a1a",fontFamily:"Georgia,serif"}}/>
                  <input value={e.time} onChange={ev=>setEvents(p=>p.map(x=>x.id===e.id?{...x,time:ev.target.value}:x))} placeholder="Time" style={{padding:"6px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:6,background:"#fff",color:"#1a1a1a",fontFamily:"Georgia,serif"}}/>
                </div>
                <input value={e.location} onChange={ev=>setEvents(p=>p.map(x=>x.id===e.id?{...x,location:ev.target.value}:x))} placeholder="Location" style={{width:"100%",padding:"6px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:6,background:"#fff",color:"#1a1a1a",fontFamily:"Georgia,serif",boxSizing:"border-box",marginBottom:6}}/>
                <textarea value={e.notes} onChange={ev=>setEvents(p=>p.map(x=>x.id===e.id?{...x,notes:ev.target.value}:x))} placeholder="Notes..." style={{width:"100%",minHeight:50,padding:"6px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:6,background:"#fff",color:"#1a1a1a",fontFamily:"Georgia,serif",resize:"vertical",boxSizing:"border-box"}}/>
              </div>
            )}
          </div>
        ))}

        {/* Add event */}
        <div style={{marginTop:14,paddingTop:14,borderTop:"0.5px solid #f0f0f0"}}>
          <div style={{fontSize:11,color:"#888",marginBottom:8}}>Add new event</div>
          <input value={newEvent.name} onChange={e=>setNewEvent(p=>({...p,name:e.target.value}))} placeholder="Event name" style={{width:"100%",padding:"6px 8px",fontSize:13,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia,serif",boxSizing:"border-box",marginBottom:6}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}>
            <input value={newEvent.date} onChange={e=>setNewEvent(p=>({...p,date:e.target.value}))} placeholder="Date" style={{padding:"6px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:6,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia,serif"}}/>
            <input value={newEvent.time} onChange={e=>setNewEvent(p=>({...p,time:e.target.value}))} placeholder="Time" style={{padding:"6px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:6,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia,serif"}}/>
          </div>
          <input value={newEvent.location} onChange={e=>setNewEvent(p=>({...p,location:e.target.value}))} placeholder="Location" style={{width:"100%",padding:"6px 8px",fontSize:12,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia,serif",boxSizing:"border-box",marginBottom:6}}/>
          <button onClick={addEvent} disabled={!newEvent.name.trim()} style={{width:"100%",padding:"8px",borderRadius:8,border:"none",background:newEvent.name.trim()?GOLD:"#e0e0e0",color:newEvent.name.trim()?"#1a1a1a":"#aaa",fontSize:13,fontWeight:500,cursor:newEvent.name.trim()?"pointer":"not-allowed",fontFamily:"Georgia,serif"}}>Add event →</button>
        </div>
      </div>

      {/* GroupMe composer */}
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+GREEN}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>GroupMe message composer</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
          {[
            {id:"general",label:"General"},
            {id:"event",label:"Event announce"},
            {id:"hype",label:"Hype message"},
            {id:"reminder",label:"Class reminder"},
          ].map(t=>(
            <button key={t.id} onClick={()=>setMsgType(t.id)} style={{padding:"8px",borderRadius:8,border:"0.5px solid "+(msgType===t.id?GREEN:"#e0e0e0"),background:msgType===t.id?"#EAF3DE":"transparent",color:msgType===t.id?GREEN:"#888",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={generateMessage} style={{width:"100%",padding:"8px",borderRadius:8,border:"none",background:PUR,color:"#fff",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"Georgia,serif",marginBottom:10}}>
          Generate message →
        </button>
        {groupMsg&&(
          <>
            <textarea value={groupMsg} onChange={e=>setGroupMsg(e.target.value)} style={{width:"100%",minHeight:140,padding:"8px",fontSize:13,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia,serif",resize:"vertical",boxSizing:"border-box",marginBottom:8}}/>
            <button onClick={copyMessage} style={{width:"100%",padding:"8px",borderRadius:8,border:"none",background:copied?GREEN:STEEL,color:"#fff",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"Georgia,serif"}}>
              {copied?"Copied! Paste into GroupMe ✓":"Copy message →"}
            </button>
          </>
        )}
      </div>

      {/* Photo wall placeholder */}
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0",borderTop:"3px solid "+STEEL}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:8}}>Photo wall</div>
        <div style={{fontSize:12,color:"#888",marginBottom:12}}>Event photos — Top Golf, cookouts, workouts, culture moments.</div>
        <div style={{background:"#f9f9f9",borderRadius:10,padding:"2rem",textAlign:"center",border:"1px dashed #e0e0e0"}}>
          <div style={{fontSize:32,marginBottom:8}}>📸</div>
          <div style={{fontSize:13,color:"#888",marginBottom:4}}>Photo uploads coming soon</div>
          <div style={{fontSize:11,color:"#aaa"}}>Supabase storage will be connected here</div>
        </div>
      </div>
    </div>
  );
}
