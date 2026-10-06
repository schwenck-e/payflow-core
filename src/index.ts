import { buildApp } from "./presentation/app";

const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "0.0.0.0";

const app = buildApp();

async function start() {
  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`⚡ PayFlow Core Platform rodando em http://${HOST}:${PORT}`);
    console.log(`🔍 Liveness probe:  http://${HOST}:${PORT}/health/liveness`);
    console.log(`🔍 Readiness probe: http://${HOST}:${PORT}/health/readiness`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (import.meta.main) {
  start();
}

export { app };
