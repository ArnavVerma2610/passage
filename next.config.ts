import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
  cacheOnNavigation: true,
  reloadOnOnline: true,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Empty Turbopack config silences the "webpack config detected" error in
  // dev — the @serwist/next webpack hook is a no-op when `disable` is true.
  turbopack: {},
};

export default withSerwist(nextConfig);
