import { useState, useEffect } from "react";
import { GREEN, GOLD, RED, PUR } from "../lib/constants";
import { supabase } from "../lib/supabase";
import { MM_WINTER_NOTES, FF_WINTER_NOTES, WINTER_LABEL } from "../lib/studySeries";

const MINDSET_WEEKS=[
  {week:1,title:"Who Are You Now?",scripture:"2 Corinthians 5:17",verse:"If anyone is in Christ, the new creation has come: The old has gone, the new is here.",takeaway:"Your past is not your ceiling.",color:GOLD},
  {week:2,title:"Testimony Monday",scripture:"Revelation 12:11",verse:"They triumphed over him by the blood of the Lamb and by the word of their testimony.",takeaway:"Your story has power.",color:GOLD},
  {week:3,title:"Process Over Outcome",scripture:"Galatians 6:9",verse:"Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.",takeaway:"Fall in love with the work.",color:PUR},
  {week:4,title:"Testimony Monday",scripture:"Psalm 34:18",verse:"The Lord is close to the brokenhearted and saves those who are crushed in spirit.",takeaway:"God doesn't waste pain.",color:GOLD},
  {week:5,title:"Confidence vs Belief",scripture:"Philippians 4:13",verse:"I can do all this through him who gives me strength.",takeaway:"Confidence runs out. Belief doesn't.",color:PUR},
  {week:6,title:"Testimony Monday",scripture:"Isaiah 43:2",verse:"When you pass through the waters, I will be with you; and when you pass through the rivers, they will not sweep over you.",takeaway:"You will not be swept away.",color:PUR},
  {week:7,title:"Fear vs Faith",scripture:"Joshua 1:9",verse:"Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",takeaway:"Courage is a decision before a feeling.",color:PUR},
  {week:8,title:"Testimony Monday",scripture:"Romans 8:28",verse:"And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",takeaway:"Nothing you've been through is wasted.",color:PUR},
  {week:9,title:"Mental Side of Adversity",scripture:"James 1:2–4",verse:"Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance.",takeaway:"Adversity is training. Treat it like it.",color:GREEN},
  {week:10,title:"Testimony Monday",scripture:"2 Timothy 1:7",verse:"For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.",takeaway:"God did not give you a spirit of fear.",color:GREEN},
  {week:11,title:"Who Are You When Nobody's Watching?",scripture:"Proverbs 11:3",verse:"The integrity of the upright guides them, but the crookedness of the treacherous destroys them.",takeaway:"Private character is real character.",color:GREEN},
  {week:12,title:"Who Did You Become?",scripture:"Micah 6:8",verse:"He has shown you, O mortal, what is good. And what does the Lord require of you? To act justly and to love mercy and to walk humbly with your God.",takeaway:"Act justly. Love mercy. Walk humbly.",color:GOLD},
];

