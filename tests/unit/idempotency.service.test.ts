import { describe, it, expect, beforeEach } from "bun:test";
import { IdempotencyService } from "../../src/domain/services/idempotency.service";
import {
  IdempotencyPayloadMismatchError,
  IdempotencyConflictError,
} from "../../src/domain/errors/domain.errors";
import { prisma } from "../../src/infrastructure/database/prisma";
import { randomUUID } from "crypto";

describe("Idempotency Service (RN-003)", () => {
  const idempotencyService = new IdempotencyService();
  const merchantId = "merchant_acme_default";

  beforeEach(async () => {
    // Limpeza de chaves de teste
    await prisma.idempotencyRecord.deleteMany({
      where: { merchantId },
    });
  });

  it("deve executar e gravar o resultado no primeiro acesso", async () => {
    const key = `key_${randomUUID()}`;
    const payload = { amount: 1000, method: "PIX" };

    let executions = 0;
    const result = await idempotencyService.executeWithIdempotency(
      merchantId,
      key,
      payload,
      async () => {
        executions++;
        return { statusCode: 201, data: { status: "PAID", orderId: "ord_1" } };
      }
    );

    expect(executions).toBe(1);
    expect(result.isCached).toBe(false);
    expect(result.data.status).toBe("PAID");
  });

  it("deve retornar o resultado em cache com isCached=true em chamadas repetidas com mesmo payload (Replay)", async () => {
    const key = `key_${randomUUID()}`;
    const payload = { amount: 1000, method: "PIX" };

    let executions = 0;
    const op = () =>
      idempotencyService.executeWithIdempotency(merchantId, key, payload, async () => {
        executions++;
        return { statusCode: 201, data: { status: "PAID", orderId: "ord_1" } };
      });

    const res1 = await op();
    expect(res1.isCached).toBe(false);

    const res2 = await op();
    expect(res2.isCached).toBe(true);
    expect(res2.data.orderId).toBe("ord_1");
    expect(executions).toBe(1); // Não reexecutou a função!
  });

  it("deve lançar IdempotencyPayloadMismatchError se o payload for alterado na mesma chave (RN-003)", async () => {
    const key = `key_${randomUUID()}`;
    const payload1 = { amount: 1000, method: "PIX" };
    const payload2 = { amount: 2000, method: "PIX" }; // Payload diferente!

    await idempotencyService.executeWithIdempotency(merchantId, key, payload1, async () => ({
      statusCode: 201,
      data: { success: true },
    }));

    expect(
      idempotencyService.executeWithIdempotency(merchantId, key, payload2, async () => ({
        statusCode: 201,
        data: { success: true },
      }))
    ).rejects.toThrow(IdempotencyPayloadMismatchError);
  });

  it("deve prevenir race condition em chamadas simultâneas com a mesma Idempotency-Key", async () => {
    const key = `key_concurrent_${randomUUID()}`;
    const payload = { amount: 5000, method: "PIX" };

    let executions = 0;
    const task = () =>
      idempotencyService.executeWithIdempotency(merchantId, key, payload, async () => {
        executions++;
        // Simula uma pequena latência para garantir corrida de concorrência
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { statusCode: 201, data: { orderId: "ord_concurrent" } };
      });

    // Dispara 5 requisições em paralelo com a mesma chave
    const results = await Promise.allSettled([
      task(),
      task(),
      task(),
      task(),
      task(),
    ]);

    // O handler de negócio deve ter sido executado estritamente 1 única vez
    expect(executions).toBe(1);

    // Todas as requisições devem ter ou resolvido com sucesso ou lançado IdempotencyConflictError
    const successes = results.filter((r) => r.status === "fulfilled");
    const conflicts = results.filter(
      (r) =>
        r.status === "rejected" &&
        (r as PromiseRejectedResult).reason instanceof IdempotencyConflictError
    );

    expect(successes.length).toBeGreaterThanOrEqual(1);
    expect(successes.length + conflicts.length).toBe(5);

    // A requisição bem-sucedida deve ter o payload correto
    const successfulResult = (successes[0] as PromiseFulfilledResult<any>).value;
    expect(successfulResult.data.orderId).toBe("ord_concurrent");
  });

  it("deve permitir retry quando a execução prévia falha (status FAILED)", async () => {
    const key = `key_retry_${randomUUID()}`;
    const payload = { amount: 3000, method: "CREDIT_CARD" };

    let attempts = 0;

    // 1. Primeira tentativa falha
    await expect(
      idempotencyService.executeWithIdempotency(merchantId, key, payload, async () => {
        attempts++;
        throw new Error("Erro de infraestrutura simulado");
      })
    ).rejects.toThrow("Erro de infraestrutura simulado");

    expect(attempts).toBe(1);

    // Verifica que o registro ficou FAILED no banco
    const record = await prisma.idempotencyRecord.findUnique({
      where: { merchantId_idempotencyKey: { merchantId, idempotencyKey: key } },
    });
    expect(record?.status).toBe("FAILED");

    // 2. Segunda tentativa com a mesma chave é autorizada e sucede
    const successRes = await idempotencyService.executeWithIdempotency(
      merchantId,
      key,
      payload,
      async () => {
        attempts++;
        return { statusCode: 200, data: { status: "RETRY_SUCCESS" } };
      }
    );

    expect(attempts).toBe(2);
    expect(successRes.statusCode).toBe(200);
    expect(successRes.data.status).toBe("RETRY_SUCCESS");
    expect(successRes.isCached).toBe(false);

    // Registro atualizado para COMPLETED
    const updatedRecord = await prisma.idempotencyRecord.findUnique({
      where: { merchantId_idempotencyKey: { merchantId, idempotencyKey: key } },
    });
    expect(updatedRecord?.status).toBe("COMPLETED");
  });

  it("deve lançar IdempotencyPayloadMismatchError se o payload for alterado em retry de chave FAILED", async () => {
    const key = `key_mismatch_failed_${randomUUID()}`;
    const payload1 = { amount: 1000 };
    const payload2 = { amount: 2000 };

    // Primeira tentativa falha com payload1
    await expect(
      idempotencyService.executeWithIdempotency(merchantId, key, payload1, async () => {
        throw new Error("Falha transitória");
      })
    ).rejects.toThrow("Falha transitória");

    // Tentativa subsequente com payload diferente deve ser rejeitada com 409 mismatch
    await expect(
      idempotencyService.executeWithIdempotency(merchantId, key, payload2, async () => {
        return { statusCode: 200, data: { ok: true } };
      })
    ).rejects.toThrow(IdempotencyPayloadMismatchError);
  });
});
