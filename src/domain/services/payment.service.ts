import { prisma } from "../../infrastructure/database/prisma";
import { Charge, PaymentMethod } from "../entities/charge.entity";
import {
  ChargeNotFoundError,
  InvalidPaymentDataError,
} from "../errors/domain.errors";
import { LedgerService } from "./ledger.service";
import { randomUUID } from "crypto";

export interface CreateChargeInput {
  merchantId: string;
  amountInCents: bigint;
  currency?: string;
  paymentMethod: PaymentMethod;
  customer?: {
    name: string;
    email: string;
    document: string;
  };
  card?: {
    number: string;
    holderName: string;
    expMonth: number;
    expYear: number;
    cvv: string;
  };
  capture?: boolean;
}

export interface RefundChargeInput {
  chargeId: string;
  amountInCents: bigint;
  reason: string;
}

export class PaymentService {
  private ledgerService: LedgerService;

  constructor(ledgerService?: LedgerService) {
    this.ledgerService = ledgerService ?? new LedgerService();
  }

  /**
   * Processa uma nova cobrança com orquestração contábil atômica
   */
  public async createCharge(input: CreateChargeInput): Promise<Charge> {
    if (input.amountInCents <= 0n) {
      throw new InvalidPaymentDataError("O valor da cobrança deve ser maior que zero.");
    }

    const chargeId = randomUUID();
    let cardLast4: string | null = null;
    let cardBrand: string | null = null;
    let pixQrCode: string | null = null;
    let boletoBarcode: string | null = null;
    let initialStatus: "PENDING" | "AUTHORIZED" | "PAID" = "PENDING";

    // 1. Validação específica por método de pagamento
    if (input.paymentMethod === "CREDIT_CARD") {
      if (!input.card) {
        throw new InvalidPaymentDataError("Dados do cartão de crédito são obrigatórios.");
      }

      // Validação do algoritmo de Luhn
      if (!Charge.validateLuhn(input.card.number)) {
        throw new InvalidPaymentDataError("Número de cartão de crédito inválido (Luhn check failed).");
      }

      // Validação de expiração do cartão
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      if (
        input.card.expYear < currentYear ||
        (input.card.expYear === currentYear && input.card.expMonth < currentMonth)
      ) {
        throw new InvalidPaymentDataError("Cartão de crédito expirado.");
      }

      const cleanNum = input.card.number.replace(/\D/g, "");
      cardLast4 = cleanNum.slice(-4);
      cardBrand = cleanNum.startsWith("4") ? "VISA" : cleanNum.startsWith("5") ? "MASTERCARD" : "ELO";

      initialStatus = input.capture !== false ? "PAID" : "AUTHORIZED";
    } else if (input.paymentMethod === "PIX") {
      // Geração de payload Pix copia-e-cola simulado em formato EMV
      pixQrCode = `00020126580014br.gov.bcb.pix0136${randomUUID()}5204000053039865405${(Number(input.amountInCents) / 100).toFixed(2)}5802BR5913Payflow Core6009Sao Paulo62070503***6304`;
      initialStatus = "PENDING";
    } else if (input.paymentMethod === "BOLETO") {
      // Geração de linha digitável de boleto simulada
      boletoBarcode = `34191.79001 01043.510047 91020.150008 8 ${Math.floor(Date.now() / 1000)}${input.amountInCents.toString().padStart(10, "0")}`;
      initialStatus = "PENDING";
    }

    // Cálculo da taxa de processamento (Fee da Plataforma: 2.5% padrão)
    // Escala com preservação de centavos inteiros
    const feeRateBasisPoints = 250n; // 2.5% = 250 bps
    const feeAmountCents = (input.amountInCents * feeRateBasisPoints) / 10000n;
    const netAmountCents = input.amountInCents - feeAmountCents;

    let ledgerTxId: string | null = null;

    // 2. Se a cobrança for capturada imediatamente (ex: Cartão direto), posta no Ledger
    if (initialStatus === "PAID") {
      ledgerTxId = await this.settleChargeInLedger(
        chargeId,
        input.merchantId,
        input.amountInCents,
        feeAmountCents,
        netAmountCents
      );
    }

    // 3. Persistência da cobrança
    const rawCharge = await prisma.charge.create({
      data: {
        id: chargeId,
        merchantId: input.merchantId,
        amountCents: input.amountInCents,
        feeAmountCents,
        netAmountCents,
        currency: input.currency ?? "BRL",
        paymentMethod: input.paymentMethod,
        status: initialStatus,
        customerName: input.customer?.name,
        customerEmail: input.customer?.email,
        customerDoc: input.customer?.document,
        cardLast4,
        cardBrand,
        pixQrCode,
        boletoBarcode,
        ledgerTxId,
        paidAt: initialStatus === "PAID" ? new Date() : null,
      },
    });

    return new Charge({
      id: rawCharge.id,
      merchantId: rawCharge.merchantId,
      amountCents: rawCharge.amountCents,
      feeAmountCents: rawCharge.feeAmountCents,
      netAmountCents: rawCharge.netAmountCents,
      currency: rawCharge.currency,
      paymentMethod: rawCharge.paymentMethod,
      status: rawCharge.status,
      customerName: rawCharge.customerName,
      customerEmail: rawCharge.customerEmail,
      customerDoc: rawCharge.customerDoc,
      cardLast4: rawCharge.cardLast4,
      cardBrand: rawCharge.cardBrand,
      pixQrCode: rawCharge.pixQrCode,
      boletoBarcode: rawCharge.boletoBarcode,
      ledgerTxId: rawCharge.ledgerTxId,
      createdAt: rawCharge.createdAt,
      paidAt: rawCharge.paidAt,
      updatedAt: rawCharge.updatedAt,
    });
  }

