import { FastifyInstance } from "fastify";
import { prisma } from "../../infrastructure/database/prisma";

export async function healthController(app: FastifyInstance) {
  // Liveness probe
  app.get("/health/liveness", async (_req, reply) => {
    return reply.status(200).send({
      status: "ok",
      service: "payflow-core",
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
    });
  });

  // Readiness probe (verifica conectividade com o banco)
  app.get("/health/readiness", async (_req, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return reply.status(200).send({
        status: "ok",
        database: "connected",
        service: "payflow-core",
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      return reply.status(503).send({
        status: "unhealthy",
        database: "disconnected",
        error: (err as Error).message,
        timestamp: new Date().toISOString(),
      });
    }
  });
}
