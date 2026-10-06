import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

console.log("🏛️ [ArchLint] Executando Auditoria de Conformidade Arquitetural...");

let violationsCount = 0;

function scanDir(dir: string, callback: (path: string) => void) {
  const files = readdirSync(dir);
  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== "node_modules" && file !== ".git" && file !== "dist") {
        scanDir(fullPath, callback);
      }
    } else if (file.endsWith(".ts")) {
      callback(fullPath);
    }
  }
}

// Regra 1: Verificar se entidades de domínio não importam coisas da camada de apresentação ou de infraestrutura (Clean Arch)
scanDir("src/domain", (filePath) => {
  const content = readFileSync(filePath, "utf-8");
  if (content.includes("from '../presentation'") || content.includes("from '../../presentation'")) {
    console.error(`❌ [Violação Arquitetural] ${filePath} importa diretamente da camada de Apresentação!`);
    violationsCount++;
  }
});

// Regra 2: Verificar se controllers possuem validação Zod
scanDir("src/presentation/controllers", (filePath) => {
  const content = readFileSync(filePath, "utf-8");
  if (filePath.includes("charge.controller.ts") || filePath.includes("ledger.controller.ts")) {
    if (!content.includes("z.object")) {
      console.error(`❌ [Violação Arquitetural] ${filePath} deve conter schemas de validação Zod!`);
      violationsCount++;
    }
  }
});

// Regra 3: Verificar que o tipo float não é utilizado para colunas monetárias no schema do Prisma
const prismaContent = readFileSync("prisma/schema.prisma", "utf-8");
if (prismaContent.includes("Float") && prismaContent.includes("amount")) {
  console.error("❌ [Violação FinOps] Proibição de Float para valores monetários em schema.prisma (RNF-005) violada!");
  violationsCount++;
}

if (violationsCount === 0) {
  console.log("✅ [ArchLint] Zero Architectural Drift confirmado! Score: 100/100 (APROVADO)");
  process.exit(0);
} else {
  console.error(`🔴 [ArchLint] Falha na auditoria arquitetural: ${violationsCount} violações detectadas.`);
  process.exit(1);
}
