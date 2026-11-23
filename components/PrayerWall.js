import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function PrayerWall({athleteId, athleteName}){
  const[prayers,setPrayers]=useState([]);
  const[text,setText]=useState("");
  const[anon,setAnon]=useState(false);
  const[submitting,setSubmitting]=useState(false);
  const[submitted,setSubmitted]=useState(false);
  const[submitErr,setSubmitErr]=useState(false);
  const[loading,setLoading]=useState(true);

  const loadPrayers=async()=>{
    try{
      const{data,error}=await supabase.from("announcements")
        .select("*").eq("type","prayer_wall").eq("active",true)
        .order("created_at",{ascending:false});
      if(error)throw error;
      setPrayers(data||[]);
    }catch(e){setPrayers([]);}
    setLoading(false);
  };

  useEffect(()=>{loadPrayers();},[]);

  const submit=async()=>{
    if(!text.trim())return;
    setSubmitting(true);setSubmitErr(false);
    try{
      // Save to community wall (announcements — publicly readable)
      const{error:wallErr}=await supabase.from("announcements").insert({
        type:"prayer_wall",
        message:text.trim(),
        week_label:anon?"anonymous":(athleteName||"Athlete"),
        day:String(athleteId),
        active:true,
      });
      if(wallErr)throw wallErr;

      // Also notify coach via inbox
      try{
        await supabase.from("inbox").insert({
          athlete_id:athleteId,type:"prayer",message:text.trim(),
        });
      }catch(e){}

      await loadPrayers();
      setText("");setSubmitted(true);setTimeout(()=>setSubmitted(false),3000);
    }catch(e){setSubmitErr(true);setTimeout(()=>setSubmitErr(false),4000);}
    setSubmitting(false);
  };

  return(
    <div className="tfx ae ae-violet">
      <header className="ae-head">
        <div>
          <div className="tfx-eyebrow">Community</div>
          <h2>Prayer wall</h2>
          <p>Coach Ant and the group are praying for you.</p>
        </div>
      </header>

      {/* Submit card */}
      <section className="tfx-card ae-card">
        {submitted?(
          <div className="ae-ok" role="status"><i>✓</i> Posted — the group is praying for you</div>
        ):(
          <div className="ae-pray-form">
            <label className="tfx-eyebrow" htmlFor="ae-pray-text">Share a request</label>
            <textarea
              id="ae-pray-text"
              className="tfx-field ae-ta"
              value={text}
              onChange={e=>setText(e.target.value)}
              placeholder="What can the group pray for you about?"
            />
            {submitErr&&(
              <div className="ir-err" role="alert">Something went wrong — please try again.</div>
            )}
            <div className="ae-pray-foot">
              <button type="button" className={"ae-check"+(anon?" is-on":"")} onClick={()=>setAnon(!anon)} aria-pressed={anon}>
                <i aria-hidden="true">✓</i>
                <span>Submit anonymously</span>
              </button>
              <button
                type="button"
                className="tfx-btn tfx-press ae-btn"
                onClick={submit}
                disabled={submitting||!text.trim()}
              >
                {submitting?"Submitting...":"Submit →"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Group wall */}
      <section className="tfx-card ae-card">
        <div className="ae-sec">
          <div className="tfx-eyebrow">Group prayer requests</div>
          <span className="tfx-num">{prayers.length}</span>
        </div>
        {loading&&(
          <div className="ae-skel-stack" aria-label="Loading">
            {[0,1,2].map(i=><div key={i} className="ae-skel" style={{height:64}}/>)}
          </div>
        )}
        {!loading&&prayers.length===0&&(
          <div className="ae-pray-empty">No prayer requests yet.<br/>Be the first to share.</div>
        )}
        {prayers.length>0&&(
          <ul className="ae-pray-list">
            {prayers.map((p,i)=>(
              <li key={i}>
                <div className="ae-pray-who">
                  <b className={p.week_label==="anonymous"?"is-anon":""}>{p.week_label==="anonymous"?"Anonymous":p.week_label||"Athlete"}</b>
                  <span>{new Date(p.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
                </div>
                <p className="ae-quote">“{p.message}”</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
