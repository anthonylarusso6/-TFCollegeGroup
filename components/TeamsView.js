import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { getTier, BRACELETS, GROUP_COLORS } from "../lib/teams";
import { SkeletonList } from "./Skeleton";
import Icon from "./Icon";

const GC=GROUP_COLORS;
const TIER_LABEL={1:"Tier 1",2:"Tier 2",3:"Tier 3"};

export default function TeamsView({athletes=[]}){
  const[groups,setGroups]=useState({});
  const[leaders,setLeaders]=useState({});
  const[bracelets,setBracelets]=useState({});   // {groupIdx: bracelet object | null}
  const[groupCount,setGroupCount]=useState(4);
  const[draftId,setDraftId]=useState(null);
  const draftIdRef=useRef(null);
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);
  const[saveError,setSaveError]=useState("");
  const[loadError,setLoadError]=useState("");
  const[picker,setPicker]=useState(null);           // athlete name waiting for group pick
  const[braceletModal,setBraceletModal]=useState(null); // group idx whose bracelet is being picked
  const[leaderPicker,setLeaderPicker]=useState(null);   // group idx whose leader is being picked
  const[confirmReset,setConfirmReset]=useState(false);
  const[resetting,setResetting]=useState(false);
  const[resetErr,setResetErr]=useState("");

  useEffect(()=>{loadTeams();},[]);

  const loadTeams=async()=>{
    setLoading(true);
    try{
      const{data}=await supabase.from("draft").select("*").order("created_at",{ascending:false}).limit(1);
      if(data&&data.length>0){
        const d=data[0];
        setDraftId(d.id);draftIdRef.current=d.id;
        const loadedGroups=d.groups||[];
        const gc=Math.max(loadedGroups.length,4);
        setGroupCount(gc);
        const g={};
        loadedGroups.forEach((arr,i)=>{g[i]=arr||[];});
        for(let i=0;i<gc;i++){if(!g[i])g[i]=[];}
        setGroups(g);
        const l={};
        (d.leaders||[]).forEach((name,i)=>{if(name)l[i]=name;});
        setLeaders(l);
        const b={};
        (d.bracelets||[]).forEach((br,i)=>{if(br)b[i]=br;});
        setBracelets(b);
      }else{
        const g={};for(let i=0;i<4;i++)g[i]=[];
        setGroups(g);
      }
    }catch(e){
      console.error("Teams load:",e);
      setLoadError(e.message||"Failed to load teams");
      const g={};for(let i=0;i<4;i++)g[i]=[];
      setGroups(g);
    }
    setLoading(false);
  };

  const addToGroup=(name,toIdx)=>{
    setGroups(prev=>{
      const n={...prev};
      Object.keys(n).forEach(k=>{n[k]=(n[k]||[]).filter(x=>x!==name);});
      n[toIdx]=[...(n[toIdx]||[]),name];
      return n;
    });
    setPicker(null);
  };

  const removeFromGroup=(name,idx)=>{
    setGroups(prev=>({...prev,[idx]:(prev[idx]||[]).filter(n=>n!==name)}));
    if(leaders[idx]===name)setLeaders(prev=>{const n={...prev};delete n[idx];return n;});
  };

  const takenRefs=Object.values(bracelets).filter(Boolean).map(b=>b.ref);

  const saveChanges=async()=>{
    setSaving(true);
    setSaveError("");
    try{
      const groupsArr=Array.from({length:groupCount},(_,i)=>groups[i]||[]);
      const leadersArr=Array.from({length:groupCount},(_,i)=>leaders[i]||null);
      const braceletsArr=Array.from({length:groupCount},(_,i)=>bracelets[i]||null);
      const payload={groups:groupsArr,leaders:leadersArr,bracelets:braceletsArr};
      const currentDraftId=draftIdRef.current||draftId;
      if(currentDraftId){
        const{error:err}=await supabase.from("draft").update(payload).eq("id",currentDraftId);
        if(err)throw err;
      }else{
        const{data:inserted,error:err}=await supabase.from("draft").insert({...payload,phase:"setup",locked:false}).select().single();
        if(err)throw err;
        if(inserted){draftIdRef.current=inserted.id;setDraftId(inserted.id);}
      }
      const assigned=new Set();
      for(let i=0;i<groupCount;i++){
        for(const name of(groupsArr[i]||[])){
          assigned.add(name);
          const ath=athletes.find(a=>a.name===name);
          if(ath){
            const updates={role:leadersArr[i]===name?"forge":"iron",group_idx:i,tier:getTier(i,groupCount)};
            if(leadersArr[i]===name&&braceletsArr[i])updates.bracelet=braceletsArr[i].ref;
            try{await supabase.from("athletes").update(updates).eq("id",ath.id);}catch(ae){console.error("Athlete update:",ae);}
          }
        }
      }
      // Reset anyone who was previously in a group but is no longer assigned (e.g. after
      // shrinking the group count) so they don't keep a stale group_idx/tier/role.
      for(const a of athletes){
        if(a.group_idx!=null&&!assigned.has(a.name)){
          try{await supabase.from("athletes").update({role:"iron",group_idx:null,tier:null,bracelet:null}).eq("id",a.id);}catch(ae){console.error("Orphan reset:",ae);}
        }
      }
      setSaved(true);setTimeout(()=>setSaved(false),3000);
    }catch(e){
      console.error("Save error:",e);
      setSaveError(e.message||"Save failed — check console");
    }
    setSaving(false);
  };

  const doReset=async()=>{
    setResetting(true);setResetErr("");
    try{
      const active=athletes.filter(a=>a.status==="active");
      await Promise.all(active.map(a=>supabase.from("athletes").update({role:"iron",group_idx:null,tier:null,bracelet:null}).eq("id",a.id)));
      if(draftId){
        const{error}=await supabase.from("draft").update({phase:"setup",leaders:[],groups:[],bracelets:[],locked:false}).eq("id",draftId);
        if(error)throw error;
      }
      setGroups({0:[],1:[],2:[],3:[]});setLeaders({});setBracelets({});setGroupCount(4);
      setConfirmReset(false);
    }catch(e){setResetErr(e.message||"Reset failed");}
    setResetting(false);
  };

  if(loading)return<div style={{paddingTop:8}}><SkeletonList rows={5}/></div>;

  const allAssigned=Object.values(groups).flat();
  const active=athletes.filter(a=>a.status==="active");
  const unassigned=active.filter(a=>!allAssigned.includes(a.name));
  const placedActive=active.length-unassigned.length; // saved drafts can still name inactive athletes
  const firstName=(n)=>(n||"").split(" ")[0];
  const face=(ath,name)=>ath?.photo_url?<img src={ath.photo_url} alt=""/>:(name||"?")[0];

  return(
    <div className="tfx cb cb-teams">
      {/* Athlete group-picker dialog */}
      {picker&&(
        <div className="cb-scrim is-center" onClick={()=>setPicker(null)}>
          <div className="cb-dialog" role="dialog" aria-modal="true" aria-label={"Place "+picker} onClick={e=>e.stopPropagation()}>
            <div>
              <div className="tfx-eyebrow">Add to which group?</div>
              <h3>{picker}</h3>
            </div>
            <div className="cb-gpick">
              {Array.from({length:groupCount},(_,i)=>(
                <button key={i} className="tfx-press" style={{"--c":GC[i]}} onClick={()=>addToGroup(picker,i)}>
                  <b><i className="cb-dot"/>Group {i+1}</b>
                  <small>{TIER_LABEL[getTier(i,groupCount)]} · {(groups[i]||[]).length} members</small>
                </button>
              ))}
            </div>
            <button className="tfx-btn-ghost cb-btn-block tfx-press" onClick={()=>setPicker(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Leader + Bracelet picker sheet */}
      {leaderPicker!==null&&(
        <div className="cb-scrim" onClick={()=>setLeaderPicker(null)}>
          <div className="cb-sheet" role="dialog" aria-modal="true" aria-label={"Group "+(leaderPicker+1)+" leader and bracelet"} style={{"--c":GC[leaderPicker]}} onClick={e=>e.stopPropagation()}>
            <div className="cb-grab"/>
            <div className="cb-sheet-head">
              <i className="cb-dot"/>
              <h3>Group {leaderPicker+1}</h3>
            </div>

            {/* ── LEADER SECTION ── */}
            <div className="tfx-eyebrow cb-sheet-lbl">Forge leader</div>
            <div className="cb-opts">
              {active.map(a=>{
                const isCurrentLeader=leaders[leaderPicker]===a.name;
                const isLeaderElsewhere=Object.entries(leaders).some(([k,v])=>Number(k)!==leaderPicker&&v===a.name);
                return(
                  <button key={a.id} disabled={isLeaderElsewhere} aria-pressed={isCurrentLeader}
                    className={"cb-opt"+(isCurrentLeader?" is-on":"")}
                    onClick={()=>{
                      if(isCurrentLeader){setLeaders(prev=>{const n={...prev};delete n[leaderPicker];return n;});}
                      else{
                        setGroups(prev=>{const n={...prev};Object.keys(n).forEach(k=>{n[k]=(n[k]||[]).filter(x=>x!==a.name);});n[leaderPicker]=[...(n[leaderPicker]||[]),a.name];return n;});
                        setLeaders(prev=>({...prev,[leaderPicker]:a.name}));
                      }
                    }}>
                    <span className={"rk-av"+(isCurrentLeader?"":" cb-av-plain")}>{face(a,a.name)}</span>
                    <span className="cb-opt-txt">
                      <b>{a.name}</b>
                      <small>{a.sport||"Athlete"}{isLeaderElsewhere?" · Leader elsewhere":""}</small>
                    </span>
                    {isCurrentLeader&&<span className="cb-check" aria-hidden="true">✓</span>}
                  </button>
                );
              })}
            </div>

            {/* ── BRACELET SECTION ── */}
            <div className="tfx-eyebrow cb-sheet-lbl">Bracelet verse</div>
            <div className="cb-opts">
              {BRACELETS.map(b=>{
                const taken=takenRefs.includes(b.ref)&&bracelets[leaderPicker]?.ref!==b.ref;
                const selected=bracelets[leaderPicker]?.ref===b.ref;
                return(
                  <button key={b.ref} disabled={taken} aria-pressed={selected} style={{"--c":b.hex}}
                    className={"cb-opt"+(selected?" is-on":"")}
                    onClick={()=>setBracelets(prev=>({...prev,[leaderPicker]:selected?null:b}))}>
                    <i className="cb-sw"/>
                    <span className="cb-opt-txt">
                      <b>{b.color}</b>
                      <small>{b.ref} — <i>{b.text}</i></small>
                    </span>
                    {selected&&<span className="cb-check" aria-hidden="true">✓</span>}
                    {taken&&<span className="cb-taken">taken</span>}
                  </button>
                );
              })}
            </div>

            <button className="tfx-btn cb-btn-block tfx-press" onClick={()=>setLeaderPicker(null)}>Done</button>
          </div>
        </div>
      )}

      {/* Bracelet picker sheet */}
      {braceletModal!==null&&(
        <div className="cb-scrim" onClick={()=>setBraceletModal(null)}>
          <div className="cb-sheet" role="dialog" aria-modal="true" aria-label={"Group "+(braceletModal+1)+" bracelet"} style={{"--c":GC[braceletModal]}} onClick={e=>e.stopPropagation()}>
            <div className="cb-grab"/>
            <div className="cb-sheet-head">
              <div>
                <h3>Group {braceletModal+1} — Bracelet</h3>
                <p>Pick the verse bracelet for this group&apos;s leader. Taken ones are grayed out.</p>
              </div>
            </div>
            <div className="cb-opts">
              {BRACELETS.map(b=>{
                const taken=takenRefs.includes(b.ref)&&bracelets[braceletModal]?.ref!==b.ref;
                const selected=bracelets[braceletModal]?.ref===b.ref;
                return(
                  <button key={b.ref} disabled={taken} aria-pressed={selected} style={{"--c":b.hex}}
                    className={"cb-opt"+(selected?" is-on":"")}
                    onClick={()=>{setBracelets(prev=>({...prev,[braceletModal]:b}));setBraceletModal(null);}}>
                    <i className="cb-sw"/>
                    <span className="cb-opt-txt">
                      <b>{b.color}</b>
                      <small>{b.ref} — <i>{b.text}</i></small>
                    </span>
                    {selected&&<span className="cb-check" aria-hidden="true">✓</span>}
                    {taken&&<span className="cb-taken">taken</span>}
                  </button>
                );
              })}
            </div>
            {bracelets[braceletModal]&&(
              <button className="tfx-btn-ghost cb-btn-block" onClick={()=>{setBracelets(prev=>{const n={...prev};delete n[braceletModal];return n;});setBraceletModal(null);}}>Remove bracelet</button>
            )}
          </div>
        </div>
      )}

      {/* Load error banner */}
      {loadError&&(
        <div className="ir-err cb-banner" role="alert">
          <span>{loadError}</span>
          <button className="cb-banner-btn" onClick={()=>{setLoadError("");loadTeams();}}>Retry</button>
        </div>
      )}

      {/* Header */}
      <section className="tfx-card cb-head">
        <div className="cb-head-top">
          <div>
            <div className="tfx-eyebrow">Teams</div>
            <h2><span className="tfx-num">{placedActive}/{active.length}</span> assigned</h2>
            <p>{unassigned.length>0?unassigned.length+" not yet placed":"Everyone is placed"}</p>
          </div>
          <div className="cb-head-acts">
            {saved&&<button className="tfx-btn-ghost cb-btn-sm tfx-press" onClick={loadTeams}>↺ Reload</button>}
            <button className={"tfx-btn cb-btn-sm tfx-press"+(saved?" is-saved":"")} onClick={saveChanges} disabled={saving}>
              {saved?"✓ Saved!":saving?"Saving...":"Save teams"}
            </button>
          </div>
        </div>
        <div className={"cb-meter"+(active.length&&unassigned.length===0?" is-full":"")} aria-hidden="true">
          <i style={{"--p":active.length?Math.min(1,placedActive/active.length):0}}/>
        </div>
      </section>

      {/* Save error banner */}
      {saveError&&(
        <div className="ir-err cb-banner" role="alert">
          <span>{saveError}</span>
          <button className="cb-x" aria-label="Dismiss error" onClick={()=>setSaveError("")}>×</button>
        </div>
      )}

      {/* Group count slider */}
      <section className="tfx-card cb-count">
        <div className="cb-count-top">
          <span className="tfx-eyebrow">Number of groups</span>
          <b className="tfx-num">{groupCount}</b>
        </div>
        <input type="range" className="tfx-range" min={1} max={6} value={groupCount} aria-label="Number of groups"
          style={{"--p":(groupCount-1)/5}}
          onChange={e=>{
            const n=Number(e.target.value);
            setGroupCount(n);
            setGroups(prev=>{const next={...prev};for(let i=0;i<n;i++){if(!next[i])next[i]=[];}return next;});
          }}
          onWheel={e=>e.currentTarget.blur()}
        />
        <div className="cb-ticks" aria-hidden="true">
          {[1,2,3,4,5,6].map(n=>(
            <span key={n} className={n===groupCount?"is-on":""}>{n}</span>
          ))}
        </div>
      </section>

      {/* Unassigned pool */}
      {unassigned.length>0&&(
        <section className="tfx-card cb-pool">
          <div className="tfx-eyebrow">Unassigned — tap to place</div>
          <div className="cb-chips">
            {unassigned.map(a=>(
              <button key={a.id} className="cb-chip tfx-press" onClick={()=>setPicker(a.name)}>
                <span className="rk-av cb-av-plain">{face(a,a.name)}</span>
                {firstName(a.name)}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Group cards */}
      {Array.from({length:groupCount},(_,i)=>{
        const members=groups[i]||[];
        const brac=bracelets[i]||null;
        const currentLeader=leaders[i];
        const leaderAth=currentLeader?athletes.find(a=>a.name===currentLeader):null;
        return(
          <section key={i} className="tfx-card cb-group" style={{"--c":GC[i]}}>

            {/* Group header */}
            <div className="cb-group-head">
              <i className="cb-dot"/>
              <h3>Group {i+1}</h3>
              <span className="cb-pill">{TIER_LABEL[getTier(i,groupCount)]}</span>
              <span className="cb-group-n"><b>{members.length}</b> {members.length===1?"member":"members"}</span>
            </div>

            {/* Leader zone */}
            <div className={"cb-lead"+(currentLeader?" is-set":"")}>
              <button className="cb-lead-btn" onClick={()=>setLeaderPicker(i)}>
                {currentLeader?(
                  <span className="rk-av">{face(leaderAth,currentLeader)}</span>
                ):(
                  <span className="cb-lead-ico"><Icon name="anvil" size={18}/></span>
                )}
                <span className="cb-lead-txt">
                  {currentLeader?(<><b>{currentLeader}</b><small>Forge leader · tap to change</small></>):(<small>Tap to set Forge leader</small>)}
                </span>
              </button>
              {currentLeader&&(
                <button className="cb-x" aria-label={"Remove "+currentLeader+" as leader"} onClick={e=>{e.stopPropagation();setLeaders(prev=>{const n={...prev};delete n[i];return n;});}}>×</button>
              )}
            </div>

            {/* Bracelet row */}
            {brac?(
              <button className="cb-brac is-set" style={{"--c":brac.hex}} onClick={()=>setBraceletModal(i)}>
                <i className="cb-sw"/>
                <b>{brac.color}</b>
                <span>{brac.ref}</span>
                <em>Change</em>
              </button>
            ):(
              <button className="cb-brac" onClick={()=>setBraceletModal(i)}>
                <i className="cb-sw is-empty"/>
                <span>Assign bracelet verse</span>
              </button>
            )}

            {/* Members */}
            {members.length===0?(
              <div className="cb-empty">Empty — tap from pool above to add</div>
            ):(
              <div className="cb-members">
                {members.map(name=>{
                  const isLeader=leaders[i]===name;
                  const ath=athletes.find(a=>a.name===name);
                  return(
                    <span key={name} className={"cb-mchip"+(isLeader?" is-lead":"")}>
                      <span className={"rk-av"+(isLeader?"":" cb-av-plain")}>{face(ath,name)}</span>
                      <span>{firstName(name)}</span>
                      <button aria-label={"Remove "+name+" from group "+(i+1)} onClick={()=>removeFromGroup(name,i)}>×</button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Quick-add */}
            {unassigned.length>0&&(
              <div className="cb-quick">
                <div className="cb-quick-lbl">Quick add</div>
                <div className="cb-chips">
                  {unassigned.map(a=>(
                    <button key={a.id} className="cb-add tfx-press" onClick={()=>addToGroup(a.name,i)}>+ {firstName(a.name)}</button>
                  ))}
                </div>
              </div>
            )}
          </section>
        );
      })}

      {/* Reset section */}
      <section className="cb-reset">
        {resetErr&&<div className="ir-err" role="alert">{resetErr}</div>}
        {!confirmReset?(
          <button className="cb-danger tfx-press" onClick={()=>setConfirmReset(true)}>
            Reset all teams
          </button>
        ):(
          <div className="cb-confirm" role="alertdialog" aria-label="Confirm reset">
            <b>Clear everything?</b>
            <p>All group assignments, leaders, and bracelets will be removed. This can&apos;t be undone.</p>
            <div className="cb-confirm-acts">
              <button className="cb-btn-danger tfx-press" onClick={doReset} disabled={resetting}>
                {resetting?"Resetting…":"Yes, reset"}
              </button>
              <button className="tfx-btn-ghost cb-btn-sm" onClick={()=>setConfirmReset(false)} disabled={resetting}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
