import '../styles/globals.css'
import Head from 'next/head'
import { useEffect } from 'react'

export default function App({ Component, pageProps }) {
  useEffect(()=>{
    // Catch unhandled promise rejections from Supabase calls
    const handler=(event)=>{
      console.warn("Unhandled error caught:",event.reason);
      event.preventDefault(); // prevent app crash
    };
    window.addEventListener("unhandledrejection", handler);
    return()=>window.removeEventListener("unhandledrejection", handler);
  },[]);

  return (
    <>
      <Head>
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
