import fastify, { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { DomainError } from "../domain/errors/domain.errors";
import { healthController } from "./controllers/health.controller";
import { chargeController } from "./controllers/charge.controller";
import { ledgerController } from "./controllers/ledger.controller";

export function buildApp(): FastifyInstance {
  const app = fastify({
    logger: process.env.NODE_ENV === "test" ? false : { level: "info" },
  });

  // Global Error Handler conforme RFC 7807 (Problem Details)
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        type: "https://payflowcore.internal/errors/validation",
        title: "Validation Error",
        status: 400,
        detail: "Os dados enviados na requisição contêm violações de schema.",
        instance: request.url,
        errors: error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }

    if (error instanceof DomainError) {
      return reply.status(error.statusCode).send({
        type: `https://payflowcore.internal/errors/${error.code.toLowerCase().replace(/_/g, "-")}`,
        title: error.code,
        status: error.statusCode,
        detail: error.message,
        instance: request.url,
      });
    }

    request.log.error(error);

    return reply.status(500).send({
      type: "https://payflowcore.internal/errors/internal-server-error",
      title: "Internal Server Error",
      status: 500,
      detail: "Ocorreu uma falha inesperada no processamento da solicitação.",
      instance: request.url,
    });
  });

  // Registro das rotas
  app.register(healthController);
  app.register(chargeController, { prefix: "/api/v1" });
  app.register(ledgerController, { prefix: "/api/v1" });

  return app;
}
