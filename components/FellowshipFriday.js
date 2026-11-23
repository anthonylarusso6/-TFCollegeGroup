import { useState, useEffect } from "react";
import { BG, PUR, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { FF_WINTER, FF_WINTER_META, WINTER_LABEL } from "../lib/studySeries";

const BLUE="#1A4F8A";
const TEAL="#0F6E56";

const SERIES_META=[
  {num:1,title:"Leading by Example",color:RED,light:"#FCEBEB",weeks:"Weeks 1–4"},
  {num:2,title:"Built Different",color:BLUE,light:"#E6F1FB",weeks:"Weeks 5–8"},
  {num:3,title:"Roots and Fruit",color:TEAL,light:"#E1F5EE",weeks:"Weeks 9–12"},
];

const SERIES=[
  {week:1,series:1,seriesTitle:"Leading by Example",title:"The Leader Nobody Sees",scripture:"Matthew 6:1–4",
    verse:"Be careful not to practice your righteousness in front of others to be seen by them. If you do, you will have no reward from your Father in heaven. So when you give to the needy, do not announce it with trumpets, as the hypocrites do in the synagogues and on the streets, to be honored by others. Truly I tell you, they have received their reward in full. But when you give to the needy, do not let your left hand know what your right hand is doing, so that your giving may be in secret. Then your Father, who sees what is done in secret, will reward you.",
    bigIdea:"Who you are in private is who you are as a leader. The most powerful leadership happens when nobody is watching.",
    teaching:[
      {ref:"v1",point:"Don't perform for people",detail:"Leadership done for applause isn't leadership — it's performance. God sees through it and so does your team eventually."},
      {ref:"v2",point:"The crowd won't reward you the way God does",detail:"People's approval is temporary. A reputation built on private integrity lasts."},
      {ref:"v3-4",point:"Let your left hand not know your right",detail:"When your leadership is quiet, consistent, and unconcerned with credit — that's when it becomes real."},
      {ref:"v4",point:"God sees what is done in secret",detail:"Nothing you do in private is invisible to God. The unseen moments build your real character."},
    ],
    questions:[
      {q:"Why is private integrity more important than public performance?",a:"Because your team will eventually see who you really are. Leaders who perform publicly but fail privately always get exposed."},
      {q:"What does it look like to lead when nobody is watching?",a:"Being the first one in and last one out. Doing your reps when nobody counts them. Encouraging a teammate when no coach is around."},
      {q:"Why do we crave recognition for the things we do?",a:"Because we're wired for approval. When approval becomes the motivation, we make decisions based on what people see instead of what's right."},
      {q:"Think about a leader you respect. What do they do that most people never see?",a:"Usually it's the small things — showing up early, checking on people, staying after. The unseen habits."},
      {q:"What is one thing you could start doing privately that would make you a better leader publicly?",a:"More prayer. More preparation. More honesty in hard conversations. More encouragement when no one is watching."},
    ],
    deepQuestion:"If nobody ever found out about the things you do in private — would you still do them?",
    takeaways:["Real leadership is built in private before it shows up in public.","God rewards what is done in secret — not what is performed for a crowd.","The leader nobody sees is the leader everybody needs."],
    color:RED,light:"#FCEBEB"},
  {week:2,series:1,seriesTitle:"Leading by Example",title:"Leading Under Pressure",scripture:"Daniel 3:16–18",
    verse:"Shadrach, Meshach and Abednego replied to him, 'King Nebuchadnezzar, we do not need to defend ourselves before you in this matter. If we are thrown into the blazing furnace, the God we serve is able to deliver us from it, and he will deliver us from Your Majesty's hand. But even if he does not, we want you to know, Your Majesty, that we will not serve your gods or worship the image of gold you have set up.'",
    bigIdea:"Pressure reveals your real leadership. When everything is on the line, your character either holds or it doesn't.",
    teaching:[
      {ref:"v16",point:"No defense needed",detail:"They didn't panic or beg. Calm under pressure is a leadership superpower."},
      {ref:"v17",point:"God is able",detail:"Their confidence wasn't in their circumstances — it was in their God."},
      {ref:"v18",point:"But even if He does not",detail:"They were willing to obey God even if it cost them everything. That is unshakeable leadership."},
    ],
    questions:[
      {q:"What kind of pressure do college athletes face that tests their leadership?",a:"Playing time battles. Coaches who question you. Teammates who challenge your decisions. Academic and social pressure to compromise."},
      {q:"What did Shadrach, Meshach, and Abednego do differently than most people would?",a:"They didn't negotiate their convictions. They stood firm at full cost."},
      {q:"What does 'but even if he does not' mean for your life right now?",a:"I will do the right thing even if I don't get the outcome I want. I will lead well even if nobody follows."},
      {q:"When pressure hits, what usually makes people compromise?",a:"Fear of missing out. Fear of rejection. Comfort being more important than conviction."},
      {q:"What situation in your life right now requires you to say 'but even if he does not'?",a:"Give space for athletes to answer honestly."},
    ],
    deepQuestion:"Is your leadership conditional — only strong when things go your way? Or is it built on something that fire can't burn?",
    takeaways:["Pressure doesn't build character — it reveals it.","'But even if he does not' is one of the most powerful statements of faith in the Bible.","The leader who won't bend under pressure is the leader people trust when it matters most."],
    color:RED,light:"#FCEBEB"},
  {week:3,series:1,seriesTitle:"Leading by Example",title:"The Servant Leader",scripture:"Mark 10:42–45",
    verse:"Jesus called them together and said, 'You know that those who are regarded as rulers of the Gentiles lord it over them, and their high officials exercise authority over them. Not so with you. Instead, whoever wants to become great among you must be your servant, and whoever wants to be first must be slave of all. For even the Son of Man did not come to be served, but to serve, and to give his life as a ransom for many.'",
    bigIdea:"The world's version of leadership is about rank and power. God's version is about service and sacrifice.",
    teaching:[
      {ref:"v42",point:"The world's leadership model",detail:"Power, position, authority. This is the model most people grow up seeing."},
      {ref:"v43-44",point:"Not so with you",detail:"Jesus flips the entire model. Greatness is redefined. It's about how well you serve those around you."},
      {ref:"v45",point:"Jesus as the example",detail:"The Son of God came not to be served but to serve. If the greatest leader chose service — what does that say about how we should lead?"},
    ],
    questions:[
      {q:"What's the difference between leading because of your position and leading because of your service?",a:"Position-based leadership creates compliance. Service-based leadership creates loyalty."},
      {q:"What does servant leadership look like in a weight room or on a team?",a:"Helping someone with their form. Staying after to encourage someone struggling. Not taking the best equipment or easiest drill."},
      {q:"Why is servant leadership actually harder than authority-based leadership?",a:"It requires humility. It means doing things that don't get credit. It's easier to command than it is to serve."},
      {q:"Who in your life has modeled servant leadership for you?",a:"Give space for athletes to share."},
      {q:"As a leader this week — are you serving your group or leading over them?",a:"Real question. Let it sit."},
    ],
    deepQuestion:"When you think about your leadership — are you asking 'how can I be served?' or 'how can I serve?' Be honest.",
    takeaways:["The greatest leader who ever lived came to serve — not to be served.","Servant leadership creates loyalty that authority never can.","You don't lead people by standing over them. You lead them by kneeling beside them."],
    color:RED,light:"#FCEBEB"},
  {week:4,series:1,seriesTitle:"Leading by Example",title:"Your Example Has a Name",scripture:"1 Timothy 4:12",
    verse:"Don't let anyone look down on you because you are young, but set an example for the believers in speech, in conduct, in love, in faith and in purity.",
    bigIdea:"You are someone's reason to believe it's possible. Your example is not just about you — it has a name, a face, and a future attached to it.",
    teaching:[
      {ref:"v12a",point:"Don't let anyone look down on your youth",detail:"Age is not an excuse. God uses young people. Your stage of life does not disqualify your leadership."},
      {ref:"v12b",point:"Set an example in speech",detail:"How you talk reveals your heart. Words build up or tear down."},
      {ref:"v12c",point:"Set an example in conduct",detail:"How you carry yourself when nobody is grading you."},
      {ref:"v12d",point:"Set an example in love, faith, and purity",detail:"The deepest parts of your character — not just on the surface."},
    ],
    questions:[
      {q:"Who is watching your example right now — even if you don't know it?",a:"A younger sibling. A teammate questioning their faith. Someone watching how you handle failure. Your example always has an audience."},
      {q:"What does it mean to set an example in speech?",a:"Not just avoiding bad language — choosing words that build. Being honest. Speaking life into people."},
      {q:"Why does Paul specifically mention youth?",a:"Because young people often discount their own influence. Your age is not the issue — your example is."},
      {q:"In which area do you need the most growth — speech, conduct, love, faith, or purity?",a:"Give space for honest answers."},
      {q:"What is one person whose life could be impacted by your example this week?",a:"Let athletes put a real name to it."},
    ],
    deepQuestion:"If someone younger than you followed your exact example for one year — where would they end up?",
    takeaways:["Your example always has an audience — even when you think no one is watching.","Youth is not a disqualifier. It's an opportunity.","You are someone's reason to believe it's possible. Lead like it."],
    color:RED,light:"#FCEBEB"},
  {week:5,series:2,seriesTitle:"Built Different",title:"Set Apart, Not Separated",scripture:"John 17:14–16",
    verse:"I have given them your word and the world has hated them, for they are not of the world any more than I am of the world. My prayer is not that you take them out of the world but that you protect them from the evil one.",
    bigIdea:"Being set apart doesn't mean hiding from the world — it means going into it without being consumed by it.",
    teaching:[
      {ref:"v14",point:"The world will resist you",detail:"When you live differently, expect friction. That's not a sign you're doing something wrong — it's a sign you're doing something right."},
      {ref:"v15",point:"Jesus doesn't pray you out of the world",detail:"He prays you through it. God's answer to a broken world is not removal — it's protection and purpose."},
      {ref:"v16",point:"Not of the world",detail:"Your identity, values, and source — none of that comes from the world. You belong to something and someone higher."},
    ],
    questions:[
      {q:"What does it look like practically to be 'in the world but not of it' as a college athlete?",a:"Going to parties without losing your values. Being on social media without being shaped by it. Competing hard without making your worth come from performance."},
      {q:"What does the world offer that looks good but isn't?",a:"Temporary approval. Fame without foundation. Success without purpose. Pleasure without peace."},
      {q:"Why does Jesus pray for protection rather than removal?",a:"Because the world needs people inside it who are different. Salt has to be in the food to do anything. Light has to be in the dark to matter."},
      {q:"What pressures in college life make it hardest to stay set apart?",a:"Wanting to fit in. Fear of being seen as different. The constant noise of social media. The party culture."},
      {q:"How do you stay grounded in who God says you are when everything around you is trying to redefine you?",a:"Staying rooted in scripture. Community with people who believe what you believe. Remembering who you belong to before you walk into any room."},
    ],
    deepQuestion:"When you walk into a room — do you change the atmosphere, or does the atmosphere change you?",
    takeaways:["Set apart doesn't mean separated. You are sent into the world, not removed from it.","God's plan is not to take you out of hard places — it's to protect and use you in them.","Your difference is not a weakness. It's your greatest weapon."],
    color:BLUE,light:"#E6F1FB"},
  {week:6,series:2,seriesTitle:"Built Different",title:"Don't Conform",scripture:"Romans 12:2",
    verse:"Do not conform to the pattern of this world, but be transformed by the renewing of your mind. Then you will be able to test and approve what God's will is — his good, pleasing and perfect will.",
    bigIdea:"The world has a mold it wants to pour you into. God has a transformation He wants to work from the inside out.",
    teaching:[
      {ref:"v2a",point:"Do not conform",detail:"Conform means to be pressed into a shape from the outside. The world is always pressing — through media, culture, comparison, and expectation."},
      {ref:"v2b",point:"Be transformed",detail:"Transformation works from the inside out. It's not willpower — it's a renewed mind."},
      {ref:"v2c",point:"Renewing of your mind",detail:"You renew your mind through what you feed it. Scripture. Prayer. Truth."},
      {ref:"v2d",point:"Then you will know God's will",detail:"A renewed mind gains clarity. When you stop letting the world define what's good — you start seeing what God says is good."},
    ],
    questions:[
      {q:"What does it mean to be conformed to the pattern of this world?",a:"Living by the world's definition of success and worth. Making decisions based on what everyone else is doing instead of what's right."},
      {q:"Where do you feel the most pressure to conform right now?",a:"Social media. Team culture. What people think of your faith. How you dress, talk, or act to fit in."},
      {q:"What does renewing your mind actually look like day to day?",a:"Reading scripture before you check your phone. Praying before making decisions. Replacing negative self-talk with what God says about you."},
      {q:"Why is the mind the battlefield?",a:"Because everything starts as a thought before it becomes an action. The enemy knows if he can control your thinking he controls your life."},
      {q:"What is one thing you are currently feeding your mind that is conforming you rather than transforming you?",a:"Social media, toxic relationships, content that contradicts their values."},
    ],
    deepQuestion:"What is shaping your thinking more right now — the word of God or the world around you?",
    takeaways:["The world is always pressing you into its mold. Resisting it is a daily choice.","Transformation starts in the mind. What you feed your mind shapes the person you become.","A renewed mind sees clearly what a conformed mind cannot."],
    color:BLUE,light:"#E6F1FB"},
  {week:7,series:2,seriesTitle:"Built Different",title:"Staying Righteous in a Crooked World",scripture:"Proverbs 11:3 & Psalm 1:1–3",
    verse:"The integrity of the upright guides them, but the crookedness of the treacherous destroys them. Blessed is the one who does not walk in step with the wicked or stand in the way that sinners take or sit in the company of mockers, but whose delight is in the law of the Lord, and who meditates on his law day and night. That person is like a tree planted by streams of water, which yields its fruit in season and whose leaf does not wither — whatever they do prospers.",
    bigIdea:"Righteousness is not perfection — it's direction. Staying true in a crooked world means knowing which way you're pointed.",
    teaching:[
      {ref:"Prov 11:3",point:"Integrity is a guide",detail:"When you don't know what to do — your integrity tells you. It's an internal compass."},
      {ref:"Ps 1:1",point:"Watch your walk, your stand, and your seat",detail:"Three progressive stages — walking with, standing with, sitting with. You don't fall into wrong company overnight. It's a gradual drift."},
      {ref:"Ps 1:2",point:"Delight in God's word",detail:"Delight is not discipline — it's desire. When you genuinely love God's word, it protects you from the drift."},
      {ref:"Ps 1:3",point:"Like a tree by water",detail:"Rooted. Fruitful. Unaffected by drought. This is the picture of a person who stays righteous."},
    ],
    questions:[
      {q:"What does a crooked world look like in the life of a college athlete?",a:"Pressure to cheat. Culture that celebrates shortcuts. Relationships that pull you from your values."},
      {q:"What is the difference between integrity and reputation?",a:"Reputation is what people think you are. Integrity is what you actually are."},
      {q:"How does the drift happen — walk, stand, sit?",a:"You start just hanging around. Then you start agreeing. Then you start participating."},
      {q:"What does it mean practically to delight in God's word?",a:"Not just reading it out of obligation but actually wanting to. Finding life in it."},
      {q:"What environments or habits are pulling you toward the drift right now?",a:"Give space for honest personal answers."},
    ],
    deepQuestion:"Where are you in the progression — walking, standing, or sitting with what you know is pulling you away from who God called you to be?",
    takeaways:["Righteousness is not perfection — it's direction. Know which way you're pointed.","The drift starts slow. Walk, stand, sit. Guard the first step.","A tree planted by water doesn't fear drought. Plant yourself in the right place."],
    color:BLUE,light:"#E6F1FB"},
  {week:8,series:2,seriesTitle:"Built Different",title:"Who God Called You to Be",scripture:"Jeremiah 1:5 & Ephesians 2:10",
    verse:"Before I formed you in the womb I knew you, before you were born I set you apart; I appointed you as a prophet to the nations. For we are God's handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do.",
    bigIdea:"You were not an accident. God knew you, named you, and called you before you had any idea who you were.",
    teaching:[
      {ref:"Jer 1:5a",point:"Known before formed",detail:"Before your parents named you. Before your sport. Before your failures. God knew you."},
      {ref:"Jer 1:5b",point:"Set apart",detail:"Not random. Not accidental. Intentionally set apart. Your uniqueness is not a mistake — it's a design."},
      {ref:"Eph 2:10a",point:"God's handiwork — masterpiece",detail:"You are not mass produced. You are crafted. There is no one else exactly like you."},
      {ref:"Eph 2:10b",point:"Works prepared in advance",detail:"God didn't just make you — He made work for you. Purpose pre-exists your awareness of it."},
    ],
    questions:[
      {q:"Why do people struggle to believe they were made on purpose with a purpose?",a:"Because failure feels like evidence against it. Because comparison makes them feel lesser."},
      {q:"What does it mean that God knew you before you were formed?",a:"Your identity is not defined by what you've done or what's been done to you."},
      {q:"How does knowing your identity in God change how you handle pressure and comparison?",a:"It gives you a reference point that doesn't move. When you fail, you know it doesn't define you."},
      {q:"What voices have told you who you are that don't line up with what God says?",a:"Coaches who cut you. Relationships that broke you. Your own inner critic."},
      {q:"What might God be calling you to specifically in this season?",a:"To lead. To speak up. To stay faithful. To be the example someone else needs."},
    ],
    deepQuestion:"If you fully believed what God says about who you are — how would you live differently starting tomorrow?",
    takeaways:["You were known before you were formed. Your identity starts with God, not your performance.","You are God's masterpiece — crafted, not mass produced. One of one.","Purpose pre-exists your awareness of it. You were made for something specific. Walk in it."],
    color:BLUE,light:"#E6F1FB"},
  {week:9,series:3,seriesTitle:"Roots and Fruit",title:"Where Are Your Roots?",scripture:"Jeremiah 17:7–8",
    verse:"But blessed is the one who trusts in the Lord, whose confidence is in him. They will be like a tree planted by the water that sends out its roots by the stream. It does not fear when heat comes; its leaves are always green. It has no worries in a year of drought and never fails to bear fruit.",
    bigIdea:"What you are rooted in determines what comes out of you when pressure hits.",
    teaching:[
      {ref:"v7",point:"Trust and confidence in God",detail:"Rootedness starts with where your confidence actually lives — not where you say it is, but where it actually is."},
      {ref:"v8a",point:"Planted by water",detail:"The tree doesn't find water by accident — it was planted there intentionally. Where you plant yourself determines everything."},
      {ref:"v8b",point:"No fear when heat comes",detail:"Heat is coming. That's not a maybe. The question is whether your roots are deep enough to survive it."},
      {ref:"v8c",point:"Never fails to bear fruit",detail:"A rooted tree doesn't have to try to produce fruit. It's the natural result of being in the right place."},
    ],
    questions:[
      {q:"What does it mean to be rooted as an athlete?",a:"Knowing who you are when your performance fails. Having peace when your playing time drops."},
      {q:"What are some things athletes commonly root their identity in?",a:"Their sport. Stats. Coaches' approval. Social media. Relationships. All of these can be taken away."},
      {q:"What's the difference between looking healthy and being rooted?",a:"You can look fine in good weather. Drought is the test. Shallow roots wilt fast when pressure comes."},
      {q:"What does planting yourself by the water look like practically?",a:"Daily prayer. Consistent time in scripture. Accountability. Being intentional about what you feed your spirit."},
      {q:"What areas of your life reveal that your roots might be shallow right now?",a:"Anxiety about playing time. Identity that rises and falls with performance."},
    ],
    deepQuestion:"When the heat comes — and it will — what will your roots reveal about where you've been planted?",
    takeaways:["What you're rooted in is revealed by pressure, not by comfort.","You can look fine on the surface while being completely unrooted underneath.","A tree planted by water never fails to bear fruit — even in drought."],
    color:TEAL,light:"#E1F5EE"},
  {week:10,series:3,seriesTitle:"Roots and Fruit",title:"When the Storm Hits",scripture:"James 1:2–4 & Romans 5:3–5",
    verse:"Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance. Let perseverance finish its work so that you may be mature and complete, not lacking anything. Not only so, but we also glory in our sufferings, because we know that suffering produces perseverance; perseverance, character; and character, hope. And hope does not put us to shame, because God's love has been poured out into our hearts through the Holy Spirit, who has been given to us.",
    bigIdea:"Hardship is not the enemy — it is the teacher. The storm does not come to destroy you. It comes to develop you.",
    teaching:[
      {ref:"James 1:2",point:"Count it joy — not because it's easy",detail:"Joy and happiness are different. Joy is a choice rooted in knowing what God is doing through the hard thing."},
      {ref:"James 1:3",point:"Testing produces perseverance",detail:"You cannot develop perseverance without something to persevere through. The trial is the training ground."},
      {ref:"James 1:4",point:"Let perseverance finish its work",detail:"Don't cut the process short. Maturity requires the full process."},
      {ref:"Rom 5:3-5",point:"Suffering → perseverance → character → hope",detail:"God has a chain reaction built into hardship. Skip the suffering and you miss the character."},
    ],
    questions:[
      {q:"Why does James say to count it joy when facing trials?",a:"Not because the trial is pleasant — but because of what it produces."},
      {q:"What's the difference between going through a storm and growing through a storm?",a:"Going through just means surviving. Growing through means coming out different."},
      {q:"What hardships have you faced that you now see were developing you?",a:"Give space for athletes to share. Injuries. Losses. Being overlooked."},
      {q:"How does suffering produce hope? That seems backwards.",a:"When you survive something hard, you have evidence you can make it. That's hope with a testimony behind it."},
      {q:"What storm are you in right now that God might be using to develop something in you?",a:"Give space for honest personal answers. Handle with care."},
    ],
    deepQuestion:"What if the hardest thing you're going through right now is not punishment — but preparation?",
    takeaways:["Hardship is not the enemy. It is the teacher. The storm comes to develop you, not destroy you.","Suffering → Perseverance → Character → Hope. Don't skip the process.","Every storm you survive gives you evidence for the next one. That's how hope grows roots."],
    color:TEAL,light:"#E1F5EE"},
  {week:11,series:3,seriesTitle:"Roots and Fruit",title:"Fruit That Lasts",scripture:"John 15:16 & Galatians 5:22–23",
    verse:"You did not choose me, but I chose you and appointed you so that you might go and bear fruit — fruit that will last — and so that whatever you ask in my name the Father will give you. But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control. Against such things there is no law.",
    bigIdea:"What are you actually producing in people's lives? Trophies fade. Stats get forgotten. But the fruit you bear in people lasts forever.",
    teaching:[
      {ref:"John 15:16",point:"Chosen and appointed to bear fruit",detail:"This is not passive. You were selected and sent. God has a specific harvest He wants to produce through your life."},
      {ref:"John 15:16b",point:"Fruit that will last",detail:"Not fruit for a season — fruit that lasts. What you invest in people goes further than you'll ever know."},
      {ref:"Gal 5:22-23",point:"The fruit of the Spirit",detail:"Love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, self-control. These grow naturally when you are rooted in the Spirit."},
    ],
    questions:[
      {q:"What's the difference between fruit that lasts and fruit that fades?",a:"Accomplishments fade. But the way you made someone feel, the belief you gave them — that lasts."},
      {q:"What does it mean that you were 'chosen and appointed' to bear fruit?",a:"Your impact is not an accident. The people around you are not random."},
      {q:"Which fruit of the Spirit is hardest for you to produce right now?",a:"Give space for honest answers. Self-control and patience are most common."},
      {q:"Who in your life has produced lasting fruit in you?",a:"A coach. A parent. A mentor. What they did that stuck."},
      {q:"What fruit are you currently producing in the people around you?",a:"Are you producing encouragement or discouragement?"},
    ],
    deepQuestion:"When your time in this program is over — what will people say you produced in them?",
    takeaways:["Trophies fade. Stats get forgotten. But fruit you bear in people lasts forever.","You were chosen and appointed — your impact is not accidental.","The fruit of the Spirit grows naturally when you are rooted in the right place."],
    color:TEAL,light:"#E1F5EE"},
  {week:12,series:3,seriesTitle:"Roots and Fruit",title:"Finish Rooted",scripture:"Hebrews 12:1–2 & Micah 6:8",
    verse:"Therefore, since we are surrounded by such a great cloud of witnesses, let us throw off everything that hinders and the sin that so easily entangles. And let us run with perseverance the race marked out for us, fixing our eyes on Jesus, the pioneer and perfecter of faith. For the joy set before him he endured the cross, scorning its shame, and sat down at the right hand of the throne of God. He has shown you, O mortal, what is good. And what does the Lord require of you? To act justly and to love mercy and to walk humbly with your God.",
    bigIdea:"Finishing strong is not just athletic — it's spiritual. Staying true to yourself and to God when the world offers shortcuts requires roots that go deep.",
    teaching:[
      {ref:"Heb 12:1",point:"Throw off what hinders",detail:"Not just sin — but weight. Things that aren't necessarily wrong but are slowing you down."},
      {ref:"Heb 12:1b",point:"Run with perseverance",detail:"The race is marked out — God has a specific path for you. The call is to run it with endurance."},
      {ref:"Heb 12:2",point:"Fix your eyes on Jesus",detail:"Where you look determines where you go. Keep your eyes on Jesus — the one who started your faith and will complete it."},
      {ref:"Mic 6:8",point:"Act justly, love mercy, walk humbly",detail:"Three things. Simple. Profound. This is what righteous, rooted living looks like day to day."},
    ],
    questions:[
      {q:"What does it mean to finish this program — and this season — rooted?",a:"Not just physically stronger but spiritually grounded. Knowing who you are more clearly than when you came in."},
      {q:"What weights do you need to throw off to finish strong?",a:"Pride. Comparison. A relationship dragging you. A habit slowing your growth. Fear. Comfort. Name it."},
      {q:"What does 'fix your eyes on Jesus' look like in the final weeks of this program?",a:"Not getting distracted by who's performing better. Staying committed to faith, character, and community."},
      {q:"Of justice, mercy, and humility — which do you need to grow in most?",a:"Justice means treating people fairly. Mercy means grace even when people don't deserve it. Humility means staying small before God."},
      {q:"What do you want to be different about you when you walk out of this program?",a:"Let every athlete answer this. This is the closing question of the summer. Make it count."},
    ],
    deepQuestion:"When this is all over — will the roots you grew this summer hold you through everything that comes next?",
    takeaways:["Finishing strong is not just athletic — it's spiritual. Root yourself deep enough to finish well.","Throw off the weight. Fix your eyes. Run your race — not someone else's.","Act justly. Love mercy. Walk humbly. That's not a complicated life — it's a rooted one."],
    color:TEAL,light:"#E1F5EE"},
];

// On-screen series tones (theme tokens). The handout keeps the print colors above.
const TONE={1:"var(--red)",2:"var(--sky)",3:"var(--teal)"};

// Each season keeps its own weeks, notes and progress on this device.
const SEASONS={
  winter:{label:WINTER_LABEL,sub:"A study of James · 5 weeks",weeks:FF_WINTER,meta:FF_WINTER_META,tone:{1:"var(--gold)"},store:"ff_w26_"},
  summer:{label:"Summer 2026",sub:"Summer series · 12 weeks",weeks:SERIES,meta:SERIES_META,tone:TONE,store:"ff_"},
};

export default function FellowshipFriday(){
  const[season,setSeason]=useState("winter");
  const picker=(
    <div className="ir-seg cf-season" role="tablist" aria-label="Series season">
      {Object.entries(SEASONS).map(([k,v])=>(
        <button key={k} role="tab" aria-selected={season===k} className={season===k?"is-on":""} onClick={()=>setSeason(k)}>{v.label}</button>
      ))}
    </div>
  );
  return <FellowshipSeason key={season} cfg={SEASONS[season]} picker={picker}/>;
}

function FellowshipSeason({cfg,picker}){
  const SERIES=cfg.weeks, SERIES_META=cfg.meta, TONE=cfg.tone, TOTAL=cfg.weeks.length;
  const[currentWeek,setCurrentWeek]=useState(1);
  const[view,setView]=useState("guide");
  const[expandedQ,setExpandedQ]=useState(null);
  const[notes,setNotes]=useState(()=>{
    try{const s=localStorage.getItem(cfg.store+"notes");return s?JSON.parse(s):{};}catch{return {};}
  });
  const[completedWeeks,setCompletedWeeks]=useState(()=>{
    try{const s=localStorage.getItem(cfg.store+"completed");return s?JSON.parse(s):[];}catch{return [];}
  });
  const[showHandout,setShowHandout]=useState(false);

  useEffect(()=>{try{localStorage.setItem(cfg.store+"notes",JSON.stringify(notes));}catch{};},[notes]);
  useEffect(()=>{try{localStorage.setItem(cfg.store+"completed",JSON.stringify(completedWeeks));}catch{};},[completedWeeks]);

  const week=SERIES[currentWeek-1];
  const noteKey="week-"+currentWeek;
  const currentSeries=SERIES_META[week.series-1];

  const markComplete=()=>{
    if(!completedWeeks.includes(currentWeek))
      setCompletedWeeks(p=>[...p,currentWeek]);
  };

  const blankLines=(n)=>Array(n).fill(null).map((_,i)=>(
    <div key={i} className="cf-paper-line"/>
  ));

  const isDone=completedWeeks.includes(currentWeek);

  return(
    <div className="tfx cf cf-faith cf-ff" style={{"--tone":TONE[week.series]}}>
      {/* Handout modal */}
      {showHandout&&(
        <div className="cf-scrim" role="dialog" aria-modal="true" aria-label={"Student handout — Week "+currentWeek}>
          <div className="cf-paper" style={{"--hue":week.color}}>
            <button className="cf-paper-x" onClick={()=>setShowHandout(false)} aria-label="Close handout">✕</button>
            <div className="cf-paper-eyebrow">TF College Group · Fellowship Friday · {week.seriesTitle}</div>
            <h1>Week {currentWeek}: {week.title}</h1>
            <div className="cf-paper-ref">{week.scripture}</div>
            <blockquote className="cf-paper-verse">"{week.verse}"</blockquote>
            <div className="cf-paper-eyebrow">Discussion Questions</div>
            {week.questions.map((q,i)=>(
              <div key={i} className="cf-paper-q">
                <b>Q{i+1}. {q.q}</b>
                {blankLines(3)}
              </div>
            ))}
            <div className="cf-paper-deep">
              <div className="cf-paper-eyebrow is-hue">Deep Heart Question</div>
              <p>"{week.deepQuestion}"</p>
              {blankLines(4)}
            </div>
            <div className="cf-paper-eyebrow">3 Big Takeaways</div>
            {week.takeaways.map((t,i)=>(
              <div key={i} className="cf-paper-take">
                <span>{i+1}</span>
                <p>{t}</p>
              </div>
            ))}
            <div className="cf-paper-foot">TF College Group · Proverbs 27:17 — Iron sharpens iron</div>
            <div className="cf-paper-tip">To save as PDF: <strong>File → Print → Save as PDF</strong></div>
          </div>
        </div>
      )}

      {/* Header + series / week picker */}
      <section className="tfx-card cf-head">
        <div className="cf-head-top">
          <div>
            <div className="tfx-eyebrow">Faith</div>
            <h2>Fellowship Friday</h2>
            <p>{cfg.sub}</p>
          </div>
          <span className={"cf-pill "+(completedWeeks.length>0?"is-green":"is-muted")}><b className="tfx-num">{completedWeeks.length}/{TOTAL}</b> complete</span>
        </div>
        {picker}

        <div className="cf-series" role="group" aria-label="Series and weeks">
          {SERIES_META.map(s=>{
            const on=currentSeries.num===s.num;
            return(
              <div key={s.num} className={"cf-srow"+(on?" is-on":"")} style={{"--tone":TONE[s.num]}}>
                <button className="cf-slabel is-btn tfx-press" aria-pressed={on} onClick={()=>{setCurrentWeek((SERIES.find(w=>w.series===s.num)||SERIES[0]).week);setView("guide");setExpandedQ(null);}}>
                  <i className="cf-sdot" aria-hidden="true"/>
                  <span><b>{s.title}</b><small>{s.weeks}</small></span>
                </button>
                <div className="cf-wks">
                  {SERIES.filter(w=>w.series===s.num).map(w=>{
                    const done=completedWeeks.includes(w.week);
                    const act=currentWeek===w.week;
                    return(
                      <button key={w.week} className={"cf-wk tfx-press tfx-num"+(act?" is-on":"")+(done?" is-done":"")} aria-current={act?"true":undefined} aria-label={"Week "+w.week+(done?", complete":"")} onClick={()=>{setCurrentWeek(w.week);setView("guide");setExpandedQ(null);}}>
                        {done?"✓":w.week}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* This week */}
      <section className="tfx-card cf-wcard">
        <div className="cf-wcard-top">
          <div className="tfx-eyebrow">{week.seriesTitle} · Week {week.week}{week.date?" · "+week.date:""}</div>
          {isDone&&<span className="cf-pill is-green">Complete</span>}
        </div>
        <h2 className="cf-title">{week.title}</h2>
        <figure className="cf-verse">
          <figcaption>{week.scripture}</figcaption>
          <blockquote>"{week.verse}"</blockquote>
        </figure>
      </section>

      {/* Big idea */}
      <section className="tfx-card cf-idea">
        <div className="tfx-eyebrow">Big idea</div>
        <p>{week.bigIdea}</p>
      </section>

      {/* Sub tabs */}
      <div className="ir-seg cf-seg" role="tablist" aria-label="Week content">
        {["guide","questions","takeaways"].map(v=>(
          <button key={v} role="tab" aria-selected={view===v} className={"tfx-press"+(view===v?" is-on":"")} onClick={()=>setView(v)}>
            {v==="guide"?"Teaching guide":v==="questions"?"Discussion":"Takeaways"}
          </button>
        ))}
      </div>

      {/* Content */}
      <section className="tfx-card cf-body">
        {view==="guide"&&(
          <ol className="cf-points">
            {week.teaching.map((t,i)=>(
              <li key={i}>
                <span className="cf-ref">{t.ref}</span>
                <div>
                  <b>{t.point}</b>
                  <p>{t.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        )}

        {view==="questions"&&(
          <>
            <ul className="cf-qs">
              {week.questions.map((q,i)=>{
                const open=expandedQ===i;
                return(
                  <li key={i} className={open?"is-open":""}>
                    <button className="cf-q" aria-expanded={open} onClick={()=>setExpandedQ(expandedQ===i?null:i)}>
                      <span className="cf-qn tfx-num">Q{i+1}</span>
                      <span className="cf-qt">{q.q}</span>
                      <span className="cf-chev" aria-hidden="true">▾</span>
                    </button>
                    {open&&(
                      <div className="cf-a">
                        <div className="tfx-eyebrow">Guided answer</div>
                        <p>{q.a}</p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="cf-deep">
              <div className="tfx-eyebrow">Deep heart question</div>
              <p>"{week.deepQuestion}"</p>
              <small>Give space. Let it land. Don't rush past this one.</small>
            </div>
          </>
        )}

        {view==="takeaways"&&(
          <ol className="cf-takes">
            {week.takeaways.map((t,i)=>(
              <li key={i}>
                <span className="tfx-num">{i+1}</span>
                <p>{t}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Coach notes */}
      <section className="tfx-card cf-card cf-notes">
        <label className="tfx-eyebrow" htmlFor="cf-ff-notes">Coach notes — Week {currentWeek}</label>
        <textarea id="cf-ff-notes" className="tfx-field cf-ta" value={notes[noteKey]||""} onChange={e=>setNotes(p=>({...p,[noteKey]:e.target.value}))} placeholder="What came up? Who opened up? What to follow up on?" rows={5}/>
        <small className="cf-hint">Saved on this device as you type.</small>
      </section>

      {/* Mark complete + handout */}
      <div className="cf-acts">
        <button className={"tfx-btn tfx-press cf-primary"+(isDone?" is-done":"")} onClick={markComplete} disabled={isDone}>
          {isDone?"Week complete ✓":"Mark complete →"}
        </button>
        <button className="tfx-btn-ghost tfx-press" onClick={()=>setShowHandout(true)}>
          Student handout →
        </button>
        {currentWeek<TOTAL&&(
          <button className="tfx-btn-ghost tfx-press" onClick={()=>{setCurrentWeek(w=>w+1);setView("guide");setExpandedQ(null);}}>
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
