FROM node:22-bookworm-slim
WORKDIR /opt/catalogue-worker
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/catalogue-worker/browsers
RUN echo '{"private":true}' > package.json && npm install --save-exact playwright@1.63.0 sharp@0.35.5 && npx playwright install --with-deps chromium && chmod -R a+rX /opt/catalogue-worker
USER node
WORKDIR /workspace
CMD ["node", "/workspace/node_modules/tsx/dist/cli.mjs", "/workspace/scripts/catalogue-worker.ts"]
