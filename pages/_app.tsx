import { useState } from 'react';
import NextApp, { AppProps, AppContext } from 'next/app';
import { getCookie, setCookie } from 'cookies-next';
import Head from 'next/head';
import { MantineProvider, ColorScheme, ColorSchemeProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterTransition } from '../components/router-transition';
import queryClient from '../lib/query-client';
import theme from '../theme';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { ModalsProvider } from '@mantine/modals';
import modals from '../lib/modals';
import Chatwoot from '../components/Chatwoot';
import '../styles/global.css';
import account from '../lib/data/account';

export default function App(props: AppProps) {
  const { Component, pageProps } = props;

  return (
    <>
      <Head>
        <title>{account.name}</title>
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
        <link rel="shortcut icon" href={account.logo} />
      </Head>

      <main>
        <UserProvider>
          <QueryClientProvider client={queryClient}>
            <MantineProvider
              theme={{ ...theme, colorScheme: 'light' }}
              withGlobalStyles
              withNormalizeCSS
            >
              <ModalsProvider modals={modals} modalProps={{ centered: true }}>
                <RouterTransition />
                <Component {...pageProps} />
                <Notifications position="top-right" />
              </ModalsProvider>
            </MantineProvider>
            <ReactQueryDevtools initialIsOpen={false} />
            <Chatwoot />
          </QueryClientProvider>
        </UserProvider>
      </main>
    </>
  );
}

App.getInitialProps = async (appContext: AppContext) => {
  const appProps = await NextApp.getInitialProps(appContext);
  return {
    ...appProps,
  };
};
