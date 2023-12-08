#!/bin/bash

cd apps/next-app
~/.bun/bin/bun run start &

sleep 5

cd ../gif-encoder
~/.bun/bin/bun run start &

cd ../scoring
~/.bun/bin/bun run start &

wait

exit $?