const FELLOWSHIP_WEEKS=[
  {week:1,title:"The Leader Nobody Sees",scripture:"Matthew 6:1–4",verse:"Be careful not to practice your righteousness in front of others to be seen by them.",takeaway:"Real leadership is built in private.",color:"#C0392B"},
  {week:2,title:"Leading Under Pressure",scripture:"Daniel 3:16–18",verse:"If we are thrown into the blazing furnace, the God we serve is able to deliver us from it... But even if he does not, we will not serve your gods.",takeaway:"Pressure reveals your real character.",color:"#C0392B"},
  {week:3,title:"The Servant Leader",scripture:"Mark 10:42–45",verse:"Whoever wants to become great among you must be your servant, and whoever wants to be first must be slave of all.",takeaway:"Greatness is redefined by service.",color:"#C0392B"},
  {week:4,title:"Your Example Has a Name",scripture:"1 Timothy 4:12",verse:"Don't let anyone look down on you because you are young, but set an example for the believers in speech, in conduct, in love, in faith and in purity.",takeaway:"Don't let anyone look down on your youth.",color:"#C0392B"},
  {week:5,title:"The Weight of Words",scripture:"Proverbs 18:21",verse:"The tongue has the power of life and death, and those who love it will eat its fruit.",takeaway:"Words build up or tear down.",color:"#1A4F8A"},
  {week:6,title:"Accountability Is Love",scripture:"Proverbs 27:17",verse:"As iron sharpens iron, so one person sharpens another.",takeaway:"Iron sharpens iron.",color:"#1A4F8A"},
  {week:7,title:"Leading Through Conflict",scripture:"Matthew 18:15",verse:"If your brother or sister sins, go and point out their fault, just between the two of you. If they listen to you, you have won them over.",takeaway:"Go to your brother directly.",color:"#1A4F8A"},
  {week:8,title:"The Humble Leader",scripture:"Philippians 2:3–4",verse:"In humility value others above yourselves, not looking to your own interests but each of you to the interests of the others.",takeaway:"Consider others above yourself.",color:"#1A4F8A"},
  {week:9,title:"Roots and Fruit",scripture:"John 15:5",verse:"I am the vine; you are the branches. If you remain in me and I in you, you will bear much fruit; apart from me you can do nothing.",takeaway:"Apart from me you can do nothing.",color:"#0F6E56"},
  {week:10,title:"Legacy Over Trophy",scripture:"2 Timothy 4:7",verse:"I have fought the good fight, I have finished the race, I have kept the faith.",takeaway:"Fight the good fight. Finish the race.",color:"#0F6E56"},
  {week:11,title:"Who Is Following You?",scripture:"1 Corinthians 11:1",verse:"Follow my example, as I follow the example of Christ.",takeaway:"Follow me as I follow Christ.",color:"#0F6E56"},
  {week:12,title:"Sent — Go and Do",scripture:"Matthew 28:19–20",verse:"Therefore go and make disciples of all nations... And surely I am with you always, to the very end of the age.",takeaway:"Go and make disciples.",color:"#0F6E56"},
];

