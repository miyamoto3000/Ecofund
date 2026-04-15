module.exports = {
    reactStrictMode: true,
    images: {
      domains: ["localhost"], // Allow local image loading
    },
    staticPageGenerationTimeout: 300,
    eslint: {
      ignoreDuringBuilds: true, // ESLint will still run via `npm run lint` but not block builds
    },
 };