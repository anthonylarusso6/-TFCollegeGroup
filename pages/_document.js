import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html>
      <Head>
        {/* Apply the saved light/dark theme synchronously, before first paint,
            so the page never flashes the dark base color on load or navigation. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{if(localStorage.getItem("tf_theme")==="light"){document.documentElement.setAttribute("data-theme","light");}}catch(e){}',
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
