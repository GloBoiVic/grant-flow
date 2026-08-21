import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Clerk development webhooks use a localtunnel *.loca.lt origin during local verification.
  allowedDevOrigins: ["*.loca.lt"],
  /* config options here */
};

export default nextConfig;
