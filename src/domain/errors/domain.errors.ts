export class DomainError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number = 400) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnbalancedLedgerError extends DomainError {
  constructor(debitTotal: bigint, creditTotal: bigint) {
    super(
      `Lançamento contábil desbalanceado (RN-001): Débitos (${debitTotal} cents) != Créditos (${creditTotal} cents). Diferença: ${debitTotal - creditTotal} cents.`,
      "LEDGER_UNBALANCED_TRANSACTION",
      422
    );
  }
}

export class NegativeBalanceNotAllowedError extends DomainError {
  constructor(accountCode: string, currentBalance: bigint, attemptedDebit: bigint) {
    super(
      `Operação rejeitada (RN-004): Saldo insuficiente na conta ${accountCode}. Saldo atual: ${currentBalance} cents, Débito solicitado: ${attemptedDebit} cents.`,
      "INSUFFICIENT_FUNDS_OVERDRAFT_PROHIBITED",
      422
    );
  }
}

export class IdempotencyPayloadMismatchError extends DomainError {
  constructor(key: string) {
    super(
      `Conflito de idempotência (RN-003): A chave '${key}' já foi utilizada com parâmetros/payload diferentes.`,
      "IDEMPOTENCY_PAYLOAD_MISMATCH",
      409
    );
  }
}

export class IdempotencyConflictError extends DomainError {
  constructor(key: string) {
    super(
      `A chave de idempotência '${key}' está atualmente em processamento concorrente.`,
      "IDEMPOTENCY_IN_PROGRESS",
      409
    );
  }
}

export class RefundExceedsChargeAmountError extends DomainError {
  constructor(chargeId: string, requestedRefund: bigint, availableForRefund: bigint) {
    super(
      `Estorno inválido (RN-005): O valor solicitado (${requestedRefund} cents) excede o saldo remanescente disponível (${availableForRefund} cents) da cobrança ${chargeId}.`,
      "REFUND_EXCEEDS_CHARGE_AMOUNT",
      422
    );
  }
}

export class InvalidCurrencyError extends DomainError {
  constructor(message: string) {
    super(message, "INVALID_CURRENCY", 400);
  }
}

export class AccountNotFoundError extends DomainError {
  constructor(accountId: string) {
    super(`Conta contábil '${accountId}' não encontrada.`, "ACCOUNT_NOT_FOUND", 404);
  }
}

export class ChargeNotFoundError extends DomainError {
  constructor(chargeId: string) {
    super(`Cobrança '${chargeId}' não encontrada.`, "CHARGE_NOT_FOUND", 404);
  }
}

export class ChargeNotPaidError extends DomainError {
  constructor(chargeId: string, currentStatus: string) {
    super(
      `Cobrança '${chargeId}' não pode ser estornada pois está em status '${currentStatus}' (esperado: PAID).`,
      "CHARGE_NOT_PAID",
      422
    );
  }
}

export class InvalidPaymentDataError extends DomainError {
  constructor(message: string) {
    super(message, "INVALID_PAYMENT_DATA", 400);
  }
}
