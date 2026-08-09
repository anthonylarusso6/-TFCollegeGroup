import { useState } from "react";
import { PUR, RED, GREEN, GOLD } from "../lib/constants";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";
import EmptyState from "./EmptyState";

export default function InboxTab({ inbox, setInbox, injuries, messages, prayers, athletes, inboxNewIds, genLoading, replyToInbox, generateReply }){
  const[inboxFilter,setInboxFilter]=useState("all");
  const[inboxAthFilter,setInboxAthFilter]=useState("");
  return(
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
                        {inj.map((item,i)=><InboxItem key={item.id} item={item} color={RED} bg="#1a0808" type="injury" onReply={replyToInbox} onGenerate={(prompt,cb)=>generateReply(prompt,cb,"inj-"+item.id)} genLoading={genLoading} loadKey={"inj-"+item.id} onArchive={archiveItem} onPriority={priorityItem} athletes={athletes} isNew={inboxNewIds.has(item.id)}/>)}
                      </div>
                    )}
                    {msgs.length>0&&(
                      <div style={{background:"#111",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #1e1e1e",borderTop:"3px solid "+PUR}}>
                        <div style={{display:"flex",alignItems:"center",gap:7,fontSize:13,fontWeight:600,color:PUR,marginBottom:10}}><Icon name="chat" size={14} color={PUR}/>Messages · {msgs.length}</div>
                        {msgs.map((item,i)=><InboxItem key={item.id} item={item} color={PUR} bg="#13122a" type="message" onReply={replyToInbox} onGenerate={(prompt,cb)=>generateReply(prompt,cb,"msg-"+item.id)} genLoading={genLoading} loadKey={"msg-"+item.id} onArchive={archiveItem} onPriority={priorityItem} athletes={athletes} isNew={inboxNewIds.has(item.id)}/>)}
                      </div>
                    )}
                    {prays.length>0&&(
                      <div style={{background:"#111",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #1e1e1e",borderTop:"3px solid "+GREEN}}>
                        <div style={{display:"flex",alignItems:"center",gap:7,fontSize:13,fontWeight:600,color:GREEN,marginBottom:10}}><Icon name="pray" size={14} color={GREEN}/>Prayer requests · {prays.length}</div>
                        {prays.map((item,i)=><InboxItem key={item.id} item={item} color={GREEN} bg="#0d1a10" type="prayer" onReply={replyToInbox} onGenerate={(prompt,cb)=>generateReply(prompt,cb,"pry-"+item.id)} genLoading={genLoading} loadKey={"pry-"+item.id} onArchive={archiveItem} onPriority={priorityItem} athletes={athletes} isNew={inboxNewIds.has(item.id)}/>)}
                      </div>
                    )}
                    {other.length>0&&(
                      <div style={{background:"#111",borderRadius:12,padding:"1.25rem",border:"0.5px solid #1e1e1e"}}>
                        <div style={{fontSize:13,fontWeight:600,color:"#666",marginBottom:10}}>Other · {other.length}</div>
                        {other.map((item,i)=><InboxItem key={item.id} item={item} color="#888" bg="#1a1a1a" type="message" onReply={replyToInbox} onGenerate={(prompt,cb)=>generateReply(prompt,cb,"oth-"+item.id)} genLoading={genLoading} loadKey={"oth-"+item.id} onArchive={archiveItem} onPriority={priorityItem} athletes={athletes} isNew={inboxNewIds.has(item.id)}/>)}
                      </div>
                    )}
                    {filtered.length===0&&(
                      <EmptyState icon="checkSquare" color={GREEN} title="Inbox is clear" hint="No open messages, injuries, or prayer requests right now. New ones will land here." />
                    )}
                  </>
                );
              })()}
            </div>
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
