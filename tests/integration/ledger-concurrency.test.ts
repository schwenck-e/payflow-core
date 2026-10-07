import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { LedgerService } from "../../src/domain/services/ledger.service";
import { prisma } from "../../src/infrastructure/database/prisma";
import { NegativeBalanceNotAllowedError } from "../../src/domain/errors/domain.errors";
import { randomUUID } from "crypto";

describe("Ledger Concurrency & Deadlock Prevention (RN-001 & RN-004)", () => {
  const ledgerService = new LedgerService();
  const testPrefix = `test_conc_${randomUUID().substring(0, 8)}`;
  let accountAId: string;
  let accountBId: string;
  let accountProtectedId: string;

  beforeAll(async () => {
    // Cria contas de teste dedicadas
    const accA = await prisma.account.create({
      data: {
        code: `${testPrefix}_A`,
        name: "Test Account A",
        type: "ASSET",
        currency: "BRL",
        allowOverdraft: true,
        currentBalanceCents: 100000n, // R$ 1.000,00
      },
    });
    accountAId = accA.id;

    const accB = await prisma.account.create({
      data: {
        code: `${testPrefix}_B`,
        name: "Test Account B",
        type: "ASSET",
        currency: "BRL",
        allowOverdraft: true,
        currentBalanceCents: 100000n, // R$ 1.000,00
      },
    });
    accountBId = accB.id;

    const accProtected = await prisma.account.create({
      data: {
        code: `${testPrefix}_PROT`,
        name: "Test Protected Account",
        type: "LIABILITY",
        currency: "BRL",
        allowOverdraft: false, // Proibido saldo negativo
        currentBalanceCents: 500n, // R$ 5,00
      },
    });
    accountProtectedId = accProtected.id;
  });

  afterAll(async () => {
    // Limpeza de dados de teste
    await prisma.ledgerEntry.deleteMany({
      where: {
        accountId: { in: [accountAId, accountBId, accountProtectedId] },
      },
    });
    await prisma.account.deleteMany({
      where: {
        id: { in: [accountAId, accountBId, accountProtectedId] },
      },
    });
  });

  it("deve executar transferências cruzadas simultâneas sem deadlock (ordenação por accountId)", async () => {
    // 5 transferências A -> B (A debita, B credita se passivo, ou ambos no Ativo: A credita/diminui, B debita/aumenta)
    // Para duas contas ASSET:
    // Transferência de A para B: B aumenta (+DEBIT), A diminui (+CREDIT)
    const transferAtoB = () =>
      ledgerService.postTransaction({
        type: "MANUAL_ADJUSTMENT",
        description: "Transferência concorrente A -> B",
        entries: [
          { accountId: accountAId, direction: "CREDIT", amountCents: 1000n },
          { accountId: accountBId, direction: "DEBIT", amountCents: 1000n },
        ],
      });

    // Transferência inversa B para A: A aumenta (+DEBIT), B diminui (+CREDIT)
    const transferBtoA = () =>
      ledgerService.postTransaction({
        type: "MANUAL_ADJUSTMENT",
        description: "Transferência concorrente B -> A",
        entries: [
          { accountId: accountBId, direction: "CREDIT", amountCents: 1000n },
          { accountId: accountAId, direction: "DEBIT", amountCents: 1000n },
        ],
      });

    // Dispara 4 transferências cruzadas simultâneas (2 de ida e 2 de volta em paralelo)
    const promises = [
      transferAtoB(),
      transferBtoA(),
      transferAtoB(),
      transferBtoA(),
    ];

    const results = await Promise.all(promises);
    expect(results.length).toBe(4);

    // Validação de integridade de saldo após 2 idas e 2 vindas idênticas
    const balanceA = await ledgerService.getAccountBalance(accountAId);
    const balanceB = await ledgerService.getAccountBalance(accountBId);

    // O saldo deve ser exatamente o inicial pois 2 * 1000n debitados = 2 * 1000n creditados
    expect(balanceA.currentBalanceCents).toBe(100000n);
    expect(balanceB.currentBalanceCents).toBe(100000n);
  });

  it("deve impedir saldo negativo em contas protegidas (RN-004) mantendo atomicidade", async () => {
    // Tenta debitar 1000 cents de uma conta LIABILITY com saldo 500 cents e allowOverdraft=false
    // Em LIABILITY: DEBIT reduz o saldo. 500 - 1000 = -500 (negativo proibido!)
    await expect(
      ledgerService.postTransaction({
        type: "MANUAL_ADJUSTMENT",
        description: "Tentativa de overdraft em conta protegida",
        entries: [
          { accountId: accountProtectedId, direction: "DEBIT", amountCents: 1000n },
          { accountId: accountAId, direction: "CREDIT", amountCents: 1000n },
        ],
      })
    ).rejects.toThrow(NegativeBalanceNotAllowedError);

    // Garante que o saldo permaneceu inalterado
    const protBalance = await ledgerService.getAccountBalance(accountProtectedId);
    expect(protBalance.currentBalanceCents).toBe(500n);
  });
});
