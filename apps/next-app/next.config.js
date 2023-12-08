/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["workspace:packages/drawing"],
    env: {
        API_HOST: "tml.cs.vt.edu"
    }
}

module.exports = nextConfig
