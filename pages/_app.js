import '../styles/globals.css'
import Head from 'next/head'
import { useEffect, useState } from 'react'

export default function App({ Component, pageProps }) {
  const [theme, setTheme] = useState("dark");

  useEffect(()=>{
    // Catch unhandled promise rejections from Supabase calls
    const handler=(event)=>{
      console.warn("Unhandled error caught:",event.reason);
      event.preventDefault();
    };
    window.addEventListener("unhandledrejection", handler);

    // Silently register service worker so push notifications are ready to activate
    if("serviceWorker" in navigator){
      navigator.serviceWorker.register("/sw.js").catch(()=>{});
    }

    // Restore saved theme
    try{
      const saved=localStorage.getItem("tf_theme");
      if(saved==="light"||saved==="dark"){setTheme(saved);document.documentElement.setAttribute("data-theme",saved);}
    }catch(e){}

    return()=>window.removeEventListener("unhandledrejection", handler);
  },[]);

  const toggleTheme=()=>{
    setTheme(prev=>{
      const next=prev==="dark"?"light":"dark";
      try{localStorage.setItem("tf_theme",next);}catch(e){}
      document.documentElement.setAttribute("data-theme",next);
      return next;
    });
  };

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover" />
        <meta name="theme-color" content={theme==="light"?"#f2f2f2":"#080808"} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <style>{`
          html,body{background:#080808 !important;margin:0}
          /* Light mode: invert the hardcoded-dark UI, hue-rotate to keep colors roughly true,
             then re-invert real media so photos/videos look normal. Applied at the root so
             position:fixed navs/drawers still anchor to the viewport. */
          html[data-theme="light"]{filter:invert(1) hue-rotate(180deg);background:#f2f2f2 !important;}
          html[data-theme="light"] body{background:#f2f2f2 !important;}
          html[data-theme="light"] img,
          html[data-theme="light"] video,
          html[data-theme="light"] [data-noinvert]{filter:invert(1) hue-rotate(180deg);}
          @media print{#tf-theme-toggle{display:none}}
        `}</style>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/icon.png" />
        <meta property="og:image" content="https://tfcollegegroup.com/og-image.jpg" />
        <meta property="og:title" content="TF College Group" />
        <meta property="og:description" content="Faith · Family · Fitness — Triple F, Knoxville TN" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://tfcollegegroup.com/og-image.jpg" />
      </Head>
      <div style={{position:"fixed",top:0,left:0,right:0,height:"env(safe-area-inset-top)",background:"#080808",zIndex:9999,pointerEvents:"none"}}/>
      <Component {...pageProps} />
      {/* Theme toggle — data-noinvert keeps it from being flipped by the light-mode filter */}
      <button id="tf-theme-toggle" data-noinvert onClick={toggleTheme}
        aria-label={theme==="dark"?"Switch to light mode":"Switch to dark mode"}
        style={{position:"fixed",top:"calc(env(safe-area-inset-top) + 8px)",right:10,zIndex:100000,width:38,height:38,borderRadius:"50%",border:"1px solid "+(theme==="dark"?"rgba(255,255,255,0.18)":"rgba(0,0,0,0.15)"),background:theme==="dark"?"rgba(20,20,26,0.85)":"rgba(255,255,255,0.9)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",boxShadow:"0 4px 16px rgba(0,0,0,0.35)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,lineHeight:1,padding:0}}>
        {theme==="dark"?"☀️":"🌙"}
      </button>
    </>
  )
}
