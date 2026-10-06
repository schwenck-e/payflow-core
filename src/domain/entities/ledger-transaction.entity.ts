import { UnbalancedLedgerError } from "../errors/domain.errors";
import { EntryDirection } from "./account.entity";

export type TransactionType =
  | "PAYMENT_CAPTURE"
  | "REFUND"
  | "PAYOUT"
  | "FEE_ASSESSMENT"
  | "MANUAL_ADJUSTMENT";

export interface LedgerEntryProps {
  id: string;
  transactionId: string;
  accountId: string;
  direction: EntryDirection;
  amountCents: bigint;
  createdAt?: Date;
}

export class LedgerEntry {
  public readonly id: string;
  public readonly transactionId: string;
  public readonly accountId: string;
  public readonly direction: EntryDirection;
  public readonly amountCents: bigint;
  public readonly createdAt: Date;

  constructor(props: LedgerEntryProps) {
    if (props.amountCents <= 0n) {
      throw new Error(`Entrada contábil inválida: o valor em centavos deve ser estritamente maior que zero.`);
    }
    this.id = props.id;
    this.transactionId = props.transactionId;
    this.accountId = props.accountId;
    this.direction = props.direction;
    this.amountCents = props.amountCents;
    this.createdAt = props.createdAt ?? new Date();
  }

  public isDebit(): boolean {
    return this.direction === "DEBIT";
  }

  public isCredit(): boolean {
    return this.direction === "CREDIT";
  }
}

export interface LedgerTransactionProps {
  id: string;
  type: TransactionType;
  description: string;
  referenceType?: string | null;
  referenceId?: string | null;
  postedAt?: Date;
  entries: LedgerEntryProps[];
}

export class LedgerTransaction {
  public readonly id: string;
  public readonly type: TransactionType;
  public readonly description: string;
  public readonly referenceType: string | null;
  public readonly referenceId: string | null;
  public readonly postedAt: Date;
  public readonly entries: LedgerEntry[];

  constructor(props: LedgerTransactionProps) {
    this.id = props.id;
    this.type = props.type;
    this.description = props.description;
    this.referenceType = props.referenceType ?? null;
    this.referenceId = props.referenceId ?? null;
    this.postedAt = props.postedAt ?? new Date();

    if (!props.entries || props.entries.length < 2) {
      throw new Error(
        `Lançamento contábil inválido: uma transação de partidas dobradas deve conter no mínimo 2 lançamentos (1 débito e 1 crédito).`
      );
    }

    this.entries = props.entries.map((e) => new LedgerEntry(e));
    this.validateAccountingInvariant();
  }

  public getDebitTotal(): bigint {
    return this.entries
      .filter((e) => e.isDebit())
      .reduce((sum, e) => sum + e.amountCents, 0n);
  }

  public getCreditTotal(): bigint {
    return this.entries
      .filter((e) => e.isCredit())
      .reduce((sum, e) => sum + e.amountCents, 0n);
  }

  /**
   * Validação estrita da Invariante Contábil de Partidas Dobradas (RN-001)
   * Soma de Débitos DEVE ser igual à Soma de Créditos.
   */
  public validateAccountingInvariant(): void {
    const debitTotal = this.getDebitTotal();
    const creditTotal = this.getCreditTotal();

    if (debitTotal !== creditTotal) {
      throw new UnbalancedLedgerError(debitTotal, creditTotal);
    }
  }
}
