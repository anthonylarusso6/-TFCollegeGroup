import { PUR, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { isFemale } from "../lib/teams";
import Icon from "./Icon";
import ProgramUpload from "./ProgramUpload";

export default function WeightsTab({ athletes, weightLogs, prLogs }){
  return(
    <>
            <div>
              <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+GREEN+"33"}}>
                <div style={{background:"linear-gradient(140deg,"+GREEN+"30,"+GREEN+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GREEN+","+PUR+")"}}/>
                  <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="scale" size={66} color="#fff"/></div>
                  <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+GREEN+"12,transparent 70%)",pointerEvents:"none"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                    <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+GREEN+"44,"+GREEN+"22)",border:"1px solid "+GREEN+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+GREEN+"33"}}>⚖️</div>
                    <div>
                      <div style={{fontSize:8,color:GREEN,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Weight Room</div>
                      <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Weight Log</div>
                      <div style={{fontSize:11,color:"#666",marginTop:1}}>{[...new Set(weightLogs.map(l=>l.athlete_id))].length} athletes · {weightLogs.length} entries</div>
                    </div>
                  </div>
                </div>
                <div style={{background:"#111",padding:"16px 18px"}}>
                  <ProgramUpload/>
                </div>
              </div>

              {weightLogs.length===0&&(
                <div style={{background:"#111",borderRadius:20,padding:"2rem",textAlign:"center",border:"0.5px solid #252525"}}>
                  <div style={{marginBottom:8,display:"flex",justifyContent:"center"}}><Icon name="scale" size={30} color="rgba(255,255,255,0.35)"/></div>
                  <div style={{fontSize:13,color:"#555"}}>No weight logs yet.</div>
                  <div style={{fontSize:11,color:"#444",marginTop:4}}>Athletes log from their Weight tab.</div>
                </div>
              )}

              {[...new Set(weightLogs.map(l=>l.athlete_id))].map(aid=>{
                const ath=athletes.find(a=>a.id===aid);
                const entries=[...weightLogs.filter(l=>l.athlete_id===aid)].sort((a,b)=>new Date(a.date)-new Date(b.date));
                const first=entries[0]?.weight!=null?parseFloat(entries[0].weight):null;
                const latest=entries[entries.length-1]?.weight!=null?parseFloat(entries[entries.length-1].weight):null;
                const diff=first!=null&&latest!=null?parseFloat((latest-first).toFixed(1)):null;
                const trending=diff===null?"flat":diff<0?"down":diff>0?"up":"flat";
                const trendColor=trending==="down"?GREEN:trending==="up"?RED:"#888";

                // Mini sparkline
                const sparkH=40,sparkW=100;
                const weights=entries.map(e=>parseFloat(e.weight));
                const sMin=Math.min(...weights)-1;
                const sMax=Math.max(...weights)+1;
                const sparkPts=weights.map((w,i)=>{
                  const x=(i/(Math.max(weights.length-1,1)))*sparkW;
                  const y=sparkH-((w-sMin)/(sMax-sMin||1))*sparkH;
                  return`${x},${y}`;
                }).join(" ");

                return(
                  <div key={aid} style={{background:"#111",borderRadius:20,marginBottom:10,border:"1px solid "+trendColor+"33",overflow:"hidden"}}>
                    <div style={{height:3,background:"linear-gradient(90deg,"+trendColor+","+trendColor+"44,transparent)"}}/>
                    <div style={{padding:"1rem 1.25rem"}}>
                      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                        <div style={{width:44,height:44,borderRadius:"50%",background:ath?.role==="forge"?RED:STEEL,overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:600,color:"#fff",border:"2px solid "+trendColor+"44"}}>
                          {ath?.photo_url?<img src={ath.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(ath?.name||"?")[0]}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:15,fontWeight:700,color:"#fff"}}>{ath?.name||"Unknown"}</div>
                          <div style={{fontSize:11,color:"#666"}}>{entries.length} log{entries.length!==1?"s":""} · {ath?.sport||""}</div>
                        </div>
                        <div style={{background:trendColor+"22",borderRadius:10,padding:"6px 12px",border:"1px solid "+trendColor+"44",textAlign:"center"}}>
                          <div style={{fontSize:18,fontWeight:800,color:trendColor}}>
                            {diff===null?"—":(diff>0?"↑":diff<0?"↓":"→")+" "+Math.abs(diff)}
                          </div>
                          <div style={{fontSize:9,color:trendColor,textTransform:"uppercase",letterSpacing:"0.05em"}}>lbs</div>
                        </div>
                      </div>

                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
                        {[{label:"Start",val:first,color:"#888"},{label:"Current",val:latest,color:"#fff"},{label:"Entries",val:entries.length,color:PUR}].map(s=>(
                          <div key={s.label} style={{background:"#1a1a1a",borderRadius:10,padding:"10px 8px",textAlign:"center",border:"0.5px solid #222"}}>
                            <div style={{fontSize:18,fontWeight:800,color:s.color}}>{s.val!=null?s.val:"—"}</div>
                            <div style={{fontSize:10,color:"#555",marginTop:3,textTransform:"uppercase",letterSpacing:"0.06em"}}>{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {weights.length>1&&(
                        <div style={{background:"#1a1a1a",borderRadius:10,padding:"10px 12px",marginBottom:10}}>
                          <svg viewBox={`0 0 ${sparkW} ${sparkH}`} style={{width:"100%",height:40,overflow:"visible"}}>
                            <defs>
                              <linearGradient id={"sg"+aid} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={trendColor} stopOpacity="0.3"/>
                                <stop offset="100%" stopColor={trendColor} stopOpacity="0"/>
                              </linearGradient>
                            </defs>
                            <polygon points={`0,${sparkH} ${sparkPts} ${sparkW},${sparkH}`} fill={`url(#sg${aid})`}/>
                            <polyline points={sparkPts} fill="none" stroke={trendColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            {weights.map((w,i)=>{
                              const x=(i/(Math.max(weights.length-1,1)))*sparkW;
                              const y=sparkH-((w-sMin)/(sMax-sMin||1))*sparkH;
                              return<circle key={i} cx={x} cy={y} r={i===weights.length-1?3:1.5} fill={i===weights.length-1?"#fff":trendColor}/>;
                            })}
                          </svg>
                        </div>
                      )}

                      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2}}>
                        {entries.map((e,ei)=>{
                          const prev=ei>0?parseFloat(entries[ei-1].weight):null;
                          const cur=parseFloat(e.weight);
                          const wd=prev!=null?parseFloat((cur-prev).toFixed(1)):null;
                          return(
                            <div key={ei} style={{flexShrink:0,background:ei===entries.length-1?"#222":"#1a1a1a",borderRadius:10,padding:"6px 10px",textAlign:"center",minWidth:54,border:"1px solid "+(ei===entries.length-1?"#333":"#202020")}}>
                              <div style={{fontSize:13,fontWeight:700,color:ei===entries.length-1?"#fff":"#aaa"}}>{cur}</div>
                              {wd!=null&&<div style={{fontSize:10,color:wd<0?GREEN:wd>0?RED:"#888",fontWeight:600}}>{wd>0?"↑":wd<0?"↓":"→"}{Math.abs(wd)}</div>}
                              <div style={{fontSize:10,color:"#555",fontWeight:600}}>{e.date?.slice(5)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          {prLogs.length>0&&(()=>{
            const epley=(w,r)=>r===1?w:Math.round(w*(1+r/30));
            const CATS_M=[
              {id:"lower",label:"Lower Body",emoji:"🦵",keywords:["squat","lunge","step up"],ref:225},
              {id:"push", label:"Push",       emoji:"💪",keywords:["bench","press","push","dip","jerk"],ref:175},
              {id:"pull", label:"Pull",       emoji:"🤜",keywords:["pull","row","curl"],ref:155},
              {id:"hinge",label:"Hinge",      emoji:"⛓️",keywords:["deadlift","clean","snatch","swing","rdl","hinge"],ref:255},
            ];
            const CATS_F=[
              {id:"lower",label:"Lower Body",emoji:"🦵",keywords:["squat","lunge","step up"],ref:145},
              {id:"push", label:"Push",       emoji:"💪",keywords:["bench","press","push","dip","jerk"],ref:95},
              {id:"pull", label:"Pull",       emoji:"🤜",keywords:["pull","row","curl"],ref:85},
              {id:"hinge",label:"Hinge",      emoji:"⛓️",keywords:["deadlift","clean","snatch","swing","rdl","hinge"],ref:165},
            ];
            const getCatFrom=(cats,name)=>{
              const n=name.toLowerCase();
              if(cats[3].keywords.some(k=>n.includes(k)))return "hinge";
              if(cats[0].keywords.some(k=>n.includes(k)))return "lower";
              if(cats[1].keywords.some(k=>n.includes(k)))return "push";
              if(cats[2].keywords.some(k=>n.includes(k)))return "pull";
              return null;
            };
            const isF=isFemale;
            // Build per-athlete best estimated 1RM per lift
            const byAthlete={};
            prLogs.forEach(r=>{
              const aid=r.athlete_id;
              const orm=epley(parseFloat(r.weight)||0,parseInt(r.reps)||1);
              if(!byAthlete[aid])byAthlete[aid]={};
              if(!byAthlete[aid][r.lift]||orm>byAthlete[aid][r.lift].orm){
                byAthlete[aid][r.lift]={weight:r.weight,reps:r.reps,orm};
              }
            });
            const renderSection=(cats,gLabel,accentColor)=>{
              const rows=[];
              Object.entries(byAthlete).forEach(([aid,lifts])=>{
                const ath=athletes.find(a=>String(a.id)===String(aid));
                const female=isF(ath?.gender);
                const wantFemale=gLabel==="Women's";
                if(female!==wantFemale)return;
                // Sum all category orms as a simple overall score
                let totalOrm=0,count=0;
                cats.forEach(cat=>{
                  const catLifts=Object.entries(lifts).filter(([name])=>getCatFrom(cats,name)===cat.id);
                  if(!catLifts.length)return;
                  const best=catLifts.reduce((b,[,v])=>v.orm>b.orm?v.orm:b,0);
                  if(best>0){totalOrm+=best;count++;}
                });
                if(!count)return;
                rows.push({aid,name:ath?.name||"Unknown",photo:ath?.photo_url,lifts,totalOrm,count});
              });
              if(!rows.length)return null;
              return(
                <div style={{marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,paddingBottom:10,borderBottom:"1px solid #1e1e1e"}}>
                    <div style={{width:3,height:18,borderRadius:2,background:accentColor,flexShrink:0}}/>
                    <div style={{fontSize:13,fontWeight:800,color:accentColor,textTransform:"uppercase",letterSpacing:"0.14em"}}>{gLabel} Rankings</div>
                    <div style={{flex:1,height:1,background:"linear-gradient(90deg,"+accentColor+"22,transparent)"}}/>
                  </div>
                  {cats.map(cat=>{
                    const catRows=[];
                    Object.entries(byAthlete).forEach(([aid,lifts])=>{
                      const ath=athletes.find(a=>String(a.id)===String(aid));
                      const female=isF(ath?.gender);
                      const wantFemale=gLabel==="Women's";
                      if(female!==wantFemale)return;
                      const catLifts=Object.entries(lifts).filter(([name])=>getCatFrom(cats,name)===cat.id);
                      if(!catLifts.length)return;
                      const best=catLifts.reduce((b,[n,v])=>v.orm>b.orm?{liftName:n,...v}:b,{orm:0});
                      if(!best.orm)return;
                      catRows.push({aid,name:ath?.name||"Unknown",photo:ath?.photo_url,liftName:best.liftName,weight:best.weight,reps:best.reps,orm:best.orm});
                    });
                    catRows.sort((a,b)=>b.orm-a.orm);
                    if(!catRows.length)return null;
                    const pctOf=(orm)=>Math.round(Math.min(100,orm/cat.ref*100));
                    return(
                      <div key={cat.id} style={{marginBottom:14,background:"#0e0e0e",borderRadius:12,padding:"12px 12px 8px",border:"0.5px solid #1a1a1a"}}>
                        <div style={{fontSize:11,color:accentColor,fontWeight:700,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                          <span style={{fontSize:14}}>{cat.emoji}</span>
                          <span style={{textTransform:"uppercase",letterSpacing:"0.1em",fontSize:11}}>{cat.label}</span>
                          <span style={{color:"#444",fontWeight:400,fontSize:10,textTransform:"none",marginLeft:2}}>· est. 1RM</span>
                        </div>
                        {catRows.slice(0,5).map((r,ri)=>(
                          <div key={ri} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:ri===0?GOLD+"12":"#151515",borderRadius:10,marginBottom:5,border:"1px solid "+(ri===0?GOLD+"33":"#1e1e1e")}}>
                            <div style={{width:22,fontSize:ri<3?15:12,fontWeight:700,color:ri===0?GOLD:ri===1?"#ccc":ri===2?ORANGE:"#555",textAlign:"center",flexShrink:0}}>
                              {ri===0?"🥇":ri===1?"🥈":ri===2?"🥉":`${ri+1}.`}
                            </div>
                            <div style={{width:32,height:32,borderRadius:"50%",overflow:"hidden",flexShrink:0,background:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:600,color:"#fff",border:"1.5px solid "+(ri===0?GOLD+"66":"#252525")}}>
                              {r.photo?<img src={r.photo} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:r.name[0]}
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:13,fontWeight:ri===0?700:500,color:ri===0?"#fff":"#bbb",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div>
                              <div style={{fontSize:10,color:"#444",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.liftName}</div>
                            </div>
                            <div style={{textAlign:"right",flexShrink:0}}>
                              <div style={{fontSize:16,fontWeight:700,color:ri===0?GOLD:"#ccc"}}>{r.orm}</div>
                              <div style={{fontSize:9,color:"#444"}}>{pctOf(r.orm)}% of ref</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            };
            const menSection=renderSection(CATS_M,"Men's",GOLD);
            const womenSection=renderSection(CATS_F,"Women's","#C084FC");
            if(!menSection&&!womenSection)return null;
            return(
              <div style={{marginTop:16}}>
                <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+GOLD+"33"}}>
                  <div style={{background:"linear-gradient(140deg,"+GOLD+"30,"+GOLD+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GOLD+",#C084FC,"+GOLD+"44)"}}/>
                    <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="trophy" size={66} color="#fff"/></div>
                    <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                      <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+GOLD+"44,"+GOLD+"22)",border:"1px solid "+GOLD+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+GOLD+"33"}}>🏆</div>
                      <div>
                        <div style={{fontSize:8,color:GOLD,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Strength Room</div>
                        <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Team Leaderboard</div>
                        <div style={{fontSize:11,color:"#666",marginTop:1}}>Estimated 1RM · Gender-separated · {Object.keys(byAthlete).length} athletes logged</div>
                      </div>
                    </div>
                  </div>
                  <div style={{background:"#111",padding:"14px 16px"}}>
                    {menSection}
                    {womenSection}
                  </div>
                </div>
              </div>
            );
          })()}
    </>
  );
}
