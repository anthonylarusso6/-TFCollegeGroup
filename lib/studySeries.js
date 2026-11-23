// Winter 2026 teaching series (Dec 10, 2026 – Jan 10, 2027).
// Used by the coach Fellowship Friday / Mindset Monday tabs and the athlete
// Study Notes tab. Scripture is NIV, matching the summer series.

export const WINTER_LABEL = "Winter 2026";

// ─── FELLOWSHIP FRIDAY · Bible study ─────────────────────────────────────────
// One chapter of James per Friday: five weeks for a five-chapter letter.
export const FF_WINTER_META = [
  { num: 1, title: "Faith That Works", sub: "A study of James", weeks: "Weeks 1–5" },
];

export const FF_WINTER = [
  {
    week: 1, series: 1, seriesTitle: "Faith That Works", date: "Fri, Dec 11", title: "Pressure Is a Teacher",
    scripture: "James 1:2–4, 22",
    verse: "Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance. Let perseverance finish its work so that you may be mature and complete, not lacking anything. … Do not merely listen to the word, and so deceive yourselves. Do what it says.",
    bigIdea: "Trials aren't interruptions to your growth. They are the training. And faith that only listens, but never does, isn't faith that works.",
    teaching: [
      { ref: "v2", point: "Joy is a decision, not a feeling", detail: "James doesn't say trials feel good. He says consider them joy, because of what they build. Athletes already live this: the hard set is where the strength comes from." },
      { ref: "v3", point: "Testing produces perseverance", detail: "You don't get endurance by reading about it. Your faith gets stronger the same way your body does: under load, over time." },
      { ref: "v4", point: "Let it finish its work", detail: "The temptation is to quit the hard thing halfway. Maturity comes from staying in it until it's done, not from escaping early." },
      { ref: "v22", point: "Hearers vs doers", detail: "Listening to a sermon and doing nothing with it is like watching film and never practicing. James calls that self-deception." },
    ],
    questions: [
      { q: "What trial are you in right now: sport, school, family, faith?", a: "Let athletes name it out loud. Naming it takes away some of its power. No fixing yet, just listening." },
      { q: "Why does James say to 'consider it joy' instead of 'feel joy'?", a: "Considering is a choice of perspective. You can't always control the feeling, but you can choose what you believe the trial is doing in you." },
      { q: "Where have you seen pressure make you better, on the field or off it?", a: "Two-a-days, a tough coach, an injury comeback. Connect what they already know athletically to what God does spiritually." },
      { q: "What does it look like to quit a trial early?", a: "Numbing out, blaming others, transferring, giving minimum effort. Shortcuts that skip the growth." },
      { q: "What is one thing you've heard from God lately that you haven't done yet?", a: "Push gently for specifics. A phone call to make, a habit to start, an apology to give." },
    ],
    deepQuestion: "If God is using your current trial to build something in you, what do you think He's building?",
    takeaways: ["Pressure is a teacher. Don't skip the lesson.", "Perseverance only grows when you let it finish its work.", "Hearing the word without doing it is self-deception."],
    color: "#8a6d3b", light: "#f6efe3",
  },
  {
    week: 2, series: 1, seriesTitle: "Faith That Works", date: "Fri, Dec 18", title: "Faith You Can See",
    scripture: "James 2:14–18",
    verse: "What good is it, my brothers and sisters, if someone claims to have faith but has no deeds? Can such faith save them? Suppose a brother or a sister is without clothes and daily food. If one of you says to them, 'Go in peace; keep warm and well fed,' but does nothing about their physical needs, what good is it? In the same way, faith by itself, if it is not accompanied by action, is dead. But someone will say, 'You have faith; I have deeds.' Show me your faith without deeds, and I will show you my faith by my deeds.",
    bigIdea: "Real faith shows up. Not to earn God's love, but because God's love, once it's real in you, always moves outward toward people.",
    teaching: [
      { ref: "v14", point: "Claiming isn't the same as having", detail: "Anyone can say they have faith. James asks the harder question: what does your faith actually do?" },
      { ref: "v15–16", point: "Nice words, empty hands", detail: "'Stay warm' without a coat is useless. Encouragement matters, but sometimes love has to show up in a ride, a meal, or your time." },
      { ref: "v17", point: "Faith without action is dead", detail: "Not weak. Dead. A faith that never changes how you treat people isn't alive." },
      { ref: "v18", point: "Show me", detail: "Your teammates may never hear you talk about Jesus, but they will see how you treat the walk-on, the trainer, and the guy who just lost his spot." },
    ],
    questions: [
      { q: "Is James saying we're saved by what we do?", a: "No. We're saved by grace through faith (Ephesians 2:8–9). James is saying real faith always produces action. Works are the evidence, not the price." },
      { q: "Who on your team or in your life is 'without clothes and daily food' in some way?", a: "Lonely, cut, injured, homesick, struggling academically. Needs aren't always physical." },
      { q: "When have nice words been easier for you than real help?", a: "Texting 'praying for you' versus actually checking in. Be honest; everyone does this." },
      { q: "What would your teammates say your faith looks like, based only on what they see?", a: "Hard question. Let it sit. The goal isn't guilt, it's awareness." },
      { q: "With everyone home for the holidays, where can your faith show up this week?", a: "Family, old friends, a church, someone at home who's struggling. Make it practical and specific." },
    ],
    deepQuestion: "If faith had to be proven only by your actions this past month, what would the evidence say?",
    takeaways: ["Faith that's real always moves toward people.", "Good words are not a substitute for good deeds.", "Your team reads your faith by what you do."],
    color: "#8a6d3b", light: "#f6efe3",
  },
  {
    week: 3, series: 1, seriesTitle: "Faith That Works", date: "Fri, Dec 25 (Christmas)", title: "Words That Steer",
    scripture: "James 3:3–5, 9–10",
    verse: "When we put bits into the mouths of horses to make them obey us, we can turn the whole animal. Or take ships as an example. Although they are so large and are driven by strong winds, they are steered by a very small rudder wherever the pilot wants to go. Likewise, the tongue is a small part of the body, but it makes great boasts. … With the tongue we praise our Lord and Father, and with it we curse human beings, who have been made in God's likeness. Out of the same mouth come praise and cursing. My brothers and sisters, this should not be.",
    bigIdea: "Your words are small, but they steer everything: your locker room, your relationships, your own mind. Control the rudder and you control the direction.",
    teaching: [
      { ref: "v3", point: "Small things turn big things", detail: "A bit turns a horse. A rudder turns a ship. One comment can turn a team's mood, a game, or someone's whole week." },
      { ref: "v4–5", point: "Words set direction", detail: "What you say about yourself ('I always choke', 'I'm not a leader') steers where you go. Self-talk is a rudder too." },
      { ref: "v9", point: "Made in God's likeness", detail: "Every teammate, opponent, ref, and coach carries the image of God. Trash talk and gossip aren't harmless; they curse what God made." },
      { ref: "v10", point: "This should not be", detail: "Worship on Sunday and tearing people down on Monday don't fit. James calls us to one consistent mouth." },
    ],
    questions: [
      { q: "Think of one sentence someone said to you that changed your direction, good or bad. What was it?", a: "Words stick for years. Let athletes see how much power a few words carry." },
      { q: "What's the culture of talk on your team: encouragement, sarcasm, gossip, trash talk?", a: "Be honest about the locker room. Ask what one person could change." },
      { q: "What do you say to yourself after a mistake?", a: "Self-talk is steering too. Practice replacing 'I'm trash' with 'Next play. Fix it.'" },
      { q: "Why is it so easy to praise God and still tear people down?", a: "We compartmentalize. James says the same mouth should be consistent because the same God made both." },
      { q: "On Christmas, what words does someone in your family need to hear from you?", a: "Thank you, I'm sorry, I'm proud of you, I love you. Encourage them to actually say it today." },
    ],
    deepQuestion: "If your words were the rudder of your life this year, where did they steer you, and where do you want them to steer next?",
    takeaways: ["Small words steer big things.", "Every person you talk about is made in God's likeness.", "Change your words and you change your direction."],
    color: "#8a6d3b", light: "#f6efe3",
  },
  {
    week: 4, series: 1, seriesTitle: "Faith That Works", date: "Fri, Jan 1 (New Year's Day)", title: "If the Lord Wills",
    scripture: "James 4:8, 10, 13–15",
    verse: "Come near to God and he will come near to you. … Humble yourselves before the Lord, and he will lift you up. … Now listen, you who say, 'Today or tomorrow we will go to this or that city, spend a year there, carry on business and make money.' Why, you do not even know what will happen tomorrow. What is your life? You are a mist that appears for a little while and then vanishes. Instead, you ought to say, 'If it is the Lord's will, we will live and do this or that.'",
    bigIdea: "Make plans. Set goals. But hold them with open hands. The year belongs to God, and the closer you stay to Him, the steadier you are when plans change.",
    teaching: [
      { ref: "v8", point: "Nearness is a two-way promise", detail: "Come near to God and He comes near to you. Goals start with where you are with God, not just what you want to achieve." },
      { ref: "v10", point: "Humble first, lifted later", detail: "Humility isn't thinking less of yourself. It's knowing who's in charge. God does the lifting; you do the humbling." },
      { ref: "v13–14", point: "You don't know tomorrow", detail: "Injuries, coaching changes, depth charts, family news. Athletes know better than anyone how fast plans change." },
      { ref: "v15", point: "'If the Lord wills' is a posture", detail: "It's not a phrase to tack on. It's working hard on your plan while trusting God with the outcome." },
    ],
    questions: [
      { q: "What are your goals for this year: athletic, academic, spiritual?", a: "Have each athlete name one in each area. Write them down; they'll look back at these." },
      { q: "Is it wrong to make big plans?", a: "No. James's problem is arrogance, not planning. Plan hard and hold it humbly." },
      { q: "When has a plan of yours fallen apart? What did God do with it?", a: "Look for stories where the 'ruined' plan led somewhere better. Most athletes have one." },
      { q: "What does 'coming near to God' look like on a normal day for a college athlete?", a: "Ten minutes in scripture before practice. Prayer on the walk to class. Church on Sunday when you're tired. Small and repeated." },
      { q: "Which of your goals are you holding too tightly?", a: "The one that would wreck you if it didn't happen. That's the one to hand over." },
    ],
    deepQuestion: "If this year doesn't go the way you planned, what do you want to still be true about you and God?",
    takeaways: ["Plan hard. Hold it humbly.", "Come near to God and He comes near to you.", "Your life is a mist. Spend it on what lasts."],
    color: "#8a6d3b", light: "#f6efe3",
  },
  {
    week: 5, series: 1, seriesTitle: "Faith That Works", date: "Fri, Jan 8", title: "Stand Firm, Pray Hard",
    scripture: "James 5:7–8, 16",
    verse: "Be patient, then, brothers and sisters, until the Lord's coming. See how the farmer waits for the land to yield its valuable crop, patiently waiting for the autumn and spring rains. You too, be patient and stand firm, because the Lord's coming is near. … Therefore confess your sins to each other and pray for each other so that you may be healed. The prayer of a righteous person is powerful and effective.",
    bigIdea: "Before you head back to campus: be patient like a farmer, stand firm like an athlete, and don't go alone. Confess, pray, and carry each other.",
    teaching: [
      { ref: "v7", point: "The farmer's patience", detail: "A farmer works hard, then waits. You can't rush a harvest, a PR, or spiritual growth. Do the work and trust the season." },
      { ref: "v8", point: "Stand firm", detail: "Spring semester brings pressure: practice, classes, parties, playing time. Decide now what you won't move on." },
      { ref: "v16a", point: "Confess to each other", detail: "Hidden struggles grow in the dark. Healing starts when you tell a trusted brother or sister the truth." },
      { ref: "v16b", point: "Prayer is powerful and effective", detail: "Not a last resort. James calls it powerful. Praying for a teammate is one of the strongest things you can do for them." },
    ],
    questions: [
      { q: "What are you waiting on God for right now?", a: "A breakthrough, healing, playing time, clarity. Validate the waiting; it's real." },
      { q: "What does 'standing firm' need to look like for you when you get back to campus?", a: "Specific commitments: a church, a Bible plan, friends who push you up, things you won't do." },
      { q: "Why is confessing to each other so hard?", a: "Pride, fear, shame. But secrecy is where struggles grow. Ask: who is your one person?" },
      { q: "Who will you pray for by name this semester?", a: "Have each athlete pick one person in this room and one on their college team." },
      { q: "What did God do in you during this break?", a: "Close the series by naming growth. Let a few athletes share." },
    ],
    deepQuestion: "Who is the one person who will know the truth about how you're really doing this semester, and have you told them yet?",
    takeaways: ["Do the work, then wait like a farmer.", "Decide now what you'll stand firm on.", "Don't go back alone: confess, pray, and carry each other."],
    color: "#8a6d3b", light: "#f6efe3",
  },
];

