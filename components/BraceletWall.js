import { useState, useEffect, useRef } from "react";
import { BG, PUR, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { supabase } from "../lib/supabase";


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
  return(
    <div>
      <div style={{background:"#0f0f0f",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #333"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#fff",marginBottom:4}}>📿 Bracelet Wall</div>
        <div style={{fontSize:12,color:"#888"}}>All 12 bracelets — one scripture for the group.</div>
      </div>
      {BRACELETS_LIST.map((b,i)=>{
        const isMe=athleteBracelet===b.ref;
        return(
          <div key={i} style={{background:isMe?b.hex+"14":"rgba(255,255,255,0.04)",borderRadius:12,padding:"1rem",marginBottom:8,border:"1px solid "+(isMe?b.hex+"55":"rgba(255,255,255,0.07)"),borderLeft:"4px solid "+b.hex}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:b.hex,boxShadow:"0 0 8px "+b.hex+"88"}}/>
                <span style={{fontSize:12,fontWeight:600,color:b.hex}}>{b.color}</span>
                {isMe&&<span style={{fontSize:10,background:b.hex,color:"#fff",padding:"1px 6px",borderRadius:4,fontWeight:700}}>yours</span>}
              </div>
              <span style={{fontSize:11,color:"#555"}}>{b.ref}</span>
            </div>
            <div style={{fontSize:13,color:"#ccc",fontStyle:"italic",lineHeight:1.6}}>&#x201C;{b.text}&#x201D;</div>
          </div>
        );
      })}
    </div>
  );
}
