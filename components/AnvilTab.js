import { useState } from "react";
import { supabase } from "../lib/supabase";
import { GOLD, GREEN, STEEL, RED } from "../lib/constants";
import Icon from "./Icon";

export default function AnvilTab({ athletes=[], anvil=[], setAnvil, anvilPrizes={}, loadAll }){
  const[anvilWinner,setAnvilWinner]=useState("");
  const[anvilNote,setAnvilNote]=useState("");
  const[anvilDate,setAnvilDate]=useState("");
  const[anvilCategory,setAnvilCategory]=useState("Effort");
  const[awardBusy,setAwardBusy]=useState(false);
  const[awardErr,setAwardErr]=useState("");

  const awardAnvil=async()=>{
    if(!anvilWinner.trim())return;
    const _n=new Date();const _e=new Date(_n.toLocaleString("en-US",{timeZone:"America/New_York"}));const _iso=_e.getFullYear()+"-"+String(_e.getMonth()+1).padStart(2,"0")+"-"+String(_e.getDate()).padStart(2,"0");
    setAwardBusy(true);setAwardErr("");
    try{
      const{error}=await supabase.from("anvil").insert({athlete_name:anvilWinner,note:anvilNote,date_awarded:anvilDate||_iso,type:"individual",athlete_role:anvilCategory});
      if(error)throw error;
      const ath=athletes.find(a=>a.name===anvilWinner);
      if(ath){
        const{data:lb}=await supabase.from("leaderboard").select("*").eq("athlete_id",ath.id);
        if(lb&&lb.length>0)await supabase.from("leaderboard").update({anvil_count:(lb[0].anvil_count||0)+1}).eq("athlete_id",ath.id);
        else await supabase.from("leaderboard").insert({athlete_id:ath.id,anvil_count:1});
      }
      setAnvilWinner("");setAnvilNote("");setAnvilDate("");setAnvilCategory("Effort");
      await loadAll();
    }catch(e){setAwardErr("The award didn't save: "+(e.message||"check your connection")+". Try again.");}
    setAwardBusy(false);
  };

  const ANVIL_CATS=[
    {id:"Effort",     emoji:"🔥",color:"#E8720C",desc:"Left everything on the floor"},
    {id:"Performance",emoji:"🏆",color:GOLD,    desc:"Hit a mark nobody else reached"},
    {id:"Leadership", emoji:"👑",color:"#C084FC",desc:"Elevated everyone around them"},
    {id:"Consistency",emoji:"💪",color:GREEN,   desc:"Showed up every single time"},
    {id:"Character",  emoji:"🧠",color:STEEL,   desc:"Did the hard thing without being asked"},
  ];
  const catInfo=(id)=>ANVIL_CATS.find(c=>c.id===id)||ANVIL_CATS[0];
  const indivAnvil=anvil.filter(a=>a.type==="individual");
  const face=(a,name)=>a?.photo_url?<img src={a.photo_url} alt=""/>:(name||"?")[0];
  const winnerWins=indivAnvil.filter(w=>w.athlete_name===anvilWinner).length;
  const canAward=!!(anvilWinner&&anvilNote.trim());
  return(
  <div className="tfx cb cb-anvil">
    {/* Award form */}
    <section className="tfx-card cb-sec cb-award">
      <div className="cb-intro">
        <div className="tfx-eyebrow cb-eb-gold">Bi-weekly honor</div>
        <h2>Award the Anvil</h2>
        <p>Earned. Not given. The highest individual honor in TF College Group.</p>
      </div>

      <div className="cb-fld">
        <div className="cb-lbl">Tap to select athlete</div>
        <div className="cb-agrid is-4">
          {athletes.filter(a=>a.status==="active").map(a=>{
            const isSelected=anvilWinner===a.name;
            const timesWon=indivAnvil.filter(w=>w.athlete_name===a.name).length;
            return(
              <button key={a.id} aria-pressed={isSelected} className={"cb-ath tfx-press"+(isSelected?" is-sel":"")} onClick={()=>setAnvilWinner(isSelected?"":a.name)}>
                <span className="rk-av cb-av-m" style={{"--c":a.role==="forge"?RED:STEEL}}>{face(a,a.name)}</span>
                <b>{(a.name||"").split(" ")[0]}</b>
                {timesWon>0&&<small className="cb-won"><Icon name="anvil" size={12}/>×{timesWon}</small>}
                {isSelected&&<span className="cb-badge is-gold" aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {anvilWinner&&(
        <div className="cb-pick">
          <span className="cb-pick-ico"><Icon name="anvil" size={20}/></span>
          <div>
            <b>{anvilWinner}</b>
            <small>
              {winnerWins>0
                ?"Won it "+winnerWins+" time"+(winnerWins!==1?"s":"")+" before"
                :"First time winner — make it count"}
            </small>
          </div>
        </div>
      )}

      <div className="cb-fld">
        <div className="cb-lbl">Reason category</div>
        <div className="cb-cats">
          {ANVIL_CATS.map(c=>(
            <button key={c.id} aria-pressed={anvilCategory===c.id} className={"cb-cat tfx-press"+(anvilCategory===c.id?" is-on":"")} style={{"--c":c.color}} onClick={()=>setAnvilCategory(c.id)}>
              <i/>
              <span><b>{c.id}</b><small>{c.desc}</small></span>
            </button>
          ))}
        </div>
      </div>

      <label className="cb-fld">
        <span className="cb-lbl">Week / date</span>
        <input className="tfx-field cb-field" value={anvilDate} onChange={e=>setAnvilDate(e.target.value)} placeholder="e.g. Week 1 · June 2"/>
      </label>

      <div className="cb-fld">
        <div className="cb-lbl">
          <label htmlFor="cb-anvil-note">Why they earned it <span className="cb-req">*</span></label>
          <em className={anvilNote.length>20?"is-good":""}>{anvilNote.length} chars</em>
        </div>
        <textarea id="cb-anvil-note" className="tfx-field cb-field" value={anvilNote} onChange={e=>setAnvilNote(e.target.value)} placeholder="Be specific. What did they do that nobody else did this week? This becomes part of their permanent record."/>
        <p className="cb-hint">Athletes can see exactly what you write here.</p>
      </div>

      {awardErr&&<div className="ir-err" role="alert">{awardErr}</div>}
      <button className="tfx-btn cb-btn-gold cb-btn-block tfx-press" onClick={awardAnvil} disabled={!canAward||awardBusy}>
        <Icon name="anvil" size={18}/> {awardBusy?"Saving…":"Award the Anvil"}
      </button>
    </section>

    {/* Never won section */}
    {(()=>{
      const winners=new Set(indivAnvil.map(w=>w.athlete_name));
      const neverWon=athletes.filter(a=>a.status==="active"&&!winners.has(a.name));
      if(!neverWon.length)return null;
      return(
        <section className="tfx-card cb-sec">
          <div className="cb-sec-head">
            <div>
              <h3>Yet to be recognized</h3>
              <p>{neverWon.length} athlete{neverWon.length!==1?"s":""} still waiting for their first</p>
            </div>
          </div>
          <div className="cb-chips">
            {neverWon.map((a,i)=>(
              <span key={i} className="cb-chip is-static">
                <span className="rk-av" style={{"--c":a.role==="forge"?RED:STEEL}}>{face(a,a.name)}</span>
                {(a.name||"").split(" ")[0]}
              </span>
            ))}
          </div>
        </section>
      );
    })()}

    {/* Hall of Fame */}
    <section className="tfx-card cb-sec">
      <div className="cb-sec-head">
        <div>
          <div className="tfx-eyebrow cb-eb-gold">Hall of fame</div>
          <h3>Every winner. Every reason.</h3>
        </div>
        <span className="cb-pill is-gold">{indivAnvil.length} award{indivAnvil.length!==1?"s":""}</span>
      </div>
      {indivAnvil.length===0&&<p className="cb-none">No Anvil winners yet. The first one will be earned on the floor.</p>}
      {indivAnvil.length>0&&(
        <ul className="cb-hof-list">
          {indivAnvil.map((w,i)=>{
            const ath=athletes.find(a=>a.name===w.athlete_name);
            const timesWon=indivAnvil.filter(x=>x.athlete_name===w.athlete_name).length;
            const prevWinner=i>0?indivAnvil[i-1]:null;
            const isStreak=prevWinner&&prevWinner.athlete_name===w.athlete_name;
            const cat=catInfo(w.athlete_role);
            const isCurrent=i===0;
            return(
              <li key={i} className={isCurrent?"is-current":""}>
                <span className="rk-av cb-av-l">{face(ath,w.athlete_name)}</span>
                <div className="cb-hof-main">
                  <div className="cb-hof-name">
                    <b>{w.athlete_name}</b>
                    {isCurrent&&<span className="cb-pill is-gold">Current</span>}
                    {isStreak&&<span className="cb-pill is-ember">🔥 Back to back</span>}
                    {timesWon>1&&<span className="cb-pill is-plain"><Icon name="anvil" size={12}/>×{timesWon}</span>}
                  </div>
                  <div className="cb-hof-meta">
                    <span className="cb-pill" style={{"--c":cat.color}}><i/>{cat.id}</span>
                    <span>{w.date_awarded}</span>
                  </div>
                  {w.note&&(
                    <div className={"cb-quote"+(isCurrent?" is-current":"")}>
                      <div className="tfx-eyebrow">Why they earned it</div>
                      <p>&ldquo;{w.note}&rdquo;</p>
                    </div>
                  )}
                  {anvilPrizes[String(w.id)]&&(()=>{
                    const ps=anvilPrizes[String(w.id)];
                    const PRIZE_EMOJIS={tee:"🎽",shorts:"🩳",dicks:"🏪",food_gc:"🍽️"};
                    return(
                      <span className={"cb-prize"+(isCurrent?" is-current":"")}>
                        <span aria-hidden="true">{PRIZE_EMOJIS[ps.prize]||"🎁"}</span>
                        <b>{ps.label}</b>
                        {ps.size&&<small>· {ps.size}</small>}
                      </span>
                    );
                  })()}
                </div>
                <button className="cb-x" aria-label={"Remove "+w.athlete_name+"'s Anvil award"} onClick={async()=>{
                  if(!window.confirm("Remove this Anvil award?"))return;
                  try{await supabase.from("anvil").delete().eq("id",w.id);}catch(e){}
                  setAnvil(p=>p.filter(x=>x.id!==w.id));
                }}>✕</button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  </div>
  );
}
