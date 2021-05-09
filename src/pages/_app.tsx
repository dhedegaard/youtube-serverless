import Head from "next/head";
import { FC } from "react";
import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  body {
    font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji;
    line-height: 1.5;
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
        <title>TODO: Youtube</title>
      </Head>{" "}
      <Component {...pageProps} />;
    </>
  );
};

export default MyApp;
