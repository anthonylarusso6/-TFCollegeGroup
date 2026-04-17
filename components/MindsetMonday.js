import { useState } from "react";

const BG="#0f0f0f";
const PUR="#534AB7";
const RED="#C0392B";
const GREEN="#1E6B3A";
const GOLD="#D4AF37";

const SERIES_META=[
  {num:1,title:"Identity & Purpose",color:GOLD,light:"#1f1700",weeks:"Weeks 1–4"},
  {num:2,title:"Mental Toughness",color:PUR,light:"#EEEDFE",weeks:"Weeks 5–8"},
  {num:3,title:"Legacy & Character",color:GREEN,light:"#EAF3DE",weeks:"Weeks 9–12"},
];

const WEEKS=[
  {week:1,series:1,seriesTitle:"Identity & Purpose",speaker:"Coach Ant",type:"coach",title:"Who Are You Now?",
    focus:"Identity reset. Who you were before this program doesn't define who you become in it.",
    scripture:"2 Corinthians 5:17",
    verse:"If anyone is in Christ, the new creation has come: The old has gone, the new is here.",
    bigIdea:"You don't have to carry who you were into who you're becoming. This program is a reset — take it.",
    teaching:[
      {point:"Your past doesn't set your ceiling",detail:"Past performance, failures, reputation — none of it defines what's possible for you in this room starting today."},
      {point:"A new creation means a new standard",detail:"If you've surrendered your life to Christ, you are not the same person you were. That's not motivation — that's theology."},
      {point:"This program is a reset",detail:"You have the rare gift of a fresh start. Most people never get one. Don't waste it."},
    ],
    questions:[
      {q:"Who were you before this program — and who do you want to be when it's over?",a:"Give space. Let athletes think. This is the seed question for the whole summer."},
      {q:"What part of your old identity are you still holding onto that doesn't belong in your new season?",a:"Could be habits, reputation, relationships, mindset. Gently challenge them to name it."},
      {q:"What would it look like to fully commit to who you're becoming instead of who you've been?",a:"Discipline, honesty, showing up. Small daily decisions that compound over 12 weeks."},
    ],
    deepQuestion:"If nobody from your past knew you — who would you choose to become?",
    takeaways:["Your past is not your ceiling.","A new creation means a new standard — not just motivation.","This summer is a reset. Take it seriously."],
    color:GOLD,light:"#1f1700"},

  {week:2,series:1,seriesTitle:"Identity & Purpose",speaker:"Athlete Testimony",type:"testimony",title:"Testimony Monday",
    focus:"An athlete shares their story. Coach Ant opens, sets the tone, invites vulnerability.",
    scripture:"Revelation 12:11",
    verse:"They triumphed over him by the blood of the Lamb and by the word of their testimony.",
    bigIdea:"Your story has power — not because it's perfect, but because it's real. Someone in this room needs to hear it.",
    teaching:[
      {point:"Vulnerability is not weakness",detail:"It takes more courage to be honest about struggle than to pretend everything is fine."},
      {point:"Your testimony is your greatest weapon",detail:"Not your stats. Not your scholarship. The story of how God moved in your life."},
      {point:"Someone needs what you've been through",detail:"You survived it for a reason. Let your story become someone else's lifeline."},
    ],
    questions:[
      {q:"What part of your story are you still ashamed of?",a:"Create a safe, private moment. Remind the room: what's said here stays here."},
      {q:"What would it mean to let your pain become something that helps someone else?",a:"Redemption. That's the gospel. God doesn't waste anything."},
      {q:"Who in this room might need to hear your story?",a:"Let athletes look around. Build real community."},
    ],
    deepQuestion:"What would you share if you knew nobody would judge you — and why haven't you shared it yet?",
    takeaways:["Your story has power — not because it's perfect, but because it's real.","Vulnerability is the beginning of real community.","Your testimony is the proof that God didn't abandon you."],
    color:GOLD,light:"#1f1700"},

  {week:3,series:1,seriesTitle:"Identity & Purpose",speaker:"Kevin",type:"kevin",title:"Process Over Outcome",
    focus:"Stop chasing results. Start mastering the process. The outcome takes care of itself.",
    scripture:"Galatians 6:9",
    verse:"Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.",
    bigIdea:"The athlete obsessed with results skips the reps that produce them. Fall in love with the work.",
    teaching:[
      {point:"Outcomes are the byproduct of process",detail:"Every great result is the accumulation of thousands of unwitnessed reps. Nobody sees the work — they only see the outcome."},
      {point:"Weariness is a trap",detail:"The verse warns you: you will get tired of doing the right thing. That's normal. That's when character is built."},
      {point:"Harvest comes at the proper time",detail:"Not your time. The proper time. Trust the process even when you can't see the results."},
    ],
    questions:[
      {q:"What process are you cutting corners on — and what result are you expecting that the process doesn't support?",a:"Be honest. This hits athletes who expect playing time without putting in private work."},
      {q:"When does weariness hit you hardest — and what keeps you going?",a:"Let athletes be real. Training, school, life pressure. What anchors them?"},
      {q:"What would change if you fell in love with the process instead of the outcome?",a:"Less frustration. More consistency. More peace. That's the goal."},
    ],
    deepQuestion:"Are you actually committed to the process — or just committed to the result you want from it?",
    takeaways:["Every outcome is built on thousands of unseen processes.","Weariness is expected. Push through it anyway.","Harvest comes at the proper time — not yours."],
    color:PUR,light:"#EEEDFE"},

  {week:4,series:1,seriesTitle:"Identity & Purpose",speaker:"Athlete Testimony",type:"testimony",title:"Testimony Monday",
    focus:"Open volunteer. Coach Ant invites someone who's been ready to share.",
    scripture:"Psalm 34:18",
    verse:"The Lord is close to the brokenhearted and saves those who are crushed in spirit.",
    bigIdea:"Brokenness is not the end of your story — it's often the beginning of the real one. God doesn't waste pain.",
    teaching:[
      {point:"God is close to the brokenhearted",detail:"Not far away. Not disappointed. Close. This is where God does His best work."},
      {point:"Crushed spirit doesn't mean abandoned",detail:"Your lowest moments are not evidence that God left. They're often evidence that He's closest."},
      {point:"Pain has purpose",detail:"What felt like it would break you — God was using it to build you."},
    ],
    questions:[
      {q:"When was the lowest point in your life — and how did you get through it?",a:"Give extended space. This is sacred territory. Don't rush."},
      {q:"Looking back, where do you see God in that season — even if you didn't see it then?",a:"Hindsight faith. Help athletes trace God's hand through the hard parts."},
      {q:"What would you say to someone going through what you went through?",a:"Turn their testimony into wisdom they can pass on."},
    ],
    deepQuestion:"Is there a part of your story you've buried that God might want to use?",
    takeaways:["God is closest when you feel most broken.","Pain has purpose — even when you can't see it.","Your lowest point is not the end of your story."],
    color:GOLD,light:"#1f1700"},

  {week:5,series:2,seriesTitle:"Mental Toughness",speaker:"Kevin",type:"kevin",title:"Confidence vs Belief",
    focus:"Confidence comes from what you've done. Belief comes from who you are. One runs out. The other doesn't.",
    scripture:"Philippians 4:13",
    verse:"I can do all this through him who gives me strength.",
    bigIdea:"When you know who you are, a bad game doesn't break you. Build belief — not just confidence.",
    teaching:[
      {point:"Confidence is performance-based",detail:"It rises when you play well and collapses when you don't. Every athlete knows this feeling."},
      {point:"Belief is identity-based",detail:"It holds even when performance fails. It's not about what you've done — it's about whose you are."},
      {point:"'Through him' changes everything",detail:"The source of your strength is not your ability. That's why it doesn't run out."},
    ],
    questions:[
      {q:"Is your confidence built on your performance or your identity — and what happens when you have a bad week?",a:"Most athletes answer honestly: performance. That's the problem to solve."},
      {q:"What does it look like to stay grounded when everything is going wrong?",a:"Peace that passes understanding. Philippians 4 context. Your anchor holds."},
      {q:"How do you build identity-based belief instead of just performance confidence?",a:"Time in scripture. Time in prayer. Knowing who God says you are."},
    ],
    deepQuestion:"When you strip away your stats, your position, and your sport — who are you? Is that person enough?",
    takeaways:["Confidence runs out. Belief doesn't.","Your identity is not your performance.","The source of your strength matters more than the size of it."],
    color:PUR,light:"#EEEDFE"},

  {week:6,series:2,seriesTitle:"Mental Toughness",speaker:"Athlete Testimony",type:"testimony",title:"Testimony Monday",
    focus:"Open volunteer. Someone who's been sitting on their story.",
    scripture:"Isaiah 43:2",
    verse:"When you pass through the waters, I will be with you; and when you pass through the rivers, they will not sweep over you.",
    bigIdea:"You are not alone in what you've been through. The storms in your life were not signs that God abandoned you.",
    teaching:[
      {point:"'When' not 'if'",detail:"God doesn't promise you'll avoid the water. He promises He'll be in it with you."},
      {point:"The river will not sweep over you",detail:"You might be in deep water — but you will not drown. That's the promise."},
      {point:"Storms don't mean absence",detail:"Every testimony in this room is proof that God showed up in the storm."},
    ],
    questions:[
      {q:"What storm did you think would destroy you — that you actually survived?",a:"Give extended space. This is where the room gets real."},
      {q:"Where did you see God show up in the middle of it?",a:"Sometimes it was a person. A moment. A feeling. Help them trace it."},
      {q:"What do you know now that you didn't know then?",a:"Wisdom from the water. Let their story become a lesson for the room."},
    ],
    deepQuestion:"Looking at the hardest season of your life — what evidence do you have that God was with you?",
    takeaways:["God doesn't promise you'll avoid the storm. He promises to be in it with you.","You will not be swept away.","Your survival is your testimony."],
    color:PUR,light:"#EEEDFE"},

  {week:7,series:2,seriesTitle:"Mental Toughness",speaker:"Kevin",type:"kevin",title:"Fear vs Faith",
    focus:"Fear and faith both require you to believe in something you can't see yet. Choose which one you feed.",
    scripture:"Joshua 1:9",
    verse:"Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
    bigIdea:"You cannot operate at your highest level from a place of fear. Courage is not the absence of fear — it's choosing faith in spite of it.",
    teaching:[
      {point:"Fear and faith are both future-oriented",detail:"Fear says: what if it goes wrong? Faith says: what if God shows up? You're choosing which story to believe."},
      {point:"'Be strong and courageous' is a command",detail:"God doesn't say 'feel strong.' He says 'be strong.' It's a decision before it's a feeling."},
      {point:"Courage is choosing faith in spite of fear",detail:"The most courageous athletes in this room have fear — they just don't let it drive."},
    ],
    questions:[
      {q:"What are you currently afraid of — and what would change if you replaced that fear with faith?",a:"Specific. Real answers. Playing time, relationships, future, failure."},
      {q:"What does courage look like in your sport — and what does it look like off the field?",a:"Saying the hard thing. Showing up when you don't feel like it. Owning your mistakes."},
      {q:"How do you feed faith instead of fear in a practical, daily way?",a:"Scripture. Gratitude. Community. Prayer. Small disciplines."},
    ],
    deepQuestion:"What fear is currently running your life — and what would you do if you weren't afraid?",
    takeaways:["Fear and faith both require belief in something unseen. Choose wisely.","Courage is a decision before it's a feeling.","You cannot operate at your highest level from a place of fear."],
    color:PUR,light:"#EEEDFE"},

  {week:8,series:2,seriesTitle:"Mental Toughness",speaker:"Athlete Testimony",type:"testimony",title:"Testimony Monday",
    focus:"Open volunteer. Halfway point — who has grown enough to share?",
    scripture:"Romans 8:28",
    verse:"And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
    bigIdea:"All things — not some things. God is not surprised by anything you've been through. And He's working in all of it.",
    teaching:[
      {point:"All things — not some things",detail:"The verse doesn't say the easy things or the comfortable things. It says all things. Even the worst parts of your story."},
      {point:"God is not surprised",detail:"Nothing in your past shocked God. He knew it — and He's been working through it the whole time."},
      {point:"Good doesn't mean easy",detail:"God working things for good doesn't mean life gets easy. It means nothing is wasted."},
    ],
    questions:[
      {q:"Looking back — what hard thing can you now see God was working through?",a:"Give space. This is where hindsight faith becomes real encouragement."},
      {q:"Is there something painful in your life right now that you haven't been able to see the purpose in yet?",a:"Honest moment. Trust the room. Create safety."},
      {q:"What would it mean to trust that God is working in it — even if you can't see it?",a:"That's faith. That's what this series has been building toward."},
    ],
    deepQuestion:"What's the hardest thing you've ever been through — and can you say 'God was working in that'?",
    takeaways:["All things — not some things.","God is not surprised by your story.","Nothing you've been through is wasted."],
    color:PUR,light:"#EEEDFE"},

  {week:9,series:3,seriesTitle:"Legacy & Character",speaker:"Kevin",type:"kevin",title:"Mental Side of Adversity",
    focus:"How you handle hard things mentally is the difference between people who make it and people who don't.",
    scripture:"James 1:2-4",
    verse:"Consider it pure joy whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance.",
    bigIdea:"Your mind gives up before your body does — almost every time. The mental rep is the most important rep you'll take.",
    teaching:[
      {point:"Your mind quits first",detail:"Science and experience agree: the body still has capacity when the mind says stop. Train your mind like you train your body."},
      {point:"Trials produce perseverance",detail:"Not comfort. Not ease. Perseverance. The hard things are building your capacity to endure."},
      {point:"Adversity is training",detail:"Treat it like it. Every hard day in the weight room, every difficult situation — it's a mental rep."},
    ],
    questions:[
      {q:"When adversity hits, what is your default mental response — and is that response helping or hurting you?",a:"Self-awareness. Name the pattern. Then challenge it."},
      {q:"What's the hardest mental battle you fight in your sport — and how do you fight it?",a:"Self-doubt. Fear of failure. Comparing yourself. Let them name it."},
      {q:"What would change if you treated every hard thing as a mental training rep?",a:"Reframe adversity. Change the story you tell yourself about difficulty."},
    ],
    deepQuestion:"Are you mentally tough — or do you just look mentally tough when things are going well?",
    takeaways:["Your mind quits before your body does.","The mental rep is the most important rep.","Adversity is training. Treat it like it."],
    color:GREEN,light:"#EAF3DE"},

  {week:10,series:3,seriesTitle:"Legacy & Character",speaker:"Athlete Testimony",type:"testimony",title:"Testimony Monday",
    focus:"Open volunteer. Two weeks left — who hasn't shared yet?",
    scripture:"2 Timothy 1:7",
    verse:"For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.",
    bigIdea:"You were not given a spirit of fear. Timidity is learned. It can be unlearned.",
    teaching:[
      {point:"Power, love, and self-discipline",detail:"These are the three things God's Spirit gives. Not timidity. Not fear. Power, love, and discipline."},
      {point:"Timidity is learned behavior",detail:"Nobody is born afraid to be honest. Fear of judgment is picked up along the way. It can be put down."},
      {point:"Sharing takes courage — and gives permission",detail:"When you share your story, you give someone else in the room permission to be brave."},
    ],
    questions:[
      {q:"What would you share if you knew nobody would judge you?",a:"The honest answer reveals what fear is still controlling."},
      {q:"Is there something God gave you — power, love, or discipline — that you haven't been using?",a:"Practical application of the verse. Where are you operating from timidity instead of power?"},
      {q:"Who in this room might need to hear your story before this summer ends?",a:"Two weeks left. Create urgency."},
    ],
    deepQuestion:"What are you still too afraid to say out loud — and what's the cost of staying silent?",
    takeaways:["God did not give you a spirit of fear.","Timidity is learned — and can be unlearned.","Your story gives someone else permission to be brave."],
    color:GREEN,light:"#EAF3DE"},

  {week:11,series:3,seriesTitle:"Legacy & Character",speaker:"Kevin",type:"kevin",title:"Who Are You When Nobody's Watching?",
    focus:"Your private character is your real character. What you do when nobody sees you is who you actually are.",
    scripture:"Proverbs 11:3",
    verse:"The integrity of the upright guides them, but the unfaithful are destroyed by their duplicity.",
    bigIdea:"The gap between your public self and private self is where character breaks down.",
    teaching:[
      {point:"Private character is real character",detail:"What you do when nobody is watching, grading, or filming — that's who you are."},
      {point:"Integrity guides you",detail:"When you have integrity, you don't have to think about every decision. Your character makes it for you."},
      {point:"Duplicity destroys",detail:"Living two lives — one public, one private — doesn't work. The gap always gets exposed eventually."},
    ],
    questions:[
      {q:"Is the person you are in private someone you're proud of — and if not, what needs to change?",a:"Direct. Let it land. Give silence."},
      {q:"Where is the biggest gap between who you are publicly and who you are privately?",a:"This is vulnerability. Create safety. Don't rush."},
      {q:"What would your closest friends say about your private character?",a:"Humbling question. The honest ones know the truth."},
    ],
    deepQuestion:"If there were cameras on everything you did this week — would you change anything? What does your answer say about your character?",
    takeaways:["Your private character is your real character.","Integrity makes decisions for you.","The gap between your public and private self is where character breaks down."],
    color:GREEN,light:"#EAF3DE"},

  {week:12,series:3,seriesTitle:"Legacy & Character",speaker:"Coach Ant",type:"coach",title:"Closing Week — Who Did You Become?",
    focus:"Final session. Coach Ant closes the summer. Reflection, challenge, send-off.",
    scripture:"Micah 6:8",
    verse:"He has shown you, O mortal, what is good. And what does the Lord require of you? To act justly and to love mercy and to walk humbly with your God.",
    bigIdea:"You came in as one person. Who are you leaving as? The work doesn't stop when this program does.",
    teaching:[
      {point:"Act justly",detail:"Do the right thing — even when it costs you. Even when nobody's watching. Especially then."},
      {point:"Love mercy",detail:"Extend to others what you've been given. You've received grace. Be generous with it."},
      {point:"Walk humbly",detail:"The goal was never to be the best in the room. It was to become someone who makes the room better."},
    ],
    questions:[
      {q:"Who did you become this summer — and how is that different from who you walked in as?",a:"Give extended time. This is the capstone moment. Let athletes reflect out loud."},
      {q:"What is the one thing this summer changed about you — and how will you make sure it lasts?",a:"A practice. A habit. A commitment. Something concrete."},
      {q:"Who in this room made you better — and have you told them?",a:"Gratitude moment. Let athletes speak it."},
    ],
    deepQuestion:"When this summer is over and people describe who you are — what do you want them to say?",
    takeaways:["Act justly. Love mercy. Walk humbly.","The work doesn't stop when this program does.","Iron sharpens iron — take that with you wherever you go."],
    color:GOLD,light:"#1f1700"},
];

