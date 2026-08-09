import { useState } from "react";
import { PUR, RED, GREEN, GOLD, ORANGE } from "../lib/constants";
import { nowEST } from "../lib/dates";
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

  return(
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
                const _e=nowEST();
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
  );
}