// ─── MINDSET MONDAY ──────────────────────────────────────────────────────────
// Four Mondays over the break. Speaker types match the summer rotation.
export const MM_WINTER_META = [
  { num: 1, title: "The Break Is the Test", sub: "Winter series", weeks: "Weeks 1–4" },
];

export const MM_WINTER = [
  {
    week: 1, series: 1, seriesTitle: "The Break Is the Test", date: "Mon, Dec 14", speaker: "Coach Ant", type: "coach", title: "Your Standard Travels With You",
    focus: "No coaches, no schedule, no team watching. Winter break shows who you are when the structure disappears.",
    scripture: "Colossians 3:23",
    verse: "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.",
    bigIdea: "If your discipline only exists when a coach is watching, it isn't yours yet. Bring your standard home with you.",
    teaching: [
      { point: "Breaks separate athletes", detail: "Everyone works hard in season. The ones who come back better are the ones who kept a standard when nobody required it." },
      { point: "Work for the Lord, not the coach", detail: "Colossians 3:23 changes your audience. You're not grinding for a depth chart; you're honoring God with the body and gifts He gave you." },
      { point: "Structure is a choice", detail: "Set your own schedule: wake-up time, training days, sleep, scripture. Discipline you choose is stronger than discipline that's imposed." },
    ],
    questions: [
      { q: "What usually happens to your habits over a break?", a: "Be honest: late nights, bad food, no training, no Bible. Name the pattern so we can break it." },
      { q: "What's one standard you'll keep every day of this break, no matter what?", a: "Make it small and specific: training Mon/Tue/Thu/Fri here, 8 hours of sleep, 10 minutes of scripture." },
      { q: "How does working 'for the Lord' change how you train when nobody's watching?", a: "It removes the need for an audience. God sees the early mornings no one else does." },
    ],
    deepQuestion: "When you walk back into your college facility in January, what do you want your coach to notice without you saying a word?",
    takeaways: ["Your standard has to travel with you.", "Work for an audience of One.", "Choose your own structure before the break chooses for you."],
    color: "#9c7c3a", light: "#f6efe3",
  },
  {
    week: 2, series: 1, seriesTitle: "The Break Is the Test", date: "Mon, Dec 21", speaker: "Athlete Testimony", type: "testimony", title: "Testimony Monday: New Every Morning",
    focus: "An athlete shares a comeback: a setback, a slump, or a season they almost quit, and how they got back up. Coach Ant opens and sets the tone.",
    scripture: "Lamentations 3:22–23",
    verse: "Because of the Lord's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.",
    bigIdea: "Every morning is a fresh start. Your worst game, your worst semester, your worst decision: none of them get the final word.",
    teaching: [
      { point: "Comebacks start with honesty", detail: "You can't come back from something you won't admit happened. The story starts with naming the low point." },
      { point: "Mercy is new every morning", detail: "God's compassion doesn't run out after your third mistake. Each day is a real reset, not a reluctant second chance." },
      { point: "Your comeback is someone else's hope", detail: "Someone in this room is in the middle of their low point. Your story tells them it isn't the end." },
    ],
    questions: [
      { q: "What setback in your life still feels like it has the final word?", a: "Create a safe, private moment. Remind the room: what's said here stays here." },
      { q: "What helped you get back up the last time you were knocked down?", a: "People, faith, a coach, a habit. Help athletes see their own resilience." },
      { q: "Who in your life needs to hear that it's not over for them?", a: "Encourage them to reach out this week, over the holidays, while they're home." },
    ],
    deepQuestion: "If God's mercy is truly new every morning, what would you stop carrying into tomorrow?",
    takeaways: ["Your setback doesn't get the final word.", "God's mercy is new every morning, including tomorrow.", "Your comeback story is someone else's hope."],
    color: "#4f7a5c", light: "#e8f1ea",
  },
  {
    week: 3, series: 1, seriesTitle: "The Break Is the Test", date: "Mon, Dec 28", speaker: "Kevin", type: "kevin", title: "Rest Is Part of the Work",
    focus: "Between Christmas and New Year's: the difference between real rest that rebuilds you and drifting that just wastes time.",
    scripture: "Mark 6:31",
    verse: "Then, because so many people were coming and going that they did not even have a chance to eat, he said to them, 'Come with me by yourselves to a quiet place and get some rest.'",
    bigIdea: "Jesus invited His team to rest. Recovery is training, but rest and drift aren't the same thing.",
    teaching: [
      { point: "Jesus prescribed rest", detail: "After a heavy stretch of ministry, Jesus pulled His disciples away on purpose. Rest isn't weakness; it's part of the plan." },
      { point: "Rest restores; drift drains", detail: "Sleep, quiet, time with God and family restore you. Endless scrolling, late nights and zero routine leave you more tired than before." },
      { point: "Recovery is where gains happen", detail: "Muscles grow during recovery, not during the lift. Your mind and spirit work the same way." },
    ],
    questions: [
      { q: "Do you feel more rested or more drained after most of your 'free time'?", a: "Be honest about phones, sleep and late nights. Rest should leave you better." },
      { q: "What does a truly restful day look like for you?", a: "Help athletes design one: sleep, movement, people, quiet, scripture, a phone limit." },
      { q: "Why do athletes feel guilty about resting?", a: "We tie worth to output. Remind them rest is obedience: God built it into creation." },
    ],
    deepQuestion: "What are you running from when you can't sit still, and what might God say to you in the quiet?",
    takeaways: ["Rest is part of the work.", "Rest restores. Drift drains.", "Go to a quiet place with God before the noise starts again."],
    color: "#6a5f9e", light: "#eeedf7",
  },
  {
    week: 4, series: 1, seriesTitle: "The Break Is the Test", date: "Mon, Jan 4", speaker: "Coach Ant", type: "coach", title: "Who Goes Back to Campus?",
    focus: "The last Monday before everyone heads back. Close the break, set spring commitments, and send them out.",
    scripture: "Philippians 3:13–14",
    verse: "Brothers and sisters, I do not consider myself yet to have taken hold of it. But one thing I do: Forgetting what is behind and straining toward what is ahead, I press on toward the goal to win the prize for which God has called me heavenward in Christ Jesus.",
    bigIdea: "You're not going back as the same person who came home. Forget what's behind, strain forward, and press on.",
    teaching: [
      { point: "Forget what's behind", detail: "Last season's stats, mistakes and labels stay here. You don't have to drag fall semester into spring." },
      { point: "Strain toward what's ahead", detail: "Straining is effort. Spring will take intentional choices: who you eat with, when you study, where you go to church." },
      { point: "Press on toward the right prize", detail: "Paul's goal wasn't a trophy. Chase excellence in your sport, but keep the upward call of God as the real prize." },
    ],
    questions: [
      { q: "What are you leaving behind from last semester?", a: "A habit, a relationship, a mindset, a reputation. Say it out loud." },
      { q: "What are your three commitments for spring semester?", a: "One athletic, one academic, one spiritual. Write them in the Goals tab today." },
      { q: "Who back on campus will help you press on, and who will pull you back?", a: "Friendships decide direction. Name your people on both sides." },
    ],
    deepQuestion: "Who is the person going back to campus next week, and how is that person different from who came home in December?",
    takeaways: ["Leave last semester behind.", "Straining forward takes daily choices.", "Press on toward the prize that lasts."],
    color: "#9c7c3a", light: "#f6efe3",
  },
];

// Short versions for the athlete Study Notes tab.
const brief = (w, takeaway) => ({ week: w.week, title: w.title, scripture: w.scripture, verse: w.verse.split(" … ")[0], takeaway, color: w.color, date: w.date });
export const MM_WINTER_NOTES = MM_WINTER.map((w) => brief(w, w.takeaways[0]));
export const FF_WINTER_NOTES = FF_WINTER.map((w) => brief(w, w.takeaways[0]));
