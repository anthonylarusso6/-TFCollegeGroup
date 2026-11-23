import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { RED, STEEL } from "../lib/constants";

export default function InjuriesTab({athletes=[]}){
  const[bodyInjuries,setBodyInjuries]=useState(null);
  const[injLoading,setInjLoading]=useState(false);
  const[injLoadErr,setInjLoadErr]=useState(false);
  const[injExpanded,setInjExpanded]=useState(null);

  const loadBodyInjuries=async()=>{
    setInjLoading(true);setInjLoadErr(false);
    try{
      const{data,error}=await supabase.from("announcements").select("day,week_label,message").eq("type","body_injury").eq("active",true);
      if(error)throw error;
      const result={};
      (data||[]).forEach(r=>{ if(!result[r.day])result[r.day]={}; try{result[r.day][r.week_label]=JSON.parse(r.message);}catch(e){} });
      setBodyInjuries(result);
    }catch(e){setInjLoadErr(true);setBodyInjuries({});}
    setInjLoading(false);
  };
  const clearInjuryPart=async(athleteId,partId)=>{
    try{
      await supabase.from("announcements").update({active:false}).eq("type","body_injury").eq("day",String(athleteId)).eq("week_label",partId).eq("active",true);
      setBodyInjuries(prev=>{ const base=prev||{}; const u={...base,[String(athleteId)]:{...(base[String(athleteId)]||{})}}; delete u[String(athleteId)][partId]; return u; });
    }catch(e){}
  };

  useEffect(()=>{loadBodyInjuries();},[]);

  const activeAthletes=athletes.filter(a=>a.status==="active");
  if(injLoading||!bodyInjuries){return(<div className="tfx cd"><p className="cd-loading">Loading injuries...</p></div>);}
  const flagged=activeAthletes.filter(a=>{
    const parts=(bodyInjuries||{})[String(a.id)]||{};
    return Object.values(parts).some(p=>p.status==="sore"||p.status==="pain");
  });
  const clear=activeAthletes.filter(a=>{
    const parts=(bodyInjuries||{})[String(a.id)]||{};
    return !Object.values(parts).some(p=>p.status==="sore"||p.status==="pain");
  });
  return(
    <div className="tfx cd cd-inj">
      <section className="tfx-card cd-head">
        <div className="cd-head-top">
          <div className="cd-head-txt">
            <div className="tfx-eyebrow">Athletes</div>
            <h2>Injury check-in</h2>
            <p>{injLoading?"Loading injuries...":`${flagged.length} flagged · ${clear.length} all good`}</p>
          </div>
          <button className="cd-mini tfx-press" onClick={loadBodyInjuries}>{injLoading?"…":"↻ Refresh"}</button>
        </div>
        {injLoadErr&&<div className="ir-err" role="alert">Load failed — tap Refresh</div>}
      </section>

      <section className="tfx-card cd-card">
        {injLoading&&(
          <p className="cd-empty cd-center">Loading injury data...</p>
        )}
        {!injLoading&&flagged.length===0&&(
          <p className="cd-empty cd-center">{injLoadErr?"Failed to load — tap Refresh above":"No athletes have flagged any body parts"}</p>
        )}
        {flagged.length>0&&(
          <ul className="cd-inj-ul">
            {flagged.map(a=>{
              const parts=bodyInjuries[String(a.id)]||{};
              const painParts=Object.entries(parts).filter(([,v])=>v.status==="pain");
              const soreParts=Object.entries(parts).filter(([,v])=>v.status==="sore");
              const isOpen=injExpanded===a.id;
              return(
                <li key={a.id} className={"cd-inj-ath"+(isOpen?" is-open":"")}>
                  <button className="cd-xrow" onClick={()=>setInjExpanded(isOpen?null:a.id)} aria-expanded={isOpen}>
                    <span className="rk-av" style={{"--c":a.role==="forge"?RED:STEEL}}>
                      {a.photo_url?<img src={a.photo_url} alt=""/>:(a.name||"?")[0]}
                    </span>
                    <span className="cd-inj-who">
                      <b>{a.name}</b>
                      <span className="cd-inj-parts">
                        {painParts.map(([id])=>(
                          <span key={id} className="cd-tag is-pain"><i/>{id.replace(/_/g," ")}</span>
                        ))}
                        {soreParts.map(([id])=>(
                          <span key={id} className="cd-tag is-sore"><i/>{id.replace(/_/g," ")}</span>
                        ))}
                      </span>
                    </span>
                    <span className="cd-chev" aria-hidden="true">▼</span>
                  </button>
                  {isOpen&&(
                    <div className="cd-inj-detail">
                      {[...painParts,...soreParts].map(([id,v])=>(
                        <div key={id} className={"cd-inj-part "+(v.status==="pain"?"is-pain":"is-sore")}>
                          <div className="cd-row">
                            <b>{id.replace(/_/g," ")}</b>
                            <span className="cd-pill"><i/>{v.status==="pain"?"In Pain":"A Little Sore"}{v.pain>0?" · "+v.pain+"/10":""}</span>
                          </div>
                          {v.description&&<p>"{v.description}"</p>}
                          <div className="cd-row">
                            {v.updatedAt&&<small>{new Date(v.updatedAt).toLocaleDateString("en-US",{timeZone:"America/New_York",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</small>}
                            <button className="cd-mini is-good tfx-press" onClick={()=>clearInjuryPart(a.id,id)}>✓ Mark cleared</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {clear.length>0&&flagged.length>0&&(
          <div className="cd-inj-good">
            <div className="tfx-eyebrow">All good</div>
            <div className="cd-okchips">
              {clear.map(a=>(
                <span key={a.id} className="cd-okchip"><i>✓</i>{a.name}</span>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
