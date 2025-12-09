/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // カスタムサーバー（server.js）を使用するため、standaloneは無効化
  // output: 'standalone',
};

module.exports = nextConfig;