export default function NotesTab({athleteId}){
  const[category,setCategory]=useState("mindset");
  const[season,setSeason]=useState("winter");
  const[notes,setNotes]=useState({});
  const[drafts,setDrafts]=useState({});
  const[saving,setSaving]=useState(null);
  const[saved,setSaved]=useState(null);
  const[saveError,setSaveError]=useState(null);

  useEffect(()=>{
    if(!athleteId)return;
    (async()=>{
      try{
        const{data}=await supabase.from("announcements")
          .select("week_label,message,type,created_at")
          .eq("day",String(athleteId))
          .in("type",["mm_note","ff_note"])
          .eq("active",true)
          .order("created_at",{ascending:false});
        const loaded={};
        (data||[]).forEach(r=>{
          const prefix=r.type==="mm_note"?"mm_":"ff_";
          const k=prefix+r.week_label;
          if(!loaded[k])loaded[k]=r.message;
        });
        setNotes(loaded);
      }catch(e){}
    })();
  },[athleteId]);

  const saveNote=async(key,val)=>{
    if(!val.trim())return;
    setSaving(key);setSaved(null);setSaveError(null);
    const isFF=key.startsWith("ff_");
    const weekNum=key.split("_").pop();
    const type=isFF?"ff_note":"mm_note";
    const trimmed=val.trim();
    try{
      const{error:insErr}=await supabase.from("announcements").insert({
        type,
        day:String(athleteId),
        week_label:weekNum,
        message:trimmed,
        active:true,
      });
      if(insErr)throw insErr;
      setNotes(prev=>({...prev,[key]:trimmed}));
      setDrafts(prev=>({...prev,[key]:trimmed}));
      setSaved(key);
      setTimeout(()=>setSaved(k=>k===key?null:k),3000);
    }catch(e){
      console.error("Note save error",e);
      setSaveError(key);
      setTimeout(()=>setSaveError(k=>k===key?null:k),4000);
    }
    setSaving(null);
  };

  const winter=season==="winter";
  const weeks=category==="mindset"?(winter?MM_WINTER_NOTES:MINDSET_WEEKS):(winter?FF_WINTER_NOTES:FELLOWSHIP_WEEKS);
  // Winter notes are saved as week "w26-1", "w26-2"… so they never overwrite summer notes.
  const prefix=(category==="mindset"?"mm_":"ff_")+(winter?"w26-":"");
  const catColor=category==="mindset"?GOLD:"#C0392B";
  const catLabel=category==="mindset"?"Mindset Monday":"Fellowship Friday";

  return(
    <div className="tfx ae ae-notes">
      <header className="ae-head">
        <div>
          <div className="tfx-eyebrow">Study notes</div>
          <h2>{catLabel}</h2>
          <p>{winter?WINTER_LABEL+" · ":"Summer 2026 · "}Write your personal takeaway. Only you can see these.</p>
        </div>
      </header>

      {/* Category switcher */}
      <div className="ir-seg" role="tablist" aria-label="Notes category">
        {[{id:"mindset",label:"Mindset Monday",color:GOLD},{id:"fellowship",label:"Fellowship Friday",color:"#C0392B"}].map(c=>(
          <button key={c.id} type="button" role="tab" aria-selected={category===c.id} className={category===c.id?"is-on":""} onClick={()=>setCategory(c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="ae-season" role="group" aria-label="Season">
        {[{id:"winter",label:WINTER_LABEL},{id:"summer",label:"Summer 2026"}].map(o=>(
          <button key={o.id} type="button" className={"tfx-chipbtn tfx-press"+(season===o.id?" is-on":"")} aria-pressed={season===o.id} onClick={()=>setSeason(o.id)}>{o.label}</button>
        ))}
      </div>

      {/* Week cards */}
      {weeks.map((w,i)=>{
        const key=prefix+w.week;
        const saved_val=notes[key]||"";
        const draft=drafts[key]??saved_val;
        const isDirty=draft!==saved_val&&draft.trim().length>0;
        const isSaving=saving===key;
        const isSaved=saved===key;
        const isError=saveError===key;
        const state=isError?" is-err":isDirty?" is-dirty":isSaved?" is-saved":"";
        return(
          <section key={i} className={"tfx-card ae-week"+state} style={{"--c":w.color}}>
            <div className="ae-week-top">
              <div className="tfx-eyebrow"><i aria-hidden="true"/>Week {w.week}{w.date?" · "+w.date:""}</div>
              {isSaved&&<span className="ae-status is-saved">✓ Saved</span>}
              {isSaving&&<span className="ae-status">Saving...</span>}
              {isError&&<span className="ae-status is-err">Save failed — try again</span>}
              {saved_val&&!isSaving&&!isSaved&&!isError&&<span className="ae-status">✓ saved</span>}
            </div>
            <h3>{w.title}</h3>
            <div className="ae-scrip">
              <span className="ae-ref">{w.scripture}</span>
              <p className="ae-quote">“{w.verse}”</p>
            </div>
            <p className="ae-key">Key idea: <b>{w.takeaway}</b></p>
            <textarea
              className="tfx-field ae-ta is-grow"
              value={draft}
              onChange={e=>setDrafts(prev=>({...prev,[key]:e.target.value}))}
              placeholder="Your personal takeaway from this session..."
              aria-label={"Your notes for week "+w.week}
            />
            <div className="ae-week-act">
              <button
                type="button"
                className={(isDirty?"tfx-btn ae-btn":"tfx-btn-ghost")+" tfx-press ae-save"+(isSaved?" is-saved":"")}
                style={{"--c":catColor}}
                onClick={()=>saveNote(key,draft)}
                disabled={!isDirty&&!!saved_val||isSaving}>
                {isSaving?"Saving...":isSaved?"✓ Saved":saved_val?"Update":"Save note"}
              </button>
            </div>
          </section>
        );
      })}
    </div>
  );
}
