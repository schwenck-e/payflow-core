import { FastifyInstance } from "fastify";
import { z } from "zod";
import { PaymentService } from "../../domain/services/payment.service";
import { IdempotencyService } from "../../domain/services/idempotency.service";
import { authMiddleware } from "../middlewares/auth.middleware";
import { prisma } from "../../infrastructure/database/prisma";
import { ChargeNotFoundError } from "../../domain/errors/domain.errors";

const createChargeSchema = z.object({
  amount_in_cents: z.number().int().positive("Valor deve ser maior que zero em centavos"),
  currency: z.string().default("BRL"),
  payment_method: z.enum(["PIX", "CREDIT_CARD", "BOLETO"]),
  customer: z
    .object({
      name: z.string().min(2),
      email: z.string().email(),
      document: z.string().min(11),
    })
    .optional(),
  card: z
    .object({
      number: z.string().min(13).max(19),
      holder_name: z.string().min(2),
      exp_month: z.number().int().min(1).max(12),
      exp_year: z.number().int().min(2026),
      cvv: z.string().min(3).max(4),
    })
    .optional(),
  capture: z.boolean().default(true),
});

const refundSchema = z.object({
  amount_in_cents: z.number().int().positive("Valor de estorno deve ser maior que zero em centavos"),
  reason: z.string().min(3, "Motivo deve possuir ao menos 3 caracteres"),
});

export async function chargeController(app: FastifyInstance) {
  const paymentService = new PaymentService();
  const idempotencyService = new IdempotencyService();

  // Middleware de autenticação para todas as rotas de cobrança
  app.addHook("preHandler", authMiddleware);

  // POST /charges
  app.post("/charges", async (req, reply) => {
    const merchantId = req.merchant!.id;
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;

    if (!idempotencyKey) {
      return reply.status(400).send({
        type: "https://payflowcore.internal/errors/missing-idempotency-key",
        title: "Missing Idempotency-Key",
        status: 400,
        detail: "O cabeçalho 'Idempotency-Key' é obrigatório para operações financeiras.",
      });
    }

    const body = createChargeSchema.parse(req.body);

    const result = await idempotencyService.executeWithIdempotency(
      merchantId,
      idempotencyKey,
      body,
      async () => {
        const charge = await paymentService.createCharge({
          merchantId,
          amountInCents: BigInt(body.amount_in_cents),
          currency: body.currency,
          paymentMethod: body.payment_method,
          customer: body.customer,
          card: body.card
            ? {
                number: body.card.number,
                holderName: body.card.holder_name,
                expMonth: body.card.exp_month,
                expYear: body.card.exp_year,
                cvv: body.card.cvv,
              }
            : undefined,
          capture: body.capture,
        });

        return {
          statusCode: 201,
          data: {
            id: charge.id,
            merchant_id: charge.merchantId,
            amount_in_cents: charge.amountCents.toString(),
            fee_amount_cents: charge.feeAmountCents.toString(),
            net_amount_cents: charge.netAmountCents.toString(),
            currency: charge.currency,
            payment_method: charge.paymentMethod,
            status: charge.status,
            customer_name: charge.customerName,
            customer_email: charge.customerEmail,
            card_last4: charge.cardLast4,
            card_brand: charge.cardBrand,
            pix_qr_code: charge.pixQrCode,
            boleto_barcode: charge.boletoBarcode,
            ledger_tx_id: charge.ledgerTxId,
            paid_at: charge.paidAt,
            created_at: charge.createdAt,
          },
        };
      }
    );

    if (result.isCached) {
      reply.header("X-Cache-Lookup", "HIT");
    }

    return reply.status(result.statusCode).send(result.data);
  });

  // POST /charges/:id/refund
  app.post("/charges/:id/refund", async (req, reply) => {
    const { id } = req.params as { id: string };
    const merchantId = req.merchant!.id;
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;

    if (!idempotencyKey) {
      return reply.status(400).send({
        type: "https://payflowcore.internal/errors/missing-idempotency-key",
        title: "Missing Idempotency-Key",
        status: 400,
        detail: "O cabeçalho 'Idempotency-Key' é obrigatório para operações de estorno.",
      });
    }

    const body = refundSchema.parse(req.body);

    const result = await idempotencyService.executeWithIdempotency(
      merchantId,
      idempotencyKey,
      { chargeId: id, ...body },
      async () => {
        const refundResult = await paymentService.refundCharge({
          chargeId: id,
          amountInCents: BigInt(body.amount_in_cents),
          reason: body.reason,
        });

        return {
          statusCode: 200,
          data: refundResult,
        };
      }
    );

    if (result.isCached) {
      reply.header("X-Cache-Lookup", "HIT");
    }

    return reply.status(result.statusCode).send(result.data);
  });

  // GET /charges/:id
  app.get("/charges/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const charge = await prisma.charge.findUnique({
      where: { id },
      include: { refunds: true },
    });

    if (!charge) {
      throw new ChargeNotFoundError(id);
    }

    return reply.status(200).send({
      id: charge.id,
      merchant_id: charge.merchantId,
      amount_in_cents: charge.amountCents.toString(),
      fee_amount_cents: charge.feeAmountCents.toString(),
      net_amount_cents: charge.netAmountCents.toString(),
      currency: charge.currency,
      payment_method: charge.paymentMethod,
      status: charge.status,
      customer_name: charge.customerName,
      customer_email: charge.customerEmail,
      card_last4: charge.cardLast4,
      pix_qr_code: charge.pixQrCode,
      boleto_barcode: charge.boletoBarcode,
      ledger_tx_id: charge.ledgerTxId,
      paid_at: charge.paidAt,
      created_at: charge.createdAt,
      refunds: charge.refunds.map((r) => ({
        id: r.id,
        amount_in_cents: r.amountCents.toString(),
        reason: r.reason,
        created_at: r.createdAt,
      })),
    });
  });
}
