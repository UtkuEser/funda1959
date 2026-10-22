import type { NextConfig } from "next";

/**
 * Photos of products added in the panel (D45) come from the connected
 * project's public Storage bucket `product-images` — only that bucket, only
 * that project (test or production, from SUPABASE_URL at build time).
 */
function productImagePattern() {
  try {
    const url = new URL(process.env.SUPABASE_URL ?? "");
    return [
      {
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
        ...(url.port ? { port: url.port } : {}),
        pathname: "/storage/v1/object/public/product-images/**",
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  // Homepage Instagram videos (public/social, D42) are served as static files.
  // The homepage checks /public files on disk, which pulls the whole folder
  // into the server bundle — keep the videos out of it.
  outputFileTracingExcludes: {
    "/*": ["public/social/**/*.{mp4,webm}"],
  },
  images: {
    remotePatterns: productImagePattern(),
  },
};

export default nextConfig;
