import { FastifyInstance } from "fastify";
import { z } from "zod";
import { LedgerService } from "../../domain/services/ledger.service";
import { authMiddleware } from "../middlewares/auth.middleware";
import { prisma } from "../../infrastructure/database/prisma";
import { randomUUID } from "crypto";

const createAccountSchema = z.object({
  code: z.string().min(3),
  name: z.string().min(3),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
  currency: z.string().default("BRL"),
  allow_overdraft: z.boolean().default(false),
});

const postLedgerTxSchema = z.object({
  type: z.enum(["PAYMENT_CAPTURE", "REFUND", "PAYOUT", "FEE_ASSESSMENT", "MANUAL_ADJUSTMENT"]),
  description: z.string().min(3),
  reference_type: z.string().optional(),
  reference_id: z.string().optional(),
  entries: z
    .array(
      z.object({
        account_id: z.string(),
        direction: z.enum(["DEBIT", "CREDIT"]),
        amount_in_cents: z.number().int().positive(),
      })
    )
    .min(2, "Uma transação contábil exige no mínimo 2 entradas (Débito e Crédito)"),
});

export async function ledgerController(app: FastifyInstance) {
  const ledgerService = new LedgerService();

  app.addHook("preHandler", authMiddleware);

  // POST /accounts
  app.post("/accounts", async (req, reply) => {
    const merchantId = req.merchant!.id;
    const body = createAccountSchema.parse(req.body);

    const account = await prisma.account.create({
      data: {
        id: randomUUID(),
        code: body.code,
        name: body.name,
        type: body.type,
        currency: body.currency,
        allowOverdraft: body.allow_overdraft,
        merchantId,
        currentBalanceCents: 0n,
      },
    });

    return reply.status(201).send({
      id: account.id,
      merchant_id: account.merchantId,
      code: account.code,
      name: account.name,
      type: account.type,
      currency: account.currency,
      allow_overdraft: account.allowOverdraft,
      current_balance_in_cents: account.currentBalanceCents.toString(),
      created_at: account.createdAt,
    });
  });

  // GET /accounts/:id/balance
  app.get("/accounts/:id/balance", async (req, reply) => {
    const { id } = req.params as { id: string };
    const account = await ledgerService.getAccountBalance(id);

    return reply.status(200).send({
      id: account.id,
      merchant_id: account.merchantId,
      code: account.code,
      name: account.name,
      type: account.type,
      currency: account.currency,
      allow_overdraft: account.allowOverdraft,
      current_balance_in_cents: account.currentBalanceCents.toString(),
      formatted_balance: account.balanceMoney.format(),
    });
  });

  // GET /accounts/:id/statement
  app.get("/accounts/:id/statement", async (req, reply) => {
    const { id } = req.params as { id: string };
    const query = req.query as { page?: string; limit?: string };
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;

    const statement = await ledgerService.getAccountStatement(id, page, limit);
    return reply.status(200).send(statement);
  });

  // POST /ledger/transactions
  app.post("/ledger/transactions", async (req, reply) => {
    const body = postLedgerTxSchema.parse(req.body);

    const tx = await ledgerService.postTransaction({
      type: body.type,
      description: body.description,
      referenceType: body.reference_type,
      referenceId: body.reference_id,
      entries: body.entries.map((e) => ({
        accountId: e.account_id,
        direction: e.direction,
        amountCents: BigInt(e.amount_in_cents),
      })),
    });

    return reply.status(201).send({
      id: tx.id,
      type: tx.type,
      description: tx.description,
      debit_total_in_cents: tx.getDebitTotal().toString(),
      credit_total_in_cents: tx.getCreditTotal().toString(),
      posted_at: tx.postedAt,
      entries: tx.entries.map((e) => ({
        id: e.id,
        account_id: e.accountId,
        direction: e.direction,
        amount_in_cents: e.amountCents.toString(),
      })),
    });
  });
}
