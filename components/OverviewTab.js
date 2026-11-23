import { useState } from "react";
import { nowEST } from "../lib/dates";
import { fmtD } from "../lib/lifting";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";

export default function OverviewTab({ athletes, attendance, estTodayStr, weekDays, dayName, inboxCount, musicVotes, loadMusicVotes, announcement, setAnnouncement, saveAnnouncement, injuries, messages, prayers }){
  const[recapOpen,setRecapOpen]=useState(false);
  const[recapData,setRecapData]=useState(null);
  const[recapLoading,setRecapLoading]=useState(false);

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

  const todayAtt=attendance.filter(a=>a.date===estTodayStr);
  const earlyToday=todayAtt.filter(a=>a.status==="early").length;
  const lateToday=todayAtt.filter(a=>a.status==="late").length;

  const activeCount=athletes.filter(a=>a.status==="active").length;
  const attnCount=injuries.length+messages.length+prayers.length;
  const STATS=[
    {label:"Athletes",val:activeCount,tone:"is-muted"},
    {label:"Early today",val:earlyToday,tone:earlyToday>0?"is-green":"is-muted"},
    {label:"Late today",val:lateToday,tone:lateToday>0?"is-amber":"is-muted"},
    {label:"Inbox",val:inboxCount,tone:inboxCount>0?"is-violet":"is-muted"},
  ];

  return(
    <div className="tfx cf cf-ov">
      {/* Today at a glance */}
      <section className="tfx-card cf-head">
        <div className="cf-head-top">
          <div>
            <div className="tfx-eyebrow">Overview</div>
            <h2>Today</h2>
            <p>{estTodayStr?fmtD(estTodayStr,{weekday:"long",month:"short",day:"numeric"}):dayName}</p>
          </div>
          {attnCount>0&&<span className="cf-pill is-red"><i className="cf-dot" aria-hidden="true"/>{attnCount} to review</span>}
        </div>
        <div className="cf-stats">
          {STATS.map(s=>(
            <div key={s.label} className={s.tone}>
              <b className="tfx-num">{s.val}</b>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Needs attention */}
      {(injuries.length>0||messages.length>0||prayers.length>0)&&(
        <section className="tfx-card cf-card cf-attn">
          <div className="cf-sec">
            <div>
              <div className="tfx-eyebrow">Action required</div>
              <h3>Needs attention</h3>
              <p>{injuries.length>0?injuries.length+" injur"+(injuries.length===1?"y":"ies"):""}{injuries.length>0&&messages.length>0?" · ":""}{messages.length>0?messages.length+" message"+(messages.length===1?"":"s"):""}{(injuries.length>0||messages.length>0)&&prayers.length>0?" · ":""}{prayers.length>0?prayers.length+" prayer"+(prayers.length===1?"":"s"):""}</p>
            </div>
          </div>
          <ul className="cf-attn-list">
            {injuries.map((i,idx)=>(
              <li key={"i"+idx} className="is-red">
                <span className="cf-attn-txt"><b>{i.athletes?.name}</b><small>{i.message}</small></span>
                <span className="cf-tag">Injury</span>
              </li>
            ))}
            {messages.map((m,idx)=>(
              <li key={"m"+idx} className="is-sky">
                <span className="cf-attn-txt"><b>{m.athletes?.name}</b><small>sent a message</small></span>
                <span className="cf-tag">Message</span>
              </li>
            ))}
            {prayers.map((p,idx)=>(
              <li key={"p"+idx} className="is-violet">
                <span className="cf-attn-txt"><b>{p.athletes?.name}</b><small>submitted a prayer request</small></span>
                <span className="cf-tag">Prayer</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Today's music */}
      {(()=>{
        const _e=nowEST();
        const _dow=_e.getDay();
        const GENRES=[{id:"rock",label:"Rock",emoji:"🎸"},{id:"wgt",label:"White Girl Throwbacks",emoji:"💅"},{id:"rap",label:"Rap / Hip-Hop",emoji:"🎤"},{id:"country",label:"Country",emoji:"🤠"},{id:"pop",label:"Pop",emoji:"🎵"},{id:"mcastle",label:"MCASTLES SECRET PICK",emoji:"🍑🚀"}];
        if(_dow===1||_dow===5)return(
          <section className="tfx-card cf-card cf-music">
            <div className="cf-sec">
              <div>
                <div className="tfx-eyebrow">Today's music</div>
                <h3>Worship music</h3>
                <p>{_dow===1?"Mindset Monday":"Fellowship Friday"} · no vote needed</p>
              </div>
              <span className="cf-pill is-violet">Worship</span>
            </div>
          </section>
        );
        const total=musicVotes?Object.values(musicVotes).reduce((a,b)=>a+b,0):0;
        const topGenre=musicVotes&&total>0?Object.entries(musicVotes).sort((a,b)=>b[1]-a[1])[0]?.[0]:null;
        return(
          <section className="tfx-card cf-card cf-music">
            <div className="cf-sec">
              <div>
                <div className="tfx-eyebrow">Music vote</div>
                <h3>Today's genre</h3>
              </div>
              <div className="cf-votes">
                <span className="cf-votes-n"><b className="tfx-num">{total}</b><small>vote{total===1?"":"s"}</small></span>
                <button className="att-nav tfx-press cf-iconbtn" onClick={loadMusicVotes} aria-label="Refresh votes"><Icon name="refreshCw" size={17}/></button>
              </div>
            </div>
            {!musicVotes||total===0?(
              <p className="cf-empty">No votes yet — athletes vote from their profile tab</p>
            ):(
              <ul className="cf-genres">
                {GENRES.map(g=>{
                  const count=musicVotes[g.id]||0;
                  const pct=total?Math.round((count/total)*100):0;
                  const isTop=g.id===topGenre;
                  return(
                    <li key={g.id} className={isTop?"is-top":""}>
                      <span className="cf-genre-emo" aria-hidden="true">{g.emoji}</span>
                      <div className="cf-genre-main">
                        <div className="cf-genre-top">
                          <span className="cf-genre-name">{g.label}</span>
                          <span className="cf-genre-n tfx-num">{count}{pct>0&&<small> ({pct}%)</small>}</span>
                        </div>
                        <div className="cf-bar"><i style={{width:pct+"%"}}/></div>
                      </div>
                      {isTop&&<span className="cf-pill is-ember cf-top">Top</span>}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })()}

      {/* Weekly announcement */}
      <section className="tfx-card cf-card cf-ann">
        <div className="cf-sec">
          <div>
            <div className="tfx-eyebrow">Coach Ant</div>
            <h3>Weekly announcement</h3>
            <p>Pushed to every athlete's home screen</p>
          </div>
        </div>
        <textarea className="tfx-field cf-ta" value={announcement} onChange={e=>setAnnouncement(e.target.value)} placeholder="Type this week's message to your athletes..." aria-label="Weekly announcement"/>
        <div className="cf-ann-foot">
          <button className="tfx-btn tfx-press cf-ann-go" onClick={saveAnnouncement}>Save & push to athletes →</button>
        </div>
      </section>

      {/* This week attendance chart */}
      <section className="tfx-card cf-card cf-wkatt">
        <div className="cf-sec">
          <div>
            <div className="tfx-eyebrow">This week</div>
            <h3>Attendance</h3>
            <p>Mon · Tue · Thu · Fri check-ins</p>
          </div>
        </div>
        {(()=>{
          const days=weekDays.map(d=>({dayName:d.dn,early:d.early,late:d.late,isToday:d.ds===estTodayStr}));
          const maxVal=Math.max(...days.map(d=>d.early+d.late),5);
          return(
            <div>
              <div className="cf-chart">
                {days.map((d,i)=>{
                  const total=d.early+d.late;
                  const earlyPct=total>0?(d.early/maxVal)*100:0;
                  const latePct=total>0?(d.late/maxVal)*100:0;
                  return(
                    <div key={i} className={"cf-col"+(d.isToday?" is-today":"")} aria-label={d.dayName+": "+d.early+" early, "+d.late+" late"}>
                      <div className="cf-col-bars">
                        {total>0&&<span className="cf-col-n tfx-num">{total}</span>}
                        {total>0&&(
                          <>
                            {d.late>0&&<i className="is-late" style={{height:`${latePct}%`}}/>}
                            {d.early>0&&<i className="is-early" style={{height:`${earlyPct}%`}}/>}
                          </>
                        )}
                      </div>
                      <span className="cf-col-d">{d.dayName}</span>
                    </div>
                  );
                })}
              </div>
              <div className="cf-keys">
                <span className="is-green"><i/>Early</span>
                <span className="is-amber"><i/>Late</span>
              </div>
            </div>
          );
        })()}
      </section>

      {/* Weekly recap */}
      <section className={"tfx-card cf-recap"+(recapOpen?" is-open":"")}>
        <button className="cf-recap-btn" aria-expanded={recapOpen} onClick={()=>{setRecapOpen(o=>{if(!o&&!recapData)loadRecap();return!o;})}}>
          <span className="cf-recap-txt">
            <span className="tfx-eyebrow">This week</span>
            <b>Weekly recap</b>
            <small>Attendance, streaks, follow-ups</small>
          </span>
          <span className="cf-chev" aria-hidden="true"><Icon name="chevronRight" size={18}/></span>
        </button>
        {recapOpen&&(
          <div className="cf-recap-body">
            {recapLoading&&<p className="cf-empty">Loading...</p>}
            {recapData&&(()=>{
              const{weekAtt,lbRows,weekInbox}=recapData;
              const activeAthletes=athletes.filter(a=>a.status==="active");
              const uniqueAttendees=[...new Set(weekAtt.map(r=>r.athlete_id))];
              const attendancePct=activeAthletes.length>0?Math.round((uniqueAttendees.length/activeAthletes.length)*100):0;
              const missedThis=(athletes.filter(a=>a.status==="active"&&!uniqueAttendees.includes(a.id)));
              const onStreak=lbRows.filter(lb=>(lb.current_streak||0)>=3);
              const earlyThisWeek=weekAtt.filter(r=>r.status==="early");
              return(
                <>
                  <div className="cf-stats is-3">
                    <div className={attendancePct>=80?"is-green":attendancePct>=60?"is-amber":"is-red"}>
                      <b className="tfx-num">{attendancePct}%</b>
                      <span>Attendance</span>
                      <small className="tfx-num">{uniqueAttendees.length}/{activeAthletes.length} athletes</small>
                    </div>
                    <div className="is-green">
                      <b className="tfx-num">{earlyThisWeek.length}</b>
                      <span>Early</span>
                      <small>this week</small>
                    </div>
                    <div className={weekInbox.length>0?"is-red":"is-muted"}>
                      <b className="tfx-num">{weekInbox.length}</b>
                      <span>Unread</span>
                      <small>follow-ups</small>
                    </div>
                  </div>
                  {onStreak.length>0&&(
                    <div className="cf-recap-sec">
                      <div className="tfx-eyebrow">On a streak (3+)</div>
                      <div className="cf-chips">
                        {onStreak.map((lb,i)=>(
                          <span key={i} className="cf-chip is-gold"><b className="tfx-num">{lb.current_streak}🔥</b>{lb.athletes?.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {missedThis.length>0&&(
                    <div className="cf-recap-sec">
                      <div className="tfx-eyebrow">Missed this week</div>
                      <div className="cf-chips">
                        {missedThis.map((a,i)=>(
                          <span key={i} className="cf-chip is-red">{a.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </section>

      {/* Class flow */}
      <section className="tfx-card cf-card cf-flow">
        <div className="cf-sec">
          <div>
            <div className="tfx-eyebrow">Daily structure</div>
            <h3>Class flow</h3>
            <p>2 hours · done by 11:20am</p>
          </div>
        </div>
        <ol className="cf-flow-list">
          {[
            {time:"9:00am",label:"Pre-class",detail:dayName==="Mon"?"Draft → Mindset Monday":dayName==="Fri"?"Fellowship Friday devotional":"Sign-in · stretch prep",tone:"var(--violet)",dur:"30 min"},
            {time:"9:30am",label:"Stretch & mobility",detail:"10 min · dynamic stretching · all athletes together",tone:"var(--green)",dur:"10 min"},
            {time:"9:40am",label:"Run",detail:"40–50 min · all 4 groups · hand positions enforced · leaders set pace",tone:"var(--ember)",dur:"40–50 min"},
            {time:"10:30am",label:"Weight room",detail:"30–50 min · 2 groups Tier 1 · 1 group Tier 2 · 1 group Tier 3",tone:"var(--sky)",dur:"30–50 min"},
            {time:"11:15am",label:"Closeout & prayer",detail:"5 min · all together · coach or athlete prays",tone:"var(--red)",dur:"5 min"},
          ].map((s,i)=>(
            <li key={i} style={{"--c":s.tone}}>
              <span className="cf-flow-t tfx-num">{s.time}</span>
              <span className="cf-flow-dot" aria-hidden="true"/>
              <div className="cf-flow-txt">
                <div className="cf-flow-top"><b>{s.label}</b><span className="cf-dur tfx-num">{s.dur}</span></div>
                <p>{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
