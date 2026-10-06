import { prisma } from "../../infrastructure/database/prisma";
import { SecurityService } from "../../infrastructure/security/hash";
import { IdempotencyRecord } from "../entities/idempotency.entity";
import { IdempotencyConflictError } from "../errors/domain.errors";
import { randomUUID } from "crypto";

export interface IdempotencyExecutionResult<T> {
  statusCode: number;
  data: T;
  isCached: boolean;
}

export class IdempotencyService {
  /**
   * Executa uma operação protegida por chave de idempotência determinística (RN-003)
   */
  public async executeWithIdempotency<T>(
    merchantId: string,
    idempotencyKey: string,
    rawPayload: unknown,
    handler: () => Promise<{ statusCode: number; data: T }>
  ): Promise<IdempotencyExecutionResult<T>> {
    // 1. Calcula o hash SHA-256 canônico do payload
    const canonicalPayload = SecurityService.canonicalizeJson(rawPayload);
    const requestHash = SecurityService.sha256(canonicalPayload);

    // 2. Consulta existência prévia da chave
    const existing = await prisma.idempotencyRecord.findUnique({
      where: {
        merchantId_idempotencyKey: {
          merchantId,
          idempotencyKey,
        },
      },
    });

    if (existing) {
      const record = new IdempotencyRecord({
        id: existing.id,
        merchantId: existing.merchantId,
        idempotencyKey: existing.idempotencyKey,
        requestHash: existing.requestHash,
        status: existing.status as "IN_PROGRESS" | "COMPLETED" | "FAILED",
        responseStatusCode: existing.responseStatusCode,
        responseBody: existing.responseBody,
        expiresAt: existing.expiresAt,
        createdAt: existing.createdAt,
      });

      // Validação determinística de conformidade de parâmetros (RN-003)
      record.validatePayloadMatch(requestHash);

      // Se já concluído, retorna a resposta serializada em cache
      if (record.status === "COMPLETED" && record.responseBody && record.responseStatusCode) {
        return {
          statusCode: record.responseStatusCode,
          data: JSON.parse(record.responseBody) as T,
          isCached: true,
        };
      }

      // Se estiver em progresso dentro do tempo de lock ativo (evita corrida concorrente)
      if (record.status === "IN_PROGRESS") {
        throw new IdempotencyConflictError(idempotencyKey);
      }
    }

    // 3. Adquire lock gravando status IN_PROGRESS
    const recordId = existing?.id ?? randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas de retenção

    await prisma.idempotencyRecord.upsert({
      where: {
        merchantId_idempotencyKey: {
          merchantId,
          idempotencyKey,
        },
      },
      update: {
        status: "IN_PROGRESS",
        requestHash,
        expiresAt,
      },
      create: {
        id: recordId,
        merchantId,
        idempotencyKey,
        requestHash,
        status: "IN_PROGRESS",
        expiresAt,
      },
    });

    // 4. Executa a lógica de negócio
    try {
      const result = await handler();

      // Serializa a resposta para gravação no cache
      // Tratamento para BigInt na serialização JSON
      const serializedData = JSON.stringify(result.data, (_, v) =>
        typeof v === "bigint" ? v.toString() : v
      );

      // Marca o registro como COMPLETED
      await prisma.idempotencyRecord.update({
        where: { id: recordId },
        data: {
          status: "COMPLETED",
          responseStatusCode: result.statusCode,
          responseBody: serializedData,
        },
      });

      return {
        statusCode: result.statusCode,
        data: result.data,
        isCached: false,
      };
    } catch (err) {
      // Em caso de falha de negócio ou infraestrutura, libera a chave marcando como FAILED
      await prisma.idempotencyRecord.update({
        where: { id: recordId },
        data: { status: "FAILED" },
      });
      throw err;
    }
  }
}
