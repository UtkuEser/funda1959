import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Homepage Instagram videos (public/social, D42) are served as static files.
  // The homepage checks /public files on disk, which pulls the whole folder
  // into the server bundle — keep the videos out of it.
  outputFileTracingExcludes: {
    "/*": ["public/social/**/*.{mp4,webm}"],
  },
};

export default nextConfig;
