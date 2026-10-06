import { describe, it, expect } from "bun:test";
import { Money } from "../../src/domain/value-objects/money.vo";
import { InvalidCurrencyError } from "../../src/domain/errors/domain.errors";

describe("Money Value Object (Minor Units / Zero Floating Point)", () => {
  it("deve criar valores monetários a partir de centavos inteiros", () => {
    const m = Money.fromCents(1050n, "BRL");
    expect(m.amountInCents).toBe(1050n);
    expect(m.currency).toBe("BRL");
    expect(m.toDecimal()).toBe(10.5);
  });

  it("deve criar valores a partir de string decimal com precisão exata", () => {
    const m = Money.fromDecimal("150.99", "BRL");
    expect(m.amountInCents).toBe(15099n);
  });

  it("deve somar e subtrair valores preservando centavos sem erros IEEE 754", () => {
    const m1 = Money.fromCents(1000n);
    const m2 = Money.fromCents(250n);

    const sum = m1.add(m2);
    expect(sum.amountInCents).toBe(1250n);

    const diff = m1.subtract(m2);
    expect(diff.amountInCents).toBe(750n);
  });

  it("deve lançar InvalidCurrencyError ao tentar somar moedas diferentes", () => {
    const brl = Money.fromCents(100n, "BRL");
    const usd = Money.fromCents(100n, "USD");

    expect(() => brl.add(usd)).toThrow(InvalidCurrencyError);
  });

  it("deve alocar centavos proporcionalmente sem perder centavos residuais", () => {
    const total = Money.fromCents(100n); // R$ 1,00 para dividir em 3 partes
    const shares = total.allocate([1, 1, 1]);

    expect(shares.length).toBe(3);
    const sumAllocated = shares.reduce((acc, s) => acc + s.amountInCents, 0n);
    expect(sumAllocated).toBe(100n); // Nenhum centavo é perdido!
  });
});
