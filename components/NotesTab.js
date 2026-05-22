import { useState, useEffect } from "react";
import { GREEN, GOLD, RED } from "../lib/constants";
import { supabase } from "../lib/supabase";

export default function NotesTab({athleteId, athlete}){
  const[category,setCategory]=useState("mindset");
  const[notes,setNotes]=useState({});
  const[saving,setSaving]=useState(null);
  const[saveError,setSaveError]=useState(null);

  const MINDSET_WEEKS=[
    {week:1,title:"Who Are You Now?",scripture:"2 Corinthians 5:17",verse:"If anyone is in Christ, the new creation has come: The old has gone, the new is here.",takeaway:"Your past is not your ceiling.",color:GOLD},
    {week:2,title:"Testimony Monday",scripture:"Revelation 12:11",verse:"They triumphed over him by the blood of the Lamb and by the word of their testimony.",takeaway:"Your story has power.",color:GREEN},
    {week:3,title:"Process Over Outcome",scripture:"Galatians 6:9",verse:"Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.",takeaway:"Fall in love with the work.",color:GOLD},
    {week:4,title:"Testimony Monday",scripture:"Psalm 34:18",verse:"The Lord is close to the brokenhearted and saves those who are crushed in spirit.",takeaway:"God doesn't waste pain.",color:GREEN},
    {week:5,title:"Confidence vs Belief",scripture:"Philippians 4:13",verse:"I can do all this through him who gives me strength.",takeaway:"Confidence runs out. Belief doesn't.",color:GOLD},
    {week:6,title:"Testimony Monday",scripture:"Isaiah 43:2",verse:"When you pass through the waters, I will be with you; and when you pass through the rivers, they will not sweep over you. When you walk through the fire, you will not be burned; the flames will not set you ablaze.",takeaway:"You will not be swept away.",color:GREEN},
    {week:7,title:"Fear vs Faith",scripture:"Joshua 1:9",verse:"Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",takeaway:"Courage is a decision before a feeling.",color:GOLD},
    {week:8,title:"Testimony Monday",scripture:"Romans 8:28",verse:"And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",takeaway:"Nothing you've been through is wasted.",color:GREEN},
    {week:9,title:"Mental Side of Adversity",scripture:"James 1:2–4",verse:"Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance. Let perseverance finish its work so that you may be mature and complete, not lacking anything.",takeaway:"Adversity is training. Treat it like it.",color:GOLD},
    {week:10,title:"Testimony Monday",scripture:"2 Timothy 1:7",verse:"For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.",takeaway:"God did not give you a spirit of fear.",color:GREEN},
    {week:11,title:"Who Are You When Nobody's Watching?",scripture:"Proverbs 11:3",verse:"The integrity of the upright guides them, but the crookedness of the treacherous destroys them.",takeaway:"Private character is real character.",color:GOLD},
    {week:12,title:"Who Did You Become?",scripture:"Micah 6:8",verse:"He has shown you, O mortal, what is good. And what does the Lord require of you? To act justly and to love mercy and to walk humbly with your God.",takeaway:"Act justly. Love mercy. Walk humbly.",color:GOLD},
  ];

  const FELLOWSHIP_WEEKS=[
    {week:1,title:"The Leader Nobody Sees",scripture:"Matthew 6:1–4",verse:"Be careful not to practice your righteousness in front of others to be seen by them. If you do, you will have no reward from your Father in heaven. So when you give to the needy, do not announce it with trumpets, as the hypocrites do in the synagogues and on the streets, to be honored by others. Truly I tell you, they have received their reward in full. But when you give to the needy, do not let your left hand know what your right hand is doing, so that your giving may be in secret. Then your Father, who sees what is done in secret, will reward you.",takeaway:"Real leadership is built in private.",color:"#C0392B"},
    {week:2,title:"Leading Under Pressure",scripture:"Daniel 3:16–18",verse:"Shadrach, Meshach and Abednego replied to him, 'King Nebuchadnezzar, we do not need to defend ourselves before you in this matter. If we are thrown into the blazing furnace, the God we serve is able to deliver us from it, and he will deliver us from Your Majesty's hand. But even if he does not, we want you to know, Your Majesty, that we will not serve your gods or worship the image of gold you have set up.'",takeaway:"Pressure reveals your real character.",color:"#C0392B"},
    {week:3,title:"The Servant Leader",scripture:"Mark 10:42–45",verse:"Jesus called them together and said, 'You know that those who are regarded as rulers of the Gentiles lord it over them, and their high officials exercise authority over them. Not so with you. Instead, whoever wants to become great among you must be your servant, and whoever wants to be first must be slave of all. For even the Son of Man did not come to be served, but to serve, and to give his life as a ransom for many.'",takeaway:"Greatness is redefined by service.",color:"#C0392B"},
    {week:4,title:"Your Example Has a Name",scripture:"1 Timothy 4:12",verse:"Don't let anyone look down on you because you are young, but set an example for the believers in speech, in conduct, in love, in faith and in purity.",takeaway:"Don't let anyone look down on your youth.",color:"#C0392B"},
    {week:5,title:"The Weight of Words",scripture:"Proverbs 18:21",verse:"The tongue has the power of life and death, and those who love it will eat its fruit.",takeaway:"Words build up or tear down.",color:"#1A4F8A"},
    {week:6,title:"Accountability Is Love",scripture:"Proverbs 27:17",verse:"As iron sharpens iron, so one person sharpens another.",takeaway:"Iron sharpens iron.",color:"#1A4F8A"},
    {week:7,title:"Leading Through Conflict",scripture:"Matthew 18:15",verse:"If your brother or sister sins, go and point out their fault, just between the two of you. If they listen to you, you have won them over.",takeaway:"Go to your brother directly.",color:"#1A4F8A"},
    {week:8,title:"The Humble Leader",scripture:"Philippians 2:3–4",verse:"Do nothing out of selfish ambition or vain conceit. Rather, in humility value others above yourselves, not looking to your own interests but each of you to the interests of the others.",takeaway:"Consider others above yourself.",color:"#1A4F8A"},
    {week:9,title:"Roots and Fruit",scripture:"John 15:5",verse:"I am the vine; you are the branches. If you remain in me and I in you, you will bear much fruit; apart from me you can do nothing.",takeaway:"Apart from me you can do nothing.",color:"#0F6E56"},
    {week:10,title:"Legacy Over Trophy",scripture:"2 Timothy 4:7",verse:"I have fought the good fight, I have finished the race, I have kept the faith.",takeaway:"Fight the good fight. Finish the race.",color:"#0F6E56"},
    {week:11,title:"Who Is Following You?",scripture:"1 Corinthians 11:1",verse:"Follow my example, as I follow the example of Christ.",takeaway:"Follow me as I follow Christ.",color:"#0F6E56"},
    {week:12,title:"Sent — Go and Do",scripture:"Matthew 28:19–20",verse:"Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit, and teaching them to obey everything I have commanded you. And surely I am with you always, to the very end of the age.",takeaway:"Go and make disciples.",color:"#0F6E56"},
  ];

  useEffect(()=>{
    if(!athlete)return;
    const loaded={};
    [...MINDSET_WEEKS,...FELLOWSHIP_WEEKS].forEach(w=>{
      const mk="mindset_note_"+w.week;
      const fk="fellowship_note_"+w.week;
      if(athlete[mk])loaded[mk]=athlete[mk];
      if(athlete[fk])loaded[fk]=athlete[fk];
    });
    setNotes(loaded);
  },[athlete]);

  const saveNote=async(key,val)=>{
    setSaving(key);setSaveError(null);
    setNotes(prev=>({...prev,[key]:val}));
    const{error}=await supabase.from("athletes").update({[key]:val}).eq("id",athleteId);
    if(error){
      console.error("Note save error:",error);
      setSaveError("Save failed — try again");
    }
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
          <button key={c.id} onClick={()=>setCategory(c.id)} style={{flex:1,padding:"10px",borderRadius:10,border:"0.5px solid "+(category===c.id?c.color:"#252525"),background:category===c.id?c.color:"#111",color:category===c.id?"#fff":"#666",fontSize:12,fontWeight:category===c.id?600:400,cursor:"pointer",fontFamily:"Georgia,serif"}}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Header */}
      <div style={{background:"#111",borderRadius:12,padding:"1rem 1.25rem",marginBottom:12,border:"0.5px solid "+catColor+"44"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#fff",marginBottom:2}}>{category==="mindset"?"Mindset Monday":"Fellowship Friday"} — Your Notes</div>
        <div style={{fontSize:12,color:"#666"}}>Write your personal takeaway from each week. Only you can see these.</div>
      </div>

      {saveError&&<div style={{background:"#1a0505",borderRadius:8,padding:"8px 12px",marginBottom:8,fontSize:12,color:RED,border:"0.5px solid #3a0808"}}>{saveError}</div>}

      {/* Week cards */}
      {weeks.map((w,i)=>{
        const noteKey=notePrefix+w.week;
        const val=notes[noteKey]||"";
        const isSaving=saving===noteKey;
        const hasSaved=!isSaving&&val.length>0;
        return(
          <div key={i} style={{background:"#141414",borderRadius:12,padding:"1rem",marginBottom:8,border:"0.5px solid #252525",borderLeft:"3px solid "+w.color}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <div style={{fontSize:11,color:w.color,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>Week {w.week}</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                {isSaving&&<div style={{fontSize:10,color:"#555"}}>saving...</div>}
                {hasSaved&&!isSaving&&<div style={{fontSize:10,color:GREEN}}>✓ saved</div>}
              </div>
            </div>
            <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:8,letterSpacing:"-0.01em"}}>{w.title}</div>
            {/* Full verse */}
            <div style={{background:w.color+"12",borderRadius:8,padding:"10px 12px",marginBottom:8,borderLeft:"2px solid "+w.color+"66"}}>
              <div style={{fontSize:10,color:w.color,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{w.scripture}</div>
              <div style={{fontSize:13,color:"#ccc",fontStyle:"italic",lineHeight:1.75}}>"{w.verse}"</div>
            </div>
            {/* Coach takeaway */}
            <div style={{fontSize:12,color:"#555",fontStyle:"italic",marginBottom:8}}>Key idea: {w.takeaway}</div>
            <textarea
              value={val}
              onChange={e=>{
                const newVal=e.target.value;
                setNotes(prev=>({...prev,[noteKey]:newVal}));
                setSaving(noteKey);
              }}
              onBlur={e=>saveNote(noteKey,e.target.value)}
              placeholder="Your personal takeaway from this session..."
              style={{width:"100%",minHeight:70,padding:"10px",borderRadius:8,border:"0.5px solid "+(isSaving?catColor:"#2a2a2a"),fontSize:13,fontFamily:"Georgia,serif",resize:"vertical",boxSizing:"border-box",background:"#0e0e0e",color:"#ddd",lineHeight:1.6,transition:"border-color 0.2s"}}
            />
          </div>
        );
      })}
    </div>
  );
}
