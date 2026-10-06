import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { buildApp } from "../../src/presentation/app";
import { FastifyInstance } from "fastify";

describe("Health Probes Integration", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health/liveness deve responder 200 OK com status=ok", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health/liveness",
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe("ok");
    expect(body.service).toBe("payflow-core");
    expect(body.timestamp).toBeDefined();
  });

  it("GET /health/readiness deve responder 200 OK com database=connected", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health/readiness",
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe("ok");
    expect(body.database).toBe("connected");
  });
});
