/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["workspace:packages/drawing"],
    env: {
        API_HOST: "ec2-100-25-13-154.compute-1.amazonaws.com",
    }
}

module.exports = nextConfig
