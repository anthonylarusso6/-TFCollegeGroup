export default function VerseOfDay(){
  const VERSES=[
    {ref:"Proverbs 27:17",text:"As iron sharpens iron, so one person sharpens another."},
    {ref:"Philippians 4:13",text:"I can do all this through him who gives me strength."},
    {ref:"Joshua 1:9",text:"Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go."},
    {ref:"Isaiah 40:31",text:"But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint."},
    {ref:"Romans 8:28",text:"And we know that in all things God works for the good of those who love him, who have been called according to his purpose."},
    {ref:"Jeremiah 29:11",text:"For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future."},
    {ref:"2 Timothy 1:7",text:"For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline."},
    {ref:"Galatians 6:9",text:"Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up."},
    {ref:"Psalm 46:10",text:"He says, Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth."},
    {ref:"Matthew 6:33",text:"But seek first his kingdom and his righteousness, and all these things will be given to you as well."},
    {ref:"Micah 6:8",text:"He has shown you, O mortal, what is good. And what does the Lord require of you? To act justly and to love mercy and to walk humbly with your God."},
    {ref:"2 Corinthians 5:17",text:"If anyone is in Christ, the new creation has come: The old has gone, the new is here."},
    {ref:"Psalm 34:18",text:"The Lord is close to the brokenhearted and saves those who are crushed in spirit."},
    {ref:"James 1:2–4",text:"Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance. Let perseverance finish its work so that you may be mature and complete, not lacking anything."},
  ];
  const dayIdx=new Date().getDay()+Math.floor(new Date().getDate()/7);
  const verse=VERSES[dayIdx%VERSES.length];
  return(
    <div className="tfx ae ae-violet">
      <header className="ae-head">
        <div>
          <div className="tfx-eyebrow">Scripture</div>
          <h2>Verse of the day</h2>
        </div>
      </header>

      <section className="tfx-card ae-votd">
        <div className="tfx-eyebrow">Today</div>
        <p className="ae-quote">“{verse.text}”</p>
        <div className="ae-votd-rule" aria-hidden="true"/>
        <div className="ae-ref">{verse.ref}</div>
      </section>

      <section className="tfx-card ae-card">
        <div className="ae-sec">
          <div className="tfx-eyebrow">More scriptures</div>
        </div>
        <ul className="ae-more-list">
          {VERSES.filter((_,i)=>i!==dayIdx%VERSES.length).slice(0,6).map((v,i)=>(
            <li key={i}>
              <span className="ae-ref">{v.ref}</span>
              <p className="ae-quote">“{v.text}”</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ── Anvil History ───────────────────────────────────────────────
