import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { buildApp } from "../../src/presentation/app";
import { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";

describe("Refund Flow & Ledger Reversal Integration (RN-005)", () => {
  let app: FastifyInstance;
  const apiKey = "sk_live_payflow_demo_key_2026";

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve realizar estorno parcial com lançamento contábil reverso e impedir estorno acima do saldo (RN-005)", async () => {
    // 1. Criar cobrança de R$ 200,00 paga
    const chargeKey = `idemp_ch_${randomUUID()}`;
    const chargeRes = await app.inject({
      method: "POST",
      url: "/api/v1/charges",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Idempotency-Key": chargeKey,
      },
      payload: {
        amount_in_cents: 20000,
        currency: "BRL",
        payment_method: "CREDIT_CARD",
        customer: {
          name: "Lucas Fernandes",
          email: "lucas@example.com",
          document: "11122233344",
        },
        card: {
          number: "4242424242424242",
          holder_name: "LUCAS FERNANDES",
          exp_month: 10,
          exp_year: 2029,
          cvv: "999",
        },
        capture: true,
      },
    });

    const charge = JSON.parse(chargeRes.body);
    expect(chargeRes.statusCode).toBe(201);
    expect(charge.status).toBe("PAID");

    // 2. Estorno parcial de R$ 50,00
    const refundKey1 = `idemp_ref1_${randomUUID()}`;
    const refundRes1 = await app.inject({
      method: "POST",
      url: `/api/v1/charges/${charge.id}/refund`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Idempotency-Key": refundKey1,
      },
      payload: {
        amount_in_cents: 5000, // R$ 50,00
        reason: "Item devolvido parcialmente",
      },
    });

    expect(refundRes1.statusCode).toBe(200);
    const refundBody1 = JSON.parse(refundRes1.body);
    expect(refundBody1.amount_in_cents).toBe("5000");
    expect(refundBody1.ledger_tx_id).toBeDefined();

    // 3. Tentativa de estorno de R$ 160,00 (Excede o saldo remanescente de R$ 150,00) -> RN-005
    const refundKey2 = `idemp_ref2_${randomUUID()}`;
    const refundRes2 = await app.inject({
      method: "POST",
      url: `/api/v1/charges/${charge.id}/refund`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Idempotency-Key": refundKey2,
      },
      payload: {
        amount_in_cents: 16000, // R$ 160,00 > R$ 150,00 disponível!
        reason: "Tentativa de estorno excedente",
      },
    });

    expect(refundRes2.statusCode).toBe(422);
    const errorBody = JSON.parse(refundRes2.body);
    expect(errorBody.title).toBe("REFUND_EXCEEDS_CHARGE_AMOUNT");
  });
});
