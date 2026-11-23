import { useState } from "react";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";
import { RED, STEEL } from "../lib/constants";

const STATUSES=["active","sleeping","archived"];
const cap=(s)=>s.charAt(0).toUpperCase()+s.slice(1);

export default function RosterTab({athletes=[],setAthletes,updateAthlete,deleteAthlete,addAthlete,uploadAthletePhoto,openAthleteModal,newName,setNewName,newSport,setNewSport,newGender,setNewGender,newRole,setNewRole}){
  const[rosterSearch,setRosterSearch]=useState("");
  const[rosterStatus,setRosterStatus]=useState("active");
  const[rosterExpanded,setRosterExpanded]=useState(null);

  const q=rosterSearch.toLowerCase();
  const shown=athletes.filter(a=>a.status===rosterStatus&&(!rosterSearch||a.name?.toLowerCase().includes(q)||a.sport?.toLowerCase().includes(q)||a.college?.toLowerCase().includes(q)));
  const injuredCount=athletes.filter(a=>a.status==="active"&&(a.injury||a.injury_note)).length;

  return(
    <div className="tfx cc">
      <section className="tfx-card cc-head">
        <div className="cc-top">
          <div>
            <div className="tfx-eyebrow">Athletes</div>
            <h2>Roster</h2>
            <p><span className="tfx-num">{shown.length}</span> athletes · {rosterStatus}</p>
          </div>
          {injuredCount>0&&<span className="cc-pill is-red"><i/>{injuredCount} injured</span>}
        </div>
        <div className="ir-seg" role="tablist" aria-label="Roster status">
          {STATUSES.map(s=>(
            <button key={s} role="tab" aria-selected={rosterStatus===s} className={"tfx-press"+(rosterStatus===s?" is-on":"")} onClick={()=>setRosterStatus(s)}>
              {cap(s)}<span className="cc-seg-n">{athletes.filter(a=>a.status===s).length}</span>
            </button>
          ))}
        </div>
        <div className="cc-search">
          <Icon name="search" size={16}/>
          <input className="cc-in" value={rosterSearch} onChange={e=>setRosterSearch(e.target.value)} placeholder="Search name, sport, or school..." aria-label="Search roster"/>
          {rosterSearch&&<button className="cc-search-x" onClick={()=>setRosterSearch("")} aria-label="Clear search">✕</button>}
        </div>
      </section>

      <section className="tfx-card cc-roster">
        {shown.length===0&&<p className="cc-none">{rosterSearch?"No athletes match that search.":"No "+rosterStatus+" athletes."}</p>}
        <ul className="cc-rows">
          {shown.map(a=>{
            const isExp=rosterExpanded===a.id;
            const hasInjury=!!(a.injury||a.injury_note);
            const isForge=a.role==="forge";
            return(
              <li key={a.id} className={"cc-ath"+(isExp?" is-open":"")}>
                <div className="cc-ath-main" onClick={()=>setRosterExpanded(isExp?null:a.id)}>
                  <label className={"rk-av cc-av"+(hasInjury?" is-hurt":"")} style={{"--c":isForge?RED:STEEL}} onClick={e=>e.stopPropagation()} title="Change photo" aria-label={"Change "+(a.name||"athlete")+"'s photo"}>
                    {a.photo_url?<img src={a.photo_url} alt=""/>:(a.name||"?")[0]}
                    <input type="file" accept="image/*" className="cc-hide" onChange={async e=>{
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
                  <div className="cc-who">
                    <div className="cc-who-top">
                      <button className="cc-name" onClick={e=>{e.stopPropagation();openAthleteModal(a);}}>{a.name}</button>
                      {hasInjury&&<span className="cc-pill is-red">Injured</span>}
                    </div>
                    <div className="cc-meta" style={{"--c":isForge?RED:STEEL}}>{[a.sport,a.gender].filter(Boolean).join(" · ")}{(a.sport||a.gender)?" · ":""}<b>{isForge?"Forge":"Iron"}</b></div>
                    {(a.college||a.year)&&<div className="cc-meta">{[a.college,a.year].filter(Boolean).join(" · ")}</div>}
                  </div>
                  <span className={"cc-stat is-"+a.status} onClick={e=>e.stopPropagation()}>
                    <select className="cc-status" value={a.status} onChange={e=>updateAthlete(a.id,"status",e.target.value)} aria-label={"Status for "+a.name}>
                      <option value="active">Active</option>
                      <option value="sleeping">Sleeping</option>
                      <option value="archived">Archived</option>
                    </select>
                  </span>
                  <button className="cc-ico is-del" onClick={e=>{e.stopPropagation();deleteAthlete(a.id,a.name);}} aria-label={"Delete "+a.name} title="Delete athlete">✕</button>
                  <button className="cc-chev" aria-expanded={isExp} aria-label={(isExp?"Close ":"Edit ")+a.name+"'s details"}><i/></button>
                </div>
                {isExp&&(
                  <div className="cc-edit">
                    <div className="cc-grid2">
                      <label className="cc-fld">
                        <span>Role</span>
                        <span className="cc-sel">
                          <select className="cc-in" value={a.role} onChange={e=>updateAthlete(a.id,"role",e.target.value)}>
                            <option value="iron">The Iron</option>
                            <option value="forge">The Forge</option>
                          </select>
                        </span>
                      </label>
                      <label className="cc-fld">
                        <span>PIN</span>
                        <input className="cc-in" defaultValue={a.pin||""} placeholder="4-digit PIN" onBlur={async e=>{await supabase.from("athletes").update({pin:e.target.value||null}).eq("id",a.id);}}/>
                      </label>
                      <label className="cc-fld">
                        <span>Bracelet</span>
                        <input className="cc-in" defaultValue={a.bracelet||""} placeholder="e.g. Phil 4:13" onBlur={async e=>{await supabase.from("athletes").update({bracelet:e.target.value||null}).eq("id",a.id);setAthletes(prev=>prev.map(x=>x.id===a.id?{...x,bracelet:e.target.value}:x));}}/>
                      </label>
                      <label className="cc-fld">
                        <span>Partner</span>
                        <span className="cc-sel">
                          <select className="cc-in" defaultValue={a.accountability_partner||""} onChange={async e=>{await supabase.from("athletes").update({accountability_partner:e.target.value||null}).eq("id",a.id);setAthletes(prev=>prev.map(x=>x.id===a.id?{...x,accountability_partner:e.target.value}:x));}}>
                            <option value="">No partner</option>
                            {athletes.filter(x=>x.id!==a.id&&x.status==="active").map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
                          </select>
                        </span>
                      </label>
                      <label className="cc-fld">
                        <span>College</span>
                        <input className="cc-in" defaultValue={a.college||""} placeholder="School" onBlur={async e=>{await supabase.from("athletes").update({college:e.target.value||null}).eq("id",a.id);setAthletes(prev=>prev.map(x=>x.id===a.id?{...x,college:e.target.value}:x));}}/>
                      </label>
                      <label className="cc-fld">
                        <span>Year</span>
                        <span className="cc-sel">
                          <select className="cc-in" defaultValue={a.year||""} onChange={async e=>{await supabase.from("athletes").update({year:e.target.value||null}).eq("id",a.id);setAthletes(prev=>prev.map(x=>x.id===a.id?{...x,year:e.target.value}:x));}}>
                            <option value="">—</option>
                            {["Freshman","Sophomore","Junior","Senior","5th Year","Grad"].map(y=><option key={y} value={y}>{y}</option>)}
                          </select>
                        </span>
                      </label>
                    </div>
                    {a.athletic_goal&&<p className="cc-note"><span>Athletic goal</span>{a.athletic_goal}</p>}
                    {hasInjury&&(
                      <div className="cc-alert">
                        <span>{a.injury_note||a.injury}</span>
                        <button className="cc-mini" onClick={async e=>{e.stopPropagation();await supabase.from("athletes").update({injury:false,injury_note:null}).eq("id",a.id);setAthletes(p=>p.map(x=>x.id===a.id?{...x,injury:false,injury_note:null}:x));}}>Clear</button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="tfx-card cc-add">
        <div className="tfx-eyebrow">Add athlete</div>
        <div className="cc-grid2">
          <input className="cc-in" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Name" aria-label="Name"/>
          <input className="cc-in" value={newSport} onChange={e=>setNewSport(e.target.value)} placeholder="Sport" aria-label="Sport"/>
          <span className="cc-sel">
            <select className="cc-in" value={newGender} onChange={e=>setNewGender(e.target.value)} aria-label="Gender">
              <option value="">M/F</option><option value="M">M</option><option value="F">F</option>
            </select>
          </span>
          <span className="cc-sel">
            <select className="cc-in" value={newRole} onChange={e=>setNewRole(e.target.value)} aria-label="Group">
              <option value="iron">Iron</option><option value="forge">Forge</option>
            </select>
          </span>
        </div>
        <button className="tfx-btn tfx-press cc-btn cc-accent is-pur" onClick={addAthlete} disabled={!newName.trim()}>Add</button>
      </section>
    </div>
  );
}
