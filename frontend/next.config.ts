import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Allow LAN network access without Next.js blocking cross-origin dev requests
  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
    "0.0.0.0",
    "0.0.0.0:3000",
    "192.168.68.128",
    "192.168.68.128:3000",
    "192.168.68.131",
    "192.168.68.131:3000",
    "192.168.1.140",
    "192.168.1.140:3000",
    "192.168.1.69",
    "192.168.1.69:3000",
    "192.168.1.158",
    "192.168.1.158:3000",
    "192.168.68.104",
    "192.168.68.104:3000",
    "192.168.68.125",
    "192.168.68.125:3000",
    "trycloudflare.com",
    "*.trycloudflare.com",
    "100.79.67.53",
    "100.79.67.53:3000",
    "169.254.244.100",
    "169.254.244.100:3000",
    "192.168.1.16",
    "192.168.1.16:3000"
  ],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:5000/api/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'http://127.0.0.1:5000/uploads/:path*',
      },
      {
        source: '/storage/:path*',
        destination: 'http://127.0.0.1:5000/storage/:path*',
      },
      {
        source: '/signatures-assets/:path*',
        destination: 'http://127.0.0.1:5000/signatures-assets/:path*',
      },
      {
        source: '/proyekadmin-signatures-assets/:path*',
        destination: 'http://127.0.0.1:5000/proyekadmin-signatures-assets/:path*',
      },
    ];
  },
};

export default nextConfig;
