/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['rocki-biki-bucket.s3.ap-northeast-2.amazonaws.com'],
  },
  reactStrictMode: false,
  webpack: (config, { isServer }) => {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };

    return config;
  },
};

export default nextConfig;
