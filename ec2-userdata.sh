#!/bin/bash

yum update -y
yum install git -y
export HOME=${HOME:-/root}
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | NVM_DIR="$HOME/.nvm" bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install node
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"
git clone https://github.com/behind-density-lines/behind-density-lines.git
cd behind-density-lines
bun install
sh ./setup.sh
cd apps/next-app
bun run build
bun run start &
npm rebuild sharp
cd ../gif-encoder
bun dev &
cd ../scoring
bun dev &