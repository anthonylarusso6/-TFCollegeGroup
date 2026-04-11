import { useState } from "react";

const BG="#0f0f0f";
const PUR="#534AB7";
const RED="#C0392B";
const GREEN="#1E6B3A";
const GOLD="#D4AF37";

const WEEKS=[
  {week:1,speaker:"Coach Ant",type:"coach",title:"Who Are You Now?",focus:"Identity reset. Who you were before this program doesn't define who you become in it.",scripture:"2 Corinthians 5:17",verse:"If anyone is in Christ, the new creation has come: The old has gone, the new is here.",points:["You don't have to carry who you were into who you're becoming.","Your past performance, past failures, past reputation — none of that is your ceiling.","This program is a reset. Take it."],question:"Who do you want to be when this summer is over — and what has to change starting today?"},
  {week:2,speaker:"Testimony",type:"testimony",title:"Testimony Monday",focus:"An athlete shares their story. Coach Ant opens, sets the tone, invites vulnerability.",scripture:"Revelation 12:11",verse:"They triumphed over him by the blood of the Lamb and by the word of their testimony.",points:["Your story has power — not because it's perfect but because it's real.","Someone in this room needs to hear what you've been through.","Vulnerability is not weakness. It is the beginning of real community."],question:"What part of your story are you still ashamed of — and what would it mean to let it become something that helps someone else?"},
  {week:3,speaker:"Kevin",type:"kevin",title:"Process Over Outcome",focus:"Stop chasing results. Start mastering the process. The outcome takes care of itself.",scripture:"Galatians 6:9",verse:"Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.",points:["The athlete obsessed with results skips the reps that produce them.","Every great outcome is the accumulation of thousands of unwitnessed processes.","Fall in love with the work. The work is where character is built."],question:"What process are you currently cutting corners on — and what result are you expecting that the process doesn't support?"},
  {week:4,speaker:"Testimony",type:"testimony",title:"Testimony Monday",focus:"Open volunteer. Coach Ant invites someone who's been ready to share.",scripture:"Psalm 34:18",verse:"The Lord is close to the brokenhearted and saves those who are crushed in spirit.",points:["Brokenness is not the end of your story — it's often the beginning of the real one.","God doesn't waste pain. He uses it.","The room is safe. What happens here stays here."],question:"When was the lowest point in your life — and how did you get through it?"},
  {week:5,speaker:"Kevin",type:"kevin",title:"Confidence vs Belief",focus:"Confidence comes from what you've done. Belief comes from who you are. One runs out. The other doesn't.",scripture:"Philippians 4:13",verse:"I can do all this through him who gives me strength.",points:["Confidence is performance-based. It rises and falls with your results.","Belief is identity-based. It holds even when performance fails.","When you know who you are, a bad game doesn't break you."],question:"Is your confidence built on your performance or your identity? What happens to your mindset when you have a bad week?"},
  {week:6,speaker:"Testimony",type:"testimony",title:"Testimony Monday",focus:"Open volunteer. Someone who's been sitting on their story.",scripture:"Isaiah 43:2",verse:"When you pass through the waters, I will be with you; and when you pass through the rivers, they will not sweep over you.",points:["You are not alone in what you've been through.","The storms in your life were not signs that God abandoned you.","Your testimony is the proof that He didn't."],question:"What storm did you think would destroy you — that you actually survived?"},
  {week:7,speaker:"Kevin",type:"kevin",title:"Fear vs Faith",focus:"Fear and faith both require you to believe in something you can't see yet. Choose which one you feed.",scripture:"Joshua 1:9",verse:"Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",points:["Fear says: what if it goes wrong? Faith says: what if God shows up?","You cannot operate at your highest level from a place of fear.","Courage is not the absence of fear — it's choosing faith in spite of it."],question:"What are you currently afraid of — and what would you do differently if you replaced that fear with faith?"},
  {week:8,speaker:"Testimony",type:"testimony",title:"Testimony Monday",focus:"Open volunteer. Halfway point — who has grown enough to share?",scripture:"Romans 8:28",verse:"And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",points:["All things — not some things. All things.","The hard parts of your story are not accidents.","God is not surprised by anything you've been through."],question:"Looking back — what hard thing in your life can you now see God was working through?"},
  {week:9,speaker:"Kevin",type:"kevin",title:"Mental Side of Adversity",focus:"How you handle hard things mentally is the difference between people who make it and people who don't.",scripture:"James 1:2-4",verse:"Consider it pure joy whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance.",points:["Your mind gives up before your body does — almost every time.","The mental rep is the most important rep you'll take.","Adversity is training. Treat it like it."],question:"When adversity hits, what is your default mental response — and is that response helping you or hurting you?"},
  {week:10,speaker:"Testimony",type:"testimony",title:"Testimony Monday",focus:"Open volunteer. Two weeks left — who hasn't shared yet?",scripture:"2 Timothy 1:7",verse:"For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.",points:["You were not given a spirit of fear.","Timidity is learned. It can be unlearned.","Sharing your story takes courage — and it gives someone else permission to be brave too."],question:"What would you share if you knew nobody would judge you — and why haven't you shared it yet?"},
  {week:11,speaker:"Kevin",type:"kevin",title:"Who Are You When Nobody's Watching?",focus:"Your private character is your real character. What you do when nobody sees you is who you actually are.",scripture:"Proverbs 11:3",verse:"The integrity of the upright guides them, but the unfaithful are destroyed by their duplicity.",points:["Your real character is revealed in private — not in public.","Who you are at 2am when nobody's watching is who you are.","The gap between your public self and private self is where character breaks down."],question:"Is the person you are in private someone you're proud of — and if not, what needs to change?"},
  {week:12,speaker:"Coach Ant",type:"coach",title:"Closing Week — Who Did You Become?",focus:"Final session. Coach Ant closes the summer. Reflection, challenge, send-off.",scripture:"Micah 6:8",verse:"He has shown you, O mortal, what is good. And what does the Lord require of you? To act justly and to love mercy and to walk humbly with your God.",points:["You came in as one person. Who are you leaving as?","The work doesn't stop when this program does.","Iron sharpens iron — take that with you wherever you go next."],question:"What is the one thing this summer changed about you — and how are you going to make sure it lasts?"},
];

