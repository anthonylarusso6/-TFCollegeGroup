import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function PrayersTab(){
  const[coachPrayers,setCoachPrayers]=useState([]);
  const[prayedFor,setPrayedFor]=useState({});

  useEffect(()=>{
    (async()=>{
      try{const{data}=await supabase.from("inbox").select("*,athletes(name)").eq("type","prayer").order("created_at",{ascending:false});if(data)setCoachPrayers(data);}catch(e){}
    })();
  },[]);

  const left=coachPrayers.filter(p=>!prayedFor[p.id]).length;

  return (
    <div className="tfx cf cf-pr">
      <section className="tfx-card cf-head">
        <div className="cf-head-top">
          <div>
            <div className="tfx-eyebrow">Athletes</div>
            <h2>Prayer requests</h2>
            <p>{coachPrayers.length} request{coachPrayers.length!==1?"s":""} from your athletes</p>
          </div>
          {coachPrayers.length>0&&(
            <span className={"cf-pill "+(left>0?"is-violet":"is-green")}>{left>0?left+" to pray for":"All prayed for"}</span>
          )}
        </div>
      </section>

      <section className="tfx-card cf-card cf-pr-list">
        {coachPrayers.length===0&&<p className="cf-empty">No prayer requests yet.</p>}
        {coachPrayers.length>0&&(
          <ul>
            {coachPrayers.map((p,i)=>{
              const done=!!prayedFor[p.id];
              return(
                <li key={i} className={done?"is-done":""}>
                  <div className="cf-pr-top">
                    <b>{p.anonymous?"Anonymous":p.athletes?.name||"Athlete"}</b>
                    <span className="tfx-num">{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                  <blockquote>"{p.message}"</blockquote>
                  <button className={"cf-pr-btn tfx-press"+(done?" is-done":"")} aria-pressed={done} onClick={()=>setPrayedFor(prev=>({...prev,[p.id]:true}))}>
                    {done?"✓ Prayed for":"Mark as prayed →"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
