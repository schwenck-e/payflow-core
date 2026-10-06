import { IdempotencyPayloadMismatchError } from "../errors/domain.errors";

export interface IdempotencyRecordProps {
  id: string;
  merchantId: string;
  idempotencyKey: string;
  requestHash: string;
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  responseStatusCode?: number | null;
  responseBody?: string | null;
  expiresAt: Date;
  createdAt?: Date;
}

export class IdempotencyRecord {
  public readonly id: string;
  public readonly merchantId: string;
  public readonly idempotencyKey: string;
  public readonly requestHash: string;
  private _status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  public responseStatusCode: number | null;
  public responseBody: string | null;
  public readonly expiresAt: Date;
  public readonly createdAt: Date;

  constructor(props: IdempotencyRecordProps) {
    this.id = props.id;
    this.merchantId = props.merchantId;
    this.idempotencyKey = props.idempotencyKey;
    this.requestHash = props.requestHash;
    this._status = props.status;
    this.responseStatusCode = props.responseStatusCode ?? null;
    this.responseBody = props.responseBody ?? null;
    this.expiresAt = props.expiresAt;
    this.createdAt = props.createdAt ?? new Date();
  }

  public get status(): "IN_PROGRESS" | "COMPLETED" | "FAILED" {
    return this._status;
  }

  public validatePayloadMatch(incomingHash: string): void {
    if (this.requestHash !== incomingHash) {
      throw new IdempotencyPayloadMismatchError(this.idempotencyKey);
    }
  }

  public markCompleted(statusCode: number, body: string): void {
    this._status = "COMPLETED";
    this.responseStatusCode = statusCode;
    this.responseBody = body;
  }

  public markFailed(): void {
    this._status = "FAILED";
  }

  public isExpired(): boolean {
    return new Date() > this.expiresAt;
  }
}
