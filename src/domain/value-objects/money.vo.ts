import { InvalidCurrencyError } from "../errors/domain.errors";

export class Money {
  public readonly amountInCents: bigint;
  public readonly currency: string;

  private constructor(amountInCents: bigint, currency: string = "BRL") {
    this.amountInCents = amountInCents;
    this.currency = currency.toUpperCase();
  }

  public static fromCents(cents: number | bigint | string, currency: string = "BRL"): Money {
    const bigCents = typeof cents === "bigint" ? cents : BigInt(cents);
    return new Money(bigCents, currency);
  }

  public static fromDecimal(decimal: number | string, currency: string = "BRL"): Money {
    const str = typeof decimal === "number" ? decimal.toFixed(2) : decimal;
    const parts = str.split(".");
    const whole = parts[0] || "0";
    const fraction = (parts[1] || "").padEnd(2, "0").slice(0, 2);
    const totalCents = BigInt(whole) * 100n + BigInt(fraction);
    return new Money(totalCents, currency);
  }

  public static zero(currency: string = "BRL"): Money {
    return new Money(0n, currency);
  }

  public add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amountInCents + other.amountInCents, this.currency);
  }

  public subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amountInCents - other.amountInCents, this.currency);
  }

  public multiply(factor: number): Money {
    // Multiplicação inteira usando escala por 10000 para precisão de bases decimais
    const scaledFactor = BigInt(Math.round(factor * 10000));
    const result = (this.amountInCents * scaledFactor) / 10000n;
    return new Money(result, this.currency);
  }

  public allocate(ratios: number[]): Money[] {
    if (ratios.length === 0) return [];
    const totalRatio = ratios.reduce((sum, r) => sum + r, 0);
    if (totalRatio <= 0) {
      throw new Error("Soma das razões de alocação deve ser maior que zero.");
    }

    let remainder = this.amountInCents;
    const results: Money[] = [];

    for (let i = 0; i < ratios.length; i++) {
      const share = (this.amountInCents * BigInt(Math.round(ratios[i]! * 10000))) / BigInt(Math.round(totalRatio * 10000));
      results.push(new Money(share, this.currency));
      remainder -= share;
    }

    // Distribui os centavos residuais sem gerar furos contábeis
    for (let i = 0; remainder > 0n && i < results.length; i++) {
      results[i] = new Money(results[i]!.amountInCents + 1n, this.currency);
      remainder -= 1n;
    }

    return results;
  }

  public isZero(): boolean {
    return this.amountInCents === 0n;
  }

  public isPositive(): boolean {
    return this.amountInCents > 0n;
  }

  public isNegative(): boolean {
    return this.amountInCents < 0n;
  }

  public toDecimal(): number {
    return Number(this.amountInCents) / 100;
  }

  public format(locale: string = "pt-BR"): string {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: this.currency,
    }).format(this.toDecimal());
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new InvalidCurrencyError(
        `Incompatibilidade de moedas: operação entre ${this.currency} e ${other.currency} não permitida.`
      );
    }
  }
}
