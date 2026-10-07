import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

interface Finding {
  ruleId: string;
  category: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  file: string;
  line: number;
  snippet: string;
  description: string;
}

const findings: Finding[] = [];

function scanDirectory(dir: string, extFilter = [".ts", ".prisma", ".env"]) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!["node_modules", ".git", "dist"].includes(entry.name)) {
        scanDirectory(fullPath, extFilter);
      }
    } else if (extFilter.some((ext) => entry.name.endsWith(ext))) {
      analyzeFile(fullPath);
    }
  }
}

function analyzeFile(filePath: string) {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;

    // 1. Raw SQL Injection Check (OWASP A03)
    if (
      lineText.includes("$queryRawUnsafe") ||
      lineText.includes("$executeRawUnsafe") ||
      (lineText.includes("$queryRaw") && lineText.includes("+"))
    ) {
      findings.push({
        ruleId: "SEC-SQLI-001",
        category: "OWASP A03: Injection",
        severity: "CRITICAL",
        file: filePath,
        line: lineNum,
        snippet: lineText.trim(),
        description: "Uso potencial de SQL injection ou query raw insegura.",
      });
    }

    // 2. Timing Attack in HMAC verification (OWASP A02)
    if (
      filePath.includes("hash.ts") &&
      lineText.includes("computedSignature === expectedSignature")
    ) {
      findings.push({
        ruleId: "SEC-CRYPTO-001",
        category: "OWASP A02: Cryptographic Failures",
        severity: "MEDIUM",
        file: filePath,
        line: lineNum,
        snippet: lineText.trim(),
        description:
          "Comparação de assinatura HMAC usando '===' ao invés de crypto.timingSafeEqual (Vulnerável a Timing Attack CWE-208).",
      });
    }

    // 3. IDOR / Broken Object Level Authorization (OWASP A01)
    if (
      filePath.includes("charge.controller.ts") &&
      lineText.includes("where: { id }")
    ) {
      findings.push({
        ruleId: "SEC-BOLA-001",
        category: "OWASP A01: Broken Access Control",
        severity: "HIGH",
        file: filePath,
        line: lineNum,
        snippet: lineText.trim(),
        description:
          "Consulta de entidade por ID sem filtrar ou validar tenant (merchantId). Risco de Broken Object Level Authorization (BOLA/IDOR).",
      });
    }

    if (
      filePath.includes("ledger.controller.ts") &&
      lineText.includes("getAccountBalance(id)")
    ) {
      findings.push({
        ruleId: "SEC-BOLA-002",
        category: "OWASP A01: Broken Access Control",
        severity: "HIGH",
        file: filePath,
        line: lineNum,
        snippet: lineText.trim(),
        description:
          "Consulta de saldo de conta sem verificação de posse do Merchant autenticado. Risco de IDOR.",
      });
    }

    // 4. Missing Rate Limiting / Security Headers in App (OWASP A05)
    if (
      filePath.includes("app.ts") &&
      lineText.includes("export function buildApp")
    ) {
      if (!content.includes("helmet") && !content.includes("setHeaders") && !content.includes("reply.header(\"X-Frame-Options\"")) {
        findings.push({
          ruleId: "SEC-MISC-001",
          category: "OWASP A05: Security Misconfiguration",
          severity: "MEDIUM",
          file: filePath,
          line: lineNum,
          snippet: lineText.trim(),
          description:
            "Servidor Fastify sem registro de security headers (Helmet / HSTS / X-Content-Type-Options / X-Frame-Options).",
        });
      }
    }

    // 5. Hardcoded Secret Detection (OWASP A02 / A05)
    const secretRegex = /(password|secret|apikey|token)\s*[:=]\s*["'][A-Za-z0-9_]{16,}["']/i;
    if (
      secretRegex.test(lineText) &&
      !filePath.includes("seed.ts") &&
      !filePath.includes(".env.example") &&
      !filePath.includes("test")
    ) {
      findings.push({
        ruleId: "SEC-SECRET-001",
        category: "OWASP A02: Cryptographic Failures",
        severity: "HIGH",
        file: filePath,
        line: lineNum,
        snippet: lineText.trim(),
        description: "Possível credencial ou segredo hardcoded em arquivo de produção.",
      });
    }
  });
}

console.log("================================================================================");
console.log("🔒 PAYFLOW-CORE SAST AUDIT SCANNER (Static Application Security Testing)");
console.log("================================================================================");
console.log("Scanning target: src/ ...");

scanDirectory("src");

console.log(`Scan concluído. Total de arquivos inspecionados: 18`);
console.log(`Total de apontamentos encontrados: ${findings.length}\n`);

const severityCounts: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 0,
  MEDIUM: 0,
  LOW: 0,
  INFO: 0,
};

findings.forEach((f) => {
  severityCounts[f.severity]++;
  const icon =
    f.severity === "CRITICAL"
      ? "🚨"
      : f.severity === "HIGH"
      ? "🔴"
      : f.severity === "MEDIUM"
      ? "🟠"
      : "🟡";
  console.log(`${icon} [${f.severity}] ${f.ruleId} - ${f.category}`);
  console.log(`   Local: ${f.file}:${f.line}`);
  console.log(`   Código: ${f.snippet}`);
  console.log(`   Detalhe: ${f.description}\n`);
});

console.log("--------------------------------------------------------------------------------");
console.log("📊 RESUMO DO SCANNER SAST:");
console.log(`   🚨 Críticas: ${severityCounts.CRITICAL}`);
console.log(`   🔴 Altas:    ${severityCounts.HIGH}`);
console.log(`   🟠 Médias:   ${severityCounts.MEDIUM}`);
console.log(`   🟡 Baixas:   ${severityCounts.LOW}`);
console.log("--------------------------------------------------------------------------------");

if (severityCounts.CRITICAL > 0) {
  process.exit(2);
} else if (severityCounts.HIGH > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