  /**
   * Confirma o pagamento de uma cobrança pendente (ex: Pix recebido ou Boleto compensado)
   */
  public async confirmPayment(chargeId: string): Promise<Charge> {
    const raw = await prisma.charge.findUnique({ where: { id: chargeId } });
    if (!raw) {
      throw new ChargeNotFoundError(chargeId);
    }

    if (raw.status === "PAID") {
      // Já pago anteriormente
      return new Charge(raw);
    }

    // Liquidação contábil no Ledger
    const ledgerTxId = await this.settleChargeInLedger(
      chargeId,
      raw.merchantId,
      raw.amountCents,
      raw.feeAmountCents,
      raw.netAmountCents
    );

    const updated = await prisma.charge.update({
      where: { id: chargeId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        ledgerTxId,
      },
    });

    return new Charge(updated);
  }

  /**
   * Executa estorno total ou parcial com contrapartida contábil simétrica (RN-005)
   */
  public async refundCharge(input: RefundChargeInput) {
    const rawCharge = await prisma.charge.findUnique({
      where: { id: input.chargeId },
      include: { refunds: true },
    });

    if (!rawCharge) {
      throw new ChargeNotFoundError(input.chargeId);
    }

    const domainCharge = new Charge(rawCharge);

    // Soma de estornos anteriores
    const alreadyRefunded = rawCharge.refunds.reduce(
      (sum, r) => sum + r.amountCents,
      0n
    );

    // Validação estrita da RN-005 (não permite estorno maior que o valor disponível)
    domainCharge.validateRefund(input.amountInCents, alreadyRefunded);

    // Proporção de estorno da taxa
    const refundRatio = Number(input.amountInCents) / Number(rawCharge.amountCents);
    const feeRefundCents = BigInt(Math.round(Number(rawCharge.feeAmountCents) * refundRatio));
    const netRefundCents = input.amountInCents - feeRefundCents;

    // Resgata as contas do Merchant e da Plataforma
    const clearingAccount = await prisma.account.findUniqueOrThrow({
      where: { code: "1.1.01.001" },
    });
    const merchantWallet = await prisma.account.findFirstOrThrow({
      where: { merchantId: rawCharge.merchantId, type: "LIABILITY" },
    });
    const feeRevenueAccount = await prisma.account.findUniqueOrThrow({
      where: { code: "4.1.01.001" },
    });

    // Lançamento contábil de compensação (REVERSAL):
    // CRÉDITO na conta de Clearing: input.amountInCents
    // DÉBITO na conta do Merchant: netRefundCents
    // DÉBITO na conta de Receita de Taxa: feeRefundCents
    // Soma Débitos = netRefundCents + feeRefundCents = input.amountInCents == Soma Créditos (RN-001)
    const ledgerTx = await this.ledgerService.postTransaction({
      type: "REFUND",
      description: `Estorno de cobrança ${rawCharge.id}: ${input.reason}`,
      referenceType: "CHARGE_REFUND",
      referenceId: rawCharge.id,
      entries: [
        {
          accountId: clearingAccount.id,
          direction: "CREDIT",
          amountCents: input.amountInCents,
        },
        {
          accountId: merchantWallet.id,
          direction: "DEBIT",
          amountCents: netRefundCents,
        },
        {
          accountId: feeRevenueAccount.id,
          direction: "DEBIT",
          amountCents: feeRefundCents,
        },
      ],
    });

    // Criação do registro de Refund
    const refundRecord = await prisma.refund.create({
      data: {
        id: randomUUID(),
        chargeId: rawCharge.id,
        amountCents: input.amountInCents,
        reason: input.reason,
        ledgerTxId: ledgerTx.id,
      },
    });

    const isFullyRefunded = alreadyRefunded + input.amountInCents >= rawCharge.amountCents;

    if (isFullyRefunded) {
      await prisma.charge.update({
        where: { id: rawCharge.id },
        data: { status: "REFUNDED" },
      });
    }

    return {
      refund_id: refundRecord.id,
      charge_id: rawCharge.id,
      amount_in_cents: refundRecord.amountCents.toString(),
      reason: refundRecord.reason,
      ledger_tx_id: ledgerTx.id,
      status: isFullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED",
    };
  }

