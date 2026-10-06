import { createHash, createHmac } from "crypto";

export class SecurityService {
  /**
   * Calcula hash SHA-256 de uma string (usado para API Keys e Idempotency payloads)
   */
  public static sha256(data: string): string {
    return createHash("sha256").update(data).digest("hex");
  }

  /**
   * Calcula assinatura HMAC-SHA256 para eventos de Webhook (X-Payflow-Signature)
   */
  public static generateHmacSignature(payload: string, secret: string): string {
    return createHmac("sha256", secret).update(payload).digest("hex");
  }

  /**
   * Verifica assinatura HMAC em tempo constante mitigando timing attacks
   */
  public static verifyHmacSignature(payload: string, secret: string, expectedSignature: string): boolean {
    const computedSignature = this.generateHmacSignature(payload, secret);
    return computedSignature === expectedSignature;
  }

  /**
   * Normaliza payload JSON para garantir determinismo no cálculo do hash de idempotência
   */
  public static canonicalizeJson(obj: unknown): string {
    if (obj === null || typeof obj !== "object") {
      return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
      return "[" + obj.map(SecurityService.canonicalizeJson).join(",") + "]";
    }
    const keys = Object.keys(obj as Record<string, unknown>).sort();
    const keyPairs = keys.map(
      (k) => JSON.stringify(k) + ":" + SecurityService.canonicalizeJson((obj as Record<string, unknown>)[k])
    );
    return "{" + keyPairs.join(",") + "}";
  }
}
