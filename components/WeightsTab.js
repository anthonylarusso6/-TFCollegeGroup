import { STEEL, RED } from "../lib/constants";
import { isFemale } from "../lib/teams";
import Icon from "./Icon";
import ProgramUpload from "./ProgramUpload";

export default function WeightsTab({ athletes, weightLogs, prLogs }){
  const loggedIds=[...new Set(weightLogs.map(l=>l.athlete_id))];
  return(
    <div className="tfx cd cd-wt">
      <section className="tfx-card cd-head">
        <div className="cd-head-txt">
          <div className="tfx-eyebrow">Weight room</div>
          <h2>Weight log</h2>
          <p>{loggedIds.length} athletes · {weightLogs.length} entries</p>
        </div>
      </section>

      <ProgramUpload/>

      {weightLogs.length===0&&(
        <section className="tfx-card cd-wt-empty">
          <Icon name="scale" size={28}/>
          <b>No weight logs yet.</b>
          <p className="cd-sub">Athletes log from their Weight tab.</p>
        </section>
      )}

      {loggedIds.length>0&&(
        <div className="cd-sec"><h3>Body weight</h3><span>{loggedIds.length} athletes</span></div>
      )}

      {loggedIds.map(aid=>{
        const ath=athletes.find(a=>a.id===aid);
        const entries=[...weightLogs.filter(l=>l.athlete_id===aid)].sort((a,b)=>new Date(a.date)-new Date(b.date));
        const first=entries[0]?.weight!=null?parseFloat(entries[0].weight):null;
        const latest=entries[entries.length-1]?.weight!=null?parseFloat(entries[entries.length-1].weight):null;
        const diff=first!=null&&latest!=null?parseFloat((latest-first).toFixed(1)):null;
        const trending=diff===null?"flat":diff<0?"down":diff>0?"up":"flat";

        // Mini sparkline (wide viewBox so it fills a phone-width card)
        const sparkH=44,sparkW=300;
        const weights=entries.map(e=>parseFloat(e.weight));
        const sMin=Math.min(...weights)-1;
        const sMax=Math.max(...weights)+1;
        const sparkPts=weights.map((w,i)=>{
          const x=(i/(Math.max(weights.length-1,1)))*sparkW;
          const y=sparkH-((w-sMin)/(sMax-sMin||1))*sparkH;
          return`${x},${y}`;
        }).join(" ");

        return(
          <section key={aid} className={"tfx-card cd-wcard is-"+trending}>
            <div className="cd-wtop">
              <span className="rk-av" style={{"--c":ath?.role==="forge"?RED:STEEL}}>
                {ath?.photo_url?<img src={ath.photo_url} alt=""/>:(ath?.name||"?")[0]}
              </span>
              <span className="cd-who">
                <b>{ath?.name||"Unknown"}</b>
                <small>{entries.length} log{entries.length!==1?"s":""}{ath?.sport?" · "+ath.sport:""}</small>
              </span>
              <span className="cd-trend">
                <b className="tfx-num">{diff===null?"—":(diff>0?"↑":diff<0?"↓":"→")+" "+Math.abs(diff)}</b>
                <small>lbs</small>
              </span>
            </div>

            <div className="cd-wstats">
              {[{label:"Start",val:first},{label:"Current",val:latest},{label:"Entries",val:entries.length}].map(s=>(
                <div key={s.label}>
                  <b className="tfx-num">{s.val!=null?s.val:"—"}</b>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>

            {weights.length>1&&(
              <svg className="cd-spark" viewBox={`-4 -4 ${sparkW+8} ${sparkH+8}`} aria-hidden="true">
                <defs>
                  <linearGradient id={"sg"+aid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" className="st-a"/>
                    <stop offset="100%" className="st-b"/>
                  </linearGradient>
                </defs>
                <polygon points={`0,${sparkH} ${sparkPts} ${sparkW},${sparkH}`} fill={`url(#sg${aid})`}/>
                <polyline className="ln" points={sparkPts}/>
                {weights.map((w,i)=>{
                  const x=(i/(Math.max(weights.length-1,1)))*sparkW;
                  const y=sparkH-((w-sMin)/(sMax-sMin||1))*sparkH;
                  return<circle key={i} className={"dt"+(i===weights.length-1?" is-last":"")} cx={x} cy={y} r={i===weights.length-1?4:2.4}/>;
                })}
              </svg>
            )}

            <div className="cd-wentries">
              {entries.map((e,ei)=>{
                const prev=ei>0?parseFloat(entries[ei-1].weight):null;
                const cur=parseFloat(e.weight);
                const wd=prev!=null?parseFloat((cur-prev).toFixed(1)):null;
                return(
                  <div key={ei} className={"cd-went"+(ei===entries.length-1?" is-last":"")}>
                    <b>{cur}</b>
                    {wd!=null&&<em className={wd<0?"is-down":wd>0?"is-up":"is-flat"}>{wd>0?"↑":wd<0?"↓":"→"}{Math.abs(wd)}</em>}
                    <small>{e.date?.slice(5)}</small>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

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
        const renderSection=(cats,gLabel,accentClass)=>{
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
              const best=catLifts.reduce((b,[,v])=>Math.max(b,v.orm||0),0);
              if(best>0){totalOrm+=best;count++;}
            });
            if(!count)return;
            rows.push({aid,name:ath?.name||"Unknown",photo:ath?.photo_url,lifts,totalOrm,count});
          });
          if(!rows.length)return null;
          return(
            <>
              <div className={"cd-sec "+accentClass}><i/><h3>{gLabel} rankings</h3><span>{rows.length} athletes</span></div>
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
                  <section key={cat.id} className="tfx-card cd-cat">
                    <header className="cd-cat-head">
                      <Icon name={cat.id} size={16}/>
                      <h3>{cat.label}</h3>
                      <span>est. 1RM</span>
                    </header>
                    <ol className="cd-rank">
                      {catRows.slice(0,5).map((r,ri)=>(
                        <li key={ri} className={ri===0?"is-first":""}>
                          <span className={"cd-rank-n"+(ri<3?" is-medal":"")}>{ri===0?"🥇":ri===1?"🥈":ri===2?"🥉":ri+1}</span>
                          <span className="rk-av" style={{"--c":STEEL}}>
                            {r.photo?<img src={r.photo} alt=""/>:(r.name||"?")[0]}
                          </span>
                          <span className="cd-who"><b>{r.name}</b><small>{r.liftName}</small></span>
                          <span className="cd-val"><b className="tfx-num">{r.orm}</b><small>{pctOf(r.orm)}% of ref</small></span>
                        </li>
                      ))}
                    </ol>
                  </section>
                );
              })}
            </>
          );
        };
        const menSection=renderSection(CATS_M,"Men's","cd-men");
        const womenSection=renderSection(CATS_F,"Women's","cd-women");
        if(!menSection&&!womenSection)return null;
        return(
          <>
            <section className="tfx-card cd-head">
              <div className="cd-head-txt">
                <div className="tfx-eyebrow">Strength room</div>
                <h2>Team leaderboard</h2>
                <p>Estimated 1RM · Gender-separated · {Object.keys(byAthlete).length} athletes logged</p>
              </div>
            </section>
            {menSection}
            {womenSection}
          </>
        );
      })()}
    </div>
  );
}
