import Head from "next/head";
import { FC } from "react";
import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  body {
    font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji;
    line-height: 1.5;
    margin: 0;
  }
`;

const MyApp: FC<{
  Component: FC<any>;
  pageProps: any;
}> = ({ Component, pageProps }) => {
  return (
    <>
      <GlobalStyle />
      <Head>
        <meta charSet="utf-8" />
        <title>New youtube videos</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
        <meta
          name="description"
          content="Aggregating youtube videos since 2015"
        />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <meta property="og:site_name" content="Youtube" />
        <meta property="og:url" content="https://ut.dhedegaard.dk/" />
        <meta property="og:title" content="New youtube videos" />
        <meta
          property="og:description"
          content="Aggregating youtube videos since 2015"
        />
        <meta name="theme-color" content="#222222" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </Head>
      <Component {...pageProps} />;
    </>
  );
};

export default MyApp;
