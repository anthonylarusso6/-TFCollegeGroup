export default function BraceletWall({athleteBracelet}){
  const BRACELETS_LIST=[
    {ref:"1 John 3:1",   color:"Dark Blue",    hex:"#1A3A6B", text:"See what great love the Father has lavished on us, that we should be called children of God! And that is what we are!"},
    {ref:"1 Pet 5:7",    color:"Baby Blue",    hex:"#5BAFD6", text:"Cast all your anxiety on him because he cares for you."},
    {ref:"Prov 3:5",     color:"Light Orange", hex:"#F5A033", text:"Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight."},
    {ref:"Ps 46:10",     color:"Dark Orange",  hex:"#CC4A0A", text:"He says, Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth."},
    {ref:"1 Cor 13:13",  color:"Dark Pink",    hex:"#C2185B", text:"And now these three remain: faith, hope and love. But the greatest of these is love."},
    {ref:"Phil 4:13",    color:"Dark Red",     hex:"#8E1515", text:"I can do all this through him who gives me strength."},
    {ref:"Jer 29:11",    color:"Teal",         hex:"#007B7B", text:"For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future."},
    {ref:"Matt 11:28",   color:"Purple",       hex:"#6B2FA0", text:"Come to me, all you who are weary and burdened, and I will give you rest."},
    {ref:"Gen 1:3",      color:"Yellow",       hex:"#D4B800", text:"And God said, Let there be light, and there was light."},
    {ref:"John 14:6",    color:"Light Purple", hex:"#9B5FC0", text:"Jesus answered, I am the way and the truth and the life. No one comes to the Father except through me."},
    {ref:"Josh 1:9",     color:"Green",        hex:"#1E7A34", text:"Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go."},
    {ref:"Ps 27:1",      color:"Olive Green",  hex:"#5C6B1A", text:"The Lord is my light and my salvation — whom shall I fear? The Lord is the stronghold of my life — of whom shall I be afraid?"},
  ];
  const mine=BRACELETS_LIST.find(b=>b.ref===athleteBracelet);
  return(
    <div className="tfx ae ae-violet">
      <header className="ae-head">
        <div>
          <div className="tfx-eyebrow">Scripture</div>
          <h2>Bracelet wall</h2>
          <p>All 12 bracelets — one scripture for the group.</p>
        </div>
      </header>

      {mine&&(
        <section className="tfx-card ae-mine" style={{"--c":mine.hex}}>
          <div className="ae-mine-top">
            <span className="ae-dot" aria-hidden="true"/>
            <div className="tfx-eyebrow">Your bracelet</div>
          </div>
          <p className="ae-quote">“{mine.text}”</p>
          <div className="ae-mine-foot">
            <b>{mine.color}</b>
            <span>{mine.ref}</span>
          </div>
        </section>
      )}

      <section className="tfx-card ae-card">
        <div className="ae-sec">
          <div className="tfx-eyebrow">All bracelets</div>
          <span className="tfx-num">{BRACELETS_LIST.length}</span>
        </div>
        <ul className="ae-br-list">
          {BRACELETS_LIST.map((b,i)=>{
            const isMe=athleteBracelet===b.ref;
            return(
              <li key={i} className={"ae-br"+(isMe?" is-me":"")} style={{"--c":b.hex}}>
                <div className="ae-br-top">
                  <span className="ae-dot" aria-hidden="true"/>
                  <b>{b.color}</b>
                  {isMe&&<span className="ae-pill">yours</span>}
                  <span className="ae-br-ref">{b.ref}</span>
                </div>
                <p className="ae-quote">“{b.text}”</p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
