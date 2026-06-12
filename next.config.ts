import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    const immutable = [
      {
        key: "Cache-Control",
        value: "public, max-age=31536000, immutable",
      },
    ];

    return [
      { source: "/squads/:path*", headers: immutable },
      { source: "/vendor/8a0/media/:path*", headers: immutable },
      { source: "/vendor/8a0/css/:path*", headers: immutable },
      { source: "/vendor/8a0/chunks/:path*", headers: immutable },
      { source: "/vendor/8a0/favicon.ico", headers: immutable },
      { source: "/vendor/8a0/icon.svg", headers: immutable },
    ];
  },
};

export default nextConfig;
