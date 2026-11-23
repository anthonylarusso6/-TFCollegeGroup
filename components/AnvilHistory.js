import { useState, useEffect } from "react";
import { GOLD, STEEL, GREEN } from "../lib/constants";
import Icon from "./Icon";
import { supabase } from "../lib/supabase";

const ANVIL_CATS=[
  {id:"Effort",     emoji:"🔥",color:"#E8720C"},
  {id:"Performance",emoji:"🏆",color:GOLD},
  {id:"Leadership", emoji:"👑",color:"#C084FC"},
  {id:"Consistency",emoji:"💪",color:GREEN},
  {id:"Character",  emoji:"🧠",color:STEEL},
];
const catInfo=(id)=>ANVIL_CATS.find(c=>c.id===id)||{id:id||"",emoji:"⚒",color:GOLD};

const PRIZES=[
  {id:"tee",     label:"Anvil Tee Shirt",          emoji:"🎽",sizes:["S","M","L","XL","XXL"],freeText:false,optionLabel:"Size"},
  {id:"shorts",  label:"Athletic Shorts",           emoji:"🩳",sizes:["S","M","L","XL","XXL"],freeText:false,optionLabel:"Size"},
  {id:"dicks",   label:"$25 Dick's Gift Card",      emoji:"🏪",sizes:null,                   freeText:false,optionLabel:null},
  {id:"food_gc", label:"$25 Restaurant Gift Card",  emoji:"🍽️",sizes:null,                  freeText:true, optionLabel:"Restaurant"},
];

