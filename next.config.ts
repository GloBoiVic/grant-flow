import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Local development tunnels may use a *.loca.lt origin during local verification.
  allowedDevOrigins: ["*.loca.lt", "127.0.0.1"],
  /* config options here */
};

export default nextConfig;
