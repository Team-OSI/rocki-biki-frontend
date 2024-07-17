/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['rocki-biki-bucket.s3.ap-northeast-2.amazonaws.com'],
  },
  reactStrictMode: false,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.output.globalObject = 'self';
      config.module.rules.push({
        test: /\.worker\.js$/,
        use: [
          {
            loader: 'worker-loader',
            options: {
              filename: 'static/[hash].worker.js',
              publicPath: '/_next/',
              esModule: true,
            },
          },
          'babel-loader',
        ],
      });
    }
    return config;
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless', // 'require-corp'에서 변경
          },
        ],
      },
    ];
  },
};

export default nextConfig;