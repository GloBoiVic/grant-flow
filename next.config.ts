import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Local development tunnels may use a *.loca.lt origin during local verification.
  allowedDevOrigins: ["*.loca.lt", "127.0.0.1"],
  experimental: {
    // The application still rejects files over 5 MiB; this leaves room for
    // multipart overhead when Server Actions receive the selected workbook.
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
