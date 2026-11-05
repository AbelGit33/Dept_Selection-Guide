import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the tracing root to this project. Without it Next walks up to
  // C:\Users\AM because an unrelated package-lock.json lives there, which
  // bloats the build trace and produces a warning on every build.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