export default function AnvilHistory({athleteId,athleteName}){
  const[anvils,setAnvils]=useState([]);
  const[athletes,setAthletes]=useState({});
  const[prizeSelection,setPrizeSelection]=useState(null);
  const[pendingPrize,setPendingPrize]=useState(null);
  const[pendingSize,setPendingSize]=useState(null);
  const[pendingText,setPendingText]=useState("");
  const[savingPrize,setSavingPrize]=useState(false);
  const[prizeSaved,setPrizeSaved]=useState(false);

  useEffect(()=>{
    (async()=>{
      try{
        const{data}=await supabase.from("anvil").select("*").order("created_at",{ascending:false});
        setAnvils(data||[]);
        if(data&&data.length>0){
          const names=[...new Set(data.map(a=>a.athlete_name))];
          try{
            const{data:aths}=await supabase.from("athletes").select("name,photo_url,role").in("name",names);
            const map={};
            (aths||[]).forEach(a=>map[a.name]=a);
            setAthletes(map);
          }catch(e){}
          // Load prize selection for latest anvil
          try{
            const{data:ps}=await supabase.from("announcements")
              .select("message")
              .eq("type","anvil_prize")
              .eq("day",String(data[0].id))
              .order("created_at",{ascending:false})
              .limit(1)
              .maybeSingle();
            if(ps?.message){try{setPrizeSelection(JSON.parse(ps.message));}catch(e){}}
          }catch(e){}
        }
      }catch(e){}
    })();
  },[]);

  const savePrize=async()=>{
    const prize=PRIZES.find(p=>p.id===pendingPrize);
    if(!prize||!latest)return;
    if(prize.sizes&&!pendingSize)return;
    if(prize.freeText&&!pendingText.trim())return;
    setSavingPrize(true);
    try{
      const sizeVal=prize.freeText?pendingText.trim():(pendingSize||null);
      const selection={prize:pendingPrize,label:prize.label,size:sizeVal};
      try{await supabase.from("announcements").delete().eq("type","anvil_prize").eq("day",String(latest.id));}catch(e){}
      await supabase.from("announcements").insert({type:"anvil_prize",day:String(latest.id),message:JSON.stringify(selection),active:true});
      setPrizeSelection(selection);
      setPrizeSaved(true);
      setPendingPrize(null);setPendingSize(null);setPendingText("");
      setTimeout(()=>setPrizeSaved(false),4000);
    }catch(e){}
    setSavingPrize(false);
  };

  const latest=anvils[0];
  const latestAth=latest?athletes[latest.athlete_name]:null;
  const latestCat=latest?catInfo(latest.athlete_role):null;
  const isCurrentWinner=latest&&athleteName&&latest.athlete_name===athleteName;
  const pendingPrizeObj=PRIZES.find(p=>p.id===pendingPrize);
  const canSave=pendingPrize&&(!pendingPrizeObj?.sizes||pendingSize)&&(!pendingPrizeObj?.freeText||pendingText.trim());

  const avatar=(name,ath,cls)=>(
    <span className={"af-av "+cls} style={{"--c":"#4a4540"}}>
      {ath?.photo_url?<img src={ath.photo_url} alt={name}/>:(name||"?")[0]}
    </span>
  );

  return(
    <div className="tfx af af-anv">
      <header className="tfx-hb-head">
        <div>
          <div className="tfx-eyebrow">The Anvil</div>
          <h2>Anvil winners</h2>
          <p className="af-sub">Awarded every two weeks to the one athlete who did what nobody else did.</p>
        </div>
      </header>

      {/* No winners yet */}
      {anvils.length===0&&(
        <section className="tfx-card af-empty" style={{"--c":"var(--gold)"}}>
          <span className="af-empty-ic"><Icon name="anvil" size={24}/></span>
          <b>No winner yet</b>
          <div className="af-motto">Earned. Not given.</div>
        </section>
      )}

      {/* Current champion hero */}
      {latest&&(
        <section className="tfx-card af-anv-hero">
          <div className="tfx-eyebrow">Current Anvil winner</div>
          <div className="af-anv-who">
            {avatar(latest.athlete_name,latestAth,"is-xl")}
            <div>
              <h3>{latest.athlete_name}</h3>
              <small>{latest.date_awarded}</small>
              {latestCat&&latestCat.id&&(
                <span className="af-pill" style={{"--c":latestCat.color}}>{latestCat.id}</span>
              )}
            </div>
          </div>
          {latest.note&&(
            <blockquote className="af-quote">
              <div className="tfx-eyebrow">Why they earned it</div>
              <p>&#8220;{latest.note}&#8221;</p>
            </blockquote>
          )}
          <div className="af-motto">Earned. Not given.</div>
        </section>
      )}

      {/* Prize picker — only shown to the current winner */}
      {isCurrentWinner&&(
        <section className="tfx-card af-prize">

          {/* Already selected — locked-in state */}
          {prizeSelection&&!pendingPrize&&(
            <>
              <div className="tfx-eyebrow">Your prize</div>
              <div className="af-prize-locked">
                <span className="af-prize-ic">{PRIZES.find(p=>p.id===prizeSelection.prize)?.emoji||"🎁"}</span>
                <div className="af-prize-txt">
                  <b>{prizeSelection.label}</b>
                  {prizeSelection.size&&<small>{PRIZES.find(p=>p.id===prizeSelection.prize)?.optionLabel||"Size"}: <strong>{prizeSelection.size}</strong></small>}
                  <span className="af-prize-ok">✓ Coach has been notified</span>
                </div>
                <button className="tfx-btn-ghost tfx-press af-prize-change" onClick={()=>{
                  const p=PRIZES.find(pr=>pr.id===prizeSelection.prize);
                  setPendingPrize(prizeSelection.prize);
                  if(p?.freeText){setPendingText(prizeSelection.size||"");setPendingSize(null);}
                  else{setPendingSize(prizeSelection.size);setPendingText("");}
                }}>Change</button>
              </div>
              {prizeSaved&&(
                <div className="af-prize-saved" role="status">Prize locked in!</div>
              )}
            </>
          )}

          {/* Picker — not yet selected or changing */}
          {(!prizeSelection||pendingPrize)&&(
            <>
              <div className="af-prize-head">
                <div className="tfx-eyebrow">Claim your prize</div>
                <p>You earned it — pick what you want.</p>
              </div>

              {/* Prize options */}
              <div className="af-prize-opts" role="radiogroup" aria-label="Prize">
                {PRIZES.map(p=>{
                  const isSelected=pendingPrize===p.id;
                  return(
                    <button key={p.id} role="radio" aria-checked={isSelected} className={"af-prize-opt tfx-press"+(isSelected?" is-on":"")} onClick={()=>{setPendingPrize(p.id);setPendingSize(null);setPendingText("");}}>
                      <span className="af-prize-ic">{p.emoji}</span>
                      <span className="af-prize-txt">
                        <b>{p.label}</b>
                        {p.sizes&&<small>Choose size below</small>}
                      </span>
                      <span className="af-radio"/>
                    </button>
                  );
                })}
              </div>

              {/* Size picker — for tee/shorts */}
              {pendingPrizeObj?.sizes&&(
                <div>
                  <div className="tfx-eyebrow">Select {pendingPrizeObj.optionLabel||"size"}</div>
                  <div className="af-prize-sizes">
                    {pendingPrizeObj.sizes.map(sz=>{
                      const isSz=pendingSize===sz;
                      return(
                        <button key={sz} className={"tfx-chipbtn tfx-press"+(isSz?" is-on":"")} aria-pressed={isSz} onClick={()=>setPendingSize(sz)}>
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Free-text — for restaurant gift card */}
              {pendingPrizeObj?.freeText&&(
                <label>
                  <div className="tfx-eyebrow">Which restaurant?</div>
                  <input
                    className="tfx-field af-prize-field"
                    value={pendingText}
                    onChange={e=>setPendingText(e.target.value)}
                    placeholder="Type the restaurant name..."
                  />
                </label>
              )}

              <button className="tfx-btn tfx-press af-gold-btn" onClick={savePrize} disabled={!canSave||savingPrize}>
                {savingPrize?"Saving...":(canSave?"Claim prize":"Select a prize above")}
              </button>
            </>
          )}
        </section>
      )}

      {/* Previous winners */}
      {anvils.length>1&&(
        <section className="tfx-card af-card af-past">
          <div className="af-sec-head">
            <div className="tfx-eyebrow">Previous winners</div>
            <span>{anvils.length-1} before this</span>
          </div>
          <ul>
            {anvils.slice(1).map((a,i)=>{
              const ath=athletes[a.athlete_name];
              const cat=catInfo(a.athlete_role);
              const timesWon=anvils.filter(x=>x.athlete_name===a.athlete_name).length;
              return(
                <li key={i}>
                  {avatar(a.athlete_name,ath,"")}
                  <div className="af-past-txt">
                    <div className="af-past-top">
                      <b>{a.athlete_name}</b>
                      {cat.id&&<span className="af-pill" style={{"--c":cat.color}}>{cat.id}</span>}
                      {timesWon>1&&<small>⚒ ×{timesWon}</small>}
                    </div>
                    {a.note&&(
                      <p>&#8220;{a.note}&#8221;</p>
                    )}
                    <small>{a.date_awarded}</small>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