function printHandout(week, typeColor) {
  const w = window.open("", "_blank");
  w.document.write(`<!DOCTYPE html><html><head><title>Mindset Monday — Week ${week.week}: ${week.title}</title>
  <style>
    body{font-family:Georgia,serif;max-width:680px;margin:40px auto;padding:0 24px;color:#1a1a1a;line-height:1.7;}
    h1{font-size:22px;font-weight:600;margin-bottom:4px;}
    .sub{font-size:13px;color:#666;margin-bottom:28px;}
    .scripture{background:#f5f5f5;border-left:3px solid #333;padding:14px 18px;margin-bottom:28px;font-style:italic;font-size:14px;}
    .ref{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;color:#333;}
    h3{font-size:13px;text-transform:uppercase;letter-spacing:0.06em;color:#666;margin:24px 0 12px;}
    .point{margin-bottom:8px;padding:10px 14px;background:#f9f9f9;border-radius:6px;font-size:14px;}
    .q-block{margin-bottom:20px;}
    .q{font-weight:600;font-size:14px;margin-bottom:24px;}
    .write-space{border-bottom:1px solid #ddd;height:20px;margin-bottom:8px;}
    .takeaway{display:flex;gap:12px;margin-bottom:10px;align-items:flex-start;}
    .num{width:24px;height:24px;border-radius:50%;background:#333;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex-shrink:0;margin-top:2px;}
    .deep{border:2px solid #333;border-radius:8px;padding:16px;margin:28px 0;font-style:italic;font-size:15px;}
    @media print{body{margin:20px auto;}}
  </style></head><body>
  <div class="ref">Mindset Monday — Week ${week.week} of 12 · ${week.seriesTitle}</div>
  <h1>${week.title}</h1>
  <div class="sub">Speaker: ${week.speaker} · ${week.scripture}</div>
  <div class="scripture"><div class="ref">${week.scripture}</div>"${week.verse}"</div>
  <h3>Big idea</h3>
  <p style="font-size:14px;margin-bottom:24px;">${week.bigIdea}</p>
  <h3>Teaching points</h3>
  ${week.teaching.map((t,i)=>`<div class="point"><strong>${i+1}. ${t.point}</strong></div>`).join("")}
  <h3>Discussion questions</h3>
  ${week.questions.map((q,i)=>`<div class="q-block"><div class="q">Q${i+1}. ${q.q}</div>${[1,2,3].map(()=>`<div class="write-space"></div>`).join("")}</div>`).join("")}
  <div class="deep">"${week.deepQuestion}"<div style="font-size:12px;color:#666;margin-top:8px;">Give space. Let it land. Don't rush past this one.</div></div>
  <h3>3 big takeaways</h3>
  ${week.takeaways.map((t,i)=>`<div class="takeaway"><div class="num">${i+1}</div><div style="font-size:14px;">${t}</div></div>`).join("")}
  </body></html>`);
  w.document.close();
  setTimeout(()=>w.print(), 500);
}

