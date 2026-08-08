import { useState } from "react";
import { RED, GREEN, GOLD, STEEL } from "../lib/constants";
import Icon from "./Icon";

export default function CoachLeaderboardTab({ leaderboard, athletes, openAthleteModal }){
  const[lbSort,setLbSort]=useState("early");
  return(
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
  );
}
