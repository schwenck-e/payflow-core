import { describe, it, expect } from "bun:test";
import { LedgerTransaction } from "../../src/domain/entities/ledger-transaction.entity";
import { UnbalancedLedgerError } from "../../src/domain/errors/domain.errors";

describe("Double-Entry Ledger Invariant (RN-001)", () => {
  it("deve criar uma transação de partidas dobradas quando a soma dos débitos for exatamente igual à dos créditos", () => {
    const tx = new LedgerTransaction({
      id: "tx_123",
      type: "PAYMENT_CAPTURE",
      description: "Liquidação de venda com taxa",
      entries: [
        {
          id: "entry_1",
          transactionId: "tx_123",
          accountId: "acc_clearing",
          direction: "DEBIT",
          amountCents: 10000n, // R$ 100,00
        },
        {
          id: "entry_2",
          transactionId: "tx_123",
          accountId: "acc_wallet",
          direction: "CREDIT",
          amountCents: 9750n, // R$ 97,50
        },
        {
          id: "entry_3",
          transactionId: "tx_123",
          accountId: "acc_fee",
          direction: "CREDIT",
          amountCents: 250n, // R$ 2,50
        },
      ],
    });

    expect(tx.getDebitTotal()).toBe(10000n);
    expect(tx.getCreditTotal()).toBe(10000n);
    expect(tx.getDebitTotal()).toBe(tx.getCreditTotal());
  });

  it("deve lançar UnbalancedLedgerError se houver divergência de 1 centavo sequer entre débitos e créditos (RN-001)", () => {
    expect(() => {
      new LedgerTransaction({
        id: "tx_unbalanced",
        type: "PAYMENT_CAPTURE",
        description: "Transação com 1 centavo de diferença",
        entries: [
          {
            id: "entry_1",
            transactionId: "tx_unbalanced",
            accountId: "acc_clearing",
            direction: "DEBIT",
            amountCents: 10000n, // R$ 100,00
          },
          {
            id: "entry_2",
            transactionId: "tx_unbalanced",
            accountId: "acc_wallet",
            direction: "CREDIT",
            amountCents: 9999n, // R$ 99,99 (Diferença de 1 centavo!)
          },
        ],
      });
    }).toThrow(UnbalancedLedgerError);
  });
});
