import '../styles/globals.css'
import Head from 'next/head'

export default function App({ Component, pageProps }) {
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
