import { prisma } from "./prisma";
import { SecurityService } from "../security/hash";

export async function runSeed() {
  console.log("🌱 Iniciando Seed do Banco de Dados PayFlow Core...");

  // 1. Criar ou atualizar Merchant Demo
  const merchant = await prisma.merchant.upsert({
    where: { document: "12345678000199" },
    update: { active: true },
    create: {
      id: "merchant_acme_default",
      name: "Acme Payments & Commerce",
      document: "12345678000199",
      email: "financeiro@acmepayments.com",
      active: true,
    },
  });

  console.log(`✅ Merchant configurado: ${merchant.name} (${merchant.id})`);

  // 2. Criar API Key demo: sk_live_payflow_demo_key_2026
  const rawApiKey = "sk_live_payflow_demo_key_2026";
  const keyHash = SecurityService.sha256(rawApiKey);

  await prisma.apiKey.upsert({
    where: { keyHash },
    update: { revoked: false },
    create: {
      id: "key_demo_01",
      merchantId: merchant.id,
      name: "Chave Principal de Produção (Demo)",
      keyPrefix: "sk_live",
      keyHash,
      revoked: false,
    },
  });

  console.log(`✅ API Key provisionada: ${rawApiKey} (Hash: ${keyHash.substring(0, 12)}...)`);

  // 3. Criar Plano de Contas Canônico
  const defaultAccounts = [
    {
      code: "1.1.01.001",
      name: "Gateway Clearing Account (Transitória de Liquidação)",
      type: "ASSET" as const,
      currency: "BRL",
      allowOverdraft: true,
      merchantId: null, // Conta da Plataforma
    },
    {
      code: "2.1.01.001",
      name: "Merchant Wallet - Acme Payments",
      type: "LIABILITY" as const,
      currency: "BRL",
      allowOverdraft: false, // RN-004: Não permite saldo negativo
      merchantId: merchant.id,
    },
    {
      code: "4.1.01.001",
      name: "Platform Processing Fee Revenue",
      type: "REVENUE" as const,
      currency: "BRL",
      allowOverdraft: true,
      merchantId: null, // Conta da Plataforma
    },
    {
      code: "1.1.02.001",
      name: "Bank Reserve Account (Depósito Bancário Custódia)",
      type: "ASSET" as const,
      currency: "BRL",
      allowOverdraft: false,
      merchantId: null,
    },
    {
      code: "5.1.01.001",
      name: "Interchange & Card Network Expenses",
      type: "EXPENSE" as const,
      currency: "BRL",
      allowOverdraft: true,
      merchantId: null,
    },
  ];

  for (const acc of defaultAccounts) {
    await prisma.account.upsert({
      where: { code: acc.code },
      update: { name: acc.name },
      create: {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        currency: acc.currency,
        allowOverdraft: acc.allowOverdraft,
        merchantId: acc.merchantId,
        currentBalanceCents: 0n,
      },
    });
    console.log(`✅ Conta Contábil: [${acc.code}] ${acc.name} (${acc.type})`);
  }

  // 4. Webhook Endpoint Demo
  await prisma.webhookEndpoint.upsert({
    where: { id: "wh_demo_endpoint" },
    update: { active: true },
    create: {
      id: "wh_demo_endpoint",
      merchantId: merchant.id,
      url: "https://webhook.site/payflow-demo-receiver",
      secret: "whsec_payflow_super_secret_key_2026",
      active: true,
    },
  });

  console.log("✅ Webhook Endpoint configurado com segredo HMAC.");
  console.log("🎉 Seed do PayFlow Core finalizado com sucesso!");
}

if (import.meta.main) {
  runSeed()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error("❌ Erro durante seed:", e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
