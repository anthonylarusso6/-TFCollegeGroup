import { useState, useEffect } from "react";
import Head from "next/head";

const GOLD="#D4AF37";
const RED="#C0392B";
const STEEL="#708090";

export default function Landing(){
  const[loaded,setLoaded]=useState(false);
  const[time,setTime]=useState(new Date());

  useEffect(()=>{
    setTimeout(()=>setLoaded(true),100);
    const t=setInterval(()=>setTime(new Date()),1000);
    return()=>clearInterval(t);
  },[]);

  const day=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][time.getDay()];
  const isClassDay=["Mon","Tue","Thu","Fri"].includes(day);
  const timeStr=time.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
  const dateStr=time.toLocaleDateString([],{month:"long",day:"numeric",year:"numeric"});

  return(
    <>
      <Head>
        <title>TF College Group</title>
        <meta name="description" content="TF College Group — Iron sharpens iron"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="theme-color" content="#0f0f0f"/>
        <link rel="manifest" href="/manifest.json"/>
      </Head>
      <div style={{
        minHeight:"100vh",
        background:"#0f0f0f",
        fontFamily:"Georgia, serif",
        display:"flex",
        flexDirection:"column",
        alignItems:"center",
        justifyContent:"center",
        padding:"2rem 1.5rem",
        position:"relative",
        overflow:"hidden",
      }}>
        {/* Background */}
        <div style={{
          position:"absolute",top:0,left:0,right:0,bottom:0,
          background:"radial-gradient(ellipse at 20% 50%, #1a1a0a 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #0a0a1a 0%, transparent 50%)",
          pointerEvents:"none",
        }}/>

        {/* Top bar */}
        <div style={{
          position:"absolute",top:0,left:0,right:0,
          padding:"1rem 1.5rem",
          display:"flex",
          alignItems:"center",
          justifyContent:"space-between",
          borderBottom:"0.5px solid #222",
        }}>
          <div style={{fontSize:11,color:"#bbbbbb",letterSpacing:"0.1em",textTransform:"uppercase"}}>
            tfcollegegroup.com
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:12,color:"#cccccc"}}>{dateStr}</div>
            <div style={{fontSize:11,color:isClassDay?"#58B368":"#999999"}}>{isClassDay?"Class day":"No class today"} · {timeStr}</div>
          </div>
        </div>

        {/* Main content */}
        <div style={{
          textAlign:"center",
          maxWidth:480,
          width:"100%",
          opacity:loaded?1:0,
          transform:loaded?"translateY(0)":"translateY(20px)",
          transition:"opacity 0.8s ease, transform 0.8s ease",
        }}>

          {/* Icon */}
          <div style={{
            width:70,height:70,borderR
