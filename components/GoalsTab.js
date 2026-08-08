import { useState } from "react";
import { BG, PUR, RED, GREEN, STEEL } from "../lib/constants";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";

export default function GoalsTab({ athletes, goalReviews, setGoalReviews, genLoading, generateTask }){
  const[goalsSearch,setGoalsSearch]=useState("");
  const[goalsFilter,setGoalsFilter]=useState("all");
  return(
            <div>
              {/* Search + filter */}
              <div style={{position:"relative",marginBottom:10}}>
                <input value={goalsSearch} onChange={e=>setGoalsSearch(e.target.value)} placeholder="Search athlete..." style={{width:"100%",padding:"10px 12px 10px 34px",borderRadius:10,border:"0.5px solid #2a2a2a",fontSize:13,fontFamily:"Georgia,serif",background:"#111",color:"#ddd",boxSizing:"border-box"}}/>
                <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"#aaa"}}><Icon name="search" size={15} color="rgba(255,255,255,0.4)"/></div>
                {goalsSearch&&<button onClick={()=>setGoalsSearch("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",fontSize:14,color:"#aaa",cursor:"pointer"}}>✕</button>}
              </div>
              <div style={{display:"flex",gap:6,marginBottom:12}}>
                {[
                  {id:"all",label:"All"},
                  {id:"missing",label:"⚠ No goals"},
                  {id:"set",label:"✓ Has goals"},
                ].map(f=>(
                  <button key={f.id} onClick={()=>setGoalsFilter(f.id)} style={{flex:1,padding:"7px",borderRadius:8,border:"0.5px solid "+(goalsFilter===f.id?PUR:"#333"),background:goalsFilter===f.id?PUR:"#111",color:goalsFilter===f.id?"#fff":"#666",fontSize:12,fontWeight:goalsFilter===f.id?600:400,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                    {f.label}
                  </button>
                ))}
              </div>

              {athletes.filter(a=>{
                if(a.status!=="active")return false;
                if(goalsSearch&&!a.name?.toLowerCase().includes(goalsSearch.toLowerCase()))return false;
                if(goalsFilter==="missing")return!a.athletic_goal&&!a.character_goal;
                if(goalsFilter==="set")return!!(a.athletic_goal||a.character_goal);
                return true;
              }).map(a=>{
                const hasGoal=!!(a.athletic_goal||a.character_goal);
                const review=goalReviews[a.id]||"";
                return(
                <div key={a.id} style={{background:"#111",borderRadius:12,padding:"1.25rem",marginBottom:10,border:"0.5px solid #1e1e1e",borderTop:"3px solid "+(hasGoal?GREEN:RED)}}>
                  {/* Header with photo */}
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <div style={{width:38,height:38,borderRadius:"50%",background:a.role==="forge"?RED:STEEL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:500,color:"#fff",flexShrink:0,overflow:"hidden"}}>
                      {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:(a.name||"?")[0]}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:600,color:"#ddd"}}>{a.name}</div>
                      <div style={{fontSize:12,color:"#666"}}>{a.sport}</div>
                    </div>
                    {/* Review status */}
                    <div style={{display:"flex",gap:4}}>
                      {[{id:"on_track",label:"✓",color:GREEN,bg:"#0d1a10"},{id:"needs_work",label:"!",color:"#854F0B",bg:"#1a1200"},{id:"reviewed",label:"👁",color:PUR,bg:"#13122a"}].map(r=>(
                        <button key={r.id} onClick={async()=>{
                          const newVal=review===r.id?"":r.id;
                          setGoalReviews(p=>({...p,[a.id]:newVal}));
                          try{await supabase.from("athletes").update({goal_review_status:newVal||null}).eq("id",a.id);}catch(e){}
                        }} title={r.id.replace("_"," ")} style={{width:28,height:28,borderRadius:6,border:"0.5px solid "+(review===r.id?r.color:"#333"),background:review===r.id?r.bg:"#1a1a1a",color:review===r.id?r.color:"#555",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {!hasGoal&&(
                    <div style={{background:"#1a0808",borderRadius:8,padding:"8px 12px",marginBottom:10,border:"0.5px solid "+RED+"33"}}>
                      <div style={{fontSize:12,color:RED}}>⚠ No goals set yet — follow up with {a.name.split(" ")[0]}</div>
                    </div>
                  )}

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {[{label:"Athletic goal",goalKey:"athletic_goal",taskKey:"coach_athletic_task",type:"athletic",color:GREEN},{label:"Character goal",goalKey:"character_goal",taskKey:"coach_character_task",type:"character",color:PUR}].map(({label,goalKey,taskKey,type,color})=>(
                      <div key={goalKey}>
                        <div style={{fontSize:11,color:"#666",marginBottom:4}}>{label}</div>
                        <div style={{fontSize:12,color:a[goalKey]?"#ddd":"#444",fontStyle:a[goalKey]?"normal":"italic",padding:"6px 8px",background:"#1a1a1a",borderRadius:6,minHeight:36,marginBottom:6}}>{a[goalKey]||"Not set"}</div>
                        <textarea id={a.id+"-"+type} defaultValue={a[taskKey]||""} placeholder="Write or generate a task..." style={{width:"100%",minHeight:60,padding:"8px",fontSize:12,border:"0.5px solid "+color,borderRadius:6,background:BG,color:"#fff",fontFamily:"Georgia,serif",resize:"vertical",boxSizing:"border-box",marginBottom:6}}/>
                        <div style={{display:"flex",gap:6}}>
                          <button onClick={()=>generateTask(a,type)} disabled={!a[goalKey]||genLoading===a.id+"-"+type} style={{flex:1,padding:"6px",borderRadius:6,border:"0.5px solid "+color,background:"transparent",color:color,fontSize:11,cursor:a[goalKey]?"pointer":"not-allowed",fontFamily:"Georgia,serif",opacity:a[goalKey]?1:0.4}}>
                            {genLoading===a.id+"-"+type?"Generating...":"AI task"}
                          </button>
                          <button onClick={async()=>{const val=document.getElementById(a.id+"-"+type)?.value;if(val){await supabase.from("athletes").update({[taskKey]:val}).eq("id",a.id);alert("Sent to "+a.name+"!");}}} style={{flex:1,padding:"6px",borderRadius:6,border:"none",background:color,color:"#fff",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                            Send →
                          </button>
                        </div>
                        {a[taskKey]&&(
                          <div style={{padding:"6px 8px",background:BG,borderRadius:6,borderLeft:"3px solid "+color,marginTop:6}}>
                            <div style={{fontSize:10,color:color,marginBottom:2}}>Current task</div>
                            <div style={{fontSize:11,color:"#ccc",lineHeight:1.5}}>{a[taskKey]}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                );
              })}
            </div>
  );
}
