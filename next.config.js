const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: 'picsum.photos',
        protocol: 'https',
        port: '',
        pathname: '/**',
      },
      {
        hostname: 'digitallyncai.blob.core.windows.net',
        protocol: 'https',
        port: '',
        pathname: '/**',
      },
      {
        hostname: 'blobstoragedl.blob.core.windows.net',
        protocol: 'https',
        port: '',
        pathname: '/**',
      },
      {
        hostname: 's.gravatar.com',
        protocol: 'https',
        port: '',
        pathname: '/**',
      },
      {
        hostname: 'digitallync.blob.core.windows.net',
        protocol: 'https',
        port: '',
        pathname: '/**',
      },
      {
        hostname: 'konalmsstorage123.blob.core.windows.net',
        protocol: 'https',
        port: '',
        pathname: '/**',
      },
    ],
    domains: [
      'picsum.photos',
      'digitallyncai.blob.core.windows.net',
      'blobstoragedl.blob.core.windows.net',
      's.gravatar.com',
      'digitallync.blob.core.windows.net',
      'konalmsstorage123.blob.core.windows.net',
    ],
  },
});
