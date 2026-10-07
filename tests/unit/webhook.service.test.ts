import { describe, it, expect } from "bun:test";
import { SecurityService } from "../../src/infrastructure/security/hash";

describe("Webhook Signature & HMAC-SHA256", () => {
  it("deve gerar e verificar assinatura HMAC-SHA256 consistente", () => {
    const payload = JSON.stringify({ event: "payment.paid", id: "ch_123" });
    const secret = "whsec_test_secret_key";

    const signature = SecurityService.generateHmacSignature(payload, secret);
    expect(signature).toBeDefined();
    expect(signature.length).toBe(64); // SHA-256 hex string

    const isValid = SecurityService.verifyHmacSignature(payload, secret, signature);
    expect(isValid).toBe(true);

    const isInvalid = SecurityService.verifyHmacSignature(payload, "wrong_secret", signature);
    expect(isInvalid).toBe(false);

    // Assinatura com tamanho diferente (deve retornar false com segurança)
    const shortSignature = "abcd";
    expect(SecurityService.verifyHmacSignature(payload, secret, shortSignature)).toBe(false);

    // Assinatura com mesmo tamanho (64 chars) porém bytes adulterados
    const tamperedSignature = signature.substring(0, 63) + (signature[63] === "0" ? "1" : "0");
    expect(SecurityService.verifyHmacSignature(payload, secret, tamperedSignature)).toBe(false);
  });
});
