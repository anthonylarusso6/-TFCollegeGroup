import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

const BG="#0f0f0f";
const PUR="#534AB7";
const RED="#C0392B";
const GREEN="#1E6B3A";
const GOLD="#D4AF37";
const STEEL="#708090";
const ORANGE="#E8720C";

export default function DailyWord({announcement}){
  const WORDS=[
    {quote:"Iron sharpens iron. Show up and make each other better.",author:"Proverbs 27:17"},
    {quote:"Early is the standard. Excellence is the expectation. Faith is the foundation.",author:"Coach Ant"},
    {quote:"You don't rise to the level of your goals. You fall to the level of your systems.",author:"Coach Ant"},
    {quote:"The grind you put in when nobody's watching is what separates you.",author:"Coach Ant"},
    {quote:"Be strong and courageous. Do not be afraid. The Lord your God is with you.",author:"Joshua 1:9"},
    {quote:"Champions are made in the moments when you want to quit but don't.",author:"Coach Ant"},
    {quote:"Your body will do what your mind tells it. Train your mind first.",author:"Coach Ant"},
  ];
  const word=WORDS[new Date().getDate()%WORDS.length];
  const PUR="#534AB7";
  return(
    <div style={{background:"#0f0f0f",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #222",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,"+PUR+",#D4AF37)"}}/>
      <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Today's word</div>
      {announcement&&<div style={{fontSize:13,color:"#fff",fontWeight:500,marginBottom:10,padding:"8px 10px",background:"#1a1a1a",borderRadius:8,borderLeft:"3px solid #D4AF37"}}>{announcement.message||announcement}</div>}
      <div style={{fontSize:14,color:"#ccc",fontStyle:"italic",lineHeight:1.7,marginBottom:8}}>"{word.quote}"</div>
      <div style={{fontSize:11,color:"#555"}}>— {word.author}</div>
    </div>
  );
}
