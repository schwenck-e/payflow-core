import { describe, it, expect, beforeEach } from "bun:test";
import { IdempotencyService } from "../../src/domain/services/idempotency.service";
import { IdempotencyPayloadMismatchError } from "../../src/domain/errors/domain.errors";
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
});
