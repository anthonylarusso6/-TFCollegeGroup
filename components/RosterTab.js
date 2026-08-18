import { useState } from "react";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";
import { PUR, RED, GREEN, STEEL } from "../lib/constants";

export default function RosterTab({athletes=[],setAthletes,updateAthlete,deleteAthlete,addAthlete,uploadAthletePhoto,openAthleteModal,newName,setNewName,newSport,setNewSport,newGender,setNewGender,newRole,setNewRole}){
  const[rosterSearch,setRosterSearch]=useState("");
  const[rosterStatus,setRosterStatus]=useState("active");
  const[rosterExpanded,setRosterExpanded]=useState(null);

  return(
            <div>
              <div style={{display:"flex",gap:6,marginBottom:12}}>
                {["active","sleeping","archived"].map(s=>(
                  <button key={s} onClick={()=>setRosterStatus(s)} style={{flex:1,padding:"8px",borderRadius:8,border:"0.5px solid "+(rosterStatus===s?PUR:"#252525"),background:rosterStatus===s?PUR:"#111",color:rosterStatus===s?"#fff":"#666",fontSize:12,fontWeight:rosterStatus===s?600:400,cursor:"pointer",fontFamily:"Georgia,serif",textTransform:"capitalize"}}>
                    {s} ({athletes.filter(a=>a.status===s).length})
                  </button>
                ))}
              </div>
              <div style={{position:"relative",marginBottom:12}}>
                <input value={rosterSearch} onChange={e=>setRosterSearch(e.target.value)} placeholder="Search name, sport, or school..." style={{width:"100%",padding:"10px 12px 10px 34px",borderRadius:10,border:"0.5px solid #252525",fontSize:13,fontFamily:"Georgia,serif",background:"#1a1a1a",color:"#ddd",boxSizing:"border-box"}}/>
                <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"#aaa"}}><Icon name="search" size={15} color="rgba(255,255,255,0.4)"/></div>
                {rosterSearch&&<button onClick={()=>setRosterSearch("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",fontSize:14,color:"#aaa",cursor:"pointer"}}>✕</button>}
              </div>
              <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+PUR+"33"}}>
                <div style={{background:"linear-gradient(140deg,"+PUR+"30,"+PUR+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+PUR+","+PUR+"44,transparent)"}}/>
                  <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="users" size={66} color="#fff"/></div>
                  <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+PUR+"12,transparent 70%)",pointerEvents:"none"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                    <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+PUR+"44,"+PUR+"22)",border:"1px solid "+PUR+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+PUR+"33"}}>👥</div>
                    <div>
                      <div style={{fontSize:8,color:PUR,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Athletes</div>
                      <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Roster</div>
                      <div style={{fontSize:11,color:"#666",marginTop:1}}>{athletes.filter(a=>a.status===rosterStatus&&(!rosterSearch||a.name?.toLowerCase().includes(rosterSearch.toLowerCase())||a.sport?.toLowerCase().includes(rosterSearch.toLowerCase())||a.college?.toLowerCase().includes(rosterSearch.toLowerCase()))).length} athletes · {rosterStatus}</div>
                    </div>
                  </div>
                </div>
                <div style={{background:"#111",padding:"16px 18px"}}>
                {athletes.filter(a=>a.status===rosterStatus&&(!rosterSearch||a.name?.toLowerCase().includes(rosterSearch.toLowerCase())||a.sport?.toLowerCase().includes(rosterSearch.toLowerCase())||a.college?.toLowerCase().includes(rosterSearch.toLowerCase()))).map(a=>{
                  const isExp=rosterExpanded===a.id;
                  const hasInjury=!!(a.injury||a.injury_note);
                  return(
                    <div key={a.id} style={{borderBottom:"0.5px solid #1e1e1e"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",cursor:"pointer"}} onClick={()=>setRosterExpanded(isExp?null:a.id)}>
                        <label style={{width:36,height:36,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:500,color:"#fff",flexShrink:0,cursor:"pointer",overflow:"hidden",outline:hasInjury?"2.5px solid "+RED:"none",outlineOffset:"1px"}} onClick={e=>e.stopPropagation()}>
                          {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(a.name||"?")[0]}
                          <input type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{
                            const file=e.target.files[0];if(!file)return;
                            try{
                              const publicUrl=await uploadAthletePhoto(a.id,file);
                              const{data,error}=await supabase.from("athletes").update({photo_url:publicUrl}).eq("id",a.id).select("id");
                              if(error){alert("Photo save failed: "+error.message);return;}
                              if(!data||data.length===0){alert("Photo not saved — check Supabase permissions.");return;}
                              setAthletes(prev=>prev.map(x=>x.id===a.id?{...x,photo_url:publicUrl}:x));
                            }catch(err){alert("Photo save failed: "+err.message);}
                          }}/>
                        </label>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                            <div onClick={e=>{e.stopPropagation();openAthleteModal(a);}} style={{fontSize:13,fontWeight:500,color:"#ddd",cursor:"pointer",textDecoration:"underline",textDecorationColor:"#444"}}>{a.name}</div>
                            {hasInjury&&<span style={{fontSize:10,background:"#2a0808",color:RED,padding:"1px 6px",borderRadius:4,fontWeight:500}}>🤕 Injured</span>}
                          </div>
                          <div style={{fontSize:11,color:"#666"}}>{a.sport} · {a.gender} · <span style={{color:a.role==="forge"?RED:STEEL}}>{a.role==="forge"?"Forge":"Iron"}</span></div>
                          {(a.college||a.year)&&<div style={{fontSize:10.5,color:"#7a7a7a",marginTop:1}}>🎓 {[a.college,a.year].filter(Boolean).join(" · ")}</div>}
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:6}} onClick={e=>e.stopPropagation()}>
                          <select value={a.status} onChange={e=>updateAthlete(a.id,"status",e.target.value)} style={{padding:"3px 6px",fontSize:11,border:"0.5px solid #333",borderRadius:6,background:"#1a1a1a",color:a.status==="active"?GREEN:a.status==="sleeping"?"#854F0B":RED}}>
                            <option value="active">Active</option>
                            <option value="sleeping">Sleeping</option>
                            <option value="archived">Archived</option>
                          </select>
                          <button onClick={e=>{e.stopPropagation();deleteAthlete(a.id,a.name);}} style={{padding:"3px 8px",borderRadius:6,border:"0.5px solid #ffcccc",background:"transparent",color:RED,fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>✕</button>
                        </div>
                        <div style={{fontSize:12,color:"#ccc"}}>{isExp?"▲":"▼"}</div>
                      </div>
                      {isExp&&(
                        <div style={{paddingBottom:14,paddingLeft:46}}>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                            <div>
                              <div style={{fontSize:10,color:"#aaa",marginBottom:3}}>Role</div>
                              <select value={a.role} onChange={e=>updateAthlete(a.id,"role",e.target.value)} style={{width:"100%",padding:"6px 8px",fontSize:12,border:"0.5px solid #333",borderRadius:8,background:"#1a1a1a",color:a.role==="forge"?RED:STEEL}}>
                                <option value="iron">The Iron</option>
                                <option value="forge">The Forge</option>
                              </select>
                            </div>
                            <div>
                              <div style={{fontSize:10,color:"#aaa",marginBottom:3}}>PIN</div>
                              <input defaultValue={a.pin||""} placeholder="4-digit PIN" onBlur={async e=>{await supabase.from("athletes").update({pin:e.target.value||null}).eq("id",a.id);}} style={{width:"100%",padding:"6px 8px",fontSize:12,border:"0.5px solid #333",borderRadius:8,background:"#1a1a1a",color:"#ddd",fontFamily:"Georgia,serif",boxSizing:"border-box"}}/>
                            </div>
                            <div>
                              <div style={{fontSize:10,color:"#aaa",marginBottom:3}}>Bracelet</div>
                              <input defaultValue={a.bracelet||""} placeholder="e.g. Phil 4:13" onBlur={async e=>{await supabase.from("athletes").update({bracelet:e.target.value||null}).eq("id",a.id);setAthletes(prev=>prev.map(x=>x.id===a.id?{...x,bracelet:e.target.value}:x));}} style={{width:"100%",padding:"6px 8px",fontSize:12,border:"0.5px solid #333",borderRadius:8,background:"#1a1a1a",color:"#ddd",fontFamily:"Georgia,serif",boxSizing:"border-box"}}/>
                            </div>
                            <div>
                              <div style={{fontSize:10,color:"#aaa",marginBottom:3}}>Partner</div>
                              <select defaultValue={a.accountability_partner||""} onChange={async e=>{await supabase.from("athletes").update({accountability_partner:e.target.value||null}).eq("id",a.id);setAthletes(prev=>prev.map(x=>x.id===a.id?{...x,accountability_partner:e.target.value}:x));}} style={{width:"100%",padding:"6px 8px",fontSize:12,border:"0.5px solid #333",borderRadius:8,background:"#1a1a1a",color:"#ddd"}}>
                                <option value="">No partner</option>
                                {athletes.filter(x=>x.id!==a.id&&x.status==="active").map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
                              </select>
                            </div>
                            <div>
                              <div style={{fontSize:10,color:"#aaa",marginBottom:3}}>College</div>
                              <input defaultValue={a.college||""} placeholder="School" onBlur={async e=>{await supabase.from("athletes").update({college:e.target.value||null}).eq("id",a.id);setAthletes(prev=>prev.map(x=>x.id===a.id?{...x,college:e.target.value}:x));}} style={{width:"100%",padding:"6px 8px",fontSize:12,border:"0.5px solid #333",borderRadius:8,background:"#1a1a1a",color:"#ddd",fontFamily:"Georgia,serif",boxSizing:"border-box"}}/>
                            </div>
                            <div>
                              <div style={{fontSize:10,color:"#aaa",marginBottom:3}}>Year</div>
                              <select defaultValue={a.year||""} onChange={async e=>{await supabase.from("athletes").update({year:e.target.value||null}).eq("id",a.id);setAthletes(prev=>prev.map(x=>x.id===a.id?{...x,year:e.target.value}:x));}} style={{width:"100%",padding:"6px 8px",fontSize:12,border:"0.5px solid #333",borderRadius:8,background:"#1a1a1a",color:"#ddd"}}>
                                <option value="">—</option>
                                {["Freshman","Sophomore","Junior","Senior","5th Year","Grad"].map(y=><option key={y} value={y}>{y}</option>)}
                              </select>
                            </div>
                          </div>
                          {a.athletic_goal&&<div style={{fontSize:12,color:"#555",fontStyle:"italic",padding:"6px 10px",background:"#1a1a1a",borderRadius:8,border:"0.5px solid #252525",marginBottom:8}}>🎯 {a.athletic_goal}</div>}
                          {hasInjury&&(
                            <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:RED,padding:"6px 10px",background:"#2a0808",borderRadius:8,border:"0.5px solid "+RED+"44",marginBottom:8}}>
                              <span style={{flex:1}}>🤕 {a.injury_note||a.injury}</span>
                              <button onClick={async e=>{e.stopPropagation();await supabase.from("athletes").update({injury:false,injury_note:null}).eq("id",a.id);setAthletes(p=>p.map(x=>x.id===a.id?{...x,injury:false,injury_note:null}:x));}} style={{padding:"2px 8px",borderRadius:4,border:"0.5px solid #ffaaaa",background:"transparent",color:RED,fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif",flexShrink:0}}>Clear</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 50px 70px 60px",gap:6,marginTop:16}}>
                  <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Name" style={{padding:"6px 8px",fontSize:12,border:"0.5px solid #333",borderRadius:8,background:"#1a1a1a",color:"#ddd",fontFamily:"Georgia,serif"}}/>
                  <input value={newSport} onChange={e=>setNewSport(e.target.value)} placeholder="Sport" style={{padding:"6px 8px",fontSize:12,border:"0.5px solid #333",borderRadius:8,background:"#1a1a1a",color:"#ddd",fontFamily:"Georgia,serif"}}/>
                  <select value={newGender} onChange={e=>setNewGender(e.target.value)} style={{padding:"6px",fontSize:12,border:"0.5px solid #333",borderRadius:8,background:"#1a1a1a",color:"#ddd"}}>
                    <option value="">M/F</option><option value="M">M</option><option value="F">F</option>
                  </select>
                  <select value={newRole} onChange={e=>setNewRole(e.target.value)} style={{padding:"6px",fontSize:12,border:"0.5px solid #333",borderRadius:8,background:"#1a1a1a",color:"#ddd"}}>
                    <option value="iron">Iron</option><option value="forge">Forge</option>
                  </select>
                  <button onClick={addAthlete} disabled={!newName.trim()} style={{padding:"6px 12px",borderRadius:8,border:"none",background:newName.trim()?PUR:"#e0e0e0",color:"#fff",fontSize:12,fontWeight:500,cursor:newName.trim()?"pointer":"not-allowed",fontFamily:"Georgia,serif"}}>Add</button>
                </div>
                </div>
              </div>
            </div>
  );
}
