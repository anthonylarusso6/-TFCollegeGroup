import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function EngagementTab(){
  const[engAthletes,setEngAthletes]=useState([]);

  useEffect(()=>{
    (async()=>{
      try{const{data}=await supabase.from("athletes").select("id,name,photo_url,athletic_goal,character_goal,mindset_note_1,mindset_note_2,mindset_note_3,mindset_note_4,mindset_note_5,mindset_note_6").eq("status","active").order("name");if(data)setEngAthletes(data);}catch(e){}
    })();
  },[]);

  const rows=engAthletes.map(a=>({
    a,
    hasGoal:!!(a.athletic_goal||a.character_goal),
    noteCount:[1,2,3,4,5,6].filter(n=>a["mindset_note_"+n]).length,
    hasPhoto:!!a.photo_url,
  }));
  const total=rows.length;

  return(
    <div className="tfx cc">
      <section className="tfx-card cc-head">
        <div className="cc-top">
          <div>
            <div className="tfx-eyebrow">App usage</div>
            <h2>Athlete engagement</h2>
            <p>Goals, notes, and photos</p>
          </div>
        </div>
        <div className="cc-stats">
          <div><b className="tfx-num">{rows.filter(r=>r.hasGoal).length}<small>/{total}</small></b><span>set goals</span></div>
          <div><b className="tfx-num">{rows.filter(r=>r.noteCount>0).length}<small>/{total}</small></b><span>wrote notes</span></div>
          <div><b className="tfx-num">{rows.filter(r=>r.hasPhoto).length}<small>/{total}</small></b><span>have a photo</span></div>
        </div>
      </section>

      <section className="tfx-card cc-tblcard">
        <div className="cc-tbl-wrap">
          <table className="cc-tbl">
            <thead>
              <tr><th scope="col">Athlete</th><th scope="col">Goals</th><th scope="col">Notes</th><th scope="col">Photo</th></tr>
            </thead>
            <tbody>
              {rows.map(({a,hasGoal,noteCount,hasPhoto},i)=>(
                <tr key={i}>
                  <td>
                    <span className="cc-tbl-who">
                      <span className="rk-av cc-av is-sm">{a.photo_url?<img src={a.photo_url} alt=""/>:(a.name||"?")[0]}</span>
                      <b>{a.name}</b>
                    </span>
                  </td>
                  <td><span className={"cc-mark"+(hasGoal?" is-on":"")} role="img" aria-label={hasGoal?"Goals set":"No goals"}>✓</span></td>
                  <td><span className={"cc-notes"+(noteCount>0?" is-on":"")}>{noteCount}<small>/6</small></span></td>
                  <td><span className={"cc-mark"+(hasPhoto?" is-on":"")} role="img" aria-label={hasPhoto?"Has photo":"No photo"}>✓</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
