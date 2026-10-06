import { describe, it, expect } from "bun:test";
import { Account } from "../../src/domain/entities/account.entity";
import { NegativeBalanceNotAllowedError } from "../../src/domain/errors/domain.errors";

describe("Account Entity & Accounting Balances", () => {
  it("deve calcular impacto de Débito e Crédito em contas de Ativo (ASSET)", () => {
    const assetAccount = new Account({
      id: "acc_asset_1",
      code: "1.1.01.001",
      name: "Caixa",
      type: "ASSET",
      currentBalanceCents: 1000n,
    });

    // Ativo aumenta com débito
    const balAfterDebit = assetAccount.calculateNewBalance("DEBIT", 500n);
    expect(balAfterDebit).toBe(1500n);

    // Ativo diminui com crédito
    const balAfterCredit = assetAccount.calculateNewBalance("CREDIT", 400n);
    expect(balAfterCredit).toBe(600n);
  });

  it("deve calcular impacto em contas de Passivo (LIABILITY / Wallet do Merchant)", () => {
    const walletAccount = new Account({
      id: "acc_wallet_1",
      code: "2.1.01.001",
      name: "Merchant Wallet",
      type: "LIABILITY",
      currentBalanceCents: 5000n,
    });

    // Passivo aumenta com crédito (saldo disponível do merchant cresce)
    const balAfterCredit = walletAccount.calculateNewBalance("CREDIT", 2000n);
    expect(balAfterCredit).toBe(7000n);

    // Passivo diminui com débito (ex: saque ou estorno)
    const balAfterDebit = walletAccount.calculateNewBalance("DEBIT", 1000n);
    expect(balAfterDebit).toBe(4000n);
  });

  it("deve lançar NegativeBalanceNotAllowedError se o saldo for ficar negativo e overdraft for desabilitado (RN-004)", () => {
    const protectedWallet = new Account({
      id: "acc_wallet_protected",
      code: "2.1.01.001",
      name: "Merchant Wallet",
      type: "LIABILITY",
      allowOverdraft: false,
      currentBalanceCents: 1000n,
    });

    expect(() => protectedWallet.calculateNewBalance("DEBIT", 1500n)).toThrow(
      NegativeBalanceNotAllowedError
    );
  });
});
