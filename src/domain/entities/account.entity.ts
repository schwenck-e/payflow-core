import { NegativeBalanceNotAllowedError } from "../errors/domain.errors";
import { Money } from "../value-objects/money.vo";

export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
export type EntryDirection = "DEBIT" | "CREDIT";

export interface AccountProps {
  id: string;
  merchantId?: string | null;
  code: string;
  name: string;
  type: AccountType;
  currency?: string;
  allowOverdraft?: boolean;
  currentBalanceCents?: bigint;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Account {
  public readonly id: string;
  public readonly merchantId: string | null;
  public readonly code: string;
  public readonly name: string;
  public readonly type: AccountType;
  public readonly currency: string;
  public readonly allowOverdraft: boolean;
  private _currentBalanceCents: bigint;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: AccountProps) {
    this.id = props.id;
    this.merchantId = props.merchantId ?? null;
    this.code = props.code;
    this.name = props.name;
    this.type = props.type;
    this.currency = props.currency ?? "BRL";
    this.allowOverdraft = props.allowOverdraft ?? false;
    this._currentBalanceCents = props.currentBalanceCents ?? 0n;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  public get currentBalanceCents(): bigint {
    return this._currentBalanceCents;
  }

  public get balanceMoney(): Money {
    return Money.fromCents(this._currentBalanceCents, this.currency);
  }

  /**
   * Calcula o impacto de um lançamento na conta respeitando a natureza contábil:
   * - ASSET / EXPENSE: aumentam com DÉBITO, diminuem com CRÉDITO.
   * - LIABILITY / EQUITY / REVENUE: aumentam com CRÉDITO, diminuem com DÉBITO.
   */
  public calculateNewBalance(direction: EntryDirection, amountCents: bigint): bigint {
    let delta = 0n;

    if (this.type === "ASSET" || this.type === "EXPENSE") {
      delta = direction === "DEBIT" ? amountCents : -amountCents;
    } else {
      // LIABILITY, EQUITY, REVENUE
      delta = direction === "CREDIT" ? amountCents : -amountCents;
    }

    const newBalance = this._currentBalanceCents + delta;

    // Regra RN-004: Prevenção de saldo negativo em contas que não permitem overdraft
    if (!this.allowOverdraft && newBalance < 0n) {
      throw new NegativeBalanceNotAllowedError(this.code, this._currentBalanceCents, amountCents);
    }

    return newBalance;
  }

  public applyBalanceDelta(direction: EntryDirection, amountCents: bigint): void {
    this._currentBalanceCents = this.calculateNewBalance(direction, amountCents);
  }
}
