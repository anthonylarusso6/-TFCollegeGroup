import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
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
    <div className="tfx cd cd-qr">
      <section className="tfx-card cd-head">
        <div className="cd-head-txt">
          <div className="tfx-eyebrow">{qrType==="checkin"?"Check-in":"Athlete portal"}</div>
          <h2>{qrType==="checkin"?"Check-in QR":"Portal QR"}</h2>
          <p>{qrType==="checkin"?"Show at the door — athletes scan and check in.":"Athletes scan to log in and view their profile."}</p>
        </div>
        <div className="ir-seg" role="tablist" aria-label="Which QR code">
          {[{id:"checkin",label:"Check-in"},{id:"athlete",label:"Athlete portal"}].map(t=>(
            <button key={t.id} role="tab" aria-selected={qrType===t.id} className={"tfx-press"+(qrType===t.id?" is-on":"")} onClick={()=>setQrType(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        {/* The code itself stays black on white in both themes so it scans */}
        <div className="cd-qr-plate">
          {qrDataUrl?<img src={qrDataUrl} alt="QR Code" className="cd-qr-img"/>:<div className="cd-qr-img cd-qr-wait">Generating...</div>}
        </div>
        <div className="cd-qr-url">{qrType==="checkin"?"tfcollegegroup.com/checkin":"tfcollegegroup.com/athlete"}</div>
        <div className="cd-qr-acts">
          <button className="tfx-btn tfx-press" onClick={()=>setQrFullscreen(true)}>Display at door</button>
          {qrDataUrl&&(
            <a className="tfx-btn-ghost tfx-press" href={qrDataUrl} download={"tf-"+qrType+"-qr.png"}>↓ Download</a>
          )}
        </div>
      </section>

      {(()=>{
        const todayRecs=attendance.filter(r=>r.date===estTodayStr);
        const early=todayRecs.filter(r=>r.status==="early").length;
        const late=todayRecs.filter(r=>r.status==="late").length;
        const total=athletes.filter(a=>a.status==="active").length;
        return(
          <section className="tfx-card cd-card">
            <div className="cd-live"><span className="tfx-livedot"/><span className="tfx-eyebrow">Today's check-ins</span><small>Live</small></div>
            <div className="cd-stats3">
              <div className="is-early"><b className="tfx-num">{early}</b><span>Early</span></div>
              <div className="is-late"><b className="tfx-num">{late}</b><span>Late</span></div>
              <div className="is-none"><b className="tfx-num">{total-early-late}</b><span>Not in</span></div>
            </div>
          </section>
        );
      })()}

      <section className="tfx-card cd-card">
        <div className="tfx-eyebrow">How it works</div>
        <ol className="cd-steps">
          {["Show this QR on your phone or iPad at the door","Athletes scan with their camera — no app needed","They tap their name and check in instantly","Early / Late is determined automatically by time","Attendance updates on your coach dashboard live"].map((s,i)=>(
            <li key={i}><b>{i+1}</b><span>{s}</span></li>
          ))}
        </ol>
      </section>

      <section className="tfx-card cd-card">
        <div className="tfx-eyebrow">GroupMe invite link</div>
        <p className="cd-sub">This link appears in the athlete portal and home page. Update it here whenever GroupMe gives you a new code.</p>
        <a className="cd-gm-link" href={groupmeLink} target="_blank" rel="noreferrer">{groupmeLink}</a>
        <div className="cd-gm-form">
          <input className="cd-in" value={groupmeLinkInput} onChange={e=>setGroupmeLinkInput(e.target.value)} placeholder="https://groupme.com/join_group/..." aria-label="New GroupMe invite link"/>
          <button className={"tfx-btn-ghost tfx-press cd-wide"+(groupmeLinkSaved?" is-saved":"")} onClick={saveGroupmeLink} disabled={groupmeLinkSaving||!groupmeLinkInput.trim()}>
            {groupmeLinkSaved?"✓ Link updated!":groupmeLinkSaving?"Saving...":"Update GroupMe link →"}
          </button>
        </div>
      </section>

      {/* Fullscreen QR overlay — always white so the code scans */}
      {qrFullscreen&&(
        <div className="cd-qr-full" onClick={()=>setQrFullscreen(false)} role="dialog" aria-label="QR code. Tap anywhere to close.">
          <div className="cd-qr-full-k">TF College Group · {qrType==="checkin"?"Check In":"Athlete Portal"}</div>
          {qrDataUrl&&<img src={qrDataUrl} alt="QR Code"/>}
          <div className="cd-qr-full-url">
            {qrType==="checkin"?"tfcollegegroup.com/checkin":"tfcollegegroup.com/athlete"}
          </div>
          {(()=>{
            const todayRecs=attendance.filter(r=>r.date===estTodayStr);
            const early=todayRecs.filter(r=>r.status==="early").length;
            const late=todayRecs.filter(r=>r.status==="late").length;
            return early+late>0?(
              <div className="cd-qr-full-st">
                <span className="is-early">✓ {early} early</span>
                {late>0&&<span className="is-late">⚠ {late} late</span>}
              </div>
            ):null;
          })()}
          <div className="cd-qr-full-x">Tap anywhere to close</div>
        </div>
      )}
    </div>
  );
}
