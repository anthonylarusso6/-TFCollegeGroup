import { useState, useEffect, useRef } from "react";
import { BG, PUR, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { supabase } from "../lib/supabase";


export default function BraceletWall({athleteBracelet}){
  const BRACELETS_LIST=[
    {ref:"Prov 3:5-6",color:"Cobalt Blue",hex:"#1A4F8A",text:"Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight."},
    {ref:"Phil 4:13",color:"Forest Green",hex:"#0F6E56",text:"I can do all this through him who gives me strength."},
    {ref:"Josh 1:9",color:"Crimson Red",hex:"#C0392B",text:"Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go."},
    {ref:"Isa 40:31",color:"Royal Purple",hex:"#534AB7",text:"Those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint."},
    {ref:"Rom 8:28",color:"Burnt Orange",hex:"#D4530B",text:"And we know that in all things God works for the good of those who love him, who have been called according to his purpose."},
    {ref:"Jer 29:11",color:"Antique Gold",hex:"#D4AF37",text:"For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future."},
    {ref:"2 Tim 1:7",color:"Steel Blue",hex:"#708090",text:"For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline."},
    {ref:"Matt 6:33",color:"Olive Green",hex:"#6B7A2A",text:"But seek first his kingdom and his righteousness, and all these things will be given to you as well."},
    {ref:"Ps 46:10",color:"Midnight Navy",hex:"#1B2A4A",text:"He says, Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth."},
    {ref:"Gal 6:9",color:"Copper Brown",hex:"#7B4F2E",text:"Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up."},
    {ref:"Prov 27:17",color:"Charcoal",hex:"#3D3D3D",text:"As iron sharpens iron, so one person sharpens another."},
    {ref:"Mic 6:8",color:"Ivory White",hex:"#C8C0A8",text:"He has shown you, O mortal, what is good. And what does the Lord require of you? To act justly and to love mercy and to walk humbly with your God."},
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
            <div style={{fontSize:13,color:"#ccc",fontStyle:"italic",lineHeight:1.6}}>"{b.text}"</div>
          </div>
        );
      })}
    </div>
  );
}
