import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

const BG="#0f0f0f";
const PUR="#534AB7";
const RED="#C0392B";
const GREEN="#1E6B3A";
const GOLD="#D4AF37";
const STEEL="#708090";
const ORANGE="#E8720C";

export default function VerseOfDay(){
  const VERSES=[
    {ref:"Proverbs 27:17",text:"As iron sharpens iron, so one person sharpens another."},
    {ref:"Philippians 4:13",text:"I can do all this through him who gives me strength."},
    {ref:"Joshua 1:9",text:"Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go."},
    {ref:"Isaiah 40:31",text:"Those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary."},
    {ref:"Romans 8:28",text:"And we know that in all things God works for the good of those who love him, who have been called according to his purpose."},
    {ref:"Jeremiah 29:11",text:"For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future."},
    {ref:"2 Timothy 1:7",text:"For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline."},
    {ref:"Galatians 6:9",text:"Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up."},
    {ref:"Psalm 46:10",text:"He says, Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth."},
    {ref:"Matthew 6:33",text:"But seek first his kingdom and his righteousness, and all these things will be given to you as well."},
    {ref:"Micah 6:8",text:"Act justly, love mercy, and walk humbly with your God."},
    {ref:"2 Corinthians 5:17",text:"If anyone is in Christ, the new creation has come: The old has gone, the new is here."},
    {ref:"Psalm 34:18",text:"The Lord is close to the brokenhearted and saves those who are crushed in spirit."},
    {ref:"James 1:2-4",text:"Consider it pure joy whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance."},
  ];
  const dayIdx=new Date().getDay()+Math.floor(new Date().getDate()/7);
  const verse=VERSES[dayIdx%VERSES.length];
  const PUR="#534AB7",BG="#0f0f0f";
  return(
    <div>
      <div style={{background:BG,borderRadius:12,padding:"2rem",marginBottom:12,border:"0.5px solid "+PUR+"44",textAlign:"center"}}>
        <div style={{fontSize:11,color:PUR,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:16}}>Verse of the Day</div>
        <div style={{fontSize:16,color:"#fff",fontStyle:"italic",lineHeight:1.8,marginBottom:16}}>"{verse.text}"</div>
        <div style={{fontSize:13,fontWeight:500,color:PUR}}>{verse.ref}</div>
      </div>
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>More scriptures</div>
        {VERSES.filter((_,i)=>i!==dayIdx%VERSES.length).slice(0,6).map((v,i)=>(
          <div key={i} style={{padding:"10px 0",borderBottom:i<5?"0.5px solid #f0f0f0":"none"}}>
            <div style={{fontSize:11,fontWeight:500,color:PUR,marginBottom:3}}>{v.ref}</div>
            <div style={{fontSize:12,color:"#555",fontStyle:"italic",lineHeight:1.6}}>"{v.text}"</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Anvil History ───────────────────────────────────────────────
