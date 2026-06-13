import '../styles/globals.css'
import Head from 'next/head'
import { useEffect } from 'react'

export default function App({ Component, pageProps }) {
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

    return()=>window.removeEventListener("unhandledrejection", handler);
  },[]);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover" />
        <meta name="theme-color" content="#080808" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <style>{`html,body{background:#080808 !important;margin:0}`}</style>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/icon.png" />
        <meta property="og:image" content="https://tfcollegegroup.com/og-image.jpg" />
        <meta property="og:title" content="TF College Group" />
        <meta property="og:description" content="Faith · Family · Fitness — Triple F, Knoxville TN" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://tfcollegegroup.com/og-image.jpg" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
