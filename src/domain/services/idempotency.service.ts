import { prisma } from "../../infrastructure/database/prisma";
import { SecurityService } from "../../infrastructure/security/hash";
import { IdempotencyRecord } from "../entities/idempotency.entity";
import { IdempotencyConflictError } from "../errors/domain.errors";
import { Prisma } from "@prisma/client";
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

    let recordId: string;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas de retenção

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

      // Se um registro prévio estiver com status FAILED, adquire lock de forma atômica
      const updateResult = await prisma.idempotencyRecord.updateMany({
        where: {
          id: existing.id,
          status: "FAILED",
        },
        data: {
          status: "IN_PROGRESS",
          requestHash,
          expiresAt,
        },
      });

      if (updateResult.count === 0) {
        throw new IdempotencyConflictError(idempotencyKey);
      }

      recordId = existing.id;
    } else {
      // 3. Adquire lock gravando status IN_PROGRESS de forma ATÔMICA via create
      const newRecordId = randomUUID();

      try {
        const created = await prisma.idempotencyRecord.create({
          data: {
            id: newRecordId,
            merchantId,
            idempotencyKey,
            requestHash,
            status: "IN_PROGRESS",
            expiresAt,
          },
        });
        recordId = created.id;
      } catch (err: any) {
        // Se o create falhar por violação de constraint única (P2002), requisição concorrente inseriu simultaneamente
        const isUniqueViolation =
          (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") ||
          err?.code === "P2002";

        if (isUniqueViolation) {
          const concurrent = await prisma.idempotencyRecord.findUnique({
            where: {
              merchantId_idempotencyKey: {
                merchantId,
                idempotencyKey,
              },
            },
          });

          if (!concurrent) {
            throw err;
          }

          const concurrentRecord = new IdempotencyRecord({
            id: concurrent.id,
            merchantId: concurrent.merchantId,
            idempotencyKey: concurrent.idempotencyKey,
            requestHash: concurrent.requestHash,
            status: concurrent.status as "IN_PROGRESS" | "COMPLETED" | "FAILED",
            responseStatusCode: concurrent.responseStatusCode,
            responseBody: concurrent.responseBody,
            expiresAt: concurrent.expiresAt,
            createdAt: concurrent.createdAt,
          });

          concurrentRecord.validatePayloadMatch(requestHash);

          if (
            concurrentRecord.status === "COMPLETED" &&
            concurrentRecord.responseBody &&
            concurrentRecord.responseStatusCode
          ) {
            return {
              statusCode: concurrentRecord.responseStatusCode,
              data: JSON.parse(concurrentRecord.responseBody) as T,
              isCached: true,
            };
          }

          if (concurrentRecord.status === "IN_PROGRESS") {
            throw new IdempotencyConflictError(idempotencyKey);
          }

          if (concurrentRecord.status === "FAILED") {
            const updateResult = await prisma.idempotencyRecord.updateMany({
              where: {
                id: concurrent.id,
                status: "FAILED",
              },
              data: {
                status: "IN_PROGRESS",
                requestHash,
                expiresAt,
              },
            });

            if (updateResult.count === 0) {
              throw new IdempotencyConflictError(idempotencyKey);
            }

            recordId = concurrent.id;
          } else {
            throw new IdempotencyConflictError(idempotencyKey);
          }
        } else {
          throw err;
        }
      }
    }

    // 4. Executa a lógica de negócio protegida
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
