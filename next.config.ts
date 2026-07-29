import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.GITHUB_ACTIONS ? "/OCG2003" : "",
  assetPrefix: process.env.GITHUB_ACTIONS ? "/OCG2003/" : "",
  trailingSlash: true,
};

export default nextConfig;
