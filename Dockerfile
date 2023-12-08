FROM node:current
WORKDIR /usr/src/app
COPY . .
RUN curl -fsSL https://bun.sh/install | bash
RUN ~/.bun/bin/bun install
RUN npm rebuild sharp
ENV NEXT_TELEMETRY_DISABLED 1
RUN chmod +x ./copy-sem-images.sh && sh ./copy-sem-images.sh
RUN cd apps/next-app && npm run build
EXPOSE 3000/tcp
EXPOSE 3001/tcp
EXPOSE 3002/tcp
RUN chmod +x ./run-services.sh
ENTRYPOINT ["sh", "/usr/src/app/run-services.sh"]