export default function MindsetMonday(){
  const[currentWeek,setCurrentWeek]=useState(1);
  const[view,setView]=useState("guide");
  const[expandedQ,setExpandedQ]=useState(null);
  const[notes,setNotes]=useState({});
  const[completedWeeks,setCompletedWeeks]=useState([]);

  const week=WEEKS[currentWeek-1];
  const noteKey="mm-week-"+currentWeek;
  const typeColor=week.type==="kevin"?PUR:week.type==="testimony"?GREEN:GOLD;
  const typeLabel=week.type==="kevin"?"Kevin — Guest Speaker":week.type==="testimony"?"Athlete Testimony":"Coach Ant";
  const typeBg=week.type==="kevin"?"#EEEDFE":week.type==="testimony"?"#EAF3DE":"#1f1700";
  const typeText=week.type==="coach"?"#fff":"#1a1a1a";

  function markComplete(){
    if(!completedWeeks.includes(currentWeek))setCompletedWeeks(p=>[...p,currentWeek]);
  }

  return(
    <div>
      {/* Header */}
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+PUR}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>Mindset Monday — 12 Weeks</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
          {[
            {label:"Current week",val:"Week "+currentWeek,color:typeColor,bg:"#f5f5f5"},
            {label:"Speaker",val:week.type==="kevin"?"Kevin":week.type==="testimony"?"Athlete":"Coach Ant",color:typeColor,bg:"#f5f5f5"},
            {label:"Completed",val:completedWeeks.length+"/12",color:GREEN,bg:"#EAF3DE"},
          ].map(s=>(
            <div key={s.label} style={{background:s.bg,borderRadius:10,padding:"10px",textAlign:"center",border:"0.5px solid #e0e0e0"}}>
              <div style={{fontSize:14,fontWeight:500,color:s.color}}>{s.val}</div>
              <div style={{fontSize:11,color:"#888",marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Series arc */}
        <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
          {SERIES_META.map(s=>(
            <div key={s.num} style={{fontSize:11,padding:"4px 10px",borderRadius:6,background:week.series===s.num?s.color:"#f5f5f5",color:week.series===s.num?"#fff":"#888",fontWeight:week.series===s.num?600:400}}>{s.title} · {s.weeks}</div>
          ))}
        </div>

        {/* Week selector */}
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
          {WEEKS.map(w=>{
            const tc=w.type==="kevin"?PUR:w.type==="testimony"?GREEN:GOLD;
            const isDone=completedWeeks.includes(w.week);
            const isActive=currentWeek===w.week;
            return(
              <button key={w.week} onClick={()=>{setCurrentWeek(w.week);setView("guide");setExpandedQ(null);}} style={{width:36,height:36,borderRadius:8,border:"0.5px solid "+(isActive?tc:tc+"44"),background:isActive?tc:"transparent",color:isActive?"#fff":tc,fontSize:11,fontWeight:isActive?600:400,cursor:"pointer",fontFamily:"Georgia,serif"}}>
                {isDone?"✓":w.week}
              </button>
            );
          })}
        </div>
      </div>

      {/* Week header */}
      <div style={{background:typeBg,borderRadius:12,padding:"1rem",marginBottom:12,border:"0.5px solid "+typeColor+"44"}}>
        <div style={{fontSize:11,color:typeColor,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>{typeLabel} · Week {week.week} of 12</div>
        <div style={{fontSize:18,fontWeight:600,color:week.type==="coach"?GOLD:typeColor,marginBottom:6}}>{week.title}</div>
        <div style={{fontSize:13,color:week.type==="coach"?"#aaa":"#555",lineHeight:1.7}}>{week.focus}</div>
      </div>

      {/* View tabs */}
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        {["guide","questions","takeaways"].map(v=>(
          <button key={v} onClick={()=>setView(v)} style={{flex:1,padding:"9px",borderRadius:8,border:"0.5px solid "+(view===v?typeColor:"#e0e0e0"),background:view===v?typeColor:"transparent",color:view===v?"#fff":"#888",fontSize:12,fontWeight:view===v?600:400,cursor:"pointer",fontFamily:"Georgia,serif",textTransform:"capitalize"}}>
            {v==="guide"?"Guide":v==="questions"?"Q&A":"Takeaways"}
          </button>
        ))}
      </div>

      {/* Guide view */}
      {view==="guide"&&(
        <div>
          {/* Scripture */}
          <div style={{background:BG,borderRadius:12,padding:"1rem 1.25rem",marginBottom:12,border:"0.5px solid "+typeColor+"55"}}>
            <div style={{fontSize:11,color:typeColor,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>{week.scripture}</div>
            <div style={{fontSize:14,color:"#fff",fontStyle:"italic",lineHeight:1.7}}>"{week.verse}"</div>
          </div>

          {/* Big idea */}
          <div style={{background:"#fff",borderRadius:12,padding:"1rem 1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
            <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>The big idea</div>
            <div style={{fontSize:14,color:"#1a1a1a",lineHeight:1.7,fontWeight:500}}>{week.bigIdea}</div>
          </div>

          {/* Teaching points */}
          <div style={{background:"#fff",borderRadius:12,padding:"1rem 1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0"}}>
            <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:10}}>Teaching points</div>
            {week.teaching.map((t,i)=>(
              <div key={i} style={{display:"flex",gap:10,padding:"10px 12px",borderRadius:8,background:"#f9f9f9",marginBottom:6,border:"0.5px solid #e0e0e0"}}>
                <div style={{width:24,height:24,borderRadius:"50%",background:typeColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:"#fff",flexShrink:0}}>{i+1}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:2}}>{t.point}</div>
                  <div style={{fontSize:12,color:"#666",lineHeight:1.6}}>{t.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Q&A view */}
      {view==="questions"&&(
        <div>
          <div style={{fontSize:11,fontWeight:500,color:"var(--color-text-secondary, #888)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:10}}>Discussion questions</div>
          {week.questions.map((q,i)=>(
            <div key={i} style={{marginBottom:8,borderRadius:10,border:"0.5px solid "+(expandedQ===i?typeColor:"#e0e0e0"),overflow:"hidden"}}>
              <button onClick={()=>setExpandedQ(expandedQ===i?null:i)} style={{width:"100%",padding:"12px 14px",background:expandedQ===i?typeBg:"#f9f9f9",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"Georgia,serif",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
                <span style={{fontSize:13,fontWeight:500,color:expandedQ===i?typeColor:"#1a1a1a"}}>Q{i+1}. {q.q}</span>
                <span style={{fontSize:12,color:typeColor,flexShrink:0}}>{expandedQ===i?"▲":"▼"}</span>
              </button>
              {expandedQ===i&&(
                <div style={{padding:"10px 14px",background:typeBg,borderTop:"0.5px solid "+typeColor+"33"}}>
                  <div style={{fontSize:11,fontWeight:500,color:typeColor,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:5}}>Guided answer</div>
                  <div style={{fontSize:13,color:week.type==="coach"?"#fff":"#1a1a1a",lineHeight:1.7}}>{q.a}</div>
                </div>
              )}
            </div>
          ))}

          {/* Deep question */}
          <div style={{background:BG,borderRadius:10,padding:"14px 16px",marginTop:14,border:"2px solid "+typeColor}}>
            <div style={{fontSize:11,fontWeight:500,color:typeColor,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>Deep heart question</div>
            <div style={{fontSize:15,color:"#fff",lineHeight:1.7,fontStyle:"italic"}}>"{week.deepQuestion}"</div>
            <div style={{fontSize:12,color:"#555",marginTop:6}}>Give space. Let it land. Don't rush past this one.</div>
          </div>
        </div>
      )}

      {/* Takeaways view */}
      {view==="takeaways"&&(
        <div>
          <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:10}}>3 big takeaways</div>
          {week.takeaways.map((t,i)=>(
            <div key={i} style={{display:"flex",gap:12,padding:"12px 14px",borderRadius:10,background:typeBg,marginBottom:8,border:"0.5px solid "+typeColor+"33"}}>
              <div style={{width:26,height:26,borderRadius:"50%",background:typeColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:500,color:"#fff",flexShrink:0}}>{i+1}</div>
              <div style={{fontSize:14,color:week.type==="coach"?"#fff":"#1a1a1a",lineHeight:1.6,fontWeight:500,alignSelf:"center"}}>{t}</div>
            </div>
          ))}
          {currentWeek>1&&(
            <div style={{background:"#f9f9f9",borderRadius:10,padding:"12px 14px",marginTop:12,border:"0.5px solid #e0e0e0"}}>
              <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:8}}>Series arc so far</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {WEEKS.slice(0,currentWeek-1).map(s=>{
                  const c=s.type==="kevin"?PUR:s.type==="testimony"?GREEN:GOLD;
                  return <span key={s.week} style={{fontSize:11,padding:"3px 10px",background:"#f5f5f5",color:c,borderRadius:6,fontWeight:500}}>W{s.week}: {s.title.split(" ")[0]}</span>;
                })}
                <span style={{fontSize:11,padding:"3px 10px",background:typeColor,color:"#fff",borderRadius:6,fontWeight:500}}>W{week.week}: {week.title.split(" ")[0]}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Coach notes */}
      <div style={{background:"#fff",border:"0.5px solid #e0e0e0",borderRadius:12,padding:"1rem 1.25rem",marginBottom:12,marginTop:12}}>
        <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Coach notes — Week {currentWeek}</div>
        <textarea value={notes[noteKey]||""} onChange={e=>setNotes(p=>({...p,[noteKey]:e.target.value}))} placeholder="What came up in discussion? What hit? Who opened up? What to follow up on?" style={{width:"100%",minHeight:80,padding:"8px",fontSize:13,border:"0.5px solid #e0e0e0",borderRadius:8,background:"#fafafa",color:"#1a1a1a",fontFamily:"Georgia,serif",resize:"vertical",boxSizing:"border-box"}}/>
      </div>

      {/* Mark complete + next */}
      <div style={{background:BG,borderRadius:12,padding:"1rem 1.25rem",marginBottom:12,border:"2px solid "+(completedWeeks.includes(currentWeek)?"#1E6B3A":typeColor)}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:13,fontWeight:500,color:completedWeeks.includes(currentWeek)?"#1E6B3A":"#fff",marginBottom:2}}>{completedWeeks.includes(currentWeek)?"Week complete ✓":"Mark this week complete"}</div>
            <div style={{fontSize:12,color:"#555"}}>{completedWeeks.includes(currentWeek)?(12-completedWeeks.length)+" weeks remaining":"Saves your notes and moves forward"}</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            {!completedWeeks.includes(currentWeek)&&(
              <button onClick={markComplete} style={{padding:"10px 20px",borderRadius:8,border:"none",background:typeColor,color:"#fff",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"Georgia,serif"}}>Complete Week {currentWeek} →</button>
            )}
            {currentWeek<12&&(
              <button onClick={()=>{setCurrentWeek(w=>w+1);setView("guide");setExpandedQ(null);}} style={{padding:"10px 20px",borderRadius:8,border:"0.5px solid "+typeColor,background:"transparent",color:typeColor,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"Georgia,serif"}}>Next →</button>
            )}
          </div>
        </div>
      </div>

      {/* Print handout */}
      <div style={{background:"#f9f9f9",borderRadius:12,padding:"1rem 1.25rem",border:"0.5px solid #e0e0e0"}}>
        <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>Student handout — Week {currentWeek}</div>
        <div style={{fontSize:12,color:"#888",marginBottom:10}}>Opens a clean print-ready page with scripture, discussion questions with writing space, and the 3 takeaways. Use Print → Save as PDF in your browser.</div>
        <button onClick={()=>printHandout(week,typeColor)} style={{padding:"10px 24px",borderRadius:8,border:"none",background:typeColor,color:"#fff",fontSize:14,fontWeight:500,cursor:"pointer",fontFamily:"Georgia,serif"}}>Print handout — Week {currentWeek} →</button>
      </div>
    </div>
  );
}
