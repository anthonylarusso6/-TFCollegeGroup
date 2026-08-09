import { useState } from "react";
import { RED, GREEN, GOLD, STEEL } from "../lib/constants";
import { supabase } from "../lib/supabase";
import { nowEST } from "../lib/dates";
import Icon from "./Icon";

export default function CoachAttendanceTab({ weekDays, mostMissed, estTodayStr, attendance, setAttendance, athletes, leaderboard }){
  const[attDate,setAttDate]=useState((()=>{const e=nowEST();return e.getFullYear()+"-"+String(e.getMonth()+1).padStart(2,"0")+"-"+String(e.getDate()).padStart(2,"0");})());
  return(
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
                    {[{l:"Early",v:attendance.filter(r=>r.date===attDate&&r.status==="early").length,c:GREEN,bg:GREEN+"22"},{l:"Late",v:attendance.filter(r=>r.date===attDate&&r.status==="late").length,c:RED,bg:RED+"22"},{l:"Absent",v:athletes.filter(a=>a.status==="active"&&!attendance.some(r=>r.date===attDate&&r.athlete_id===a.id)).length,c:"#888",bg:"#1a1a1a"}].map(s=>(
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
                            const{data}=await supabase.from("attendance").select("*,athletes(name)").order("date",{ascending:false}).limit(1000);
                            if(data)setAttendance(data);
                          }} style={{fontSize:11,padding:"3px 8px",borderRadius:6,border:"0.5px solid "+GREEN,background:rec?.status==="early"?GREEN:"transparent",color:rec?.status==="early"?"#fff":GREEN,cursor:"pointer",fontFamily:"Georgia,serif"}}>Early</button>
                          <button onClick={async()=>{
                            const now=new Date();
                            const timeStr=now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",timeZone:"America/New_York"});
                            const day=new Date(attDate+"T12:00:00").toLocaleDateString("en-US",{weekday:"short"});
                            if(rec){await supabase.from("attendance").update({status:"late",time_logged:timeStr}).eq("id",rec.id);}
                            else{await supabase.from("attendance").insert({athlete_id:a.id,date:attDate,status:"late",time_logged:timeStr,day});}
                            const{data}=await supabase.from("attendance").select("*,athletes(name)").order("date",{ascending:false}).limit(1000);
                            if(data)setAttendance(data);
                          }} style={{fontSize:11,padding:"3px 8px",borderRadius:6,border:"0.5px solid "+RED,background:rec?.status==="late"?RED:"transparent",color:rec?.status==="late"?"#fff":RED,cursor:"pointer",fontFamily:"Georgia,serif"}}>Late</button>
                          <button onClick={async()=>{
                            const now=new Date();
                            const timeStr=now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",timeZone:"America/New_York"});
                            const day=new Date(attDate+"T12:00:00").toLocaleDateString("en-US",{weekday:"short"});
                            if(rec){await supabase.from("attendance").update({status:"excused",time_logged:timeStr}).eq("id",rec.id);}
                            else{await supabase.from("attendance").insert({athlete_id:a.id,date:attDate,status:"excused",time_logged:timeStr,day});}
                            const{data}=await supabase.from("attendance").select("*,athletes(name)").order("date",{ascending:false}).limit(1000);
                            if(data)setAttendance(data);
                          }} style={{fontSize:11,padding:"3px 8px",borderRadius:6,border:"0.5px solid #854F0B",background:rec?.status==="excused"?"#854F0B":"transparent",color:rec?.status==="excused"?"#fff":"#854F0B",cursor:"pointer",fontFamily:"Georgia,serif"}}>Excused</button>
                          {rec&&<button onClick={async()=>{
                            await supabase.from("attendance").delete().eq("id",rec.id);
                            const{data}=await supabase.from("attendance").select("*,athletes(name)").order("date",{ascending:false}).limit(1000);
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
  );
}
