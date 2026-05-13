import { useState, useEffect, useRef } from "react";
import { BG, PUR, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { supabase } from "../lib/supabase";


export default function NotesTab({athleteId, athlete}){
  const[category,setCategory]=useState("mindset");
  const[saving,setSaving]=useState(null);
  const GOLD="#D4AF37",PUR="#534AB7",GREEN="#1E6B3A";

  const MINDSET_WEEKS=[
    {week:1,title:"Who Are You Now?",scripture:"2 Cor 5:17",takeaway:"Your past is not your ceiling.",color:GOLD},
    {week:2,title:"Testimony Monday",scripture:"Rev 12:11",takeaway:"Your story has power.",color:GREEN},
    {week:3,title:"Process Over Outcome",scripture:"Gal 6:9",takeaway:"Fall in love with the work.",color:GOLD},
    {week:4,title:"Testimony Monday",scripture:"Psalm 34:18",takeaway:"God doesn't waste pain.",color:GREEN},
    {week:5,title:"Confidence vs Belief",scripture:"Phil 4:13",takeaway:"Confidence runs out. Belief doesn't.",color:GOLD},
    {week:6,title:"Testimony Monday",scripture:"Isaiah 43:2",takeaway:"You will not be swept away.",color:GREEN},
    {week:7,title:"Fear vs Faith",scripture:"Joshua 1:9",takeaway:"Courage is a decision before a feeling.",color:GOLD},
    {week:8,title:"Testimony Monday",scripture:"Rom 8:28",takeaway:"Nothing you've been through is wasted.",color:GREEN},
    {week:9,title:"Mental Side of Adversity",scripture:"James 1:2-4",takeaway:"Adversity is training. Treat it like it.",color:GOLD},
    {week:10,title:"Testimony Monday",scripture:"2 Tim 1:7",takeaway:"God did not give you a spirit of fear.",color:GREEN},
    {week:11,title:"Who Are You When Nobody's Watching?",scripture:"Prov 11:3",takeaway:"Private character is real character.",color:GOLD},
    {week:12,title:"Who Did You Become?",scripture:"Micah 6:8",takeaway:"Act justly. Love mercy. Walk humbly.",color:GOLD},
  ];

  const FELLOWSHIP_WEEKS=[
    {week:1,title:"The Leader Nobody Sees",scripture:"Matt 6:1–4",takeaway:"Real leadership is built in private.",color:"#C0392B"},
    {week:2,title:"Leading Under Pressure",scripture:"Daniel 3:16–18",takeaway:"Pressure reveals your real character.",color:"#C0392B"},
    {week:3,title:"The Servant Leader",scripture:"Mark 10:42–45",takeaway:"Greatness is redefined by service.",color:"#C0392B"},
    {week:4,title:"Your Example Has a Name",scripture:"1 Tim 4:12",takeaway:"Don't let anyone look down on your youth.",color:"#C0392B"},
    {week:5,title:"The Weight of Words",scripture:"Prov 18:21",takeaway:"Words build up or tear down.",color:"#1A4F8A"},
    {week:6,title:"Accountability Is Love",scripture:"Prov 27:17",takeaway:"Iron sharpens iron.",color:"#1A4F8A"},
    {week:7,title:"Leading Through Conflict",scripture:"Matt 18:15",takeaway:"Go to your brother directly.",color:"#1A4F8A"},
    {week:8,title:"The Humble Leader",scripture:"Phil 2:3–4",takeaway:"Consider others above yourself.",color:"#1A4F8A"},
    {week:9,title:"Roots and Fruit",scripture:"John 15:5",takeaway:"Apart from me you can do nothing.",color:"#0F6E56"},
    {week:10,title:"Legacy Over Trophy",scripture:"2 Tim 4:7",takeaway:"Fight the good fight. Finish the race.",color:"#0F6E56"},
    {week:11,title:"Who Is Following You?",scripture:"1 Cor 11:1",takeaway:"Follow me as I follow Christ.",color:"#0F6E56"},
    {week:12,title:"Sent — Go and Do",scripture:"Matt 28:19–20",takeaway:"Go and make disciples.",color:"#0F6E56"},
  ];

  const saveNote=async(key,val)=>{
    setSaving(key);
    await supabase.from("athletes").update({[key]:val}).eq("id",athleteId).catch(()=>{});
    setSaving(null);
  };

  const weeks=category==="mindset"?MINDSET_WEEKS:FELLOWSHIP_WEEKS;
  const notePrefix=category==="mindset"?"mindset_note_":"fellowship_note_";
  const catColor=category==="mindset"?GOLD:"#C0392B";

  return(
    <div>
      {/* Category switcher */}
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        {[{id:"mindset",label:"Mindset Monday",color:GOLD},{id:"fellowship",label:"Fellowship Friday",color:"#C0392B"}].map(c=>(
          <button key={c.id} onClick={()=>setCategory(c.id)} style={{flex:1,padding:"10px",borderRadius:10,border:"0.5px solid "+(category===c.id?c.color:"#e0e0e0"),background:category===c.id?c.color:"#fff",color:category===c.id?"#fff":"#888",fontSize:12,fontWeight:category===c.id?600:400,cursor:"pointer",fontFamily:"Georgia,serif"}}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Header */}
      <div style={{background:"#0f0f0f",borderRadius:12,padding:"1rem 1.25rem",marginBottom:12,border:"0.5px solid "+catColor+"44"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#fff",marginBottom:2}}>{category==="mindset"?"Mindset Monday":"Fellowship Friday"} — Your Notes</div>
        <div style={{fontSize:12,color:"#888"}}>Write your personal takeaway from each week. Only you can see these.</div>
      </div>

      {/* Week cards */}
      {weeks.map((w,i)=>{
        const noteKey=notePrefix+w.week;
        return(
          <div key={i} style={{background:"#fff",borderRadius:12,padding:"1rem",marginBottom:8,border:"0.5px solid #e0e0e0",borderLeft:"4px solid "+w.color}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
              <div style={{fontSize:11,color:w.color,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em"}}>Week {w.week}</div>
              <div style={{fontSize:11,color:"#888"}}>{w.scripture}</div>
            </div>
            <div style={{fontSize:13,fontWeight:500,color:"#1a1a1a",marginBottom:2}}>{w.title}</div>
            <div style={{fontSize:12,color:"#888",fontStyle:"italic",marginBottom:8}}>"{w.takeaway}"</div>
            <textarea
              defaultValue={athlete?.[noteKey]||""}
              onBlur={e=>saveNote(noteKey,e.target.value)}
              placeholder="Your personal takeaway from this session..."
              style={{width:"100%",minHeight:55,padding:"8px",borderRadius:8,border:"0.5px solid #e0e0e0",fontSize:12,fontFamily:"Georgia,serif",resize:"none",boxSizing:"border-box",background:"#fafafa",color:"#1a1a1a"}}
            />
            {saving===noteKey&&<div style={{fontSize:11,color:GREEN,marginTop:3}}>Saving...</div>}
          </div>
        );
      })}
    </div>
  );
}
