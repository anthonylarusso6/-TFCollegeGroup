import { useState } from "react";
import { RED, STEEL } from "../lib/constants";

export default function CoachLeaderboardTab({ leaderboard, athletes, openAthleteModal }){
  const[lbSort,setLbSort]=useState("early");
  return(
    <div className="tfx cd cd-lb">
      {/* Most improved */}
      {(()=>{
        const improved=leaderboard.filter(lb=>lb.current_streak>=3&&lb.current_streak>=(lb.best_streak||0)*0.8).sort((a,b)=>(b.current_streak||0)-(a.current_streak||0))[0];
        if(!improved)return null;
        const ath=athletes.find(a=>a.name===improved.athletes?.name);
        return(
          <section className="tfx-card cd-lb-hot">
            <span className="rk-av cd-av-lg" style={{"--c":STEEL}}>
              {ath?.photo_url?<img src={ath.photo_url} alt=""/>:(improved.athletes?.name||"?")[0]}
            </span>
            <div className="cd-lb-hot-txt">
              <div className="tfx-eyebrow">Most improved — on fire</div>
              <b>{improved.athletes?.name}</b>
              <small>🔥 {improved.current_streak} day streak · {improved.early_count||0} early total</small>
            </div>
          </section>
        );
      })()}

      <section className="tfx-card cd-lb-list">
        <div className="cd-head">
          <div className="cd-head-txt">
            <div className="tfx-eyebrow">Rankings</div>
            <h2>{lbSort==="early"?"Early arrivals":lbSort==="streak"?"Current streak":lbSort==="best"?"Best streak":"Most callouts"}</h2>
          </div>
          {/* Sort options */}
          <div className="cd-scroll" role="tablist" aria-label="Rank by">
            {[
              {id:"early",label:"Early arrivals"},
              {id:"streak",label:"Current streak"},
              {id:"best",label:"Best streak"},
              {id:"callout",label:"Most callouts"},
            ].map(s=>(
              <button key={s.id} role="tab" aria-selected={lbSort===s.id} className={"tfx-chipbtn tfx-press"+(lbSort===s.id?" is-on":"")} onClick={()=>setLbSort(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {leaderboard.length===0&&<p className="cd-empty cd-center">No data yet.</p>}
        <ol className="cd-lb-ol">
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
            const medal=i===0?"🥇":i===1?"🥈":i===2?"🥉":null;
            return(
              <li key={i} className={i===0?"is-first":""}>
                <button className="cd-lb-row" onClick={()=>{const a=athletes.find(x=>x.name===lb.athletes?.name);if(a)openAthleteModal(a);}}>
                  <span className={"cd-rank-n"+(medal?" is-medal":"")}>{medal||i+1}</span>
                  <span className="rk-av" style={{"--c":ath?.role==="forge"?RED:STEEL}}>
                    {ath?.photo_url?<img src={ath.photo_url} alt=""/>:(lb.athletes?.name||"?")[0]}
                  </span>
                  <span className="cd-lb-main">
                    <span className="cd-lb-top">
                      <span>{lb.athletes?.name}</span>
                      <b className={"tfx-num"+(lbSort==="callout"?" is-bad":"")}>{val}</b>
                    </span>
                    <span className="cd-bar">
                      <i className={lbSort==="callout"?"is-bad":i===0?"is-gold":"is-good"} style={{"--p":pct/100}}/>
                    </span>
                    <span className="cd-lb-meta">
                      <span className="is-early"><i/>{lb.early_count||0} early</span>
                      <span className="is-streak">🔥 {lb.current_streak||0} streak</span>
                      <span>best {lb.best_streak||0}</span>
                      {(lb.late_count||0)>0&&<span className="is-late">{lb.late_count} late</span>}
                      {(lb.callout_count||0)>0&&<span>{lb.callout_count} callouts</span>}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
