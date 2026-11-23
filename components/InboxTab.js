import { useState } from "react";
import { PUR, RED, GREEN, GOLD } from "../lib/constants";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";

export default function InboxTab({ inbox, setInbox, injuries, messages, prayers, athletes, inboxNewIds, genLoading, replyToInbox, generateReply }){
  const[inboxFilter,setInboxFilter]=useState("all");
  const[inboxAthFilter,setInboxAthFilter]=useState("");
  return(
    <div className="tfx cc">
      <section className="tfx-card cc-head">
        <div className="cc-top">
          <div>
            <div className="tfx-eyebrow">Coach inbox</div>
            <h2>Inbox</h2>
            <p>Injury flags, messages and prayer requests</p>
          </div>
          {inbox.length>0&&<span className="cc-pill is-gold"><span className="tfx-num">{inbox.length}</span> open</span>}
        </div>
        {inboxNewIds.size>0&&(
          <div className="cc-new" role="status">
            <span className="tfx-livedot"/>
            <span>{inboxNewIds.size} new {inboxNewIds.size===1?"message":"messages"} since your last visit</span>
          </div>
        )}
        {/* Unread counts + filter */}
        <div className="cc-chips" role="tablist" aria-label="Filter by type">
          {[
            {id:"all",label:"All",count:inbox.length,tone:"is-gold"},
            {id:"injury",label:"Injuries",count:injuries.length,tone:"is-red"},
            {id:"message",label:"Messages",count:messages.length,tone:"is-violet"},
            {id:"prayer",label:"Prayers",count:prayers.length,tone:"is-green"},
          ].map(f=>(
            <button key={f.id} role="tab" aria-selected={inboxFilter===f.id} className={"tfx-chipbtn tfx-press "+f.tone+(inboxFilter===f.id?" is-on":"")} onClick={()=>setInboxFilter(f.id)}>
              {f.label}{f.count>0&&<span className="cc-count">{f.count}</span>}
            </button>
          ))}
        </div>

        {/* Athlete filter */}
        <div className="cc-tools">
          <span className="cc-sel">
            <select className="cc-in" value={inboxAthFilter} onChange={e=>setInboxAthFilter(e.target.value)} aria-label="Filter by athlete">
              <option value="">All athletes</option>
              {athletes.filter(a=>a.status==="active").map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </span>
          {(()=>{
            // Only clear what the filters show, so a filtered view never wipes everything.
            const filtered=inboxFilter!=="all"||!!inboxAthFilter;
            const shown=inbox.filter(i=>(inboxFilter==="all"||i.type===inboxFilter)&&(!inboxAthFilter||String(i.athlete_id)===String(inboxAthFilter)));
            return(
              <button className="tfx-btn-ghost tfx-press" disabled={!shown.length} onClick={async()=>{
                if(!window.confirm(filtered?"Mark these "+shown.length+" as done?":"Mark all "+shown.length+" as done and clear the inbox?"))return;
                const res=await Promise.all(shown.map(item=>supabase.from("inbox").update({done:true}).eq("id",item.id)));
                const failed=new Set(shown.filter((_,i)=>res[i]?.error).map(i=>i.id));
                const cleared=new Set(shown.map(i=>i.id).filter(id=>!failed.has(id)));
                setInbox(prev=>prev.filter(i=>!cleared.has(i.id)));
                if(failed.size)window.alert(failed.size+" couldn't be marked done. Check your connection and try again.");
              }}>
                {filtered?"Mark these done":"Mark all done"}
              </button>
            );
          })()}
        </div>
      </section>

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
        const newIn=(list)=>list.filter(x=>inboxNewIds.has(x.id)).length;
        return(
          <>
            {inj.length>0&&(
              <InboxGroup tone="is-red" icon="alertTriangle" title="Injury flags" count={inj.length} newCount={newIn(inj)}>
                {inj.map((item,i)=><InboxItem key={item.id} item={item} color={RED} bg="#1a0808" type="injury" onReply={replyToInbox} onGenerate={(prompt,cb)=>generateReply(prompt,cb,"inj-"+item.id)} genLoading={genLoading} loadKey={"inj-"+item.id} onArchive={archiveItem} onPriority={priorityItem} athletes={athletes} isNew={inboxNewIds.has(item.id)}/>)}
              </InboxGroup>
            )}
            {msgs.length>0&&(
              <InboxGroup tone="is-violet" icon="chat" title="Messages" count={msgs.length} newCount={newIn(msgs)}>
                {msgs.map((item,i)=><InboxItem key={item.id} item={item} color={PUR} bg="#13122a" type="message" onReply={replyToInbox} onGenerate={(prompt,cb)=>generateReply(prompt,cb,"msg-"+item.id)} genLoading={genLoading} loadKey={"msg-"+item.id} onArchive={archiveItem} onPriority={priorityItem} athletes={athletes} isNew={inboxNewIds.has(item.id)}/>)}
              </InboxGroup>
            )}
            {prays.length>0&&(
              <InboxGroup tone="is-green" icon="pray" title="Prayer requests" count={prays.length} newCount={newIn(prays)}>
                {prays.map((item,i)=><InboxItem key={item.id} item={item} color={GREEN} bg="#0d1a10" type="prayer" onReply={replyToInbox} onGenerate={(prompt,cb)=>generateReply(prompt,cb,"pry-"+item.id)} genLoading={genLoading} loadKey={"pry-"+item.id} onArchive={archiveItem} onPriority={priorityItem} athletes={athletes} isNew={inboxNewIds.has(item.id)}/>)}
              </InboxGroup>
            )}
            {other.length>0&&(
              <InboxGroup tone="is-muted" title="Other" count={other.length} newCount={newIn(other)}>
                {other.map((item,i)=><InboxItem key={item.id} item={item} color="#888" bg="#1a1a1a" type="message" onReply={replyToInbox} onGenerate={(prompt,cb)=>generateReply(prompt,cb,"oth-"+item.id)} genLoading={genLoading} loadKey={"oth-"+item.id} onArchive={archiveItem} onPriority={priorityItem} athletes={athletes} isNew={inboxNewIds.has(item.id)}/>)}
              </InboxGroup>
            )}
            {filtered.length===0&&(
              <section className="tfx-card cc-empty is-green">
                <span className="cc-empty-ico"><Icon name="checkSquare" size={24}/></span>
                <b>Inbox is clear</b>
                <p>No open messages, injuries, or prayer requests right now. New ones will land here.</p>
              </section>
            )}
          </>
        );
      })()}
    </div>
  );
}

