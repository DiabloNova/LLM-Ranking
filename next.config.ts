import type { NextConfig } from "next";
import { getSecurityHeaders } from "./src/core/security/headers";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Applies to every route, including API routes: these headers are safe and
        // desirable on JSON responses too (clickjacking / MIME-sniffing protection is
        // not limited to HTML documents).
        source: "/:path*",
        headers: getSecurityHeaders(),
      },
    ];
  },
};

export default nextConfig;
