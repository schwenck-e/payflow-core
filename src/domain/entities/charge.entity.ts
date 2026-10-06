import { RefundExceedsChargeAmountError, ChargeNotPaidError } from "../errors/domain.errors";
import { Money } from "../value-objects/money.vo";

export type PaymentMethod = "PIX" | "CREDIT_CARD" | "BOLETO";
export type ChargeStatus = "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "REFUNDED";

export interface ChargeProps {
  id: string;
  merchantId: string;
  amountCents: bigint;
  feeAmountCents?: bigint;
  netAmountCents?: bigint;
  currency?: string;
  paymentMethod: PaymentMethod;
  status?: ChargeStatus;
  customerName?: string | null;
  customerEmail?: string | null;
  customerDoc?: string | null;
  cardLast4?: string | null;
  cardBrand?: string | null;
  pixQrCode?: string | null;
  boletoBarcode?: string | null;
  ledgerTxId?: string | null;
  createdAt?: Date;
  paidAt?: Date | null;
  updatedAt?: Date;
}

export class Charge {
  public readonly id: string;
  public readonly merchantId: string;
  public readonly amountCents: bigint;
  public feeAmountCents: bigint;
  public netAmountCents: bigint;
  public readonly currency: string;
  public readonly paymentMethod: PaymentMethod;
  private _status: ChargeStatus;
  public readonly customerName: string | null;
  public readonly customerEmail: string | null;
  public readonly customerDoc: string | null;
  public readonly cardLast4: string | null;
  public readonly cardBrand: string | null;
  public readonly pixQrCode: string | null;
  public readonly boletoBarcode: string | null;
  public ledgerTxId: string | null;
  public readonly createdAt: Date;
  public paidAt: Date | null;
  public updatedAt: Date;

  constructor(props: ChargeProps) {
    this.id = props.id;
    this.merchantId = props.merchantId;
    this.amountCents = props.amountCents;
    this.feeAmountCents = props.feeAmountCents ?? 0n;
    this.netAmountCents = props.netAmountCents ?? (props.amountCents - (props.feeAmountCents ?? 0n));
    this.currency = props.currency ?? "BRL";
    this.paymentMethod = props.paymentMethod;
    this._status = props.status ?? "PENDING";
    this.customerName = props.customerName ?? null;
    this.customerEmail = props.customerEmail ?? null;
    this.customerDoc = props.customerDoc ?? null;
    this.cardLast4 = props.cardLast4 ?? null;
    this.cardBrand = props.cardBrand ?? null;
    this.pixQrCode = props.pixQrCode ?? null;
    this.boletoBarcode = props.boletoBarcode ?? null;
    this.ledgerTxId = props.ledgerTxId ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this.paidAt = props.paidAt ?? null;
    this.updatedAt = props.updatedAt ?? new Date();
  }

  public get status(): ChargeStatus {
    return this._status;
  }

  public get amountMoney(): Money {
    return Money.fromCents(this.amountCents, this.currency);
  }

  public markAsPaid(ledgerTxId: string, feeCents: bigint = 0n): void {
    this._status = "PAID";
    this.paidAt = new Date();
    this.feeAmountCents = feeCents;
    this.netAmountCents = this.amountCents - feeCents;
    this.ledgerTxId = ledgerTxId;
    this.updatedAt = new Date();
  }

  public markAsFailed(): void {
    this._status = "FAILED";
    this.updatedAt = new Date();
  }

  public markAsRefunded(): void {
    this._status = "REFUNDED";
    this.updatedAt = new Date();
  }

  /**
   * Valida se um estorno é permitido respeitando a RN-005
   */
  public validateRefund(requestedRefundCents: bigint, alreadyRefundedCents: bigint = 0n): void {
    if (this._status !== "PAID" && this._status !== "REFUNDED") {
      throw new ChargeNotPaidError(this.id, this._status);
    }

    const availableForRefund = this.amountCents - alreadyRefundedCents;
    if (requestedRefundCents > availableForRefund) {
      throw new RefundExceedsChargeAmountError(this.id, requestedRefundCents, availableForRefund);
    }
  }

  /**
   * Validação de cartão pelo Algoritmo de Luhn
   */
  public static validateLuhn(cardNumber: string): boolean {
    const sanitized = cardNumber.replace(/\D/g, "");
    if (sanitized.length < 13 || sanitized.length > 19) return false;

    let sum = 0;
    let shouldDouble = false;

    for (let i = sanitized.length - 1; i >= 0; i--) {
      let digit = parseInt(sanitized.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  }
}
