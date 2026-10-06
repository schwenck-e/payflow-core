import { prisma } from "../../infrastructure/database/prisma";
import { SecurityService } from "../../infrastructure/security/hash";
import { randomUUID } from "crypto";

export interface WebhookEvent<T = unknown> {
  id: string;
  event: string;
  timestamp: string;
  merchantId: string;
  data: T;
}

export class WebhookService {
  /**
   * Despacha um evento financeiro assinado com HMAC-SHA256 para os webhooks configurados
   */
  public async dispatchEvent<T>(
    merchantId: string,
    eventType: string,
    data: T
  ): Promise<void> {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: {
        merchantId,
        active: true,
      },
    });

    if (endpoints.length === 0) {
      return;
    }

    const eventPayload: WebhookEvent<T> = {
      id: randomUUID(),
      event: eventType,
      timestamp: new Date().toISOString(),
      merchantId,
      data,
    };

    const serializedPayload = JSON.stringify(eventPayload, (_, v) =>
      typeof v === "bigint" ? v.toString() : v
    );

    for (const ep of endpoints) {
      const signature = SecurityService.generateHmacSignature(
        serializedPayload,
        ep.secret
      );

      // Simulação / Registro assíncrono de entrega com header X-Payflow-Signature
      await prisma.webhookDelivery.create({
        data: {
          id: randomUUID(),
          endpointId: ep.id,
          eventType,
          payload: JSON.stringify({
            headers: { "X-Payflow-Signature": signature },
            body: JSON.parse(serializedPayload),
          }),
          statusCode: 200,
          success: true,
          attempts: 1,
        },
      });
    }
  }
}
