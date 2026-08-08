import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";
import { RED, GREEN, ORANGE } from "../lib/constants";
import { nowEST, dateKey } from "../lib/dates";

export default function QrTab({ athletes=[], attendance=[] }){
  const[qrDataUrl,setQrDataUrl]=useState("");
  const[qrType,setQrType]=useState("checkin");
  const[qrFullscreen,setQrFullscreen]=useState(false);
  const[groupmeLink,setGroupmeLink]=useState("https://groupme.com/join_group/111967377/1JobSG7L");
  const[groupmeLinkInput,setGroupmeLinkInput]=useState("https://groupme.com/join_group/111967377/1JobSG7L");
  const[groupmeLinkSaving,setGroupmeLinkSaving]=useState(false);
  const[groupmeLinkSaved,setGroupmeLinkSaved]=useState(false);

  const estTodayStr=dateKey(nowEST());

  useEffect(()=>{
    const url=qrType==="checkin"?"https://tfcollegegroup.com/checkin":"https://tfcollegegroup.com/athlete";
    import("qrcode").then(QRCode=>{
      QRCode.default.toDataURL(url,{width:280,margin:2,color:{dark:"#1a1a1a",light:"#ffffff"}}).then(setQrDataUrl);
    });
  },[qrType]);

  const loadGroupmeLink=async()=>{
    try{
      const{data}=await supabase.from("announcements").select("day").eq("type","groupme_link").order("created_at",{ascending:false}).limit(1).maybeSingle();
      if(data?.day){setGroupmeLink(data.day);setGroupmeLinkInput(data.day);}
    }catch(e){}
  };

  useEffect(()=>{loadGroupmeLink();},[]);

  const saveGroupmeLink=async()=>{
    if(!groupmeLinkInput.trim())return;
    setGroupmeLinkSaving(true);
    try{
      const{error}=await supabase.from("announcements").insert({type:"groupme_link",day:groupmeLinkInput.trim(),active:true,message:"GroupMe invite link"});
      if(error){alert("Save failed: "+error.message);setGroupmeLinkSaving(false);return;}
      setGroupmeLink(groupmeLinkInput.trim());
      setGroupmeLinkSaved(true);
      setTimeout(()=>setGroupmeLinkSaved(false),2500);
    }catch(e){alert("Save failed: "+e.message);}
    setGroupmeLinkSaving(false);
  };

  return(
    <div>
            <div>
              <div style={{display:"flex",gap:6,marginBottom:12}}>
                {[{id:"checkin",label:"⏱ Check-In"},{id:"athlete",label:"👤 Athlete Portal"}].map(t=>(
                  <button key={t.id} onClick={()=>setQrType(t.id)} style={{flex:1,padding:"10px 6px",borderRadius:10,border:"1px solid "+(qrType===t.id?ORANGE:"#252525"),background:qrType===t.id?ORANGE:"#111",color:qrType===t.id?"#fff":"#666",fontSize:12,fontWeight:qrType===t.id?700:400,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+ORANGE+"33"}}>
                <div style={{background:"linear-gradient(140deg,"+ORANGE+"30,"+ORANGE+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+ORANGE+","+ORANGE+"44,transparent)"}}/>
                  <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="smartphone" size={66} color="#fff"/></div>
                  <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+ORANGE+"12,transparent 70%)",pointerEvents:"none"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                    <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+ORANGE+"44,"+ORANGE+"22)",border:"1px solid "+ORANGE+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+ORANGE+"33"}}>📱</div>
                    <div>
                      <div style={{fontSize:8,color:ORANGE,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>{qrType==="checkin"?"Check-In":"Athlete Portal"}</div>
                      <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>{qrType==="checkin"?"Check-In QR":"Portal QR"}</div>
                      <div style={{fontSize:11,color:"#666",marginTop:1}}>{qrType==="checkin"?"Show at the door — athletes scan and check in.":"Athletes scan to log in and view their profile."}</div>
                    </div>
                  </div>
                </div>
                <div style={{background:"#111",padding:"16px 18px",textAlign:"center"}}>
                  <div style={{background:"#1a1a1a",borderRadius:12,padding:"20px",display:"inline-block",marginBottom:12,border:"1px solid #333"}}>
                    {qrDataUrl?<img src={qrDataUrl} alt="QR Code" style={{width:220,height:220,display:"block"}}/>:<div style={{width:220,height:220,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#555"}}>Generating...</div>}
                  </div>
                  <div style={{fontSize:11,color:"#555",marginBottom:16}}>{qrType==="checkin"?"tfcollegegroup.com/checkin":"tfcollegegroup.com/athlete"}</div>
                  <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                    <button onClick={()=>setQrFullscreen(true)} style={{padding:"10px 20px",borderRadius:10,border:"none",background:"#1a1a1a",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"Georgia,serif",border:"1px solid #333"}}>
                      ⛶ Display at door
                    </button>
                    {qrDataUrl&&(
                      <a href={qrDataUrl} download={"tf-"+qrType+"-qr.png"} style={{padding:"10px 20px",borderRadius:10,border:"0.5px solid #333",background:"#1a1a1a",color:"#aaa",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"Georgia,serif",textDecoration:"none",display:"inline-block"}}>
                        ↓ Download
                      </a>
                    )}
                  </div>
                </div>
              </div>
              {(()=>{
                const todayRecs=attendance.filter(r=>r.date===estTodayStr);
                const early=todayRecs.filter(r=>r.status==="early").length;
                const late=todayRecs.filter(r=>r.status==="late").length;
                const total=athletes.filter(a=>a.status==="active").length;
                return(
                  <div style={{background:"#111",borderRadius:20,padding:"1.25rem",marginBottom:12,border:"0.5px solid #252525"}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#555",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:10}}>Today's check-ins (live)</div>
                    <div style={{display:"flex",gap:10}}>
                      <div style={{flex:1,textAlign:"center",padding:"12px 8px",background:GREEN+"22",borderRadius:10,border:"0.5px solid "+GREEN+"33"}}>
                        <div style={{fontSize:28,fontWeight:700,color:GREEN}}>{early}</div>
                        <div style={{fontSize:11,color:GREEN}}>Early</div>
                      </div>
                      <div style={{flex:1,textAlign:"center",padding:"12px 8px",background:RED+"22",borderRadius:10,border:"0.5px solid "+RED+"33"}}>
                        <div style={{fontSize:28,fontWeight:700,color:RED}}>{late}</div>
                        <div style={{fontSize:11,color:RED}}>Late</div>
                      </div>
                      <div style={{flex:1,textAlign:"center",padding:"12px 8px",background:"#1a1a1a",borderRadius:10,border:"0.5px solid #252525"}}>
                        <div style={{fontSize:28,fontWeight:700,color:"#666"}}>{total-early-late}</div>
                        <div style={{fontSize:11,color:"#555"}}>Not in</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
              <div style={{background:"#111",borderRadius:20,padding:"14px 18px",border:"0.5px solid #252525"}}>
                <div style={{fontSize:11,fontWeight:700,color:"#555",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:10}}>How it works</div>
                {["Show this QR on your phone or iPad at the door","Athletes scan with their camera — no app needed","They tap their name and check in instantly","Early / Late is determined automatically by time","Attendance updates on your coach dashboard live"].map((s,i)=>(
                  <div key={i} style={{display:"flex",gap:8,marginBottom:6}}>
                    <div style={{width:18,height:18,borderRadius:"50%",background:ORANGE,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff",flexShrink:0}}>{i+1}</div>
                    <div style={{fontSize:12,color:"#777"}}>{s}</div>
                  </div>
                ))}
              </div>
              <div style={{background:"#111",borderRadius:20,padding:"16px 18px",marginTop:12,border:"1px solid #00aff033"}}>
                <div style={{fontSize:11,fontWeight:700,color:"#00aff0",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:6}}>💬 GroupMe Invite Link</div>
                <div style={{fontSize:11,color:"#555",marginBottom:10}}>This link appears in the athlete portal and home page. Update it here whenever GroupMe gives you a new code.</div>
                <a href={groupmeLink} target="_blank" rel="noreferrer" style={{display:"block",padding:"8px 12px",borderRadius:8,background:"#00aff011",border:"0.5px solid #00aff022",fontSize:11,color:"#00aff0",textDecoration:"none",marginBottom:10,wordBreak:"break-all"}}>{groupmeLink}</a>
                <input value={groupmeLinkInput} onChange={e=>setGroupmeLinkInput(e.target.value)} placeholder="https://groupme.com/join_group/..." style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"0.5px solid #333",fontSize:12,background:"#1a1a1a",color:"#ddd",boxSizing:"border-box",marginBottom:8,fontFamily:"Georgia,serif"}}/>
                <button onClick={saveGroupmeLink} disabled={groupmeLinkSaving||!groupmeLinkInput.trim()} style={{width:"100%",padding:"10px",borderRadius:10,border:"none",background:groupmeLinkSaved?"#1E6B3A":"#00aff0",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                  {groupmeLinkSaved?"✓ Link updated!":groupmeLinkSaving?"Saving...":"Update GroupMe Link →"}
                </button>
              </div>
            </div>

          {/* Fullscreen QR overlay */}
          {qrFullscreen&&(
            <div onClick={()=>setQrFullscreen(false)} style={{position:"fixed",inset:0,background:"#fff",zIndex:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,cursor:"pointer"}}>
              <div style={{fontSize:13,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.1em"}}>TF College Group · {qrType==="checkin"?"Check In":"Athlete Portal"}</div>
              {qrDataUrl&&<img src={qrDataUrl} alt="QR Code" style={{width:"min(80vw,80vh)",height:"min(80vw,80vh)"}}/>}
              <div style={{fontSize:15,fontWeight:600,color:"#1a1a1a"}}>
                {qrType==="checkin"?"tfcollegegroup.com/checkin":"tfcollegegroup.com/athlete"}
              </div>
              {(()=>{
                const todayRecs=attendance.filter(r=>r.date===estTodayStr);
                const early=todayRecs.filter(r=>r.status==="early").length;
                const late=todayRecs.filter(r=>r.status==="late").length;
                return early+late>0?(
                  <div style={{display:"flex",gap:16,fontSize:13}}>
                    <span style={{color:GREEN,fontWeight:600}}>✓ {early} early</span>
                    {late>0&&<span style={{color:RED,fontWeight:600}}>⚠ {late} late</span>}
                  </div>
                ):null;
              })()}
              <div style={{fontSize:11,color:"#ccc"}}>Tap anywhere to close</div>
            </div>
          )}
    </div>
  );
}
