import type { NextConfig } from "next";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const nextConfig: NextConfig =
  process.env.VERCEL === "1"
    ? {}
    : {
        output: "standalone",
        outputFileTracingRoot: path.resolve(process.cwd(), "..")
      };

export default nextConfig;