// One card per message type (stable component so open reply drafts survive re-renders)
function InboxGroup({tone,icon,title,count,newCount,children}){
  return(
    <section className={"tfx-card cc-sec cc-group "+tone}>
      <header className="cc-ghead">
        {icon&&<span className="cc-gico"><Icon name={icon} size={16}/></span>}
        <h3>{title}</h3>
        {newCount>0&&<span className="cc-pill is-solid">{newCount} new</span>}
        <span className="cc-pill"><span className="tfx-num">{count}</span></span>
      </header>
      <div className="cc-msgs">{children}</div>
    </section>
  );
}

// One message card. `color` is the group's accent (passed through as --c);
// `bg` is kept for callers but the surface now comes from the theme tokens.
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
  const who=item.anonymous?"Anonymous":item.athletes?.name;
  return(
    <article className={"cc-msg"+(isNew?" is-new":"")+(item.archived?" is-archived":"")} style={{"--c":color}}>
      <div className="cc-msg-top">
        <span className="cc-msg-av">
          {isNew&&<i className="cc-dot" aria-hidden="true"/>}
          <span className="rk-av" style={{"--c":ath?.role==="forge"?RED:STEEL}}>
            {ath?.photo_url?<img src={ath.photo_url} alt=""/>:(item.athletes?.name||"?")[0]}
          </span>
        </span>
        <div className="cc-msg-who">
          <div className="cc-msg-name">
            <b>{who}</b>
            {isNew&&<span className="cc-pill is-solid">New</span>}
            {item.priority&&<span className="cc-pill is-solid is-red">Urgent</span>}
            {item.reply_sent&&<span className="cc-pill is-green">✓ Replied</span>}
          </div>
          <small>{new Date(item.created_at).toLocaleDateString()}</small>
        </div>
        <div className="cc-msg-acts">
          <button className={"cc-ico is-urgent"+(item.priority?" is-on":"")} onClick={()=>onPriority&&onPriority(item)} title="Mark urgent" aria-label="Mark urgent" aria-pressed={!!item.priority}><Icon name="alertTriangle" size={17}/></button>
          <button className="cc-ico" onClick={()=>onArchive&&onArchive(item)} title="Archive" aria-label="Archive"><Icon name="inbox" size={17}/></button>
        </div>
      </div>
      <blockquote className="cc-quote">"{item.message}"</blockquote>
      {item.reply&&(
        <div className="cc-replied">
          <button className="cc-link" onClick={()=>setShowReply(!showReply)} aria-expanded={showReply}>
            <i aria-hidden="true"/>{showReply?"Hide reply":"Show your reply"}
          </button>
          {showReply&&(
            <blockquote className="cc-quote">"{item.reply}"</blockquote>
          )}
        </div>
      )}
      {!item.archived&&(
        <>
          <textarea className="cc-in" value={reply} onChange={e=>setReply(e.target.value)} placeholder="Write a reply..." aria-label={"Reply to "+(who||"athlete")}/>
          <div className="cc-msg-btns">
            <button className="cc-mini is-tint tfx-press" onClick={()=>onGenerate(prompts[type],text=>setReply(text))}>
              {genLoading===loadKey?"Generating...":"Generate reply"}
            </button>
            <button className="cc-mini is-solid tfx-press" onClick={async()=>{await onReply(item,reply);setSent(true);}}>Send reply</button>
            {sent&&<span className="cc-ok">✓ Sent</span>}
          </div>
        </>
      )}
    </article>
  );
}
