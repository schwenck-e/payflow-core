import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { buildApp } from "../../src/presentation/app";
import { FastifyInstance } from "fastify";
import { prisma } from "../../src/infrastructure/database/prisma";
import { randomUUID } from "crypto";

describe("Payment Flow Integration (Fastify + Ledger)", () => {
  let app: FastifyInstance;
  const apiKey = "sk_live_payflow_demo_key_2026";
  let merchantWalletId: string;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();

    const wallet = await prisma.account.findFirstOrThrow({
      where: { code: "2.1.01.001" },
    });
    merchantWalletId = wallet.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve criar e capturar uma cobrança de Cartão e liquidar no Ledger automaticamente", async () => {
    const key = `idemp_${randomUUID()}`;
    const initialBalanceRes = await app.inject({
      method: "GET",
      url: `/api/v1/accounts/${merchantWalletId}/balance`,
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const initialBalance = BigInt(JSON.parse(initialBalanceRes.body).current_balance_in_cents);

    const chargePayload = {
      amount_in_cents: 10000, // R$ 100,00
      currency: "BRL",
      payment_method: "CREDIT_CARD",
      customer: {
        name: "Carlos Eduardo",
        email: "carlos@example.com",
        document: "12345678909",
      },
      card: {
        number: "4242424242424242", // Cartão Visa válido pelo algoritmo de Luhn
        holder_name: "CARLOS E SILVA",
        exp_month: 12,
        exp_year: 2028,
        cvv: "123",
      },
      capture: true,
    };

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/charges",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Idempotency-Key": key,
      },
      payload: chargePayload,
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.id).toBeDefined();
    expect(body.status).toBe("PAID");
    expect(body.amount_in_cents).toBe("10000");
    expect(body.fee_amount_cents).toBe("250"); // 2.5% de 10000 = 250 cents
    expect(body.net_amount_cents).toBe("9750"); // 10000 - 250 = 9750 cents
    expect(body.ledger_tx_id).toBeDefined();

    // Verifica se o saldo do Merchant Wallet foi acrescido do valor líquido
    const finalBalanceRes = await app.inject({
      method: "GET",
      url: `/api/v1/accounts/${merchantWalletId}/balance`,
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const finalBalance = BigInt(JSON.parse(finalBalanceRes.body).current_balance_in_cents);
    expect(finalBalance).toBe(initialBalance + 9750n);

    // Valida Replay com Idempotency-Key idêntica
    const replayResponse = await app.inject({
      method: "POST",
      url: "/api/v1/charges",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Idempotency-Key": key,
      },
      payload: chargePayload,
    });

    expect(replayResponse.statusCode).toBe(201);
    expect(replayResponse.headers["x-cache-lookup"]).toBe("HIT");
    const replayBody = JSON.parse(replayResponse.body);
    expect(replayBody.id).toBe(body.id);
  });

  it("deve criar uma cobrança Pix com status PENDING e payload EMV válido", async () => {
    const key = `idemp_pix_${randomUUID()}`;

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/charges",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Idempotency-Key": key,
      },
      payload: {
        amount_in_cents: 5000,
        currency: "BRL",
        payment_method: "PIX",
        customer: {
          name: "Maria Souza",
          email: "maria@example.com",
          document: "98765432100",
        },
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.status).toBe("PENDING");
    expect(body.pix_qr_code).toBeDefined();
    expect(body.pix_qr_code).toContain("br.gov.bcb.pix");
  });
});
