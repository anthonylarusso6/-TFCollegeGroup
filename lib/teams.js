// Shared team/draft domain helpers — single source of truth so Draft, TeamsView
// and the athlete view all agree (previously each file had its own copy and they
// had drifted, notably the bracelet `ref` strings used as the stored identifier).

export const getTier = (idx, n) => {
  if (n <= 2) return idx === 0 ? 1 : 2;
  if (n === 3) return idx < 2 ? 1 : 2;
  if (n === 4) return idx < 2 ? 1 : idx === 2 ? 2 : 3;
  return idx < 2 ? 1 : idx < 4 ? 2 : 3;
};

// `ref` is the identifier persisted to athletes.bracelet and matched on display —
// keep it stable.
export const BRACELETS = [
  {color:"Dark Blue",   ref:"1 John 3:1",   text:"See what great love the Father has lavished on us, that we should be called children of God!",hex:"#1A3A6B"},
  {color:"Baby Blue",   ref:"1 Pet 5:7",    text:"Cast all your anxiety on him because he cares for you.",hex:"#5BAFD6"},
  {color:"Light Orange",ref:"Prov 3:5",     text:"Trust in the Lord with all your heart and lean not on your own understanding.",hex:"#F5A033"},
  {color:"Dark Orange", ref:"Ps 46:10",     text:"Be still, and know that I am God.",hex:"#CC4A0A"},
  {color:"Dark Pink",   ref:"1 Cor 13:13",  text:"And now these three remain: faith, hope and love. But the greatest of these is love.",hex:"#C2185B"},
  {color:"Dark Red",    ref:"Phil 4:13",    text:"I can do all this through him who gives me strength.",hex:"#8E1515"},
  {color:"Teal",        ref:"Jer 29:11",    text:"Plans to prosper you and not to harm you, plans to give you hope and a future.",hex:"#007B7B"},
  {color:"Purple",      ref:"Matt 11:28",   text:"Come to me, all you who are weary and burdened, and I will give you rest.",hex:"#6B2FA0"},
  {color:"Yellow",      ref:"Gen 1:3",      text:"And God said, Let there be light, and there was light.",hex:"#D4B800"},
  {color:"Light Purple",ref:"John 14:6",    text:"I am the way and the truth and the life.",hex:"#9B5FC0"},
  {color:"Green",       ref:"Josh 1:9",     text:"Be strong and courageous. Do not be afraid; do not be discouraged.",hex:"#1E7A34"},
  {color:"Olive Green", ref:"Ps 27:1",      text:"The Lord is my light and my salvation — whom shall I fear?",hex:"#5C6B1A"},
];

// One gender check used everywhere (case-insensitive; anything not female reads as male).
export const isFemale = (g) => {
  const v = (g || "").toLowerCase();
  return v === "female" || v === "f" || v === "woman";
};