export default function MindsetMonday(){
  const[currentWeek,setCurrentWeek]=useState(1);
  const[expandedPoint,setExpandedPoint]=useState(null);
  const[notes,setNotes]=useState({});
  const[completed,setCompleted]=useState([]);

  const week=WEEKS[currentWeek-1];
  const noteKey="mm-week-"+currentWeek;
  const typeColor=week.type==="kevin"?PUR:week.type==="testimony"?GREEN:GOLD;
  const typeLabel=week.type==="kevin"?"Kevin — Guest Speaker":week.type==="testimony"?"Testimony Monday":"Coach Ant";

  return(
    <div>
      {/* Header */}
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+PUR}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Mindset Monday — 12 weeks</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
          {[
            {label:"Current week",val:"Week "+currentWeek,color:typeColor,bg:"#f5f5f5"},
            {label:"Speaker",val:week.type==="kevin"?"Kevin":week.type==="testimony"?"Athlete":"Coach Ant",color:typeColor,bg:"#f5f5f5"},
            {label:"Completed",val:completed.length+"/12",color:GREEN,bg:"#EAF3DE"},
          ].map(s=>(
            <div key={s.label} style={{background:s.bg,borderRadius:10,padding:"10px",textAlign:"center",border:"0.5px solid #e0e0e0"}}>
              <div style={{fontSize:14,fontWeight:500,color:s.color}}>{s.val}</div>
              <div style={{fontSize:11,color:"#888",marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Week selector */}
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
          {WEEKS.map(w=>{
            const tc=w.type==="kevin"?PUR:w.type==="testimony"?GREEN:GOLD;
            const isDone=completed.includes(w.week);
            const isActive=currentWeek===w.week;
            return(
              <button key={w.week} onClick={()=>{setCurrentWeek(w.week);setExpandedPoint(null);}} style={{width:36,height:36,borderRadius:8,border:"0.5px solid "+(isActive?tc:tc+"44"),background:isActive?tc:"transparent",color:isActive?"#fff":tc,fontSize:11,fontWeight:isActive?600:400,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                {isDone?"✓":w.week}
              </button>
            );
          })}
        </div>
      </div>

      {/* Week content */}
      <div style={{background:week.type==="kevin"?"#EEEDFE":week.type==="testimony"?"#EAF3DE":"#1f1700",borderRadius:12,padding:"1rem",marginBottom:12,border:"0.5px solid "+typeColor+"44"}}>
        <div style={{fontSize:11,color:typeColor,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>{typeLabel} · Week {week.week}</div>
        <div style={{fontSize:18,fontWeight:600,color:week.type==="testimony"||week.type==="kevin"?"#1a1a1a":GOLD,marginBottom:6}}>{week.title}</div>
        <div style={{fontSize:13,color:week.type==="testimony"||week.type==="kevin"?"#555":"#aaa",lineHeight:1.7}}>{week.focus}</div>
      </div>

      {/* Scripture */}
      <div style={{background:BG,borderRadius:12,padding:"1rem",marginBottom:12,border:"0.5px solid "+typeColor+"44"}}>
        <div style={{fontSize:11,color:typeColor,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>{week.scripture}</div>
        <div style={{fontSize:14,color:"#fff",fontStyle:"italic",lineHeight:1.7}}>"{week.verse}"</div>
      </div>

      {/* Teaching points */}
      <div style={{background:"#fff",borderRadius:12,padding:"1rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
        <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:10}}>Teaching points</div>
        {week.points.map((p,i)=>(
          <div key={i} style={{display:"flex",gap:10,padding:"10px",borderRadius:8,background:i===expandedPoint?(week.type==="kevin"?"#EEEDFE":week.type==="testimony"?"#EAF3DE":"#1f1700"):"#f9f9f9",marginBottom:6,cursor:"pointer",border:"0.5px solid "+(i===expandedPoint?typeColor:"#e0e0e0")}} onClick={()=>setExpandedPoint(expandedPoint===i?null:i)}>
            <div style={{width:22,height:22,borderRadius:"50%",background:typeColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:"#fff",flexShrink:0}}>{i+1}</div>
            <div style={{fontSize:13,color:i===expandedPoint&&week.type==="coach"?"#fff":"#1a1a1a",lineHeight:1.6,alignSelf:"center"}}>{p}</div>
          </div>
        ))}
      </div>

      {/* Discussion question */}
      <div style={{background:BG,borderRadius:12,padding:"1rem",marginBottom:12,border:"2px solid "+typeColor}}>
        <div style={{fontSize:11,color:typeColor,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>Discussion question</div>
        <div style={{fontSize:14,color:"#fff",lineHeight:1.7,fontStyle:"italic"}}>"{week.question}"</div>
        <div style={{fontSize:11,color:"#555",marginTop:6}}>Give space. Let it sit. Don't rush past this one.</div>
      </div>

      {/* Coach notes */}
      <div style={{background:"#fff",borderRadius:12,padding:"1rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
        <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>Coach notes — Week {currentWeek}</div>
        <textarea value={notes[noteKey]||""} onChange={e=>setNotes(p=>({...p,[noteKey]:e.target.value}))} placeholder="What came up? Who opened up? What to follow up on?" style={{width:"100%",minHeight:70,padding:"8px",fontSize:13,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia,serif",resize:"vertical",boxSizing:"border-box"}}/>
      </div>

      {/* Actions */}
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>{if(!completed.includes(currentWeek))setCompleted(p=>[...p,currentWeek]);}} disabled={completed.includes(currentWeek)} style={{flex:1,padding:"10px",borderRadius:8,border:"none",background:completed.includes(currentWeek)?"#EAF3DE":typeColor,color:completed.includes(currentWeek)?GREEN:"#fff",fontSize:13,fontWeight:500,cursor:completed.includes(currentWeek)?"default":"pointer",fontFamily:"Georgia,serif"}}>
          {completed.includes(currentWeek)?"Week complete ✓":"Mark complete →"}
        </button>
        {currentWeek<12&&(
          <button onClick={()=>{setCurrentWeek(w=>w+1);setExpandedPoint(null);}} style={{padding:"10px 16px",borderRadius:8,border:"0.5px solid #e0e0e0",background:"transparent",color:"#888",fontSize:13,cursor:"pointer",fontFamily:"Georgia,serif"}}>Next →</button>
        )}
      </div>
    </div>
  );
}
