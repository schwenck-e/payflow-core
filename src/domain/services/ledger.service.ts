import { prisma } from "../../infrastructure/database/prisma";
import {
  LedgerTransaction,
  TransactionType,
} from "../entities/ledger-transaction.entity";
import { Account, EntryDirection } from "../entities/account.entity";
import { AccountNotFoundError } from "../errors/domain.errors";
import { randomUUID } from "crypto";

export interface PostTransactionInput {
  type: TransactionType;
  description: string;
  referenceType?: string | null;
  referenceId?: string | null;
  entries: {
    accountId: string;
    direction: EntryDirection;
    amountCents: bigint;
  }[];
}

export class LedgerService {
  /**
   * Registra uma transação contábil de partidas dobradas de forma atômica (ACID).
   * Enforça:
   * 1. Soma de Débitos == Soma de Créditos (RN-001)
   * 2. Registros Append-Only Imutáveis (RN-002)
   * 3. Proibição de Saldo Negativo em contas protegidas (RN-004)
   */
  public async postTransaction(input: PostTransactionInput): Promise<LedgerTransaction> {
    const txId = randomUUID();

    // 1. Instanciação e validação matemática de domínio no objeto puro
    const domainTx = new LedgerTransaction({
      id: txId,
      type: input.type,
      description: input.description,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      entries: input.entries.map((e) => ({
        id: randomUUID(),
        transactionId: txId,
        accountId: e.accountId,
        direction: e.direction,
        amountCents: e.amountCents,
      })),
    });

    // 2. Persistência atômica no banco de dados via transação ACID
    return await prisma.$transaction(async (tx) => {
      // Cria a transação contábil mãe
      await tx.ledgerTransaction.create({
        data: {
          id: domainTx.id,
          type: domainTx.type,
          description: domainTx.description,
          referenceType: domainTx.referenceType,
          referenceId: domainTx.referenceId,
          postedAt: domainTx.postedAt,
        },
      });

      // Processa cada lançamento de débito ou crédito
      for (const entry of domainTx.entries) {
        const rawAccount = await tx.account.findUnique({
          where: { id: entry.accountId },
        });

        if (!rawAccount) {
          throw new AccountNotFoundError(entry.accountId);
        }

        const accountEntity = new Account({
          id: rawAccount.id,
          merchantId: rawAccount.merchantId,
          code: rawAccount.code,
          name: rawAccount.name,
          type: rawAccount.type,
          currency: rawAccount.currency,
          allowOverdraft: rawAccount.allowOverdraft,
          currentBalanceCents: rawAccount.currentBalanceCents,
        });

        // Valida e calcula o novo saldo (lança erro se violar RN-004)
        const newBalance = accountEntity.calculateNewBalance(entry.direction, entry.amountCents);

        // Insere a entrada contábil (Append-Only)
        await tx.ledgerEntry.create({
          data: {
            id: entry.id,
            transactionId: domainTx.id,
            accountId: entry.accountId,
            direction: entry.direction,
            amountCents: entry.amountCents,
            createdAt: entry.createdAt,
          },
        });

        // Atualiza o snapshot de saldo da conta
        await tx.account.update({
          where: { id: rawAccount.id },
          data: { currentBalanceCents: newBalance },
        });
      }

      return domainTx;
    });
  }

  /**
   * Consulta saldo atualizado de uma conta contábil
   */
  public async getAccountBalance(accountId: string): Promise<Account> {
    const raw = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!raw) {
      throw new AccountNotFoundError(accountId);
    }

    return new Account({
      id: raw.id,
      merchantId: raw.merchantId,
      code: raw.code,
      name: raw.name,
      type: raw.type,
      currency: raw.currency,
      allowOverdraft: raw.allowOverdraft,
      currentBalanceCents: raw.currentBalanceCents,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  /**
   * Consulta extrato detalhado de lançamentos contábeis de uma conta
   */
  public async getAccountStatement(accountId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [total, entries] = await Promise.all([
      prisma.ledgerEntry.count({ where: { accountId } }),
      prisma.ledgerEntry.findMany({
        where: { accountId },
        include: { transaction: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      accountId,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      entries: entries.map((e) => ({
        id: e.id,
        transactionId: e.transactionId,
        direction: e.direction,
        amountCents: e.amountCents.toString(),
        description: e.transaction.description,
        type: e.transaction.type,
        createdAt: e.createdAt,
      })),
    };
  }
}