  /**
   * Helper para liquidar o pagamento no Ledger de Partidas Dobradas
   */
  private async settleChargeInLedger(
    chargeId: string,
    merchantId: string,
    grossAmountCents: bigint,
    feeAmountCents: bigint,
    netAmountCents: bigint
  ): Promise<string> {
    const clearingAccount = await prisma.account.findUniqueOrThrow({
      where: { code: "1.1.01.001" },
    });
    const merchantWallet = await prisma.account.findFirstOrThrow({
      where: { merchantId, type: "LIABILITY" },
    });
    const feeRevenueAccount = await prisma.account.findUniqueOrThrow({
      where: { code: "4.1.01.001" },
    });

    // Lançamento de Partidas Dobradas:
    // DEBIT: Clearing Account (Ativo) -> +grossAmountCents
    // CREDIT: Merchant Wallet (Passivo) -> +netAmountCents
    // CREDIT: Platform Fee (Receita) -> +feeAmountCents
    // Débito = gross == Créditos = net + fee (RN-001)
    const ledgerTx = await this.ledgerService.postTransaction({
      type: "PAYMENT_CAPTURE",
      description: `Liquidação de cobrança ${chargeId}`,
      referenceType: "CHARGE",
      referenceId: chargeId,
      entries: [
        {
          accountId: clearingAccount.id,
          direction: "DEBIT",
          amountCents: grossAmountCents,
        },
        {
          accountId: merchantWallet.id,
          direction: "CREDIT",
          amountCents: netAmountCents,
        },
        {
          accountId: feeRevenueAccount.id,
          direction: "CREDIT",
          amountCents: feeAmountCents,
        },
      ],
    });

    return ledgerTx.id;
  }
}
