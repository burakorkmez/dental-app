import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  org: "codesistency-gs",
  project: "dental-app-web",

  // Source maps: without this, production stack traces are minified noise.
  // Build-time secret, separate from the DSN — set it in CI / Vercel.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,

  silent: !process.env.CI,
});
